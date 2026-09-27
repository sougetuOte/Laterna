/**
 * PipelineFlow（source-to-exe の図解部品）のテスト。点検 R1・R2（2026-09-27 に直した）を見る。
 *
 * - R1：stage 0（強調なし）では、どの産物の箱も強調色（C_HI = #fff3cd）で塗らない。stage k（1〜4）では
 *   行き先の産物 k の箱だけを塗る。
 * - R2：強調した矢印の矢じり（marker pf-arrow-hi）は、強調した線の太さ（8）より十分大きい（高さ 24 以上）。
 *
 * DOM 描画用のテストライブラリは入れていないので、関数として呼び、返った React 要素の木を歩く。
 */

import React from "react";
import { describe, expect, it } from "vitest";

import { PipelineFlow } from "./PipelineFlow";

type AnyElement = React.ReactElement<Record<string, unknown>>;

function collect(node: React.ReactNode, out: AnyElement[] = []): AnyElement[] {
  if (Array.isArray(node)) {
    for (const child of node) collect(child, out);
    return out;
  }
  if (!React.isValidElement(node)) return out;
  const el = node as AnyElement;
  out.push(el);
  collect(el.props.children as React.ReactNode, out);
  return out;
}

const C_HI = "#fff3cd";
const highlightedBoxes = (stage: number) =>
  collect(PipelineFlow({ stage }) as React.ReactNode).filter((e) => e.type === "rect" && e.props.fill === C_HI);

describe("PipelineFlow", () => {
  it("stage 0（強調なし）では、どの産物の箱も強調しない（R1）", () => {
    expect(highlightedBoxes(0)).toHaveLength(0);
  });

  it.each([1, 2, 3, 4])("stage %i では、行き先の産物の箱を 1 つだけ強調する", (stage) => {
    expect(highlightedBoxes(stage)).toHaveLength(1);
  });

  it("強調した矢印の矢じりは、強調した線（太さ 8）に埋もれない大きさ（R2）", () => {
    const marker = collect(PipelineFlow({ stage: 1 }) as React.ReactNode).find(
      (e) => e.type === "marker" && e.props.id === "pf-arrow-hi",
    )!;
    expect(Number(marker.props.markerHeight)).toBeGreaterThanOrEqual(24);

    const line = collect(PipelineFlow({ stage: 1 }) as React.ReactNode).find(
      (e) => e.type === "path" && e.props.markerEnd === "url(#pf-arrow-hi)",
    )!;
    expect(line.props.strokeWidth).toBe(8);
  });
});
