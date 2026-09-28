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
