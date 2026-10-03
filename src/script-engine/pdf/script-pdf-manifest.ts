/**
 * script-engine — PDF manifest 自動導出実装（script-pdf-manifest）
 *
 * 出自: docs/specs/script-engine/design.md §8.1（台本からの導出 / decision: ページ分割は compile 段
 *   で確定し `public/manifests/<script-id>.pdf-manifest.json` を書き出す MUST）/ §8.2（話者情報の
 *   扱い、聞き役 = 罫線インデント区別・相槌 pdf_visibility: hidden の除外）/ §8.3（D-19 overflow
 *   解消: 1 ページあたりの文字数上限を設け、超過時は同一スライドを複数 PDF ページへ自動分割）/
 *   §9.1（char_count の定義: 空白を除く・句読点を含む文字数）
 * 対応タスク: docs/specs/script-engine/tasks.md W4-script-engine-T17
 *
 * 台本（`ScriptDocument`）+ 確定済み timeline manifest（`TimelineManifest`）から、PDF ページ分割
 * 情報（`PdfManifest`）を自動導出する純粋関数を提供する。旧 `src/pdf/`（凍結資産）とは別系統の
 * 新実装であり、`PageEntry[]` 相当のデータ構造を台本 SSOT から compile 時に自動生成する
 * （人間が手書きしない、design §8.1 の未解決質問への回答）。
 *
 * 本ファイルはファイル I/O を持たない純粋関数のみを提供する（`generateManifest`
 * (`compiler/manifest.ts`) と同様に、書き出し自体は呼び出し側（`compiler/cli.ts`）が担当する
 * 設計方針に揃える）。
 */

import path from "node:path";
import { countSpeechCharacters } from "../compiler/estimate";
import type { ScriptDocument, Utterance } from "../schema/script";
import { KNOWN_SPEAKER_ROLES } from "../schema/script";
import type { TimelineManifest } from "../schema/timeline-manifest";

/**
 * design §8.2 決定（採用案 C）: 解説役（narrator）の発話 = 地の文（"body"）、
 * 聞き役（listener）の発話 = 罫線インデント区別（"aside"）。
 */
export interface PdfPageBlock {
  /** ManifestUtterance.id（= Utterance.id）。 */
  utterance_id: string;
  /** 話者役割名（narrator / listener）。 */
  speaker: string;
  /** 発話本文（台本の text をそのまま、改変しない）。 */
  text: string;
  /** "body" = 地の文（narrator）/ "aside" = 罫線インデント区別（listener）。design §8.2。 */
  style: "body" | "aside";
}

/** 1 PDF ページ分（design §8.1 の `PageEntry` 相当）。 */
export interface PdfPageEntry {
  /** 全体通し、1 始まり。 */
  page_number: number;
  /** Slide.id（このページが属するスライド）。 */
  slide_id: string;
  /** このスライド内で何ページ目か（1 始まり）。 */
  slide_page_index: number;
  /** このスライドが何ページに分割されたか。 */
  slide_page_count: number;
  blocks: PdfPageBlock[];
}

/** `public/manifests/<script-id>.pdf-manifest.json` として書き出されるトップレベル構造。 */
export interface PdfManifest {
  schema_version: 1;
  script_id: string;
  /** 分割に使った文字数上限（design §8.3。T18 の Spike 実測確定前は仮値、記録として残す）。 */
  char_limit: number;
  pages: PdfPageEntry[];
  total_pages: number;
}

