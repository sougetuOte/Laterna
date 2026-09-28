/**
 * CompareTable — 「Pythonが動くまで」（script-id: python-runs）専用の図解部品。
 *
 * 比べる観点（行）と、比べる物（列）の表を描く。`highlightColumn` の列を強調する。
 * 中身は台本 YAML の props で渡す（事実は台本と outline.md の出典に置き、部品には持たない）。
 * 見た目は RunFlow と揃える（白いパネル・SVG の viewBox 固定・大きな文字）。
 */

import React from "react";
import { fitFontSize } from "./RunFlow";

export interface CompareTableRow {
  /** 観点（左端の欄） */
  label: string;
  /** 列ごとの中身（columns と同じ数） */
  cells: string[];
}

export interface CompareTableProps {
  /** 列の見出し（左端の観点の欄は含めない） */
  columns: string[];
  rows: CompareTableRow[];
  /** 強調する列の番号（0 始まり。省略時は強調なし） */
  highlightColumn?: number;
  /** 図の上に出す見出し（省略可） */
  title?: string;
}

const W = 1500;
const H = 760;
const TOP = 130;
const BOTTOM = 730;
const SIDE = 30;
const LABEL_W = 320;
const HEAD_H = 90;

const C_BG = "#ffffff";
const C_HEAD = "#2c5878";
const C_CELL = "#f3f8fc";
const C_LINE = "#9fb8cc";
const C_HI = "#fff3cd";
const C_HI_STROKE = "#e85d1a";
const C_TEXT = "#1a3a52";

export const CompareTable: React.FC<CompareTableProps> = ({ columns, rows, highlightColumn, title }) => {
  const k = Math.max(columns.length, 1);
  const colW = (W - SIDE * 2 - LABEL_W) / k;
  const rowH = (BOTTOM - TOP - HEAD_H) / Math.max(rows.length, 1);
  const colX = (c: number) => SIDE + LABEL_W + c * colW;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: C_BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${W} ${H}`}
        width="94%"
        height="94%"
        preserveAspectRatio="xMidYMid meet"
        fontFamily="sans-serif"
      >
        {title !== undefined && (
          <text x={W / 2} y={80} textAnchor="middle" fontSize={48} fontWeight={700} fill={C_TEXT}>
            {title}
          </text>
        )}
        {/* 見出しの行 */}
        {columns.map((col, c) => {
          const hi = highlightColumn === c;
          return (
            <g key={`h${c}`}>
              <rect x={colX(c)} y={TOP} width={colW} height={HEAD_H} fill={hi ? C_HI_STROKE : C_HEAD} stroke="#ffffff" strokeWidth={3} />
              <text
                x={colX(c) + colW / 2}
                y={TOP + HEAD_H / 2 + 12}
                textAnchor="middle"
                fontSize={fitFontSize(col, colW - 24, 34)}
                fontWeight={700}
                fill="#ffffff"
              >
                {col}
              </text>
            </g>
          );
        })}
        {/* 本体の行 */}
        {rows.map((row, r) => {
          const y = TOP + HEAD_H + r * rowH;
          const cy = y + rowH / 2;
          return (
            <g key={`r${r}`}>
              <rect x={SIDE} y={y} width={LABEL_W} height={rowH} fill={C_CELL} stroke={C_LINE} strokeWidth={2} />
              <text x={SIDE + 20} y={cy + 11} fontSize={fitFontSize(row.label, LABEL_W - 36, 32)} fontWeight={700} fill={C_TEXT}>
                {row.label}
              </text>
              {row.cells.map((cell, c) => {
                const hi = highlightColumn === c;
                return (
                  <g key={c}>
                    <rect x={colX(c)} y={y} width={colW} height={rowH} fill={hi ? C_HI : "#ffffff"} stroke={C_LINE} strokeWidth={2} />
                    <text
                      x={colX(c) + colW / 2}
                      y={cy + 11}
                      textAnchor="middle"
                      fontSize={fitFontSize(cell, colW - 28, 30)}
                      fontWeight={hi ? 700 : 400}
                      fill={C_TEXT}
                    >
                      {cell}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* 強調の列の外枠 */}
        {highlightColumn !== undefined && highlightColumn >= 0 && highlightColumn < k && (
          <rect
            x={colX(highlightColumn)}
            y={TOP}
            width={colW}
            height={BOTTOM - TOP}
            fill="none"
            stroke={C_HI_STROKE}
            strokeWidth={6}
          />
        )}
      </svg>
    </div>
  );
};
