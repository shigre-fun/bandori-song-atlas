# Creator人間レビュー反映・公開前slug整理

2026-10-03。人間確認日2026-10-02。commit / push / 本番公開は行っていません。第3フェーズの履歴資料はその時点の判断として保持しています。

| 項目                | 結果                                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 人間レビュー反映    | 18主体（同定・slug指定16確定、JACK/Louis 2保留維持）。human-review / 2026-10-02として記録。外部Webを装わない。                                                                                                                             |
| 新規Creator         | 瀬名水紀 cr-0090 / john cr-0091、nextId 92。旧89IDすべて維持。                                                                                                                                                                             |
| 更新Creator         | 15既存masterを更新。name/alias/slug/履歴/既存短い根拠の更新。人間確認を追記するだけの主体はmap・research更新でmaster不変。                                                                                                                 |
| aliases             | 総数58→61。下表に追加分。ryoがaliasから標準名へ移り旧標準名がaliasへ移るため差引+3。                                                                                                                                                       |
| 堀江晶太/kemu       | 1Creator cr-0028 / 標準名堀江晶太 / kemu alias。旧kemuはoverride維持。                                                                                                                                                                     |
| ryo                 | cr-0084維持、標準名ryo。ryo(supercell)・ryo (supercell)はalias。旧表示はoverride。slug ryo-supercell維持。                                                                                                                                 |
| UZ                  | cr-0067維持。UZ標準、ＵＺ・UZ(SPYAIR) alias。既存3record限定、将来未知UZは自動解決しない。                                                                                                                                                 |
| 瀬名水紀            | person、新cr-0090。Dream Monsterは所属会社で参加加算なし。元綴sortKey/creator-0090 slug維持。4recordの旧所属付き名義override。                                                                                                             |
| john/TOOBOE         | person、新cr-0091 / 標準john / TOOBOE alias。garupa:552「グッド・バイ」限定、将来の未知johnを自動同定しない。                                                                                                                              |
| JACK/Louis          | 未同定維持。未登録。fallback表示と横断検索維持。今回の追加調査なし。                                                                                                                                                                       |
| GEN                 | garupa:523 swim / MyGO!!!!! / wk-0514 / cr-0085、1収録。現同定維持。                                                                                                                                                                       |
| ARM                 | garupa:554 Ahoy!! 我ら宝鐘海賊団☆ / Afterglow×宝鐘マリン / wk-0545 / cr-0086、1収録。現同定維持。                                                                                                                                          |
| TAKE                | garupa:226 GO!!! / Afterglow×こころ / wk-0222 / cr-0087、1収録。現同定維持。                                                                                                                                                               |
| yasu                | garupa:386 月光花 / Morfonica / wk-0380 / cr-0088、1収録。現同定維持。                                                                                                                                                                     |
| KATSU               | garupa:97 Shangri-La / Roselia / wk-0097、ournotes:43 KINGS / Ave Mujica / wk-0790。cr-0079、2収録。現同定維持。                                                                                                                           |
| slug変更            | 12既存slugを変更。指定6＋一次英字6。藤田junpei-fujitaは維持。変更前にslug-review.mdへ案と根拠を保存。                                                                                                                                      |
| ID型slug            | 5残：片倉三起也、前澤寛之、志倉千代丸、庄司夏葵、瀬名水紀。根拠不足で推測しない。                                                                                                                                                          |
| provisional sortKey | 47残。slug整理から読みを推測しない。                                                                                                                                                                                                       |
| previousSlugs       | 実装済み。12今回変更＋藤田の第3フェーズ旧slug復元＝13履歴。全域一意、再利用・循環拒否。                                                                                                                                                    |
| redirect            | 実装済み。CF Pages 301規則26（slash有無）、静的互換ページ13。直接current URL、canonical/sitemap/全内部リンクはcurrentのみ。                                                                                                                |
| Creator総数         | 89→91（person 85 / unit 5 / organization 1）。                                                                                                                                                                                             |
| ID化済みraw         | 127/342（124→127、+3）。原表記＋role単位のraw件数。                                                                                                                                                                                        |
| 残未同定raw         | 215（218→215）。候補群数とは区別。作詞/編曲は未整備。                                                                                                                                                                                      |
| 収録カバレッジ      | 635/884 = 71.83%（631→635）。全composer token解決が条件。                                                                                                                                                                                  |
| Workカバレッジ      | 582/823 = 70.72%（578→582）。Work全収録が完全解決した場合のみ。                                                                                                                                                                            |
| 旧表示比較          | 2,652 / 2,652一致。lyricist/composer/arranger全884収録を比較。                                                                                                                                                                             |
| 収録/Work維持       | 884収録（ガルパ799、OurNotes85）、823 Work。Work全内容不変。                                                                                                                                                                               |
| Work warning        | 0。保留5主体のmaster/map/relationは保存baselineとdeep一致。                                                                                                                                                                                |
| tests               | 全160成功（新9 human-review tests含む）。再applyでもsource bytesと原適用証拠が不変。初回157/159は旧218期待値2件を今回215へ更新して解消。安全性初回fragment失敗をhash保持で修正。                                                           |
| build               | root / subpath (/bandori-song-atlas/) とも成功。dist直接編集なし。最終source=両生成catalog/master/Workの全内容比較を実行。                                                                                                                 |
| SEO                 | 両配置984正規ページ/884楽曲詳細/797旧楽曲互換/13Creator転送、title984。新旧canonical/sitemap/内部リンク監査成功。                                                                                                                          |
| Functions           | Wrangler4.143.0ローカルcompile成功。Pages devも26有効転送規則を読取り。新URL18件200、旧26形式301・query保持を実レスポンス検証。本番未公開。                                                                                                |
| 実ブラウザー        | /creators/91一覧・指定11名詳細/name/件数/canonical、john楽曲↔Creator往復、真部旧slug静的転送+query/fragment保持、担当composer＋OurNotes1作品/ガルパ2作品、管理TOOBOE検索・真部編集mock保存・再取得で固定ID/slug/履歴保持。実GitHub書込0。 |
| 公開前の人間確認    | short-name-reviewの5主体6収録、残215raw/暫定sortKey47/IDslug5。今回の確定16判断は再承認待ちに戻さない。公開・commit/pushは別途判断。                                                                                                       |

