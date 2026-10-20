# images.md ── 「ネットワークの地図」の画像の出典の記録（Wave 7）

台本 `content/scripts/network-map.script.yaml` の `type: image` のスライドで使う画像の記録。契約は `goal.md` の Wave 7 節。
ファイルは `public/images/network-map/` に置く。継承（SA）の条件が付いた CC の画像は使わない（brief D7）。

## 1. 補助資料の自作の図 5 枚（`license: self`）

この授業の補助資料（repo の外）のために作った図。依頼書と補助資料の画像の出典の記録が「自由に使ってよい。repo にコピーしてよい」としている。
依頼のフォルダの `補助資料の画像/` の PNG（横 1600px）を、名前だけ変えてそのまま写した（中身は変えていない。SHA-256 は元と同じ）。

| ファイル | 元の名前 | スライド | 写っている物 | SHA-256 |
|---|---|---|---|---|
| `01-switching.png` | `01_回線交換とパケット交換.png` | `slide-switching` | 回線交換とパケット交換の比較。パケット 1 個の中身（宛先・送り主・番号・データの一部） | `db69025dffd6d59fa1de11e6568bdba756bae234c7db4bfbcc98e49074590632` |
| `04-ipv4.png` | `04_IPv4アドレスの2進と10進.png` | `slide-ipv4` | 11000000.10101000.00001010.00000011 → 192.168.10.3 | `e2cdaa508d0712fd9323689ab1cd86b6c2ed0a9a95229ab8289c2fc1cf8cc3a5` |
| `05-local-global.png` | `05_ローカルとグローバルIP.png` | `slide-local-global` | 家の中の機器（192.168.1.x）、ルータ（内側 192.168.1.1／外側 203.0.113.25）、インターネット。203.0.113.x は RFC 5737 の説明用の番号 | `ba99b86c2c079a080b48892089716ccb08b8bc4f44cf7193c9fc96d6e1ae0841` |
| `06-tcpip-layers.png` | `06_TCPIPの4層と手紙のたとえ.png` | `slide-layers` | TCP/IP の 4 つの層と、手紙にたとえた役割 | `4d4a43b393e239e49d0695305c3a9a9248340c9adf7f424f2bd44a5e4c8cee4d` |
| `07-home-network.png` | `07_家庭のネットワーク機器の並び.png` | `slide-home` | インターネット → ONU → ルータ → ハブ／アクセスポイント → 機器 | `b72ed4cfc9164f83aaef971e5a7214d1858a4d2054f734a1519571805fdd43c6` |

台本の `source` は `source_url: self`・`license: self`・`author: この授業の補助資料の図`・`modifications: none`。

## 2. ARPANET の地図（`arpanet-1977.png`、スライド `slide-arpanet`）

| 項目 | 内容 |
|---|---|
| 入手元 | Wikimedia Commons「File:Arpanet logical map, march 1977.png」 https://commons.wikimedia.org/wiki/File:Arpanet_logical_map,_march_1977.png |
| ライセンス | パブリックドメイン（Commons の記載："This work is in the public domain in the United States because it was published in the United States between 1931 and 1977, inclusive, without a copyright notice."） |
| 作者 | ARPANET（Commons の記載。所蔵は Computer History Museum） |
| 取った物 | 依頼のフォルダの `補助資料の画像/web_ARPANETの地図_1977.png`（1000×716。Commons の元と同じ大きさ）をそのまま写した |
| 加工 | なし |
| ファイルの SHA-256 | `6ef630b1c80ded5a89f0f52b9bb687ba3ea56c794b17f37fd56db0267c495b5e` |

## 3. 光ファイバの写真（`fiber.jpg`、スライド `slide-fiber`）

依頼書が挙げた、継承（SA）の条件が付いた CC 3.0 の写真（光ケーブル）の代わり。G0 の答え（問 2「代わりになる画像を軽く探す」）で、Commons を CC0・PD・CC BY に限って探して選んだ。

| 項目 | 内容 |
|---|---|
| 入手元 | Wikimedia Commons「File:Optical patchcord.jpg」 https://commons.wikimedia.org/wiki/File:Optical_patchcord.jpg |
| ライセンス | CC BY 4.0（https://creativecommons.org/licenses/by/4.0） |
| 作者 | Sunmosk |
| 撮影日 | 2020-11-18（Commons の記載） |
| 説明 | "Laser light diffuses through the optical fiber during propagation"（Commons の記載。カテゴリ Optical fibers） |
| 元の大きさ | 3096×5504（縦長。ファイルの中の画素は 5504×3096 で、向きの情報で縦にしている） |
| 取った物 | 元のファイル（https://upload.wikimedia.org/wikipedia/commons/c/cd/Optical_patchcord.jpg）を 2026-10-19 に node の `fetch` で取得した |
| 加工 | 向きを直し、切り抜き、縮小した：`magick <元> -auto-orient -crop 2838x3321+258+710 +repage -resize x1400 -strip -quality 85 fiber.jpg`（1196×1400）。キャプションに「写真は切り抜き・縮小」と書く |
| 写っている物 | 黒い板の上で輪を描く光ファイバと、中を進む赤いレーザーの光。人・文字・ロゴは写っていない |
| ファイルの SHA-256 | `a00775edf87eb9fff634413a6e46f7edfaa1410430253a65614099f6003039d2` |

## 4. 探したが載せなかった物

- 最初の Web サーバ（CERN の NeXT）の写真：Commons を CC0・PD・CC BY で探した（検索語 `NeXT computer CERN web server`・`first web server Berners-Lee NeXT`・`intitle:NeXTcube` ほか）。CERN のその機械の写真で、許可するライセンスの物は見つからなかった。同じ型の NeXTcube の写真（CC BY 2.0）はあったが、その機械ではないので使わない。
- 補助資料の図 02（通信手段の距離と速さ）と 03（海底ケーブルの断面）は使わない。02 の目盛りの数値を出典で確かめる時間を取らず、表（CompareTable）で言葉だけにした。
