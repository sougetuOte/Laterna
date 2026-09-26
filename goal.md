# goal.md — Wave 1「目星」（Laterna）

**状態：承認済み（2026-09-26、主人が claude.ai 上の相談セッションで「goal.md を承認します」）。**
承認後に誤りが見つかったら、本文を消さずに訂正節を足す（Seneschal `core/handoff.md`）。
**種別：feature（調査＋切り出し実証）。**背景と決定事項は `docs/brief.md`。**brief の「決定」を蒸し返さない。**

このWaveで答える問いは1つ ──
**Kyozai-Athanor から何を持ってくれば、統治の層なしで「台本→動画＋PDF」が回るか。**
推測ではなく、実際にコピーして動かして確かめる。

---

## 完了条件

1. **棚卸し表**：`docs/inventory.md` に、Kyozai-Athanor の **git 管理下の全ファイル**を
   「持っていく／置いていく／保留」に分類した表がある。各行に理由を1行。
   統治系（`.claude/`・`CLAUDE.md`・`docs/specs/`・`docs/artifacts/`・`docs/adr/`・`docs/daily/`）は、ディレクトリ単位の1行で「置いていく」としてよい。
   `public/`（audio・manifests・portraits）、`content/scripts/`、`materials/`、設定ファイル（`remotion.config.ts`・`tsconfig.json`・
   `eslint.config.mjs`・`package-lock.json`）も対象に含む。
2. **依存の表**：「持っていく」各ファイルについて、import とパス参照の行き先を列挙した表が `docs/inventory.md` にある。
   行き先が「置いていく」側に及ぶ箇所には、切り離し方（削る／差し替える／持っていく側へ移す）が書いてある。
3. **切り出し実証**：「持っていく」と分類した物だけを本リポジトリにコピーし、既存台本 `java-vs-js` が
   compile → render → PDF まで通る。
4. **設計草案**：`docs/design.md` に次の6節がある ──
   (a) 全体構成（SKILL.md 型の手順書＋エンジン＋素材調達3経路）／
   (b) 台本 YAML の拡張案（画像指定と出典台帳のフィールド。brief D7）／
   (c) `manifest-registry.ts` への手動追記をなくす方針／
   (d) 手順書 `SKILL.md` の目次案（`reference/yukkuri-reimu-marisa-videos/SKILL.md` を下敷きに）／
   (e) 持ち込まなかった物の一覧と、戻す条件／
   (f) 既知の宿題への方針 ── ① セリフ字幕を画面に出すか（現行の script-engine には見当たらない）、
   ② 口パク用に、`/synthesis` に実際に送った版の audio_query を compile 時に保存するか
   （`docs/research/2026-09-26-character-animation.md` §5.1）。
5. **次Waveの G0 草案**：`docs/research/wave2-g0-draft.md` に、1本目の動画制作の3項（完了条件／検証方法／やらないこと）がある。

## 検証方法

columba が採点する。各項は上の完了条件と同じ番号で対応する（対応の無い条件は無い）。

1. `git -C <Kyozai-Athanor> ls-files` の全件と `docs/inventory.md` の表を突き合わせ、**漏れ0件・重複0件**
   （ディレクトリ単位の行は、その配下の全件を覆うものとして数える）。「保留」は全体の2割以下。
2. 「持っていく」各ファイルに対し `grep -nE "^import|from ['\"]|require\(|readFile|path\.(join|resolve)"` を実行した結果と、
   依存の表の行き先が一致する（表に無い参照が0件）。
3. 本リポジトリで次がすべて成功する ──
   `npm install` ／ `npm test`（全件 PASS。件数を報告に書く）／ `npm run compile:script -- java-vs-js`（VOICEVOX 起動済み、
   またはキャッシュ済み WAV で合成を省略）／ render で `java-vs-js.mp4` と `java-vs-js.pdf` が生成される。
   `ffprobe` で映像・音声の両ストリームがあり、尺が Kyozai-Athanor の `out/script-engine/java-vs-js.mp4` と **±1秒以内**。
   PDF のページ数が元と一致。
   合成を省く場合は、Kyozai の `public/audio/java-vs-js/` の WAV を持ってくる。内容ハッシュが一致する限り合成は省略される。
   2026-09-26 時点の `content-hash.ts` は、text・話者ID・合成パラメータ・upspeak 指定の4つをハッシュに入れていて、
   エンジンの版は入っていない（コメントで確認）。実装がそのとおりかを確かめ、報告に書く。
4. `docs/design.md` の見出しに (a)〜(f) の6節が揃っている。(b) には brief D7 の必須4項目（出典URL・ライセンス・作者・加工内容）が
   フィールドとして現れる。(e) の各行に「戻す条件」がある。(f) の①②それぞれに方針が1行以上ある。
