# materials/portraits — 立ち絵の原本と生成記録（v2、2026-09-26）

Laterna の立ち絵 2 名（解説役 `narrator`・聞き役 `listener`）の v2。Laterna の画像環境 `imagegen/`（ComfyUI v0.37.0、FLUX.2 [klein] 4B fp8、参照画像つき編集ワークフロー `klein_edit`）で 2026-09-26 に生成した。
**自作オリジナル。**VOICEVOX 公式キャラクターのデザインの模写・トレースはしていない（`docs/conventions/portrait-assets.md` §0）。台帳は同ファイル §1。

- 方針（`goal.md` Wave 2「立ち絵の方針」）：2 人の役割と見た目は v1 を引き継ぐ。解説役はバストアップで顔を大きく取る。聞き役のロボットにランタンの意匠（頭頂のランタン型アンテナ、胸の琥珀色に光るコア）を足す。
- 候補：解説役バストアップ s1〜s3、聞き役ランタン版 s1〜s3・既定版 s1〜s2、全身版（`imagegen/output/portraits/`、git 管理外）。**主人の選択（2026-09-26、チャット「推奨でGO」）：解説役バストアップ s2、聞き役ランタン版 s2。**聞き役の全身版は、選ばれた s2 を参照画像にして seed 1〜3 で作り直し、seed 2 を採用した（最初の全身版 2 枚はランタンが体から離れて描かれていた）。
- v1（ラフ）：`narrator-draft-v1.kra`・`listener-draft-v1.kra` と、その書き出し `*-draft-v1.png`／`*-draft-v1_trans.png`（Kyozai-Athanor から持ち込み）。v1 の `public/portraits/*.png` は git の履歴（commit `e81e6b4` まで）にある。

## 一覧

| 用途 | 配置（透過 PNG） | 原本（緑背景、生成そのまま） | 生成記録 |
|---|---|---|---|
| 解説役（narrator）バストアップ ── 本番 | `public/portraits/narrator-default.png` | `narrator-v2-bust-raw.png` | `narrator-v2-bust-raw.png.json` |
| 解説役（narrator）全身 | `materials/portraits/narrator-v2-full.png` | `narrator-v2-full-raw.png` | `narrator-v2-full-raw.png.json` |
| 聞き役（listener）バストアップ（ランタン意匠）── 本番 | `public/portraits/listener-default.png` | `listener-v2-bust-raw.png` | `listener-v2-bust-raw.png.json` |
| 聞き役（listener）全身（ランタン意匠） | `materials/portraits/listener-v2-full.png` | `listener-v2-full-raw.png` | `listener-v2-full-raw.png.json` |

## 加工（共通）

原本（緑背景）から透過 PNG を作る。ImageMagick 7（`magick`）の 3 行。緑らしさ `g - max(r,b)` を 0〜0.6 で不透明度に写し（0.6 以上は透明）、残った縁の緑は G を `max(r,b)` に落として消す（despill）。寸法は変えない（832×1216）。

```
magick <原本> -alpha off -colorspace sRGB -fx "1 - min(1, max(0, (u.g - max(u.r,u.b))/0.6))" mask.png
magick <原本> -alpha off -channel G -fx "u.g > max(u.r,u.b) ? max(u.r,u.b) : u.g" +channel despill.png
magick despill.png mask.png -alpha off -compose CopyOpacity -composite <出力>
```

参照画像（v1 の平坦化）の作り方：`magick <v1 の透過 PNG> -background "#00FF00" -flatten <ref>.png`（2026-09-26 に `magick compare -metric AE` で差 0 を確認）。

## 各立ち絵の記録

### 解説役（narrator）バストアップ ── 本番（`narrator-v2-bust-raw.png`）

