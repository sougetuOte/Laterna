/**
 * Remotion CLI の本体（@remotion/cli の remotion-cli.js）の絶対パス。render-all-script.mjs と
 * build-script-pdf.mjs が、シェルを通さずに `node <このパス> render|still …` で呼ぶために使う。
 *
 * npx（Windows では npx.cmd）はシェルを通さないと起動できず、シェルを通すと引数がエスケープされずに
 * つながれる（Node の DEP0190）。npx が最後に動かすのも、node でこの remotion-cli.js を実行する形
 * （node_modules/.bin/remotion.cmd の最終行）なので、それを process.execPath で直接呼ぶ。
 */

import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const packageJsonPath = require.resolve("@remotion/cli/package.json");
const { bin } = require("@remotion/cli/package.json");

export const REMOTION_CLI = path.join(path.dirname(packageJsonPath), bin.remotion);
