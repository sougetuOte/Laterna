# Wave 3「2 本目：C言語について」G0 草案（第 1 版）

**状態：草案（主人の承認待ち）。**承認されたら `goal.md` の末尾に移し、本ファイルは畳む（Wave 2 と同じ）。
**種別：feature（2 本目の動画制作）。期限：2026-10-01（木）**（10/2 の授業で使う）。
**起点：**Wave 2.5 の締め `c4e6ffe`（main）。作業は main の上で進める（エンジンは触らないので、ブランチは切らない）。
**採点範囲：**本 Wave の成果コミット（起点から HEAD まで。`goal.md` への節の追記、主人の別指示による直し、`SESSION_STATE.md` の締めを除く）。

## 主人の答え（2026-09-27、チャット、セッション `dbf265b1-7f84-42eb-91c5-39487434671c`）

| 問い | 答え |
|---|---|
| 題材 | 「C言語について」。章は (1) どんな言語か（低水準・高水準）(2) 作られたきっかけと簡単な歴史 (3) 得意・不得意（コンパイラ・インタプリタ。機械制御・パソコンのプログラム・AI・Web）(4) 電気情報工学科・機械工学科が C を学ぶ意義 (5) AI 時代に手で書く意義 |
| 対象 | 都城高専 電気情報工学科 1 年（プログラミング言語入門）・機械工学科 3 年（情報処理Ⅰ）。どちらも半期 |
| 尺 | 8〜10 分（推奨どおり） |
| 本数 | 2 学科共通の 1 本。「学ぶ意義」の章だけ学科ごとの小見出しに分ける（推奨どおり） |
| 氏名と学校名 | **案 B**：学校名・学科名・科目名は出す。**個人名は出さない**（「この授業の担当の先生」と言う） |
| 最初に使う日 | 2026-10-02 |
| 1 本目の直し（R1〜R3） | この Wave に入れない。2 本目を納めた後に別の小さな回で直す（推奨どおり） |

主人が示した事実（台本では「担当の先生の説明」として扱い、シラバスで確かめられた物は出典を付ける）：
電気情報工学科は 2 年でも同じ先生が C 言語を担当する（プログラミング言語Ⅰ）。3 年では別の先生が CASL2（アセンブラ言語）を扱い、C の考え方を押さえてから進まないとついていくのが難しい。
機械工学科・電気情報工学科とも、計測機器や 1 ボードコンピュータを扱うときに C が必須になる。2E・3E のプログラミング言語は通年のはず（未確認）。

## 完了条件

1. **構成と出典**：`materials/about-c/outline.md` に見出し「対象」「尺」「章立て」「出典」「事実と出典の対応」がある。章立ては 5〜7 章。
   「事実と出典の対応」は、台本に出る事実（年・人物・組織・規格名・科目名・学年・開講期間）を 1 行ずつ出典の URL に対応させた表。出典は一次資料（規格団体・開発元・当事者の文書、高専のシラバス）。主人の説明に拠る事実は出典欄に「主人の説明（2026-09-27）」と書く。
   学年ごとの科目（今年・来年・再来年）は、2 学科のシラバスの科目ページで確かめた物だけを台本に入れる。
2. **台本**：`content/scripts/about-c.script.yaml` があり、compile が通り、実測の総尺が 480〜600 秒に入る。主人が台本本文を承認した記録がある（台本の本文は compile の前に表で見せる）。
3. **動画と PDF**：`npm run render:all:script -- about-c` を 1 回実行するだけで `out/script-engine/about-c.mp4` と `.pdf` が出る（手作業の補正なし）。
4. **クレジットと出典**：manifest の `credits[]` に VOICEVOX 2 話者と立ち絵の行がある。`materials/about-c/description.md` に内容紹介・出典・クレジットがある。
5. **個人名を出さない**（主人の答え：案 B）：本 Wave で追加・変更した追跡ファイルと納品物に、主人の氏名が現れない。
6. **納品**：`deliver/about-c/` に MP4・PDF・`description.md` の 3 点がある。作業の記録 `materials/about-c/build-log.md` に「手順番号・実行したコマンド・終了コード」がある。
7. **既存の 2 本を壊さない**：source-to-exe・java-vs-js の compile・render の出力が変わらない。テストと lint が通る。
8. **Wave 2.5 からの持ち越し**（Seneschal `loop.md`「前のフェーズから持ち越す物を、検証方法の行にする」）：検収 2 回目（HEAD `985a8ed`）の後のコミット `464029b`（点検の記録 R41 の 1 文）・`c4e6ffe`（`SESSION_STATE.md` の締め）と、締めで書いた状態の主張が確かめられている。

**主人の受け入れ**（columba の採点対象外）：10/2 の授業で使えると主人が判断すること。使えなかった点は次の Wave の G0 に書く。

## 検証方法

columba が採点する。各項は上の完了条件と同じ番号で対応する（8 対 8、対応の無い条件は無い）。

1. `outline.md` に 5 つの見出しがある（grep）。「章立て」の下の章が 5〜7 個。
   「事実と出典の対応」の出典 URL を評価器が取得して、全件が応答する（HTTP 200）。そのうち年・人物・規格名の行は全件、科目名・学年の行は 2 学科から 2 件ずつ、出典の本文に同じ事実があることを確かめる。
   台本 YAML の発話・スライドの文字列に出る西暦（4 桁の数字）と科目名が、どれも対応表のどこかの行にある。
