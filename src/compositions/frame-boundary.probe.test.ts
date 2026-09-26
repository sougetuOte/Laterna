/**
 * T15 独立レビュー probe（A-6）— frame 境界の off-by-one 全走査。
 * 実 manifest（java-vs-js・source-to-exe）を入力に findActiveSpeaker / findActiveSlideEvent を
 * frame 0〜total-1 で全走査し、例外なし・クレジット区間の非強調・境界の二重発火なしを検証する。
 * 恒久資産化の判断は親（L1）が行う。
 */

import { describe, expect, it } from "vitest";
import javaVsJs from "../../public/manifests/java-vs-js.manifest.json";
import sourceToExe from "../../public/manifests/source-to-exe.manifest.json";
import { CREDIT_REGION_SECONDS, findActiveSlideEvent, findActiveSpeaker } from "./ScriptComposition";
import type { TimelineManifest } from "../script-engine/schema/timeline-manifest";

// 既存の 2 本（点検 R4-6 で、納品する source-to-exe にも同じ全走査を掛けた）。
const MANIFESTS: [string, TimelineManifest][] = [
  ["java-vs-js", javaVsJs as TimelineManifest],
  ["source-to-exe", sourceToExe as TimelineManifest],
];

for (const [scriptId, m] of MANIFESTS) {
  // render 側実値（CREDIT_REGION_SECONDS）を直接 import して使う（ハードコードリテラル 3 の排除。
  // FIX-1 / A-3 のドリフト検知と同じ理由）。
  const CREDIT_FRAMES = Math.round(CREDIT_REGION_SECONDS * m.fps);
  const CREDIT_FROM = m.total_duration_frames - CREDIT_FRAMES;

  describe(`${scriptId} A-6: frame 境界の全走査（0〜total_duration_frames-1）`, () => {
    it("(a) 全 frame で findActiveSpeaker / findActiveSlideEvent が例外を投げない", () => {
      for (let f = 0; f < m.total_duration_frames; f++) {
        expect(() => findActiveSpeaker(m.utterances, f)).not.toThrow();
        expect(() => findActiveSlideEvent(m.slide_events, f)).not.toThrow();
      }
    });

    it("(b) クレジット区間 [total-credit, total) では activeSpeaker が undefined（立ち絵強調なし）", () => {
      for (let f = CREDIT_FROM; f < m.total_duration_frames; f++) {
        expect(findActiveSpeaker(m.utterances, f), `frame=${f}`).toBeUndefined();
      }
    });

    it("(c) 強調区間 [start_frame, audio_end_frame) の境界で二重発火しない（区間排他）", () => {
      // 各 frame で「その frame を含む発話区間」が高々 1 件であることを直接数える
      for (let f = 0; f < m.total_duration_frames; f++) {
        const hits = m.utterances.filter(
          (u) => f >= u.start_frame && f < u.audio_end_frame,
        ).length;
        expect(hits, `frame=${f}`).toBeLessThanOrEqual(1);
      }
    });

    it("(c') 各発話の start_frame では話者が立ち、audio_end_frame ちょうどでは立たない（半開区間）", () => {
      for (const u of m.utterances) {
        if (u.audio_end_frame > u.start_frame) {
          expect(findActiveSpeaker(m.utterances, u.start_frame), `${u.id} start`).toBe(u.speaker);
        }
        const atEnd = findActiveSpeaker(m.utterances, u.audio_end_frame);
        // audio_end_frame ちょうどは自分の区間外（次の発話の開始と一致する場合のみ次話者）
        const next = m.utterances.find((v) => v.start_frame === u.audio_end_frame);
        expect(atEnd, `${u.id} end`).toBe(next ? next.speaker : undefined);
      }
    });

    it("スライド境界: 各 slide_event.start_frame ちょうどでそのイベントに切り替わり、直前 frame は前イベント", () => {
      for (let i = 0; i < m.slide_events.length; i++) {
        const ev = m.slide_events[i];
        expect(findActiveSlideEvent(m.slide_events, ev.start_frame)?.id, `${ev.id} at start`).toBe(
          ev.id,
        );
        const before = findActiveSlideEvent(m.slide_events, ev.start_frame - 1);
        expect(before?.id, `${ev.id} at start-1`).toBe(i > 0 ? m.slide_events[i - 1].id : undefined);
      }
    });

    it("クレジット区間中もスライドは「最後のイベント」を返し続ける（CreditSection が上層で覆う前提の確認）", () => {
      const last = m.slide_events[m.slide_events.length - 1];
      expect(findActiveSlideEvent(m.slide_events, m.total_duration_frames - 1)?.id).toBe(last.id);
    });
  });
}
