/**
 * ScriptPdfComposition.tsx の描画ツリーのテスト（ScriptPdfCompositionInner）
 *
 * 見るもの（props の配線と calculateScriptPdfMetadata は ScriptPdfComposition.test.tsx）:
 * - frame → pdf-manifest のページの選び方と、ページ番号の表示
 * - 見出しの解決（title/code/bullets はスライドの title、custom は script_id）
 * - LicenseFooter（クレジット）は最終ページにだけ出る
 * - frame が範囲外、slide_id が timeline manifest に無いときの fail-fast
 *
 * 入力は java-vs-js（custom 3 枚＋bullets 1 枚、4 ページ）と source-to-exe（title・code を含む 10 ページ）の
 * 実 manifest。ScriptCompositionTree.test.tsx と同じく、remotion の useCurrentFrame だけを差し替え、
 * ScriptPdfComposition が返す要素の関数（ScriptPdfCompositionInner）を直接呼んで、返った要素ツリーを歩く。
 */

import React from "react";
import { describe, expect, it, vi } from "vitest";

const remotionState = vi.hoisted(() => ({ frame: 0 }));

vi.mock("remotion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("remotion")>();
  return { ...actual, useCurrentFrame: () => remotionState.frame };
});

import {
  PDF_CONTENT_WIDTH,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
  ScriptPdfComposition,
} from "./ScriptPdfComposition";
import { manifestRegistry, pdfManifestRegistry } from "../script-engine/render/manifest-registry";

type AnyElement = React.ReactElement<Record<string, unknown>>;

/** 外殻が返す要素（内部コンポーネント＋props）を得る。 */
function outerElement(scriptId: string): AnyElement {
  return ScriptPdfComposition({ scriptId }) as AnyElement;
}

/** 内部コンポーネントを frame を決めて 1 回呼び、返った要素ツリーを得る。props は差し替えられる。 */
function renderInner(outer: AnyElement, frame: number, props = outer.props): AnyElement {
  remotionState.frame = frame;
  const inner = outer.type as (p: Record<string, unknown>) => React.ReactNode;
  return inner(props) as AnyElement;
}

/** 要素ツリーを props.children で歩き、要素を全部集める（関数コンポーネントの中身は展開しない）。 */
function collectElements(node: React.ReactNode, out: AnyElement[] = []): AnyElement[] {
  if (Array.isArray(node)) {
    for (const child of node) collectElements(child, out);
    return out;
  }
  if (!React.isValidElement(node)) return out;
  const element = node as AnyElement;
  out.push(element);
  collectElements(element.props.children as React.ReactNode, out);
  return out;
}

/** ヘッダの 2 つの div（見出し・ページ番号）を返す。ツリーの最初の div がヘッダ。 */
function headerTexts(tree: AnyElement): { heading: unknown; pageNumber: string } {
  const header = collectElements(tree).find((e) => e.type === "div")!;
  const [headingDiv, pageDiv] = header.props.children as AnyElement[];
  const pageChildren = pageDiv.props.children as unknown[];
  return { heading: headingDiv.props.children, pageNumber: pageChildren.join("") };
}

/** LicenseFooter の要素（props.credits を持つ要素）を返す。無ければ undefined。 */
function findFooter(tree: AnyElement): AnyElement | undefined {
  return collectElements(tree).find((e) => Array.isArray(e.props.credits));
}

describe("ScriptPdfCompositionInner — ページの選び方と見出し", () => {
  it("java-vs-js: frame 0 は 1 ページ目（custom スライド）で、見出しは script_id、クレジットは出ない", () => {
    const tree = renderInner(outerElement("java-vs-js"), 0);
    const pdf = pdfManifestRegistry["java-vs-js"];

    expect(headerTexts(tree)).toEqual({
      heading: "java-vs-js",
      pageNumber: `1 / ${pdf.total_pages}`,
    });
    expect(findFooter(tree)).toBeUndefined();
  });

  it("java-vs-js: 最終ページ（bullets「まとめ」）は見出しがスライドの title で、クレジットが manifest の credits で出る", () => {
    const pdf = pdfManifestRegistry["java-vs-js"];
    const tree = renderInner(outerElement("java-vs-js"), pdf.total_pages - 1);

    expect(headerTexts(tree)).toEqual({
      heading: "まとめ",
      pageNumber: `${pdf.total_pages} / ${pdf.total_pages}`,
    });
    const footer = findFooter(tree);
    expect(footer).toBeDefined();
    expect(footer!.props.credits).toBe(manifestRegistry["java-vs-js"].credits);
  });

  it("source-to-exe: title・code スライドのページは、見出しがスライドの title になり、最終ページ以外にクレジットは出ない", () => {
    const outer = outerElement("source-to-exe");
    const pdf = pdfManifestRegistry["source-to-exe"];

    const titlePage = renderInner(outer, 0);
    expect(headerTexts(titlePage)).toEqual({
      heading: "ソースから実行ファイルまで",
      pageNumber: `1 / ${pdf.total_pages}`,
    });
    expect(findFooter(titlePage)).toBeUndefined();

    const codePage = renderInner(outer, 1);
    expect(headerTexts(codePage).heading).toBe("ソースコード（hello.c）── 人が読んで、直せる文字");
    expect(findFooter(codePage)).toBeUndefined();

    const lastPage = renderInner(outer, pdf.total_pages - 1);
    expect(findFooter(lastPage)!.props.credits).toBe(manifestRegistry["source-to-exe"].credits);
  });
});

