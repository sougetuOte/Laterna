# build-log.md — 「ソースから実行ファイルまで」を作った記録（手順番号・コマンド・終了コード）

`goal.md` Wave 2 の完了条件 7：`SKILL.md` の手順 0〜7 と対応する。1 行 1 コマンド。終了コードは実測。時刻は JST。

| 手順 | 日時 | コマンド | 終了コード | 備考 |
|---|---|---|---|---|
| 0 | 2026-09-26 19:46 | `curl http://127.0.0.1:50021/version` | 0 | VOICEVOX 0.25.2 が稼働中 |
| 0 | 2026-09-26 19:39 | `npm install --no-audit --no-fund` | 0 | 343 packages（Wave 1 の切り出し時） |
| 0 | 2026-09-26 19:40 | `npm test` | 0 | 15 files / 261 tests passed |
| 0 | 2026-09-26 20:38 | `powershell -ExecutionPolicy Bypass -File imagegen\scripts\setup.ps1`（切り離して実行、ログ `imagegen/logs/setup.log`） | 0 | 画像環境の初回構築。Python 3.13.15・ComfyUI v0.37.0・86 パッケージ・モデル 3 本（sha256 一致）。「すべて一致しました。」 |
| 0 | 2026-09-26 21:12 | `powershell -ExecutionPolicy Bypass -File imagegen\scripts\start.ps1` | 1 | 初回は `runtime\klein\custom_nodes` が無く ComfyUI が落ちた。start.ps1 でフォルダを作るよう修正 |
| 0 | 2026-09-26 21:20 | `powershell -ExecutionPolicy Bypass -File imagegen\scripts\start.ps1` | 0 | PID 49956、127.0.0.1:8288、GPU 1（RTX 4060 Ti） |
| 0 | 2026-09-26 21:21 | `imagegen\.venv\Scripts\python.exe imagegen\scripts\smoke.py --width 832 --height 1216 --seed 7` | 0 | t2i 7.2 秒、edit 7.5 秒。`imagegen/output/smoke/` |
| 0 | 2026-09-26 21:13 | `powershell -ExecutionPolicy Bypass -File imagegen\scripts\setup.ps1 -VerifyOnly` | 0 | 版・ロック・モデルの sha256 が一致 |
| 1 | 2026-09-26 20:45 | 一次資料の取得（GCC manual Overall Options／cppreference translation phases／Microsoft PE Format） | 0 | `materials/source-to-exe/outline.md` の「出典」 |
| 2 | 2026-09-26 20:50 | `materials/source-to-exe/outline.md` を書く（対象・尺・章立て 5 章・出典） | 0 | 完了条件 3 |
| 3 | 2026-09-26 21:30 | `content/scripts/source-to-exe.script.yaml` を書く（27 発話・1,715 文字・概算 263 秒） | 0 | 主人の承認待ち。承認後に compile |
| 3 | 2026-09-26 21:35 | `npm test`（extra_credits・PipelineFlow の追加後） | 0 | 15 files / 266 tests passed。`npm run lint` exit 0 |
| 0 | 2026-09-26 21:40 | `imagegen\.venv\Scripts\python.exe imagegen\scripts\gen.py --workflow klein_edit --ref imagegen/output/refs/<role>-ref-green.png ...`（12 回） | 0 | 立ち絵候補 12 枚 → `imagegen/output/portraits/`（一覧 `sheet-*.png`）。主人の選択待ち |
| 0 | 2026-09-26 21:50 | `powershell -ExecutionPolicy Bypass -File imagegen\scripts\stop.ps1` | 0 | セッションの区切りで停止 |
| 3 | 2026-09-26 21:12 | `node -e` で js-yaml が `content/scripts/source-to-exe.script.yaml` を読めるか確認 → 169・170 行の箇条書き（先頭 `**`）を alias と読んで失敗（`unidentified alias`）。2 行を `"…"` で囲んで再確認 | 0 | 本文（発話 text）は変えていない。27 発話のまま |
| 3 | 2026-09-26 21:32 | `sed -i` で `materials/source-to-exe/outline.md` に「台本承認：2026-09-26 主人」を記録（主人「問い1：OK」） | 0 | 立ち絵は主人「推奨でGO」→ 解説役バスト s2・聞き役ランタン s2 |
| 4 | 2026-09-26 21:33 | `npm run compile:script -- source-to-exe`（ログ：scratchpad） | 0 | 合成 27 件・skip 0（VOICEVOX 0.25.2）。予測 260.0 秒 → 実測 total_duration_frames=8575（285.8 秒、fps 30）。180〜300 秒の範囲内。PDF manifest 10 ページ。credits 3 行（VOICEVOX 2・立ち絵 1） |
| 0 | 2026-09-26 21:34 | `magick <候補> -alpha off -fx "1 - min(1, max(0, (u.g - max(u.r,u.b))/0.6))" mask.png`／`magick <候補> -alpha off -channel G -fx "u.g > max(u.r,u.b) ? max(u.r,u.b) : u.g" +channel despill.png`／`magick despill.png mask.png -alpha off -compose CopyOpacity -composite <出力>` | 0 | 緑背景のクロマキー（narrator-bust-s2・listener-lantern-s2・narrator-full-s2）。暗背景・白背景に合成して縁の緑が無いことを目視 |
| 0 | 2026-09-26 21:37 | `powershell -ExecutionPolicy Bypass -File imagegen\scripts\start.ps1` | 0 | P1 検収（columba、PASS）の後に再起動。GPU 1、port 8288 |
| 0 | 2026-09-26 21:38 | `imagegen\.venv\Scripts\python.exe imagegen\scripts\gen.py --workflow klein_edit --ref imagegen/output/portraits/listener-lantern-s2.png --prompt "..." --seed 1〜3 --width 832 --height 1216 --out imagegen/output/portraits/listener-lantern-full-s<N>.png`（3 回） | 0 | 聞き役の全身版をランタン s2 に揃えて再生成（旧 listener-full-s1/s2 はランタンが体から浮いていた）。一覧 `sheet-listener-lantern-full.png` |
| 0 | 2026-09-26 21:41 | `magick`（上と同じ 3 行）で `listener-lantern-full-s2.png` を抜く → `materials/portraits/listener-v2-full.png`。`cp` で `public/portraits/narrator-default.png`（← narrator-bust-s2）・`listener-default.png`（← listener-lantern-s2）、`materials/portraits/narrator-v2-full.png`（← narrator-full-s2）と原本 4 枚（`*-raw.png` ＋ `.json`） | 0 | 全身版は seed 2 を採用（3 枚ともランタン意匠が s2 と一致。中央配置が最も良い） |
| 0 | 2026-09-26 21:42 | `powershell -ExecutionPolicy Bypass -File imagegen\scripts\stop.ps1` | 0 | 立ち絵の生成を終えたので停止 |
| 4 | 2026-09-26 21:47 | `src/script-engine/render/manifest-registry.ts` に `source-to-exe` の import 2 行と登録 2 行を追記（goal.md「手動追記 1 回」）→ `npm run lint` → `npm test` | 0 | lint exit 0、15 files / 266 tests passed。(c) の廃止の試み（1 時間枠）は納品の後に回す |
| 6 | 2026-09-26 21:48 | `materials/source-to-exe/description.md` を書く（内容紹介・出典・クレジット） | 0 | 完了条件 6。VOICEVOX 音声は CC BY の対象外と明記 |
| 5 | 2026-09-26 21:27 | `npm run render:all:script -- source-to-exe`（1 回目、ログ：scratchpad） | 0 | MP4・PDF が出た。切り出したフレームの目視で、図解 PipelineFlow の段階名と説明文が箱に重なる・右端の a.exe が切れる・濃紺の文字が暗い背景に沈む、code スライドの各行が中央寄せでインデントが崩れて見える、の 2 件を発見 |
| 4 | 2026-09-26 21:35 | `PipelineFlow.tsx`（白パネル・段階名と説明を箱の上、産物名を下、STEP 320→300）と `ScriptSlideRenderer.tsx` の code（`<pre>` を inline-block・左揃え・40px）を直す → `npm run lint` → `npm test` | 0 | lint exit 0、15 files / 266 tests passed。java-vs-js は code スライドを使わないので再現性に影響なし |
| 5 | 2026-09-26 21:38 | `rm -f out/script-engine/source-to-exe.{mp4,pdf}` → `npm run render:all:script -- source-to-exe`（2 回目） | 0 | 1 回の実行で MP4（15.66 MB）と PDF（10 ページ）。手作業の補正なし |
| 6 | 2026-09-26 21:39 | `ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=nw=1 out/script-engine/source-to-exe.mp4` | 0 | h264 video ＋ aac audio、duration 285.888 秒（manifest 8575/30 = 285.83 秒、差 0.06 秒） |
| 6 | 2026-09-26 21:39 | `node -e` で pdf-lib の `getPageCount()`／`ffmpeg -ss 50・90・150 と -sseof -3` でフレームを切り出して目視 | 0 | PDF 10 ページ（pdf-manifest の total_pages=10 と一致）。code・図解（stage 0・3）・末尾クレジット（VOICEVOX 2 行＋立ち絵 1 行）を確認。manifest の credits[] は 3 行 |
| 7 | 2026-09-26 21:40 | `mkdir -p deliver/source-to-exe` → `cp` で MP4・PDF・description.md → `sha256sum` で out/ と照合 | 0 | 3 点。MP4・PDF の SHA-256 が out/script-engine/ と一致 |
| 0 | 2026-09-26 21:58 | `magick public/portraits/listener-default.png -flop public/portraits/listener-default.png` | 0 | 主人の指摘：聞き役が画面外を向いていた。レンダラーは右カラムを scaleX(-1) で反転するので、ファイルは外向き（向かって右）が正。README・台帳・SKILL.md に向きの規則を追記 |
| 5 | 2026-09-26 22:00 | `rm -f out/script-engine/source-to-exe.{mp4,pdf}` → `npm run render:all:script -- source-to-exe`（3 回目） | 0 | 聞き役の向き修正後。1 回の実行で MP4 と PDF |
| 6 | 2026-09-26 22:04 | `ffprobe`（映像・音声、285.888 秒）／pdf-lib（10 ページ）／`ffmpeg -ss 12・150` のフレームを目視 | 0 | ロボットが画面内側（人間の側）を向いた。PDF は立ち絵を含まないので SHA-256 は前回と同じ |
| 7 | 2026-09-26 22:05 | `cp` で MP4・PDF・description.md を `deliver/source-to-exe/` へ → `sha256sum` | 0 | MP4 は新しい物（43a78b42…）、PDF は同じ（c94e503f…）。out/ と一致 |

