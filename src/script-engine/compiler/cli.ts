/**
 * script-engine — compile-script CLI 本体（パイプライン接合オーケストレーション）
 *
 * 出自: docs/specs/script-engine/design.md §4.1（パイプライン全段）/ §4.2（Engine バージョン警告・
 *   --force-resynth・内容ハッシュ skip の manifest 突合）/ §9.2（二段警告）/ §11.2（npm scripts
 *   外形契約 `node scripts/compile-script.mjs <script-id>`）
 * 対応タスク: docs/specs/script-engine/tasks.md W25-script-engine-T31
 *   （HGA 第 2 回 C-2: Wave 2 の 5 モジュールが「呼び出し側の責務」とした接合ロジックの担い手 /
 *   C-3: Engine バージョン不一致警告 + --force-resynth / I-10: prune wavDir と synthesize
 *   outputDir の一元化）
 *
 * 実行経路: `scripts/compile-script.mjs`（薄い node ラッパー）が `tsx/cjs/api` の `require` で
 * 本ファイルを単一プロセス内ロードし、{@link runCompileScriptCli} を呼ぶ。パイプラインは
 * parse → estimate → synthesize → measure → manifest の直列実行（design §4.1）。
 *
 * **自己申告（T31 ブリーフ推奨からの逸脱）**: ブリーフ推奨は `tsx/esm/api` の `register()` +
 * dynamic import だったが、実機検証（2026-07-11）で ESM フックのみでは本プロジェクトの TS
 * モジュール群（tsconfig `module: commonjs` / `__dirname` 使用 / 拡張子なし相対 import）の
 * ネスト require（例: estimate.ts 内の `require('./speaker-profiles')`）が
 * `MODULE_NOT_FOUND` になることを確認した（ESM フックはエントリの変換のみで CJS require
 * パイプラインに介入しないため）。`tsx/cjs/api` の `require`（CJS フック）では同一検証が
 * PASS（実台本 estimate 81.3 秒、段階 3 dry run と同値）したため、CJS API を採用した。
 * 単一プロセス方式（child_process spawn 回避）は維持している。
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseScript } from "./parse";
import { loadSpeakerProfiles } from "./speaker-profiles";
import { estimateScriptDuration, calculateDurationErrorRate } from "./estimate";
import { synthesizeScriptAudio, resolveDefaultOutputDir } from "./synthesize";
import type { SynthesizedUtterance } from "./synthesize";
import { measureWavDuration } from "./measure";
import { generateManifest, resolveDefaultManifestOutputPath } from "./manifest";
import type { UtteranceWithMeasuredWav } from "./manifest";
import { buildPdfManifest, resolveDefaultPdfManifestOutputPath } from "../pdf/script-pdf-manifest";
import type { PdfManifest } from "../pdf/script-pdf-manifest";

/** CLI の使い方（引数エラー時に表示。design §11.2 の外形契約 + T31 の --force-resynth） */
export const CLI_USAGE =
  "使い方: npm run compile:script -- <script-id> [--force-resynth]" +
  "（例: npm run compile:script -- java-vs-js）";

/** T31 完了条件 5（HGA C-3）: 全発話強制再合成フラグ */
export const FORCE_RESYNTH_FLAG = "--force-resynth";

/** parseCliArgs の結果 */
export interface CliArgs {
  scriptId: string;
  forceResynth: boolean;
}

/**
 * CLI 引数（`process.argv.slice(2)`）をパースする。
 *
 * @throws script-id 未指定 / 複数指定 / 未知オプション / パス区切り文字を含む script-id
 *   （いずれも fail-fast、既存モジュール慣行の `✗ ` 先頭・日本語メッセージ）
 */
