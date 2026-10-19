# SESSION_STATE.md — Laterna（索引。本体は各文書）

様式は Seneschal `core/handoff.md`。上限 200 行。**「次の一手」は索引であって承認ではない**（復帰時は G0 の要否を先に見る）。

## これは何か

授業用の解説動画（掛け合い）＋復習 PDF を「この題材で 1 本」で作るプロジェクト。Kyozai-Athanor のエンジンを移植し、統治の層は持ち込まない。
1 本目「ソースから実行ファイルまで」（`source-to-exe`）と 2 本目「C言語について」（`about-c`）を納品した（`deliver/<script-id>/`）。どちらも 2026-10-02 の授業で使う（1 本目は高専 1 年の初回、2 本目は電気情報工学科 1 年のプログラミング言語入門と機械工学科 3 年の情報処理Ⅰ）。
**Wave 3「2 本目」は 2026-09-27 に検収 PASS で締めた。**
**Wave 4「3 本目：Pythonが動くまで」（`python-runs`、汎用・期限 2027-01-10）は 2026-09-29 に検収 PASS で締めた。**
**Wave 5「写真とスクショを載せる経路と、PDF の組み直し」は 2026-10-03 に検収 1 回目で PASS し、締めた。**3 本目の改訂版は 10/5 か 10/6 の後期の初回（専門学校 1 年）で使う。
**Wave 6「4 本目：Webサーバーと Flask のしくみ」（`web-flask`）は 2026-10-06 に納品した。検収は 1 回目 FAIL の後、2 回目が未了（締めていない）。**
**Wave 7「5 本目：ネットワークの地図」（`network-map`、高専 2 年の遠隔回 2026-10-20 用）は 2026-10-19 に納品した。検収は授業の後に出す。**

## 読む順序

1. `README.md`（34 行）
2. `docs/brief.md`（147 行。決定 D1〜D10 と §9 の訂正節 D8・D9・§6 の答え）
3. `goal.md`（Wave 1〜5 は完了。Wave 6・7 は納品済みで検収待ち。**末尾の Wave 7 節と、その訂正節（検証 6）**が直近の契約。Wave 6 節にも訂正節（教科書の年）が 1 つ）
4. `SKILL.md`（159 行。「この題材で 1 本」の手順書。手順 0 の 5 に作業記録の書き方を足した）
5. `materials/network-map/`（outline.md の「行き先の対応」と試写の記録、images.md、build-log.md）、`materials/web-flask/`、`materials/python-runs/`（outline.md の出典 19・事実と出典の対応 18 行・台本承認と試写の記録、build-log.md（Wave 5 の節あり）、description.md、images.md（画像の出典の記録））、`materials/about-c/`（build-log.md の「表の決まり」）、`materials/source-to-exe/`
6. `docs/research/2026-09-27-review.md`（198 行。点検の記録。「Wave 3 以降へ」の行は下の未決に移した）
7. `docs/inventory.md`／`docs/design.md`／`imagegen/README.md`
8. 統治は Seneschal の `core/`（README → loop → handoff。場所は、入口を `/seneschal:seneschal 条文` で起動すると出る表）を読みに行く

## 現在地

