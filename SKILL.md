# 授業用の解説動画と復習 PDF を作る（Laterna）

「この題材で 1 本」と頼まれたら、この手順書のとおりに **掛け合い形式の解説動画（MP4）と復習用 PDF** を作る。
音声は VOICEVOX、立ち絵は自作（`public/portraits/`）、図解はコードで描く。統治（面接・検収）は Seneschal を読みに行く（`CLAUDE.md`）。本ファイルは作り方だけを書く。
1 本目「ソースから実行ファイルまで」（`source-to-exe`、2026-09-26）を作った手順そのものである。実際に叩いたコマンドと終了コードは `materials/source-to-exe/build-log.md` にある。

## このリポジトリの構成

```
Laterna/
├─ SKILL.md                  本ファイル。「この題材で 1 本」の入口
├─ content/scripts/          台本 YAML（1 本 = 1 script-id。<script-id>.script.yaml）
├─ src/                      エンジン（Kyozai-Athanor から移植。compile／render／pdf／schema）
│   └─ script-engine/render/<script-id>/   台本専用の custom 部品（例：source-to-exe/PipelineFlow.tsx）
├─ scripts/                  compile:script・pdf:script・render:all:script の 3 本と、その 2 本が使う remotion-cli.mjs
├─ docs/conventions/         話者設定（speaker-profiles.yaml）・文体（narration-style.md）・VOICEVOX 起動（voicevox-engine-setup.md）・立ち絵の台帳（portrait-assets.md）
├─ materials/<script-id>/    構成 outline.md（対象・尺・章立て・出典）・作業記録 build-log.md・概要欄 description.md
├─ materials/portraits/      立ち絵の原本と生成記録（README.md）
├─ public/audio|manifests|portraits   compile の成果物（WAV・manifest）と立ち絵。git で追跡する
├─ imagegen/                 画像環境（立ち絵・挿絵。README.md）。動画制作の本線では使わない
├─ out/script-engine/        MP4・PDF（追跡しない）
└─ deliver/<script-id>/      納品物（MP4・PDF・description.md。追跡しない）
```

流れ：題材と対象を決める → 調査 → 構成 → 台本 YAML → `compile:script`（VOICEVOX 合成・尺の実測・manifest）→ 試写 → `render:all:script`（MP4＋PDF）→ 確かめる → 渡す。

## 入力

- **題材**（必須）。
- **対象**：学年・前提知識（例：高専 1 年、プログラム未経験）。
- **使用場面**：授業中に流す／予習・復習に配る／欠席者向け。尺と PDF の比重が変わる。
- **尺**：指定がなければ 3〜5 分。台本 YAML の `target_duration_range` に書く。
- **台本の確認**：指定がなければ「あり」（台本を表で見せ、承認をもらってから compile する）。
- **納品先**：指定がなければ `deliver/<script-id>/`。

## 守ること

- 事実は一次資料で確かめ、出典（URL・引用箇所）を `materials/<script-id>/outline.md` の「出典」節に残す。確かめられなかったことは台本に入れない。
- 画像は 3 経路以外から取らない：図解＝コード（React／SVG）、挿絵・立ち絵＝`imagegen/`、写真・実物資料＝許可ライセンス（CC0・パブリックドメイン・CC BY のみ）。ネット上の画像・音楽・効果音を拾わない。
- クレジット：VOICEVOX の 2 話者は manifest の `credits[]` に自動で入る（`speaker-profiles.yaml`）。立ち絵は台本の `extra_credits` に 1 行書く。概要欄（`description.md`）にも出典とクレジットを書く。
- 再ライセンスしない：VOICEVOX の音声と第三者素材を CC BY 等の対象に含める記述を書かない（Laterna 側の著作物だけが CC BY 4.0）。
- 口調と NG 表現は `docs/conventions/narration-style.md`（ですます調、専門用語は初出で言い換え、まとめは 3 点以内、「簡単」「必ず」を初学者向けに使わない）。
- 立ち絵は自作オリジナル。VOICEVOX 公式キャラクターの模写・トレースをしない（`docs/conventions/portrait-assets.md` §0）。
- 期限に間に合わないと分かったら、章と尺を削って出す。機能を足して間に合わせない。

