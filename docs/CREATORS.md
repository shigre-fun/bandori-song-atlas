# Creator DBとWork

Creatorは作詞・作曲・編曲のクレジット主体、Workは同じ音楽作品です。ゲーム内レコードと区別します。原曲アーティストは別概念で、既存のoriginalArtist/originalWorkは変更していません。

現在は最終5slug整理後：Creator91主体、884収録、823Work。ID型slug0件、旧slug履歴18件（Cloudflare301は末尾slash有無36規則・静的互換18ページ）、暫定sortKey47件、未同定旧表記215種類、Work warning0件です。2026-10-03に本番公開を完了し、[公開結果の42項目](CREATOR_RELEASE_REPORT.md)へCI・Cloudflare deploy・本番検証を記録しました。[公開前の最終検証](CREATOR_FINAL_SLUG_REPORT.md)、[人間レビュー反映報告](CREATOR_HUMAN_REVIEW_REPORT.md)と[短名5主体の対象曲](migrations/creators-2026-10-02/short-name-review.md)も参照してください。下段の各フェーズ件数・判断はその当時の履歴です。

## roleデータセットの整備状況

`data/creators.json` rootの`roleCoverage`は各担当の`ready`/`unprepared`を保持します。現在はcomposerのみready、lyricist/arrangerはunpreparedです。個々のCreatorに1件登録しただけでは切り替えません。

公開一覧は参加楽曲数・整備済み担当の件数だけ表示し、未整備担当の数値・並べ替えは出しません。詳細は作詞/編曲を「未整備」と表示し、担当なしの0と区別します。filterも整備済み担当だけ選択可能です。古いURLで未整備担当を指定した場合は「データ整備中」と説明し、担当で絞らず登録済み参加作品を表示します。

将来データセット全体の整備を確認したら、該当roleをreadyへ変更してbuildしてください。共通設定から数値・sort/filter・URL処理が切り替わります。全体未整備でも管理画面では全roleを入力できます。`credit-coverage.js`に初期fallbackがあり、schemaでも値を検査します。

## 保存形式

`data/creators.json` は `{version:1,nextId,creators:[...]}`。Creatorの必須項目は固定id、URL用slug、標準名name、名前順の読みsortKey、type（person/organization/unit）。任意で文字列配列aliasesを保持します。IDは名前・slug変更でも維持し、削除後も再利用しません。aliasesは検索と人間の確認に使い、登録だけでは旧データを自動統合しません。日本語slugに独自のローマ字変換はしません。

任意の`previousSlugs`は旧URL履歴です。全Creatorの現在slugと旧slugを同じ名前空間で検証し、重複・再利用・循環を拒否します。通常管理UIでは履歴を読み取り専用で表示し、slug変更時に保存処理が旧slugを追加します。履歴の改変や履歴を持つ主体の削除は拒否します。buildはCloudflare Pages用`_redirects`（301、末尾スラッシュ有無）と、既存静的配置用のnoindex互換ページを生成します。転送先は常に現在slugへ直接向け、クエリ・fragmentを保持。canonical・sitemap・内部リンクは現在slugだけを使います。

```json
{
  "id": "cr-0001",
  "slug": "noriyasu-agematsu",
  "name": "上松範康",
  "sortKey": "あげまつのりやす",
  "type": "person",
  "aliases": ["上松範康（Elements Garden）"]
}
```

`data/works.json` は `{version:1,nextId,works:[{id,title,source}]}`。各楽曲のworkIdで所属を識別し、titleは同一性判定に使いません。sourceは割当根拠です。将来WorkにoriginalArtistId/relationを追加でき、Creatorの構造変更は不要です。

V1のcreditsは楽曲レコード側へ保存します。同じWorkでもゲームごとのクレジット・表示・出典・編曲が異なる可能性があるため、共通値を強制しません。Work単位の参加クレジットは各レコードから導出します。

```json
{
  "workId": "wk-0001",
  "credits": [
    {
      "creatorId": "cr-0001",
      "roles": ["lyricist", "composer"],
      "displayOverride": "上松範康（Elements Garden）"
    }
  ],
  "creditDisplay": {
    "lyricist": [{ "creatorId": "cr-0001" }],
    "composer": [
      { "creatorId": "cr-0001" },
      { "text": "、" },
      { "text": "未同定名", "unresolved": true }
    ],
    "arranger": []
  }
}
```

