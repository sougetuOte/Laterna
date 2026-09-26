/**
 * script-engine — measure.ts のテスト
 *
 * 出自: docs/specs/script-engine/tasks.md W2-script-engine-T11 完了条件
 *   「テスト: mock WAV（バイナリスニペット）で duration_seconds が期待値に一致」
 *   + 「実装完了後、T1 の sample WAV（kosen-w12 既存資産）で検証、ffprobe 既知値と ±1% 以内で一致」
 *
 * mock WAV はテストコード内で最小構成の RIFF/WAVE バイナリを組み立てて使う
 * （`buildWavBuffer`。fmt(16B, PCM) + data の 2 チャンク構成、必要に応じて fmt/data の間に
 * 任意チャンクを割り込ませられる、design §6.2 の可変長チャンク走査を検証するため）。
 *
 * 実 WAV 検証: `public/audio/java-vs-js/*.wav`（13 本、読み取りのみ）を対象に、ffprobe 実測値
 * （2026-09-26 に `ffprobe -show_entries format=duration` で取得。docs/inventory.md §2.4）との
 * 誤差率を ±1% 以内で検証する。Laterna への切り出し時に、Kyozai-Athanor の `seg-*.wav`
 * （凍結 W12 資産、持ってこない）から差し替えた（docs/inventory.md §2.1 の 3）。
 */

import { describe, expect, it } from "vitest";
import path from "node:path";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { measureWavDuration } from "./measure";

/**
 * 最小構成の RIFF/WAVE バイナリを組み立てる（テストコード内バイナリスニペット）。
 * fmt（16B, PCM）チャンクの後、任意で `extraChunkBeforeData` を挟み、data チャンクを続ける。
 */
function buildWavBuffer(options: {
  sampleRate?: number;
  numChannels?: number;
  bitsPerSample?: number;
  dataSize?: number;
  extraChunkBeforeData?: { id: string; data: Buffer };
  omitDataChunk?: boolean;
}): Buffer {
  const sampleRate = options.sampleRate ?? 8000;
  const numChannels = options.numChannels ?? 1;
  const bitsPerSample = options.bitsPerSample ?? 16;
  const dataSize = options.dataSize ?? 8000;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  const fmtChunk = Buffer.alloc(8 + 16);
  fmtChunk.write("fmt ", 0, "ascii");
  fmtChunk.writeUInt32LE(16, 4);
  fmtChunk.writeUInt16LE(1, 8); // audioFormat = 1 (PCM)
  fmtChunk.writeUInt16LE(numChannels, 10);
  fmtChunk.writeUInt32LE(sampleRate, 12);
  fmtChunk.writeUInt32LE(byteRate, 16);
  fmtChunk.writeUInt16LE(blockAlign, 20);
  fmtChunk.writeUInt16LE(bitsPerSample, 22);

  let extra = Buffer.alloc(0);
  if (options.extraChunkBeforeData) {
    const { id, data } = options.extraChunkBeforeData;
    const sizeBuf = Buffer.alloc(4);
    sizeBuf.writeUInt32LE(data.length, 0);
    const padding = data.length % 2 === 1 ? Buffer.alloc(1) : Buffer.alloc(0);
    extra = Buffer.concat([Buffer.from(id, "ascii"), sizeBuf, data, padding]);
  }

  let dataSection = Buffer.alloc(0);
  if (!options.omitDataChunk) {
    const dataHeader = Buffer.alloc(8);
    dataHeader.write("data", 0, "ascii");
    dataHeader.writeUInt32LE(dataSize, 4);
    dataSection = Buffer.concat([dataHeader, Buffer.alloc(dataSize)]);
  }

  const riffContentSize = 4 + fmtChunk.length + extra.length + dataSection.length; // 4 = "WAVE"

  const header = Buffer.alloc(12);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(riffContentSize, 4);
  header.write("WAVE", 8, "ascii");

  return Buffer.concat([header, fmtChunk, extra, dataSection]);
}

