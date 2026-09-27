/**
 * CTimeline — 「C言語について」（script-id: about-c）専用の図解部品。
 *
 * 年表を横一列に描く。出来事は台本 YAML の props で渡す（年と出来事の出典は outline.md の「事実と出典の対応」）。
 * 年は線の上、出来事の説明は線の下に揃える（2026-09-27 の試写で、上下に交互に置いた版は読みにくかった）。
 * 説明は 1 行を短くし、改行文字で行を分ける。`highlight` で 1 つを強調する。
 */

import React from "react";

export interface CTimelineItem {
  /** 年（例：「1972」） */
  year: string;
  /** 出来事（改行文字で行を分ける） */
  label: string;
}

export interface CTimelineProps {
  items: CTimelineItem[];
  /** 強調する出来事の添字（0 始まり。省略時は強調なし） */
  highlight?: number;
  /** 図の上に出す見出し（省略可） */
  title?: string;
}

const W = 1500;
const H = 700;
const LINE_Y = 300;
const X0 = 150;
const X1 = 1350;
const YEAR_Y = LINE_Y - 44;
const LABEL_Y0 = LINE_Y + 80;
const LABEL_STEP = 44;

const C_BG = "#ffffff";
const C_LINE = "#2c5878";
const C_DOT = "#d9eaf7";
const C_HI = "#fff3cd";
const C_HI_STROKE = "#e85d1a";
const C_TEXT = "#1a3a52";
const C_SUB = "#4a5a68";

export const CTimeline: React.FC<CTimelineProps> = ({ items, highlight, title }) => {
  const step = items.length > 1 ? (X1 - X0) / (items.length - 1) : 0;
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
          <text x={W / 2} y={90} textAnchor="middle" fontSize={52} fontWeight={700} fill={C_TEXT}>
            {title}
          </text>
        )}
        <path d={`M ${X0 - 80},${LINE_Y} L ${X1 + 80},${LINE_Y}`} stroke={C_LINE} strokeWidth={6} fill="none" />
        {items.map((it, i) => {
          const x = items.length > 1 ? X0 + i * step : W / 2;
          const hi = highlight === i;
          const lines = it.label.split("\n");
          return (
            <g key={`${it.year}-${i}`}>
              <circle cx={x} cy={LINE_Y} r={hi ? 22 : 16} fill={hi ? C_HI : C_DOT} stroke={hi ? C_HI_STROKE : C_LINE} strokeWidth={hi ? 6 : 4} />
              <text x={x} y={YEAR_Y} textAnchor="middle" fontSize={hi ? 46 : 40} fontWeight={700} fill={hi ? C_HI_STROKE : C_TEXT}>
                {it.year}
              </text>
              {lines.map((line, j) => (
                <text
                  key={j}
                  x={x}
                  y={LABEL_Y0 + j * LABEL_STEP}
                  textAnchor="middle"
                  fontSize={34}
                  fontWeight={hi ? 700 : 400}
                  fill={hi ? C_HI_STROKE : C_SUB}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
