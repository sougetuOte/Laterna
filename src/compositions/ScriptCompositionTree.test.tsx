/**
 * ScriptComposition.tsx の描画ツリーのテスト（ScriptCompositionInner）
 *
 * 見るもの（純関数のテストは ScriptComposition.test.tsx）:
 * - クレジットの `<Sequence>` の位置と尺、CreditSection に渡る credits
 * - 発話ごとの Audio `<Sequence>` の位置と尺（audio_end_frame - start_frame）
 * - スライドの `<Sequence>` の位置と尺、title スライドの Section に Sequence のローカル尺が渡ること（D-25）
 * - 立ち絵の isActive の結線（narrator=左・listener=右）と、話者が 1 人のときのカラム省略
 *
 * 入力は 10/2 に納品する source-to-exe の実 manifest（title・code・custom・bullets を全部含む）と、
 * java-vs-js の実 manifest。DOM 描画用のテストライブラリは入れていないので
 * （ScriptSlideRenderer.test.tsx と同じ制約）、remotion の useCurrentFrame だけを差し替え、
 * ScriptComposition が返す要素の関数（ScriptCompositionInner）を直接呼んで、返った React 要素ツリーを歩く。
 */

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const remotionState = vi.hoisted(() => ({ frame: 0 }));

vi.mock("remotion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("remotion")>();
  return { ...actual, useCurrentFrame: () => remotionState.frame };
});

import { Audio, Sequence } from "remotion";
import {
  CREDIT_REGION_SECONDS,
  ScriptComposition,
  computeSlideSequenceSpans,
} from "./ScriptComposition";
import { Section } from "../components/Section";
import { CreditSection } from "../script-engine/render/CreditSection";
import { SpeakerPortrait } from "../script-engine/render/SpeakerPortrait";
import { manifestRegistry } from "../script-engine/render/manifest-registry";
import type { TimelineManifest } from "../script-engine/schema/timeline-manifest";

type AnyElement = React.ReactElement<Record<string, unknown>>;

/** ScriptComposition → ScriptCompositionInner を frame を決めて 1 回呼び、返った要素ツリーを得る。 */
function renderTree(scriptId: string, frame: number): AnyElement {
  remotionState.frame = frame;
  const outer = ScriptComposition({ scriptId }) as AnyElement;
  const inner = outer.type as (props: Record<string, unknown>) => React.ReactNode;
  return inner(outer.props) as AnyElement;
}

/** 要素ツリーを props.children で歩き、要素を全部集める（関数コンポーネントの中身は展開しない）。 */
function collectElements(node: React.ReactNode, out: AnyElement[] = []): AnyElement[] {
  if (Array.isArray(node)) {
    for (const child of node) collectElements(child, out);
    return out;
  }
  if (!React.isValidElement(node)) return out;
  const element = node as AnyElement;
  out.push(element);
  collectElements(element.props.children as React.ReactNode, out);
  return out;
}

function sequencesOf(tree: AnyElement): AnyElement[] {
  return collectElements(tree).filter((e) => e.type === Sequence);
}

function childElementsOf(element: AnyElement): AnyElement[] {
  return collectElements(element.props.children as React.ReactNode);
}

function portraitsOf(tree: AnyElement): AnyElement[] {
  return collectElements(tree).filter((e) => e.type === SpeakerPortrait);
}

const SCRIPT_IDS = ["source-to-exe", "java-vs-js"] as const;

