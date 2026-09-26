/**
 * script-engine — cli.ts のテスト
 *
 * 出自: docs/specs/script-engine/tasks.md W25-script-engine-T31 完了条件
 *   「テスト: CLI の引数処理・マージロジックを vitest で検証（実 Engine 依存部は mock）」
 *
 * mock 方式: `runCompileScriptCli` の依存注入（`CompileCliDeps`）で
 * parse / loadSpeakerProfiles / estimate / synthesize / measure / generateManifest /
 * readFile を全て差し替え、実 VOICEVOX Engine・実ファイルシステム（public/ 配下）への
 * 接触をゼロにする（T31 タスク境界 MUST: 実合成リクエスト禁止。実合成の検収は T25）。
 */

import { describe, expect, it, vi } from "vitest";
import path from "node:path";
import {
  CLI_USAGE,
  FORCE_RESYNTH_FLAG,
  parseCliArgs,
  resolveDefaultScriptPath,
  readRecordedManifest,
  mergeMeasuredDurations,
  runCompileScriptCli,
} from "./cli";
import type { CompileCliDeps } from "./cli";
import type { ScriptDocument } from "../schema/script";
import type { SpeakersRegistry } from "../schema/speaker-profile";
import type { SynthesizeResult, SynthesizedUtterance } from "./synthesize";
import type { GenerateManifestResult } from "./manifest";
import type { EstimateResult } from "./estimate";
import type { PdfManifest } from "../pdf/script-pdf-manifest";

// ============================================================================
// parseCliArgs（引数処理）
// ============================================================================

describe("parseCliArgs", () => {
  it("script-id のみ指定で forceResynth=false を返す", () => {
    expect(parseCliArgs(["java-vs-js"])).toEqual({
      scriptId: "java-vs-js",
      forceResynth: false,
    });
  });

  it("--force-resynth 併用で forceResynth=true を返す（フラグ後置）", () => {
    expect(parseCliArgs(["java-vs-js", FORCE_RESYNTH_FLAG])).toEqual({
      scriptId: "java-vs-js",
      forceResynth: true,
    });
  });

  it("--force-resynth 併用で forceResynth=true を返す（フラグ前置）", () => {
    expect(parseCliArgs([FORCE_RESYNTH_FLAG, "java-vs-js"])).toEqual({
      scriptId: "java-vs-js",
      forceResynth: true,
    });
  });

  it("引数なしは日本語 usage エラー（✗ 先頭）で fail-fast する", () => {
    expect(() => parseCliArgs([])).toThrow(/^✗ script-id が指定されていません/);
    expect(() => parseCliArgs([])).toThrow(CLI_USAGE);
  });

  it("--force-resynth のみ（script-id なし）も usage エラーになる", () => {
    expect(() => parseCliArgs([FORCE_RESYNTH_FLAG])).toThrow(
      /^✗ script-id が指定されていません/,
    );
  });

  it("未知のオプションは fail-fast する", () => {
    expect(() => parseCliArgs(["java-vs-js", "--unknown-flag"])).toThrow(
      /^✗ 未知のオプションです: --unknown-flag/,
    );
  });

  it("script-id の複数指定は fail-fast する", () => {
    expect(() => parseCliArgs(["java-vs-js", "another-id"])).toThrow(
      /^✗ script-id が複数指定されています/,
    );
  });

  it("パス区切り文字を含む script-id は fail-fast する", () => {
    expect(() => parseCliArgs(["../etc/passwd"])).toThrow(
      /^✗ script-id にパス区切り文字/,
    );
    expect(() => parseCliArgs(["a\\b"])).toThrow(/^✗ script-id にパス区切り文字/);
  });

  it("シェルが解釈する文字・空白・英数字以外で始まる script-id は fail-fast する", () => {
    for (const id of ["x&calc", "a|b", "a>b", "%PATH%", "a b", "..", "-rf"]) {
      expect(() => parseCliArgs([id])).toThrow(/^✗ script-id に使えるのは英数字/);
    }
  });

  it("英数字・ハイフン・アンダースコアだけの script-id は通る", () => {
    for (const id of ["source-to-exe", "java-vs-js", "outline-video-1", "Wave3_demo"]) {
      expect(parseCliArgs([id]).scriptId).toBe(id);
    }
  });
});

