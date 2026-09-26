/**
 * script-engine — 尺予測（render 前の推定尺計算）
 *
 * 出自: docs/specs/script-engine/design.md §9（尺予測設計、D4 の一部, FR-5）
 * 対応タスク: docs/specs/script-engine/tasks.md W2-script-engine-T9
 *
 * 台本（`ScriptDocument`）と話者プロファイル（`SpeakersRegistry`）から、文字数ベースの
 * ラフな執筆時予測尺を計算する。design §4.1 パイプラインの第 2 段階（parse の次）に対応する
 * 「執筆時支援ツール」であり、VOICEVOX 音声合成（T10 以降）より前に実行できる軽量な見積りを
 * 提供する。
 *
 * 本ファイルが提供する 2 つの独立した判定（tasks.md T9 完了条件 (1)(2) の分離、混同禁止）:
 * 1. **target_duration_range 超過判定**（{@link estimateScriptDuration} の戻り値
 *    `duration_range_warning`）: 予測総尺 vs 台本の `target_duration_range` の比較。
 *    判定のみで非ブロッキング（design §9.1 の対象、FR-5「render 前の尺予測」）。
 * 2. **誤差率算出**（{@link calculateDurationErrorRate}）: 予測尺 vs WAV 実測尺の比較。
 *    design §9.2/§9.3 の ±15%/±25% 閾値判定。実測値との突合自体は T25 のスコープであり、
 *    T9 では純関数の実装とテストのみを行う（tasks.md T9 完了条件 (2)）。
 */

import type { ScriptDocument, Utterance } from "../schema/script";
import type { SpeakerProfile, SpeakersRegistry } from "../schema/speaker-profile";
import { resolveSpeakerProfile } from "./speaker-profiles";

/**
 * design §9.1: 執筆時ラフ予測の基準話速（文字/分）。
 * 要件書 FR-5「460〜500 文字/分」の中央値に近い値として採用された固定定数
 * （`docs/conventions/narration-style.md` の現行値 350 とは異なる、design §9.1 参照）。
 */
export const SPEECH_RATE_BASE_CHARS_PER_MINUTE = 480;

/** design §9.3: 誤差率 15% 以下 = 正常（メッセージなし） */
const DURATION_ERROR_WARNING_THRESHOLD = 0.15;
/** design §9.3: 誤差率 25% 以下 = 警告、25% 超 = 強い警告 + エスカレーション */
const DURATION_ERROR_CRITICAL_THRESHOLD = 0.25;

/** 発話単位の予測尺付き結果（design §9.1 の `predicted_seconds(utterance)`） */
export interface EstimatedUtterance extends Utterance {
  /** 秒。§9.1 の式で算出した当該発話の予測尺（pause_before/pause_after 込み） */
  estimated_seconds: number;
}

/** `estimateScriptDuration` の戻り値（tasks.md T9 完了条件「結果」節） */
export interface EstimateResult {
  /** 秒。design §9.1 `predicted_total_seconds(script)` */
  predicted_total_seconds: number;
  /** 発話ごとの予測尺付き配列。順序は `script.utterances` と同一 */
  by_utterance: EstimatedUtterance[];
  /**
   * `target_duration_range` 超過時の警告メッセージ（design §9.1、FR-5 レンジ超過判定）。
   * 台本に `target_duration_range` が未指定、または範囲内の場合は `null`
   * （fail-fast エラーではなく判定結果のみを表す非ブロッキング警告のため、
   * `script.ts` の `✗` プレフィックス付き Error とは意図的に区別している）。
   */
  duration_range_warning: string | null;
}

/** design §9.2/§9.3: 誤差率の重要度分類 */
export type DurationErrorSeverity = "normal" | "warning" | "critical";

/** `calculateDurationErrorRate` の戻り値 */
export interface DurationErrorRate {
  /** 0.15 = 15% のように小数表現した誤差率（絶対値、常に 0 以上） */
  error_rate: number;
  severity: DurationErrorSeverity;
}

/**
 * design §9.1: `char_count` は発話 text から空白類を除いた文字数
 * （句読点・記号は含む）と定義される。PDF のページ分割（`pdf/script-pdf-manifest.ts`）も
 * 同じ定義で数えるので export する。
 */
export function countSpeechCharacters(text: string): number {
  return text.replace(/\s/g, "").length;
}

/**
 * design §9.1 の式（1 発話分）:
 * `predicted_seconds = (char_count / (speech_rate_base * speaker_rate_factor)) * 60
 *   + pause_before + pause_after`
 */
