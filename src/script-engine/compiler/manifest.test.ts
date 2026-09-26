/**
 * script-engine — manifest.ts のテスト
 *
 * 出自: docs/specs/script-engine/tasks.md W2-script-engine-T12 完了条件
 *   「テスト: 実 java-vs-js.script.yaml（T24 成果物）で manifest が期待の frame 値を持つことを
 *   確認（手計算値と一致）。負値 pause・未登録コンポーネント等の異常系は最小 mock で検証」
 *
 * ============================================================================
 * 手計算の根拠（実データ検証、design §5.2 frame 変換規約）
 * ============================================================================
 *
 * `content/scripts/java-vs-js.script.yaml` の 13 発話に対し、以下のダミー duration_seconds
 * （WAV 実測を模した既知の固定値。実 WAV は使わない）を割り当てる:
 *
 * | id    | speaker  | pause_after | duration_seconds(dummy) |
 * |-------|----------|------------:|-------------------------:|
 * | u-001 | narrator |         0.3 |                     2.87 |
 * | u-002 | listener |           0 |                     2.53 |
 * | u-003 | narrator |           0 |                     3.92 |
 * | u-004 | listener |           0 |                     2.67 |
 * | u-005 | narrator |         0.6 |                     1.73 |
 * | u-006 | narrator |           0 |                     5.83 |
 * | u-007 | listener |           0 |                     2.15 |
 * | u-008 | narrator |           0 |                     3.64 |
 * | u-009 | narrator |           0 |                     5.28 |
 * | u-010 | listener |         0.4 |                     2.79 |
 * | u-011 | narrator |           0 |                     6.35 |
 * | u-012 | listener |         0.4 |                     2.44 |
 * | u-013 | narrator |           0 |                     6.98 |
 *
 * pause_before は台本上どの発話にも指定がない（全て 0、design §5.2 の式で省略時デフォルト 0）。
 *
 * design §5.2 の累積秒アルゴリズム（cum_sec を丸めずに浮動小数のまま積算し、frame 化は
 * `round(cum_sec * fps)` を各境界に対して 1 回だけ適用）を fps=30 で手計算した結果
 * （本テスト作成時に一度だけ計算スクリプトを実行して確定した値。cum_sec は
 * `cum += pause_before; start_sec = cum; cum += duration; audio_end_sec = cum;
 * cum += pause_after; end_sec = cum;` の順で発話ごとに進める）:
 *
 * | id    | start_sec | audio_end_sec | end_sec  | start_frame | audio_end_frame | end_frame |
 * |-------|----------:|---------------:|---------:|------------:|-----------------:|----------:|
 * | u-001 |     0.000 |          2.870 |    3.170 |           0 |               86 |        95 |
 * | u-002 |     3.170 |          5.700 |    5.700 |          95 |              171 |       171 |
 * | u-003 |     5.700 |          9.620 |    9.620 |         171 |              289 |       289 |
 * | u-004 |     9.620 |         12.290 |   12.290 |         289 |              369 |       369 |
 * | u-005 |    12.290 |         14.020 |   14.620 |         369 |              421 |       439 |
 * | u-006 |    14.620 |         20.450 |   20.450 |         439 |              614 |       614 |
 * | u-007 |    20.450 |         22.600 |   22.600 |         614 |              678 |       678 |
 * | u-008 |    22.600 |         26.240 |   26.240 |         678 |              787 |       787 |
 * | u-009 |    26.240 |         31.520 |   31.520 |         787 |              946 |       946 |
 * | u-010 |    31.520 |         34.310 |   34.710 |         946 |             1029 |      1041 |
 * | u-011 |    34.710 |         41.060 |   41.060 |        1041 |             1232 |      1232 |
 * | u-012 |    41.060 |         43.500 |   43.900 |        1232 |             1305 |      1317 |
 * | u-013 |    43.900 |         50.880 |   50.880 |        1317 |             1526 |      1526 |
 *
 * スライドイベント frame（design §5.2 pt.3: `frame = round((anchor 境界の累積秒 + offset) * fps)`。
 * `position: "end"` は `audio_end_sec` を基準とする、後述の ev-002 検証参照）:
 * - ev-001: anchor u-001 start, offset 0        → 0.000 * 30      = frame 0
 * - ev-002: anchor u-005 end,   offset 0.6      → (14.020+0.6)*30 = frame 439
 *   （u-005 の audio_end_sec=14.020 に pause_after=0.6 を足すと u-005 の end_sec=14.620、
 *   すなわち u-006 の start_sec と一致する。台本コメント「u-005 終了 + 0.6 秒 = pause_after
 *   経由で u-006 開始と同時刻」が成立することを、u-006.start_frame=439 と ev-002.frame=439 の
 *   一致で検証している）
 * - ev-003: anchor u-011 start, offset 0        → 34.710 * 30     = frame 1041
 * - ev-004: anchor u-013 start, offset 0        → 43.900 * 30     = frame 1317
 *
 * 総尺（design §5.4 v3 一般則 + §7.5 クレジット）:
 * - 最終発話 u-013 の end_frame = 1526
 * - 最終 slide_event（ev-004）の frame(1317) + 表示保証尺(2s=60frame) = 1377
 * - max(1526, 1377) = 1526（このデータでは「最終発話終了」が上回る。「最終 slide + 2 秒」が
 *   上回るケースは別テスト（下記「total_duration_frames 一般則」describe）で検証する）
 * - + クレジット区間(3s=90frame) = 1526 + 90 = **1616**
 */

