#!/usr/bin/env node
/**
 * compile-script.mjs — 台本コンパイラ CLI の薄い node ラッパー
 *
 * 出自: docs/specs/script-engine/design.md §11.2（外形契約
 *   `node scripts/compile-script.mjs <script-id>`、bash `$1` 非依存の node ラッパー方式）
 * 対応タスク: docs/specs/script-engine/tasks.md W25-script-engine-T31
 *
 * Usage:
 *   npm run compile:script -- <script-id> [--force-resynth]
 *   node scripts/compile-script.mjs java-vs-js
 *
 * TS パイプライン本体は src/script-engine/compiler/cli.ts。tsx（devDependency）の
 * CJS API で単一プロセス内にロードする（Windows の child_process spawn 問題を回避）。
 * `tsx/esm/api` の register() ではなく `tsx/cjs/api` の require を使う理由は
 * cli.ts 冒頭の自己申告コメントを参照（本プロジェクトの TS 群は tsconfig
 * `module: commonjs` + `__dirname` + 拡張子なし import の CJS スタイルであり、
 * ESM フックのみではネスト require が MODULE_NOT_FOUND になることを実機確認済み）。
 */

import process from "node:process";
import { require as tsxRequire } from "tsx/cjs/api";

const { runCompileScriptCli } = tsxRequire(
  "../src/script-engine/compiler/cli.ts",
  import.meta.url,
);

const exitCode = await runCompileScriptCli(process.argv.slice(2));
process.exitCode = exitCode;
