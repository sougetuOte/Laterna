/**
 * script-engine — 台本 YAML の型定義 + パーサ実装
 *
 * 出自: docs/specs/script-engine/design.md §2（台本スキーマ設計）
 * 対応タスク: docs/specs/script-engine/tasks.md W1-script-engine-T7（型定義）/
 *   W2-script-engine-T8（parseScriptDocument 実装）
 *
 * 本ファイルは型定義に加え、パース済み（js-yaml 等でデシリアライズ済み）の生オブジェクトを
 * 受け取ってスキーマ検証を行う `parseScriptDocument()` を提供する。ファイル読込・YAML
 * デシリアライズ自体は `src/script-engine/compiler/parse.ts` が担当し（design §4.1
 * パイプライン第 1 段階）、本ファイルの `parseScriptDocument` はファイル I/O を持たない
 * 純粋な検証関数として分離している（ファイルなしで単体テストしやすくするため）。
 *
 * バリデーション規則の一次情報源:
 * - pause_before / pause_after 負値禁止: design §2.3（W2-script-engine-T8 完了条件）
 * - component レジストリ未登録の fail-fast: design §2.6 / §4.4
 * - 孤児参照 ID（`slide_events[].anchor.utterance` / `slide_events[].slide` が
 *   存在しない ID を参照）: design §4.4
 * - 発話 id / スライド id / slide_events id の重複禁止: W2-script-engine-T8 完了条件 +
 *   2026-07-10 HGA W-7（slide_events id 拡張）
 * - 話者役割が 2 名超: design §4.4（v1 は 2 話者固定）
 * - `props` の JSON 直列化可能性: design §2.6 MUST
 * - `slide_events[].anchor.offset` の負値禁止: design §2.4「offset（秒、0 以上）」/
 *   2026-07-10 HGA W-1・I-9 裁定（fail-fast 化）
 * - `target_duration_range` の min > max・負値禁止: 2026-07-10 HGA W-1・I-9 裁定
 *
 * 未実装（T8 スコープ外）:
 * - `slide_events` の frame 単調増加・`total_duration_frames` 超過禁止（design §5.3）。
 *   frame 変換は timeline manifest 生成フェーズ（T9 以降）の成果物に依存するため、
 *   utterance/slide が生の YAML のままの parse 段階では対象外
 */

import type { SpeakerOverrides } from "./speaker-profile";
import {
  REGISTERED_COMPONENT_NAMES,
  isRegisteredComponentName,
} from "../shared/component-names";

/**
 * JSON 直列化可能な値のみ（design §2.6 MUST）。
 * エスケープハッチ（svg-ref / custom）の `props` はこの型に限定される。
 * 関数・Symbol・循環参照・ReactNode は台本から渡せない制約と対応する。
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * design §8.2: PDF 出力時の表示制御。省略時 "visible"。
 * "hidden" は相槌等、PDF では読解ノイズになる短い発話単位を除外するために使う。
 */
export type PdfVisibility = "visible" | "hidden";

/**
 * design §2.2: 発話単位（Utterance）。
 */
export interface Utterance {
  /** 安定 ID（MUST、FR-1）。挿入・削除で他発話の参照が壊れないための基盤 */
  id: string;
  /**
   * 話者役割名（speaker-profiles.yaml の役割名キーへの参照）。
   * 台本本文に speaker_id や実名を書くことは MUST NOT（FR-2、design §2.2）
   */
  speaker: string;
  /** ブロックスカラー本文。VOICEVOX audio_query への入力であり PDF 出力にも流用（§8） */
  text: string;
  /** 秒。省略時デフォルト 0（間なし） */
  pause_before?: number;
  /**
   * 秒。省略時デフォルト 0。負値は MUST NOT（design §2.3）。
   * バリデーションの実装は T8（parse 段の fail-fast エラー）。
   */
  pause_after?: number;
  /** PDF 出力時の表示制御。省略時 "visible"（design §8.2） */
  pdf_visibility?: PdfVisibility;
}

/** design §2.4: スライドイベントのアンカー種別（発話境界の start/end） */
export type SlideAnchorPosition = "start" | "end";

/**
 * design §2.4: スライドイベントのアンカー指定。
 * 「どの発話境界からの相対位置か」を宣言する（FR-4 対応）。
 */
