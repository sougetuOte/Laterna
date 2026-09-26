/**
 * Section.tsx のテスト（不透明度の計算）
 *
 * 見るもの:
 * - 尺が FADE_FRAMES * 2（= 30）以下なら、interpolate を呼ばずに不透明度 1 で固定する（短尺ガード）。
 *   PDF（ScriptPdfComposition）は Section を `<Freeze frame={99999}>` で止めて描き、尺を渡さないので、
 *   Section は useVideoConfig の尺（= pdf-manifest の total_pages）に戻る。納品 PDF はこの経路で描かれる。
 * - props の durationInFrames（`<Sequence>` のローカル尺、D-25）が useVideoConfig の尺より優先される。
 *
 * DOM 描画用のテストライブラリは入れていないので（ScriptSlideRenderer.test.tsx と同じ制約）、
 * remotion の useCurrentFrame / useVideoConfig を差し替え、Section を関数として呼んで
 * 返った React 要素の style を見る。
 */

import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const remotionState = vi.hoisted(() => ({ frame: 0, compositionDurationInFrames: 1 }));

vi.mock("remotion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("remotion")>();
  return {
    ...actual,
    useCurrentFrame: () => remotionState.frame,
    useVideoConfig: () => ({
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: remotionState.compositionDurationInFrames,
      id: "test",
      defaultProps: {},
      props: {},
      defaultCodec: null,
      defaultOutName: null,
      defaultVideoImageFormat: null,
      defaultPixelFormat: null,
      defaultProResProfile: null,
    }),
  };
});

import { Section } from "./Section";

function opacityOf(
  props: React.ComponentProps<typeof Section>,
): number | undefined {
  const element = Section(props) as React.ReactElement<{ style: React.CSSProperties }>;
  return element.props.style.opacity as number | undefined;
}

beforeEach(() => {
  remotionState.frame = 0;
  remotionState.compositionDurationInFrames = 1;
});

describe("Section: 短尺ガード（尺が FADE_FRAMES * 2 = 30 以下なら不透明度 1）", () => {
  it("PDF と同じ呼び方（尺を渡さない、Composition の尺 10、frame 99999）で不透明度 1", () => {
    remotionState.compositionDurationInFrames = 10;
    remotionState.frame = 99999;
    expect(opacityOf({ title: "t" })).toBe(1);
  });

  it("尺 1（still 用の 1 frame Composition）で throw せず不透明度 1", () => {
    remotionState.compositionDurationInFrames = 1;
    expect(opacityOf({ title: "t" })).toBe(1);
  });

  it("尺ちょうど 30 でも不透明度 1（境界は含む）", () => {
    remotionState.compositionDurationInFrames = 30;
    remotionState.frame = 0;
    expect(opacityOf({ title: "t" })).toBe(1);
  });

  it("尺 31 からはフェードの式に入る（frame 0 で不透明度 0）", () => {
    remotionState.compositionDurationInFrames = 31;
    remotionState.frame = 0;
    expect(opacityOf({ title: "t" })).toBe(0);
  });
});

describe("Section: props の durationInFrames が useVideoConfig の尺より優先される（D-25）", () => {
  it("ローカル尺 100 の終端（frame 100）で不透明度 0、Composition の尺は長いまま", () => {
    remotionState.compositionDurationInFrames = 10000;
    remotionState.frame = 100;
    expect(opacityOf({ title: "t", durationInFrames: 100 })).toBe(0);
  });

  it("ローカル尺 100 の中ほど（frame 50）では不透明度 1", () => {
    remotionState.compositionDurationInFrames = 10000;
    remotionState.frame = 50;
    expect(opacityOf({ title: "t", durationInFrames: 100 })).toBe(1);
  });

  it("ローカル尺が 30 以下なら、Composition の尺が長くても不透明度 1", () => {
    remotionState.compositionDurationInFrames = 10000;
    remotionState.frame = 5000;
    expect(opacityOf({ title: "t", durationInFrames: 20 })).toBe(1);
  });
});
