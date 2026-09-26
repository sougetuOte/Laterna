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

## 訂正節（本文は消さない。ここが優先する）

**検証 9(ii) 訂正（2026-09-26 主人承認。チャット「承認」）**：
何を誤ったか ── 検証 9(ii) は「`java-vs-js.mp4`・`.pdf` の SHA-256 が Kyozai の `out/script-engine/` の物と一致」を求めるが、java-vs-js の MP4 には `public/portraits/` の立ち絵が映る。完了条件 2 で立ち絵を v2 に差し替えた時点で、v1 の立ち絵で作られた Kyozai の参照とは一致しなくなる（PDF は立ち絵を含まないので一致する）。完了条件 2 と検証 9(ii) が両立しない書き方だった。
訂正 ── MP4・PDF の SHA-256 は、`public/portraits/` の 2 枚を commit `805d312` の v1 に一時的に戻して `npm run render:all:script -- java-vs-js` した物で Kyozai の参照と比べる。比べた後は `git checkout -- public/portraits` で v2 に戻し、`git status` に `public/portraits` の差分が無いことを報告に書く。manifest 2 本の同一性と `npm test` の件数（261 件以上 PASS）は現行どおり。**この節が検証 9(ii) に優先する。**

---

# Wave 2.5「点検」（Laterna）

**状態：承認済み（2026-09-27 06:15 JST ＝ 2026-09-26T21:15:22Z、主人「1 承認 2 OK 3 OK」、セッション `15a2552d-a599-4152-954c-132b22769ae3`）。**
承認後に誤りが見つかったら、本文を消さずに訂正節を足す（Seneschal `core/handoff.md`）。
**種別：feature（構造の直し）。**Seneschal のフェーズ種別にリファクタリングは無いので、feature として G0 を通す（Seneschal `docs/research/2026-09-25-review-test-refactor-acceptance.md` §6.2）。
**位置：**Wave 2（1 本目）と Wave 3（2 本目）の間に挟む。既存の条文が「Wave 3」と書いた物（字幕・(c)・10/2 の受け入れの結果など）は、そのまま Wave 3 で扱う。
**止め時：2026-10-01（木）。**越えそうなら、その時点で終わっている分で締め、残りは Wave 3 の G0 に回す。
**1 本目の直しとの関係：**10/2 までに 1 本目（`source-to-exe`）の直しが要ると分かったら、そちらを先にする。その直しは main に別コミットで入れ、本 Wave の採点範囲から除く。直しで 1 本目の出力が変わったら、検証 3(b) の参照値が無効になるので、その時点で本 Wave を締め、残りは Wave 3 の G0 で参照値を取り直す。
**起点：`6cbaf95`**（Wave 2 の締めと GitHub 公開の時点）。この節の追記は main に入れ、作業はブランチ `wave2.5-review` で進める。検収 PASS の後に main へ合流して push する（早送りできなければ merge commit。rebase はしない）。
**採点範囲：**本 Wave の成果コミット（`6cbaf95..HEAD` のうち、この節の追記、主人の別指示による直し、`SESSION_STATE.md` の締めを除く）。点検の記録は成果に含む（検収の前に commit する）。
**主人の指示**（2026-09-27 05:19 JST ＝ 2026-09-26T20:19:34Z、セッション `15a2552d-a599-4152-954c-132b22769ae3`）：「レビューとリファクタリングをやろう。役立つスキルがあれば、公式もseneschalのものもフルに使って下さい。私に許可を得たいことが有れば提案してください。」
brief §8「重い手法（MAGI・full-review）は既定では使わない」は、この指示により本 Wave では full-review を使う（起動は主人。`/seneschal:full-review`）。MAGI は縦の停止のときだけ（`loop.md` のまま）。
**評価器の書き込み：**検証 3 の手順で、評価器が `out/`・`public/manifests/`（compile の再生成）・`public/portraits/`（一時的に v1 に戻す）を書き換えてよい（Wave 2 の訂正節と同じ）。

## 主人への問いと答え（2026-09-27 06:15 JST、チャット）

| 問い | 答え |
|---|---|
| 1. この G0 を承認するか（`goal.md` への追記を含む） | 承認 |
| 2. full-review を主人が起動するか（`disable-model-invocation` のため Claude からは起動できない。直しの後に Claude が合図する） | OK |
| 3. `npm audit fix`（`--force` なし）を当ててよいか。脆弱性 11 件のうち 9 件が直り、入れ替わるパッケージは 34 個（vite 8.1→8.3・rolldown 1.1→1.2・js-yaml 5.2→5.4 ほか。Remotion 本体は変わらない）。出力が 1 バイトでも変わったら戻す | OK |

