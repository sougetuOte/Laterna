/**
 * script-engine — クレジット区間の尺（compile と描画が共有する定数）
 *
 * design §7.5: 末尾のクレジット区間は 3 秒（fps=30 で 90 frames）。compile（`compiler/manifest.ts` が
 * 総尺に足す）と描画（`compositions/ScriptComposition.tsx` が区間の開始 frame を逆算する）の両方が使う。
 * 描画側は Node 専用の compiler を import できないので、両方から読める shared/ に置く
 * （`component-names.ts` と同じ置き場）。
 */
export const CREDIT_REGION_SECONDS = 3;
