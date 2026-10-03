# Creator DB実装報告（2026-10-02）

これは第1フェーズ完了時の履歴です。第2フェーズのroleCoverage・確認済み同定・実ブラウザー検証は[第2フェーズ報告](CREATOR_PHASE2_REPORT.md)を参照してください。

Creator・WorkのID基盤、公開ページ、GitHub管理、楽曲選択UI、安全な段階移行を実装しました。仕様75に従い、根拠のない人物同定・種別・読みは確定していません。確認済みCreatorは2主体、未同定の旧表記は341種類です。全件同定済みのDBとは扱わず、本番pushはしていません。

詳細な運用手順は[CREATORS.md](CREATORS.md)、移行資料は[migrations/creators-2026-10-02](migrations/creators-2026-10-02/)にあります。

1. **既存クレジット**：両ゲームの`groups[].songs[]`に単一の`composer`文字列がありました。作詞・編曲の保存項目はありませんでした。既存の文字列分割例外と原曲アーティストは維持しています。
2. **ゲーム間リンク**：`relatedSongIds`の`garupa:ID`/`ournotes:ID`による明示相互参照。既存の詳細・検索復帰導線を利用しました。
3. **既存Work機能**：共有作品IDはありませんでした。同一ゲームのFULLリンクも既存相互参照にありました。
4. **Work設計**：`data/works.json`の固定`wk-NNNN`と各レコードの`workId`。明示リンクの連結成分を使い、タイトル一致だけでは統合しません。creditは収録側に保存し、作品の参加者・担当は収録から導出します。
5. **Creator保存場所**：`data/creators.json`。公開用の小さなmasterをbuild時に生成します。
6. **Creator schema**：`id, slug, name, sortKey, type`が必須、`aliases`は任意の文字列配列。typeはperson/organization/unit。rootにはversion/nextIdを保持し、削除済みIDを再利用しません。
7. **credit schema**：`credits:[{creatorId,roles:[lyricist|composer|arranger],displayOverride?}]`。同Creatorは1relationで複数担当。`creditDisplay`のrole別ID tokenが表示順を保持します。
8. **displayOverride**：表示専用の文字列。ID・作品集計に影響しません。同じレコード内の同Creatorでは担当間で共通。省略するとmaster標準名を使用します。
9. **Creator移行数**：master2主体（上松範康、Elements Garden）。上松66収録をID化。単独Elements Gardenクレジットは0件、所属表記による組織への加算はありません。
10. **楽曲移行数**：ガルパ799、アワーノーツ85、計884レコード。既存項目・グループ・順序をGit HEADとのdeep比較で保持確認しました。大量差分は全曲へのworkId/credits/creditDisplay追加によるものです。
11. **統合した表記**：明示mapに登録した上松範康の所属込み表記だけを同じIDへ対応。空白除去・類似文字列による自動統合はありません。
12. **確認待ち表記**：342元クレジット種類のうち341種類を旧表示のunresolved tokenとして保持。候補352名前tokenをレポート化し、名前/type/読みの推測登録はしていません。
13. **Work移行結果**：823作品＝57複数収録群＋766独立収録。FULL7件は既存明示リンクに従い同一作品へ。上松の集計は59作品/66収録です。
14. **Work整合性**：同Workの表記差2組をwarning/reviewRequiredで保持。「ちゅ、多様性。」の真部名の空白と、「春日影」の藤田名の括弧形式。収録別表記を統一していません。
15. **Creator一覧**：`/creators/`に名前/別名/読み検索、名前順・参加作品数順・作詞/作曲/編曲作品数順。SSRに名前順・数値・リンクを含め、JSはDOMを絞り込みます。
16. **Creator詳細**：`/creators/{slug}/`に標準名、種別、総作品数/収録数/担当数、Work単位の参加楽曲と参加している各ゲーム収録へのリンク。0件の主体もページを生成します。
17. **role/game filter**：URL queryとpushState/popstateで検索・担当・ゲーム状態を共有/再読込/戻る・進むで再現。同じ収録が両条件を満たす必要があります。総参加数は固定、表示作品数は別表示。canonical/sitemapは基本URLです。
18. **楽曲詳細リンク**：ID化された作詞/作曲/編曲はCreator詳細へ。未同定名の旧横断検索、原曲アーティスト検索、両ゲーム関連リンクは保持しています。
19. **Creator管理**：`/admin/creators/`で接続・検索・新規・編集・削除、readonly固定ID、name/sortKey/slug/type/aliases入力、保存commit/更新処理/公開master一致確認。tokenはメモリーだけで、接続後に入力欄を消去します。
20. **楽曲管理**：登録済みCreatorの検索・担当別複数選択・順序変更・表示名上書き、既存/新規Work選択。旧composer欄は表示確認用readonly。確認待ち担当は旧表示を保持し、人間の同定後に明示解決してから変更します。
21. **削除制約・競合**：参照曲数/収録数を示して参照中Creatorの削除を拒否。master SHA一致を要求し最新両ゲームを検証、原子的Git tree/commitとforce:false branch更新。応答消失時の同操作再送はoperationIdで重複作成を防ぎます。
22. **変更ファイル**：下記の一覧。distは正規build生成のみで直接修正していません。外部サービス・SQL・CMS・原曲アーティストDBは追加していません。
23. **tests**：Creator/Work schema・存在しない参照・重複・role/override・alias検索・複数担当/順序・作品/収録/FULL集計・表示2,652比較・明示リンク・SSR/SEO・模擬GitHubCRUD/SHA/競合/再送/新Work原子保存・可逆migrationと既存全テスト。最終結果は下記検証欄へ記録します。
24. **build**：rootと`/bandori-song-atlas/`の2配置で正規生成、致命的なデータ不整合は生成前に失敗。現データは意図した2Work warningのみです。
25. **SEO監査**：Creator一覧/詳細の基本canonical、title/description/OGP、sitemap、内部リンク、管理noindex/一般導線からの管理URL非露出、既存詳細/旧URL/検索・contact等を監査します。
26. **既存回帰**：既存全テスト、両ゲーム保存/新曲採番、旧検索・関連曲・難易度・管理draft・news/contact/SEO/asset versionの検証を維持。ブラウザーで5幅・検索・担当/ゲーム・URL履歴・EnterリンクとCreator管理の一部を確認しています。
27. **未解決**：341旧表記の同定/type/読み、2Work表記差の人間確認、公開後slug変更時の旧slug転送。実GitHubへの書込・本番公開は未実施。ブラウザー操作・Functions compileの検証限界は下記に記録します。
28. **OriginalArtist DBへの再利用**：固定master ID/slug/aliases、SHA付きGitHub CRUD/採番/参照削除制約、token管理、選択UI、Work所属、収録と作品を区別した集計、SSR/URLfilter/SEO、report→backup→apply→verify/restoreの移行方式。Creator rolesと原曲アーティストrelationは別概念として追加できます。

