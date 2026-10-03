# outline.md — 「Pythonが動くまで」（script-id: `python-runs`）

Wave 4 の 3 本目。契約は `goal.md` の Wave 4 節。台本は `content/scripts/python-runs.script.yaml`。

## 対象

- **汎用**。普通科高校 1 年・プログラム経験なしを前提にする（主人 2026-09-28）。授業中に流す。
- 最初に使うのは専門学校 1 年の後期（半年ほど簡単な文法を習った学生）。高専で流すこともある。**動画・PDF・概要欄に学校名は出さない。**
- 前提知識：「プログラム」という言葉は知っている。CPU・機械語・コンパイラという言葉は初めて聞く、と仮定する。
- 画面に出すコードと実行結果は、この機械の **Python 3.11.9**（Windows）で実際に動かした物を写す（主人 2026-09-28：3.11 のままでよい）。版をスライドに書く。

## 尺

- 目標 **8〜10 分**（`target_duration_range` 480〜600 秒）。狙いは約 550 秒。
- 2 本目（about-c）は 3,329 字で 546 秒だった。同じくらいの 3,100〜3,400 字を目安にする。
- 図解は `src/script-engine/render/python-runs/` の custom 部品 2 つ（流れの図 `RunFlow`・比べる表 `CompareTable`）。コードは code スライド。画像は使わない。

## 章立て

1. **導入：書いたらすぐ動く？**（約 30 秒）
   聞き役の疑問「Python は書いて実行するとすぐ動く。何か特別なことをしているの？」から入る。
2. **CPU は機械語しか読めない**（約 50 秒）
   CPU が直接読めるのは 0 と 1 の機械語だけ。`print` も `+` も CPU には文字。翻訳係が要る。（付け足し 1）
3. **翻訳の 2 つのやり方**（約 100 秒）
   コンパイラ＝本の翻訳（全部訳して実行ファイルを渡す。C 言語）。インタプリタ＝同時通訳（読みながらその場で動かす）。
   流れを並べた図。コンパイラかインタプリタかは、言語ではなく処理系（動かす道具）の作り方で決まる。同じ Python にも処理系が複数ある（出典 2・3）。
4. **Python は実は「両方」**（約 120 秒）
   公式も「境目はあいまい」と言う（出典 1）。CPython はまず全体をバイトコードに訳し、仮想マシン（ソフトで作った架空の CPU）が 1 つずつ実行する（出典 1）。
   `dis` でバイトコードをのぞく（3.11.9 の実例。中身は版で変わる、出典 4）。import した部品は `__pycache__` に `.pyc` で取っておかれ、直接動かしたファイルは毎回訳し直す（出典 5）。
   対話モード `>>>`：1 行ずつその場で動く（出典 6。付け足し 3）。
5. **エラーの出る時期**（約 70 秒）
   3 行目で名前を間違えた例は 1・2 行目が表示されてから止まる（NameError、実行中に見つかる「例外」）。3 行目でかっこを閉じ忘れた例は 1 行も表示されずに止まる（SyntaxError）。
   「動く前か、動いている途中か」を見る。（付け足し 2。出典 7・8 と、この機械での実行）
6. **なぜ OS を選ばないのか**（約 90 秒）
   コンパイラが作る実行ファイルは OS ごとに形式が違う（Windows は PE、Linux などは ELF、出典 9・10）。
   Python 本体（CPython）は C で書かれていて（出典 2）、Windows・macOS・Linux 向けに用意されている（出典 11）。書いたプログラムは同じ物を渡せばよい。
   Java もバイトコードと仮想マシンで同じ考え方（出典 12）。PHP は Web のサーバー側でよく使われる仲間、の一言（出典 13）。
   ただし完全に同じではない：ファイルの場所の区切り文字は Windows と他で違う（出典 14）。
7. **速さの代償と高速化**（約 80 秒）
   1 命令ずつ読むぶん遅くなりがち。工夫は 3 つ：取っておく（`.pyc`、出典 5）／JIT（何度も通る所を実行中に機械語へ。PyPy、出典 15。CPython は 3.13 から試験的、3.14 の公式版に入ったが既定では無効、出典 16・17）／重い計算は C に任せる（NumPy、出典 18）。
   コンパイラ化の道具（Cython など）には踏み込まない（主人 2026-09-28）。
