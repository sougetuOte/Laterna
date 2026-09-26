"""imagegen のスモークテスト（標準ライブラリだけ）。ComfyUI_img2 の scripts/smoke.py の型を借り、klein の 2 本に縮めた。

workflows/klein_t2i.json と klein_edit.json をそれぞれ投げ、完了を待ち、PNG を取り出して寸法を確かめる。
klein_edit の参照画像は、先に klein_t2i で生成した PNG を POST /upload/image で送る。

  POST /prompt → GET /history/{prompt_id}（完了までポーリング）→ GET /view

出力は <imagegen>/output/smoke/（.gitignore 済み）。サーバーは scripts/start.ps1 で先に起動しておくこと。

  .venv\\Scripts\\python.exe scripts\\smoke.py
  .venv\\Scripts\\python.exe scripts\\smoke.py --width 832 --height 1216 --seed 7

終了コード：2 本とも成功で 0、どれか失敗で 1。
build()／run()／upload_image() は gen.py（立ち絵の生成）からも使う。
"""
from __future__ import annotations

import argparse
import copy
import json
import struct
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKFLOWS = ROOT / "workflows"
HOST = "127.0.0.1"

DEFAULT_PROMPTS = {
    "klein_t2i": "A small lighthouse on a rocky coast at dusk, watercolor illustration",
    "klein_edit": "Change the lighthouse color to deep red, keep everything else the same.",
}


# ---------------------------------------------------------------- HTTP

def http_json(port: int, path: str, payload: dict | None = None, timeout: float = 30) -> dict:
    url = f"http://{HOST}:{port}{path}"
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        raise RuntimeError(f"HTTP {e.code} {url}: {body[:2000]}") from None


def http_bytes(port: int, path: str, timeout: float = 60) -> bytes:
    with urllib.request.urlopen(f"http://{HOST}:{port}{path}", timeout=timeout) as r:
        return r.read()


def upload_image(port: int, png: bytes, filename: str) -> str:
    """POST /upload/image（multipart）。LoadImage に渡す名前を返す。"""
    boundary = "----imagegen" + uuid.uuid4().hex
    parts = []
    for name, value in (("type", "input"), ("overwrite", "true")):
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{filename}"\r\n'
        f"Content-Type: image/png\r\n\r\n".encode() + png + b"\r\n"
    )
    parts.append(f"--{boundary}--\r\n".encode())
    req = urllib.request.Request(
        f"http://{HOST}:{port}/upload/image", data=b"".join(parts),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        res = json.loads(r.read().decode("utf-8"))
    return f"{res['subfolder']}/{res['name']}" if res.get("subfolder") else res["name"]


# ---------------------------------------------------------------- PNG（寸法だけ。画素の検証は要らない）

def png_size(data: bytes) -> tuple[int, int]:
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("PNG の署名ではない")
    (length,) = struct.unpack(">I", data[8:12])
    if data[12:16] != b"IHDR":
        raise ValueError("IHDR が先頭に無い")
    body = data[16:16 + length]
    (crc,) = struct.unpack(">I", data[16 + length:20 + length])
    if zlib.crc32(b"IHDR" + body) & 0xFFFFFFFF != crc:
        raise ValueError("IHDR の CRC 不一致")
    w, h = struct.unpack(">II", body[:8])
    return w, h


# ---------------------------------------------------------------- ワークフロー

def load_inject() -> dict:
    return json.loads((WORKFLOWS / "inject.json").read_text(encoding="utf-8"))


def build(name: str, prompt: str, seed: int, width: int, height: int,
          refs: list[str] | None = None, unet: str | None = None, prefix: str | None = None) -> dict:
    """workflows/<name>.json に値を差し込んだ API JSON を返す。refs は /upload/image が返した名前。"""
    inj = load_inject()[name]
    wf = json.loads((WORKFLOWS / f"{name}.json").read_text(encoding="utf-8"))
    for key, val in (("prompt", prompt), ("seed", seed), ("width", width), ("height", height),
                     ("unet", unet), ("filename_prefix", prefix)):
        if val is None:
            continue
        for node, inp in inj[key]:
            wf[node]["inputs"][inp] = val
    if refs is not None:
        if "refs" not in inj:
            raise ValueError(f"{name} は参照画像を取らない")
        if not refs:
            raise ValueError("klein_edit には参照画像が1枚以上要る")
        node, inp = inj["refs"][0]
        wf[node]["inputs"][inp] = refs[0]
        for k, ref in enumerate(refs[1:], start=2):
            add_reference(wf, inj["ref_chain"], k, ref)
    return wf


def add_reference(wf: dict, chain: dict, k: int, image_name: str) -> None:
    """k 枚目の参照画像を足す：LoadImage → ImageScaleToTotalPixels → VAEEncode → ReferenceLatent（正・負の両方に連鎖）。"""
    first = chain["first"]
    g = wf[chain["guider"]]["inputs"]
    ids = {s: f"ref{k}_{s}" for s in ("load", "scale", "encode", "pos", "neg")}
    wf[ids["load"]] = {"class_type": "LoadImage", "inputs": {"image": image_name}, "_meta": {"title": f"Reference image {k}"}}
    wf[ids["scale"]] = copy.deepcopy(wf[first["scale"]])
    wf[ids["scale"]]["inputs"]["image"] = [ids["load"], 0]
    wf[ids["encode"]] = {"class_type": "VAEEncode", "inputs": {"pixels": [ids["scale"], 0], "vae": [chain["vae"], 0]}}
    wf[ids["pos"]] = {"class_type": "ReferenceLatent", "inputs": {"conditioning": g["positive"], "latent": [ids["encode"], 0]}}
    wf[ids["neg"]] = {"class_type": "ReferenceLatent", "inputs": {"conditioning": g["negative"], "latent": [ids["encode"], 0]}}
    g["positive"] = [ids["pos"], 0]
    g["negative"] = [ids["neg"], 0]


def run(port: int, wf: dict, save_node: str = "9", timeout: float = 900) -> dict:
    """投げて、完了を待ち、1枚目の出力 PNG を取り出す。"""
    t0 = time.perf_counter()
    res = http_json(port, "/prompt", {"prompt": wf, "client_id": uuid.uuid4().hex})
    if res.get("node_errors"):
        raise RuntimeError(f"node_errors: {json.dumps(res['node_errors'], ensure_ascii=False)[:2000]}")
    pid = res["prompt_id"]
    deadline = time.monotonic() + timeout
    while True:
        h = http_json(port, f"/history/{pid}")
        if pid in h:
            h = h[pid]
            break
        if time.monotonic() > deadline:
            raise TimeoutError(f"{timeout}s 以内に終わらなかった（prompt_id {pid}）")
        time.sleep(0.2)
    wall = time.perf_counter() - t0
    st = h.get("status", {})
    if st.get("status_str") != "success":
        raise RuntimeError(f"失敗：{json.dumps(st.get('messages'), ensure_ascii=False)[:3000]}")
    img = h["outputs"][save_node]["images"][0]
    q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img["subfolder"], "type": img["type"]})
    png = http_bytes(port, f"/view?{q}")
    return {"prompt_id": pid, "wall_s": wall, "png": png, "server_file": img}


