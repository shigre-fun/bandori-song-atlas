# バンドリ楽曲録

作詞・作曲・編曲の[Creator DBとWork仕様](docs/CREATORS.md)を追加しました。`/creators/` で参加作品を探し、`/admin/creators/` で確認済み主体を登録します。人物同定は段階migrationで進め、未確認表記を推測統合しません。

作詞・編曲はデータセット全体の未整備を明示します。[第2フェーズ検証報告](docs/CREATOR_PHASE2_REPORT.md)と[同定候補レビュー](docs/migrations/creators-2026-10-02/creator-review.md)に確認済みの範囲と残件を記録しています。

第3フェーズは公式・一次情報で確認したcomposerを89主体まで登録しています。[調査根拠](docs/migrations/creators-2026-10-02/creator-research.json)にCONFIRMED/PROBABLE/UNRESOLVEDと旧表記・対象曲の対応を保存しています。[第3フェーズ報告](docs/CREATOR_PHASE3_REPORT.md)に上位30件・カバレッジ・検証・公開前の確認事項を記録しました。保留主体を登録せず、既存の曲表示は維持します。

人間レビュー反映後は91主体です。標準名・alias・slugを更新し、旧Creator URLの履歴と転送を追加しました。[人間レビュー反映報告](docs/CREATOR_HUMAN_REVIEW_REPORT.md)と[GEN / ARM / TAKE / yasu / KATSUの対象曲](docs/migrations/creators-2026-10-02/short-name-review.md)を確認してください。5主体の同定は据え置き、JACK / Louisは未同定のままです。

