# build-log.md — 「C言語について」を作った記録（手順番号・コマンド・終了コード）

`goal.md` Wave 3 の完了条件 6：`SKILL.md` の手順 0〜7 と対応する。時刻は JST。

**表の決まり**（2026-09-27 の検収 2 回目の FAIL の後に書き直した）：
- 表には、終了コードを実際に取ったコマンドだけを書く。1 行 1 コマンド。
- 「実測」とは、そのコマンドを単独で叩き、直後に `echo exit=$?` で取った値を言う。パイプを含む物は `set -o pipefail` の下で取った値。
- 例外として、ループの中で `|| echo fail` を付けて叩き、fail が 1 度も出なかった物は、備考にそう書いて 0 とする。
- 読むだけのコマンドは 11:13 に取り直した（手順を回した scratchpad の `remeasure.sh`。出力は `remeasure.log`）。元の実行では終了コードを取っていなかったので、元の実行は下の「終了コードを取っていない実行」節に残す。
- grep は一致が 0 件だと 1 で終わる。氏名の検索では 1 が合格（一致 0 件）。
- `<scratchpad>` はこのセッションの scratchpad の絶対パス（`C:/Users/metral/AppData/Local/Temp/claude/D--work8-Laterna/dbf265b1-7f84-42eb-91c5-39487434671c/scratchpad`）。still は、`remotion-cli.js` を絶対パス（`D:\work8\Laterna\node_modules\@remotion\cli\remotion-cli.js`）で呼んだ。

