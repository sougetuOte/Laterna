/**
 * script-engine — timeline manifest 型定義（TimelineManifest）
 *
 * 出自: docs/specs/script-engine/design.md §4.3（timeline manifest スキーマ）/
 *   §5.2-§5.4（frame 変換・総尺算出規約）/ §7.5（クレジット表示）
 * 対応タスク: docs/specs/script-engine/tasks.md W2-script-engine-T12 / W3-script-engine-T14（v3.5 slides 追加）
 *
 * 生成ロジックは `compiler/manifest.ts` が担当する。本ファイルは
 * `public/manifests/<script-id>.manifest.json` として書き出される JSON の構造そのものを
 * 表す型のみを持つ（design §6.1「manifest 生成ロジックを calculateMetadata 内部に持ち込まない」
 * の裏返しとして、型自体は render 側からも import 可能にするため schema/ 配下に置く）。
 *
 * **自己申告（spec に無い判断）**: tasks.md T12 は型の配置場所を明示しないが、
 * `render/manifest-registry.ts` は T4 Spike の暫定実装（`SpikeTimelineManifest`、
 * 「本実装は T13 で行う」と明記済み）であり正式な型を待つ状態のため、型の正本を schema/ 配下に
 * 置いた（T13 で manifest-registry.ts から本ファイルを import させる想定）。
 */

import type { Slide } from "./script";

/** design §4.3: 発話 1 件分の manifest レコード。 */
export interface ManifestUtterance {
  id: string;
  /** 話者役割名（`Utterance.speaker`、speaker-profiles.yaml のキーへの参照） */
  speaker: string;
  content_hash: string;
  /**
   * WAV ファイルへのパス（design §4.3 MUST: `audio/<script-id>/<ファイル名>` 形式の public/ 相対パス、
   * `/` 区切り固定）。T10 (`synthesize.ts`) が返す実絶対パスをそのまま記録するのではなく、
   * `compiler/manifest.ts` の `toPublicRelativeWavPath`（HGA C-1 裁定）が basename を取り出して
   * `audio/<script-id>/<basename>` に再構成してから記録する（絶対パスの焼き付きを避けるため。
   * manifest.test.ts:263-315 で検証済み）。
   */
  wav_path: string;
  /**
   * 秒。T11 (`measure.ts`) の WAV 実測値。
   * design §4.3（2026-07-10 HGA W-2 裁定）: 情報用フィールド（尺予測突合・デバッグ用）であり、
   * render 側がこれに fps を乗じて frame を再導出することは MUST NOT
   * （`start_frame`/`end_frame`/`audio_end_frame` の確定済み frame のみを正とする）。
   */
  duration_seconds: number;
  /**
   * 発話の音声再生開始 frame（design §5.2）。`pause_before` は `start_frame` の
   * **手前**に無音区間として既に配置済みであり、`start_frame` 自体は音声が鳴り始める位置を指す
   * （2026-07-12 HGA I-3 裁定: 「`pause_before` 込みの区間開始」という旧表現は `pause_before` が
   * `start_frame` に加算されているかのように読めるため、実装（`compiler/manifest.ts` の
   * `computeUtteranceTimings`: `cumSec += pause_before` の後に `start_sec` を確定する累積秒
   * アルゴリズム、design §5.2）と整合する表現に明確化）。
   */
  start_frame: number;
  /** `pause_after` 込みの区間終了 frame（design §4.3） */
  end_frame: number;
  /**
   * 音声実尺のみの終了 frame（`pause_after` を含まない、design §4.3）。
   * 話者強調表示（§3.3）の判定区間 `[start_frame, audio_end_frame)` に使う。
   */
  audio_end_frame: number;
}

/**
 * design §4.3 v3.6: 台本に登場した話者 1 名分の描画用情報（T15 着手時ギャップ裁定で追加）。
 * compile が speaker-profiles.yaml から登場話者分のみを焼き込む（credits と同じ選別規則）。
 */
export interface ManifestSpeaker {
  /**
   * 立ち絵の論理キー（`SpeakerProfile.portrait.asset_key`）。render 側は
   * `public/portraits/<portrait_asset_key>.png`（design §3.3 配置規約）で解決する。
   */
  portrait_asset_key: string;
  /** 将来の名前ラベル表示用の予約（T15 では未使用、design §4.3 v3.6） */
  display_name: string;
}

/** design §4.3: スライドイベント 1 件分の manifest レコード。 */
export interface ManifestSlideEvent {
  id: string;
  /** slides セクションで定義されたスライド ID（Slide.id への参照） */
  slide: string;
  start_frame: number;
}

/** design §4.3: timeline manifest（`public/manifests/<script-id>.manifest.json`）のトップレベル構造。 */
export interface TimelineManifest {
  /** design §4.3: 将来のモーラ配列追加等に備えたバージョニング（v1 は常に 1） */
  schema_version: 1;
  script_id: string;
  fps: number;
  /** design §4.3 R-1: `/version` から取得した VOICEVOX Engine のバージョン */
  voicevox_engine_version: string;
  utterances: ManifestUtterance[];
  slide_events: ManifestSlideEvent[];
  /**
   * design §4.3 v3.5: 台本の `slides[]` 宣言（§2.5-2.6 の `Slide` 型）を compile 時にそのまま焼き込む。
   * render 側の入力は manifest のみとする §6.1 の設計に従い（credits と同一原則）、render 側が
   * 台本 YAML を直接読む経路（webpack 設定変更 + ブラウザ側 parse）を作らない。`props` は JSON
   * 直列化可能値限定（§2.6 MUST）のため無損失で JSON 化できる。slides は content_hash 非算入
   * （§4.3 v3.5）のため、スライド変更は WAV 再合成を誘発しない。
   */
  slides: Slide[];
  /**
   * design §4.3 v3.6: 話者役割名 → 描画用話者情報のマップ（登場話者のみ、未使用話者は含めない）。
   * render が立ち絵 asset_key を得る唯一の経路（「render 側の入力は manifest のみ」原則の 3 例目、
   * credits・slides と同一原則）。speakers は content_hash 非算入のため、立ち絵差し替え・asset_key
   * 変更は WAV 再合成を誘発しない。
   */
  speakers: Record<string, ManifestSpeaker>;
  /**
   * design §7.5: 台本が使用した話者のクレジット表記一覧（speaker-profiles.yaml の `credit` から
   * 自動生成、未使用話者は含まない、初出順）。
   * **自己申告（spec に無い判断）**: design §4.3 の JSON 例には現れないフィールドだが、
   * §7.5 は「compile が構造的にクレジットを自動付与する」ことを MUST とし、Composition は
   * speaker-profiles.yaml を直接読めない設計（design §6.1）であるため、manifest 経由で渡す以外に
   * 経路がないと判断し追加した。
   */
  credits: string[];
  /** design §5.4 v3 一般則 + §7.5 クレジット区間込みの総 frame 数 */
  total_duration_frames: number;
}