## 完了条件

1. **点検の記録**：`docs/research/2026-09-27-review.md`（消滅条件つき）がある。対象は `src/`・`scripts/`・`imagegen/scripts/`・設定ファイル（`package.json`・`tsconfig.json`・`eslint.config.mjs`・`remotion.config.ts`）と `SKILL.md` の事実の記述。
   節は「対象」「使った道具」「所見」「full-review の結果」。「使った道具」には各道具の回ごとに日時・範囲・指摘数（0 件も書く）。「所見」は表で、各行に「出所」「重さ」「場所（ファイル:行）」「内容」「処置」。処置は「直した（commit と直した場所）」「Wave 3 以降へ（理由）」「直さない（理由）」のどれか。対象のうち所見が 0 件の物は、その旨の行がある。
   「full-review の結果」は、主人が起動した場合は Green か・周の数・周ごとの指摘数とテストの結果・直さずに残した物と理由、起動しなかった場合は「起動なし」。
   ほかに、足したテストの期待値の出所と、`npm audit` の 2026-09-27 の実測がある。
2. **直し**：処置が「直した」の所見が、本 Wave の成果コミットで直っている。成果コミットの型は `refactor`・`fix`・`test`・`chore`・`docs`（`feat` なし）。`src/` を直す `fix` はテストケースの追加を含み、`scripts/`・`imagegen/` を直す `fix` は確かめたコマンドと結果が記録にある。
3. **振る舞いを変えない**：`source-to-exe` の compile の出力（manifest・音声）と render の出力（MP4・PDF）が、起点（＝納品物）と 1 バイトも違わない。`java-vs-js` の compile の出力が起点と、render の出力が立ち絵を v1 に戻した状態で Kyozai-Athanor の参照と 1 バイトも違わない。`deliver/` は変わらない。
4. **テストと lint**：`npm test` が全件 PASS（266 件以上）、`npm run lint` が exit 0。テストケースの削除・skip・期待値の書き換えが無い（足すのはよい）。
5. **手順書が通る**：`SKILL.md` の npm scripts がそのまま使え、`SKILL.md` が指すファイルを削除・改名していない。`SKILL.md` の事実の誤りを直した場合は、記録の所見に対応する行がある。
6. **依存の更新**（問い 3 が OK の場合）：`npm audit fix`（`--force` なし）を当て、fix 可の 9 件が直っていて、3 と 4 が通る。出力が変わった場合は当てずに戻してあり、その旨と変わった値が記録にある。
7. **imagegen**（`imagegen/` を変えた場合だけ）：画像環境が Wave 2 と同じく建って動く。
8. **Wave 2 からの持ち越し**（Seneschal `loop.md`）：Wave 2 の検収 PASS（HEAD `ac7b2e5`）の後に入った 3 コミット（`e0f720a`・`36fe414`・`6cbaf95`）について、`36fe414` の中身と、`SESSION_STATE.md` に書いた次の状態の主張（検証 8(ii) の列挙）と、主人の言葉を引く行が確かめられている。

## 検証方法

columba が採点する。各項は上の完了条件と同じ番号で対応する（8 対 8、対応の無い条件は無い）。

1. 記録ファイルに見出し「対象」「使った道具」「所見」「full-review の結果」と「消滅条件」の行がある。所見の表の各行で 5 列が埋まっている（空欄 0）。「対象」に挙げた各物について、所見の行か「0 件」の行がある。
   「使った道具」に、built-in の `/code-review`・`/simplify`・`/security-review` と `engineering:tech-debt` の各回（日時・範囲・指摘数）があり、それぞれの起動が本 Wave のセッションの transcript（記録に ID を書く）に在る。full-review は、主人が起動していれば「full-review の結果」の節に Green か否か・周の数・周ごとの指摘数・テストの結果・残した物と理由があり、起動が transcript に在る。起動していなければ「起動なし」と書いてあれば足りる。
   足したテストケースごとに期待値の出所（仕様・実測・主人の確定値）がある。`npm audit` の実測（11 件：high 6・moderate 3・low 2）がある。