export function parseCliArgs(argv: string[]): CliArgs {
  let scriptId: string | undefined;
  let forceResynth = false;

  for (const arg of argv) {
    if (arg === FORCE_RESYNTH_FLAG) {
      forceResynth = true;
    } else if (arg.startsWith("--")) {
      throw new Error(
        `✗ 未知のオプションです: ${arg}（対応オプション: ${FORCE_RESYNTH_FLAG}）。${CLI_USAGE}`,
      );
    } else if (scriptId === undefined) {
      scriptId = arg;
    } else {
      throw new Error(
        `✗ script-id が複数指定されています: "${scriptId}" と "${arg}"。${CLI_USAGE}`,
      );
    }
  }

  if (scriptId === undefined || scriptId === "") {
    throw new Error(`✗ script-id が指定されていません。${CLI_USAGE}`);
  }
  // 台本パスは `content/scripts/<script-id>.script.yaml` に解決するため（design §11.1）、
  // パス区切り文字を含む script-id はディレクトリ横断となり不正（防御的チェック）。
  if (scriptId.includes("/") || scriptId.includes("\\")) {
    throw new Error(
      `✗ script-id にパス区切り文字（/ や \\）を含めることはできません: "${scriptId}"。${CLI_USAGE}`,
    );
  }

  return { scriptId, forceResynth };
}

/**
 * script-id → 台本 YAML パスの解決（design §11.1: `content/scripts/<script-id>.script.yaml`）。
 * `speaker-profiles.ts` の `DEFAULT_SPEAKER_PROFILES_PATH` と同じ `__dirname` 基準の解決規則。
 */
export function resolveDefaultScriptPath(scriptId: string): string {
  return path.resolve(__dirname, "../../../content/scripts", `${scriptId}.script.yaml`);
}

/** 既存 manifest から読み取った、skip 判定・Engine バージョン検知に必要な記録値 */
export interface RecordedManifestInfo {
  /** 発話 id → content_hash（synthesize の `recordedHashes` にそのまま渡す。design §4.2 判定フロー） */
  recordedHashes: Record<string, string>;
  /** manifest 記録の Engine バージョン（design §4.2 バージョン検知。旧形式等で欠落時は null） */
  voicevoxEngineVersion: string | null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 既存 manifest（`public/manifests/<script-id>.manifest.json`）を読み込み、記録済み
 * content_hash と Engine バージョンを取り出す（T31 完了条件 3: skip 判定の manifest 突合経路）。
 *
 * - ファイル不存在（初回 compile）→ `null` を返す（正常系）
 * - JSON 構文エラー・構造不正 → fail-fast エラー
 *   （**自己申告（spec に無い判断）**: design §4.2 は破損 manifest の挙動を明記しない。
 *   黙って「manifest なし」扱いにすると skip 判定が静かに劣化する（全発話ファイル名
 *   フォールバックに落ちる）ため、既存モジュール群の fail-fast 方針に合わせてエラー停止とした。
 *   破損 manifest は再生成対象なので、ユーザーは該当ファイルを削除して再実行すればよい）
 *
 * @param manifestPath - manifest JSON のパス
 * @param readFileImpl - テスト用の `fs.readFile` 差し替え（省略時 `node:fs/promises` の readFile）
 */
export async function readRecordedManifest(
  manifestPath: string,
  readFileImpl: (filePath: string, encoding: "utf-8") => Promise<string> = readFile,
): Promise<RecordedManifestInfo | null> {
  let raw: string;
  try {
    raw = await readFileImpl(manifestPath, "utf-8");
  } catch {
    // 初回 compile 等、manifest 不存在は正常系（ENOENT 以外の読込失敗も「記録なし」に丸めず
    // 区別したいところだが、readFile のエラーからの厳密な切り分けは過剰なため存在しない扱いとする）
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `✗ 既存 manifest の JSON 解析に失敗しました: ${manifestPath}（${(error as Error).message}）。` +
        `破損している場合はこのファイルを削除して再実行してください`,
    );
  }

  if (!isPlainObject(parsed) || !Array.isArray(parsed.utterances)) {
    throw new Error(
      `✗ 既存 manifest の形式が不正です（utterances 配列がありません）: ${manifestPath}。` +
        `破損している場合はこのファイルを削除して再実行してください`,
    );
  }

  const recordedHashes: Record<string, string> = {};
  for (const entry of parsed.utterances) {
    if (
      isPlainObject(entry) &&
      typeof entry.id === "string" &&
      typeof entry.content_hash === "string"
    ) {
      recordedHashes[entry.id] = entry.content_hash;
    }
  }

