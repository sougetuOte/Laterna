/**
 * script-engine — svg-ref / custom スライドのコンポーネント名 正規リスト
 *
 * 出自: docs/specs/script-engine/design.md §2.6（エスケープハッチ設計）
 * 対応タスク: docs/specs/script-engine/tasks.md W2-script-engine-T8
 *
 * compiler（parse 段階の fail-fast 検証、src/script-engine/schema/script.ts）と
 * render（src/script-engine/render/component-registry.ts の「名前 → 実体」マップ、
 * 未実装・後続タスク）の双方から参照される共有モジュール（design §2.6 MUST）。
 * 動的 `import()` や文字列からのファイルパス解決は行わない MUST NOT
 * （サプライチェーン対策・型安全性の観点、design §2.6）。
 */

/**
 * v1 で登録済みのコンポーネント名。
 * - `Iceberg` / `Flowchart` / `Citation`: design §2.6 が例示する標準セット（svg-ref 用途）
 * - `JavaJsCompare` / `JsNamingTimeline`: java-vs-js パイロット台本（W15-script-engine-T24）が
 *   参照する custom コンポーネント。実装自体は tasks.md T13 のスコープだが、
 *   parse 時 fail-fast 検証（本タスク W2-script-engine-T8）のため名前登録のみ先行させる
 */
export const REGISTERED_COMPONENT_NAMES = [
  "Iceberg",
  "Flowchart",
  "Citation",
  "JavaJsCompare",
  "JsNamingTimeline",
] as const;

/** 登録済みコンポーネント名の型（正規リストからの導出、design §2.6） */
export type RegisteredComponentName = (typeof REGISTERED_COMPONENT_NAMES)[number];

const REGISTERED_COMPONENT_NAME_SET: ReadonlySet<string> = new Set(
  REGISTERED_COMPONENT_NAMES,
);

/**
 * 台本の svg-ref / custom スライドが参照する `component` 名が正規リストに存在するかを判定する。
 * 未登録名は parse 時 fail-fast エラー対象（design §2.6 MUST、§4.4）。
 */
export function isRegisteredComponentName(
  name: string,
): name is RegisteredComponentName {
  return REGISTERED_COMPONENT_NAME_SET.has(name);
}
