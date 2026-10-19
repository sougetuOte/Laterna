# 概要欄 ── ネットワークの地図（Laterna 5 本目、script-id: `network-map`）

動画の概要欄・配布ページに貼る文面。`goal.md` Wave 7 の完了条件 4。出典は `outline.md` の「事実と出典の対応」と同じ。

## 内容紹介

スマホで動画を見るとき、データはどうやって届いているのか。解説役と聞き役の掛け合いで、ネットワークの全体を 4 つの見方で 1 枚の地図にします。
1 つ目は運び方です。データをパケットに分けて送ること、ルータが道を選ぶこと、光ファイバや無線 LAN などの通信手段の使い分け、LAN・WAN・インターネットの関係を見ます。
2 つ目は住所と名前です。IP アドレスを 2 進数と 10 進数で読み、IPv4 と IPv6、ローカルとグローバルの違いを見たあと、ドメイン名と DNS、URL の読み方に進みます。
3 つ目は約束事です。TCP/IP の 4 つの層、TCP と UDP、HTTP と HTTPS、メールのプロトコルを紹介します。4 つ目は家の中の機器で、ONU・ルータ・ハブ・無線 LAN アクセスポイント、DHCP、無線 LAN を安全に使うための設定を扱います。

この動画は全部を説明しません。章の終わりごとに、教科書と補助資料のどこを読めばよいかを案内します。

- 対象：「情報Ⅰ」の教科書でネットワークを学ぶ人（最初は高専 2 年の授業で使う）。前に 2 進数を習っていると、IP アドレスの章が読みやすくなります
- 使い方：遠隔の授業の自習用。動画を見たあと、教科書と補助資料を読み、復習問題を解く
- 尺：約 8 分 45 秒（manifest の値 525.0 秒）
- 復習用 PDF（A4 縦）を同じ台本から書き出しています。セリフを全部載せているので、音が出せないときは PDF で読めます

## 出典

1. RFC 791（IPv4。アドレスは 32 ビット）── https://www.rfc-editor.org/rfc/rfc791
2. RFC 4291（IPv6 のアドレスは 128 ビット）── https://www.rfc-editor.org/rfc/rfc4291
3. RFC 1752（IPv6 を選んだ勧告。IPv4 のアドレスが尽きる見込み）── https://www.rfc-editor.org/rfc/rfc1752
4. RFC 1918（ローカル用のアドレスの範囲）── https://www.rfc-editor.org/rfc/rfc1918
5. RFC 3022（NAT。アドレスの付け替え）── https://www.rfc-editor.org/rfc/rfc3022
6. RFC 5737（説明用のアドレス）── https://www.rfc-editor.org/rfc/rfc5737
7. RFC 1034（DNS）── https://www.rfc-editor.org/rfc/rfc1034
8. RFC 2131（DHCP）── https://www.rfc-editor.org/rfc/rfc2131
9. RFC 1122（インターネットの層）── https://www.rfc-editor.org/rfc/rfc1122
10. RFC 9293（TCP）── https://www.rfc-editor.org/rfc/rfc9293 、RFC 768（UDP）── https://www.rfc-editor.org/rfc/rfc768 、RFC 3550（RTP）── https://www.rfc-editor.org/rfc/rfc3550
11. RFC 9110（HTTP と https）── https://www.rfc-editor.org/rfc/rfc9110
12. RFC 5321（SMTP）── https://www.rfc-editor.org/rfc/rfc5321 、RFC 1939（POP3）── https://www.rfc-editor.org/rfc/rfc1939 、RFC 9051（IMAP）── https://www.rfc-editor.org/rfc/rfc9051
13. Internet Society, "Brief History of the Internet" ── https://www.internetsociety.org/internet/history-internet/brief-history-internet/
14. 総務省『令和 2 年版 情報通信白書』「越境データの流通を支える海底ケーブル」── https://www.soumu.go.jp/johotsusintokei/whitepaper/ja/r02/html/nd131420.html 、「レイヤー別にみる市場動向」（LPWA）── https://www.soumu.go.jp/johotsusintokei/whitepaper/ja/r02/html/nd114110.html
15. 総務省「無線LAN（Wi-Fi）の安全な利用（セキュリティ確保）について」── https://www.soumu.go.jp/main_sosiki/cybersecurity/wi-fi/index.html 、自宅 Wi-Fi 利用者向け 簡易マニュアル ── https://www.soumu.go.jp/main_content/000989912.pdf 、公衆 Wi-Fi 利用者向け 簡易マニュアル ── https://www.soumu.go.jp/main_content/000989921.pdf
16. 総務省「国民のためのサイバーセキュリティサイト」フィッシング詐欺 ── https://www.soumu.go.jp/main_sosiki/cybersecurity/kokumin/basic/risk/04/
17. Wi-Fi Alliance, "Security"（WPA3）── https://www.wi-fi.org/discover-wi-fi/security
18. Bluetooth SIG, "From handsets to hands free, the birth of Bluetooth connectivity" ── https://www.bluetooth.com/blog/from-handsets-to-hands-free/

## クレジット

- 音声合成：VOICEVOX（https://voicevox.hiroshiba.jp/）
  - 解説役：VOICEVOX:玄野武宏
  - 聞き役：VOICEVOX:ずんだもん
  - 各キャラクターの音声の利用条件は、それぞれの利用規約に従います。**音声は下記 CC BY 4.0 の対象ではありません。**
- 立ち絵：Laterna オリジナル（Laterna の画像環境 imagegen、FLUX.2 [klein] 4B で生成。記録は `materials/portraits/`）
- 図：補助資料のために作った図 5 枚（自作）。表はコードで描画（Remotion／React。3 本目の部品 `CompareTable` を使用）
- 写真・地図（第三者の物。下記 CC BY 4.0 の対象外。それぞれの条件に従います）
  - ARPANET の地図（1977 年）：ARPANET（Computer History Museum 所蔵の資料）、パブリックドメイン ── https://commons.wikimedia.org/wiki/File:Arpanet_logical_map,_march_1977.png
  - 光ファイバの写真：Sunmosk「Optical patchcord.jpg」、CC BY 4.0（https://creativecommons.org/licenses/by/4.0）── https://commons.wikimedia.org/wiki/File:Optical_patchcord.jpg 。切り抜きと縮小をした
- 制作：Remotion（https://www.remotion.dev/）で書き出し
- ライセンス：台本・図・教材本文（この動画の Laterna 側の著作物）は CC BY 4.0（`LICENSE-CONTENT`）。コードは MIT（`LICENSE`）。VOICEVOX の音声と第三者の写真・地図は対象外
