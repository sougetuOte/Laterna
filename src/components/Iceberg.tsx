import React from "react";

export type IcebergHighlight =
  | "seg-2"
  | "seg-3"
  | "seg-4"
  | "seg-5"
  | "seg-6"
  | "seg-7";

export interface IcebergProps {
  /** 氷山の下に表示する任意キャプション */
  caption?: string;
  /** 表示幅（px）。デフォルト 800 */
  width?: number;
  /** 該当 Seg の位置ガイド（オレンジ矢印 + 強調表示） */
  highlight?: IcebergHighlight;
}

/**
 * 氷山 SVG を表示する汎用コンポーネント。
 * 「実装は氷山の一角」メッセージを視覚化するために使用する。
 *
 * highlight prop で "seg-N" を指定すると、対応する氷山下部テキストの
 * 左側にオレンジ色の矢印（今ここ）を描画し、テキストを強調表示する。
 *
 * @example
 * <Iceberg width={600} caption="水面の上に実装、下に要件定義" />
 *
 * @example
 * <Iceberg width={900} highlight="seg-4" />
 */
export const Iceberg: React.FC<IcebergProps> = ({
  caption,
  width = 800,
  highlight,
}) => {
  // SVG の viewBox は 800x600 固定。width に合わせて height を等比計算する。
  const height = (width / 800) * 600;

  // Seg 対応の氷山下部テキスト定義（y 座標 60px 間隔、最終行のみメッセージボックス回避で微調整）
  const segItems: { key: IcebergHighlight; y: number; label: string }[] = [
    { key: "seg-2", y: 240, label: "情報の表現・データ型" },
    { key: "seg-3", y: 300, label: "プログラミング言語・アルゴリズム" },
    { key: "seg-4", y: 360, label: "要件定義・ユーザーヒアリング" },
    { key: "seg-5", y: 420, label: "仕様書・PM/SE・ウォーターフォール" },
    { key: "seg-6", y: 480, label: "制作・チーム・テスト・リリース" },
    { key: "seg-7", y: 525, label: "法律・運用" },
  ];

  // 強調時のスタイル
  const HIGHLIGHT_COLOR = "#c33";
  const NORMAL_COLOR = "#1a3a52";
  const ARROW_COLOR = "#ff8c00";

  return (
    <div style={{ display: "inline-block" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 600"
        width={width}
        height={height}
        fontFamily="sans-serif"
      >
        {/* 背景：空 */}
        <rect x={0} y={0} width={800} height={200} fill="#e8f0f5" />

        {/* 背景：水中 */}
        <rect x={0} y={200} width={800} height={400} fill="#6a9ec4" />

        {/* 水面ライン */}
        <line
          x1={0}
          y1={200}
          x2={800}
          y2={200}
          stroke="#1a3a52"
          strokeWidth={3}
        />
        <text
          x={20}
          y={195}
          fill="#1a3a52"
          fontSize={14}
          fontWeight="bold"
        >
          水面（見える仕事と見えない仕事の境界）
        </text>

        {/* 氷山の上部（水面の上） */}
        <polygon
          points="350,200 400,80 450,200"
          fill="#ffffff"
          stroke="#666"
          strokeWidth={2}
        />

        {/* 氷山上部ラベル */}
        <text
          x={400}
          y={130}
          textAnchor="middle"
          fill="#1a3a52"
          fontSize={16}
          fontWeight="bold"
        >
          実装
        </text>
        <text
          x={400}
          y={155}
          textAnchor="middle"
          fill="#1a3a52"
          fontSize={14}
        >
          （コーディング）
        </text>
        <text
          x={400}
          y={180}
          textAnchor="middle"
          fill="#666"
          fontSize={12}
        >
          ≒ 工数全体の15〜20%
        </text>

        {/* 矢印：学生が思う「プログラム開発」 */}
        <line
          x1={600}
          y1={120}
          x2={460}
          y2={120}
          stroke="#c33"
          strokeWidth={2}
          markerEnd="url(#arrowhead-red)"
        />
        <text x={610} y={115} fill="#c33" fontSize={12}>
          学生がイメージする
        </text>
        <text x={610} y={130} fill="#c33" fontSize={12}>
          「プログラム開発」
        </text>

        {/* 氷山の下部（水面の下） */}
        <polygon
          points="350,200 200,560 600,560 450,200"
          fill="#cee3ef"
          stroke="#444"
          strokeWidth={2}
        />

        {/* 氷山下部の項目たち（Seg 対応 6 個、highlight で強調切り替え） */}
        {segItems.map((item) => {
          const isHighlighted = highlight === item.key;
          return (
            <text
              key={item.key}
              x={400}
              y={item.y}
              textAnchor="middle"
              fill={isHighlighted ? HIGHLIGHT_COLOR : NORMAL_COLOR}
              fontSize={isHighlighted ? 17 : 14}
              fontWeight={isHighlighted ? "bold" : "normal"}
            >
              {item.label}
            </text>
          );
        })}

        {/* highlight 指定時：オレンジ矢印 + 「今ここ」ラベル */}
        {highlight &&
          (() => {
            const target = segItems.find((s) => s.key === highlight);
            if (!target) return null;
            return (
              <g>
                <line
                  x1={190}
                  y1={target.y - 5}
                  x2={260}
                  y2={target.y - 5}
                  stroke={ARROW_COLOR}
                  strokeWidth={5}
                  markerEnd="url(#arrowhead-orange)"
                />
                <text
                  x={100}
                  y={target.y + 4}
                  fill={ARROW_COLOR}
                  fontSize={24}
                  fontWeight="bold"
                >
                  今ここ
                </text>
              </g>
            );
          })()}

        {/* 矢印：実際の「システム開発」 */}
        <line
          x1={640}
          y1={390}
          x2={540}
          y2={390}
          stroke="#080"
          strokeWidth={2}
          markerEnd="url(#arrowhead-green)"
        />
        <rect
          x={646}
          y={374}
          width={124}
          height={30}
          rx={3}
          fill="#ffffff"
          opacity={0.9}
        />
        <text x={650} y={385} fill="#080" fontSize={12}>
          実際の
        </text>
        <text x={650} y={400} fill="#080" fontSize={12}>
          「システム開発」
        </text>

        {/* メッセージボックス（Seg テキストと重ならないよう y=560 に下げる） */}
        <rect
          x={50}
          y={560}
          width={700}
          height={35}
          rx={5}
          fill="#fff"
          opacity={0.9}
          stroke="#444"
        />
        <text
          x={400}
          y={578}
          textAnchor="middle"
          fill="#1a3a52"
          fontSize={14}
          fontWeight="bold"
        >
          コードが書けるだけでは戦えない。書ける上で「何ができるか」が問われる。
        </text>
        <text
          x={400}
          y={592}
          textAnchor="middle"
          fill="#666"
          fontSize={10}
        >
          高専・第12週 / プログラミング言語、要件定義とシステム開発、情報の表現
        </text>

        {/* 矢印マーカー定義 */}
        <defs>
          <marker
            id="arrowhead-red"
            markerWidth={10}
            markerHeight={10}
            refX={9}
            refY={3}
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#c33" />
          </marker>
          <marker
            id="arrowhead-green"
            markerWidth={10}
            markerHeight={10}
            refX={9}
            refY={3}
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#080" />
          </marker>
          <marker
            id="arrowhead-orange"
            markerWidth={10}
            markerHeight={10}
            refX={9}
            refY={3}
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#ff8c00" />
          </marker>
        </defs>

        {/* 波線（装飾） */}
        <path
          d="M 0 200 Q 50 195, 100 200 T 200 200 T 300 200 T 400 200 T 500 200 T 600 200 T 700 200 T 800 200"
          fill="none"
          stroke="#1a3a52"
          strokeWidth={1}
          opacity={0.5}
        />
      </svg>

      {/* キャプション */}
      {caption !== undefined && (
        <div
          style={{
            width,
            textAlign: "center",
            marginTop: 8,
            fontSize: 14,
            color: "#1a3a52",
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
};
