# ツギメモ 1.1.0 — 持ち主の見本で見た目を作り直した(2026-10-10)

見本: Downloads/tsugimemo_ref_A1_1122x1402.png、Downloads/ChatGPT 画像 2026年10月10日 12_10_*.png(8枚)、アイコン tsugimemo_ref_A2(余白を切った正方形を store/src/icon_source_1024.png に置いた)。
見本の絵(空のロック画面・ピンで留めた紙・ちぎった紙の6色・葉・題字)は scripts/cut_assets.py で切り出して public/img/ に置き、そのまま使っている。文字が焼き込まれた所は OpenCV で消し、上にアプリの文字を重ねる。

## 変えた画面
- メモ一覧(見本①・アプリ画面の詳細①): 題「ツギメモ」(リストが2つ以上ならリスト名)・左に履歴・右に設定、すべて/進行中/完了のタブ、白い紙のパネルに丸と取っ手、いまの1行はレモン色の帯、完了は取り消し線で下へ、下に「メモを追加…」と青い送るボタン。紙の色を選ぶとリストの地がその色になる(見本5③)
- 仕掛け(見本「ギミックUI集」): 丸を押すと縮む(0.12秒)→青いチェックが描かれて黄色い光(0.2秒)→下へ移り、次の行がスッと上がる(FLIP)。左にスワイプで編集(青)・削除(赤)、長押しか取っ手で並べ替え(持ち上がって 1.03倍)。お知らせは緑の丸・赤の!・灰の i・元に戻した時の黒
- メモの編集(見本4の詳細): ×・文の欄と消すボタン・字数・いちばん上にする/いちばん下へ回す・削除/キャンセル/保存
- リスト(見本4③・5①): 色の点・数・チェック・「新しいリストを作成」
- 履歴(見本「履歴と戻す」): 上に「リスト・履歴・設定」の切り替え、すべて/完了/削除、日ごと(今日 10月10日(土))、青のチェックと赤のごみ箱、「削除 12:39 (あと6日)」、押すと詳しく(メモの内容・7日の説明)→「元に戻しますか?」→黒いお知らせ
- 設定: ツギメモ+ の札、表示(表示場所・紙の色)、リスト(毎朝戻す)、毎朝戻す時刻、もしもの時(履歴・購入を戻す)、このアプリ
- 表示場所(見本「いつでも見える表示」): ロック画面の見本(iPhone は空の上に紙の札。Android はお知らせ)、大きく出す、ダイナミックアイランドの見本(iPhone でオンの時)、ホーム画面ウィジェットの見本、置き方、出すリスト、紙の色
- 紙の色を選ぶ(見本5③): ちぎった紙の6色(ミルク・レモン・ソーダ・さくら・ミント・グレー)、選んだ紙は青い枠とチェック
- ツギメモ+(見本5): できること4つ・無料版とのちがいの表・買い切りのボタン
- はじめての流れ(見本7): 1 紹介(空・紙・4つのチェック・さっそくはじめる)→ 2 表示の設定 → 3 最初のメモと表示場所 → 4 すぐ使える(ロック画面の見本が押されて次が上がる)
- 空の状態(見本7・8⑬): ピンの紙・「まだメモがありません」・「+ メモを追加…」
- アイコン: 見本の正方形。iOS とストアは縁の板を消して四隅まで地の色。Android の適応アイコンは前景にこの絵、背景 #F1EEE7、紙とピンを安全域(直径66dp)の内側に(docs/icon_check.png)。丸アイコン・起動画面も
- ウィジェット: iOS のホーム画面(小・中)は紙の札に「ツギメモ」・線・灰の丸と1行。ライブアクティビティは黄色いピン・「つぎにやること」・大きな1行・青い丸。Android のウィジェットも同じ作り、お知らせのボタンは「完了」。書き出し docs/widgets_ios.png・docs/widgets_android.png(store/mock/widgets.html を scripts/make_widget_previews.py で撮る)
- 言葉: 「済んだ」→「完了」、「毎朝もどす」→「毎朝戻す/毎朝戻るリスト」
- 紙の色: 6色を見本の色(#FEFBF3 ほか)に。1.0 の名前で保存された物は 生成り・白→ミルク、墨→グレー、桜鼠→さくら、若竹→ミント、藍→ソーダ に読み替える。無料はミルク1色(見本5の表どおり)。墨を使っていた無料の人はミルクに戻る

## 見本と違えた所(理由)
- 検索・タグ・期限・メモごとの色・繰り返し(毎日以外)・リマインダー・クラウド同期・バックアップ・「すべてのメモ」をまとめた一覧・進捗のウィジェット・絵入りのウィジェット・お知らせの「次の項目」・iPhone のお知らせ: 今ある機能ではないので作っていない(無い機能を見せない)
- ロック画面の紙の札: iPhone のロック画面のウィジェットは iOS が白黒にするので紙にはならない。紙の札は「ロック画面に大きく出す」(ライブアクティビティ)で出す物として見せ、表示場所の画面にそう書いた。見本の札の位置は画面のまん中だが、実際は下の方に出る(ストアの写真は下に置いた)
- ライブアクティビティ風の黒い札: 黒い物はダイナミックアイランド(大きく出す時の画面の上)として見せた。iPhone だけ、オンの時だけ
- 見本の「1x1 サイズ」(チェックだけのウィジェット): iOS のロック画面の丸(のこりの数)はあるが、ホーム画面の1x1 は無いので出さない
- 見本の「ここをタップで完了!」の書き込みは、アプリの中のロック画面の見本では見本の絵のまま残した(切り出した空に焼き込まれている)
- 青: 見本のトークン #3B82F6 と持ち主指定の #3B82D9 の間の #3B84E6 にした(見本の絵で塗られている青に近い)
- ダークモード: 見本は明るい物だけ。今あるダークは残し、紙の絵は白い台に載せた
- 文字: 見本の手書き風の文字は、アプリの中では端末の文字(ヒラギノ / Noto Sans JP)。手書き風は切り出した絵(題字・書き込み)だけ

## 確かめたこと(1.1.0)
1. vitest 28本 ALL PASS(紙の色の読み替え・履歴・ウィジェットの名前を足した)
2. npm run build 通過
3. Playwright E2E(scripts/e2e.py)ALL PASS 534項目。375・430 × ライト・ダーク、Android 向け 412 × ライト・ダーク。はじめての流れ → 足す → 完了(青いチェック→次が上がる)→ 戻す → ウィジェットで完了 → 編集 → 左スワイプで削除と戻す → 取っ手と長押しで並べ替え → タブ → 履歴から元に戻す → 表示場所(大きく出す・断られた時)→ 紙の色(無料はミルクだけ)→ ツギメモ+ → リストを作る・出すリストを替える・紙の色 → 毎朝戻す → 大きい文字 → 開き直し → 空の状態。横はみ出し・英語の取り残し・Android に iPhone だけの物が出ないこと・コンソールのエラーも毎回
4. 画面写真は全部 Read で見た。見本と並べた物: docs/compare_1〜8.png(見本8枚それぞれ)・docs/compare_icon.png・一覧 docs/compare_all.png
5. Android: versionCode 2 / versionName 1.1.0。releases/tsugimemo-1.1.0-release.aab(8.2MB)と確認用 APK。1.0.0 と同じ鍵で、証明書の SHA-256 が同じ(ED:64:BF:D7:…:1F:C6:B6:1C)ことを keytool で確かめた
6. iOS: GitHub Actions「iOS TestFlight」を compile_only で流し、ウィジェット拡張(TsugiWidget.appex)込みでコンパイル成功(run 38021986472、Xcode 26.6)
7. ストア素材: store/iphone/iphone_1〜6.png(1290x2796)、store/play/play_1〜6.png(1080x1920)、store/play/feature_1024x500.png、store/icon_1024.png、store/play/icon_512.png。scripts/make_store.py。値段・「無料」は写していない。Play 用は Android 向けで撮り、iPhone だけの物は写していない。1.0 の物は store/_v1_backup2/


---

# ツギメモ 1.0.0 — 作った物・確かめたこと・残り(2026-10-09)

## 何を作ったか
ロック画面に置くメモ・ToDo。「済んだら消えて、次がロック画面に上がってくる。」
- 企画の根拠: docs/01_勝ち組の分析.md(LockScreenNotes・Chalkee・Yondo と伸びなかった同類13本)、docs/02_企画.md
- 使いやすさの点検: docs/03_使いやすさ点検.md
- 土台: Capacitor 8 + React 19 + Vite + TypeScript + vitest。見た目はお手本・並行の2本(集中記録・歩数計)と別の決まり(帳面と朱。src/design/tokens.css)
- 無料: リスト1つ・ロック画面ウィジェット3種+ホーム画面の小・中・ロックしたまま済ませる・大きく出す(iOS ライブアクティビティ / Android ロック画面のお知らせ)・消した物を7日戻せる・広告なし
- ツギメモ+(買い切り 600円): リスト8つと出すリストの切り替え・毎朝もどすリスト・紙の色6色

| 項目 | 値 |
|---|---|
| appId / Bundle ID | jp.tsugimemo.app(ウィジェット拡張 jp.tsugimemo.app.widget) |
| App Group | group.jp.tsugimemo.app |
| 版 | 1.0.0 / versionCode 1(iOS の CFBundleVersion は Actions の実行番号) |
| 課金 | RevenueCat。商品ID tsugimemo_plus(非消耗型)、entitlement plus、offering は current。キーは src/config.ts で空 → 「購入は準備中です」と出て落ちない |
| Android の署名鍵 | %LOCALAPPDATA%\TsugimemoBuild\signing\tsugimemo-upload.jks(別名 tsugimemo-upload)。パスワードは同じ所の upload-password.dpapi(DPAPI)。値はどこにも書いていない。PC を替える前にこのフォルダごと控える |
| AAB | releases\tsugimemo-1.0.0-release.aab(署名済み)/ 確認用 APK releases\tsugimemo-1.0.0-release.apk |

## 置き場所
- Web(画面): src/(domain/model.ts が中心の計算、ui/ が画面、platform/ が端末とのつなぎ)
- Android の自前コード(Kotlin): android/app/src/main/java/jp/tsugimemo/app/
  - TsugiStore.kt(アプリとウィジェットの共有置き場)/ TsugiWidgetProvider.kt(ホーム画面ウィジェット。丸で済ませる)/ LockNotifier.kt(ロック画面のお知らせ。音・バイブなし、「済んだ」ボタン付き)/ TsugiWidgetPlugin.kt(Web との橋)
  - res/layout/widget_tsugi.xml・xml/tsugi_widget_info.xml・drawable/widget_*.xml
- iOS の自前コード(Swift): ios/App/
  - Shared/TsugiShared.swift・DoneIntent.swift(本体と拡張の両方に入る。App Group の読み書き、ライブアクティビティの型、済んだボタンの AppIntent)
  - TsugiWidget/(ウィジェット拡張: accessoryRectangular / accessoryInline / accessoryCircular / systemSmall / systemMedium と、ライブアクティビティ)
  - App/TsugiWidgetPlugin.swift・MainViewController.swift(Web との橋とその登録)・App.entitlements
  - Xcode のターゲット追加は scripts/ios_add_widget.py(何度流しても同じ。cap sync の後に流す。Actions でも毎回流す)
- 組み立て: scripts/build-android.ps1(Android)、.github/workflows/ios-testflight.yml(iOS。push はしていない)
- ストア素材: store/(下に詳細)

## 確かめたこと
1. vitest 単体テスト 25本 ALL PASS(足す・済ませる・戻す・消す・並べ替え・7日で片づく・毎朝もどす・リスト・無料に戻す・ウィジェットの中身・ウィジェットで押された分の取り込み・壊れた保存物)
2. npm run build 通過(ビルド前に dist を1ファイルずつ消す scripts/clean-dist.mjs はお手本と同じ対策。この PC の Node は中身の残った dist を空にする所で exit 127 で落ちる)
3. Playwright E2E(scripts/e2e.py)ALL PASS。375幅・430幅 × ライト・ダークの4通りと、Android 向け(?platform=android、412幅 × ライト・ダーク)の2通り。Android 向けでは説明・ロック画面タブ・許可の前の説明に iPhone・カスタマイズ・ライブアクティビティ・9:41 が出ないこと、見本がお知らせ(済んだボタン付き)になることも確かめる。初回3枚 → 足す(改行・貼り付け・いちばん上に)→ 済ませる → 戻す → ウィジェットで済ませた分の取り込み → 書き直し・並べ替え → ロック画面タブ(大きく出す・断られた時)→ 課金の案内 → 疑似購入 → リストを足す・出すリストを替える → 消したものから戻す → 大きい文字 → 開き直し。横はみ出し・英語の取り残し・コンソールのエラーも毎回検査
4. 画面写真を全部 Read で見た(scripts/e2e_out/sheet_*.png)。直した物: 説明1枚目の見出しの変な折り返し、設定の「毎朝もどす時刻」の左余白、大きい文字で入力欄の文が折り返す、見本の下の空き、「上に/下に」ピンの意味が分からない、知らせの文が切れる、ダークで見本の縁が消える。アイコンは丸が花に見えたのでマスを並べ直した
5. 使いやすさの自己点検表: docs/03_使いやすさ点検.md
6. Android: cap add android・cap sync・署名済み release AAB と APK。jarsigner -verify 通過、apksigner で証明書 CN=TsugiMemo を確認。AAB の中に TsugiWidgetPlugin / TsugiWidgetProvider / LockNotifier / TsugiStore のクラス、ウィジェットのレイアウトと設定、POST_NOTIFICATIONS、receiver が入っていることを確認。targetSdk 36
7. iOS: cap add ios・Info.plist(表示名 ツギメモ、NSSupportsLiveActivities、ITSAppUsesNonExemptEncryption=NO、縦向きだけ、iPhone だけ)・entitlements・ワークフロー。pbxproj は Python の OpenStep パーサで読み直し、オブジェクト69個・参照切れ0を確認
8. ストア素材(store/): アイコン icon_1024.png・play/icon_512.png(ドット絵 24x24 を手で配色)、play/feature_1024x500.png、画面写真 iphone/iphone_1〜5.png(1290x2796)と play/play_1〜5.png(1080x1920)。Play 用は 2026-10-10 に Android 版で出る物だけで作り直した(scripts/make_store_play.py・store/mock/android.html。ロック画面のお知らせ・済んだを押す前後・ホーム画面のウィジェット小と中・Android 向けのロック画面タブ・リスト。iPhone のロック画面ウィジェット・9:41・「カスタマイズ」は入れていない)。前の iPhone 寄りの版は play/_ios_like_backup/ に残した。値段・「無料」は入れていない。説明文 listing_ja.md、プライバシーポリシー privacy.md、データセーフティとレーティング play/data_safety_and_rating.md、テスター募集 tester_post.txt

## iOS の組み立ての不確かさ(正直に)
この PC は Windows なので、Swift は1度もコンパイルしていない。読み直しはしたが、次のどれかで止まる見込みがある。
- コンパイル: 先に Actions の「iOS TestFlight」を compile_only=true(既定)で流す。Apple のシークレットは要らない。Swift の型の細かい誤りはここで出る(特に AppIntent の authenticationPolicy の書き方、ライブアクティビティの API)
- Xcode プロジェクト: ウィジェット拡張のターゲットは手で pbxproj に書き足した(scripts/ios_add_widget.py)。読める形と参照は確かめたが、Xcode で開いて確かめてはいない
- 署名: App Group を使うので、Apple の開発者サイトで次の準備が要る見込み。(1) App ID jp.tsugimemo.app と jp.tsugimemo.app.widget に「App Groups」を有効化 (2) App Group group.jp.tsugimemo.app を作って両方に割り当て。xcodebuild の -allowProvisioningUpdates が自動でやってくれる場合もあるが、App Group の作成は API でできないことがある。ワークフローは既定でアーカイブ時に署名(sign_at=archive)、だめならお手本と同じ sign_at=export を試す。アーカイブの中に TsugiWidget.appex と App Group の権限があるかを確かめる段を入れてある
- ロック画面で押せるウィジェット(Button(intent:))とライブアクティビティは iOS 17 以降。アプリも iOS 17 以降にした
- ライブアクティビティは iPhone の決まりで8時間で終わる。アプリを開くたび、4時間を過ぎていたら出し直す作り。裏で出し直すことはできない(ストア文・アプリ内にもそう書いた)

## Android の不確かさ
- エミュレーターも実機も無いので、ウィジェットとお知らせを実際の画面では見ていない(組み立てとクラス・資源の同梱までは確認)。Play のテスターに配る前に、1台で「ウィジェットを置く→丸を押す→次が上がる→アプリを開くと済んだに入っている」を見るのが次の一手
- 毎朝もどすは、アプリを開いた時に行う(ウィジェットだけでは日をまたいでも戻らない)

## 素材の出どころ
- 文字: 端末の日本語フォント(ヒラギノ / Noto Sans JP)。ストア画像の文字は Windows 同梱の游ゴシックで描いた(画像として書き出す使い方。https://learn.microsoft.com/typography/fonts/font-faq の範囲)
- 絵: アイコン・ウィジェットの見本・画面内の見本はすべて自前(scripts/make_icon.py、store/mock/lock.html)。外部の絵・データは使っていない
- 課金: RevenueCat(https://www.revenuecat.com/terms)

## 残り(持ち主の手を借りずにできない物を含む)
1. iOS: Actions を compile_only で流す → 通ったら Apple 側の App Group の準備 → TestFlight。App Store Connect でアプリ作成(名前 ツギメモ)・課金商品 tsugimemo_plus(600円・非消耗型)
2. RevenueCat: プロジェクト作成、iOS / Android の公開キーを src/config.ts に入れて再ビルド
3. サポートページと privacy.html を https://kame6493-del.github.io/tsugimemo/ に出す(アプリの設定から開く先。store/privacy.md が原稿)。一覧ページ kame6493-del.github.io にも段を足す
4. Play Console: アプリ作成・AAB アップロード・掲載(listing_ja.md・画像)・データセーフティ・レーティング → クローズドテスト(12人×14日、tester_post.txt)
5. Android 実機かエミュレーターでウィジェットとお知らせを1度見る
6. 宣伝: 勝ち組の入口は X と TikTok の画面動画だった。「ロック画面で丸を押す→次の行が上がる」の3秒動画を、実機の画面で撮る(見本の絵は使わない)
7. Apple の 4.3(a) の警告があるので、並行の2本と日を空けて出す
