/**
 * script-engine — type: image のスライドと出典台帳のテスト（Wave 5、docs/design.md (b)、brief §9 の D7 訂正）
 *
 * 見るもの：
 * - 台本の検証：正しい例が通る／出典台帳の 4 項目の欠け・空、許可リストに無い license、
 *   取得日の無い quotation、src の .. と先頭の / で止まる
 * - 画像ファイルの有無の検査（assertImageFilesExist）
 * - 出典の 1 行の書式と、manifest の credits[] に画像の行が入ること
 */

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseScriptDocument } from "../schema/script";
import type { SpeakersRegistry } from "../schema/speaker-profile";
import { formatImageSourceLine } from "../shared/image-source";
import { generateManifest } from "./manifest";
import { assertImageFilesExist } from "./parse";

type Raw = Record<string, unknown>;

const photoSource = (): Raw => ({
  source_url: "https://commons.wikimedia.org/wiki/File:Cpu_1.jpg",
  license: "CC0",
  author: "blickpixel",
  modifications: "縮小",
});

const quoteSource = (): Raw => ({
  source_url: "https://www.python.org/downloads/",
  license: "quotation",
  author: "Python Software Foundation",
  modifications: "切り抜き",
  retrieved: "2026-10-03",
});

function rawScript(imageSlide: Raw): Raw {
  return {
    speaker_profile_ref: "default",
    utterances: [
      { id: "u-001", speaker: "narrator", text: "こんにちは" },
      { id: "u-002", speaker: "listener", text: "はい" },
    ],
    slides: [{ id: "s-title", type: "title", title: "タイトル" }, imageSlide],
    slide_events: [
      { id: "ev-001", slide: "s-title", anchor: { utterance: "u-001", position: "start", offset: 0 } },
      { id: "ev-002", slide: "s-photo", anchor: { utterance: "u-002", position: "start", offset: 0 } },
    ],
  };
}

const imageSlide = (overrides: Raw = {}): Raw => ({
  id: "s-photo",
  type: "image",
  src: "images/test/cpu.jpg",
  caption: "CPU の現物",
  source: photoSource(),
  ...overrides,
});

describe("type: image — 台本の検証", () => {
  it("写真（CC0）と画面写し（quotation＋取得日）の正しい例が通る", () => {
    const photo = parseScriptDocument(rawScript(imageSlide())).slides[1];
    expect(photo).toEqual({
      id: "s-photo",
      type: "image",
      src: "images/test/cpu.jpg",
      caption: "CPU の現物",
      source: photoSource(),
    });
    const quote = parseScriptDocument(rawScript(imageSlide({ source: quoteSource() }))).slides[1];
    expect(quote).toMatchObject({ type: "image", source: { license: "quotation", retrieved: "2026-10-03" } });
  });

  it("source が無いと止まる", () => {
    const slide = imageSlide();
    delete slide.source;
    expect(() => parseScriptDocument(rawScript(slide))).toThrow(/slides\[1\]\.source がありません/);
  });

  it.each(["source_url", "license", "author", "modifications"])(
    "source.%s が欠けても空でも止まる",
    (field) => {
      const missing = photoSource();
      delete missing[field];
      expect(() => parseScriptDocument(rawScript(imageSlide({ source: missing })))).toThrow(
        new RegExp(`slides\\[1\\]\\.source\\.${field}`),
      );
      const empty = { ...photoSource(), [field]: "" };
      expect(() => parseScriptDocument(rawScript(imageSlide({ source: empty })))).toThrow(
        new RegExp(`slides\\[1\\]\\.source\\.${field}`),
      );
    },
  );

  it.each(["CC-BY-SA-4.0", "CC-BY-ND-4.0", "unknown", "generated"])(
    "許可リストに無い license（%s）で止まる",
    (license) => {
      expect(() =>
        parseScriptDocument(rawScript(imageSlide({ source: { ...photoSource(), license } }))),
      ).toThrow(/license の .* は使えません/);
    },
  );

  it("quotation に取得日が無いと止まる", () => {
    const source = quoteSource();
    delete source.retrieved;
    expect(() => parseScriptDocument(rawScript(imageSlide({ source })))).toThrow(
      /retrieved がありません（license: quotation では取得日が必須です）/,
    );
  });

  it("取得日が YYYY-MM-DD でないと止まる", () => {
    expect(() =>
      parseScriptDocument(rawScript(imageSlide({ source: { ...quoteSource(), retrieved: "10/3" } }))),
    ).toThrow(/retrieved は YYYY-MM-DD/);
  });

  it.each(["../secret.png", "images/../../x.png", "/images/cpu.jpg"])(
    "src に .. や先頭の / があると止まる（%s）",
    (src) => {
      expect(() => parseScriptDocument(rawScript(imageSlide({ src })))).toThrow(
        /public\/ からの相対パスで書いてください/,
      );
    },
  );
});

