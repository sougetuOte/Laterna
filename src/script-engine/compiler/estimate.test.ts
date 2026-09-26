/**
 * script-engine — estimate.ts / speaker-profiles.ts のテスト
 *
 * 出自: docs/specs/script-engine/tasks.md W2-script-engine-T9 完了条件
 *   「テスト: 実 java-vs-js.script.yaml（T24 成果物）に対する fixture 台本の手計算固定値と
 *   一致すること（計算根拠のコメントをテストコードに残す）」
 *
 * 手計算の根拠（実データ検証）:
 * 各発話の char_count（design §9.1: 空白類を除いた文字数、句読点・記号は含む）は
 * `content/scripts/java-vs-js.script.yaml` を独立に読込み、
 * `text.replace(/\s/g, "").length` で計測した（estimate.ts の実装とは別に、本テストの
 * 作成時に一度だけ計測用スクリプトを実行して確定した値。以後は下表を固定値として使う）。
 * 代表発話 u-001 は本文中で目視カウントし直し、36 文字であることを確認済み。
 *
 * | id    | speaker  | char_count | pause_before | pause_after |
 * |-------|----------|-----------:|-------------:|------------:|
 * | u-001 | narrator |         36 |             0 |        0.3 |
 * | u-002 | listener |         30 |             0 |        0   |
 * | u-003 | narrator |         42 |             0 |        0   |
 * | u-004 | listener |         31 |             0 |        0   |
 * | u-005 | narrator |         26 |             0 |        0.6 |
 * | u-006 | narrator |         86 |             0 |        0   |
 * | u-007 | listener |         22 |             0 |        0   |
 * | u-008 | narrator |         53 |             0 |        0   |
 * | u-009 | narrator |         72 |             0 |        0   |
 * | u-010 | listener |         28 |             0 |        0.4 |
 * | u-011 | narrator |         96 |             0 |        0   |
 * | u-012 | listener |         19 |             0 |        0.4 |
 * | u-013 | narrator |        102 |             0 |        0   |
 *
 * 話者係数（docs/conventions/speaker-profiles.yaml 実データ、2026-07-11 T25 実測更正後）:
 * narrator speech_rate_factor = 0.874 → 実効話速 480*0.874 = 419.52 文字/分
 * listener speech_rate_factor = 0.714 → 実効話速 480*0.714 = 342.72 文字/分
 *
 * 発話ごとの手計算（speech_seconds = char_count * 60 / (480 * factor)、+pause_before+pause_after）:
 *   u-001: 36 * 60/419.52  = 5.148741418... + 0.3 = 5.448741418764302
 *   u-002: 30 * 60/342.72  = 5.252100840336135
 *   u-006: 86 * 60/419.52  = 12.299771167048055
 *   u-013: 102 * 60/419.52 = 14.588100686498857
 *
 * narrator 話者の char_count 合計 = 36+42+26+86+53+72+96+102 = 513
 *   narrator speech_seconds 合計 = 513 * 60/419.52 = 73.369565...
 *   narrator pause 合計 = 0.3(u-001) + 0.6(u-005) = 0.9
 * listener 話者の char_count 合計 = 30+31+22+28+19 = 130
 *   listener speech_seconds 合計 = 130 * 60/342.72 = 22.758403...
 *   listener pause 合計 = 0.4(u-010) + 0.4(u-012) = 0.8
 * predicted_total_seconds = 97.82866885884789（float64 round-trip 表現）
 *
 * target_duration_range = { min: 60, max: 105 }（java-vs-js.script.yaml、2026-07-11
 * T25 実測裁定 (b) で max 90 → 105 に較正済み）に対し 97.8 は範囲内 →
 * duration_range_warning は null（T25 実測 97.83 秒との整合）。
 */

