# wave2-g0-draft.md — Wave 2「1 本目」の G0 草案（Wave 1 完了条件 5）

**位置づけ：**草案。Wave 2 の面接（G0）で主人が承認したら `goal.md` の Wave 2 節に移す。承認前は契約ではない。
**種別：**feature（1 本目の動画制作）。**期限：**2026-10-01（10/2 の初回授業で使う。主人 2026-09-26）。
**消滅条件：**`goal.md` に移った時点で本ファイルを畳む（git に残る）。

主人の答え（2026-09-26、チャット）を前提にする：使用場面は学校の授業（授業中に流す。プログラム系は自作するしかない）／対象は高専 1 年・初回／題材は
「プログラムとは」「ソースから実行ファイルまで」「開発環境とは（CLI から VSCode まで）」「AI 時代に手書きをする意義」から 1 つ／
立ち絵は Claude が主体で新しく作る（バストアップと全身。D8・D9 訂正（主人承認済み・brief 未反映。文面は SESSION_STATE.md））／公開して実績にしたい（ライセンスは未決）。

## G0 で主人に確かめること（1 通にまとめる）

1. **題材**：推奨は「ソースから実行ファイルまで」。理由：エディタ→ソース→コンパイラ→実行ファイル→実行の流れは Flowchart 部品と SVG で描け、画像が要らない（D9）。毎年使い回せる。用語（ソースコード・コンパイル・実行ファイル・エラー）が復習 PDF に向く。
   次点は「プログラムとは」（初回の導入として自然だが、抽象的で図が少ない）。「開発環境とは」は画面写真が要るので画像経路が揃う 2 本目以降、「AI 時代に手書きをする意義」は主人の肉声で話す方が強い。
2. **尺**：5〜8 分（授業中に流す 1 本目。java-vs-js は 1.7 分、outline-video-1 は 13.4 分）。
3. **台本の確認**：compile の前に台本本文を主人が読んで承認する（参考スキルの「台本の確認：あり」）。承認は 1 往復で済むよう、表（話し手／セリフ／スライド）で出す。
4. **納品先**：MP4・PDF・概要欄テキストを置く場所（フォルダのパス）。
5. **立ち絵のデザイン**：既存 2 人（眼鏡の青年・白×橙のロボット）を引き継ぐか、デザインごと変えるか。既定は引き継ぐ。

## 完了条件

1. **題材と構成**：`materials/<script-id>/outline.md` に、対象（高専 1 年・初回・授業中に流す）、尺の目標、章立て（3〜5 章）、出典の一覧がある。
2. **台本**：`content/scripts/<script-id>.script.yaml` があり、compile が通り、実測の総尺が 300〜480 秒に入る。主人が台本本文を承認した記録がある。
3. **立ち絵**：`public/portraits/narrator-default.png`・`listener-default.png` が新しいバストアップ原画（透過 PNG・縦長）に差し替わり、全身版が `materials/portraits/` にある。生成記録（モデル名・プロンプト・seed・加工内容）が `materials/portraits/README.md` にあり、`docs/conventions/portrait-assets.md` の台帳が埋まっている。
   9/29 までに揃わなければ既存の 2 枚で出す（その場合も台帳を埋め、`README.md` に「既存で出した」と書く）。
4. **動画と PDF**：`npm run render:all:script -- <script-id>` 1 回で `out/script-engine/<script-id>.mp4` と `.pdf` が出る。
5. **クレジットと出典**：manifest の `credits[]` に VOICEVOX 2 話者と立ち絵の行がある（動画末尾のクレジットに出る）。概要欄用テキスト `materials/<script-id>/description.md` に内容紹介・出典一覧・クレジットがある。
6. **手順書**：`SKILL.md` の本文がある（`docs/design.md` (d) の目次）。1 本目を実際に作った手順と一致している。
7. **納品**：主人が指定した納品先に MP4・PDF・`description.md` の 3 点がある。
8. **Wave 1 からの持ち越し**（Seneschal `loop.md`「前のフェーズから持ち越す物を、検証方法の行にする」）：Wave 1 で採点されなかった物が、この Wave の中で確かめられている。
   対象は 3 つ。(i) 検収 PASS 後の直し `f7f4d6b`（`docs/inventory.md` の行番号 5 件・本数・導入文）。(ii) `SESSION_STATE.md` の状態の主張（「manifest は Kyozai の原本と同一」「MP4・PDF の SHA-256 が参照と一致」「npm test 261 件」）。(iii) Wave 1 のテスト変更（`measure.test.ts` の期待値 13 件の差し替え・実 WAV 検証 8 件の削除・skip 0）。

**主人の受け入れ**（columba の採点対象外）：10/2 の授業で使えると主人が判断すること。使えなかった点は Wave 3 の G0 に書く。

## 検証方法

columba が採点する。各項は上の完了条件と同じ番号で対応する（8 対 8、対応の無い条件は無い）。

