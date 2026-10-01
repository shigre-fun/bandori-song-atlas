# Cloudflare Pagesでの公開

お問い合わせフォームの公開には、通常ビルドに加えてResend・Turnstile・Pagesの5環境変数の設定が必要です。[お問い合わせの設定・運用](CONTACT.md)を参照してください。Pagesは既存Git連携を使い、ルートの `functions/api/contact.js` を同時にデプロイします。`dist/_routes.json` によりFunctionの呼び出しは問い合わせAPIに限定します。2026-10-01に運営者からProduction設定完了の報告を受領しています。公開と実送受信の検証結果はCONTACT.mdに記録します。

公開URLは `https://tanimachi-bdsongs.com/` です。独自ドメイン、301転送、Search Console、sitemap、X-Robots-Tag、旧GitHub Pagesからの移行、Web Analyticsは設定済みです。画像更新時にこれらの設定を作り直さないでください。

## ビルド

Node.js 22以上と `pnpm-lock.yaml` に固定された依存関係を使用します。Cloudflare Pagesのビルドコマンドは `node scripts/build.mjs && node --test tests/*.test.mjs && node scripts/qa/audit-build.mjs dist https://tanimachi-bdsongs.com /`、出力ディレクトリは `dist` です。失敗した画像生成はビルドを終了コード0にしません。公開環境で `SITE_ORIGIN` を指定する場合は `https://tanimachi-bdsongs.com`、`BASE_PATH` は `/` にしてください。旧 `SITE_BASE_PATH` が設定されている場合は同じ `/` と一致させます。

`@napi-rs/canvas` はOGPとアイコンのPNG描画用です。`assets/fonts/` に同梱したNoto Sans JPのRegular/Boldとライセンスを使用するため、CloudflareのシステムフォントやPython/Pillowの有無に依存しません。生成された画像は `dist/assets/og/` にあり、楽曲名等の変更でハッシュが変わります。ビルドは `dist` を消してから再生成するので旧ハッシュ画像は公開物へ混入しません。

## 更新時の確認

ローカルでビルド・全テスト・SEO監査を通してから公開します。公開後はトップと両ゲームの代表楽曲で `og:image` の絶対URL、HTTP 200、1200×630の画像、`twitter:image` との一致を確認します。favicon SVG、32px PNG、Apple Touch Iconも実URLで確認します。既存のcanonical、sitemap、robots、301転送、検索条件付きページのX-Robots-Tag、404、Web Analyticsが変化していないことを確認します。

`BASE_PATH` を明示すればサブパスのローカル検証も可能です。`node scripts/serve.mjs` はビルドした `dist` を配信します。`dist` のファイルは直接修正しません。
