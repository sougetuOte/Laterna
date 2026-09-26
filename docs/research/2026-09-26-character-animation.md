# 立ち絵・口パク・表情の技術調査（2026-09-26）

**位置づけ：**Wave 3（立ち絵パイプライン）とLaterna専用画像環境の設計に使う参考資料。**決定ではない。**
**消滅条件：**Wave 3 の設計が決まり、採用した物が `docs/design.md` に移ったら畳む。採用が0件なら、結論1行を `docs/design.md` に置いて畳む（証拠は git に残る）。

**確認日はすべて 2026-09-26。**このての道具は月単位で版が変わる。**使う前に必ず再確認する。**

**表記の約束**
- 【再確認】…本セッションで Claude が一次情報（リポジトリ・公式ページ・実ファイル）を直接見て確かめた
- 【調査】…調査担当（別コンテキストの Claude）が一次情報を見て報告した。出典URLつき。Claude は再確認していない
- 【推測】…推測。【提案】…Claude の提案（主人の決定ではない）

**前提（この資料の判断基準）**
- 商用利用できるライセンスが必須（授業で使い、将来 YouTube で収益化する可能性がある）
- 環境は Windows、RTX 4060 Ti 16GB ×2
- 音声は VOICEVOX（ローカル）、動画は Remotion（React）
- 1本10〜15分、2人の掛け合い

---

## 0. 結論

1. **口パクのタイミングは、VOICEVOX の `audio_query` から決め打ちで作れる。**音声解析も GPU も要らない。合成と同じ計算式をたどるので、同期は原理的にほぼ完全になる（§5）。ゆっくりMovieMaker4 も v4.49（2026-02）から、VOICEVOX ではエンジン自身の音素情報で「あいうえお」口パクをしている【調査】。
2. **「See-Through のような物」は素材を作る道具で、13分の動画を口パクさせる道具ではない。**派生ツールは、どれも音声ファイルに追従しない。PNGAL は README で「母音判定や音声追従も行いません」と明言している【再確認】。**素材は外の道具で作り、動かすのは Laterna（Remotion）側**という分担になる。
3. **差分画像（目閉じ・母音別の口・表情）は、FLUX.2 [klein] 4B か Qwen-Image-Edit-2511 で作る**（どちらも Apache-2.0）。編集したら、変わった部分だけを元絵に貼り戻す（位置ずれ対策）。
4. **拡散モデルの talking-head（音声から動画を生成）を13分通しで使うのは、計算時間の点で非現実的**（見せ場だけにする）。**Live2D を Remotion の中で動かすのは相性が悪い**（物理演算が状態を持ち、Remotion の並列レンダリングと噛み合わない。使うなら事前に書き出して合成する）。
5. **商用不可の落とし穴が多い**（§8 に一覧）。

---

## 1. 問題の分け方

立ち絵を動かすには、5つの工程がある。

| 工程 | 中身 | 主な道具 |
|---|---|---|
| ① 原画 | キャラの1枚絵 | 自作／画像生成（Laterna専用画像環境） |
| ② パーツ化 | 髪・顔・目・口・体などに分ける。隠れた部分を補う | See-Through、または分割＋補完の組み合わせ |
| ③ 差分生成 | 目閉じ、母音別の口、表情違い | 画像編集モデル（klein 4B、Qwen-Image-Edit-2511） |
| ④ タイミング | いつ、どの口・どの目にするか | **VOICEVOX の audio_query**、音声解析（Rhubarb 等） |
| ⑤ 動かして書き出す | 差し替え・揺れ・合成 → MP4 | Remotion、THA3、Live2D、拡散モデル |

- See-Through が担うのは②だけ。
- PNGAL は②③と⑤の一部、PachiPakuGen は②③の一部を担う。
- **④は Laterna が持つのが一番よい。**VOICEVOX の合成情報を持っているのは Laterna だけだから【提案】。

---

## 2. See-Through 本体と派生ツール