export interface SlideEventAnchor {
  /** アンカーとなる発話の id（Utterance.id への参照） */
  utterance: string;
  /** 発話開始 or 終了を基準とするか */
  position: SlideAnchorPosition;
  /** 秒、0 以上（design §2.4「offset（秒、0 以上）」） */
  offset: number;
}

/**
 * design §2.4: スライドイベント（発話単位とは独立したリストとして台本に宣言する）。
 * 発話⇔スライドの多対多対応を表現するための基盤（§2.4 却下代替案: 発話への slide_id 直埋め込み）。
 */
export interface SlideEvent {
  id: string;
  /** slides セクションで定義されたスライド ID（Slide.id への参照） */
  slide: string;
  anchor: SlideEventAnchor;
}

/** design §2.5: v1 標準スライドタイプ 4 種 + エスケープハッチ 1 種（§2.6） */
export type SlideType = "title" | "bullets" | "code" | "svg-ref" | "custom";

/**
 * 全 Slide 種別共通のベースフィールド。
 * `background` は design §2.6「slides 要素には任意の background フィールドを追加 MAY
 * （省略時は既定背景を使用）」より、スライド種別によらず共通で許容される。
 */
export interface SlideBase {
  id: string;
  /** 任意。色コード文字列（省略時は既定背景、design §2.6 MAY） */
  background?: string;
}

/**
 * design §2.5 / §6.3: 章扉・Section 相当。
 * レンダラ契約（§6.3）: `<Section title=... subtitle=... />` に委譲。
 */
export interface TitleSlide extends SlideBase {
  type: "title";
  title: string;
  subtitle?: string;
}

/**
 * design §2.5 / §2.6 / §6.3: 箇条書きスライド。
 * `items` 各要素には `**text**`（bold のみ、design §2.6 MAY）のインライン強調を許容。
 */
export interface BulletsSlide extends SlideBase {
  type: "bullets";
  title?: string;
  items: string[];
}

/**
 * design §2.5 / §6.3: コードブロック表示（v1 はハイライトなしの等幅表示）。
 *
 * `code` フィールド名は design §2.6 に具体的な YAML 例が無く、§6.3 のレンダラ疑似コード
 * `"code" -> <Slide title=... body={<pre>{code}</pre>} />` の変数名から採った直接的な帰結。
 * シンタックスハイライト用の `language` 等は design が明示的に「将来候補」としており v1 では持たない。
 */
export interface CodeSlide extends SlideBase {
  type: "code";
  title?: string;
  code: string;
}

/**
 * design §2.6: 標準コンポーネントレジストリ参照（Iceberg / Flowchart / Citation 等）。
 * `component` は src/script-engine/shared/component-names.ts の正規リストに存在する MUST
 * （compile 時 fail-fast、実装は T8/後続タスクのスコープ）。
 */
export interface SvgRefSlide extends SlideBase {
  type: "svg-ref";
  component: string;
  /** JSON 直列化可能な値のみ（design §2.6 MUST） */
  props?: Record<string, JsonValue>;
}

/**
 * design §2.6: 教材固有のワンオフ演出コンポーネント参照。
 * スキーマ処理は svg-ref と同一（運用上の区別のみ、design §2.6）。
 */
export interface CustomSlide extends SlideBase {
  type: "custom";
  component: string;
  props?: Record<string, JsonValue>;
}

/** design §2.5 / §2.6: スライド定義の判別共用体 */
export type Slide =
  | TitleSlide
  | BulletsSlide
  | CodeSlide
  | SvgRefSlide
  | CustomSlide;

/**
 * design §3.2: 台本ファイルのメタデータ（tasks.md でいう ScriptConfig ≒ FrontMatter）。
 *
 * 「目標尺レンジ」のキー名は design §2 に例示がないが、承認済み tasks.md v3 の
 * W2-script-engine-T9（「台本の `target_duration_range` フィールド（例: { min: 600, max: 900 }）」）
 * および W15-script-engine-T24（`target_duration_range: { min: 60, max: 105 }`、T24 実測 100.8 秒に
 * 基づく 2026-07-11 ユーザー裁定 (b) で再較正済み、design §9.2）に具体形が明記されているため、
 * これを正として採用（L1 裁定 2026-07-09）。design §2 への反映は T24 の FR-9 フィードバック経路
 * （軽微 → design §13 更新）で同期する。
 */
