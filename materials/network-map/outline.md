# network-map 構成 ── 「ネットワークの地図」

`goal.md` Wave 7 の完了条件 1。本 Wave のセッション id は `926e6c2e-da6d-4224-ad77-32500183afeb`（2026-10-19）。

台本承認：2026-10-19 主人（59 発話の表を見せ、選択式の問いに「承認する」と答えた。本 Wave のセッションの記録）
承認の後に変えた所：光ファイバの写真のスライドのキャプションに「（写真は切り抜き・縮小）」を足した（CC BY 4.0 の加工の表示。動画の出典の行には加工の欄が出ないため）。発話は変えていない。
試写：2026-10-19 主人（1 回目は MP4 `1489ff0f…f1a4`・PDF `524cedd1…d6b5` に対して「試写を見て気がついたんだけどさ。学生の年代だと「DNSと電話帳」の例えがわからんな。」。下の「試写の後に変えた所」で直した。2 回目は直した版の MP4 `0a4740b5…2cdb`・PDF `5e464157…7c09` に対して「直した版を試写した。問題なし。納品物を差し替えて。」。納品物は 2 回目の版）。
試写で見る点の所見：(1) 図の文字の大きさ：主人の指摘なし。Claude は 1920×1080 の静止画で、横長の図 4 枚（04・05・06・07）の小さい文字も読めることを見た。(2) 英字の略語の読み：主人の指摘なし。全 59 発話の `/audio_query` の `kana` で確かめた。(3) 行き先のページ番号と節番号の聞き取り：主人の指摘なし。(4) PDF だけで意味が通るか：主人の指摘なし。PDF の発話は動画と同じ文で、18 ページ。
試写の後に変えた所（2026-10-19 主人「案 A（スマホの連絡先）の文例で直して。」）：主人が試写で「学生の年代だと DNS と電話帳のたとえが分からない」と言ったので、u-031 の最後の文と、スライド `slide-dns` の 2 行目のたとえを、電話帳からスマホの連絡先に替えた。
依頼書・補助資料・教科書は repo の外にあり、ここには写さない。この文書は、それらを読んで自分の言葉で書いた。

## 対象

- 高専 2 年の 3 学科（建築・電気情報・機械）が共通で受ける、情報の基礎の授業。情報系でない学科が混ざるので、`docs/conventions/narration-style.md` の「高専・非情報系」で書く（用語はその場で言い換え、身近なたとえを使う）。
- 前期に、2 進数と 10 進数の変換、データ量の計算、アルゴリズムを習っている。IP アドレスの章で 2 進数を使う。
- 使用場面：2026-10-20 の遠隔回の自習。学生は動画を見た後、教科書（6 章 1 節 p.148〜151、実習14 p.162〜163、まとめ p.168）と補助資料（A4・4 ページ、節 1〜6）を読み、復習問題 21 問を解いて出す。
- 動画は全部を説明しない。各章の終わりに、教科書のページと補助資料の節番号で行き先を言う。イヤホンの無い学生は PDF を読むので、PDF だけで意味が通る文にする。
- 学校名と主人の氏名は出さない。教科書・高専機構の教材の図・写真・文は載せない。

## 尺

- 目標 480〜600 秒（8〜10 分）。台本 3,000〜3,500 字、スライド 18 枚。
- 発話は 59 本、約 3,200 字。2 本目（3,329 字で 546 秒）から見て、530 秒前後になる見込み。

## 章立て

