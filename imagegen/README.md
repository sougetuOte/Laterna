# imagegen — Laterna の画像環境（ComfyUI、FLUX.2 [klein] 4B、1 インスタンス）

立ち絵と挿絵を作るための、Laterna 専用の画像生成環境。ComfyUI_img2（`D:\ComfyUI_img2`、読み取り専用）の型を借りて、
1 インスタンスに縮めた。設計の根拠は `docs/research/2026-09-26-image-env.md`、決定は `goal.md` Wave 2。

## 何が入っているか（git で追跡する物）

| パス | 中身 |
|---|---|
| `versions/comfyui.txt` | ComfyUI のリリースタグ（`v0.37.0`） |
| `versions/python.txt` | Python の版（`3.13.15`。uv が `python/` に入れる） |
| `versions/requirements.lock` | Python パッケージのロック（86 件。torch は cu130） |
| `versions/models.json` | モデル 3 本（名前・置き場所・バイト数・sha256・取得元 URL・ライセンス・手元のコピー元） |
| `workflows/klein_t2i.json` | text-to-image の API 形式ワークフロー |
| `workflows/klein_edit.json` | 参照画像つき編集の API 形式ワークフロー |
| `workflows/inject.json` | 差し込み位置（プロンプト・seed・幅・高さ・参照画像）と port |
| `scripts/setup.ps1` | 環境を作る／検証する（冪等。`-VerifyOnly`） |
| `scripts/start.ps1`・`stop.ps1` | 起動・停止（冪等。127.0.0.1:8288、`-CudaDevice` 既定 1） |
| `scripts/smoke.py` | 動作確認（t2i と edit を 1 枚ずつ）。`build()`／`run()` は `gen.py` からも使う |

追跡しない物（`.gitignore`）：`ComfyUI/`（本体の clone）、`python/`・`.venv/`（Python 環境）、`models/`（重み 12.4 GB）、
`output/`・`runtime/`・`logs/`・`.cache/`。

## 使い方

```
powershell -ExecutionPolicy Bypass -File imagegen\scripts\setup.ps1          # 初回。30〜60 分、ディスク約 20 GB
powershell -ExecutionPolicy Bypass -File imagegen\scripts\setup.ps1 -VerifyOnly   # 何も作らず検証だけ
powershell -ExecutionPolicy Bypass -File imagegen\scripts\start.ps1          # 起動（GPU 1）。-CudaDevice 0 で GPU 0
imagegen\.venv\Scripts\python.exe imagegen\scripts\smoke.py                   # 動作確認 → imagegen\output\smoke\
powershell -ExecutionPolicy Bypass -File imagegen\scripts\stop.ps1           # 停止
```

## 守ること

- **カスタムノードは 0 本から。**足すときは `versions/custom_nodes.json`（リポジトリ URL と commit）に固定してから入れる。`setup.ps1` は固定していない物を検出して止める。
- **モデルは商用利用可の物だけ**（いまは 3 本とも Apache-2.0）。足すときは `versions/models.json` にライセンスと sha256 を書く。
- **GPU は 1 枚。**klein 4B fp8 と qwen_3_4b で約 12 GB 使うので、同じ GPU で img2 のインスタンスと同時には動かさない。
- **ComfyUI_img2 には書かない。**モデルは img2 のファイルをコピーする（共有しない。sha256 が同じであることを `setup.ps1` が確かめる）。
- 生成した立ち絵の記録（モデル名・プロンプト・seed・加工内容）は `materials/portraits/README.md` に残す。