2. `npm run compile:script -- about-c` が exit 0。`public/manifests/about-c.manifest.json` の `total_duration_frames / fps` が 480〜600。
   `outline.md` に「台本承認：YYYY-MM-DD 主人」の 1 行があり、その承認の発話が本 Wave のセッションの記録に主人の発話として在る。
3. 評価器が `out/script-engine/about-c.*` を消してから `npm run render:all:script -- about-c` を 1 回実行し、exit 0 で `.mp4` と `.pdf` が両方できる。`ffprobe` で映像・音声の両ストリームがあり、尺が manifest の `total_duration_frames / fps` と ±1 秒。PDF のページ数が `about-c.pdf-manifest.json` の `total_pages` と一致。
4. manifest の `credits[]` に `VOICEVOX:` で始まる行が 2 つと「立ち絵」を含む行が 1 つある。`description.md` に見出し「出典」「クレジット」がある。
5. `git diff --name-only c4e6ffe..HEAD` の各ファイルと `deliver/about-c/description.md` に、主人の氏名（姓・名・読みのどれか）が 0 件（grep）。`about-c.pdf` の本文テキスト（`pdf-lib` か `pdftotext`）にも 0 件。
6. `deliver/about-c/` に 3 ファイルがあり、`.mp4` と `.pdf` の SHA-256 が `out/script-engine/` の物と一致する。`build-log.md` の各行にコマンドと終了コードがある。
7. Wave 2.5 の検証 3 と同じ手順：(a) compile 2 本の後 `git diff --exit-code 6cbaf95 -- public/manifests/source-to-exe.* public/manifests/java-vs-js.* public/audio/source-to-exe public/audio/java-vs-js` が exit 0。(b) source-to-exe の MP4・PDF の SHA-256 が `deliver/source-to-exe/` の物（`43a78b42…9c4e`・`c94e503f…db55`）と一致。(c) 立ち絵を `805d312` の v1 に一時的に戻した java-vs-js の MP4・PDF が Kyozai の参照（`e121b799…ab5d`・`ef400230…0ddf`）と一致し、戻した後に `git status --porcelain` に `public/portraits` が無い。
   `npm test` が exit 0 で 350 件以上 PASS、`npm run lint` が exit 0。`git diff c4e6ffe..HEAD -- 'src/**/*.test.*'` でテストの削除・skip・期待値の書き換えが 0。
8. (i) `464029b` の 1 文（`out/script-engine-pdf-temp/` は空のディレクトリとして残る）を、評価器が render の後に `ls -la` で確かめる。
   (ii) `c4e6ffe` の `SESSION_STATE.md` の状態の主張のうち、次を指す場所で確かめる ──「main に fast-forward で合流」（`git merge-base --is-ancestor 985a8ed c4e6ffe` と、`c4e6ffe` の親が 1 つ）／「npm test 350 件・lint exit 0」（→ 7）／「書き出しの一致」（→ 7）／「retro は起動しない（FAIL 1 回）」（Wave 2.5 の検収の返り値が本 Wave のセッションの記録に FAIL 1 回・PASS 1 回で在る）。
   **主人の言葉を引く行**（上の「主人の答え」の表）は、主人が本 G0 を承認したこと自体を記録とする。

## やらないこと

### この Wave ではやらない（次以降で扱う）

- 1 本目の直し（点検の記録 R1〜R3）。2 本目を納めた後に別の小さな回で直す
- 点検の記録で「Wave 3 以降へ」とした行（R5〜R7・R9・R10・R19〜R21・R23・R24・R26・R37・R46 の計算・R48〜R52）。締めで `SESSION_STATE.md` の未決に移す
- エンジンへの機能の追加：字幕・SRT、口パク・まばたき、audio_query の保存、画像スライド（`type: image`）と出典台帳、`manifest-registry.ts` の廃止（(c)）
- 依存の追加・削除・更新
- 学科別に 2 本に分けること

### 起きてはならない

- 主人の氏名を台本・音声・動画・PDF・概要欄・リポジトリに出すこと（案 B）
- 人物の写真やネット上の画像・ロゴを使うこと（図解はコードで描く。SKILL.md「守ること」の 3 経路）
- 確かめられなかった事実を台本に入れること（主人の説明に拠る物は「担当の先生の説明」として出典欄に書く）
- 既存 2 本（source-to-exe・java-vs-js）の出力を変えること、`deliver/source-to-exe/` に触ること
- `src/` のエンジン部分（compiler・schema・pdf・render の共通部品）の変更。足してよいのは `src/script-engine/render/about-c/` の custom 部品と、`manifest-registry.ts`・`component-registry.ts` への登録（SKILL.md 手順 4）
- Kyozai-Athanor・Seneschal・ComfyUI_img2 への書き込み、`reference/` の改変
- `CLAUDE.md`・`goal.md`・`docs/brief.md` の無承認変更
- 期限を越える範囲の拡大：10/1 に間に合わないと分かったら、章と尺を削って出す（下限 480 秒を割るなら主人に 1 通で問う）