| 名前 | 何をするか | 出力 | ライセンス（商用） | 環境 | 音声ファイルへの追従 |
|---|---|---|---|---|---|
| **See-Through**（shitagaki-lab）<br>SIGGRAPH 2026 | 1枚絵を最大23の意味レイヤーに分け、隠れた部分も補う | PSD・深度 | コードは Apache-2.0【再確認】。重みは下記の注を参照 | 12〜16GB。NF4 なら約8GB【再確認】 | 分解だけ。目閉じ・口開けの差分は作らない |
| **ComfyUI-See-through**（jtydhr88）<br>v0.5.0、2026-08-20 | See-Through の ComfyUI ノード | レイヤーPNG・PSD・深度PSD | MIT（README・pyproject に記載。LICENSE ファイルは無い）【調査】 | 1280px で約16GB【調査】 | — |
| **See-Through WebUI**（BeamManP） | See-Through の WebUI | — | Apache-2.0【調査】 | 8GB〜【調査】 | — |
| **PNGAL**（1mm-module）<br>v0.45.01e、2026-09-01【調査】 | 透過PNG／PSD → 顔差分の生成（Qwen-Image-Edit-2511）→ See-Through で分割 → 動きの調整 → RIFE で中間コマ | WebM・MP4・GIF・スプライト＋JSON・PSD | Apache-2.0（LICENSE あり）【再確認】 | 構成1：12GB〜、構成2：24GB〜推奨【再確認】 | **しない**。口は確定した画像を順番に回すだけ【再確認】 |
| **PachiPakuGen**（kazuya-bros）<br>v0.4.0、2026-07-21【再確認】 | 立ち絵 → See-Through → 目のコマ列と、母音別の口コマ（mouth_a〜mouth_o） | PNG 連番・APNG・GIF | MIT【再確認】 | standard：16GB〜、low-vram：約8GB【再確認】 | しない（ループ素材を作る道具） |
| **Anime2.5DRig**（852wa）<br>v2.0、2026-09-23 | パーツ分けした PSD に自動でリグを付ける（まばたき、口パク、髪の物理、表情7種） | PNG・透過WebM・MP4 | MIT【調査】 | ブラウザだけで動く。CUDA 不要 | しない。口パクはランダムかマイク。録画は実時間で3〜60秒【調査】 |
| **PuruPuruPNGTuber**（rotejin） | 表情PNG 6枚＋前髪・後ろ髪 → 配信用の表示 | OBS への表示 | Apache-2.0【調査】 | — | マイクのみ。書き出し機能は無い |
| **MotionPNGTuber**（rotejin） | ループ動画＋口PNG 5枚（closed／half／open／e／u）→ 口を消した動画＋口の位置の追跡データ | MP4＋JSON | MIT【再確認】 | CUDA 推奨 | マイク（リアルタイム）。姉妹ツールの Player には外部音声の API がある【調査】 |
| **SVG-Through Motion**（kazuya-bros）<br>v0.1.0-preview、2026-09-20 | See-Through の PSD を SVG にして動かす | 透過WebM・MP4 | MIT【調査】 | Windows 用 ZIP | 未確認。試験版 |
| **Stretchy Studio**（MangoLion） | PSD にメッシュ変形とタイムラインで動きを付ける | PNG／WEBP 連番、Spine 4.0、Live2D の .moc3／.cmo3 | MIT（自動リグの DWPose 重みは Apache-2.0）【調査】 | — | キーを手打ちするのが中心 |
| **image-to-live2d**（lvhaojie456）<br>2026-09-22 | See-Through → .moc3 | Live2D | MIT＋一部 GPL-3.0【調査】 | Cubism Editor、有料 API、24GB の GPU が必要 | — |

**注**
- **See-Through の重み**：LayerDiff3D はモデルカードに apache-2.0 と書かれている。他の重みはカードに記載がないが、開発者が HF の議論で「全モデル Apache 2.0」と回答している。
  - 基盤は Animagine XL 4.0 と Marigold で、どちらも CreativeML Open RAIL++-M。この利用制限条項は派生物にも及ぶと見るのが安全【調査・推測】。
- **PNGAL の配布元**：README は「公式配布 ZIP の入手 URL を載せない」としている【再確認】。入手経路の確認が要る。
- **Stretchy Studio の Live2D 書き出し**：リバースエンジニアリングで実装したと docs に書かれている【調査】。Live2D 側の規約との関係は未確認。
- **カスタムノードの置き場所**：ComfyUI 版はカスタムノードなので、使うなら Laterna専用画像環境に置く（brief D8。ComfyUI_img2 はカスタムノードを無効にしている）。

---

## 3. See-Through の代わりになるもの（レイヤー分解・1枚絵→Live2D）

| 名前 | 中身 | ライセンス | この用途への適性 |
|---|---|---|---|
| **Qwen-Image-Layered**（2025-12-17） | 画像を、指定した枚数の RGBA レイヤーに分ける | Apache-2.0（コード・重み）【調査】 | 分け方は物体単位で、目・口に分かれる保証は無い。重みは bf16 で 40.9GB、fp8 で 20.5GB。16GB では GGUF 版＋オフロードが必要【推測】 |
| **LayerD**（CyberAgent、ICCV2025） | デザイン画像のレイヤー分解 | Apache-2.0【調査】 | キャラの分解には向かない |
| **LayerDiffuse**（lllyasviel） | 透過画像の生成、前景と背景の分離 | コード Apache-2.0、重み OpenRAIL-M【調査】 | パーツには分けない |
| **Textoon**（2025-01） | テキスト → Live2D | **商用不可**（テンプレートデータの EULA が「大学での非商用研究」に限定）【調査】 | 不可 |
| **CartoonAlive**、**Bunraku**（arXiv 2607.27348） | 1枚絵 → Live2D | コードが見つからない【調査】 | 不可（入手できない） |
| **OmniPSD** | 画像 → PSD | 基盤の FLUX.1-dev／Kontext-dev が非商用【調査】 | 不可 |
| **Live2D 公式「素材分け」Photoshop プラグイン**（2025-10-28） | 切り抜きと塗りを半自動で行う | Cubism PRO の契約が必要（有料）【調査】 | Live2D に進む場合の選択肢 |