## 2026-09-27 の書き出し直し（Wave 3 の訂正節）

箇条書きの点と文字のずれ（共通部品）と、点検の R1〜R3 を直した（`d2f6af5`）。主人の判断（2026-09-27「1. 推奨 2. ついでに直す 3. 許可する」）で 1 本目を書き出し直し、納品物を差し替えた。
ここから下の行は、終了コードを実際に取ったコマンドだけを書く（`materials/about-c/build-log.md` の「表の決まり」と同じ）。上の行は書き換えていない。

| 手順 | 日時 | コマンド | 終了コード | 備考 |
|---|---|---|---|---|
| 5 | 2026-09-27 11:54〜11:58 | `npm run render:all:script -- source-to-exe`（`out/script-engine/source-to-exe.*` を消してから。バックグラウンドで `echo ste_exit=$?`） | 0 | manifest・音声は変わらない（compile は再合成 0） |
| 6 | 2026-09-27 12:04 | `ffmpeg -v error -y -ss <秒> -i out/script-engine/source-to-exe.mp4 -frames:v 1 <scratchpad>/n-ste-<秒>.png`（85・105・187.8・215.8・259.5 を 1 本ずつ、各 `echo exit=$?`） | 0 | 全体図で hello.c が光らない（R1）、強調した矢印の矢じりが見える（R2）、箇条書き 3 枚の点と文字がそろう |
| 6 | 2026-09-27 12:04 | `pdftotext -enc UTF-8 out/script-engine/source-to-exe.pdf - \| grep "本資料"`（pipefail） | 0 | 最終ページの注記が `LICENSE-CONTENT` と同じ（立ち絵は CC BY 4.0、音声は各権利者の規約）（R3） |
| 6 | 2026-09-27 12:09 | `node -e "const {PDFDocument}=require('pdf-lib');PDFDocument.load(require('fs').readFileSync('out/script-engine/source-to-exe.pdf')).then(d=>console.log(d.getPageCount()))"`（`echo exit=$?`） | 0 | 10 ページ（12:04 に終了コードを取らずに叩いた回を、12:09 に取り直した） |
| 7 | 2026-09-27 12:05 | `cp deliver/source-to-exe/* <scratchpad>/old-deliver-ste/`（`echo backup_exit=$?`） | 0 | 差し替える前の納品物を控えた（MP4 `43a78b42…9c4e`・PDF `c94e503f…db55`） |
| 7 | 2026-09-27 12:05 | `cp out/script-engine/source-to-exe.mp4 out/script-engine/source-to-exe.pdf deliver/source-to-exe/`（`echo cp_ste_exit=$?`） | 0 | description.md は変えていない |
| 7 | 2026-09-27 12:05 | `sha256sum out/script-engine/source-to-exe.mp4 out/script-engine/source-to-exe.pdf deliver/source-to-exe/source-to-exe.mp4 deliver/source-to-exe/source-to-exe.pdf deliver/source-to-exe/description.md`（`echo sha_exit=$?`） | 0 | 新しい MP4 `c00f8b35…1434`・PDF `66c3c06e…42b0` が out と deliver で一致。description.md `509da0c4…6bab16` |
