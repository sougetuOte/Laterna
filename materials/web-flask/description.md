# 概要欄 ── Webサーバーと Flask のしくみ（Laterna 4 本目、script-id: `web-flask`）

動画の概要欄・配布ページに貼る文面。`goal.md` Wave 6 の完了条件 4。出典は `outline.md` の「事実と出典の対応」と同じ。

## 内容紹介

Python で Web アプリを作り始める人に向けて、解説役と聞き役の掛け合いで「ブラウザにページが表示されるまでに何が起きているのか」と「Flask が何をしてくれるのか」を説明します。
ブラウザ（クライアント）が頼み（リクエスト）、Web サーバーが返す（レスポンス）こと、その決まり事が HTTP であること、URL の読み方（`http://127.0.0.1:5000/`）を見たあと、Flask の公式のクイックスタートにある最小のアプリを 1 行ずつ読み、実際に動かした画面で 200 と 404 を確かめます。
最後に、Flask のような部品を入れる前に知っておきたい「仮想環境」のよいところと困るところ、conda と uv を紹介します。

- 対象：Python の文法を少し習った人。授業中に流す想定
- 尺：約 6 分 2 秒（manifest の値 362.0 秒）
- 画面のコードと実行結果は Flask 2.3.2 で動かした物です（Windows）
- 復習用 PDF（12 ページ、A4 縦）を同じ台本から書き出しています

## 出典

1. Flask, "Quickstart" ── https://flask.palletsprojects.com/en/stable/quickstart/
2. Flask, "Changes"（`--app` は 2.2.0 から）── https://flask.palletsprojects.com/en/stable/changes/
3. Flask, "Development Server" ── https://flask.palletsprojects.com/en/stable/server/
4. Flask, "Installation"（仮想環境）── https://flask.palletsprojects.com/en/stable/installation/
5. PyPI, Flask 2.3.2 ── https://pypi.org/project/Flask/2.3.2/ 、Flask ── https://pypi.org/project/Flask/
6. MDN, "Overview of HTTP" ── https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview
7. MDN, "What is a web server?" ── https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server
8. MDN, "What is a URL?" ── https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL
9. MDN, "Port" ── https://developer.mozilla.org/en-US/docs/Glossary/Port
10. MDN, "GET" ── https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/GET 、"200 OK" ── https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/200 、"404 Not Found" ── https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404
11. RFC 1122 §3.2.1.3 ── https://www.rfc-editor.org/rfc/rfc1122.html 、RFC 6890 ── https://www.rfc-editor.org/rfc/rfc6890.html 、RFC 6761 §6.3 ── https://www.rfc-editor.org/rfc/rfc6761.html
12. Python Tutorial, "Virtual Environments and Packages" ── https://docs.python.org/3/tutorial/venv.html
13. conda, "Managing environments" ── https://docs.conda.io/projects/conda/en/stable/user-guide/tasks/manage-environments.html 、"Conda packages" ── https://docs.conda.io/projects/conda/en/stable/user-guide/concepts/packages.html
14. Anaconda, "Using Pip in a Conda Environment" ── https://www.anaconda.com/blog/using-pip-in-a-conda-environment
15. uv ── https://docs.astral.sh/uv/ 、PyPI ── https://pypi.org/project/uv/

## クレジット

- 音声合成：VOICEVOX（https://voicevox.hiroshiba.jp/）
  - 解説役：VOICEVOX:玄野武宏
  - 聞き役：VOICEVOX:ずんだもん
  - 各キャラクターの音声の利用条件は、それぞれの利用規約に従います。**音声は下記 CC BY 4.0 の対象ではありません。**
- 立ち絵：Laterna オリジナル（Laterna の画像環境 imagegen、FLUX.2 [klein] 4B で生成。記録は `materials/portraits/`）
- 図解：コードで描画（Remotion／React。3 本目の部品 `RunFlow` を使用）。第三者の画像・音楽・効果音は使っていません
- 制作：Remotion（https://www.remotion.dev/）で書き出し
- ライセンス：台本・図解・教材本文（この動画の Laterna 側の著作物）は CC BY 4.0（`LICENSE-CONTENT`）。コードは MIT（`LICENSE`）。VOICEVOX の音声は対象外
