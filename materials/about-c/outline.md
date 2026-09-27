# outline.md — 「C言語について」（script-id: `about-c`）

Wave 3 の 2 本目。契約は `goal.md` の Wave 3 節（完了条件 1）。台本は `content/scripts/about-c.script.yaml`。

## 対象

- 都城高専 **電気情報工学科 1 年**（プログラミング言語入門、後期）と **機械工学科 3 年**（情報処理Ⅰ、後期）。どちらも最初の授業で**授業中に流す**（最初に使う日 2026-10-02。主人 2026-09-27）。
- 前提知識：プログラムを本格的に書いたことは無い。電気情報 1 年は情報基礎Ⅰで Python に少し触れている（シラバス）。
- 2 学科共通の 1 本。「学ぶ意義」の章だけ学科ごとに分ける（主人 2026-09-27、推奨どおり）。
- **個人名を出さない**（主人の答え：案 B）。学校名・学科名・科目名は出す。担当教員は「この授業の担当の先生」と言う。

## 尺

- 目標 **8〜10 分**（`target_duration_range` 480〜600 秒）。
- 台本は 56 発話・3,329 字（空白を除く）。compile 前の予測は 495 秒（`estimateScriptDuration`。クレジット区間 3 秒と表示保証尺は含まない）。
- スライド 17 枚（図解 11・箇条書き 5・表題 1）。図解は `src/script-engine/render/about-c/` の 3 部品。画像は使わない。

## 章立て

1. **導入**（約 30 秒）：なぜ C なのか、今日の流れ。
2. **どんな言語か**（約 80 秒）：機械語・アセンブリ言語（低水準）と Python（高水準）。C はその間で、機械の中身に手が届き、人にも読める（出典 A1）。
3. **きっかけと簡単な歴史**（約 100 秒）：ベル研究所のリッチー。UNIX を書くため。B から C へ、1969〜1973 年（中心は 1972 年）、1973 年に UNIX を C で書き直す、1978 年に K&R、移植性は後から強みになった、規格（1989・1990・1999・2011・2024）（出典 A1・A2）。
4. **得意と不得意**（約 130 秒）：コンパイラ型とインタプリタ型（A3・A4）。得意＝マイコン（A5・A6）、OS の中心（A7）、AI の裏側（A8・A9）。不得意＝Web ページの画面（A10）、間違いを止めてくれない（A11）。人気の指標（A12、参考）。
5. **電気情報工学科・機械工学科が C を学ぶ意義**（約 110 秒）：今年・来年・再来年の科目（出典 B）と、担当の先生の説明（C）。
6. **AI の時代に手で書いて学ぶ理由**（約 60 秒）：頼み方が具体的になる／取り違えにツッコミを入れられる／読み書きと知識は AI を使いこなす道具（主人の説明 C）。
7. **まとめ**（約 25 秒）：3 点。

## 出典

**A. C 言語と周辺（一次資料。2026-09-27 に取得して HTTP 200 を確かめた）**

- A1. Dennis M. Ritchie, "The Development of the C Language"（HOPL-II 1993 の本人による再掲）— https://www.nokia.com/bell-labs/about/dennis-m-ritchie/chist.html
  "C came into being in the years 1969-1973"／"the most creative period occurred during 1972"／"In 1971 I began to extend the B language"／"its parent B ... and its grandparent BCPL"／"rewrite the Unix kernel for the PDP-11 in C during the summer of that year"（1973 年）／"In 1978 Brian Kernighan and I published The C Programming Language"／"At the time we did not put much weight on portability; interest in this arose later"／BCPL・B・C は "close to the machine" だが "their abstractions lie at a sufficiently high level that ... portability between machines can be achieved"／要旨 "a system implementation language for the nascent Unix operating system"。
