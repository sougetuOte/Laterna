# SESSION_STATE.md — Laterna（索引。本体は各文書）

様式は Seneschal `core/handoff.md`。上限 200 行。**「次の一手」は索引であって承認ではない**（復帰時は G0 の要否を先に見る）。

## これは何か

授業用の解説動画（掛け合い）＋復習 PDF を「この題材で 1 本」で作るプロジェクト。Kyozai-Athanor のエンジンを移植し、統治の層は持ち込まない。
1 本目の期限は **2026-10-01**（10/2 の高専 1 年・初回授業で使う）。

## 読む順序

1. `README.md`（30 行）
2. `docs/brief.md`（約 120 行。決定 D1〜D10 と §9 の訂正節 D8・D9）
3. `goal.md`（Wave 1「目星」＝完了、Wave 2「1 本目」＝承認済み 2026-09-26・進行中）
4. `docs/inventory.md`（棚卸し表と依存の表。342 行）
5. `docs/design.md`（設計草案 6 節。155 行）
6. `docs/research/2026-09-26-image-env.md`（画像環境をプロジェクト内部に建てる検討）／`imagegen/README.md`
7. 統治は `D:\work8\Seneschal\core\`（README → loop → handoff）を読みに行く

## 現在地

- **Wave 1「目星」は完了**（2026-09-26。完了条件 1〜5 がすべて columba の検収を通った）。
- 動いている物（実測 2026-09-26）：Kyozai-Athanor から持っていく 90 件を切り出し、`npm install`（343 パッケージ）／`npm test` 15 files・261 tests PASS／`npm run lint` exit 0／`compile:script -- java-vs-js` は合成 0・skip 13／`render:all:script -- java-vs-js` で MP4（h264+aac、100.885333 秒）と PDF（4 ページ）。どちらも Kyozai の参照と SHA-256 が一致。
- まだ無い物：手順書 `SKILL.md` 本文、確定した立ち絵、承認済みの台本、`deliver/`。
- **Wave 2「1 本目」進行中**（G0 承認 2026-09-26。`goal.md` の Wave 2 節）。script-id は `source-to-exe`。2026-09-26 のセッション末で一段落（主人の答え待ち 2 件）。
  - **P1 画像環境**：建った（`843bdfd`。setup／`-VerifyOnly`／start／smoke（t2i 7.2 s・edit 7.5 s）／stop すべて exit 0）。**検収は未**。サーバーは停止中（`imagegen\scripts\start.ps1` で約 7 秒で上がる）。
  - **P2 台本**：下書き済み（`42817b1`。27 発話・1,715 文字・概算 263 秒。`materials/source-to-exe/outline.md` に対象・尺・章立て・出典）。**主人の承認待ち**（表はチャットで提示済み）。承認後：`outline.md` に「台本承認：YYYY-MM-DD 主人」→ `npm run compile:script -- source-to-exe`。
  - **P3 立ち絵**：候補 12 枚を生成済み（`imagegen/output/portraits/`。一覧 `sheet-narrator-bust.png`・`sheet-listener-lantern.png`・`sheet-others.png`。git 管理外、ディスク上。各 PNG の隣に生成記録 `.json`）。**主人の選択待ち**。選択後：緑背景を `magick <in> -fuzz 12% -transparent "#00FF00" <out>` で抜く → `public/portraits/<role>-default.png` と `materials/portraits/<role>-v2-full.png` → `materials/portraits/README.md`（`.json` からモデル・プロンプト・seed・加工）→ `docs/conventions/portrait-assets.md` の台帳。
  - **P4 動画・PDF・クレジット・`SKILL.md`・納品**：未着手。エンジン側は準備済み（`43b8ad9`：台本の `extra_credits`、custom 部品 `PipelineFlow`）。`materials/source-to-exe/build-log.md` に手順番号つきの記録を続ける。
  - **P5 持ち越し検証**：columba の採点時に行う（`goal.md` Wave 2 の 9 番）。

## これまで（git log が持たない解釈だけ）

| commit | 出来事 |
|---|---|
| `ba991a4` | 初回 commit（brief・goal・研究資料・README） |
| `6aafd4d` | 主人が承認した D8・D9 の訂正節を brief §9 に反映（分類器に一度止められ、主人の「書込許可」の後に Edit で通った） |
| `7ee1d02` | フェーズ (A) 棚卸し。検収 1 回目 **FAIL**（表に無い参照 1 件：`package.json` の `require('fs')`） |
| `08b76a5` | (A) 訂正。検収 2 回目 **PASS**（付記：行番号等の食い違い 6 件） |
| `f7f4d6b` | (A) PASS 後の付記 6 件の訂正。**採点されていない** → Wave 2 G0 草案の 8 番で検証行にした |
| `b6ef72d` | SESSION_STATE.md を置く |
| `805d312` | フェーズ (B) 切り出し実証（90 件＋4 ファイル編集）。検収 1 回目 **PASS** |
| `230dbbc` | フェーズ (C) 設計草案＋Wave 2 G0 草案。検収 1 回目 **PASS**（付記：草案の完了条件 4「1 回で」・6「手順と一致」に対応する検証手順が弱い） |
| `6aafd4d`〜`cc21562` | 主人の判断 3 件を反映（brief §9 訂正節・LICENSE 2 本・画像環境の検討と G0 第 2 版）。`cd2e315` のメッセージが過大だったので `cc21562` で訂正 |
| `8980aed` | Wave 2 の G0 承認。草案を畳んだ |
| `843bdfd` | P1 imagegen。**未検収** |
| `43b8ad9` | エンジン追加（`extra_credits`・`PipelineFlow`）。テスト 266 件 PASS |
| `42817b1` | P2 台本の下書き（承認待ち）と outline・build-log |

retro の起動条件（loop.md）：縦の停止なし（同一フェーズで FAIL 2 回はなかった）・主人の差し戻しなし・出荷物なし。**起動しない。**

## 決定（蒸し返さない）

brief D1〜D10 に加えて、主人がチャットで決めた物（2026-09-26）：

1. 使用場面は学校の授業で流す。情報系は高専機構の教材が勝つが、プログラム系は自作するしかない。
2. 1 本目の期限は 10/1。10/2 の初回授業（高専 1 年）用。
3. 題材は「プログラムとは」「ソースから実行ファイルまで」「開発環境とは（CLI から VSCode まで）」「AI 時代に手書きをする意義」から 1 つ。
4. 立ち絵は Claude が主体で新しく作る（バストアップ＋全身）。img2 は変えずに呼ぶ（D8 訂正）。img2 の起動は Claude がしてよい。
5. 可能な限り公開して実績にする（ライセンスは未決）。
6. Wave 1 で `public/audio`・`public/manifests`・`materials/portraits/*.kra` は git で追跡する（`docs/inventory.md` §1.7）。
7. ライセンスは MIT（コード）＋CC BY 4.0（台本・図解・教材本文。合成音声・第三者素材は対象外。生成画像は著作権が及ぶ範囲で CC BY）。主人承諾 2026-09-26。`package.json` の `license` は `MIT`。
8. 画像環境は Laterna の中に `imagegen/` として建てる（主人の指示で検討。時間・トークンは度外視）。img2 は予備経路。
9. 1 本目の題材は「ソースから実行ファイルまで」、尺 3〜5 分、納品先は `deliver/<script-id>/`、立ち絵は既存 2 人を引き継ぎつつ聞き役にランタン意匠を試す（だめなら既定）。

## 採らなかった案

| 案 | 却下理由 |
|---|---|
| 立ち絵を主人が手元で生成して納品 | 主人が不得意。後工程を見越した設計は Claude 主体の方がよい（主人 2026-09-26） |
| 立ち絵を SVG（コード）で描く | 既存の立ち絵がアニメ調の生成画で、質を落とす。検討のみで提案せず |
| 専用画像環境を 10/1 までに建てる | 間に合わない。D8 訂正で img2 を変えずに使う |
| `outline-video-1` の音声 37 MB を持ち込む | 再合成できる。台本だけ持ち込む |
| `manifest-registry` の廃止を Wave 1 で実装 | 方針まで（goal.md やらないこと）。`docs/design.md` (c) |
| `tasks.md`（specs 3 点セット）を作る | Kyozai の `docs/specs/` は持ち込まない（goal.md）。フェーズは本ファイルで追う |

## 未決（主人の判断待ち）

- **台本の承認**（`content/scripts/source-to-exe.script.yaml`。表は 2026-09-26 のチャットで提示。授業の言語が C／gcc でなければ直す）。
- **立ち絵の選択**：解説役バストアップ s1／s2／s3（推奨 s2）、聞き役はランタン版 s1／s2／s3（推奨 s2）か既定版 s1／s2。全身版は解説役 s1／s2、聞き役（ランタン）s1／s2。
- brief §6 の答え（上の「決定」1〜5・8・9）を brief に写すか（写すなら主人の承認で）。

## 未決（実測・作業待ち）

- `docs/design.md` (c)：`calculateMetadata` の `fetch(staticFile())` が `remotion render` で通るか（Wave 2 着手時に 1 回試す）。
- ComfyUI_img2 の外部向けラッパー（`img2client/`・`examples/`）の読み取りが分類器に止められた。Wave 2 で HTTP を直接使うか、主人に許可設定を頼むか。
- `npm install` が 11 件の脆弱性を報告（2 low・3 moderate・6 high。Kyozai の lock を引き継いだ物）。動画制作には効かないが、公開前に `npm audit` を見る。

## 次の一手

主人の答え（台本承認・立ち絵の選択）を受けて、P3 の背景抜きと配置 → P2 の compile（尺 180〜300 秒の確認）→ P4 の render・PDF・`SKILL.md`・納品。columba は P1 から順に出す（P1 は主人の答えを待たず出せる）。

## 作業の作法（リポジトリ外から見えない物だけ）

- Kyozai-Athanor は読み取り専用。状態は `git ls-files`・`git log`、`git status` は `--no-optional-locks`。
- 検収は `seneschal:columba` に出す。採点範囲は本フェーズの成果コミットに限る。主人の別指示は別コミット。PASS 後の直しは次の G0 の検証行に載せる。
- VOICEVOX は 50021、ffprobe は `C:fmpeg-essentialsin`、ImageMagick は `magick`。node 24／npm 11。Remotion の headless Chrome は `node_modules/.remotion/`（Kyozai 側からコピーした。270 MB）。
- 分類器（auto mode）が止めた操作は別経路で追わない。フェーズ末に主人へまとめて出す（主人が「書込許可」と言えば Edit ツールで通った）。
- Bash の作業ディレクトリは呼び出しをまたいで残る。並行した `cd` が `git add` を壊したので、git は `git -C /d/work8/Laterna` で呼ぶ。
- 主人のフックは「HTTP 取得の出力をインタープリタへパイプする形」を止める。コマンド本文にその文字列があるだけでも止まる。HTTP は `urllib` かファイル経由にし、複数行の Python は `python - <<'EOF'` かスクリプトファイルで渡す（`python -c` の複数行は shim が壊す）。
- `.ps1` は BOM 付き UTF-8 で書く（無いと PowerShell 5.1 で構文エラー）。PowerShell の出力は cp932。`sleep` 先頭の待ちは止められるので、待つなら `run_in_background` の `until` ループ。