import { describe, expect, it } from "vitest";
import path from "node:path";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { parseScript } from "./parse";
import {
  loadSpeakerProfiles,
  resolveSpeakerProfile,
  DEFAULT_SPEAKER_PROFILES_PATH,
} from "./speaker-profiles";
import {
  estimateScriptDuration,
  calculateDurationErrorRate,
  SPEECH_RATE_BASE_CHARS_PER_MINUTE,
} from "./estimate";
import type { ScriptDocument } from "../schema/script";
import type { SpeakersRegistry } from "../schema/speaker-profile";

const JAVA_VS_JS_SCRIPT_PATH = path.resolve(
  __dirname,
  "../../../content/scripts/java-vs-js.script.yaml",
);

describe("SPEECH_RATE_BASE_CHARS_PER_MINUTE", () => {
  it("design §9.1 の基準値 480 文字/分と一致する", () => {
    expect(SPEECH_RATE_BASE_CHARS_PER_MINUTE).toBe(480);
  });
});

describe("estimateScriptDuration (実データ: java-vs-js.script.yaml)", () => {
  it("手計算固定値と一致する予測総尺・発話別予測尺を返す", async () => {
    const script = await parseScript(JAVA_VS_JS_SCRIPT_PATH);
    const speakerProfiles = await loadSpeakerProfiles("default");

    const result = estimateScriptDuration(script, speakerProfiles);

    expect(result.by_utterance).toHaveLength(13);

    // 代表発話の estimated_seconds（コメント冒頭の手計算表と一致）
    expect(result.by_utterance[0].id).toBe("u-001");
    expect(result.by_utterance[0].estimated_seconds).toBeCloseTo(5.448741418764302, 9);
    expect(result.by_utterance[1].estimated_seconds).toBeCloseTo(5.252100840336135, 9);
    expect(result.by_utterance[5].id).toBe("u-006");
    expect(result.by_utterance[5].estimated_seconds).toBeCloseTo(12.299771167048055, 9);
    expect(result.by_utterance[12].id).toBe("u-013");
    expect(result.by_utterance[12].estimated_seconds).toBeCloseTo(14.588100686498857, 9);

    // 予測総尺（コメント冒頭の手計算、float64 round-trip 表現）
    expect(result.predicted_total_seconds).toBeCloseTo(97.82866885884789, 9);

    // target_duration_range { min: 60, max: 105 }（T25 実測裁定 (b) 較正後）の範囲内 → 警告なし
    expect(result.duration_range_warning).toBeNull();
  });

  it("by_utterance の各要素は元の Utterance フィールドを保持する", async () => {
    const script = await parseScript(JAVA_VS_JS_SCRIPT_PATH);
    const speakerProfiles = await loadSpeakerProfiles("default");

    const result = estimateScriptDuration(script, speakerProfiles);

    expect(result.by_utterance[0]).toEqual({
      id: "u-001",
      speaker: "narrator",
      text: "今日は「JavaとJavaScriptはどう違うの？」という話をします。",
      pause_after: 0.3,
      // estimate.ts の実装と同一の演算順序で記述する（toEqual は厳密一致のため）
      estimated_seconds: (36 / (480 * 0.874)) * 60 + 0.3,
    });
  });
});

