# design.md — Laterna の設計草案（Wave 1 完了条件 4）

**位置づけ：**草案。Wave 1 の棚卸し（`docs/inventory.md`）と切り出し実証を踏まえて、次の Wave が何を作るかの方針を 6 節で書く。
決定事項は `docs/brief.md` にあり、ここでは蒸し返さない。実装は各節に書いた Wave で行う。
**消滅条件：**手順書 `SKILL.md` と実装に内容が移り、ここを指す行が無くなったら畳む（git に残る）。

---

## (a) 全体構成（SKILL.md 型の手順書＋エンジン＋素材調達 3 経路）

```
Laterna/
├─ SKILL.md                  手順書（Wave 2 で執筆。目次案は (d)）。「この題材で 1 本」の入口
├─ content/scripts/          台本 YAML（1 本 = 1 script-id）
├─ src/                      エンジン（Kyozai-Athanor から移植。compile／render／pdf／schema）
├─ scripts/                  compile:script・pdf:script・render:all:script の 3 本と、その 2 本が使う remotion-cli.mjs
├─ docs/conventions/         話者設定・文体・VOICEVOX 起動手順・立ち絵の仕様
├─ materials/<script-id>/    題材ごとの下絵・原稿・出典メモ
├─ materials/portraits/      立ち絵の原本と生成記録（プロンプト・モデル・seed）
├─ public/audio|manifests|portraits   compile の成果物と立ち絵（git で追跡。inventory §1.7）
└─ out/script-engine/        MP4・PDF（追跡しない）
```

**流れ**（手順書の骨格。細部は (d)）：
題材と対象を決める → 調査（一次資料・出典メモ）→ 台本 YAML → `compile:script`（VOICEVOX 合成・尺の実測・manifest）→ 試写（Studio）→ `render:all:script`（MP4＋PDF）→ 確かめる（ffprobe・PDF ページ数・出典）→ 渡す（MP4・PDF・概要欄テキスト）。

**素材調達の 3 経路**（brief D7）：

| 経路 | 何を | どうやって | 出典台帳 |
|---|---|---|---|
| 図解 | 図・表・年表・対比 | **コードで描く**（`src/components/` の汎用部品と、台本ごとの custom 部品。SVG 下絵は `materials/<id>/`） | 自作なので不要（部品名が台本に残る） |
| 挿絵・キャラ原画・立ち絵 | 立ち絵 2 名、挿絵 | **Laterna 専用の画像環境**（brief D8。設計は本体と別）。**暫定**：1 本目の立ち絵原画と差分は D8 訂正（主人承認済み・brief 未反映。文面は SESSION_STATE.md）どおり、ComfyUI_img2 を変えずに Claude が HTTP で呼ぶ | `materials/portraits/` にプロンプト・モデル名・seed・加工内容を記録。台本側は (b) の `source` |
| 写真・実物資料 | 実物の写真、画面写真 | 許可ライセンスの素材だけ（CC0・パブリックドメイン・CC BY。ND・SA は不可） | (b) の `source` を必須にし、compile が検証してクレジットに出す |

**1 本目（Wave 2）で使うのは図解と立ち絵だけ。**写真・実物資料の経路は (b) の実装（Wave 3 以降）まで使わない。

## (b) 台本 YAML の拡張案（画像指定と出典台帳のフィールド）

現行の `slides[]` は `title`／`bullets`／`code`／`svg-ref`／`custom` の 5 種で、画像ファイルを指す型が無い。次の 1 型と 1 台帳を足す。

```yaml
slides:
  - id: slide-photo-1
    type: image                 # 新設。画像 1 枚＋キャプション
    src: images/<script-id>/punch-card.jpg     # public/ 配下の相対パス
    caption: パンチカード（1960 年代）
    fit: contain                # contain | cover（省略時 contain）
    source:                     # 出典台帳。type: image では必須（compile が検証）
      source_url: https://commons.wikimedia.org/wiki/File:...   # 出典URL
      license: CC-BY-4.0        # ライセンス。許可リストは CC0 / PD / CC-BY-4.0 / CC-BY-3.0 / self / generated
      author: Example Museum    # 作者
      modifications: トリミング、背景を白に      # 加工内容。無ければ none
      generated_with:           # license が generated のときだけ
        model: FLUX.2 [klein] 4B
        prompt_ref: materials/portraits/narrator-v2.md   # プロンプト・seed の記録先
```

