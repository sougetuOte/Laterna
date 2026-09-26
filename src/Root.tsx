import React from "react";
import { Composition } from "remotion";
import {
  ScriptComposition,
  calculateScriptMetadata,
  ScriptCompositionProps,
} from "./compositions/ScriptComposition";
import {
  ScriptPdfComposition,
  calculateScriptPdfMetadata,
  ScriptPdfCompositionProps,
  PDF_PAGE_WIDTH as SCRIPT_PDF_PAGE_WIDTH,
  PDF_PAGE_HEIGHT as SCRIPT_PDF_PAGE_HEIGHT,
} from "./compositions/ScriptPdfComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* W3-script-engine-T13: SpikeScriptComposition (T4) を置換した本実装 */}
      {/* defaultProps の scriptId は Studio 試写用の既定値（render CLI は明示 props を渡すため影響しない）。
          Laterna 切り出し時（docs/inventory.md §2.1 の 1）に java-vs-js へ変更 */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Composition<any, ScriptCompositionProps>
        id="ScriptComposition"
        component={ScriptComposition}
        calculateMetadata={calculateScriptMetadata}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={90}
        defaultProps={{ scriptId: "java-vs-js" }}
      />
      {/* W4-script-engine-T18: pdf-manifest 駆動の PDF 出力用汎用 Composition。
          width/height は ScriptPdfComposition.tsx が export する PDF_PAGE_WIDTH/PDF_PAGE_HEIGHT を
          使う（値は不変（1754x1240）だがマジックナンバーのハードコードを避ける）。 */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Composition<any, ScriptPdfCompositionProps>
        id="ScriptPdfComposition"
        component={ScriptPdfComposition}
        calculateMetadata={calculateScriptPdfMetadata}
        width={SCRIPT_PDF_PAGE_WIDTH}
        height={SCRIPT_PDF_PAGE_HEIGHT}
        fps={30}
        durationInFrames={1}
        defaultProps={{ scriptId: "java-vs-js" }}
      />
    </>
  );
};
