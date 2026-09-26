import React, { ReactNode, CSSProperties } from "react";

export type SlideProps = {
  title: string;
  body: ReactNode;
  backgroundColor?: string;
  textColor?: string;
};

const containerStyle = (backgroundColor: string): CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  backgroundColor,
  padding: "48px",
  boxSizing: "border-box",
});

const titleStyle: CSSProperties = {
  fontSize: "48px",
  fontWeight: "bold",
  marginBottom: "32px",
  textAlign: "center",
  color: "#111111",
};

const bodyStyle: CSSProperties = {
  fontSize: "28px",
  textAlign: "center",
  color: "#333333",
  lineHeight: 1.6,
};

export const Slide: React.FC<SlideProps> = ({
  title,
  body,
  backgroundColor = "#ffffff",
  textColor,
}) => {
  const resolvedTitleStyle: CSSProperties = textColor
    ? { ...titleStyle, color: textColor }
    : titleStyle;
  const resolvedBodyStyle: CSSProperties = textColor
    ? { ...bodyStyle, color: textColor }
    : bodyStyle;
  return (
    <div style={containerStyle(backgroundColor)}>
      <div style={resolvedTitleStyle}>{title}</div>
      <div style={resolvedBodyStyle}>{body}</div>
    </div>
  );
};
