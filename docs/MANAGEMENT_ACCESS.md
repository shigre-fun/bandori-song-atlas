# 管理画面の配信と認証

管理画面はCloudflare本番だけで使用する。管理URL、許可メールアドレス、トークン、実際の環境変数値はこの文書やGitへ書かない。URLのランダム化は推測への対策であり、閲覧制限はCloudflare AccessとFunctionsの署名検証で行う。

## 配置設定

環境の切り替えが見えない場合の実操作と、2026-10-24のCloudflare設定確認は[初心者向けの設定・確認手順](CLOUDFLARE_SETTINGS_2026-10-24.md)を参照する。同日の本番公開・本人OTP・全経路の結果は[公開確認記録](MANAGEMENT_PUBLICATION_2026-10-24.md)に記載した。以下のローカル検証だけで本番確認を代替しない。

未設定時と `MANAGEMENT_MODE=disabled` は、管理HTML・専用JS/CSS・接続設定をWorkerへ組み込まない。GitHub Pagesのworkflowは明示的にdisabledを指定する。旧管理URLへの互換転送は作らない。

Cloudflare PagesのProductionに、以下をBuild/Runtimeの両方へ設定する。Previewには設定をコピーせず、disabledを維持する。

| 変数                        | 値の形式                                                      |
| --------------------------- | ------------------------------------------------------------- |
| `MANAGEMENT_MODE`           | `protected`                                                   |
| `MANAGEMENT_PATH`           | 暗号学的乱数16byteをhex化した32文字。初回だけ生成し、以後固定 |
| `CF_ACCESS_TEAM_DOMAIN`     | `https://チーム名.cloudflareaccess.com`（末尾slashなし）      |
| `CF_ACCESS_AUD`             | 対象Access ApplicationのAudience、64文字hex                   |
| `MANAGEMENT_ALLOWED_EMAILS` | 運営者指定の許可メール。複数時はカンマ区切り                  |
| `MANAGEMENT_ORIGIN`         | 本番のHTTPS origin（パスなし）                                |

設定不足や不正な値をprotectedビルド時に検出したら、公開を失敗させる。実URLをビルドログへ出さない。正規の管理URLは本番originにランダム文字列と末尾slashを付けたもの。管理画面内のニュース・Creator・専用ファイルも同じroot配下で認証後に返す。これらはdist内の静的ファイルとして保存せず、ignoredな出力別bundleからWorkerへ組み込む。URLエンコードでFunctionsのルート照合を外れても、静的側には管理ファイルが存在しない。公開用のJS/HTML/検索用ファイルからは参照しない。protectedのルーティングも実URLを含めず、既知の公開ファイルはFunctionsから除外する。制御ファイルへの要求は404にする。

## Cloudflare側の設定

1. Zero TrustのAccessでSelf-hosted Applicationを作り、本番ホスト上の管理root（末尾slashなしも含む）と配下を保護する。URL正規化を有効にし、エンコードした別表記からも認証を迂回できないことを確認する。
2. Login methodにOne-time PINを追加する。Allow policyのIncludeは運営者指定メールの完全一致のみとし、RequireでOne-time PINを指定する。Everyone、ドメイン全体、Bypass、Service Authは許可しない。有効期間は24時間。
3. Functions側でも同じteam domain/Audienceを使用し、署名・必須claim・対象メール・本番originを検証する。未認証はAccess側のログインへ進み、Functionsに直接到達した無効な要求は403、設定不足は503、本番以外のホストは404となる。
4. PagesのSettings > Runtime > Fail open / closedを **Fail closed** にする。Functionsが上限到達・障害時に管理ファイルを静的配信しない。
5. Pagesのプレビュー保護を有効にし、生成されたAccess Applicationで `プロジェクト.pages.dev` と `*.プロジェクト.pages.dev` の両方を同じ許可者だけに制限する。既存の過去deploymentにも適用する。本番独自ドメインの一般公開部分は保護対象に加えない。
6. 管理rootに適用されるCache Everything等のキャッシュ上書きがあれば除外する。Functionsは成功・拒否ともno-store/noindex/no-referrerを返す。

