/**
 * script-engine — timeline manifest 生成実装（manifest モジュール）
 *
 * 出自: docs/specs/script-engine/design.md §4.1（パイプライン最終段階）/ §4.2（prune）/
 *   §4.3（timeline manifest スキーマ）/ §4.4（エラー設計）/ §5.2-§5.4（frame 変換・総尺算出規約）/
 *   §7.5（クレジット表示）
 * 対応タスク: docs/specs/script-engine/tasks.md W2-script-engine-T12
 *
 * パーサ（T8）→ 尺予測（T9）→ 音声合成（T10, synthesize.ts）→ WAV 実測（T11, measure.ts）の
 * 全結果を集約し、timeline manifest（JSON）を生成・書き出す。あわせて manifest 非掲載の WAV を
 * 削除する prune（design §4.2）を行う。
 *
 * **frame 変換の中核規約（design §5.2）**: 秒単位の「累積秒（cum_sec, timeline 絶対原点からの
 * 経過秒）」を浮動小数のまま先に確定し、**最後に 1 回だけ `Math.round(cum_sec * fps)` を適用する**。
 * 区間長（duration）を個別に丸めてから積算する方式（二重丸め）は、丸め誤差が発話数に比例して
 * 蓄積するドリフトを生むため採用しない（本ファイルのテストに二重丸め検出用の回帰テストがある）。
 */

import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ScriptDocument, SlideEvent, Utterance } from "../schema/script";
import { KNOWN_SPEAKER_ROLES } from "../schema/script";
import type { SpeakersRegistry } from "../schema/speaker-profile";
import type {
  ManifestSlideEvent,
  ManifestSpeaker,
  ManifestUtterance,
  TimelineManifest,
} from "../schema/timeline-manifest";
import { CREDIT_REGION_SECONDS } from "../shared/credit-region";
import type { SynthesizedUtterance } from "./synthesize";
import { resolveDefaultOutputDir } from "./synthesize";

/** design §5.1: fps 前提（既存 Composition 全てが 30fps）。 */
export const DEFAULT_FPS = 30;

/** design §5.4: 末尾スライドイベントの表示保証尺（秒）。 */
export const DISPLAY_GUARANTEE_SECONDS = 2;

/** design §7.5: クレジット区間の尺（秒）。正本は `shared/credit-region.ts`（ここからも出す）。 */
export { CREDIT_REGION_SECONDS };

/**
 * T12 が受け取る「1 発話分の合成結果 + WAV 実測結果」の集約入力。
 *
 * **自己申告（spec に無い判断）**: tasks.md T12 のシグネチャ表記は `utterances_with_wav` を
 * 単一引数として扱うのみで、その要素が T10（`SynthesizedUtterance`: content_hash / wav_path 等）と
 * T11（`MeasureWavResult`: duration_seconds）のどちらの形かを明示しない。design §4.1 パイプライン図
 * （合成 → 実測 → manifest 生成の順）と完了条件「各発話の frame 変換（累積秒 → frame）」が
 * `duration_seconds` を前提にすることから、呼び出し側（将来のオーケストレーションスクリプト、
 * T13 以降のスコープ）が T10 の結果と T11 の実測結果をあらかじめマージ済みの配列として渡す設計とした。
 */
export interface UtteranceWithMeasuredWav extends SynthesizedUtterance {
  /** 秒。T11 (`measureWavDuration`) の実測値 */
  duration_seconds: number;
}

export interface GenerateManifestOptions {
  /**
   * design §11.1 の script-id（`<script-id>.script.yaml` 由来）。
   * **自己申告（spec に無い判断）**: T10 `SynthesizeOptions.scriptId` と同じ判断
   * （`ScriptDocument` 型に `script_id` フィールドが存在しないため、呼び出し側から明示指定させる）。
   */
  scriptId: string;
  /**
   * design §4.3 `voicevox_engine_version`（T10 `SynthesizeResult.voicevox_engine_version` を
   * そのまま渡す想定）。
   * **自己申告（spec に無い判断）**: tasks.md T12 のシグネチャ表記（4 引数）には現れないが、
   * manifest スキーマの必須フィールドであり他に渡す経路がないため options に含めた。
   */
  voicevoxEngineVersion: string;
  /** design §5.1。省略時 {@link DEFAULT_FPS}（30）。 */
  fps?: number;
  /** manifest JSON の書出し先。省略時 `public/manifests/<scriptId>.manifest.json`。 */
  outputPath?: string;
  /** JSON をファイルに書き出すかどうか。省略時 true。テストは false または一時ディレクトリを使う。 */
  writeManifestFile?: boolean;
  /**
   * prune 対象ディレクトリ。省略時 `public/audio/<scriptId>/`
   * （T10 `resolveDefaultOutputDir` と同一解決規則）。
   */
  wavDir?: string;
  /** prune（不要 WAV 削除、design §4.2）を実行するかどうか。省略時 true。 */
  prune?: boolean;
  /**
   * テスト用の `fs.unlink` 差し替え（design §4.4「EBUSY 等の失敗時は警告ログで継続」の検証用）。
   * 省略時 `node:fs/promises` の `unlink`。
   */
  unlinkImpl?: (targetPath: string) => Promise<void>;
}

