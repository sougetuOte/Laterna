/**
 * script-engine — synthesize.ts / content-hash.ts のテスト
 *
 * 出自: docs/specs/script-engine/tasks.md W2-script-engine-T10 完了条件
 *   「テスト: mock VOICEVOX API（responses を __mocks__/ から返す）を使い、skip/synthesize の
 *   両方をテスト」
 *
 * mock 方式: `SynthesizeOptions.fetchImpl` の差し替えにより VOICEVOX Engine への実通信を行わず、
 * `__mocks__/` 配下の fixture ファイル（voicevox-version.json / voicevox-audio-query.json /
 * voicevox-synthesis.wav）をそのまま応答として返す。fixture の `voicevox-audio-query.json` /
 * `voicevox-synthesis.wav` は 2026-07-10 実測（起動中の VOICEVOX Engine 0.25.2、
 * speaker=11、text="これはテストです。"）から採取した実データ（voicevox-synthesis.wav のみ
 * リポジトリ肥大化を避けるため 60 バイトの最小合成 WAV に差し替え）。
 *
 * 依存追加は行わず（タスク境界 MUST NOT）、実ネットワーク通信は smoke dry-run（別途 t10-smoke
 * ディレクトリで手動実施、リポジトリには残さない）でのみ行う。
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { readFile, mkdtemp, rm, access, readdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import {
  synthesizeScriptAudio,
  resolveDefaultOutputDir,
  DEFAULT_VOICEVOX_ENGINE_BASE_URL,
  DEFAULT_VERSION_TIMEOUT_MS,
  DEFAULT_SYNTHESIS_TIMEOUT_MS,
  MIN_VALID_WAV_BYTES,
} from "./synthesize";
import { computeContentHash } from "./content-hash";
import { FIXED_SYNTHESIS_PARAMS } from "../schema/speaker-profile";
import type { SpeakersRegistry } from "../schema/speaker-profile";
import type { ScriptDocument } from "../schema/script";

const MOCKS_DIR = path.resolve(__dirname, "__mocks__");

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

function makeScript(utterances: ScriptDocument["utterances"]): ScriptDocument {
  return {
    speaker_profile_ref: "default",
    utterances,
    slides: [],
    slide_events: [],
  };
}

// --- mock fetch 構築 ---------------------------------------------------------

interface MockFetchCall {
  url: string;
  method: string | undefined;
  signal: AbortSignal | undefined | null;
}

interface MockFetchHandle {
  fetchImpl: typeof fetch;
  calls: MockFetchCall[];
}

interface MockFetchOptions {
  /** true の場合 /version 呼び出しで接続エラー（Engine 不在）を模擬する */
  engineUnreachable?: boolean;
  /** true の場合 /version が非 200 を返す */
  versionHttpError?: boolean;
  /** 2026-07-10 HGA W-4: 指定エンドポイントの呼び出しでタイムアウト相当のエラーを模擬する */
  timeoutOn?: "version" | "audio_query" | "synthesis";
}

function createMockFetch(options: MockFetchOptions = {}): MockFetchHandle {
  const calls: MockFetchCall[] = [];

  const fetchImpl = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = String(input);
    calls.push({ url, method: init?.method, signal: init?.signal });

    if (url.includes("/version")) {
      if (options.engineUnreachable) {
        throw new Error("ECONNREFUSED (mock: VOICEVOX Engine 不在)");
      }
      if (options.versionHttpError) {
        return new Response("internal error", { status: 500 });
      }
      if (options.timeoutOn === "version") {
        throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
      }
      const raw = await readFile(path.join(MOCKS_DIR, "voicevox-version.json"), "utf-8");
      return new Response(raw, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.includes("/audio_query")) {
      if (options.timeoutOn === "audio_query") {
        throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
      }
      const raw = await readFile(
        path.join(MOCKS_DIR, "voicevox-audio-query.json"),
        "utf-8",
      );
      return new Response(raw, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.includes("/synthesis")) {
      if (options.timeoutOn === "synthesis") {
        throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
      }
      const wav = await readFile(path.join(MOCKS_DIR, "voicevox-synthesis.wav"));
      return new Response(wav, {
        status: 200,
        headers: { "Content-Type": "audio/wav" },
      });
    }

    throw new Error(`mock fetch: 想定外の URL: ${url}`);
  }) as typeof fetch;

  return { fetchImpl, calls };
}

// --- テスト用一時ディレクトリ -------------------------------------------------

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "script-engine-synthesize-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// ============================================================================