function estimateUtteranceSeconds(
  utterance: Utterance,
  profile: SpeakerProfile,
): number {
  const charCount = countSpeechCharacters(utterance.text);
  const speechSeconds =
    (charCount / (SPEECH_RATE_BASE_CHARS_PER_MINUTE * profile.speech_rate_factor)) * 60;
  return speechSeconds + (utterance.pause_before ?? 0) + (utterance.pause_after ?? 0);
}

/**
 * 予測総尺が台本の `target_duration_range` を外れているかを判定する（design §9.1、FR-5）。
 * 判定のみを行う非ブロッキング警告であり、compile を停止させない
 * （design §9.3「非ブロッキング。exit code は変えない」と同じ運用強度）。
 *
 * `target_duration_range` が未指定の台本は比較対象がないため `null`（警告なし）を返す。
 */
function checkDurationRangeWarning(
  predictedTotalSeconds: number,
  targetDurationRange: { min: number; max: number } | undefined,
): string | null {
  if (targetDurationRange === undefined) {
    return null;
  }
  const { min, max } = targetDurationRange;
  if (predictedTotalSeconds < min || predictedTotalSeconds > max) {
    return (
      `予測総尺 ${predictedTotalSeconds.toFixed(1)}秒 が target_duration_range ` +
      `{ min: ${min}, max: ${max} } の範囲外です（design §9.1, FR-5。非ブロッキング警告）`
    );
  }
  return null;
}

/**
 * 台本全体の文字数ベース推定尺を計算する（design §9.1、tasks.md W2-script-engine-T9）。
 *
 * @param script - parse 済み台本（`parseScript`/`parseScriptDocument` の戻り値）
 * @param speakerProfiles - `loadSpeakerProfiles` で読み込んだ話者プロファイル一式
 * @throws `script.utterances` が参照する話者役割が `speakerProfiles.speakers` に
 *   存在しない場合（{@link resolveSpeakerProfile} 経由、design §4.4 と同様の fail-fast 方針）
 */
export function estimateScriptDuration(
  script: ScriptDocument,
  speakerProfiles: SpeakersRegistry,
): EstimateResult {
  const byUtterance: EstimatedUtterance[] = script.utterances.map((utterance) => {
    const profile = resolveSpeakerProfile(speakerProfiles, utterance.speaker);
    const estimatedSeconds = estimateUtteranceSeconds(utterance, profile);
    return { ...utterance, estimated_seconds: estimatedSeconds };
  });

  const predictedTotalSeconds = byUtterance.reduce(
    (sum, u) => sum + u.estimated_seconds,
    0,
  );

  return {
    predicted_total_seconds: predictedTotalSeconds,
    by_utterance: byUtterance,
    duration_range_warning: checkDurationRangeWarning(
      predictedTotalSeconds,
      script.target_duration_range,
    ),
  };
}

/**
 * 予測尺 vs 実測尺（WAV 実測後の総尺）の誤差率を算出する純関数（design §9.2/§9.3）。
 * T9 では本関数の実装とテストのみを行い、実測値との突合自体は T25 のスコープ
 * （tasks.md T9 完了条件 (2)）。
 *
 * 誤差率の分母は実測尺（actualSeconds）とする判断: design §9.2「render 前予測値と WAV 実測後の
 * 総尺の差」の基準は実測値を真値とみなす比較であり、`speech_rate_factor` の実測更正（T25）も
 * 実測尺を基準に行うため（design §9.2 外挿の限界注記と整合）。design 原文に分母の明記はなく、
 * これは本実装での判断（自己申告事項）。
 *
 * 境界判定は design §9.3「誤差 15% 以下 = 正常」「15% 超〜25% 以下 = 警告」
 * 「25% 超 = 強い警告」に従い、15%・25% ちょうどは含む側（`normal`/`warning`）に倒す。
 *
 * @throws actualSeconds が 0 以下の場合（誤差率が定義できないため）
 */
export function calculateDurationErrorRate(
  predictedSeconds: number,
  actualSeconds: number,
): DurationErrorRate {
  if (actualSeconds <= 0) {
    throw new Error(
      `✗ 実測尺（actualSeconds）は正の値である必要があります: ${actualSeconds}`,
    );
  }

  const errorRate = Math.abs(predictedSeconds - actualSeconds) / actualSeconds;

  let severity: DurationErrorSeverity;
  if (errorRate <= DURATION_ERROR_WARNING_THRESHOLD) {
    severity = "normal";
  } else if (errorRate <= DURATION_ERROR_CRITICAL_THRESHOLD) {
    severity = "warning";
  } else {
    severity = "critical";
  }

  return { error_rate: errorRate, severity };
}
