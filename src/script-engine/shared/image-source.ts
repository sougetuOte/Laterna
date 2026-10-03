/**
 * script-engine — 画像の出典の 1 行（compile と描画が共有する）
 *
 * Wave 5（docs/design.md (b)、brief §9 の D7 訂正）：`type: image` のスライドの出典を、
 * 動画の画像の下・PDF・クレジット（manifest の credits[]）で同じ文にする。
 * 描画側は Node 専用の compiler を import できないので、両方から読める shared/ に置く
 * （`credit-region.ts` と同じ置き場）。
 */
import type { ImageSource } from "../schema/script";

/** 出典の 1 行に出すライセンスの表記。 */
export function formatImageLicense(license: ImageSource["license"]): string {
  switch (license) {
    case "PD":
      return "パブリックドメイン";
    case "self":
      return "自作";
    case "quotation":
      return "引用";
    default:
      return license.replace(/^CC-BY-/, "CC BY ");
  }
}

/** 出典の 1 行（例：`出典：作者／CC0／https://…`。引用は末尾に取得日）。 */
export function formatImageSourceLine(source: ImageSource): string {
  const retrieved = source.retrieved ? `（${source.retrieved} 取得）` : "";
  return `出典：${source.author}／${formatImageLicense(source.license)}／${source.source_url}${retrieved}`;
}
