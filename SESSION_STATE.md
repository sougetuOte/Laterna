# SESSION_STATE.md — Laterna（索引。本体は各文書）

様式は Seneschal `core/handoff.md`。上限 200 行。**「次の一手」は索引であって承認ではない**（復帰時は G0 の要否を先に見る）。

## これは何か

授業用の解説動画（掛け合い）＋復習 PDF を「この題材で 1 本」で作るプロジェクト。Kyozai-Athanor のエンジンを移植し、統治の層は持ち込まない。
1 本目の期限は **2026-10-01**（10/2 の高専 1 年・初回授業で使う）。

## 読む順序

1. `README.md`（30 行）
2. `docs/brief.md`（約 110 行。決定 D1〜D10 と §9 の訂正節）
3. `goal.md`（Wave 1「目星」。承認済み 2026-09-26）
4. `docs/inventory.md`（棚卸し表と依存の表。341 行）
5. `docs/design.md`（設計草案 6 節）／`docs/research/wave2-g0-draft.md`（Wave 2 の 3 項）
6. 統治は `D:\work8\Seneschal\core\`（README → loop → handoff）を読みに行く

## 現在地

- Wave 1「目星」を進行中。フェーズ (A) 棚卸し＝**検収 PASS**（2 回目）→ (B) 切り出し実証＝進行中 → (C) 設計草案＋Wave 2 G0 草案＝草案は scratchpad にある。
- 動いている物（B、2026-09-26 実測）：持っていく 90 件をコピーし 4 ファイルを編集。`npm install` 343 パッケージ、`npm test` 261 件 PASS、`npm run lint` exit 0、`compile:script -- java-vs-js` で合成 0・skip 13、manifest は Kyozai の原本と同一。render は実行中
- まだ無い物：手順書 `SKILL.md` 本文、新しい立ち絵、1 本目の台本、`LICENSE`。

## これまで（git log が持たない解釈だけ）

| commit | 出来事 |
|---|---|
| `ba991a4` | 初回 commit（brief・goal・研究資料・README） |
| （brief 訂正） | 主人が D8・D9 の訂正を承認（2026-09-26 チャット）。**auto mode の分類器が `docs/brief.md` への書き込みを止めたため未反映**。文面は本ファイル「未決（主人）」に控えた |
| `7ee1d02` | フェーズ (A) の成果。検収 1 回目 **FAIL**（表に無い参照 1 件：`package.json` の `require('fs')`） |
| `08b76a5` | 訂正。検収 2 回目 **PASS**（表に無い参照 0。付記として行番号等の食い違い 6 件） |
| `f7f4d6b` | PASS 後の付記 6 件の訂正。**採点されていない** → Wave 2 の G0 で検証行にする（loop.md「前のフェーズから持ち越す物」） |

## 決定（蒸し返さない）

brief D1〜D10 に加えて、主人がチャットで決めた物（2026-09-26）：

1. 使用場面は学校の授業で流す。情報系は高専機構の教材が勝つが、プログラム系は自作するしかない。
2. 1 本目の期限は 10/1。10/2 の初回授業（高専 1 年）用。
3. 題材は「プログラムとは」「ソースから実行ファイルまで」「開発環境とは（CLI から VSCode まで）」「AI 時代に手書きをする意義」から 1 つ。
4. 立ち絵は Claude が主体で新しく作る（バストアップ＋全身）。img2 は変えずに呼ぶ（D8 訂正）。img2 の起動は Claude がしてよい。
5. 可能な限り公開して実績にする（ライセンスは未決）。
6. Wave 1 で `public/audio`・`public/manifests`・`materials/portraits/*.kra` は git で追跡する（`docs/inventory.md` §1.7）。

## 採らなかった案

| 案 | 却下理由 |
|---|---|
| 立ち絵を主人が手元で生成して納品 | 主人が不得意。後工程を見越した設計は Claude 主体の方がよい（主人 2026-09-26） |
| 立ち絵を SVG（コード）で描く | 既存の立ち絵がアニメ調の生成画で、質を落とす。検討のみで提案せず |
| 専用画像環境を 10/1 までに建てる | 間に合わない。D8 訂正で img2 を変えずに使う |
| `outline-video-1` の音声 37 MB を持ち込む | 再合成できる。台本だけ持ち込む |

## 未決（主人の判断待ち）

- **brief §9 訂正節の反映**（承認済みだが分類器に止められた）。案文：
  - D8 訂正：1 本目の立ち絵原画と、その差分に限り、ComfyUI_img2 を変えずに（カスタムノード 0 本・同梱ノードのみ）Claude が HTTP で呼んで生成してよい。Laterna のリポジトリに img2 を呼ぶコードは入れず、プロンプト・モデル名・seed は `materials/portraits/` に記録する。専用画像環境の方針は変わらない。この節が D8 に優先する。
  - D9 訂正：1 本目の立ち絵は、既存の 2 枚に限らず、D8 訂正の経路で新しく作った静止画 PNG でもよい。口パク・まばたきは 1 本目では実装しない。この節が D9 に優先する。
- brief §6 の答え（上の「決定」1〜5）を brief に写すか（写すなら主人の承認で）。
- Laterna のライセンス（案：MIT＋CC BY 4.0、合成音声・第三者素材は対象外）。
- Wave 2 の G0（`docs/research/wave2-g0-draft.md` の 5 問：題材・尺・台本確認・納品先・立ち絵デザイン）。

## 未決（実測・作業待ち）

- `docs/design.md` (c)：`calculateMetadata` の `fetch(staticFile())` が `remotion render` で通るか（Wave 2 着手時に 1 回試す）。
- ComfyUI_img2 の外部向けラッパー（`img2client/`・`examples/`）の読み取りが分類器に止められた。Wave 2 で HTTP を直接使うか、主人に許可設定を頼むか。

## 次の一手

フェーズ (B) の render 結果（ffprobe・PDF ページ数）を確かめて成果を commit し、columba に検収を出す。

## 作業の作法（リポジトリ外から見えない物だけ）

- Kyozai-Athanor は読み取り専用。状態は `git ls-files`・`git log`、`git status` は `--no-optional-locks`。
- 検収は `seneschal:columba` に出す。採点範囲は本フェーズの成果コミットに限る。主人の別指示は別コミット。
- VOICEVOX は 50021、ffprobe は `C:\ffmpeg-essentials\bin`、ImageMagick は `magick`。node 24／npm 11。
- 分類器（auto mode）が止めた操作は別経路で追わない。フェーズ末に主人へまとめて出す。
