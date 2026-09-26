import React, { CSSProperties } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export type CitationItem = {
  /** 省庁名（例: "個人情報保護委員会"）*/
  organization: string;
  /** 短縮 URL（例: "ppc.go.jp"）*/
  url: string;
};

export type CitationProps = {
  /** 出典の配列 */
  items: CitationItem[];
  /** 表示位置（デフォルト: "bottom-left"）*/
  position?: "bottom-left" | "bottom-right";
  /** 背景ボックスの透明度（デフォルト: 0.85）*/
  opacity?: number;
  /** 表示フレーム数（省略時は親 Sequence 全体）*/
  durationInFrames?: number;
};

const FADE_FRAMES = 15;

const wrapperStyle = (
  position: "bottom-left" | "bottom-right"
): CSSProperties => ({
  position: "absolute",
  bottom: "5%",
  left: position === "bottom-left" ? "3%" : undefined,
  right: position === "bottom-right" ? "3%" : undefined,
});

const boxStyle = (opacity: number, boxOpacity: number): CSSProperties => ({
  backgroundColor: `rgba(0, 0, 0, ${opacity * 0.55 * boxOpacity})`,
  borderRadius: "6px",
  padding: "10px 16px",
  display: "inline-block",
});

const labelStyle: CSSProperties = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "rgba(255, 255, 255, 0.75)",
  marginBottom: "4px",
  letterSpacing: "0.05em",
};

const itemStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "8px",
  marginTop: "2px",
};

const organizationStyle: CSSProperties = {
  fontSize: "26px",
  fontWeight: "normal",
  color: "rgba(255, 255, 255, 0.85)",
};

const urlStyle: CSSProperties = {
  fontSize: "22px",
  fontWeight: "normal",
  color: "rgba(200, 210, 220, 0.80)",
};

export const Citation: React.FC<CitationProps> = ({
  items,
  position = "bottom-left",
  opacity = 0.85,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: sequenceDuration } = useVideoConfig();

  const totalFrames = durationInFrames ?? sequenceDuration;

  const fadeInOpacity = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOutOpacity = interpolate(
    frame,
    [totalFrames - FADE_FRAMES, totalFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const compositeOpacity = Math.min(fadeInOpacity, fadeOutOpacity);

  return (
    <div style={wrapperStyle(position)}>
      <div style={boxStyle(opacity, compositeOpacity)}>
        <div style={labelStyle}>【出典】</div>
        {items.map((item) => (
          <div key={item.url} style={itemStyle}>
            <span style={organizationStyle}>{item.organization}</span>
            <span style={urlStyle}>{item.url}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
