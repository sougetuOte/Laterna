# 概要欄 ── Pythonが動くまで（Laterna 3 本目、script-id: `python-runs`）

動画の概要欄・配布ページに貼る文面。`goal.md` Wave 4 の完了条件 4。出典は `outline.md` の「出典」節と同じ。

## 内容紹介

プログラムを書いたことがない人に向けて、解説役と聞き役の掛け合いで「Python で書いたプログラムが、コンピュータの中でどう動いているのか」を追いかけます。
CPU が読めるのは機械語だけであること、翻訳のやり方にはコンパイラ（全部訳してから渡す）とインタプリタ（読みながらその場で動かす）があること、そして Python（CPython）が「バイトコードに訳してから、仮想マシンで 1 つずつ動かす」2 段階で動いていることを、実際のバイトコードやエラーの画面で確かめます。
後半では、Python が Windows・macOS・Linux のどれでも動かしやすい理由、インタプリタを速くする工夫（取っておく・JIT・重い計算は C に任せる）を紹介し、最後にコンパイラ型とインタプリタ型を表で比べます。

- 対象：普通科高校 1 年くらい・プログラムを書いたことがない人。授業中に流す想定
- 尺：約 8 分 32 秒（manifest の値 512.3 秒）
- 画面のコードと実行結果は Python 3.11.9（Windows）で動かした物です。バイトコードの中身は Python の版によって変わることがあります
- 復習用 PDF（20 ページ、A4 縦）を同じ台本から書き出しています

## 出典

1. Python Glossary（"bytecode"・"interpreted"・"CPython"）── https://docs.python.org/3/glossary.html
2. The Python Language Reference, "1. Introduction"（CPython は C で書かれている、ほかの処理系）── https://docs.python.org/3/reference/introduction.html
3. Python Library, `dis`（バイトコードは版で変わりうる）── https://docs.python.org/3/library/dis.html
4. Python Tutorial, "Modules" の "Compiled Python files"（`__pycache__` と `.pyc`）── https://docs.python.org/3/tutorial/modules.html 、PEP 3147 ── https://peps.python.org/pep-3147/
5. Python Tutorial, "Using the Python Interpreter"（対話モード）── https://docs.python.org/3/tutorial/interpreter.html
6. Python Tutorial, "Errors and Exceptions" ── https://docs.python.org/3/tutorial/errors.html 、The Python Language Reference, "Execution model" ── https://docs.python.org/3/reference/executionmodel.html
7. Microsoft Learn, "PE Format" ── https://learn.microsoft.com/en-us/windows/win32/debug/pe-format
8. Linux man-pages, elf(5) ── https://man7.org/linux/man-pages/man5/elf.5.html
9. Python.org, Downloads ── https://www.python.org/downloads/ 、"Using Python on Unix platforms" ── https://docs.python.org/3/using/unix.html
10. The Java Virtual Machine Specification, Java SE 21, Chapter 1 ── https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-1.html
11. PHP Manual, "Introduction" ── https://www.php.net/manual/en/introduction.php
12. Python Library, `os`（`os.sep`）── https://docs.python.org/3/library/os.html
13. PyPy ── https://pypy.org/
14. What's New In Python 3.13（実験的な JIT）── https://docs.python.org/3/whatsnew/3.13.html 、PEP 744 ── https://peps.python.org/pep-0744/
15. What's New In Python 3.14（公式版の JIT は既定で無効）── https://docs.python.org/3/whatsnew/3.14.html
16. NumPy, "What is NumPy?" ── https://numpy.org/doc/stable/user/whatisnumpy.html
17. GCC Manual, "Overall Options"（コンパイラの流れ）── https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html

### 画像（2026-10-03 に追加。記録は `materials/python-runs/images.md`）

- CPU の現物の写真：blickpixel（Pixabay）、CC0 1.0。Wikimedia Commons「File:Cpu_1.jpg」 https://commons.wikimedia.org/wiki/File:Cpu_1.jpg の縮小版
- Python の公式サイトのダウンロードのページの画面写し：Python Software Foundation、https://www.python.org/downloads/ （2026-10-03 取得）。著作権法 32 条の引用として載せています（切り抜き以外の加工なし）。**CC BY 4.0 の対象ではありません。**

## クレジット

- 音声合成：VOICEVOX（https://voicevox.hiroshiba.jp/）
  - 解説役：VOICEVOX:玄野武宏
  - 聞き役：VOICEVOX:ずんだもん
  - 各キャラクターの音声の利用条件は、それぞれの利用規約に従います。**音声は下記 CC BY 4.0 の対象ではありません。**
- 立ち絵：Laterna オリジナル（Laterna の画像環境 imagegen、FLUX.2 [klein] 4B で生成。記録は `materials/portraits/`）
- 図解：コードで描画（Remotion／React。台本ごとの部品 `RunFlow`・`CompareTable`）。第三者の画像は上の「画像」の 2 点だけで、音楽・効果音は使っていません
- 制作：Remotion（https://www.remotion.dev/）で書き出し
- ライセンス：台本・図解・教材本文（この動画の Laterna 側の著作物）は CC BY 4.0（`LICENSE-CONTENT`）。コードは MIT（`LICENSE`）。VOICEVOX の音声と第三者素材（上の画像 2 点）は対象外
