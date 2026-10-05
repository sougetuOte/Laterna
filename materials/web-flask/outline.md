# web-flask 構成 ── 「Webサーバーと Flask のしくみ」

台本承認：2026-10-06 主人（「台本、基本承認します」。同じ発話で、conda が依存関係を管理してくれること・新しい uv があること・教科書が 2022 年なので conda を選んだことを足す指示。足した u-040〜u-043 と `slide-tools` は試写で見てもらう）

## 対象

- 汎用。Python の文法を少し習った人。最初に使うのは 2026-10-06 の Flask の授業の初回（9:00）。動画・PDF・概要欄に学校名を出さない（goal.md Wave 6）。
- 使用場面：授業中に流す。動画の後に、先生が conda で仮想環境を作る作業をする。
- 授業の環境：Python 3.10、Flask 2.3.2（教科書が 2022 年のもの）、conda。
- 例のコードは、この機械の Python 3.11.9 で scratchpad に作った venv（Flask 2.3.2）で動かした。画面には Python の版で変わる物を出していない。

## 尺

- 目標 300〜420 秒（5〜7 分）。台本は 47 発話。compile の予測 345.2 秒、実測 362.0 秒（クレジット区間を含む）。

## 章立て

1. 導入：URL を打つとページが出る。その裏側（u-001〜u-003）
2. Web サーバーとは：クライアントとサーバー、リクエストとレスポンス、HTTP、静的と動的（u-004〜u-010）
3. URL の読み方：`http://127.0.0.1:5000/` をスキーム・コンピュータ・ポート・パスに分ける（u-011〜u-017）
4. Flask とは：最小のアプリを 1 行ずつ。`@app.route("/")` と返り値がレスポンスになること（u-018〜u-023）
5. 動かす：`flask --app hello run` の出力、200 と 404、Ctrl+C、開発用サーバーの注意（u-024〜u-030）
6. 仮想環境：部品の置き場、よいところ 3 つと困るところ 3 つ、conda の依存の管理と uv、この授業は conda（u-031〜u-043）
7. まとめ 3 点（u-044〜u-047）

## 出典

下の「事実と出典の対応」の URL は、2026-10-06 に node の `fetch` で取得し、23 本とも HTTP 200 を返した。「該当箇所」の英文は、取得した本文にあることを文字列の一致で確かめた（Python 公式チュートリアルなど一部は要約）（調べ物の控えは scratchpad の `research-web-flask.md`。repo には入れない）。

## 事実と出典の対応

| 台本の事実 | 出典 | 該当箇所（原文） |
|---|---|---|
| 最小のアプリのコード（`hello.py`）と `@app.route("/")` | https://flask.palletsprojects.com/en/stable/quickstart/ | "A Minimal Application"、"We then use the route() decorator to tell Flask what URL should trigger our function." |
| `flask --app hello run` で起動し、http://127.0.0.1:5000 で開く | 同上 | "To run the application, use the flask command"、"Running on http://127.0.0.1:5000 (Press CTRL+C to quit)" |
| `--app` は Flask 2.2.0 から使える（2.3.2 で使える根拠） | https://flask.palletsprojects.com/en/stable/changes/ | Version 2.2.0 の "Added the --app option" |
| 開発用サーバーは本番に使わない | https://flask.palletsprojects.com/en/stable/server/ | Development Server の頁の Warning（"Do not use the development server when deploying to production."） |
| 画面の出力（`Running on`・`WARNING`・`GET / … 200`・`GET /nothing … 404`） | この機械で実行（Flask 2.3.2、Werkzeug 3.1.9、Python 3.11.9、2026-10-06） | `materials/web-flask/build-log.md` の手順 1 |
| Flask 2.3.2 は Python 3.8 以上で入る（授業の 3.10 で使える） | https://pypi.org/project/Flask/2.3.2/ | Requires: Python >=3.8 |
| Flask の最新の安定版は 3.1.3（スライドの「別の作品」の例） | https://pypi.org/project/Flask/ | 3.1.3（2026-02-19）、Requires: Python >=3.9 |
| クライアントとサーバー、リクエストとレスポンス | https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview | "HTTP is a protocol for fetching resources such as HTML documents."、client-server protocol |
| 置いてあるファイルを返す（静的）／その場で作って返す（動的） | https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server | "the server sends its hosted files as-is"、"the application server updates the hosted files before sending content" |
| URL はスキーム・ドメイン・ポート・パスに分かれる | https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL | Scheme・Authority（domain, port）・Path to resource |
| ポートは窓口の番号 | https://developer.mozilla.org/en-US/docs/Glossary/Port | "a port is a communication endpoint. Ports are designated by numbers" |
| 127.0.0.1 は自分自身（ループバック） | https://www.rfc-editor.org/rfc/rfc1122.html ・ https://www.rfc-editor.org/rfc/rfc6890.html | RFC 1122 §3.2.1.3、RFC 6890 の 127.0.0.0/8「Loopback」 |
| localhost は自分自身を指す名前 | https://www.rfc-editor.org/rfc/rfc6761.html | §6.3 |
| GET はリソースを求める頼み方 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/GET | "The GET HTTP method requests a representation of the specified resource." |
| 200 はうまくいった、404 はページが無い | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/200 ・ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404 | 200 OK "request has succeeded"、404 Not Found "server cannot find the requested resource" |
| Flask は Python に後から入れる部品で、仮想環境を勧めている | https://flask.palletsprojects.com/en/stable/installation/ | "Virtual environments" の節 |
| 仮想環境はプロジェクトごとに別のパッケージの版を持てる | https://docs.python.org/3/tutorial/venv.html | "a self-contained directory tree that contains a Python installation for a particular version of Python, plus a number of additional packages" |
| conda の環境は互いに干渉しない、切り替えて使う | https://docs.conda.io/projects/conda/en/stable/user-guide/tasks/manage-environments.html | "Conda allows you to create separate environments"、`conda activate` |
| 同じ組み合わせを別のパソコンで作り直せる | 同上 | "Sharing an environment"（environment.yml） |
| conda と pip を混ぜると壊れることがある | https://www.anaconda.com/blog/using-pip-in-a-conda-environment | "Running conda after pip has the potential to overwrite and potentially break packages installed via pip." |
| conda は部品同士の依存を管理する | https://docs.conda.io/projects/conda/en/stable/index.html ・ https://docs.conda.io/projects/conda/en/stable/user-guide/concepts/packages.html | "Conda provides package, dependency, and environment management"、"Conda keeps track of the dependencies between packages and platforms." |
| uv は 2024 年に出た、速い新しい道具 | https://pypi.org/project/uv/ ・ https://docs.astral.sh/uv/ | PyPI の最初の版 0.0.5 は 2024-02-15。"An extremely fast Python package and project manager"、"10-100x faster than pip" |

**言わなかったこと：**「conda の環境は容量を食う」は言わない（conda 公式は "Environments take up little space thanks to hard links." と書いている）。

## 授業の環境についての実測（台本には入れない。主人への報告）

`pip install flask==2.3.2` だけだと Werkzeug 3.1.9 が入り、`flask --version` が `AttributeError: module 'werkzeug' has no attribute '__version__'` で落ちる。`werkzeug==2.3.8` に固定すると落ちない。最小のアプリの起動とアクセスは、どちらでも動いた（2026-10-06、build-log の手順 1）。
