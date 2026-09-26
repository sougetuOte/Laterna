/**
 * script-engine — VOICEVOX 音声合成実装（synthesize モジュール）
 *
 * 出自: docs/specs/script-engine/design.md §4.1（パイプライン第 3 段階）/ §4.2（内容ハッシュ）/
 *   §4.3（timeline manifest フィールド）/ §4.4（エラー設計）
 * 対応タスク: docs/specs/script-engine/tasks.md W2-script-engine-T10
 *
 * 各発話について VOICEVOX Engine（既定 localhost:50021）を呼び出し、WAV ファイルを生成する。
 * 内容ハッシュ（`content-hash.ts`）による skip 判定を実装し、既存 WAV が再利用可能な場合は
 * VOICEVOX API を呼ばない（design §4.2「判定フロー」）。
 *
 * **スコープ外（後続タスク）**: WAV 実測長の計算（T11 measure.ts）、timeline manifest の
 * ファイル書き出し（T12 manifest.ts）、不要 WAV の prune（T12）。本ファイルは
 * `{ utterances_with_wav, skipped, synthesized, voicevox_engine_version }` を返すのみ。
 */

import { access, mkdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ScriptDocument, Utterance } from "../schema/script";
import type { SpeakersRegistry } from "../schema/speaker-profile";
import { FIXED_SYNTHESIS_PARAMS, ENABLE_INTERROGATIVE_UPSPEAK } from "../schema/speaker-profile";
import { resolveSpeakerProfile } from "./speaker-profiles";
import { computeContentHash } from "./content-hash";

/** design §4.1: VOICEVOX Engine の既定接続先（ローカル PC 前提、design §0.1 Non-Goals） */
export const DEFAULT_VOICEVOX_ENGINE_BASE_URL = "http://localhost:50021";

/** VOICEVOX Engine 未起動時の案内先（design §4.4 が要求するエラーメッセージの一部） */
const VOICEVOX_SETUP_DOC_PATH = "docs/conventions/voicevox-engine-setup.md";

/** 2026-07-10 HGA W-4 裁定: `/version` 疎通確認の既定タイムアウト（ms）。 */
export const DEFAULT_VERSION_TIMEOUT_MS = 10_000;

/** 2026-07-10 HGA W-4 裁定: `/audio_query` / `/synthesis` の既定タイムアウト（ms、各呼び出しに個別適用）。 */
export const DEFAULT_SYNTHESIS_TIMEOUT_MS = 60_000;

/**
 * 2026-07-10 HGA W-5 裁定: skip 判定で「既存 WAV を再利用可」とみなす最小サイズ（バイト）。
 * RIFF/WAVE ヘッダは `RIFF`(4) + size(4) + `WAVE`(4) + `fmt `(4) + fmtSize(4) = 最低 20 バイトだが、
 * 本プロジェクトの WAV は `fmt ` チャンク本体（16 バイト）+ `data` チャンクヘッダ（8 バイト）を
 * 含めて構造上 44 バイト未満にはならない（design §6.2 標準 WAV 構造）。これ未満はクラッシュ等による
 * 部分書込みの破損ファイルとみなし、skip せず再合成する。
 */
export const MIN_VALID_WAV_BYTES = 44;

/**
 * 2026-07-10 HGA W-4 裁定: `AbortSignal.timeout()` によるタイムアウトを Node fetch (undici) が
 * `TimeoutError`（DOMException）として reject することを利用し、タイムアウト起因のエラーかどうかを
 * 判別する。`AbortError`（明示 abort）もあわせて拾う（フォールバック）。
 */
function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

/**
 * `content/scripts/<script-id>.script.yaml` の `<script-id>` から
 * `public/audio/<script-id>/` を解決する（design §4.1 パイプライン図の既定出力先）。
 * 純粋なパス計算のみで副作用を持たないため、テストの都合上 export する。
 */
export function resolveDefaultOutputDir(scriptId: string): string {
  return path.resolve(__dirname, "../../../public/audio", scriptId);
}

