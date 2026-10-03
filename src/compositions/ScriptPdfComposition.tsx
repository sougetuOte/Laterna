// W4-script-engine-T18: pdf-manifest 駆動の PDF 出力用汎用 Composition。
//
// design.md §8.1（台本からの導出 / decision: `calculateMetadata` とループ上限は pdf-manifest から
// 読む MUST）/ §8.2（話者情報の扱い: narrator=地の文 / listener=罫線インデント）/ §8.3（D-19
// overflow 解消: 1 ページあたりの文字数上限 + 同一スライドの複数ページ自動分割）/ §8.4（metadata
// 決定性は `scripts/build-script-pdf.mjs` 側で担保、本ファイルは描画のみ）/ §11.1（出力先分離）に
// 基づく。1 frame = 1 PDF ページ（`useCurrentFrame()` で `pdfManifest.pages[frame]` を選択）。
//
// スライド面は `ScriptSlideRenderer`（T14）を `<Freeze>` でラップして流用し、アニメーション依存の
// 演出を完了状態で静止させる（still 抽出時の中途半端な描画を防ぐ）。

import React from "react";
import { AbsoluteFill, Freeze, useCurrentFrame } from "remotion";
import { resolveManifest, resolvePdfManifest } from "../script-engine/render/manifest-registry";
import { componentRegistry } from "../script-engine/render/component-registry";
import {
  ScriptSlideRenderer,
  SLIDE_INTERNAL_HEIGHT,
  SLIDE_INTERNAL_WIDTH,
  SLIDE_SCALE,
} from "../script-engine/render/ScriptSlideRenderer";
import type { PdfManifest, PdfPageBlock, PdfPageEntry } from "../script-engine/pdf/script-pdf-manifest";
import type { Slide } from "../script-engine/schema/script";
import type { TimelineManifest } from "../script-engine/schema/timeline-manifest";

/**
 * A4 縦 @ ~150dpi。Wave 5（2026-10-03 主人）：横（1754x1240）ではスライドが高さ 500px に縮んで
 * 中央に小さく載り、本文はページの幅いっぱいに流れていたため、画面で拡大すると図と文が
 * 一緒に収まらなかった。縦にして、スライドと本文を同じ幅にそろえる。
 */
export const PDF_PAGE_WIDTH = 1240;
export const PDF_PAGE_HEIGHT = 1754;

/**
 * still 抽出時、`ScriptSlideRenderer` 配下のアニメーション依存コンポーネント（`useCurrentFrame`
 * 使用資産、design §6.3 v3.7 のエスケープハッチ hooks 対応）を「十分に時間が経過した完了状態」で
 * 静止させるための `<Freeze>` frame 値。実 Composition の尺（動画側 `total_duration_frames`）を
 * 上回る大きな値を使うことで、フェードイン等の演出が終わりきった状態を安定して再現する。
 */
const FREEZE_AT_FRAME = 99999;

// ============================================================================
// スライド面の contain フィット計算（L1 検収差し戻し対応、2026-07-13）
// ============================================================================
// `ScriptSlideRenderer` は動画側の中央カラム前提で内部固定倍率 `SLIDE_SCALE`（0.76）を持つため、
// レンダリング実寸は 1459x820px となり、PDF スライド面（高さ 500px）に収まらず上下が
// クロップされていた（page 2 slide-timeline の上端欠け）。凍結資産に触らず修正するため、
// レンダラの出力実寸に一致する「仮想ステージ」を用意し、ステージ全体を contain フィット
// （scale = min(領域幅/ステージ幅, 領域高/ステージ高)）で領域内に絶対配置 + 中央寄せする。
// transform-origin は "top left" を明示し、位置は数値計算で確定する（flex に transform を
// 混ぜない既知バグパターンの回避を維持）。

/** ページ左右 padding（`padding: "48px 56px"` の 56 と同値、フィット計算に使用）。 */
const PAGE_HORIZONTAL_PADDING = 56;
/** スライド面と本文の幅（ページ幅 − 左右 padding）。Wave 5 から、この 2 つは同じ幅にする。 */
export const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - PAGE_HORIZONTAL_PADDING * 2;
const SLIDE_AREA_WIDTH = PDF_CONTENT_WIDTH;