## 最終状態

| 標準名     | 固定ID  | slug          | Work | 収録 | aliases                          |
| ---------- | ------- | ------------- | ---- | ---- | -------------------------------- |
| 堀江晶太   | cr-0028 | shota-horie   | 8    | 9    | Kemu / kemu                      |
| ryo        | cr-0084 | ryo-supercell | 4    | 4    | ryo(supercell) / ryo (supercell) |
| UZ         | cr-0067 | uz            | 3    | 3    | ＵＺ / UZ(SPYAIR)                |
| 瀬名水紀   | cr-0090 | creator-0090  | 4    | 4    | 瀬名水紀(Dream Monster)          |
| john       | cr-0091 | john          | 1    | 1    | TOOBOE                           |
| 藤井健太郎 | cr-0033 | kentaro-fujii | 5    | 5    |                                  |
| Kanaria    | cr-0064 | kanaria       | 3    | 3    |                                  |
| Orangestar | cr-0036 | orangestar    | 4    | 4    |                                  |
| TK         | cr-0065 | tk            | 3    | 4    |                                  |

## slug変更一覧

| Creator      | 固定ID  | 旧slug       | 現在slug          |
| ------------ | ------- | ------------ | ----------------- |
| 真部脩一     | cr-0003 | creator-0003 | syuichi-mabe      |
| 日高勇輝     | cr-0020 | creator-0020 | yuki-hidaka       |
| 末益涼太     | cr-0021 | creator-0021 | ryota-suematsu    |
| 藤原聡       | cr-0024 | creator-0024 | satoshi-fujihara  |
| 田淵智也     | cr-0027 | creator-0027 | tomoya-tabuchi    |
| かいりきベア | cr-0041 | creator-0041 | kairiki-bear      |
| 前山田健一   | cr-0050 | creator-0050 | kenichi-maeyamada |
| 佐藤純一     | cr-0053 | creator-0053 | junichi-sato      |
| 常田真太郎   | cr-0072 | creator-0072 | shintaro-tokita   |
| 大橋卓弥     | cr-0073 | creator-0073 | takuya-ohashi     |
| 目黒将司     | cr-0075 | creator-0075 | shoji-meguro      |
| 篠崎あやと   | cr-0083 | creator-0083 | ayato-shinozaki   |

