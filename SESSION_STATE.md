# SESSION_STATE.md — Laterna（索引。本体は各文書）

様式は Seneschal `core/handoff.md`。上限 200 行。**「次の一手」は索引であって承認ではない**（復帰時は G0 の要否を先に見る）。

## これは何か

授業用の解説動画（掛け合い）＋復習 PDF を「この題材で 1 本」で作るプロジェクト。Kyozai-Athanor のエンジンを移植し、統治の層は持ち込まない。
1 本目「ソースから実行ファイルまで」（`source-to-exe`）と 2 本目「C言語について」（`about-c`）を納品した（`deliver/<script-id>/`）。どちらも 2026-10-02 の授業で使う（1 本目は高専 1 年の初回、2 本目は電気情報工学科 1 年のプログラミング言語入門と機械工学科 3 年の情報処理Ⅰ）。
**Wave 3「2 本目」は 2026-09-27 に検収 PASS で締めた。**
**Wave 4「3 本目：Pythonが動くまで」（`python-runs`、汎用・期限 2027-01-10）は 2026-09-28 に納品物と主人の試写（問題なし）まで済んだ。検収 1 回目の結果が次の分かれ目（下の「現在地」）。**

## 読む順序

1. `README.md`（34 行）
2. `docs/brief.md`（134 行。決定 D1〜D10 と §9 の訂正節 D8・D9）
3. `goal.md`（457 行。Wave 1・2・2.5・3 は完了。**末尾の Wave 4 節**が直近の契約。訂正節はまだ無い）
4. `SKILL.md`（159 行。「この題材で 1 本」の手順書。手順 0 の 5 に作業記録の書き方を足した）
5. `materials/python-runs/`（outline.md の出典 19・事実と出典の対応 18 行・台本承認と試写の記録、build-log.md、description.md）、`materials/about-c/`（build-log.md の「表の決まり」）、`materials/source-to-exe/`
6. `docs/research/2026-09-27-review.md`（198 行。点検の記録。「Wave 3 以降へ」の行は下の未決に移した）
7. `docs/inventory.md`／`docs/design.md`／`imagegen/README.md`
8. 統治は `D:\work8\Seneschal\core\`（README → loop → handoff）を読みに行く

## 現在地

- **Wave 1「目星」**・**Wave 2「1 本目」**（2026-09-26）・**Wave 2.5「点検」**（2026-09-27 午前）は完了。GitHub に Public で公開済み（https://github.com/sougetuOte/Laterna ）。
- **Wave 3「2 本目：C言語について」は完了**（2026-09-27。G0 承認 09:49 JST、セッション `dbf265b1-7f84-42eb-91c5-39487434671c`。起点 `c4e6ffe`）：
  - 2 本目 `about-c`：9 分 6 秒（545.96 秒）・PDF 17 ページ。台本 56 発話、図解は `render/about-c/` の 3 部品（LanguageLevels・CTimeline・CourseMap）。個人名は出さない（主人の答え：案 B）。
  - 主人の試写で箇条書きの点と文字のずれ（共通部品）が見つかり、訂正節で共通部品と 1 本目の R1〜R3 を直して、1 本目と 2 本目を書き出し直し、納品物を差し替えた（`d2f6af5`）。PDF の注記の JSX 改行による余計な空白も、足したテストで見つかって直した。
  - 検収：1 回目 **FAIL**・2 回目 **FAIL**（どちらも検証 6。作業記録の終了コードが実測でなかった）→ 縦の停止で MAGI を 1 回（結論：表を実測だけにし、読むだけのコマンドを叩き直す。gabriel の結論が変わる指摘 0）→ 3 回目 **PASS**（`59f5a7d`）→ 訂正節 → 数え直して 1 回目 **PASS**（`9954bdd`、検証 1〜8）。
- **Wave 4「3 本目：Pythonが動くまで」は検収待ち**（2026-09-28。G0 承認 10:09 JST、セッション `c54d1211-5809-442d-aae2-ccf5fd2dfe43`。起点 `79ad909`。成果コミット `3d8ee56`・`e6d0820`）：
  - 3 本目 `python-runs`：8 分 32 秒（512.36 秒）・PDF 18 ページ。台本 59 発話・3,253 字、8 章。図解は `render/python-runs/` の 2 部品（RunFlow・CompareTable）。コードと実行結果は Python 3.11.9。
  - 納品物 `deliver/python-runs/`：MP4 `5f02ecdc…5e83`・PDF `de5b6aea…823c`・description.md。主人の試写：問題なし（2026-09-28）。
  - 本セッションの実測（10:26）：`npm test` 21 files / 381 tests PASS、`npm run lint` exit 0。出典 21 本 HTTP 200。主人の氏名・学校名 0 件。`src/` の差は追加 10 行だけ（削除 0）。
  - 検収 1 回目は **FAIL**（検証 6 だけ）。`db4b3b1` で直した。検収 2 回目は次のセッションで出す。
  - 検収 1 回目で columba が確かめた（2026-09-28、HEAD `e6d0820`）：書き出し直した python-runs・source-to-exe・about-c の SHA-256 が納品物と一致、compile 3 本の manifest・音声は起点と同じ、`npm test` 381 件・lint exit 0、出典 21 本 HTTP 200。
- 動いている物（実測 2026-09-27、columba の最後の検収、HEAD `9954bdd`）：
  - `npm test` 20 files / 370 tests PASS、`npm run lint` exit 0。
  - 納品物の SHA-256：source-to-exe は MP4 `c00f8b35…1434`・PDF `66c3c06e…42b0`（10 ページ・285.888 秒）、about-c は MP4 `be055db0…31b6`・PDF `bec94511…a90c`。どちらも書き出し直すと一致する（render は決定的）。
  - compile 2 本（source-to-exe・java-vs-js）の manifest・音声は `6cbaf95` と同じ。
  - java-vs-js（立ち絵 v1）は Kyozai の参照と、箇条書きの区間とその直前 23 フレーム（エンコーダの先読み。`-fuzz 2%` で差 0 画素）だけ映像が違う。音声は全部一致。
  - `npm audit`：low 2 件（eslint 系）。VOICEVOX 0.25.2（50021）は起動中だった。imagegen は起動していない。
- まだ無い物：字幕・口パク・`manifest-registry.ts` の廃止（(c)）・画像スライド。

## これまで（git log が持たない解釈だけ）

| commit | 出来事 |
|---|---|
| `ba991a4`〜`8980aed` | Wave 1。フェーズ (A) の検収 1 回目 **FAIL** → 2 回目 PASS、(B)(C) PASS |
| `843bdfd`〜`6cbaf95` | Wave 2。imagegen、立ち絵 v2、1 本目の納品。**主人の差し戻し**（聞き役の向き、retro 1 回目。学びは SKILL.md 手順 6）。GitHub 公開 |
| `02478ed`〜`c4e6ffe` | Wave 2.5「点検」。full-review は 5 周で Green にならず（残りは Wave 3 以降へ／直さない）。検収 1 回目 FAIL → 2 回目 PASS |
| `d4152b6` | Wave 3 の G0（主人の答え：尺 8〜10 分・2 学科共通の 1 本・個人名は出さない・R1〜R3 は入れない） |
| `9648cf9` | 訂正節 1：`component-names.ts` への名前の追加を認める（G0 の書き漏れ） |
| `e1601fa`・`86025df` | 検収 1 回目・2 回目 **FAIL**（作業記録。説明の行に終了コード 0／grep の 0 件を 0 と書いた） |
| `59f5a7d` | MAGI の後に作業記録を書き直し、検収 3 回目 PASS |
| `9a17903`・`d2f6af5`・`9954bdd` | 訂正節 2・3：箇条書き（共通部品）と 1 本目の R1〜R3 の直し、納品物の差し替え、java-vs-js の物差しの置き換え（エンコーダの先読み 40 フレームを許す）。数え直して 1 回目 PASS |
| `7caf298` | Wave 4 の G0（主人の答え：汎用・普通科高校 1 年・経験なし、8〜10 分の 1 本、PHP は一言、コンパイラ化は JIT と「重い所は C」、付け足し 1・2・3・5、Scratch は入れない、試写を完了条件に、Python 3.11.9） |
| `3d8ee56`・`e6d0820` | 3 本目の台本（承認後に読みのかな 3 か所）・図解 2 部品・音声・納品、主人の試写（問題なし）。検収 1 回目 **FAIL**（HEAD `e6d0820`。9 項中 8 項 PASS、検証 6 だけ：作業記録の still の 2 行に叩いたコマンドが無く説明だった） |
| `db4b3b1` | 作業記録の still の行（4 行に分けた）と VOICEVOX の「同上」の行を、叩いたコマンドそのものに直した。**検収 2 回目はまだ出していない**（2 回目も FAIL なら縦の停止で MAGI） |

**retro（2026-09-27、Wave 3 の締め）**：起動条件 1（同一フェーズで検収 2 回 FAIL）と 3（出荷した 1 本目が次の回で直しの対象になった）に当たった。学びは 3 つ。
1. 終了コードは、叩いたその場で `echo exit=$?`（パイプは pipefail）で取る。パイプや `;` の途中は実測にならない。記録に「無い」「0」と書く前に確かめる → `SKILL.md` 手順 0 の 5 に 1 文足した（主人承認）。
2. 前の回で検収を通った書き方でも、正しいとは限らない（1 本目の作業記録の古い行にも同じ型がある。古い行は書き換えずに残した）。
3. 点検で「出力が変わるので後回し」にした見た目の所見（bullets のマーカー位置）は、次の回にもそのまま出た。後回しにする見た目の所見は、次の回の G0 に「試写で見る点」として入れる。

## 決定（蒸し返さない）

brief D1〜D10 に加えて、主人がチャットで決めた物：

1. 使用場面は学校の授業で流す。情報系は高専機構の教材が勝つが、プログラム系は自作するしかない。
2. 1 本目・2 本目の期限は 10/1。10/2 の授業用。
3. 1 本目は「ソースから実行ファイルまで」（3〜5 分）。2 本目は「C言語について」（8〜10 分、2 学科共通の 1 本、「学ぶ意義」の章だけ学科ごと）。納品先は `deliver/<script-id>/`。
4. 立ち絵は Claude が主体で作る。採用は解説役バストアップ s2・聞き役ランタン版 s2。
5. 可能な限り公開して実績にする。ライセンスは MIT（コード）＋CC BY 4.0（台本・図解・教材本文・立ち絵。合成音声・第三者素材は対象外）。
6. `public/audio`・`public/manifests`・`materials/portraits/*.kra` は git で追跡する。
7. 画像環境は Laterna の中に `imagegen/` として建てる。img2 は予備経路。
8. 台本の本文は compile の前に表で主人に見せて承認をもらう。
9. `manifest-registry.ts` は手動追記で出す。(c) の廃止の試みは次の Wave 以降。
10. custom スライドは部品側で白いパネルを描く。code スライドの `<pre>` と bullets の `<ul>` は、どちらも inline-block・左揃え（かたまりは中央、中身は左）。
11. 立ち絵のファイルは 2 枚とも「向かって右」を向いた絵にする（右カラムはレンダラーが反転する）。
12. Remotion CLI はシェルを通さず、`process.execPath` ＋ `@remotion/cli/remotion-cli.js` で呼ぶ。script-id と発話 id の文字種の規則は `schema/script.ts` の `FILE_SAFE_ID_PATTERN` の 1 か所。
13. **動画・PDF・概要欄・リポジトリに主人の個人名を出さない**（案 B）。学校名・学科名・科目名は出す。担当教員は「この授業の担当の先生」と言う。
14. 同じフェーズで検収が 2 回 FAIL したら MAGI を 1 回、なお FAIL なら主人へ（Seneschal loop.md）。訂正節で作業が加わった後の検収は、FAIL の回数を数え直す（2026-09-27 主人）。
15. `npm audit fix` は `--force` なしだけ。eslint を上げる `--force` は後の Wave。
16. 3 本目「Pythonが動くまで」は汎用（普通科高校 1 年・経験なし）。最初に使うのは専門学校 1 年の後期、高専で流すこともある。**動画・PDF・概要欄に学校名を出さない**（決定 13 の「学校名は出す」は 1 本目・2 本目の話）。期限 2027-01-10。
17. 例示の Python は、この機械の 3.11.9 のまま（別の版は入れない）。主人の試写は完了条件に入れる（2026-09-28）。

## 採らなかった案

| 案 | 却下理由 |
|---|---|
| 立ち絵を主人が手元で生成して納品 | 主人が不得意。後工程を見越した設計は Claude 主体のほうがよい |
| 聞き役の向きをレンダラー側（`scaleX(-1)` の撤去）で直す | java-vs-js の render 経路が変わり、Kyozai との再現性の物差しが使えなくなる |
| 箇条書きのずれを 2 本目専用の部品で直す | 1 本目も同じずれを持ったまま 10/2 に使うことになる。主人が共通部品の直しを選んだ |
| 2 本目を学科別に 2 本に分ける | 主人の答え（共通の 1 本、「学ぶ意義」の章だけ学科ごと） |
| 検収 2 回目の FAIL で指摘された 1 行だけを直す | MAGI の全員が一致して却下。同じ型の行が表に多数残り、3 回目の FAIL がほぼ確実だった |
| 箇条書きの直しと作業記録の直しを同じ検収に出す | MAGI（調停役・批判役）が却下。主人へ上がる前の最後の 1 回で、落ちた原因を 1 つに絞れなくなる |
| 機械工学科の「来年・再来年」を「C を使う授業」と言う | シラバスで確かめられない（情報処理Ⅱは Python）。計測・制御の授業と、担当の先生の説明で言った |
| full-review の対象を 4 つに分ける／`tasks.md` を作る | 監査役が 13 人になる／Kyozai の specs は持ち込まない |

## 未決（主人の判断待ち）

- 10/2 の授業での受け入れ（1 本目・2 本目。使えなかった点は次の Wave の G0 に書く）。
- brief §6 の答え（上の「決定」1〜5・7）を brief 本文に写すか。
- 依存の変更：`@types/node` の宣言（R10）、使われていない `@remotion/media` の削除（R9）、eslint の `--force`。

## 未決（点検の記録から移した「Wave 3 以降へ」の所見。次の Wave の G0 で扱う）

`docs/research/2026-09-27-review.md` の表の行。R1〜R3 は Wave 3 で直した（`d2f6af5`）。
- 部品：R5 Citation のフェードの基準・R51 PDF の Freeze とフェード（同じ根）／R6 Flowchart の矢じりと 14px／R26 Iceberg の文言の固定
- エンジン：R7 `speaker_overrides` が使われない／R21・R50 検査が遅い（credit・asset_key・slide_events 0 件）／R46 尺の誤差率の分母の計算
- テスト：R20 図解部品と `scripts/*.mjs` のテスト（PipelineFlow と about-c の部品は足した）／R48 台本を足しても整合の検査が追いかけない・manifest が今のコードの出力と一致するかのテスト
- 文書：R19 行き先の無い文書参照 57 か所
- imagegen：R23 `--port` の前方一致／R24 smoke.py の None／R37 `-ExtraArgs` の引用／R49 カスタムノードの検査の場所と README／R52 依存のハッシュと ComfyUI のタグ固定
- 依存：R9・R10（上の未決）

## 未決（実測・作業待ち）

- `docs/design.md` (c)、字幕の要否、`docs/research/2026-09-26-image-env.md` の消滅条件。
- 点検の記録の消滅条件：上に移したので、次の Wave の G0 で扱いが決まったら畳む。
- `materials/source-to-exe/build-log.md` の古い行（説明の行に終了コード 0）は書き換えていない。次に 1 本目を検収にかけるときは、新しい節の行だけを物差しにする。

## 次の一手

Wave 4 の検収 2 回目を columba に出す（HEAD は `db4b3b1` 以降。Wave 4 は G0 承認済みなので面接は要らない。1 回目の依頼文の所在の書き方は、本セッションの記録にある）。PASS なら Wave 4 を締める（retro の要否：1 回目の FAIL は Wave 3 の学び 1 と同じ型「作業記録の行がコマンドでない」）。
その後、10/2 の授業で 1 本目・2 本目を使った結果を主人から聞く。

## 作業の作法（リポジトリ外から見えない物だけ）

- Kyozai-Athanor は読み取り専用。状態は `git ls-files`・`git log`・`git show`、`git status` は `--no-optional-locks`。
- 検収は `seneschal:columba` に出す。**columba や自分が compile／render している間は `src/`・`public/`・`out/` を触らない。**同じ作業ツリーで別ブランチに切り替えても、columba の render とぶつかる（MAGI の gabriel の指摘）。
- **作業記録（build-log.md）**は `materials/about-c/build-log.md` の「表の決まり」に従う。終了コードは叩いた直後に `echo exit=$?`。氏名などを伏せて検索するときは、一覧を scratchpad のファイルに BOM なしで置いて `grep -f`（一致 0 件は終了コード 1）。
- **書き出しの一致**：render は決定的。1 本目・2 本目は上の「現在地」の SHA-256 と比べる。java-vs-js は立ち絵を `git show 805d312:public/portraits/<名前>.png > …` で v1 に戻して書き出し、Kyozai の参照と `ffmpeg -f framemd5` で比べる（goal.md Wave 3 の最後の訂正節）。戻した後は `git checkout HEAD -- public/portraits`。scratchpad の `verify-identity.sh` は 1 本目の古い SHA-256 のままなので、使うなら値を直す。
- 図解の試写は `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <png> --frame=<N> --image-format=png --props=<props.json>`（`--image-format=png` が無いと remotion.config の既定 pdf とぶつかって落ちる）。render の後は `ffmpeg -ss <秒> -i <mp4> -frames:v 1 <png>` で切り出して Read で目視する。
- 読みの確認は VOICEVOX の `/audio_query` が返す `kana` を見る（「その間」→そのかん、「その分」→そのわけ、と読んだ）。
- 台本 YAML：js-yaml はアンカーの merge（`<<`）をしない。値が `**`・`*`・`&`・`[` で始まる箇条書きは `"…"` で囲む。
- 2 年以上の科目のシラバスの URL は、`year=` が入学年度（例：電気情報 3 年は year=2024）。
- VOICEVOX が止まっていたら、`C:/Users/metral/AppData/Local/Programs/VOICEVOX/vv-engine/run.exe --host 127.0.0.1 --port 50021` を裏で起動できる（2026-09-28）。node で `fetch` の後に `process.exit()` を呼ぶと Windows で終了時に落ちて 127 になることがある。`process.exitCode` を使う。
- VOICEVOX は 50021、ffprobe／ffmpeg は `C:\ffmpeg-essentials\bin`、ImageMagick は `magick`、`pdftotext` は Git Bash の `/mingw64/bin`、PDF のページ数は `pdf-lib`。node 24／npm 11。
- 分類器（auto mode）が止めた操作は別経路で追わない。統治文書（goal.md・brief.md）は、主人の「承認」「書込許可」の後に Edit ツールで書く。
- git は `git -C /d/work8/Laterna` で呼ぶ。リモートは `origin`（GitHub、https）。commit したら push。
- 主人のフックは「HTTP 取得の出力をインタープリタへパイプする形」を止める。HTTP は node の `fetch`。
- **シェル経由で `|`・`\`・`$` を含む文字列を書き換えると壊れやすい。**表の行や長い文書は Write／Edit ツールで書く。作業ツリーの改行は CRLF のことがある（node で書くときは元の改行を保つ）。
- full-review は `disable-model-invocation`。`scriptPath` の絶対パスは受け付けられないので、Seneschal の `full-review.js` を読んで `script` に渡す。MAGI は縦の停止のとき `adapters/claude-code/skills/magi/SKILL.md` を Read で読んで回す。