/**
 * design §8.3: 1 ページあたりの本文文字数上限。
 *
 * W4-script-engine-T18 Spike 実測確定（実測限界 1000〜1100 字（`ScriptPdfComposition` の
 * 実レイアウト: A4 横・本文 22px/1.7・2 段組・スライド面 500px 固定）× 0.85 ≒ 900、2026-07-13）。
 *
 * 実測方法: `java-vs-js.pdf-manifest.json` の 1 ページを合成長文ブロックに一時差し替え、
 * `remotion still` で実描画し目視確認（Read ツールで PDF を視覚的に確認）。1000 字までは
 * 全ブロックが正しく描画されたが、1100 字以上では 1 発話ブロックが CSS 2 段組の overflow:hidden
 * によって丸ごと非表示になる（D-19 同型の overflow）ことを確認した。900 字は非最終ページ・
 * 最終ページ（フッタ分の余白減少込み）の両方で実描画確認済み（安全マージン適用後の値として
 * 追加検証が不要なレベルの余白を実測）。
 *
 * Wave 5（2026-10-03）で A4 縦・本文 1 段組（幅 1128px）に組み直し、同じ方法で測り直して 450 にした。
 * python-runs の実際の発話を並べて差し替えると、866 字（17 発話）は最後の発話が下で切れ、
 * 最終ページの 587 字（12 発話）は注記 3 行でページの下端に届いた。3 本目の最終ページの注記は
 * 画像の出典を足して 7 行ほどになるので、その分（本文 3 行、約 150 字）を引いた。
 * 4 本の台本で本文がいちばん多いページは 413 字（python-runs）なので、900 から 450 にしても
 * ページの分け方は変わらない。
 */
export const PDF_PAGE_CHAR_LIMIT = 450;

/** `public/manifests/<script-id>.pdf-manifest.json` の既定書出し先。 */
export function resolveDefaultPdfManifestOutputPath(scriptId: string): string {
  return path.resolve(__dirname, "../../../public/manifests", `${scriptId}.pdf-manifest.json`);
}

/** 1 スライドに帰属する発話ブロック群（分割前）。 */
interface SlideBlockGroup {
  slideId: string;
  blocks: PdfPageBlock[];
}

/**
 * design §8.1: 各発話を「event.start_frame <= utterance.start_frame < 次 event.start_frame」の
 * ルールでスライドイベントへ帰属させる。最初の slide_event より前に始まる発話は最初のスライドに
 * 帰属する。`manifest.slide_events` は compile 時に狭義単調増加 frame であることが検証済み
 * （`compiler/manifest.ts` の `computeSlideEventFrames`）であるため、単調増加の前提で走査する。
 *
 * `pdf_visibility: "hidden"`（design §8.2、相槌除外）の発話はブロック化しない。
 * 話者役割名が narrator/listener 以外、または manifest ⇔ 台本の発話 id が不突合の場合は
 * fail-fast（design §4.4 の既存 fail-fast 方針と同様）。
 */
function assignUtterancesToSlideGroups(
  script: ScriptDocument,
  manifest: TimelineManifest,
): SlideBlockGroup[] {
  const scriptUtteranceById = new Map<string, Utterance>(
    script.utterances.map((u) => [u.id, u]),
  );

  const groups: SlideBlockGroup[] = manifest.slide_events.map((event) => ({
    slideId: event.slide,
    blocks: [],
  }));

  for (const mu of manifest.utterances) {
    const scriptUtterance = scriptUtteranceById.get(mu.id);
    if (scriptUtterance === undefined) {
      throw new Error(
        `✗ manifest の発話 "${mu.id}" に対応する台本発話が見つかりません` +
          `（manifest と台本の id 不突合）`,
      );
    }

    if (scriptUtterance.pdf_visibility === "hidden") continue;

    if (!KNOWN_SPEAKER_ROLES.has(mu.speaker)) {
      throw new Error(
        `✗ 話者役割名 "${mu.speaker}"（発話 "${mu.id}"）は PDF 出力が対応する役割名` +
          `（narrator / listener）のいずれでもありません（design §8.2）`,
      );
    }
    const style: PdfPageBlock["style"] = mu.speaker === "narrator" ? "body" : "aside";

    // 最後（最も右側）に start_frame <= mu.start_frame を満たすイベントの groups index を探す。
    // slide_events は狭義単調増加のため、条件が初めて false になった時点で走査を打ち切れる。
    let groupIndex = 0;
    for (let i = 0; i < manifest.slide_events.length; i++) {
      if (manifest.slide_events[i].start_frame <= mu.start_frame) {
        groupIndex = i;
      } else {
        break;
      }
    }

    groups[groupIndex].blocks.push({
      utterance_id: mu.id,
      speaker: mu.speaker,
      text: scriptUtterance.text,
      style,
    });
  }

  return groups;
}