describe("resolveDefaultScriptPath", () => {
  it("content/scripts/<script-id>.script.yaml に解決する（design §11.1）", () => {
    const resolved = resolveDefaultScriptPath("java-vs-js");
    expect(resolved).toBe(
      path.resolve(__dirname, "../../../content/scripts", "java-vs-js.script.yaml"),
    );
    expect(resolved.endsWith(`${path.sep}java-vs-js.script.yaml`)).toBe(true);
  });
});

// ============================================================================
// readRecordedManifest（既存 manifest の突合経路、T31 完了条件 3）
// ============================================================================

describe("readRecordedManifest", () => {
  const MANIFEST_PATH = "/fake/public/manifests/java-vs-js.manifest.json";

  it("manifest 不存在（読込失敗）は null を返す（初回 compile の正常系）", async () => {
    const readFileImpl = vi.fn().mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
    await expect(readRecordedManifest(MANIFEST_PATH, readFileImpl)).resolves.toBeNull();
    expect(readFileImpl).toHaveBeenCalledWith(MANIFEST_PATH, "utf-8");
  });

  it("正常な manifest から recordedHashes と Engine バージョンを取り出す", async () => {
    const manifest = {
      schema_version: 1,
      script_id: "java-vs-js",
      fps: 30,
      voicevox_engine_version: "0.25.2",
      utterances: [
        { id: "u-001", content_hash: "aaaa1111" },
        { id: "u-002", content_hash: "bbbb2222" },
      ],
      slide_events: [],
      credits: [],
      total_duration_frames: 100,
    };
    const readFileImpl = vi.fn().mockResolvedValue(JSON.stringify(manifest));
    const recorded = await readRecordedManifest(MANIFEST_PATH, readFileImpl);
    expect(recorded).toEqual({
      recordedHashes: { "u-001": "aaaa1111", "u-002": "bbbb2222" },
      voicevoxEngineVersion: "0.25.2",
    });
  });

  it("voicevox_engine_version 欠落時は voicevoxEngineVersion=null を返す", async () => {
    const readFileImpl = vi.fn().mockResolvedValue(
      JSON.stringify({ utterances: [{ id: "u-001", content_hash: "aaaa1111" }] }),
    );
    const recorded = await readRecordedManifest(MANIFEST_PATH, readFileImpl);
    expect(recorded?.voicevoxEngineVersion).toBeNull();
    expect(recorded?.recordedHashes).toEqual({ "u-001": "aaaa1111" });
  });

  it("JSON 構文エラーは fail-fast する（黙って manifest なし扱いにしない）", async () => {
    const readFileImpl = vi.fn().mockResolvedValue("{ broken json");
    await expect(readRecordedManifest(MANIFEST_PATH, readFileImpl)).rejects.toThrow(
      /^✗ 既存 manifest の JSON 解析に失敗しました/,
    );
  });

  it("utterances 配列を持たない manifest は fail-fast する", async () => {
    const readFileImpl = vi.fn().mockResolvedValue(JSON.stringify({ fps: 30 }));
    await expect(readRecordedManifest(MANIFEST_PATH, readFileImpl)).rejects.toThrow(
      /^✗ 既存 manifest の形式が不正です/,
    );
  });
});

// ============================================================================
// mergeMeasuredDurations（T10 出力 + T11 実測のマージ、T31 完了条件 2）
// ============================================================================

