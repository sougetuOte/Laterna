/**
 * script-engine — WAV 実測長の取得（measure モジュール）
 *
 * 出自: docs/specs/script-engine/design.md §6.2（WAV 実測長取得方式、三段階評価）/
 *   §4.4（エラー設計、「WAV ヘッダ解析失敗時 → エラー停止（対象ファイル名を明示）」）
 * 対応タスク: docs/specs/script-engine/tasks.md W2-script-engine-T11
 *
 * T1 Spike（docs/artifacts/spike-wav-parser-2026-07-09.md）の dry run で、VOICEVOX 生成 WAV
 * 8 本全数が ffprobe 突合誤差 0.0000% だったことを受け、design §6.2 の決定通り
 * **自前パーサ（依存ゼロ、Node 標準 `fs` のみ）を採用**する（`music-metadata` は導入しない）。
 *
 * チャンク走査ロジックは T1 Spike 成果物 `scripts/test-wav-parser.mjs` を踏襲する
 * （`fmt ` チャンク直後に `data` が来ない可変長チャンク（`LIST` 等）が割り込んでいても、
 * チャンクを順に walk することで正しく `data` を発見できる設計。T1 Spike の実サンプルでは
 * 割込みチャンクは検出されなかったが、パーサ自体は割込みチャンクに対応済み）。
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

/** WAV `fmt ` チャンクの主要フィールド（PCM 前提、design §6.2 の走査対象） */
interface WavFmtChunk {
  audioFormat: number;
  numChannels: number;
  sampleRate: number;
  byteRate: number;
  blockAlign: number;
  bitsPerSample: number;
}

/** `measureWavDuration` の戻り値（tasks.md T11 完了条件のシグネチャそのまま） */
export interface MeasureWavResult {
  /** 秒。`data` チャンクサイズ ÷ `fmt.byteRate`（design §6.2 の算出式） */
  duration_seconds: number;
}

/**
 * WAV ヘッダ解析エラーを組み立てる（design §4.4 MUST: 対象ファイル名を明示）。
 * `wavFilePath` はフルパスだが、エラーメッセージには `path.basename` した短い形式を使う
 * （既存 `parse.ts`/`synthesize.ts` のエラーメッセージ慣例に合わせつつ、ヘッダ解析エラーは
 * バイナリ内容起因でありフルパスよりファイル名の方がデバッグ時に読みやすいための判断。
 * **自己申告（spec に無い判断）**: design §4.4 は「対象ファイル名を明示」とのみ規定し
 * フルパス/ベース名の別は指定していない）。
 */
function wavParseError(wavFilePath: string, reason: string): Error {
  const fileLabel = path.basename(wavFilePath);
  return new Error(`✗ WAV ヘッダ解析に失敗しました: ${fileLabel}（${reason}）`);
}

/**
 * WAV バイナリをチャンク単位で走査し、`fmt ` / `data` チャンクを発見する（design §6.2）。
 *
 * @throws RIFF/WAVE ヘッダ不正、`fmt `/`data` チャンク欠落、ファイル切詰め等（design §4.4）。
 *   全エラーメッセージに `wavFilePath` のファイル名を含める。
 */
function parseWavBuffer(
  buf: Buffer,
  wavFilePath: string,
): { fmt: WavFmtChunk; dataSize: number } {
  if (buf.length < 12) {
    throw wavParseError(
      wavFilePath,
      `ファイルが短すぎて RIFF ヘッダを読めません（ファイルサイズ: ${buf.length} bytes）`,
    );
  }

  const riff = buf.toString("ascii", 0, 4);
  const wave = buf.toString("ascii", 8, 12);
  if (riff !== "RIFF" || wave !== "WAVE") {
    throw wavParseError(wavFilePath, `RIFF/WAVE ヘッダ不正: riff="${riff}" wave="${wave}"`);
  }

  let fmt: WavFmtChunk | null = null;
  let dataSize: number | null = null;

  let offset = 12; // RIFF(4) + size(4) + WAVE(4) の後
  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString("ascii", offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    const chunkDataStart = offset + 8;

    if (chunkId === "fmt " && chunkDataStart + 16 <= buf.length) {
      fmt = {
        audioFormat: buf.readUInt16LE(chunkDataStart),
        numChannels: buf.readUInt16LE(chunkDataStart + 2),
        sampleRate: buf.readUInt32LE(chunkDataStart + 4),
        byteRate: buf.readUInt32LE(chunkDataStart + 8),
        blockAlign: buf.readUInt16LE(chunkDataStart + 12),
        bitsPerSample: buf.readUInt16LE(chunkDataStart + 14),
      };
    } else if (chunkId === "data") {
      // ファイルが data チャンクの宣言サイズより短い場合は切詰めとみなし、黙って短い尺を
      // 返さずエラー停止する（design §4.4「WAV ヘッダ解析失敗時 → エラー停止」の適用範囲。
      // **自己申告（spec に無い判断）**: design 本文は「切詰めファイル」の具体挙動を明記しない。
      // 誤った（過大な）duration_seconds を無音で返すことを避けるため、fail-fast とした）。
      if (chunkDataStart + chunkSize > buf.length) {
        throw wavParseError(
          wavFilePath,
          `data チャンクの宣言サイズ ${chunkSize} bytes に対し、ファイル終端までの実データが ` +
            `${buf.length - chunkDataStart} bytes しかありません（ファイルが切り詰められている可能性があります）`,
        );
      }
      dataSize = chunkSize;
    }

    // チャンクは偶数バイト境界にパディングされる（RIFF 仕様。T1 Spike パーサを踏襲）
    const advance = chunkSize + (chunkSize % 2);
    offset = chunkDataStart + advance;
  }

  if (!fmt) {
    throw wavParseError(wavFilePath, "fmt チャンクが見つかりません");
  }
  if (dataSize === null) {
    throw wavParseError(wavFilePath, "data チャンクが見つかりません");
  }
  if (fmt.byteRate <= 0) {
    throw wavParseError(wavFilePath, `fmt チャンクの byteRate が不正です: ${fmt.byteRate}`);
  }

  return { fmt, dataSize };
}

/**
 * WAV ファイルの実測長を取得する（design §6.2、tasks.md W2-script-engine-T11）。
 *
 * @param wavFilePath - 対象 WAV ファイルへのパス（T10 `synthesize.ts` が生成した
 *   `public/audio/<script-id>/<utterance-id>-<hash>.wav` を想定）
 * @throws ファイル読込失敗（存在しない等）、WAV ヘッダ解析失敗（design §4.4、いずれも
 *   fail-fast。エラーメッセージに対象ファイル名を含める）
 */
export async function measureWavDuration(wavFilePath: string): Promise<MeasureWavResult> {
  let buf: Buffer;
  try {
    buf = await readFile(wavFilePath);
  } catch (error) {
    throw new Error(
      `✗ WAV ファイルの読込に失敗しました: ${wavFilePath}（${(error as Error).message}）`,
    );
  }

  const { fmt, dataSize } = parseWavBuffer(buf, wavFilePath);
  const durationSeconds = dataSize / fmt.byteRate;

  return { duration_seconds: durationSeconds };
}
