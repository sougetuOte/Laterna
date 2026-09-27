/**
 * LanguageLevels — 「C言語について」（script-id: about-c）専用の図解部品。
 *
 * 言語を「人に近い（高水準）」から「機械に近い（低水準）」まで縦に並べ、C がその間にあることを見せる。
 * 段の中身は台本 YAML の props で渡す（事実は台本と outline.md の出典に置き、部品には持たない）。
 * 見た目は source-to-exe の PipelineFlow と揃える（白いパネル・SVG の viewBox 固定・大きな文字）。
 */

import React from "react";

export interface LanguageLevelsRow {
  /** 段の名前（例：「Python」「C」「アセンブリ」「機械語」） */
  name: string;
  /** 段の説明（1 行） */
  sub?: string;
}

export interface LanguageLevelsProps {
  /** 上（高水準）から下（低水準）の順 */
  rows: LanguageLevelsRow[];
  /** 強調する段の name（省略時は強調なし） */
  highlight?: string;
  /** 図の上に出す見出し（省略可） */
  title?: string;
}

const W = 1500;
const H = 760;
const TOP = 150; // 最上段の上端
const BOTTOM = 700; // 最下段の下端
const BOX_X = 420;
const BOX_W = 900;
const GAP = 18;

const C_BG = "#ffffff";
const C_BOX = "#d9eaf7";
const C_BOX_STROKE = "#2c5878";
const C_HI = "#fff3cd";
const C_HI_STROKE = "#e85d1a";
const C_TEXT = "#1a3a52";
const C_SUB = "#4a5a68";

export const LanguageLevels: React.FC<LanguageLevelsProps> = ({ rows, highlight, title }) => {
  const n = Math.max(rows.length, 1);
  const boxH = (BOTTOM - TOP - GAP * (n - 1)) / n;
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
        <defs>
          <marker id="ll-arrow" markerWidth="24" markerHeight="24" refX="12" refY="12" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="0 0, 24 12, 0 24" fill={C_BOX_STROKE} />
          </marker>
        </defs>
        {title !== undefined && (
          <text x={W / 2} y={80} textAnchor="middle" fontSize={48} fontWeight={700} fill={C_TEXT}>
            {title}
          </text>
        )}
        {/* 左の軸：上が人に近い、下が機械に近い */}
        <path d={`M 200,${BOTTOM - 20} L 200,${TOP + 30}`} stroke={C_BOX_STROKE} strokeWidth={6} fill="none" markerEnd="url(#ll-arrow)" />
        <path d={`M 200,${TOP + 20} L 200,${BOTTOM - 30}`} stroke={C_BOX_STROKE} strokeWidth={6} fill="none" markerEnd="url(#ll-arrow)" />
        <text x={200} y={TOP - 18} textAnchor="middle" fontSize={30} fontWeight={700} fill={C_TEXT}>
          高水準（人に近い）
        </text>
        <text x={200} y={BOTTOM + 44} textAnchor="middle" fontSize={30} fontWeight={700} fill={C_TEXT}>
          低水準（機械に近い）
        </text>
        {rows.map((r, i) => {
          const y = TOP + i * (boxH + GAP);
          const hi = highlight !== undefined && r.name === highlight;
          return (
            <g key={r.name}>
              <rect
                x={BOX_X}
                y={y}
                width={BOX_W}
                height={boxH}
                rx={14}
                fill={hi ? C_HI : C_BOX}
                stroke={hi ? C_HI_STROKE : C_BOX_STROKE}
                strokeWidth={hi ? 6 : 3}
              />
              <text x={BOX_X + 40} y={y + boxH / 2 + 14} fontSize={hi ? 44 : 40} fontWeight={700} fill={hi ? C_HI_STROKE : C_TEXT}>
                {r.name}
              </text>
              {r.sub !== undefined && (
                <text x={BOX_X + 380} y={y + boxH / 2 + 11} fontSize={28} fill={C_SUB}>
                  {r.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
