import React from "react";

export type FlowchartNodeType =
  | "start"
  | "end"
  | "process"
  | "decision"
  | "io"
  | "loop";

export type FlowchartNode = {
  id: string;
  type: FlowchartNodeType;
  label: string;
  x: number;
  y: number;
};

export type FlowchartEdge = {
  from: string;
  to: string;
  label?: string;
};

export type FlowchartProps = {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  width?: number;
  height?: number;
  highlightId?: string;
};

// ノードタイプごとの標準サイズ
const NODE_SIZE: Record<FlowchartNodeType, { w: number; h: number }> = {
  start:    { w: 140, h: 60 },
  end:      { w: 140, h: 60 },
  process:  { w: 140, h: 60 },
  decision: { w: 120, h: 80 },
  io:       { w: 140, h: 60 },
  loop:     { w: 140, h: 60 },
};

const COLOR_DEFAULT_FILL   = "#d9eaf7";
const COLOR_DEFAULT_STROKE = "#2c5878";
const COLOR_HIGHLIGHT_FILL   = "#fff3cd";
const COLOR_HIGHLIGHT_STROKE = "#ff6b35";
const STROKE_WIDTH_DEFAULT   = 2;
const STROKE_WIDTH_HIGHLIGHT = 4;
const FONT_SIZE = 14;
const FONT_FAMILY = "sans-serif";

/** ノードの中心座標を返す（x, y は中心で定義）。*/
function getCenter(node: FlowchartNode): { cx: number; cy: number } {
  return { cx: node.x, cy: node.y };
}

/** ノードシェイプを描画する。x, y はノード中心。*/
function NodeShape({
  node,
  highlighted,
}: {
  node: FlowchartNode;
  highlighted: boolean;
}): React.ReactElement {
  const { cx, cy } = getCenter(node);
  const { w, h } = NODE_SIZE[node.type];
  const fill   = highlighted ? COLOR_HIGHLIGHT_FILL   : COLOR_DEFAULT_FILL;
  const stroke = highlighted ? COLOR_HIGHLIGHT_STROKE : COLOR_DEFAULT_STROKE;
  const strokeWidth = highlighted ? STROKE_WIDTH_HIGHLIGHT : STROKE_WIDTH_DEFAULT;

  let shape: React.ReactElement;
  switch (node.type) {
    case "start":
    case "end": {
      // 横長楕円 (JIS X 0121: 端子記号)
      shape = (
        <ellipse
          cx={cx}
          cy={cy}
          rx={w / 2}
          ry={h / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
      break;
    }
    case "process": {
      // 長方形 (JIS X 0121: 処理記号)
      shape = (
        <rect
          x={cx - w / 2}
          y={cy - h / 2}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
      break;
    }
    case "decision": {
      // ひし形 (JIS X 0121: 判断記号)
      const pts = [
        `${cx},${cy - h / 2}`,
        `${cx + w / 2},${cy}`,
        `${cx},${cy + h / 2}`,
        `${cx - w / 2},${cy}`,
      ].join(" ");
      shape = (
        <polygon
          points={pts}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
      break;
    }
    case "io": {
      // 平行四辺形 (JIS X 0121: 入出力記号)
      const offset = 16;
      const x1 = cx - w / 2, y1 = cy - h / 2;
      const x2 = cx + w / 2, y2 = cy + h / 2;
      const pts = [
        `${x1 + offset},${y1}`,
        `${x2},${y1}`,
        `${x2 - offset},${y2}`,
        `${x1},${y2}`,
      ].join(" ");
      shape = (
        <polygon
          points={pts}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
      break;
    }
    case "loop": {
      // 六角形 (JIS X 0121: ループ端記号)
      const indent = 20;
      const x1 = cx - w / 2, y1 = cy - h / 2;
      const x2 = cx + w / 2, y2 = cy + h / 2;
      const pts = [
        `${x1 + indent},${y1}`,
        `${x2 - indent},${y1}`,
        `${x2},${cy}`,
        `${x2 - indent},${y2}`,
        `${x1 + indent},${y2}`,
        `${x1},${cy}`,
      ].join(" ");
      shape = (
        <polygon
          points={pts}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
      break;
    }
  }

  // ラベルテキスト（複数行対応: "\n" で分割）
  const lines = node.label.split("\n");
  const lineHeight = FONT_SIZE + 4;
  const totalTextH = lines.length * lineHeight;
  const textStartY = cy - totalTextH / 2 + FONT_SIZE;

  return (
    <g>
      {shape}
      {lines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={textStartY + i * lineHeight}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize={FONT_SIZE}
          fontFamily={FONT_FAMILY}
          fill="#1a3a52"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/** エッジ（矢印）を描画する。from/to ノードの中心を直線で結ぶ。*/
function EdgeArrow({
  fromNode,
  toNode,
  label,
  markerId,
}: {
  fromNode: FlowchartNode;
  toNode: FlowchartNode;
  label?: string;
  markerId: string;
}): React.ReactElement {
  const { cx: x1, cy: y1 } = getCenter(fromNode);
  const { cx: x2, cy: y2 } = getCenter(toNode);

  // エッジの中点にラベルを配置する
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  return (
    <g>
      <path
        d={`M ${x1},${y1} L ${x2},${y2}`}
        fill="none"
        stroke={COLOR_DEFAULT_STROKE}
        strokeWidth={STROKE_WIDTH_DEFAULT}
        markerEnd={`url(#${markerId})`}
      />
      {label != null && label !== "" && (
        <text
          x={mx + 6}
          y={my - 6}
          fontSize={FONT_SIZE - 2}
          fontFamily={FONT_FAMILY}
          fill="#555"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/**
 * JIS X 0121 準拠のフローチャートを描画するコンポーネント。
 *
 * @example
 * <Flowchart
 *   nodes={[
 *     { id: "s", type: "start",   label: "開始",   x: 350, y: 60  },
 *     { id: "p", type: "process", label: "処理",   x: 350, y: 160 },
 *     { id: "e", type: "end",     label: "終了",   x: 350, y: 260 },
 *   ]}
 *   edges={[
 *     { from: "s", to: "p" },
 *     { from: "p", to: "e" },
 *   ]}
 *   width={700}
 *   height={320}
 *   highlightId="p"
 * />
 */
export const Flowchart: React.FC<FlowchartProps> = ({
  nodes,
  edges,
  width = 700,
  height = 500,
  highlightId,
}) => {
  // ノード ID → ノードの高速引き当て
  const nodeMap = React.useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  // 矢じりマーカーの ID（SVG 内で一意にするため width/height から生成）
  const markerId = `arrowhead-fc-${width}-${height}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fontFamily={FONT_FAMILY}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth={10}
          markerHeight={10}
          refX={9}
          refY={3}
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill={COLOR_DEFAULT_STROKE} />
        </marker>
      </defs>

      {/* エッジを先に描画してノードに隠れるようにする */}
      {edges.map((edge, i) => {
        const fromNode = nodeMap.get(edge.from);
        const toNode   = nodeMap.get(edge.to);
        if (fromNode == null || toNode == null) return null;
        return (
          <EdgeArrow
            key={i}
            fromNode={fromNode}
            toNode={toNode}
            label={edge.label}
            markerId={markerId}
          />
        );
      })}

      {/* ノードをエッジの上に描画 */}
      {nodes.map((node) => (
        <NodeShape
          key={node.id}
          node={node}
          highlighted={node.id === highlightId}
        />
      ))}
    </svg>
  );
};