describe("DEFAULT_VOICEVOX_ENGINE_BASE_URL", () => {
  it("design §4.1 のローカル既定接続先と一致する", () => {
    expect(DEFAULT_VOICEVOX_ENGINE_BASE_URL).toBe("http://localhost:50021");
  });
});

describe("computeContentHash（design §4.2 / spike-hash-logic-2026-07-09.md 移植）", () => {
  it("8 桁の 16 進文字列を返す", () => {
    const hash = computeContentHash({ text: "こんにちは。", voicevoxSpeakerId: 11 });
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("text が変われば再合成トリガー（ハッシュが変わる）", () => {
    const before = computeContentHash({ text: "限界です。", voicevoxSpeakerId: 11 });
    const after = computeContentHash({ text: "限界ですね。", voicevoxSpeakerId: 11 });
    expect(before).not.toBe(after);
  });

  it("voicevoxSpeakerId が変われば再合成トリガー（ハッシュが変わる）", () => {
    const before = computeContentHash({ text: "同じテキストです。", voicevoxSpeakerId: 11 });
    const after = computeContentHash({ text: "同じテキストです。", voicevoxSpeakerId: 12 });
    expect(before).not.toBe(after);
  });

  it("id 相当の情報を持たないため、同一 text/speaker なら常に同一ハッシュ（並べ替え耐性）", () => {
    const a = computeContentHash({ text: "これは発話1です。", voicevoxSpeakerId: 11 });
    const b = computeContentHash({ text: "これは発話1です。", voicevoxSpeakerId: 11 });
    expect(a).toBe(b);
  });

  it("design §4.2 v3.2 MUST: enable_interrogative_upspeak が変わればハッシュが変わる", () => {
    const withUpspeak = computeContentHash({
      text: "本当ですか？",
      voicevoxSpeakerId: 11,
      enableInterrogativeUpspeak: true,
    });
    const withoutUpspeak = computeContentHash({
      text: "本当ですか？",
      voicevoxSpeakerId: 11,
      enableInterrogativeUpspeak: false,
    });
    expect(withUpspeak).not.toBe(withoutUpspeak);
  });

  it("synthesisParams 省略時は FIXED_SYNTHESIS_PARAMS を明示指定した場合と同一ハッシュになる", () => {
    const implicit = computeContentHash({ text: "テスト", voicevoxSpeakerId: 11 });
    const explicit = computeContentHash({
      text: "テスト",
      voicevoxSpeakerId: 11,
      synthesisParams: FIXED_SYNTHESIS_PARAMS,
    });
    expect(implicit).toBe(explicit);
  });
});

describe("synthesizeScriptAudio — 正常系（mock VOICEVOX API）", () => {
  it("VOICEVOX Engine 不在時: 即座にエラーで終了し、接続先 URL と起動手順ドキュメントへの言及を含む", async () => {
    const { fetchImpl } = createMockFetch({ engineUnreachable: true });
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "こんにちは。" },
    ]);

    await expect(
      synthesizeScriptAudio(script, SPEAKER_PROFILES, {
        scriptId: "test-script",
        outputDir: tempDir,
        fetchImpl,
      }),
    ).rejects.toThrow(/localhost:50021|voicevox-engine-setup\.md/);
  });

  it("VOICEVOX Engine が /version で非 200 を返す場合もエラー終了する", async () => {
    const { fetchImpl } = createMockFetch({ versionHttpError: true });
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "こんにちは。" },
    ]);

    await expect(
      synthesizeScriptAudio(script, SPEAKER_PROFILES, {
        scriptId: "test-script",
        outputDir: tempDir,
        fetchImpl,
      }),
    ).rejects.toThrow(/HTTP 500/);
  });

  it("初回合成: WAV が存在しないため全発話を VOICEVOX 呼び出しで新規合成し、ファイルを書き出す", async () => {
    const { fetchImpl, calls } = createMockFetch();
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "こんにちは、これはテストです。" },
      { id: "u-002", speaker: "listener", text: "はい、テストですね。" },
    ]);

    const result = await synthesizeScriptAudio(script, SPEAKER_PROFILES, {
      scriptId: "test-script",
      outputDir: tempDir,
      fetchImpl,
    });

    expect(result.synthesized).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.voicevox_engine_version).toBe("0.25.2");
    expect(result.utterances_with_wav).toHaveLength(2);

    for (const u of result.utterances_with_wav) {
      expect(u.content_hash).toMatch(/^[0-9a-f]{8}$/);
      expect(u.wav_path).toContain(`${u.utterance_id}-${u.content_hash}.wav`);
      // design §4.3 MUST: manifest 内のパス区切りは / 固定（本フィールドも同じ規約で正規化）
      expect(u.wav_path).not.toContain("\\");
      await expect(access(u.wav_path)).resolves.not.toThrow();
    }

    // audio_query は発話数分呼ばれる（各発話に1回）
    const audioQueryCalls = calls.filter((c) => c.url.includes("/audio_query"));
    expect(audioQueryCalls).toHaveLength(2);
    // synthesis 呼び出しに enable_interrogative_upspeak=true が明示指定されている（design §4.2 v3.2 MUST）
    const synthesisCalls = calls.filter((c) => c.url.includes("/synthesis"));
    expect(synthesisCalls).toHaveLength(2);
    for (const call of synthesisCalls) {
      expect(call.url).toContain("enable_interrogative_upspeak=true");
      expect(call.method).toBe("POST");
    }
  });

  it("skip 経路（recordedHashes 省略時）: 既に同名 WAV が存在すれば VOICEVOX を呼ばず再利用する", async () => {
    const { fetchImpl: firstFetch } = createMockFetch();
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "同じ内容です。" },
    ]);

    // 1 回目: 新規合成
    const first = await synthesizeScriptAudio(script, SPEAKER_PROFILES, {
      scriptId: "test-script",
      outputDir: tempDir,
      fetchImpl: firstFetch,
    });
    expect(first.synthesized).toBe(1);
    expect(first.skipped).toBe(0);

    // 2 回目: 同一台本・同一 outputDir → WAV 再利用（skip）、VOICEVOX 呼び出しなし
    const { fetchImpl: secondFetch, calls: secondCalls } = createMockFetch();
    const second = await synthesizeScriptAudio(script, SPEAKER_PROFILES, {
      scriptId: "test-script",
      outputDir: tempDir,
      fetchImpl: secondFetch,
    });
    expect(second.synthesized).toBe(0);
    expect(second.skipped).toBe(1);
    expect(second.utterances_with_wav[0]?.content_hash).toBe(
      first.utterances_with_wav[0]?.content_hash,
    );
    // /version 疎通確認は毎回行うが、audio_query / synthesis は呼ばれない
    expect(secondCalls.some((c) => c.url.includes("/audio_query"))).toBe(false);
    expect(secondCalls.some((c) => c.url.includes("/synthesis"))).toBe(false);
  });

  it("ハッシュ不一致再合成（recordedHashes 明示注入）: manifest 記録ハッシュと不一致なら skip せず再合成する", async () => {
    const { fetchImpl: firstFetch } = createMockFetch();
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "元のテキストです。" },
    ]);

    const first = await synthesizeScriptAudio(script, SPEAKER_PROFILES, {
      scriptId: "test-script",
      outputDir: tempDir,
      fetchImpl: firstFetch,
    });
    const originalHash = first.utterances_with_wav[0]!.content_hash;

    // 台本のテキストを変更（= 期待ハッシュが変わる）。旧 manifest には旧ハッシュのみ記録されている状況を再現。
    const changedScript = makeScript([
      { id: "u-001", speaker: "narrator", text: "変更後のテキストです。" },
    ]);
    const { fetchImpl: secondFetch, calls: secondCalls } = createMockFetch();
    const second = await synthesizeScriptAudio(changedScript, SPEAKER_PROFILES, {
      scriptId: "test-script",
      outputDir: tempDir,
      fetchImpl: secondFetch,
      recordedHashes: { "u-001": originalHash },
    });

    expect(second.synthesized).toBe(1);
    expect(second.skipped).toBe(0);
    expect(second.utterances_with_wav[0]?.content_hash).not.toBe(originalHash);
    expect(secondCalls.some((c) => c.url.includes("/audio_query"))).toBe(true);
    expect(secondCalls.some((c) => c.url.includes("/synthesis"))).toBe(true);
  });

  it("recordedHashes 明示注入 + ハッシュ一致: skip する", async () => {
    const { fetchImpl: firstFetch } = createMockFetch();
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "変わらないテキストです。" },
    ]);

    const first = await synthesizeScriptAudio(script, SPEAKER_PROFILES, {
      scriptId: "test-script",
      outputDir: tempDir,
      fetchImpl: firstFetch,
    });
    const hash = first.utterances_with_wav[0]!.content_hash;

    const { fetchImpl: secondFetch, calls: secondCalls } = createMockFetch();
    const second = await synthesizeScriptAudio(script, SPEAKER_PROFILES, {
      scriptId: "test-script",
      outputDir: tempDir,
      fetchImpl: secondFetch,
      recordedHashes: { "u-001": hash },
    });

    expect(second.skipped).toBe(1);
    expect(second.synthesized).toBe(0);
    expect(secondCalls.some((c) => c.url.includes("/audio_query"))).toBe(false);
  });

  it("未知の話者役割は fail-fast エラーになる（design §4.4 と同様の方針、resolveSpeakerProfile 経由）", async () => {
    const { fetchImpl } = createMockFetch();
    const script = makeScript([
      { id: "u-001", speaker: "unknown-role", text: "テスト" },
    ]);

    await expect(
      synthesizeScriptAudio(script, SPEAKER_PROFILES, {
        scriptId: "test-script",
        outputDir: tempDir,
        fetchImpl,
      }),
    ).rejects.toThrow(/未知の話者役割/);
  });

  it("resolveDefaultOutputDir: 既定 outputDir は public/audio/<scriptId>/ を指す（design §4.1）", () => {
    // 実際に public/ へ書き込むテストは行わない（タスク境界 MUST: public/ 配下への書込禁止）。
    // ここではパス解決のみを検証する（synthesizeScriptAudio 本体は outputDir 注入テストで別途検証済み）。
    const resolved = resolveDefaultOutputDir("path-check-script");
    expect(resolved.endsWith(path.join("public", "audio", "path-check-script"))).toBe(true);
    expect(path.isAbsolute(resolved)).toBe(true);
  });
});

