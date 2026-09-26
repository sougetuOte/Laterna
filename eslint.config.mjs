// eslint 9 flat config（Wave 2 検収で発覚したインフラ不備の解消）
// @remotion/eslint-config-flat 4.0.484 の既定 config をそのまま採用する。
// `config` は makeConfig({ remotionDir: undefined }) と同義（remotion ルール全域適用）。
import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  {
    rules: {
      // 日本語 JSX テキスト内の全角スペース（U+3000）は組版上の意図的表記
      // （KosenW12.tsx / slideRenderers.tsx 等の凍結資産に存在）。
      // 凍結資産を編集せずに済ませるため JSX テキストのみ検査対象から外す。
      "no-irregular-whitespace": ["error", { skipStrings: true, skipJSXText: true }],
    },
  },
];