- **Wave 1「目星」**・**Wave 2「1 本目」**（2026-09-26）・**Wave 2.5「点検」**（2026-09-27 午前）は完了。GitHub に Public で公開済み（https://github.com/sougetuOte/Laterna ）。
- **Wave 3「2 本目：C言語について」は完了**（2026-09-27。起点 `c4e6ffe`）：about-c、9 分 6 秒・PDF 17 ページ。検収は FAIL 2 回 → MAGI → PASS → 訂正節の後に数え直して PASS（`9954bdd`）。詳細は `materials/about-c/build-log.md` と goal.md の Wave 3 節。
- **Wave 4「3 本目：Pythonが動くまで」は完了**（2026-09-28〜29。起点 `79ad909`）：python-runs、8 分 32 秒。検収は FAIL 2 回（検証 6、検証 5 の氏名の一覧の所在）→ MAGI → 3 回目 PASS（HEAD `7adcf12`）。詳細は `materials/python-runs/build-log.md`。
- **Wave 5「写真とスクショを載せる経路と、PDF の組み直し」は完了**（2026-10-03。起点 `2c9cfb5`）：PDF を A4 縦に組み直し、`type: image` と出典台帳（許可リスト CC0・PD・CC-BY-4.0/3.0/2.0・self・quotation）を足し、3 本目に写真と画面写しを載せた。検収 1 回目 PASS（HEAD `8a38d54`）。
- **Wave 6「4 本目：Webサーバーと Flask のしくみ」は納品済み・検収未了**（2026-10-06。G0 承認 07:52 JST ごろ。起点 `1e75394`。成果コミット `adc9cc8`・`8ce1548`（試写「特に問題なし」）・`dfb4853`（検収 1 回目の後の直し）・`67e7269`（訂正節：教科書の年を外した））：
  - 6 分 1 秒・PDF 12 ページ。Flask 2.3.2 を scratchpad の venv で動かした。
  - 検収：1 回目 **FAIL**（検証 1。スライドの「Python 3.12」が対応表に無かった）→ `dfb4853` で直した → 訂正節で動画を直し、納品物を差し替えた（今の MP4 `5795abd2…8553`・PDF `53f325fe…892e`。`materials/web-flask/build-log.md` に記録）→ **2 回目は未了**。
- **Wave 7「5 本目：ネットワークの地図」は納品済み・検収待ち**（2026-10-19。G0 承認 08:16 JST ごろ、セッション `926e6c2e-da6d-4224-ad77-32500183afeb`。起点 `9a8ee97`。成果コミット `cc83163` から。依頼書・補助資料・教科書の写真は repo の外）：
  - 8 分 50 秒（529.7 秒）・PDF 18 ページ。59 発話・18 スライド。図は補助資料の自作の図 5 枚（`license: self`）、ARPANET の地図（PD）、光ファイバの写真（CC BY 4.0、Sunmosk）。表は 3 本目の `CompareTable`。`src/` の変更は `manifest-registry.ts` への追加だけ。
  - 主人の試写：1 回目で「DNS と電話帳のたとえが学生の年代に分からない」→ スマホの連絡先に替えた → 2 回目「問題なし」。納品物 MP4 `0a4740b5…2cdb`・PDF `5e464157…7c09`。
  - 本セッションの実測：`npm test` 22 files / 405 tests PASS、`npm run lint` exit 0。outline.md の出典 URL 27 本は、取得したときすべて HTTP 200。台本・PDF に復習問題の数値・氏名・学校名 0 件。
