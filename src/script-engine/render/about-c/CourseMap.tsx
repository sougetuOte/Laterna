/**
 * CourseMap — 「C言語について」（script-id: about-c）専用の図解部品。
 *
 * 学科ごとに「今年・来年・再来年」の科目を表で見せる。科目名は台本 YAML の props で渡す
 * （出典は outline.md の「事実と出典の対応」＝シラバスの科目ページ）。`highlight` で 1 学科の行を強調する。
 */

import React from "react";

export interface CourseMapRow {
  /** 行の見出し（例：「電気情報工学科」） */
  label: string;
  /** 列ごとの科目名（columns と同じ数） */
  cells: string[][];
}

export interface CourseMapProps {
  /** 列の見出し（例：["今年（1年）", "来年（2年）", "再来年（3年）"]） */
  columns: string[];
  rows: CourseMapRow[];
  /** 強調する行の添字（0 始まり。省略時は強調なし） */
  highlight?: number;
  /** 図の上に出す見出し（省略可） */
  title?: string;
}

const C_BG = "#ffffff";
const C_HEAD = "#2c5878";
const C_CELL = "#d9eaf7";
const C_HI = "#fff3cd";
const C_HI_STROKE = "#e85d1a";
const C_TEXT = "#1a3a52";
const C_DIM = "#8a98a6";

export const CourseMap: React.FC<CourseMapProps> = ({ columns, rows, highlight, title }) => {
  const dimmed = (i: number) => highlight !== undefined && highlight !== i;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: C_BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        color: C_TEXT,
        padding: "24px 40px",
        boxSizing: "border-box",
      }}
    >
      {title !== undefined && (
        <div style={{ fontSize: 44, fontWeight: 700, marginBottom: 24 }}>{title}</div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `220px repeat(${columns.length}, 1fr)`,
          gap: 10,
          width: "100%",
        }}
      >
        <div />
        {columns.map((c) => (
          <div
            key={c}
            style={{
              background: C_HEAD,
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 700,
              textAlign: "center",
              padding: "10px 6px",
              borderRadius: 10,
            }}
          >
            {c}
          </div>
        ))}
        {rows.map((r, i) => {
          const hi = highlight === i;
          return (
            <React.Fragment key={r.label}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  color: dimmed(i) ? C_DIM : hi ? C_HI_STROKE : C_TEXT,
                }}
              >
                {r.label}
              </div>
              {r.cells.map((cell, j) => (
                <div
                  key={j}
                  style={{
                    background: hi ? C_HI : C_CELL,
                    border: `3px solid ${hi ? C_HI_STROKE : "transparent"}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 26,
                    lineHeight: 1.45,
                    color: dimmed(i) ? C_DIM : C_TEXT,
                    opacity: dimmed(i) ? 0.6 : 1,
                  }}
                >
                  {cell.map((name) => (
                    <div key={name}>{name}</div>
                  ))}
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