export interface ScriptConfig {
  /**
   * tasks.md T9/T24: 目標尺レンジ（秒）。estimate（T9）が予測尺と比較し
   * ±15%/±25% の警告閾値判定（design §9.2-9.3）に使用する。
   */
  target_duration_range?: { min: number; max: number };
  /**
   * design §3.2: 話者プロファイル参照（docs/conventions/speaker-profiles.yaml 内のプロファイル名）。
   * 例: "default"
   */
  speaker_profile_ref: string;
  /**
   * design §3.2: 台本固有の話者パラメータ上書き（YAGNI、型のみ予約・実装は見送り可）。
   * キーは話者役割名（speaker-profiles.yaml の speakers キーと対応）と推定されるが、
   * design はオブジェクト全体の構造（フラット/役割名キー別）を明示していない。
   * // UNRESOLVED: design §3.2 は「台本内 speaker_overrides セクション」とのみ言及し、
   * // 役割名キー別か単一オブジェクトかの構造を明示しない。ここでは役割名キー別と仮定した。
   */
  speaker_overrides?: Record<string, SpeakerOverrides>;
  /**
   * Laterna 追加（2026-09-26、Wave 2）: 話者以外のクレジット行（例: 立ち絵の出所）。
   * compile が manifest `credits[]` の末尾に初出順・重複なしで足す（`src/script-engine/compiler/manifest.ts`）。
   */
  extra_credits?: string[];
}

/**
 * design §2 全体: 台本ファイル（`.script.yaml`）1 件のトップレベル構造。
 * ファイル配置は `content/scripts/<script-id>.script.yaml`（design §11.1）。
 */
export interface ScriptDocument extends ScriptConfig {
  utterances: Utterance[];
  slides: Slide[];
  slide_events: SlideEvent[];
}

// ============================================================================
// 内部ヘルパー（フィールド単位の型ガード + フィールドパス付きエラーメッセージ生成）
// ============================================================================
// エラーメッセージは tasks.md W2-script-engine-T8 完了条件の記法
// （「✗ エラーメッセージ表示して処理停止」）に倣い、全て "✗ " を先頭に付す。

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, fieldPath: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`✗ 必須フィールド ${fieldPath} が文字列として指定されていません`);
  }
  return value;
}

function optionalString(value: unknown, fieldPath: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`✗ フィールド ${fieldPath} は文字列である必要があります`);
  }
  return value;
}

function requireArray(value: unknown, fieldPath: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`✗ 必須フィールド ${fieldPath} が配列として指定されていません`);
  }
  return value;
}

function requireNumber(value: unknown, fieldPath: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`✗ 必須フィールド ${fieldPath} が数値として指定されていません`);
  }
  return value;
}

/**
 * design §2.4「offset（秒、0 以上）」MUST（2026-07-10 HGA W-1/I-9 裁定: fail-fast 化）。
 * `pause_before`/`pause_after` の {@link optionalNonNegativeNumber} と異なり offset は必須フィールド。
 */
function requireNonNegativeNumber(value: unknown, fieldPath: string): number {
  const num = requireNumber(value, fieldPath);
  if (num < 0) {
    throw new Error(`✗ フィールド ${fieldPath} に負値は指定できません（design §2.4）: ${num}`);
  }
  return num;
}

/** design §2.3: pause_before / pause_after は 0 以上の数値。負値は MUST NOT */
function optionalNonNegativeNumber(
  value: unknown,
  fieldPath: string,
): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`✗ フィールド ${fieldPath} は数値である必要があります`);
  }
  if (value < 0) {
    throw new Error(
      `✗ フィールド ${fieldPath} に負値は指定できません（design §2.3）: ${value}`,
    );
  }
  return value;
}

function parsePdfVisibility(
  value: unknown,
  fieldPath: string,
): PdfVisibility | undefined {
  if (value === undefined) return undefined;
  if (value !== "visible" && value !== "hidden") {
    throw new Error(
      `✗ フィールド ${fieldPath} は "visible" または "hidden" である必要があります: ${String(value)}`,
    );
  }
  return value;
}

/** design §2.6 MUST: props は JSON 直列化可能な値のみ（関数・Symbol・循環参照等を拒否） */
function assertJsonValue(value: unknown, fieldPath: string): JsonValue {
  if (value === null) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item, i) => assertJsonValue(item, `${fieldPath}[${i}]`));
  }
  // isPlainObject だけでは Date 等（js-yaml の DEFAULT_SCHEMA は ISO 日付風スカラーを
  // Date インスタンスへ暗黙変換する）を通してしまうため、prototype が Object.prototype
  // （または null）であることまで確認する（design §2.6 MUST の JSON 直列化可能性）
  if (isPlainObject(value) && Object.getPrototypeOf(value) === Object.prototype) {
    const result: { [key: string]: JsonValue } = {};
    for (const [key, v] of Object.entries(value)) {
      result[key] = assertJsonValue(v, `${fieldPath}.${key}`);
    }
    return result;
  }
  throw new Error(
    `✗ フィールド ${fieldPath} は JSON 直列化可能な値である必要があります（design §2.6 MUST）: ${String(value)}`,
  );
}