| # | 章 | 目安 | 行き先（動画で言う） | 使う図 |
|---|---|---|---|---|
| 0 | 導入：動画を見るとき、データはどう届くか。4 つの見方で地図を描く | 30 秒 | ― | 見方の表（CompareTable） |
| 1 | パケットで運ぶ：回線交換とパケット交換、ルータと経路制御、ARPANET | 60 秒 | 教科書 p.148 の側注、補助資料 1 | 補助資料の図 01、ARPANET の地図 |
| 2 | 通信手段の使い分け：光ファイバ・携帯電話・無線 LAN・Bluetooth・LPWA | 50 秒 | 補助資料 2 | 光ファイバの写真、表（CompareTable） |
| 3 | LAN・WAN・インターネット | 40 秒 | 教科書 p.148 の本文、p.149 の 2 番の図 | 箇条書き |
| 4 | 住所＝IP アドレス：IPv4 の 2 進と 10 進、IPv6、ローカルとグローバル | 80 秒 | 教科書 p.150 の側注、補助資料 3 | 補助資料の図 04・05 |
| 5 | 名前＝ドメイン名と DNS、URL の読み方 | 60 秒 | 教科書 p.151 の 1 番と 3 番の図、補助資料 3 | 箇条書き 2 枚 |
| 6 | 約束事の層：TCP/IP の 4 層、TCP と UDP、HTTP・HTTPS、メール | 100 秒 | 教科書 p.149 の 3 番の図、p.151 の 4 番の図、補助資料 4 | 補助資料の図 06、表（CompareTable）、箇条書き |
| 7 | 家のネットワーク機器：ONU・ルータ・ハブ・アクセスポイント、DHCP、無線 LAN の安全 | 90 秒 | 教科書 p.149 の 1 番の図、p.151 の 2 番の図、補助資料 5 | 補助資料の図 07、箇条書き |
| 8 | まとめ 3 点と、このあとの進め方 | 40 秒 | 教科書 p.148〜151・p.162〜163・p.168、補助資料 6 | 箇条書き 2 枚 |

復習問題との関係：動画は問題の答えになる数値を言わない。IPv4 の例は補助資料の図 04 と同じ 192.168.10.3 を使い、問題に出る数値は使わない。通信速度の計算・パリティ・POP と IMAP の違い・ピア・ツー・ピア方式・LPWA の細部は、行き先を言うだけにする（goal.md Wave 7 の「やらないこと」）。

## 出典

下の「事実と出典の対応」の URL は、2026-10-19 に node の `fetch` で取得し、すべて HTTP 200 を返した。「該当箇所（原文）」は、取得した本文（タグを外し、空白をまとめた物）に文字どおりあることを確かめた。総務省の簡易マニュアル 2 本は PDF で、`pdftotext` で取り出した本文には、行の折り返しの所に空白が入る（引用の中の「／」の所）。
教科書の行は、依頼のフォルダにある教科書の写真で確かめた（写真のファイル名は「行き先の対応」の表）。教科書の文は写さず、どの事実がどこにあるかだけを書く。

## 事実と出典の対応