/** `ScriptSlideRenderer` が実際に描画するスライドの実寸（1920x1080 × SLIDE_SCALE）。 */
const RENDERED_SLIDE_WIDTH = SLIDE_INTERNAL_WIDTH * SLIDE_SCALE;
const RENDERED_SLIDE_HEIGHT = SLIDE_INTERNAL_HEIGHT * SLIDE_SCALE;
/**
 * `ScriptSlideRenderer` 内部の 24px 左オフセット（T16 試写リファイン、design §6.3 v3.8）の
 * 吸収余白。レンダラ自身の `overflow: hidden` でスライド左端が切れないよう、ステージ幅に
 * 左右 24px ずつのスラックを持たせる（レンダラ内部定数に依存する箇所はこの 1 点のみ）。
 */
const STAGE_HORIZONTAL_SLACK = 48;
const STAGE_WIDTH = RENDERED_SLIDE_WIDTH + STAGE_HORIZONTAL_SLACK;
const STAGE_HEIGHT = RENDERED_SLIDE_HEIGHT;

/**
 * Wave 5（2026-10-03）：スライドの絵（RENDERED_SLIDE_WIDTH 幅）を、本文と同じ幅にちょうど合わせる。
 * レンダラは絵を 24px 左へ寄せるので、ステージの中で絵は x=0〜RENDERED_SLIDE_WIDTH にあり、
 * 右の 48px は空き。ステージを左端 0 に置き、絵の幅で倍率を決めると、絵が枠いっぱいになり、
 * 右の空きは枠の外（overflow: hidden）に出る。横のページのときの中央寄せでは、枠の右に白い帯が残った。
 */
const STAGE_SCALE = SLIDE_AREA_WIDTH / RENDERED_SLIDE_WIDTH;
/** スライド面の高さ。絵を上の倍率で縮めた高さ（固定の 500px をやめた）。 */
const SLIDE_AREA_HEIGHT = Math.ceil(STAGE_HEIGHT * STAGE_SCALE);
/** ステージの領域内配置（数値で確定）。 */
const STAGE_LEFT = 0;
const STAGE_TOP = 0;

export interface ScriptPdfCompositionProps {
  scriptId: string;
  [key: string]: unknown;
}

/**
 * design §8.1 MUST: `ScriptPdfComposition` の `calculateMetadata` は pdf-manifest から
 * `durationInFrames`（= `total_pages`）を読む。width/height/fps は PDF 出力の固定値。
 */
export const calculateScriptPdfMetadata = async ({
  props,
}: {
  props: ScriptPdfCompositionProps;
}) => {
  const pdfManifest = resolvePdfManifest(props.scriptId);
  return {
    durationInFrames: pdfManifest.total_pages,
    width: PDF_PAGE_WIDTH,
    height: PDF_PAGE_HEIGHT,
    fps: 30,
  };
};

/**
 * ページヘッダに表示するスライド見出し。`title`/`bullets`/`code` は `title` フィールドを持ちうる
 * （§2.5）。`svg-ref`/`custom` は見出し相当のフィールドを持たないため `undefined` を返す
 * （呼び出し側は script_id + ページ番号のみを表示する）。
 */
function resolveSlideHeading(slide: Slide): string | undefined {
  switch (slide.type) {
    case "title":
      return slide.title;
    case "bullets":
    case "code":
      return slide.title;
    case "svg-ref":
    case "custom":
      return undefined;
    default: {
      const exhaustiveCheck: never = slide;
      return exhaustiveCheck;
    }
  }
}

const bodyBlockStyle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1.7,
  color: "#1a1a1a",
  margin: "0 0 18px 0",
  breakInside: "avoid",
};

/** design §8.2 採用案 C: 聞き役（listener）の発話は罫線インデント区別。 */
const asideBlockStyle: React.CSSProperties = {
  ...bodyBlockStyle,
  fontSize: 20,
  color: "#3a3a3a",
  borderLeft: "4px solid #a0a0a0",
  paddingLeft: 14,
  marginLeft: 4,
};

function renderBlock(block: PdfPageBlock): React.ReactNode {
  const style = block.style === "aside" ? asideBlockStyle : bodyBlockStyle;
  return (
    <p key={block.utterance_id} style={style}>
      {block.text}
    </p>
  );
}

/**
 * NFR-3 準拠のライセンス注記（CC BY 4.0 の適用範囲限定 + VOICEVOX クレジット）。最終ページのみ表示。
 */