---

## 4. 組み合わせて See-Through のように使う部品

See-Through が無くても、次の部品を組み合わせれば②③はできる。See-Through が一括でやっていることを分けて持つ形になる。

**分割**
- SAM 2.1（Apache-2.0）、Grounded-SAM-2（Apache-2.0）【調査】
- SAM 3：独自ライセンス。商用の禁止は無い。禁止されているのは輸出規制違反・軍事用途・リバースエンジニアリング。重みは申請制【調査】

**アニメの顔**
- anime-face-detector：MIT、28点のランドマーク。重みのライセンスは未確認【調査】
- Anime-Face-Segmentation（siyeong0）：MIT、目・口を含む7クラス【調査】

**背景除去**
- ToonOut（MIT、アニメ特化）、BiRefNet（MIT）、anime-seg（Apache-2.0）【調査】
- **RMBG-2.0 は CC BY-NC 4.0 で商用不可**【調査】

**補完・差分の生成**
- FLUX.2 [klein] 4B（Apache-2.0）、Qwen-Image-Edit-2511（Apache-2.0）ほか（§6）
- LaMa：コードは Apache-2.0、重みは未確認【調査】

**中間コマ**
- RIFE（MIT）【調査】

**組み合わせの例【提案】**
1. 原画を背景除去する（ToonOut）
2. 顔パーツをマスクする（Anime-Face-Segmentation か SAM）
3. 編集モデルで差分を作る（目閉じ・母音別の口・表情）
4. 差分とマスクの交わる部分だけを元絵に貼り戻す
5. 必要なら髪・体を See-Through で分けて揺らす

①〜④は一度作れば、全ての回で使い回せる。

---

## 5. 口形のタイミング

### 5.1 VOICEVOX の audio_query で決める（推奨）

**audio_query の構造**【調査】。長さの単位は秒。

```
AudioQuery
├ accent_phrases[]
│  ├ moras[]: text, consonant|null, consonant_length|null, vowel, vowel_length, pitch
│  ├ accent, is_interrogative
│  └ pause_mora: Mora|null   （vowel = "pau"）
├ speedScale, pitchScale, intonationScale, volumeScale
├ prePhonemeLength（既定 0.1）, postPhonemeLength（既定 0.1）, pauseLength（既定 null）, pauseLengthScale（既定 1）
└ outputSamplingRate（既定 24000）, outputStereo, kana
```

- vowel の値は、a／i／u／e／o、N（ん）、cl（っ）、pau、無声化した A／I／U／E／O。
- 無声のモーラは pitch が 0 になる。

**エンジン内部での時間計算の順序**【調査】（voicevox_engine の `tts_engine.py`）
1. 疑問文の語尾上げ：`enable_interrogative_upspeak`（既定 true）が有効で、`is_interrogative` が真、かつ句末の pitch が 0 より大きいとき、句末に同じ母音の 0.15 秒モーラを足す。
2. 各アクセント句の moras の後ろに pause_mora を並べる。
3. 先頭と末尾に無音（sil）を付ける。長さは pre／postPhonemeLength。
4. pauseLength が null でなければ、pau の長さを置き換える。そのあと pauseLengthScale を掛ける。
5. **前後の無音と pau を含む全ての長さを、speedScale で割る。**
6. 音素ごとに 93.75fps（24000/256）へ、偶数丸めで量子化する。

**タイムラインの組み方**【調査】

```ts
const q = (s) => roundHalfEven(s * 93.75);   // 音素ごとに丸める
push('sil', q(pre / ss));
for (ap of accent_phrases) {
  // 1. の条件を満たすとき、句末に {vowel: 句末と同じ母音, vowel_length: 0.15} を足す
  for (m of moras) {
    if (m.consonant) push(m.consonant, q(m.consonant_length / ss));
    push(m.vowel, q(m.vowel_length / ss));
  }
  if (ap.pause_mora) push('pau', q((pauseLength ?? ap.pause_mora.vowel_length) * pauseLengthScale / ss));
}
push('sil', q(post / ss));   // 秒 = 累積フレーム数 / 93.75
```