describe("type: image — 画像ファイルの有無", () => {
  it("public/<src> に在れば通り、無ければスライド id を名指しで止まる", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "script-engine-image-test-"));
    try {
      const script = parseScriptDocument(rawScript(imageSlide()));
      await expect(assertImageFilesExist(script, dir)).rejects.toThrow(
        /スライド "s-photo" の画像が見つかりません/,
      );
      await mkdir(path.join(dir, "images/test"), { recursive: true });
      await writeFile(path.join(dir, "images/test/cpu.jpg"), "x");
      await expect(assertImageFilesExist(script, dir)).resolves.toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

const MOCK_SPEAKER_PROFILES: SpeakersRegistry = {
  schema_version: 1,
  speakers: {
    narrator: {
      voicevox_speaker_id: 11,
      display_name: "テスト話者A",
      portrait: { asset_key: "narrator-default" },
      speech_rate_factor: 1.0,
      credit: "VOICEVOX:テスト話者A",
    },
    listener: {
      voicevox_speaker_id: 3,
      display_name: "テスト話者B",
      portrait: { asset_key: "listener-default" },
      speech_rate_factor: 1.05,
      credit: "VOICEVOX:テスト話者B",
    },
  },
};

describe("type: image — 出典の 1 行とクレジット", () => {
  it("出典の 1 行：写真はライセンスまで、引用は末尾に取得日", () => {
    const photo = parseScriptDocument(rawScript(imageSlide())).slides[1];
    if (photo.type !== "image") throw new Error("image のスライドではない");
    expect(formatImageSourceLine(photo.source)).toBe(
      "出典：blickpixel／CC0／https://commons.wikimedia.org/wiki/File:Cpu_1.jpg",
    );
    expect(
      formatImageSourceLine({
        source_url: "https://www.python.org/downloads/",
        license: "quotation",
        author: "Python Software Foundation",
        modifications: "切り抜き",
        retrieved: "2026-10-03",
      }),
    ).toBe("出典：Python Software Foundation／引用／https://www.python.org/downloads/（2026-10-03 取得）");
    expect(
      formatImageSourceLine({ source_url: "https://example.org/", license: "CC-BY-4.0", author: "A", modifications: "none" }),
    ).toBe("出典：A／CC BY 4.0／https://example.org/");
  });

  it("manifest の credits[] の末尾に、画像の行がスライドの順で入る", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "script-engine-image-credit-test-"));
    try {
      const script = parseScriptDocument(rawScript(imageSlide()));
      const utterancesWithWav = script.utterances.map((u) => ({
        utterance_id: u.id,
        speaker: u.speaker,
        content_hash: `hash-${u.id}`,
        wav_path: path.join(dir, `${u.id}-hash.wav`),
        duration_seconds: 1,
      }));
      const { manifest } = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "image-test",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "image-test.manifest.json"),
        wavDir: dir,
        prune: false,
      });
      expect(manifest.credits).toEqual([
        "VOICEVOX:テスト話者A",
        "VOICEVOX:テスト話者B",
        "画像「CPU の現物」 出典：blickpixel／CC0／https://commons.wikimedia.org/wiki/File:Cpu_1.jpg",
      ]);
      expect(manifest.slides[1]).toMatchObject({ type: "image", src: "images/test/cpu.jpg" });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