import { describe, expect, it } from "vitest";
import path from "node:path";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { parseScript } from "./parse";
import { loadSpeakerProfiles } from "./speaker-profiles";
import { generateManifest, DEFAULT_FPS, DISPLAY_GUARANTEE_SECONDS, CREDIT_REGION_SECONDS } from "./manifest";
import type { UtteranceWithMeasuredWav } from "./manifest";
import type { ScriptDocument } from "../schema/script";
import type { SpeakersRegistry } from "../schema/speaker-profile";

const JAVA_VS_JS_SCRIPT_PATH = path.resolve(
  __dirname,
  "../../../content/scripts/java-vs-js.script.yaml",
);

/** テスト冒頭コメントの手計算表と対応するダミー duration_seconds。 */
const DUMMY_DURATIONS: Record<string, number> = {
  "u-001": 2.87,
  "u-002": 2.53,
  "u-003": 3.92,
  "u-004": 2.67,
  "u-005": 1.73,
  "u-006": 5.83,
  "u-007": 2.15,
  "u-008": 3.64,
  "u-009": 5.28,
  "u-010": 2.79,
  "u-011": 6.35,
  "u-012": 2.44,
  "u-013": 6.98,
};

function buildUtterancesWithWav(
  script: ScriptDocument,
  durations: Record<string, number>,
): UtteranceWithMeasuredWav[] {
  return script.utterances.map((u) => ({
    utterance_id: u.id,
    speaker: u.speaker,
    content_hash: `hash-${u.id}`,
    wav_path: `/fake/public/audio/java-vs-js/${u.id}-hash.wav`,
    duration_seconds: durations[u.id],
  }));
}

/** 最小構成のモック台本（異常系検証用、design §4.4 の各種 fail-fast をピンポイントで再現する）。 */
function makeMinimalScript(overrides: Partial<ScriptDocument> = {}): ScriptDocument {
  return {
    speaker_profile_ref: "default",
    utterances: [],
    slides: [],
    slide_events: [],
    ...overrides,
  };
}

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

async function withTempDir(run: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), "script-engine-manifest-test-"));
  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("generateManifest (実データ: java-vs-js.script.yaml, ダミー duration)", () => {
  it("手計算表の frame 値と完全一致する manifest を生成する", async () => {
    await withTempDir(async (dir) => {
      const script = await parseScript(JAVA_VS_JS_SCRIPT_PATH);
      const speakerProfiles = await loadSpeakerProfiles("default");
      const utterancesWithWav = buildUtterancesWithWav(script, DUMMY_DURATIONS);
      const outputPath = path.join(dir, "java-vs-js.manifest.json");

      const result = await generateManifest(script, utterancesWithWav, speakerProfiles, {
        scriptId: "java-vs-js",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath,
        wavDir: dir,
        prune: false,
      });

      const { manifest } = result;
      expect(manifest.schema_version).toBe(1);
      expect(manifest.script_id).toBe("java-vs-js");
      expect(manifest.fps).toBe(DEFAULT_FPS);
      expect(manifest.voicevox_engine_version).toBe("0.25.2-test");
      expect(manifest.utterances).toHaveLength(13);

      const expectedUtteranceFrames: Record<
        string,
        { start_frame: number; audio_end_frame: number; end_frame: number }
      > = {
        "u-001": { start_frame: 0, audio_end_frame: 86, end_frame: 95 },
        "u-002": { start_frame: 95, audio_end_frame: 171, end_frame: 171 },
        "u-003": { start_frame: 171, audio_end_frame: 289, end_frame: 289 },
        "u-004": { start_frame: 289, audio_end_frame: 369, end_frame: 369 },
        "u-005": { start_frame: 369, audio_end_frame: 421, end_frame: 439 },
        "u-006": { start_frame: 439, audio_end_frame: 614, end_frame: 614 },
        "u-007": { start_frame: 614, audio_end_frame: 678, end_frame: 678 },
        "u-008": { start_frame: 678, audio_end_frame: 787, end_frame: 787 },
        "u-009": { start_frame: 787, audio_end_frame: 946, end_frame: 946 },
        "u-010": { start_frame: 946, audio_end_frame: 1029, end_frame: 1041 },
        "u-011": { start_frame: 1041, audio_end_frame: 1232, end_frame: 1232 },
        "u-012": { start_frame: 1232, audio_end_frame: 1305, end_frame: 1317 },
        "u-013": { start_frame: 1317, audio_end_frame: 1526, end_frame: 1526 },
      };

      for (const utterance of manifest.utterances) {
        expect(utterance).toMatchObject(expectedUtteranceFrames[utterance.id]);
        expect(utterance.duration_seconds).toBe(DUMMY_DURATIONS[utterance.id]);
        // 2026-07-10 HGA C-1 MUST: manifest wav_path は public/ 相対（audio/<script-id>/<basename>）
        expect(utterance.wav_path).toBe(`audio/java-vs-js/${utterance.id}-hash.wav`);
      }

      expect(manifest.slide_events).toEqual([
        { id: "ev-001", slide: "slide-compare-intro", start_frame: 0 },
        { id: "ev-002", slide: "slide-timeline", start_frame: 439 },
        { id: "ev-003", slide: "slide-compare-full", start_frame: 1041 },
        { id: "ev-004", slide: "slide-summary", start_frame: 1317 },
      ]);

      // design §4.3 v3.5: slides[] は変換・加工なしでそのまま焼き込まれる
      expect(manifest.slides).toEqual(script.slides);
      expect(manifest.slides).toHaveLength(4);

      // ev-002（end + offset アンカー）が u-006 の start_frame と一致することの直接検証
      // （台本コメント「u-005 終了 + 0.6 秒 = pause_after 経由で u-006 開始と同時刻」）。
      const ev002 = manifest.slide_events.find((e) => e.id === "ev-002")!;
      const u006 = manifest.utterances.find((u) => u.id === "u-006")!;
      expect(ev002.start_frame).toBe(u006.start_frame);

      // 総尺: max(u-013.end_frame=1526, ev-004.frame(1317)+60) + 90 = 1526 + 90 = 1616
      expect(manifest.total_duration_frames).toBe(1616);

      // design §7.5: 台本使用話者（narrator → listener の初出順）のクレジットのみ含む
      expect(manifest.credits).toEqual([
        "VOICEVOX:玄野武宏(CV:ガロ)",
        "VOICEVOX:ずんだもん",
      ]);

      expect(result.warnings).toEqual([]);
    });
  });

  it("manifest JSON を outputPath に書き出す（/ 区切り、末尾改行あり）", async () => {
    await withTempDir(async (dir) => {
      const script = await parseScript(JAVA_VS_JS_SCRIPT_PATH);
      const speakerProfiles = await loadSpeakerProfiles("default");
      const utterancesWithWav = buildUtterancesWithWav(script, DUMMY_DURATIONS);
      const outputPath = path.join(dir, "nested", "java-vs-js.manifest.json");

      const result = await generateManifest(script, utterancesWithWav, speakerProfiles, {
        scriptId: "java-vs-js",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath,
        wavDir: dir,
        prune: false,
      });

      expect(result.outputPath).toBe(outputPath);
      const written = await readFile(outputPath, "utf-8");
      expect(written.endsWith("\n")).toBe(true);
      const parsed = JSON.parse(written);
      expect(parsed.script_id).toBe("java-vs-js");
      expect(parsed.utterances[0].wav_path).not.toContain("\\");
    });
  });

  it("Windows 風バックスラッシュ wav_path を public/ 相対パス（audio/<script-id>/<basename>）に正規化する（design §4.3 MUST、2026-07-10 HGA C-1）", async () => {
    await withTempDir(async (dir) => {
      const script = makeMinimalScript({
        utterances: [{ id: "u-1", speaker: "narrator", text: "テスト" }],
      });
      const utterancesWithWav: UtteranceWithMeasuredWav[] = [
        {
          utterance_id: "u-1",
          speaker: "narrator",
          content_hash: "abc12345",
          wav_path: "C:\\temp\\audio\\u-1-abc12345.wav",
          duration_seconds: 1.0,
        },
      ];

      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "mini",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "mini.manifest.json"),
        wavDir: dir,
        prune: false,
      });

      expect(result.manifest.utterances[0].wav_path).toBe("audio/mini/u-1-abc12345.wav");
    });
  });

  it("絶対パス（POSIX 風）の wav_path も public/ 相対パスに正規化する（design §4.3 MUST、2026-07-10 HGA C-1）", async () => {
    await withTempDir(async (dir) => {
      const script = makeMinimalScript({
        utterances: [{ id: "u-1", speaker: "narrator", text: "テスト" }],
      });
      const utterancesWithWav: UtteranceWithMeasuredWav[] = [
        {
          utterance_id: "u-1",
          speaker: "narrator",
          content_hash: "abc12345",
          wav_path: "/home/user/project/public/audio/mini/u-1-abc12345.wav",
          duration_seconds: 1.0,
        },
      ];

      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "mini",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "mini.manifest.json"),
        wavDir: dir,
        prune: false,
      });

      expect(result.manifest.utterances[0].wav_path).toBe("audio/mini/u-1-abc12345.wav");
    });
  });
});