  const version = parsed.voicevox_engine_version;
  return {
    recordedHashes,
    voicevoxEngineVersion: typeof version === "string" ? version : null,
  };
}

/**
 * T31 完了条件 2: T10 出力（{@link SynthesizedUtterance}）に T11 実測（`duration_seconds`）を
 * マージし、manifest 生成（T12）の入力 {@link UtteranceWithMeasuredWav} を組み立てる。
 * 各 WAV に {@link measureWavDuration} を当てる（skip された発話も既存 WAV を実測する。
 * design §6.2 WAV 実測方式: 実測値のみを真とし、過去の manifest 記録値は再利用しない）。
 *
 * @param measureImpl - テスト用の実測関数差し替え（省略時 {@link measureWavDuration}）
 */
export async function mergeMeasuredDurations(
  utterancesWithWav: SynthesizedUtterance[],
  measureImpl: typeof measureWavDuration = measureWavDuration,
): Promise<UtteranceWithMeasuredWav[]> {
  const merged: UtteranceWithMeasuredWav[] = [];
  for (const utterance of utterancesWithWav) {
    const { duration_seconds } = await measureImpl(utterance.wav_path);
    merged.push({ ...utterance, duration_seconds });
  }
  return merged;
}

/** {@link runCompileScriptCli} の依存注入（テストで実 Engine / 実ファイルへの接触を遮断する） */
export interface CompileCliDeps {
  parseScriptImpl: typeof parseScript;
  loadSpeakerProfilesImpl: typeof loadSpeakerProfiles;
  estimateImpl: typeof estimateScriptDuration;
  synthesizeImpl: typeof synthesizeScriptAudio;
  measureImpl: typeof measureWavDuration;
  generateManifestImpl: typeof generateManifest;
  /** design §8.1 MUST（tasks.md W4-script-engine-T17）: 台本 + 確定 manifest から PdfManifest を導出する純粋関数。 */
  buildPdfManifestImpl: typeof buildPdfManifest;
  /**
   * design §8.1 MUST: `public/manifests/<script-id>.pdf-manifest.json` への書き出し。
   * `generateManifest`（timeline manifest）が内部に書き出しを抱えるのと異なり、pdf-manifest は
   * 呼び出し側（本 CLI）が書き出しを担う（`buildPdfManifest` を純粋関数のまま保つため）。
   * 省略時は `mkdir` + `writeFile`（既存 `generateManifest` と同一フォーマット: `JSON.stringify(x, null, 2)` + 末尾改行）。
   */
  writePdfManifestFileImpl: (outputPath: string, manifest: PdfManifest) => Promise<void>;
  readFileImpl: (filePath: string, encoding: "utf-8") => Promise<string>;
  /** 通常メッセージ出力（省略時 console.log） */
  log: (message: string) => void;
  /** 警告出力（省略時 console.warn。二段警告・Engine バージョン不一致・prune 警告） */
  warn: (message: string) => void;
  /** エラー出力（省略時 console.error） */
  error: (message: string) => void;
}

const DEFAULT_DEPS: CompileCliDeps = {
  parseScriptImpl: parseScript,
  loadSpeakerProfilesImpl: loadSpeakerProfiles,
  estimateImpl: estimateScriptDuration,
  synthesizeImpl: synthesizeScriptAudio,
  measureImpl: measureWavDuration,
  generateManifestImpl: generateManifest,
  buildPdfManifestImpl: buildPdfManifest,
  writePdfManifestFileImpl: async (outputPath, manifest) => {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
  },
  readFileImpl: readFile,
  log: (message) => console.log(message),
  warn: (message) => console.warn(message),
  error: (message) => console.error(message),
};

/**
 * compile-script CLI のエントリポイント（tasks.md W25-script-engine-T31）。
 * parse → estimate → synthesize → measure → manifest を直列実行する（design §4.1）。
 *
 * 警告は全て非ブロッキング（design §9.3: exit code を変えない）。エラー（fail-fast）のみ
 * exit code 1 を返す。
 *
 * @param argv - `process.argv.slice(2)` 相当
 * @param depsOverride - テスト用の依存差し替え（部分指定可）
 * @returns プロセス exit code（0 = 成功、1 = エラー）
 */
