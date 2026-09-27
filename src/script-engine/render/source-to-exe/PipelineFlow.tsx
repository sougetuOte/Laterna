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
 *
 * 2026-09-26 の初回 render で 3 点を直した：(1) 段階名と説明文が産物の箱の行と重なっていたので、
 * 段階名＋説明は箱の上、産物の名前は箱の下に分けた。(2) 右端の a.exe の箱が viewBox からはみ出していた
 * ので中心間隔を 320 → 300 にした。(3) custom スライドは標準スライド（bullets・code）と違って白いパネルが
 * 無く、濃紺の文字が暗い背景に沈んでいたので、外側の div を白にして標準スライドと同じ見た目に揃えた。
 *
 * 2026-09-27 に 2 点を直した（点検 R1・R2、主人の判断で 1 本目を書き出し直すときに）：(1) stage 0（強調なし）
 * でも hello.c の箱が強調されていた（産物の強調を stage === i で判定していたため）。(2) 強調した矢印の矢じり
 * （高さ 8）が太さ 8 の線に埋もれて見えなかったので、強調用の矢じりを大きくした。
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
const BOX_Y = 360; // 産物の箱の中心 y（箱は 300〜420）
const STEP = 300; // 産物の中心間隔（5 個で 150〜1350。両端の余白 50）
const X0 = 150; // 最初の産物の中心 x
const STAGE_NAME_Y = 215; // 段階名（箱の上）
const STAGE_SUB_Y = 254; // 段階の説明（段階名の下、箱の上）
const ARTIFACT_SUB_Y = BOX_Y + BOX_H / 2 + 44; // 産物の説明（箱の下）

const C_BG = "#ffffff";
const C_BOX = "#d9eaf7";
const C_BOX_STROKE = "#2c5878";
const C_HI = "#fff3cd";
const C_HI_STROKE = "#e85d1a";
const C_TEXT = "#1a3a52";
const C_SUB = "#4a5a68";
const C_ARROW = "#2c5878";

export const PipelineFlow: React.FC<PipelineFlowProps> = ({ stage = 0, title }) => {
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
          <marker id="pf-arrow" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="0 0, 12 4, 0 8" fill={C_ARROW} />
          </marker>
          <marker id="pf-arrow-hi" markerWidth="32" markerHeight="32" refX="22" refY="14" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="0 0, 30 14, 0 28" fill={C_HI_STROKE} />
          </marker>
        </defs>
        {title !== undefined && (
          <text x={W / 2} y={80} textAnchor="middle" fontSize={48} fontWeight={700} fill={C_TEXT}>
            {title}
          </text>
        )}
        {/* 段階（矢印と、その上の段階名・説明） */}
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
              <text
                x={cx}
                y={STAGE_NAME_Y}
                textAnchor="middle"
                fontSize={hi ? 38 : 32}
                fontWeight={700}
                fill={hi ? C_HI_STROKE : C_TEXT}
              >
                {i + 1}. {s.name}
              </text>
              <text x={cx} y={STAGE_SUB_Y} textAnchor="middle" fontSize={20} fill={hi ? C_HI_STROKE : C_SUB}>
                {s.sub}
              </text>
            </g>
          );
        })}
        {/* 産物（箱と、その下の説明） */}
        {ARTIFACTS.map((a, i) => {
          const cx = X0 + i * STEP;
          const hi = stage > 0 && stage === i; // 段階 k（1〜4）の行き先は産物 k。stage 0 は強調なし
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
              <text x={cx} y={BOX_Y + 12} textAnchor="middle" fontSize={36} fontWeight={700} fill={C_TEXT} fontFamily="monospace">
                {a.name}
              </text>
              <text x={cx} y={ARTIFACT_SUB_Y} textAnchor="middle" fontSize={26} fill={C_TEXT}>
                {a.sub}
              </text>
            </g>
          );
        })}
        <text x={W / 2} y={H - 40} textAnchor="middle" fontSize={24} fill={C_SUB}>
          gcc の翻訳は最大 4 段階、必ずこの順（GCC Manual, Overall Options）
        </text>
      </svg>
    </div>
  );
};