- 動いている物：既存 4 本（source-to-exe・about-c・python-runs・web-flask）の納品物は `deliver/<script-id>/` にあり、render は決定的なので書き出し直すと SHA-256 が一致する（Wave 7 の検証 9 で確かめる）。java-vs-js は Kyozai の参照との比べ方が goal.md の Wave 3 の訂正節にある。`npm audit` は low 2 件（eslint 系、決定 15）。
- まだ無い物：字幕・口パク・`manifest-registry.ts` の廃止（(c)）・compile 時の画像生成（D10、`license: generated`）・概要欄の自動書き出し。

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
| `db4b3b1` | 作業記録の still の行（4 行に分けた）と VOICEVOX の「同上」の行を、叩いたコマンドそのものに直した |
| `7adcf12` の後（締め） | 検収 2 回目 **FAIL**（検証 5 の氏名が測れない。依頼文に一覧の所在が無かった）→ MAGI（結論：一覧の絶対パス 1 本・形の確かめ・件数だけの grep を依頼文に書き、検証 5 だけを採点し直す。一覧の網羅は主人が確かめた）→ 3 回目 **PASS**。Wave 4 を締めた |
| 2026-10-01 | 未決 4 件の処置（主人の判断）：brief §9 に §6 の答えを写した（主人承認）、依存は次の Wave で直す（決定 19）、氏名の一覧を repo の外の固定の置き場所へ移した（決定 20）、Seneschal への文面を repo の外に置いた |
| `2c9cfb5`・`ff41a77` | brief §9 に D7 訂正（Web の画面写しを引用として載せてよい）。Wave 5 の G0（10/2 の授業の結果と画像の経路を 1 つに。期限 10/4） |
| `5affff2`〜`8a38d54` | Wave 5 の A〜D と納品。`8480145` は検証 8 の訂正節（package-lock.json の integrity の base64 に一覧の 3 字が当たる）。検収 1 回目 PASS |
| `66c1b8b`〜`67e7269` | Wave 6（4 本目 web-flask）。授業当日の朝に G0 から納品まで。検収 1 回目 FAIL（検証 1）の後に直し、訂正節（教科書の年）で動画を差し替えた。SESSION_STATE は更新されず、2 回目の検収も出していなかった |
| `cb31fe8`・`9a8ee97` | 2026-10-14、Seneschal を公開のプラグインに替えた（主人承認。主人は 2026-10-19 の Wave 7 の G0 で「承認している」と答えた）。検収は通っていないので、Wave 7 の検証 11 で確かめる |
| `3e7387b`〜 | Wave 7（5 本目 network-map）。G0（CC BY-SA の写真は使わず代わりを探す）→ 訂正節（検証 6 の写真のファイル名）→ 台本承認 → 試写 1 回目で DNS のたとえを直す → 試写 2 回目「問題なし」→ 納品 |

**retro（2026-09-29、Wave 4 の締め。起動条件 1）**：repo の外にある物差し（氏名の一覧など）は、依頼文に絶対パス・形の確かめ方・出力の絞り方を書かない限り評価器に届かない → 「作業の作法」の作業記録の行に足した。Seneschal へ渡す文面は `D:\work8\laterna-to-seneschal-2026-10-01.md`（repo の外。主人が渡す）。

**retro（2026-09-27、Wave 3 の締め。起動条件 1 と 3）**：(1) 終了コードは叩いたその場で `echo exit=$?` で取る（SKILL.md 手順 0 の 5）。(2) 前の回で検収を通った書き方でも正しいとは限らない。(3) 後回しにした見た目の所見は、次の回の G0 の「試写で見る点」に入れる。

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
18. 画像生成は Laterna の `imagegen/`（FLUX.2 klein 4B）を使う。ComfyUI_img2 は使わない（brief D8 のまま。2026-09-29 主人）。
19. 依存：R9（使われていない `@remotion/media` を外す）と R10（`@types/node` を宣言する）は、次の Wave で画像の作業とは別の commit にして直し、3 本の書き出しの SHA-256 が変わらないことで確かめる。eslint の `--force` は据え置く（決定 15。2026-10-01 主人）。
20. 主人の氏名の一覧は、repo の外の固定の置き場所 `D:\work8\Laterna-private\names.txt` に置く（10 行。中身はどこにも書かない）。次の G0 から、検証方法にこのパスを書く。scratchpad にあった写しは消した（2026-10-01 主人）。
21. 画像の調達（brief D7 と §9 の D7 訂正、2026-10-03 主人）：現物の写真は主人が撮った物か CC0・PD・CC BY の物。Web の画面写しは引用として載せ（出典・取得日を画面と概要欄に、切り抜き以外の改変なし、CC BY 4.0 の対象外）、Claude が撮るか主人が撮る。imagegen も使ってよい（compile 時の生成 D10 は次の Wave）。
22. PDF は A4 縦で、スライドと掛け合いの文を同じ幅にそろえる（2026-10-03 主人）。
23. 3 本目は 10/5 か 10/6 の後期の初回に使う（2026-10-03 主人。Wave 4 の期限 2027-01-10 は主人の思い違いの可能性があると主人が言った。動画は既に出来ていたので実害なし）。10/2 の授業で全部を流せなかった件は、今のままでよい。
24. 情報系の題材でも、授業中に流すのでなく遠隔回の自習に使うなら Laterna で作る（2026-10-15 主人、依頼書。決定 1 の「機構の教材が勝つ」は授業中に流す場合の話）。動画は「地図」で、行き先（教科書のページと補助資料の節）を言い、問題の答えの数値は言わない。
25. CC BY-SA の画像は使わない（brief D7 のまま）。代わりは CC0・PD・CC BY を軽く探し、無ければ無しで進める（2026-10-19 主人）。
26. Wave 7 の検収と Wave 6 の検収 2 回目は、2026-10-20 の授業の後に、Wave 7 → Wave 6 の順に出す（2026-10-19 主人）。

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

