/**
 * script-engine — script-pdf-manifest.ts のテスト
 *
 * 出自: docs/specs/script-engine/tasks.md W4-script-engine-T17 完了条件
 *   「テスト: mock スクリプト（複数スライド、異なる文字数）で ページ分割が期待通りか確認」
 */

import { describe, expect, it } from "vitest";
import {
  buildPdfManifest,
  PDF_PAGE_CHAR_LIMIT,
  resolveDefaultPdfManifestOutputPath,
} from "./script-pdf-manifest";
import type { ScriptDocument } from "../schema/script";
import type { ManifestUtterance, TimelineManifest } from "../schema/timeline-manifest";

// ============================================================================
// テスト用 fixture ビルダ
// ============================================================================

function makeManifestUtterance(
  overrides: Partial<ManifestUtterance> & { id: string; speaker: string },
): ManifestUtterance {
  return {
    content_hash: "hash",
    wav_path: `audio/test/${overrides.id}.wav`,
    duration_seconds: 1,
    start_frame: 0,
    end_frame: 1,
    audio_end_frame: 1,
    ...overrides,
  };
}

function makeManifest(overrides: Partial<TimelineManifest> = {}): TimelineManifest {
  return {
    schema_version: 1,
    script_id: "test-script",
    fps: 30,
    voicevox_engine_version: "0.25.2",
    utterances: [],
    slide_events: [],
    slides: [],
    speakers: {},
    credits: [],
    total_duration_frames: 300,
    ...overrides,
  };
}

function makeScript(overrides: Partial<ScriptDocument> = {}): ScriptDocument {
  return {
    speaker_profile_ref: "default",
    utterances: [],
    slides: [],
    slide_events: [],
    ...overrides,
  };
}

// ============================================================================
// 正常系: ページ分割
// ============================================================================

