#!/usr/bin/env node
/**
 * render-all-script.mjs — compile → render（MP4） → pdf の統一実行ラッパー
 *
 * 出自: docs/specs/script-engine/design.md §11.2（`render:all:script` は node ラッパーとして
 *   確定。bash `$1` 展開・`&&` 連結には依存しない、Windows Git Bash 互換性を構造的に確保）
 * 対応タスク: docs/specs/script-engine/tasks.md W4-script-engine-T19
 *
 * Usage:
 *   npm run render:all:script -- <script-id>
 *   node scripts/render-all-script.mjs java-vs-js
 *
 * scripts/compile-script.mjs → `remotion render` → scripts/build-script-pdf.mjs を
 * Node の child_process（execFileSync）経由で順次呼び出す。各段の exit code が非 0 の場合は
 * 即中断し、どの段で失敗したかを明示して終了する（fail-fast）。
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, unlinkSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { exitUnlessValidScriptId } from "./script-id.mjs";

const OUTPUT_DIR = "out/script-engine";
const COMPOSITION_ID = "ScriptComposition";

function usage() {
  return "Usage: node scripts/render-all-script.mjs <script-id>";
}

const scriptId = process.argv[2];
// 下の runStep は Windows で shell: true になる。シェルに渡る前に文字種を検査する（scripts/script-id.mjs）。
exitUnlessValidScriptId(scriptId, usage());

mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * 1 段を実行する。失敗したら段名を明示して即 process.exit(1)（fail-fast）。
 *
 * `onFailure`（FIX-7a）: 失敗時に process.exit(1) する前に呼び出すクリーンアップ用コールバック。
 * `process.exit()` は JS の例外送出を経由せず即座にプロセスを終了するため、呼び出し元の
 * try/finally には引っかからない（finally が実行されない既知の挙動）。そのため失敗パスの
 * クリーンアップは呼び出し元の finally ではなく、ここで明示的に呼び出す必要がある。
 */
function runStep(stepName, command, args, { onFailure } = {}) {
  console.log(`[render-all-script] [${stepName}] START: ${command} ${args.join(" ")}`);
  const startedAt = Date.now();
  try {
    execFileSync(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
  } catch (err) {
    console.error(`[render-all-script] [${stepName}] FAILED.`);
    console.error(`[render-all-script] command: ${command} ${args.join(" ")}`);
    console.error(`[render-all-script] error: ${err && err.message ? err.message : err}`);
    if (onFailure) {
      onFailure();
    }
    process.exit(1);
  }
  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[render-all-script] [${stepName}] DONE (${elapsedSec}s)`);
}

console.log(`[render-all-script] script-id='${scriptId}'`);

// --- Step 1: compile ---
runStep("compile", "node", ["scripts/compile-script.mjs", scriptId]);

// --- Step 2: render (MP4) ---
// T18 申し送り: defaultProps 依存にせず --props を明示する。build-script-pdf.mjs と同型に、
// Windows のコマンドライン引用符エスケープの癖を避けるため props はファイル経由で渡す。
const propsPath = path.join(OUTPUT_DIR, `${scriptId}-render-props.json`);
await writeFile(propsPath, JSON.stringify({ scriptId }), "utf-8");
const mp4Path = path.join(OUTPUT_DIR, `${scriptId}.mp4`);

// FIX-7a: 自分が書いた props 一時ファイルのみを、成功・失敗どちらの経路でも削除する
// （build-script-pdf.mjs の「自 run が書いた temp のみ削除」方針と同型、対象は 1 ファイルのみ）。
function cleanupRenderPropsFile() {
  try {
    unlinkSync(propsPath);
  } catch (err) {
    if (err && err.code !== "ENOENT") {
      console.warn(
        `[render-all-script] Warning: could not delete ${propsPath}: ${
          err && err.message ? err.message : err
        }`,
      );
    }
  }
}

runStep(
  "render",
  "npx",
  ["remotion", "render", "src/index.ts", COMPOSITION_ID, mp4Path, `--props=${propsPath}`],
  { onFailure: cleanupRenderPropsFile },
);
cleanupRenderPropsFile();

// --- Step 3: pdf ---
runStep("pdf", "node", ["scripts/build-script-pdf.mjs", scriptId]);

console.log(`[render-all-script] ✓ done. outputs:`);
console.log(`  - ${mp4Path}`);
console.log(`  - ${path.join(OUTPUT_DIR, `${scriptId}.pdf`)}`);
