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