export interface GenerateManifestResult {
  manifest: TimelineManifest;
  /** 実際に書き出した（`writeManifestFile: false` 時は書き出す予定だった）manifest JSON のパス */
  outputPath: string;
  /** prune で削除した WAV ファイル名一覧（basename） */
  pruned: string[];
  /** prune 失敗（EBUSY 等）の警告メッセージ一覧（design §4.4: エラー停止せず継続） */
  pruneWarnings: string[];
  /** エラーではない警告（design §5.3 境界ケース等） */
  warnings: string[];
}

/** manifest JSON の既定書出し先（design §4.1 パイプライン図）。 */
export function resolveDefaultManifestOutputPath(scriptId: string): string {
  return path.resolve(__dirname, "../../../public/manifests", `${scriptId}.manifest.json`);
}

/**
 * design §4.3（2026-07-10 HGA C-1 裁定、MUST）: manifest の `wav_path` は
 * `audio/<script-id>/<ファイル名>`（`/` 区切り）の public/ 相対パスに正規化して記録する。
 * 入力（T10 `synthesize.ts` の実絶対パス）から basename を取り、scriptId と組み合わせて
 * 再構成する（絶対パスをそのまま記録するとマシン固有情報の焼き付きとなり、クロス環境の
 * 決定性と Remotion `staticFile()` 解決の両方を壊すため MUST NOT）。
 */
function toPublicRelativeWavPath(wavPath: string, scriptId: string): string {
  return `audio/${scriptId}/${wavBasename(wavPath)}`;
}

/**
 * WAV のファイル名を取る。OS に依らず `/`・`\` の両方をセパレータとして扱う
 * （`path.basename` と `synthesize.ts` の `toPosixPath` は実行中の OS の区切りしか見ないので、POSIX 上で
 * `C:\...\u-1.wav` を渡すとパスまるごとが返る）。manifest の `wav_path` と prune の照合の両方がこれを使う。
 */
function wavBasename(wavPath: string): string {
  const segments = wavPath.split(/[/\\]/);
  return segments[segments.length - 1];
}

