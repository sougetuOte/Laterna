# build-log.md ── 「Webサーバーと Flask のしくみ」を作った記録（手順番号・コマンド・終了コード）

`goal.md` Wave 6 の完了条件 6：`SKILL.md` の手順 0〜7 と対応する。時刻は JST（2026-10-06）。

**表の決まり**（`materials/about-c/build-log.md` と同じ）：
- 表には、終了コードを実際に取ったコマンドだけを書く。1 行 1 コマンド。
- 「実測」とは、そのコマンドを単独で叩き、直後に `echo exit=$?` で取った値を言う。
- 出力をファイルに落とした物は、コマンドの欄ではリダイレクトを省いて書き、備考にログの名前を書く。
- `<scratchpad>` はこのセッションの scratchpad の絶対パス（`C:/Users/metral/AppData/Local/Temp/claude/D--work8-Laterna/5e52e39c-6435-4e04-956b-002a51852adf/scratchpad`）。`<venv>` は `<scratchpad>/flaskenv`（Python 3.11.9 の venv。Flask を入れた場所）、`<hello>` は `<scratchpad>/hello`（例のアプリを置いた場所）。

| 手順 | 日時 | コマンド | 終了コード | 備考 |
|---|---|---|---|---|
| 0 | 07:39 | `curl -s -m 3 http://127.0.0.1:50021/version` | 7 | VOICEVOX が止まっていた。この後 `run.exe --host 127.0.0.1 --port 50021` を裏で起動した |
| 1 | 07:5x | `python -m venv flaskenv`（`<scratchpad>`） | 0 | |
| 1 | 07:5x | `flaskenv/Scripts/python.exe -m pip install --no-cache-dir --disable-pip-version-check -q flask==2.3.2`（`<scratchpad>`） | 0 | Flask 2.3.2・Werkzeug 3.1.9 ほかが入った（`pip list`） |
| 1 | 07:55 | `../flaskenv/Scripts/flask.exe --version`（`<hello>`） | 1 | `AttributeError: module 'werkzeug' has no attribute '__version__'`（Werkzeug 3.1.9 との組み合わせ） |
| 1 | 07:55 | `node -e "fetch('http://127.0.0.1:5000/')…"`（`flask --app hello run` を裏で起動した後） | 0 | `/` は 200 で `<p>Hello, World!</p>`、`/nothing` は 404。サーバーの出力は `<hello>/run.log`。スライド slide-run の元 |
| 1 | 07:56 | `flaskenv/Scripts/python.exe -m pip install --no-cache-dir --disable-pip-version-check -q werkzeug==2.3.8`（`<scratchpad>`） | 0 | 起動したサーバーは PowerShell の `Stop-Process` で止めた後 |
| 1 | 07:56 | `flaskenv/Scripts/flask.exe --version`（`<scratchpad>`） | 0 | Python 3.11.9・Flask 2.3.2・Werkzeug 2.3.8 |
| 1 | 08:1x | `node -e "…"`（出典 23 本の取得と、引用の文字列の一致） | 1 | 22 本は一致。クイックスタートの `Running on http://127.0.0.1:5000/` だけ不一致（実際の本文は末尾の `/` が無く `(Press CTRL+C to quit)` が続く）。outline.md の引用を直した。23 本とも HTTP 200 |
| 4 | 08:02 | `npm run compile:script -- web-flask` | 1 | VOICEVOX の `/synthesis` で fetch failed（裏で起動した VOICEVOX が、背景の時間の上限で止められていた）。ログは `out/compile-web-flask.log` |
| 4 | 08:12 | `npm run compile:script -- web-flask` | 0 | VOICEVOX を起動し直した後。予測 345.2 秒、10860 フレーム・約 362.0 秒、PDF 12 ページ。ログは `out/compile-web-flask.log` |
| 4 | 08:1x | `node -e "…audio_query…"`（全 47 発話の `kana`） | 0 | `<scratchpad>/kana.txt`。u-019・u-020・u-026・u-029 の「行」→クダリ、u-045 の「値」→ネを見つけ、「ぎょう」「返したもの」に直した |
| 5 | 08:12 | `npm run render:all:script -- web-flask` | 0 | 1 回目（読みを直す前）。08:19 に終わった。ログは `out/render-web-flask.log`。MP4 を `<scratchpad>/web-flask-r1.mp4` に控え、各スライドの静止画（`<scratchpad>/frames/`）を目視して崩れが無いことを見た |
| 4 | 08:2x | `npm run compile:script -- web-flask` | 0 | 読みを直した 5 発話を再合成。10856 フレーム・約 361.9 秒、PDF 12 ページ。ログは `out/compile-web-flask-2.log` |
| 4 | 08:2x | `npm test` | 0 | 22 files / 405 tests PASS（`<scratchpad>/test.log`） |
| 4 | 08:2x | `npm run lint` | 0 | |
| 5 | 08:19 | `npm run render:all:script -- web-flask` | 0 | 2 回目（読みを直した後）。08:25 に終わった。ログは `out/render-web-flask-2.log` |
| 6 | 08:25 | `ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=nw=1 out/script-engine/web-flask.mp4` | 0 | h264・aac、361.92 秒（manifest 10856/30 = 361.87 秒） |
| 6 | 08:25 | `node -e "…pdf-lib…getPageCount()"` | 0 | 12 ページ（pdf-manifest の total_pages 12） |
| 7 | 08:25 | `sha256sum out/script-engine/web-flask.mp4 deliver/web-flask/web-flask.mp4 out/script-engine/web-flask.pdf deliver/web-flask/web-flask.pdf` | 0 | MP4 `b24301dd…cc79`・PDF `3981101b…48bb`。out と deliver で一致 |


## 訂正節の作業（2026-10-06 18 時台。教科書の年を外す。goal.md Wave 6 の訂正節）

| 手順 | 日時 | コマンド | 終了コード | 備考 |
|---|---|---|---|---|
| 4 | 18:13 | `npm run compile:script -- web-flask` | 0 | u-042 だけ再合成。10821 フレーム・約 360.7 秒、PDF 12 ページ。ログは `out/compile-web-flask-3.log` |
| 5 | 18:13 | `npm run render:all:script -- web-flask` | 0 | 18:18 に終わった。ログは `out/render-web-flask-3.log`。`slide-tools` の静止画（`<scratchpad>/frames/slide-tools-3.png`）を目視した |
| 6 | 18:1x | `ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=nw=1 out/script-engine/web-flask.mp4` | 0 | h264・aac、360.75 秒（manifest 10821/30 = 360.70 秒） |
| 6 | 18:1x | `node -e "…pdf-lib…getPageCount()"` | 0 | 12 ページ |
| 7 | 18:2x | `sha256sum out/script-engine/web-flask.mp4 deliver/web-flask/web-flask.mp4 out/script-engine/web-flask.pdf deliver/web-flask/web-flask.pdf` | 0 | MP4 `5795abd2…8553`・PDF `53f325fe…892e`。out と deliver で一致（差し替え後） |