2. 採点範囲のコミットの件名の型が `refactor`・`fix`・`test`・`chore`・`docs` のどれか（`feat` が 0）。「直した」の各行の commit が採点範囲にあり、その変更ファイルに行の「直した場所」が含まれる。`src/` を変える `fix` の各コミットは、テストファイルでのテストケースの追加を含む。`scripts/`・`imagegen/` を変える `fix` は、記録の該当行に確かめたコマンドと結果がある。
3. VOICEVOX（127.0.0.1:50021）が起動していて `/version` が `0.25.2` を返す状態で、評価器が自分で走らせる。そうでなければ、その行は「未検証」と書く（PASS にしない）。
   (a) `npm run compile:script -- source-to-exe` と `npm run compile:script -- java-vs-js` が exit 0。その後 `git diff --exit-code 6cbaf95 -- public/manifests public/audio` が exit 0（差分なし）。
   (b) `out/script-engine/` を空にして `npm run render:all:script -- source-to-exe` が exit 0。`source-to-exe.mp4` の SHA-256 が `43a78b42bdcdba2ba7ed7e1590d1001a9003431dea313409a5d737be293d9c4e`、`source-to-exe.pdf` が `c94e503fb993548520cad084dc9735e0f537898f70c33cc1551cb19282f8db55`。`deliver/source-to-exe/` の 3 ファイルの SHA-256 が、この 2 つと `description.md` の `509da0c423aff6e39291e7e6988318bdd7b05a1c28120a2d1928629cd2bbab16`。
   (c) `public/portraits/` の 2 枚を `git show 805d312:<パス>` で v1 に一時的に戻して `npm run render:all:script -- java-vs-js` が exit 0。`java-vs-js.mp4` の SHA-256 が `e121b7993e0b467584e590b61be49263b6f2e210f7bfdc71bf42cac27fd9ab5d`、`java-vs-js.pdf` が `ef4002301f4663884e13035f541611ecf716487c8ec9851ffb72dbcc9f5b0ddf`（どちらも Kyozai-Athanor の `out/script-engine/` の物と同じ値）。比べた後 `git checkout HEAD -- public/portraits` で戻し、`git status --porcelain` に `public/portraits` が無いことを報告に書く。
4. 評価器が `npm test` を自分で走らせ、全件 PASS・テストファイル 15 本以上・テスト 266 件以上（数を報告に書く）。`npm run lint` が exit 0。
   `git diff 6cbaf95..HEAD` のテストファイル（`*.test.ts`・`*.test.tsx`）で、(i) 消えたテストケース（`it(`・`test(` の行が消え、同じ名前で足されていない物）が 0、(ii) `.skip`・`.todo`・`.only`・`skipIf`・`runIf` の追加が 0、(iii) 期待値（matcher の引数）の値が変わる変更が 0、(iv) `expect(…)` の実測側を定数や期待値そのものに置き換える変更が 0。import・呼び出し名・定数名の付け替えで値が同じ物は数えない。起点のテストの期待値の出所は Wave 1・2 のまま（`docs/inventory.md` §2.4 ほか）。