8. **比べる表とまとめ**（約 50 秒）
   表：動かす速さ／書いてすぐ試せる／いろいろな OS で動かしやすい／間違いが見つかる時期。（付け足し 5）
   まとめ 3 点：CPU は機械語だけ・翻訳係が要る／Python はバイトコードに訳して仮想マシンで動かす 2 段階／エラーは「動く前か途中か」を見る。

## 出典

2026-09-28 に取得して HTTP 200 を確かめた（取得は node の `fetch`。docs.python.org/3/ は 3.14.7 の文書を返した）。

1. Python Glossary — https://docs.python.org/3/glossary.html
   "bytecode"：「Python source code is compiled into bytecode, the internal representation of a Python program in the CPython interpreter.」「This "intermediate language" is said to run on a virtual machine that executes the machine code corresponding to each bytecode.」
   "interpreted"：「Python is an interpreted language, as opposed to a compiled one, though the distinction can be blurry because of the presence of the bytecode compiler.」
2. The Python Language Reference, "1. Introduction" — https://docs.python.org/3/reference/introduction.html
   「CPython This is the original and most-maintained implementation of Python, written in C.」
3. 同上 "1.1 Alternate Implementations" — https://docs.python.org/3/reference/introduction.html
   「Though there is one Python implementation which is by far the most popular, there are some alternate implementations」（Jython「Python implemented in Java.」、PyPy など）。
4. Python Library, `dis` — https://docs.python.org/3/library/dis.html
   「Bytecode is an implementation detail of the CPython interpreter. No guarantees are made that bytecode will not be added, removed, or changed between versions of Python.」
5. Python Tutorial, "6.1.3. "Compiled" Python files" — https://docs.python.org/3/tutorial/modules.html
   「To speed up loading modules, Python caches the compiled version of each module in the __pycache__ directory under the name module.version.pyc」「First, it always recompiles and does not store the result for the module that's loaded directly from the command line.」
   補強：PEP 3147 — https://peps.python.org/pep-3147/
6. Python Tutorial, "2. Using the Python Interpreter" — https://docs.python.org/3/tutorial/interpreter.html
   「When commands are read from a tty, the interpreter is said to be in interactive mode. In this mode it prompts for the next command with the primary prompt, usually three greater-than signs (>>>)」
7. Python Tutorial, "8. Errors and Exceptions" — https://docs.python.org/3/tutorial/errors.html
   「There are (at least) two distinguishable kinds of errors: syntax errors and exceptions.」「Errors detected during execution are called exceptions」（例に NameError）。
8. The Python Language Reference, "4. Execution model" — https://docs.python.org/3/reference/executionmodel.html
   「A block is a piece of Python program text that is executed as a unit.」「A script file ... is a code block.」
   **注意**：「構文エラーがあると 1 行も動かない」と直接書いた公式の文は見つからなかった。台本では「この例では」と言い、この機械での実行（下の「実行の記録」）を根拠にする。
9. Microsoft Learn, "PE Format" — https://learn.microsoft.com/en-us/windows/win32/debug/pe-format
   「executable (image) files and object files under the Windows family of operating systems ... are referred to as Portable Executable (PE) and Common Object File Format (COFF) files」
10. Linux man-pages, elf(5) — https://man7.org/linux/man-pages/man5/elf.5.html
    「The header file <elf.h> defines the format of ELF executable binary files.」（man7.org は Linux man-pages の公開先）
11. Python.org, Downloads — https://www.python.org/downloads/
    「Python for Windows, Linux/Unix, macOS, Android, iOS, other」。Linux は付属品かパッケージで入れるのが普通（https://docs.python.org/3/using/unix.html「Python comes preinstalled on most Linux distributions, and is available as a package on all others.」）。台本では「python.org から 3 つともダウンロード」とは言わない。
12. The Java Virtual Machine Specification, Java SE 21, Chapter 1 — https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-1.html
    「A class file contains Java Virtual Machine instructions (or bytecodes) and a symbol table」「It is the component of the technology responsible for its hardware- and operating system-independence」