- 5 本目 network-map を 2026-10-20 の遠隔回（3 クラス）で使った結果（主人の受け入れ。検収の採点対象外）。
- 依頼のフォルダの `00_目録.md` の教科書の写真の割り当てが 4 か所ずれている件（主人へ報告済み。目録は claude.ai 側の物なので、こちらでは書き換えない。詳細は `materials/network-map/outline.md` の末尾）。
- 次の Wave の題材（候補：6 本目、D10 の compile 時の画像生成、点検の残り、字幕）。
- （3 本目の授業での評判は Wave 6 の G0 で「悪くなかった」と聞いた。10/2 の授業の受け入れは Wave 5 の G0 で処置した）

## 未決（点検の記録から移した「Wave 3 以降へ」の所見。次の Wave の G0 で扱う）

`docs/research/2026-09-27-review.md` の表の行。R1〜R3 は Wave 3 で直した（`d2f6af5`）。
- 部品：R5 Citation のフェードの基準・R51 PDF の Freeze とフェード（同じ根）／R6 Flowchart の矢じりと 14px／R26 Iceberg の文言の固定
- エンジン：R7 `speaker_overrides` が使われない／R21・R50 検査が遅い（credit・asset_key・slide_events 0 件）／R46 尺の誤差率の分母の計算
- テスト：R20 図解部品と `scripts/*.mjs` のテスト（PipelineFlow と about-c の部品は足した）／R48 台本を足しても整合の検査が追いかけない・manifest が今のコードの出力と一致するかのテスト
- 文書：R19 行き先の無い文書参照 57 か所
- imagegen：R23 `--port` の前方一致／R24 smoke.py の None／R37 `-ExtraArgs` の引用／R49 カスタムノードの検査の場所と README／R52 依存のハッシュと ComfyUI のタグ固定
- 依存：R9・R10 は Wave 5 で直した（`5affff2`）。R9 の残り（テストだけが呼ぶ関数・`_fps`）は「直さない」のまま

## 未決（実測・作業待ち）

- `docs/design.md` (c)、字幕の要否、`docs/research/2026-09-26-image-env.md` の消滅条件。
- 点検の記録の消滅条件：上に移したので、次の Wave の G0 で扱いが決まったら畳む。
- `materials/source-to-exe/build-log.md` の古い行（説明の行に終了コード 0）は書き換えていない。次に 1 本目を検収にかけるときは、新しい節の行だけを物差しにする。

## 次の一手

2026-10-20 の授業の後に、Wave 7 の検収を `seneschal:columba` に出す（物差しは goal.md 末尾の Wave 7 節と、その訂正節。依頼文には依頼のフォルダの絶対パス、氏名の一覧のパスと形の確かめ方、本 Wave のセッション id を書く）。その後で Wave 6 の検収 2 回目を出し（決定 26）、2 つとも締めたら主人に遠隔回の結果を聞く。次の Wave の題材は主人が決め、G0 から始める。

## 作業の作法（リポジトリ外から見えない物だけ）