**口形の割り当て**【調査】
- a／i／u／e／o → あ・い・う・え・お
- N・cl・pau・sil → 閉じ
- 無声化した母音 → 閉じ、または小さい「う」
- 子音の区間
  - m・b・p（拗音を含む）→ 閉じ
  - f・w → 「う」寄り
  - それ以外 → 次の母音を先に出す
- 1〜2動画フレームより短い区間は、前後に吸収する

**検証**：タイムラインの合計長が WAV の長さと一致するか確かめる。丸めを再現しないと、100音素で約1フレーム（標準偏差約31ms）ずれる【調査】。

**既存の事例**【調査】
- ゆっくりMovieMaker4 v4.49.0.0（2026-02-01）：「あいうえお」口パクに対応した。VOICEVOX などではエンジンの音素情報を使う。
- ymm-kuchipaku（y-chan、MIT）：VOICEVOX の .lab／AudioQuery から口パクを作る。
- voicevox_core PR #1448（2026-09-25、Draft）：AudioQuery から長さを求める機能の提案。「ユーザー側で算出するには非自明なことが多すぎた」とある。**自前で再現するときは丸めと疑問文の扱いに注意。**

**Kyozai-Athanor の現状**【再確認：実ファイル】
- `synthesize.ts` は `/audio_query` → `/synthesis` の2段で合成している。
  - audio_query の speedScale・pitchScale・intonationScale を固定定数（`FIXED_SYNTHESIS_PARAMS`）で上書きし、
    `enable_interrogative_upspeak=true` を明示して、`/synthesis` に送っている。
  - **audio_query は保存していない。**timeline-manifest に accent_phrases・moras の記述は無い。
  - WAV の前後の無音を削る処理は、compiler に見当たらない（trim・silence などで grep）。
    WAV には pre／postPhonemeLength の無音がそのまま入っていると見られる。その場合、タイムラインは WAV の先頭から sil を含めて数えれば合う【推測】。
- 立ち絵（`SpeakerPortrait.tsx`）は、話している側を明るくする（brightness の切り替え）だけ。口パク・まばたき・揺れは無い。
- **【提案】compile のときに、`/synthesis` に実際に送った版の audio_query を、WAV と同じハッシュ名で保存しておく。**後から口パクを付けるときに、再合成が要らなくなる。

### 5.2 音声を解析して決める（VOICEVOX 以外の音声用）

- **Rhubarb Lip Sync**（v1.14.0、2025-04-03、MIT）：音声を口形 A〜H・X に変換し、JSON や TSV で出す。オフラインの CLI。日本語では `--recognizer phonetic` を使う【調査】。**VOICEVOX の音声なら、5.1 の方が正確。**
- **MotionPNGTuber Player**（MIT）：音量と周波数の比で、closed／half／open／e／u を選ぶ【調査】。
- **Diff Motion**：有償（BOOTH 800円）。マイク入力で、オフラインでの書き出しは見つからない【調査】。

---

## 6. 表情差分の作り方

| モデル | ライセンス | VRAM・速度 | 評判・注意 |
|---|---|---|---|
| **FLUX.2 [klein] 4B** | Apache-2.0（Qwen3-4B のテキストエンコーダを同梱）【調査】 | 約13GB、4ステップ | 複数の参照画像での編集に対応。同一性の評判は良いが、出典が弱い。**9B 版と FLUX.2 dev は非商用** |
| **Qwen-Image-Edit-2511**（2025-12） | Apache-2.0。Lightning 4ステップ LoRA も Apache【調査】 | 20B。16GB では fp8／GGUF＋オフロード | 公式は「位置ずれの軽減、キャラの一貫性の向上」をうたう。頬の赤みなど余計な変化が出た例がある（出典が弱い） |
| LongCat-Image-Edit | Apache-2.0【調査】 | オフロードして約18GB | 一貫性の保持をうたう |
| OmniGen2 | Apache-2.0【調査】 | 約17GB（CPU オフロードで約半分） | 未確認 |
| Step1X-Edit v1.2 | Apache-2.0【調査】 | 最小構成でも18GB（v1.0 の値） | 未確認 |
| Z-Image Turbo＋Fun ControlNet Union 2.1 | Apache-2.0【調査】 | Turbo 系 | inpaint モードで、口・目だけを局所的に直せる |
| ~~FLUX.1 Kontext [dev]~~ | 非商用ライセンス。出力の商用利用は可と書かれているが、モデルの使用は非商用目的に限られ、収益を生む活動は非商用に当たらない【調査】 | — | **収益化するなら不可と見る** |
| ~~Qwen-Image-2.1~~（2026-09-14） | Qwen Research License【調査】 | — | マスク編集や RGBA 出力など機能は理想的だが、**研究用途限定で不可** |