describe("generateManifest (累積丸めの回帰テスト、design §5.2 の二重丸め禁止規約)", () => {
  it("1/60 秒×3 発話は「区間ごとの丸め→積算（誤った方式）」の 3 frame ではなく、累積秒丸めの 2 frame になる", async () => {
    // duration=1/60 秒（=0.5 frame @ 30fps）を 3 回積算する。
    // 誤った方式（各発話の duration を個別に round してから合計）:
    //   round(0.5)+round(0.5)+round(0.5) = 1+1+1 = 3 frame
    // 正しい方式（design §5.2: 累積秒に対して 1 回だけ丸める）:
    //   round((1/60+1/60+1/60) * 30) = round(1.5) = 2 frame
    // → 本テストは実装が誤った方式を採用していないことの回帰検証。
    await withTempDir(async (dir) => {
      const script = makeMinimalScript({
        utterances: [
          { id: "u-1", speaker: "narrator", text: "a" },
          { id: "u-2", speaker: "narrator", text: "b" },
          { id: "u-3", speaker: "narrator", text: "c" },
        ],
      });
      const utterancesWithWav: UtteranceWithMeasuredWav[] = ["u-1", "u-2", "u-3"].map((id) => ({
        utterance_id: id,
        speaker: "narrator",
        content_hash: `hash-${id}`,
        wav_path: `/fake/${id}.wav`,
        duration_seconds: 1 / 60,
      }));

      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "rounding-regression",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "m.manifest.json"),
        wavDir: dir,
        prune: false,
      });

      const [u1, u2, u3] = result.manifest.utterances;
      expect(u1).toMatchObject({ start_frame: 0, audio_end_frame: 1, end_frame: 1 });
      expect(u2).toMatchObject({ start_frame: 1, audio_end_frame: 1, end_frame: 1 });
      expect(u3).toMatchObject({ start_frame: 1, audio_end_frame: 2, end_frame: 2 });

      // 総尺 = 累積丸めの正しい終端 frame(2) + クレジット(90) = 92（誤方式なら 3+90=93 になるはず）
      expect(result.manifest.total_duration_frames).toBe(92);
    });
  });
});

