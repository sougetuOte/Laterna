# build-log.md ── 「ネットワークの地図」を作った記録（手順番号・コマンド・終了コード）

`goal.md` Wave 7 の完了条件 8：`SKILL.md` の手順 0〜7 と対応する。時刻は JST（2026-10-19）。

**表の決まり**（`materials/about-c/build-log.md` と同じ）：
- 表には、終了コードを実際に取ったコマンドだけを書く。1 行 1 コマンド。
- 「実測」とは、そのコマンドを単独で叩き、直後に `echo exit=$?` で取った値を言う。
- 出力をファイルに落とした物は、コマンドの欄ではリダイレクトを省いて書き、備考にログの名前を書く。
- grep は一致が 0 件だと 1 で終わる。氏名や依頼書の行の検索では 1 が合格（一致 0 件）。
- `<scratchpad>` はこのセッションの scratchpad の絶対パス（`C:/Users/metral/AppData/Local/Temp/claude/D--work8-Laterna/926e6c2e-da6d-4224-ad77-32500183afeb/scratchpad`）。`<依頼>` は依頼のフォルダ（`G:/マイドライブ/高専/2026/情報基礎Ⅱ/情報基礎Ⅱ後期第3週`。読むだけ）。
- 自作の node のスクリプトのうち、取得や検査の結果を出すだけの物（`fetch-texts.mjs`・`check-phrases.mjs`・`kana-all.mjs` など）は、最後に `process.exitCode = 0` にしている。終了コード 0 は「最後まで走った」ことだけを示し、中身の合否は備考に書く。