- A2. ISO/IEC JTC1/SC22/WG14（C 言語の規格の作業部会）"Projects"（SC22/WG14 Milestones）— https://www.open-std.org/jtc1/sc22/wg14/www/projects
  1989: ANSI X3.159-1989（C89）／1990: ISO/IEC 9899:1990（C90）／ISO/IEC 9899:1999（C99。発行は 2000 年と記載）／2011: ISO/IEC 9899:2011（C11）／2018: ISO/IEC 9899:2018（C17）／2024: ISO/IEC 9899:2024（C23）。
  トップページ https://www.open-std.org/jtc1/sc22/wg14/ にも "The current C programming language standard (C23) ISO/IEC 9899 was adopted by ISO and IEC in 2024."
- A3. GCC Manual, "Overall Options" — https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html（"Compilation can involve up to four stages"。1 本目の出典 1 と同じ）
- A4. Python Tutorial, "Whetting Your Appetite" — https://docs.python.org/3/tutorial/appetite.html（"Python is an interpreted language ... no compilation and linking is necessary"）。用語集 https://docs.python.org/3/glossary.html の "bytecode" には、CPython が中でバイトコードに変換するとある（台本では触れない）。
- A5. Raspberry Pi pico-sdk README — https://raw.githubusercontent.com/raspberrypi/pico-sdk/master/README.md（"write programs for the RP-series microcontroller-based devices ... in C, C++ or assembly language"）。公式ドキュメントのページ名は "The C/C++ SDK"（https://www.raspberrypi.com/documentation/microcontrollers/c_sdk.html 、curl では 403 だがブラウザでは読める）。
- A6. Arduino CLI, "Sketch build process" — https://docs.arduino.cc/arduino-cli/sketch-build-process/（スケッチを "turn your sketch into a C++ program" してからコンパイルする）
- A7. The Linux Kernel documentation, "Programming Language" — https://docs.kernel.org/process/programming-language.html（"The Linux kernel is written in the C programming language"）
- A8. NumPy, "What is NumPy?" — https://numpy.org/doc/stable/user/whatisnumpy.html（"'behind the scenes' in optimized, pre-compiled C code"）
- A9. PyTorch C++ docs, "The C++ Frontend" — https://docs.pytorch.org/cppdocs/frontend.html（"The Python frontend calls into C++ for almost anything computationally expensive"）
- A10. MDN, "JavaScript" — https://developer.mozilla.org/en-US/docs/Web/JavaScript（"most well-known as the scripting language for Web pages"）
- A11. WG14, "Rationale for International Standard — Programming Languages — C"（Revision 5.10）— https://www.open-std.org/jtc1/sc22/wg14/www/C99RationaleV5.10.pdf（C の精神として "Trust the programmer."）
- A12. （参考・2 次資料）TIOBE Index for September 2026 — https://www.tiobe.com/tiobe-index/（1 位 Python、2 位 C。人気の指標で、使用量の実測ではない）

**B. 都城高専 2026 年度シラバス（高専機構 Web シラバス。2026-09-27 に取得して HTTP 200 を確かめた）**

URL は `https://syllabus.kosen-k.go.jp/Pages/PublicSyllabus?school_id=49&department_id=<学科>&subject_id=<番号>&year=<入学年度>&lang=ja`（2 年以上の科目は `year` が入学年度。開講年度はどれも「令和08年度 (2026年度)」）。

