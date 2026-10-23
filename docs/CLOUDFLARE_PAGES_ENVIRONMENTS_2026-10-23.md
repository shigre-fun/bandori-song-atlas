# Cloudflare PagesのProduction / Preview分離調査

調査日：2026-10-23（日本時間）
対象：`bandori-song-atlas`。運営者指定のProduction branchは `main`。

## 結論

既存のPages Git連携とDashboard管理を維持する。環境の選択先を確認できない現在の画面では保存せず、Pages APIの `deployment_configs.production.env_vars` と `deployment_configs.preview.env_vars` を明示する方法を推奨する。管理用6変数だけをキー単位で更新し、その他の変数・ビルド設定・バインディングは送信しない。

Production / Previewの分離機能は現行の公式仕様に存在する。Pages APIは両環境を個別に指定でき、変数の削除は対象キーをJSONの `null` にする。公式WranglerのPages secret実装も、選択した環境の対象キーだけをPATCHしている。[公式API更新仕様](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/edit/)、[公式Wrangler実装](https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/pages/secret/index.ts)

**今回は調査のみ。Cloudflare設定変更、認証、実API呼出し、ビルド、デプロイ、commit/pushは実施していない。** 以下のAPI本文とコマンドは将来の設定作業用であり、実行済みではない。管理画面の先行ローカル実装は未公開のまま維持している。

## リポジトリで確認した状態

| 対象                 | 確認内容                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 配信用Wrangler設定   | 追跡ファイルおよび通常のプロジェクト探索範囲に `wrangler.toml` / `wrangler.json` / `wrangler.jsonc` なし。`.cache` 内の検証用生成物は配信用設定ではない |
| Cloudflareの公開経路 | `docs/DEPLOYMENT.md` に記録された既存Pages Git連携。出力 `dist`、Nodeは `.node-version` の22.23.4。リモートの最新値は未取得                             |
| GitHub Pages         | `.github/workflows/pages.yml` は別配信先のworkflow。`MANAGEMENT_MODE=disabled` を明示済み。Cloudflare用workflowとして変更しない                         |
| ビルド時             | `scripts/build.mjs` → `managementSettings(process.env)`                                                                                                 |
| Functions実行時      | `src/server/management-access.js` → `managementSettings(context.env)`                                                                                   |
| 管理設定             | `src/js/management-settings.js` は未設定/disabledで無効、protectedで設定を検証。現在 `CF_PAGES_BRANCH` による強制分岐はない                             |
| 既存変数             | `.dev.vars.example` にお問い合わせ用5変数と管理用6変数。例示ファイルはCloudflareの現在値の証拠ではない                                                  |