async function withTempWavFile(
  buf: Buffer,
  run: (filePath: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), "script-engine-measure-test-"));
  const filePath = path.join(dir, "test.wav");
  try {
    await writeFile(filePath, buf);
    await run(filePath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("measureWavDuration (mock WAV, 正常系)", () => {
  it("sampleRate=8000/mono/16bit, data=8000 bytes → duration=0.5s", async () => {
    // byteRate = 8000 * 1 * 2 = 16000 bytes/sec → duration = 8000 / 16000 = 0.5s
    const buf = buildWavBuffer({ sampleRate: 8000, numChannels: 1, bitsPerSample: 16, dataSize: 8000 });
    await withTempWavFile(buf, async (filePath) => {
      const result = await measureWavDuration(filePath);
      expect(result.duration_seconds).toBeCloseTo(0.5, 9);
    });
  });

  it("sampleRate=44100/stereo/16bit, data=176400 bytes → duration=1.0s", async () => {
    // byteRate = 44100 * 2 * 2 = 176400 bytes/sec → duration = 176400 / 176400 = 1.0s
    const buf = buildWavBuffer({
      sampleRate: 44100,
      numChannels: 2,
      bitsPerSample: 16,
      dataSize: 176400,
    });
    await withTempWavFile(buf, async (filePath) => {
      const result = await measureWavDuration(filePath);
      expect(result.duration_seconds).toBeCloseTo(1.0, 9);
    });
  });

  it("fmt 直後に data が来ない場合（LIST 等の割込みチャンク）でも正しく data を発見する", async () => {
    // design §6.2 / T1 Spike: パーサはチャンク走査方式のため割込みチャンクに対応済みという
    // 主張を、実サンプルには存在しなかった構造をここで能動的に再現して検証する。
    const buf = buildWavBuffer({
      sampleRate: 8000,
      numChannels: 1,
      bitsPerSample: 16,
      dataSize: 4000,
      extraChunkBeforeData: { id: "LIST", data: Buffer.from("INFOIART" + "x".repeat(5), "ascii") },
    });
    await withTempWavFile(buf, async (filePath) => {
      const result = await measureWavDuration(filePath);
      expect(result.duration_seconds).toBeCloseTo(4000 / 16000, 9);
    });
  });

  it("奇数長の割込みチャンク（パディング必要）でも正しく data を発見する", async () => {
    const buf = buildWavBuffer({
      sampleRate: 8000,
      numChannels: 1,
      bitsPerSample: 16,
      dataSize: 2000,
      extraChunkBeforeData: { id: "JUNK", data: Buffer.from("odd", "ascii") }, // 3 bytes = 奇数長
    });
    await withTempWavFile(buf, async (filePath) => {
      const result = await measureWavDuration(filePath);
      expect(result.duration_seconds).toBeCloseTo(2000 / 16000, 9);
    });
  });
});

describe("measureWavDuration (異常系, design §4.4)", () => {
  it("存在しないファイルパスを渡すとエラーになる（ファイルパスを含む）", async () => {
    await expect(measureWavDuration("/no/such/file.wav")).rejects.toThrow(
      /✗ WAV ファイルの読込に失敗しました.*file\.wav/,
    );
  });

  it("非 RIFF ファイル（RIFF/WAVE ヘッダ不正）はファイル名を含むエラーになる", async () => {
    const buf = Buffer.from("これは WAV ファイルではありません", "utf-8");
    await withTempWavFile(buf, async (filePath) => {
      await expect(measureWavDuration(filePath)).rejects.toThrow(
        /✗ WAV ヘッダ解析に失敗しました: test\.wav（RIFF\/WAVE ヘッダ不正/,
      );
    });
  });

  it("短すぎるファイル（RIFF ヘッダ未満）はファイル名を含むエラーになる", async () => {
    const buf = Buffer.from([0x52, 0x49, 0x46]); // "RIF" のみ、12 bytes 未満
    await withTempWavFile(buf, async (filePath) => {
      await expect(measureWavDuration(filePath)).rejects.toThrow(
        /✗ WAV ヘッダ解析に失敗しました: test\.wav（ファイルが短すぎて/,
      );
    });
  });

  it("data チャンク欠落はファイル名を含むエラーになる", async () => {
    const buf = buildWavBuffer({ omitDataChunk: true });
    await withTempWavFile(buf, async (filePath) => {
      await expect(measureWavDuration(filePath)).rejects.toThrow(
        /✗ WAV ヘッダ解析に失敗しました: test\.wav（data チャンクが見つかりません/,
      );
    });
  });

  it("切詰めファイル（data チャンクの宣言サイズより実データが短い）はファイル名を含むエラーになる", async () => {
    const fullBuf = buildWavBuffer({ sampleRate: 8000, numChannels: 1, bitsPerSample: 16, dataSize: 8000 });
    const truncatedBuf = fullBuf.subarray(0, fullBuf.length - 100); // data の途中で切る
    await withTempWavFile(truncatedBuf, async (filePath) => {
      await expect(measureWavDuration(filePath)).rejects.toThrow(
        /✗ WAV ヘッダ解析に失敗しました: test\.wav（data チャンクの宣言サイズ.*切り詰められている/,
      );
    });
  });
});

describe("measureWavDuration (実 WAV 検証: public/audio/java-vs-js/*.wav)", () => {
  // ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1
  // で取得した実測値（2026-09-26、ffprobe 7.1。docs/inventory.md §2.4）。
  const FFPROBE_KNOWN_DURATIONS: Record<string, number> = {
    "u-001-254d2d2c.wav": 4.586667,
    "u-002-1eced8e7.wav": 5.76,
    "u-003-e8925791.wav": 6.570667,
    "u-004-66901194.wav": 5.504,
    "u-005-00eb7053.wav": 4.149333,
    "u-006-9d40645e.wav": 12.085333,
    "u-007-93422445.wav": 3.690667,
    "u-008-5d816f27.wav": 8.789333,
    "u-009-c742066f.wav": 9.802667,
    "u-010-ce0efee3.wav": 4.661333,
    "u-011-45d4ddd3.wav": 12.672,
    "u-012-e9b8361b.wav": 3.136,
    "u-013-db636830.wav": 14.709333,
  };

  for (const [fileName, ffprobeSeconds] of Object.entries(FFPROBE_KNOWN_DURATIONS)) {
    it(`${fileName}: ffprobe 実測値と ±1% 以内で一致する`, async () => {
      const filePath = path.resolve(__dirname, "../../../public/audio/java-vs-js", fileName);
      const result = await measureWavDuration(filePath);
      const errorRate = Math.abs(result.duration_seconds - ffprobeSeconds) / ffprobeSeconds;
      expect(errorRate).toBeLessThanOrEqual(0.01);
    });
  }
});