describe("synthesizeScriptAudio — fetch タイムアウト（design 2026-07-10 HGA W-4）", () => {
  it("全 fetch 呼び出しに AbortSignal が渡される（実タイマー待ちはしない）", async () => {
    const { fetchImpl, calls } = createMockFetch();
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "こんにちは。" },
    ]);

    await synthesizeScriptAudio(script, SPEAKER_PROFILES, {
      scriptId: "test-script",
      outputDir: tempDir,
      fetchImpl,
    });

    expect(calls.length).toBeGreaterThanOrEqual(3);
    for (const call of calls) {
      expect(call.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it("timeoutMs 省略時は既定値（/version=10000ms, /audio_query・/synthesis=60000ms）を使う", () => {
    expect(DEFAULT_VERSION_TIMEOUT_MS).toBe(10_000);
    expect(DEFAULT_SYNTHESIS_TIMEOUT_MS).toBe(60_000);
  });

  it("/version がタイムアウトすると、応答なし・タイムアウト値・設定ドキュメントへの言及を含むエラーになる", async () => {
    const { fetchImpl } = createMockFetch({ timeoutOn: "version" });
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "こんにちは。" },
    ]);

    await expect(
      synthesizeScriptAudio(script, SPEAKER_PROFILES, {
        scriptId: "test-script",
        outputDir: tempDir,
        fetchImpl,
        timeoutMs: 5_000,
      }),
    ).rejects.toThrow(/localhost:50021\/version.*応答しません.*5000ms.*voicevox-engine-setup\.md/s);
  });

  it("/audio_query がタイムアウトすると、応答なし・タイムアウト値・設定ドキュメントへの言及を含むエラーになる", async () => {
    const { fetchImpl } = createMockFetch({ timeoutOn: "audio_query" });
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "こんにちは。" },
    ]);

    await expect(
      synthesizeScriptAudio(script, SPEAKER_PROFILES, {
        scriptId: "test-script",
        outputDir: tempDir,
        fetchImpl,
        timeoutMs: 5_000,
      }),
    ).rejects.toThrow(/audio_query.*応答しません.*5000ms.*voicevox-engine-setup\.md/s);
  });

  it("/synthesis がタイムアウトすると、応答なし・タイムアウト値・設定ドキュメントへの言及を含むエラーになる", async () => {
    const { fetchImpl } = createMockFetch({ timeoutOn: "synthesis" });
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "こんにちは。" },
    ]);

    await expect(
      synthesizeScriptAudio(script, SPEAKER_PROFILES, {
        scriptId: "test-script",
        outputDir: tempDir,
        fetchImpl,
        timeoutMs: 5_000,
      }),
    ).rejects.toThrow(/synthesis.*応答しません.*5000ms.*voicevox-engine-setup\.md/s);
  });

  it("timeoutMs 指定時は一括で全呼び出しに適用される", async () => {
    const { fetchImpl, calls } = createMockFetch();
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "こんにちは。" },
    ]);

    await synthesizeScriptAudio(script, SPEAKER_PROFILES, {
      scriptId: "test-script",
      outputDir: tempDir,
      fetchImpl,
      timeoutMs: 123,
    });

    // signal の中身（タイムアウト値そのもの）は AbortSignal からは直接読めないため、
    // ここでは「全呼び出しに signal が付与されている」ことのみを回帰確認する
    // （具体的な ms 値の伝播は上記のタイムアウト発火テストで間接的に検証済み）。
    expect(calls.every((c) => c.signal instanceof AbortSignal)).toBe(true);
  });
});

