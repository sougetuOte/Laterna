#!/usr/bin/env node
/**
 * build-script-pdf.mjs — pdf-manifest 駆動の PDF 出力スクリプト
 *
 * 出自: docs/specs/script-engine/design.md §8.1（PDF ページ分割は compile 段で確定し
 *   `public/manifests/<script-id>.pdf-manifest.json` を成果物として書き出す MUST。
 *   `build-script-pdf.mjs` のループ上限は pdf-manifest から読む MUST）/ §8.4（metadata 固定 MUST）/
 *   §11.1（出力先 `out/script-engine/` MUST）
 * 対応タスク: docs/specs/script-engine/tasks.md W4-script-engine-T18
 *
 * `ScriptPdfComposition`（src/compositions/ScriptPdfComposition.tsx）を `remotion still`
 * （remotion.config.ts で PDF image format 済み）でページごとに抽出し、pdf-lib で 1 冊に結合する。
 * 既存 `scripts/build-pdf.mjs`（凍結資産、変更禁止）と同型のパイプライン構造を踏襲するが、
 * 本スクリプトは pdf-manifest から動的にページ数・script-id を読む点が異なる。
 *
 * Usage:
 *   node scripts/build-script-pdf.mjs <script-id>
 *   node scripts/build-script-pdf.mjs java-vs-js   -> out/script-engine/java-vs-js.pdf
 *
 * Prerequisites:
 *   - `npm run compile:script -- <script-id>` 実行済み（pdf-manifest 生成済み）
 *   - Remotion config が Config.setStillImageFormat("pdf") 済み（remotion.config.ts）
 *   - pdf-lib installed as devDependency
 *   - ScriptPdfComposition が src/Root.tsx に登録済み
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { PDFDocument } from "pdf-lib";

import { exitUnlessValidScriptId } from "./script-id.mjs";

const TEMP_DIR = "out/script-engine-pdf-temp";
const OUTPUT_DIR = "out/script-engine";
const COMPOSITION_ID = "ScriptPdfComposition";

/** design §8.4 MUST: metadata 固定用の固定日時（T3 Spike 実証済みパターン）。 */
const EPOCH = new Date(0);

function usage() {
  return "Usage: node scripts/build-script-pdf.mjs <script-id>";
}

const scriptId = process.argv[2];
// 下の npx 呼び出しは Windows で shell: true になる。シェルに渡る前に文字種を検査する（scripts/script-id.mjs）。
exitUnlessValidScriptId(scriptId, usage());

const pdfManifestPath = path.resolve(
  "public/manifests",
  `${scriptId}.pdf-manifest.json`,
);

if (!existsSync(pdfManifestPath)) {
  console.error(`Error: pdf-manifest が見つかりません: ${pdfManifestPath}`);
  console.error(
    `  "npm run compile:script -- ${scriptId}" を実行して pdf-manifest を生成してください。`,
  );
  process.exit(1);
}

const pdfManifest = JSON.parse(await readFile(pdfManifestPath, "utf-8"));
const { total_pages: totalPages } = pdfManifest;

if (typeof totalPages !== "number" || totalPages <= 0) {
  console.error(
    `Error: pdf-manifest の total_pages が不正です（${pdfManifestPath}）: ${String(totalPages)}`,
  );
  process.exit(1);
}

const outputPath = path.join(OUTPUT_DIR, `${scriptId}.pdf`);

