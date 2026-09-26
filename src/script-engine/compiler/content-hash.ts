/**
 * script-engine — 内容ハッシュ算出（WAV 再生成/skip 判定の入力）
 *
 * 出自: docs/specs/script-engine/design.md §4.2（内容ハッシュ）
 * 対応タスク: docs/specs/script-engine/tasks.md W2-script-engine-T10
 * 実地検証: docs/artifacts/spike-hash-logic-2026-07-09.md（W1-script-engine-T6 Spike、
 *   キーソート正規化 JSON + SHA-256 先頭 8 桁の方式を 4/4 PASS で確認済み。
 *   検証スクリプト: scripts/test-hash-logic.mjs。本ファイルはその `canonicalize` /
 *   `computeContentHash` ロジックをそのまま TypeScript へ移植したもの）
 *
 * ハッシュ算入要素は `{ text, voicevox_speaker_id, synthesis_params, enable_interrogative_upspeak }`
 * の正規化 JSON（design §4.2 本文 + 2026-07-10 追記の v3.2 決定）。
 * 発話 `id` はハッシュに含めない MUST NOT（design §4.2。並べ替えのみでの無駄な再合成を防ぐため）。
 */

import { createHash } from "node:crypto";
import type { SynthesisParams } from "../schema/speaker-profile";
import { FIXED_SYNTHESIS_PARAMS, ENABLE_INTERROGATIVE_UPSPEAK } from "../schema/speaker-profile";

/**
 * design §4.2: SHA-256 先頭 8〜16 桁のうち、manifest 例示（`"content_hash": "a1b2c3d4"`）との
 * 整合を優先し 8 桁を採用（spike-hash-logic-2026-07-09.md §5 の裁定をそのまま踏襲）。
 */
export const CONTENT_HASH_DIGITS = 8;

export interface ContentHashInput {
  text: string;
  voicevoxSpeakerId: number;
  /** 省略時 {@link FIXED_SYNTHESIS_PARAMS}（design §4.2 MUST: v1 は台本/話者プロファイルからの上書き非スコープ） */
  synthesisParams?: SynthesisParams;
  /**
   * design §4.2 v3.2（2026-07-10 追記）MUST: `/synthesis` 呼び出しの実値と必ず一致させること。
   * 省略時 {@link ENABLE_INTERROGATIVE_UPSPEAK}（単一 SSOT。synthesize.ts も同定数を参照して
   * `/synthesis` 呼び出し時に明示指定するため、値がずれる余地を構造的に排除している。
   * 値がずれると「疑問文 WAV が変わったのにハッシュ不変」という design §4.2 が警告する事故に
   * 直結するため、呼び出し側は明示指定を推奨）。
   */
  enableInterrogativeUpspeak?: boolean;
}

/**
 * オブジェクトのキーをコードポイント順（デフォルトの文字列比較）で再帰的に並べ替える。
 * spike-hash-logic-2026-07-09.md §2「ノーマライズ JSON の正規化仕様」の移植。
 * 配列は本ハッシュ入力（text / voicevox_speaker_id / synthesis_params / upspeak フラグ）には
 * 現れないため、配列要素の再帰処理は Spike 同様に保持しつつも実質使用されない。
 */
function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  const record = value as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    result[key] = canonicalize(record[key]);
  }
  return result;
}

/**
 * design §4.2 の内容ハッシュを算出する（SHA-256 先頭 {@link CONTENT_HASH_DIGITS} 桁、16進）。
 */
export function computeContentHash(input: ContentHashInput): string {
  const {
    text,
    voicevoxSpeakerId,
    synthesisParams = FIXED_SYNTHESIS_PARAMS,
    enableInterrogativeUpspeak = ENABLE_INTERROGATIVE_UPSPEAK,
  } = input;

  const canonical = canonicalize({
    text,
    voicevox_speaker_id: voicevoxSpeakerId,
    synthesis_params: synthesisParams,
    enable_interrogative_upspeak: enableInterrogativeUpspeak,
  });
  const json = JSON.stringify(canonical);
  const fullHash = createHash("sha256").update(json, "utf8").digest("hex");
  return fullHash.slice(0, CONTENT_HASH_DIGITS);
}
