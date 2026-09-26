/**
 * script-engine — 話者プロファイル（speaker-profiles.yaml）読込 loader
 *
 * 出自: docs/specs/script-engine/design.md §3.2（配置・書式の決定）
 * 対応タスク: docs/specs/script-engine/tasks.md W2-script-engine-T9
 *   「speaker-profiles.yaml の読込 loader（design §3.2 の解決規則: v1 は
 *   docs/conventions/speaker-profiles.yaml 単一ファイル、未知プロファイル名は fail-fast エラー）を
 *   実装。loader の担務は本タスク（T9）とする（2026-07-10 L1 裁定: T9 が最初の利用者のため。
 *   T10 以降は同 loader を再利用）」
 *
 * v1 は台本ごとに複数のプロファイルファイルを持たず、`docs/conventions/speaker-profiles.yaml`
 * 単一ファイルのみを解決先とする（design §3.2「v1 では docs/conventions/speaker-profiles.yaml
 * 単一ファイルから解決する」）。台本側 `speaker_profile_ref` は将来の複数プロファイル対応を
 * 見据えた予約フィールドであり、v1 で有効な値は "default" のみ。それ以外の値は
 * 「未知のプロファイル名」として fail-fast エラーにする（design §3.2 MUST）。
 *
 * ファイル内の話者役割名（`speakers` のキー、例: narrator/listener）についても、台本の
 * `Utterance.speaker` が参照する役割が `speakers` に存在しない場合は「未知の話者役割」として
 * fail-fast エラーにする（design §4.4 と同様の方針。本ファイル `resolveSpeakerProfile` が担当）。
 *
 * スキーマ検証の深さについての裁定（2026-07-10 HGA W-3 裁定で更新）: 当初は `speakers`
 * フィールドの存在確認のみを行い、各話者プロファイルのフィールド単位の型検証は T9 スコープ外と
 * 判断していたが、HGA 敵対レビュー W-3（`voicevox_speaker_id`/`speech_rate_factor` の型検証欠落が
 * NaN の無音伝播を招く）を受け、`validateSpeakerProfile` によるフィールド単位検証を追加した。
 * `schema/script.ts` の `parseScriptDocument` ほど網羅的（JSON 直列化可能性チェック等）ではないが、
 * 尺予測・音声合成の入力として必須の 2 フィールドのみを fail-fast で検証する。
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { load } from "js-yaml";
import type { SpeakerProfile, SpeakersRegistry } from "../schema/speaker-profile";

/** v1 で唯一有効な `speaker_profile_ref` の値（design §3.2、単一ファイル構成のため） */
export const SUPPORTED_SPEAKER_PROFILE_REF = "default";

/** design §3.2 の配置規約: プロジェクト共通の話者プロファイル定義ファイル */
export const DEFAULT_SPEAKER_PROFILES_PATH = path.resolve(
  __dirname,
  "../../../docs/conventions/speaker-profiles.yaml",
);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 2026-07-10 HGA W-3 裁定: 各話者プロファイルの `voicevox_speaker_id`（number 必須）/
 * `speech_rate_factor`（number 必須・正値）を検証する。フィールド名の typo（欠落）・非数値・
 * YAML の値なしキー（null）を fail-fast エラーとして遮断する（design §3.1・§9.1 が前提とする
 * 尺予測式に NaN が無音で伝播する事故を防ぐ）。
 */
function validateSpeakerProfile(role: string, raw: unknown): void {
  if (raw === null || raw === undefined) {
    throw new Error(
      `✗ 話者プロファイル "${role}" が空です（speaker-profiles.yaml の値なしキー、design §3.1 必須フィールド欠落）`,
    );
  }
  if (!isPlainObject(raw)) {
    throw new Error(`✗ 話者プロファイル "${role}" がオブジェクトではありません`);
  }
  const speakerId = raw.voicevox_speaker_id;
  if (typeof speakerId !== "number" || Number.isNaN(speakerId)) {
    throw new Error(
      `✗ 話者プロファイル "${role}" の voicevox_speaker_id が数値として指定されていません` +
        `（design §3.1 必須）: ${JSON.stringify(speakerId)}`,
    );
  }
  const rateFactor = raw.speech_rate_factor;
  if (typeof rateFactor !== "number" || Number.isNaN(rateFactor)) {
    throw new Error(
      `✗ 話者プロファイル "${role}" の speech_rate_factor が数値として指定されていません` +
        `（design §3.1 必須）: ${JSON.stringify(rateFactor)}`,
    );
  }
  if (rateFactor <= 0) {
    throw new Error(
      `✗ 話者プロファイル "${role}" の speech_rate_factor は正値である必要があります（design §3.1）: ${rateFactor}`,
    );
  }
}

/**
 * speaker-profiles.yaml を読込・パースし `SpeakersRegistry` として返す。
 *
 * @param profileRef - 台本側 `speaker_profile_ref` の値。v1 では
 *   {@link SUPPORTED_SPEAKER_PROFILE_REF}（"default"）のみ有効（design §3.2）
 * @param filePath - 読込対象ファイル（省略時 {@link DEFAULT_SPEAKER_PROFILES_PATH}。
 *   単体テストでの差し替え用）
 * @throws profileRef が "default" 以外、ファイル読込失敗、YAML 構文エラー、
 *   `speakers` フィールド欠落のいずれかの場合（全て fail-fast）
 */
export async function loadSpeakerProfiles(
  profileRef: string,
  filePath: string = DEFAULT_SPEAKER_PROFILES_PATH,
): Promise<SpeakersRegistry> {
  if (profileRef !== SUPPORTED_SPEAKER_PROFILE_REF) {
    throw new Error(
      `✗ 未知のプロファイル名です（v1 は "${SUPPORTED_SPEAKER_PROFILE_REF}" のみ対応、design §3.2）: "${profileRef}"`,
    );
  }

  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (error) {
    throw new Error(
      `✗ 話者プロファイルファイルの読込に失敗しました: ${filePath}（${(error as Error).message}）`,
    );
  }

  let parsed: unknown;
  try {
    parsed = load(raw);
  } catch (error) {
    throw new Error(
      `✗ 話者プロファイルファイルの YAML 構文エラー: ${filePath}（${(error as Error).message}）`,
    );
  }

  if (!isPlainObject(parsed) || !isPlainObject(parsed.speakers)) {
    throw new Error(
      `✗ 話者プロファイルファイルに必須フィールド speakers がありません: ${filePath}`,
    );
  }

  // 2026-07-10 HGA W-3 裁定: フィールド単位の型検証を追加（本ファイル冒頭 JSDoc の
  // 旧裁定「フィールド単位の型検証は T9 スコープ外」を更新し、NaN 無音伝播を遮断する）
  for (const [role, profile] of Object.entries(parsed.speakers)) {
    validateSpeakerProfile(role, profile);
  }

  return parsed as unknown as SpeakersRegistry;
}

/**
 * 話者役割名（`Utterance.speaker`）から `SpeakerProfile` を解決する。
 * design §4.4 と同様の fail-fast 方針（未知話者役割は compile エラー）。
 *
 * @throws speakerRole が registry.speakers に存在しない場合
 */
export function resolveSpeakerProfile(
  registry: SpeakersRegistry,
  speakerRole: string,
): SpeakerProfile {
  const profile = registry.speakers[speakerRole];
  if (profile === undefined) {
    throw new Error(
      `✗ 未知の話者役割です（speaker-profiles.yaml の speakers に存在しません）: "${speakerRole}"`,
    );
  }
  return profile;
}