rolesはlyricist/composer/arrangerだけです。同じCreatorは1relationで複数roleを保持します。displayOverrideは表示専用、ID/集計には使いません。省略時はmasterのnameを表示。creditDisplayはroleごとのID順序と区切り文字を保持します。unresolvedはmigrationの確認待ち旧表記だけに使い、新規の自由文字列保存は拒否します。

旧composerと追加のlyricist/arrangerは検索互換のdeprecated表示文字列です。正規化されたデータではCreatorと表示tokenから生成し、build/保存時に整合性を照合します。

## 集計と公開ページ

- 参加楽曲数：Creatorが参加するunique Work数。
- 収録件数：Creator relationを持つゲーム内レコード数。
- role別曲数：そのroleで参加するunique Work数。
- 通常版/FULL/ゲーム違いが同じWorkなら参加楽曲数は1、収録件数は別件。
- 所属表記からElements Gardenなどへ自動加算しない。

`/creators/` はname/aliases/読みの検索、名前順/参加曲数順と整備済みroleの曲数順を提供し、初期HTMLに内容と名前順を含みます。現在のrole別並べ替えは作曲のみです。`/creators/[slug]/` は種別、総数、Work単位の参加楽曲、各参加収録へのゲームリンクを静的生成します。

`?role=composer&game=ournotes` 等で担当とゲームを絞り込みます。同じ収録で両条件を満たす必要があります。総数は全参加収録の値として固定し、絞り込みの表示作品数を別表示します。共有/再読込/戻る・進むでURL状態を再現します。canonicalは基本URL、sitemapにも基本URLだけ掲載。存在しないslugは既存404へ。

正規化済みの詳細クレジットはcreatorIdからslugを解決してCreatorページへリンクします。未確認表記の旧検索導線、credit横断検索、原曲アーティスト検索、既存ゲーム間リンクは維持。作詞・編曲の役割検索も利用できます。一般フッターに一覧への小さな導線を追加し、管理URLは一般ナビへ載せません。

## 管理

`/admin/creators/` で一覧検索/新規作成/編集/削除します。既存GitHub接続型管理を使用し、Contents書込権限が必要です。tokenはメモリー内だけ、接続処理後に入力欄を消去し、storage/cookie/URL/ログへ保存しません。

IDはnextIdから採番、ID欄はreadonly。名前/type/読みは管理者が確認してください。slug変更でもrelationは維持します。旧slugの転送はV1では自動作成しないため、公開後の変更は慎重に行ってください。参照中Creatorは削除できず、参照曲数/収録数を表示します。merge UIはありません。

masterのSHAを照合し古い画面の上書きを拒否、最新楽曲との整合性を同一snapshotで確認、複数ファイルを原子的commitで保存します。branch更新はforce:false。失われた保存応答はoperationIdで重複作成を防ぎます。標準名変更時はoverrideのないrelationのdeprecated文字列を同じcommitで更新します。

両ゲームの楽曲管理では「クリエイター・Workを取得」→担当→名前検索→登録済みCreatorを選択→追加。同roleに複数名を登録し、前へ/後へで順番を変更、relationの表示名を上書きできます。同Creatorのoverrideはrole間で共通です。未登録名は「クリエイターを追加・編集」からmasterへ先に登録し、再取得します。未同定表記を含む担当は旧表示を保持し、下記明示migrationで解決するまで変更不可。他の項目や空の担当は編集できます。

Workは新規作品、または確認した既存作品を選びます。関連曲を設定する場合は同じWorkを指定。異なるworkIdのリンクは保存を拒否します。タイトル一致では統合せず、リンク削除でもWorkを自動分割しません。統合/分割は人間が確認し明示的に修正してください。

保存後はcommit/更新の進行状況を確認し、「サイトへの反映を確認」で公開データとの一致を確認します。実GitHub保存・本番公開はローカル模擬検証とは別です。

## 2026-10-02 第1フェーズの移行履歴

元データは884レコード（ガルパ799/アワーノーツ85）、作曲表記342種類/名前分割候補352件。作詞・編曲は元データにないため推測補完していません。Work共通IDは未実装だったため、既存relatedSongIdsの明示相互リンクから57複数収録群＋766独立レコード＝823 Workを作成。FULL7件は既存リンクがあり同Workへ。タイトル一致だけの統合はありません。

人物/type/読みを既存ソースだけで全件確定できないため、仕様に明示された上松範康/Elements Gardenの2主体をmaster化。上松範康66収録をIDへ対応。単独Elements Gardenクレジット0件、所属による加算なし。上松の所属込み表記だけを明示alias mapで対応。残る341元表記は確認待ちです。全人物同定の完了ではありません。本番push前にこの制約を報告します。

