// W3-script-engine-T13 本実装（SPIKE 暫定 SpikeScriptComposition.tsx を置換）。
// W3-script-engine-T14（2026-07-11）でスライド実レンダリングを接合。
// W3-script-engine-T15（2026-07-12）で 3 カラムレイアウト・話者強調表示・クレジット区間を接合。
//
// design.md §6.1 calculateMetadata 二段構成 / §6.2 WAV 実測方式 / §6.4 Audio 多数化（v1 は
// 対処なし、Sequence のマウント範囲外自動非レンダリングに依存）に基づく汎用 Composition。
//
// スライド表示は ScriptSlideRenderer（T14）へ委譲する。2 話者レイアウト（design §7）・
// 話者強調表示（design §3.3）は SpeakerPortrait（T15）へ、末尾クレジット区間（design §7.5）は
// CreditSection（T15）へそれぞれ委譲する。

import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { resolveManifest } from "../script-engine/render/manifest-registry";
import { componentRegistry } from "../script-engine/render/component-registry";
import { ScriptSlideRenderer } from "../script-engine/render/ScriptSlideRenderer";
import { SpeakerPortrait } from "../script-engine/render/SpeakerPortrait";
import { CreditSection } from "../script-engine/render/CreditSection";
import type {
  ManifestSlideEvent,
  ManifestUtterance,
  TimelineManifest,
} from "../script-engine/schema/timeline-manifest";
import type { Slide } from "../script-engine/schema/script";

/**
 * design §7.5: クレジット区間の尺（秒）。fps が異なる場合は 3 秒相当を fps から算出する
 * （`Math.round(CREDIT_REGION_SECONDS * manifest.fps)`）。compiler 側（`compiler/manifest.ts`
 * `CREDIT_REGION_SECONDS`）と同一値だが、compiler モジュールは Node 専用（`node:fs` 等に依存）で
 * ブラウザ実行の render 側からは import できないため、値をここで独立して再定義する
 * （design §6.1「render 側の入力は manifest のみ」原則: 総尺算出ロジック自体を manifest 生成側と
 * render 側の 2 箇所に持つのではなく、区間長という定数のみを重複させる）。
 * `export` する理由: probe テスト（manifest-integrity.probe.test.ts / frame-boundary.probe.test.ts）が
 * compiler 側実値と本定数の実値を直接突合してドリフトを検知できるようにするため
 * （テストが両方の値を import できない場合、片方をハードコードリテラルで代用してしまい、
 * どちらか一方だけが変更された際の乖離を検知できなくなる）。
 */
export const CREDIT_REGION_SECONDS = 3;

export interface ScriptCompositionProps {
  scriptId: string;
  fps?: number;
  [key: string]: unknown;
}

export const calculateScriptMetadata = async ({
  props,
}: {
  props: ScriptCompositionProps;
}) => {
  const manifest = resolveManifest(props.scriptId);
  return {
    durationInFrames: manifest.total_duration_frames,
    fps: manifest.fps,
  };
};

/**
 * 現在 frame に対応するアクティブなスライドイベントを返す（design §5.3 MUST: `slide_events` の
 * frame 列は狭義単調増加）。`slideEvents` は `start_frame` 昇順にソート済みであることを前提とする
 * （manifest はこの前提を compile 時のバリデーションで担保する、design §5.3）。
 *
 * T14 でスライド実レンダラから再利用できるよう純関数として export する。
 */
export function findActiveSlideEvent(
  slideEvents: ManifestSlideEvent[],
  frame: number,
): ManifestSlideEvent | undefined {
  let active: ManifestSlideEvent | undefined;
  for (const event of slideEvents) {
    if (event.start_frame > frame) {
      break;
    }
    active = event;
  }
  return active;
}

/**
 * 現在 frame に発話中の話者役割名を返す（design §3.3: 発話中話者強調表示の判定区間は
 * `[start_frame, audio_end_frame)`。`pause_after` 込みの `end_frame` を上限にすると、
 * `pause_after` の無音区間でも立ち絵が光り続けてしまうため `audio_end_frame` を使う）。
 *
 * `manifest.utterances` は design §5.2 の累積秒アルゴリズムにより `start_frame` 昇順（自然に
 * 単調増加）であることを前提に、線形検索で十分（design §3.3: 発話数が数十〜百件規模のため）。
 * どの発話区間にも属さない frame（発話間の無音区間・末尾のクレジット区間等）は undefined を返す。
 *
 * T15 でスライド判定（{@link findActiveSlideEvent}）と対になる純関数として export する。
 */
