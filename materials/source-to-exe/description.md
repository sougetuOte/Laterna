# 概要欄 ── ソースから実行ファイルまで（Laterna 1 本目、script-id: `source-to-exe`）

動画の概要欄・配布ページに貼る文面。`goal.md` Wave 2 の完了条件 6。出典は `outline.md` の「出典」節と同じ。

## 内容紹介

プログラムを「書いた」あと、それがコンピュータで「動く」までに何が起きているかを、解説役と聞き役の掛け合いで追いかけます。
人が読めるソースコード（hello.c）は、CPU にはそのまま読めません。翻訳係であるコンパイラ（gcc）が「前処理・コンパイル・アセンブル・リンク」の 4 段階で翻訳し、CPU が直接読める命令の束＝実行ファイル（.exe）を作ります。
最後に、失敗の 2 種類（翻訳の途中で止まるコンパイルエラーと、翻訳は通ったのに思ったとおりに動かない実行時エラー）を紹介し、「エラーが出たら、どの段階で止まったかをまず見る」という癖づけで締めます。

- 対象：高専 1 年、プログラミングの初回授業（授業中に流す）
- 尺：約 4 分 46 秒（実測 285.8 秒）
- 復習用 PDF（10 ページ）を同じ台本から書き出しています

## 出典

1. GCC Manual, "3.2 Options Controlling the Kind of Output"（Overall Options）── https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html
   「Compilation can involve up to four stages: preprocessing, compilation proper, assembly and linking, always in that order.」／`-E`・`-S`・`-c` で途中の段階で止められる
2. ISO/IEC 9899（C 言語規格）§5.1.1.2 Translation phases。参照した二次資料：cppreference "Phases of translation" ── https://en.cppreference.com/w/c/language/translation_phases
3. Microsoft Learn, "PE Format" ── https://learn.microsoft.com/en-us/windows/win32/debug/pe-format（Windows の実行ファイル .exe と .dll、オブジェクトファイルの形式）

## クレジット

- 音声合成：VOICEVOX（https://voicevox.hiroshiba.jp/）
  - 解説役：VOICEVOX:玄野武宏
  - 聞き役：VOICEVOX:ずんだもん
  - 各キャラクターの音声の利用条件は、それぞれの利用規約に従います。**音声は下記 CC BY 4.0 の対象ではありません。**
- 立ち絵：Laterna オリジナル（Laterna の画像環境 imagegen、FLUX.2 [klein] 4B で生成。記録は `materials/portraits/`）
- 図解：コードで描画（Remotion／React。台本ごとの部品 `PipelineFlow`）。第三者の画像・写真・音楽・効果音は使っていません
- 制作：Remotion（https://www.remotion.dev/）で書き出し
- ライセンス：台本・図解・教材本文（この動画の Laterna 側の著作物）は CC BY 4.0（`LICENSE-CONTENT`）。コードは MIT（`LICENSE`）。VOICEVOX の音声と第三者素材は対象外