**運用【提案】**
- 編集したら、元絵との差分を取ってマスクにし、口・目の領域だけを元絵に貼り戻す。位置ずれと余計な変化を止められる。
- **必要な枚数の目安**【調査】：1人あたり「口7種×表情3〜4＋目3種」で約30〜40枚。一度作れば、全ての回で使い回せる。
  - 口7種は、閉・半開き・あ・い・う・え・お。
  - 目3種は、開・半目・閉。

---

## 7. 動かし方と書き出し

### 7.1 Remotion の中でパーツを動かす（推奨）

- **Remotion の前提**【調査】
  - 全てのアニメーションを `useCurrentFrame()`（フレーム番号）の関数として書く。
  - レンダリングは複数のタブで並列に行われ、タブ同士で状態を共有しない。
- **パーツの差し替えと、sin・spring・interpolate による揺れ**
  - 呼吸・上下の弾み・首の傾き・まばたき（`random(seed)` で間隔を決める）は、この前提をそのまま満たす。
- **実例**【調査】
  - zundamon-remotion：LICENSE ファイルが無い。
  - remotion-voicevox-template：MIT。口パクは `Math.floor(frame/5)%2` で PNG を切り替えるだけ。
- **口パクを §5.1 のタイムラインで駆動すれば、母音別の口形まで Remotion の中で完結する。**動画ごとの GPU 計算は要らない【提案】。

### 7.2 THA3（Talking Head Anime 3）── 1枚絵をパラメータで動かす

- **ライセンス**：コードは MIT、重みは CC BY 4.0（配布するときは作者の表示が必要）【再確認】。
  - **後継の THA4 は、重みが CC BY-NC なので不可**【調査】。
- **入力条件**【再確認】
  - 512×512 の RGBA で、背景は完全に透明にする。
  - 正面を向いた人型のキャラを1体だけ置く。
  - 頭は上半分の中央 128×128 に入れ、手は頭から離して下に置く。
- **動かせるもの**【再確認】：口・目・眉の表情、首と体の回転、胸の膨らみ（呼吸）。
  - 口形には aaa／iii／uuu／eee／ooo がある【調査】。
- **速度**：Titan RTX で約41ms／フレーム【調査】。13分（23,400フレーム）なら、1人約16分【推測】。
- **注意**：出力は 512²（顔は約128²）なので、拡大が必要。首を回すとぼやける【調査】。
- **組み合わせ**：§5.1 のタイムラインで口形パラメータを駆動する【提案】。

### 7.3 Live2D Cubism／Inochi2D

- **Live2D Cubism**【調査】
  - 年間売上1,000万円未満の個人・小規模事業者は、FREE版・PRO版とも、YouTube 等で営利・非営利を問わず使える（公式ヘルプ）。
  - **FREE版の制限**：テクスチャは2048pxで1枚、パラメータは30、アートメッシュは100まで。書き出しは最大1280×720。
  - Editor から、透過WebM・MOV・連番PNG を書き出せる。**これを Remotion で合成するのが現実的。**
  - **Remotion の中で SDK を動かすのは難しい**：物理演算は前のフレームの状態を持ち越すので、並列レンダリングと相性が悪い【推測】。WebGL のメモリリークも既知の問題で、長尺は分割レンダリングが推奨されている【調査】。
  - **SDK の Core は再配布に制限がある**。公開リポジトリには入れない【調査】。
  - Editor の規約は、「出力ファイルを、Live2D社と競合するミドルウェアと組み合わせて使う」ことを禁じている【調査】。
- **Inochi2D**【調査】
  - BSD-2-Clause。
  - 安定版は 0.8 系（2024年）で、0.9 は開発中。Web 実行は未成熟。
  - Creator には、FFmpeg を使った動画書き出しがある。

### 7.4 拡散モデルの talking-head（音声 → 動画）

| モデル | ライセンス | アニメへの適性 | 速度・VRAM | 注意 |
|---|---|---|---|---|
| LongCat-Video-Avatar 1.5（2026-05） | MIT【調査】 | 公式に「アニメへ汎化」と記載 | 16GB での実測は見つからない | 複数話者に対応 |
| InfiniteTalk（2025-08） | Apache-2.0（依存物も含む）【調査】 | 公式の記載なし | 4090 で10秒の動画に40分という報告（ユーザー報告） | 1分を超えると色ずれ |
| MultiTalk | Apache-2.0【調査】 | cartoon 対応と公式に記載 | Wan2GP 経由なら 8GB | 最大約15秒 |
| Wan2.2-S2V-14B | Apache-2.0【調査】 | 未確認 | 公式は 80GB。ComfyUI に fp8 版 | — |
| EchoMimicV3-Flash | Apache-2.0【調査】 | 未確認 | 12GB、8ステップ | — |
| MuseTalk 1.5 | MIT【調査】 | 実写で学習 | V100 で 30fps 以上 | 入力は動画 |
| ~~HunyuanVideo-Avatar~~ | Tencent Hunyuan Community License【調査】 | cartoon 対応を公式に記載 | Wan2GP なら 10GB | EU・英国・韓国を除外し、**出力を地域外で表示することも禁止**。YouTube で世界に公開すると抵触し得る |
| ~~LatentSync 1.6~~／~~LivePortrait~~／~~ditto~~ | 本体は Apache／MIT だが、**同梱の InsightFace のモデルが非商用・研究用途限定**【調査】 | — | — | 顔検出を差し替えない限り不可 |
| ~~Sonic~~ | CC BY-NC-SA 4.0【調査】 | — | — | 不可 |