## 変更ファイル

- データ：`data/creators.json`、`data/works.json`、`data/garupa/songs.json`、`data/ournotes/songs.json`。
- 正規化/公開：`src/js/creators-data.js`、`credit-display.js`、`credit-structure.js`、`creator-views.js`、`creators.js`、`views.js`、`domain.js`、`urls.js`、`song-schema.js`。
- 管理：`src/js/github-creator-store.js`、`github-store.js`、`admin-creators.js`、`creator-picker.js`、`admin.js`、`src/pages/admin-creators.html`、`admin.html`、`admin-news.html`。
- 生成/表示：`scripts/build.mjs`、`catalog.mjs`、`add-song.mjs`、`qa/audit-build.mjs`、`src/pages/template.html`、`src/styles/style.css`、`templates/song.json`。
- 移行：`scripts/migrations/creators.mjs`、`resolve-creator-credits.mjs`、`docs/migrations/creator-map.json`、`docs/migrations/creators-2026-10-02/{credit-report,work-report,legacy-credits}.json`。
- テスト：`tests/creators.test.mjs`、`creator-admin.test.mjs`、`creator-picker.test.mjs`、`creator-migration.test.mjs`、`creator-preview.mjs`、`helpers/creator-repository.mjs`、`asset-version.test.mjs`、`editing.test.mjs`、`ournotes-admin.test.mjs`、`seo.test.mjs`。
- 手順/記録：`README.md`、`templates/README.md`、`docs/CREATORS.md`、この報告、`WORK_LOG.md`。

## 最終検証

- 通常配置：最終`node scripts/build.mjs`終了0、`node --test tests/*.test.mjs` **141成功/失敗0/skip0**。追加21件、既存120件。
- サブパス配置：`BASE_PATH=/bandori-song-atlas/`のbuild終了0と、その時点の全137テスト成功。その後追加した担当保存/選択UIの4テストは通常配置で成功しています。
- 両配置SEO監査：895正規ページ、884楽曲詳細（799/85）、797互換URL、title895。サブパスCLIは`node scripts/qa/audit-build.mjs dist https://tanimachi-bdsongs.com /bandori-song-atlas/`を使用。
- `node scripts/migrations/creators.mjs verify`：2,652旧表示一致、884曲/2Creator/823Work。意図した2Work warningのみ。
- Git HEADとのdeep比較：新3項目を除く全既存楽曲項目、全グループ・順序が一致。migrationのtemp fixtureでも全項目保持とバイト復元成功。
- 変更30JS/MJSの`node --check`、変更ソース/手順のPrettier、`git diff --check`成功。Pages Functionsはキャッシュ内の公式Wrangler4.143.0でローカルコンパイル成功。依存追加・外部公開なし。
- 公開CreatorのJSは約3KB、巨大catalogを取得せずSSR済みDOMを操作。移行report/backupはdistに含めません。
- ブラウザー：Creator一覧/詳細/管理で320・390・768・1024・1440の実幅と横はみ出しなしを確認。名前/別名検索、作曲数順、59作品/66収録、OurNotes+作曲1作品、作詞0作品、固定総数、URL共有/reload/Back/Forward/基本canonical、EnterでOurNotes詳細→Creatorリンクを確認。
- 模擬Creator管理：接続、新規作成、編集、固定ID readonly、token欄消去、公開master一致確認を確認。実GitHub/本番データは使っていません。
- **ブラウザーで未完の確認**：旧削除confirmで検証ツールの入力が停止したため、管理の削除と楽曲フォーム一連の実ブラウザー操作は完了していません。製品の削除確認はページ内表示へ変更済み。削除拒否/削除成功/SHA競合/保存/再送は模擬API、検索/選択/複数担当/順序/override/下書きWork復元は実イベントを使う独立DOMテストで成功しています。検証手段の差を実ブラウザー完了とは扱いません。
- 表示証拠：`reports/creator-detail-desktop.png`。入力停止後の追加mobile撮影はviewportが反映されず、誤った証拠を削除しました。これは以前の5幅実測とは別の失敗です。
- HTTP確認：Creator一覧/両詳細/管理、新公開moduleが200、未知Creator slugが404。

検証中の一時失敗（build中のdist不在、CLIのbasePath引数不足、fixtureの旧形式・浅いコピー等）はWORK_LOGへ記録し、対応後の検証で解消を確認しました。記録以外の既存ファイルに無関係な変更はなく、commit/pushは行っていません。