describe("generateManifest (pause_before、design §5.2 の累積秒)", () => {
  it("pause_before は start_sec を決める前に cum_sec へ足される（点検 R3-2）", async () => {
    // fps=30。u-1: pause_before=1, duration=2, pause_after=0.5 / u-2: pause_before=0.5, duration=1
    //   u-1: cum 0 → +1 → start 1.0(30) → +2 → audio_end 3.0(90) → +0.5 → end 3.5(105)
    //   u-2: cum 3.5 → +0.5 → start 4.0(120) → +1 → audio_end 5.0(150) → end 5.0(150)
    // pause_before を start の後に足す誤りなら u-1.start_frame は 0、落とすと u-2.start_frame は 105 になる。
    await withTempDir(async (dir) => {
      const script = makeMinimalScript({
        utterances: [
          { id: "u-1", speaker: "narrator", text: "a", pause_before: 1, pause_after: 0.5 },
          { id: "u-2", speaker: "narrator", text: "b", pause_before: 0.5 },
        ],
      });
      const durations: Record<string, number> = { "u-1": 2, "u-2": 1 };
      const utterancesWithWav: UtteranceWithMeasuredWav[] = ["u-1", "u-2"].map((id) => ({
        utterance_id: id,
        speaker: "narrator",
        content_hash: `hash-${id}`,
        wav_path: `/fake/${id}.wav`,
        duration_seconds: durations[id],
      }));

      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "pause-before",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "m.manifest.json"),
        wavDir: dir,
        prune: false,
      });

      const [u1, u2] = result.manifest.utterances;
      expect(u1).toMatchObject({ start_frame: 30, audio_end_frame: 90, end_frame: 105 });
      expect(u2).toMatchObject({ start_frame: 120, audio_end_frame: 150, end_frame: 150 });
    });
  });
});

describe("generateManifest (total_duration_frames 一般則、design §5.4 v3)", () => {
  it("最終 slide_event + 表示保証尺 2 秒 が最終発話 end_frame を上回るケースを一般則で扱う", async () => {
    // u-1: duration=1s（end_frame=30）。slide は u-1 開始 + 5 秒後 → frame 150。
    // 150 + 60(2秒) = 210 > 30 なので「最終 slide + 2 秒」が支配項になる。
    // 総尺 = 210 + 90(クレジット) = 300。
    await withTempDir(async (dir) => {
      const script = makeMinimalScript({
        utterances: [{ id: "u-1", speaker: "narrator", text: "x" }],
        slides: [{ id: "s-1", type: "title", title: "タイトル" }],
        slide_events: [
          {
            id: "ev-1",
            slide: "s-1",
            anchor: { utterance: "u-1", position: "start", offset: 5 },
          },
        ],
      });
      const utterancesWithWav: UtteranceWithMeasuredWav[] = [
        {
          utterance_id: "u-1",
          speaker: "narrator",
          content_hash: "h1",
          wav_path: "/fake/u-1.wav",
          duration_seconds: 1.0,
        },
      ];

      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "slide-dominant",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "m.manifest.json"),
        wavDir: dir,
        prune: false,
      });

      expect(result.manifest.slide_events[0].start_frame).toBe(150);
      expect(result.manifest.utterances[0].end_frame).toBe(30);
      expect(result.manifest.total_duration_frames).toBe(300);
      // DISPLAY_GUARANTEE_SECONDS(2) / CREDIT_REGION_SECONDS(3) の定数値そのものの確認
      expect(DISPLAY_GUARANTEE_SECONDS).toBe(2);
      expect(CREDIT_REGION_SECONDS).toBe(3);
    });
  });

  it("slide_events が 0 件でも最終発話 end_frame + クレジットで総尺を算出する", async () => {
    await withTempDir(async (dir) => {
      const script = makeMinimalScript({
        utterances: [{ id: "u-1", speaker: "narrator", text: "x" }],
      });
      const utterancesWithWav: UtteranceWithMeasuredWav[] = [
        {
          utterance_id: "u-1",
          speaker: "narrator",
          content_hash: "h1",
          wav_path: "/fake/u-1.wav",
          duration_seconds: 2.0,
        },
      ];

      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "no-slides",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "m.manifest.json"),
        wavDir: dir,
        prune: false,
      });

      // end_frame = round(2*30) = 60、+ credit 90 = 150
      expect(result.manifest.utterances[0].end_frame).toBe(60);
      expect(result.manifest.total_duration_frames).toBe(150);
      expect(result.manifest.slide_events).toEqual([]);
    });
  });
});

describe("generateManifest (slides 焼き込み, design §4.3 v3.5)", () => {
  it("slides[] を変換・加工せずそのまま manifest に転記する（custom component の props 込み）", async () => {
    await withTempDir(async (dir) => {
      const script = makeMinimalScript({
        utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
        slides: [
          { id: "s-1", type: "custom", component: "JavaJsCompare", props: { stage: "intro" } },
          { id: "s-2", type: "bullets", title: "まとめ", items: ["**強調**あり"] },
        ],
      });
      const utterancesWithWav: UtteranceWithMeasuredWav[] = [
        {
          utterance_id: "u-1",
          speaker: "narrator",
          content_hash: "h1",
          wav_path: "/fake/u-1.wav",
          duration_seconds: 1.0,
        },
      ];

      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "slides-passthrough",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "m.manifest.json"),
        wavDir: dir,
        prune: false,
      });

      expect(result.manifest.slides).toEqual(script.slides);
    });
  });

  it("slides が空配列の台本では manifest.slides も空配列になる", async () => {
    await withTempDir(async (dir) => {
      const script = makeMinimalScript({
        utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
      });
      const utterancesWithWav: UtteranceWithMeasuredWav[] = [
        {
          utterance_id: "u-1",
          speaker: "narrator",
          content_hash: "h1",
          wav_path: "/fake/u-1.wav",
          duration_seconds: 1.0,
        },
      ];

      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "no-slides-passthrough",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "m.manifest.json"),
        wavDir: dir,
        prune: false,
      });

      expect(result.manifest.slides).toEqual([]);
    });
  });
});