- Kyozai-Athanor は読み取り専用。状態は `git ls-files`・`git log`・`git show`、`git status` は `--no-optional-locks`。
- 検収は `seneschal:columba` に出す。**columba や自分が compile／render している間は `src/`・`public/`・`out/` を触らない。**同じ作業ツリーで別ブランチに切り替えても、columba の render とぶつかる（MAGI の gabriel の指摘）。
- **作業記録（build-log.md）**は `materials/about-c/build-log.md` の「表の決まり」に従う。終了コードは叩いた直後に `echo exit=$?`。氏名などを伏せて検索するときは、一覧 `D:\work8\Laterna-private\names.txt`（決定 20）で `grep -f`（一致 0 件は終了コード 1）。**検収の依頼文には、一覧の絶対パスと形の確かめ方（行数・空行・行末の空白・BOM。中身は出さない）を書き、検索は `grep -F -i` の `-c`・`-l`・`-q` に限らせる。**依頼の前に一覧が在るかを確かめ、無ければ主人に作り直しを頼む（網羅は主人に確かめてもらう）。CRLF の一覧でも、この機械の grep は LF のテキストに当たる（2026-09-29 実測）。
- **書き出しの一致**：render は決定的。1 本目・2 本目は上の「現在地」の SHA-256 と比べる。java-vs-js は立ち絵を `git show 805d312:public/portraits/<名前>.png > …` で v1 に戻して書き出し、Kyozai の参照と `ffmpeg -f framemd5` で比べる（goal.md Wave 3 の最後の訂正節）。戻した後は `git checkout HEAD -- public/portraits`。scratchpad の `verify-identity.sh` は 1 本目の古い SHA-256 のままなので、使うなら値を直す。
- 図解の試写は `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <png> --frame=<N> --image-format=png --props=<props.json>`（`--image-format=png` が無いと remotion.config の既定 pdf とぶつかって落ちる）。render の後は `ffmpeg -ss <秒> -i <mp4> -frames:v 1 <png>` で切り出して Read で目視する。
- 読みの確認は VOICEVOX の `/audio_query` が返す `kana` を見る（「その間」→そのかん、「その分」→そのわけ、と読んだ）。
- 台本 YAML：js-yaml はアンカーの merge（`<<`）をしない。値が `**`・`*`・`&`・`[` で始まる箇条書きは `"…"` で囲む。
- 2 年以上の科目のシラバスの URL は、`year=` が入学年度（例：電気情報 3 年は year=2024）。
- VOICEVOX は 50021、ffprobe／ffmpeg は `C:\ffmpeg-essentials\bin`、ImageMagick は `magick`、`pdftotext` は Git Bash の `/mingw64/bin`、PDF のページ数は `pdf-lib`。node 24／npm 11。
- 分類器（auto mode）が止めた操作は別経路で追わない。統治文書（goal.md・brief.md）は、主人の「承認」「書込許可」の後に Edit ツールで書く。
- 内蔵ブラウザのサイトの許可は「設定」→「Claude in Chrome」の「サイトの権限」（既定は「すべてのサイトをブロック」）と「Claude Code」→「ブラウザ」→「許可されたサイト」にある。2026-10-03 に python.org を両方に足しても内蔵ブラウザでは開けなかったので、主人が画面を撮った。Wikimedia Commons は node の `fetch` で API（`imageinfo`・`extmetadata`）から取れる。
- PDF の文字数の上限を測り直すときは、`public/manifests/<id>.pdf-manifest.json` の 1 ページを実際の発話で詰めて（`<scratchpad>/fill-page.mjs` の型）`remotion-cli.js still … ScriptPdfComposition` で描き、`git checkout`（未 commit なら写し）で戻す。
- full-review は `disable-model-invocation`。`scriptPath` の絶対パスは受け付けられないので、Seneschal の `full-review.js` を読んで `script` に渡す。MAGI は縦の停止のとき `adapters/claude-code/skills/magi/SKILL.md` を Read で読んで回す。
