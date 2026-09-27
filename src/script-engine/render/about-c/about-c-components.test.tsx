/**
 * about-c の custom 部品（LanguageLevels・CTimeline・CourseMap）のテスト。
 *
 * 見るもの：props で渡した文字がすべて描かれること、強調が指定した 1 つだけに付くこと、
 * 強調を省いたときにどれにも付かないこと。色の値は各部品の定数（C_HI_STROKE = #e85d1a）。
 * 部品は remotion のフックを使わないので、関数として呼び、返った React 要素の木を文字列に直して見る
 * （DOM 描画用のテストライブラリと react-dom の型は入れていない。Section.test.tsx と同じ制約）。
 */

import type React from "react";
import { describe, expect, it } from "vitest";

import { LanguageLevels } from "./LanguageLevels";
import { CTimeline } from "./CTimeline";
import { CourseMap } from "./CourseMap";

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

describe("LanguageLevels", () => {
  const rows = [
    { name: "Python", sub: "人の言葉に近い" },
    { name: "C", sub: "間にいる" },
    { name: "機械語", sub: "0 と 1" },
  ];

  it("段の名前・説明・軸の見出しを描く", () => {
    const html = renderToStaticMarkup(<LanguageLevels rows={rows} title="言語の高さ" />);
    for (const s of ["言語の高さ", "Python", "人の言葉に近い", "C", "機械語", "0 と 1", "高水準（人に近い）", "低水準（機械に近い）"]) {
      expect(html).toContain(s);
    }
  });

  it("highlight を省くと強調色を使わない", () => {
    const html = renderToStaticMarkup(<LanguageLevels rows={rows} />);
    expect(count(html, HI)).toBe(0);
  });

  it("highlight の段だけを強調する（枠と文字の 2 か所）", () => {
    const html = renderToStaticMarkup(<LanguageLevels rows={rows} highlight="C" />);
    expect(count(html, HI)).toBe(2);
  });
});

describe("CTimeline", () => {
  const items = [
    { year: "1969", label: "出来事A" },
    { year: "1972", label: "出来事B\n2 行目" },
    { year: "1978", label: "出来事C" },
  ];

  it("年と出来事（改行は行を分けて）を描く", () => {
    const html = renderToStaticMarkup(<CTimeline items={items} title="年表" />);
    for (const s of ["年表", "1969", "1972", "1978", "出来事A", "出来事B", "2 行目", "出来事C"]) {
      expect(html).toContain(s);
    }
    expect(html).not.toContain("出来事B\n2 行目");
  });

  it("highlight を省くと強調色を使わない", () => {
    const html = renderToStaticMarkup(<CTimeline items={items} />);
    expect(count(html, HI)).toBe(0);
  });

  it("highlight の出来事だけを強調する（点・年・説明 2 行の 4 か所）", () => {
    const html = renderToStaticMarkup(<CTimeline items={items} highlight={1} />);
    expect(count(html, HI)).toBe(4);
  });
});

describe("CourseMap", () => {
  const columns = ["今年", "来年", "再来年"];
  const rows = [
    { label: "学科A", cells: [["科目1"], ["科目2", "科目3"], ["科目4"]] },
    { label: "学科B", cells: [["科目5"], ["科目6"], ["科目7"]] },
  ];

  it("列の見出し・行の見出し・科目名をすべて描く", () => {
    const html = renderToStaticMarkup(<CourseMap columns={columns} rows={rows} title="科目の地図" />);
    for (const s of ["科目の地図", "今年", "来年", "再来年", "学科A", "学科B", "科目1", "科目2", "科目3", "科目4", "科目5", "科目6", "科目7"]) {
      expect(html).toContain(s);
    }
  });

  it("highlight を省くと強調色を使わない", () => {
    const html = renderToStaticMarkup(<CourseMap columns={columns} rows={rows} />);
    expect(count(html, HI)).toBe(0);
  });

  it("highlight の行だけを強調する（行の見出しと 3 つの枠の 4 か所）", () => {
    const html = renderToStaticMarkup(<CourseMap columns={columns} rows={rows} highlight={0} />);
    expect(count(html, HI)).toBe(4);
  });
});