function assertUniqueIds(ids: string[], fieldPath: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`✗ ${fieldPath} に重複した ID があります: "${id}"`);
    }
    seen.add(id);
  }
}

// ============================================================================
// Utterance / Slide / SlideEvent の parse
// ============================================================================

function parseUtterance(raw: unknown, index: number): Utterance {
  if (!isPlainObject(raw)) {
    throw new Error(`✗ utterances[${index}] がオブジェクトではありません`);
  }
  const id = requireString(raw.id, `utterances[${index}].id`);
  const speaker = requireString(raw.speaker, `utterances[${index}].speaker`);
  const text = requireString(raw.text, `utterances[${index}].text`);
  const pauseBefore = optionalNonNegativeNumber(
    raw.pause_before,
    `utterances[${index}].pause_before`,
  );
  const pauseAfter = optionalNonNegativeNumber(
    raw.pause_after,
    `utterances[${index}].pause_after`,
  );
  const pdfVisibility = parsePdfVisibility(
    raw.pdf_visibility,
    `utterances[${index}].pdf_visibility`,
  );

  const utterance: Utterance = { id, speaker, text };
  if (pauseBefore !== undefined) utterance.pause_before = pauseBefore;
  if (pauseAfter !== undefined) utterance.pause_after = pauseAfter;
  if (pdfVisibility !== undefined) utterance.pdf_visibility = pdfVisibility;
  return utterance;
}

function parseSlide(raw: unknown, index: number): Slide {
  if (!isPlainObject(raw)) {
    throw new Error(`✗ slides[${index}] がオブジェクトではありません`);
  }
  const id = requireString(raw.id, `slides[${index}].id`);
  const background = optionalString(raw.background, `slides[${index}].background`);
  const type = raw.type;
  if (typeof type !== "string") {
    throw new Error(`✗ slides[${index}].type が指定されていません`);
  }

  switch (type) {
    case "title": {
      const title = requireString(raw.title, `slides[${index}].title`);
      const subtitle = optionalString(raw.subtitle, `slides[${index}].subtitle`);
      const slide: TitleSlide = { id, type: "title", title };
      if (background !== undefined) slide.background = background;
      if (subtitle !== undefined) slide.subtitle = subtitle;
      return slide;
    }
    case "bullets": {
      const items = requireArray(raw.items, `slides[${index}].items`).map(
        (item, i) => requireString(item, `slides[${index}].items[${i}]`),
      );
      const title = optionalString(raw.title, `slides[${index}].title`);
      const slide: BulletsSlide = { id, type: "bullets", items };
      if (background !== undefined) slide.background = background;
      if (title !== undefined) slide.title = title;
      return slide;
    }
    case "code": {
      const code = requireString(raw.code, `slides[${index}].code`);
      const title = optionalString(raw.title, `slides[${index}].title`);
      const slide: CodeSlide = { id, type: "code", code };
      if (background !== undefined) slide.background = background;
      if (title !== undefined) slide.title = title;
      return slide;
    }
    case "svg-ref":
    case "custom": {
      const component = requireString(raw.component, `slides[${index}].component`);
      if (!isRegisteredComponentName(component)) {
        throw new Error(
          `✗ slides[${index}].component の "${component}" は component-names.ts に未登録です` +
            `（design §2.6 MUST、登録済み: ${REGISTERED_COMPONENT_NAMES.join(", ")}）`,
        );
      }
      const props =
        raw.props === undefined
          ? undefined
          : (assertJsonValue(raw.props, `slides[${index}].props`) as Record<
              string,
              JsonValue
            >);
      const slide: SvgRefSlide | CustomSlide = { id, type, component };
      if (background !== undefined) slide.background = background;
      if (props !== undefined) slide.props = props;
      return slide;
    }
    default:
      throw new Error(
        `✗ slides[${index}].type が未知のスライド種別です` +
          `（title/bullets/code/svg-ref/custom のいずれか）: ${String(type)}`,
      );
  }
}

