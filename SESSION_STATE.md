# SESSION_STATE.md — Laterna（索引。本体は各文書）

様式は Seneschal `core/handoff.md`。上限 200 行。**「次の一手」は索引であって承認ではない**（復帰時は G0 の要否を先に見る）。

## これは何か

授業用の解説動画（掛け合い）＋復習 PDF を「この題材で 1 本」で作るプロジェクト。Kyozai-Athanor のエンジンを移植し、統治の層は持ち込まない。
1 本目「ソースから実行ファイルまで」（`source-to-exe`）は **2026-09-26 に納品**（`deliver/source-to-exe/`）。期限は 2026-10-01（10/2 の高専 1 年・初回授業で使う）。

## 読む順序

1. `README.md`（30 行）
2. `docs/brief.md`（約 120 行。決定 D1〜D10 と §9 の訂正節 D8・D9）
3. `goal.md`（Wave 1「目星」＝完了、Wave 2「1 本目」＝承認済み 2026-09-26・納品済み・検収中）
4. `SKILL.md`（手順書 157 行。「この題材で 1 本」の入口。1 本目を作った手順そのもの）
5. `materials/source-to-exe/`（`outline.md`・`build-log.md`・`description.md`）、`materials/portraits/README.md`（立ち絵の生成記録）
6. `docs/inventory.md`（棚卸し表。342 行）／`docs/design.md`（設計草案 6 節。155 行）／`imagegen/README.md`
7. 統治は `D:\work8\Seneschal\core\`（README → loop → handoff）を読みに行く

## 現在地

- **Wave 1「目星」は完了**（2026-09-26。完了条件 1〜5 が columba の検収を通った）。
- **Wave 2「1 本目」は完了条件 1〜9 をすべて建てた**（2026-09-26）。検収：
  - 完了条件 1（画像環境）：columba **PASS**（1 回目。付記のみ：冪等性は検証行が無いので未測、`gen.py` は条文に無いが README に記載）。
  - 完了条件 2〜9：columba に出した 1 回目（21:41）は、主人の指摘（聞き役の向き）で前提が変わったため開始直後に止めた（判定なし）。直して出し直した（2 回目、22:06）。**結果は本ファイルの次の更新で書く。**
  - **検証 9(ii) は条文のままでは通らない見込み**：java-vs-js の MP4 は `public/portraits/` を映すので、完了条件 2 で v2 に差し替えた時点で Kyozai の参照（v1 で render）と SHA-256 が一致しなくなる（PDF は立ち絵を含まないので一致する）。契約の側の不整合なので、主人へ訂正節の案を出した（下の未決）。
- 動いている物（実測 2026-09-26）：
  - `imagegen/`（ComfyUI v0.37.0、klein 4B、GPU 1、port 8288）。`setup.ps1 -VerifyOnly`／`start`／`smoke`／`stop` すべて exit 0。**いまは停止中。**
  - VOICEVOX 0.25.2（50021）。`compile:script -- source-to-exe`：合成 27 件、実測 8575 frames（285.8 秒、fps 30）。
  - `render:all:script -- source-to-exe`：1 回の実行で MP4（h264+aac、285.888 秒、15.66 MB）と PDF（10 ページ）。`deliver/` の SHA-256 は `out/` と一致。
  - 立ち絵 v2：`public/portraits/` に解説役バストアップ・聞き役ランタン意匠（832×1216、透過）。全身版は `materials/portraits/*-v2-full.png`。
  - `npm test` 15 files / 266 tests PASS、`npm run lint` exit 0。
- まだ無い物：主人の受け入れ（10/2 の授業で使えるか。columba の採点対象外）。`manifest-registry.ts` 廃止の試み（(c)。Wave 3）。brief §6 の答えの本文への反映。

## これまで（git log が持たない解釈だけ）

| commit | 出来事 |
|---|---|
| `ba991a4` | 初回 commit（brief・goal・研究資料・README） |
| `6aafd4d` | 主人が承認した D8・D9 の訂正節を brief §9 に反映（分類器に一度止められ、主人の「書込許可」の後に Edit で通った） |
| `7ee1d02` | フェーズ (A) 棚卸し。検収 1 回目 **FAIL**（表に無い参照 1 件：`package.json` の `require('fs')`） |
| `08b76a5` | (A) 訂正。検収 2 回目 **PASS**（付記：行番号等の食い違い 6 件） |
| `f7f4d6b` | (A) PASS 後の付記 6 件の訂正。採点されていない → Wave 2 の検証 9(i) にした |
| `805d312` | フェーズ (B) 切り出し実証（90 件＋4 ファイル編集）。検収 1 回目 **PASS** |
| `230dbbc` | フェーズ (C) 設計草案＋Wave 2 G0 草案。検収 1 回目 **PASS** |
| `8980aed` | Wave 2 の G0 承認。草案を畳んだ |
| `843bdfd` | P1 imagegen。検収 1 回目 **PASS**（2026-09-26） |
| `43b8ad9` | エンジン追加（`extra_credits`・`PipelineFlow`）。テスト 266 件 PASS |
| `42817b1` | P2 台本の下書き（承認待ち）と outline・build-log |
| `e81e6b4` | 台本の箇条書き 2 行（先頭 `**`）を引用符で囲む。**js-yaml が alias と読んで compile が通らなかった**（次のセッションが最初に見つけた） |
| `ddf12d6` | 台本承認（主人「問い1：OK」）と compile。予測 260 秒 → 実測 285.8 秒（クレジット・表示保証尺を含む） |
| `5c4990b` | 立ち絵 v2（主人「推奨でGO」→ 解説役 s2・聞き役ランタン s2）。聞き役の全身版はランタン s2 を参照に seed 1〜3 で作り直し、seed 2 を採用 |
| `85390b7` | render・SKILL.md・概要欄・納品。**1 回目の render の試写で 2 件の不具合**（図解の段階名が箱に重なる／code の各行が中央寄せ）を見つけて直し、2 回目で出した |
| `f410027` | 主人の指摘：聞き役が画面外を向いていた。レンダラーは右カラムを `scaleX(-1)` で反転するのでファイルは外向きが正。`-flop` で置き直して 3 回目の render・再納品。向きの規則を README・台帳・SKILL.md に書いた |

retro の起動条件（loop.md）：縦の停止なし（同一フェーズで FAIL 2 回はなかった）・主人の差し戻しなし。**出荷物あり**（1 本目）── 次の回で直しの対象になったら 3 番で retro。

## 決定（蒸し返さない）

brief D1〜D10 に加えて、主人がチャットで決めた物（2026-09-26）：

1. 使用場面は学校の授業で流す。情報系は高専機構の教材が勝つが、プログラム系は自作するしかない。
2. 1 本目の期限は 10/1。10/2 の初回授業（高専 1 年）用。
3. 題材は「ソースから実行ファイルまで」、尺 3〜5 分、納品先は `deliver/<script-id>/`。
4. 立ち絵は Claude が主体で新しく作る（バストアップ＋全身）。**採用は解説役バストアップ s2・聞き役ランタン版 s2**（主人「推奨でGO」）。
5. 可能な限り公開して実績にする。ライセンスは MIT（コード）＋CC BY 4.0（台本・図解・教材本文。合成音声・第三者素材は対象外）。主人承諾 2026-09-26。
6. `public/audio`・`public/manifests`・`materials/portraits/*.kra` は git で追跡する（`docs/inventory.md` §1.7）。
7. 画像環境は Laterna の中に `imagegen/` として建てる（時間・トークンは度外視）。img2 は予備経路。
8. 台本の本文は compile の前に表で主人に見せて承認をもらう（1 本目は 2026-09-26 に承認）。
9. **`manifest-registry.ts` は手動追記 1 回で出した**（goal.md が許す経路）。(c) の廃止の試み（1 時間枠）は Wave 3 の着手時に回す ── 納品を優先し、検収中は `src/` を触らない。
10. custom スライドは部品側で白いパネルを描いて標準スライド（bullets・code）と見た目を揃える（`PipelineFlow.tsx`）。
11. code スライドは `<pre>` を inline-block・左揃え・40px にする（`ScriptSlideRenderer.tsx`）。java-vs-js は code を使わないので再現性（検証 9(ii)）に影響しない。

## 採らなかった案

| 案 | 却下理由 |
|---|---|
| 立ち絵を主人が手元で生成して納品 | 主人が不得意。後工程を見越した設計は Claude 主体のほうがよい（主人 2026-09-26） |
| 立ち絵を SVG（コード）で描く | 既存の立ち絵がアニメ調の生成画で、質を落とす |
| 聞き役の全身版に最初の候補（listener-full-s1／s2）を使う | ランタンが体から離れて描かれ、バストアップ s2 と意匠が揃わない → s2 を参照に作り直した |
| bullets スライドの中央寄せ（マーカーと本文の位置）を直す | `Slide.tsx` は凍結資産。java-vs-js が bullets を使うので直すと検証 9(ii) の SHA-256 一致が崩れる。Wave 3 で検討 |
| `outline-video-1` の音声 37 MB を持ち込む | 再合成できる。台本だけ持ち込む |
| `tasks.md`（specs 3 点セット）を作る | Kyozai の `docs/specs/` は持ち込まない。フェーズは本ファイルで追う |

## 未決（主人の判断待ち）

- **10/2 の授業での受け入れ**（使えなかった点は Wave 3 の G0 に書く）。
- **goal.md Wave 2 検証 9(ii) の訂正節**（案：MP4 の SHA-256 は `public/portraits/` を commit `805d312` の v1 に一時的に戻して render した物で比べ、比べたら `git checkout -- public/portraits` で v2 に戻す。PDF と manifest と `npm test` は現行どおり）。主人の承認が要る（goal.md は G2）。
- brief §6 の答え（上の「決定」1〜5・7）を brief 本文に写すか（写すなら主人の承認で）。
- 公開の時期と場所（GitHub 等）。公開前に `npm audit`（11 件。Kyozai の lock を引き継いだ物）を見る。

## 未決（実測・作業待ち）

- `docs/design.md` (c)：`calculateMetadata` の `fetch(staticFile())` が `remotion render` で通るか（Wave 3 の着手時に 1 時間枠で 1 回試す）。
- 字幕の要否（(f)①）：授業で流して見てから決める。
- bullets スライドのマーカー位置（上の「採らなかった案」）。
- ComfyUI_img2 の外部向けラッパーの読み取りが分類器に止められた件（imagegen を建てたので、当面は不要）。

## 次の一手

columba の検収（完了条件 2〜9）の結果を受ける。PASS なら Wave 2 を完了と記録し、主人の 10/2 の受け入れを待つ。FAIL なら直して再検収（同一フェーズで 2 回 FAIL なら MAGI、契約の側なら主人へ）。その後、Wave 3 の G0 は面接から。

## 作業の作法（リポジトリ外から見えない物だけ）

- Kyozai-Athanor は読み取り専用。状態は `git ls-files`・`git log`・`git show`、`git status` は `--no-optional-locks`。
- 検収は `seneschal:columba` に出す。採点範囲は本フェーズの成果コミットに限る。主人の別指示は別コミット。PASS 後の直しは次の G0 の検証行に載せる。**columba が compile／render している間は `src/`・`public/`・`out/` を触らない。imagegen の start／stop も columba と同時に使わない**（P1 の検収が start/stop を含む）。
- VOICEVOX は 50021、ffprobe／ffmpeg は `C:\ffmpeg-essentials\bin`、ImageMagick は `magick`、PDF のページ数は `pdf-lib`（node_modules）。node 24／npm 11。Remotion の headless Chrome は `node_modules/.remotion/`（270 MB）。
- 分類器（auto mode）が止めた操作は別経路で追わない。フェーズ末に主人へまとめて出す（主人が「書込許可」と言えば Edit ツールで通った）。
- Bash の作業ディレクトリは呼び出しをまたいで残る。git は `git -C /d/work8/Laterna` で呼ぶ。
- 主人のフックは「HTTP 取得の出力をインタープリタへパイプする形」を止める。コマンド本文にその文字列があるだけでも止まる。HTTP は `urllib` かファイル経由にし、複数行の Python は `python - <<'EOF'` で渡す（`python -c` の複数行は shim が壊す）。
- **150 行超のヒアドキュメント（引用符・バッククォートを含む）は bash が「unexpected EOF」で失敗した。**長い文書は Write ツールで書く。
- `.ps1` は BOM 付き UTF-8 で書く。PowerShell の出力は cp932（`| iconv -f cp932 -t utf-8`）。`sleep` 先頭の待ちは止められるので、待つなら `until … ; do sleep 5; done` の形。
- 台本 YAML：値が `**`・`*`・`&`・`[` で始まる箇条書きは `"…"` で囲む（js-yaml が alias／anchor と読む）。`node -e` で js-yaml が読めることを compile の前に確かめる。
- render の後は `ffmpeg -ss <秒> -i <mp4> -frames:v 1 <png>` でフレームを切り出し、Read で目視する（1 本目の図解の不具合はこれで見つけた）。
- 立ち絵の向き：`public/portraits/` の 2 枚はどちらも「向かって右」を向いた絵にする（右カラムはレンダラーが反転する）。内向きに生成した絵は `magick -flop` で反転してから置く。