describe("mergeMeasuredDurations", () => {
  const SYNTHESIZED: SynthesizedUtterance[] = [
    {
      utterance_id: "u-001",
      speaker: "narrator",
      content_hash: "aaaa1111",
      wav_path: "/fake/audio/java-vs-js/u-001-aaaa1111.wav",
    },
    {
      utterance_id: "u-002",
      speaker: "listener",
      content_hash: "bbbb2222",
      wav_path: "/fake/audio/java-vs-js/u-002-bbbb2222.wav",
    },
  ];

  it("各 WAV に measure を当てて duration_seconds をマージする（順序・フィールド保存）", async () => {
    const durations: Record<string, number> = {
      "/fake/audio/java-vs-js/u-001-aaaa1111.wav": 2.87,
      "/fake/audio/java-vs-js/u-002-bbbb2222.wav": 2.53,
    };
    const measureImpl = vi.fn(async (wavPath: string) => ({
      duration_seconds: durations[wavPath],
    }));

    const merged = await mergeMeasuredDurations(SYNTHESIZED, measureImpl);

    expect(merged).toEqual([
      { ...SYNTHESIZED[0], duration_seconds: 2.87 },
      { ...SYNTHESIZED[1], duration_seconds: 2.53 },
    ]);
    expect(measureImpl).toHaveBeenCalledTimes(2);
    expect(measureImpl).toHaveBeenNthCalledWith(1, SYNTHESIZED[0].wav_path);
    expect(measureImpl).toHaveBeenNthCalledWith(2, SYNTHESIZED[1].wav_path);
  });

  it("measure の失敗（WAV ヘッダ解析エラー等）はそのまま伝播する（fail-fast）", async () => {
    const measureImpl = vi
      .fn()
      .mockRejectedValue(new Error("✗ WAV ヘッダ解析に失敗しました: u-001-aaaa1111.wav"));
    await expect(mergeMeasuredDurations(SYNTHESIZED, measureImpl)).rejects.toThrow(
      /^✗ WAV ヘッダ解析に失敗しました/,
    );
  });

  it("空配列は空配列を返す（measure 呼び出しなし）", async () => {
    const measureImpl = vi.fn();
    await expect(mergeMeasuredDurations([], measureImpl)).resolves.toEqual([]);
    expect(measureImpl).not.toHaveBeenCalled();
  });
});

// ============================================================================
// runCompileScriptCli（パイプライン接合、全依存 mock）
// ============================================================================

const SCRIPT: ScriptDocument = {
  speaker_profile_ref: "default",
  target_duration_range: { min: 60, max: 90 },
  utterances: [
    { id: "u-001", speaker: "narrator", text: "テスト発話その一です。", pause_after: 0.3 },
    { id: "u-002", speaker: "listener", text: "テスト発話その二です。" },
  ],
  slides: [],
  slide_events: [],
};

const SPEAKER_PROFILES: SpeakersRegistry = {
  schema_version: 1,
  speakers: {
    narrator: {
      voicevox_speaker_id: 11,
      display_name: "テスト話者A",
      portrait: { asset_key: "narrator-default" },
      speech_rate_factor: 1.0,
    },
    listener: {
      voicevox_speaker_id: 3,
      display_name: "テスト話者B",
      portrait: { asset_key: "listener-default" },
      speech_rate_factor: 1.05,
    },
  },
};

const ESTIMATE_OK: EstimateResult = {
  predicted_total_seconds: 5.5,
  by_utterance: [],
  duration_range_warning: null,
};

const SYNTHESIS_RESULT: SynthesizeResult = {
  utterances_with_wav: [
    {
      utterance_id: "u-001",
      speaker: "narrator",
      content_hash: "aaaa1111",
      wav_path: "/fake/audio/java-vs-js/u-001-aaaa1111.wav",
    },
    {
      utterance_id: "u-002",
      speaker: "listener",
      content_hash: "bbbb2222",
      wav_path: "/fake/audio/java-vs-js/u-002-bbbb2222.wav",
    },
  ],
  skipped: 1,
  synthesized: 1,
  voicevox_engine_version: "0.25.2",
};