describe("estimateScriptDuration (target_duration_range 警告判定, FR-5)", () => {
  const speakerProfiles: SpeakersRegistry = {
    speakers: {
      narrator: {
        voicevox_speaker_id: 11,
        display_name: "narrator",
        portrait: { asset_key: "narrator-default" },
        speech_rate_factor: 1.0,
      },
    },
  };

  const baseScript = (targetDurationRange?: { min: number; max: number }): ScriptDocument => ({
    speaker_profile_ref: "default",
    ...(targetDurationRange !== undefined ? { target_duration_range: targetDurationRange } : {}),
    utterances: [
      // char_count = 8（"12345678"）→ speech_seconds = 8 * 0.125 = 1 秒
      { id: "u-001", speaker: "narrator", text: "12345678" },
    ],
    slides: [],
    slide_events: [],
  });

  it("target_duration_range 未指定なら警告なし（null）", () => {
    const result = estimateScriptDuration(baseScript(undefined), speakerProfiles);
    expect(result.predicted_total_seconds).toBeCloseTo(1, 9);
    expect(result.duration_range_warning).toBeNull();
  });

  it("予測総尺が範囲内なら警告なし（null）", () => {
    const result = estimateScriptDuration(baseScript({ min: 0, max: 60 }), speakerProfiles);
    expect(result.duration_range_warning).toBeNull();
  });

  it("予測総尺が min 未満なら警告メッセージを返す", () => {
    const result = estimateScriptDuration(baseScript({ min: 60, max: 90 }), speakerProfiles);
    expect(result.duration_range_warning).not.toBeNull();
    expect(result.duration_range_warning).toMatch(/target_duration_range/);
  });

  it("pause_before と pause_after を発話の予測尺に足す（design §9.1、点検 R3-2）", () => {
    // speech_seconds = 1（上記 baseScript と同じ 8 文字・factor 1.0）+ pause_before 0.7 + pause_after 0.2 = 1.9
    const script = baseScript(undefined);
    script.utterances[0] = { ...script.utterances[0], pause_before: 0.7, pause_after: 0.2 };
    const result = estimateScriptDuration(script, speakerProfiles);
    expect(result.predicted_total_seconds).toBeCloseTo(1.9, 9);
  });

  it("予測総尺が max 超過なら警告メッセージを返す", () => {
    const result = estimateScriptDuration(baseScript({ min: 0, max: 0.5 }), speakerProfiles);
    expect(result.duration_range_warning).not.toBeNull();
    expect(result.duration_range_warning).toMatch(/target_duration_range/);
  });
});

describe("estimateScriptDuration (異常系: 未知話者役割)", () => {
  it("台本の speaker が speakerProfiles に存在しない場合エラーになる", () => {
    const speakerProfiles: SpeakersRegistry = {
      speakers: {
        narrator: {
          voicevox_speaker_id: 11,
          display_name: "narrator",
          portrait: { asset_key: "narrator-default" },
          speech_rate_factor: 1.0,
        },
      },
    };
    const script: ScriptDocument = {
      speaker_profile_ref: "default",
      utterances: [{ id: "u-001", speaker: "unknown-role", text: "テスト" }],
      slides: [],
      slide_events: [],
    };

    expect(() => estimateScriptDuration(script, speakerProfiles)).toThrow(
      /✗ 未知の話者役割です.*"unknown-role"/,
    );
  });
});

describe("loadSpeakerProfiles (実データ: docs/conventions/speaker-profiles.yaml)", () => {
  it("既定パスから読込み、narrator/listener のプロファイルを返す", async () => {
    const registry = await loadSpeakerProfiles("default");

    expect(registry.speakers.narrator).toMatchObject({
      voicevox_speaker_id: 11,
      display_name: "玄野武宏",
      speech_rate_factor: 0.874, // 2026-07-11 T25 実測更正値
      portrait: { asset_key: "narrator-default" },
    });
    expect(registry.speakers.listener).toMatchObject({
      voicevox_speaker_id: 3,
      display_name: "ずんだもん",
      speech_rate_factor: 0.714, // 2026-07-11 T25 実測更正値
      portrait: { asset_key: "listener-default" },
    });
  });

  it("DEFAULT_SPEAKER_PROFILES_PATH は docs/conventions/speaker-profiles.yaml を指す", () => {
    expect(DEFAULT_SPEAKER_PROFILES_PATH.replace(/\\/g, "/")).toMatch(
      /docs\/conventions\/speaker-profiles\.yaml$/,
    );
  });
});

describe("loadSpeakerProfiles (異常系: 未知プロファイル名)", () => {
  it('"default" 以外の profileRef はエラーになる', async () => {
    await expect(loadSpeakerProfiles("nonexistent-profile")).rejects.toThrow(
      /✗ 未知のプロファイル名です.*"nonexistent-profile"/,
    );
  });
});