function parseSlideEventAnchor(raw: unknown, fieldPath: string): SlideEventAnchor {
  if (!isPlainObject(raw)) {
    throw new Error(`✗ ${fieldPath} がオブジェクトではありません`);
  }
  const utterance = requireString(raw.utterance, `${fieldPath}.utterance`);
  const position = raw.position;
  if (position !== "start" && position !== "end") {
    throw new Error(
      `✗ ${fieldPath}.position は "start" または "end" である必要があります: ${String(position)}`,
    );
  }
  const offset = requireNonNegativeNumber(raw.offset, `${fieldPath}.offset`);
  return { utterance, position, offset };
}

function parseSlideEvent(raw: unknown, index: number): SlideEvent {
  if (!isPlainObject(raw)) {
    throw new Error(`✗ slide_events[${index}] がオブジェクトではありません`);
  }
  const id = requireString(raw.id, `slide_events[${index}].id`);
  const slide = requireString(raw.slide, `slide_events[${index}].slide`);
  const anchor = parseSlideEventAnchor(raw.anchor, `slide_events[${index}].anchor`);
  return { id, slide, anchor };
}

/**
 * design §4.4 v3.7（HGA W-1 対応）: v1 が受理する話者役割名（§7 で narrator/listener の 2 役割固定）。
 * 正本はここ 1 つ。parse 時の fail-fast が主経路で、`compiler/manifest.ts` の `resolveSpeakers` と
 * `pdf/script-pdf-manifest.ts` も同じ集合を import して二重に守る。
 */
export const KNOWN_SPEAKER_ROLES: ReadonlySet<string> = new Set(["narrator", "listener"]);

// ============================================================================
/**
 * Laterna 追加（2026-09-26）: `extra_credits`（任意）。文字列の配列で、空文字は不可。
 */
function parseExtraCredits(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  const items = requireArray(value, "extra_credits").map((item, i) =>
    requireString(item, `extra_credits[${i}]`),
  );
  items.forEach((item, i) => {
    if (item.trim() === "") {
      throw new Error(`✗ フィールド extra_credits[${i}] が空文字です`);
    }
  });
  return items;
}

// ScriptConfig 側フィールド（target_duration_range / speaker_overrides）の parse
// ============================================================================

function parseTargetDurationRange(
  value: unknown,
): { min: number; max: number } | undefined {
  if (value === undefined) return undefined;
  if (!isPlainObject(value)) {
    throw new Error("✗ フィールド target_duration_range はオブジェクトである必要があります");
  }
  const min = requireNumber(value.min, "target_duration_range.min");
  const max = requireNumber(value.max, "target_duration_range.max");
  // 2026-07-10 HGA W-1 裁定: min > max / 負値は fail-fast エラー（design §2 目標尺レンジの整合性）
  if (min < 0) {
    throw new Error(
      `✗ フィールド target_duration_range.min に負値は指定できません: ${min}`,
    );
  }
  if (max < 0) {
    throw new Error(
      `✗ フィールド target_duration_range.max に負値は指定できません: ${max}`,
    );
  }
  if (min > max) {
    throw new Error(
      `✗ フィールド target_duration_range は min(${min}) <= max(${max}) である必要があります`,
    );
  }
  return { min, max };
}

function parseSpeakerOverrides(
  value: unknown,
): Record<string, SpeakerOverrides> | undefined {
  if (value === undefined) return undefined;
  if (!isPlainObject(value)) {
    throw new Error("✗ フィールド speaker_overrides はオブジェクトである必要があります");
  }
  const result: Record<string, SpeakerOverrides> = {};
  for (const [role, override] of Object.entries(value)) {
    if (!isPlainObject(override)) {
      throw new Error(`✗ speaker_overrides.${role} はオブジェクトである必要があります`);
    }
    const speechRateFactor =
      override.speech_rate_factor === undefined
        ? undefined
        : requireNumber(
            override.speech_rate_factor,
            `speaker_overrides.${role}.speech_rate_factor`,
          );
    const entry: SpeakerOverrides = {};
    if (speechRateFactor !== undefined) entry.speech_rate_factor = speechRateFactor;
    result[role] = entry;
  }
  return result;
}