## 手順0：準備

1. VOICEVOX Engine を起動し、応答を見る（起動の仕方は `docs/conventions/voicevox-engine-setup.md`）。
   ```
   curl http://127.0.0.1:50021/version
   ```
   `"0.25.2"` のように版が返れば OK。
2. 依存を入れ、テストを通す（初回、または `package.json` が変わったとき）。
   ```
   npm install --no-audit --no-fund
   npm test
   ```
   `npm test` が全件 PASS でなければ先へ進まない。
3. 立ち絵が `public/portraits/narrator-default.png`・`listener-default.png` にあることを確かめる（無いと render が止まる）。差し替えるときは「立ち絵を差し替える・増やす」。
4. `ffprobe`（ffmpeg）と `magick`（ImageMagick 7）が使えることを確かめる（手順6 で使う）。
5. `materials/<script-id>/build-log.md` を作り、以降のコマンドと終了コードを「手順番号・日時・コマンド・終了コード・備考」の表に残す。

## 手順1：調査

1. 題材について一次資料（公式マニュアル・規格・公式ドキュメント）を集める。二次資料を使うときは、それが参照している一次資料も書く。
2. 学生が「なるほど」と思う要点を 3〜5 個選び、それぞれの根拠（引用文）と URL を `materials/<script-id>/outline.md` の「出典」節に書く。
3. 説が分かれていること・仕様が版で違うことは、台本でもそのとおりに言う。

## 手順2：構成

`materials/<script-id>/outline.md` に 4 つの見出し「対象」「尺」「章立て」「出典」を書く。

- **対象**：学年・前提知識・使用場面・授業で使う言語や道具（例：C／gcc）。仮定したことは仮定と書き、台本承認のときに確かめる。
- **尺**：目標（3〜5 分）と、文字数の目安。実測の発話速度は解説役 約 420 字/分、聞き役 約 340 字/分（`speaker-profiles.yaml` の `speech_rate_factor` の元）。4 分なら合計 1,400〜1,600 字。
- **章立て**：冒頭（聞き役の疑問から入る）→ 本編 3〜5 章（1 章 1 要点、各 40〜80 秒）→ まとめ 3 点 → 次回予告。スライドは 6〜10 枚。
- **出典**：手順1 の一覧。

## 手順3：台本

`content/scripts/<script-id>.script.yaml` を書く。実例は `content/scripts/source-to-exe.script.yaml`（27 発話・10 スライド）。

- `target_duration_range`（`min`・`max` 秒）、`speaker_profile_ref: default`、`extra_credits`（立ち絵の 1 行）。
- `utterances[]`：`id`（`u-001` 形式）・`speaker`（`narrator`＝解説役・左／`listener`＝聞き役・右）・`text`・`pause_after`（秒、省略可）。
  - `text` は 1 行で書く（折り畳みスカラー `>-` を使わない。改行が半角スペースになって VOICEVOX 入力と内容ハッシュを汚す）。
  - 1 発話は 40〜120 字。「聞き役の疑問 → 解説役の説明 → 聞き役の言い換え」を基本にし、3〜4 発話ごとに変化をつける。
  - 専門用語は出てきたらすぐ言い換える。読み間違えそうな語（英字・記号）はかな書きにする（例：「シャープ、インクルード」）。
- `slides[]`：`title`／`bullets`（`items` 3 つまで）／`code`／`custom`（`component` と `props`）。
  - **箇条書きの項目が `**` や `*`・`&`・`[` で始まるときは `"…"` で囲む**（YAML が alias や anchor と読んで compile が落ちる。1 本目で実際に起きた）。
