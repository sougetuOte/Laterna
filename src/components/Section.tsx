import React, { CSSProperties } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export type SectionProps = {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  color?: string;
  /**
   * D-25: 表示尺（フレーム数）の明示的な上書き。省略時は `useVideoConfig()` が返す Composition
   * 全体尺にフォールバックする（`Citation.tsx` の `durationInFrames` props 注入パターンを踏襲）。
   * `<Sequence>` でラップされる場面（script-engine の title スライド等）では、`useVideoConfig()`
   * が返す Composition 全体尺と、その `<Sequence>` のローカル尺が一致しない（Remotion の仕様上
   * `useVideoConfig()` は常に Composition 全体尺を返す）。呼び出し元がローカル尺（例:
   * `span.durationInFrames`）をこの prop で明示することで、フェードアウトのフレーム相対性混用
   * （D-25: フェードアウト不発火）を解消する。
   */
  durationInFrames?: number;
};

const FADE_FRAMES = 15;

const containerStyle = (backgroundColor: string): CSSProperties => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor,
  padding: "48px",
  boxSizing: "border-box",
});

const titleStyle = (color: string): CSSProperties => ({
  fontSize: "96px",
  fontWeight: "bold",
  textAlign: "center",
  color,
  lineHeight: 1.2,
  marginBottom: "24px",
});

const subtitleStyle = (color: string): CSSProperties => ({
  fontSize: "48px",
  textAlign: "center",
  color,
  lineHeight: 1.4,
  opacity: 0.85,
});

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  backgroundColor = "#1a3a52",
  color = "#ffffff",
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  // D-25: useVideoConfig() は常に Composition 全体尺を返し、`<Sequence>` のローカル尺には
  // 追随しない（Remotion の仕様）。変数名を実体（Composition 全体尺）に合わせて明示する。
  const { durationInFrames: compositionDurationInFrames } = useVideoConfig();

  // props で明示的に渡された尺（呼び出し元の `<Sequence>` のローカル尺）があればそれを優先し、
  // 省略時は従来通り Composition 全体尺にフォールバックする（Citation.tsx と同じ props 注入
  // パターン、D-25 修正）。
  const effectiveDurationInFrames = durationInFrames ?? compositionDurationInFrames;

  // effectiveDurationInFrames <= FADE_FRAMES * 2（例: PDF still 用の 1 frame Composition）では
  // inputRange [0, 15, effectiveDurationInFrames - 15, effectiveDurationInFrames] が単調増加に
  // ならず interpolate が throw する。フェードが成立しない尺なので不透明度 1 で固定する
  // （通常尺では式が同一のため出力不変。outline-video-1 T12 の PDF 失敗で顕在化した latent crash）。
  const opacity =
    effectiveDurationInFrames <= FADE_FRAMES * 2
      ? 1
      : interpolate(
          frame,
          [
            0,
            FADE_FRAMES,
            effectiveDurationInFrames - FADE_FRAMES,
            effectiveDurationInFrames,
          ],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

  return (
    <div style={{ ...containerStyle(backgroundColor), opacity }}>
      <div style={titleStyle(color)}>{title}</div>
      {subtitle !== undefined && (
        <div style={subtitleStyle(color)}>{subtitle}</div>
      )}
    </div>
  );
};