const MANIFEST_RESULT: GenerateManifestResult = {
  manifest: {
    schema_version: 1,
    script_id: "java-vs-js",
    fps: 30,
    voicevox_engine_version: "0.25.2",
    utterances: [],
    slide_events: [],
    slides: [],
    // design §4.3 v3.6: speakers は TimelineManifest の必須フィールド（値は CLI テストでは未参照）
    speakers: {
      narrator: { portrait_asset_key: "narrator-default", display_name: "テスト話者A" },
      listener: { portrait_asset_key: "listener-default", display_name: "テスト話者B" },
    },
    credits: ["VOICEVOX:テスト話者A", "VOICEVOX:テスト話者B"],
    total_duration_frames: 300,
  },
  outputPath: "/fake/public/manifests/java-vs-js.manifest.json",
  pruned: [],
  pruneWarnings: [],
  warnings: [],
};

/** W4-script-engine-T17: buildPdfManifest/write のデフォルト mock 戻り値。 */
const PDF_MANIFEST_STUB: PdfManifest = {
  schema_version: 1,
  script_id: "java-vs-js",
  char_limit: 1000,
  pages: [],
  total_pages: 0,
};

/** manifest 不存在（初回 compile）を既定とする全依存 mock 一式を組み立てる。 */
function createMockDeps(overrides: Partial<CompileCliDeps> = {}) {
  const logs: string[] = [];
  const warns: string[] = [];
  const errors: string[] = [];
  const deps: CompileCliDeps = {
    parseScriptImpl: vi.fn().mockResolvedValue(SCRIPT),
    loadSpeakerProfilesImpl: vi.fn().mockResolvedValue(SPEAKER_PROFILES),
    estimateImpl: vi.fn().mockReturnValue(ESTIMATE_OK),
    synthesizeImpl: vi.fn().mockResolvedValue(SYNTHESIS_RESULT),
    measureImpl: vi.fn().mockResolvedValue({ duration_seconds: 2.5 }),
    generateManifestImpl: vi.fn().mockResolvedValue(MANIFEST_RESULT),
    buildPdfManifestImpl: vi.fn().mockReturnValue(PDF_MANIFEST_STUB),
    writePdfManifestFileImpl: vi.fn().mockResolvedValue(undefined),
    readFileImpl: vi.fn().mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    ),
    log: (m) => logs.push(m),
    warn: (m) => warns.push(m),
    error: (m) => errors.push(m),
    ...overrides,
  };
  return { deps, logs, warns, errors };
}