describe("loadSpeakerProfiles (異常系: ファイル I/O・スキーマ)", () => {
  it("存在しないファイルパスを渡すとエラーになる", async () => {
    await expect(
      loadSpeakerProfiles("default", path.resolve(__dirname, "./does-not-exist.yaml")),
    ).rejects.toThrow(/✗ 話者プロファイルファイルの読込に失敗しました/);
  });

  it("YAML 構文エラーのファイルはエラーになる", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "script-engine-speaker-profiles-test-"));
    const filePath = path.join(dir, "broken.yaml");
    try {
      await writeFile(filePath, "speakers: [ this is not: valid: yaml", "utf-8");
      await expect(loadSpeakerProfiles("default", filePath)).rejects.toThrow(
        /✗ 話者プロファイルファイルの YAML 構文エラー/,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("speakers フィールドが欠落しているとエラーになる", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "script-engine-speaker-profiles-test-"));
    const filePath = path.join(dir, "no-speakers.yaml");
    try {
      await writeFile(filePath, "schema_version: 1\n", "utf-8");
      await expect(loadSpeakerProfiles("default", filePath)).rejects.toThrow(
        /✗ 話者プロファイルファイルに必須フィールド speakers がありません/,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("resolveSpeakerProfile", () => {
  const registry: SpeakersRegistry = {
    speakers: {
      narrator: {
        voicevox_speaker_id: 11,
        display_name: "narrator",
        portrait: { asset_key: "narrator-default" },
        speech_rate_factor: 1.0,
      },
    },
  };

  it("既知の話者役割はプロファイルを返す", () => {
    expect(resolveSpeakerProfile(registry, "narrator")).toEqual(registry.speakers.narrator);
  });

  it("未知の話者役割はエラーになる", () => {
    expect(() => resolveSpeakerProfile(registry, "ghost")).toThrow(
      /✗ 未知の話者役割です.*"ghost"/,
    );
  });
});

describe("calculateDurationErrorRate (design §9.2/§9.3: ±15%/±25% 境界)", () => {
  it("誤差率がちょうど 15% なら normal（15%以下は正常）", () => {
    // predicted=115, actual=100 → |115-100|/100 = 0.15
    const result = calculateDurationErrorRate(115, 100);
    expect(result.error_rate).toBeCloseTo(0.15, 9);
    expect(result.severity).toBe("normal");
  });

  it("誤差率が 15% をわずかに超えると warning", () => {
    // predicted=116, actual=100 → 0.16
    const result = calculateDurationErrorRate(116, 100);
    expect(result.severity).toBe("warning");
  });

  it("誤差率がちょうど 25% なら warning（25%以下は警告、超は強い警告）", () => {
    // predicted=125, actual=100 → 0.25
    const result = calculateDurationErrorRate(125, 100);
    expect(result.error_rate).toBeCloseTo(0.25, 9);
    expect(result.severity).toBe("warning");
  });

  it("誤差率が 25% を超えると critical", () => {
    // predicted=126, actual=100 → 0.26
    const result = calculateDurationErrorRate(126, 100);
    expect(result.severity).toBe("critical");
  });

  it("predicted が actual を下回る場合も絶対値で判定する", () => {
    // predicted=80, actual=100 → |80-100|/100 = 0.20 → warning
    const result = calculateDurationErrorRate(80, 100);
    expect(result.error_rate).toBeCloseTo(0.2, 9);
    expect(result.severity).toBe("warning");
  });

  it("predicted と actual が一致すれば誤差率 0 で normal", () => {
    const result = calculateDurationErrorRate(100, 100);
    expect(result.error_rate).toBe(0);
    expect(result.severity).toBe("normal");
  });

  it("actualSeconds が 0 以下ならエラーになる", () => {
    expect(() => calculateDurationErrorRate(100, 0)).toThrow(
      /✗ 実測尺（actualSeconds）は正の値である必要があります/,
    );
  });
});