describe("generateManifest (speakers 焼き込み, design §4.3 v3.6, T15 着手時ギャップ裁定)", () => {
  it("台本に登場した話者のみを speakers に焼き込む（未使用話者は含めない、credits と同じ選別規則）", async () => {
    await withTempDir(async (dir) => {
      // MOCK_SPEAKER_PROFILES は narrator/listener 両方を持つが、台本は narrator のみ使用する
      const script = makeMinimalScript({
        utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
      });
      const utterancesWithWav: UtteranceWithMeasuredWav[] = [
        {
          utterance_id: "u-1",
          speaker: "narrator",
          content_hash: "h1",
          wav_path: "/fake/u-1.wav",
          duration_seconds: 1.0,
        },
      ];

      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "speakers-single",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "m.manifest.json"),
        wavDir: dir,
        prune: false,
      });

      expect(result.manifest.speakers).toEqual({
        narrator: { portrait_asset_key: "narrator-default", display_name: "テスト話者A" },
      });
      expect(result.manifest.speakers.listener).toBeUndefined();
    });
  });

  it("台本に narrator/listener 両方登場する場合は両方を speakers に焼き込む", async () => {
    await withTempDir(async (dir) => {
      const script = await parseScript(JAVA_VS_JS_SCRIPT_PATH);
      const speakerProfiles = await loadSpeakerProfiles("default");
      const utterancesWithWav = buildUtterancesWithWav(script, DUMMY_DURATIONS);

      const result = await generateManifest(script, utterancesWithWav, speakerProfiles, {
        scriptId: "speakers-both",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "m.manifest.json"),
        wavDir: dir,
        prune: false,
      });

      expect(Object.keys(result.manifest.speakers).sort()).toEqual(["listener", "narrator"]);
      expect(result.manifest.speakers.narrator.portrait_asset_key).toBe("narrator-default");
      expect(result.manifest.speakers.listener.portrait_asset_key).toBe("listener-default");
    });
  });

  it("台本に登場する話者のプロファイルに portrait.asset_key が無いと fail-fast エラーになる（design §4.3 v3.6 MUST、credit 欠落と同型）", async () => {
    // `SpeakerProfile.portrait` は型上必須フィールドだが、本テストは実行時の fail-fast 検証が目的
    // （型欠落話者プロファイル JSON 等、型システムをすり抜けた実データを模す）のため、
    // credit 欠落テスト（`credit?` は型上 optional）とは異なり明示キャストで型チェックを外す。
    const profilesMissingAssetKey = {
      schema_version: 1,
      speakers: {
        narrator: {
          voicevox_speaker_id: 11,
          display_name: "テスト話者A",
          speech_rate_factor: 1.0,
          credit: "VOICEVOX:テスト話者A",
          // portrait 欠落
        },
      },
    } as unknown as SpeakersRegistry;
    const script = makeMinimalScript({
      utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
    });
    const utterancesWithWav: UtteranceWithMeasuredWav[] = [
      {
        utterance_id: "u-1",
        speaker: "narrator",
        content_hash: "h1",
        wav_path: "/fake/u-1.wav",
        duration_seconds: 1.0,
      },
    ];
    await expect(
      generateManifest(script, utterancesWithWav, profilesMissingAssetKey, {
        scriptId: "portrait-missing",
        voicevoxEngineVersion: "0.25.2-test",
        writeManifestFile: false,
        prune: false,
      }),
    ).rejects.toThrow(/✗ 話者 "narrator" のプロファイルに portrait\.asset_key がありません/);
  });
});

describe("generateManifest (未知話者役割名 fail-fast, design §4.4 v3.7, HGA W-1)", () => {
  it("台本の話者役割名が narrator/listener 以外だと compile 時に fail-fast エラーになる", async () => {
    const script = makeMinimalScript({
      utterances: [{ id: "u-1", speaker: "teacher", text: "a" }],
    });
    const utterancesWithWav: UtteranceWithMeasuredWav[] = [
      {
        utterance_id: "u-1",
        speaker: "teacher",
        content_hash: "h1",
        wav_path: "/fake/u-1.wav",
        duration_seconds: 1.0,
      },
    ];
    await expect(
      generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "unknown-role",
        voicevoxEngineVersion: "0.25.2-test",
        writeManifestFile: false,
        prune: false,
      }),
    ).rejects.toThrow(/✗ 話者役割名 "teacher" は v1 が受理する役割名（narrator \/ listener）の/);
  });
});

