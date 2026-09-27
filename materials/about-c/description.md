# 概要欄 ── C言語について（Laterna 2 本目、script-id: `about-c`）

動画の概要欄・配布ページに貼る文面。`goal.md` Wave 3 の完了条件 4。出典は `outline.md` の「出典」節と同じ。

## 内容紹介

これから C 言語を学び始める人に向けて、解説役と聞き役の掛け合いで「C はどんな言語で、なぜ学ぶのか」を追いかけます。
機械語・アセンブリ言語（低水準）と Python（高水準）のあいだにいる C の位置、UNIX を書くために生まれた歴史と規格の歩み、コンパイラ型とインタプリタ型の違い、マイコン・OS・AI の裏側といった得意な場面と、Web ページの画面づくりのような不得意な場面を紹介します。
後半では、都城高専の電気情報工学科と機械工学科で、C がこの先どの授業につながるのかをシラバスで確かめ、最後に AI の時代に手で書いて学ぶ理由を話します。

- 対象：都城高専 電気情報工学科 1 年（プログラミング言語入門）・機械工学科 3 年（情報処理Ⅰ）。授業中に流す
- 尺：約 9 分 6 秒（実測 545.9 秒）
- 復習用 PDF（17 ページ）を同じ台本から書き出しています

## 出典

1. Dennis M. Ritchie, "The Development of the C Language" ── https://www.nokia.com/bell-labs/about/dennis-m-ritchie/chist.html（C が生まれた時期、B と BCPL、UNIX の書き直し、K&R、移植性への関心）
2. ISO/IEC JTC1/SC22/WG14（C 言語の規格の作業部会）"Projects" ── https://www.open-std.org/jtc1/sc22/wg14/www/projects（C89・C90・C99・C11・C17・C23 の年）
3. WG14, "Rationale for International Standard — Programming Languages — C" ── https://www.open-std.org/jtc1/sc22/wg14/www/C99RationaleV5.10.pdf（"Trust the programmer."）
4. GCC Manual, "Overall Options" ── https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html
5. Python Tutorial, "Whetting Your Appetite" ── https://docs.python.org/3/tutorial/appetite.html
6. Raspberry Pi pico-sdk README ── https://raw.githubusercontent.com/raspberrypi/pico-sdk/master/README.md
7. Arduino CLI, "Sketch build process" ── https://docs.arduino.cc/arduino-cli/sketch-build-process/
8. The Linux Kernel documentation, "Programming Language" ── https://docs.kernel.org/process/programming-language.html
9. NumPy, "What is NumPy?" ── https://numpy.org/doc/stable/user/whatisnumpy.html
10. PyTorch, "The C++ Frontend" ── https://docs.pytorch.org/cppdocs/frontend.html
11. MDN, "JavaScript" ── https://developer.mozilla.org/en-US/docs/Web/JavaScript
12. （参考）TIOBE Index for September 2026 ── https://www.tiobe.com/tiobe-index/（人気の指標で、使われている量を測った物ではない）
13. 都城工業高等専門学校 2026 年度シラバス（高専機構 Web シラバス）── 電気情報工学科 https://syllabus.kosen-k.go.jp/Pages/PublicSubjects?school_id=49&department_id=12&year=2026&lang=ja ／機械工学科 https://syllabus.kosen-k.go.jp/Pages/PublicSubjects?school_id=49&department_id=11&year=2026&lang=ja
   （来年・再来年の科目は、2026 年度の上級学年のシラバスで確かめた。科目ごとのページは `outline.md` の出典 B）

## クレジット

- 音声合成：VOICEVOX（https://voicevox.hiroshiba.jp/）
  - 解説役：VOICEVOX:玄野武宏
  - 聞き役：VOICEVOX:ずんだもん
  - 各キャラクターの音声の利用条件は、それぞれの利用規約に従います。**音声は下記 CC BY 4.0 の対象ではありません。**
- 立ち絵：Laterna オリジナル（Laterna の画像環境 imagegen、FLUX.2 [klein] 4B で生成。記録は `materials/portraits/`）
- 図解：コードで描画（Remotion／React。台本ごとの部品 `LanguageLevels`・`CTimeline`・`CourseMap`）。第三者の画像・写真・ロゴ・音楽・効果音は使っていません
- 制作：Remotion（https://www.remotion.dev/）で書き出し
- ライセンス：台本・図解・教材本文（この動画の Laterna 側の著作物）は CC BY 4.0（`LICENSE-CONTENT`）。コードは MIT（`LICENSE`）。VOICEVOX の音声と第三者素材は対象外