- **モデル**：`flux-2-klein-4b-fp8.safetensors`（FLUX.2 [klein] 4B fp8、Apache-2.0。`imagegen/versions/models.json`）。ComfyUI 0.37.0、PyTorch 2.11.0+cu130
- **ワークフロー**：`klein_edit`（`imagegen/workflows/klein_edit.json`）
- **参照画像**：v1 の `public/portraits/narrator-default.png`（commit `e81e6b4` 時点の全身ラフ）を緑 `#00FF00` で平坦化した物（`imagegen/output/refs/narrator-ref-green.png`）。sha256 `c07a3fadc9d543376e58707b688144d6cc2c22e0ca90a225585ab51c20146ddd`
- **プロンプト**：Bust-up portrait of the same character as the reference image: a young man with short dark navy hair, black-rimmed glasses, a gentle closed-mouth smile, white collared shirt, blue cardigan, and a lanyard with an ID card. Waist-up framing with the face large and clearly visible, three-quarter view turned slightly to the viewer's right, eyes open, friendly calm expression. Clean anime illustration style with flat shading and clean lineart, same colors as the reference. Plain solid bright green background, no other objects, no text.
- **seed**：2、832×1216、生成 2026-09-26T20:33:00+09:00（6.97 秒）、prompt_id `8ca818a5-ed51-4865-8e99-757d2caa51d3`
- **原本 sha256**：`c876b8b35e51caf08893b42a1b6f45f03f47163669d25dfd44dfe284d97ed274`（実測 `c876b8b35e51caf08893b42a1b6f45f03f47163669d25dfd44dfe284d97ed274`）
- **加工**：上の 3 行のクロマキー → `public/portraits/narrator-default.png`（透過 PNG、832×1216。sha256 `a9f8b6c76f544ca60619e5368a00b4fe9efc9c2464e40208f6c9839a179abf92`）。それ以外の加工（トリミング・色調整・描き足し）はしていない

### 解説役（narrator）全身（`narrator-v2-full-raw.png`）

- **モデル**：`flux-2-klein-4b-fp8.safetensors`（FLUX.2 [klein] 4B fp8、Apache-2.0。`imagegen/versions/models.json`）。ComfyUI 0.37.0、PyTorch 2.11.0+cu130
- **ワークフロー**：`klein_edit`（`imagegen/workflows/klein_edit.json`）
- **参照画像**：同上（narrator-ref-green.png）。sha256 `c07a3fadc9d543376e58707b688144d6cc2c22e0ca90a225585ab51c20146ddd`
- **プロンプト**：Full-body standing portrait of the same character as the reference image: a young man with short dark navy hair, black-rimmed glasses, a gentle closed-mouth smile, white collared shirt, blue cardigan, lanyard with an ID card, dark slacks and sneakers. Whole body visible from head to shoes with small margins, standing straight with arms relaxed, three-quarter view turned slightly to the viewer's right. Clean anime illustration style with flat shading and clean lineart, same colors as the reference. Plain solid bright green background, no other objects, no text.
- **seed**：2、832×1216、生成 2026-09-26T20:33:59+09:00（6.97 秒）、prompt_id `40aa9406-b25f-4862-98ec-83f7b12c0859`
- **原本 sha256**：`36b9651fe1c112062bb5189a5b4c9655c6488f0977ce6af8932ea9c9536e05ff`（実測 `36b9651fe1c112062bb5189a5b4c9655c6488f0977ce6af8932ea9c9536e05ff`）
- **加工**：上の 3 行のクロマキー → `materials/portraits/narrator-v2-full.png`（透過 PNG、832×1216。sha256 `a0645f288a7697333f804b2f09c9adae880bbb8fb0b410ab07988501eced8ad9`）。それ以外の加工（トリミング・色調整・描き足し）はしていない

### 聞き役（listener）バストアップ（ランタン意匠）── 本番（`listener-v2-bust-raw.png`）