/**
 * 台本 YAML の parse + バリデーションのエントリポイント。
 *
 * デシリアライズ済み（js-yaml `load()` 等を通した）生オブジェクトを受け取り、
 * design §2 の型定義に基づくスキーマ検証を行った上で `ScriptDocument` を返す。
 * バリデーション規則は本ファイル冒頭の JSDoc（一次情報源一覧）を参照。
 *
 * @param raw - YAML パーサ（js-yaml 等、選定は `src/script-engine/compiler/parse.ts`）
 *   から得られる生オブジェクト
 * @throws 必須フィールド欠落・型不一致・負値・孤児参照・未登録コンポーネント名・
 *   3 話者超過・id 重複のいずれかを検出した場合（design §4.4、全て fail-fast）
 */
export function parseScriptDocument(raw: unknown): ScriptDocument {
  if (!isPlainObject(raw)) {
    throw new Error("✗ 台本ドキュメントのトップレベルがオブジェクトではありません");
  }

  const speakerProfileRef = requireString(
    raw.speaker_profile_ref,
    "speaker_profile_ref",
  );
  const targetDurationRange = parseTargetDurationRange(raw.target_duration_range);
  const speakerOverrides = parseSpeakerOverrides(raw.speaker_overrides);
  const extraCredits = parseExtraCredits(raw.extra_credits);

  const utterances = requireArray(raw.utterances, "utterances").map((u, i) =>
    parseUtterance(u, i),
  );
  const slides = requireArray(raw.slides, "slides").map((s, i) =>
    parseSlide(s, i),
  );
  const slideEvents = requireArray(raw.slide_events, "slide_events").map(
    (e, i) => parseSlideEvent(e, i),
  );

  assertUniqueIds(
    utterances.map((u) => u.id),
    "utterances[].id",
  );
  assertUniqueIds(
    slides.map((s) => s.id),
    "slides[].id",
  );
  // 2026-07-10 HGA W-7 裁定: slide_events[].id の重複も utterances/slides と同様に fail-fast
  assertUniqueIds(
    slideEvents.map((e) => e.id),
    "slide_events[].id",
  );

  const utteranceIdSet = new Set(utterances.map((u) => u.id));
  const slideIdSet = new Set(slides.map((s) => s.id));

  slideEvents.forEach((event, index) => {
    if (!utteranceIdSet.has(event.anchor.utterance)) {
      throw new Error(
        `✗ slide_events[${index}].anchor.utterance が参照する発話 ID "${event.anchor.utterance}" ` +
          `が存在しません（孤児参照、design §4.4）`,
      );
    }
    if (!slideIdSet.has(event.slide)) {
      throw new Error(
        `✗ slide_events[${index}].slide が参照するスライド ID "${event.slide}" ` +
          `が存在しません（孤児参照、design §4.4）`,
      );
    }
  });

  const speakerRoles = new Set(utterances.map((u) => u.speaker));
  if (speakerRoles.size > 2) {
    throw new Error(
      `✗ 台本が参照する話者役割が 2 名を超えています（v1 は 2 話者固定、design §4.4）: ` +
        `${[...speakerRoles].join(", ")}`,
    );
  }
  // design §4.4 v3.7（HGA W-1 対応）MUST: 役割名は narrator/listener 以外を許容しない。
  // 未知役割名は render 段で立ち絵カラム消失・強調無効の無警告描画となるため、VOICEVOX 実合成
  // （時間 + WAV 書き込み）まで進んでから manifest 生成時に落ちるのではなく、parse 時点で
  // fail-fast する（監査前軽量レビュー対応: 孤児 WAV 残留の主経路を塞ぐ）。
  for (const role of speakerRoles) {
    if (!KNOWN_SPEAKER_ROLES.has(role)) {
      throw new Error(
        `✗ 話者役割名 "${role}" は v1 が受理する役割名（narrator / listener）の` +
          `いずれでもありません（design §4.4 v3.7 MUST、HGA W-1 対応）: v1 のレイアウトは 2 役割固定` +
          `（design §7）であり、未知役割は render 段で立ち絵カラム消失・強調無効の無警告描画となる` +
          `ため parse で停止します`,
      );
    }
  }

  const document: ScriptDocument = {
    speaker_profile_ref: speakerProfileRef,
    utterances,
    slides,
    slide_events: slideEvents,
  };
  if (targetDurationRange !== undefined) {
    document.target_duration_range = targetDurationRange;
  }
  if (speakerOverrides !== undefined) {
    document.speaker_overrides = speakerOverrides;
  }
  if (extraCredits !== undefined) {
    document.extra_credits = extraCredits;
  }
  return document;
}
