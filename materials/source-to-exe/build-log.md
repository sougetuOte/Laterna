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

