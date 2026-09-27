/**
 * script-engine — ScriptSlideRenderer.tsx のテスト
 *
 * 出自: docs/specs/script-engine/tasks.md W3-script-engine-T14 完了条件
 *   「テスト: mock スライド配列を渡し、type ごとの生成コンポーネント JSX を確認」
 *
 * プロジェクトに DOM レンダリング用のテストライブラリ（jsdom / testing-library 等）が
 * 導入されていないため（package.json 確認済み、2026-07-11）、実 DOM への render は行わず、
 * React 要素ツリー（`React.isValidElement` + `.type`/`.props`）を直接検査する方式で検証する。
 */

import React from "react";
import { describe, expect, it } from "vitest";
import { ScriptSlideRenderer, parseBoldSegments, renderBoldText } from "./ScriptSlideRenderer";
import { Slide as SlideComponent } from "../../components/Slide";
import { Section } from "../../components/Section";
import { componentRegistry } from "./component-registry";
import { JavaJsCompare } from "./pilot/JavaJsCompare";
import type { Slide } from "../schema/script";

/** ScriptSlideRenderer の scale(0.6) ラッパー 3 層を剥がし、実コンテンツ要素を取り出す。 */
function unwrapContent(node: React.ReactNode): React.ReactNode {
  const outer = node as React.ReactElement<{ children: React.ReactElement }>;
  const scaleLayer = outer.props.children;
  const innerLayer = (scaleLayer.props as { children: React.ReactElement }).children;
  return (innerLayer.props as { children: React.ReactNode }).children;
}

describe("ScriptSlideRenderer (標準スライドタイプ)", () => {
  it('"title" は <Section> を生成する', () => {
    const slide: Slide = { id: "s-1", type: "title", title: "見出し", subtitle: "副題" };
    const content = unwrapContent(ScriptSlideRenderer(slide, componentRegistry, 30));
    const element = content as React.ReactElement;
    expect(React.isValidElement(element)).toBe(true);
    expect(element.type).toBe(Section);
    expect((element.props as { title: string }).title).toBe("見出し");
    expect((element.props as { subtitle?: string }).subtitle).toBe("副題");
  });

  it('"title" の background は Section の backgroundColor に渡る', () => {
    const slide: Slide = { id: "s-1", type: "title", title: "t", background: "#123456" };
    const content = unwrapContent(ScriptSlideRenderer(slide, componentRegistry, 30)) as React.ReactElement;
    expect((content.props as { backgroundColor?: string }).backgroundColor).toBe("#123456");
  });

  it('"title" は第 4 引数（Sequence のローカル尺）を Section の durationInFrames に渡す（D-25）', () => {
    const slide: Slide = { id: "s-1", type: "title", title: "t" };
    const content = unwrapContent(
      ScriptSlideRenderer(slide, componentRegistry, 30, 123),
    ) as React.ReactElement;
    expect((content.props as { durationInFrames?: number }).durationInFrames).toBe(123);
  });

  it('"title" で第 4 引数を省くと Section の durationInFrames は undefined（useVideoConfig の尺に戻る。PDF の経路）', () => {
    const slide: Slide = { id: "s-1", type: "title", title: "t" };
    const content = unwrapContent(ScriptSlideRenderer(slide, componentRegistry, 30)) as React.ReactElement;
    expect((content.props as { durationInFrames?: number }).durationInFrames).toBeUndefined();
  });

  it('"bullets" は <Slide> を生成し items を <li> に展開する', () => {
    const slide: Slide = {
      id: "s-2",
      type: "bullets",
      title: "まとめ",
      items: ["ふつうの項目", "**強調**の項目"],
    };
    const content = unwrapContent(ScriptSlideRenderer(slide, componentRegistry, 30)) as React.ReactElement;
    expect(content.type).toBe(SlideComponent);
    expect((content.props as { title: string }).title).toBe("まとめ");

    const body = (content.props as { body: React.ReactElement }).body;
    expect(body.type).toBe("ul");
    const items = (body.props as { children: React.ReactElement[] }).children;
    expect(items).toHaveLength(2);
    expect(items[0].type).toBe("li");
  });

  it('"bullets" の <ul> は「かたまりは中央、中身は左揃え」（inline-block + text-align: left。点と文字がずれない）', () => {
    const slide: Slide = { id: "s-2c", type: "bullets", title: "t", items: ["短い", "とても長い項目の文"] };
    const content = unwrapContent(ScriptSlideRenderer(slide, componentRegistry, 30)) as React.ReactElement;
    const body = (content.props as { body: React.ReactElement }).body;
    const style = (body.props as { style: React.CSSProperties }).style;

    expect(style.display).toBe("inline-block");
    expect(style.textAlign).toBe("left");
  });

  it('"bullets" の title 省略時は空文字列を渡す', () => {
    const slide: Slide = { id: "s-2b", type: "bullets", items: ["a"] };
    const content = unwrapContent(ScriptSlideRenderer(slide, componentRegistry, 30)) as React.ReactElement;
    expect((content.props as { title: string }).title).toBe("");
  });

  it('"code" は <Slide> の body に <pre> を生成する', () => {
    const slide: Slide = { id: "s-3", type: "code", title: "例", code: "const x = 1;" };
    const content = unwrapContent(ScriptSlideRenderer(slide, componentRegistry, 30)) as React.ReactElement;
    expect(content.type).toBe(SlideComponent);
    const body = (content.props as { body: React.ReactElement }).body;
    expect(body.type).toBe("pre");
    expect((body.props as { children: string }).children).toBe("const x = 1;");
  });
});

