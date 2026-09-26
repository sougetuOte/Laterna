import React from "react";

/**
 * java-vs-js パイロット台本 custom スライド「JavaJsCompare」。
 *
 * 出自: docs/specs/script-engine/tasks.md W3-script-engine-T14 /
 *   content/scripts/java-vs-js.script.yaml（slide-compare-intro / slide-compare-full）
 * 下絵: materials/java-vs-js/java-js-compare.svg（忠実再現は不要、design §2.6:
 *   「忠実再現を目的とせず、標準タイプ・custom タイプへの再構成を許容」に基づき
 *   1920x1080 フルスクリーン座標系へ再構成した）
 *
 * Java（左）と JavaScript（右）の対比カードを並置し、「名前が似ているだけの別物」を視覚化する。
 * `stage="intro"` ではカードのタイトル（言語名）のみを見せ、`stage="full"` で特徴リストを開示する
 * 2 段階利用を想定（台本コメント参照）。
 */
export interface JavaJsCompareProps {
  stage: "intro" | "full";
}

const BG_COLOR = "#f5f2ec";
const JAVA_COLOR = "#2c5878";
const JS_COLOR = "#b8452c";
const VS_COLOR = "#c9a227";

const CARD_Y = 220;
const CARD_W = 720;
const CARD_H = 640;
const CARD_HEADER_H = 140;

const javaFeatures = [
  "1995年　サン・マイクロシステムズ",
  "型をきっちり決めてから動かす",
  "大きなシステム・業務アプリ向け",
  "専用の実行環境（JVM）の上で動く",
];

const jsFeatures = [
  "1995年　ネットスケープ社",
  "動かしながら気軽に書ける",
  "Webページ・ブラウザ向け",
  "ブラウザがあればどこでも動く",
];

function Card({
  x,
  color,
  title,
  features,
  showFeatures,
}: {
  x: number;
  color: string;
  title: string;
  features: string[];
  showFeatures: boolean;
}): React.ReactElement {
  return (
    <g>
      <rect
        x={x}
        y={CARD_Y}
        width={CARD_W}
        height={CARD_H}
        rx={24}
        fill="#ffffff"
        stroke={color}
        strokeWidth={5}
      />
      <rect x={x} y={CARD_Y} width={CARD_W} height={CARD_HEADER_H} rx={24} fill={color} />
      <rect
        x={x}
        y={CARD_Y + CARD_HEADER_H - 40}
        width={CARD_W}
        height={40}
        fill={color}
      />
      <text
        x={x + CARD_W / 2}
        y={CARD_Y + CARD_HEADER_H / 2 + 18}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={56}
        fontWeight="bold"
      >
        {title}
      </text>
      {showFeatures &&
        features.map((line, i) => (
          <text
            key={line}
            x={x + CARD_W / 2}
            y={CARD_Y + CARD_HEADER_H + 100 + i * 70}
            textAnchor="middle"
            fill={i === features.length - 1 ? "#666666" : "#333333"}
            fontSize={i === features.length - 1 ? 28 : 32}
          >
            {line}
          </text>
        ))}
    </g>
  );
}

export const JavaJsCompare: React.FC<JavaJsCompareProps> = ({ stage }) => {
  const showFeatures = stage === "full";

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: BG_COLOR,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1920 1080"
        width={1920}
        height={1080}
        fontFamily="sans-serif"
      >
        <rect x={0} y={0} width={1920} height={1080} fill={BG_COLOR} />

        <text
          x={960}
          y={120}
          textAnchor="middle"
          fill="#1a3a52"
          fontSize={64}
          fontWeight="bold"
        >
          JavaとJavaScript、どう違う？
        </text>

        <Card x={140} color={JAVA_COLOR} title="Java" features={javaFeatures} showFeatures={showFeatures} />
        <Card
          x={1060}
          color={JS_COLOR}
          title="JavaScript"
          features={jsFeatures}
          showFeatures={showFeatures}
        />

        <circle cx={960} cy={CARD_Y + CARD_H / 2} r={64} fill={VS_COLOR} />
        <text
          x={960}
          y={CARD_Y + CARD_H / 2 + 16}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={42}
          fontWeight="bold"
        >
          VS
        </text>

        <text
          x={960}
          y={990}
          textAnchor="middle"
          fill="#1a3a52"
          fontSize={38}
          fontWeight="bold"
        >
          似ているのは名前だけ ——「メロンとメロンパン」くらい別物
        </text>
      </svg>
    </div>
  );
};