| 台本の事実 | 出典 | 該当箇所（原文） |
|---|---|---|
| データをパケットに分けて送り、回線の状況に応じてパケットごとに経路を選ぶ（経路制御） | 教科書 p.148 の側注「パケットと経路制御」 | （教科書。写真で確認） |
| 回線ではなくパケットで通信する考えが、インターネットの元になった | https://www.internetsociety.org/internet/history-internet/brief-history-internet/ | "packets rather than circuits, which was a major step along t"（"Kleinrock convinced Roberts of the theoretical feasibility of communications using packets rather than circuits"） |
| 1969 年の終わりに、4 台のコンピュータで最初の ARPANET ができた | 同上 | "four host computers were connected together into the initial ARPANET" |
| ARPANET の地図は 1977 年の物で、パブリックドメイン | https://commons.wikimedia.org/wiki/File:Arpanet_logical_map,_march_1977.png | "ARPANET logical map circa 1977"、"Public domain" |
| 国と国の間のデータ通信の約 99％は海底ケーブルを通っている、という調査がある | https://www.soumu.go.jp/johotsusintokei/whitepaper/ja/r02/html/nd131420.html | 「国際間のデータ通信の99%は海底ケーブルによって実現されているとの調査結果」 |
| 写真は、光ファイバの中をレーザーの光が進む様子 | https://commons.wikimedia.org/wiki/File:Optical_patchcord.jpg | "Laser light diffuses through the optical fiber during propagation"、"CC BY 4.0" |
| 無線 LAN は家や職場のほか、多くの施設で使われている | https://www.soumu.go.jp/main_sosiki/cybersecurity/wi-fi/index.html | 「無線LANは自宅や職場だけではなく、多くの施設等で利用されています。」 |
| Bluetooth は、ケーブルの代わりとして考えられた、近い距離・少ない電力の無線 | https://www.bluetooth.com/blog/from-handsets-to-hands-free/ | "Originally conceived as a wireless alternative to RS-232 data cables, Bluetooth® technology has become the global wireless standard for short-range, low-power wireless co" |
| LPWA は、遅いが、少ない電力で長く動き、数 km〜数十 km 届く | https://www.soumu.go.jp/johotsusintokei/whitepaper/ja/r02/html/nd114110.html | 「LPWAの通信速度は数kbpsから数百kbps程度と携帯電話システムと比較して低速なものの、一般的な電池で数年以上運用可能な省電力性や、数kmから数十kmもの通信が可能な広域性を有している。」 |
| 携帯電話の通信は世代で呼ばれ、今のスマホは 4G（第 4 世代）と 5G（第 5 世代）（スライド `slide-means` の表） | https://www.soumu.go.jp/johotsusintokei/whitepaper/ja/r02/html/nd111210.html・https://www.soumu.go.jp/johotsusintokei/whitepaper/ja/r02/html/nd111220.html | 「1979年に第1世代となるサービスが開始されて以降、本年に開始された第5世代に至るまで、約10年周期で世代交代が行われていった」、「商用開始されたのが第4世代移動通信システム（4G）である」 |
| LAN・WAN・インターネットの意味 | 教科書 p.148 の本文、p.149 の 2 番の図 | （教科書。写真で確認） |
| IPv4 のアドレスは 32 ビット | https://www.rfc-editor.org/rfc/rfc791 | "Addresses are fixed length of four octets (32 bits)." |
| 32 ビットを 8 ビットずつ 10 進数で書く（例 192.168.10.3。11000000＝192） | 教科書 p.150 の側注（IPv4 の 2 進数と 10 進数の例） | （教科書。写真で確認。例の数は補助資料の図 04 と同じ。2 進数の計算） |
| 2 の 32 乗は約 43 億 | 教科書 p.168 のまとめ（約 43 億＝4.3×10⁹） | （教科書。写真で確認。2³²＝4,294,967,296） |
| IPv6 のアドレスは 128 ビット | https://www.rfc-editor.org/rfc/rfc4291 | "IPv6 addresses are 128-bit identifiers for interfaces and sets of interfaces" |
| IPv4 の番号が足りなくなる見込みから、IPv6 が作られた（教科書 p.168 のまとめも「拡張された IPv6」と書く） | https://www.rfc-editor.org/rfc/rfc1752（IPv6 を選んだ勧告） | "We needed a reasonable estimate of the time remaining before we exhausted the IPv4 address space in order to determine the scope of the IPng effort." |
| ローカル用に決められた範囲（10.○、172.16〜172.31、192.168.○） | https://www.rfc-editor.org/rfc/rfc1918 | "10.0.0.0 - 10.255.255.255 (10/8 prefix)"、"172.16.0.0 - 172.31.255.255 (172.16/12 prefix)"、"192.168.0.0 - 192.168.255.255 (192.168/16 prefix)" |
| ルータが、家の中の番号と外の番号を付け替える | https://www.rfc-editor.org/rfc/rfc3022 | "Basic Network Address Translation or Basic NAT is a method by which IP addresses are mapped from one group to another" |
| 図 05 の 203.0.113.25 は説明用の番号 | https://www.rfc-editor.org/rfc/rfc5737 | "are provided for use in documentation" |
| DNS は、名前から IP アドレスを引く | https://www.rfc-editor.org/rfc/rfc1034 | "We should be able to use names to retrieve host addresses" |
| ブラウザは、DNS サーバに名前を送って IP アドレスを受け取り、その相手に通信する | 教科書 p.151 の 3 番の図 | （教科書。写真で確認） |
| URL は、スキーム名・ドメイン名・パス名でできている。ドメイン名の jp は日本、ac は大学・研究機関、co は企業、go は政府機関 | 教科書 p.151 の 1 番の図 | （教科書。写真で確認） |
| プロトコル（通信規約）と TCP/IP。TCP/IP は 4 つの層に分かれる | 教科書 p.148 の本文、p.149 の 3 番の図 | （教科書。写真で確認） |
| 4 つの層の名前（アプリケーション・トランスポート・インターネット・リンク） | https://www.rfc-editor.org/rfc/rfc1122 | "The protocol layers used in the Internet architecture are as follows"、"Application Layer"、"Transport Layer"、"Internet Layer"、"Link Layer"（教科書はリンク層を「ネットワークインタフェース層」と呼ぶ。動画は教科書の呼び方） |
| TCP は確実に、順番どおりに届ける（届かなければ送り直す） | https://www.rfc-editor.org/rfc/rfc9293 | "TCP provides a reliable, in-order, byte-stream service to applications."、"retransmission" |
| UDP は、届くことを保証しない | https://www.rfc-editor.org/rfc/rfc768 | "delivery and duplicate protection are not guaranteed" |
| 音声通話・ビデオ通話（RTP）は、ふつう UDP の上で動く | https://www.rfc-editor.org/rfc/rfc3550 | "Applications typically run RTP on top of UDP" |
| 音声通話は今の声を相手に届ける通信なので、1 秒前の声を送り直されても役に立たない（u-043。「1 秒」はたとえの数で、決まった値ではない） | https://www.rfc-editor.org/rfc/rfc3550 | "end-to-end network transport functions suitable for applications transmitting real-time data, such as audio, video or simulation data"（上の UDP と RTP の行と合わせて読む） |
| HTTPS は、HTTP の通信を TLS で暗号化した物 | https://www.rfc-editor.org/rfc/rfc9110 | "The "https" URI scheme"、"capable of establishing a TLS ( [ TLS13 ] ) connection that has been secured for HTTP communication" |
| 鍵マークが出ていても、フィッシングサイトのことがある | https://www.soumu.go.jp/main_sosiki/cybersecurity/kokumin/basic/risk/04/ | 「WebブラウザのURLに鍵マークが表示されているにもかかわらず、フィッシングサイトであるケースが増えています。」 |
| メールは SMTP で送り、POP か IMAP で受け取る | 教科書 p.151 の 4 番の図 | （教科書。写真で確認） |
| SMTP・POP3・IMAP の役割 | https://www.rfc-editor.org/rfc/rfc5321・https://www.rfc-editor.org/rfc/rfc1939・https://www.rfc-editor.org/rfc/rfc9051 | "Simple Mail Transfer Protocol"、"to permit a workstation to dynamically access a maildrop on a server host"、"allows a client to access and manipulate electronic mail messages on a server" |
| ONU は光の信号と LAN の電気の信号を変換する。ルータ・ハブ・無線 LAN アクセスポイントの役割。家では 1 台にまとまっていることがある | 教科書 p.149 の 1 番の図 | （教科書。写真で確認） |
| DHCP が、つないだ機器に IP アドレスを自動で配る | 教科書 p.151 の 2 番の図、https://www.rfc-editor.org/rfc/rfc2131 | "provides a framework for passing configuration information to hosts on a TCPIP network"、"automatic allocation" |
| 暗号化の方式は WPA2 か WPA3 を選ぶ | https://www.soumu.go.jp/main_sosiki/cybersecurity/wi-fi/index.html | 「ポイント1 セキュリティ方式 は「WPA2またはWPA3」を選択しよう」 |
| WEP は解読の方法が知られているので使わない | https://www.soumu.go.jp/main_content/000989912.pdf（自宅 Wi-Fi 利用者向け 簡易マニュアル） | 「WEPなどの古いセキュリティ方式は、暗号の解／読方法が知られているため、WPA2やWPA3などの新しいセキュリティ方式を選ぶようにしましょう」 |
| WPA3 は、Wi-Fi CERTIFIED の機器で必須の新しい方式 | https://www.wi-fi.org/discover-wi-fi/security | "WPA3 is mandatory for Wi-Fi CERTIFIED devices" |
| 偽の公衆 Wi-Fi が、ID やパスワードをだまし取る例がある | https://www.soumu.go.jp/main_content/000989921.pdf（公衆 Wi-Fi 利用者向け 簡易マニュアル） | 「偽の公衆Wi-Fiが、SNSのログイン画面を模した偽の入／力画面に誘導して、ID・パスワードなどの入力情報をだ／まし取る例が報告されています」 |
| 補助資料は 4 ページ（スライド `slide-next`） | 依頼のフォルダの `補助資料_後期第3週_ネットワークのしくみ.pdf` | （pdf-lib で数えたページ数 4。2026-10-20） |
| 復習問題 問 21 は、端末の設定画面で IP アドレスを見る | 教科書 p.151 の EXERCISE 1、補助資料 3 | （教科書。写真で確認。見方の手順は補助資料に任せる） |

