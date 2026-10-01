# お問い合わせフォームの設定・運用

一般利用者向け窓口は `/contact/` です。名前は不要で、種類、任意の対象ページURL、10～4000文字の内容を入力します。「返信は不要」が初期値です。返信希望時だけメールアドレスが必須になります。添付ファイル、自動返信、問い合わせ管理DBはありません。

公開ページは従来どおり `node scripts/build.mjs` で `dist` へ静的生成します。送信だけをルート直下の `functions/api/contact.js`（`POST /api/contact`）で処理します。`dist/_routes.json` はこのAPIと末尾スラッシュ形にだけFunctionsを適用します。`dist` は直接編集しません。

## 必要な設定

2026-10-01、運営者からResendドメイン認証・送信用API Key発行、Production用Turnstile Widget作成、Pages Productionの下記5変数の登録が完了したとの報告を受けています。値そのものはこの文書へ記録しません。本番の送信・受信確認は設定完了と区別します。

| 変数                   | 意味                                                                           | 公開範囲              |
| ---------------------- | ------------------------------------------------------------------------------ | --------------------- |
| `TURNSTILE_SITE_KEY`   | WidgetのSite Key。ビルド時にページへ埋め込みます                               | 公開可能              |
| `TURNSTILE_SECRET_KEY` | Siteverifyに使うSecret Key                                                     | Functions限定・秘密   |
| `RESEND_API_KEY`       | Resendでメールを送るAPI Key                                                    | Functions限定・秘密   |
| `CONTACT_TO_EMAIL`     | 運営者の非公開受信先。単一のメールアドレス                                     | Functions限定・非公開 |
| `CONTACT_FROM_EMAIL`   | 認証済みドメインの送信元。例：`バンドリ楽曲録 <contact@tanimachi-bdsongs.com>` | Functions限定         |

実際の受信先や秘密値をソース、文書、チャット、Gitへ貼り付けないでください。コードは公開ページの生成時にSite Keyだけを読み、受信先・秘密鍵を埋め込みません。

## Resendの手動設定

1. Resendのアカウントを作り、Domainsで `tanimachi-bdsongs.com` を追加します。
2. Resendが表示するSPF/DKIM等のDNSレコードをCloudflare DNSへ入力します。名前・値・優先度は画面の指定値をそのまま使い、推測しません。既存DNSレコードを無条件に置き換えないでください。
3. Resendでドメイン認証が完了したことを確認します。
4. 送信に必要な権限だけを持つAPI Keyを作成し、Pagesの `RESEND_API_KEY` へ設定します。
5. 認証済みドメインのアドレスを `CONTACT_FROM_EMAIL`、受信する自分のアドレスを `CONTACT_TO_EMAIL` へ設定します。

Fromは常に設定したサイト用アドレスです。返信希望の検証済み利用者メールだけをReply-Toへ設定します。宛先は運営者だけで、自動返信は送りません。内容はHTMLとして扱わずプレーンテキストです。