describe("synthesizeScriptAudio — WAV 書込のアトミック化・破損ファイル再合成（design 2026-07-10 HGA W-5）", () => {
  it("MIN_VALID_WAV_BYTES は 44（RIFF ヘッダ相当）である", () => {
    expect(MIN_VALID_WAV_BYTES).toBe(44);
  });

  it("合成後、出力ディレクトリに `.tmp-` プレフィクスの残骸ファイルが残らない（アトミック書込み）", async () => {
    const { fetchImpl } = createMockFetch();
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "アトミック書込みのテストです。" },
    ]);

    await synthesizeScriptAudio(script, SPEAKER_PROFILES, {
      scriptId: "test-script",
      outputDir: tempDir,
      fetchImpl,
    });

    const entries = await readdir(tempDir);
    expect(entries.some((e) => e.startsWith(".tmp-"))).toBe(false);
    expect(entries.some((e) => e.endsWith(".wav") && !e.startsWith(".tmp-"))).toBe(true);
  });

  it("既存 WAV が 44 バイト以下（破損ファイル）の場合は skip せず再合成する", async () => {
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "破損ファイル再合成のテストです。" },
    ]);
    const contentHash = computeContentHash({
      text: "破損ファイル再合成のテストです。",
      voicevoxSpeakerId: 11,
    });
    const corruptPath = path.join(tempDir, `u-001-${contentHash}.wav`);
    await writeFile(corruptPath, Buffer.alloc(20)); // 44 バイト以下 = 破損扱い

    const { fetchImpl, calls } = createMockFetch();
    const result = await synthesizeScriptAudio(script, SPEAKER_PROFILES, {
      scriptId: "test-script",
      outputDir: tempDir,
      fetchImpl,
    });

    expect(result.skipped).toBe(0);
    expect(result.synthesized).toBe(1);
    expect(calls.some((c) => c.url.includes("/audio_query"))).toBe(true);

    const finalStats = await stat(corruptPath);
    expect(finalStats.size).toBeGreaterThan(MIN_VALID_WAV_BYTES);
  });

  it("既存 WAV が 45 バイト以上（正常サイズ）なら通常通り skip する", async () => {
    const script = makeScript([
      { id: "u-001", speaker: "narrator", text: "正常サイズ WAV の skip テストです。" },
    ]);
    const contentHash = computeContentHash({
      text: "正常サイズ WAV の skip テストです。",
      voicevoxSpeakerId: 11,
    });
    const okPath = path.join(tempDir, `u-001-${contentHash}.wav`);
    await writeFile(okPath, Buffer.alloc(45, 1)); // 44 バイト超 = 健全サイズ扱い

    const { fetchImpl, calls } = createMockFetch();
    const result = await synthesizeScriptAudio(script, SPEAKER_PROFILES, {
      scriptId: "test-script",
      outputDir: tempDir,
      fetchImpl,
    });

    expect(result.skipped).toBe(1);
    expect(result.synthesized).toBe(0);
    expect(calls.some((c) => c.url.includes("/audio_query"))).toBe(false);
  });
});

describe("__mocks__ fixture 整合性", () => {
  it("voicevox-version.json は JSON 文字列としてパース可能で 0.25.2 を返す", async () => {
    const raw = await readFile(path.join(MOCKS_DIR, "voicevox-version.json"), "utf-8");
    expect(JSON.parse(raw)).toBe("0.25.2");
  });

  it("voicevox-audio-query.json は speedScale/pitchScale/intonationScale フィールドを持つ", async () => {
    const raw = await readFile(path.join(MOCKS_DIR, "voicevox-audio-query.json"), "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed).toHaveProperty("speedScale");
    expect(parsed).toHaveProperty("pitchScale");
    expect(parsed).toHaveProperty("intonationScale");
  });

  it("voicevox-synthesis.wav は RIFF/WAVE ヘッダを持つ有効な WAV バイナリである", async () => {
    const buf = await readFile(path.join(MOCKS_DIR, "voicevox-synthesis.wav"));
    expect(buf.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(buf.subarray(8, 12).toString("ascii")).toBe("WAVE");
  });
});
