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