| 手順 | 日時 | コマンド | 終了コード | 備考 |
|---|---|---|---|---|
| 0 | 08:04 | `curl -s -m 3 http://127.0.0.1:50021/version` | 0 | `"0.25.2"`。VOICEVOX は起動していた |
| 1 | 08:2x | `node <scratchpad>/commons-thumb.mjs <scratchpad>/dl-fiber 640 "File:Optical fiber close.jpg" …`（光ファイバの写真の候補 5 枚の縮小版） | 0 | ライセンスは CC BY 2.0・CC BY 3.0・CC BY 2.0・CC BY 4.0・CC0。`Optical patchcord.jpg`（CC BY 4.0）を選んだ |
| 1 | 08:2x | `node <scratchpad>/fetch-file.mjs https://upload.wikimedia.org/wikipedia/commons/c/cd/Optical_patchcord.jpg <scratchpad>/dl-orig/Optical_patchcord.jpg` | 0 | HTTP 200 |
| 1 | 08:2x | `magick <scratchpad>/dl-orig/Optical_patchcord.jpg -auto-orient -crop 2838x3321+258+710 +repage -resize x1400 -strip -quality 85 public/images/network-map/fiber.jpg` | 0 | 1196×1400。記録は `images.md` |
| 1 | 08:2x | `magick <依頼>/2610150700<6 桁>.JPG …`（教科書の写真の縮小版を 8 枚。ループ） | 1 | ファイル名の先頭を取り違えた（正しくは `261015070`）。8 枚とも開けなかった。goal.md の訂正節の元 |
| 1 | 08:2x | `magick <依頼>/261015070<6 桁>.JPG …`（同じ 8 枚。ループの各回に `\|\| echo "fail …"`） | 0 | fail は 1 度も出なかった。写真で行き先を確かめた（`outline.md` の「行き先の対応」） |
| 1 | 08:2x | `node <scratchpad>/fetch-texts.mjs <scratchpad>/sources.txt <scratchpad>/src-text` | 0 | 出典の候補 22 本。22 本とも HTTP 200 |
| 1 | 08:2x | `/mingw64/bin/pdftotext -enc UTF-8 <scratchpad>/dl-soumu/000989912.pdf <scratchpad>/src-text/soumu-000989912.txt`（総務省の簡易マニュアル 2 本。ループ） | 0 | 2 本とも 0。`Unknown character collection 'Adobe-Japan1'` の警告は出たが、本文は取れた |
| 3 | 08:3x | `npx tsx <scratchpad>/parse-check.ts network-map` | 1 | `Top-level await is currently not supported with the "cjs" output format`。拡張子を `.mts` にした |
| 3 | 08:3x | `npx tsx <scratchpad>/parse-check.mts network-map`（import に `D:/…` の絶対パス） | 1 | `ERR_UNSUPPORTED_ESM_URL_SCHEME`。import を `file:///D:/…` に直した |
| 3 | 08:3x | `npx tsx <scratchpad>/parse-check.mts network-map`（`parseScript` と `estimateScriptDuration` だけを呼ぶ。VOICEVOX は呼ばない） | 0 | 59 発話・18 スライド・18 イベント。3,468 字、予測 487.1 秒（空白を外す前） |
| 3 | 08:3x | `node <scratchpad>/kana-all.mjs network-map`（全 59 発話の `/audio_query` の `kana`） | 0 | `<scratchpad>/kana-network-map.txt`。数字と英字の前後の空白で「4 つ」→ヨン、ツ、「1977 年」→…トシ、「章」→アキラ、「いちばん上」→イチバンジョオなどを見つけた |
| 3 | 08:3x | `node <scratchpad>/fix-utterances.mjs content/scripts/network-map.script.yaml` | 0 | 発話の文だけ、日本語に隣り合う半角の空白を外し、4 か所を言い換えた |
| 3 | 08:3x | `node <scratchpad>/kana-all.mjs network-map` | 0 | `<scratchpad>/kana-network-map-2.txt`。読みの崩れが無いことを見た |
| 3 | 08:34 | `npx tsx <scratchpad>/parse-check.mts network-map` | 0 | 3,278 字、予測 487.9 秒 |
| 3 | 08:3x | `node <scratchpad>/approval-table.mjs network-map` | 0 | 台本承認の表（`<scratchpad>/approval-table.md`）。主人に見せた |
| 3 | 08:3x | `grep -F -c -f <scratchpad>/irai-lines.txt materials/network-map/outline.md` | 1 | 依頼書の 40 字以上の行（52 行）が outline.md に 0 件 |
| 3 | 08:3x | `grep -F -i -c -f /d/work8/Laterna-private/names.txt materials/network-map/outline.md content/scripts/network-map.script.yaml` | 1 | 氏名 0 件 |
| 4 | 10:29 | `curl -s -m 3 http://127.0.0.1:50021/version` | 0 | `"0.25.2"` |
| 4 | 10:29 | `npm run compile:script -- network-map` | 0 | 新規合成 59 件。15749 frames（約 525.0 秒）。PDF manifest 18 ページ。ログは `out/compile-network-map.log` |
| 4 | 10:30 | `npm run lint` | 0 | `manifest-registry.ts` に network-map を登録した後。ログは `out/lint-network-map.log` |
| 4 | 10:30 | `npm test` | 0 | 22 files / 405 tests PASS。ログは `out/test-network-map.log` |
| 5 | 10:30 | `npm run render:all:script -- network-map` | 0 | 1 回目。10:36 に終わった。終了コードはログの最後の行 `render_exit=0`（npm の直後に `echo "render_exit=$?"` で取った）。ログは `out/render-network-map.log`。MP4 を `<scratchpad>/network-map-r1.mp4` に控えた |
| 6 | 10:37 | `sh <scratchpad>/frames.sh <scratchpad>/network-map-r1.mp4 <scratchpad>/frames-r1` | 0 | 18 枚のスライドの真ん中の時刻の静止画と一覧 3 枚。崩れ・はみ出しなし。横長の図も 1920×1080 で読めた |
| 4 | 10:3x | `npm run compile:script -- network-map` | 0 | 光ファイバの写真のキャプションに「写真は切り抜き・縮小」を足した後（CC BY 4.0 の加工の表示）。再合成 0 件・skip 59 件。15749 frames（約 525.0 秒）。ログは `out/compile-network-map-2.log` |
| 5 | 10:3x | `npm run render:all:script -- network-map` | 0 | 2 回目（キャプションを直した後）。10:43 に終わった。終了コードはログの最後の行 `render_exit=0`。ログは `out/render-network-map-2.log` |
| 6 | 10:43 | `ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=nw=1 out/script-engine/network-map.mp4` | 0 | h264・aac、525.013 秒（manifest 15749/30 = 524.97 秒） |
| 6 | 10:43 | `node -e "…pdf-lib…getPageCount()"` | 0 | 18 ページ（pdf-manifest の total_pages 18） |
| 6 | 10:4x | `ffmpeg -v error -y -ss 99.67 -i out/script-engine/network-map.mp4 -frames:v 1 <scratchpad>/r2-fiber.png` | 0 | 直したキャプションが出ていることを目視した |
| 6 | 10:4x | `node <scratchpad>/problem-values.mjs <依頼>/情報基礎II_後期第3週_ネットワーク_問題.txt <scratchpad>/problem-values.txt` | 0 | 復習問題の数値 12 件を取り出した（値は書かない） |
| 6 | 10:4x | `pdftotext -enc UTF-8 out/script-engine/network-map.pdf <scratchpad>/network-map-pdf.txt` | 0 | PDF の本文テキスト |
| 6 | 10:4x | `grep -F -c -f <scratchpad>/problem-values.txt content/scripts/network-map.script.yaml <scratchpad>/network-map-pdf.txt` | 1 | 0 件（goal.md Wave 7 の完了条件 7） |
| 6 | 10:4x | `grep -F -i -c -f /d/work8/Laterna-private/names.txt <scratchpad>/network-map-pdf.txt materials/network-map/description.md materials/network-map/images.md materials/network-map/build-log.md` | 1 | 氏名 0 件 |
| 6 | 10:4x | `grep -c "都城\|コア学園" content/scripts/network-map.script.yaml materials/network-map/description.md <scratchpad>/network-map-pdf.txt` | 1 | 学校名 0 件 |
| 7 | 10:44 | `sha256sum out/script-engine/network-map.mp4 deliver/network-map/network-map.mp4 out/script-engine/network-map.pdf deliver/network-map/network-map.pdf` | 0 | MP4 `1489ff0f…f1a4`・PDF `524cedd1…d6b5`。`out/` と `deliver/` が一致。主人の試写に出した版 |