一次根拠と変更前の提案は[slug-review.md](migrations/creators-2026-10-02/slug-review.md)。藤田の現在slugは変更せず、旧creator-0004の履歴だけ追加しています。

## 追加alias

| 標準名   | 固定ID  | 追加alias               |
| -------- | ------- | ----------------------- |
| UZ       | cr-0067 | UZ(SPYAIR)              |
| ryo      | cr-0084 | ryo (supercell)         |
| 瀬名水紀 | cr-0090 | 瀬名水紀(Dream Monster) |
| john     | cr-0091 | TOOBOE                  |

## 短名対象・根拠資料

[GEN / ARM / TAKE / yasu / KATSUの全6対象収録](migrations/creators-2026-10-02/short-name-review.md)にはraw全文・バンド・Work・override・件数・根拠/一次情報を掲載しています。human-reviewの[判断原本](migrations/creators-2026-10-02/human-review-2026-10-02.md)と[適用結果](migrations/creators-2026-10-02/human-review-applied.json)、[最終機械検証](migrations/creators-2026-10-02/human-review-verification.json)から追跡できます。

## 実行した検証

```powershell
node scripts/migrations/creators.mjs verify
node scripts/migrations/research-creators.mjs verify
node scripts/migrations/human-review-creators.mjs verify
node --test tests/*.test.mjs
node scripts/build.mjs
$env:BASE_PATH = "/bandori-song-atlas/"
$env:SITE_OUTPUT_DIR = ".cache/creator-human-review-subpath"
node scripts/build.mjs
node scripts/qa/audit-build.mjs dist https://tanimachi-bdsongs.com /
node scripts/qa/audit-build.mjs .cache/creator-human-review-subpath https://tanimachi-bdsongs.com /bandori-song-atlas/
# 既存Wrangler: pages functions build functions --outdir .cache/creator-human-review-functions
# 変更16module: node --check
# 今回変更のcode/master/map/research/current reports: Prettier --check
git diff --check
```

整形対象のcode/運用データ/資料は成功。OurNotesのJSON style警告と保存したbefore-master snapshotは書き戻し対象から除外しました。広範囲の整形コマンドは自動承認レビューで「並行OurNotesを含む不要な上書きリスク」として拒否され、対象を狭めて解消。両songsへの一括整形書込はしていません。Garupaは旧項目全一致を確認してから単独整形。OurNotesは追加更新を検出したため整形writeしません。失敗した全旧項目比較は、この並行更新の検出であってmigrationによる変更ではありません。snapshotのbyteを維持します。

## 並行編集と未検証範囲

ユーザーが意図したOurNotesのID変更・譜面修正を開始baselineとして保持し、今回のCreator反映後にも追加された値を[human-review-parallel-changes.json](migrations/creators-2026-10-02/human-review-parallel-changes.json)へ記録しました。新5composer tokenのうち「カーネーションの咲く日に」は共同作曲者Airaが未同定のため、完全解決増分は4収録/4Workです。

Web大規模再調査なし。既存Web91主体のbaseline（87CONF/2PROB/2UN）と人間確認後（89CONF/0PROB/2UN）を区別。一次英字追加調査6主体/5URL、一次URL合計98。残低頻度rawの同定、作詞/編曲全体整備、47暫定読み/5IDslugの解消、実GitHub保存/本番URL・本番301は未検証。ローカルPages devはcompatibility_date未指定の警告があり既定2026-09-26を使用しました。ブラウザーChromeは利用不可だったため接続済みアプリ内ブラウザーで確認。locator level未対応/label no_matchesは最新状態を読み、name/観測済みIDへ切り替えて成功。秘密情報の記録なし。
