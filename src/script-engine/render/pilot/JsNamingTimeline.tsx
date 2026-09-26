import React from "react";

/**
 * java-vs-js パイロット台本 custom スライド「JsNamingTimeline」（props なし）。
 *
 * 出自: docs/specs/script-engine/tasks.md W3-script-engine-T14 /
 *   content/scripts/java-vs-js.script.yaml（slide-timeline）
 * 下絵: materials/java-vs-js/js-naming-timeline.svg（忠実再現は不要、design §2.6 に基づき
 *   1920x1080 フルスクリーン座標系へ再構成した）
 *
 * 1995 年の Mocha → LiveScript → JavaScript の改名経緯と、同年の Java ブームが
 * 改名（あやかり）の動機だったことを 1 枚で示す年表。
 */

const BG_COLOR = "#f5f2ec";
const JAVA_COLOR = "#2c5878";

const steps: { label: string; sub: string; date: string; color: string; textColor: string }[] = [
  { label: "Mocha", sub: "約10日間で誕生", date: "1995年5月頃", color: "#8a6d3b", textColor: "#f0e6d6" },
  { label: "LiveScript", sub: "ベータ版で公開", date: "1995年9月", color: "#5b7a5e", textColor: "#e2ecdf" },
  { label: "JavaScript", sub: "サンと提携し改名", date: "1995年12月", color: "#b8452c", textColor: "#f4ddd5" },
];

const STEP_X = [340, 960, 1580];
const AXIS_Y = 760;

export const JsNamingTimeline: React.FC = () => {
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

        <text x={960} y={100} textAnchor="middle" fill="#1a3a52" fontSize={58} fontWeight="bold">
          1995年、名前はこうして決まった
        </text>

        {/* 上段: Java レーン */}
        <rect x={100} y={160} width={1720} height={200} rx={16} fill="#e8f0f5" stroke={JAVA_COLOR} strokeWidth={3} />
        <text x={140} y={222} fill={JAVA_COLOR} fontSize={32} fontWeight="bold">
          サン・マイクロシステムズ
        </text>
        <rect x={140} y={244} width={400} height={90} rx={12} fill={JAVA_COLOR} />
        <text x={340} y={288} textAnchor="middle" fill="#ffffff" fontSize={32} fontWeight="bold">
          Java 正式発表
        </text>
        <text x={340} y={320} textAnchor="middle" fill="#cfe0ec" fontSize={22}>
          1995年5月
        </text>
        <rect x={600} y={258} width={1140} height={60} rx={30} fill="#c9a227" opacity={0.85} />
        <text x={1170} y={298} textAnchor="middle" fill="#ffffff" fontSize={28} fontWeight="bold">
          Java 大ブーム（業界の話題を独占）
        </text>

        {/* 下段: Netscape レーン */}
        <rect x={100} y={440} width={1720} height={420} rx={16} fill="#ffffff" stroke="#666666" strokeWidth={3} />
        <text x={140} y={500} fill="#555555" fontSize={32} fontWeight="bold">
          ネットスケープ社（ブレンダン・アイク）
        </text>

        <line x1={200} y1={AXIS_Y} x2={1720} y2={AXIS_Y} stroke="#999999" strokeWidth={4} />

        {steps.map((step, i) => {
          const x = STEP_X[i];
          return (
            <g key={step.label}>
              <circle cx={x} cy={AXIS_Y} r={16} fill={step.color} />
              <rect x={x - 160} y={AXIS_Y - 140} width={320} height={100} rx={14} fill={step.color} />
              <text x={x} y={AXIS_Y - 95} textAnchor="middle" fill="#ffffff" fontSize={32} fontWeight="bold">
                {step.label}
              </text>
              <text x={x} y={AXIS_Y - 60} textAnchor="middle" fill={step.textColor} fontSize={20}>
                {step.sub}
              </text>
              <text x={x} y={AXIS_Y + 50} textAnchor="middle" fill="#666666" fontSize={24}>
                {step.date}
              </text>
            </g>
          );
        })}

        <line
          x1={STEP_X[0] + 176}
          y1={AXIS_Y}
          x2={STEP_X[1] - 176}
          y2={AXIS_Y}
          stroke="#666666"
          strokeWidth={4}
          markerEnd="url(#js-timeline-arrow)"
        />
        <line
          x1={STEP_X[1] + 176}
          y1={AXIS_Y}
          x2={STEP_X[2] - 176}
          y2={AXIS_Y}
          stroke="#666666"
          strokeWidth={4}
          markerEnd="url(#js-timeline-arrow)"
        />

        {/* あやかり改名の点線矢印（Java ブーム → JavaScript） */}
        <path
          d={`M 1440 320 Q 1620 460 1580 600`}
          fill="none"
          stroke="#b8452c"
          strokeWidth={5}
          strokeDasharray="14,10"
          markerEnd="url(#js-timeline-arrow-red)"
        />
        <text x={1680} y={430} textAnchor="middle" fill="#b8452c" fontSize={28} fontWeight="bold">
          流行にあやかって
        </text>
        <text x={1680} y={466} textAnchor="middle" fill="#b8452c" fontSize={28} fontWeight="bold">
          改名（宣伝目的）
        </text>

        <text x={960} y={1010} textAnchor="middle" fill="#888888" fontSize={26}>
          言語の中身は Mocha の時点からずっと別物。変わったのは名前だけ。
        </text>

        <defs>
          <marker id="js-timeline-arrow" markerWidth={10} markerHeight={8} refX={9} refY={4} orient="auto">
            <polygon points="0 0, 10 4, 0 8" fill="#666666" />
          </marker>
          <marker id="js-timeline-arrow-red" markerWidth={10} markerHeight={8} refX={9} refY={4} orient="auto">
            <polygon points="0 0, 10 4, 0 8" fill="#b8452c" />
          </marker>
        </defs>
      </svg>
    </div>
  );
};