- `slide_events[]`：どの発話の開始でどのスライドに切り替えるか（`anchor.utterance`・`position: start`）。
- custom 部品が要るときは `src/script-engine/render/<script-id>/<Name>.tsx` に React で書き、`src/script-engine/shared/component-names.ts` と `render/component-registry.ts` に登録する。テストも足す（`npm test`）。
- 書いたら、まず YAML が読めることを確かめる：
  ```
  node -e "const y=require('js-yaml'),f=require('fs');const d=y.load(f.readFileSync('content/scripts/<script-id>.script.yaml','utf8'));console.log(d.utterances.length)"
  ```
- **台本の確認が「あり」なら**、「#／話し手／セリフ／スライド切替」の表にして主人に見せ、承認をもらう。承認されたら `outline.md` に「台本承認：YYYY-MM-DD 主人」の 1 行を書く。承認前に compile しない。

## 手順4：compile と確認

1. compile する（VOICEVOX が起動していること）。
   ```
   npm run compile:script -- <script-id>
   ```
   出力：`public/audio/<script-id>/`（WAV。内容ハッシュ名。同じ text・話者・パラメータなら再合成しない）、`public/manifests/<script-id>.manifest.json`・`.pdf-manifest.json`。
   ログの「予測総尺」と「total_duration_frames（約 N 秒）」を見る。実測（クレジット区間を含む）が `target_duration_range` に入っていなければ台本を足す・削る。
2. `src/script-engine/render/manifest-registry.ts` に `<script-id>` を登録する（import 2 行と `manifestRegistry`・`pdfManifestRegistry` の各 1 行。ファイル冒頭のコメントに手順）。未登録だと render が「compile 未実行」で止まる。登録後に `npm run lint` と `npm test`。
3. WAV の読みを確かめる：`public/audio/<script-id>/` の WAV を数本聞く（読み間違いは台本の `text` をかな書きにして compile し直す）。
4. 試写：`npm run preview:script` で Remotion Studio を開き、`ScriptComposition` の `scriptId` を `<script-id>` にして、スライドの切替・文字のはみ出し・立ち絵の明暗を見る。

## 手順5：書き出し

```
npm run render:all:script -- <script-id>
```
`out/script-engine/<script-id>.mp4` と `.pdf` ができる。1 回で通ることが完了条件（手作業の補正をしない）。長い動画はバックグラウンドで走らせ、ログを見て待つ。

## 手順6：確かめる

1. 映像・音声の両ストリームと尺：
   ```
   ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=nw=1 out/script-engine/<script-id>.mp4
   ```
   `codec_type=video` と `codec_type=audio` があり、`duration` が manifest の `total_duration_frames / fps` と ±1 秒。
2. PDF のページ数が `public/manifests/<script-id>.pdf-manifest.json` の `total_pages` と一致：
   ```
   node -e "const {PDFDocument}=require('pdf-lib');PDFDocument.load(require('fs').readFileSync('out/script-engine/<script-id>.pdf')).then(d=>console.log(d.getPageCount()))"
   ```
3. クレジット：manifest の `credits[]` に `VOICEVOX:` の 2 行と立ち絵の 1 行があること。動画末尾のクレジット区間（最後の 3 秒、`CREDIT_REGION_SECONDS`）から 1 枚切り出して目視する（`ffmpeg -ss <尺-1.5> -i <mp4> -frames:v 1 credits.png`）。
4. 台本の内容が手順1 の出典と食い違っていないか、もう一度読む。
5. `materials/<script-id>/description.md` を書く：内容紹介／「出典」／「クレジット」の見出し。

## 手順7：渡す

