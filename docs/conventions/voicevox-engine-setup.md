# voicevox-engine-setup.md — VOICEVOX Engine 起動手順

出自: `docs/specs/script-engine/design.md` §11.2（npm scripts 体系、Engine 起動手順の委譲先）
対応タスク: `docs/specs/script-engine/tasks.md` W1-script-engine-T20 / W25-script-engine-T25 副次

## 0. 位置づけ

script-engine の `compile:script`（台本 → VOICEVOX 音声合成 → WAV → manifest 生成）は
**ローカル PC + ローカル VOICEVOX Engine 前提**（design §0.1 Non-Goals: CI / 自動レンダリング
環境対応は非スコープ）。compile 実行前に VOICEVOX Engine が `localhost:50021` で起動・応答している
ことを人間が確認する必要がある（design §4.4「VOICEVOX Engine 起動なし/無応答（compile 時）→
即座にエラー終了。無音 WAV 代替やタイムアウト後のスキップは行わない MUST NOT」）。

Engine の起動・稼働はインタラクティブなデスクトップアプリの操作であり、L2/L1 が CLI から
自動起動することは想定しない（tasks.md T25 副次注記: 「L2 が CLI で自動化することは検討から
除外（Engine は本来インタラクティブアプリ）」）。

## 1. 入手（要確認）

VOICEVOX Engine は VOICEVOX 公式サイト（`https://voicevox.hiroshiba.jp/`）からダウンロード可能
（一般に公開されている事実。ただし配布ページの URL・ファイル名・バージョン番号は本セッションでは
裏取りしていない **要確認事項**）。

- 入手前に `.claude/rules/upstream-first.md` に従い、実際にダウンロードする際は公式サイトの
  最新配布ページで OS（Windows）・エディション（GPU 版 / CPU 版）を確認すること SHOULD
- 過去の kosen-w12-system-dev Milestone で実際に使用した Engine のバージョンは
  `public/manifests/<script-id>.manifest.json` の `voicevox_engine_version` フィールド
  （design §4.3）に記録されている実績がある場合、そちらを一次情報として優先参照する

## 2. 起動確認（health check）

Engine 起動後、以下の `curl` コマンドでバージョン情報が返れば起動確認完了とする。

```bash
curl http://localhost:50021/version
```

- 正常時: バージョン文字列（例: `"0.14.x"` 相当、二重引用符付き JSON 文字列）が返る
- 無応答・接続エラーの場合: Engine が未起動、またはポート `50021` が別プロセスに占有されている
  可能性がある。Engine アプリのウィンドウが起動しているか確認すること

design §4.4 のエラー設計と対応: この health check で無応答を確認した場合、compile を実行しても
即座にエラー終了する（design §4.4 の意図通りの正常な fail-fast 挙動であり、compile 側のバグではない）。

## 3. Windows Git Bash での起動手順（例示）

本プロジェクトの実行環境は Windows 11 + Git Bash（`.claude/rules/core-identity.md` は対象外だが、
`CLAUDE.md` §Execution Environment に準拠しパスはフォワードスラッシュで記載する）。

### 3.1 GUI から起動する場合（推奨・最も単純）

1. VOICEVOX Engine（または VOICEVOX 本体アプリ）をエクスプローラーから起動する
2. 起動完了まで数秒〜十数秒待つ（初回起動はモデル読み込みでさらに時間がかかる場合がある）
3. Git Bash で health check（§2）を実行し、起動完了を確認してから `compile:script` を実行する

### 3.2 コマンドラインから起動する場合（例示、要確認）

VOICEVOX Engine を展開したディレクトリに `run.exe`（またはそれに相当する実行ファイル）が
含まれる配布形態の場合、Git Bash からは以下のように起動できる（**実行ファイル名・配置パスは
配布物のバージョンにより異なるため要確認**、下記はあくまで呼び出し例のテンプレート）:

```bash
# 例: Engine 展開先が D:/tools/voicevox-engine の場合
cd "D:/tools/voicevox-engine" && ./run.exe &
```

- `run.exe` をバックグラウンド起動（`&`）し、起動完了を health check（§2）で確認してから
  次のコマンド（`compile:script` 等）を実行する運用を推奨する
- ポート番号を変更したい場合は `--port` 相当の起動オプションが用意されている配布形態がある
  （オプション名は配布物のバージョンにより異なるため、実行前に `run.exe --help` 相当で確認すること SHOULD）

### 3.3 起動確認済みの状態で compile を実行する

```bash
curl http://localhost:50021/version   # 起動確認
npm run compile:script -- <script-id>  # design §11.2 の npm scripts 体系
```

`compile:script` 実行中に Engine 未起動が検知された場合、design §4.4 の通り即座にエラー終了する。
無音 WAV や部分的な結果でのスキップは行われない。

## 4. Engine バージョン差異への注意

design §4.2「Engine バージョン検知」の通り、`manifest` に記録された `voicevox_engine_version` と
現在起動している Engine のバージョンが不一致の場合、compile は警告を表示する（自動再合成はしない、
`--force-resynth` 明示指定時のみ）。セッションをまたいで作業する際は、前回セッションと同一バージョンの
Engine を使い続けることを推奨する（R-2: VOICEVOX Engine バージョン差異による WAV 非決定性、
tasks.md リスク一覧参照）。

## 5. 参照

- `docs/specs/script-engine/design.md` §4.2（Engine バージョン検知）/ §4.4（エラー設計）/
  §11.2（npm scripts 体系）
- `docs/specs/script-engine/tasks.md` W1-script-engine-T20 / W25-script-engine-T25
- `.claude/rules/upstream-first.md`（新規ダウンロード・バージョン確認時の裏取り原則）