describe("runCompileScriptCli", () => {
  it("正常系: parse → estimate → synthesize → measure → manifest を直列実行し exit 0", async () => {
    const { deps, logs, errors } = createMockDeps();

    const exitCode = await runCompileScriptCli(["java-vs-js"], deps);

    expect(exitCode).toBe(0);
    expect(errors).toEqual([]);
    expect(deps.parseScriptImpl).toHaveBeenCalledWith(resolveDefaultScriptPath("java-vs-js"));
    expect(deps.loadSpeakerProfilesImpl).toHaveBeenCalledWith("default");
    expect(deps.estimateImpl).toHaveBeenCalledWith(SCRIPT, SPEAKER_PROFILES);
    // measure は synthesize の各 WAV に当たる（T31 完了条件 2）
    expect(deps.measureImpl).toHaveBeenCalledTimes(2);
    // manifest には実測マージ済み配列と Engine バージョンが渡る
    expect(deps.generateManifestImpl).toHaveBeenCalledWith(
      SCRIPT,
      SYNTHESIS_RESULT.utterances_with_wav.map((u) => ({ ...u, duration_seconds: 2.5 })),
      SPEAKER_PROFILES,
      expect.objectContaining({
        scriptId: "java-vs-js",
        voicevoxEngineVersion: "0.25.2",
      }),
    );
    expect(logs.some((m) => m.includes("✓ compile 完了"))).toBe(true);
    expect(logs.some((m) => m.includes("total_duration_frames=300"))).toBe(true);
  });

  it("W4-script-engine-T17: PDF manifest を確定済み timeline manifest から生成し書き出す", async () => {
    const { deps, logs } = createMockDeps();

    const exitCode = await runCompileScriptCli(["java-vs-js"], deps);

    expect(exitCode).toBe(0);
    expect(deps.buildPdfManifestImpl).toHaveBeenCalledWith(SCRIPT, MANIFEST_RESULT.manifest);
    const writeCall = vi.mocked(deps.writePdfManifestFileImpl).mock.calls[0];
    expect(writeCall[0]).toContain("java-vs-js.pdf-manifest.json");
    expect(writeCall[1]).toBe(PDF_MANIFEST_STUB);
    expect(logs.some((m) => m.includes("PDF manifest 書き出し"))).toBe(true);
  });

  it("HGA I-10: synthesize の outputDir と manifest（prune）の wavDir が同一値で渡る", async () => {
    const { deps } = createMockDeps();

    await runCompileScriptCli(["java-vs-js"], deps);

    const synthesizeOptions = vi.mocked(deps.synthesizeImpl).mock.calls[0][2];
    const manifestOptions = vi.mocked(deps.generateManifestImpl).mock.calls[0][3];
    expect(synthesizeOptions.outputDir).toBeDefined();
    expect(manifestOptions.wavDir).toBe(synthesizeOptions.outputDir);
  });

  it("manifest 不存在（初回）: synthesize に recordedHashes=undefined を渡す", async () => {
    const { deps } = createMockDeps();

    await runCompileScriptCli(["java-vs-js"], deps);

    const synthesizeOptions = vi.mocked(deps.synthesizeImpl).mock.calls[0][2];
    expect(synthesizeOptions.recordedHashes).toBeUndefined();
  });

  it("既存 manifest あり: 記録済み content_hash を recordedHashes として synthesize に渡す（T31 完了条件 3）", async () => {
    const existingManifest = {
      voicevox_engine_version: "0.25.2",
      utterances: [
        { id: "u-001", content_hash: "aaaa1111" },
        { id: "u-002", content_hash: "old-hash" },
      ],
    };
    const { deps } = createMockDeps({
      readFileImpl: vi.fn().mockResolvedValue(JSON.stringify(existingManifest)),
    });

    await runCompileScriptCli(["java-vs-js"], deps);

    const synthesizeOptions = vi.mocked(deps.synthesizeImpl).mock.calls[0][2];
    expect(synthesizeOptions.recordedHashes).toEqual({
      "u-001": "aaaa1111",
      "u-002": "old-hash",
    });
  });

  it("--force-resynth: 既存 manifest があっても空の recordedHashes（{}）で全発話を強制再合成する（T31 完了条件 5）", async () => {
    const existingManifest = {
      voicevox_engine_version: "0.25.2",
      utterances: [{ id: "u-001", content_hash: "aaaa1111" }],
    };
    const { deps, logs } = createMockDeps({
      readFileImpl: vi.fn().mockResolvedValue(JSON.stringify(existingManifest)),
    });

    const exitCode = await runCompileScriptCli(["java-vs-js", FORCE_RESYNTH_FLAG], deps);

    expect(exitCode).toBe(0);
    const synthesizeOptions = vi.mocked(deps.synthesizeImpl).mock.calls[0][2];
    // {} = synthesize.ts の shouldSkip が全発話でハッシュ不一致となり再合成される
    // （undefined だとファイル名存在フォールバックで skip され得るため、undefined ではないこと
    // も検証する）
    expect(synthesizeOptions.recordedHashes).toEqual({});
    expect(synthesizeOptions.recordedHashes).not.toBeUndefined();
    expect(logs.some((m) => m.includes(FORCE_RESYNTH_FLAG))).toBe(true);
  });

  it("第 1 段警告: estimate の duration_range_warning を標準出力（warn）に表示する（design §9.2）", async () => {
    const { deps, warns } = createMockDeps({
      estimateImpl: vi.fn().mockReturnValue({
        ...ESTIMATE_OK,
        predicted_total_seconds: 120,
        duration_range_warning:
          "予測総尺 120.0秒 が target_duration_range { min: 60, max: 90 } の範囲外です",
      }),
    });

    const exitCode = await runCompileScriptCli(["java-vs-js"], deps);

    expect(exitCode).toBe(0); // 非ブロッキング（design §9.3: exit code を変えない）
    expect(warns.some((m) => m.includes("範囲外です"))).toBe(true);
  });

  it("第 2 段警告: manifest 生成の warnings[]（動画総尺 vs range max）を表示する（design §9.2）", async () => {
    const { deps, warns } = createMockDeps({
      generateManifestImpl: vi.fn().mockResolvedValue({
        ...MANIFEST_RESULT,
        warnings: [
          "最終動画尺 95.0 秒（クレジット区間込み）が target_duration_range の上限 90 秒を超過しています",
        ],
      }),
    });

    const exitCode = await runCompileScriptCli(["java-vs-js"], deps);

    expect(exitCode).toBe(0); // 非ブロッキング
    expect(warns.some((m) => m.includes("上限 90 秒を超過"))).toBe(true);
  });

  it("Engine バージョン不一致: 警告を表示するがエラー停止しない（design §4.2 MUST、T31 完了条件 5）", async () => {
    const existingManifest = {
      voicevox_engine_version: "0.24.0",
      utterances: [{ id: "u-001", content_hash: "aaaa1111" }],
    };
    const { deps, warns } = createMockDeps({
      readFileImpl: vi.fn().mockResolvedValue(JSON.stringify(existingManifest)),
    });

    const exitCode = await runCompileScriptCli(["java-vs-js"], deps);

    expect(exitCode).toBe(0); // 警告のみ、エラー停止しない
    const mismatchWarning = warns.find((m) => m.includes("VOICEVOX Engine バージョン不一致"));
    expect(mismatchWarning).toBeDefined();
    expect(mismatchWarning).toContain("0.24.0");
    expect(mismatchWarning).toContain("0.25.2");
    expect(mismatchWarning).toContain(FORCE_RESYNTH_FLAG);
  });

  it("Engine バージョン一致: 不一致警告を表示しない", async () => {
    const existingManifest = {
      voicevox_engine_version: "0.25.2",
      utterances: [{ id: "u-001", content_hash: "aaaa1111" }],
    };
    const { deps, warns } = createMockDeps({
      readFileImpl: vi.fn().mockResolvedValue(JSON.stringify(existingManifest)),
    });

    await runCompileScriptCli(["java-vs-js"], deps);

    expect(warns.some((m) => m.includes("バージョン不一致"))).toBe(false);
  });

  it("prune 結果と pruneWarnings を出力する", async () => {
    const { deps, logs, warns } = createMockDeps({
      generateManifestImpl: vi.fn().mockResolvedValue({
        ...MANIFEST_RESULT,
        pruned: ["u-999-deadbeef.wav"],
        pruneWarnings: [
          "⚠ WAV ファイルの削除に失敗しました（警告のみ、継続、design §4.4）: u-998-cafebabe.wav（EBUSY）",
        ],
      }),
    });

    const exitCode = await runCompileScriptCli(["java-vs-js"], deps);

    expect(exitCode).toBe(0); // prune 失敗はエラー停止しない（design §4.4）
    expect(logs.some((m) => m.includes("u-999-deadbeef.wav"))).toBe(true);
    expect(warns.some((m) => m.includes("u-998-cafebabe.wav"))).toBe(true);
  });

  it("尺誤差警告（design §9.2/§9.3）: 誤差 15%超〜25%以下で警告を標準出力に表示する", async () => {
    // 実測総尺（totalSeconds）は MANIFEST_RESULT の total_duration_frames=300, fps=30 → 10 秒固定。
    // predicted=8 秒なら誤差 = |8-10|/10 = 20%（15%超〜25%以下 = warning 帯）。
    const { deps, warns } = createMockDeps({
      estimateImpl: vi.fn().mockReturnValue({
        ...ESTIMATE_OK,
        predicted_total_seconds: 8,
      }),
    });

    const exitCode = await runCompileScriptCli(["java-vs-js"], deps);

    expect(exitCode).toBe(0); // 非ブロッキング（design §9.3: exit code を変えない）
    const warning = warns.find((m) => m.includes("尺誤差警告"));
    expect(warning).toBeDefined();
    expect(warning).toContain("20.0%");
  });

  it("尺誤差警告（design §9.2/§9.3）: 誤差 25%超で強い警告を目立つフォーマットで表示する", async () => {
    // predicted=3 秒なら誤差 = |3-10|/10 = 70%（25%超 = critical 帯）。
    const { deps, warns } = createMockDeps({
      estimateImpl: vi.fn().mockReturnValue({
        ...ESTIMATE_OK,
        predicted_total_seconds: 3,
      }),
    });

    const exitCode = await runCompileScriptCli(["java-vs-js"], deps);

    expect(exitCode).toBe(0); // 非ブロッキング（design §9.3: exit code を変えない）
    const warning = warns.find((m) => m.includes("強い警告"));
    expect(warning).toBeDefined();
    expect(warning).toContain("70.0%");
  });

  it("尺誤差警告（design §9.2/§9.3）: 誤差 15%以下は正常でメッセージを出力しない", async () => {
    // predicted=9.5 秒なら誤差 = |9.5-10|/10 = 5%（normal 帯 = メッセージなし）。
    const { deps, warns } = createMockDeps({
      estimateImpl: vi.fn().mockReturnValue({
        ...ESTIMATE_OK,
        predicted_total_seconds: 9.5,
      }),
    });

    const exitCode = await runCompileScriptCli(["java-vs-js"], deps);

    expect(exitCode).toBe(0);
    expect(warns.some((m) => m.includes("尺誤差"))).toBe(false);
  });

  it("引数なし: 日本語 usage エラーを出力して exit 1", async () => {
    const { deps, errors } = createMockDeps();

    const exitCode = await runCompileScriptCli([], deps);

    expect(exitCode).toBe(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/^✗ script-id が指定されていません/);
    expect(errors[0]).toContain(CLI_USAGE);
    // パイプラインは一切走らない
    expect(deps.parseScriptImpl).not.toHaveBeenCalled();
    expect(deps.synthesizeImpl).not.toHaveBeenCalled();
  });

  it("パイプライン内エラー（parse 失敗等）: メッセージを出力して exit 1", async () => {
    const { deps, errors } = createMockDeps({
      parseScriptImpl: vi
        .fn()
        .mockRejectedValue(new Error("✗ 台本ファイルの読込に失敗しました: no-such-id")),
    });

    const exitCode = await runCompileScriptCli(["no-such-id"], deps);

    expect(exitCode).toBe(1);
    expect(errors[0]).toMatch(/^✗ 台本ファイルの読込に失敗しました/);
    expect(deps.synthesizeImpl).not.toHaveBeenCalled();
  });

  it("synthesize のエラー（Engine 不在等）: メッセージを出力して exit 1、manifest 生成に進まない", async () => {
    const { deps, errors } = createMockDeps({
      synthesizeImpl: vi
        .fn()
        .mockRejectedValue(
          new Error("✗ VOICEVOX Engine（http://localhost:50021）に接続できません。"),
        ),
    });

    const exitCode = await runCompileScriptCli(["java-vs-js"], deps);

    expect(exitCode).toBe(1);
    expect(errors[0]).toMatch(/^✗ VOICEVOX Engine/);
    expect(deps.measureImpl).not.toHaveBeenCalled();
    expect(deps.generateManifestImpl).not.toHaveBeenCalled();
  });

  it("破損 manifest: fail-fast で exit 1（黙って manifest なし扱いにしない）", async () => {
    const { deps, errors } = createMockDeps({
      readFileImpl: vi.fn().mockResolvedValue("{ broken json"),
    });

    const exitCode = await runCompileScriptCli(["java-vs-js"], deps);

    expect(exitCode).toBe(1);
    expect(errors[0]).toMatch(/^✗ 既存 manifest の JSON 解析に失敗しました/);
    expect(deps.synthesizeImpl).not.toHaveBeenCalled();
  });
});