確認済みmapはdocs/migrations/creator-map.json。docs/migrations/creators-2026-10-02/のcredit-report.jsonに元表記/件数/role/ゲーム/対応/aliases候補/要確認/出現レコード、work-report.jsonにWork根拠、legacy-credits.jsonに全旧文字列を保存。元全ファイルは.cache/creator-migration-2026-10-02/beforeにバイト単位でbackup。Git差分でも追跡でき、これらの資料・backupはdistへ同梱しません。

```powershell
node scripts/migrations/creators.mjs report
node scripts/migrations/creators.mjs apply
node scripts/migrations/creators.mjs verify
```

report→backup→apply→validation/表示比較の順です。適用済みデータへの再applyは禁止し、固定IDを再採番しません。verifyは全3roleの2,652表示を比較。restoreは適用直後の全ファイルhash一致時だけ復元し、後続編集があれば停止。整形/編集後はGit差分から復元を確認してください。

同Work内表示差は2組：ちゅ、多様性。（真部名の空白）、春日影（藤田名の括弧形式）。warningとして検出し、ゲームごとの表記を保持、自動同定/統一はしていません。

### 確認待ち表記の解決

人間が同定/type/読みを確認してCreatorを登録。同じ主体と確認した完全一致の旧表記だけをaliasesへ追加し、IDと元表記を明示してreportを確認します。

```powershell
node scripts/migrations/resolve-creator-credits.mjs report cr-0003 "確認済みの元表記"
node scripts/migrations/resolve-creator-credits.mjs apply cr-0003 "確認済みの元表記"
node scripts/migrations/creators.mjs verify
node scripts/build.mjs
node --test tests/*.test.mjs
```

このscriptは指定した未同定tokenだけを置換し、類似名や別表記を自動統合しません。role間で表示が異なれば手動確認のため停止。楽曲表示とWork IDを維持し、全ファイルbackupと変更reportを.cache/creator-resolution-日時へ保存します。公開前にGit差分/変更reportを確認してください。

## 検証

build前にCreator ID/slug/必須name/sortKey/type/aliases、relation参照/role/重複/override、Work ID/参照/重複レコード/リンク整合と旧表示を検査。致命的な不整合は失敗、同Workのcredit/表示差はwarning。テストでalias/role検索、複数role/名/表示、Work集計/FULL、静的SEO、模擬GitHub追加/編集/削除/競合/失われた応答の再送を確認します。

## 第2フェーズ：確認済み主体と候補レビュー

人間が確認した「真部 脩一／真部脩一」「藤田淳平のElements Garden括弧形式差」を明示mapへ追加しました。新固定IDはcr-0003/cr-0004。標準名は既存表記から採用し、読みを推測せずsortKeyは元綴、`sortKeyStatus:provisional-original`を明記。slugは安定した`creator-0003`/`creator-0004`です。旧収録名はdisplayOverrideで保持し、所属を組織への参加として加算しません。

WorkのCreator ID集合が同一なら、確認済みoverrideの表示差はwarningにしません。異なるID集合、または未同定tokenを含む表示差は引き続きwarningです。今回の2WorkはreviewRequiredを解消し、creditReviewに解決根拠と旧表示保持を記録しました。

```powershell
node scripts/migrations/review-creators.mjs report
node scripts/migrations/review-creators.mjs apply
node scripts/migrations/creators.mjs verify
```

既存legacy-credits/credit-report/creator-mapを再利用し、[creator-review.md](migrations/creators-2026-10-02/creator-review.md)とJSONを生成します。Aは所属あり/なし、Bは空白/NFKC/括弧等、Cは意味や種別の追加確認、Dは重複候補なし。これらは候補提示専用で、文字列の類似をapplyに使いません。AUTO_RESOLVEDは明示mapのみ、REVIEW_RECOMMENDEDは人間確認前に登録せず、UNRESOLVEDは旧表示と検索へfallbackします。

適用前に全対象を`.cache/creator-phase2-日時/`へbackupし、hashと変更tokenをmanifestへ保存。58収録のtokenを確定IDへ置換しました。新旧表示を比較し、既存ID/Work構造・旧項目を維持します。再applyは追加採番/再更新をしません。移行資料は一般公開distへ配信しません。