5. `docs/research/wave2-g0-draft.md` の完了条件と検証方法が**1対1で対応**している（数えて報告に書く）。

## やらないこと

### このWaveではやらない（次以降で扱う）

- 新しい動画の台本作成・制作（Wave 2）
- 手順書 `SKILL.md` の本文執筆（目次案まで。Wave 2 の着手時に書く）
- 画像まわり：Laterna 専用画像環境の設計・構築、画像生成の呼び出し、See-Through 等の立ち絵パイプライン、モデルの選定（brief D8。本体とは別に詰める）
- 台本 YAML 拡張の実装（設計草案まで）
- `manifest-registry` 自動化の実装（方針まで）
- 字幕・口パク・まばたきの実装（方針まで。完了条件 4 の (f)）

### 起きてはならない

- **Kyozai-Athanor への書き込み**（読むだけ。`.git/` も含む。状態を見るときは `git ls-files`・`git log`、
  または `git --no-optional-locks status` を使う。リポジトリ外への書き込みは G1）
- **`CLAUDE.md`・`goal.md`・`docs/brief.md` を主人の承認なしに変えること**（Laterna の G2。Seneschal の機構はここには効かない。
  誤りを見つけたら、本文を消さずに訂正節の案を主人へ出す）
- **Kyozai-Athanor の統治層を持ち込むこと**：`.claude/rules/`・`.claude/skills/`・`.claude/agents/`・`docs/specs/`・`docs/artifacts/`・
  `docs/adr/`・`SESSION_STATE.md` の様式・Milestone／監査／計測窓／retro の仕組み。
  **例外は brief D2 のとおり Seneschal を外付けで読むことだけ**
- **計測・コスト見積の仕組みを作ること**（Kyozai-Athanor が統治で詰まった直接の原因。brief §2）
- `D:\work8\Seneschal` と `D:\ComfyUI_img2` への書き込み。ComfyUI_img2 を呼ぶコードを書くこと（brief D8）
- `reference/` の中身の改変と commit（出所・ライセンス不明。たぬき式ゆっくり素材を含む）
- VOICEVOX 音声・第三者素材を CC BY 等で再ライセンスする記述（Kyozai-Athanor 監査 C-1 と同型の誤り）

---

# Wave 2「1 本目」（Laterna）

**状態：承認済み（2026-09-26、主人「承認」。`docs/research/wave2-g0-draft.md` 第 2 版をここに移した。草案は畳んだ）。**
承認後に誤りが見つかったら、本文を消さずに訂正節を足す（Seneschal `core/handoff.md`）。
**種別：feature（1 本目の動画制作＋画像環境）。期限：2026-10-01**（10/2 の高専 1 年・初回授業で使う）。
Wave 1「目星」は 2026-09-26 に完了（完了条件 1〜5 が検収 PASS）。背景と決定は `docs/brief.md`（§9 の訂正節を含む）、設計は `docs/design.md`、画像環境の検討は `docs/research/2026-09-26-image-env.md`。

## 主人の答え（2026-09-26、チャット）

