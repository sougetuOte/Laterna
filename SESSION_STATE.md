# SESSION_STATE.md — Laterna（索引。本体は各文書）

様式は Seneschal `core/handoff.md`。上限 200 行。**「次の一手」は索引であって承認ではない**（復帰時は G0 の要否を先に見る）。

## これは何か

授業用の解説動画（掛け合い）＋復習 PDF を「この題材で 1 本」で作るプロジェクト。Kyozai-Athanor のエンジンを移植し、統治の層は持ち込まない。
1 本目の期限は **2026-10-01**（10/2 の高専 1 年・初回授業で使う）。

## 読む順序

1. `README.md`（30 行）
2. `docs/brief.md`（約 110 行。決定 D1〜D10。D8・D9 の訂正節は主人承認済みだが未反映 → 下の「未決（主人）」）
3. `goal.md`（Wave 1「目星」。承認済み 2026-09-26。**Wave 1 は完了**）
4. `docs/inventory.md`（棚卸し表と依存の表。342 行）
5. `docs/design.md`（設計草案 6 節。155 行）
6. `docs/research/wave2-g0-draft.md`（Wave 2 の 3 項。完了条件 8 ↔ 検証方法 8。**次の G0 の起点**）
7. 統治は `D:\work8\Seneschal\core\`（README → loop → handoff）を読みに行く

## 現在地

- **Wave 1「目星」は完了**（2026-09-26。完了条件 1〜5 がすべて columba の検収を通った）。
- 動いている物（実測 2026-09-26）：Kyozai-Athanor から持っていく 90 件を切り出し、`npm install`（343 パッケージ）／`npm test` 15 files・261 tests PASS／`npm run lint` exit 0／`compile:script -- java-vs-js` は合成 0・skip 13／`render:all:script -- java-vs-js` で MP4（h264+aac、100.885333 秒）と PDF（4 ページ）。どちらも Kyozai の参照と SHA-256 が一致。
- まだ無い物：手順書 `SKILL.md` 本文、新しい立ち絵、1 本目の台本、`LICENSE`、Wave 2 の `goal.md`。
- 次は **Wave 2 の G0（面接）**。草案は `docs/research/wave2-g0-draft.md`。

## これまで（git log が持たない解釈だけ）

| commit | 出来事 |
|---|---|
| `ba991a4` | 初回 commit（brief・goal・研究資料・README） |
| （なし） | 主人が D8・D9 の訂正を承認（2026-09-26 チャット）。**auto mode の分類器が `docs/brief.md` への書き込みを止めたため未反映**。文面は「未決（主人）」に控えた |
| `7ee1d02` | フェーズ (A) 棚卸し。検収 1 回目 **FAIL**（表に無い参照 1 件：`package.json` の `require('fs')`） |
| `08b76a5` | (A) 訂正。検収 2 回目 **PASS**（付記：行番号等の食い違い 6 件） |
| `f7f4d6b` | (A) PASS 後の付記 6 件の訂正。**採点されていない** → Wave 2 G0 草案の 8 番で検証行にした |
| `b6ef72d` | SESSION_STATE.md を置く |
| `805d312` | フェーズ (B) 切り出し実証（90 件＋4 ファイル編集）。検収 1 回目 **PASS** |
| `230dbbc` | フェーズ (C) 設計草案＋Wave 2 G0 草案。検収 1 回目 **PASS**（付記：草案の完了条件 4「1 回で」・6「手順と一致」に対応する検証手順が弱い） |

retro の起動条件（loop.md）：縦の停止なし（同一フェーズで FAIL 2 回はなかった）・主人の差し戻しなし・出荷物なし。**起動しない。**

## 決定（蒸し返さない）

brief D1〜D10 に加えて、主人がチャットで決めた物（2026-09-26）：

1. 使用場面は学校の授業で流す。情報系は高専機構の教材が勝つが、プログラム系は自作するしかない。
2. 1 本目の期限は 10/1。10/2 の初回授業（高専 1 年）用。
3. 題材は「プログラムとは」「ソースから実行ファイルまで」「開発環境とは（CLI から VSCode まで）」「AI 時代に手書きをする意義」から 1 つ。
4. 立ち絵は Claude が主体で新しく作る（バストアップ＋全身）。img2 は変えずに呼ぶ（D8 訂正）。img2 の起動は Claude がしてよい。
5. 可能な限り公開して実績にする（ライセンスは未決）。
6. Wave 1 で `public/audio`・`public/manifests`・`materials/portraits/*.kra` は git で追跡する（`docs/inventory.md` §1.7）。
7. `package.json` の `license` は `LICENSE` が決まるまで `UNLICENSED`（Wave 1 の切り出し時）。

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

- **brief への訂正節の反映**（承認済み 2026-09-26。分類器に止められた）。案文：
  - D8 訂正：1 本目の立ち絵原画と、その差分に限り、ComfyUI_img2 を変えずに（カスタムノード 0 本・同梱ノードのみ）Claude が HTTP で呼んで生成してよい。Laterna のリポジトリに img2 を呼ぶコードは入れず、プロンプト・モデル名・seed は `materials/portraits/` に記録する。専用画像環境の方針は変わらない。この節が D8 に優先する。
  - D9 訂正：1 本目の立ち絵は、既存の 2 枚に限らず、D8 訂正の経路で新しく作った静止画 PNG でもよい。口パク・まばたきは 1 本目では実装しない。この節が D9 に優先する。
- brief §6 の答え（上の「決定」1〜5）を brief に写すか（写すなら主人の承認で）。
- Laterna のライセンス（案：MIT＋CC BY 4.0、合成音声・第三者素材は対象外。`LICENSE` 2 本は保留）。
- **Wave 2 の G0**：`docs/research/wave2-g0-draft.md` の承認と 5 問（題材・尺・台本確認・納品先・立ち絵デザイン）。面接で締める点：完了条件 4「1 回で」と 6「手順と一致」の検証手順（columba の付記）。

## 未決（実測・作業待ち）

- `docs/design.md` (c)：`calculateMetadata` の `fetch(staticFile())` が `remotion render` で通るか（Wave 2 着手時に 1 回試す）。
- ComfyUI_img2 の外部向けラッパー（`img2client/`・`examples/`）の読み取りが分類器に止められた。Wave 2 で HTTP を直接使うか、主人に許可設定を頼むか。
- `npm install` が 11 件の脆弱性を報告（2 low・3 moderate・6 high。Kyozai の lock を引き継いだ物）。動画制作には効かないが、公開前に `npm audit` を見る。

## 次の一手

Wave 2 の G0（面接）。`docs/research/wave2-g0-draft.md` を主人に出し、5 問の答えと承認を取ってから `goal.md` に Wave 2 節を足す。

## 作業の作法（リポジトリ外から見えない物だけ）

- Kyozai-Athanor は読み取り専用。状態は `git ls-files`・`git log`、`git status` は `--no-optional-locks`。
- 検収は `seneschal:columba` に出す。採点範囲は本フェーズの成果コミットに限る。主人の別指示は別コミット。PASS 後の直しは次の G0 の検証行に載せる。
- VOICEVOX は 50021、ffprobe は `C:fmpeg-essentialsin`、ImageMagick は `magick`。node 24／npm 11。Remotion の headless Chrome は `node_modules/.remotion/`（Kyozai 側からコピーした。270 MB）。
- 分類器（auto mode）が止めた操作は別経路で追わない。フェーズ末に主人へまとめて出す。
