/**
 * script-engine — svg-ref / custom スライドの「名前 → React コンポーネント実体」明示マップ
 *
 * 出自: docs/specs/script-engine/design.md §2.6（エスケープハッチ設計）/ §6.3（標準スライド用レンダラ）
 * 対応タスク: docs/specs/script-engine/tasks.md W3-script-engine-T14
 *
 * `src/script-engine/shared/component-names.ts` の正規リスト（compile 時 fail-fast 検証で使用済み、
 * T8）と対になる render 側の実装。動的 `import()` や文字列からのファイルパス解決は行わない MUST NOT
 * （design §2.6、サプライチェーン対策・型安全性の観点）。
 *
 * `Iceberg` / `Flowchart` / `Citation` は video-base Milestone で実装済みの既存資産をそのまま登録する
 * （design §6.3「変更せず流用」）。`JavaJsCompare` / `JsNamingTimeline` は java-vs-js パイロット台本
 * （W15-script-engine-T24）専用の新規コンポーネント（本タスクで実装、`./pilot/` 配下）。
 *
 * design §6.3 の疑似コード（v3.7 改訂後）`React.createElement(registry[slide.component], slide.props)`
 * は「レジストリの値が props を受け取り ReactNode を返す関数コンポーネントである」契約を前提とするため、
 * レジストリの値は「props を受け取り ReactNode を返す関数」として型付けする（React.FC はこの形に
 * 構造的に適合する）。旧疑似コード `registry[slide.component](slide.props)`（直接関数呼び出し）は
 * hooks インライン化により "Rendered fewer/more hooks" クラッシュを招くため v3.7 で MUST NOT 化された
 * （実際の呼び出しは `ScriptSlideRenderer.tsx` の `renderEscapeHatchSlide` を参照）。
 */

import type React from "react";
import { Iceberg } from "../../components/Iceberg";
import { Flowchart } from "../../components/Flowchart";
import { Citation } from "../../components/Citation";
import { JavaJsCompare } from "./pilot/JavaJsCompare";
import { JsNamingTimeline } from "./pilot/JsNamingTimeline";
import {
  REGISTERED_COMPONENT_NAMES,
  type RegisteredComponentName,
} from "../shared/component-names";

/**
 * レジストリの値の型。各コンポーネント固有の props 型はここでは強制せず（`Slide.props` は
 * JSON 直列化可能値限定の緩い型、design §2.6 MUST）、実体側の型定義を正とする。
 * `never` を引数型にすることで「どの props 型の関数でも受け入れる」広い型になる
 * （関数型は引数位置で反変のため、`never` を受ける関数型はどんな引数型の関数からも代入可能）。
 * 戻り値型は `React.FC` の実際のシグネチャ（React 19: 非同期コンポーネント対応で
 * `ReactNode | Promise<ReactNode>`）に合わせる。本レジストリの登録コンポーネントはいずれも
 * 同期関数のため、呼び出し側（ScriptSlideRenderer）で `React.ReactNode` へキャストして使う。
 */
export type SlideComponentFn = (props: never) => React.ReactNode | Promise<React.ReactNode>;

export type ComponentRegistry = Record<RegisteredComponentName, SlideComponentFn>;

export const componentRegistry: ComponentRegistry = {
  Iceberg,
  Flowchart,
  Citation,
  JavaJsCompare,
  JsNamingTimeline,
};

/**
 * `componentRegistry` に `component-names.ts` の正規リスト全 5 名が実体登録済みであることを
 * 実行時に確認する（component-registry.test.ts から呼び出す整合テスト用）。
 */
export function assertComponentRegistryComplete(): void {
  for (const name of REGISTERED_COMPONENT_NAMES) {
    if (typeof componentRegistry[name] !== "function") {
      throw new Error(
        `✗ componentRegistry に "${name}" の実体（React コンポーネント）が登録されていません`,
      );
    }
  }
}

/**
 * `slide.component` の名前から実体コンポーネントを解決する。未登録名は parse 時（T8）に
 * fail-fast 済みの前提だが、防御として render まで未登録名が届いた場合も明示エラーとする
 * （design §4.4「エスケープハッチのコンポーネント名がレジストリ未登録」）。
 */
export function resolveComponent(name: string): SlideComponentFn {
  const component = (componentRegistry as Record<string, SlideComponentFn | undefined>)[name];
  if (component === undefined) {
    throw new Error(
      `✗ component-registry に "${name}" が登録されていません` +
        `（登録済み: ${REGISTERED_COMPONENT_NAMES.join(", ")}）`,
    );
  }
  return component;
}
