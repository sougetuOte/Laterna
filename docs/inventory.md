# inventory.md — Kyozai-Athanor 棚卸し表と依存の表（Wave 1 完了条件 1・2）

対象：`git -C D:\work7\Kyozai-Athanor ls-files` の全 363 件（`main`、HEAD `01c727e`、2026-09-26 実測）。
分類は 3 つ。**持っていく**（Wave 1 で本リポジトリにコピーする）／**置いていく**（コピーしない。Kyozai は読み取り専用で残るので、必要なら読みに行ける）／**保留**（決め手が出るまでコピーしない。決め手を理由欄に書く）。

行の種類：**ファイル行**（パスの完全一致で 1 件）と**ディレクトリ行**（末尾 `/`。配下の全件を覆う）。
集計（機械で数えた。scratchpad の生成スクリプトが `ls-files` 全件と突き合わせて漏れ 0・重複 0 を確認済み）：

| 分類 | 件数 | 割合 |
|---|---:|---:|
| 持っていく | 90 | 24.8% |
| 置いていく | 270 | 74.4% |
| 保留 | 3 | 0.8% |
| 合計 | 363 | 100% |

表の行数は 132（ファイル行 123＋ディレクトリ行 9）。ディレクトリ行の配下件数：`src/pdf/` 6、`scripts/spec-ledger/` 7、`materials/kyozai-athanor-original/` 8、`public/audio/outline-video-1/` 103、`.claude/` 38、`docs/specs/` 22、`docs/artifacts/` 45、`docs/adr/` 9、`docs/daily/` 2。

## 1. 棚卸し表

### 1.1 ルート（11 件）

| パス | 分類 | 理由 |
|---|---|---|
| `.gitignore` | 置いていく | Laterna は自前の `.gitignore` を持つ（`out/`・`node_modules/` は既にある）。持ち込む `.kra` 向けに `*.kra~` だけ自前側へ足す |
| `.gitleaks.toml` | 置いていく | 秘密スキャンの設定。統治ツール寄りで、いまの製品には要らない（`docs/design.md` (e) に戻す条件） |
| `CLAUDE.md` | 置いていく | Kyozai の統治文書。`goal.md` の「起きてはならない」に当たる |
| `LICENSE` | 保留 | 同一著作者（sougetuOte）の MIT。Laterna のライセンスは主人の未決（brief §6）。案は Kyozai と同じ MIT。決まるまでコピーしない |
| `LICENSE-CONTENT` | 保留 | 同上（CC BY 4.0、合成音声・第三者立ち絵は対象外の書き方も引き継ぐ案）。決まるまでコピーしない |
| `README.md` | 置いていく | Laterna は自前の README を持つ |
| `eslint.config.mjs` | 持っていく | lint 設定。凍結資産向けの例外ルール（`no-irregular-whitespace` の JSX 除外）は害がないので残す |
| `package.json` | 持っていく | 依存の定義。scripts は script-engine 系 10 本だけに削る（§2.1 の 4） |
| `package-lock.json` | 持っていく | 依存の版固定。`npm install` の再現性 |
| `remotion.config.ts` | 持っていく | jpeg フレーム・PDF still・上書きの設定。PDF 出力（`build-script-pdf.mjs`）が依存 |
| `tsconfig.json` | 持っていく | TS 設定（commonjs・`resolveJsonModule`）。tsx 経由の compile と manifest の JSON import が依存 |

### 1.2 src/（61 件）