- B1. 電気情報工学科 1 年「プログラミング言語入門」（後期・必修）— department_id=12&subject_id=0014&year=2026：C 言語。教科書『C言語[完全]入門』。
- B2. 電気情報工学科 2 年「プログラミング言語Ⅰ」（通年・必修）— department_id=12&subject_id=0030&year=2025：C 言語。後期にポインタ（3〜5 週）・構造体（9〜11 週）。
- B3. 電気情報工学科 2 年「電気情報工学実験Ⅰ」（通年・必修）— department_id=12&subject_id=0023&year=2025：後期 8〜9 週「ArduinoによるLEDと光センサの制御」、10〜11 週「Arduinoによる赤外線通信」。
- B4. 電気情報工学科 3 年「プログラミング言語Ⅱ」（通年・必修）— department_id=12&subject_id=0049&year=2024：前期に CASLⅡ（アセンブリ言語）、後期に Python。
- B5. 機械工学科 3 年「情報処理Ⅰ」（後期・必修）— department_id=11&subject_id=0044&year=2024：「C言語を用いたプログラミングの基本を習得する」。14 週「ポインタの基本」。
- B6. 機械工学科 4 年「計測工学」（前期・必修）— department_id=11&subject_id=0072&year=2023：13〜15 週「センサとセンシング」。
- B7. 機械工学科 5 年「工学実験Ⅲ」（前期・必修）— department_id=11&subject_id=0092&year=2022：6 週「DCモータのPID制御実験」。

来年・再来年の欄は、**2026 年度の上級学年のシラバス**で判断した。来年度以降の改訂は確かめられない。
機械工学科の 4 年「情報処理Ⅱ」は数値計算を Python で行う（C ではない）ので、「C を使う科目」としては挙げない。機械工学科のシラバスには、マイコン・Arduino・アセンブラ・組込みの語は出てこない。

**C. 主人の説明（2026-09-27、チャット。台本では「担当の先生の説明」と言う）**

- C1. 電気情報工学科 2 年のプログラミング言語Ⅰも、この授業の担当の先生が受け持つ。
- C2. 3 年の CASL2 は別の先生の担当。C の概念を押さえてから進まないと、ついていくのは難しい。
- C3. 機械工学科・電気情報工学科とも、計測機器や 1 ボードコンピュータを扱うときに C が必須。
- C4. AI の時代に手で書いて学ぶ意義：AI に指示するにも、仕組みの理解と最低限の読み書き・知識が要る。AI が取り違えたり、おかしなことを始めたりしたとき、ツッコミを入れられるくらいに知っておく。

**D. 文体**：`docs/conventions/narration-style.md`（ですます調、専門用語は初出で言い換え、まとめは 3 点以内、「簡単」「必ず」を使わない）。

## 事実と出典の対応

台本（発話とスライド）に出る事実を 1 行ずつ出典に結ぶ。発話では科目名の「Ⅰ」「Ⅱ」「Ⅲ」を読みのかな（いち・に・さん）で書き、UNIX・Linux などは読みのカタカナで書いている（同じ事実）。

