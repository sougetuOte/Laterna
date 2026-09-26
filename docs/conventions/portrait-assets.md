# portrait-assets.md — 自作立ち絵 管理台帳

出自: `docs/specs/script-engine/design.md` §3.3（立ち絵アセット参照）/ §11.3（立ち絵素材の配置規約）
対応タスク: `docs/specs/script-engine/tasks.md` W1-script-engine-T20（本ファイル作成）/
W1-script-engine-T29（納品タスク本体）

## 0. 位置づけ

立ち絵は **自作オリジナルキャラクター**を使用する（ユーザー決定 2026-07-04、design §3.3）。
VOICEVOX 公式キャラクターのデザイン模写・トレースは **行わない MUST NOT**（design §3.3 / NFR-3。
二次創作扱いに戻り第三者規約が再適用されるため）。自作立ち絵はユーザーの著作物として
CC BY 4.0 の適用範囲に含めてよい MAY。

本ファイルは「いつ・どのキャラクターの・どの版の立ち絵を採用したか」を記録する管理台帳であり、
再現性確保（NFR-3）のためのバージョン記録を兼ねる。

## 1. デザイン版数記録テーブル

| キャラ名（asset_key） | 作画者 | 原本所在 | 配置パス | 更新日付 | 版数 / 備考 |
|---|---|---|---|---|---|
| narrator-default | （未記入） | （未記入） | `public/portraits/narrator-default.png` | （未納品） | v1（ラフ・仮絵可、T29 完了条件） |
| listener-default | （未記入） | （未記入） | `public/portraits/listener-default.png` | （未納品） | v1（ラフ・仮絵可、T29 完了条件） |

> 本テーブルは T20 時点でプレースホルダとして作成する。T29（ユーザー立ち絵納品）完了時、
> 納品者（作画者）・原本ファイルの所在・実際の更新日付・版数を追記すること MUST
> （design §11.3「バージョン記録: 使用した立ち絵素材のデザイン版数を記録する SHOULD」）。
> 清書版への差し替え発生時は行を追加せず、既存行を上書き更新し「版数 / 備考」に旧版からの
> 変更点を残す（例: 「v1 ラフ → v2 清書、2026-07-15 差し替え」）。

## 2. ユーザーが立ち絵素材を制作する際の手順

### 2.1 制作前に確認すること

- **公式キャラクターデザインの模写・トレースは禁止 MUST NOT**（NFR-3 / design §3.3）。
  VOICEVOX ずんだもん・玄野武宏（表示キャラクター）等、既存キャラクターの絵柄を参考にする場合も、
  輪郭・配色・意匠を直接なぞる（トレース）ことは禁止。あくまで「オリジナルキャラクターとして
  一から描く／作る」ことが前提
- 対象は 2 名（`narrator` = 解説役 / `listener` = 聞き役、`docs/conventions/speaker-profiles.yaml` 参照）
- ラフ・仮絵での先行納品可（レイアウト検証用）。清書版への差し替えは本 Milestone 内では任意 MAY
  （tasks.md T29 完了条件）

### 2.2 推奨解像度・サイズ（要確認）

design.md には立ち絵の具体的なピクセル寸法の確定値は記載されていない。以下は
design §7（2 話者レイアウト、画面 1920x1080 / 左右各 20% カラム = 各カラム目安 384px 幅）
から逆算した**制作時の目安値**であり、**T15（2 話者レイアウト実装）着手時に実装側で
再確認・確定する要確認事項**として扱うこと。

| 項目 | 目安値（要確認） | 根拠 |
|---|---|---|
| キャンバス解像度 | 縦長 800×1600px 程度（要確認） | 1920x1080 画面の左右 20% カラム（幅 384px 相当）に収まり、かつ拡大縮小の余地を持たせるため高めの解像度で用意する目安 |
| ファイル形式 | **PNG（透過背景必須）** | 立ち絵は画面上に背景なしで重畳表示されるため、アルファチャンネル付き透過 PNG が必須 |
| 余白 | キャラクター上下左右に軽い余白を残す（トリミングし過ぎない） | Remotion 側での `transform: scale()` 調整（design §6.3 と同様の縮小配置）に耐えられるようにするため |
| カラーモード | RGBA、sRGB | 一般的な Web/動画制作の標準に準拠 |

**確定手順**: 上記目安値で先行納品し、T15/T16（Remotion 統合・Studio プレビュー検証）で
実際のレイアウト崩れ・解像度不足が確認された場合、本テーブルおよび本節を更新する。

### 2.3 配置パス

制作した PNG ファイルは以下のパスに配置する MUST（design §11.3）:

```
public/portraits/<asset_key>.png
```

- `narrator` 役の立ち絵: `public/portraits/narrator-default.png`
- `listener` 役の立ち絵: `public/portraits/listener-default.png`
- `<asset_key>` は `docs/conventions/speaker-profiles.yaml` の `portrait.asset_key` と
  一致させること MUST（論理キー経由の解決規約、design §3.3）
- **commit 対象**（第三者素材ではないため NFR-3 v2.1 の同梱禁止は適用されない）。gitignore
  対象にしないこと

### 2.4 欠落時の挙動（参考）

立ち絵アセットが欠落した状態で compile/render を実行した場合、明示エラーで停止する MUST
（design §4.4）。プレースホルダでの黙認続行は行われない。制作・納品が遅延する場合は
Wave 3 着手前（T15/T16 着手前）までに少なくとも仮絵版を納品すること（tasks.md T29 完了条件）。

## 3. 参照

- `docs/specs/script-engine/design.md` §3.3 / §11.3 / §7.5（エンドロールクレジット表記の出典）
- `docs/conventions/speaker-profiles.yaml`（`portrait.asset_key` の定義元、T20 成果物）
- `docs/specs/script-engine/tasks.md` W1-script-engine-T20 / W1-script-engine-T29
