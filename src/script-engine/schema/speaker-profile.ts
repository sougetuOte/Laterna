/**
 * script-engine — 話者プロファイルの型定義
 *
 * 出自: docs/specs/script-engine/design.md §3（話者プロファイル設計）, §4.2（VOICEVOX 合成パラメータ）
 * 対応タスク: docs/specs/script-engine/tasks.md W1-script-engine-T7
 *
 * `docs/conventions/speaker-profiles.yaml`（W1-script-engine-T20 成果物）の
 * TypeScript equivalent。実ファイルは design §3.1 のコードスニペットに加えて
 * `credit`（クレジット表記、design §7.5 が要求する自動生成の出所）と
 * `schema_version`（トップレベル）を持つため、本型はその実体に合わせている
 * （design §3.1 のコード例そのものの逐語写しではない点に注意、下記 JSDoc に明記）。
 */

/** design §3.3: 立ち絵アセットの論理キー参照（実ファイルパスへの解決は §11.3 の配置規約） */
export interface SpeakerPortrait {
  /** 実ファイル: public/portraits/<asset_key>.png（commit 対象、design §11.1/§11.3） */
  asset_key: string;
}

/**
 * design §3.1: 話者プロファイル 1 件分。
 *
 * `credit` は design §3.1 のコードスニペットには現れないが、design §7.5
 * （クレジット表示は「speaker-profiles.yaml のクレジット表記から自動生成する」）が
 * 参照する実データであり、実ファイル `docs/conventions/speaker-profiles.yaml` にも
 * 存在するフィールドのため、本型に含める。
 */
export interface SpeakerProfile {
  /** design §3.1: VOICEVOX の話者 ID（例: narrator=11 玄野武宏、listener=3 ずんだもん） */
  voicevox_speaker_id: number;
  display_name: string;
  portrait: SpeakerPortrait;
  /**
   * design §3.1: 尺予測式（§9.1）専用の基準係数。VOICEVOX synthesis の speedScale 等
   * （§4.2 の固定定数）とは別物であり、混同しないこと（design 原文の注記通り）。
   */
  speech_rate_factor: number;
  /**
   * design §7.5 由来（クレジット表記の出所）。design §3.1 のコード例には明記されていないが
   * 実ファイルに存在するフィールドのため型に含める（本 JSDoc 冒頭の注記参照）。
   */
  credit?: string;
}

/**
 * design §3.2: `docs/conventions/speaker-profiles.yaml` 全体の構造
 * （プロジェクト共通の分離ファイル、台本ファイルは `speaker_profile_ref` で参照）。
 *
 * `schema_version` は実ファイルのトップレベルに存在するが design §3.1 のコード
 * スニペットには明記されていない（timeline manifest の schema_version、§4.3 と
 * 同型のバージョニング目的と推定）。
 */
export interface SpeakersRegistry {
  schema_version?: number;
  speakers: Record<string, SpeakerProfile>;
}

/**
 * design §3.2: 台本固有の話者パラメータ上書き対象フィールドの予約型。
 * 「`speaker_overrides` が上書き可能なのは `speech_rate_factor` 等の尺予測系フィールドに限る」
 * （design 原文）。実装（適用ロジック）は見送り可、型のみ予約する（YAGNI）。
 *
 * // UNRESOLVED: design は「speech_rate_factor 等」と記載するのみで、
 * // 上書き対象となりうる他のフィールドを列挙していない。ここでは design が
 * // 名指しした唯一のフィールドのみを型に含め、他は推測で追加していない。
 */
export interface SpeakerOverrides {
  speech_rate_factor?: number;
}

/**
 * design §4.2: VOICEVOX 合成パラメータ。v1 では台本・話者プロファイルいずれからも
 * 上書き不可の固定定数として一元定義する MUST（内容ハッシュ算入対象、§4.2）。
 */
export interface SynthesisParams {
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
}

/**
 * design §4.2 で確定した固定定数値。
 * `speedScale=1.0` / `pitchScale=0.0` / `intonationScale=1.0`。
 * 内容ハッシュ算出（compiler/synthesize.ts、T-後続タスク）はこの定数をそのまま算入する。
 */
export const FIXED_SYNTHESIS_PARAMS: Readonly<SynthesisParams> = Object.freeze({
  speedScale: 1.0,
  pitchScale: 0.0,
  intonationScale: 1.0,
});

/**
 * design §4.2 v3.2（2026-07-10 追記）MUST: `/synthesis` 呼び出しの `enable_interrogative_upspeak`
 * 実値と、内容ハッシュ算入要素（`compiler/content-hash.ts`）の値は必ず一致させること。
 * 単一 SSOT として本定数を両モジュールが import する（値がずれると「疑問文 WAV が変わったのに
 * ハッシュ不変」という design §4.2 が警告する事故に直結するため、構造的にずれを防ぐ）。
 * 値は `true`（Engine デフォルト値への暗黙依存を避けるため `/synthesis` 呼び出し時に明示指定する）。
 */
export const ENABLE_INTERROGATIVE_UPSPEAK = true as const;
