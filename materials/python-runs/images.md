# images.md ── 「Pythonが動くまで」の画像の出典の記録（Wave 5）

台本 `content/scripts/python-runs.script.yaml` の `type: image` のスライドで使う画像の記録。契約は `goal.md` の Wave 5 節、引用の扱いは `docs/brief.md` §9 の D7 訂正。
ファイルは `public/images/python-runs/` に置く。

## 1. CPU の写真（`cpu.jpg`、スライド `slide-cpu-photo`）

| 項目 | 内容 |
|---|---|
| 入手元 | Wikimedia Commons「File:Cpu 1.jpg」 https://commons.wikimedia.org/wiki/File:Cpu_1.jpg |
| ライセンス | CC0 1.0（Commons のファイルのページの表示。http://creativecommons.org/publicdomain/zero/1.0/deed.en） |
| 作者 | blickpixel（Pixabay。Commons の記載の出所：https://pixabay.com/photos/cpu-processor-macro-pen-pin-564771/） |
| 撮影日 | 2014-11-15（Commons の記載） |
| 元の大きさ | 3825×2550（Commons の SHA-1 `a31972450a9ac5a8cf990f7d40035a0104a71aba`） |
| 取った物 | Commons の縮小版（幅 1920px、1920×1280）。2026-10-03 に Commons の API（`imageinfo`、`iiurlwidth=1920`）で取得した |
| 加工 | 縮小だけ（Commons が作った縮小版をそのまま使う） |
| 写っている物 | CPU（ピンの面）だけ。人・文字・ロゴは写っていない |
| ファイルの SHA-256 | `2290c83bf8659e8d3398489af4c7a2523f169d7d6d49ca7cd244524cd43ebb1b` |

## 2. python.org のダウンロードのページの画面写し（`python-org-downloads.png`、スライド `slide-python-org`）

| 項目 | 内容 |
|---|---|
| ページ | https://www.python.org/downloads/ |
| 権利者 | Python Software Foundation |
| 扱い | 著作権法 32 条の引用（brief §9 の D7 訂正）。CC BY 4.0 の対象外 |
| 取得日 | 2026-10-03 |
| 撮り方 | 主人が自分のブラウザでページを開き、画面を撮った（1607×682 の PNG）。Claude の内蔵ブラウザは python.org を開けなかった |
| 加工 | 切り抜きだけ（下端の 42px を落とし 1607×640 にした。`magick <元> -crop 1607x640+0+0 +repage <先>`） |
| 写っている物 | Python のロゴ、ページの上の案内、「Download the latest version for Windows」と「Python for Windows, Linux/Unix, macOS, Android, iOS, other」の並び、ページの挿絵 |
| 引用の理由 | 6 章「なぜ OS を選ばないのか」で、OS ごとに Python 本体が用意されていることを、公式のページで見せる |
| ファイルの SHA-256 | `1436943a430d1505a5e6b852fe24add2d7eb4f4b07af02ddb8f5e3fcbc7345a3` |

画面に出る Python の版（取得日の最新版）は、動画の例示に使った 3.11.9 とは違う。動画では版には触れない。