公式資料：[ドメイン認証](https://resend.com/docs/dashboard/domains/introduction)、[送信API](https://resend.com/docs/api-reference/emails/send-email)。

## Turnstileの手動設定

1. Cloudflare DashboardのTurnstileでProduction用Widgetを作ります。モードはManagedを選び、pre-clearanceは不要です。
2. 対象hostnameに `tanimachi-bdsongs.com` を登録します。Production用Widgetにlocalhostを登録しないでください。
3. Site Keyを `TURNSTILE_SITE_KEY`、Secret Keyを `TURNSTILE_SECRET_KEY` へ設定します。

サーバーはSiteverifyの成功だけでなく、送信したサイトのhostnameと `action: contact` の一致も検証します。トークンは5分・1回限りで、失敗後は画面側で再取得します。狭い画面ではcompact、それ以外ではflexibleのWidgetを表示します。

公式資料：[Widget作成](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/)、[サーバー検証](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)、[ローカルテスト鍵](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)。

## Cloudflare Pagesの手動設定・公開

1. Workers & Pagesから現在のPagesプロジェクトを選択します。既存のGit連携・独自ドメイン・Analytics・転送設定を維持します。
2. SettingsのVariables and Secretsで **Production** に上記5変数を設定します。Site Keyは通常の変数、その他4つは暗号化されたsecretとして扱います。Productionの実値はGitへ書きません。
3. 現在のビルドコマンド `node scripts/build.mjs && node --test tests/*.test.mjs && node scripts/qa/audit-build.mjs dist https://tanimachi-bdsongs.com /`、出力 `dist`、プロジェクトルートを維持します。ルートに `functions` が必要です。
4. Functionsのcompatibility dateを `2026-09-30` として確認します。Node.js互換フラグやDBのbindingは不要です。
5. Production設定を確認した後に変更をmainへpushし、CloudflareのビルドとFunctionsのデプロイ成功を確認します。変数変更時にも再デプロイが必要です。
6. 公開 `/contact/`、フッター、About、Privacyを確認し、Widgetの表示とCSPエラーがないことを確認します。
7. 匿名問い合わせを1件、返信希望の問い合わせを1件テスト送信し、受信箱への到着、固定From、Reply-To、本文、日本時間を確認します。API成功はResend受付を示し、受信箱への到着確認は別途必要です。

**Preview** にはProductionの秘密値を流用しません。未設定では受付準備中になります。Previewで実送信検証する場合は、固定のbranch preview hostnameを登録した別Widget・専用Resend API Key・テスト受信先を5変数へ設定します。公式テスト鍵は公開ホストでは拒否されます。Previewのcanonicalを本番ドメインへ向ける既存方針は維持します。

旧GitHub Pages用Actionsの成功だけでCloudflareの公開成功と判断しません。GitHub Pages上ではFunctionsは動きません。設定不足時、Site Keyなしならページは「受付準備中」、サーバー設定不足ならAPIは503を返し、メールを送りません。

## 設定変更・鍵のローテーション

- ResendのAPI Keysで現在と同じ送信権限・対象ドメインの新しい鍵を発行し、Cloudflare DashboardのWorkers & Pages → 対象Pagesプロジェクト → Settings → Variables and Secrets → Productionで `RESEND_API_KEY` を置き換えます。再デプロイして送信を確認後、Resendで旧鍵を失効させます。[API Keyの管理](https://resend.com/docs/dashboard/api-keys/introduction)を参照してください。
- Turnstileの対象Widget → Settings → Rotate Secret Keyで秘密鍵を更新し、同じPages Production設定の `TURNSTILE_SECRET_KEY` を置き換えて再デプロイ・送信確認します。旧秘密鍵との有効期間の重なりは2時間なので、その間に切り替えます。Widgetを交換する場合は `TURNSTILE_SITE_KEY` も更新します。[秘密鍵のローテーション](https://developers.cloudflare.com/turnstile/troubleshooting/rotate-secret-key/)を参照してください。
- 受信先・認証済み送信元の変更も同じProduction設定で `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` を更新し、再デプロイ・送受信確認します。PreviewにはProductionの秘密値を流用しません。鍵やアドレスをログ、文書、Gitへ残さないでください。

## ローカル検証

静的表示の既存手順はそのまま利用できます。

```powershell
node scripts/build.mjs
node --test tests/*.test.mjs
node scripts/qa/audit-build.mjs dist https://tanimachi-bdsongs.com /
node scripts/serve.mjs
```

Functionsまで確認する場合は `.dev.vars.example` を `.dev.vars` へコピーしてローカル用の値を入力します。`.dev.vars` はGit対象外です。Node.js 22以上の環境で次を実行します。

```powershell
node --env-file=.dev.vars scripts/build.mjs
pnpm dlx wrangler pages dev dist --compatibility-date=2026-09-30
```

Wranglerの既定ローカルURLは `http://localhost:8788` です。ローカル専用の公式テストSite Key/Secret KeyはCloudflareのテスト鍵ページから取得し、両方を対で設定します。例：可視の成功用Site Key `1x00000000000000000000AA`、Secret Key `1x0000000000000000000000000000000AA`。これらは公開されたテスト値で、実秘密値ではありません。サーバーが許容するテストhostname/actionの例外はlocalhost・127.0.0.1・IPv6ループバックと公式テスト鍵の組み合わせだけです。

Wranglerからの正常送信は**実際のResendへメールを送ります**。専用のテスト受信先・API Keyを設定してください。外部送信なしで画面を確認する場合は、先にテストSite Keyでビルドし、次の模擬サーバーを使えます。

```powershell
$env:TURNSTILE_SITE_KEY = '1x00000000000000000000AA'
node scripts/build.mjs
Remove-Item Env:TURNSTILE_SITE_KEY
node tests/contact-preview.mjs
```

`http://127.0.0.1:4175/contact/` を開きます。Widgetは公式テスト鍵で動きますが、SiteverifyとResendはサーバー内の模擬APIになり、実メールは送りません。画面上部の検証専用リンクで正常・送信失敗・通信切断・Turnstile拒否を切り替えられます。このサーバーとテストコードは本番ビルドへコピーされません。

## 運用上のエラー

入力不足・形式不正は入力欄付近へ表示します。Turnstileの失敗は送信確認の案内、設定不足は受付準備中、Resendや通信の障害は再試行案内になります。失敗後の入力はページ内に保持されますが、localStorage等へは保存しません。

自動再送は行いません。通信切断やタイムアウトの場合は送信が受け付けられたか判断できないことがあり、手動で再送すると重複する可能性があります。運営者は受信箱とResendの送信状態を確認できます。秘密値、利用者アドレス、問い合わせ本文をログへ出しません。

DB、添付、問い合わせ一覧、自動返信、専用レート制限基盤は追加しません。Turnstile・honeypot・同一origin検証・入力サイズ制限を使います。過剰送信が実際に起きた場合はCloudflare側の対策を別途検討します。

コード検証、本番公開、実受信確認は別の完了条件です。鍵・DNS・Pagesの設定がまだの場合は、実装済みでも運用完了にはしません。

## 実装・検証状況（2026-10-01）

コード実装とローカル検証を実施済みです。外部サービスとProductionの5変数は運営者から設定完了報告を受領し、本番公開前の最終確認中です。本番公開、Productionの実Widgetによる送信、受信箱への到着・Reply-Toの実確認はまだ完了していません。

| 変更対象                                                                             | 内容                                                                                |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `functions/api/contact.js`                                                           | JSON問い合わせAPI、同一origin・サイズ検証、Siteverify、Resend、秘密値を含まない応答 |
| `src/js/contact-validation.js` / `src/js/contact.js`                                 | 共通入力規則、フォーム状態・二重送信防止・Widget復旧・読み上げ・フォーカス          |
| `scripts/contact.mjs` / `scripts/build.mjs`                                          | フォーム・SEOの静的生成、Site Keyの埋込、API限定routes、About・Privacy更新          |
| `src/pages/template.html` / `src/styles/style.css` / `src/static/_headers`           | フッター導線、既存デザインを使った入力欄、Turnstile用CSP                            |
| `.gitignore` / `.dev.vars.example`                                                   | ローカル秘密値の除外と5変数のひな型                                                 |
| `tests/contact.test.mjs` / `tests/contact-ui.test.mjs` / `tests/contact-preview.mjs` | API・送信状態のテスト、実メールを送らない画面検証サーバー                           |
| 情報ページ・SEOテスト / ビルド監査                                                   | 新ページ、Privacy、導線、ページ数の確認                                             |
| README / 構成・公開資料 / 本資料 / WORK_LOG                                          | 設定・運用・再開手順、検証と未完了の記録                                            |

全96テスト、通常ビルド、889ページ（881詳細・797旧URL）のSEO監査、Prettier check、JS構文確認を実施しました。WranglerでFunctionsのコンパイルとローカルAPIの405・403・設定不足503、静的ページ200を確認しました。ブラウザーでは320/390/768/1024/1440pxの横はみ出し、匿名・返信希望の成功、入力エラー、送信失敗・通信切断・Turnstile拒否、キーボード操作とフォーカスを確認しました。実スクリーンリーダーでの読み上げは未検証です。

公式の公開テスト鍵によるSiteverify実応答は成功・`hostname: example.com`・actionなしでした。ローカルの公式テスト鍵の対だけ、この応答と文書のlocalhost/test例を許容します。Productionでは例外を使わず、公開ホストにテスト鍵があれば設定不正として拒否します。Resendの実送信は行っていません。

`/admin/`、`/admin/news/` のソース・GitHub保存処理・楽曲データは未変更です。既存管理テストとローカル表示を確認済みで、実GitHubトークンを使う保存は今回も実行していません。新しい依存関係はpackage.jsonへ追加せず、Wranglerは必要時に `pnpm dlx` で起動します。既存のlint/typecheck基盤はないため導入していません。
