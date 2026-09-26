/**
 * ScriptComposition.tsx のテスト
 *
 * 出自: docs/specs/script-engine/tasks.md W3-script-engine-T13 完了条件
 *   「テスト: mock manifest + ScriptComposition で calculateMetadata が正しく durationInFrames を
 *   返すことを確認」/ W3-script-engine-T15 完了条件（発話中話者判定・SpeakerPortrait スタイル分岐）
 *
 * calculateScriptMetadata は resolveManifest（manifest-registry.ts、実 java-vs-js manifest 登録）を
 * 経由するため、実 manifest 値との突合で検証する。findActiveSlideEvent / findActiveSpeaker は
 * 境界値を mock で検証する。
 *
 * SpeakerPortrait のスタイル分岐は、プロジェクトに DOM レンダリング用テストライブラリ
 * （jsdom / testing-library 等）が導入されていないため（ScriptSlideRenderer.test.tsx と同じ制約）、
 * 実 DOM への render は行わず React 要素ツリー（`React.isValidElement` + `.type`/`.props`）を
 * 直接検査する方式で検証する。
 */

import React from "react";
import { describe, expect, it } from "vitest";
import {
  calculateScriptMetadata,
  computeSlideSequenceSpans,
  findActiveSlideEvent,
  findActiveSpeaker,
  resolveActiveSlide,
} from "./ScriptComposition";
import { SpeakerPortrait } from "../script-engine/render/SpeakerPortrait";
import { manifestRegistry } from "../script-engine/render/manifest-registry";
import type {
  ManifestSlideEvent,
  ManifestUtterance,
  TimelineManifest,
} from "../script-engine/schema/timeline-manifest";

describe("calculateScriptMetadata", () => {
  it("登録済み scriptId (java-vs-js) から durationInFrames / fps を返す", async () => {
    const expected = manifestRegistry["java-vs-js"];
    const result = await calculateScriptMetadata({ props: { scriptId: "java-vs-js" } });

    expect(result.durationInFrames).toBe(expected.total_duration_frames);
    expect(result.fps).toBe(expected.fps);
  });

  it("未登録 scriptId は throw する", async () => {
    await expect(
      calculateScriptMetadata({ props: { scriptId: "not-registered" } }),
    ).rejects.toThrow(/not-registered/);
  });
});

describe("findActiveSlideEvent", () => {
  const slideEvents: ManifestSlideEvent[] = [
    { id: "ev-001", slide: "slide-a", start_frame: 0 },
    { id: "ev-002", slide: "slide-b", start_frame: 100 },
    { id: "ev-003", slide: "slide-c", start_frame: 250 },
  ];

  it("frame 0 では最初のイベントがアクティブ", () => {
    expect(findActiveSlideEvent(slideEvents, 0)?.slide).toBe("slide-a");
  });

  it("イベント切替 frame ちょうどで次のイベントに切り替わる", () => {
    expect(findActiveSlideEvent(slideEvents, 99)?.slide).toBe("slide-a");
    expect(findActiveSlideEvent(slideEvents, 100)?.slide).toBe("slide-b");
  });

  it("最終イベント以降は最終イベントがアクティブのまま維持される", () => {
    expect(findActiveSlideEvent(slideEvents, 250)?.slide).toBe("slide-c");
    expect(findActiveSlideEvent(slideEvents, 100000)?.slide).toBe("slide-c");
  });

  it("空配列では undefined を返す", () => {
    expect(findActiveSlideEvent([], 0)).toBeUndefined();
  });
});

