# build-log.md — 「C言語について」を作った記録（手順番号・コマンド・終了コード）

`goal.md` Wave 3 の完了条件 6：`SKILL.md` の手順 0〜7 と対応する。1 行 1 コマンド。終了コードは実測。時刻は JST。

| 手順 | 日時 | コマンド | 終了コード | 備考 |
|---|---|---|---|---|
| 0 | 2026-09-27 07:05 | `node -e "fetch('http://127.0.0.1:50021/version')…"`（curl の代わりに node の fetch） | 0 | VOICEVOX 0.25.2 が稼働中 |
| 0 | 2026-09-27 08:20 | `npm test` | 0 | 18 files / 350 tests passed（Wave 2.5 の締めの状態） |
| 1 | 2026-09-27 09:55 | 一次資料の取得（Ritchie "The Development of the C Language"・WG14・GCC・Python・pico-sdk・Arduino・kernel.org・NumPy・PyTorch・MDN・C99 Rationale・TIOBE） | 0 | 調べ役（general-purpose）が curl と WebFetch で取得し、HTTP 200 を確かめた。`outline.md` の出典 A |
| 1 | 2026-09-27 10:00 | 都城高専 2026 年度シラバスの取得（科目一覧 2 本と科目ページ 20 本） | 0 | 調べ役が取得。2 年以上の科目は URL の year が入学年度。`outline.md` の出典 B |
| 1 | 2026-09-27 10:05 | `node -e "fetch('https://syllabus.kosen-k.go.jp/Pages/PublicSyllabus?school_id=49&department_id=…')"`（台本で使う科目ページ 8 本） | 0 | 8 本とも HTTP 200（本体が確認） |
| 3 | 2026-09-27 09:54 | `npx vitest run src/script-engine/render/about-c` | 0 | 図解部品 3 つのテスト 9 件 passed |
| 3 | 2026-09-27 09:56 | `npm test` | 0 | 19 files / 362 tests passed（部品の追加後）。`npm run lint` exit 0 |
| 2 | 2026-09-27 10:20 | `materials/about-c/outline.md` を書く（対象・尺・章立て 7 章・出典・事実と出典の対応 38 行） | 0 | 完了条件 1 |
| 3 | 2026-09-27 10:15 | `content/scripts/about-c.script.yaml` を書く（56 発話・17 スライド・3,329 字） | 0 | YAML のアンカー（`&`・`<<`）は js-yaml が merge しないので書き下した |
| 3 | 2026-09-27 10:18 | `node <scratchpad>/parse-check.mjs about-c`（`parseScript` と `estimateScriptDuration` だけを tsx で呼ぶ。VOICEVOX は呼ばない） | 0 | parse OK（56・17・17）。予測総尺 495.3 秒。主人の承認待ち。承認後に compile |