| フィールド | 必須 | 意味 | compile での検証 |
|---|---|---|---|
| `source.source_url`（出典URL） | 必須 | 入手元。自作は `self`、生成物は `generated` と書く | 空なら compile を止める |
| `source.license`（ライセンス） | 必須 | 許可リストの値だけ | リスト外（ND・SA・不明）なら止める。brief D7 |
| `source.author`（作者） | 必須 | クレジット表記に出す名前 | 空なら止める |
| `source.modifications`（加工内容） | 必須 | CC BY の「改変を明示」に対応 | 空なら止める（`none` は可） |
| `source.generated_with` | 条件付き | 生成物のモデル名と記録先 | `license: generated` のとき必須。モデルは商用可の一覧（研究資料 §8）に照らす |

**立ち絵の台帳**は台本ではなく `docs/conventions/speaker-profiles.yaml` の `portrait` に同じ `source` を足す（立ち絵は台本を跨いで使うため）。

**出力**：compile が manifest の `credits[]` に画像の行（`作者 / ライセンス / 出典URL`）を足し、`CreditSection` が末尾に出す。あわせて `out/script-engine/<id>.description.md`（概要欄用：内容紹介・出典一覧・クレジット）を書き出す。エンドクレジットに収まらない分は概要欄側に回す。**再ライセンスはしない**：VOICEVOX 音声と第三者素材は各権利者の規約のまま（`goal.md` 起きてはならない）。

**実装は Wave 3 以降**（1 本目は画像を使わない）。schema（`script.ts`）・manifest（`timeline-manifest.ts`）・`ScriptSlideRenderer` の 3 箇所に閉じる。

**Wave 5 で実装した（2026-10-03）。上の案との違い：**`license` の値は `CC0`・`PD`・`CC-BY-4.0`・`CC-BY-3.0`・`CC-BY-2.0`・`self`・`quotation`。`quotation` は Web ページの画面写しの引用（brief §9 の D7 訂正）で、取得日 `retrieved`（YYYY-MM-DD）を必須にする。`generated` と `generated_with` は D10（compile 時の画像生成）と一緒に次の Wave で足す。`fit` は持たない（常に contain）。画像ファイルの有無は compile の入口（`compiler/parse.ts`）で確かめる。出典の 1 行は `shared/image-source.ts` で作り、動画の画像の下・PDF の最終ページ・`credits[]` で同じ文にする。概要欄の自動書き出しはまだ無い（`description.md` は手で書く）。

## (c) `manifest-registry.ts` への手動追記をなくす方針

**現状**：`manifest-registry.ts` が manifest JSON を静的 import し、script-id ごとに import 文と entries を手で足す（`video-creation-rules.md` §8 にも手順が書かれている）。切り出し時にも outline-video-1 の 4 行を手で削った。

**方針：render は manifest を実行時に読む。レジストリを廃止する。**

1. `ScriptComposition`／`ScriptPdfComposition` の `calculateMetadata` で、`fetch(staticFile("manifests/<scriptId>.manifest.json"))` して manifest を props に入れる。`durationInFrames` はそこから計算する（Remotion の `calculateMetadata` は非同期を許す）。
2. 未登録 script-id の明示エラー（現行 `resolveManifest` の役目）は、fetch の 404 と `slides`／`speakers` の欠落検査で同じ文言を出す。
3. テスト（`ScriptComposition.test.tsx` 等）は `manifestRegistry["java-vs-js"]` を `fs.readFileSync` の JSON に置き換える。probe テスト 2 本は既に JSON を直接 import しているので変更なし。
4. `manifest-registry.ts`・同 test を削る。`video-creation-rules.md` §8 の追記手順も消える。

**採らない案**：webpack の `require.context` で `public/manifests/*.json` を全部束ねる。新台本ごとに bundle が太り、Remotion のバンドラ依存になる。