**計算時間の見積もり**【推測】
- 4060 Ti（メモリ帯域は 4090 の約1/3.5）では、出力1分あたり約2〜14時間。
- **13分×2人を通しで作ると、2枚の GPU で並べても1〜8日かかる。**冒頭・締めなど、1分以内の見せ場に限るべき。
- 出力に背景透過が無いことも多い【調査】。
- 主人の手元の Wan2GP が MultiTalk などに対応している【調査】。ただし brief D8 の考え方では、Laterna で使うなら専用環境に置く。

### 7.5 ループ動画＋口の重ね合わせ（MotionPNGTuber 方式の応用）【提案・未検証】

髪揺れ・呼吸などを含む数秒のループ動画を用意する（画像から動画を作るモデル、または手作り）。

1. MotionPNGTuber で「口を消したループ動画」と「口の位置の追跡データ」を作る【再確認：この工程の存在】。
2. Remotion でループ動画を流す。
3. その上に、追跡データの位置へ §5.1 のタイムラインで選んだ口の画像を重ねる。

Live2D 無しで髪揺れと母音口パクを両立できる可能性がある。ループ動画を合成するので処理は重くなる（Remotion の透過動画の扱いは遅い【調査】）。

---

## 8. 商用で使えない・要注意のもの（まとめ）

| 対象 | 理由 |
|---|---|
| RMBG-2.0 | CC BY-NC 4.0 |
| FLUX.1 Kontext [dev]／FLUX.1 Fill [dev]／FLUX.2 [klein] 9B／FLUX.2 dev | 非商用ライセンス（収益化は不可と見る） |
| Qwen-Image-2.1 | Qwen Research License |
| THA4 の重み | CC BY-NC |
| Sonic | CC BY-NC-SA 4.0 |
| Textoon | テンプレートデータの EULA が非商用研究に限定 |
| OmniPSD | 基盤が FLUX.1 dev 系 |
| LatentSync／LivePortrait／ditto など InsightFace を同梱するもの | InsightFace のモデルが非商用 |
| HunyuanVideo-Avatar | 地域制限。出力の表示場所にも制限がある |
| See-Through（念のため） | 基盤の Open RAIL++-M の利用制限条項が派生物に及ぶと見て、条項を読んでおく【推測】 |
| Stretchy Studio の Live2D 書き出し | リバースエンジニアリングでの実装。Live2D 規約との関係は未確認 |
| Live2D Cubism SDK の Core | 再配布に制限がある。公開リポジトリには入れない |

---

## 9. 組み合わせの段階【提案】

| 段階 | 見え方 | 素材 | 道具 | 動画ごとの計算 |
|---|---|---|---|---|
| **0（現状）** | 静止した立ち絵。話している側だけ明るくする | 1人1枚 | Kyozai の SpeakerPortrait【再確認】 | なし |
| **1** | 口の開閉（閉・半・開）＋まばたき＋上下の弾み | 1人5〜6枚 | 編集モデル（klein 4B）＋§5.1 のタイムライン | なし（Remotion だけ） |
| **2** | 母音5種の口＋表情3〜4 | 1人30〜40枚 | 編集モデル、または PachiPakuGen／PNGAL で素材を作る | なし |
| **3** | 髪・呼吸・首の揺れ | パーツに分けた PSD | See-Through でパーツ化し、Remotion で揺らす。または §7.5 か THA3 | 3a／3b で異なる（下記） |
| **4（任意）** | 見せ場だけ、動画生成の自然な動き | 原画1枚 | LongCat-Video-Avatar 1.5／InfiniteTalk | 1分で数時間 |

**段階3の計算量**
- 3a（See-Through＋Remotion の transform）：なし。
- 3b（THA3）：1人約16分。

**推奨**
- **授業用は段階2まで**。YouTube に展開するなら段階3を検討する。
- 確信度は70%。**下げている主な理由は、使用場面が決まっていないこと**（brief の未決）。授業中にスクリーンで流す場合、口パクの効果は小さい。予習・復習用に配る場合や YouTube では効果が大きい。
- 段階1は、§5.1 と差分数枚で済むので、Wave 2 の後、最初に試す価値がある。

