# 脚本ドラフト: JavaとJavaScriptはどう違うの？

- **テーマ**: JavaScript の命名の経緯（1995 年のマーケティング事情）
- **想定尺**: 60〜90 秒（台詞合計 643 文字、空白を除く・句読点を含む）
- **受け手**: プログラミング初学者（Java と JavaScript を混同している状態からスタート）
- **話者**: narrator = 解説役（講師 / 玄野武宏想定）、listener = 聞き役（ずんだもん想定）
- **形式**: T24 受け渡し形式（行頭ラベル付きプレーンテキスト、`# slide:` はスライド切替の目安）
- **文体**: `docs/conventions/narration-style.md` 準拠（ですます調 / NG 表現回避）。疑問文 3 つ以上は T2 upspeak Spike の素材要件（narration-style の規定ではない）

---

```
# slide: java-js-compare.svg（タイトル提示のみ、中身はまだ伏せる）
narrator: 今日は「JavaとJavaScriptはどう違うの？」という話をします。
listener: え、名前がそっくりですし、兄弟みたいな言語じゃないんですか？
narrator: 実はこの2つ、まったくの別物です。よく「メロンとメロンパンくらい違う」と言われます。
listener: そんなにですか？じゃあ、なぜ名前がこんなに似ているんでしょう？
narrator: そこには1995年の、ちょっとした事情があるんです。
# slide: js-naming-timeline.svg
narrator: JavaScriptは、ネットスケープ社のブレンダン・アイクさんが、およそ10日間で最初の形を作った言語です。名前は最初「Mocha」、次に「LiveScript」でした。
listener: あれ、最初はJavaのJの字もないんですね。
narrator: そうなんです。ところが同じ1995年、サン・マイクロシステムズの「Java」が大きな話題になっていました。
narrator: そこでネットスケープはサン社と手を組み、流行のJavaにあやかって「JavaScript」へ改名しました。つまり、宣伝のための名前だったんです。
listener: 名前の由来が、技術ではなくマーケティングだったんですか？
# slide: java-js-compare.svg（ここで対比の中身を全開示）
narrator: そのとおりです。中身も対照的で、Javaは型をきっちり決めてから動かす、大きなシステム向けの言語。JavaScriptはブラウザの中で気軽に動かせる、Webページ向けの言語として生まれました。
listener: 似ているのは本当に名前だけなんですね。
narrator: まとめます。JavaとJavaScriptは別の言語。似た名前は、1995年の流行に乗った歴史の名残です。次回は、このJavaScriptがどう標準化されたのか、「ECMAScript」の話をしましょう。
```

---

## 事実関係の典拠メモ（台本には出さない）

- Brendan Eich が Netscape 在籍時の 1995 年 5 月頃、約 10 日間でプロトタイプを作成。社内コードネーム Mocha
- 1995 年 9 月の Netscape Navigator 2.0 ベータで LiveScript として搭載
- 1995 年 12 月、Netscape と Sun Microsystems の提携発表に合わせて JavaScript へ改名（Navigator 2.0B3）
- Java は 1995 年 5 月に Sun が正式発表し、同年大きなブームになっていた
- 「JavaScript」の商標は Sun → Oracle が保有（この事情が後の ECMAScript 命名につながる → 次回テーマへの接続）

## T2（upspeak Spike）用の疑問文サンプル

listener の疑問文 3 つ（語尾上げ検証の素材）:

1. 「兄弟みたいな言語じゃないんですか？」
2. 「なぜ名前がこんなに似ているんでしょう？」
3. 「マーケティングだったんですか？」