describe("findActiveSpeaker (design §3.3: 判定区間 [start_frame, audio_end_frame))", () => {
  // u-1: 発話区間 [0, 100)、pause_after 込みの区間終了は 120（[100, 120) が無音区間）
  // u-2: 発話区間 [150, 200)、pause_after なし（audio_end_frame === end_frame）
  const utterances: ManifestUtterance[] = [
    {
      id: "u-1",
      speaker: "narrator",
      content_hash: "h1",
      wav_path: "audio/test/u-1.wav",
      duration_seconds: 3.33,
      start_frame: 0,
      audio_end_frame: 100,
      end_frame: 120,
    },
    {
      id: "u-2",
      speaker: "listener",
      content_hash: "h2",
      wav_path: "audio/test/u-2.wav",
      duration_seconds: 1.67,
      start_frame: 150,
      audio_end_frame: 200,
      end_frame: 200,
    },
  ];

  it("start_frame ちょうどで active（区間の下限は閉区間）", () => {
    expect(findActiveSpeaker(utterances, 0)).toBe("narrator");
    expect(findActiveSpeaker(utterances, 150)).toBe("listener");
  });

  it("audio_end_frame ちょうどで inactive（区間の上限は開区間）", () => {
    expect(findActiveSpeaker(utterances, 100)).toBeUndefined();
    expect(findActiveSpeaker(utterances, 200)).toBeUndefined();
  });

  it("pause_after 中（audio_end_frame 〜 end_frame の無音区間）は inactive", () => {
    // u-1 の audio_end_frame=100 〜 end_frame=120 は pause_after 込みの無音区間
    expect(findActiveSpeaker(utterances, 110)).toBeUndefined();
  });

  it("どの発話区間にも属さない frame（発話間の隙間）は undefined", () => {
    // u-1.end_frame=120 と u-2.start_frame=150 の間は完全な隙間
    expect(findActiveSpeaker(utterances, 130)).toBeUndefined();
  });

  it("区間内の中間 frame は active", () => {
    expect(findActiveSpeaker(utterances, 50)).toBe("narrator");
    expect(findActiveSpeaker(utterances, 175)).toBe("listener");
  });

  it("空配列では undefined を返す", () => {
    expect(findActiveSpeaker([], 0)).toBeUndefined();
  });
});

describe("resolveActiveSlide (FIX-2: activeSlide 解決失敗の silent blank 防止)", () => {
  const baseManifest = manifestRegistry["java-vs-js"];

  it("activeSlideEvent が undefined の場合は undefined を返す（frame 0〜最初の slide_event 前の背景のみ区間）", () => {
    expect(resolveActiveSlide(baseManifest, undefined, 0)).toBeUndefined();
  });

  it("activeSlideEvent が参照する slide が実在すれば解決できる", () => {
    const event = baseManifest.slide_events[0];
    const slide = resolveActiveSlide(baseManifest, event, event.start_frame);
    expect(slide?.id).toBe(event.slide);
  });

  it("activeSlideEvent が参照する slide が manifest.slides[] に存在しない場合は診断メッセージ付きで throw する（silent blank にしない）", () => {
    const inconsistentEvent: ManifestSlideEvent = {
      id: "ev-broken",
      slide: "slide-does-not-exist",
      start_frame: 0,
    };
    const manifestWithoutMatchingSlide: TimelineManifest = {
      ...baseManifest,
      slides: [],
    };
    expect(() => resolveActiveSlide(manifestWithoutMatchingSlide, inconsistentEvent, 42)).toThrow(
      /slide-does-not-exist/,
    );
    expect(() => resolveActiveSlide(manifestWithoutMatchingSlide, inconsistentEvent, 42)).toThrow(
      /ev-broken/,
    );
    expect(() => resolveActiveSlide(manifestWithoutMatchingSlide, inconsistentEvent, 42)).toThrow(
      /compile:script/,
    );
  });
});

