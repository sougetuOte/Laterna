/**
 * script-engine — component-registry.ts のテスト
 *
 * 出自: docs/specs/script-engine/tasks.md W3-script-engine-T14 完了条件
 *   「T8 新設済みの正規名リスト（component-names.ts）との整合検証 + 実体（React コンポーネント）登録」
 */

import { describe, expect, it } from "vitest";
import {
  assertComponentRegistryComplete,
  componentRegistry,
  resolveComponent,
} from "./component-registry";
import { REGISTERED_COMPONENT_NAMES } from "../shared/component-names";

describe("componentRegistry", () => {
  it("component-names.ts の正規リスト全 5 名に実体が登録されている", () => {
    expect(() => assertComponentRegistryComplete()).not.toThrow();
    expect(Object.keys(componentRegistry).sort()).toEqual(
      [...REGISTERED_COMPONENT_NAMES].sort(),
    );
    for (const name of REGISTERED_COMPONENT_NAMES) {
      expect(typeof componentRegistry[name]).toBe("function");
    }
  });
});

describe("resolveComponent", () => {
  it.each(REGISTERED_COMPONENT_NAMES)("登録済み名 \"%s\" を解決できる", (name) => {
    expect(resolveComponent(name)).toBe(componentRegistry[name]);
  });

  it("未登録名は明示エラーを throw する", () => {
    expect(() => resolveComponent("NotRegistered")).toThrow(/NotRegistered/);
    expect(() => resolveComponent("NotRegistered")).toThrow(/Iceberg/);
  });
});
