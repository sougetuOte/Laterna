// eslint 9 flat config（Wave 2 検収で発覚したインフラ不備の解消）
// @remotion/eslint-config-flat 4.0.484 の既定 config をそのまま採用する。
// `config` は makeConfig({ remotionDir: undefined }) と同義（remotion ルール全域適用）。
import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  {
    rules: {
      // 日本語の全角スペース（U+3000）は組版上の意図的な表記（例：JavaJsCompare.tsx の「1995年　…」）。
      // 文字列は既定で検査外。JSX テキストに書いた場合も同じ扱いにする。
      "no-irregular-whitespace": ["error", { skipStrings: true, skipJSXText: true }],
    },
  },
];
