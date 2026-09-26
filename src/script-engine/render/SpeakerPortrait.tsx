/**
 * script-engine — SpeakerPortrait 実装（立ち絵表示 + 発話中話者強調）
 *
 * 出自: docs/specs/script-engine/design.md §3.3（立ち絵アセット参照・話者強調表示、FR-8）/
 *   §7（2 話者レイアウト、narrator=左 / listener=右 固定）
 * 対応タスク: docs/specs/script-engine/tasks.md W3-script-engine-T15 / T16（v3.8 リファイン）
 *
 * props は v3.6 訂正済みの形（tasks.md T15 完了条件）: render の入力は manifest のみ
 * （design §6.1「render 側の入力は manifest のみ」原則）のため、`SpeakerProfile` 全体ではなく
 * manifest `speakers[role].portrait_asset_key`（design §4.3 v3.6）由来の値のみを受け取る。
 *
 * **v3.8 改訂（T16 試写・ユーザー裁定 2026-07-12、design §3.3 / §7）**: 強調手段は
 * **明度差のみ**（発話中 100% / 非発話中 55%）とし、枠線（box-shadow 縁取り）・話者別枠線色固定は
 * 撤去した（box-shadow が透過 PNG の余白込みの「四角い枠」として視認され違和感があったため）。
 * また右カラム（listener）の立ち絵は `scaleX(-1)` で左右反転し、画面内側（スライド側）を向かせる。
 */

import React from "react";
import { Img, staticFile } from "remotion";

export interface SpeakerPortraitProps {
  /** manifest `speakers[role].portrait_asset_key`（design §4.3 v3.6）由来の立ち絵論理キー。 */
  portraitAssetKey: string;
  /** design §3.3: 発話中（true）か非発話中（false）か。 */
  isActive: boolean;
  /** design §7: 画面上の左右位置（narrator=left / listener=right 固定）。right は v3.8 で左右反転が加わる。 */
  position: "left" | "right";
}

/** design §3.3 決定案 B（v3.8 改訂後）: 非発話中の明度（`filter: brightness(0.55)`）。 */
const INACTIVE_BRIGHTNESS = "brightness(0.55)";
/** design §3.3 決定案 B（v3.8 改訂後）: 発話中の明度（明度 100%）。 */
const ACTIVE_BRIGHTNESS = "brightness(1)";

export const SpeakerPortrait: React.FC<SpeakerPortraitProps> = ({
  portraitAssetKey,
  isActive,
  position,
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        // T16 試写リファイン（2026-07-12）: listener（右）= 浮遊型ロボットのため下端から浮かせ、
        // 頭頂がおおよそ narrator の首の高さ（下端から約 60px 上）に来るようにする（浮遊感の表現）。
        // narrator（左）は接地キャラのため下端揃えのまま。
        paddingBottom: position === "right" ? 60 : 0,
        boxSizing: "border-box",
      }}
    >
      {/* design §4.4: 立ち絵アセット欠落は明示エラーで停止 MUST NOT（プレースホルダでの黙認続行禁止）。
          Remotion の <Img> は `staticFile()` 解決先が存在しない場合に render を fail させるため、
          <img> ではなく <Img> を使うことでこの方針を構造的に担保する。 */}
      <Img
        src={staticFile(`portraits/${portraitAssetKey}.png`)}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          // design §3.3 決定案 B（v3.8 改訂後）: 発話中 = 明度 100%、非発話中 = 明度 55%（枠線なし）。
          filter: isActive ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS,
          // design §7 v3.8: 右カラム（listener）は左右反転して画面内側（スライド側）を向かせる。
          transform: position === "right" ? "scaleX(-1)" : undefined,
        }}
      />
    </div>
  );
};