export function findActiveSpeaker(
  utterances: ManifestUtterance[],
  frame: number,
): string | undefined {
  for (const utterance of utterances) {
    if (frame >= utterance.start_frame && frame < utterance.audio_end_frame) {
      return utterance.speaker;
    }
  }
  return undefined;
}

/**
 * `activeSlideEvent` が参照する slide を `manifest.slides[]` から解決する。
 *
 * defense-in-depth: compile 側（`compiler/manifest.ts` の `computeSlideEventFrames`）が
 * `slide_events[].slide` -> `slides[].id` の参照整合を fail-fast で保証しているため、正常経路では
 * ここで unresolved になることはない。ここで検出せず素通りすると activeSlide が undefined のまま
 * 中央カラムが無警告で空描画になり、視聴者・制作者の双方が原因不明のまま気付けない
 * （manifest-registry.ts / component-registry.ts の既存エラースタイルに合わせ、診断メッセージ付きで
 * throw する）。純関数として export し、hooks を介さずテストできるようにする。
 */
export function resolveActiveSlide(
  manifest: TimelineManifest,
  activeSlideEvent: ManifestSlideEvent | undefined,
  frame: number,
): Slide | undefined {
  if (!activeSlideEvent) {
    return undefined;
  }
  const slide = manifest.slides.find((s) => s.id === activeSlideEvent.slide);
  if (!slide) {
    throw new Error(
      `✗ ScriptComposition: slide_event "${activeSlideEvent.id}"（frame=${frame}）が参照する` +
        `スライド ID "${activeSlideEvent.slide}" が manifest.slides[] に見つかりません。` +
        `compile 側の参照整合チェックを回避した不整合 manifest の可能性があります。` +
        `"npm run compile:script -- ${manifest.script_id}" を再実行して manifest を再生成してください。`,
    );
  }
  return slide;
}

/**
 * design §6.3 v3.9（P-1）: 各 slide_event を frame 相対化のための `<Sequence>` 区間に変換する。
 * Remotion の `useCurrentFrame` は SequenceContext の offset を経由してのみ相対化されるため、
 * hooks を保有するスライド（title 型の Section フェード・Citation）を `<Sequence>` 祖先なしで
 * Composition 絶対 frame のまま描画するとフェードが機能しない（design §6.3 v3.9 P-1 裁定）。
 * 表示区間セマンティクスは {@link findActiveSlideEvent} と同一（次イベント開始まで表示、最終
 * イベントは `manifest.total_duration_frames` まで）に保つため、区間算出自体は
 * {@link resolveActiveSlide} を経由して同じ診断メッセージで unresolved 参照を検出する。
 * 純関数として export し、区間の隙間・重複・末尾整合をテストから直接検証できるようにする。
 */
export function computeSlideSequenceSpans(
  manifest: TimelineManifest,
): Array<{ event: ManifestSlideEvent; slide: Slide; from: number; durationInFrames: number }> {
  const events = manifest.slide_events;
  return events.map((event, index) => {
    const slide = resolveActiveSlide(manifest, event, event.start_frame) as Slide;
    const nextStart =
      index + 1 < events.length ? events[index + 1].start_frame : manifest.total_duration_frames;
    return {
      event,
      slide,
      from: event.start_frame,
      durationInFrames: nextStart - event.start_frame,
    };
  });
}

