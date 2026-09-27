# build-log.md — 「C言語について」を作った記録（手順番号・コマンド・終了コード）

`goal.md` Wave 3 の完了条件 6：`SKILL.md` の手順 0〜7 と対応する。1 行 1 コマンド。終了コードは実測。時刻は JST。

時刻は、コマンドの出力・ファイルの更新時刻・コミットの時刻から取った（「ごろ」は調べ役の作業で、開始と終了の間）。

| 手順 | 日時 | コマンド | 終了コード | 備考 |
|---|---|---|---|---|
| 0 | 2026-09-27 07:05 | `node -e "fetch('http://127.0.0.1:50021/version')…"`（curl の代わりに node の fetch） | 0 | VOICEVOX 0.25.2 が稼働中 |
| 0 | 2026-09-27 08:20 | `npm test` | 0 | 18 files / 350 tests passed（Wave 2.5 の締めの状態） |
| 1 | 2026-09-27 10:00 ごろ | `node -e "fetch('https://syllabus.kosen-k.go.jp/Pages/PublicSyllabus?school_id=49&department_id=…')"`（台本で使う科目ページ 8 本） | 0 | 8 本とも HTTP 200（本体が確認） |
| 3 | 2026-09-27 09:54 | `npx vitest run src/script-engine/render/about-c` | 0 | 図解部品 3 つのテスト 9 件 passed |
| 3 | 2026-09-27 09:56 | `npm test` | 0 | 19 files / 362 tests passed（部品の追加後）。`npm run lint` exit 0 |
| 3 | 2026-09-27 10:03 | `node <scratchpad>/parse-check.mjs about-c`（`parseScript` と `estimateScriptDuration` だけを tsx で呼ぶ。VOICEVOX は呼ばない） | 0 | parse OK（56・17・17）。予測総尺 495.3 秒。主人の承認待ち。承認後に compile |
| 4 | 2026-09-27 10:15 | `npm run compile:script -- about-c` | 0 | 新規合成 56 件。total_duration_frames=16327（544.2 秒）。PDF manifest 17 ページ |
| 4 | 2026-09-27 10:15 | `src/script-engine/render/manifest-registry.ts` に about-c を登録（import 2 行と各 registry 1 行）→ `npm test`・`npm run lint` | 0 | 19 files / 362 tests passed、lint exit 0 |
| 4 | 2026-09-27 10:15 | `node <scratchpad>/kana.js`（VOICEVOX の `/audio_query` の kana で読みを確かめる） | 0 | 読み違い 2 件（u-010「その間に」→「そのかんに」、u-037「その分」→「そのわけ」）と聞き取りにくい 1 件（u-042）。表記を直した（`outline.md` に記録） |
| 4 | 2026-09-27 10:15 | `npm run compile:script -- about-c` | 0 | 再合成 3 件・skip 53 件、prune 3 件。16377 frames（545.9 秒） |
| 4 | 2026-09-27 10:16〜10:17 | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <png> --frame=<N> --image-format=png --props=<props.json>`（10 枚） | 0 | 試写。年表の年が上下に交互で読みにくい、科目の表の文字が小さい → 部品 CTimeline・CourseMap と台本の説明の改行を直した。`--image-format=png` が無いと remotion.config の既定（pdf）とぶつかって落ちる |
| 4 | 2026-09-27 10:18 | `npm run compile:script -- about-c` | 0 | スライドの props だけの変更で再合成 0 件。16377 frames |
| 4 | 2026-09-27 10:18〜10:19 | 同じ still（6 枚）→ `npm test`・`npm run lint` | 0 | 年表・表とも読める大きさ。学科名の折り返しを直した。19 files / 362 tests passed、lint exit 0 |
| 5 | 2026-09-27 10:19〜10:26 | `npm run render:all:script -- about-c`（`out/script-engine/about-c.*` を消してから、バックグラウンドで） | 0 | compile（再合成 0）→ render → PDF。手作業の補正なし |
| 6 | 2026-09-27 10:27 | `ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=nw=1 out/script-engine/about-c.mp4` | 0 | h264＋aac、545.962667 秒（manifest 16377 frames / 30 = 545.9 秒） |
| 6 | 2026-09-27 10:27 | `node -e "…PDFDocument.load(…about-c.pdf)…getPageCount()"` | 0 | 17 ページ（pdf-manifest の total_pages と一致） |
| 6 | 2026-09-27 10:27 | `node -e "const m=require('./public/manifests/about-c.manifest.json');console.log(m.total_duration_frames/m.fps, m.credits)"` | 0 | VOICEVOX 2 行と立ち絵 1 行 |
| 6 | 2026-09-27 10:28 | `ffmpeg -ss <秒> -i out/script-engine/about-c.mp4 -frames:v 1 <png>`（12 枚：15・60・110・205・250・300・335・380・440・480・525・544.5 秒） | 0 | 図解の強調・立ち絵の向き（聞き役は内向き）・最後のクレジットを目視 |
| 6 | 2026-09-27 10:29 | `magick -density 50 "out/script-engine/about-c.pdf[4]" "…[13]" +append <png>` | 0 | PDF の年表と科目の表のページを目視 |
| 7 | 2026-09-27 10:30 | `cp out/script-engine/about-c.mp4 out/script-engine/about-c.pdf materials/about-c/description.md deliver/about-c/` → `sha256sum` | 0 | MP4 `f63dc83e…59c4`・PDF `a747922d…abe8` が out と一致 |
| 7 | 2026-09-27 10:30 | `{ git diff --name-only c4e6ffe..HEAD; git status --porcelain \| cut -c4-; } \| sort -u \| grep -v "^public/audio" \| xargs grep -l -e <姓> -e <名> -e <読み>`／`grep -c -e <姓> -e <名> deliver/about-c/description.md`／`pdftotext -enc UTF-8 deliver/about-c/about-c.pdf - \| grep -c -e <姓> -e <名>`（氏名は伏せて書く。実際は -e の代わりにバックスラッシュと縦棒でつないだ 1 本の正規表現） | 0 | 氏名 0 件（goal.md Wave 3 完了条件 5） |

## コマンドではない作業

表には実際に叩いたコマンドだけを書く（2026-09-27 の検収 1 回目で、作業の説明に終了コード 0 を付けた行を指摘された）。調べ役が取った資料と、ファイルを書いた作業はここに残す。

- 手順 1（2026-09-27 09:50〜09:58 ごろ）：一次資料の取得（Ritchie "The Development of the C Language"・WG14・GCC・Python・pico-sdk・Arduino・kernel.org・NumPy・PyTorch・MDN・C99 Rationale・TIOBE）。調べ役（general-purpose）が curl と WebFetch で取得し、HTTP 200 を確かめた。`outline.md` の出典 A
- 手順 1（2026-09-27 09:50〜10:00 ごろ）：都城高専 2026 年度シラバスの取得（科目一覧 2 本と科目ページ 20 本）。調べ役が取得。2 年以上の科目は URL の year が入学年度。`outline.md` の出典 B
- 手順 2（2026-09-27 10:04）：`materials/about-c/outline.md` を書く（対象・尺・章立て 7 章・出典・事実と出典の対応 38 行）。完了条件 1
- 手順 3（2026-09-27 10:01）：`content/scripts/about-c.script.yaml` を書く（56 発話・17 スライド・3,329 字）。YAML のアンカー（`&`・`<<`）は js-yaml が merge しないので書き下した
- 手順 3（2026-09-27 10:14）：台本承認を `outline.md` に 1 行書く。主人「承認」