| 問い | 答え |
|---|---|
| 題材 | 「ソースから実行ファイルまで」 |
| 尺 | 3〜5 分 |
| 台本の確認 | compile の前に本文を表で見せて承認をもらう |
| 納品先 | Claude が決める → `D:\work8\Laterna\deliver\<script-id>\`（git 管理外） |
| 立ち絵のデザイン | 変更を検討し、良い案が無ければ既定（既存の 2 人） |
| 画像環境 | プロジェクト内部に作ることを検討 → **建てる**。時間・トークンは度外視 |
| ライセンス | MIT＋CC BY 4.0 を承諾（`LICENSE`・`LICENSE-CONTENT`） |

**立ち絵の方針**：2 人の役割と見た目は引き継ぐ（解説役＝眼鏡の青年、聞き役＝白×橙の浮遊ロボット）。変えるのは 2 点。
(1) 解説役をバストアップにして顔を大きく取る（口パク・表情を後で付けるため）。
(2) 聞き役のロボットに **ランタンの意匠**（琥珀色に光る胸のコア、頭頂のランタン型アンテナ）を足し、Laterna の顔にする。
ランタン版が 3 回の生成で見られる物にならなければ既定（意匠なし）にする。どちらも主人が台本承認のときに見て選ぶ。全身版も作る。

## 完了条件

1. **画像環境**：`imagegen/` が Laterna の中にあり、`scripts/setup.ps1`（冪等・`-VerifyOnly` あり）／`start.ps1`／`stop.ps1`／`smoke.py` と `versions/`（ComfyUI のタグ・Python の版・`requirements.lock`・`models.json`）・`workflows/`・`README.md` が git で追跡されている。klein 4B で text-to-image と参照画像つき編集が 1 枚ずつ出る。`ComfyUI/`・`.venv/`・`models/`・`output/` は追跡しない。
2. **立ち絵**：`public/portraits/narrator-default.png`・`listener-default.png` が imagegen で作った新しいバストアップ原画（透過 PNG・縦長）に差し替わり、全身版が `materials/portraits/` にある。生成記録（モデル名・プロンプト・seed・加工内容）が `materials/portraits/README.md` にあり、`docs/conventions/portrait-assets.md` の台帳が埋まっている。
   9/29 までに揃わなければ既存の 2 枚で出す（その場合も台帳を埋め、`README.md` に「既存で出した」と書く）。
3. **題材と構成**：`materials/<script-id>/outline.md` に、対象（高専 1 年・初回・授業中に流す）、尺の目標（3〜5 分）、章立て（3〜5 章）、出典の一覧がある。
4. **台本**：`content/scripts/<script-id>.script.yaml` があり、compile が通り、実測の総尺が 180〜300 秒に入る。主人が台本本文を承認した記録がある。
5. **動画と PDF**：`npm run render:all:script -- <script-id>` を 1 回実行するだけで `out/script-engine/<script-id>.mp4` と `.pdf` が出る（手作業の補正なし）。
6. **クレジットと出典**：manifest の `credits[]` に VOICEVOX 2 話者と立ち絵の行がある（動画末尾のクレジットに出る）。概要欄用テキスト `materials/<script-id>/description.md` に内容紹介・出典一覧・クレジットがある。
7. **手順書**：`SKILL.md` の本文がある（`docs/design.md` (d) の目次）。1 本目を実際に作った手順と一致している ── 作業のたびに `materials/<script-id>/build-log.md` に「手順番号・実行したコマンド・終了コード」を残し、`SKILL.md` の手順 0〜7 がその記録と対応する。
8. **納品**：`deliver/<script-id>/` に MP4・PDF・`description.md` の 3 点がある。
9. **Wave 1 からの持ち越し**（Seneschal `loop.md`「前のフェーズから持ち越す物を、検証方法の行にする」）：Wave 1 で採点されなかった物が、この Wave の中で確かめられている。
   対象は 3 つ。(i) 検収 PASS 後の直し `f7f4d6b`（`docs/inventory.md` の行番号 5 件・本数・導入文）。(ii) `SESSION_STATE.md` の状態の主張（「manifest は Kyozai の原本と同一」「MP4・PDF の SHA-256 が参照と一致」「npm test 261 件」）。(iii) Wave 1 のテスト変更（`measure.test.ts` の期待値 13 件の差し替え・実 WAV 検証 8 件の削除・skip 0）。

**主人の受け入れ**（columba の採点対象外）：10/2 の授業で使えると主人が判断すること。使えなかった点は Wave 3 の G0 に書く。

## 検証方法

columba が採点する。各項は上の完了条件と同じ番号で対応する（9 対 9、対応の無い条件は無い）。

1. `git ls-files imagegen` に `scripts/setup.ps1`・`start.ps1`・`stop.ps1`・`smoke.py`、`versions/comfyui.txt`・`python.txt`・`requirements.lock`・`models.json`、`workflows/*.json`、`README.md` があり、`imagegen/ComfyUI/`・`.venv/`・`models/`・`output/` 配下は 0 件。
   `powershell -ExecutionPolicy Bypass -File imagegen/scripts/setup.ps1 -VerifyOnly` が exit 0（版・ロック・モデルの sha256 が一致）。`start.ps1` の後に `curl http://127.0.0.1:8288/system_stats` が応答し、`smoke.py` が exit 0 で t2i と edit の PNG を 1 枚ずつ指定寸法で出す。`stop.ps1` の後にポートが空く。`models.json` の 3 本の sha256 が `D:\ComfyUI_img2\versions\models.json` の同名エントリと一致。
2. `magick identify -format "%w %h %[channels]"` で 2 枚とも高さ > 幅、channels に `a`（アルファ）を含む。`materials/portraits/` に全身版 2 枚（ファイル名に `full`）。
   `materials/portraits/README.md` に立ち絵ごとに「モデル」「プロンプト」「seed」「加工」の 4 語がある。`portrait-assets.md` の表に「（未記入）」が残っていない。
   既存で出した場合：`README.md` に「既存で出した」の 1 行と、台帳の作画者欄が埋まっていること。
3. `materials/<script-id>/outline.md` に見出し「対象」「尺」「章立て」「出典」の 4 つがある（grep）。「章立て」の下の章が 3〜5 個。
4. `npm run compile:script -- <script-id>` が exit 0。`public/manifests/<script-id>.manifest.json` の `total_duration_frames / fps` が 180〜300。
   `materials/<script-id>/outline.md` に「台本承認：YYYY-MM-DD 主人」の 1 行がある。
5. 評価器が `out/script-engine/` を空にしてから `npm run render:all:script -- <script-id>` を 1 回実行し、exit 0 で `.mp4` と `.pdf` が両方できる。`ffprobe` で `.mp4` に映像・音声の両ストリームがあり、尺が manifest の `total_duration_frames / fps` と ±1 秒。PDF のページ数が `<script-id>.pdf-manifest.json` の `total_pages` と一致。
6. manifest の `credits[]` に `VOICEVOX:` で始まる行が 2 つと「立ち絵」を含む行が 1 つある。`description.md` に見出し「出典」「クレジット」がある。
7. `SKILL.md` に `docs/design.md` (d) の見出し（手順 0〜7 と「困ったとき」）が全部ある（grep）。`materials/<script-id>/build-log.md` に手順 0〜7 の各番号が 1 回以上現れ、各行にコマンドと終了コードがある。
8. `deliver/<script-id>/` に 3 ファイルがあり、`.mp4` と `.pdf` の SHA-256 が `out/script-engine/` の物と一致する。
9. (i) `f7f4d6b` が直した 6 箇所（`docs/inventory.md` §2.1 の 4「29 本のうち 19 本」、§2.2 の `render-all-script.mjs` 備考 L79・L107、`build-script-pdf.mjs` 備考 L123、`manifest-integrity.probe.test.ts` 備考 L22、`eslint.config.mjs` L11、§2.3 導入文）を、Kyozai の現物（HEAD `01c727e`）と突き合わせて一致する。
   (ii) 評価器が自分で `npm run compile:script -- java-vs-js` と `render:all:script -- java-vs-js` を走らせ、manifest 2 本が Kyozai の `public/manifests/java-vs-js.*` と同一（キー順を揃えた JSON で diff なし）、`java-vs-js.mp4`・`.pdf` の SHA-256 が Kyozai の `out/script-engine/` の物と一致、`npm test` が 261 件以上 PASS であることを見る。走らせられなければ「自己申告」と書く。
   (iii) `git diff ba991a4..805d312 -- 'src/**/*.test.*'` で、Wave 1 の起点からのテストの削除・skip・期待値の変更を数え、`measure.test.ts` の期待値 13 件の出所が `docs/inventory.md` §2.4（ffprobe 7.1 の実測）であることを確かめる。skip（`it.skip`／`describe.skip`／`todo`）が 0 であること。
   **主人の言葉を引く行**（題材・尺・納品先・画像環境・ライセンス）は、主人が本 G0 を承認したこと自体を記録とする。