describe.each(SCRIPT_IDS)("ScriptCompositionInner の描画ツリー（実 manifest: %s）", (scriptId) => {
  const m = manifestRegistry[scriptId];

  it("クレジットの Sequence は末尾 CREDIT_REGION_SECONDS 秒に置かれ、manifest.credits を渡す", () => {
    const tree = renderTree(scriptId, 0);
    const creditFrames = Math.round(CREDIT_REGION_SECONDS * m.fps);
    const creditSequences = sequencesOf(tree).filter((s) =>
      childElementsOf(s).some((c) => c.type === CreditSection),
    );
    expect(creditSequences).toHaveLength(1);
    expect(creditSequences[0].props.from).toBe(m.total_duration_frames - creditFrames);
    expect(creditSequences[0].props.durationInFrames).toBe(creditFrames);
    const credit = childElementsOf(creditSequences[0]).find((c) => c.type === CreditSection)!;
    expect(credit.props.credits).toEqual(m.credits);
  });

  it("発話ごとに Audio の Sequence があり、位置は start_frame、尺は audio_end_frame - start_frame", () => {
    const tree = renderTree(scriptId, 0);
    const audioSequences = sequencesOf(tree).filter((s) =>
      childElementsOf(s).some((c) => c.type === Audio),
    );
    expect(audioSequences).toHaveLength(m.utterances.length);
    for (const u of m.utterances) {
      const seq = audioSequences.find((s) => s.key === u.id);
      expect(seq, u.id).toBeDefined();
      expect(seq!.props.from, u.id).toBe(u.start_frame);
      expect(seq!.props.durationInFrames, u.id).toBe(u.audio_end_frame - u.start_frame);
      const audio = childElementsOf(seq!).find((c) => c.type === Audio)!;
      expect(String(audio.props.src).endsWith(u.wav_path), u.id).toBe(true);
    }
  });

  it("スライドの Sequence は computeSlideSequenceSpans の位置と尺で並ぶ", () => {
    const tree = renderTree(scriptId, 0);
    const spans = computeSlideSequenceSpans(m);
    const slideSequences = sequencesOf(tree).filter((s) =>
      spans.some((span) => span.event.id === s.key),
    );
    expect(slideSequences).toHaveLength(spans.length);
    for (const span of spans) {
      const seq = slideSequences.find((s) => s.key === span.event.id)!;
      expect(seq.props.from, span.event.id).toBe(span.from);
      expect(seq.props.durationInFrames, span.event.id).toBe(span.durationInFrames);
    }
  });

  it("title スライドの Section には、その Sequence のローカル尺が durationInFrames として渡る（D-25）", () => {
    const tree = renderTree(scriptId, 0);
    const spans = computeSlideSequenceSpans(m);
    for (const span of spans.filter((s) => s.slide.type === "title")) {
      const seq = sequencesOf(tree).find((s) => s.key === span.event.id)!;
      const section = childElementsOf(seq).find((c) => c.type === Section);
      expect(section, span.event.id).toBeDefined();
      expect(section!.props.durationInFrames, span.event.id).toBe(span.durationInFrames);
    }
  });

  it("narrator の発話中は左の立ち絵だけ、listener の発話中は右の立ち絵だけが isActive", () => {
    for (const role of ["narrator", "listener"] as const) {
      const u = m.utterances.find((v) => v.speaker === role && v.audio_end_frame > v.start_frame);
      if (u === undefined) continue;
      const portraits = portraitsOf(renderTree(scriptId, u.start_frame));
      expect(portraits).toHaveLength(2);
      const left = portraits.find((p) => p.props.position === "left")!;
      const right = portraits.find((p) => p.props.position === "right")!;
      expect(left.props.portraitAssetKey).toBe(m.speakers.narrator.portrait_asset_key);
      expect(right.props.portraitAssetKey).toBe(m.speakers.listener.portrait_asset_key);
      expect(left.props.isActive, `${u.id} left`).toBe(role === "narrator");
      expect(right.props.isActive, `${u.id} right`).toBe(role === "listener");
    }
  });

  it("クレジット区間ではどちらの立ち絵も isActive にならない", () => {
    const portraits = portraitsOf(renderTree(scriptId, m.total_duration_frames - 1));
    expect(portraits.map((p) => p.props.isActive)).toEqual([false, false]);
  });
});

describe("ScriptCompositionInner: 話者が 1 人のときは、いない側のカラムを描かない（design §7）", () => {
  const base = manifestRegistry["java-vs-js"];
  const tempIds: string[] = [];

  afterEach(() => {
    // registry へのシングルトン汚染を残さない（manifest-registry.test.ts と同じ後始末）
    for (const id of tempIds.splice(0)) {
      delete (manifestRegistry as Record<string, TimelineManifest>)[id];
    }
  });

  function registerWithout(role: "narrator" | "listener"): string {
    const id = `single-speaker-without-${role}`;
    const speakers = { ...base.speakers };
    delete speakers[role];
    (manifestRegistry as Record<string, TimelineManifest>)[id] = { ...base, speakers };
    tempIds.push(id);
    return id;
  }

  it("listener がいなければ左の立ち絵だけ", () => {
    const portraits = portraitsOf(renderTree(registerWithout("listener"), 0));
    expect(portraits.map((p) => p.props.position)).toEqual(["left"]);
  });

  it("narrator がいなければ右の立ち絵だけ", () => {
    const portraits = portraitsOf(renderTree(registerWithout("narrator"), 0));
    expect(portraits.map((p) => p.props.position)).toEqual(["right"]);
  });
});
