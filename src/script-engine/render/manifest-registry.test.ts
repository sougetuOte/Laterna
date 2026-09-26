/**
 * script-engine — manifest-registry.ts のテスト
 *
 * 出自: docs/specs/script-engine/tasks.md W3-script-engine-T13 完了条件
 *   「`manifestRegistry` 未登録 `scriptId` で render された場合の明示エラーを実装義務化する」
 *   design.md §4.4「`manifestRegistry` 未登録 `scriptId` で render」→ 明示エラー停止
 *   （「compile 未実行」の案内メッセージを表示）
 */

import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  manifestRegistry,
  pdfManifestRegistry,
  resolveManifest,
  resolvePdfManifest,
} from "./manifest-registry";
import { componentRegistry } from "./component-registry";
import type { TimelineManifest } from "../schema/timeline-manifest";

const PUBLIC_DIR = join(__dirname, "..", "..", "..", "public");

describe("manifestRegistry", () => {
  it("java-vs-js が登録済み", () => {
    expect(manifestRegistry["java-vs-js"]).toBeDefined();
    expect(manifestRegistry["java-vs-js"].script_id).toBe("java-vs-js");
  });

  it("java-vs-js manifest に slides フィールドが焼き込まれている（design §4.3 v3.5）", () => {
    expect(Array.isArray(manifestRegistry["java-vs-js"].slides)).toBe(true);
    expect(manifestRegistry["java-vs-js"].slides.length).toBeGreaterThan(0);
  });

  it("java-vs-js manifest に speakers フィールドが焼き込まれている（design §4.3 v3.6、W3-script-engine-T15）", () => {
    const speakers = manifestRegistry["java-vs-js"].speakers;
    expect(typeof speakers).toBe("object");
    expect(speakers.narrator).toBeDefined();
    expect(speakers.narrator.portrait_asset_key).toBe("narrator-default");
    expect(speakers.listener).toBeDefined();
    expect(speakers.listener.portrait_asset_key).toBe("listener-default");
  });
});

describe("resolveManifest", () => {
  it("登録済み scriptId を解決できる", () => {
    const manifest = resolveManifest("java-vs-js");
    expect(manifest.script_id).toBe("java-vs-js");
    expect(manifest.total_duration_frames).toBeGreaterThan(0);
  });

  it("未登録 scriptId は明示エラーを throw し、compile 未実行の案内を含む", () => {
    expect(() => resolveManifest("not-registered-script")).toThrow(
      /not-registered-script/,
    );
    expect(() => resolveManifest("not-registered-script")).toThrow(
      /compile:script/,
    );
    expect(() => resolveManifest("not-registered-script")).toThrow(
      /java-vs-js/,
    );
  });

  it("slides フィールドを持たない旧 manifest（schema v3.5 以前）は明示エラーを throw し、再 compile を案内する（design §4.4 v3.5）", () => {
    const oldManifest = { ...manifestRegistry["java-vs-js"] } as Partial<TimelineManifest>;
    delete oldManifest.slides;
    // registry オブジェクトへ直接旧形式（slides 欠落）エントリを追加して検証する
    (manifestRegistry as Record<string, TimelineManifest>)["old-format"] =
      oldManifest as TimelineManifest;

    try {
      expect(() => resolveManifest("old-format")).toThrow(/slides/);
      expect(() => resolveManifest("old-format")).toThrow(/compile:script -- old-format/);
    } finally {
      // W-2 (HGA レビュー): assert が失敗しても registry へのシングルトン汚染を残さないよう
      // 必ず後始末する（他テストへの波及を防ぐ）。
      delete (manifestRegistry as Record<string, TimelineManifest>)["old-format"];
    }
  });

  it("speakers フィールドを持たない旧 manifest（design v3.6 以前）は明示エラーを throw し、再 compile を案内する（design §4.4 v3.6、slides 欠落と同型、W3-script-engine-T15）", () => {
    const oldManifest = { ...manifestRegistry["java-vs-js"] } as Partial<TimelineManifest>;
    delete oldManifest.speakers;
    // registry オブジェクトへ直接旧形式（speakers 欠落）エントリを追加して検証する
    (manifestRegistry as Record<string, TimelineManifest>)["old-format-speakers"] =
      oldManifest as TimelineManifest;

    try {
      expect(() => resolveManifest("old-format-speakers")).toThrow(/speakers/);
      expect(() => resolveManifest("old-format-speakers")).toThrow(
        /compile:script -- old-format-speakers/,
      );
    } finally {
      // W-2 (HGA レビュー): assert が失敗しても registry へのシングルトン汚染を残さないよう
      // 必ず後始末する（他テストへの波及を防ぐ）。
      delete (manifestRegistry as Record<string, TimelineManifest>)["old-format-speakers"];
    }
  });

  it("speakers が配列（Record ではない）の manifest は明示エラーを throw する（FIX-3: typeof [] === \"object\" による素通り防止）", () => {
    const manifestWithArraySpeakers = {
      ...manifestRegistry["java-vs-js"],
      speakers: [] as unknown,
    } as TimelineManifest;
    (manifestRegistry as Record<string, TimelineManifest>)["array-speakers"] =
      manifestWithArraySpeakers;

    try {
      expect(() => resolveManifest("array-speakers")).toThrow(/speakers/);
      expect(() => resolveManifest("array-speakers")).toThrow(/compile:script -- array-speakers/);
    } finally {
      delete (manifestRegistry as Record<string, TimelineManifest>)["array-speakers"];
    }
  });
});