- **モデル**：`flux-2-klein-4b-fp8.safetensors`（FLUX.2 [klein] 4B fp8、Apache-2.0。`imagegen/versions/models.json`）。ComfyUI 0.37.0、PyTorch 2.11.0+cu130
- **ワークフロー**：`klein_edit`（`imagegen/workflows/klein_edit.json`）
- **参照画像**：v1 の `public/portraits/listener-default.png`（commit `e81e6b4` 時点）を緑 `#00FF00` で平坦化した物（`imagegen/output/refs/listener-ref-green.png`）。sha256 `f95243a34fd9e0f936d988c3486faa7a318d9a422706e12a07264fdc503136c7`
- **プロンプト**：The same small floating robot mascot as the reference image (white round body, black glossy screen face with two big glowing orange eyes and a small smiling mouth, orange ear discs, white body with an orange chest panel and blue accents), redesigned with a lantern motif: the antenna on top of the head ends in a small glowing amber lantern, and the chest panel holds a glowing amber lantern-like core. Same proportions and colors otherwise. Framed close with the head and upper body large, three-quarter view turned slightly to the viewer's left, eyes open. Clean anime illustration style with flat shading and clean lineart. Plain solid bright green background, no other objects, no text.
- **seed**：2、832×1216、生成 2026-09-26T20:33:23+09:00（7.02 秒）、prompt_id `a8c1262d-63ce-4fd6-8627-5a1765a6c1a3`
- **原本 sha256**：`61d075dff3211320a7b7c4a11f159f1d867e641b54cc6fe61a7507a318208fe0`（実測 `61d075dff3211320a7b7c4a11f159f1d867e641b54cc6fe61a7507a318208fe0`）
- **加工**：上の 3 行のクロマキー → `public/portraits/listener-default.png`（透過 PNG、832×1216。sha256 `889b09fc01181e13c9abbcbf7b0ce0a89e8896400a2cfd25f557790a7c984af3`）。それ以外の加工（トリミング・色調整・描き足し）はしていない

### 聞き役（listener）全身（ランタン意匠）（`listener-v2-full-raw.png`）

- **モデル**：`flux-2-klein-4b-fp8.safetensors`（FLUX.2 [klein] 4B fp8、Apache-2.0。`imagegen/versions/models.json`）。ComfyUI 0.37.0、PyTorch 2.11.0+cu130
- **ワークフロー**：`klein_edit`（`imagegen/workflows/klein_edit.json`）
- **参照画像**：上の聞き役バストアップの原本 `listener-v2-bust-raw.png`（= `imagegen/output/portraits/listener-lantern-s2.png`）。意匠を揃えるため。sha256 `61d075dff3211320a7b7c4a11f159f1d867e641b54cc6fe61a7507a318208fe0`
- **プロンプト**：Full-body view of the same small floating robot mascot as the reference image, keeping its design exactly: white round body, black glossy screen face with two big glowing orange eyes and a small smiling mouth, orange ear discs, orange chest panel and blue accents, a short antenna on top of the head ending in a small glowing amber lantern bulb, and a glowing amber lantern held at the chest as its core. Whole robot visible from the antenna tip to the feet with generous margins around it, floating, three-quarter view turned slightly to the viewer's left, eyes open. No additional lanterns, nothing detached from the body. Clean anime illustration style with flat shading and clean lineart, same colors as the reference. Plain solid bright green background, no other objects, no text.
- **seed**：2、832×1216、生成 2026-09-26T21:18:16+09:00（6.84 秒）、prompt_id `5290288d-d612-4446-aa5c-86afefe8cb09`
- **原本 sha256**：`9d0fad5005db576330443bcad33de1745fb136fd78d418929e40802f376315cb`（実測 `9d0fad5005db576330443bcad33de1745fb136fd78d418929e40802f376315cb`）
- **加工**：上の 3 行のクロマキー → `materials/portraits/listener-v2-full.png`（透過 PNG、832×1216。sha256 `8c37d52b5e348c3a560c600309c6cb5cdef0b05920b0ecca01f4e8aa1ecb2b25`）。それ以外の加工（トリミング・色調整・描き足し）はしていない

## 差し替えるとき

`docs/conventions/portrait-assets.md` §1 の表を上書き更新し（行は足さない）、原本と `.json` をここに置き、本ファイルに記録を足す。`speaker-profiles.yaml` の `portrait.asset_key` は変えない。
