# outline.md — 「ソースから実行ファイルまで」（script-id: `source-to-exe`）

Wave 2 の 1 本目。`goal.md` Wave 2 の完了条件 3。台本は `content/scripts/source-to-exe.script.yaml`。

## 対象

- 高専 1 年、プログラミングの初回授業（2026-10-02）。**授業中に流す**（主人 2026-09-26）。
- 前提知識：なし。「プログラム」という言葉は知っているが、書いたことは無い学生を想定する。
- 授業で使う言語は **C（gcc）** と仮定して具体例を出す（`hello.c` → `a.exe`）。違う言語なら台本承認のときに直す。
- 使い方の想定：教員がこの動画を流したあと、実機で `gcc` を叩いて同じ流れを見せる。動画は「地図」、実機が「現場」。

## 尺

- 目標 **3〜5 分**（180〜300 秒。狙いは約 4 分）。
- 発話速度の実測（Kyozai の `speaker-profiles.yaml`）：解説役 約 420 文字/分、聞き役 約 340 文字/分。4 分なら合計 1,400〜1,600 文字。
- スライドは 6〜8 枚（1 枚 30〜45 秒）。図解は Flowchart 部品と bullets、コードは code スライド。画像は使わない（brief D9）。

## 章立て

1. **書いたのに、なぜそのまま動かない？**（導入、約 40 秒）
   聞き役の疑問「文字を書いたら、コンピュータはそれを読んで動くんじゃないの？」から入る。
   答えの予告：コンピュータ（CPU）が読めるのは「命令の数字」だけ。人が書いた文字は**翻訳**が要る。
2. **ソースコード ── 人が読む手紙**（約 50 秒）
   `hello.c` を見せる。「ソース（source）＝源、元」。人が読んで直せる形。拡張子 `.c`。
   ここでは「これは日本語や英語と同じ、人の言葉」と言い切る。
3. **翻訳係コンパイラ ── 4 つの段階**（約 80 秒）
   gcc の「コンパイルは最大 4 段階：前処理・コンパイル本体・アセンブル・リンク、必ずこの順」（出典 1）を柱にする。
   Flowchart で `hello.c → (前処理) → hello.i → (コンパイル) → hello.s → (アセンブル) → hello.o → (リンク) → a.exe`。
   各段階は 1 文ずつ：前処理＝`#include` を展開して 1 枚の紙にする／コンパイル＝人の言葉から CPU の言葉（アセンブリ）へ／
   アセンブル＝アセンブリを数字（機械語）へ／リンク＝`printf` などライブラリの部品とつないで 1 つの実行ファイルに。
   「`gcc -E`・`-S`・`-c` で途中の産物を見られる」（出典 1）を一言。授業で実演できる。
4. **実行ファイル ── CPU に渡す命令の束**（約 60 秒）
   `.exe` は Windows の PE 形式（出典 3）。中身は CPU が直接読む命令とデータ。ダブルクリックや `./a.exe` で OS がメモリに読み込んで CPU に渡す。
   エラーは 2 種類：翻訳で止まる「コンパイルエラー」（翻訳係が読めない）と、翻訳は通ったが動かすと起きる「実行時エラー」（意味が違う）。
   「エラーはどの段階で出たか」を見る癖を今日から付ける、と締める。
5. **まとめ**（約 30 秒）
   3 点：ソースは人の言葉／コンパイラが 4 段階で翻訳／実行ファイルは CPU の命令。次回予告：この翻訳係をどこで動かすか＝開発環境（CLI から VSCode まで）。

## 出典

1. GCC Manual, "3.2 Options Controlling the Kind of Output" (Overall Options) — https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html
   「Compilation can involve up to four stages: preprocessing, compilation proper, assembly and linking, always in that order.」
   `-E`（前処理で止める。出力は標準出力）、`-S`（コンパイル本体で止める。`.s`）、`-c`（アセンブルまで。`.o`）、既定の実行ファイル名 `a.out`（Windows の MinGW では `a.exe`）。
2. ISO/IEC 9899（C 言語規格）§5.1.1.2 Translation phases — 翻訳は 8 フェーズ（1〜4 が前処理、7 がコンパイル、8 がリンク）。
   参照した二次資料：cppreference "Phases of translation" — https://en.cppreference.com/w/c/language/translation_phases
   （台本では「規格上は 8 段階に分かれているが、gcc の見た目の 4 段階で説明する」と一言添えるかは尺次第。省いてもよい）
3. Microsoft Learn, "PE Format" — https://learn.microsoft.com/en-us/windows/win32/debug/pe-format
   「executable (image) files and object files under the Windows family of operating systems ... referred to as Portable Executable (PE) and Common Object File Format (COFF) files」。
   `.exe`・`.dll`・オブジェクトファイルが対象。先頭に MS-DOS スタブ（"This program cannot be run in DOS mode"）。
4. 発話速度と文体：`docs/conventions/narration-style.md`（ですます調、専門用語は初出で言い換え、まとめは 3 点以内、「簡単」「必ず」を使わない）。

## 台本の確認

- 台本ができたら「話し手／セリフ／スライド」の表で主人に見せ、承認をもらってから compile する（主人 2026-09-26）。
- 台本承認：（承認が出たら「台本承認：YYYY-MM-DD 主人」をここに書く）
