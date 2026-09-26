"""imagegen で 1 枚生成する作業スクリプト（標準ライブラリだけ。smoke.py の build()/run()/upload_image() を使う）。

  .venv\\Scripts\\python.exe scripts\\gen.py --workflow klein_t2i --prompt "..." --seed 1 --width 832 --height 1216 --out path.png
  .venv\\Scripts\\python.exe scripts\\gen.py --workflow klein_edit --ref ref.png --prompt "..." --seed 1 --out path.png

出力 PNG の隣に <out>.json（workflow・prompt・seed・幅・高さ・参照画像の sha256・モデル名・ComfyUI と torch の版・日時）を書く。
この JSON が立ち絵の生成記録（materials/portraits/README.md）の元になる。サーバーは scripts/start.ps1 で先に起動しておくこと。
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from smoke import build, http_json, load_inject, png_size, run, upload_image  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--workflow", choices=("klein_t2i", "klein_edit"), required=True)
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--width", type=int, default=832)
    ap.add_argument("--height", type=int, default=1216)
    ap.add_argument("--ref", type=Path, action="append", default=[], help="参照画像（klein_edit）。複数可")
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()

    inj = load_inject()[args.workflow]
    port = inj["port"]
    stats = http_json(port, "/system_stats", timeout=5)
    refs = None
    ref_meta = []
    if args.workflow == "klein_edit":
        if not args.ref:
            print("[NG] klein_edit には --ref が要る")
            return 1
        refs = []
        for i, r in enumerate(args.ref):
            data = r.read_bytes()
            name = upload_image(port, data, f"gen_ref_{args.seed}_{i}.png")
            refs.append(name)
            ref_meta.append({"path": str(r), "sha256": hashlib.sha256(data).hexdigest()})
    wf = build(args.workflow, args.prompt, args.seed, args.width, args.height, refs=refs, prefix=f"gen/{args.workflow}")
    res = run(port, wf)
    w, h = png_size(res["png"])
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_bytes(res["png"])
    unet_node, unet_inp = inj["unet"][0]
    meta = {
        "workflow": args.workflow,
        "prompt": args.prompt,
        "seed": args.seed,
        "width": args.width,
        "height": args.height,
        "png": {"width": w, "height": h, "sha256": hashlib.sha256(res["png"]).hexdigest()},
        "refs": ref_meta,
        "model": wf[unet_node]["inputs"][unet_inp],
        "comfyui_version": stats["system"].get("comfyui_version"),
        "pytorch_version": stats["system"].get("pytorch_version"),
        "prompt_id": res["prompt_id"],
        "wall_s": round(res["wall_s"], 2),
        "generated_at": dt.datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    args.out.with_suffix(args.out.suffix + ".json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] {args.workflow} seed={args.seed} {w}x{h} {res['wall_s']:.1f}s -> {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
