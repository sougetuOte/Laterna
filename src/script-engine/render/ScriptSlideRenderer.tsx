/**
 * script-engine — ScriptSlideRenderer 実装（標準スライドタイプ + エスケープハッチ）
 *
 * 出自: docs/specs/script-engine/design.md §6.3（標準スライド用レンダラ）/ §2.5-2.6（スライド型定義）
 * 対応タスク: docs/specs/script-engine/tasks.md W3-script-engine-T14
 *
 * design §6.3 の疑似コード（v3.7 改訂後、HGA C-1 対応で `registry[slide.component](slide.props)` の
 * 直接関数呼び出しは MUST NOT。呼び先コンポーネントの hooks が呼び出し元へインライン化され
 * "Rendered fewer/more hooks" クラッシュを起こすため、`React.createElement` による要素生成に改める。
 * frame 相対化（`useCurrentFrame`）は `<Sequence>` 祖先の有無のみで決まる別問題であり、
 * `ScriptComposition` 側の slide_event 単位 Sequence ラッパー（design §6.3 v3.9）が担う）:
 * ```
 * ScriptSlideRenderer(slide: Slide, registry: ComponentRegistry)
 *   switch (slide.type):
 *     "title"   -> <Section title=... subtitle=... />
 *     "bullets" -> <Slide title=... body={<ul>{items.map(li)}</ul>} />
 *     "code"    -> <Slide title=... body={<pre>{code}</pre>} />
 *     "svg-ref" | "custom" -> React.createElement(registry[slide.component], slide.props)
 * ```
 * 本ファイルはこのシグネチャ（tasks.md T14: `(slide, registry, fps) => React.ReactNode`）を
 * そのまま実装する。`Section`/`Slide`（video-base 資産）は変更せず流用する。
 *
 * **D-25 修正（design §7.2 / tasks.md W0-mojibake-video-2-T3）**: 上記シグネチャに、呼び出し元の
 * `<Sequence>` ローカル尺（`span.durationInFrames`）を受け取る第 4 引数 `slideDurationInFrames`
 * を追加した（省略可・末尾追加のため既存呼び出し元は無改修で動作を維持する）。`"title"` スライドの
 * `<Section>` へこの値を props 注入することで、`useVideoConfig()` が返す Composition 全体尺と
 * `<Sequence>` ローカル尺のフレーム相対性混用（D-25: title スライドのフェードアウト不発火）を
 * 解消する（`Citation.tsx` が既に持つ `durationInFrames` props 注入パターンを踏襲）。
 */

import React from "react";
import { Slide as SlideComponent } from "../../components/Slide";
import { Section } from "../../components/Section";
import type { Slide } from "../schema/script";
import type { ComponentRegistry } from "./component-registry";

/** design §6.3: 標準スライド（既存 `Slide`/`Section`）が前提とする内部座標系（1920x1080）。 */
export const SLIDE_INTERNAL_WIDTH = 1920;
export const SLIDE_INTERNAL_HEIGHT = 1080;
/**
 * design §6.3 v3.8（T16 試写・ユーザー裁定 2026-07-12）: 中央スライド領域（80% カラム、1536px）へ
 * 縮小する倍率。0.76 × 1920 = 1459.2px が 1536px に収まる（旧 0.6 から変更。カラム比 12/80/8 化
 * （design §7 v3.8）でスライド領域が拡大したのに合わせて縮小率を緩めた）。
 */
export const SLIDE_SCALE = 0.76;

export interface BoldSegment {
  text: string;
  bold: boolean;
}

/**
 * design §2.6 MAY: bullets の `items` 内 `**text**`（bold のみ、ネスト・イタリック非対応）を
 * 検出する純関数。未対応構文（単独の `**`、入れ子等）は非 bold の地の文としてそのまま残す。
 */
export function parseBoldSegments(text: string): BoldSegment[] {
  const segments: BoldSegment[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }
  if (segments.length === 0) {
    segments.push({ text: "", bold: false });
  }
  return segments;
}