5. `SKILL.md` に現れる `npm run <名前>`（`compile:script`・`lint`・`preview:script`・`render:all:script`）と `npm test` が `package.json` の `scripts` にあり、`git diff 6cbaf95..HEAD -- package.json` の `scripts` 節に差分が無い。`git diff --name-status 6cbaf95..HEAD` で削除（D）・改名（R）されたファイルの名前が `SKILL.md` に現れない。`SKILL.md` に差分があれば、変えた行ごとに記録の所見に対応する行がある。
6. （問い 3 が OK の場合）`package-lock.json` で次の版以上：`js-yaml` 5.4.2（`@eslint/eslintrc` 配下は 4.3.2）・`vitest` と `@vitest/mocker` 4.1.11・`postcss` 8.5.28・`nanoid` 3.3.19・`fast-uri` 3.1.8・`browserslist` 4.29.1・`brace-expansion` 1.1.21／2.1.7・`baseline-browser-mapping` 2.11.26。この状態で 3 と 4 が通る。戻した場合：`package-lock.json` が起点と同じで、記録に「戻した」と変わった値がある。（問い 3 が否の場合）`package-lock.json` が起点と同じ。
7. `git diff --stat 6cbaf95..HEAD -- imagegen` が空なら「該当なし」。空でなければ Wave 2 の検証 1 と同じ手順（`setup.ps1 -VerifyOnly` exit 0、`start.ps1` の後に `http://127.0.0.1:8288/system_stats` が応答、`smoke.py` が exit 0 で t2i と edit の PNG を指定寸法で出す、`stop.ps1` の後にポートが空く）。
8. (i) `36fe414`：`README.md` に見出し「ライセンス」と、MIT・CC BY 4.0・対象外の 3 行がある。`LICENSE-CONTENT` に VOICEVOX の規約 URL が 3 つ（`virvoxproject.com`・`zunko.jp/con_ongen_kiyaku.html`・`voicevox.hiroshiba.jp/term/`）と、再配布時に義務（クレジット・機械学習への使用禁止）を引き継ぐ 1 文がある。3 つの URL を取得して該当する規約のページかを見る。取得できなくても、記述があれば PASS してよい（取得できたかを報告に書く）。
   (ii) `e0f720a`・`6cbaf95` で `SESSION_STATE.md` に書いた状態の主張のうち、次の物を指す場所で確かめる ──「`deliver/` の SHA-256 は `out/` と一致」（→ 3(b)）／「MP4 は h264＋aac・285.888 秒、PDF は 10 ページ」（`deliver/` の物を `ffprobe`・`pdf-lib` で）／「`compile:script -- source-to-exe` は 27 発話・8575 frames」（manifest の発話数と `total_duration_frames`）／「立ち絵 v2 は 832×1216・透過」（`magick identify -format "%w %h %[channels]"` で `public/portraits/` の 2 枚）／「`npm test` 15 files・266 tests、`npm run lint` exit 0」（→ 4。以上で読む）／「`out/script-engine/java-vs-js.mp4` は v1 の立ち絵で render した物で Kyozai と同一」（→ 3(c)）／「imagegen の `setup.ps1 -VerifyOnly` が exit 0」（評価器が走らせる。`start`・`smoke`・`stop` は P1 の検収で採点済みなので、imagegen を変えた場合だけ 7 で見る）／「GitHub に Public で公開」（`gh api repos/sougetuOte/Laterna --jq .visibility` が `public`）／「`npm audit` 11 件」（記録に 2026-09-27 の実測）／「Wave 2 の完了条件 2〜9 は columba 全体 PASS」（セッション `3073bd24-f73a-4514-ab5a-e656bc089bee` の columba の返り値に在る）。
   時間で変わる状態（「imagegen はいまは停止中」「`gh` は sougetuOte でログイン済み」）は採点しない。
   (iii) 主人の言葉を引く行 ── セッション `3073bd24-f73a-4514-ab5a-e656bc089bee` の 2026-09-26T13:20:52Z の主人の発話に「metral@sougetu.netは公開アドレス。使っても問題ない」「a,b共に修正を行って。ライセンスは炎上の原因になるからね」「公開で作って」が在る（13:13:13Z は公開の可否を問う質問）。本 Wave の主人の指示と問い 1〜3 の答えが、上の状態行・指示の行が指すセッションと時刻の transcript に主人の発話として在る。

## やらないこと

### この Wave ではやらない（Wave 3 以降で扱う）

- 機能の追加：字幕・SRT、口パク・まばたき、audio_query の保存、画像スライドと出典台帳（`docs/design.md` (b)）、`manifest-registry.ts` の廃止（(c)）
- 見た目や出力が変わる直し（bullets のマーカー位置など）と、テストが誤った振る舞いを固定している型の直し（期待値が変わる）。所見は記録に書いて Wave 3 以降へ
- 2 本目の題材の検討と、10/2 の受け入れの結果の反映（Wave 3 の G0）
- `npm audit fix --force`（eslint を 9.19.0 から 9.39.5 へ上げる。low 2 件。lint の規則が変わりうる）
- 文書の書き直し（`docs/inventory.md`・`docs/design.md`・`docs/research/` の既存資料、`SKILL.md` の構成）。`SKILL.md` とコード中のコメントの事実の誤りは直してよい（コメントだけの一括書き換えはしない）
- 研究資料 `docs/research/2026-09-26-image-env.md` の畳み（Wave 3 の着手時のまま）
- CI（GitHub Actions）、点検用の常設スクリプト、計測の仕組みを足すこと

### 起きてはならない

- `deliver/` の変更（1 本目は 10/2 の授業で使う）
- 既存 2 本の compile・render の出力が変わること（検証 3 の物差し）
- テストケースの削除・skip・期待値の書き換え
- 使う側が 1 か所しかない新しい抽象化（汎用化・設定化・層）を足すこと
- `SKILL.md` が指すファイルの削除・改名と、npm scripts の名前・中身の変更
- GitHub に PR・コメントを出すこと（`/code-review` の `--comment` を含む）
- Kyozai-Athanor・Seneschal・ComfyUI_img2 への書き込み、`reference/` の改変と commit
- `CLAUDE.md`・`goal.md`・`docs/brief.md` の無承認変更
- imagegen の版・モデル・ワークフローの変更（`imagegen/versions/`・`imagegen/workflows/`）
- VOICEVOX 音声・第三者素材を CC BY 等で再ライセンスする記述
- 公開リポジトリに秘密情報・`deliver/`・`out/`・imagegen の本体（`ComfyUI/`・`.venv/`・`models/`・`output/`）を入れること
- 検収 PASS の前に作業ブランチを main へ合流すること
