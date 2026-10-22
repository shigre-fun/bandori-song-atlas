# Cloudflare Pagesでの公開

お問い合わせフォームの公開には、通常ビルドに加えてResend・Turnstile・Pagesの5環境変数の設定が必要です。[お問い合わせの設定・運用](CONTACT.md)を参照してください。Pagesは既存Git連携を使い、ルートの `functions/api/contact.js` を同時にデプロイします。`dist/_routes.json` によりFunctionの呼び出しは問い合わせAPIに限定します。2026-10-01に運営者からProduction設定完了の報告を受領しています。公開と実送受信の検証結果はCONTACT.mdに記録します。

公開URLは `https://tanimachi-bdsongs.com/` です。独自ドメイン、301転送、Search Console、sitemap、X-Robots-Tag、旧GitHub Pagesからの移行、Web Analyticsは設定済みです。画像更新時にこれらの設定を作り直さないでください。

## ビルド

Node.jsはルートの `.node-version` に指定した **22.23.4**、依存関係は `pnpm-lock.yaml` を使用します。GitHub Pages向けの `.github/workflows/pages.yml` も同じファイルを `node-version-file` で参照します。Cloudflare Pagesは既存のGit連携による別のデプロイであり、GitHub Pagesのworkflowから本番デプロイする方式には変更しません。

Cloudflare Pagesのビルドは `.node-version` に対応します。2026-10-22に運営者からProduction/Previewとも `NODE_VERSION` は未設定と回答を受領したため、環境変数との競合はありません。同日公開したa203279の本番ログも運営者から共有され、`nodejs@22.23.4` の検出・インストールとbuild/test/SEO/Functions/デプロイ成功を確認しました。GitHub連携checkでも同SHAの成功を確認済みです。エージェントによる管理画面の直接確認はサインイン要求で未実施で、独立したPreviewブランチのビルドは行っていません。`package.json` の `engines.node` は互換範囲であり、Pages v3のバージョン選択には使われません。[Cloudflare公式の指定方法](https://developers.cloudflare.com/pages/configuration/build-image/)と[今回の更新記録](NODE_SECURITY_UPDATE_2026-10-22.md)を参照してください。

Phase B2以降のCloudflare Pagesのビルドコマンドは次のとおりです。出力ディレクトリは `dist` です。

```sh
node scripts/build.mjs && pnpm test && node scripts/qa/audit-build.mjs dist https://tanimachi-bdsongs.com /
```

`pnpm test` は既存253件のassertを維持した履歴入力で回帰検証します。Creator公開時の24件は、公開commit `769bbed` のSHA検証済みfixtureで実行します。通常の管理画面編集後のデータは、現在の参照整合性・採番・生成カタログ一致とトップページのテストで別途検証します。公開当時の演奏時間や更新日時を現行データへ戻す必要はありません。以前の `node --test tests/*.test.mjs` は履歴段階の件数・予約IDを現行データに対して直接検証してしまうため、CloudflareのBuild command設定も更新してください。再試行するdeploymentのcommit SHAが目的のrelease SHAと一致することを確認します。過去のdeploymentのRetryはその過去のcommitを再buildします。

失敗した画像生成はビルドを終了コード0にしません。公開環境で `SITE_ORIGIN` を指定する場合は `https://tanimachi-bdsongs.com`、`BASE_PATH` は `/` にしてください。旧 `SITE_BASE_PATH` が設定されている場合は同じ `/` と一致させます。

`@napi-rs/canvas` はOGPとアイコンのPNG描画用です。`assets/fonts/` に同梱したNoto Sans JPのRegular/Boldとライセンスを使用するため、CloudflareのシステムフォントやPython/Pillowの有無に依存しません。生成された画像は `dist/assets/og/` にあり、楽曲名等の変更でハッシュが変わります。ビルドは `dist` を消してから再生成するので旧ハッシュ画像は公開物へ混入しません。

## 更新時の確認

ローカルでビルド・全テスト・SEO監査を通してから公開します。公開後はトップと両ゲームの代表楽曲で `og:image` の絶対URL、HTTP 200、1200×630の画像、`twitter:image` との一致を確認します。favicon SVG、32px PNG、Apple Touch Iconも実URLで確認します。既存のcanonical、sitemap、robots、301転送、検索条件付きページのX-Robots-Tag、404、Web Analyticsが変化していないことを確認します。

`BASE_PATH` を明示すればサブパスのローカル検証も可能です。`node scripts/serve.mjs` はビルドした `dist` を配信します。`dist` のファイルは直接修正しません。