## 行き先の対応

動画で言う行き先を、依頼のフォルダの教科書の写真と、補助資料の原稿（`補助資料_後期第3週_ネットワークのしくみ_原稿.html`）の見出しで確かめた（2026-10-19）。写真のファイル名は、どれも先頭が `261015070` で、下の表には残りの 6 桁を書く。

| 動画で言う行き先 | 確かめた物 | 結果 |
|---|---|---|
| 教科書 p.148 の側注「パケットと経路制御」 | 写真 `126033`（p.148） | 一致 |
| 教科書 p.148 の本文（LAN・WAN・インターネット） | 写真 `126033` | 一致 |
| 教科書 p.149 の 1 番の図「LAN の配線例」 | 写真 `130411`（p.149） | 一致 |
| 教科書 p.149 の 2 番の図「LAN と WAN とインターネット」 | 写真 `130411` | 一致 |
| 教科書 p.149 の 3 番の図「インターネットのプロトコル（TCP/IP）」 | 写真 `130411` | 一致 |
| 教科書 p.150 の側注（IPv4・IPv6・DHCP） | 写真 `136468`（p.150。ブレている） | 側注の位置と見出しの語は読めた |
| 教科書 p.151 の 1 番の図「URL の例」 | 写真 `140412`（p.151） | 一致 |
| 教科書 p.151 の 2 番の図「DHCP サーバ」 | 写真 `140412` | 一致 |
| 教科書 p.151 の 3 番の図「Web ページの閲覧」 | 写真 `140412` | 一致 |
| 教科書 p.151 の 4 番の図「電子メールが届くまで」 | 写真 `140412` | 一致 |
| 教科書 p.162〜163 の実習14「データの間違いを探そう」 | 写真 `259629`（p.162）・`306422`（p.163） | 一致 |
| 教科書 p.168 の 6 章のまとめ | 写真 `322644`（p.168） | 一致 |
| 補助資料 1「データは「小包」に分けて運ぶ」 | 原稿の見出し | 一致 |
| 補助資料 2「通信手段は「速さ・届く距離・電力」で使い分ける」 | 原稿の見出し | 一致 |
| 補助資料 3「住所（IP アドレス）と名前（ドメイン名）」 | 原稿の見出し | 一致 |
| 補助資料 4「約束事（プロトコル）は「層」に分かれている」 | 原稿の見出し | 一致 |
| 補助資料 5「家のネットワークと無線 LAN の安全」 | 原稿の見出し | 一致 |
| 補助資料 6「通信速度の計算」 | 原稿の見出し | 一致 |

**依頼のフォルダの目録との違い（主人への報告）：**目録の「教科書の写真の中身」は、4 か所が実際と違った。`151884` は p.152（6 章 2 節）、`248134`・`250826` は暗号技術のページ（実習14 ではない）、実習14 は `259629`・`306422`、`315961` は Tech Topics で、まとめ（p.168）は `322644` だった。目録は書き換えていない。