## やらないこと

### この Wave ではやらない（次以降で扱う）

- 字幕・SRT の出力、口パク・まばたき、audio_query の保存（`docs/design.md` (f)。Wave 3）
- 画像スライド（`type: image`）と出典台帳の実装（(b)。1 本目は図解と立ち絵だけ）
- `manifest-registry.ts` の廃止（(c)）。Wave 2 の着手時に 1 度だけ試し、1 時間で通らなければ手動追記 1 回で出して Wave 3 に回す
- imagegen の UI、カスタムノード、Z-Image Turbo（要るときに `versions/` に足す）、compile 段からの呼び出し（D10）
- 2 本目以降の題材の調査

### 起きてはならない

- Kyozai-Athanor・Seneschal・ComfyUI_img2 への書き込み。img2 は**変えない**。imagegen が 9/29 までに動かないときだけ、D8 訂正（brief §9）の経路で呼ぶ
- imagegen を呼ぶコードを `src/`・`scripts/`（エンジン側）に入れること（imagegen の中と `materials/portraits/` の記録に閉じる）
- 商用不可のモデルで立ち絵を作ること（klein 4B 以外を使うなら先に規約を確かめる）
- VOICEVOX 公式キャラクターのデザインの模写・トレース（`portrait-assets.md` §0）
- VOICEVOX 音声・第三者素材を CC BY 等で再ライセンスする記述
- `CLAUDE.md`・`goal.md`・`docs/brief.md` の無承認変更、`reference/` の改変と commit
- 期限を越える範囲の拡大：10/1 に間に合わないと分かったら、章と尺を削って出す。機能を足して間に合わせようとしない