/** Windows の `\` を `/` に正規化する（design §4.3 MUST: manifest 内のパス区切りは `/` 固定）。 */
function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export interface SynthesizeOptions {
  /**
   * design §11.1 の script-id（台本ファイル名 `<script-id>.script.yaml` 由来）。
   *
   * **自己申告（spec に無い判断）**: tasks.md T10 のシグネチャ表記・`ScriptDocument` 型
   * （`src/script-engine/schema/script.ts`）のいずれも `script_id` フィールドを持たない
   * （parse.ts はファイルパスを消費して構造化データのみ返す）。しかし design §4.1/§4.2 が
   * 要求する WAV 出力先 `public/audio/<script-id>/` を組み立てるには script-id が必須のため、
   * 呼び出し側から明示指定させる必須オプションとした。
   */
  scriptId: string;
  /** VOICEVOX Engine のベース URL。省略時 {@link DEFAULT_VOICEVOX_ENGINE_BASE_URL}。 */
  engineBaseUrl?: string;
  /**
   * WAV 出力先ディレクトリ。省略時 design 準拠の `public/audio/<scriptId>/`。
   * テストでは一時ディレクトリを注入し `public/` 配下への書込を避ける。
   */
  outputDir?: string;
  /**
   * 直前の timeline manifest から読み取った「発話 id → content_hash」の対応
   * （design §4.2「対応 WAV ファイルが存在し、かつ manifest 内の記録ハッシュと一致すれば skip」）。
   *
   * **自己申告（spec に無い判断）**: manifest ファイルの読込・書出しは T12（manifest.ts）の
   * スコープであり、T10 単体は manifest I/O を持たない。初回 compile では manifest がまだ
   * 存在しないため、本フィールドを省略可能にし、省略時は「ファイル名（`<id>-<hash8>.wav`）に
   * 既にハッシュが埋め込まれているため、同名ファイルの存在自体が内容一致の十分条件」という
   * 簡略判定にフォールバックする（design §4.2 の却下代替案「ファイル名一致のみで判定」を
   * 完全採用するわけではなく、manifest ハッシュが利用可能な場合は優先してそちらで判定する
   * ハイブリッド方式）。将来 T12 実装時、直前 manifest を読み込んでこのフィールドに渡すことを想定。
   */
  recordedHashes?: Record<string, string>;
  /** fetch 実装の差し替え（テスト用 mock 注入）。省略時グローバル `fetch`。 */
  fetchImpl?: typeof fetch;
  /**
   * design 2026-07-10 HGA W-4 裁定: 全 fetch 呼び出し（`/version`/`/audio_query`/`/synthesis`）の
   * タイムアウト（ms）を一括で上書きする。省略時は `/version`={@link DEFAULT_VERSION_TIMEOUT_MS}
   * （10 秒）、`/audio_query`・`/synthesis`={@link DEFAULT_SYNTHESIS_TIMEOUT_MS}（各 60 秒）を使う。
   */
  timeoutMs?: number;
}

/** manifest 生成（T12）に渡す 1 発話分の合成結果（design §4.3 フィールドのうち T10 が確定できる分） */
export interface SynthesizedUtterance {
  utterance_id: string;
  /** 話者役割名（`Utterance.speaker`。design §4.3 例の `speaker` フィールド） */
  speaker: string;
  content_hash: string;
  /** 生成/再利用された WAV ファイルの実パス（`/` 区切りに正規化済み） */
  wav_path: string;
}

export interface SynthesizeResult {
  utterances_with_wav: SynthesizedUtterance[];
  /** skip（既存 WAV 再利用）した発話数 */
  skipped: number;
  /** VOICEVOX API を呼び出し新規/再合成した発話数 */
  synthesized: number;
  /** design §4.3 `voicevox_engine_version`（R-1 対応、`/version` から取得） */
  voicevox_engine_version: string;
}

/**
 * design §4.4「VOICEVOX Engine 起動なし/無応答（compile 時）→ 即座にエラー終了」の実装。
 * `/version` を叩き、疎通確認とバージョン取得を同時に行う。
 */