export async function runCompileScriptCli(
  argv: string[],
  depsOverride: Partial<CompileCliDeps> = {},
): Promise<number> {
  const deps: CompileCliDeps = { ...DEFAULT_DEPS, ...depsOverride };

  try {
    const { scriptId, forceResynth } = parseCliArgs(argv);

    const scriptPath = resolveDefaultScriptPath(scriptId);
    // T31 完了条件 6（HGA I-10）: synthesize の outputDir と prune の wavDir は本変数 1 つから
    // 両者に渡して一元化する（別々に解決すると片方だけ変えた際に prune が孤児 WAV を見逃す/
    // 誤削除する drift が生じるため）。
    const wavDir = resolveDefaultOutputDir(scriptId);
    const manifestPath = resolveDefaultManifestOutputPath(scriptId);

    deps.log(`compile 開始: ${scriptId}（台本: ${scriptPath}）`);

    // --- 第 1 段: parse + estimate（design §4.1 / §9.2 二段警告の第 1 段） ---
    const script = await deps.parseScriptImpl(scriptPath);
    const speakerProfiles = await deps.loadSpeakerProfilesImpl(script.speaker_profile_ref);

    const estimate = deps.estimateImpl(script, speakerProfiles);
    deps.log(
      `予測総尺（発話ベース、クレジット・表示保証尺を含まない）: ` +
        `${estimate.predicted_total_seconds.toFixed(1)} 秒`,
    );
    if (estimate.duration_range_warning !== null) {
      deps.warn(`⚠ ${estimate.duration_range_warning}`);
    }

    // --- 既存 manifest の読込（skip 判定の突合 + Engine バージョン検知の記録値） ---
    const recorded = await readRecordedManifest(manifestPath, deps.readFileImpl);

    // T31 完了条件 5（design §4.2）: --force-resynth 時は記録済みハッシュを無視して全発話を
    // 強制再合成する。synthesize.ts（変更禁止）の skip 判定は「recordedHashes 省略 = ファイル名
    // 存在フォールバックで skip し得る」「recordedHashes あり = ハッシュ一致時のみ skip」のため、
    // **空オブジェクト {} を渡す**ことで「全発話がハッシュ不一致 → 全件再合成」を実現する
    // （synthesize.ts `shouldSkip`: `recordedHashes[utteranceId] === contentHash` が全発話で
    // false になる。既存モジュール無変更で強制再合成を成立させる接合側の判断）。
    const recordedHashes = forceResynth ? {} : recorded?.recordedHashes;
    if (forceResynth) {
      deps.log(
        `${FORCE_RESYNTH_FLAG} 指定: 記録済み content_hash を無視し、全発話を強制再合成します`,
      );
    }

    // --- synthesize（design §4.1 第 3 段階。Engine 不在は synthesize 内で fail-fast） ---
    const synthesis = await deps.synthesizeImpl(script, speakerProfiles, {
      scriptId,
      outputDir: wavDir,
      recordedHashes,
    });
    deps.log(
      `音声合成: 新規/再合成 ${synthesis.synthesized} 件、skip ${synthesis.skipped} 件` +
        `（VOICEVOX Engine ${synthesis.voicevox_engine_version}）`,
    );

    // --- Engine バージョン不一致警告（design §4.2 MUST。警告のみ、エラー停止しない） ---
    if (
      recorded !== null &&
      recorded.voicevoxEngineVersion !== null &&
      recorded.voicevoxEngineVersion !== synthesis.voicevox_engine_version
    ) {
      deps.warn(
        `⚠ VOICEVOX Engine バージョン不一致: manifest 記録値 ${recorded.voicevoxEngineVersion} / ` +
          `現行 Engine ${synthesis.voicevox_engine_version}（design §4.2。自動での全発話再合成は` +
          `行いません。再合成する場合は ${FORCE_RESYNTH_FLAG} を指定してください）`,
      );
    }

    // --- measure（T10 出力 + T11 実測のマージ、T31 完了条件 2） ---
    const utterancesWithMeasuredWav = await mergeMeasuredDurations(
      synthesis.utterances_with_wav,
      deps.measureImpl,
    );

    // --- manifest 生成 + prune（design §4.1 最終段階） ---
    const result = await deps.generateManifestImpl(
      script,
      utterancesWithMeasuredWav,
      speakerProfiles,
      {
        scriptId,
        voicevoxEngineVersion: synthesis.voicevox_engine_version,
        outputPath: manifestPath,
        wavDir, // HGA I-10: synthesize の outputDir と同一変数（上記宣言箇所コメント参照）
      },
    );

    // 第 2 段警告（design §9.2: 動画総尺 vs target_duration_range.max）は manifest.ts が
    // `warnings[]` に積むため、ここで標準出力に流す（他の §5.3 境界警告等も同経路）。
    for (const warning of result.warnings) {
      deps.warn(`⚠ ${warning}`);
    }
    for (const pruneWarning of result.pruneWarnings) {
      deps.warn(pruneWarning); // manifest.ts 側で既に `⚠ ` 付与済み
    }
    if (result.pruned.length > 0) {
      deps.log(`prune: 不要 WAV ${result.pruned.length} 件を削除（${result.pruned.join(", ")}）`);
    }

    // --- PDF manifest 生成 + 書き出し（design §8.1 MUST、tasks.md W4-script-engine-T17） ---
    // content_hash には算入しない（WAV 再合成を誘発しない、slides/speakers と同じ扱い、design §4.3 v3.5-3.6）。
    const pdfManifestPath = resolveDefaultPdfManifestOutputPath(scriptId);
    const pdfManifest = deps.buildPdfManifestImpl(script, result.manifest);
    await deps.writePdfManifestFileImpl(pdfManifestPath, pdfManifest);
    deps.log(
      `PDF manifest 書き出し: ${pdfManifestPath}（${pdfManifest.total_pages} ページ）`,
    );

    const totalSeconds = result.manifest.total_duration_frames / result.manifest.fps;

    // --- 尺誤差警告（design §9.2/§9.3: 執筆時予測 vs WAV 実測後の総尺の誤差率、±15%/±25% 判定） ---
    // 分母は実測尺（totalSeconds、design §9.2「誤差率の分母は WAV 実測尺とする」）。
    // 誤差 15% 以下は正常（メッセージなし）、15%超〜25%以下は警告、25%超は強い警告
    // （design §9.3。いずれも非ブロッキング、exit code は変えない）。
    const durationError = calculateDurationErrorRate(
      estimate.predicted_total_seconds,
      totalSeconds,
    );
    const errorRatePercent = (durationError.error_rate * 100).toFixed(1);
    if (durationError.severity === "warning") {
      deps.warn(
        `⚠ 尺誤差警告（design §9.3）: 執筆時予測総尺 ${estimate.predicted_total_seconds.toFixed(1)} 秒 ` +
          `に対し実測総尺（クレジット込み） ${totalSeconds.toFixed(1)} 秒（誤差 ${errorRatePercent}%、` +
          `15%超〜25%以下）。続行しますが、台本の話速前提を見直すことを検討してください`,
      );
    } else if (durationError.severity === "critical") {
      deps.warn(
        `⚠⚠⚠ 尺誤差 強い警告（design §9.3、誤差 25% 超）⚠⚠⚠\n` +
          `    執筆時予測総尺 ${estimate.predicted_total_seconds.toFixed(1)} 秒 / ` +
          `実測総尺（クレジット込み） ${totalSeconds.toFixed(1)} 秒（誤差 ${errorRatePercent}%）\n` +
          `    非ブロッキングのため続行しますが、台本修正 → 再 compile のリトライを検討してください` +
          `（requirements.md 受入条件 5）`,
      );
    }

    deps.log(
      `✓ compile 完了: ${result.outputPath}` +
        `（total_duration_frames=${result.manifest.total_duration_frames}、` +
        `約 ${totalSeconds.toFixed(1)} 秒、fps=${result.manifest.fps}）`,
    );
    return 0;
  } catch (error) {
    deps.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