| 手順 | 日時 | コマンド | 終了コード | 備考 |
|---|---|---|---|---|
| 0 | 2026-09-27 11:13（取り直し） | `node -e "fetch('http://127.0.0.1:50021/version').then(async r=>{console.log(await r.text());process.exit(r.ok?0:1)})"` | 0 | VOICEVOX 0.25.2 が稼働中 |
| 1 | 2026-09-27 11:13（取り直し） | `node -e "fetch('https://syllabus.kosen-k.go.jp/Pages/PublicSyllabus?school_id=49&department_id=12&subject_id=0014&year=2026&lang=ja').then(r=>{console.log(r.status);process.exit(r.status===200?0:1)})"` | 0 | 200。B1 プログラミング言語入門 |
| 1 | 2026-09-27 11:13（取り直し） | `node -e "fetch('https://syllabus.kosen-k.go.jp/Pages/PublicSyllabus?school_id=49&department_id=12&subject_id=0030&year=2025&lang=ja').then(r=>{console.log(r.status);process.exit(r.status===200?0:1)})"` | 0 | 200。B2 プログラミング言語Ⅰ |
| 1 | 2026-09-27 11:13（取り直し） | `node -e "fetch('https://syllabus.kosen-k.go.jp/Pages/PublicSyllabus?school_id=49&department_id=12&subject_id=0023&year=2025&lang=ja').then(r=>{console.log(r.status);process.exit(r.status===200?0:1)})"` | 0 | 200。B3 電気情報工学実験Ⅰ |
| 1 | 2026-09-27 11:13（取り直し） | `node -e "fetch('https://syllabus.kosen-k.go.jp/Pages/PublicSyllabus?school_id=49&department_id=12&subject_id=0049&year=2024&lang=ja').then(r=>{console.log(r.status);process.exit(r.status===200?0:1)})"` | 0 | 200。B4 プログラミング言語Ⅱ |
| 1 | 2026-09-27 11:13（取り直し） | `node -e "fetch('https://syllabus.kosen-k.go.jp/Pages/PublicSyllabus?school_id=49&department_id=11&subject_id=0044&year=2024&lang=ja').then(r=>{console.log(r.status);process.exit(r.status===200?0:1)})"` | 0 | 200。B5 情報処理Ⅰ |
| 1 | 2026-09-27 11:13（取り直し） | `node -e "fetch('https://syllabus.kosen-k.go.jp/Pages/PublicSyllabus?school_id=49&department_id=11&subject_id=0072&year=2023&lang=ja').then(r=>{console.log(r.status);process.exit(r.status===200?0:1)})"` | 0 | 200。B6 計測工学 |
| 1 | 2026-09-27 11:13（取り直し） | `node -e "fetch('https://syllabus.kosen-k.go.jp/Pages/PublicSyllabus?school_id=49&department_id=11&subject_id=0092&year=2022&lang=ja').then(r=>{console.log(r.status);process.exit(r.status===200?0:1)})"` | 0 | 200。B7 工学実験Ⅲ |
| 1 | 2026-09-27 11:13（取り直し） | `node -e "fetch('https://syllabus.kosen-k.go.jp/Pages/PublicSyllabus?school_id=49&department_id=11&subject_id=0088&year=2022&lang=ja').then(r=>{console.log(r.status);process.exit(r.status===200?0:1)})"` | 0 | 200。制御工学Ⅱ（台本では使っていない） |
| 3 | 2026-09-27 11:13（取り直し） | `npx vitest run src/script-engine/render/about-c` | 0 | 図解部品 3 つのテスト 9 件 passed |
| 3 | 2026-09-27 11:13（取り直し） | `node <scratchpad>/parse-check.mjs about-c`（`parseScript` と `estimateScriptDuration` だけを tsx で呼ぶ。VOICEVOX は呼ばない） | 0 | parse OK（56・17・17）。予測総尺 496.9 秒（承認後の表記の直し 3 件を含む今の台本） |
| 4 | 2026-09-27 10:14 | `npm run compile:script -- about-c` | 0 | 新規合成 56 件。16327 frames（544.2 秒）。PDF manifest 17 ページ |
| 4 | 2026-09-27 10:15 | `npm run lint` | 0 | `src/script-engine/render/manifest-registry.ts` に about-c を登録した後 |
| 4 | 2026-09-27 11:13（取り直し） | `node <scratchpad>/kana.js`（VOICEVOX の `/audio_query` の kana を全発話分出す） | 0 | 元の実行（10:15）で読み違い 2 件と聞き取りにくい 1 件を見つけ、表記を直した（`outline.md` に記録） |
| 4 | 2026-09-27 10:15 | `npm run compile:script -- about-c` | 0 | 再合成 3 件・skip 53 件、prune 3 件。16377 frames（545.9 秒） |
| 4 | 2026-09-27 10:16〜10:17 | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <scratchpad>/still-<N>.png --frame=<N> --image-format=png --props=<scratchpad>/props.json`（N＝1100・2500・3900・4600・6400・8000・9500・11000・12800・13600。ループの中で `\|\| echo fail`） | 0 | fail は 1 度も出なかった。試写で、年表の年が上下に交互で読みにくい・科目の表の文字が小さい → 部品 CTimeline・CourseMap と台本の説明の改行を直した |
| 4 | 2026-09-27 10:18 | `npm run compile:script -- about-c` | 0 | スライドの props だけの変更で再合成 0 件。16377 frames |
| 4 | 2026-09-27 10:18〜10:19 | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <scratchpad>/v2-<N>.png --frame=<N> --image-format=png --props=<scratchpad>/props.json`（N＝3900・6200・11000・12800・13600。ループの中で `\|\| echo fail`） | 0 | fail は 1 度も出なかった |
| 4 | 2026-09-27 10:19 | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <scratchpad>/v3-11000.png --frame=11000 --image-format=png --props=<scratchpad>/props.json` | 0 | `echo $?` で 0。学科名の折り返しを直した |
| 5 | 2026-09-27 10:19〜10:26 | `npm run render:all:script -- about-c`（`out/script-engine/about-c.*` を消してから、バックグラウンドで） | 0 | compile（再合成 0）→ render → PDF。手作業の補正なし |
| 6 | 2026-09-27 11:13（取り直し） | `npm test` | 0 | 19 files / 362 tests passed |
| 6 | 2026-09-27 11:13（取り直し） | `npm run lint` | 0 | eslint と tsc |
| 6 | 2026-09-27 11:13（取り直し） | `ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=nw=1 out/script-engine/about-c.mp4` | 0 | h264＋aac、545.962667 秒（manifest 16377 frames / 30 = 545.9 秒） |
| 6 | 2026-09-27 11:13（取り直し） | `node -e "const {PDFDocument}=require('pdf-lib');PDFDocument.load(require('fs').readFileSync('out/script-engine/about-c.pdf')).then(d=>console.log(d.getPageCount()))"` | 0 | 17 ページ（pdf-manifest の total_pages と一致） |
| 6 | 2026-09-27 11:13（取り直し） | `node -e "const m=require('./public/manifests/about-c.manifest.json');console.log(m.total_duration_frames/m.fps, m.credits)"` | 0 | 545.9 秒。credits は VOICEVOX 2 行と立ち絵 1 行 |
| 6 | 2026-09-27 11:13（取り直し） | `ffmpeg -v error -y -ss <秒> -i out/script-engine/about-c.mp4 -frames:v 1 <scratchpad>/f-<秒>.png`（12 本を 1 本ずつ：15・60・110・205・250・300・335・380・440・480・525・544.5） | 0 | 12 本とも 0。目視は元の実行（10:26）の切り出しで行った：図解の強調・立ち絵の向き（聞き役は内向き）・最後のクレジット |
| 6 | 2026-09-27 11:13（取り直し） | `magick -density 50 "out/script-engine/about-c.pdf[4]" "out/script-engine/about-c.pdf[13]" +append <scratchpad>/pdf.png` | 0 | PDF の年表と科目の表のページ |
| 7 | 2026-09-27 11:13（取り直し） | `sha256sum out/script-engine/about-c.mp4 out/script-engine/about-c.pdf deliver/about-c/about-c.mp4 deliver/about-c/about-c.pdf deliver/about-c/description.md` | 0 | MP4 `f63dc83e…59c4`・PDF `a747922d…abe8` が out と deliver で一致。description.md `ebff9d73…7664` |
| 7 | 2026-09-27 11:13（取り直し） | `cmp materials/about-c/description.md deliver/about-c/description.md` | 0 | 同一 |
| 7 | 2026-09-27 11:13（取り直し） | `grep -l -f <scratchpad>/names.txt $(git diff --name-only c4e6ffe..HEAD -- . ':!public/audio')` | 1 | 一致 0 件（合格）。names.txt は 5 行：姓の漢字・名の漢字・名の読み（カタカナとひらがな）・名のローマ字（BOM なし。当たることを別ファイルで試した）。姓の読みは入れていない（検収 3 回目の付記） |
| 7 | 2026-09-27 11:13（取り直し） | `grep -c -f <scratchpad>/names.txt deliver/about-c/description.md` | 1 | 0 件（合格） |
| 7 | 2026-09-27 11:13（取り直し） | `pdftotext -enc UTF-8 deliver/about-c/about-c.pdf - \| grep -c -f <scratchpad>/names.txt` | 1 | 0 件（合格）。pipefail の下で取った |
| 7 | 2026-09-27 11:13（取り直し） | `pdftotext -enc UTF-8 deliver/about-c/about-c.pdf - \| grep -c 担当の先生` | 0 | 3 件（個人名の代わりの言い方） |
| 5 | 2026-09-27 11:54〜12:04 | `npm run render:all:script -- source-to-exe`（`out/script-engine/source-to-exe.*` を消してから。続けて about-c。バックグラウンドで `echo ste_exit=$?`） | 0 | 箇条書き・R1〜R3 の直し（`d2f6af5`、Wave 3 の訂正節）の後の書き出し直し |
| 5 | 2026-09-27 11:58〜12:04 | `npm run render:all:script -- about-c`（`out/script-engine/about-c.*` を消してから。`echo ac_exit=$?`） | 0 | 同上 |
| 6 | 2026-09-27 12:04 | `ffmpeg -v error -y -ss <秒> -i out/script-engine/source-to-exe.mp4 -frames:v 1 <scratchpad>/n-ste-<秒>.png`（85・105・187.8・215.8・259.5 を 1 本ずつ、各 `echo exit=$?`） | 0 | 全体図で hello.c が光らない（R1）・強調の矢じりが見える（R2）・箇条書き 3 枚の点と文字がそろう |
| 6 | 2026-09-27 12:04 | `ffmpeg -v error -y -ss <秒> -i out/script-engine/about-c.mp4 -frames:v 1 <scratchpad>/n-ac-<秒>.png`（205・250・300・480・525 を 1 本ずつ、各 `echo exit=$?`） | 0 | 箇条書き 4 枚の点と文字がそろう |
| 6 | 2026-09-27 12:04 | `pdftotext -enc UTF-8 out/script-engine/about-c.pdf - \| grep "本資料"`（pipefail） | 0 | 注記が「…自作図版・立ち絵は CC BY 4.0 …（キャラクター音声は各権利者の規約に従います）」 |
| 7 | 2026-09-27 12:05 | `cp out/script-engine/about-c.mp4 out/script-engine/about-c.pdf deliver/about-c/`（`echo cp_ac_exit=$?`） | 0 | 納品物の差し替え |
| 7 | 2026-09-27 12:05 | `sha256sum out/script-engine/about-c.mp4 out/script-engine/about-c.pdf deliver/about-c/about-c.mp4 deliver/about-c/about-c.pdf deliver/about-c/description.md`（ほかに source-to-exe の 5 本も同じ呼び出しで。`echo sha_exit=$?`） | 0 | 新しい MP4 `be055db0…31b6`・PDF `bec94511…a90c` が out と deliver で一致。description.md は変えていない（`ebff9d73…7664`）。11:13 の行の `f63dc83e…`・`a747922d…` は直す前の版 |
| 7 | 2026-09-27 12:05 | `ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=nw=1 out/script-engine/about-c.mp4`（`echo ffprobe_exit=$?`） | 0 | h264＋aac、545.962667 秒 |
| 7 | 2026-09-27 12:05 | `node -e "const {PDFDocument}=require('pdf-lib');PDFDocument.load(require('fs').readFileSync('out/script-engine/about-c.pdf')).then(d=>console.log(d.getPageCount()))"`（`echo pages_exit=$?`） | 0 | 17 ページ |

## 終了コードを取っていない実行

元の実行では終了コードを取っていなかった物（パイプ・`;`・`&&` の途中で叩いた、または `$?` を付けなかった）。成否は出力で見た。上の表の取り直しの行が、同じコマンドの実測である。

- 手順 0（07:08）：VOICEVOX の `/version`（`"0.25.2"`）。
- 手順 0（08:21）：`npm test`（18 files / 350 tests。Wave 2.5 の締めの状態。今は取り直せない）。
- 手順 3（09:54・09:55）：`npx vitest run src/script-engine/render/about-c`（9 件）、`npm test`（19 files / 362 tests）。
- 手順 1（10:01）：シラバスの科目ページ 8 本（すべて 200）。
- 手順 3（10:03）：`parse-check.mjs`。1 回目は「未知のプロファイル名」で予測が出ず、直して叩き直した回で 495.3 秒。
- 手順 4（10:15）：`npm test`（登録の後。362 件）、`kana.js`（英字を含む発話）。
- 手順 4（10:16）：still を `--image-format=png` なしで 10 枚。10 枚とも fail（remotion.config の既定の形式 pdf と、出力名の .png がぶつかる）。終了コードの値は取っていない。
- 手順 6〜7（10:26〜10:27）：ffprobe、pdf-lib のページ数、manifest の credits、ffmpeg の切り出し 12 枚、magick、`cp`→`sha256sum`、氏名の grep 3 本。氏名の grep は、元の記録に終了コード 0 と書いていたが、一致 0 件なら grep は 1 で終わるので誤りだった（検収 2 回目の指摘）。

## コマンドではない作業

調べ役が取った資料と、ファイルを書いた作業。

- 手順 1（2026-09-27 09:50〜09:58 ごろ）：一次資料の取得（Ritchie "The Development of the C Language"・WG14・GCC・Python・pico-sdk・Arduino・kernel.org・NumPy・PyTorch・MDN・C99 Rationale・TIOBE）。調べ役（general-purpose）が curl と WebFetch で取得し、HTTP 200 を確かめた。`outline.md` の出典 A
- 手順 1（2026-09-27 09:50〜10:00 ごろ）：都城高専 2026 年度シラバスの取得（科目一覧 2 本と科目ページ 20 本）。調べ役が取得。2 年以上の科目は URL の year が入学年度。`outline.md` の出典 B
- 手順 3（2026-09-27 10:02）：`content/scripts/about-c.script.yaml` を書く（56 発話・17 スライド・3,329 字）。YAML のアンカー（`&`・`<<`）は js-yaml が merge しないので書き下した
- 手順 2（2026-09-27 10:04）：`materials/about-c/outline.md` を書く（対象・尺・章立て 7 章・出典・事実と出典の対応 38 行）。完了条件 1
- 手順 3（2026-09-27 10:14）：台本承認を `outline.md` に 1 行書く。主人「承認」
- 手順 4（2026-09-27 10:15）：`src/script-engine/render/manifest-registry.ts` に about-c を登録（import 2 行と各 registry 1 行）
- 手順 4（2026-09-27 10:15）：台本の表記を 3 か所直す（u-010・u-037・u-042。`outline.md` に記録）
- 手順 4（2026-09-27 10:17〜10:19）：部品 CTimeline・CourseMap と、台本の年表・科目の表の説明の改行を直す
- 手順 7（2026-09-27 10:27）：`cp out/script-engine/about-c.mp4 out/script-engine/about-c.pdf materials/about-c/description.md deliver/about-c/`（`&&` の後ろの sha256sum の一致で成功を見た）
