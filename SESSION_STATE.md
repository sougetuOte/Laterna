# SESSION_STATE.md — Laterna（索引。本体は各文書）

様式は Seneschal `core/handoff.md`。上限 200 行。**「次の一手」は索引であって承認ではない**（復帰時は G0 の要否を先に見る）。

## これは何か

授業用の解説動画（掛け合い）＋復習 PDF を「この題材で 1 本」で作るプロジェクト。Kyozai-Athanor のエンジンを移植し、統治の層は持ち込まない。
1 本目「ソースから実行ファイルまで」（`source-to-exe`）は 2026-09-26 に納品し検収を通った（`deliver/source-to-exe/`）。10/2 の高専 1 年・初回授業で使う。
**いまは Wave 2.5「点検」（レビューとリファクタリング）の途中。作業はブランチ `wave2.5-review`。検収 PASS まで main に合流しない。**

## 読む順序

1. `README.md`（34 行）
2. `docs/brief.md`（134 行。決定 D1〜D10 と §9 の訂正節 D8・D9）
3. `goal.md`（254 行。Wave 1・2 は完了。**末尾の Wave 2.5「点検」節がいまの契約**）
4. `docs/research/2026-09-27-review.md`（196 行。点検の記録 ── 所見 R1〜R52 の処置・優先度・full-review の結果）
5. `SKILL.md`（158 行。「この題材で 1 本」の手順書）
6. `materials/source-to-exe/`、`materials/portraits/README.md`
7. `docs/inventory.md`（343 行）／`docs/design.md`（155 行）／`imagegen/README.md`
8. 統治は `D:\work8\Seneschal\core\`（README → loop → handoff）を読みに行く

## 現在地

- **Wave 1「目星」**・**Wave 2「1 本目」**は完了（2026-09-26。columba の検収 PASS）。GitHub に Public で公開済み（https://github.com/sougetuOte/Laterna ）。
- **Wave 2.5「点検」**（2026-09-27 着手。G0 承認 06:15 JST「1 承認 2 OK 3 OK」、セッション `15a2552d-a599-4152-954c-132b22769ae3`。止め時 10/1）：
  - 済：依存の更新（`ae82551`。脆弱性 11 件 → low 2 件）／点検（built-in `/code-review` high、`engineering:tech-debt`）／出力を変えない直し（`0b3c2ab`・`c787f90`・`e0f711c`・`6c7606f`・`9939fa1`・`dece5bb`）／`/simplify`（読み手 `seneschal:lens` 4 人）とその直し（`38957fa`・`1d3f122`）。
  - 済：full-review（主人が起動、セッション `dbf265b1-7f84-42eb-91c5-39487434671c`、Workflow `wf_cb7b7981-ddc`）。**Green ではない**（上限 5 周、指摘 13・10・6・12・6、テストは毎周すべて通過）。直しは `d732c3f`・`51f84c5`・`2322351`・`6859922`。残りと主人へ回した物は、主人の判断「推奨どおり」で Wave 3 以降へ／直さない（記録の R45〜R52）。
  - 未：`/security-review` → columba の検収 → 締め。
- 動いている物（実測 2026-09-27、full-review の直しの後）：
  - `npm test` 18 files / 350 tests PASS、`npm run lint` exit 0（R47 のテストを足した後、本体が実測）。
  - 書き出しの一致（goal.md 検証 3）：full-review の 5 周とも、試験役が直しの後の作業ツリーで測って一致（source-to-exe は納品物と、java-vs-js は Kyozai の参照と SHA-256 一致、manifest・音声は `6cbaf95` と同じ）。R47 のテストとコメント（R46）はその後の変更で、出力に関わらない。
  - `npm audit`：low 2 件（eslint 系。`--force` は Wave 3）。
  - VOICEVOX 0.25.2（50021）は起動中だった。imagegen は 2026-09-27 に起動していない。
- 1 本目の納品物に出ている不具合（**直していない**。主人の判断「1 推奨で直さない」2026-09-27 07:04 JST ── 10/2 は今の版で使い、Wave 3 で直す）：R1 全体図（79〜100 秒）で hello.c だけが光る／R2 強調した矢印の矢じりが線に埋もれる（100 秒〜）／R3 PDF 最終ページの注記「立ち絵は各権利者の規約に従います」が `LICENSE-CONTENT`（立ち絵も CC BY 4.0）と食い違う。
- まだ無い物：字幕・口パク・`manifest-registry.ts` の廃止（(c)）・画像スライド（Wave 3）。

## これまで（git log が持たない解釈だけ）

| commit | 出来事 |
|---|---|
| `ba991a4` | 初回 commit（brief・goal・研究資料・README） |
| `6aafd4d` | 主人が承認した D8・D9 の訂正節を brief §9 に反映（分類器に一度止められ、主人の「書込許可」の後に Edit で通った） |
| `7ee1d02`・`08b76a5` | フェーズ (A) 棚卸し。検収 1 回目 **FAIL**（表に無い参照 1 件）→ 2 回目 **PASS** |
| `805d312` | フェーズ (B) 切り出し実証。**PASS** |
| `230dbbc`・`8980aed` | フェーズ (C) 設計草案。**PASS**。Wave 2 の G0 承認 |
| `843bdfd` | P1 imagegen。**PASS** |
| `e81e6b4` | 台本の箇条書き（先頭 `**`）を引用符で囲む。js-yaml が alias と読んで compile が通らなかった |
| `5c4990b`・`85390b7` | 立ち絵 v2、render・SKILL.md・納品。1 回目の試写で 2 件の不具合を見つけて直した |
| `f410027` | **主人の差し戻し**：聞き役が画面外を向いていた（retro 1 回目。学びは SKILL.md 手順 6） |
| `ac7b2e5` | goal.md に検証 9(ii) の訂正節（主人承認）。columba 2〜9 **全体 PASS** |
| `36fe414`・`6cbaf95` | ライセンス節と VOICEVOX 規約の URL、GitHub 公開（主人指示）。Wave 2.5 の起点は `6cbaf95` |
| `02478ed` | Wave 2.5「点検」の G0（main に入れた）。草案は着手前に `seneschal:gabriel` が点検し、指摘 25 件を反映 |
| `ae82551` | `npm audit fix`（`--force` なし）。34 パッケージが入れ替わり、出力はバイト一致 |
| `cf23a24` | 点検の記録。納品 MP4 のフレームを切り出して R1・R2 を目視で確かめた |
| `9939fa1` → `38957fa` | script-id の文字種を絞る直し（R4）を、`/simplify` の直す深さの指摘で、シェルを通さない Remotion 呼び出しに作り直した |

retro の起動条件（loop.md）：Wave 2.5 では FAIL 0 回、主人の差し戻し 0 回。R1〜R3 は出荷した 1 本目の不具合で、主人の判断で Wave 3 に回した。**Wave 3 で直せば条件 3（出荷物が次の回で直しの対象になった）に当たる**。

## 決定（蒸し返さない）

brief D1〜D10 に加えて、主人がチャットで決めた物：

1. 使用場面は学校の授業で流す。情報系は高専機構の教材が勝つが、プログラム系は自作するしかない。
2. 1 本目の期限は 10/1。10/2 の初回授業（高専 1 年）用。
3. 題材は「ソースから実行ファイルまで」、尺 3〜5 分、納品先は `deliver/<script-id>/`。
4. 立ち絵は Claude が主体で作る。採用は解説役バストアップ s2・聞き役ランタン版 s2。
5. 可能な限り公開して実績にする。ライセンスは MIT（コード）＋CC BY 4.0（台本・図解・教材本文・立ち絵。合成音声・第三者素材は対象外）。
6. `public/audio`・`public/manifests`・`materials/portraits/*.kra` は git で追跡する。
7. 画像環境は Laterna の中に `imagegen/` として建てる。img2 は予備経路。
8. 台本の本文は compile の前に表で主人に見せて承認をもらう。
9. `manifest-registry.ts` は手動追記で出した。(c) の廃止の試みは Wave 3。
10. custom スライドは部品側で白いパネルを描く。code スライドの `<pre>` は inline-block・左揃え・40px。
11. 立ち絵のファイルは 2 枚とも「向かって右」を向いた絵にする（右カラムはレンダラーが反転する）。
12. **Wave 2.5「点検」**は feature として G0 を通した（Seneschal にリファクタリングの種別が無い）。止め時 10/1。ブランチで進め、検収 PASS まで main に合流しない（2026-09-27 主人承認）。
13. 本 Wave は full-review を使う。起動は主人（`/seneschal:full-review`）。brief §8 の「重い手法は既定では使わない」は、主人の指示で本 Wave に限り外した。
14. `npm audit fix` は `--force` なしだけ（主人 OK）。eslint を上げる `--force` は Wave 3。
15. Remotion CLI はシェルを通さず、`process.execPath` ＋ `@remotion/cli/remotion-cli.js` で呼ぶ（`scripts/remotion-cli.mjs`）。script-id の文字種の検査は compile の入口（`cli.ts`）の 1 か所（規則の本体は `schema/script.ts` の `FILE_SAFE_ID_PATTERN` で、発話 id と共有。点検 R32）。
16. **1 本目の R1〜R3（図解の強調 2 件・PDF のライセンス注記）は直さず、10/2 は今の版で使う。Wave 3 で直す**（主人「1 推奨で直さない」2026-09-27 07:04 JST）。

## 採らなかった案

| 案 | 却下理由 |
|---|---|
| 立ち絵を主人が手元で生成して納品 | 主人が不得意。後工程を見越した設計は Claude 主体のほうがよい |
| 聞き役の向きをレンダラー側（`scaleX(-1)` の撤去）で直す | java-vs-js の render 経路が変わり、Kyozai との再現性の物差しが使えなくなる |
| bullets スライドの中央寄せを直す | 出力が変わる（java-vs-js も bullets を使う）。Wave 3 で検討 |
| script-id の文字種をスクリプト側（`scripts/script-id.mjs`）でも検査する（`9939fa1`） | 原因（シェルで引数がつながれる）を残した手当てで、規則が 2 か所に分かれた。シェル無しで呼べば要らない |
| `countSpeechCharacters` を `shared/` に移す | 本番の損は 0（テスト単独の読み込みで約 30ms）。1 関数のファイルを足すほどではない |
| 使われない `resolveComponent`・`findActiveSlideEvent` を消す | テストが固定していて、消すとテストの削除になる（本 Wave のやらないこと） |
| full-review の対象を 4 つに分ける | 1 周で監査役が 13 人になる。対象は 1 つにして、監査役 4 人＋試験役 1 人 |
| `tasks.md`（specs 3 点セット）を作る | Kyozai の `docs/specs/` は持ち込まない。フェーズは本ファイルで追う |

## 未決（主人の判断待ち）

- 10/2 の授業での受け入れ（使えなかった点は Wave 3 の G0 に書く）。
- brief §6 の答え（上の「決定」1〜5・7）を brief 本文に写すか。
- Wave 3 以降に回した依存の変更：`@types/node` の宣言（R10）、使われていない `@remotion/media` の削除（R9）、eslint の `--force`。

## 未決（実測・作業待ち）

- `/security-review`（本 Wave の最終差分）→ 点検の記録の「使った道具」の行を埋める → columba の検収（goal.md Wave 2.5 の検証 1〜8）→ 締め（本ファイルの更新、main へ合流、push）。
- `docs/design.md` (c)、字幕の要否、bullets のマーカー位置、`docs/research/2026-09-26-image-env.md` の消滅条件（Wave 3 の着手時）。

## 次の一手

`/security-review` を本 Wave の最終差分（`6cbaf95..HEAD`）に掛け、結果を点検の記録に書く。その後 columba に検収を出す。

## 作業の作法（リポジトリ外から見えない物だけ）

- Kyozai-Athanor は読み取り専用。状態は `git ls-files`・`git log`・`git show`、`git status` は `--no-optional-locks`。
- 検収は `seneschal:columba` に出す。採点範囲は本フェーズの成果コミットに限る（Wave 2.5 は goal.md の「採点範囲」）。主人の別指示は別コミット。**columba や自分が compile／render している間は `src/`・`public/`・`out/` を触らない。imagegen の start／stop も columba と同時に使わない。**
- **書き出しの一致（goal.md Wave 2.5 検証 3）**の取り方：VOICEVOX 0.25.2 を起動して、(a) compile 2 本と `git diff --exit-code 6cbaf95 -- public/manifests public/audio`、(b) source-to-exe を render して納品物の SHA-256 と比べる、(c) 立ち絵を `git show 805d312:public/portraits/<名前>.png > …` で v1 に戻して java-vs-js を render し Kyozai の参照と比べ、`git checkout HEAD -- public/portraits` で戻す。2 本で 10 分ほど。前のセッションの scratchpad（`C:\Users\metral\AppData\Local\Temp\claude\D--work8-Laterna\15a2552d-a599-4152-954c-132b22769ae3\scratchpad\verify-identity.sh`）に手順を回すスクリプトがある。消えていたら goal.md の検証 3 から作り直す（常設スクリプトはリポジトリに入れない）。
- full-review は `disable-model-invocation`。主人が `/seneschal:full-review` を打ったら、SKILL.md の手順どおり引数（点検の記録の案。testCommands の 3 本目に上のスクリプトのパスを入れる）を揃えて Workflow を起動する。結果は主人に見せてから commit する。
- VOICEVOX は 50021、ffprobe／ffmpeg は `C:\ffmpeg-essentials\bin`、ImageMagick は `magick`、PDF のページ数は `pdf-lib`。node 24／npm 11。Remotion の headless Chrome は `node_modules/.remotion/`（270 MB。`npm audit fix` では消えなかった）。
- 分類器（auto mode）が止めた操作は別経路で追わない。統治文書（goal.md・brief.md）は、主人の「承認」「書込許可」の後に Edit ツールで書く。
- Bash の作業ディレクトリは呼び出しをまたいで残る。git は `git -C /d/work8/Laterna` で呼ぶ。
- リモートは `origin`（GitHub、https）。commit したら push（作業ブランチも push する）。`gh` は sougetuOte でログイン済み。
- 主人のフックは「HTTP 取得の出力をインタープリタへパイプする形」を止める。HTTP は `urllib` か node の `fetch`、複数行の Python は `python - <<'EOF'`。
- **150 行超のヒアドキュメント（引用符・バッククォートを含む）は bash が失敗する。**長い文書は Write ツールで書く。
- `.ps1` は BOM 付き UTF-8。PowerShell の出力は cp932。待つなら `run_in_background` で回して完了の通知を待つ。
- 台本 YAML：値が `**`・`*`・`&`・`[` で始まる箇条書きは `"…"` で囲む。
- render の後は `ffmpeg -ss <秒> -i <mp4> -frames:v 1 <png>` でフレームを切り出し、Read で目視する（図解の重なり・code の中央寄せ・立ち絵の向き・図解の強調）。