describe("computeSlideSequenceSpans (design §6.3 v3.9 P-1: per-slide Sequence 化)", () => {
  const mockSlideEvents: ManifestSlideEvent[] = [
    { id: "ev-001", slide: "slide-a", start_frame: 0 },
    { id: "ev-002", slide: "slide-b", start_frame: 100 },
    { id: "ev-003", slide: "slide-c", start_frame: 250 },
  ];
  const mockSlides = [
    { id: "slide-a", type: "title", props: {} },
    { id: "slide-b", type: "title", props: {} },
    { id: "slide-c", type: "title", props: {} },
  ] as unknown as TimelineManifest["slides"];

  function buildMockManifest(
    overrides: Partial<TimelineManifest> = {},
  ): TimelineManifest {
    return {
      schema_version: 1,
      script_id: "mock-script",
      fps: 30,
      voicevox_engine_version: "0.0.0",
      utterances: [],
      slide_events: mockSlideEvents,
      slides: mockSlides,
      speakers: {},
      credits: [],
      total_duration_frames: 400,
      ...overrides,
    };
  }

  it("隣接イベント間で span が隙間・重複なく連続する", () => {
    const manifest = buildMockManifest();
    const spans = computeSlideSequenceSpans(manifest);

    expect(spans).toHaveLength(3);
    expect(spans[0].from).toBe(0);
    expect(spans[0].durationInFrames).toBe(100); // -> 次の from (100) と一致
    expect(spans[1].from).toBe(100);
    expect(spans[1].durationInFrames).toBe(150); // 250 - 100
    expect(spans[2].from).toBe(250);
  });

  it("末尾イベントの span は total_duration_frames まで到達する", () => {
    const manifest = buildMockManifest();
    const spans = computeSlideSequenceSpans(manifest);
    const last = spans[spans.length - 1];

    expect(last.from + last.durationInFrames).toBe(manifest.total_duration_frames);
  });

  it("未解決 slide 参照は診断メッセージ付きで throw する（resolveActiveSlide と同一挙動）", () => {
    const manifest = buildMockManifest({
      slide_events: [{ id: "ev-broken", slide: "slide-does-not-exist", start_frame: 0 }],
      slides: [],
    });

    expect(() => computeSlideSequenceSpans(manifest)).toThrow(/slide-does-not-exist/);
    expect(() => computeSlideSequenceSpans(manifest)).toThrow(/ev-broken/);
  });

  it("実 manifest（java-vs-js）で span 合計が manifest 全体と整合する", () => {
    const manifest = manifestRegistry["java-vs-js"];
    const spans = computeSlideSequenceSpans(manifest);

    expect(spans).toHaveLength(manifest.slide_events.length);
    // 隣接 span 間で隙間・重複なし
    for (let i = 0; i + 1 < spans.length; i++) {
      expect(spans[i].from + spans[i].durationInFrames).toBe(spans[i + 1].from);
    }
    // 末尾 span は total_duration_frames まで到達する
    const last = spans[spans.length - 1];
    expect(last.from + last.durationInFrames).toBe(manifest.total_duration_frames);
    // 各 span の slide は event が参照する slide id と一致する
    spans.forEach((span) => {
      expect(span.slide.id).toBe(span.event.slide);
    });
  });
});

describe("SpeakerPortrait (design §3.3: 発話中話者強調のスタイル分岐)", () => {
  /** SpeakerPortrait は hooks を使わない純粋な関数コンポーネントのため、直接呼び出して
   *  React 要素ツリーを検査する（ScriptSlideRenderer.test.tsx と同じ手法、jsdom 未導入のため）。 */
  function renderPortrait(
    isActive: boolean,
    position: "left" | "right",
  ): React.ReactElement {
    const outer = SpeakerPortrait({
      portraitAssetKey: "narrator-default",
      isActive,
      position,
    }) as React.ReactElement<{ children: React.ReactElement }>;
    return outer.props.children as unknown as React.ReactElement;
  }

  it("isActive=true: 明度 100%（v3.8: 枠線なし）", () => {
    const img = renderPortrait(true, "left");
    const style = (img.props as { style: React.CSSProperties }).style;
    expect(style.filter).toBe("brightness(1)");
  });

  it("isActive=false: 明度 55%", () => {
    const img = renderPortrait(false, "left");
    const style = (img.props as { style: React.CSSProperties }).style;
    expect(style.filter).toBe("brightness(0.55)");
  });

  it("position=right は scaleX(-1) で左右反転する（design §7 v3.8: 画面内側を向く）", () => {
    const img = renderPortrait(true, "right");
    const style = (img.props as { style: React.CSSProperties }).style;
    expect(style.transform).toBe("scaleX(-1)");
  });

  it("position=left は反転しない", () => {
    const img = renderPortrait(true, "left");
    const style = (img.props as { style: React.CSSProperties }).style;
    expect(style.transform).toBeUndefined();
  });
});
