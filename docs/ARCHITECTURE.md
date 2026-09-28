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

## ブラウザー機能

`src/js/app.js` はゲーム別一覧の条件付き表示、詳細からの条件付き戻り先、旧トップ検索URLの移行を扱います。詳細本文を全曲JSONで描き直しません。ガルパ一覧の初期50件とアワーノーツ一覧の全登録曲は静的HTMLです。条件付きURLでは対象ゲームのカタログを取得して描画します。アワーノーツは曲名・バンド・種類で検索でき、未確認の譜面系ソートは表示しません。管理画面は引き続きガルパ専用で、保存形式・同時編集の競合検出・端末内下書きを維持します。
