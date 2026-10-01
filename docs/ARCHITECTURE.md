# 複数ゲーム対応とSEOの設計

このサイトはNode.jsでHTMLを静的生成し、ブラウザーのJavaScriptは検索条件と管理画面に限定して使います。フレームワークやサーバー側APIはありません。

## 設定とデータ

`src/js/site-config.js` がサイト名、公開origin、ベースパス、ゲーム名、表示可能な情報項目、アセット名の設定元です。公開時の `SITE_ORIGIN` と `BASE_PATH` は環境変数で上書きできます。旧 `SITE_BASE_PATH` も受け付けますが、両方指定したときの不一致はエラーになります。内部リンクは `src/js/urls.js`、絶対URLは同ファイルの `absoluteURL` を使います。

ガルパの編集元は `data/garupa/songs.json` です。アワーノーツと同じ `groups` 形式を使い、バンド・種類をグループ、譜面やBPMなどを各曲に置きます。`scripts/catalog.mjs` が共通Songへ変換し、`gameId: "garupa"` と `stableSongId: String(id)` を追加します。`id` は編集・改名で変えず、削除後も再利用しません。別ゲームではゲームIDとstableSongIdを組にして識別します。

アワーノーツの編集元は `data/ournotes/songs.json` です。公式のリリース時楽曲一覧を5バンド×オリジナル／カバーでまとめ、各曲には固定の数値IDを割り当てています。`scripts/catalog.mjs` が共通Songへ変換し、譜面・BPMなど未確認項目は空欄にします。曲名や所属が変わってもIDは変えず、削除後も再利用しません。各グループの `availableFrom` はゲーム内実装日で、CDや音源の発売日ではありません。新たな公式発表を確認した場合だけ、次の未使用IDを追加します。

`data/garupa/legacy-song-paths.json` は移行前の曲名パスを楽曲IDに結び付ける固定記録です。既存の旧パスは消さないでください。ビルドは存在しないID、重複パス、不正なパスを拒否します。新曲には旧URLがないので表への追加は不要です。生成物の `legacy-redirects.json` と `.csv` はドメイン移行時の301転送設定の材料です。

## ページ生成とSEO

`scripts/build.mjs` がトップ、ゲーム別一覧、詳細、情報ページ、404、旧URL案内、sitemap、robotsを生成します。詳細は楽曲データ入りHTMLです。ページ本文とheadのメタ情報、パンくず、JSON-LDは同じページ設定から作り、canonicalは常にクエリなしの絶対URLにします。旧URL、管理画面、404、横断検索の案内はsitemapに含めません。信頼できるページ単位の更新日がないため、sitemapには `lastmod` を出しません。

楽曲一覧の検索・並べ替え・ページング・絞り込みはクエリURLで表現します。Cloudflare側で条件付き一覧へ `X-Robots-Tag: noindex, follow` を返す設定があり、`src/js/query-index.js` もブラウザーのheadへ `noindex,follow` を追加します。通常のHTMLとcanonicalは一覧の基本URLを指します。

ブランドの原画は `src/images/favicon.svg` の「開いた本＋音符」です。青〜紫の背景と白い本、赤〜ピンクの音符で、公式のロゴ・ジャケット・キャラクター画像は使いません。`scripts/assets/create-brand-assets.mjs` がビルド時に32px favicon PNG、180px Apple Touch Icon、512pxロゴ、1200×630のトップOGPと全楽曲のOGPを生成します。トップ画像は白系の背景にサイト名と「ガルパ・アワーノーツの非公式楽曲データベース」を配置します。

公開パスは共通画像が `/assets/og/site.png`、楽曲画像が `/assets/og/songs/{game}/{stableSongId}-{hash}.png` です。hashは楽曲名・バンド名・ゲーム識別色・描画版から決まり、変更時にはURLも変わります。`scripts/build.mjs` は `dist` を毎回消して再生成するので古い画像は残りません。全詳細ページの `og:image` と `twitter:image` は生成された絶対URLを使い、サイズ・altをheadへ記載します。

ゲーム識別色は `src/js/site-config.js` の `GAMES[gameId].ogAccent` に置き、ガルパが赤〜ピンク、アワーノーツが青です。新しいゲームを加える場合は `strong` と `pale` の6桁hex色を設定してください。未設定なら生成を停止します。日本語・英数字・記号を同じように描くため、`@napi-rs/canvas` と `assets/fonts/` のNoto Sans JP Regular/Boldを使用します。フォントの利用条件は同梱の `OFL.txt` を参照してください。ビルドマシンのフォントやPython/Pillowには依存しません。

## 情報ページの方針

`/about/`、`/sources/`、`/privacy/` の本文・title・descriptionは `scripts/build.mjs` の `informationPages` で管理し、共通の `src/pages/template.html` から静的生成します。Aboutでは個人運営の非公式・非提携サイトであることと権利の帰属を示します。一般利用者の正式な連絡先は `/contact/` です。

`/contact/` も同じ共通テンプレートとSEO生成を使います。匿名フォームの入力規則は `src/js/contact-validation.js` をクライアントとサーバーで共有し、送信だけを `functions/api/contact.js` が処理します。Turnstileのサーバー検証後、ResendのREST APIで運営者へプレーンテキストメールを送ります。秘密鍵・送受信先はFunctionsの環境変数のみ、公開ページへ埋め込む設定値はSite Keyだけです。問い合わせDBと自動返信はありません。`_routes.json` が静的ページをFunctions呼び出しから分離します。設定手順は[お問い合わせの設定・運用](CONTACT.md)を参照してください。

Sourcesではガルパとアワーノーツの現行ゲーム内表示を優先し、公式サイト・公式のお知らせ、その他の公式公開資料、運営者による確認・計測の順に照合します。既存のガルパのBPM・時間には公開データを用いた調査・算出値もあり、公式発表値とみなしません。確認できない値は推測で埋めません。

一覧・詳細の「データセット更新記録」はビルド日でも楽曲別の最終変更日でもありません。ガルパは `data/settings.json` と `data/garupa/admin-state.json` の `updatedAt` の新しい方、アワーノーツは `data/ournotes/admin-state.json` の `updatedAt` を表示します。管理ページや追加コマンドでは管理状態の日付が更新されますが、JSONを直接編集した場合は自動では更新されません。Sitemapの `lastmod` には使いません。

PrivacyにはCloudflare Pages等による配信、Cloudflare Web Analytics、管理ページのlocalStorageとGitHub API、外部リンク、広告の現状を記載します。Cloudflare Web Analyticsの説明をサイト配信全体のCookie・通信処理へ広げて断定しません。ポリシーの最終更新日は本文変更時だけ `scripts/build.mjs` の固定値を更新します。配信・解析サービス、一般向け入力機能、管理ページの保存方式を変更する際にはPrivacyを見直し、将来第三者配信広告を導入する場合も公開前にPrivacyを更新します。

## ブラウザー機能

`src/js/app.js` はゲーム別一覧の条件付き表示、詳細からの条件付き戻り先、旧トップ検索URLの移行を扱います。詳細本文を全曲JSONで描き直しません。ガルパ一覧の初期50件とアワーノーツ一覧の全登録曲は静的HTMLです。条件付きURLでは対象ゲームのカタログを取得して描画します。アワーノーツは曲名・バンド・種類で検索でき、未確認の譜面系ソートは表示しません。管理画面は両ゲームを切り替えて使い、保存形式・同時編集の競合検出・ゲーム別の端末内下書きを維持します。アクセストークンは画面内のメモリーだけに保持します。