describe("generateManifest (異常系, design §4.4 / §5.3)", () => {
  it("発話が 0 件だとエラーになる", async () => {
    const script = makeMinimalScript();
    await expect(
      generateManifest(script, [], MOCK_SPEAKER_PROFILES, {
        scriptId: "empty",
        voicevoxEngineVersion: "0.25.2-test",
        writeManifestFile: false,
        prune: false,
      }),
    ).rejects.toThrow(/✗ 台本に発話がありません/);
  });

  it("utterancesWithWav に対応エントリのない発話があるとエラーになる（発話 ID を含む）", async () => {
    const script = makeMinimalScript({
      utterances: [
        { id: "u-1", speaker: "narrator", text: "a" },
        { id: "u-2", speaker: "narrator", text: "b" },
      ],
    });
    const utterancesWithWav: UtteranceWithMeasuredWav[] = [
      {
        utterance_id: "u-1",
        speaker: "narrator",
        content_hash: "h1",
        wav_path: "/fake/u-1.wav",
        duration_seconds: 1.0,
      },
    ];
    await expect(
      generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "missing-wav",
        voicevoxEngineVersion: "0.25.2-test",
        writeManifestFile: false,
        prune: false,
      }),
    ).rejects.toThrow(/✗ 発話 "u-2" に対応する音声合成\/WAV 実測結果が/);
  });

  it("slide_events が未登録スライド ID を参照するとエラーになる", async () => {
    const script = makeMinimalScript({
      utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
      slides: [{ id: "s-1", type: "title", title: "t" }],
      slide_events: [
        {
          id: "ev-1",
          slide: "s-nonexistent",
          anchor: { utterance: "u-1", position: "start", offset: 0 },
        },
      ],
    });
    const utterancesWithWav: UtteranceWithMeasuredWav[] = [
      {
        utterance_id: "u-1",
        speaker: "narrator",
        content_hash: "h1",
        wav_path: "/fake/u-1.wav",
        duration_seconds: 1.0,
      },
    ];
    await expect(
      generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "bad-slide-ref",
        voicevoxEngineVersion: "0.25.2-test",
        writeManifestFile: false,
        prune: false,
      }),
    ).rejects.toThrow(/✗ slide_events\[id="ev-1"\] が参照するスライド ID "s-nonexistent" は/);
  });

  it("同一 frame に 2 つの slide_events が競合するとエラーになる", async () => {
    const script = makeMinimalScript({
      utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
      slides: [
        { id: "s-1", type: "title", title: "t1" },
        { id: "s-2", type: "title", title: "t2" },
      ],
      slide_events: [
        { id: "ev-1", slide: "s-1", anchor: { utterance: "u-1", position: "start", offset: 0 } },
        { id: "ev-2", slide: "s-2", anchor: { utterance: "u-1", position: "start", offset: 0 } },
      ],
    });
    const utterancesWithWav: UtteranceWithMeasuredWav[] = [
      {
        utterance_id: "u-1",
        speaker: "narrator",
        content_hash: "h1",
        wav_path: "/fake/u-1.wav",
        duration_seconds: 1.0,
      },
    ];
    await expect(
      generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "overlap",
        voicevoxEngineVersion: "0.25.2-test",
        writeManifestFile: false,
        prune: false,
      }),
    ).rejects.toThrow(/✗ slide_events の frame が狭義単調増加ではありません.*id="ev-2"/s);
  });

  it("slide_events の frame が配列順に対して降順（順序逆転）だとエラーになる", async () => {
    const script = makeMinimalScript({
      utterances: [
        { id: "u-1", speaker: "narrator", text: "a" }, // duration 5s → frame 150 開始
        { id: "u-2", speaker: "narrator", text: "b" }, // duration 1s
      ],
      slides: [
        { id: "s-1", type: "title", title: "t1" },
        { id: "s-2", type: "title", title: "t2" },
      ],
      slide_events: [
        // 配列順は ev-1(u-2 開始 = frame150) → ev-2(u-1 開始 = frame0) で frame が逆転する
        { id: "ev-1", slide: "s-1", anchor: { utterance: "u-2", position: "start", offset: 0 } },
        { id: "ev-2", slide: "s-2", anchor: { utterance: "u-1", position: "start", offset: 0 } },
      ],
    });
    const utterancesWithWav: UtteranceWithMeasuredWav[] = [
      {
        utterance_id: "u-1",
        speaker: "narrator",
        content_hash: "h1",
        wav_path: "/fake/u-1.wav",
        duration_seconds: 5.0,
      },
      {
        utterance_id: "u-2",
        speaker: "narrator",
        content_hash: "h2",
        wav_path: "/fake/u-2.wav",
        duration_seconds: 1.0,
      },
    ];
    await expect(
      generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "reversed",
        voicevoxEngineVersion: "0.25.2-test",
        writeManifestFile: false,
        prune: false,
      }),
    ).rejects.toThrow(/✗ slide_events の frame が狭義単調増加ではありません.*id="ev-2"/s);
  });
});

describe("generateManifest (credits fail-fast, design §7.5 / §4.3 改訂、2026-07-10 HGA W-6)", () => {
  it("台本に登場する話者のプロファイルに credit フィールドが無いと fail-fast エラーになる", async () => {
    const profilesMissingCredit: SpeakersRegistry = {
      schema_version: 1,
      speakers: {
        narrator: {
          voicevox_speaker_id: 11,
          display_name: "テスト話者A",
          portrait: { asset_key: "narrator-default" },
          speech_rate_factor: 1.0,
          // credit 欠落
        },
      },
    };
    const script = makeMinimalScript({
      utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
    });
    const utterancesWithWav: UtteranceWithMeasuredWav[] = [
      {
        utterance_id: "u-1",
        speaker: "narrator",
        content_hash: "h1",
        wav_path: "/fake/u-1.wav",
        duration_seconds: 1.0,
      },
    ];
    await expect(
      generateManifest(script, utterancesWithWav, profilesMissingCredit, {
        scriptId: "credit-missing",
        voicevoxEngineVersion: "0.25.2-test",
        writeManifestFile: false,
        prune: false,
      }),
    ).rejects.toThrow(/✗ 話者 "narrator" のプロファイルに credit フィールドがありません/);
  });

  it("台本に登場する話者のプロファイル自体が存在しないと fail-fast エラーになる", async () => {
    const emptyProfiles: SpeakersRegistry = { schema_version: 1, speakers: {} };
    const script = makeMinimalScript({
      utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
    });
    const utterancesWithWav: UtteranceWithMeasuredWav[] = [
      {
        utterance_id: "u-1",
        speaker: "narrator",
        content_hash: "h1",
        wav_path: "/fake/u-1.wav",
        duration_seconds: 1.0,
      },
    ];
    await expect(
      generateManifest(script, utterancesWithWav, emptyProfiles, {
        scriptId: "profile-missing",
        voicevoxEngineVersion: "0.25.2-test",
        writeManifestFile: false,
        prune: false,
      }),
    ).rejects.toThrow(/✗ 話者 "narrator" のプロファイルが speaker-profiles\.yaml に存在しません/);
  });
});