/** 秒 → frame 変換（design §5.2: 累積秒に対して 1 回だけ丸める）。 */
function roundFrame(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

/** 発話 1 件分の累積秒タイミング（design §5.2 の 3 境界: 開始 / 音声終了 / 区間終了）。 */
interface UtteranceTiming {
  start_sec: number;
  /** 音声実尺のみの終了秒（`pause_after` を含まない）。slide anchor "end" の基準（下記参照）。 */
  audio_end_sec: number;
  /** `pause_after` 込みの区間終了秒。 */
  end_sec: number;
}

/**
 * design §5.2 pt.1-2: 発話単位の累積秒タイミングを算出する。
 *
 * 各発話について `cum_sec += pause_before` → `start_sec` 確定 → `cum_sec += duration_seconds` →
 * `audio_end_sec` 確定 → `cum_sec += pause_after` → `end_sec` 確定、の順で `cum_sec` を
 * 浮動小数のまま進める（丸めは行わない）。frame への丸めは呼び出し側が {@link roundFrame} で
 * 個々の秒値に対して 1 回だけ行う。
 */
function computeUtteranceTimings(
  utterances: Utterance[],
  wavById: Map<string, UtteranceWithMeasuredWav>,
): Map<string, UtteranceTiming> {
  let cumSec = 0;
  const timings = new Map<string, UtteranceTiming>();
  for (const utterance of utterances) {
    const wav = wavById.get(utterance.id);
    if (wav === undefined) {
      throw new Error(
        `✗ 発話 "${utterance.id}" に対応する音声合成/WAV 実測結果が utterancesWithWav にありません` +
          `（synthesize.ts / measure.ts の結果集約に漏れがあります）`,
      );
    }
    cumSec += utterance.pause_before ?? 0;
    const start_sec = cumSec;
    cumSec += wav.duration_seconds;
    const audio_end_sec = cumSec;
    cumSec += utterance.pause_after ?? 0;
    const end_sec = cumSec;
    timings.set(utterance.id, { start_sec, audio_end_sec, end_sec });
  }
  return timings;
}

interface SlideEventFrame {
  id: string;
  slide: string;
  frame: number;
}

/**
 * design §5.2 pt.3 + §5.3: スライドイベントの frame を算出し、重なり・順序逆転を検出する。
 *
 * `anchor.position` の意味（design §2.4 例 + 実データ検証、`content/scripts/java-vs-js.script.yaml`
 * ev-002 のコメント「u-005 終了 + 0.6 秒 = pause_after 経由で u-006 開始と同時刻」から確定）:
 * - `"start"` → 当該発話の `start_sec`（`pause_before` 込み、音声開始点）
 * - `"end"`   → 当該発話の `audio_end_sec`（**`pause_after` を含まない**音声終了点）。
 *   もし `end_sec`（`pause_after` 込み）を基準にすると、上記実データ検証コメントの等式
 *   （u-005 end + 0.6 = u-006 start）が成立しなくなる（u-005 の `pause_after` を二重に
 *   加算することになるため）。
 *
 * 重なり検出（design §5.3 MUST）は `slide_events` の**配列順**を基準に、算出済み frame が
 * 狭義単調増加であることを検証する（同一 frame での競合、および順序逆転のいずれもエラー）。
 */
function computeSlideEventFrames(
  script: ScriptDocument,
  timingsById: Map<string, UtteranceTiming>,
  fps: number,
): SlideEventFrame[] {
  const slideIds = new Set(script.slides.map((s) => s.id));
  const result: SlideEventFrame[] = [];
  let prevFrame: number | undefined;

  for (const event of script.slide_events as SlideEvent[]) {
    if (!slideIds.has(event.slide)) {
      throw new Error(
        `✗ slide_events[id="${event.id}"] が参照するスライド ID "${event.slide}" は ` +
          `slides[] に存在しません（未登録スライド ID）`,
      );
    }
    const timing = timingsById.get(event.anchor.utterance);
    if (timing === undefined) {
      throw new Error(
        `✗ slide_events[id="${event.id}"] の anchor.utterance "${event.anchor.utterance}" に ` +
          `対応する発話タイミングが見つかりません`,
      );
    }
    const boundarySec =
      event.anchor.position === "start" ? timing.start_sec : timing.audio_end_sec;
    const frame = roundFrame(boundarySec + event.anchor.offset, fps);

    if (prevFrame !== undefined && frame <= prevFrame) {
      throw new Error(
        `✗ slide_events の frame が狭義単調増加ではありません（design §5.3 MUST）: ` +
          `slide_events[id="${event.id}"] の frame (${frame}) が直前イベントの frame (${prevFrame}) ` +
          `以下です（同一 frame での競合、または順序逆転。anchor.offset を調整してください）`,
      );
    }

    result.push({ id: event.id, slide: event.slide, frame });
    prevFrame = frame;
  }

  return result;
}

/**
 * design §7.5 / §4.3（2026-07-10 HGA W-6 裁定で改訂）: 台本が使用した話者のクレジット表記一覧を、
 * 初出順・重複なしで組み立てる。`speaker-profiles.yaml` に登場話者のプロファイルが存在しない、
 * または `credit` フィールドが欠落している場合は **黙ってスキップせず fail-fast エラーとする MUST**
 * （NFR-3 クレジット表記 MUST の構造的担保。旧実装は `credit` 欠落話者を静かに除外していたが、
 * これは「台本作者がクレジット表記を書き忘れても compile が構造的に自動付与する」という design §7.5
 * の設計意図（人間の記載漏れに依存しない担保）を満たさない誤りだった）。
 */
function resolveCredits(script: ScriptDocument, speakerProfiles: SpeakersRegistry): string[] {
  const seenRoles = new Set<string>();
  const credits: string[] = [];
  for (const utterance of script.utterances) {
    if (seenRoles.has(utterance.speaker)) continue;
    seenRoles.add(utterance.speaker);
    const profile = speakerProfiles.speakers[utterance.speaker];
    if (profile === undefined) {
      throw new Error(
        `✗ 話者 "${utterance.speaker}" のプロファイルが speaker-profiles.yaml に存在しません` +
          `（design §4.4 の未知話者役割 fail-fast と同様の方針）`,
      );
    }
    if (!profile.credit) {
      throw new Error(
        `✗ 話者 "${utterance.speaker}" のプロファイルに credit フィールドがありません` +
          `（design §7.5 / §4.3 改訂 MUST: NFR-3 クレジット表記の構造的担保、fail-fast）`,
      );
    }
    credits.push(profile.credit);
  }
  // Laterna 追加（2026-09-26）: 台本の extra_credits（立ち絵の出所など）を末尾に足す（初出順・重複なし）。
  for (const extra of script.extra_credits ?? []) {
    if (!credits.includes(extra)) credits.push(extra);
  }
  return credits;
}

/**
 * design §4.3 v3.6（T15 着手時ギャップ裁定）: 台本に登場した話者役割名 → 描画用話者情報のマップを
 * 組み立てる（登場話者のみ、credits と同じ選別規則）。`portrait.asset_key` 欠落は fail-fast エラー
 * とする MUST（credits の credit 欠落と同型。立ち絵欠落の黙認続行は design §4.4 MUST NOT）。
 * 未知の話者役割名は parse（`schema/script.ts`）が、プロファイルの欠落は estimate（`resolveSpeakerProfile`）が
 * 先に止めるので、ここでの役割名とプロファイルの検査は二重の守りになる。
 *
 * **v3.7 追加（HGA W-1 対応、design §4.4）**: 話者役割名が `narrator`/`listener` 以外の場合は
 * compile 時に fail-fast する MUST。v1 のレイアウトは 2 役割固定（design §7）であり、未知役割名は
 * render 段で立ち絵カラム消失・強調無効の**無警告描画**となる（`SpeakerPortrait` 等が該当役割を
 * 描画できず静かに欠落する）ため、speaker-profiles.yaml に該当プロファイルが存在するかどうかに
 * 関わらず compile（manifest 生成時）で停止する。
 */
function resolveSpeakers(
  script: ScriptDocument,
  speakerProfiles: SpeakersRegistry,
): Record<string, ManifestSpeaker> {
  const speakers: Record<string, ManifestSpeaker> = {};
  for (const utterance of script.utterances) {
    if (speakers[utterance.speaker] !== undefined) continue;
    if (!KNOWN_SPEAKER_ROLES.has(utterance.speaker)) {
      throw new Error(
        `✗ 話者役割名 "${utterance.speaker}" は v1 が受理する役割名（narrator / listener）の` +
          `いずれでもありません（design §4.4 v3.7 MUST、HGA W-1 対応）: v1 のレイアウトは 2 役割固定` +
          `（design §7）であり、未知役割は render 段で立ち絵カラム消失・強調無効の無警告描画となる` +
          `ため compile で停止します`,
      );
    }
    const profile = speakerProfiles.speakers[utterance.speaker];
    if (profile === undefined) {
      throw new Error(
        `✗ 話者 "${utterance.speaker}" のプロファイルが speaker-profiles.yaml に存在しません` +
          `（design §4.4 の未知話者役割 fail-fast と同様の方針）`,
      );
    }
    if (!profile.portrait?.asset_key) {
      throw new Error(
        `✗ 話者 "${utterance.speaker}" のプロファイルに portrait.asset_key がありません` +
          `（design §4.3 v3.6 MUST: 立ち絵解決経路の構造的担保、fail-fast）`,
      );
    }
    speakers[utterance.speaker] = {
      portrait_asset_key: profile.portrait.asset_key,
      display_name: profile.display_name,
    };
  }
  return speakers;
}

/**
 * design §4.2 prune: `wavDir` 配下の `.wav` ファイルのうち、`referencedBasenames` に
 * 含まれないものを削除する。`fs.unlink` 失敗（EBUSY 等、Studio が WAV を開いている場合）は
 * 警告ログとして蓄積し、他ファイルの削除は継続する（design §4.4 MUST: エラー停止しない）。
 * `wavDir` が存在しない場合（初回 compile 等）は prune 対象なしとして正常終了する。
 */
async function pruneUnreferencedWavFiles(
  wavDir: string,
  referencedBasenames: Set<string>,
  unlinkImpl: (targetPath: string) => Promise<void>,
): Promise<{ pruned: string[]; pruneWarnings: string[] }> {
  const pruned: string[] = [];
  const pruneWarnings: string[] = [];

  let entries: string[];
  try {
    entries = await readdir(wavDir);
  } catch {
    return { pruned, pruneWarnings };
  }

  for (const entry of entries) {
    if (!entry.endsWith(".wav")) continue;
    if (referencedBasenames.has(entry)) continue;

    const target = path.join(wavDir, entry);
    try {
      await unlinkImpl(target);
      pruned.push(entry);
    } catch (error) {
      pruneWarnings.push(
        `⚠ WAV ファイルの削除に失敗しました（警告のみ、継続、design §4.4）: ${entry}` +
          `（${(error as Error).message}）`,
      );
    }
  }

  return { pruned, pruneWarnings };
}

/**
 * timeline manifest を生成し、JSON として書き出す（design §4.1 パイプライン最終段階、
 * tasks.md W2-script-engine-T12）。あわせて prune（design §4.2）を行う。
 *
 * @throws 発話が 0 件、`utterancesWithWav` に対応エントリのない発話がある、
 *   スライドイベントが未登録スライド ID を参照する、対応発話タイミングが見つからない、
 *   `slide_events` の frame が狭義単調増加でない（重なり・順序逆転）、
 *   `slide_events` の frame が `total_duration_frames` を超過する（design §5.3）、
 *   のいずれかの場合（全て fail-fast、design §4.4）。
 */
export async function generateManifest(
  script: ScriptDocument,
  utterancesWithWav: UtteranceWithMeasuredWav[],
  speakerProfiles: SpeakersRegistry,
  options: GenerateManifestOptions,
): Promise<GenerateManifestResult> {
  const fps = options.fps ?? DEFAULT_FPS;
  const warnings: string[] = [];

  if (script.utterances.length === 0) {
    throw new Error("✗ 台本に発話がありません（manifest 生成には最低 1 発話が必要です）");
  }

  const wavById = new Map(utterancesWithWav.map((u) => [u.utterance_id, u]));

  // design §5.2 pt.1-2: 発話タイミング（累積秒、丸めなし）
  const timingsById = computeUtteranceTimings(script.utterances, wavById);

  // design §5.2 pt.3 + §5.3: スライドイベント frame + 重なり検出
  const slideEventFrames = computeSlideEventFrames(script, timingsById, fps);

  // design §5.4 SHOULD（2026-07-10 HGA I-3 裁定）: frame 0 から最初の slide_event までの区間が
  // 背景のみになる場合の情報表示（エラー・警告ではなく情報レベル。意図的な構成もありうるため）。
  if (slideEventFrames.length > 0 && slideEventFrames[0].frame !== 0) {
    warnings.push(
      `frame 0 から最初のスライドまで背景のみの区間が ${slideEventFrames[0].frame} frame あります` +
        `（design §5.4 SHOULD、情報表示。冒頭のタイトルコール等、意図的な構成の場合は無視してよい）`,
    );
  }

  // design §5.4 v3 一般則 + §7.5 クレジット区間
  const lastUtterance = script.utterances[script.utterances.length - 1];
  const lastUtteranceEndFrame = roundFrame(timingsById.get(lastUtterance.id)!.end_sec, fps);
  const guaranteeFrames = roundFrame(DISPLAY_GUARANTEE_SECONDS, fps);
  const creditFrames = roundFrame(CREDIT_REGION_SECONDS, fps);

  const lastSlideEventFrame =
    slideEventFrames.length > 0 ? slideEventFrames[slideEventFrames.length - 1].frame : undefined;

  const preCreditFrames =
    lastSlideEventFrame === undefined
      ? lastUtteranceEndFrame
      : Math.max(lastUtteranceEndFrame, lastSlideEventFrame + guaranteeFrames);

  const totalDurationFrames = preCreditFrames + creditFrames;

  // design §9.2 二段警告の第 2 段（2026-07-10 裁定 Fable 採択 / HGA 第 2 回 W-9）:
  // 確定した最終動画尺（クレジット込み）が target_duration_range の max を超過した場合に警告する。
  // 予測誤差 ±15% 帯内のまま動画尺だけが上限を超える死角を塞ぐ。min 側は突合しない
  // （クレジット・表示保証による底上げで偽警告になるため。下限は estimate 側の第 1 段警告が担う）。
  if (script.target_duration_range !== undefined) {
    const videoDurationSeconds = totalDurationFrames / fps;
    if (videoDurationSeconds > script.target_duration_range.max) {
      warnings.push(
        `最終動画尺 ${videoDurationSeconds.toFixed(1)} 秒（クレジット区間込み）が ` +
          `target_duration_range の上限 ${script.target_duration_range.max} 秒を超過しています` +
          `（design §9.2 第 2 段警告、非ブロッキング。台本圧縮の検討候補は tasks.md T25 参照）`,
      );
    }
  }

  // design §5.3 末尾 2 bullet: 全 slide_events の frame は total_duration_frames 以下 MUST
  // （== の場合は警告のみ）。
  // **自己申告（構造的な注記）**: design §5.4 v3 のクレジット区間（常に +creditFrames、
  // creditFrames > 0）を total_duration_frames に必ず加算する現行式のもとでは、
  // 「slide_events の frame は常に (前段最大値) + guaranteeFrames + creditFrames 未満」に
  // 収まるため、本チェックは v3 総尺式のもとでは実質到達不能（防御的実装として残す。
  // v1 パイロット単純化を復活させる等、式が変わった場合に意味を持つ）。
  for (const sef of slideEventFrames) {
    if (sef.frame > totalDurationFrames) {
      throw new Error(
        `✗ slide_events[id="${sef.id}"] の frame (${sef.frame}) が ` +
          `total_duration_frames (${totalDurationFrames}) を超過しています（design §5.3 MUST）`,
      );
    }
    if (sef.frame === totalDurationFrames) {
      warnings.push(
        `slide_events[id="${sef.id}"] の frame が total_duration_frames と一致しています` +
          `（表示尺ゼロの無意味イベント、design §5.3）`,
      );
    }
  }

  const manifestUtterances: ManifestUtterance[] = script.utterances.map((utterance) => {
    const wav = wavById.get(utterance.id)!;
    const timing = timingsById.get(utterance.id)!;
    return {
      id: utterance.id,
      speaker: utterance.speaker,
      content_hash: wav.content_hash,
      wav_path: toPublicRelativeWavPath(wav.wav_path, options.scriptId),
      duration_seconds: wav.duration_seconds,
      start_frame: roundFrame(timing.start_sec, fps),
      end_frame: roundFrame(timing.end_sec, fps),
      audio_end_frame: roundFrame(timing.audio_end_sec, fps),
    };
  });

  const manifestSlideEvents: ManifestSlideEvent[] = slideEventFrames.map((sef) => ({
    id: sef.id,
    slide: sef.slide,
    start_frame: sef.frame,
  }));

  const manifest: TimelineManifest = {
    schema_version: 1,
    script_id: options.scriptId,
    fps,
    voicevox_engine_version: options.voicevoxEngineVersion,
    utterances: manifestUtterances,
    slide_events: manifestSlideEvents,
    // design §4.3 v3.5: 台本の slides[] をそのまま焼き込む（変換・加工しない）。
    slides: script.slides,
    // design §4.3 v3.6: 登場話者の描画用情報（立ち絵 asset_key）を焼き込む。
    speakers: resolveSpeakers(script, speakerProfiles),
    credits: resolveCredits(script, speakerProfiles),
    total_duration_frames: totalDurationFrames,
  };

  const outputPath = options.outputPath ?? resolveDefaultManifestOutputPath(options.scriptId);
  if (options.writeManifestFile ?? true) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
  }

  const wavDir = options.wavDir ?? resolveDefaultOutputDir(options.scriptId);
  const referencedBasenames = new Set(utterancesWithWav.map((u) => wavBasename(u.wav_path)));
  const { pruned, pruneWarnings } =
    options.prune ?? true
      ? await pruneUnreferencedWavFiles(wavDir, referencedBasenames, options.unlinkImpl ?? unlink)
      : { pruned: [], pruneWarnings: [] };

  return { manifest, outputPath, pruned, pruneWarnings, warnings };
}
