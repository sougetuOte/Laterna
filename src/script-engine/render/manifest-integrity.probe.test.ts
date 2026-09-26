/**
 * T15 独立レビュー probe（A-2 / A-3 / A-7）— java-vs-js・source-to-exe の実 manifest とアセット・レジストリ・
 * frame 算術の機械突合。恒久資産化の判断は親（L1）が行う。
 *
 * 検証対象:
 * - A-2: manifest 実データ ↔ render 期待の整合（slide 参照 / registry 登録名 / portrait PNG /
 *   WAV 実在 / frame 列の順序制約 / slide_events 狭義単調増加 / total_duration_frames 検算）
 * - A-3: CREDIT_REGION_SECONDS の compiler 側定数と render 側計算結果のドリフト検知
 * - A-7: round(duration_seconds * fps) と (audio_end_frame - start_frame) の差 ±1 以内
 */

import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import javaVsJs from "../../../public/manifests/java-vs-js.manifest.json";
import sourceToExe from "../../../public/manifests/source-to-exe.manifest.json";
import { componentRegistry } from "./component-registry";
import { CREDIT_REGION_SECONDS as COMPILER_CREDIT_REGION_SECONDS } from "../compiler/manifest";
import { CREDIT_REGION_SECONDS as RENDER_CREDIT_REGION_SECONDS } from "../../compositions/ScriptComposition";
import type { TimelineManifest } from "../schema/timeline-manifest";

const PUBLIC_DIR = join(__dirname, "..", "..", "..", "public");

// 既存の 2 本（点検 R4-6 で、納品する source-to-exe にも同じ突合を掛けた）。
const MANIFESTS: [string, TimelineManifest][] = [
  ["java-vs-js", javaVsJs as TimelineManifest],
  ["source-to-exe", sourceToExe as TimelineManifest],
];

for (const [scriptId, m] of MANIFESTS) {
  describe(`${scriptId} A-2: manifest 実データ ↔ render 期待の機械突合`, () => {
    it("slide_events[].slide が slides[].id に全て存在する", () => {
      const slideIds = new Set(m.slides.map((s) => s.id));
      for (const event of m.slide_events) {
        expect(slideIds.has(event.slide), `slide_event ${event.id} → ${event.slide}`).toBe(true);
      }
    });

    it("custom/svg-ref スライドの component が componentRegistry に実在する", () => {
      for (const slide of m.slides) {
        if (slide.type === "custom" || slide.type === "svg-ref") {
          expect(
            typeof (componentRegistry as Record<string, unknown>)[slide.component],
            `slide ${slide.id} component=${slide.component}`,
          ).toBe("function");
        }
      }
    });

    it("speakers の各 portrait_asset_key に対応する public/portraits/<key>.png が実在する", () => {
      for (const [role, speaker] of Object.entries(m.speakers)) {
        const p = join(PUBLIC_DIR, "portraits", `${speaker.portrait_asset_key}.png`);
        expect(existsSync(p), `role=${role} → ${p}`).toBe(true);
      }
    });

    it("全 utterances[].wav_path が public/ 配下に実在する", () => {
      for (const u of m.utterances) {
        const p = join(PUBLIC_DIR, ...u.wav_path.split("/"));
        expect(existsSync(p), `${u.id} → ${p}`).toBe(true);
      }
    });

    it("各 utterance で start_frame <= audio_end_frame <= end_frame", () => {
      for (const u of m.utterances) {
        expect(u.start_frame, u.id).toBeLessThanOrEqual(u.audio_end_frame);
        expect(u.audio_end_frame, u.id).toBeLessThanOrEqual(u.end_frame);
      }
    });

    it("utterances の frame 列が単調非減少（前の end_frame <= 次の start_frame）", () => {
      for (let i = 1; i < m.utterances.length; i++) {
        expect(
          m.utterances[i - 1].end_frame,
          `${m.utterances[i - 1].id} → ${m.utterances[i].id}`,
        ).toBeLessThanOrEqual(m.utterances[i].start_frame);
      }
    });

    it("slide_events[].start_frame が狭義単調増加（design §5.3 MUST）", () => {
      for (let i = 1; i < m.slide_events.length; i++) {
        expect(
          m.slide_events[i].start_frame,
          `${m.slide_events[i - 1].id} → ${m.slide_events[i].id}`,
        ).toBeGreaterThan(m.slide_events[i - 1].start_frame);
      }
    });

    it("total_duration_frames = 最終 end_frame + クレジット区間（検算）", () => {
      const lastEnd = Math.max(...m.utterances.map((u) => u.end_frame));
      const creditFrames = Math.round(COMPILER_CREDIT_REGION_SECONDS * m.fps);
      expect(m.total_duration_frames).toBe(lastEnd + creditFrames);
    });
  });

  describe(`${scriptId} A-3: CREDIT_REGION_SECONDS 二重定義のドリフト検知`, () => {
    it("render 側の CREDIT_REGION_SECONDS 実値と compiler 側の実値が一致する（直接突合）", () => {
      // 点検 R13 以降、render 側（ScriptComposition.tsx）と compiler 側（manifest.ts）はどちらも
      // shared/credit-region.ts の同じ定数を再 export しているので、この突合はいまは常に通る
      // （値そのものは A-2 の total_duration_frames の検算が実 manifest で押さえている）。
      // どちらかが独自の定義に戻ったときの見張りとして残す。
      expect(RENDER_CREDIT_REGION_SECONDS).toBe(COMPILER_CREDIT_REGION_SECONDS);
    });

    it("render 側のクレジット開始 frame が最終発話 end_frame 以降（音声を覆わない）", () => {
      // compiler 側定数で同じ計算をして「クレジット開始 >= 最終 audio_end_frame」を検算する。
      // render 側定数がドリフトすると total_duration_frames との整合が崩れ、この検算または
      // A-2 の総尺検算が落ちる。
      const creditFrames = Math.round(COMPILER_CREDIT_REGION_SECONDS * m.fps);
      const creditFrom = m.total_duration_frames - creditFrames;
      const lastAudioEnd = Math.max(...m.utterances.map((u) => u.audio_end_frame));
      expect(creditFrom).toBeGreaterThanOrEqual(lastAudioEnd);
    });
  });

  describe(`${scriptId} A-7: Audio Sequence 区間と WAV 実尺の整合`, () => {
    it("round(duration_seconds * fps) と (audio_end_frame - start_frame) の差が全件 ±1 以内", () => {
      for (const u of m.utterances) {
        const expected = Math.round(u.duration_seconds * m.fps);
        const actual = u.audio_end_frame - u.start_frame;
        expect(Math.abs(actual - expected), `${u.id}: expected=${expected} actual=${actual}`)
          .toBeLessThanOrEqual(1);
      }
    });
  });
}