---

## 10. 規約メモ（Laterna に直接関わるもの）

### Remotion【再確認】
- **無料で使える条件**
  - 個人（私用・商用とも）
  - 3人以下の組織
  - 非営利団体
  - 評価中の利用
- **MP4 を受け取る顧客は、人数に数えない**（FAQ）。
- 規約（v5.0。Remotion 5.0 のリリースで発効）は、「政府機関、公共部門、教育機関などは、書面の許可が無い限り、無料ライセンス上の非営利団体として扱わない」と明記している。
- → **主人が個人として使い、MP4 を授業で使う限りは無料枠。**学校として導入する場合や、他の教員に展開する場合は確認が要る。

### VOICEVOX
- **本体の規約**：クレジット表記が必須（概要欄か動画内）【調査】。
- **現在のキャスト**（Kyozai `docs/conventions/speaker-profiles.yaml`）【再確認】
  - 解説役：玄野武宏。クレジットは「VOICEVOX:玄野武宏(CV:ガロ)」。
  - 聞き役：ずんだもん。クレジットは「VOICEVOX:ずんだもん」。
  - Kyozai の CreditSection が、クレジットを自動で出している【再確認】。
- **玄野武宏**：商用可。出力した音声を使った機械学習は禁止【調査】。
- **ずんだもん**【調査】
  - 商用可。
  - 禁止事項：政治・宗教活動、特定の団体（国家を含む）への非難・応援、情報商材、意図的な虚偽など。
  - 立ち絵などのキャラ利用は、別のガイドラインになる。
- **立ち絵は自作のオリジナル**で、VOICEVOX 公式キャラのデザインを模写・トレースすることは禁止（Kyozai `docs/conventions/portrait-assets.md` の規則）【再確認】。Laterna でも引き継ぐ【提案】。

### Live2D
- 7.3 を参照。売上1,000万円未満なら使える。FREE版には制限がある。

---

## 11. 未確認・次に実測すること

1. klein 4B で口・目だけを編集したとき、キャラの同一性が保たれるか（実測が必要）
2. PNGAL の正式な配布元
3. Kyozai の WAV に前後の無音がそのまま入っているか。削る処理は見当たらない（§5.1）が、実際の WAV の長さとタイムラインの合計で確かめる
4. 自作の立ち絵（Kyozai の `public/portraits/`）が、See-Through と THA3 の入力条件を満たすか
5. 4060 Ti での各モデルの実際の速度
6. See-Through の基盤（Open RAIL++-M）の利用制限条項が、教材での利用に触れないか
7. PachiPakuGen の最新版：調査担当は v0.4.1（2026-09-21）と報告したが、releases ページで確認できたのは v0.4.0（2026-07-21）まで

---

## 出典

**本体・派生**
- See-Through https://github.com/shitagaki-lab/see-through ／ 論文 https://arxiv.org/abs/2602.03749
- 重みのライセンスに関する議論 https://huggingface.co/layerdifforg/seethroughv0.0.2_layerdiff3d/discussions/1
- ComfyUI-See-through https://github.com/jtydhr88/ComfyUI-See-through ／ レジストリ https://api.comfy.org/nodes/comfyui-see-through
- See-Through WebUI https://github.com/BeamManP/see-through-webui
- PNGAL https://github.com/1mm-module/PNGAL
- PachiPakuGen https://github.com/kazuya-bros/PachiPakuGen ／ releases https://github.com/kazuya-bros/PachiPakuGen/releases
- Anime2.5DRig https://github.com/852wa/Anime2.5DRig
- PuruPuruPNGTuber https://github.com/rotejin/PuruPuruPNGTuber
- MotionPNGTuber https://github.com/rotejin/MotionPNGTuber ／ Player https://github.com/rotejin/MotionPNGTuber_Player
- SVG-Through Motion https://github.com/kazuya-bros/SVG-Through_Motion/releases
- Stretchy Studio https://github.com/MangoLion/stretchystudio
- image-to-live2d https://github.com/lvhaojie456/image-to-live2d
- 派生ツールの比較記事 https://note.com/kazuya_bros/n/nec31c3033265
- See-Through × Claude Code で Live2D（GMO）https://recruit.group.gmo/engineer/jisedai/blog/see-through-x-kaggle-x-claude-code/

