/**
 * python-runs の custom 部品（RunFlow・CompareTable）のテスト。
 *
 * 見るもの：props で渡した文字がすべて描かれること、強調が指定した物だけに付くこと、
 * 強調を省いたときにどれにも付かないこと、長い文字が小さくなること。色の値は各部品の定数（C_HI_STROKE = #e85d1a）。
 * 部品は remotion のフックを使わないので、関数として呼び、返った React 要素の木を文字列に直して見る
 * （about-c-components.test.tsx と同じやり方）。
 */

import type React from "react";
import { describe, expect, it } from "vitest";

import { RunFlow, fitFontSize, textUnits } from "./RunFlow";
import { CompareTable } from "./CompareTable";

const HI = "#e85d1a";
const count = (html: string, s: string) => html.split(s).length - 1;

/** 要素の木を、文字と属性値（style を含む）を並べた 1 本の文字列にする。関数の部品は呼んで展開する。 */
function flatten(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return `${node} | `;
  if (Array.isArray(node)) return node.map(flatten).join("");
  const el = node as React.ReactElement<Record<string, unknown>>;
  if (typeof el.type === "function") {
    return flatten((el.type as (p: unknown) => React.ReactNode)(el.props));
  }
  const { children, ...rest } = el.props ?? {};
  return `${JSON.stringify(rest)} | ${flatten(children as React.ReactNode)}`;
}
const renderToStaticMarkup = (el: React.ReactElement) => flatten(el);

describe("fitFontSize", () => {
  it("全角は 1、半角は 0.6 で数える", () => {
    expect(textUnits("あいう")).toBe(3);
    expect(textUnits("abcde")).toBeCloseTo(3);
  });

  it("収まる文字は base のまま、収まらない文字は小さく、下限は min", () => {
    expect(fitFontSize("短い", 400, 40)).toBe(40);
    expect(fitFontSize("とても長い名前の箱です", 300, 40)).toBe(27);
    expect(fitFontSize("とても長い名前の箱です".repeat(5), 300, 40, 20)).toBe(20);
  });
});

describe("RunFlow", () => {
  const lanes = [
    {
      label: "コンパイラ",
      steps: [{ name: "ソースコード", sub: "人が書いた文字" }, { name: "コンパイラ" }, { name: "CPU", sub: "実行する" }],
    },
    { label: "インタプリタ", steps: [{ name: "ソースコード" }, { name: "インタプリタ", sub: "1 つずつ実行" }] },
  ];

  it("見出し・レーン名・箱の名前と説明を描く", () => {
    const html = renderToStaticMarkup(<RunFlow lanes={lanes} title="2 つのやり方" />);
    for (const s of ["2 つのやり方", "コンパイラ", "インタプリタ", "ソースコード", "人が書いた文字", "CPU", "実行する", "1 つずつ実行"]) {
      expect(html).toContain(s);
    }
  });

  it("強調を省くと強調色を使わない（矢じりの定義の 1 か所だけ）", () => {
    const html = renderToStaticMarkup(<RunFlow lanes={lanes} />);
    expect(count(html, HI)).toBe(1);
  });

  it("highlight の箱だけを強調する（枠と文字の 2 か所 × 箱の数。間の矢印も強調）", () => {
    const one = [{ steps: [{ name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }] }];
    const html = renderToStaticMarkup(<RunFlow lanes={one} highlight={[1, 2]} />);
    // 定義 1 + 箱 2 つ × 2 + B→C の矢印の線 1
    expect(count(html, HI)).toBe(6);
    expect(count(html, "url(#rf-arrow-hi)")).toBe(1);
  });

  it("highlightLane のレーンを強調し、ほかのレーンを薄くする", () => {
    const html = renderToStaticMarkup(<RunFlow lanes={lanes} highlightLane={1} />);
    // 定義 1 + レーン名 1 + 箱 2 つ × 2 + 矢印 1
    expect(count(html, HI)).toBe(7);
    expect(count(html, '"opacity":0.4')).toBe(1);
  });
});

describe("CompareTable", () => {
  const columns = ["コンパイラ型", "インタプリタ型", "Python"];
  const rows = [
    { label: "速さ", cells: ["速い", "遅くなりがち", "工夫で補う"] },
    { label: "試しやすさ", cells: ["訳し直す", "その場で", "その場で（>>>）"] },
  ];

  it("見出し・列・観点・中身を描く", () => {
    const html = renderToStaticMarkup(<CompareTable columns={columns} rows={rows} title="比べてみる" />);
    for (const s of ["比べてみる", ...columns, "速さ", "試しやすさ", "速い", "遅くなりがち", "工夫で補う", "訳し直す", "その場で（>>>）"]) {
      expect(html).toContain(s);
    }
  });

  it("highlightColumn を省くと強調色を使わない", () => {
    const html = renderToStaticMarkup(<CompareTable columns={columns} rows={rows} />);
    expect(count(html, HI)).toBe(0);
  });

  it("highlightColumn の列だけを強調する（見出しと外枠の 2 か所）", () => {
    const html = renderToStaticMarkup(<CompareTable columns={columns} rows={rows} highlightColumn={2} />);
    expect(count(html, HI)).toBe(2);
    expect(count(html, "#fff3cd")).toBe(rows.length);
  });
});
