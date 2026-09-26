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
 * 監査前軽量レビュー指摘 P-3（docs/artifacts/pre-audit-review-2026-07-14.md §2）対応。
 *
 * `ScriptPdfComposition` の描画ロジック本体（contain-fit 計算 / 見出し解決 `resolveSlideHeading` /
 * `LicenseFooter` / frame 不整合 fail-fast）は、`ScriptPdfCompositionInner` という**非 export** の
 * 内部コンポーネントに閉じ込められており、かつ内部で `useCurrentFrame()`（remotion）を呼ぶ。
 * `useCurrentFrame()` は `CanUseRemotionHooks` context（`<Composition>` 登録時にのみ供給される、
 * remotion パッケージが public API として export していない内部 context）が無いと明示 throw する
 * 実装（`node_modules/remotion/dist/cjs/use-current-frame.js:16-21` で確認済み）。
 *
 * 本プロジェクトには jsdom / testing-library / react-test-renderer が未導入（ScriptSlideRenderer.test.tsx
 * / ScriptComposition.test.tsx と同じ制約）であり、かつ remotion の `package.json` `exports` フィールドが
 * `"."` / `"./version"` / `"./no-react"` 以外のサブパスを Node の解決レベルで禁止しているため
 * （確認済み、`ERR_PACKAGE_PATH_NOT_EXPORTED` になる）、`CanUseRemotionHooks` の Provider を
 * テストコードから供給する手段がない。したがって `ScriptPdfCompositionInner` を実際に描画して
 * a) contain-fit 計算 / b) 見出し解決 / c) ライセンス footer / d) frame 不整合 fail-fast を検証することは、
 * ソース側の export 追加（本タスクで禁止）なしには構造的に不可能。
 *
 * 代わりに、hooks を使わない外殻コンポーネント `ScriptPdfComposition`（export 済み）を直接関数呼び出しし、
 * `resolvePdfManifest` / `resolveManifest` で解決した manifest が内部コンポーネントへ正しく props 配線
 * されることのみを検証する（a-d 自体のカバーではなく、a-d が動作する前提条件の配線確認）。
 */
describe("ScriptPdfComposition (props 配線 / a-d 直接カバー不可の理由は上記コメント参照)", () => {
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