# ---------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--width", type=int, default=1024)
    ap.add_argument("--height", type=int, default=1024)
    ap.add_argument("--out", type=Path, default=ROOT / "output" / "smoke")
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    inj = load_inject()
    port = inj["klein_t2i"]["port"]
    try:
        http_json(port, "/system_stats", timeout=5)
    except Exception as e:  # noqa: BLE001
        print(f"[NG] {HOST}:{port} が応答しません（scripts\\start.ps1 で起動してください）：{e}")
        return 1

    results, ok, t2i_png = [], True, None
    for name in ("klein_t2i", "klein_edit"):
        rec = {"workflow": name, "port": port, "seed": args.seed, "width": args.width, "height": args.height}
        try:
            refs = None
            if name == "klein_edit":
                refs = [upload_image(port, t2i_png, f"smoke_ref_{args.seed}.png")]
                rec["refs"] = refs
            wf = build(name, DEFAULT_PROMPTS[name], args.seed, args.width, args.height, refs=refs, prefix=f"smoke/{name}")
            r = run(port, wf)
            w, h = png_size(r["png"])
            dst = args.out / f"{name}_s{args.seed}_{args.width}x{args.height}.png"
            dst.write_bytes(r["png"])
            if name == "klein_t2i":
                t2i_png = r["png"]
            size_ok = (w, h) == (args.width, args.height)
            rec.update(ok=size_ok, file=str(dst), wall_s=round(r["wall_s"], 2), prompt_id=r["prompt_id"], png_width=w, png_height=h)
            print(f"[{'OK' if size_ok else 'NG'}] {name:10s} {w}x{h}  {r['wall_s']:6.1f}s  {dst}")
            ok &= size_ok
        except Exception as e:  # noqa: BLE001
            rec.update(ok=False, error=str(e))
            print(f"[NG] {name}: {e}")
            ok = False
        results.append(rec)

    (args.out / "smoke-result.json").write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print("2 本とも成功しました。" if ok else "失敗があります。")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