const LicenseFooter: React.FC<{ credits: string[] }> = ({ credits }) => (
  <div
    style={{
      flex: "0 0 auto",
      borderTop: "1px solid #cccccc",
      paddingTop: 12,
      marginTop: 12,
      fontSize: 14,
      color: "#666666",
      lineHeight: 1.6,
    }}
  >
    <div>
      {/* 1 本の文字列で書く（JSX で改行して書くと、行のつなぎ目に半角空白が入る。2026-09-27 に見つけた） */}
      {"本資料のテキスト・コード・自作図版・立ち絵は CC BY 4.0 の下で利用できます（キャラクター音声は各権利者の規約に従います）。"}
    </div>
    {credits.map((credit) => (
      <div key={credit}>{credit}</div>
    ))}
  </div>
);

const ScriptPdfCompositionInner: React.FC<{
  pdfManifest: PdfManifest;
  timelineManifest: TimelineManifest;
}> = ({ pdfManifest, timelineManifest }) => {
  const frame = useCurrentFrame();
  const page: PdfPageEntry | undefined = pdfManifest.pages[frame];
  if (!page) {
    throw new Error(
      `✗ ScriptPdfComposition: frame ${frame} に対応する PDF ページがありません` +
        `（pdf-manifest total_pages=${pdfManifest.total_pages}）`,
    );
  }

  const slide = timelineManifest.slides.find((s) => s.id === page.slide_id);
  if (!slide) {
    throw new Error(
      `✗ ScriptPdfComposition: page.slide_id "${page.slide_id}" に対応するスライドが` +
        `timeline manifest の slides[] に見つかりません（manifest 不整合）`,
    );
  }

  const heading = resolveSlideHeading(slide);
  const isLastPage = page.page_number === pdfManifest.total_pages;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
        fontFamily: "sans-serif",
        padding: "48px 56px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ヘッダ: スライドタイトル + ページ番号 */}
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: "bold", color: "#111111" }}>
          {heading ?? `${pdfManifest.script_id}`}
        </div>
        <div style={{ fontSize: 18, color: "#666666" }}>
          {page.page_number} / {pdfManifest.total_pages}
        </div>
      </div>

      {/* スライド面: ページ上部（Wave 5 から本文と同じ幅、高さはそれに合わせる）。ScriptSlideRenderer をアニメーション
          完了状態で静止させて流用する。レンダラ出力実寸の仮想ステージを contain フィットで
          絶対配置 + 中央寄せし、どのスライドでも上下左右が欠けないことを構造的に保証する
          （L1 検収差し戻し対応。transform-origin 明示 + 数値配置、flex に transform を混ぜない）。 */}
      {/* Wave 5：スライド面は本文と同じ幅（PDF_CONTENT_WIDTH）。枠は outline で描き、寸法を変えない。 */}
      <div
        data-pdf-region="slide"
        style={{
          flex: `0 0 ${SLIDE_AREA_HEIGHT}px`,
          width: PDF_CONTENT_WIDTH,
          position: "relative",
          overflow: "hidden",
          outline: "2px solid #c8c8c8",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: STAGE_LEFT,
            top: STAGE_TOP,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transformOrigin: "top left",
            transform: `scale(${STAGE_SCALE})`,
          }}
        >
          <Freeze frame={FREEZE_AT_FRAME}>
            {ScriptSlideRenderer(slide, componentRegistry, timelineManifest.fps)}
          </Freeze>
        </div>
      </div>

      {/* 本文面: スライド面の下の残り。Wave 5 から 1 段組で、スライド面と同じ幅に収める
          （横のページの 2 段組をやめた）。 */}
      <div
        data-pdf-region="body"
        style={{
          flex: "1 1 auto",
          width: PDF_CONTENT_WIDTH,
          marginTop: 24,
          overflow: "hidden",
        }}
      >
        {page.blocks.length > 0 ? (
          page.blocks.map(renderBlock)
        ) : (
          <p style={{ ...bodyBlockStyle, color: "#999999" }}>（本文なし）</p>
        )}
      </div>

      {isLastPage && <LicenseFooter credits={timelineManifest.credits} />}
    </AbsoluteFill>
  );
};

export const ScriptPdfComposition: React.FC<ScriptPdfCompositionProps> = ({ scriptId }) => {
  const pdfManifest = resolvePdfManifest(scriptId);
  const timelineManifest = resolveManifest(scriptId);
  return (
    <ScriptPdfCompositionInner pdfManifest={pdfManifest} timelineManifest={timelineManifest} />
  );
};