// Ensure temp dir and output dir exist.
mkdirSync(TEMP_DIR, { recursive: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

const tempPaths = [];

console.log(
  `[build-script-pdf] script-id='${scriptId}' composition='${COMPOSITION_ID}' pages=${totalPages}`,
);
console.log(`[build-script-pdf] temp dir: ${TEMP_DIR}`);
console.log(`[build-script-pdf] output:   ${outputPath}`);

// --- props ファイル書き出し（Windows のコマンドライン引用符エスケープの癖を避けるため、
//     インライン JSON ではなく --props=<file> のファイル経路を使う。remotion CLI の
//     getInputProps はファイルパス / インライン JSON のいずれも受け付ける）。 ---
const propsPath = path.join(TEMP_DIR, `${scriptId}-props.json`);
await writeFile(propsPath, JSON.stringify({ scriptId }), "utf-8");
tempPaths.push(propsPath);

// --- 各ページを `remotion still` で PDF 抽出（design §8.1 MUST: ループ上限は
//     pdf-manifest.total_pages から読む）。 ---
for (let frame = 0; frame < totalPages; frame += 1) {
  const humanIndex = frame + 1;
  // FIX-7b: ファイル名に process.pid を含める。同一 script-id の並行実行（例: CI と手動実行が
  // 重なる）で temp ファイル名が衝突すると、片方の run が他方の temp を上書き/削除してしまう
  // （「各 run が自身の tempPaths[] のみ削除」の既存規律の前提が崩れる）ため、run を一意識別する。
  const tempFile = path.join(TEMP_DIR, `${scriptId}-${process.pid}-${frame}.pdf`);
  tempPaths.push(tempFile);

  console.log(`[${humanIndex}/${totalPages}] Rendering frame ${frame} -> ${tempFile}`);

  // execFileSync + 引数配列。Windows では npx（npx.cmd）を呼ぶために shell: true が要り、そのとき引数は
  // エスケープされない（シェルが解釈する）。script-id は冒頭で文字種を検査済み（scripts/script-id.mjs）。
  const npxArgs = [
    "remotion",
    "still",
    `--frame=${frame}`,
    `--props=${propsPath}`,
    "src/index.ts",
    COMPOSITION_ID,
    tempFile,
  ];

  try {
    execFileSync("npx", npxArgs, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
  } catch (err) {
    console.error(
      `[build-script-pdf] FAILED to render frame ${frame} for composition '${COMPOSITION_ID}'.`,
    );
    console.error(`[build-script-pdf] command: npx ${npxArgs.join(" ")}`);
    console.error(`[build-script-pdf] error: ${err && err.message ? err.message : err}`);
    console.error(
      `[build-script-pdf] Leaving ${TEMP_DIR} intact for debugging (no cleanup performed).`,
    );
    process.exit(1);
  }

  console.log(`[${humanIndex}/${totalPages}] Rendered page ${humanIndex}`);
}

// --- Merge per-frame PDFs into master via pdf-lib, with fixed metadata (design §8.4 MUST). ---
try {
  console.log(`[build-script-pdf] Merging ${totalPages} pages into ${outputPath} ...`);
  const master = await PDFDocument.create();

  for (let frame = 0; frame < totalPages; frame += 1) {
    // FIX-7b: 生成時（上のループ）と同じファイル名規則（process.pid 込み）で再計算する。
    const tempFile = path.join(TEMP_DIR, `${scriptId}-${process.pid}-${frame}.pdf`);
    const bytes = await readFile(tempFile);
    const doc = await PDFDocument.load(bytes);
    const pages = await master.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => master.addPage(page));
  }

  // design §8.4 MUST: 決定性確保のため CreationDate/ModificationDate を固定値に明示設定する。
  master.setCreationDate(EPOCH);
  master.setModificationDate(EPOCH);

  const outBytes = await master.save();
  await writeFile(outputPath, outBytes);
} catch (err) {
  console.error(
    `[build-script-pdf] pdf-lib merge failed: ${err && err.message ? err.message : err}`,
  );
  console.error(
    `[build-script-pdf] Leaving ${TEMP_DIR} intact for debugging (no cleanup performed).`,
  );
  process.exit(1);
}

// --- Clean up this run's temp files only (leave sibling runs untouched, build-pdf.mjs 同一方針). ---
for (const tempFile of tempPaths) {
  try {
    unlinkSync(tempFile);
  } catch (err) {
    console.warn(
      `[build-script-pdf] Warning: could not delete ${tempFile}: ${
        err && err.message ? err.message : err
      }`,
    );
  }
}

// --- Final summary. ---
const finalSize = statSync(outputPath).size;
const kb = (finalSize / 1024).toFixed(1);
console.log(`✓ ${outputPath} (${totalPages} pages, ${kb} KB)`);
