/**
 * script-engine — CreditSection 実装（末尾クレジット区間、NFR-3 担保）
 *
 * 出自: docs/specs/script-engine/design.md §7.5（クレジット表示）
 * 対応タスク: docs/specs/script-engine/tasks.md W3-script-engine-T15
 *
 * design §7.5 MUST:
 * - クレジット区間は **独立区間として描画する**（最終スライドへのオーバーレイではない）
 * - 表示内容は `speaker-profiles.yaml` 由来のクレジット表記（manifest `credits`、台本が
 *   使用した話者のみ、未使用話者は表示しない、compile 側で選別済み）をそのまま使う
 *
 * 本コンポーネントは manifest.credits をそのまま 1 行ずつ中央表示するのみで、選別ロジックは
 * 持たない（render 側の入力は manifest のみ、design §6.1）。
 */

import React from "react";
import { AbsoluteFill } from "remotion";

export interface CreditSectionProps {
  /** manifest `credits`（design §7.5、台本使用話者の初出順・重複なし）。 */
  credits: string[];
}

export const CreditSection: React.FC<CreditSectionProps> = ({ credits }) => {
  return (
    // design §7.5: 独立区間として下のレイヤー（3 カラムレイアウト等）を覆う（オーバーレイではなく
    // 背景色付きの全面塗り潰し）。フォントサイズは T16 試写で読めないと判定され 40px に拡大した
    // （v3.8 リファイン。旧: kosen 前例 22px を踏襲していたが中央スライド領域縮小との相対で小さすぎた）。
    <AbsoluteFill
      style={{
        backgroundColor: "#101820",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
      }}
    >
      {credits.map((credit, index) => (
        <div
          key={index}
          style={{
            fontSize: "40px",
            color: "#a0c0d0",
            textAlign: "center",
          }}
        >
          {credit}
        </div>
      ))}
    </AbsoluteFill>
  );
};
