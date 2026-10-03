# build-log.md — 「Pythonが動くまで」を作った記録（手順番号・コマンド・終了コード）

`goal.md` Wave 4 の完了条件 6：`SKILL.md` の手順 0〜7 と対応する。時刻は JST（2026-09-28）。

**表の決まり**（`materials/about-c/build-log.md` と同じ）：
- 表には、終了コードを実際に取ったコマンドだけを書く。1 行 1 コマンド。
- 「実測」とは、そのコマンドを単独で叩き、直後に `echo exit=$?` で取った値を言う。パイプを含む物は `set -o pipefail` の下で取った値。
- 例外として、ループの中で `|| echo fail` を付けて叩き、fail が 1 度も出なかった物は、備考にそう書いて 0 とする。
- 出力を `> <scratchpad>/<名前>.log 2>&1` でファイルに落とした物は、コマンドの欄ではリダイレクトを省いて書き、備考にログの名前を書く。
- `<scratchpad>` はこのセッションの scratchpad の絶対パス（`C:/Users/metral/AppData/Local/Temp/claude/D--work8-Laterna/c54d1211-5809-442d-aae2-ccf5fd2dfe43/scratchpad`）。`<py>` は `<scratchpad>/py`（Python の例を動かした場所）。
- still は `remotion-cli.js` を `node node_modules/@remotion/cli/remotion-cli.js` で呼んだ（作業ディレクトリは `D:\work8\Laterna`）。