**実装は Wave 2 の着手時**（新台本 1 本を足す最初の機会。手動追記を 1 回するより安い見込み。間に合わなければ手動追記 1 回で 1 本目を出し、Wave 3 に回す）。

## (d) 手順書 `SKILL.md` の目次案

下敷きは `reference/yukkuri-reimu-marisa-videos/SKILL.md`（178 行。入力→守ること→手順 0〜8 の型）。Laterna では音声が VOICEVOX、立ち絵が自作、出力に PDF が加わる。

```
# 授業用の解説動画と復習 PDF を作る（Laterna）
## このリポジトリの構成            （(a) の図）
## 入力                            題材／対象（学年・前提知識）／使用場面（授業中・復習）／尺／台本の確認の要否
## 守ること                        一次資料で確かめる・画像は 3 経路以外から取らない・VOICEVOX と立ち絵のクレジット・
                                   再ライセンスしない・narration-style.md の口調と NG 表現
## 手順0：準備                      VOICEVOX を起動して /version を見る・npm install・立ち絵が public/portraits にあるか
## 手順1：調査                      一次資料を集め、出典を materials/<id>/sources.md に残す
## 手順2：構成                      冒頭・本編 3〜5 章・まとめ 3 点・次回予告（narration-style.md）
## 手順3：台本                      script.yaml の書き方（utterances／slides／slide_events／pause）・話者の役割・1 発話の長さ・
                                   custom 部品が要るときの作り方（下絵 SVG → src/script-engine/render/<id>/ に React）
## 手順4：compile と確認            npm run compile:script -- <id>。尺予測と実測の差・WAV の読みの確認（聞く）・Studio で試写
## 手順5：書き出し                  npm run render:all:script -- <id> → out/script-engine/<id>.mp4 と .pdf
## 手順6：確かめる                  ffprobe で映像・音声・尺、PDF のページ数、台本と出典の突き合わせ、クレジットの表示
## 手順7：渡す                      MP4・PDF・概要欄テキスト（出典とクレジット）。置き場所は主人が指定
## 立ち絵を差し替える・増やす        portrait-assets.md の仕様、materials/portraits/ への記録、speaker-profiles.yaml
## 困ったとき                        VOICEVOX 無応答・尺が ±25% 超・render の失敗（out/ を残して調べる）
```

**参考スキルから借りない物**：確認モード `--check`（Laterna では compile の尺予測と Studio 試写がその役目）、字幕 SRT（(f)①で方針を決める）、サムネイル（授業用には不要）。

## (e) 持ち込まなかった物の一覧と、戻す条件

`docs/inventory.md` の「置いていく」270 件と「保留」3 件を、まとまりごとに。戻すときは inventory の分類も直す。