describe("buildPdfManifest — ページ分割", () => {
  it("複数スライド・異なる文字数で期待通りのページ分割を行う", () => {
    // スライド 1: narrator 発話 1 件（短文）
    // スライド 2: narrator + listener 発話（合算しても上限未満）
    const script = makeScript({
      utterances: [
        { id: "u-001", speaker: "narrator", text: "最初のスライドの説明文です。" },
        { id: "u-002", speaker: "narrator", text: "二番目のスライドの説明です。" },
        { id: "u-003", speaker: "listener", text: "それは本当ですか？" },
      ],
    });
    const manifest = makeManifest({
      utterances: [
        makeManifestUtterance({ id: "u-001", speaker: "narrator", start_frame: 0 }),
        makeManifestUtterance({ id: "u-002", speaker: "narrator", start_frame: 100 }),
        makeManifestUtterance({ id: "u-003", speaker: "listener", start_frame: 150 }),
      ],
      slide_events: [
        { id: "ev-001", slide: "slide-1", start_frame: 0 },
        { id: "ev-002", slide: "slide-2", start_frame: 100 },
      ],
    });

    const result = buildPdfManifest(script, manifest, 1000);

    expect(result.schema_version).toBe(1);
    expect(result.script_id).toBe("test-script");
    expect(result.char_limit).toBe(1000);
    expect(result.total_pages).toBe(2);
    expect(result.pages).toHaveLength(2);

    expect(result.pages[0]).toEqual({
      page_number: 1,
      slide_id: "slide-1",
      slide_page_index: 1,
      slide_page_count: 1,
      blocks: [
        { utterance_id: "u-001", speaker: "narrator", text: "最初のスライドの説明文です。", style: "body" },
      ],
    });

    expect(result.pages[1]).toEqual({
      page_number: 2,
      slide_id: "slide-2",
      slide_page_index: 1,
      slide_page_count: 1,
      blocks: [
        { utterance_id: "u-002", speaker: "narrator", text: "二番目のスライドの説明です。", style: "body" },
        { utterance_id: "u-003", speaker: "listener", text: "それは本当ですか？", style: "aside" },
      ],
    });
  });

  it("charLimit 超過で同一スライドが複数ページに分割される", () => {
    // 各発話 6 文字（空白除く）。charLimit=10 なら 1 ページに 1 発話しか入らない。
    const script = makeScript({
      utterances: [
        { id: "u-001", speaker: "narrator", text: "あいうえお。" }, // 6 文字
        { id: "u-002", speaker: "narrator", text: "かきくけこ。" }, // 6 文字
        { id: "u-003", speaker: "narrator", text: "さしすせそ。" }, // 6 文字
      ],
    });
    const manifest = makeManifest({
      utterances: [
        makeManifestUtterance({ id: "u-001", speaker: "narrator", start_frame: 0 }),
        makeManifestUtterance({ id: "u-002", speaker: "narrator", start_frame: 10 }),
        makeManifestUtterance({ id: "u-003", speaker: "narrator", start_frame: 20 }),
      ],
      slide_events: [{ id: "ev-001", slide: "slide-1", start_frame: 0 }],
    });

    const result = buildPdfManifest(script, manifest, 10);

    // 6 + 6 = 12 > 10 なので u-001 単独ページ、u-002 単独ページ、u-003 単独ページ
    expect(result.total_pages).toBe(3);
    expect(result.pages.map((p) => p.blocks.map((b) => b.utterance_id))).toEqual([
      ["u-001"],
      ["u-002"],
      ["u-003"],
    ]);
    expect(result.pages.map((p) => p.slide_page_index)).toEqual([1, 2, 3]);
    expect(result.pages.every((p) => p.slide_page_count === 3)).toBe(true);
  });

  it("charLimit ちょうどで収まる場合は分割せず同一ページに残す（境界値）", () => {
    // 6 文字 + 6 文字 = 12 文字ちょうど。charLimit=12 なら超過しないため同一ページ。
    const script = makeScript({
      utterances: [
        { id: "u-001", speaker: "narrator", text: "あいうえお。" }, // 6 文字
        { id: "u-002", speaker: "narrator", text: "かきくけこ。" }, // 6 文字
      ],
    });
    const manifest = makeManifest({
      utterances: [
        makeManifestUtterance({ id: "u-001", speaker: "narrator", start_frame: 0 }),
        makeManifestUtterance({ id: "u-002", speaker: "narrator", start_frame: 10 }),
      ],
      slide_events: [{ id: "ev-001", slide: "slide-1", start_frame: 0 }],
    });

    const result = buildPdfManifest(script, manifest, 12);

    expect(result.total_pages).toBe(1);
    expect(result.pages[0].blocks.map((b) => b.utterance_id)).toEqual(["u-001", "u-002"]);
  });

  it("charLimit を 1 文字でも超えると分割される（境界値、超過側）", () => {
    const script = makeScript({
      utterances: [
        { id: "u-001", speaker: "narrator", text: "あいうえお。" }, // 6 文字
        { id: "u-002", speaker: "narrator", text: "かきくけこ。" }, // 6 文字
      ],
    });
    const manifest = makeManifest({
      utterances: [
        makeManifestUtterance({ id: "u-001", speaker: "narrator", start_frame: 0 }),
        makeManifestUtterance({ id: "u-002", speaker: "narrator", start_frame: 10 }),
      ],
      slide_events: [{ id: "ev-001", slide: "slide-1", start_frame: 0 }],
    });

    const result = buildPdfManifest(script, manifest, 11);

    expect(result.total_pages).toBe(2);
    expect(result.pages.map((p) => p.blocks.map((b) => b.utterance_id))).toEqual([
      ["u-001"],
      ["u-002"],
    ]);
  });

  it("単一発話が charLimit を超過する場合、分割不能として throw する（Critical 対応、D-19 再発防止）", () => {
    const longText = "あ".repeat(20);
    const script = makeScript({
      utterances: [{ id: "u-001", speaker: "narrator", text: longText }],
    });
    const manifest = makeManifest({
      utterances: [makeManifestUtterance({ id: "u-001", speaker: "narrator", start_frame: 0 })],
      slide_events: [{ id: "ev-001", slide: "slide-1", start_frame: 0 }],
    });

    expect(() => buildPdfManifest(script, manifest, 10)).toThrow(
      /✗ 発話 "u-001" の文字数 \(20\) が PDF 1 ページの文字数上限 \(10\) を超過しており、単独では分割できません/,
    );
  });

  it("全発話が hidden 等で blocks が空になるスライドも 1 ページ（blocks: []）を出力する", () => {
    const script = makeScript({
      utterances: [
        { id: "u-001", speaker: "narrator", text: "なるほど。", pdf_visibility: "hidden" },
      ],
    });
    const manifest = makeManifest({
      utterances: [makeManifestUtterance({ id: "u-001", speaker: "narrator", start_frame: 0 })],
      slide_events: [{ id: "ev-001", slide: "slide-1", start_frame: 0 }],
    });

    const result = buildPdfManifest(script, manifest);

    expect(result.total_pages).toBe(1);
    expect(result.pages[0]).toMatchObject({
      slide_id: "slide-1",
      slide_page_index: 1,
      slide_page_count: 1,
      blocks: [],
    });
  });
});

// ============================================================================
// pdf_visibility フィルタ / 話者スタイル
// ============================================================================

describe("buildPdfManifest — pdf_visibility / 話者スタイル", () => {
  it("pdf_visibility: hidden の発話は除外される", () => {
    const script = makeScript({
      utterances: [
        { id: "u-001", speaker: "narrator", text: "本文です。" },
        { id: "u-002", speaker: "listener", text: "なるほど。", pdf_visibility: "hidden" },
        { id: "u-003", speaker: "narrator", text: "続きの本文です。" },
      ],
    });
    const manifest = makeManifest({
      utterances: [
        makeManifestUtterance({ id: "u-001", speaker: "narrator", start_frame: 0 }),
        makeManifestUtterance({ id: "u-002", speaker: "listener", start_frame: 10 }),
        makeManifestUtterance({ id: "u-003", speaker: "narrator", start_frame: 20 }),
      ],
      slide_events: [{ id: "ev-001", slide: "slide-1", start_frame: 0 }],
    });

    const result = buildPdfManifest(script, manifest);

    expect(result.pages[0].blocks.map((b) => b.utterance_id)).toEqual(["u-001", "u-003"]);
  });

  it("narrator は body、listener は aside になる", () => {
    const script = makeScript({
      utterances: [
        { id: "u-001", speaker: "narrator", text: "解説役の発話。" },
        { id: "u-002", speaker: "listener", text: "聞き役の発話。" },
      ],
    });
    const manifest = makeManifest({
      utterances: [
        makeManifestUtterance({ id: "u-001", speaker: "narrator", start_frame: 0 }),
        makeManifestUtterance({ id: "u-002", speaker: "listener", start_frame: 10 }),
      ],
      slide_events: [{ id: "ev-001", slide: "slide-1", start_frame: 0 }],
    });

    const result = buildPdfManifest(script, manifest);

    expect(result.pages[0].blocks[0].style).toBe("body");
    expect(result.pages[0].blocks[1].style).toBe("aside");
  });
});

