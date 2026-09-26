/**
 * script-engine — parse.ts のテスト
 *
 * 出自: docs/specs/script-engine/tasks.md W2-script-engine-T8 完了条件
 *   「テスト: 実 java-vs-js.script.yaml（T24 成果物）で parse 成功、出力が期待型と一致。
 *   エッジケース（YAML 構文エラー、必須フィールド欠落等の異常系）は最小 mock で検証」
 *
 * 正常系は実データ（content/scripts/java-vs-js.script.yaml）を使用し、異常系は
 * parseScriptDocument（raw オブジェクトを直接受け取る検証関数）に対する最小 mock で検証する。
 * parseScript（ファイル読込込みのラッパー）に対しては YAML 構文エラーのみ最小 fixture で確認する。
 */

import { describe, expect, it } from "vitest";
import path from "node:path";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { parseScript } from "./parse";
import { parseScriptDocument } from "../schema/script";

const JAVA_VS_JS_SCRIPT_PATH = path.resolve(
  __dirname,
  "../../../content/scripts/java-vs-js.script.yaml",
);

describe("parseScript (実データ: java-vs-js.script.yaml)", () => {
  it("parse に成功し、期待される型・件数のデータを返す", async () => {
    const doc = await parseScript(JAVA_VS_JS_SCRIPT_PATH);

    expect(doc.speaker_profile_ref).toBe("default");
    // 2026-07-11 T25 実測裁定 (b): max 90 → 105 に較正（t25-pilot-compile-2026-07-11.md §3）
    expect(doc.target_duration_range).toEqual({ min: 60, max: 105 });
    expect(doc.utterances).toHaveLength(13);
    expect(doc.slides).toHaveLength(4);
    expect(doc.slide_events).toHaveLength(4);

    // 発話単位の代表フィールドを実値でアサート（先頭発話）
    expect(doc.utterances[0]).toEqual({
      id: "u-001",
      speaker: "narrator",
      text: "今日は「JavaとJavaScriptはどう違うの？」という話をします。",
      pause_after: 0.3,
    });

    // custom スライド（component-names.ts 登録済み）が正しく通過することを確認
    expect(doc.slides[0]).toEqual({
      id: "slide-compare-intro",
      type: "custom",
      component: "JavaJsCompare",
      props: { stage: "intro" },
    });

    // bullets スライド（標準タイプ）
    expect(doc.slides[3]).toMatchObject({
      id: "slide-summary",
      type: "bullets",
      title: "まとめ",
    });
    expect(doc.slides[3]).toHaveProperty("items");

    // slide_events の外部キー（utterance / slide）が実在 ID を指していること
    expect(doc.slide_events[0]).toEqual({
      id: "ev-001",
      slide: "slide-compare-intro",
      anchor: { utterance: "u-001", position: "start", offset: 0 },
    });
  });
});