describe("generateManifest (frame 0 情報表示, design §5.4 SHOULD、2026-07-10 HGA I-3)", () => {
  it("最初の slide_event が frame 0 なら warnings は空", async () => {
    await withTempDir(async (dir) => {
      const script = makeMinimalScript({
        utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
        slides: [{ id: "s-1", type: "title", title: "t" }],
        slide_events: [
          { id: "ev-1", slide: "s-1", anchor: { utterance: "u-1", position: "start", offset: 0 } },
        ],
      });
      const utterancesWithWav: UtteranceWithMeasuredWav[] = [
        {
          utterance_id: "u-1",
          speaker: "narrator",
          content_hash: "h1",
          wav_path: "/fake/u-1.wav",
          duration_seconds: 1.0,
        },
      ];
      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "frame0-ok",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "m.manifest.json"),
        wavDir: dir,
        prune: false,
      });
      expect(result.manifest.slide_events[0].start_frame).toBe(0);
      expect(result.warnings).toEqual([]);
    });
  });

  it("最初の slide_event が frame 0 でないと情報 warning が追加される（エラーにはならない）", async () => {
    await withTempDir(async (dir) => {
      const script = makeMinimalScript({
        utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
        slides: [{ id: "s-1", type: "title", title: "t" }],
        slide_events: [
          {
            id: "ev-1",
            slide: "s-1",
            anchor: { utterance: "u-1", position: "start", offset: 1 },
          },
        ],
      });
      const utterancesWithWav: UtteranceWithMeasuredWav[] = [
        {
          utterance_id: "u-1",
          speaker: "narrator",
          content_hash: "h1",
          wav_path: "/fake/u-1.wav",
          duration_seconds: 1.0,
        },
      ];
      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "frame0-warn",
        voicevoxEngineVersion: "0.25.2-test",
        outputPath: path.join(dir, "m.manifest.json"),
        wavDir: dir,
        prune: false,
      });
      // offset=1s @ 30fps → frame 30
      expect(result.manifest.slide_events[0].start_frame).toBe(30);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatch(/frame 0 から最初のスライドまで背景のみの区間が 30 frame/);
    });
  });

  describe("動画尺 vs target_duration_range の第 2 警告 (design §9.2 二段化, HGA 第 2 回 W-9)", () => {
    // 発話 1 件 duration 10s（pause なし・slide_event なし）
    // → 最終動画尺 = 10s + クレジット 3s = 13.0s
    const rangeWav: UtteranceWithMeasuredWav[] = [
      {
        utterance_id: "u-1",
        speaker: "narrator",
        content_hash: "h1",
        wav_path: "/fake/u-1.wav",
        duration_seconds: 10.0,
      },
    ];
    const makeRangeScript = (max: number) =>
      makeMinimalScript({
        utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
        slides: [],
        slide_events: [],
        target_duration_range: { min: 1, max },
      });

    it("動画尺（クレジット込み）が max を超えると第 2 警告を積む", async () => {
      await withTempDir(async (dir) => {
        const result = await generateManifest(makeRangeScript(12), rangeWav, MOCK_SPEAKER_PROFILES, {
          scriptId: "range-warn",
          voicevoxEngineVersion: "0.25.2-test",
          outputPath: path.join(dir, "m.manifest.json"),
          wavDir: dir,
          prune: false,
        });
        // 13.0s > max 12s → 警告
        expect(result.warnings.some((w) => w.includes("最終動画尺 13.0 秒"))).toBe(true);
      });
    });

    it("max 以内なら警告なし（min 側は突合しない — L1 裁定: クレジット底上げによる偽警告回避）", async () => {
      await withTempDir(async (dir) => {
        // min 1 は動画尺 13.0s に対して意味を持たない（min 側突合なしの確認を兼ねる）
        const result = await generateManifest(makeRangeScript(90), rangeWav, MOCK_SPEAKER_PROFILES, {
          scriptId: "range-ok",
          voicevoxEngineVersion: "0.25.2-test",
          outputPath: path.join(dir, "m.manifest.json"),
          wavDir: dir,
          prune: false,
        });
        expect(result.warnings.some((w) => w.includes("最終動画尺"))).toBe(false);
      });
    });
  });
});

