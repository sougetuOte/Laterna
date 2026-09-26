/**
 * script-id の検査（render-all-script.mjs・build-script-pdf.mjs が共有する）。
 *
 * Windows では npx（npx.cmd）を呼ぶために execFileSync を shell: true で使い、そのとき引数はエスケープされない。
 * cmd が解釈する文字（& | > % など）や空白が script-id に入ると別のコマンドとして実行されるので、
 * 英数字・ハイフン・アンダースコア（先頭は英数字）だけを通す。
 * compile の入口（src/script-engine/compiler/cli.ts の SCRIPT_ID_PATTERN）も同じ規則。
 */

import process from "node:process";

export const SCRIPT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/** script-id が無い・規則に合わないときは、使い方を出して終了する。 */
export function exitUnlessValidScriptId(scriptId, usage) {
  if (!scriptId) {
    console.error("Error: script-id is required.");
    console.error(usage);
    process.exit(1);
  }
  if (!SCRIPT_ID_PATTERN.test(scriptId)) {
    console.error(
      `Error: script-id に使えるのは英数字・ハイフン・アンダースコアだけです（先頭は英数字）: "${scriptId}".`,
    );
    console.error(usage);
    process.exit(1);
  }
}
