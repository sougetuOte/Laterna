/**
 * script-engine — 台本 YAML パーサ（ファイル読込 + スキーマ検証のエントリポイント）
 *
 * 出自: docs/specs/script-engine/design.md §4.1（パイプライン第 1 段階: parse）
 * 対応タスク: docs/specs/script-engine/tasks.md W2-script-engine-T8
 *
 * ファイル読込・YAML デシリアライズのみを担当する薄いラッパー。実際のスキーマ検証
 * （必須フィールド・pause 負値・外部キー整合・話者役割数・コンポーネント名レジストリ照合等）は
 * `src/script-engine/schema/script.ts` の `parseScriptDocument(raw)` に委譲する
 * （raw オブジェクトを受け取る純粋な検証関数として分離し、ファイル I/O なしで単体テスト
 * 可能にするため）。
 */

import { readFile } from "node:fs/promises";
import { load } from "js-yaml";
import { parseScriptDocument } from "../schema/script";
import type { ScriptDocument } from "../schema/script";

/**
 * 台本 YAML ファイルを読込・パース・スキーマ検証し、構造化データを返す。
 *
 * design §4.1 パイプライン第 1 段階（`[台本 .script.yaml] --parse--> [AST: Utterance[] +
 * SlideEvent[] + Slide[]]`）に対応する。
 *
 * **戻り値の型についての裁定（L1、W2-script-engine-T8 実装時）**: tasks.md の完了条件は
 * シグネチャを `(filePath: string) => Promise<ScriptConfig>` と表記するが、
 * `schema/script.ts` の型定義上 `ScriptConfig` は `speaker_profile_ref` 等の
 * メタデータのみを持つ型であり、`utterances` / `slides` / `slide_events` を含む
 * トップレベル型は `ScriptConfig` を extends する `ScriptDocument` である。
 * コンパイラの後続段階（尺予測・音声合成・timeline manifest 生成）が実際に必要とするのは
 * utterances 等を含む全体構造のため、戻り値は `ScriptDocument` とする。
 *
 * @param filePath - 台本 YAML ファイルへのパス（`content/scripts/<script-id>.script.yaml`、
 *   design §11.1）
 * @throws ファイル読込失敗・YAML 構文エラー・スキーマ検証エラー（design §4.4、全て fail-fast。
 *   無音の続行やプレースホルダでの代替は行わない）
 */
export async function parseScript(filePath: string): Promise<ScriptDocument> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (error) {
    throw new Error(
      `✗ 台本ファイルの読込に失敗しました: ${filePath}（${(error as Error).message}）`,
    );
  }

  let parsedYaml: unknown;
  try {
    parsedYaml = load(raw);
  } catch (error) {
    throw new Error(
      `✗ 台本ファイルの YAML 構文エラー: ${filePath}（${(error as Error).message}）`,
    );
  }

  return parseScriptDocument(parsedYaml);
}