13. PHP Manual, "Introduction" — https://www.php.net/manual/en/introduction.php
    「PHP ... is a widely-used open source general-purpose scripting language that is especially suited for web development」「the code is executed on the server」
14. Python Library, `os`（`os.sep`）— https://docs.python.org/3/library/os.html
    「The character used by the operating system to separate pathname components. This is '/' for POSIX and '\\' for Windows.」
15. PyPy — https://pypy.org/
    「A fast, compliant alternative implementation of Python」「thanks to its Just-in-Time compiler, Python programs often run faster on PyPy.」（"often"。いつでも速いとは言わない）
16. What's New In Python 3.13 — https://docs.python.org/3/whatsnew/3.13.html
    「When CPython is configured and built using the --enable-experimental-jit option, a just-in-time (JIT) compiler is added which may speed up some Python programs.」補強：PEP 744（https://peps.python.org/pep-0744/ 、Status: Draft）。
17. What's New In Python 3.14 — https://docs.python.org/3/whatsnew/3.14.html
    「The official macOS and Windows release binaries now include an experimental just-in-time (JIT) compiler. Although it is not recommended for production use, it can be tested by setting PYTHON_JIT=1 as an environment variable.」「the typical performance impact of enabling it can range from 10% slower to 20% faster, depending on workload.」
    台本では「JIT で速くなる」と言い切らない（試験中）。
18. NumPy, "What is NumPy?" — https://numpy.org/doc/stable/user/whatisnumpy.html
    「these things are taking place, of course, just "behind the scenes" in optimized, pre-compiled C code.」
19. 文体：`docs/conventions/narration-style.md`（ですます調、専門用語は初出で言い換え、まとめは 3 点以内、「簡単」「必ず」を使わない）。

**実行の記録**（2026-09-28、この機械の Python 3.11.9。コマンドと終了コードは `build-log.md`）：
- `add.py`（`a = 1` / `print(a + 2)`）を `python -m dis add.py` にかけると、`LOAD_CONST`・`STORE_NAME`・`LOAD_NAME`・`BINARY_OP 0 (+)`・`PRECALL`・`CALL` などが並ぶ。
- `main.py`（`import greet`）を動かすと `__pycache__/greet.cpython-311.pyc` ができ、`main.py` の `.pyc` はできない。`hello.py` だけを動かしたときは `__pycache__` ができない。
- `name_err.py`（3 行目で未定義の `nedan`）は「1行目」「2行目」を表示してから `NameError: name 'nedan' is not defined`。`syn_err.py`（3 行目のかっこの閉じ忘れ）は何も表示せずに `SyntaxError: '(' was never closed`。
- 対話モードで `1 + 2` と `print("こんにちは")` を入れると、`3` と `こんにちは` が返る（入力は標準入力から流した。スライドはプロンプトと入力を画面どおりの形に並べる）。

## 事実と出典の対応

| # | 事実（台本の言い方） | 出る所 | 出典 |
|---|---|---|---|
| 1 | CPU が直接読めるのは 0 と 1 の機械語 | 2 章 | 1 本目・2 本目と同じ一般的な説明。出典 1 の "machine code" |
| 2 | コンパイラは全体を先に訳して実行ファイルを作る（C 言語） | 3 章 | 1 本目の出典（GCC Manual "Overall Options"）https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html |
| 3 | コンパイラかインタプリタかは処理系で決まる。Python にも処理系が複数ある | 3 章 | 3 |
| 4 | Python は公式にはインタプリタ型だが、境目はあいまい | 4 章 | 1（interpreted） |
| 5 | CPython はまずバイトコードに訳し、仮想マシンが実行する | 4 章 | 1（bytecode） |
| 6 | バイトコードの中身は版で変わりうる。画面の例は 3.11.9 | 4 章 | 4、実行の記録 |
| 7 | import した部品は `__pycache__` に `.pyc` で取っておかれる。直接動かしたファイルは取っておかれない | 4・7 章 | 5、実行の記録 |
| 8 | 対話モードは `>>>` を出して 1 行ずつ動く | 4 章 | 6、実行の記録 |
| 9 | 名前の誤り（NameError）は実行中に見つかる。書き方の誤り（SyntaxError）はこの例では 1 行も動かずに出る | 5 章 | 7・8、実行の記録 |
| 10 | 実行ファイルの形式は OS ごとに違う（Windows は PE、Linux などは ELF） | 6 章 | 9・10 |
| 11 | CPython は C 言語で書かれている | 6 章 | 2 |
| 12 | Python は Windows・macOS・Linux などで使える | 6 章 | 11 |
| 13 | Java はバイトコードにして、仮想マシンが OS の違いを引き受ける | 6 章 | 12 |
| 14 | PHP は Web のサーバー側でよく使われる | 6 章 | 13 |
| 15 | ファイルの場所の区切りは Windows と他で違う | 6 章 | 14 |
| 16 | PyPy は JIT で速く動くことが多い | 7 章 | 15 |
| 17 | CPython の JIT は 3.13 で試験的に入り、3.14 の Windows・macOS の公式版に入ったが既定では無効 | 7 章 | 16・17 |
| 18 | NumPy は裏であらかじめコンパイルした C のコードで計算する | 7 章 | 18 |