Cloudflareアカウントへのサインイン、メールの確認コード入力は運営者が行う。設定を確認できない状態で公開しない。過去の管理画面を含むdeploymentへRollbackすると公開状態が戻るため、障害時は管理をdisabledにした新しいビルドで閉じる。

## 下書きと接続

同一originの旧楽曲管理の下書き・保存先設定は、新管理画面に初めて入った際に両ゲーム分をコピーする。新しい下書きがある場合は上書きせず、旧キーはバックアップとして残す。不正JSONやstorage拒否では元データを保持して画面に通知する。トークン・パスワードをコピーしない。

閲覧認証とGitHubへの保存認証は別。GitHubトークンは従来どおりメモリー内のみとし、ページ再読込・管理ページ間移動後は再接続する。

## 公開前後の確認

- 全標準テスト、保護設定あり・なし双方のビルド/SEO監査、署名つきJWTによる許可/偽造/期限切れ/claim欠落/別メール拒否、下書き移行を検証する。
- 管理rootと末尾slashなし、3管理ページ、専用asset、config、エンコード別表記を未認証で取得できないこと。許可者の実OTP認証後のみ画面を開けること。
- 旧管理URLが404で新URLを案内しないこと。GitHub Pagesに管理ファイルがなく、Cloudflare標準/過去previewも保護されること。
- 旧URLはFunctionsで静的配信より前に404にする。削除済みファイルでもPages側に以前の応答が残る場合があるため、公開後はクエリ文字列なしでも確認する。
- 両ゲーム切替・読込・下書き復元・ニュース/Creator画面を確認する。保存はmockのみで検証し、確認用の本番データを書き込まない。
- 全楽曲/Creator/Work/newsの変更がないこと、一般公開ページ・検索・お問い合わせが正常なこと。

公式資料：[Access Application](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/)、[OTP](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/)、[Pages公式検証plugin](https://developers.cloudflare.com/pages/functions/plugins/cloudflare-access/)、[Functions routingとFail closed](https://developers.cloudflare.com/pages/functions/routing/)、[標準ドメインとpreview保護](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain)。

## 実装時の検証（2026-10-23）

ローカルで標準305件（履歴231＋35＋24、現行15）が成功。管理無効の通常配置・サブパス配置と、架空の認証設定を使った保護配置をビルドし、各1345正規ページ/890曲のSEO監査を通した。管理ファイルはWorker専用bundleにのみ存在し、静的出力・公開JS・ルーティング設定に管理URLがないことを照合した。

Cloudflare公式WranglerでFunctionsコンパイルとローカルruntimeを確認。24種類の通常/エンコード/生HTTP/旧URL/制御ファイル要求を拒否し、公開トップ200・問い合わせGET405を維持した。署名つきJWTの許可、偽造/期限切れ/claim欠落/別メール/別ホスト/鍵取得失敗の拒否、下書きのコピーと元データ保持を検証した。

隔離Chromeで3管理画面×320/390/1280pxの9表示、横はみ出し0・例外0・管理リンク移設、両ゲームの下書き移行/切替/読込/編集/モック保存、ニュース・Creator一覧取得が成功。実GitHub通信を遮断し、保存はメモリー内のmockだけに実施。実メール・本番データへの書き込みは行っていない。

証拠と失敗時の記録は `.cache/management-access-2026-10-23/`、画像と実画面測定は `reports/management-access-2026-10-23/` に保存。初期の静的配信で検出したエンコード迂回はWorker専用bundleで解消し、公開され得るルーティング設定からも管理URLを除いた。確認用APIの再export形式、mock下書き破棄ダイアログ、Chrome内蔵カレンダーのdata画像を外部通信と誤判定した補助検証は修正済み。

**このローカル検証時点では本番は未公開。** CloudflareのAccessポリシー・Production/Preview環境変数・Fail closedと、標準/過去previewの管理URLがAccessへ到達することは2026-10-24に確認した。新しい管理コードの公開と、運営者による実OTP認証後の画面確認は別途完了させる。新URL/許可メール/実際の認証設定はignoredな非公開設定ファイルにのみ保管している。