| 手順 | 日時 | コマンド | 終了コード | 備考 |
|---|---|---|---|---|
| 0 | 10:20 | `node -e "fetch('http://127.0.0.1:50021/version').then(async r=>{console.log(await r.text());process.exit(r.ok?0:1)}).catch(e=>{console.log(e.message);process.exit(1)})"` | 1 | fetch failed。VOICEVOX が止まっていた。この後、主人の機械の `VOICEVOX/vv-engine/run.exe --host 127.0.0.1 --port 50021` を裏で起動した（終了コードは表の外） |
| 0 | 10:20 | `node -e "fetch('http://127.0.0.1:50021/version').then(async r=>{console.log(await r.text());process.exit(r.ok?0:1)}).catch(e=>{console.log(e.message);process.exit(1)})"` | 0 | `"0.25.2"`（run.exe を起動して応答を待った後） |
| 1 | 10:25 | `bash <scratchpad>/urls.sh` | 0 | 出典 21 本を 1 本ずつ取得。各 URL の行の直後に `exit=$?` を取り、21 本とも 200・exit=0（出力は `<scratchpad>/urls.log`。1 回目は node の終了時の落ち（`UV_HANDLE_CLOSING`）で 127 が出たので、`process.exit` を `process.exitCode` に直して取り直した） |
| 1 | 10:27 | `python --version`（`<py>`） | 0 | Python 3.11.9 |
| 1 | 10:27 | `python add.py`（`<py>`） | 0 | 3 |
| 1 | 10:27 | `python -m dis add.py`（`<py>`） | 0 | 出力は `<py>/dis.txt`。スライド slide-dis の元 |
| 1 | 10:27 | `python hello.py`（`<py>`、`__pycache__` を消してから） | 0 | 動かした後も `__pycache__` はできない（`ls -a`） |
| 1 | 10:27 | `python main.py`（`<py>`） | 0 | `__pycache__/greet.cpython-311.pyc` だけができる。スライド slide-pycache の元 |
| 1 | 10:27 | `python name_err.py`（`<py>`） | 1 | NameError。スライド slide-err-name の元（出力は 10:1x の初回の実行で見た物と同じ文。パスは短くして載せた） |
| 1 | 10:27 | `python syn_err.py`（`<py>`） | 1 | SyntaxError。スライド slide-err-syntax の元 |
| 1 | 10:27 | `printf '1 + 2\nprint("こんにちは")\n' \| python -i`（`<py>`、`set -o pipefail`） | 0 | 出力は `<py>/repl.txt`。スライド slide-repl の元 |
| 3 | — | `node <scratchpad>/renum.mjs` | 0 | 発話を 3 つ足した後に id を振り直した（59 発話） |
| 4 | — | `npm run compile:script -- python-runs` | 0 | 1 回目。約 512.3 秒（`<scratchpad>/compile1.log`） |
| 4 | — | `node <scratchpad>/kana.mjs` | 0 | 全 59 発話の `kana`。u-036・u-039「行」→クダリ、u-044「国ごと」→コクゴトを見つけた |
| 4 | — | `node <scratchpad>/kana.mjs` | 0 | かなに直した 3 発話がギョウ・クニゴトと読まれることを確かめた |
| 4 | 10:23 | `npm run compile:script -- python-runs` | 0 | 2 回目。3 件を再合成、15369 フレーム・約 512.3 秒（`<scratchpad>/compile2.log`） |
| 4 | 10:23 | `npm run lint` | 0 | manifest を登録した後（`<scratchpad>/lint1.log`） |
| 4 | 10:23 | `npm test` | 0 | 21 files / 381 tests PASS（`<scratchpad>/test1.log`） |
| 4 | — | `while read id f; do node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <scratchpad>/stills/$id.png --frame=$f --image-format=png --props=<scratchpad>/props.json > <scratchpad>/stills/$id.log 2>&1 \|\| echo "fail $id"; done < <scratchpad>/frames.txt` | 0 | 18 枚。`frames.txt` は各スライドの `start_frame`＋75（1 行「スライド id フレーム」）、`props.json` は `{"scriptId":"python-runs"}`。ループの中で `\|\| echo fail`、fail は 0 回。図の 1 本だけの流れが小さかった |
| 4 | 10:26 | `npm run compile:script -- python-runs` | 0 | 3 回目。RunFlow の寸法と slide-python-flow の箱の文字を直した後（`<scratchpad>/compile3.log`）。15369 フレーム |
| 4 | 10:26 | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <scratchpad>/stills/slide-cpu.png --frame=816 --image-format=png --props=<scratchpad>/props.json` | 0 | 出力は `<scratchpad>/stills/slide-cpu.log` |
| 4 | 10:26 | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <scratchpad>/stills/slide-python-flow.png --frame=4887 --image-format=png --props=<scratchpad>/props.json` | 0 | 出力は `<scratchpad>/stills/slide-python-flow.log` |
| 4 | 10:26 | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <scratchpad>/stills/slide-compiler.png --frame=2022 --image-format=png --props=<scratchpad>/props.json` | 0 | 出力は `<scratchpad>/stills/slide-compiler.log` |
| 4 | 10:26 | `npm run lint` | 0 | `<scratchpad>/lint2.log` |
| 4 | 10:26 | `npm test` | 0 | 21 files / 381 tests PASS（`<scratchpad>/test2.log`） |
| 5 | 10:27 | `npm run render:all:script -- python-runs` | 0 | 10:34 に終わった（`<scratchpad>/render1.log`・`render.time`） |
| 6 | 10:34 | `ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=nw=1 out/script-engine/python-runs.mp4` | 0 | h264・aac、duration=512.362667（manifest 15369 / 30 = 512.3） |
| 6 | 10:34 | `node -e "const {PDFDocument}=require('pdf-lib');PDFDocument.load(require('fs').readFileSync('out/script-engine/python-runs.pdf')).then(d=>{console.log(d.getPageCount(), require('./public/manifests/python-runs.pdf-manifest.json').total_pages)})"` | 0 | 18 18 |
| 6 | 10:34 | `pdftotext -enc UTF-8 out/script-engine/python-runs.pdf <scratchpad>/pdf.txt` | 0 | `/mingw64/bin/pdftotext` |
| 6 | 10:34 | `grep -c -f <scratchpad>/names.txt goal.md content/scripts/python-runs.script.yaml materials/python-runs/*.md src/script-engine/render/python-runs/* <scratchpad>/pdf.txt` | 1 | 主人の氏名（姓・名・読み、10 行）が全ファイルで 0 件。一覧は Wave 3 の検収で使った物の写し |
| 6 | 10:34 | `grep -n -E "都城\|コア学園\|高専" content/scripts/python-runs.script.yaml materials/python-runs/description.md <scratchpad>/pdf.txt` | 1 | 学校名 0 件 |
| 6 | 10:35 | `ffmpeg -v error -y -ss 510.8 -i out/script-engine/python-runs.mp4 -frames:v 1 <scratchpad>/credits.png` | 0 | クレジット 3 行を目視 |
| 6 | 10:35 | `ffmpeg -v error -y -ss 170 -i out/script-engine/python-runs.mp4 -frames:v 1 <scratchpad>/f170.png` | 0 | CPython の 2 段階の図を目視 |
| 7 | 10:35 | `mkdir -p deliver/python-runs && cp out/script-engine/python-runs.mp4 out/script-engine/python-runs.pdf deliver/python-runs/ && cp materials/python-runs/description.md deliver/python-runs/` | 0 | |
| 7 | 10:35 | `sha256sum out/script-engine/python-runs.mp4 deliver/python-runs/python-runs.mp4 out/script-engine/python-runs.pdf deliver/python-runs/python-runs.pdf` | 0 | MP4 `5f02ecdc…5e83`・PDF `de5b6aea…823c`。out と deliver で一致 |

## 終了コードを取っていない実行

- 10:1x：Python の例の初回の実行（`python hello.py; ...` をつないで叩いた物、`python -m dis add.py` など）。上の 10:27 の行で取り直した。
- 10:1x：出典の調べもの（別の担当に任せた。node の fetch で 13 項目を取得）。上の `urls.sh` の行で取り直した。
- `npx vitest run src/script-engine/render/python-runs src/script-engine/render/component-registry.test.ts \| tail -25`（パイプで pipefail なし）：2 files / 22 tests PASS を見た。上の `npm test` の行で全体を取り直した。
- 時刻の欄の「—」は、その行を叩いたときに時刻を取っていなかった物（終了コードは直後に取った）。

---

## Wave 5（2026-10-03）：写真とスクショを載せる経路と、PDF の組み直し

契約は `goal.md` の Wave 5 節（G0 承認 10:31 JST、セッション `b8f8e477-c56d-4d0c-ba1d-cff90b538386`）。表の決まりは上と同じ。
この節の `<scratchpad>` は `C:/Users/metral/AppData/Local/Temp/claude/D--work8-Laterna/b8f8e477-c56d-4d0c-ba1d-cff90b538386/scratchpad`。
手順の欄は G0 の「作業の順」の A〜D。A〜C は 3 本に共通の直しで、3 本目の記録にまとめて書く。

| 手順 | 日時 | コマンド | 終了コード | 備考 |
|---|---|---|---|---|
| A | 10:34 | `npm uninstall @remotion/media` | 0 | |
| A | 10:34 | `npm install -D --save-exact @types/node@26.0.1` | 0 | 推移依存で入っていた版に固定した |
| A | 10:34 | `npm test` | 0 | 21 files / 381 tests PASS |
| A | 10:34 | `npm run lint` | 0 | |
| A | 10:35 | `node -e "fetch('http://127.0.0.1:50021/version').then(r=>r.text()).then(t=>{console.log('voicevox',t)}).catch(e=>{console.error(e.message);process.exitCode=1})"` | 0 | `"0.25.2"`（`<scratchpad>/render3.sh` の中。VOICEVOX は `run.exe` を裏で起動した後） |
| A | 10:35 | `npm run render:all:script -- source-to-exe` | 0 | `<scratchpad>/render3.sh` の中。ログは `out/render-source-to-exe.log` |
| A | — | `npm run render:all:script -- about-c` | 0 | 同上。`out/render-about-c.log` |
| A | — | `npm run render:all:script -- python-runs` | 0 | 同上。`out/render-python-runs.log` |
| A | 10:51 | `sha256sum out/script-engine/source-to-exe.mp4 deliver/source-to-exe/source-to-exe.mp4` | 0 | `c00f8b35…1434` で一致 |
| A | 10:51 | `sha256sum out/script-engine/source-to-exe.pdf deliver/source-to-exe/source-to-exe.pdf` | 0 | `66c3c06e…42b0` で一致 |
| A | 10:51 | `sha256sum out/script-engine/about-c.mp4 deliver/about-c/about-c.mp4` | 0 | `be055db0…31b6` で一致 |
| A | 10:51 | `sha256sum out/script-engine/about-c.pdf deliver/about-c/about-c.pdf` | 0 | `bec94511…a90c` で一致 |
| A | 10:51 | `sha256sum out/script-engine/python-runs.mp4 deliver/python-runs/python-runs.mp4` | 0 | `5f02ecdc…5e83` で一致 |
| A | 10:51 | `sha256sum out/script-engine/python-runs.pdf deliver/python-runs/python-runs.pdf` | 0 | `de5b6aea…823c` で一致。A の commit は `5affff2` |
| B | 10:52 | `npm run pdf:script -- about-c` | 0 | 縦の組みで 17 ページ。ログは `out/pdf-about-c.log` |
| B | — | `node <scratchpad>/pdf-text-check.mjs about-c out/script-engine/about-c.pdf` | 0 | 見せる発話 56 件、PDF に無い 0 件（`PATH` に `/mingw64/bin` を足して） |
| B | — | `node <scratchpad>/pdf-text-check.mjs about-c deliver/about-c/about-c.pdf` | 0 | 前の版も 56 件・0 件 |
| B | — | `node <scratchpad>/fill-page.mjs 900` | 0 | java-vs-js の pdf-manifest の 1 ページ目を python-runs の発話 17 件・866 字に一時差し替え |
| B | — | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptPdfComposition <scratchpad>/fill900.png --frame=0 --image-format=png --props=<scratchpad>/props-jvj.json` | 0 | ログは `<scratchpad>/fill900.log`。最後の発話がページの下端に届いた |
| B | — | `git checkout -- public/manifests/java-vs-js.pdf-manifest.json` | 0 | 差し替えを戻した |
| B | — | `node <scratchpad>/fill-page.mjs 600 3` | 0 | 最終ページ（4 ページ目）を 12 件・587 字に一時差し替え |
| B | — | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptPdfComposition <scratchpad>/fill600-last.png --frame=3 --image-format=png --props=<scratchpad>/props-jvj.json` | 0 | 注記 3 行で下端に届いた |
| B | — | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptPdfComposition <scratchpad>/fill900b.png --frame=0 --image-format=png --props=<scratchpad>/props-jvj.json` | 0 | 絵を枠いっぱいにした後の 866 字。最後の発話が下で切れた → 上限を 450 にした |
| B | — | `git checkout -- public/manifests/java-vs-js.pdf-manifest.json` | 0 | 差し替えを戻した。`git status --porcelain public` は空 |
| B | 10:56 | `npm test` | 0 | 386 tests PASS |
| B | 10:56 | `npm run lint` | 0 | |
| B | — | `npm run compile:script -- source-to-exe` | 0 | ログは `out/compile-source-to-exe.log` |
| B | — | `npm run compile:script -- about-c` | 0 | |
| B | — | `npm run compile:script -- python-runs` | 0 | |
| B | — | `npm run compile:script -- java-vs-js` | 0 | 4 本とも、差は pdf-manifest の `char_limit` 900 → 450 の 1 行だけ。B の commit は `f3336cb` |
| C | 10:59 | `npm test` | 0 | 405 tests PASS（画像のスライドのテスト 18 件と描画のテスト 1 件を足した後） |
| C | 10:59 | `npm run lint` | 0 | C の commit は `3278e94` |
| D | 11:00 | `npm run compile:script -- python-runs` | 0 | 再合成 0 件・skip 59 件、15369 フレーム（約 512.3 秒）のまま。PDF は 20 ページ。ログは `out/compile-python-runs-d.log` |
| D | — | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <scratchpad>/stills5/ev-002.png --frame=801 --image-format=png --props=<scratchpad>/props-pr.json` | 0 | CPU の写真のスライドを目視 |
| D | — | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <scratchpad>/stills5/ev-014.png --frame=10456 --image-format=png --props=<scratchpad>/props-pr.json` | 0 | python.org の画面写しのスライドを目視 |
| D | — | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptComposition <scratchpad>/stills5/credit.png --frame=15339 --image-format=png --props=<scratchpad>/props-pr.json` | 0 | クレジット 5 行（画像 2 行を含む）を目視 |
| D | — | `npm run pdf:script -- python-runs` | 0 | 20 ページ。2・15 ページが画像、最終ページの注記 7 行を目視 |
| D | — | `node <scratchpad>/fill-page2.mjs 450 19 public/manifests/python-runs.pdf-manifest.json` | 0 | 最終ページを 9 件・439 字に一時差し替え（前に `<scratchpad>/pr-pdf-manifest.backup.json` へ写した） |
| D | — | `node node_modules/@remotion/cli/remotion-cli.js still src/index.ts ScriptPdfComposition <scratchpad>/fill450-pr-last.png --frame=19 --image-format=png --props=<scratchpad>/props-pr.json` | 0 | 注記 7 行の上に余白が残った |
| D | — | `cp <scratchpad>/pr-pdf-manifest.backup.json public/manifests/python-runs.pdf-manifest.json` | 0 | 戻した後の SHA-256 は差し替え前と同じ `b4b59d06…e696` |
| D | 11:02 | `npm run compile:script -- java-vs-js` | 0 | `<scratchpad>/render-d.sh` の中。`git status` に java-vs-js の manifest の差は無い |
| D | 11:02 | `npm run render:all:script -- python-runs` | 0 | 同上。MP4 `c7c07ae5…4c05`・PDF `ec998d03…069c`。ログは `out/render-d-python-runs.log` |
| D | 11:09 | `npm run render:all:script -- source-to-exe` | 0 | 同上。MP4 `c00f8b35…1434`（前と同じ）・PDF `6af6b3a1…7836` |
| D | 11:13 | `npm run render:all:script -- about-c` | 0 | 同上。MP4 `be055db0…31b6`（前と同じ）・PDF `9b6c481c…8c47` |
| D | 11:20 | `node <scratchpad>/pdf-text-check.mjs source-to-exe out/script-engine/source-to-exe.pdf` | 0 | 見せる発話 27 件、PDF に無い 0 件 |
| D | 11:20 | `node <scratchpad>/pdf-text-check.mjs about-c out/script-engine/about-c.pdf` | 0 | 56 件・0 件 |
| D | 11:20 | `node <scratchpad>/pdf-text-check.mjs python-runs out/script-engine/python-runs.pdf` | 0 | 59 件・0 件 |
| D | 11:20 | `ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=nw=1 out/script-engine/python-runs.mp4` | 0 | h264・aac、duration=512.362667 |
| D | 11:20 | `node -e "…PDFDocument.load…"`（3 本の PDF のページ数・pdf-manifest の total_pages・全ページ縦長か） | 0 | source-to-exe 10・about-c 17・python-runs 20、どれも一致して縦長 |
| D | — | `grep -F -i -c -f D:/work8/Laterna-private/names.txt <起点 2c9cfb5 からの変更ファイルと未追跡ファイル 26 本（画像を除く）> <scratchpad>/*-w5.txt deliver/*/description.md` | 0 | 0 でない行は `package-lock.json:4` だけ（一覧は 10 行・空行 0・行末の空白 0・BOM なし）。4 件は `integrity` の base64 の中の 3 字の英字で、`7adcf12` の時点から同じ 4 件、起点からの差分の行では 0 件（`git diff 2c9cfb5 -- package-lock.json \| grep "^[-+]" \| grep -F -i -c -f …` が 0・exit 1） |
| D | — | `grep -n -E "都城\|コア学園\|高専" content/scripts/python-runs.script.yaml materials/python-runs/description.md materials/python-runs/images.md <scratchpad>/python-runs-w5.txt` | 1 | 学校名 0 件 |
| D | 11:25 | `cp out/script-engine/python-runs.mp4 out/script-engine/python-runs.pdf deliver/python-runs/` | 0 | 主人の試写（「問題なし」）の後 |
| D | 11:25 | `cp materials/python-runs/description.md deliver/python-runs/` | 0 | |
| D | 11:25 | `cp out/script-engine/source-to-exe.pdf deliver/source-to-exe/` | 0 | 1 本目は PDF だけ差し替え |
| D | 11:25 | `cp out/script-engine/about-c.pdf deliver/about-c/` | 0 | 2 本目は PDF だけ差し替え |
| D | 11:25 | `sha256sum out/script-engine/python-runs.mp4 deliver/python-runs/python-runs.mp4` | 0 | `c7c07ae5…4c05` で一致 |
| D | 11:25 | `sha256sum out/script-engine/python-runs.pdf deliver/python-runs/python-runs.pdf` | 0 | `ec998d03…069c` で一致 |
| D | 11:25 | `sha256sum out/script-engine/source-to-exe.mp4 deliver/source-to-exe/source-to-exe.mp4` | 0 | `c00f8b35…1434` で一致（前と同じ） |
| D | 11:25 | `sha256sum out/script-engine/source-to-exe.pdf deliver/source-to-exe/source-to-exe.pdf` | 0 | `6af6b3a1…7836` で一致 |
| D | 11:25 | `sha256sum out/script-engine/about-c.mp4 deliver/about-c/about-c.mp4` | 0 | `be055db0…31b6` で一致（前と同じ） |
| D | 11:25 | `sha256sum out/script-engine/about-c.pdf deliver/about-c/about-c.pdf` | 0 | `9b6c481c…8c47` で一致 |
| D | 11:25 | `cmp materials/python-runs/description.md deliver/python-runs/description.md` | 0 | |

### 終了コードを取っていない実行（Wave 5）

- `npx vitest run src/compositions/ScriptPdfCompositionTree.test.tsx \| grep …`・`npx vitest run src/script-engine/compiler/image-slide.test.ts \| grep …`・`npx tsc --noEmit \| head`（パイプで pipefail なし）：上の `npm test`・`npm run lint` の行で取り直した。
- 画像の入手：Commons の API を `node <scratchpad>/commons-search.mjs`・`commons-get.mjs` で叩いた（exit 0 を見たが、表の行にするほどの物ではないので `images.md` に入手の記録を書いた）。スクショの切り抜きは `images.md` にコマンドを書いた。