| # | 事実（台本の言い方） | 出る所 | 出典 |
|---|---|---|---|
| 1 | CPU が直接読めるのは 0 と 1 の機械語 | u-004、slide-levels | 1 本目（source-to-exe）と同じ一般的な説明。A3 の 4 段階の最後が機械語 |
| 2 | C は機械に近いが、別の機械にも持っていけるくらい抽象的（本人の言葉） | u-010、slide-levels-c | A1 |
| 3 | Python は高水準の例 | u-008、slide-levels | A4（インタプリタ型の言語として公式が説明） |
| 4 | C はアメリカのベル研究所で、デニス・リッチーが作った | u-013 | A1（Bell Labs、本人の論文） |
| 5 | UNIX（ユニックス）という OS を書くために作った | u-015、slide-summary | A1 要旨 |
| 6 | ケン・トンプソンが作った B を、1971 年から広げ始めた | u-016 | A1 "In 1971 I began to extend the B language"、B は Thompson が作った |
| 7 | 1969〜1973 年に生まれ、中心は 1972 年 | u-016、slide-history（1969〜1973・1972） | A1 |
| 8 | 本人は B を親と呼ぶ | u-018 | A1 "its parent B" |
| 9 | 1973 年の夏に UNIX の中心部分を C で書き直した | u-018、slide-history（1973） | A1 |
| 10 | 1978 年に解説書（K&R）を出した | u-020、slide-history（1978） | A1 |
| 11 | 移植性は最初の目的ではなく、関心は後から生まれた | u-021 | A1 |
| 12 | 1989 年にアメリカの規格（ANSI、C89） | u-022、slide-history（1989） | A2 |
| 13 | 1990 年に国際規格 | u-022 | A2（ISO/IEC 9899:1990） |
| 14 | 1999 年の改訂（C99） | u-022、slide-history（1999） | A2（ISO/IEC 9899:1999） |
| 15 | 2011 年の改訂 | u-022 | A2（ISO/IEC 9899:2011） |
| 16 | 最新は 2024 年の規格（C23） | u-022、slide-history（2024） | A2 |
| 17 | 50 年以上前に生まれた | u-023 | 7 から計算（1972 年 → 2026 年で 54 年） |
| 18 | コンパイラ型：動かす前に全体を機械語に翻訳する（C） | u-025、slide-run | A3 |
| 19 | インタプリタ型：Python の公式は自分をインタプリタ型と呼ぶ。コンパイルの手間なしに動かせる | u-026、slide-run | A4 |
| 20 | 先に機械語にしておくので速さが要る場面で力を発揮する | u-028、slide-run | A8（pre-compiled C code で速い計算）・A11 |
| 21 | Raspberry Pi Pico の公式開発キットは C と C++ 向け | u-029、u-048、slide-strong | A5 |
| 22 | Linux の中心部分（カーネル）は C で書かれている | u-030、slide-strong | A7 |
| 23 | AI のプログラムは Python で書かれることが多く、裏の重い計算は C/C++ の部品（NumPy・PyTorch の公式） | u-032、slide-strong | A8・A9（「多い」は PyTorch が Python の窓口を勧めていることまで。量の統計は無い） |
| 24 | Web ページの動きは JavaScript で書くのがふつう | u-034、slide-weak | A10 |
| 25 | 規格を作った人たちは「プログラマを信頼する」を大事にしてきた | u-035、slide-weak | A11 |
| 26 | TIOBE の 2026 年 9 月の順位で C は 2 位（人気の指標の 1 つ） | u-038、slide-weak | A12（参考） |
| 27 | 電気情報 1 年「プログラミング言語入門」は後期、C 言語 | u-039、slide-course | B1 |
| 28 | 電気情報 2 年「プログラミング言語Ⅰ」は通年で C 言語。ポインタや構造体まで | u-040、slide-course | B2 |
| 29 | プログラミング言語Ⅰも、この授業の担当の先生が受け持つ | u-040 | C1 |
| 30 | 電気情報 2 年の実験で Arduino のマイコンで LED や光センサを動かす | u-041、slide-course | B3 |
| 31 | Arduino のプログラムは C++ に変換されて動く | u-041 | A6 |
| 32 | 電気情報 3 年「プログラミング言語Ⅱ」の前期は CASLⅡ（アセンブリ言語） | u-042、slide-course | B4 |
| 33 | 3 年は別の先生の担当で、C の考え方を押さえないとついていくのは難しい | u-044 | C2 |
| 34 | 機械 3 年「情報処理Ⅰ」は後期、C の基本からポインタの入り口まで | u-045、slide-course | B5 |
| 35 | 機械 4 年「計測工学」でセンサの種類と特徴を学ぶ | u-047、slide-course | B6 |
| 36 | 機械 5 年「工学実験Ⅲ」で直流モーター（DC モータ）の PID 制御の実験 | u-047、slide-course | B7 |
| 37 | どちらの学科でも、計測機器や 1 ボードのマイコンを扱うときに C は欠かせない | u-048 | C3 |
| 38 | AI 時代に手で書いて学ぶ理由（頼み方・ツッコミ・読み書きと知識） | u-050〜u-054、slide-ai | C4 |

## 台本の確認

- 台本ができたら「話し手／セリフ／スライド」の表で主人に見せ、承認をもらってから compile する（`goal.md` Wave 3 完了条件 2）。