ユーザー確認済みの最後の5slugを採用し、ID型slugは0件になりました。固定ID・読み・楽曲・Workを維持し、旧slug履歴18件、Cloudflare転送36規則、静的互換18ページを生成しています。2026-10-03に[Creator DBを本番公開](https://tanimachi-bdsongs.com/creators/)し、CI・Cloudflare deploy・本番確認を完了しました。[公開結果の42項目と検証記録](docs/CREATOR_RELEASE_REPORT.md)、[公開前の最終slug検証](docs/CREATOR_FINAL_SLUG_REPORT.md)を参照してください。

ガルパとアワーノーツの楽曲情報を手動で編集し、静的なウェブサイトを生成するプロジェクトです。アワーノーツには、公式発表でリリース時の実装が確認できた78曲を登録しています。
収録データはゲーム等で確認しながら修正してください。

トップページの「全ゲームから楽曲を検索」から、ガルパ・アワーノーツの曲名・読み・別名・原曲アーティスト・作品名をまとめて検索できます。検索結果はゲーム順・バンド順に50件ずつ表示し、同名曲や別バージョンも個別に掲載します。各結果にはガルパ5種類・アワーノーツ4種類の難易度とレベルを表示します。結果から開いた詳細の戻るリンクは、検索語とページ番号を維持して横断検索へ戻ります。

SEOとOGPの設計は[構成資料](docs/ARCHITECTURE.md)、Cloudflare Pagesでのビルドは[公開手順](docs/DEPLOYMENT.md)を参照してください。

正規化済みの作詞・作曲・編曲者名はCreatorページへ移動します。未同定クレジット・原曲アーティストは従来の横断検索へ移動し、名前別の検索と詳細からの戻り先にも条件を引き継ぎます。検索時の表記差吸収は人物のID同定や自動統合には使用しません。

一般利用者向けの `/contact/` は匿名で送信でき、返信希望時だけメールアドレスを入力します。送信はCloudflare Pages Functions、Turnstile、Resendで処理します。公開前の外部サービス・環境変数設定とローカル検証は[お問い合わせの設定・運用](docs/CONTACT.md)を参照してください。

BPM（基本・下限・上限）とゲーム内演奏時間も編集できます。BPM順・演奏時間順の定義と既存曲の調査方法は[BPMと演奏時間](docs/SONG_TIMING.md)を参照してください。

一覧では難易度（初期EXPERT）と並べ方を別々に選びます。レベル順・ノーツ数順は選択した難易度を使用し、他の並べ方は難易度に影響されません。選択中の並べ方ボタンを押すたびに通常順（▲）と逆順（▼）を切り替えます。レベル・ノーツ数・BPM・時間は初回選択で大きいものから表示し、未実装・未確認は常に最後です。

- [公開サイト](https://tanimachi-bdsongs.com/)
- [ガルパ楽曲一覧](https://tanimachi-bdsongs.com/garupa/songs/)
- [アワーノーツ楽曲一覧](https://tanimachi-bdsongs.com/ournotes/songs/)
- [お知らせ](https://tanimachi-bdsongs.com/news/)
- [スマホから楽曲を追加する管理ページ](https://tanimachi-bdsongs.com/admin/)

## 最初の準備

Node.js 22以上をインストールし、このフォルダーで `npm install` を実行します。
pnpmを使用する場合は `pnpm install` でも構いません。

## 既存の楽曲を修正する

スマホからは[管理ページ](https://tanimachi-bdsongs.com/admin/)に接続し、「曲の一覧を取得・更新」→曲を検索・選択→「選んだ曲を読み込む」→「変更を保存する」で修正できます。URLと管理IDは維持し、他端末で同じ曲が変更されていた場合は上書きを停止します。詳細は[管理ページの手順](docs/ADMIN.md)を参照してください。

以下はPCでファイルを直接修正する手順です。

1. `data/garupa/songs.json` をテキストエディターで開き、対象曲の `id` を探します。
2. 曲固有の項目を修正し、UTF-8で保存します。バンドと種類はその曲が属するグループで管理します。
3. `node scripts/build.mjs` を実行します。
4. `node scripts/serve.mjs` を実行し、ブラウザーで `http://127.0.0.1:4173` を開きます。公開サイトと同じルートパスが既定値です。

曲名が同じ場合も `id` で区別します。既存曲のバンドや種類を変更する場合は、曲のオブジェクトを正しいグループへ移してください。
旧曲名URLの互換情報は `data/garupa/legacy-song-paths.json` に固定してあります。
`id` は恒久URLにも使う管理番号です。既存曲の番号は変更・再利用しないでください。URLは `/garupa/songs/{id}/` です。

アワーノーツの追加・修正は [共通管理ページ](https://tanimachi-bdsongs.com/admin/?game=ournotes) で「アワーノーツ」を選んで行えます。手動では `data/ournotes/songs.json` の該当バンド・種類のグループを編集し、追加時は `data/ournotes/admin-state.json` の `nextId` も更新してください。IDは恒久URL `/ournotes/songs/{id}/` に使うため、曲名変更後も保持します。EASY〜EXPERTのレベルとノーツ数、BPM、ゲーム内演奏時間、作曲者、カバー曲の原曲情報は確認できた値だけ入力します。

## 新曲を追加する

スマホからは、公開サイトの `admin/` にある管理ページへ入力して追加できます。GitHubへの保存とサイトの自動更新に対応しています。初回の接続・公開設定は [スマホ管理ページの手順](docs/ADMIN.md) を参照してください。

以下はPCでファイルを直接追加する場合の手順です。

```powershell
node scripts/add-song.mjs "新しい楽曲名"
```

追加された曲を `data/garupa/songs.json` のIDで探し、グループのバンドと曲の空欄を埋めてからビルドします。管理番号は自動で割り当てられます。
元のひな型は `templates/song.json`、各項目の説明は `templates/README.md` にあります。
未入力のレベル・ノーツ数や重複した番号は、生成時にエラーで知らせます。
一覧・詳細の「データセット更新記録」は、ガルパでは `data/settings.json` と `data/garupa/admin-state.json` の `updatedAt` の新しい方、アワーノーツでは `data/ournotes/admin-state.json` の `updatedAt` を表示します。JSONを直接編集した場合は自動更新されないため、記録日も必要に応じてISO形式で修正します。

## お知らせを追加する

スマートフォンからは[お知らせ管理ページ](https://tanimachi-bdsongs.com/admin/news/)でGitHubに接続し、追加・修正できます。保存後にサイトへの反映を確認できます。

`data/news.json` を開き、配列に新しい項目を追加します。各項目の `date` は掲載日（`YYYY-MM-DD`）、`title` は見出し、`description` は本文、`category` は分類です。分類は `site`（サイト）、`data`（データ更新）、`feature`（機能追加）、`maintenance`（メンテナンス）から選びます。分類を増やす場合は `src/js/news-data.js` の表示名も追加してください。

```json
{
  "date": "2026-09-30",
  "title": "Xアカウントを開設しました",
  "description": "運営者タニマチのXアカウントを開設しました。",
  "category": "site"
}
```

`node scripts/build.mjs` を実行すると、`/news/` は日付の新しい順に自動で並び、トップページには最新3件まで表示されます。トップページを手で編集する必要はありません。運営者のXプロフィールURLは `src/js/site-config.js` の `OPERATOR_X_URL` で変更できます。

## ファイルの役割

| 場所                                    | 内容                           |
| --------------------------------------- | ------------------------------ |
| `data/garupa/songs.json`                | ガルパの楽曲データ             |
| `data/ournotes/songs.json`              | アワーノーツの確認済み楽曲     |
| `data/news.json`                        | サイト内のお知らせ             |
| `data/garupa/legacy-song-paths.json`    | 旧曲名URLと恒久IDの対応        |
| `data/garupa/song-timing-research.json` | BPM・演奏時間の調査固有情報    |
| `src/js/`                               | 共通設定・表示・検索・管理画面 |
| `src/pages/`                            | ページのHTMLひな型             |
| `src/styles/`                           | 画面のCSS                      |
| `src/images/`                           | サイト画像とアイコン           |
| `assets/fonts/`                         | OGP生成用フォントとライセンス  |
| `src/static/`                           | 公開先用の静的設定             |
| `scripts/`                              | 生成・新曲追加・ローカル確認   |
| `scripts/research/`、`scripts/assets/`  | 調査・画像生成の補助ツール     |
| `scripts/qa/`                           | 生成物の監査                   |
| `reports/`                              | 自動生成した品質レポート       |
| `dist/`                                 | 自動生成した公開用ファイル     |

`dist` を直接編集すると再生成で上書きされます。必ず `data` または `src` を編集してください。
データを外部から取得して上書きする処理はありません。
過去の取得資料はローカルの `archive/legacy-acquisition-2026-09-25.zip` に保管し、現行ビルドには使用しません。

## 検証・公開ファイルの作成

```powershell
node scripts/build.mjs
pnpm test
powershell -ExecutionPolicy Bypass -File scripts/package.ps1
```

最後のコマンドで `bandori-song-atlas.zip` を作成します。公開用ファイルは `dist` に生成され、Cloudflare Pagesではサイトのルートで配信します。
Netlify向けの設定は `netlify.toml` にあります。コードの整形には `npm run format` を使えます。

### クレジット Phase B2

node scripts/migrations/apply-credits-phase-b2.mjs plan|apply|verify で、最新human reviewから正式IDへの適用案・SHA照合付き適用・再適用不変を検証できます。資料は docs/migrations/credits-phase-b2-2026-10-03/ に保存します。A/B1の根拠とOurNotes残80件の手動templateは変更しません。

適用後の plan はdry-run結果だけを表示し、初回の apply-plan / coverage / display-comparison を保持します。初回比較を確認する場合はこれらの保存資料を参照してください。

pnpm test は旧194テストのassertを変更せず、SHA検証済み91 Creator時点の履歴入力と現在のコードを独立した .cache/b2-historical-regression/ で回帰検証します。旧B2の35テストも承認時点の履歴入力で維持し、その後releaseの現行データを24テストで検証します（合計253）。履歴fixtureはliveデータの復元書き込みには使用しません。

2026-10-04 releaseでは124 Creator／885収録／823 Workです。人間承認済みの共同編曲6件と、最新mainのOurNotes86「過去を喰らう」・譜面編集を保持します。新曲のWorkは明示リンク先Garupa758を再利用し、未登録作曲名はraw fallbackのままです。並行編集の有限manifestとSHAを release-parallel-preservation.json に保存し、未承認のnon-credit変更はverifyで拒否します。OurNotes編曲の未収集は旧80＋新1＝81件です。

roleCoverageは従来のrole単位表記に加え、ゲームごとの ready / partial / unprepared を扱います。OurNotes編曲のpartialは確認済み登録分を集計し、残未整備を担当者なしと解釈しません。同じCreatorの表記が担当で異なる場合はrelationの displayOverrides にrole別表記を保持し、従来の displayOverride も引き続き利用できます。