describe("generateManifest (prune, design §4.2 / §4.4)", () => {
  it("manifest 非掲載の WAV を削除し、掲載中の WAV は残す", async () => {
    await withTempDir(async (dir) => {
      await writeFile(path.join(dir, "u-1-hash.wav"), Buffer.from("keep"));
      await writeFile(path.join(dir, "u-orphan-deadbeef.wav"), Buffer.from("orphan"));
      await writeFile(path.join(dir, "not-a-wav.txt"), Buffer.from("ignore-me"));

      const script = makeMinimalScript({
        utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
      });
      const utterancesWithWav: UtteranceWithMeasuredWav[] = [
        {
          utterance_id: "u-1",
          speaker: "narrator",
          content_hash: "hash",
          wav_path: path.join(dir, "u-1-hash.wav"),
          duration_seconds: 1.0,
        },
      ];

      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "prune-test",
        voicevoxEngineVersion: "0.25.2-test",
        writeManifestFile: false,
        wavDir: dir,
        prune: true,
      });

      expect(result.pruned).toEqual(["u-orphan-deadbeef.wav"]);
      expect(result.pruneWarnings).toEqual([]);

      const remaining = await readdir(dir);
      expect(remaining.sort()).toEqual(["not-a-wav.txt", "u-1-hash.wav"]);
    });
  });

  it("wav_path の区切りが `\\` でも `/` でも、ファイル名で照合して掲載中の WAV を残す（点検 R40）", async () => {
    await withTempDir(async (dir) => {
      await writeFile(path.join(dir, "u-1-hash1.wav"), Buffer.from("keep-1"));
      await writeFile(path.join(dir, "u-2-hash2.wav"), Buffer.from("keep-2"));
      await writeFile(path.join(dir, "u-orphan-deadbeef.wav"), Buffer.from("orphan"));

      const script = makeMinimalScript({
        utterances: [
          { id: "u-1", speaker: "narrator", text: "a" },
          { id: "u-2", speaker: "narrator", text: "b" },
        ],
      });
      // どちらも実行中の OS に依らない形。POSIX の path.basename は `\` を区切りと見ないので、
      // 直す前は u-1 の照合名がパスまるごとになり、掲載中の u-1-hash1.wav が消えた。
      const utterancesWithWav: UtteranceWithMeasuredWav[] = [
        {
          utterance_id: "u-1",
          speaker: "narrator",
          content_hash: "hash1",
          wav_path: "C:\\work\\public\\audio\\prune-sep\\u-1-hash1.wav",
          duration_seconds: 1.0,
        },
        {
          utterance_id: "u-2",
          speaker: "narrator",
          content_hash: "hash2",
          wav_path: "/work/public/audio/prune-sep/u-2-hash2.wav",
          duration_seconds: 1.0,
        },
      ];

      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "prune-sep",
        voicevoxEngineVersion: "0.25.2-test",
        writeManifestFile: false,
        wavDir: dir,
        prune: true,
      });

      expect(result.pruned).toEqual(["u-orphan-deadbeef.wav"]);
      expect(result.manifest.utterances.map((u) => u.wav_path)).toEqual([
        "audio/prune-sep/u-1-hash1.wav",
        "audio/prune-sep/u-2-hash2.wav",
      ]);
      const remaining = await readdir(dir);
      expect(remaining.sort()).toEqual(["u-1-hash1.wav", "u-2-hash2.wav"]);
    });
  });

  it("fs.unlink 失敗（EBUSY 等）は警告ログに積んで継続する（エラー停止しない）", async () => {
    await withTempDir(async (dir) => {
      await writeFile(path.join(dir, "u-orphan-1.wav"), Buffer.from("a"));
      await writeFile(path.join(dir, "u-orphan-2.wav"), Buffer.from("b"));

      const script = makeMinimalScript({
        utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
      });
      const utterancesWithWav: UtteranceWithMeasuredWav[] = [
        {
          utterance_id: "u-1",
          speaker: "narrator",
          content_hash: "hash",
          wav_path: path.join(dir, "u-1-hash.wav"), // 実ファイルは無いが prune 対象外（referenced 扱い）
          duration_seconds: 1.0,
        },
      ];

      const failingPaths: string[] = [];
      const unlinkImpl = async (target: string): Promise<void> => {
        if (target.endsWith("u-orphan-1.wav")) {
          failingPaths.push(target);
          const err = new Error("EBUSY: resource busy or locked");
          (err as NodeJS.ErrnoException).code = "EBUSY";
          throw err;
        }
        await rm(target);
      };

      const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
        scriptId: "prune-ebusy",
        voicevoxEngineVersion: "0.25.2-test",
        writeManifestFile: false,
        wavDir: dir,
        prune: true,
        unlinkImpl,
      });

      // orphan-1 は失敗（継続）、orphan-2 は正常に削除される
      expect(failingPaths).toHaveLength(1);
      expect(result.pruned).toEqual(["u-orphan-2.wav"]);
      expect(result.pruneWarnings).toHaveLength(1);
      expect(result.pruneWarnings[0]).toMatch(/⚠ WAV ファイルの削除に失敗しました.*u-orphan-1\.wav/);

      const remaining = await readdir(dir);
      expect(remaining).toEqual(["u-orphan-1.wav"]);
    });
  });

  it("wavDir が存在しない場合は prune 対象なしとして正常終了する", async () => {
    const script = makeMinimalScript({
      utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
    });
    const utterancesWithWav: UtteranceWithMeasuredWav[] = [
      {
        utterance_id: "u-1",
        speaker: "narrator",
        content_hash: "hash",
        wav_path: "/fake/u-1-hash.wav",
        duration_seconds: 1.0,
      },
    ];

    const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
      scriptId: "no-wavdir",
      voicevoxEngineVersion: "0.25.2-test",
      writeManifestFile: false,
      wavDir: "/no/such/directory/at/all",
      prune: true,
    });

    expect(result.pruned).toEqual([]);
    expect(result.pruneWarnings).toEqual([]);
  });
});

describe("generateManifest (extra_credits、Laterna 追加 2026-09-26)", () => {
  it("台本の extra_credits を credits の末尾に足す（初出順・重複なし）", async () => {
    const script = makeMinimalScript({
      utterances: [{ id: "u-1", speaker: "narrator", text: "a" }],
      extra_credits: ["立ち絵：Laterna オリジナル", "VOICEVOX:テスト話者A"],
    });
    const utterancesWithWav: UtteranceWithMeasuredWav[] = [
      {
        utterance_id: "u-1",
        speaker: "narrator",
        content_hash: "h1",
        wav_path: "/fake/u-1.wav",
        duration_seconds: 1.0,
      },
    ];
    const result = await generateManifest(script, utterancesWithWav, MOCK_SPEAKER_PROFILES, {
      scriptId: "extra-credits",
      voicevoxEngineVersion: "0.25.2-test",
      writeManifestFile: false,
      prune: false,
    });
    expect(result.manifest.credits).toEqual(["VOICEVOX:テスト話者A", "立ち絵：Laterna オリジナル"]);
  });
});