describe("LicenseFooter — 最終ページの注記（点検 R3）", () => {
  it("立ち絵を CC BY 4.0 の側に含め、各権利者の規約に従うのはキャラクター音声だけと書く（LICENSE-CONTENT と同じ）", () => {
    const pdf = pdfManifestRegistry["source-to-exe"];
    const footer = findFooter(renderInner(outerElement("source-to-exe"), pdf.total_pages - 1))!;
    const rendered = (footer.type as (p: Record<string, unknown>) => React.ReactNode)(footer.props);
    const text = collectElements(rendered)
      .flatMap((e) => (Array.isArray(e.props.children) ? e.props.children : [e.props.children]))
      .filter((c): c is string => typeof c === "string")
      .join("");

    expect(text).toContain("本資料のテキスト・コード・自作図版・立ち絵は CC BY 4.0 の下で利用できます");
    expect(text).toContain("（キャラクター音声は各権利者の規約に従います）");
    expect(text).not.toContain("立ち絵は各権利者");
  });
});

describe("ScriptPdfCompositionInner — fail-fast", () => {
  it("frame が pdf-manifest のページ数を超えると throw する", () => {
    const pdf = pdfManifestRegistry["java-vs-js"];
    expect(() => renderInner(outerElement("java-vs-js"), pdf.total_pages)).toThrow(
      new RegExp(`frame ${pdf.total_pages} に対応する PDF ページがありません`),
    );
  });

  it("ページの slide_id が timeline manifest の slides[] に無いと throw する", () => {
    const outer = outerElement("java-vs-js");
    const pdf = pdfManifestRegistry["java-vs-js"];
    const brokenPdf = {
      ...pdf,
      pages: [{ ...pdf.pages[0], slide_id: "no-such-slide" }, ...pdf.pages.slice(1)],
    };
    expect(() => renderInner(outer, 0, { ...outer.props, pdfManifest: brokenPdf })).toThrow(
      /"no-such-slide" に対応するスライドが/,
    );
  });
});

describe("ScriptPdfCompositionInner — ページの組み（Wave 5：A4 縦、スライドと本文は同じ幅）", () => {
  /** data-pdf-region の値で、スライド面か本文面の div を返す。 */
  function region(tree: AnyElement, name: "slide" | "body"): AnyElement {
    const found = collectElements(tree).find((e) => e.props["data-pdf-region"] === name);
    if (!found) throw new Error(`data-pdf-region="${name}" の要素が無い`);
    return found;
  }

  it("ページは縦長で、内容の幅はページ幅から左右の余白 56px ずつを引いた幅", () => {
    expect(PDF_PAGE_HEIGHT).toBeGreaterThan(PDF_PAGE_WIDTH);
    expect(PDF_CONTENT_WIDTH).toBe(PDF_PAGE_WIDTH - 56 * 2);
  });

  it.each(["java-vs-js", "source-to-exe", "about-c", "python-runs"])(
    "%s: どのページでもスライド面と本文面の幅が同じで、本文は 1 段組",
    (scriptId) => {
      const outer = outerElement(scriptId);
      const pdf = pdfManifestRegistry[scriptId];
      for (let frame = 0; frame < pdf.total_pages; frame += 1) {
        const tree = renderInner(outer, frame);
        const slideStyle = region(tree, "slide").props.style as React.CSSProperties;
        const bodyStyle = region(tree, "body").props.style as React.CSSProperties;
        expect(slideStyle.width).toBe(PDF_CONTENT_WIDTH);
        expect(bodyStyle.width).toBe(PDF_CONTENT_WIDTH);
        expect(bodyStyle.columnCount).toBeUndefined();
      }
    },
  );
});