describe("parseScript (異常系: ファイル I/O)", () => {
  it("存在しないファイルパスを渡すとエラーになる", async () => {
    await expect(
      parseScript(path.resolve(__dirname, "./does-not-exist.script.yaml")),
    ).rejects.toThrow(/✗ 台本ファイルの読込に失敗しました/);
  });

  it("YAML 構文エラーのファイルはエラーになる", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "script-engine-parse-test-"));
    const filePath = path.join(dir, "broken.script.yaml");
    try {
      await writeFile(filePath, "utterances: [ this is not: valid: yaml", "utf-8");
      await expect(parseScript(filePath)).rejects.toThrow(
        /✗ 台本ファイルの YAML 構文エラー/,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("parseScriptDocument (異常系: 最小 mock)", () => {
  // 最小 mock 用の緩い型。parseScriptDocument は raw: unknown を受け取るため、
  // テスト側のオブジェクトリテラルは実スキーマの厳密な判別共用体ではなく
  // 「壊れた入力を意図的に組み立てられる」緩い形にしておく。
  type MockUtterance = {
    id: string;
    speaker: string;
    text: string;
    pause_after?: number;
    pause_before?: number;
  };
  type MockSlide = {
    id: string;
    type: string;
    title?: string;
    items?: string[];
    component?: string;
    props?: Record<string, unknown>;
  };
  type MockSlideEvent = {
    id: string;
    slide: string;
    anchor: { utterance: string; position: string; offset: number };
  };
  type MockScript = {
    speaker_profile_ref?: string;
    utterances: MockUtterance[];
    slides: MockSlide[];
    slide_events: MockSlideEvent[];
  };

  const validBase = (): MockScript => ({
    speaker_profile_ref: "default",
    utterances: [
      { id: "u-001", speaker: "narrator", text: "こんにちは" },
      { id: "u-002", speaker: "listener", text: "はい" },
    ],
    slides: [{ id: "s-001", type: "title", title: "タイトル" }],
    slide_events: [
      {
        id: "ev-001",
        slide: "s-001",
        anchor: { utterance: "u-001", position: "start", offset: 0 },
      },
    ],
  });

  it("必須フィールド（utterances）が欠落しているとエラーになる", () => {
    const raw = validBase() as Record<string, unknown>;
    delete raw.utterances;
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ 必須フィールド utterances が配列として指定されていません/,
    );
  });

  it("必須フィールド（speaker_profile_ref）が欠落しているとエラーになる", () => {
    const raw = validBase() as Record<string, unknown>;
    delete raw.speaker_profile_ref;
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ 必須フィールド speaker_profile_ref/,
    );
  });

  it("pause_after に負値が指定されるとエラーになる", () => {
    const raw = validBase();
    raw.utterances[0] = { ...raw.utterances[0], pause_after: -0.5 };
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ フィールド utterances\[0\]\.pause_after に負値は指定できません/,
    );
  });

  it("pause_before に負値が指定されるとエラーになる", () => {
    const raw = validBase();
    raw.utterances[0] = { ...raw.utterances[0], pause_before: -1 };
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ フィールド utterances\[0\]\.pause_before に負値は指定できません/,
    );
  });

  it("slide_events[].anchor.utterance が孤児参照だとエラーになる", () => {
    const raw = validBase();
    raw.slide_events[0] = {
      ...raw.slide_events[0],
      anchor: { utterance: "u-999", position: "start", offset: 0 },
    };
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ slide_events\[0\]\.anchor\.utterance が参照する発話 ID "u-999" が存在しません/,
    );
  });

  it("slide_events[].slide が孤児参照だとエラーになる", () => {
    const raw = validBase();
    raw.slide_events[0] = { ...raw.slide_events[0], slide: "s-999" };
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ slide_events\[0\]\.slide が参照するスライド ID "s-999" が存在しません/,
    );
  });

  it("未登録のコンポーネント名を参照するとエラーになる", () => {
    const raw = validBase();
    raw.slides.push({
      id: "s-002",
      type: "custom",
      component: "NotRegisteredComponent",
    });
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ slides\[1\]\.component の "NotRegisteredComponent" は component-names\.ts に未登録です/,
    );
  });

  it("話者役割が 2 名を超えるとエラーになる", () => {
    const raw = validBase();
    raw.utterances.push({ id: "u-003", speaker: "third-speaker", text: "third" });
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ 台本が参照する話者役割が 2 名を超えています/,
    );
  });

  it("話者役割名が narrator / listener 以外だと parse 時に fail-fast する（design §4.4 v3.7）", () => {
    const raw = validBase();
    raw.utterances[1] = { ...raw.utterances[1], speaker: "guest" };
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ 話者役割名 "guest" は v1 が受理する役割名（narrator \/ listener）のいずれでもありません/,
    );
  });

  it("発話 id が重複しているとエラーになる", () => {
    const raw = validBase();
    raw.utterances.push({ id: "u-001", speaker: "listener", text: "重複" });
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ utterances\[\]\.id に重複した ID があります: "u-001"/,
    );
  });

  it("スライド id が重複しているとエラーになる", () => {
    const raw = validBase();
    raw.slides.push({ id: "s-001", type: "title", title: "重複タイトル" });
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ slides\[\]\.id に重複した ID があります: "s-001"/,
    );
  });

  it("トップレベルがオブジェクトでない場合はエラーになる", () => {
    expect(() => parseScriptDocument("not an object")).toThrow(
      /✗ 台本ドキュメントのトップレベルがオブジェクトではありません/,
    );
  });

  it("slide_events[].anchor.offset に負値が指定されるとエラーになる（design §2.4、2026-07-10 HGA W-1/I-9）", () => {
    const raw = validBase();
    raw.slide_events[0] = {
      ...raw.slide_events[0],
      anchor: { utterance: "u-001", position: "start", offset: -0.5 },
    };
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ フィールド slide_events\[0\]\.anchor\.offset に負値は指定できません/,
    );
  });

  it("slide_events[].id が重複しているとエラーになる（2026-07-10 HGA W-7）", () => {
    const raw = validBase();
    raw.slide_events.push({
      id: "ev-001",
      slide: "s-001",
      anchor: { utterance: "u-002", position: "start", offset: 0 },
    });
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ slide_events\[\]\.id に重複した ID があります: "ev-001"/,
    );
  });

  it("target_duration_range.min > max だとエラーになる（2026-07-10 HGA W-1/I-9）", () => {
    const raw = validBase() as Record<string, unknown>;
    raw.target_duration_range = { min: 900, max: 600 };
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ フィールド target_duration_range は min\(900\) <= max\(600\) である必要があります/,
    );
  });

  it("target_duration_range.min に負値が指定されるとエラーになる（2026-07-10 HGA W-1/I-9）", () => {
    const raw = validBase() as Record<string, unknown>;
    raw.target_duration_range = { min: -10, max: 600 };
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ フィールド target_duration_range\.min に負値は指定できません: -10/,
    );
  });

  it("target_duration_range.max に負値が指定されるとエラーになる（2026-07-10 HGA W-1/I-9）", () => {
    const raw = validBase() as Record<string, unknown>;
    raw.target_duration_range = { min: 0, max: -1 };
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ フィールド target_duration_range\.max に負値は指定できません: -1/,
    );
  });

  it("props に JSON 直列化不可能な値（Date）が含まれるとエラーになる", () => {
    const raw = validBase();
    raw.slides.push({
      id: "s-002",
      type: "svg-ref",
      component: "Iceberg",
      props: { when: new Date() },
    });
    expect(() => parseScriptDocument(raw)).toThrow(
      /✗ フィールド slides\[1\]\.props\.when は JSON 直列化可能な値である必要があります/,
    );
  });

  it("extra_credits（Laterna 追加 2026-09-26）: 文字列配列を受理して document.extra_credits に入る", () => {
    const doc = parseScriptDocument({ ...validBase(), extra_credits: ["立ち絵：Laterna オリジナル"] });
    expect(doc.extra_credits).toEqual(["立ち絵：Laterna オリジナル"]);
  });

  it("extra_credits（Laterna 追加）: 省略すると document に含まれない", () => {
    expect(parseScriptDocument(validBase()).extra_credits).toBeUndefined();
  });

  it("extra_credits（Laterna 追加）: 空文字を含むとエラーになる", () => {
    expect(() => parseScriptDocument({ ...validBase(), extra_credits: [""] })).toThrow(
      /extra_credits\[0\]/,
    );
  });
});