したがって、ビルドとFunctions実行時の両方へ同じ環境区分で設定する必要がある。Pagesの環境変数はビルドとFunctionsに使用される。ローカルシェルの変数だけ、またはFunctions用Wrangler `vars` だけで両方を満たしたとは判断しない。[Pages環境変数](https://developers.cloudflare.com/pages/functions/bindings/#environment-variables)

## Dashboardの切り替えが見えない理由について

運営者から、画面URLに `/pages/view/` を含み、「Variables and secrets」は追加・編集でき、Wrangler管理の表示はないと回答を受領した。別製品のWorkers画面を開いている説明、およびWrangler管理による編集ロックの説明には合わない。

公式Bindings文書は現在 `Settings > Variables and Secrets > Add` を案内する一方、Build configuration文書は `Settings > Environment variables` と記載している。環境切り替えの具体的な表示位置は今回確認した文書に書かれていない。特定位置に必ずセレクターがある、または環境別設定が廃止されたとは案内できない。[Bindingsの操作案内](https://developers.cloudflare.com/pages/functions/bindings/#environment-variables)、[Build configurationの操作案内](https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables)

**表示されない直接原因は未特定。** UIの表示状態やアカウント側の差異を確認するには実画面・リモート設定が必要で、現時点の証拠ではUI変更、不具合、権限等のどれかに断定できない。「Previewがまだないから」などの推測も根拠にしない。UI自動読取はkernel assets missingで起動できず、Cloudflare API認証もこの実行環境にないため、リモート設定は取得していない。

追加/編集できるだけでは、現在表示中の環境がProductionかPreviewかは判別できない。画面を再読込しても選択先を確認できない場合は、APIで環境を明示すればこのUI上の不確実性を回避できる。Wrangler管理かどうかの最終確認には、次のGETで環境別 `wrangler_config_hash` と実際のビルドルートを確認する。

## 目標とする設定

| 変数                        | Production                          | Preview                  |
| --------------------------- | ----------------------------------- | ------------------------ |
| `MANAGEMENT_MODE`           | `protected`（plain_text）           | `disabled`（plain_text） |
| `MANAGEMENT_PATH`           | 既存の固定値（secret_text）         | キー自体なし             |
| `CF_ACCESS_TEAM_DOMAIN`     | 対象Accessチーム（secret_text）     | キー自体なし             |
| `CF_ACCESS_AUD`             | 対象ApplicationのAUD（secret_text） | キー自体なし             |
| `MANAGEMENT_ALLOWED_EMAILS` | 許可者の実値（secret_text）         | キー自体なし             |
| `MANAGEMENT_ORIGIN`         | 本番origin（secret_text）           | キー自体なし             |

非modeの5変数はすべて暗号化して扱う方針とする。実際の値をGit、スクリーンショット、チャット、コマンド履歴、デバッグログへ記載しない。管理パスは再生成せず既存の固定値を使う。Previewは空文字で残すのではなく削除する。お問い合わせ用の `TURNSTILE_SITE_KEY`、`TURNSTILE_SECRET_KEY`、`RESEND_API_KEY`、`CONTACT_TO_EMAIL`、`CONTACT_FROM_EMAIL` と、ここに列挙していない全既存変数を保持する。

## 将来実行する設定手順（今回未実行）

### 1. 読み取りで現状を確認する

運営者がCloudflareへサインインし、対象アカウントを確認する。APIを使う場合は、そのアカウントに限定したPages Read権限のトークンで事前確認する。後述の更新時はPages Write権限が必要。認証値は安全な入力からプロセスへ渡し、コマンド行に実値を書かない。[公式GET・必要権限](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/)

```http
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/bandori-song-atlas
Authorization: Bearer {非公開トークン}
```

GETのレスポンスは平文変数の値を含み得る。コンソールやファイルへ丸ごと出さず、メモリー内で次を確認する。

- `name` が対象プロジェクト、`production_branch` が `main`。`source` のGit連携とブランチ設定も一致すること。
- `build_config.root_dir`、`build_command`、`destination_dir` が既存の想定と一致すること。違えば上書きせず調査する。
- `deployment_configs.production` / `.preview` があり、それぞれの変数名・型・設定有無を確認できること。
- 各環境の `wrangler_config_hash` が空か確認する。非空なら既存Wrangler管理の可能性を調べ、その設定と整合するまで以下のPATCHを行わない。
- 環境別の互換日付/フラグ、Fail open/closed、既存のKV/D1/R2等のバインディングをメモリー内に保持する。

確認結果に出すのは変数名・型・有無・期待値との一致/不一致だけとする。値やAPIレスポンス全文、HTTPデバッグ出力を保存しない。暗号化済みの値は再取得できる前提にせず、伏字・マスク・空値を更新本文へコピーしない。

### 2. 管理用キーだけのPATCHを組み立てる

更新直前に再GETして、並行編集がないことを確認する。実値は保護された入力からメモリー内に読み込む。以下は**構造を示すプレースホルダー**であり、このまま送信しない。

```http
PATCH https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/bandori-song-atlas
Authorization: Bearer {非公開トークン}
Content-Type: application/json
```

```json
{
  "deployment_configs": {
    "production": {
      "env_vars": {
        "MANAGEMENT_MODE": { "type": "plain_text", "value": "protected" },
        "MANAGEMENT_PATH": {
          "type": "secret_text",
          "value": "<固定済みの管理パス>"
        },
        "CF_ACCESS_TEAM_DOMAIN": {
          "type": "secret_text",
          "value": "<対象チームのHTTPS URL>"
        },
        "CF_ACCESS_AUD": {
          "type": "secret_text",
          "value": "<対象ApplicationのAUD>"
        },
        "MANAGEMENT_ALLOWED_EMAILS": {
          "type": "secret_text",
          "value": "<許可メールの実値>"
        },
        "MANAGEMENT_ORIGIN": {
          "type": "secret_text",
          "value": "<本番HTTPS origin>"
        }
      }
    },
    "preview": {
      "env_vars": {
        "MANAGEMENT_MODE": { "type": "plain_text", "value": "disabled" },
        "MANAGEMENT_PATH": null,
        "CF_ACCESS_TEAM_DOMAIN": null,
        "CF_ACCESS_AUD": null,
        "MANAGEMENT_ALLOWED_EMAILS": null,
        "MANAGEMENT_ORIGIN": null
      }
    }
  }
}
```

既にPreviewで不在のキーは本文から省略してもよい。削除には `null` を使い、`env_vars` 全体を `null` や空マップへ置き換えない。`source`、`production_branch`、`build_config`、互換設定、Fail open/closed、他のバインディングは本文に含めない。GET結果全体や全変数をPATCHへ戻す方法も使わない。このキー単位の方法は公式Wranglerのput/deleteと同じ更新形である。[公式API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/edit/)、[公式CLIの更新・削除実装](https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/pages/secret/index.ts)

### 3. 送信後に再取得し、変更範囲を比較する

将来の設定変更が許可された時だけ送信する。成功/失敗とHTTPステータスだけを出し、更新レスポンス全文をログへ出さない。タイムアウトしたら再GETで適用状態を確認してから判断する。

Productionの6キーの型/有無とmode、Previewのmodeと残り5キーの不在を検証する。非対象変数は、平文ならメモリー内で値も比較し、暗号化値は型と存在を比較する。暗号化値の同一性をAPI応答だけで証明できるとは扱わず、非対象キーを送信していないことも確認根拠にする。

`source`、`production_branch`、`build_config`、環境別互換設定・Fail open/closed・全バインディングが変更前と一致することを確認する。差異があれば公開へ進まず、並行操作や既存管理方式を調査する。復旧が必要な場合も対象の管理キーだけを扱い、マスクされたsecretを戻さない。

**ここまでがプロジェクト設定の変更であり、公開や過去deploymentの保護完了ではない。** 設定後のビルド・Functions反映と実環境検証は別段階で行う。今回はこの段階にも進めていない。

## Wranglerを使う代案と、設定ファイルを追加しない理由

Pages secretsは環境を明示して操作できる。例えば次は、将来Productionの1変数を暗号化入力で設定するコマンドである。

```sh
wrangler pages secret put MANAGEMENT_PATH --project-name bandori-song-atlas --env production
```

他の非mode4変数も同じ形で指定できる。secretの実値は対話入力し、引数へ書かない。`pages secret list --project-name bandori-song-atlas --env production` と `--env preview` はsecretの名前を確認できるが、plain_textを含む全変数の監査にはならない。modeの平文設定とPreviewの削除をまとめて行う今回の目的には、上記の最小API本文が分かりやすい。[Wrangler Pagesコマンド](https://developers.cloudflare.com/workers/wrangler/commands/pages/)

公式Wrangler 4.152.0のローカル実装も照合し、`--env` は `production` / `preview` のみ、省略時はproductionとなることを確認した。必ず明示する。`wrangler secret put` はWorkers用なので使わない。Wranglerはログファイルを作るため、将来利用する際もHTTPデバッグ/verbose/端末トランスクリプト等へ値が出ない実行方法を確認する。今回、リモートCLI操作はしていない。

新しい `wrangler.jsonc` 等を追加すること自体は可能だが、今回は推奨しない。導入すると設定ファイルが配信設定の正となり、Dashboardの対応項目は編集できなくなる。Pagesの環境名は `production` / `preview` の2つで、`vars` 等の非継承項目と既存バインディングを各環境で整合させる必要もある。[公式Wrangler設定・移行・継承仕様](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)

将来Wranglerへ移行する場合は、現プロジェクトのAPI読取と照合したうえで、Git対象外の隔離ディレクトリで `wrangler pages download config bandori-song-atlas` を使って既存設定を取得・点検する。このコマンドはWranglerファイルを生成/上書きするため、現作業ディレクトリで不用意に実行しない。生成物には平文設定が入り得るので公開しない。実値を除去しても、secret名と型、両環境の全バインディング、既存互換日付/フラグ、ビルド出力等の整合確認は必要。Previewの互換日付がLatestの場合、取得したファイルでは固定日付になる点も扱う。

`[env.production.vars]` / `[env.preview.vars]` はFunctionsの設定であり、Nodeのビルド処理への供給を自動的に満たすとは判断しない。`.dev.vars` や `--binding` はローカル検証用で、Pagesのリモート環境分離の代わりにはならない。必要なら `CF_PAGES_BRANCH` を用いたPreviewビルドの強制無効化を将来追加できるが、これは補強であり、リモート変数の分離を省略する理由にしない。[公式ビルド変数](https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables)

## 設定後、公開前に残る確認

[管理配信・認証手順](MANAGEMENT_ACCESS.md)のAccess許可ポリシー・24時間OTP・Fail closed・標準ドメイン/過去Previewの保護を確認する。将来の新規Productionビルドではprotected、Previewビルドではdisabledがビルド時とFunctions実行時の両方で一致し、Previewに管理ファイルと専用bundleが含まれないことを確認する。実値をログへ出しての確認はしない。

変数の分離だけで過去deploymentや別ホストからの閲覧制限が完了したとは扱わない。公開の許可後に、新しい両環境と過去の配信経路を検証する。一般公開ページ・お問い合わせの確認も維持する。先行実装でローカル305テスト等は成功済みだが、本調査でリモートProduction/Previewの設定・実ビルド・実OTPを確認したとは報告しない。

## 今回の検証範囲

- リポジトリ設定・既存未コミット差分・ビルド/実行時の読取箇所を照合した。
- Cloudflare公式ドキュメント、公式Wranglerソース、ローカルWrangler 4.152.0の対象処理を照合した。
- 報告書のJSON例をパースし、管理6キーだけの環境別指定、Productionの型/プレースホルダー、Previewのdisabled/5キーnullを検証した。開始時の既存1174ファイルのSHA256、HEAD、空indexが不変であることも確認した。証拠はGit対象外の `.cache/cf-pages-environments-2026-10-23/verification.json` に保存。
- 実Cloudflare設定のGET/PATCH、実Dashboard操作、トークン入力、ビルド/テスト再実行、デプロイはしていない。切り替え非表示の直接原因とリモート設定は未確認として残す。