## 台本の確認

- 台本承認：2026-09-28 主人（チャットで「台本承認」。59 発話・3,253 字、スライド 18 枚の表を見せた。本文の変更なし）
- 承認の後の読みの直し（2026-09-28、意味は変えない）：VOICEVOX の `kana` で、u-036「その行」・u-039「最後の行」が「クダリ」、u-044「国ごと」が「コクゴト」と読まれたので、「ぎょう」「くにごと」とかなで書いた

## 試写で見る点（goal.md Wave 4 の完了条件 9）

箇条書きの点と文字の位置／図の矢印と強調の位置（R6）／聞き役の向き／読み（VOICEVOX の `kana`）／コードのスライドの文字の大きさ／出典の表示のフェード（R5）。

- 試写：2026-09-28 主人（チャットで「試写した、問題なし」。見た物は `deliver/python-runs/` の MP4 `5f02ecdc…5e83`・PDF `de5b6aea…823c`。コミット `3d8ee56` の書き出し）
  - 箇条書きの点と文字の位置：問題なし
  - 図の矢印と強調の位置：問題なし（この動画は Flowchart 部品を使わず、RunFlow の矢じりは線より大きい）
  - 聞き役の向き：問題なし
  - 読み：問題なし（試写の前に、u-036・u-039・u-044 をかなに直した。「台本の確認」節）
  - コードのスライドの文字の大きさ：問題なし
  - 出典の表示のフェード：この動画は Citation 部品を使っていないので、見る所なし

## Wave 5 の追加（2026-10-03、goal.md の Wave 5 節）

- 画像を 2 枚足した。発話は変えていない（音声と尺はそのまま）。出典の記録は `images.md`。
  - u-004〜u-005：CPU の現物の写真（`slide-cpu-photo`、CC0）。u-006 から今までの図 `slide-cpu`。
  - u-042：python.org のダウンロードのページの画面写し（`slide-python-org`、引用。brief §9 の D7 訂正）。u-043 から今までの図 `slide-os-python`。
- PDF は A4 縦・スライドと本文が同じ幅の組みになった（3 本に共通の直し）。20 ページ。

### 試写で見る点（goal.md Wave 5 の完了条件 9）

写真と画面写しの見え方（小さすぎないか、出典の表示）／PDF の図と文の幅がそろっているか／PDF を画面で拡大したとき図と文が一緒に収まるか／PDF のページ数が増えすぎていないか。

- 試写（Wave 5）：2026-10-03 主人（チャットで「1 問題なし」。見た物は `out/script-engine/` の python-runs の MP4 `c7c07ae5…4c05`・PDF `ec998d03…069c` と about-c の PDF `9b6c481c…8c47`。コミット `ec4516f` の書き出しで、納品物と同じ物）
  - 写真と画面写しの見え方（小ささ・出典の表示）：問題なし
  - PDF の図と文の幅がそろっているか：問題なし
  - PDF を画面で拡大したとき図と文が一緒に収まるか：問題なし
  - PDF のページ数が増えすぎていないか：問題なし（3 本目は 18 → 20 ページ。画像のスライドが 1 ページずつ）