件数の単位：旧raw342種類のうちAUTO5・REVIEW108・UNRESOLVED229、残337（REVIEW+UNRESOLVED）。今回解決した旧rawは4種類です。分割名前tokenをまとめた候補は323群でAUTO3・REVIEW70・UNRESOLVED250（Elements Garden単独の元クレジットは0件）。A0/B28/C45/D250。各群の収録/Work数、各variantの件数と出典レコードはJSONに記載。候補タイプ/読み/slugが不明の場合はnullで確認待ちにしています。

同定は既存mapと今回の人間確認だけを使用し、外部人物情報の収集や推測統合をしていません。追加主体は真部2作品/3収録・藤田51作品/55収録。上松59作品/66収録は維持しました。

## 第3フェーズ：一次情報による同定

2026-10-02。91主体（93旧候補群）をWeb調査し、87 CONFIRMED、2 PROBABLE、2 UNRESOLVEDと判定。既存の真部脩一も公式レーベル本文で再確認しましたが、公式英字・かなは確認できず暫定slug/元綴sortKeyを維持。藤田淳平の既存IDを保持して公式英字slugへ変更し、新85主体を追加してmasterは89主体です。今回の根拠・確認日・実読状態・公式英字・所属の意味・対象曲は[creator-research.json](migrations/creators-2026-10-02/creator-research.json)、全候補の現況は[creator-review.md](migrations/creators-2026-10-02/creator-review.md)とJSONに保存します。人物紹介や不要なプロフィールは保存せず、調査資料はdistへ含めません。

高頻度の所属付き個人名、表記差、活動名を優先し、未同定の3収録以上の候補はすべて調査しました。個人とunitを公式本文で区別し、Elements Garden等の所属には作品を二重加算しません。堀江晶太/kemuは公式の明示する同一人物で1ID、元の曲名義はoverrideで保持。ryo、TK、TAKE等の短名は対象曲・原曲の活動文脈を確認して対応します。JACK、Louis、john、瀬名水紀は根拠不足のため未適用です。

```powershell
node scripts/migrations/research-creators.mjs report
node scripts/migrations/research-creators.mjs apply
node scripts/migrations/research-creators.mjs verify
node scripts/migrations/creators.mjs verify
```

reportは候補map・移行案・reviewを別ファイルへ保存し、ID/type/slug/alias/読み・根拠・旧表示・旧項目/Workの不変条件を検証します。applyはreport後の実体変更を拒否し、map・master・songs・既存reportをhash付きでbackupしてから確定分だけ反映。再適用時も固定IDを保持します。`applyRoles:["composer"]`と`approvedReferences`により、別roleや将来の別曲の短名を無根拠に対応しません。既存mapのID/name/type変更、slug/alias衝突、未読根拠、非確定type、元綴でない暫定読みを拒否します。

カバレッジは「作曲欄にIDが1個でもある」ではなく、全作曲tokenが解決した収録を数えます。Workは全収録が完全解決した場合だけ数え、今回の適用時点では631/884収録（71.38%）、578/823 Work（70.23%）。未同定rawは337→218、未同定候補は233群で主に低頻度です。

### slug変更の将来設計案

未公開の藤田淳平は`creator-0004`→`junpei-fujita`へ変更しました。IDはcr-0004のままです。英字の未確認主体は`creator-NNNN`を保持し、公式URL識別子だけで英字氏名を確認済みとは扱いません。日本語の読みが確認できない場合は`sortKeyStatus:provisional-original`として元綴を保持します。

公開後に変更する場合の案：Creatorに`previousSlugs`を保存し、新旧すべてのslugで全Creator間の一意性・循環・再利用を検証。旧URLは対応する固定IDの現在slugへ恒久転送し、canonical/sitemapには現在slugのみ掲載。過去slugへの管理画面変更は衝突確認し、転送はchainにせず現在URLへ直接向けます。Cloudflareの\_redirectsとGitHub Pagesの静的互換ページの双方をbuild時に生成する案です。今回の転送実装は行っていません。

### 並行する収録ID修正との照合

検証中にユーザーが別作業でOurNotesの3収録IDと譜面・激奏区間を修正しました。ユーザーの保持指示に従い、曲実体のtitle/固定Work IDを確認し、[record-reference-updates.json](migrations/creators-2026-10-02/record-reference-updates.json)へ旧→現referenceを明示しています。原`legacy-credits.json`や適用時のbefore/proposed/applied資料は維持し、旧表示比較ではこの承認済み参照だけを同時変換します。現在の曲実体が確認後に変化していれば検証を停止。research/context、mapのapprovedReferences、現review/credit/work reportは新referenceで照合し、楽曲ファイルには書き戻しません。