| パス | 分類 | 理由 |
|---|---|---|
| `src/FROZEN-ASSETS.md` | 置いていく | 凍結資産の説明。凍結資産ごと置いていく |
| `src/Root.tsx` | 持っていく | Composition 登録。凍結 4 件（HelloWorld・KosenW12・StudyGuide・StudySummary）と `./pdf/manifest` の import を削り、defaultProps の scriptId を `java-vs-js` に差し替える（§2.1 の 1） |
| `src/index.ts` | 持っていく | Remotion のエントリ（`registerRoot`） |
| `src/components/Citation.tsx` | 持っていく | component-registry が `Citation` として登録する汎用部品 |
| `src/components/Flowchart.tsx` | 持っていく | component-registry が `Flowchart` として登録する汎用部品 |
| `src/components/Iceberg.tsx` | 持っていく | component-registry が `Iceberg` として登録する汎用部品（outline-video-1 の svg-ref が使う） |
| `src/components/NarrationAudio.tsx` | 置いていく | 凍結 KosenW12 専用。既知の tsc エラー 2 件の元。script-engine は remotion の `Audio` を直接使う |
| `src/components/README.md` | 置いていく | video-base 時点の説明で古い（部品 2 つしか載っていない）。部品の説明は手順書 `SKILL.md` に書く |
| `src/components/Section.tsx` | 持っていく | ScriptSlideRenderer が title スライドに使う |
| `src/components/Slide.tsx` | 持っていく | ScriptSlideRenderer が bullets／code スライドに使う |
| `src/components/icons/iceberg.svg` | 持っていく | Iceberg 部品の下絵原本（コードは参照しない。部品はインライン JSX）。図解は SVG から起こす（brief D6）ので原本を部品の隣に置く |
| `src/compositions/HelloWorld.tsx` | 置いていく | video-base の Hello World。Root の登録を削る |
| `src/compositions/KosenW12.tsx` | 置いていく | 凍結資産（`src/FROZEN-ASSETS.md`）。旧手動 TIMING 構成 |
| `src/compositions/KosenW12StudyGuide.tsx` | 置いていく | 凍結資産。W12 学習資料 PDF |
| `src/compositions/KosenW12StudySummary.tsx` | 置いていく | 凍結資産。W12 学習資料 PDF |
| `src/compositions/ScriptComposition.test.tsx` | 持っていく | 動画 Composition のテスト |
| `src/compositions/ScriptComposition.tsx` | 持っていく | 動画 Composition 本体（manifest → Sequence・Audio・立ち絵・クレジット） |
| `src/compositions/ScriptPdfComposition.test.tsx` | 持っていく | PDF Composition のテスト |
| `src/compositions/ScriptPdfComposition.tsx` | 持っていく | PDF Composition 本体（pdf-manifest → 1 frame = 1 ページ） |
| `src/compositions/frame-boundary.probe.test.ts` | 持っていく | java-vs-js 実 manifest で frame 境界を全走査するテスト |
| `src/pdf/` | 置いていく | 凍結 PDF ライン（W12 学習資料）。KosenW12StudyGuide／Summary だけが使う |
| `src/script-engine/compiler/__mocks__/voicevox-audio-query.json` | 持っていく | synthesize.test の VOICEVOX 応答モック |
| `src/script-engine/compiler/__mocks__/voicevox-synthesis.wav` | 持っていく | synthesize.test の VOICEVOX 応答モック |
| `src/script-engine/compiler/__mocks__/voicevox-version.json` | 持っていく | synthesize.test の VOICEVOX 応答モック |
| `src/script-engine/compiler/cli.test.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest）。テスト |
| `src/script-engine/compiler/cli.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest） |
| `src/script-engine/compiler/content-hash.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest） |
| `src/script-engine/compiler/estimate.test.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest）。テスト |
| `src/script-engine/compiler/estimate.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest） |
| `src/script-engine/compiler/manifest.test.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest）。テスト |
| `src/script-engine/compiler/manifest.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest） |
| `src/script-engine/compiler/measure.test.ts` | 持っていく | WAV 尺の実測テスト。実 WAV 検証を `seg-*.wav` から java-vs-js の 13 本に差し替える（§2.1 の 3） |
| `src/script-engine/compiler/measure.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest） |
| `src/script-engine/compiler/parse.test.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest）。テスト |
| `src/script-engine/compiler/parse.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest） |
| `src/script-engine/compiler/speaker-profiles.test.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest）。テスト |
| `src/script-engine/compiler/speaker-profiles.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest） |
| `src/script-engine/compiler/synthesize.test.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest）。テスト |
| `src/script-engine/compiler/synthesize.ts` | 持っていく | compile 段（parse → 話者設定 → 尺予測 → VOICEVOX 合成 → WAV 実測 → manifest） |
| `src/script-engine/pdf/script-pdf-manifest.test.ts` | 持っていく | PDF ページ分割（pdf-manifest）。テスト |
| `src/script-engine/pdf/script-pdf-manifest.ts` | 持っていく | PDF ページ分割（pdf-manifest） |
| `src/script-engine/render/CreditSection.tsx` | 持っていく | render 段（スライド描画・立ち絵・クレジット・レジストリ） |
| `src/script-engine/render/ScriptSlideRenderer.test.tsx` | 持っていく | render 段（スライド描画・立ち絵・クレジット・レジストリ）。テスト |
| `src/script-engine/render/ScriptSlideRenderer.tsx` | 持っていく | render 段（スライド描画・立ち絵・クレジット・レジストリ） |
| `src/script-engine/render/SpeakerPortrait.tsx` | 持っていく | render 段（スライド描画・立ち絵・クレジット・レジストリ） |
| `src/script-engine/render/component-registry.test.ts` | 持っていく | render 段（スライド描画・立ち絵・クレジット・レジストリ）。テスト |
| `src/script-engine/render/component-registry.ts` | 持っていく | render 段（スライド描画・立ち絵・クレジット・レジストリ） |
| `src/script-engine/render/manifest-integrity.probe.test.ts` | 持っていく | render 段（スライド描画・立ち絵・クレジット・レジストリ）。テスト |
| `src/script-engine/render/manifest-registry.test.ts` | 持っていく | render 段（スライド描画・立ち絵・クレジット・レジストリ）。テスト |
| `src/script-engine/render/manifest-registry.ts` | 持っていく | manifest の import マップ。outline-video-1 の import 2 行と entries 2 行を削る（§2.1 の 2） |
| `src/script-engine/render/pilot/JavaJsCompare.tsx` | 持っていく | java-vs-js の custom スライド部品（対比カード・年表） |
| `src/script-engine/render/pilot/JsNamingTimeline.tsx` | 持っていく | java-vs-js の custom スライド部品（対比カード・年表） |
| `src/script-engine/schema/script.ts` | 持っていく | 台本・話者設定・manifest の型と検証 |
| `src/script-engine/schema/speaker-profile.ts` | 持っていく | 台本・話者設定・manifest の型と検証 |
| `src/script-engine/schema/timeline-manifest.ts` | 持っていく | 台本・話者設定・manifest の型と検証 |
| `src/script-engine/shared/component-names.ts` | 持っていく | custom 部品名の登録表（schema と registry の共通） |

### 1.3 scripts/（14 件）

| パス | 分類 | 理由 |
|---|---|---|
| `scripts/build-pdf.mjs` | 置いていく | 凍結 PDF ライン（KosenW12StudyGuide 等）専用 |
| `scripts/build-script-pdf.mjs` | 持っていく | pdf-manifest 駆動の PDF 出力（`remotion still` × ページ数 → pdf-lib で結合） |
| `scripts/compile-script.mjs` | 持っていく | compile の入口（tsx 経由で `cli.ts` を呼ぶ） |
| `scripts/render-all-script.mjs` | 持っていく | compile → render → pdf の一括実行 |
| `scripts/spec-ledger/` | 置いていく | 仕様台帳の統治ツール（`docs/specs/` を読む）。テスト 1 本を含む |
| `scripts/test-hash-logic.mjs` | 置いていく | 設計時の spike 検証。恒久テストは `synthesize.test.ts`（computeContentHash）にある |
| `scripts/test-pdf-metadata.mjs` | 置いていく | 設計時の spike 検証（pdf-lib の日時固定）。`build-script-pdf.mjs` に結果が組み込み済み |
| `scripts/test-wav-parser.mjs` | 置いていく | 設計時の spike 検証。恒久テストは `measure.test.ts` にある |

### 1.4 content/・docs/conventions/・materials/（29 件）

| パス | 分類 | 理由 |
|---|---|---|
| `content/scripts/.gitkeep` | 置いていく | 空の placeholder。実台本があるので不要 |
| `content/scripts/java-vs-js.script.yaml` | 持っていく | 切り出し実証（完了条件 3）に使うパイロット台本 |
| `content/scripts/outline-video-1.script.yaml` | 持っていく | 13 分・103 発話の完成台本。Wave 2 の執筆と `SKILL.md` の例に使う。音声・manifest は持っていかないので、render するには再 compile（VOICEVOX 起動）が要る |
| `docs/conventions/narration-style.md` | 持っていく | ナレーション文体ガイド（brief §3）。後半の「尺予測の許容誤差運用」は design 参照込みなので `SKILL.md` 執筆時に整理 |
| `docs/conventions/portrait-assets.md` | 持っていく | 立ち絵の仕様（透過 PNG・寸法・配置パス）と台帳。新しい立ち絵（Wave 2）の記録先 |
| `docs/conventions/project-template.md` | 置いていく | script-engine 以前の構成（`scenario.md`／`shared/`）を前提にした雛形で、現行と合わない |
| `docs/conventions/speaker-profiles.yaml` | 持っていく | エンジンが `__dirname` 基準の固定パスで読む話者設定。同じ相対パスに置く |
| `docs/conventions/video-creation-rules.md` | 保留 | 教材作成のメタルール。`SKILL.md` 執筆時（Wave 2）に必要な節だけ取り込む。それまでは Kyozai を読めば足りる |
| `docs/conventions/voicevox-engine-setup.md` | 持っていく | VOICEVOX 起動手順（brief §3）。`synthesize.ts` のエラーメッセージがこのパスを案内し、テストがその文字列を見る |
| `materials/iceberg.svg` | 置いていく | `src/components/icons/iceberg.svg` と同一内容（4,756 バイト）。重複 |
| `materials/java-vs-js/java-js-compare.svg` | 持っていく | pilot 部品 JavaJsCompare の下絵。台本ヘッダが参照 |
| `materials/java-vs-js/js-naming-timeline.svg` | 持っていく | pilot 部品 JsNamingTimeline の下絵。台本ヘッダが参照 |
| `materials/java-vs-js/scenario-handoff.txt` | 持っていく | java-vs-js 台本の出自（受領脚本）。台本ヘッダが参照 |
| `materials/java-vs-js/script-draft.md` | 持っていく | java-vs-js 台本の草稿。同上 |
| `materials/kyozai-athanor-original/` | 置いていく | W12 原版のアーカイブ（README に改変禁止と明記）。読み取り専用で参照できる |
| `materials/outline.md` | 持っていく | outline-video-1 台本の出自（章立て）。台本ヘッダが参照 |
| `materials/portraits/listener-draft-v1.kra` | 持っていく | 既存立ち絵の原本（Krita 作業ファイルと生成 PNG）。brief D7 の出典台帳（作者・加工内容）の裏付け |
| `materials/portraits/listener-draft-v1.png` | 持っていく | 既存立ち絵の原本（Krita 作業ファイルと生成 PNG）。brief D7 の出典台帳（作者・加工内容）の裏付け |
| `materials/portraits/listener-draft-v1_trans.png` | 持っていく | 既存立ち絵の原本（Krita 作業ファイルと生成 PNG）。brief D7 の出典台帳（作者・加工内容）の裏付け |
| `materials/portraits/narrator-draft-v1.kra` | 持っていく | 既存立ち絵の原本（Krita 作業ファイルと生成 PNG）。brief D7 の出典台帳（作者・加工内容）の裏付け |
| `materials/portraits/narrator-draft-v1.png` | 持っていく | 既存立ち絵の原本（Krita 作業ファイルと生成 PNG）。brief D7 の出典台帳（作者・加工内容）の裏付け |
| `materials/portraits/narrator-draft-v1_trans.png` | 持っていく | 既存立ち絵の原本（Krita 作業ファイルと生成 PNG）。brief D7 の出典台帳（作者・加工内容）の裏付け |

### 1.5 public/（132 件）

| パス | 分類 | 理由 |
|---|---|---|
| `public/.gitkeep` | 置いていく | 空の placeholder |
| `public/audio/java-vs-js/u-001-254d2d2c.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/java-vs-js/u-002-1eced8e7.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/java-vs-js/u-003-e8925791.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/java-vs-js/u-004-66901194.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/java-vs-js/u-005-00eb7053.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/java-vs-js/u-006-9d40645e.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/java-vs-js/u-007-93422445.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/java-vs-js/u-008-5d816f27.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/java-vs-js/u-009-c742066f.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/java-vs-js/u-010-ce0efee3.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/java-vs-js/u-011-45d4ddd3.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/java-vs-js/u-012-e9b8361b.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/java-vs-js/u-013-db636830.wav` | 持っていく | 合成済み WAV のキャッシュ（13 本で 4.5 MB）。内容ハッシュが一致すれば合成を省略できる |
| `public/audio/outline-video-1/` | 置いていく | outline-video-1 の WAV キャッシュ 103 本・37 MB。台本から再合成できる |
| `public/audio/seg-1.wav` | 置いていく | 凍結 W12 動画ライン（KosenW12.tsx）のナレーション（8 本で 29 MB） |
| `public/audio/seg-2.wav` | 置いていく | 凍結 W12 動画ライン（KosenW12.tsx）のナレーション（8 本で 29 MB） |
| `public/audio/seg-3.wav` | 置いていく | 凍結 W12 動画ライン（KosenW12.tsx）のナレーション（8 本で 29 MB） |
| `public/audio/seg-4.wav` | 置いていく | 凍結 W12 動画ライン（KosenW12.tsx）のナレーション（8 本で 29 MB） |
| `public/audio/seg-5.wav` | 置いていく | 凍結 W12 動画ライン（KosenW12.tsx）のナレーション（8 本で 29 MB） |
| `public/audio/seg-6.wav` | 置いていく | 凍結 W12 動画ライン（KosenW12.tsx）のナレーション（8 本で 29 MB） |
| `public/audio/seg-7.wav` | 置いていく | 凍結 W12 動画ライン（KosenW12.tsx）のナレーション（8 本で 29 MB） |
| `public/audio/seg-8.wav` | 置いていく | 凍結 W12 動画ライン（KosenW12.tsx）のナレーション（8 本で 29 MB） |
| `public/manifests/java-vs-js.manifest.json` | 持っていく | render の入力。compile で再生成できるが、キャッシュ WAV と対で持っていけば合成なしで render まで通る。テストも import |
| `public/manifests/java-vs-js.pdf-manifest.json` | 持っていく | PDF のページ分割。同上 |
| `public/manifests/outline-video-1.manifest.json` | 置いていく | 音声を持っていかないので対で置く。`manifest-registry.ts` の import を削る |
| `public/manifests/outline-video-1.pdf-manifest.json` | 置いていく | 同上 |
| `public/portraits/.gitkeep` | 置いていく | 空の placeholder |
| `public/portraits/listener-default.png` | 持っていく | 既存立ち絵（聞き役）。manifest の portrait_asset_key が指す |
| `public/portraits/narrator-default.png` | 持っていく | 既存立ち絵（解説役）。同上 |

### 1.6 統治系（ディレクトリ単位）（116 件）

| パス | 分類 | 理由 |
|---|---|---|
| `.claude/` | 置いていく | 統治層（rules・skills・agents・agent-memory・settings・hooks・launch.json・current-phase.json）。`goal.md` の「起きてはならない」 |
| `docs/specs/` | 置いていく | Milestone 仕様書（requirements／design／tasks）。統治文書。読み取り専用で参照できる |
| `docs/artifacts/` | 置いていく | 監査・retro・計測記録・調査ノート。統治文書。読み取り専用で参照できる |
| `docs/adr/` | 置いていく | アーキテクチャ決定記録。統治文書。読み取り専用で参照できる |
| `docs/daily/` | 置いていく | 日次記録。統治文書 |

### 1.7 git で追跡するかの決定（`.gitignore` の注記への答え）

- `public/audio/java-vs-js/`（13 本・4.5 MB）と `public/manifests/java-vs-js.*`：**追跡する**（Kyozai と同じ）。理由は 2 つ。キャッシュ WAV が無いと render のたびに VOICEVOX が要る。manifest は `manifest-registry.ts` が静的 import するので、無いとビルドが通らない。
- `materials/portraits/*.kra`（2 本・10 MB）：**追跡する**。既存立ち絵の作業原本で、出典台帳（brief D7）の裏付け。Krita の自動バックアップ `*.kra~` は `.gitignore` に足す。
- `public/audio/outline-video-1/`（103 本・37 MB）と `seg-*.wav`（8 本・29 MB）：**持っていかない**。上の表のとおり。

## 2. 依存の表（「持っていく」各ファイルの参照先）

### 2.0 読み方

- 元データは、持っていく各ファイルに `grep -nE "^import|from ['\"]|require\(|readFile|path\.(join|resolve)"` を掛けた結果（Kyozai の作業ツリー、HEAD `01c727e`）。
- **import／require の行き先**列には、該当行の指定子をそのまま書く。相対指定子は同じ `src/` 配下の持っていくファイルに解決する。置いていく側に解決するものだけ **→ 置いていく** と太字で示す。(npm)＝`package.json` の依存、(node)＝Node 組み込み。
- **パス文字列の行き先**列には、`readFile`／`path.join`／`path.resolve` の行にある文字列リテラルのうち **`/` を含むもの**（と `__mocks__`）を書く。`/` を含まないリテラル（`"utf-8"`・一時ディレクトリ内のファイル名・不存在確認用の名前）は、リポジトリ内のファイルを指さないので書かない。
- 行に文字列リテラルが無いもの（`import {` の開き行、変数だけを渡す `readFile(x)`、コメント）は行き先を持たない。
- grep に掛からない参照（複数行に割れた `path.resolve(`、テンプレート文字列の `staticFile()`、npm scripts、データファイル内のパス）は **grep 外** として同じ行に足した。
- 表に無い参照が 0 件であることは、scratchpad の照合スクリプト（上の規則を実装）で確認した。

### 2.1 置いていく側に及ぶ参照と切り離し方

| # | ファイル | 参照 | 行き先（置いていく側） | 切り離し方 |
|---|---|---|---|---|
| 1 | `src/Root.tsx` | L3-6 `./compositions/HelloWorld`・`./compositions/KosenW12`・`./compositions/KosenW12StudyGuide`・`./compositions/KosenW12StudySummary`、L7-12 `./pdf/manifest` | `src/compositions/HelloWorld.tsx`、`KosenW12*.tsx` 3 本、`src/pdf/manifest.ts` | **削る**。import 5 件と `<Composition>` 登録 4 件を消す。`PDF_PAGE_WIDTH/HEIGHT` は `ScriptPdfComposition` の export（既に import 済み）だけを使う。あわせて defaultProps の `scriptId` を `outline-video-1` から `java-vs-js` に**差し替える**（outline-video-1 は登録しないため） |
| 2 | `src/script-engine/render/manifest-registry.ts` | L18-19 `../../../public/manifests/outline-video-1.manifest.json`・`.pdf-manifest.json` | `public/manifests/outline-video-1.*` 2 本 | **削る**。import 2 行と `manifestRegistry`／`pdfManifestRegistry` の entries 2 行。テストは `java-vs-js` しか見ない（`manifest-registry.test.ts`・`ScriptComposition.test.tsx`・`ScriptPdfComposition.test.tsx` で確認） |
| 3 | `src/script-engine/compiler/measure.test.ts` | L195-222 `FFPROBE_KNOWN_DURATIONS` の `seg-1.wav`〜`seg-8.wav` を `path.resolve(__dirname, "../../../public/audio", fileName)` で読む | `public/audio/seg-1.wav`〜`seg-8.wav`（29 MB） | **差し替える**。同じ検証（ffprobe 実測値と ±1%）を java-vs-js の 13 本で行う。実測値は本セッションで `ffprobe -show_entries format=duration` により取得（§2.4） |
| 4 | `package.json` | `scripts` の 17 本（`prerender`・`render:video`・`render:slide1-3`・`render:kosen-w12`・`still:kosen-w12-1..8`・`still:kosen-w12-all`・`render:all`・`pdf:study-guide`・`pdf:study-summary`・`pdf:all`） | Composition `HelloWorld`・`KosenW12`、`scripts/build-pdf.mjs`、`out/slides` | **削る**。残すのは `dev`・`build`・`upgrade`・`lint`・`test`・`compile:script`・`render:script`・`pdf:script`・`preview:script`・`render:all:script` の 10 本 |
| 5 | `docs/conventions/narration-style.md`・`portrait-assets.md`・`voicevox-engine-setup.md` | 本文中の `docs/specs/...`・`.claude/rules/...` への参照（文章。コードではない） | `docs/specs/`・`.claude/` | **そのまま持っていく**。手順書 `SKILL.md` を書く Wave 2 で統治参照を削る（本 Wave では本文執筆をしない） |
| 6 | `eslint.config.mjs` | L9-10 コメントが `KosenW12.tsx`・`slideRenderers.tsx` に触れる | （コメントのみ） | **変更なし**。ルール自体は害がない |

### 2.2 ファイル別の行き先（持っていく 90 件のうち、grep か grep 外の参照を持つ 49 件）

| ファイル | import／require の行き先 | パス文字列の行き先 | grep 外・備考 |
|---|---|---|---|
| `eslint.config.mjs` | `@remotion/eslint-config-flat` (npm) | — | コメントが凍結資産（KosenW12.tsx 等）に触れるだけ。変更なし |
| `package.json` | — | `out/slides` | `scripts/compile-script.mjs`：npm scripts の `compile:script`（持っていく側）；`scripts/build-script-pdf.mjs`：`pdf:script`（持っていく側）；`scripts/render-all-script.mjs`：`render:all:script`（持っていく側）；`src/index.ts`：`render:script`（持っていく側）；`scripts/build-pdf.mjs`：**置いていく**。`pdf:study-guide`／`pdf:study-summary` → §2.1 の 4；`out/slides`：生成物。`prerender` → §2.1 の 4；`HelloWorld`：**置いていく**（Composition）。`render:video`／`render:slide1-3` → §2.1 の 4；`KosenW12`：**置いていく**（Composition）。`render:kosen-w12`／`still:kosen-w12-*` → §2.1 の 4；**置いていく側 4 件** → §2.1 の 4 |
| `remotion.config.ts` | `@remotion/cli/config` (npm) | — | — |
| `scripts/build-script-pdf.mjs` | `node:child_process` (node)・`node:fs` (node)・`node:fs/promises` (node)・`node:path` (node)・`node:process` (node)・`pdf-lib` (npm) | — | `public/manifests`：L61 `path.resolve("public/manifests", ...)`。cwd 基準（持っていく側）；`src/index.ts`：L120 `npx remotion still ... src/index.ts ScriptPdfComposition`（持っていく側）；`out/script-engine`：出力先。生成物（`.gitignore` 済み） |
| `scripts/compile-script.mjs` | `node:process` (node)・`tsx/cjs/api` (npm) | — | `../src/script-engine/compiler/cli.ts`：L24 `tsxRequire(...)`（持っていく側） |
| `scripts/render-all-script.mjs` | `node:child_process` (node)・`node:fs` (node)・`node:fs/promises` (node)・`node:path` (node)・`node:process` (node) | — | `scripts/compile-script.mjs`：L81（持っていく側）；`scripts/build-script-pdf.mjs`：L113（持っていく側）；`src/index.ts`：L103 `npx remotion render src/index.ts ScriptComposition`（持っていく側）；`out/script-engine`：出力先。生成物 |
| `src/Root.tsx` | `react` (npm)・`remotion` (npm)・`./compositions/HelloWorld` **→ 置いていく `src/compositions/HelloWorld.tsx`**・`./compositions/KosenW12` **→ 置いていく `src/compositions/KosenW12.tsx`**・`./compositions/KosenW12StudyGuide` **→ 置いていく `src/compositions/KosenW12StudyGuide.tsx`**・`./compositions/KosenW12StudySummary` **→ 置いていく `src/compositions/KosenW12StudySummary.tsx`**・`./pdf/manifest` **→ 置いていく `src/pdf/manifest.ts`**・`./compositions/ScriptComposition`・`./compositions/ScriptPdfComposition` | — | **置いていく側 5 件** → §2.1 の 1 |
| `src/components/Citation.tsx` | `react` (npm)・`remotion` (npm) | — | — |
| `src/components/Flowchart.tsx` | `react` (npm) | — | — |
| `src/components/Iceberg.tsx` | `react` (npm) | — | — |
| `src/components/Section.tsx` | `react` (npm)・`remotion` (npm) | — | — |
| `src/components/Slide.tsx` | `react` (npm) | — | — |
| `src/compositions/ScriptComposition.test.tsx` | `react` (npm)・`vitest` (npm)・`./ScriptComposition`・`../script-engine/render/SpeakerPortrait`・`../script-engine/render/manifest-registry`・`../script-engine/schema/timeline-manifest` | — | — |
| `src/compositions/ScriptComposition.tsx` | `react` (npm)・`remotion` (npm)・`../script-engine/render/manifest-registry`・`../script-engine/render/component-registry`・`../script-engine/render/ScriptSlideRenderer`・`../script-engine/render/SpeakerPortrait`・`../script-engine/render/CreditSection`・`../script-engine/schema/timeline-manifest`・`../script-engine/schema/script` | — | `staticFile(utterance.wav_path)`：L233。manifest の `wav_path`（`audio/java-vs-js/*.wav`）→ `public/audio/java-vs-js/`（持っていく側） |
| `src/compositions/ScriptPdfComposition.test.tsx` | `react` (npm)・`vitest` (npm)・`./ScriptPdfComposition`・`../script-engine/render/manifest-registry` | — | — |
| `src/compositions/ScriptPdfComposition.tsx` | `react` (npm)・`remotion` (npm)・`../script-engine/render/manifest-registry`・`../script-engine/render/component-registry`・`../script-engine/render/ScriptSlideRenderer`・`../script-engine/pdf/script-pdf-manifest`・`../script-engine/schema/script`・`../script-engine/schema/timeline-manifest` | — | — |
| `src/compositions/frame-boundary.probe.test.ts` | `vitest` (npm)・`../../public/manifests/java-vs-js.manifest.json`・`./ScriptComposition`・`../script-engine/schema/timeline-manifest` | — | — |
| `src/index.ts` | `remotion` (npm)・`./Root` | — | — |
| `src/script-engine/compiler/cli.test.ts` | `vitest` (npm)・`node:path` (node)・`./cli`・`../schema/script`・`../schema/speaker-profile`・`./synthesize`・`./manifest`・`./estimate`・`../pdf/script-pdf-manifest` | `../../../content/scripts` | — |
| `src/script-engine/compiler/cli.ts` | `node:fs/promises` (node)・`node:path` (node)・`./parse`・`./speaker-profiles`・`./estimate`・`./synthesize`・`./measure`・`./manifest`・`../pdf/script-pdf-manifest` | `../../../content/scripts` | L98 `content/scripts/<script-id>.script.yaml` を `__dirname` 基準で解決 |
| `src/script-engine/compiler/content-hash.ts` | `node:crypto` (node)・`../schema/speaker-profile` | — | — |
| `src/script-engine/compiler/estimate.test.ts` | `vitest` (npm)・`node:path` (node)・`node:fs/promises` (node)・`node:os` (node)・`./parse`・`./speaker-profiles`・`./estimate`・`../schema/script`・`../schema/speaker-profile` | `./does-not-exist.yaml` | `../../../content/scripts/java-vs-js.script.yaml`：L72-75 複数行（持っていく側）；`./does-not-exist.yaml` は不存在確認用 |
| `src/script-engine/compiler/estimate.ts` | `../schema/script`・`../schema/speaker-profile`・`./speaker-profiles` | — | — |
| `src/script-engine/compiler/manifest.test.ts` | `vitest` (npm)・`node:path` (node)・`node:fs/promises` (node)・`node:os` (node)・`./parse`・`./speaker-profiles`・`./manifest`・`../schema/script`・`../schema/speaker-profile` | — | `../../../content/scripts/java-vs-js.script.yaml`：L85-88 複数行（持っていく側） |
| `src/script-engine/compiler/manifest.ts` | `node:fs/promises` (node)・`node:path` (node)・`../schema/script`・`../schema/speaker-profile`・`../schema/timeline-manifest`・`./synthesize` | `../../../public/manifests` | L104 `public/manifests/<id>.manifest.json` を `__dirname` 基準で解決 |
| `src/script-engine/compiler/measure.test.ts` | `vitest` (npm)・`node:path` (node)・`node:fs/promises` (node)・`node:os` (node)・`./measure` | `../../../public/audio` | `seg-1.wav … seg-8.wav`：L199-206。`public/audio/seg-*.wav` は**置いていく** → §2.1 の 3；**置いていく側 1 件** → §2.1 の 3 |
| `src/script-engine/compiler/measure.ts` | `node:fs/promises` (node)・`node:path` (node) | — | — |
| `src/script-engine/compiler/parse.test.ts` | `vitest` (npm)・`node:path` (node)・`node:fs/promises` (node)・`node:os` (node)・`./parse`・`../schema/script` | `./does-not-exist.script.yaml` | `../../../content/scripts/java-vs-js.script.yaml`：L20-23 複数行（持っていく側）；`./does-not-exist.script.yaml` は不存在確認用 |
| `src/script-engine/compiler/parse.ts` | `node:fs/promises` (node)・`js-yaml` (npm)・`../schema/script` | — | — |
| `src/script-engine/compiler/speaker-profiles.test.ts` | `vitest` (npm)・`node:path` (node)・`node:fs/promises` (node)・`node:os` (node)・`./speaker-profiles` | — | — |
| `src/script-engine/compiler/speaker-profiles.ts` | `node:fs/promises` (node)・`node:path` (node)・`js-yaml` (npm)・`../schema/speaker-profile` | — | `../../../docs/conventions/speaker-profiles.yaml`：L38-41 複数行の `path.resolve(__dirname, ...)`（持っていく側） |
| `src/script-engine/compiler/synthesize.test.ts` | `vitest` (npm)・`node:fs/promises` (node)・`node:path` (node)・`node:os` (node)・`./synthesize`・`./content-hash`・`../schema/speaker-profile`・`../schema/script` | `__mocks__` | L392 の `"public", "audio", "path-check-script"` はパス文字列の検査だけ（実ファイルなし） |
| `src/script-engine/compiler/synthesize.ts` | `node:fs/promises` (node)・`node:path` (node)・`../schema/script`・`../schema/speaker-profile`・`./speaker-profiles`・`./content-hash` | `../../../public/audio` | `docs/conventions/voicevox-engine-setup.md`：L29 エラーメッセージの案内先（持っていく側）；`http://localhost:50021`：L26 VOICEVOX Engine の既定 URL（外部サービス）；L63 `public/audio/<script-id>/` を `__dirname` 基準で解決 |
| `src/script-engine/pdf/script-pdf-manifest.test.ts` | `vitest` (npm)・`./script-pdf-manifest`・`../schema/script`・`../schema/timeline-manifest` | — | — |
| `src/script-engine/pdf/script-pdf-manifest.ts` | `node:path` (node)・`../schema/script`・`../schema/timeline-manifest` | `../../../public/manifests` | L92 `public/manifests/<id>.pdf-manifest.json` を `__dirname` 基準で解決 |
| `src/script-engine/render/CreditSection.tsx` | `react` (npm)・`remotion` (npm) | — | — |
| `src/script-engine/render/ScriptSlideRenderer.test.tsx` | `react` (npm)・`vitest` (npm)・`./ScriptSlideRenderer`・`../../components/Slide`・`../../components/Section`・`./component-registry`・`./pilot/JavaJsCompare`・`../schema/script` | — | — |
| `src/script-engine/render/ScriptSlideRenderer.tsx` | `react` (npm)・`../../components/Slide`・`../../components/Section`・`../schema/script`・`./component-registry` | — | — |
| `src/script-engine/render/SpeakerPortrait.tsx` | `react` (npm)・`remotion` (npm) | — | `portraits/${portraitAssetKey}.png`：L59 `staticFile(...)` → `public/portraits/*.png`（持っていく側） |
| `src/script-engine/render/component-registry.test.ts` | `vitest` (npm)・`./component-registry`・`../shared/component-names` | — | — |
| `src/script-engine/render/component-registry.ts` | `react` (npm)・`../../components/Iceberg`・`../../components/Flowchart`・`../../components/Citation`・`./pilot/JavaJsCompare`・`./pilot/JsNamingTimeline`・`../shared/component-names` | — | — |
| `src/script-engine/render/manifest-integrity.probe.test.ts` | `vitest` (npm)・`node:fs` (node)・`node:path` (node)・`../../../public/manifests/java-vs-js.manifest.json`・`./component-registry`・`../compiler/manifest`・`../../compositions/ScriptComposition`・`../schema/timeline-manifest` | — | `join(__dirname, "..", "..", "..", "public")`：L21。`public/portraits/*.png` と manifest の `wav_path` の実在を見る（持っていく側） |
| `src/script-engine/render/manifest-registry.test.ts` | `vitest` (npm)・`./manifest-registry`・`../schema/timeline-manifest` | — | — |
| `src/script-engine/render/manifest-registry.ts` | `../../../public/manifests/java-vs-js.manifest.json`・`../../../public/manifests/java-vs-js.pdf-manifest.json`・`../../../public/manifests/outline-video-1.manifest.json` **→ 置いていく `public/manifests/outline-video-1.manifest.json`**・`../../../public/manifests/outline-video-1.pdf-manifest.json` **→ 置いていく `public/manifests/outline-video-1.pdf-manifest.json`**・`../schema/timeline-manifest`・`../pdf/script-pdf-manifest` | — | **置いていく側 2 件** → §2.1 の 2 |
| `src/script-engine/render/pilot/JavaJsCompare.tsx` | `react` (npm) | — | — |
| `src/script-engine/render/pilot/JsNamingTimeline.tsx` | `react` (npm) | — | — |
| `src/script-engine/schema/script.ts` | `./speaker-profile`・`../shared/component-names` | — | — |
| `src/script-engine/schema/timeline-manifest.ts` | `./script` | — | — |
| `tsconfig.json` | — | — | `remotion.config.ts`：`exclude`（持っていく側） |

### 2.3 参照を持たない持っていくファイル（41 件）

grep の該当行が 0 で、grep 外の参照も無いもの。データ・素材・型定義。

| ファイル | 備考 |
|---|---|
| `content/scripts/java-vs-js.script.yaml` | custom スライドの `component: JavaJsCompare`／`JsNamingTimeline` → `component-registry.ts`（持っていく側）。ヘッダが `materials/java-vs-js/*`（持っていく側）を参照 |
| `content/scripts/outline-video-1.script.yaml` | svg-ref スライドの `component: Iceberg` → `component-registry.ts`。ヘッダが `materials/outline.md`（持っていく側）を参照 |
| `docs/conventions/narration-style.md` | — |
| `docs/conventions/portrait-assets.md` | — |
| `docs/conventions/speaker-profiles.yaml` | `portrait.asset_key` → `public/portraits/<key>.png`（持っていく側） |
| `docs/conventions/voicevox-engine-setup.md` | — |
| `materials/java-vs-js/java-js-compare.svg` | — |
| `materials/java-vs-js/js-naming-timeline.svg` | — |
| `materials/java-vs-js/scenario-handoff.txt` | — |
| `materials/java-vs-js/script-draft.md` | — |
| `materials/outline.md` | — |
| `materials/portraits/listener-draft-v1.kra` | — |
| `materials/portraits/listener-draft-v1.png` | — |
| `materials/portraits/listener-draft-v1_trans.png` | — |
| `materials/portraits/narrator-draft-v1.kra` | — |
| `materials/portraits/narrator-draft-v1.png` | — |
| `materials/portraits/narrator-draft-v1_trans.png` | — |
| `package-lock.json` | — |
| `public/audio/java-vs-js/u-001-254d2d2c.wav` | — |
| `public/audio/java-vs-js/u-002-1eced8e7.wav` | — |
| `public/audio/java-vs-js/u-003-e8925791.wav` | — |
| `public/audio/java-vs-js/u-004-66901194.wav` | — |
| `public/audio/java-vs-js/u-005-00eb7053.wav` | — |
| `public/audio/java-vs-js/u-006-9d40645e.wav` | — |
| `public/audio/java-vs-js/u-007-93422445.wav` | — |
| `public/audio/java-vs-js/u-008-5d816f27.wav` | — |
| `public/audio/java-vs-js/u-009-c742066f.wav` | — |
| `public/audio/java-vs-js/u-010-ce0efee3.wav` | — |
| `public/audio/java-vs-js/u-011-45d4ddd3.wav` | — |
| `public/audio/java-vs-js/u-012-e9b8361b.wav` | — |
| `public/audio/java-vs-js/u-013-db636830.wav` | — |
| `public/manifests/java-vs-js.manifest.json` | データ内の `wav_path`（`audio/java-vs-js/u-0NN-<hash>.wav`）→ `public/audio/java-vs-js/`、`portrait_asset_key` → `public/portraits/*.png`（どちらも持っていく側） |
| `public/manifests/java-vs-js.pdf-manifest.json` | データ内の参照は slide id のみ |
| `public/portraits/listener-default.png` | — |
| `public/portraits/narrator-default.png` | — |
| `src/components/icons/iceberg.svg` | — |
| `src/script-engine/compiler/__mocks__/voicevox-audio-query.json` | — |
| `src/script-engine/compiler/__mocks__/voicevox-synthesis.wav` | — |
| `src/script-engine/compiler/__mocks__/voicevox-version.json` | — |
| `src/script-engine/schema/speaker-profile.ts` | import なし（型と定数のみ） |
| `src/script-engine/shared/component-names.ts` | import なし（登録表のみ） |

### 2.4 差し替えに使う実測値（§2.1 の 3）

`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1` を Kyozai の `public/audio/java-vs-js/*.wav` に掛けた値（2026-09-26、ffprobe 7.1）。

| ファイル | 秒 |
|---|---:|
| `u-001-254d2d2c.wav` | 4.586667 |
| `u-002-1eced8e7.wav` | 5.760000 |
| `u-003-e8925791.wav` | 6.570667 |
| `u-004-66901194.wav` | 5.504000 |
| `u-005-00eb7053.wav` | 4.149333 |
| `u-006-9d40645e.wav` | 12.085333 |
| `u-007-93422445.wav` | 3.690667 |
| `u-008-5d816f27.wav` | 8.789333 |
| `u-009-c742066f.wav` | 9.802667 |
| `u-010-ce0efee3.wav` | 4.661333 |
| `u-011-45d4ddd3.wav` | 12.672000 |
| `u-012-e9b8361b.wav` | 3.136000 |
| `u-013-db636830.wav` | 14.709333 |

## 3. 切り出し（完了条件 3）で行う編集の一覧

コピー後に手を入れるのは次の 4 ファイルだけ。いずれも §2.1 の切り離し。

1. `src/Root.tsx` — 凍結 Composition 4 件の登録と import 5 件を削り、defaultProps の scriptId を `java-vs-js` にする
2. `src/script-engine/render/manifest-registry.ts` — outline-video-1 の import 2 行と entries 2 行を削る
3. `src/script-engine/compiler/measure.test.ts` — 実 WAV 検証の対象を java-vs-js の 13 本と §2.4 の値に差し替える
4. `package.json` — `name`・`description` を Laterna に、scripts を 10 本に

`.gitignore` には `*.kra~` を足す。それ以外のコードは無改変でコピーする。
