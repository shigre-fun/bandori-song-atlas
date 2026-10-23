# Cloudflareの管理画面設定と確認手順

2026-10-24、日本時間。対象Pagesプロジェクトは `bandori-song-atlas`。

## 今回確認・設定した内容

運営者のサインイン後、実DashboardでProductionとPreviewを確認した。環境選択のメニューが見えなくても、設定ページのURL末尾を切り替えることで、それぞれの環境を開けた。今回の操作にはPages API用トークンの作成やWrangler設定ファイルの追加は不要だった。

| 環境       | 管理設定                    | 保存後の再読込で確認した状態          |
| ---------- | --------------------------- | ------------------------------------- |
| Production | `MANAGEMENT_MODE=protected` | modeはText、残りの管理用5変数はSecret |
| Preview    | `MANAGEMENT_MODE=disabled`  | ほかの管理用5変数は存在しない         |

両環境のFail closedを確認した。本番の管理rootと配下に限定したAccessアプリ、およびPagesの標準/Preview用Accessアプリがあり、両方で指定メール1件のみ、Require One-time PIN、24時間を確認した。管理URL・メール・team domain・AUDの実値はこの文書には記載しない。

独自ドメインのURL NormalizationはCloudflare形式・Normalize incoming URLsがONで、Accessの判定前に正規化される設定だった。Cache Rules / Cache Response Rules / Page Rulesはいずれも0件で、管理画面のno-storeを上書きする規則はなかった。これらは読取のみで変更していない。

本番側の管理用5変数をTextからSecretへ変更した。クラウドですでに設定されていた管理パスを維持し、本番Accessのパス/AUDとの一致を確認した。ローカルの非公開設定はクラウドの値へ同期し、以前の非公開ファイルもGit対象外のバックアップとして保持した。

Pages用Accessアプリへ標準ドメイン本体を追加し、既存のPreview用ワイルドカードも残した。最初に本番管理用アプリへ追加した標準ドメインは元に戻しており、本番アプリの公開対象は従来の管理rootと配下のままである。移動途中の重複destination保存はCloudflareに拒否され、対象を整理して保存し直した。

既存のお問い合わせ用変数、Git連携、Production branch `main`、ビルドコマンド/出力、互換日付、301転送は変更していない。保存後に全13変数の名前/型、読取可能な非対象の平文3変数の値、Previewの3変数を再確認した。既存secretの実値を読み出したり再入力したりしていない。

## 後でProduction / Previewを開く方法

1. Cloudflareへログインする。
2. Workers & Pagesから `bandori-song-atlas` を開き、Settingsを押す。
3. ブラウザーのアドレス欄を確認する。本番側は末尾が `/settings/production` になる。
4. Previewを確認する場合は、末尾の `production` だけを `preview` に置き換えてEnterを押す。
5. PreviewではBranch controlに「Preview branch」、管理modeに `disabled` が表示されることを確認する。

URLの形は次のとおり。`<account_id>` の部分は開いているURLをそのまま使い、新しく入力し直す必要はない。

```text
https://dash.cloudflare.com/<account_id>/pages/view/bandori-song-atlas/settings/production
https://dash.cloudflare.com/<account_id>/pages/view/bandori-song-atlas/settings/preview
```

画面内の変数inputの内部IDにはPreviewでもproductionという文字が含まれていたため、内部IDだけでは環境を判断しない。URLとBranch control、modeの表示を合わせて確認する。

## 変数の編集方法

SettingsのVariables and secretsで、管理変数は次の状態を維持する。

| 変数名                      | Production                  | Preview           |
| --------------------------- | --------------------------- | ----------------- |
| `MANAGEMENT_MODE`           | Text / `protected`          | Text / `disabled` |
| `MANAGEMENT_PATH`           | Secret / 固定値             | なし              |
| `CF_ACCESS_TEAM_DOMAIN`     | Secret / 設定済み           | なし              |
| `CF_ACCESS_AUD`             | Secret / 設定済み           | なし              |
| `MANAGEMENT_ALLOWED_EMAILS` | Secret / 指定した所有者のみ | なし              |
| `MANAGEMENT_ORIGIN`         | Secret / 本番origin         | なし              |

編集すると画面下にUnsaved changesとSaveが出る。Saveを押し、処理が終わってからページを再読込して確認する。Secretの値が表示されなくなるのは正常。値が見えないことを理由に空値を保存しない。管理パスを変える場合は、Accessの保護対象も同時に整合させる必要があるため、片方だけを書き換えない。

今回の実画面では、管理用5変数の暗号化はTypeをSecretに変更してSaveすることで行えた。編集/保存方法の公式案内は[Pagesの環境変数とsecrets](https://developers.cloudflare.com/pages/functions/bindings/#environment-variables)を参照。

## Accessの設定を確認する方法

Zero Trust → Access controls → Applicationsを開く。本番管理用アプリは管理rootと配下だけを対象にし、一般公開の独自ドメイン全体は対象にしない。Pages用アプリは標準ドメイン本体と、その前にワイルドカードが付いたPreviewを対象にする。

Policiesで、Includeが指定メール1件のみ、RequireがLogin Method / One-time PINであることを確認する。DetailsのSession Durationは24 hoursを維持する。[Accessの公式設定方法](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/)、[Pages標準ドメイン/Previewの公式注意事項](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain)

## 公開前の実確認と、その後の公開

認証Cookieを送らないHTTP確認では、公開トップ/お問い合わせページ200、問い合わせAPIのGET405、本番管理root/ニュース/偽造Cookie要求は302でAccessへ進むことを確認した。標準ドメインと新旧deploymentの管理URLは既存の301転送を経由し、独自ドメイン側のAccessへ302となる。転送後の一般ページが見えただけで認証を迂回できたとは判断せず、管理URLの転送先まで確認する。

証拠はGit対象外の `.cache/management-release-2026-10-24/cloudflare-settings.json` と `.cache/management-access-2026-10-23/cloudflare-edge-audit-2026-10-24.json`。管理URLのメール入力画面は、実アドレス/team名を除いたフォーム部分だけを `access-login.png` として保存した。

上記はコード公開前の設定確認。その後、運営者から「本番公開まで進める」の回答を受けてコードを公開し、本人OTP・旧URLの404・GitHub Pagesへの反映・全経路を確認した。旧管理ページの残存キャッシュも配信処理で明示拒否する修正を公開した。[最終製品と検証結果](MANAGEMENT_PUBLICATION_2026-10-24.md)を参照する。