/**
 * design §8.3: 1 スライド分のブロック列を文字数上限でページ分割する。発話（ブロック）は
 * 分割の最小単位であり途中で切らない。累計文字数（`countSpeechCharacters`）が `charLimit` を
 * 超える直前でページを切る（ちょうど上限に達する場合は同一ページに残す）。
 *
 * ブロックが 0 件の場合でも 1 ページ（`blocks: []`）を返す（design §8.1: スライド画像自体は
 * PDF に載る前提を保つ）。単一ブロックが `charLimit` を超える場合は分割不能（発話は分割の
 * 最小単位）であり、そのまま出力すると render 側の `overflow:hidden` により D-19（長ナレーション
 * 末尾切れ）と同型の無警告 silent clipping が再発する。design §8.3 は「超過時は複数ページに
 * 自動分割 + 安全マージン MUST」であり、分割不能な単一ブロックの黙認通過はこの MUST の趣旨に
 * 反するため、**throw して compile を停止する**（監査前軽量レビュー Critical 対応、design §4.4
 * の fail-fast 方針と同型）。
 */
function paginateSlideBlocks(
  blocks: PdfPageBlock[],
  charLimit: number,
): PdfPageBlock[][] {
  if (blocks.length === 0) return [[]];

  const pages: PdfPageBlock[][] = [];
  let current: PdfPageBlock[] = [];
  let currentChars = 0;

  for (const block of blocks) {
    const blockChars = countSpeechCharacters(block.text);

    if (blockChars > charLimit) {
      throw new Error(
        `✗ 発話 "${block.utterance_id}" の文字数 (${blockChars}) が PDF 1 ページの文字数上限 ` +
          `(${charLimit}) を超過しており、単独では分割できません（design §8.3）。` +
          `発話を分割してください（1 発話 1 ページの安全マージン内に収まるよう台本を編集）`,
      );
    }

    if (current.length > 0 && currentChars + blockChars > charLimit) {
      pages.push(current);
      current = [];
      currentChars = 0;
    }

    current.push(block);
    currentChars += blockChars;
  }

  if (current.length > 0) pages.push(current);
  return pages;
}

/**
 * 台本 + 確定済み timeline manifest から `PdfManifest`（PDF ページ分割情報）を導出する
 * （design §8.1 decision、tasks.md W4-script-engine-T17）。
 *
 * @param script - `parseScriptDocument` 済みの台本（`pdf_visibility` / `text` を参照）
 * @param manifest - `generateManifest`（`compiler/manifest.ts`）が確定した timeline manifest
 * @param charLimit - 1 ページあたりの本文文字数上限。省略時 {@link PDF_PAGE_CHAR_LIMIT}
 *   （T18 Spike 実測確定値）
 * @throws `manifest.slide_events` が空、manifest ⇔ 台本の発話 id 不突合、
 *   話者役割名が narrator/listener 以外、のいずれかの場合（fail-fast）
 */
export function buildPdfManifest(
  script: ScriptDocument,
  manifest: TimelineManifest,
  charLimit: number = PDF_PAGE_CHAR_LIMIT,
): PdfManifest {
  if (manifest.slide_events.length === 0) {
    throw new Error(
      "✗ manifest.slide_events が空です（PDF ページはスライドイベントを起点に分割するため、" +
        "最低 1 件のスライドイベントが必要です）",
    );
  }

  const groups = assignUtterancesToSlideGroups(script, manifest);

  const pages: PdfPageEntry[] = [];
  let pageNumber = 0;
  for (const group of groups) {
    const slidePages = paginateSlideBlocks(group.blocks, charLimit);
    const slidePageCount = slidePages.length;
    slidePages.forEach((blocks, index) => {
      pageNumber += 1;
      pages.push({
        page_number: pageNumber,
        slide_id: group.slideId,
        slide_page_index: index + 1,
        slide_page_count: slidePageCount,
        blocks,
      });
    });
  }

  return {
    schema_version: 1,
    script_id: manifest.script_id,
    char_limit: charLimit,
    pages,
    total_pages: pages.length,
  };
}