describe("pdfManifestRegistry (W4-script-engine-T18)", () => {
  it("java-vs-js が登録済み", () => {
    expect(pdfManifestRegistry["java-vs-js"]).toBeDefined();
    expect(pdfManifestRegistry["java-vs-js"].script_id).toBe("java-vs-js");
    expect(pdfManifestRegistry["java-vs-js"].total_pages).toBeGreaterThan(0);
  });
});

describe("resolvePdfManifest (W4-script-engine-T18)", () => {
  it("登録済み scriptId を解決できる", () => {
    const manifest = resolvePdfManifest("java-vs-js");
    expect(manifest.script_id).toBe("java-vs-js");
    expect(manifest.pages.length).toBe(manifest.total_pages);
  });

  it("未登録 scriptId は明示エラーを throw し、compile 未実行の案内を含む", () => {
    expect(() => resolvePdfManifest("not-registered-script")).toThrow(
      /not-registered-script/,
    );
    expect(() => resolvePdfManifest("not-registered-script")).toThrow(
      /compile:script/,
    );
    expect(() => resolvePdfManifest("not-registered-script")).toThrow(
      /java-vs-js/,
    );
  });
});

describe("source-to-exe（10/2 納品の 1 本目）の登録と実データの突合", () => {
  it("manifestRegistry と pdfManifestRegistry の両方に登録され、resolve できる", () => {
    const manifest = resolveManifest("source-to-exe");
    expect(manifest.script_id).toBe("source-to-exe");
    expect(manifest.total_duration_frames).toBeGreaterThan(0);

    const pdf = resolvePdfManifest("source-to-exe");
    expect(pdf.script_id).toBe("source-to-exe");
    expect(pdf.pages.length).toBe(pdf.total_pages);
  });

  it("manifest に title・code スライドが焼き込まれている（java-vs-js には無い種別）", () => {
    const types = manifestRegistry["source-to-exe"].slides.map((s) => s.type);
    expect(types).toContain("title");
    expect(types).toContain("code");
  });

  it("slide_events[].slide と pdf-manifest の pages[].slide_id が、どれも manifest の slides[].id を指す", () => {
    const manifest = manifestRegistry["source-to-exe"];
    const slideIds = new Set(manifest.slides.map((s) => s.id));
    for (const event of manifest.slide_events) {
      expect(slideIds.has(event.slide), `${event.id} → ${event.slide}`).toBe(true);
    }
    for (const page of pdfManifestRegistry["source-to-exe"].pages) {
      expect(slideIds.has(page.slide_id), `page ${page.page_number} → ${page.slide_id}`).toBe(true);
    }
  });

  it("custom スライドの component が componentRegistry に実在し、立ち絵 PNG と全 WAV が public/ にある", () => {
    const manifest = manifestRegistry["source-to-exe"];
    for (const slide of manifest.slides) {
      if (slide.type === "custom" || slide.type === "svg-ref") {
        expect(
          typeof (componentRegistry as Record<string, unknown>)[slide.component],
          `${slide.id} component=${slide.component}`,
        ).toBe("function");
      }
    }
    for (const [role, speaker] of Object.entries(manifest.speakers)) {
      const p = join(PUBLIC_DIR, "portraits", `${speaker.portrait_asset_key}.png`);
      expect(existsSync(p), `role=${role} → ${p}`).toBe(true);
    }
    for (const u of manifest.utterances) {
      const p = join(PUBLIC_DIR, ...u.wav_path.split("/"));
      expect(existsSync(p), `${u.id} → ${p}`).toBe(true);
    }
  });
});
