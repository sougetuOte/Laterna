/**
 * RunFlow — 「Pythonが動くまで」（script-id: python-runs）専用の図解部品。
 *
 * 箱と矢印の横一列（レーン）を、1〜3 本縦に並べる。コンパイラとインタプリタの流れを並べる、
 * CPython の 2 段階を描く、OS ごとの Python 本体を並べる、の 3 通りに使う。
 * 中身は台本 YAML の props で渡す（事実は台本と outline.md の出典に置き、部品には持たない）。
 * 見た目は about-c の部品と揃える（白いパネル・SVG の viewBox 固定・大きな文字・矢じりは線に埋もれない大きさ）。
 * 箱に収まらない文字は、文字数から幅を見積もって小さくする（全角 1.0、半角 0.6 文字分）。
 */

import React from "react";

export interface RunFlowStep {
  /** 箱の中の名前（例：「コンパイラ」） */
  name: string;
  /** 名前の下の説明（1 行、省略可） */
  sub?: string;
}

export interface RunFlowLane {
  /** レーンの左に出す名前（省略可。どれか 1 本にあれば、全レーンに左の欄を取る） */
  label?: string;
  steps: RunFlowStep[];
}

export interface RunFlowProps {
  lanes: RunFlowLane[];
  /** 強調する箱の番号（0 始まり。全レーンに当てる。隣り合う強調の箱の間の矢印も強調） */
  highlight?: number[];
  /** 強調するレーンの番号（0 始まり。ほかのレーンは薄くする） */
  highlightLane?: number;
  /** 図の上に出す見出し（省略可） */
  title?: string;
}

const W = 1500;
const H = 760;
const TOP = 140; // 最初のレーンの上端
const BOTTOM = 730; // 最後のレーンの下端
const SIDE = 40; // 左右の余白
const LABEL_W = 220; // レーン名の欄
const ARROW_GAP = 76; // 箱と箱の間（矢印の長さ）
const LANE_GAP = 40;

const C_BG = "#ffffff";
const C_BOX = "#d9eaf7";
const C_BOX_STROKE = "#2c5878";
const C_HI = "#fff3cd";
const C_HI_STROKE = "#e85d1a";
const C_TEXT = "#1a3a52";
const C_SUB = "#4a5a68";

/** 文字列の幅を「全角 1 文字 = 1」で見積もる（半角は 0.6） */
export function textUnits(s: string): number {
  let u = 0;
  for (const ch of s) u += ch.charCodeAt(0) <= 0x7f ? 0.6 : 1;
  return u;
}

/** 幅 width に収まる文字の大きさ（base を上限、min を下限） */
export function fitFontSize(s: string, width: number, base: number, min = 20): number {
  const u = textUnits(s);
  if (u === 0) return base;
  return Math.max(min, Math.min(base, Math.floor(width / u)));
}

export const RunFlow: React.FC<RunFlowProps> = ({ lanes, highlight, highlightLane, title }) => {
  const n = Math.max(lanes.length, 1);
  const hasLabel = lanes.some((l) => l.label !== undefined);
  const x0 = SIDE + (hasLabel ? LABEL_W : 0);
  const laneH = (BOTTOM - TOP - LANE_GAP * (n - 1)) / n;
  // 1 本だけのときは箱を高く、文字を大きくする（2026-09-28 の試し書き出しで小さく見えた）
  const boxH = Math.min(laneH, n === 1 ? 270 : 220);
  const nameBase = n === 1 ? 52 : n === 2 ? 40 : 34;
  const subBase = n === 1 ? 34 : n === 2 ? 28 : 26;
  const hiSet = new Set(highlight ?? []);

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
          <marker id="rf-arrow" markerWidth="28" markerHeight="28" refX="20" refY="14" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="0 0, 28 14, 0 28" fill={C_BOX_STROKE} />
          </marker>
          <marker id="rf-arrow-hi" markerWidth="34" markerHeight="34" refX="24" refY="17" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="0 0, 34 17, 0 34" fill={C_HI_STROKE} />
          </marker>
        </defs>
        {title !== undefined && (
          <text x={W / 2} y={80} textAnchor="middle" fontSize={48} fontWeight={700} fill={C_TEXT}>
            {title}
          </text>
        )}
        {lanes.map((lane, li) => {
          const laneTop = TOP + li * (laneH + LANE_GAP);
          const cy = laneTop + laneH / 2;
          const k = Math.max(lane.steps.length, 1);
          const boxW = (W - SIDE - x0 - ARROW_GAP * (k - 1)) / k;
          const laneHi = highlightLane === li;
          const dim = highlightLane !== undefined && !laneHi;
          return (
            <g key={li} opacity={dim ? 0.4 : 1}>
              {lane.label !== undefined && (
                <text
                  x={SIDE + LABEL_W / 2 - 10}
                  y={cy + 12}
                  textAnchor="middle"
                  fontSize={fitFontSize(lane.label, LABEL_W - 30, 36)}
                  fontWeight={700}
                  fill={laneHi ? C_HI_STROKE : C_TEXT}
                >
                  {lane.label}
                </text>
              )}
              {lane.steps.map((step, si) => {
                const x = x0 + si * (boxW + ARROW_GAP);
                const hi = laneHi || hiSet.has(si);
                const nameFs = fitFontSize(step.name, boxW - 30, nameBase);
                const subFs = step.sub !== undefined ? fitFontSize(step.sub, boxW - 24, subBase) : 0;
                const nameY = step.sub !== undefined ? cy - 6 : cy + nameFs * 0.35;
                const arrowHi = si > 0 && (laneHi || (hiSet.has(si) && hiSet.has(si - 1)));
                return (
                  <g key={si}>
                    {si > 0 && (
                      <path
                        d={`M ${x - ARROW_GAP + 8},${cy} L ${x - 10},${cy}`}
                        stroke={arrowHi ? C_HI_STROKE : C_BOX_STROKE}
                        strokeWidth={arrowHi ? 8 : 6}
                        fill="none"
                        markerEnd={arrowHi ? "url(#rf-arrow-hi)" : "url(#rf-arrow)"}
                      />
                    )}
                    <rect
                      x={x}
                      y={cy - boxH / 2}
                      width={boxW}
                      height={boxH}
                      rx={14}
                      fill={hi ? C_HI : C_BOX}
                      stroke={hi ? C_HI_STROKE : C_BOX_STROKE}
                      strokeWidth={hi ? 6 : 3}
                    />
                    <text x={x + boxW / 2} y={nameY} textAnchor="middle" fontSize={nameFs} fontWeight={700} fill={hi ? C_HI_STROKE : C_TEXT}>
                      {step.name}
                    </text>
                    {step.sub !== undefined && (
                      <text x={x + boxW / 2} y={cy + subFs + 14} textAnchor="middle" fontSize={subFs} fill={C_SUB}>
                        {step.sub}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