| 持ち込まなかった物 | 件数 | 戻す条件 |
|---|---|---|
| `.claude/`・`CLAUDE.md`・`docs/specs/`・`docs/artifacts/`・`docs/adr/`・`docs/daily/`（統治層） | 117 | **戻さない。**統治は Seneschal を外付けで読む（brief D2）。読む必要が出たら Kyozai を読み取り専用で参照する |
| `scripts/spec-ledger/` | 7 | **戻さない。**仕様台帳は `docs/specs/` と対で、統治の器 |
| 凍結資産（`KosenW12*.tsx` 3 本・`src/pdf/` 6 本・`NarrationAudio.tsx`・`scripts/build-pdf.mjs`・`seg-*.wav` 8 本・`FROZEN-ASSETS.md`） | 20 | 次年度に W12 の復習 PDF を作り直すことになったら。そのときも **Laterna に戻さず Kyozai 側で再生成する**（Kyozai の PDF ラインは動く状態で凍結されている） |
| `HelloWorld.tsx`・`src/components/README.md` | 2 | 戻さない。Hello World は不要、README の中身は `SKILL.md` の「custom 部品の作り方」に書く |
| `public/audio/outline-video-1/`・`public/manifests/outline-video-1.*` | 105 | outline-video-1 を Laterna で render する必要が出て、再 compile（VOICEVOX で 103 発話・数分）で足りないとき（例：当時の WAV と一致させたいとき） |
| `content/scripts/.gitkeep`・`public/.gitkeep`・`public/portraits/.gitkeep` | 3 | 戻さない（空ファイル） |
| `materials/kyozai-athanor-original/`・`materials/iceberg.svg` | 9 | 戻さない。W12 原版は Kyozai で読める。`iceberg.svg` は `src/components/icons/` に同じ物がある |
| `docs/conventions/project-template.md` | 1 | 戻さない。現行構成と合わない。ディレクトリ規約は (a) と `SKILL.md` が持つ |
| `scripts/test-*.mjs`（spike 3 本） | 3 | 同じ検証を vitest の外でもう一度やる必要が出たとき（想定しない） |
| `.gitignore`・`README.md` | 2 | 戻さない。Laterna は自前の物を持つ |
| `.gitleaks.toml` | 1 | 公開前に秘密スキャンを回すと決めたとき（公開の判断は主人。brief §6）。**→ 公開は 2026-09-26 に決まった（brief §9）** |
| **保留** `LICENSE`・`LICENSE-CONTENT` | 2 | 主人が Laterna のライセンスを決めたとき。案は Kyozai と同じ MIT（コード）＋CC BY 4.0（台本・図解・教材本文。合成音声と第三者素材は対象外）。**→ 2026-09-26 に承諾され、戻した** |
| **保留** `docs/conventions/video-creation-rules.md` | 1 | `SKILL.md` を書くとき（Wave 2）。§1 の「最初に確認する 4 項目」・§4 のストーリー軸・§7 の視覚化指針を「入力」「手順 2」「手順 3」に取り込む。B 案方式（`scenario.md`／`shared/`）と §8 の registry 追記手順は取り込まない |

## (f) 既知の宿題への方針

### ① セリフ字幕を画面に出すか

**方針：出す。既定で ON、台本の設定で OFF にできる。**
使用場面が「授業中に流す」（主人 2026-09-26）なので、PC 教室でイヤホンが無い場合と、聞こえにくい学生への配慮で効く。

- 実装の要点（Wave 3）：manifest の `utterances[]` に `text` が無い（compile が捨てている。`java-vs-js.manifest.json` で確認）。compile で `text` を manifest に入れ、render は画面下の帯に発話中の `text` を出す（`findActiveSpeaker` と同じ区間判定を使う）。1 発話が長いときは句点で 2 行までに折る。
- 同じ `text` と frame から SRT を書き出す（`out/script-engine/<id>.srt`）。参考スキルが出している物で、配布動画に付けられる。
- PDF には既に発話テキストが載る（pdf-manifest）ので PDF 側の変更は無い。
- 1 本目（Wave 2）では**やらない**。授業で流したときに字幕が要るかを実際に見てから実装する（要らなければ実装しない）。

### ② 口パク用に、`/synthesis` に実際に送った版の audio_query を compile 時に保存するか

**方針：保存する。WAV と同じ内容ハッシュ名で、JSON をサイドカーとして置く。**

- `synthesize.ts` は `/audio_query` の結果に `FIXED_SYNTHESIS_PARAMS` を上書きして `/synthesis` に送り、**送った版を捨てている**（`docs/research/2026-09-26-character-animation.md` §5.1）。この版を `public/audio/<id>/u-NNN-<hash>.query.json` に書く。書くのは送った直後の 1 行で、音声は変わらない。
- 内容ハッシュには**入れない**（query は text・話者・パラメータから決まる派生物）。WAV がキャッシュ済みで query が無い発話は、`/audio_query` だけ呼び直して補う（合成はしない。音声は変わらない）。
- 口パクのタイムラインは render 側で query から作る（研究資料 §5.1 の手順：speedScale で割り、93.75 fps で丸める）。**動かす実装は Wave 3**。保存だけは安いので **Wave 2 の compile で先に入れてよい**（1 本目の WAV を再合成せずに済む）。
- `manifest` には入れない（render 側の入力は manifest のみ、の原則は保つが、query は音声と対の生成物なので audio 側に置く）。

---

**未決（主人）**：ライセンス（(e) 保留 2 件）。**実測待ち**：(c) の `fetch(staticFile())` が `remotion render` の `calculateMetadata` で通ること（Wave 2 着手時に 1 回試す）。
