/**
 * script-engine — speaker-profiles.ts のテスト
 *
 * 出自: 2026-07-10 HGA 敵対レビュー第 2 回 W-3 裁定
 *   「各話者の voicevox_speaker_id（number 必須）/ speech_rate_factor（number 必須・正値）を検証、
 *   欠落・非数値・非正値は fail-fast エラー（NaN の無音伝播を遮断）。話者エントリが null
 *   （YAML の値なしキー）の場合も明示エラー」
 *
 * 正常系は実データ（docs/conventions/speaker-profiles.yaml）を使用し、異常系は最小 YAML fixture
 * （一時ファイル）を使って loadSpeakerProfiles に直接読ませる形で検証する。
 */

import { describe, expect, it } from "vitest";
import path from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  DEFAULT_SPEAKER_PROFILES_PATH,
  SUPPORTED_SPEAKER_PROFILE_REF,
  loadSpeakerProfiles,
  resolveSpeakerProfile,
} from "./speaker-profiles";

async function withTempYaml(
  contents: string,
  run: (filePath: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), "script-engine-speaker-profiles-test-"));
  const filePath = path.join(dir, "speaker-profiles.yaml");
  try {
    await writeFile(filePath, contents, "utf-8");
    await run(filePath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("loadSpeakerProfiles (実データ: docs/conventions/speaker-profiles.yaml)", () => {
  it("design §3.2 の既定パスから正しく読み込める", async () => {
    const registry = await loadSpeakerProfiles(SUPPORTED_SPEAKER_PROFILE_REF);
    expect(registry.speakers.narrator.voicevox_speaker_id).toBe(11);
    expect(registry.speakers.listener.voicevox_speaker_id).toBe(3);
    expect(registry.speakers.narrator.speech_rate_factor).toBeGreaterThan(0);
  });

  it("DEFAULT_SPEAKER_PROFILES_PATH は docs/conventions/speaker-profiles.yaml を指す", () => {
    expect(DEFAULT_SPEAKER_PROFILES_PATH.replace(/\\/g, "/")).toMatch(
      /docs\/conventions\/speaker-profiles\.yaml$/,
    );
  });
});

describe("loadSpeakerProfiles (異常系: 未知プロファイル名 / ファイル I/O、design §3.2)", () => {
  it("未知のプロファイル名は fail-fast エラーになる", async () => {
    await expect(loadSpeakerProfiles("not-default")).rejects.toThrow(
      /✗ 未知のプロファイル名です/,
    );
  });

  it("存在しないファイルパスを渡すとエラーになる", async () => {
    await expect(
      loadSpeakerProfiles(SUPPORTED_SPEAKER_PROFILE_REF, "/no/such/file.yaml"),
    ).rejects.toThrow(/✗ 話者プロファイルファイルの読込に失敗しました/);
  });

  it("speakers フィールドが欠落しているとエラーになる", async () => {
    await withTempYaml("schema_version: 1\n", async (filePath) => {
      await expect(
        loadSpeakerProfiles(SUPPORTED_SPEAKER_PROFILE_REF, filePath),
      ).rejects.toThrow(/✗ 話者プロファイルファイルに必須フィールド speakers がありません/);
    });
  });
});

describe("loadSpeakerProfiles (異常系: フィールド単位検証、2026-07-10 HGA W-3)", () => {
  it("voicevox_speaker_id が typo で欠落しているとエラーになる", async () => {
    const yaml = [
      "speakers:",
      "  narrator:",
      "    voicevox_speaker__id: 11", // typo: アンダースコア 2 個
      "    display_name: テスト",
      "    portrait:",
      "      asset_key: narrator-default",
      "    speech_rate_factor: 1.0",
      "",
    ].join("\n");
    await withTempYaml(yaml, async (filePath) => {
      await expect(
        loadSpeakerProfiles(SUPPORTED_SPEAKER_PROFILE_REF, filePath),
      ).rejects.toThrow(
        /✗ 話者プロファイル "narrator" の voicevox_speaker_id が数値として指定されていません/,
      );
    });
  });

  it("話者エントリが null（YAML の値なしキー）だとエラーになる", async () => {
    const yaml = ["speakers:", "  narrator:", "  listener:", ""].join("\n");
    await withTempYaml(yaml, async (filePath) => {
      await expect(
        loadSpeakerProfiles(SUPPORTED_SPEAKER_PROFILE_REF, filePath),
      ).rejects.toThrow(/✗ 話者プロファイル "narrator" が空です/);
    });
  });

  it("speech_rate_factor が負値だとエラーになる", async () => {
    const yaml = [
      "speakers:",
      "  narrator:",
      "    voicevox_speaker_id: 11",
      "    display_name: テスト",
      "    portrait:",
      "      asset_key: narrator-default",
      "    speech_rate_factor: -1.0",
      "",
    ].join("\n");
    await withTempYaml(yaml, async (filePath) => {
      await expect(
        loadSpeakerProfiles(SUPPORTED_SPEAKER_PROFILE_REF, filePath),
      ).rejects.toThrow(
        /✗ 話者プロファイル "narrator" の speech_rate_factor は正値である必要があります.*-1/,
      );
    });
  });

  it("speech_rate_factor が 0 だとエラーになる（正値のみ許容）", async () => {
    const yaml = [
      "speakers:",
      "  narrator:",
      "    voicevox_speaker_id: 11",
      "    display_name: テスト",
      "    portrait:",
      "      asset_key: narrator-default",
      "    speech_rate_factor: 0",
      "",
    ].join("\n");
    await withTempYaml(yaml, async (filePath) => {
      await expect(
        loadSpeakerProfiles(SUPPORTED_SPEAKER_PROFILE_REF, filePath),
      ).rejects.toThrow(/✗ 話者プロファイル "narrator" の speech_rate_factor は正値である必要があります/);
    });
  });

  it("speech_rate_factor が文字列だとエラーになる（非数値）", async () => {
    const yaml = [
      "speakers:",
      "  narrator:",
      "    voicevox_speaker_id: 11",
      "    display_name: テスト",
      "    portrait:",
      "      asset_key: narrator-default",
      '    speech_rate_factor: "fast"',
      "",
    ].join("\n");
    await withTempYaml(yaml, async (filePath) => {
      await expect(
        loadSpeakerProfiles(SUPPORTED_SPEAKER_PROFILE_REF, filePath),
      ).rejects.toThrow(
        /✗ 話者プロファイル "narrator" の speech_rate_factor が数値として指定されていません/,
      );
    });
  });

  it("正常な speaker-profiles.yaml は問題なく読み込める（複数話者・回帰確認）", async () => {
    const yaml = [
      "speakers:",
      "  narrator:",
      "    voicevox_speaker_id: 11",
      "    display_name: テストA",
      "    credit: VOICEVOX:テストA",
      "    portrait:",
      "      asset_key: narrator-default",
      "    speech_rate_factor: 1.0",
      "  listener:",
      "    voicevox_speaker_id: 3",
      "    display_name: テストB",
      "    credit: VOICEVOX:テストB",
      "    portrait:",
      "      asset_key: listener-default",
      "    speech_rate_factor: 1.05",
      "",
    ].join("\n");
    await withTempYaml(yaml, async (filePath) => {
      const registry = await loadSpeakerProfiles(SUPPORTED_SPEAKER_PROFILE_REF, filePath);
      expect(registry.speakers.narrator.voicevox_speaker_id).toBe(11);
      expect(registry.speakers.listener.speech_rate_factor).toBe(1.05);
    });
  });
});

describe("resolveSpeakerProfile (design §4.4 と同様の fail-fast 方針)", () => {
  it("未知の話者役割はエラーになる", async () => {
    const registry = await loadSpeakerProfiles(SUPPORTED_SPEAKER_PROFILE_REF);
    expect(() => resolveSpeakerProfile(registry, "unknown-role")).toThrow(
      /✗ 未知の話者役割です/,
    );
  });

  it("既知の話者役割はプロファイルを返す", async () => {
    const registry = await loadSpeakerProfiles(SUPPORTED_SPEAKER_PROFILE_REF);
    const profile = resolveSpeakerProfile(registry, "narrator");
    expect(profile.voicevox_speaker_id).toBe(11);
  });
});
