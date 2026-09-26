/**
 * PipelineFlow — 「ソースから実行ファイルまで」（script-id: source-to-exe）専用の図解部品。
 *
 * gcc の 4 段階（前処理 → コンパイル → アセンブル → リンク。GCC Manual "Overall Options"）を、
 * 5 つの産物（hello.c → hello.i → hello.s → hello.o → a.exe）と 4 本の矢印で横一列に描く。
 * `stage` で強調する段階を選ぶ（0 = 強調なし、1〜4 = その段階の矢印と行き先の産物）。
 *
 * 汎用の Flowchart 部品は文字が 14px 固定で 1080p では読めないため、この台本の図だけを大きな文字で描く
 * （java-vs-js の pilot 部品と同じ「台本ごとの custom 部品」。docs/design.md (a)）。
 * SVG は viewBox 固定・幅 100% で描き、中央カラムの大きさに合わせて拡大縮小する。
 */

import React from "react";

export interface PipelineFlowProps {
  /** 0 = 全体（強調なし）、1..4 = 前処理／コンパイル／アセンブル／リンクを強調 */
  stage?: number;
  /** 図の上に出す見出し（省略可） */
  title?: string;
}

const ARTIFACTS = [
  { name: "hello.c", sub: "ソースコード" },
  { name: "hello.i", sub: "前処理済み" },
  { name: "hello.s", sub: "アセンブリ" },
  { name: "hello.o", sub: "機械語（部品）" },
  { name: "a.exe", sub: "実行ファイル" },
];
const STAGES = [
  { name: "前処理", sub: "#include を貼り付ける" },
  { name: "コンパイル", sub: "人の言葉 → CPU の言葉" },
  { name: "アセンブル", sub: "アセンブリ → 0 と 1" },
  { name: "リンク", sub: "部品とつないで 1 つに" },
];

const W = 1500;
const H = 640;
const BOX_W = 200;
const BOX_H = 120;
const BOX_Y = 300;
const STEP = 320; // 産物の中心間隔
const X0 = 130; // 最初の産物の中心 x

const C_BOX = "#d9eaf7";
const C_BOX_STROKE = "#2c5878";
const C_HI = "#fff3cd";
const C_HI_STROKE = "#ff6b35";
const C_TEXT = "#1a3a52";
const C_ARROW = "#2c5878";

export const PipelineFlow: React.FC<PipelineFlowProps> = ({ stage = 0, title }) => {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" fontFamily="sans-serif">
        <defs>
          <marker id="pf-arrow" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="0 0, 12 4, 0 8" fill={C_ARROW} />
          </marker>
          <marker id="pf-arrow-hi" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="0 0, 12 4, 0 8" fill={C_HI_STROKE} />
          </marker>
        </defs>
        {title !== undefined && (
          <text x={W / 2} y={70} textAnchor="middle" fontSize={44} fontWeight={700} fill={C_TEXT}>
            {title}
          </text>
        )}
        {/* 矢印（段階） */}
        {STAGES.map((s, i) => {
          const x1 = X0 + i * STEP + BOX_W / 2 + 8;
          const x2 = X0 + (i + 1) * STEP - BOX_W / 2 - 8;
          const cx = (x1 + x2) / 2;
          const hi = stage === i + 1;
          return (
            <g key={s.name}>
              <path
                d={`M ${x1},${BOX_Y} L ${x2},${BOX_Y}`}
                stroke={hi ? C_HI_STROKE : C_ARROW}
                strokeWidth={hi ? 8 : 4}
                fill="none"
                markerEnd={hi ? "url(#pf-arrow-hi)" : "url(#pf-arrow)"}
              />
              <text x={cx} y={BOX_Y - 40} textAnchor="middle" fontSize={hi ? 40 : 34} fontWeight={700} fill={hi ? C_HI_STROKE : C_TEXT}>
                {i + 1}. {s.name}
              </text>
              <text x={cx} y={BOX_Y + 60} textAnchor="middle" fontSize={22} fill={hi ? C_HI_STROKE : "#555"}>
                {s.sub}
              </text>
            </g>
          );
        })}
        {/* 産物 */}
        {ARTIFACTS.map((a, i) => {
          const cx = X0 + i * STEP;
          const hi = stage === i; // 段階 k の行き先は産物 k
          return (
            <g key={a.name}>
              <rect
                x={cx - BOX_W / 2}
                y={BOX_Y - BOX_H / 2}
                width={BOX_W}
                height={BOX_H}
                rx={14}
                fill={hi ? C_HI : C_BOX}
                stroke={hi ? C_HI_STROKE : C_BOX_STROKE}
                strokeWidth={hi ? 6 : 3}
              />
              <text x={cx} y={BOX_Y + 2} textAnchor="middle" fontSize={36} fontWeight={700} fill={C_TEXT} fontFamily="monospace">
                {a.name}
              </text>
              <text x={cx} y={BOX_Y + BOX_H / 2 + 40} textAnchor="middle" fontSize={26} fill={C_TEXT}>
                {a.sub}
              </text>
            </g>
          );
        })}
        <text x={W / 2} y={H - 40} textAnchor="middle" fontSize={26} fill="#555">
          gcc の翻訳は最大 4 段階、必ずこの順（GCC Manual, Overall Options）
        </text>
      </svg>
    </div>
  );
};