describe("ScriptSlideRenderer (svg-ref / custom エスケープハッチ)", () => {
  it('"custom" は registry から実体を解決し React.createElement で要素化する（design §6.3 v3.7、HGA C-1）', () => {
    const slide: Slide = {
      id: "s-4",
      type: "custom",
      component: "JavaJsCompare",
      props: { stage: "intro" },
    };
    const content = unwrapContent(ScriptSlideRenderer(slide, componentRegistry, 30)) as React.ReactElement;
    // v3.7 改訂: 直接関数呼び出し（呼び先の出力ノード = <div> 等）ではなく、
    // React 要素（type=登録コンポーネント自身、props=slide.props）が返る（hooks 保有資産の
    // latent クラッシュ対策、design §6.3）。
    expect(React.isValidElement(content)).toBe(true);
    expect(content.type).toBe(JavaJsCompare);
    expect(content.props).toEqual({ stage: "intro" });
  });

  it("未登録コンポーネント名は明示エラーを throw する", () => {
    const slide: Slide = { id: "s-5", type: "custom", component: "NotRegistered" };
    expect(() => ScriptSlideRenderer(slide, componentRegistry, 30)).toThrow(/NotRegistered/);
    expect(() => ScriptSlideRenderer(slide, componentRegistry, 30)).toThrow(/s-5/);
  });
});

describe("parseBoldSegments (design §2.6 MAY: bold インライン強調)", () => {
  it("bold 記法を含まない場合は非 bold の 1 セグメント", () => {
    expect(parseBoldSegments("ふつうのテキスト")).toEqual([
      { text: "ふつうのテキスト", bold: false },
    ]);
  });

  it("先頭が bold", () => {
    expect(parseBoldSegments("**先頭**のあと")).toEqual([
      { text: "先頭", bold: true },
      { text: "のあと", bold: false },
    ]);
  });

  it("末尾が bold", () => {
    expect(parseBoldSegments("前の**末尾**")).toEqual([
      { text: "前の", bold: false },
      { text: "末尾", bold: true },
    ]);
  });

  it("複数の bold セグメント", () => {
    expect(parseBoldSegments("**a**とふつうと**b**")).toEqual([
      { text: "a", bold: true },
      { text: "とふつうと", bold: false },
      { text: "b", bold: true },
    ]);
  });

  it("全体が bold（前後にテキストなし）", () => {
    expect(parseBoldSegments("**まるごと**")).toEqual([{ text: "まるごと", bold: true }]);
  });

  it("空文字列は非 bold の空セグメント 1 件", () => {
    expect(parseBoldSegments("")).toEqual([{ text: "", bold: false }]);
  });

  it("単独の ** （閉じなし）は非 bold の地の文として残る（ネスト・イタリック非対応）", () => {
    expect(parseBoldSegments("これは**閉じられていない")).toEqual([
      { text: "これは**閉じられていない", bold: false },
    ]);
  });
});

describe("renderBoldText", () => {
  it("bold セグメントを <strong> に変換する", () => {
    const nodes = renderBoldText("**強調**あり") as React.ReactElement[];
    expect(nodes).toHaveLength(2);
    expect(nodes[0].type).toBe("strong");
    expect((nodes[0].props as { children: string }).children).toBe("強調");
  });
});