納品先（既定 `deliver/<script-id>/`。git 管理外）に 3 点を置く：`<script-id>.mp4`・`<script-id>.pdf`・`description.md`。
```
mkdir -p deliver/<script-id>
cp out/script-engine/<script-id>.mp4 out/script-engine/<script-id>.pdf deliver/<script-id>/
cp materials/<script-id>/description.md deliver/<script-id>/
sha256sum out/script-engine/<script-id>.mp4 deliver/<script-id>/<script-id>.mp4 out/script-engine/<script-id>.pdf deliver/<script-id>/<script-id>.pdf
```
SHA-256 が `out/` と一致することを確かめる。最後に、尺・章立て・途中で起きた問題と対処を短く報告する。

## 立ち絵を差し替える・増やす

- 仕様：透過 PNG（アルファ付き）、縦長（1 本目は 832×1216）、`public/portraits/<asset_key>.png`。`asset_key` は `docs/conventions/speaker-profiles.yaml` の `portrait.asset_key`（変えない）。
- 作り方（1 本目の実例）：`imagegen/` を起動し、`imagegen\.venv\Scripts\python.exe imagegen\scripts\gen.py --workflow klein_edit --ref <参照画像> --prompt "..." --seed N --out <出力 PNG>`（`--out` は必須。寸法の既定は `--width 832 --height 1216`）で緑背景の候補を作り、主人に一覧（`magick +append`）を見せて選んでもらう。緑背景は `materials/portraits/README.md` の 3 行の `magick`（クロマキー＋despill）で抜く。
- **向き**：左カラム（narrator）のファイルは画面内側＝向かって右を向かせる。右カラム（listener）のファイルは画面**外側**＝向かって右を向かせる（レンダラーが `scaleX(-1)` で反転して内側を向く）。つまり**どちらのファイルも「向かって右」を向いた絵**にする。内向きに生成した絵は `magick <png> -flop <出力>` で反転してから置く（1 本目で聞き役が画面外を向いた原因。render 後にフレームを切り出して向きを見る）。
- 記録：原本（緑背景）と `.json` を `materials/portraits/` に置き、`README.md` に「モデル・プロンプト・seed・加工」を書く。`docs/conventions/portrait-assets.md` §1 の台帳を上書き更新する（行は足さない）。
- 立ち絵の表示は `src/script-engine/render/SpeakerPortrait.tsx`（左 12%・右 8% のカラムに `objectFit: contain`、右は左右反転、発話中 100%／非発話中 55% の明度）。

## 困ったとき

- **VOICEVOX が無応答**：`curl http://127.0.0.1:50021/version` が返らない。Engine を起動し直す（`voicevox-engine-setup.md`）。compile は最初に Engine の `/version` を確かめるので、Engine が止まっていると compile も `render:all:script` も止まる（合成済みの WAV は再利用されるので、起動し直せば合成は走らない）。
- **尺が目標から ±25% 超**：台本の発話を足す・削る。1 発話 ≒ 解説役 7 字/秒・聞き役 5.7 字/秒。予測は字数と `pause_before`・`pause_after` から出す。予測に入らないのは表示保証尺（末尾スライドの最低表示時間、2 秒まで）とクレジット区間（3 秒）の計 5 秒までで、残りのずれは実際の合成音声の話速が 1 発話の字数/秒の目安と違う分。実測は予測より 20〜30 秒長くなることがある。
- **compile が YAML の読み込みで落ちる**（`unidentified alias` など）：`**` や `*` で始まる値を `"…"` で囲む（手順3）。
- **render が「manifest for scriptId … is not registered」で止まる**：`manifest-registry.ts` に登録していない（手順4 の 2）。
- **render が立ち絵で止まる**：`public/portraits/<asset_key>.png` が無い。置いてから再実行する。
- **render の失敗**：`out/script-engine/` を残したまま、ログの最後のエラーを読む。`out/script-engine-pdf-temp/` は PDF 生成の一時物。Remotion の headless Chrome は `node_modules/.remotion/`。
- **imagegen が起動しない・止まらない**：`imagegen/README.md`。`setup.ps1 -VerifyOnly` で環境を検証、`stop.ps1` で止める。動画制作の本線は imagegen が無くても回る。
