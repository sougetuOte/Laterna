/**
 * ScriptPdfComposition.tsx のテスト
 *
 * 出自: docs/specs/script-engine/tasks.md W4-script-engine-T18 完了条件
 *   「テスト: パイロット台本から PDF 出力、ページ分割が正常、文字切れなし」の単体テスト部分。
 *   実機 PDF 出力の確認（決定性・目視確認）は `scripts/build-script-pdf.mjs` の実行結果で別途検証する。
 *
 * calculateScriptPdfMetadata は resolvePdfManifest（manifest-registry.ts、実 java-vs-js
 * pdf-manifest 登録）を経由するため、実 manifest 値との突合で検証する。
 */

import React from "react";
import { describe, expect, it } from "vitest";
import {
  calculateScriptPdfMetadata,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
  ScriptPdfComposition,
} from "./ScriptPdfComposition";
import { manifestRegistry, pdfManifestRegistry } from "../script-engine/render/manifest-registry";

describe("calculateScriptPdfMetadata", () => {
  it("登録済み scriptId (java-vs-js) から durationInFrames を pdf-manifest.total_pages で返す（design §8.1 MUST）", async () => {
    const expected = pdfManifestRegistry["java-vs-js"];
    const result = await calculateScriptPdfMetadata({ props: { scriptId: "java-vs-js" } });

    expect(result.durationInFrames).toBe(expected.total_pages);
    expect(result.width).toBe(PDF_PAGE_WIDTH);
    expect(result.height).toBe(PDF_PAGE_HEIGHT);
    expect(result.fps).toBe(30);
  });

  it("未登録 scriptId は throw する", async () => {
    await expect(
      calculateScriptPdfMetadata({ props: { scriptId: "not-registered" } }),
    ).rejects.toThrow(/not-registered/);
  });
});

/**
 * 外殻コンポーネント `ScriptPdfComposition`（hooks を使わない）を直接呼び、`resolvePdfManifest` /
 * `resolveManifest` で解決した manifest が内部コンポーネントへ正しく props 配線されることを見る。
 *
 * 内部コンポーネント `ScriptPdfCompositionInner` の描画（ページの選び方・見出し解決・最終ページだけの
 * LicenseFooter・frame 不整合の fail-fast）は ScriptPdfCompositionTree.test.tsx が見る。そちらは
 * remotion の `useCurrentFrame` を vi.mock で差し替え、外殻が返す要素の `type`（＝内部コンポーネント）を
 * 直接呼ぶ（export の追加は要らない）。ここで vi.mock を使わないのは、外殻が内部を実行しないことを
 * 本物の remotion のまま確かめるため。
 */
describe("ScriptPdfComposition (props 配線 / 描画ツリーは ScriptPdfCompositionTree.test.tsx)", () => {
  it("登録済み scriptId (java-vs-js) では解決済み pdf-manifest / timeline manifest がそのまま内部コンポーネントへ渡る", () => {
    // ScriptPdfComposition 自体は useCurrentFrame 等の hooks を呼ばないため、JSX 生成
    // （React.createElement 相当）のみが走り、内部コンポーネントの実行（hooks 呼び出し）はされない。
    const element = ScriptPdfComposition({ scriptId: "java-vs-js" }) as React.ReactElement<{
      pdfManifest: unknown;
      timelineManifest: unknown;
    }>;

    expect(React.isValidElement(element)).toBe(true);
    expect(element.props.pdfManifest).toBe(pdfManifestRegistry["java-vs-js"]);
    expect(element.props.timelineManifest).toBe(manifestRegistry["java-vs-js"]);
  });

  it("未登録 scriptId は pdf-manifest 解決の時点で throw する（内部コンポーネントの実行前に fail-fast）", () => {
    expect(() => ScriptPdfComposition({ scriptId: "not-registered" })).toThrow(/not-registered/);
  });
});