**代替・部品**
- Qwen-Image-Layered https://huggingface.co/Qwen/Qwen-Image-Layered
- LayerD https://github.com/CyberAgentAILab/LayerD
- LayerDiffuse https://github.com/lllyasviel/LayerDiffuse
- Textoon https://github.com/human3daigc/Textoon
- CartoonAlive https://github.com/Human3DAIGC/CartoonAlive
- OmniPSD https://github.com/showlab/OmniPSD
- Live2D 素材分けプラグイン https://docs.live2d.com/en/cubism-editor-manual/material-separation-ps-plugin-download/
- SAM 3 https://github.com/facebookresearch/sam3
- SAM 2 https://github.com/facebookresearch/sam2
- Grounded-SAM-2 https://github.com/IDEA-Research/Grounded-SAM-2
- anime-face-detector https://github.com/hysts/anime-face-detector
- Anime-Face-Segmentation https://github.com/siyeong0/Anime-Face-Segmentation
- ToonOut https://huggingface.co/joelseytre/toonout
- BiRefNet https://github.com/ZhengPeng7/BiRefNet
- anime-seg https://huggingface.co/skytnt/anime-seg
- LaMa https://github.com/advimman/lama

**口パク**
- VOICEVOX Engine API https://voicevox.github.io/voicevox_engine/api/
- tts_engine.py https://github.com/VOICEVOX/voicevox_engine/blob/master/voicevox_engine/tts_pipeline/tts_engine.py
- phoneme.py https://github.com/VOICEVOX/voicevox_engine/blob/master/voicevox_engine/tts_pipeline/phoneme.py
- ゆっくりMovieMaker4 v4.49.0.0 https://manjubox.net/ymm4/release/4.49.0.0/
- ymm-kuchipaku https://github.com/y-chan/ymm-kuchipaku
- VOICEVOX 口パクの長さ計算（Zenn）https://zenn.dev/kurehajime/articles/3111a0a71b5bc9
- voicevox_core PR #1448 https://github.com/VOICEVOX/voicevox_core/pull/1448
- Rhubarb Lip Sync https://github.com/DanielSWolf/rhubarb-lip-sync
- Diff Motion https://cgworld.jp/flashnews/01-202602-DiffMotion.html

**表情差分**
- FLUX.2 klein 4B https://huggingface.co/black-forest-labs/FLUX.2-klein-4B
- Qwen-Image-Edit-2511 https://huggingface.co/Qwen/Qwen-Image-Edit-2511
- Qwen-Image-2.1 https://huggingface.co/Qwen/Qwen-Image-2.1
- FLUX.1 Kontext dev https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev
- LongCat-Image-Edit https://huggingface.co/meituan-longcat/LongCat-Image-Edit
- OmniGen2 https://github.com/VectorSpaceLab/OmniGen2
- Step1X-Edit https://github.com/stepfun-ai/Step1X-Edit
- Z-Image-Turbo-Fun-Controlnet-Union-2.1 https://huggingface.co/alibaba-pai/Z-Image-Turbo-Fun-Controlnet-Union-2.1

**動かす**
- THA3 https://github.com/pkhungurn/talking-head-anime-3-demo ／ THA4 https://github.com/pkhungurn/talking-head-anime-4-demo
- LongCat-Video-Avatar 1.5 https://huggingface.co/meituan-longcat/LongCat-Video-Avatar-1.5
- InfiniteTalk https://github.com/MeiGen-AI/InfiniteTalk
- MultiTalk https://github.com/MeiGen-AI/MultiTalk
- Wan2.2-S2V https://huggingface.co/Wan-AI/Wan2.2-S2V-14B
- EchoMimicV3 https://github.com/antgroup/echomimic_v3
- MuseTalk https://github.com/TMElyralab/MuseTalk
- HunyuanVideo-Avatar https://github.com/Tencent-Hunyuan/HunyuanVideo-Avatar
- LatentSync https://github.com/bytedance/LatentSync
- LivePortrait https://github.com/KlingTeam/LivePortrait
- InsightFace https://github.com/deepinsight/insightface
- Sonic https://github.com/jixiaozhong/Sonic
- Inochi2D https://github.com/Inochi2D/inochi2d
- Live2D SDK ライセンス https://www.live2d.com/sdk/license/
- Live2D 機能比較 https://www.live2d.com/cubism/comparison/
- Live2D ヘルプ（売上1,000万円未満の利用）https://help.live2d.com/other/other_07/
- remotion-voicevox-template https://github.com/nyanko3141592/remotion-voicevox-template

**規約**
- Remotion FAQ https://www.remotion.dev/docs/license/faq
- Remotion Terms https://www.remotion.dev/docs/terms
- Remotion third-party https://www.remotion.dev/docs/third-party
- VOICEVOX 利用規約 https://voicevox.hiroshiba.jp/term/
- ずんだもん等の音源規約 https://zunko.jp/con_ongen_kiyaku.html
- 玄野武宏等（VirVox）https://www.virvoxproject.com/voicevox%E3%81%AE%E5%88%A9%E7%94%A8%E8%A6%8F%E7%B4%84