async function fetchEngineVersion(
  engineBaseUrl: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<string> {
  let response: Response;
  try {
    response = await fetchImpl(`${engineBaseUrl}/version`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new Error(
        `✗ VOICEVOX Engine（${engineBaseUrl}/version）が応答しません（タイムアウト ${timeoutMs}ms）。` +
          `Engine が起動していることを確認してください。起動手順: ${VOICEVOX_SETUP_DOC_PATH}`,
      );
    }
    throw new Error(
      `✗ VOICEVOX Engine（${engineBaseUrl}）に接続できません。Engine が起動していることを確認してください。` +
        `起動手順: ${VOICEVOX_SETUP_DOC_PATH}（design §4.4 MUST: 無音 WAV 代替やスキップは行わない）。` +
        `詳細: ${(error as Error).message}`,
    );
  }
  if (!response.ok) {
    throw new Error(
      `✗ VOICEVOX Engine（${engineBaseUrl}/version）がエラーを返しました（HTTP ${response.status}）。` +
        `Engine の状態を確認してください。起動手順: ${VOICEVOX_SETUP_DOC_PATH}`,
    );
  }
  const version: unknown = await response.json();
  if (typeof version !== "string") {
    throw new Error(
      `✗ VOICEVOX Engine のバージョン応答が想定外の形式です（文字列を期待）: ${JSON.stringify(version)}`,
    );
  }
  return version;
}

/**
 * design §4.1: `/audio_query` → `/synthesis` の 2 段呼び出しで 1 発話分の WAV バイナリを得る。
 *
 * - `/audio_query` で得た AudioQuery の `speedScale`/`pitchScale`/`intonationScale` を
 *   {@link FIXED_SYNTHESIS_PARAMS} で上書きする（design §4.2 MUST: 固定定数を一元定義）
 * - `/synthesis` 呼び出しでは `enable_interrogative_upspeak=true` を明示指定する
 *   （design §4.2 v3.2 MUST: Engine デフォルト値への暗黙依存禁止）
 */
async function synthesizeUtteranceAudio(params: {
  text: string;
  voicevoxSpeakerId: number;
  engineBaseUrl: string;
  fetchImpl: typeof fetch;
  timeoutMs: number;
}): Promise<Buffer> {
  const { text, voicevoxSpeakerId, engineBaseUrl, fetchImpl, timeoutMs } = params;

  const queryUrl = `${engineBaseUrl}/audio_query?${new URLSearchParams({
    text,
    speaker: String(voicevoxSpeakerId),
  }).toString()}`;

  let queryResponse: Response;
  try {
    queryResponse = await fetchImpl(queryUrl, {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new Error(
        `✗ VOICEVOX /audio_query が応答しません（${engineBaseUrl}、タイムアウト ${timeoutMs}ms）。` +
          `Engine が起動していることを確認してください。起動手順: ${VOICEVOX_SETUP_DOC_PATH}`,
      );
    }
    throw new Error(
      `✗ VOICEVOX /audio_query 呼び出しに失敗しました（${engineBaseUrl}）: ${(error as Error).message}`,
    );
  }
  if (!queryResponse.ok) {
    throw new Error(
      `✗ VOICEVOX /audio_query がエラーを返しました（HTTP ${queryResponse.status}）: ` +
        `${await queryResponse.text()}`,
    );
  }
  const audioQuery = (await queryResponse.json()) as Record<string, unknown>;
  // design §4.2 MUST: synthesis_params は compile 内の固定定数で上書きする
  audioQuery.speedScale = FIXED_SYNTHESIS_PARAMS.speedScale;
  audioQuery.pitchScale = FIXED_SYNTHESIS_PARAMS.pitchScale;
  audioQuery.intonationScale = FIXED_SYNTHESIS_PARAMS.intonationScale;

  const synthesisUrl = `${engineBaseUrl}/synthesis?${new URLSearchParams({
    speaker: String(voicevoxSpeakerId),
    // design §4.2 v3.2 MUST: Engine デフォルト値に暗黙依存せず明示指定する。単一 SSOT
    // （content-hash.ts の既定値と同一定数）で値のずれを構造的に防ぐ（監査前軽量レビュー対応）。
    enable_interrogative_upspeak: String(ENABLE_INTERROGATIVE_UPSPEAK),
  }).toString()}`;

  let synthesisResponse: Response;
  try {
    synthesisResponse = await fetchImpl(synthesisUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(audioQuery),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new Error(
        `✗ VOICEVOX /synthesis が応答しません（${engineBaseUrl}、タイムアウト ${timeoutMs}ms）。` +
          `Engine が起動していることを確認してください。起動手順: ${VOICEVOX_SETUP_DOC_PATH}`,
      );
    }
    throw new Error(
      `✗ VOICEVOX /synthesis 呼び出しに失敗しました（${engineBaseUrl}）: ${(error as Error).message}`,
    );
  }
  if (!synthesisResponse.ok) {
    throw new Error(
      `✗ VOICEVOX /synthesis がエラーを返しました（HTTP ${synthesisResponse.status}）`,
    );
  }
  const arrayBuffer = await synthesisResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * design §4.2 判定フロー: 「ファイル存在 ∧ ハッシュ一致 → skip」。
 * `recordedHashes`（直前 manifest 由来）が渡されていればそのハッシュと突合し、
 * 省略時はファイル名（`<id>-<hash8>.wav`）自体が期待ハッシュを表す前提でファイル存在のみ確認する
 * （{@link SynthesizeOptions.recordedHashes} の JSDoc 参照）。
 *
 * 2026-07-10 HGA W-5 裁定: ファイルが存在してもサイズが {@link MIN_VALID_WAV_BYTES}
 * （RIFF ヘッダ未満）以下なら「クラッシュ等による部分書込みの破損ファイル」とみなし skip しない
 * （永続 skip される事故の根治。WAV 書出し自体は本関数の外側でアトミック化済み、下記
 * `synthesizeScriptAudio` 参照）。
 */
async function shouldSkip(
  wavPath: string,
  utteranceId: string,
  contentHash: string,
  recordedHashes: Record<string, string> | undefined,
): Promise<boolean> {
  const exists = await fileExists(wavPath);
  if (!exists) return false;
  const stats = await stat(wavPath);
  if (stats.size <= MIN_VALID_WAV_BYTES) {
    return false;
  }
  if (recordedHashes === undefined) {
    return true;
  }
  return recordedHashes[utteranceId] === contentHash;
}

/**
 * 台本全体の音声合成（design §4.1 パイプライン第 3 段階、tasks.md W2-script-engine-T10）。
 *
 * @throws VOICEVOX Engine に接続できない場合（design §4.4 MUST、即座にエラー終了。
 *   無音 WAV 代替・スキップは行わない）。話者役割が speakerProfiles に存在しない場合
 *   （{@link resolveSpeakerProfile} 経由、design §4.4 と同様の fail-fast）。
 */
export async function synthesizeScriptAudio(
  script: ScriptDocument,
  speakerProfiles: SpeakersRegistry,
  options: SynthesizeOptions,
): Promise<SynthesizeResult> {
  const engineBaseUrl = options.engineBaseUrl ?? DEFAULT_VOICEVOX_ENGINE_BASE_URL;
  const fetchImpl = options.fetchImpl ?? fetch;
  const outputDir = options.outputDir ?? resolveDefaultOutputDir(options.scriptId);
  const versionTimeoutMs = options.timeoutMs ?? DEFAULT_VERSION_TIMEOUT_MS;
  const synthesisTimeoutMs = options.timeoutMs ?? DEFAULT_SYNTHESIS_TIMEOUT_MS;

  // design §4.4: Engine 不在は他の何よりも先に検出し、即座にエラー終了する
  const voicevoxEngineVersion = await fetchEngineVersion(
    engineBaseUrl,
    fetchImpl,
    versionTimeoutMs,
  );

  await mkdir(outputDir, { recursive: true });

  let skipped = 0;
  let synthesized = 0;
  const utterancesWithWav: SynthesizedUtterance[] = [];

  for (const utterance of script.utterances as Utterance[]) {
    const profile = resolveSpeakerProfile(speakerProfiles, utterance.speaker);
    const contentHash = computeContentHash({
      text: utterance.text,
      voicevoxSpeakerId: profile.voicevox_speaker_id,
      // synthesisParams / enableInterrogativeUpspeak は既定値（FIXED_SYNTHESIS_PARAMS /
      // ENABLE_INTERROGATIVE_UPSPEAK）を使う。実際の /synthesis 呼び出しも同一定数を参照するため
      // 常に整合する（design §4.2 MUST、単一 SSOT）。
    });

    const fileName = `${utterance.id}-${contentHash}.wav`;
    const wavPath = path.join(outputDir, fileName);

    if (await shouldSkip(wavPath, utterance.id, contentHash, options.recordedHashes)) {
      skipped += 1;
    } else {
      const wavBuffer = await synthesizeUtteranceAudio({
        text: utterance.text,
        voicevoxSpeakerId: profile.voicevox_speaker_id,
        engineBaseUrl,
        fetchImpl,
        timeoutMs: synthesisTimeoutMs,
      });
      // 2026-07-10 HGA W-5 裁定: 一時ファイル（`.tmp-` プレフィクス）に書いてから rename する
      // アトミック方式。クラッシュ時に部分書込みの WAV が最終ファイル名で残ることを防ぐ
      // （`shouldSkip` の 44 バイト以下チェックはこの根治策の保険的二重防御）。
      const tmpPath = path.join(outputDir, `.tmp-${fileName}`);
      await writeFile(tmpPath, wavBuffer);
      await rename(tmpPath, wavPath);
      synthesized += 1;
    }

    utterancesWithWav.push({
      utterance_id: utterance.id,
      speaker: utterance.speaker,
      content_hash: contentHash,
      wav_path: toPosixPath(wavPath),
    });
  }

  return {
    utterances_with_wav: utterancesWithWav,
    skipped,
    synthesized,
    voicevox_engine_version: voicevoxEngineVersion,
  };
}