/** {@link parseBoldSegments} の結果を React ノード列へ変換する（bold セグメントを `<strong>` に写像）。 */
export function renderBoldText(text: string): React.ReactNode {
  return parseBoldSegments(text).map((segment, index) =>
    segment.bold ? (
      <strong key={index}>{segment.text}</strong>
    ) : (
      <React.Fragment key={index}>{segment.text}</React.Fragment>
    ),
  );
}

function renderStandardSlide(
  slide: Extract<Slide, { type: "title" | "bullets" | "code" }>,
  slideDurationInFrames?: number,
): React.ReactNode {
  switch (slide.type) {
    case "title":
      return (
        <Section
          title={slide.title}
          subtitle={slide.subtitle}
          backgroundColor={slide.background}
          durationInFrames={slideDurationInFrames}
        />
      );
    case "bullets":
      return (
        <SlideComponent
          title={slide.title ?? ""}
          body={
            // T16 試写リファイン（2026-07-12）: Slide.tsx 既定の本文 28px は scale 0.78 で実効 22px と
            // 小さすぎるため、ul 側で拡大する（Slide.tsx は凍結資産のため触らない、design §6.3）。
            <ul style={{ fontSize: "44px", lineHeight: 1.8 }}>
              {slide.items.map((item, index) => (
                <li key={index}>{renderBoldText(item)}</li>
              ))}
            </ul>
          }
          backgroundColor={slide.background}
        />
      );
    case "code":
      return (
        <SlideComponent
          title={slide.title ?? ""}
          body={
            // 2026-09-26 source-to-exe の試写: Slide.tsx の本文は text-align: center のため <pre> の各行が
            // 個別に中央寄せされ、インデントが崩れて見えた。inline-block + text-align: left で「ブロックは
            // 中央、行は左揃え」にし、bullets と同じく 1080p 向けに拡大する（Slide.tsx は触らない）。
            <pre style={{ display: "inline-block", textAlign: "left", fontSize: "40px", lineHeight: 1.5, margin: 0 }}>
              {slide.code}
            </pre>
          }
          backgroundColor={slide.background}
        />
      );
  }
}

/**
 * `slide.type` が `"svg-ref"` | `"custom"` の場合の解決。`registry` から実体（コンポーネント関数）を引き、
 * `slide.props`（JSON 直列化可能値限定、design §2.6 MUST）を渡して React 要素として組み立てる
 * （design §6.3 v3.7: `React.createElement(registry[slide.component], slide.props)`）。
 *
 * **v3.7 改訂（HGA C-1 対応、design §6.3）**: 旧実装は `componentFn(props)` の直接関数呼び出しだった。
 * 直接呼び出しでは呼び先コンポーネントの hooks が呼び出し元（`ScriptCompositionInner`）の hook
 * リストへインライン化されてしまい、hooks 保有スライドと非保有スライドの切替 frame で hook 数が
 * 変動し React の "Rendered fewer/more hooks" クラッシュが発生する。`React.createElement` による
 * 要素生成であれば、hooks は React が実際にレンダリングする `componentFn` 自身の呼び出しフレームに
 * 帰属するため、hooks 保有資産（`Citation`（`useCurrentFrame`/`useVideoConfig`）・`Flowchart`
 * （`useMemo`）等）も安全に登録・描画できる。
 * **v3.9 補足（design §6.3 P-1）**: `useCurrentFrame` の frame 相対化は `<Sequence>` 祖先の有無のみで
 * 決まる別問題であり、`React.createElement` 化とは無関係（v3.7 時点の記述はこの点で誤認していた）。
 * frame 相対化は `ScriptComposition` 側の slide_event 単位 `<Sequence layout="none">` ラッパーが担う。
 */