**試写の後の直し（15:1x〜）**：主人の試写で「DNS と電話帳のたとえが学生の年代に分からない」と言われ、u-031 とスライド `slide-dns` のたとえをスマホの連絡先に替えた（`outline.md` の「試写の後に変えた所」）。

| 手順 | 日時 | コマンド | 終了コード | 備考 |
|---|---|---|---|---|
| 4 | 15:18 | `curl -s -m 3 http://127.0.0.1:50021/version` | 0 | `"0.25.2"` |
| 4 | 15:18 | `npm run compile:script -- network-map` | 0 | 再合成 1 件（u-031）・skip 58 件、prune 1 件。15892 frames（約 529.7 秒）。PDF manifest 18 ページ。ログは `out/compile-network-map-3.log` |
| 4 | 15:1x | `node <scratchpad>/kana-all.mjs network-map` | 0 | `<scratchpad>/kana-network-map-3.txt`。u-031 の読みが正しいことを見た |
| 5 | 15:2x | `npm run render:all:script -- network-map` | 0 | 3 回目（たとえを直した後）。15:27 までに終わった。終了コードはログの最後の行 `render_exit=0`。ログは `out/render-network-map-3.log` |
| 6 | 15:27 | `ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=nw=1 out/script-engine/network-map.mp4` | 0 | h264・aac、529.792 秒（manifest 15892/30 = 529.73 秒） |
| 6 | 15:27 | `node -e "…pdf-lib…getPageCount()"` | 0 | 18 ページ（pdf-manifest の total_pages 18） |
| 6 | 15:27 | `ffmpeg -v error -y -ss 262.57 -i out/script-engine/network-map.mp4 -frames:v 1 <scratchpad>/r3-dns.png` | 0 | スライド `slide-dns` に「スマホの連絡先と同じ考え方」が出ていることを目視した |
| 6 | 15:2x | `pdftotext -enc UTF-8 out/script-engine/network-map.pdf <scratchpad>/network-map-pdf-3.txt` | 0 | 「連絡先」2 件、「電話帳」0 件 |
| 6 | 15:2x | `grep -F -c -f <scratchpad>/problem-values.txt content/scripts/network-map.script.yaml <scratchpad>/network-map-pdf-3.txt` | 1 | 復習問題の数値 0 件 |
| 6 | 15:2x | `grep -F -i -c -f /d/work8/Laterna-private/names.txt <scratchpad>/network-map-pdf-3.txt materials/network-map/description.md materials/network-map/outline.md` | 1 | 氏名 0 件 |
| 6 | 15:2x | `grep -c "都城\|コア学園" <scratchpad>/network-map-pdf-3.txt materials/network-map/description.md` | 1 | 学校名 0 件 |
| 6 | 15:2x | `sha256sum out/script-engine/network-map.mp4 out/script-engine/network-map.pdf` | 0 | MP4 `0a4740b5…2cdb`・PDF `5e464157…7c09`。主人の 2 回目の試写に出す版 |
| 7 | 15:37 | `sha256sum out/script-engine/network-map.mp4 deliver/network-map/network-map.mp4 out/script-engine/network-map.pdf deliver/network-map/network-map.pdf` | 0 | 主人の「問題なし。納品物を差し替えて。」の後に `deliver/network-map/` へ写した（`cp` の 3 ファイル）。`out/` と `deliver/` が一致 |
| 7 | 15:37 | `cmp materials/network-map/description.md deliver/network-map/description.md` | 0 | 概要欄も同じ |

## 終了コードを取っていない実行

- 08:1x〜08:2x：Commons の検索（`<scratchpad>/commons-search.mjs`、光ファイバと最初の Web サーバ）、出典の文の確かめ（`<scratchpad>/check-phrases.mjs`・`excerpt.mjs`）、総務省のページの PDF の一覧（`links.mjs`）と取得（`fetch-file.mjs`）、追加の出典の取得（`fetch-texts.mjs` に `sources2.txt`・`sources3.txt`）、VOICEVOX の語ごとの読み（`kana.mjs`）。どれも出力を見て判断に使ったが、終了コードは取っていない。
- 15:1x：案 A と案 B の文の読み（`<scratchpad>/kana.mjs 11 <scratchpad>/terms4.txt` を `sed` にパイプした）。どちらも正しく読んだが、終了コードは取っていない。