const ScriptCompositionInner: React.FC<{ manifest: TimelineManifest }> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const activeSpeakerRole = findActiveSpeaker(manifest.utterances, frame);
  const slideSpans = computeSlideSequenceSpans(manifest);

  // design §7: 役割名 → 画面上の左右位置の対応は固定（narrator=左、listener=右）。
  // 単一話者台本（design §7 の退化系）では該当ロールが manifest.speakers に存在しないため、
  // そのカラム自体を描画しない（flex: "1 1 auto" の中央カラムが自動的に空きを埋めて拡大する）。
  const narratorSpeaker = manifest.speakers.narrator;
  const listenerSpeaker = manifest.speakers.listener;

  // design §7.5: クレジット区間（末尾固定尺、独立区間として描画・オーバーレイ禁止）。
  const creditFrames = Math.round(CREDIT_REGION_SECONDS * manifest.fps);
  const creditFromFrame = manifest.total_duration_frames - creditFrames;

  return (
    <AbsoluteFill style={{ backgroundColor: "#101820" }}>
      {/* design §7 v3.8: 左 narrator（12%）/ 中央スライド（可変、両カラムあれば実質 80%）/
          右 listener（8%）の 3 カラムレイアウト（T16 試写・ユーザー裁定 2026-07-12 でカラム比を
          20/60/20 から 12/80/8 に変更、「立ち絵をより小さく、スライドをより大きく」）。
          片方の話者が manifest.speakers に無い場合はそのカラムを描画せず、
          中央カラム（flex: 1 1 auto）が空きを埋めて拡大する
          （design §7: 単一話者専用レイアウトコンポーネントの新設は行わない）。 */}
      <AbsoluteFill style={{ display: "flex", flexDirection: "row" }}>
        {narratorSpeaker && (
          <div style={{ flex: "0 0 12%", height: "100%" }}>
            <SpeakerPortrait
              portraitAssetKey={narratorSpeaker.portrait_asset_key}
              isActive={activeSpeakerRole === "narrator"}
              position="left"
            />
          </div>
        )}
        <div style={{ flex: "1 1 auto", height: "100%" }}>
          {/* frame 0 から最初の slide_event までの区間は design §5.4 の規定通り背景のみ
              （slideSpans が空、または最初の span の from > 0 の場合に該当）。
              design §6.3 v3.9（P-1）: 各スライドを `<Sequence>` で包んで frame を相対化する
              （`layout="none"` 必須。既定の absolute-fill ラッパーは非 positioned な本 div を
              突き抜けて画面全体基準になり 3 カラムレイアウトを壊すため）。React.createElement
              自体は hooks インライン化クラッシュ対策であり frame 相対化とは無関係
              （design §6.3 v3.9 の区別）。 */}
          {slideSpans.map((span) => (
            <Sequence
              key={span.event.id}
              layout="none"
              from={span.from}
              durationInFrames={span.durationInFrames}
            >
              {/* D-25 修正（design §7.2, tasks.md W0-mojibake-video-2-T3）: span.durationInFrames
                  （このスライドの <Sequence> ローカル尺）を Section へ渡すため第 4 引数として
                  明示する。省略すると Section が useVideoConfig() の Composition 全体尺に
                  フォールバックし、フェードアウトのフレーム相対性混用が再発する。 */}
              {ScriptSlideRenderer(span.slide, componentRegistry, manifest.fps, span.durationInFrames)}
            </Sequence>
          ))}
        </div>
        {listenerSpeaker && (
          <div style={{ flex: "0 0 8%", height: "100%" }}>
            <SpeakerPortrait
              portraitAssetKey={listenerSpeaker.portrait_asset_key}
              isActive={activeSpeakerRole === "listener"}
              position="right"
            />
          </div>
        )}
      </AbsoluteFill>
      {/* <Audio> の多数化対応（design §6.4: v1 は Sequence のマウント範囲外自動非レンダリングに依存し
          追加対処を行わない） */}
      {manifest.utterances.map((utterance) => (
        <Sequence
          key={utterance.id}
          from={utterance.start_frame}
          durationInFrames={utterance.audio_end_frame - utterance.start_frame}
        >
          <Audio src={staticFile(utterance.wav_path)} />
        </Sequence>
      ))}
      {/* design §7.5: 独立区間として末尾に描画（最終スライドへのオーバーレイではない）。
          CreditSection 自体が背景色付き全面 AbsoluteFill のため、JSX 順序上 3 カラムレイアウトより
          後（= 上のレイヤー）に置くだけで下のレイヤーを覆う。 */}
      <Sequence from={creditFromFrame} durationInFrames={creditFrames}>
        <CreditSection credits={manifest.credits} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const ScriptComposition: React.FC<ScriptCompositionProps> = ({ scriptId }) => {
  const manifest = resolveManifest(scriptId);
  return <ScriptCompositionInner manifest={manifest} />;
};