function renderEscapeHatchSlide(
  slide: Extract<Slide, { type: "svg-ref" | "custom" }>,
  registry: ComponentRegistry,
): React.ReactNode {
  const componentFn = (registry as Record<string, ((props: never) => React.ReactNode) | undefined>)[
    slide.component
  ];
  if (componentFn === undefined) {
    // design §4.4: エスケープハッチのコンポーネント名がレジストリ未登録。
    // parse 段階（T8）で fail-fast 済みのはずだが、render まで届いた場合の防御的実装。
    throw new Error(
      `✗ ScriptSlideRenderer: component-registry に "${slide.component}" が登録されていません` +
        `（スライド id="${slide.id}"）`,
    );
  }
  // ComponentRegistry の型は React.FC の実シグネチャ（React 19: 非同期対応で
  // `ReactNode | Promise<ReactNode>`）に合わせているため、`React.createElement` の型パラメータに
  // 合わせて `props` 引数の型のみをキャストする（要素生成そのものは通常の JSX 変換と同じ経路）。
  // `React.createElement<never>(...)` の戻り値型 `FunctionComponentElement<never>` は
  // `ReactPortal` との union 判定の都合上 `ReactNode` に構造的マッチしない（`children` 必須と
  // 誤認される既知の型定義の癖）ため、最終的な戻り値のみ `React.ReactNode` へキャストする
  // （生成される要素の実体・props は変わらない、型注釈のみの調整）。
  return React.createElement(
    componentFn as unknown as (props: never) => React.ReactNode,
    (slide.props ?? {}) as never,
  ) as unknown as React.ReactNode;
}

/**
 * 台本の `slides[]` 宣言から React ノードを組み立てる（design §6.3、tasks.md T14）。
 *
 * `fps` はタスク定義のシグネチャに合わせて予約している（design はタイミング駆動の標準スライド
 * 演出を具体的には要求していないため v1 では未使用）。
 *
 * `slideDurationInFrames`（D-25 修正、design §7.2）: 呼び出し元の `<Sequence>` ローカル尺
 * （例: `span.durationInFrames`）。省略可の末尾追加引数（既存呼び出し元は無改修で動作を維持）。
 * `"title"` スライドの場合のみ `<Section>` へ props 注入され、フェードアウトのフレーム相対性
 * 混用（D-25）を解消する。`"bullets"` / `"code"` / エスケープハッチ系はフェード演出を持たない
 * ため未使用。
 */
export function ScriptSlideRenderer(
  slide: Slide,
  registry: ComponentRegistry,
  _fps: number,
  slideDurationInFrames?: number,
): React.ReactNode {
  // 現時点では未使用（v1 はタイミング駆動の標準スライド演出を持たない）。シグネチャ予約のみ。
  void _fps;
  let content: React.ReactNode;
  switch (slide.type) {
    case "title":
    case "bullets":
    case "code":
      content = renderStandardSlide(slide, slideDurationInFrames);
      break;
    case "svg-ref":
    case "custom":
      content = renderEscapeHatchSlide(slide, registry);
      break;
    default: {
      const exhaustiveCheck: never = slide;
      throw new Error(
        `✗ ScriptSlideRenderer: 未知のスライド種別です: ${JSON.stringify(exhaustiveCheck)}`,
      );
    }
  }

  return (
    // design §6.3 v3.8: 中央領域に縦横中央寄せで配置する（T16 試写の「画面下部の背景色帯」解消）。
    // scale レイヤーは絶対配置 + translate(-50%,-50%) で中央寄せする。通常フロー（flex center）に
    // 置くと transform はレイアウト上の幅（1920px）を縮めないため、中央カラム（flex: 1 1 auto）の
    // 最小幅が 1920px に膨れて右カラムが画面外へ押し出される（T16 試写で listener 立ち絵が
    // 消えた実バグ。絶対配置でフローから外すことで 3 カラム幅が保たれる）。
    // `Section` の `absolute fill` 配置閉じ込め（position: relative）は最内層で維持する。
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          // T16 試写リファイン（2026-07-12）: 完全中央（50%）だと右端が listener カラムに近すぎる
          // 指摘を受け、24px 左へ寄せる（scale 0.76 の横スラック 77px の範囲内、左端はカラム内に収まる）。
          left: "calc(50% - 24px)",
          top: "50%",
          width: SLIDE_INTERNAL_WIDTH,
          height: SLIDE_INTERNAL_HEIGHT,
          transform: `translate(-50%, -50%) scale(${SLIDE_SCALE})`,
        }}
      >
        <div
          style={{ position: "relative", width: SLIDE_INTERNAL_WIDTH, height: SLIDE_INTERNAL_HEIGHT }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