// ============================================================================
// スライド帰属境界（最初の slide_event より前に始まる発話）
// ============================================================================

describe("buildPdfManifest — スライド帰属境界", () => {
  it("最初の slide_event より前に始まる発話は最初のスライドに帰属する", () => {
    const script = makeScript({
      utterances: [
        { id: "u-000", speaker: "narrator", text: "タイトルコール。" },
        { id: "u-001", speaker: "narrator", text: "本編の発話。" },
      ],
    });
    const manifest = makeManifest({
      utterances: [
        makeManifestUtterance({ id: "u-000", speaker: "narrator", start_frame: 0 }),
        makeManifestUtterance({ id: "u-001", speaker: "narrator", start_frame: 50 }),
      ],
      // 最初の slide_event は frame 30（u-000 の start_frame=0 より後）
      slide_events: [{ id: "ev-001", slide: "slide-1", start_frame: 30 }],
    });

    const result = buildPdfManifest(script, manifest);

    expect(result.total_pages).toBe(1);
    expect(result.pages[0].blocks.map((b) => b.utterance_id)).toEqual(["u-000", "u-001"]);
  });
});

// ============================================================================
// fail-fast エラー
// ============================================================================

describe("buildPdfManifest — fail-fast エラー", () => {
  it("slide_events が空の場合は Error を throw する", () => {
    const script = makeScript({
      utterances: [{ id: "u-001", speaker: "narrator", text: "本文。" }],
    });
    const manifest = makeManifest({
      utterances: [makeManifestUtterance({ id: "u-001", speaker: "narrator", start_frame: 0 })],
      slide_events: [],
    });

    expect(() => buildPdfManifest(script, manifest)).toThrow(/slide_events が空です/);
  });

  it("manifest と台本の発話 id が不突合の場合は Error を throw する", () => {
    const script = makeScript({
      utterances: [{ id: "u-001", speaker: "narrator", text: "本文。" }],
    });
    const manifest = makeManifest({
      // 台本に存在しない id
      utterances: [makeManifestUtterance({ id: "u-999", speaker: "narrator", start_frame: 0 })],
      slide_events: [{ id: "ev-001", slide: "slide-1", start_frame: 0 }],
    });

    expect(() => buildPdfManifest(script, manifest)).toThrow(/id 不突合/);
  });

  it("未知の話者役割名は Error を throw する", () => {
    const script = makeScript({
      utterances: [{ id: "u-001", speaker: "narrator2", text: "本文。" }],
    });
    const manifest = makeManifest({
      utterances: [makeManifestUtterance({ id: "u-001", speaker: "narrator2", start_frame: 0 })],
      slide_events: [{ id: "ev-001", slide: "slide-1", start_frame: 0 }],
    });

    expect(() => buildPdfManifest(script, manifest)).toThrow(
      /PDF 出力が対応する役割名/,
    );
  });
});

// ============================================================================
// デフォルト値 / パス解決
// ============================================================================

describe("PDF_PAGE_CHAR_LIMIT / resolveDefaultPdfManifestOutputPath", () => {
  it("PDF_PAGE_CHAR_LIMIT は 450（Wave 5 の A4 縦・1 段組で測り直した値。前は横・2 段組の 900）", () => {
    expect(PDF_PAGE_CHAR_LIMIT).toBe(450);
  });

  it("charLimit 省略時は PDF_PAGE_CHAR_LIMIT を使う", () => {
    const script = makeScript({
      utterances: [{ id: "u-001", speaker: "narrator", text: "本文。" }],
    });
    const manifest = makeManifest({
      utterances: [makeManifestUtterance({ id: "u-001", speaker: "narrator", start_frame: 0 })],
      slide_events: [{ id: "ev-001", slide: "slide-1", start_frame: 0 }],
    });

    const result = buildPdfManifest(script, manifest);
    expect(result.char_limit).toBe(PDF_PAGE_CHAR_LIMIT);
  });

  it("public/manifests/<script-id>.pdf-manifest.json に解決する（design §8.1）", () => {
    const resolved = resolveDefaultPdfManifestOutputPath("java-vs-js");
    expect(resolved.replace(/\\/g, "/")).toMatch(
      /public\/manifests\/java-vs-js\.pdf-manifest\.json$/,
    );
  });
});
