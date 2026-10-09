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