1. `materials/<script-id>/outline.md` に見出し「対象」「尺」「章立て」「出典」の 4 つがある（grep）。「章立て」の下の章が 3〜5 個。
2. `npm run compile:script -- <script-id>` が exit 0。`public/manifests/<script-id>.manifest.json` の `total_duration_frames / fps` が 300〜480。
   `materials/<script-id>/outline.md` に「台本承認：YYYY-MM-DD 主人」の 1 行がある。
3. `magick identify -format "%w %h %[channels]"` で 2 枚とも高さ > 幅、channels に `a`（アルファ）を含む。`materials/portraits/` に全身版 2 枚（ファイル名に `full`）。
   `materials/portraits/README.md` に立ち絵ごとに「モデル」「プロンプト」「seed」「加工」の 4 語がある。`portrait-assets.md` の表に「（未記入）」が残っていない。
   既存で出した場合：`README.md` に「既存で出した」の 1 行と、台帳の作画者欄が埋まっていること。
4. `ffprobe` で `.mp4` に映像・音声の両ストリームがあり、尺が manifest の `total_duration_frames / fps` と ±1 秒。PDF のページ数が `<script-id>.pdf-manifest.json` の `total_pages` と一致。
5. manifest の `credits[]` に `VOICEVOX:` で始まる行が 2 つと「立ち絵」を含む行が 1 つある。`description.md` に見出し「出典」「クレジット」がある。
6. `SKILL.md` に `docs/design.md` (d) の見出し（手順 0〜7 と「困ったとき」）が全部ある（grep）。
7. 納品先に 3 ファイルがあり、`.mp4` と `.pdf` の SHA-256 が `out/script-engine/` の物と一致する。
8. (i) `f7f4d6b` が直した 6 箇所（`docs/inventory.md` §2.1 の 4「29 本のうち 19 本」、§2.2 の `render-all-script.mjs` 備考 L79・L107、`build-script-pdf.mjs` 備考 L123、`manifest-integrity.probe.test.ts` 備考 L22、`eslint.config.mjs` L11、§2.3 導入文）を、Kyozai の現物（HEAD `01c727e`）と突き合わせて一致する。
   (ii) 評価器が自分で `npm run compile:script -- java-vs-js` と `render:all:script` を走らせ、manifest 2 本が Kyozai の `public/manifests/java-vs-js.*` と同一（キー順を揃えた JSON で diff なし）、`java-vs-js.mp4`・`.pdf` の SHA-256 が Kyozai の `out/script-engine/` の物と一致、`npm test` が 261 件 PASS であることを見る。走らせられなければ「自己申告」と書く。
   (iii) `git diff ba991a4..805d312 -- 'src/**/*.test.*'` で、Wave 1 の起点からのテストの削除・skip・期待値の変更を数え、`measure.test.ts` の期待値 13 件の出所が `docs/inventory.md` §2.4（ffprobe 7.1 の実測）であることを確かめる。skip（`it.skip`／`describe.skip`／`todo`）が 0 であること。
   **主人の言葉を引く行**（題材・尺・納品先）は、主人が本 G0 を承認したこと自体を記録とする（承認前の草案は引用しない）。

## やらないこと

### この Wave ではやらない（次以降で扱う）

- 字幕・SRT の出力、口パク・まばたき、audio_query の保存（`docs/design.md` (f)。Wave 3）
- 画像スライド（`type: image`）と出典台帳の実装（(b)。1 本目は図解と立ち絵だけ）
- `manifest-registry.ts` の廃止（(c)）。Wave 2 の着手時に 1 度だけ試し、1 時間で通らなければ手動追記 1 回で出して Wave 3 に回す
- Laterna 専用画像環境の設計（brief D8 本文。本体とは別に詰める）
- 公開・ライセンスの決定（`LICENSE` 2 本は保留のまま）
- 2 本目以降の題材の調査

### 起きてはならない

- Kyozai-Athanor・Seneschal・ComfyUI_img2 への書き込み（img2 は**変えずに呼ぶ**だけ。カスタムノードもモデルも足さない。D8 訂正（同上））
- img2 を呼ぶコードを Laterna のリポジトリに commit すること（プロンプト・モデル名・seed の記録は可）
- 商用不可のモデルで立ち絵を作ること（klein 4B・Z-Image Turbo 以外を使うなら先に規約を確かめる）
- VOICEVOX 公式キャラクターのデザインの模写・トレース（`portrait-assets.md` §0）
- VOICEVOX 音声・第三者素材を CC BY 等で再ライセンスする記述
- `CLAUDE.md`・`goal.md`・`docs/brief.md` の無承認変更、`reference/` の改変と commit
- 期限を越える範囲の拡大：10/1 に間に合わないと分かったら、章と尺を削って出す。機能を足して間に合わせようとしない
