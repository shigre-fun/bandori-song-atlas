# Creator最終5slugの検証・公開判断

2026-10-03（日本時間）。確認済み5slugを正式採用し、ID型slugを0件にしました。固定ID・人物情報・名前順の読み・全楽曲・Workを維持しています。過去フェーズの報告・適用証拠は当時の記録として保持しています。

| Creator    | 固定ID  | 旧slug       | 現在slug          | 参加Work | 収録件数 |
| ---------- | ------- | ------------ | ----------------- | -------- | -------- |
| 片倉三起也 | cr-0048 | creator-0048 | mikiya-katakura   | 4        | 4        |
| 前澤寛之   | cr-0081 | creator-0081 | hiroyuki-maezawa  | 3        | 3        |
| 志倉千代丸 | cr-0082 | creator-0082 | chiyomaru-shikura | 3        | 3        |
| 庄司夏葵   | cr-0089 | creator-0089 | natsuki-shoji     | 2        | 4        |
| 瀬名水紀   | cr-0090 | creator-0090 | mizuki-sena       | 4        | 4        |

## 指定31項目

| 番号 | 項目                                 | 結果                                                                                                                                                                                                                                                             |
| ---- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 変更したCreator 5件                  | 片倉三起也・前澤寛之・志倉千代丸・庄司夏葵・瀬名水紀。ユーザー指定の5slugだけ採用。                                                                                                                                                                              |
| 2    | 固定ID                               | cr-0048 / cr-0081 / cr-0082 / cr-0089 / cr-0090。91主体すべての固定ID不変、nextId92。                                                                                                                                                                            |
| 3    | 旧slug                               | creator-0048 / creator-0081 / creator-0082 / creator-0089 / creator-0090。下表参照。                                                                                                                                                                             |
| 4    | 新slug                               | mikiya-katakura / hiroyuki-maezawa / chiyomaru-shikura / natsuki-shoji / mizuki-sena。下表参照。                                                                                                                                                                 |
| 5    | previousSlugs最終件数                | 18件（従来13＋今回5）。他Creatorの履歴も全保持。                                                                                                                                                                                                                 |
| 6    | redirect最終件数                     | 旧slug18件に対しCloudflare Pages 301規則36本（末尾slash有無）。全36応答301を実測しcurrent URLへ直接転送、query5件・fragmentを保持。                                                                                                                              |
| 7    | 静的互換ページ数                     | 18ページ。noindex・現在canonical・JS転送/通常リンク。静的配置でも旧5全件を実ブラウザー確認。                                                                                                                                                                     |
| 8    | ID型slug残数                         | 0件。全域のcurrent/previous一意性・再利用/循環禁止・直接転送をvalidate/tests/SEOで確認。                                                                                                                                                                         |
| 9    | Creator総数                          | 91主体。名前・type・aliases・sortKey・ID・relationsを変更していない。                                                                                                                                                                                            |
| 10   | provisional sortKey残数              | 47件。読みの推測・slug由来の書換なし。                                                                                                                                                                                                                           |
| 11   | ID化済みraw                          | 127件（原表記＋role単位）。前フェーズから不変。                                                                                                                                                                                                                  |
| 12   | 残未同定raw                          | 215件。JACK / Louis未登録・未同定を維持。fallback表示/横断検索を保持。                                                                                                                                                                                           |
| 13   | 完全ID化収録数・率                   | 635/884 = 71.83%（composer全token解決）。不変。                                                                                                                                                                                                                  |
| 14   | 完全ID化Work数・率                   | 582/823 = 70.72%（同Workの全収録でcomposer解決）。不変。                                                                                                                                                                                                         |
| 15   | 旧表示2,652比較結果                  | 2652/2,652一致。884収録×作詞・作曲・編曲の3担当を全比較。                                                                                                                                                                                                        |
| 16   | 884収録維持                          | ガルパ799＋OurNotes85＝884。両song JSONはフェーズ開始baselineとbyte hash一致。                                                                                                                                                                                   |
| 17   | 823 Work維持                         | 823 Work。data/works.jsonのbyte hash・全内容がbaselineと一致。所属workId・relationも不変。                                                                                                                                                                       |
| 18   | Work warning数                       | 0件。                                                                                                                                                                                                                                                            |
| 19   | test総数・成功数                     | 165件 / 165成功、失敗0。以前の160を保持し5件追加。歴史的13履歴・5IDslug・12変更の原適用資料へのassertを残し、現在の18履歴・IDslug0も追加確認。                                                                                                                   |
| 20   | root build                           | 成功（node scripts/build.mjs）。dist直接編集0。最新sourceの全JSON内容と生成catalog/master/Workが一致。                                                                                                                                                           |
| 21   | subpath build                        | 成功（BASE_PATH=/bandori-song-atlas/、SITE_OUTPUT_DIR=.cache/creator-final-slugs-subpath）。最新sourceとの全内容比較成功。                                                                                                                                       |
| 22   | root SEO                             | 成功：984正規ページ、884楽曲詳細、797旧楽曲互換、18旧Creator互換。canonical/sitemap/internal linkはcurrentのみ。                                                                                                                                                 |
| 23   | subpath SEO                          | 成功：rootと同件数。BASE_PATH込みのcurrent canonical/内部リンク/転送先を確認。                                                                                                                                                                                   |
| 24   | Functions compile                    | 成功（既存Wrangler4.143.0）。問い合わせFunctionを含む。localhost Pages devで36有効転送規則、GET /api/contactはFunctionの405/method応答。Creator転送との競合なし、外部送信0。                                                                                     |
| 25   | 新slug実ブラウザー確認               | 一覧の5href、5詳細の見出し・参加作品/収録数・canonical、5楽曲→Creator往復、5担当/game filterを成功。Pages devの新5応答200も実測。                                                                                                                                |
| 26   | 旧slug redirect実ブラウザー確認      | 静的互換の5旧URLとPages devの5旧URLを全確認。静的瀬名・Pages片倉のquery＋#app保持を確認、HTTP全36形式301・query5件を確認。                                                                                                                                       |
| 27   | 管理画面確認                         | 実masterをseedしたlocalhostメモリーmockで5名を検索・編集・保存→一覧再取得。固定ID readonly・current slug・previousSlugs全一致、実GitHub書込0。console warn/error0。                                                                                              |
| 28   | OurNotes並行編集保持結果             | ユーザーのID50「これはぼくたちの生存のあらすじ」等の意図した変更を開始baselineとして保持。data/ournotes/songs.jsonはhash 6d1109393baf379702bd0dd4a8b05a0dc434907e85bf1052e7e2db8a8c0339eeで開始/適用後/検証後一致。今回OurNotes書込0。                           |
| 29   | git diff結果                         | フェーズ開始diffとのtracked比較でREADME/WORK_LOG以外は全不変。新規/既存untrackedの許可範囲はmetadata/review/migration/tests/報告。Git staged空。git diff --check: success。構文: success (3 changed modules)。限定Prettier --check: success (20 limited files)。 |
| 30   | commit / push未実施                  | git commit / git push / 本番deployは全て未実施。ローカル検証のみ。                                                                                                                                                                                               |
| 31   | 本番公開前にまだ人間確認が必要な事項 | 既存short-name-reviewのGEN / ARM / TAKE / yasu / KATSU 5主体6収録、残215raw・暫定読み47件・作詞/編曲未整備の現状態の受入判断。JACK / Louisは未同定のまま。今回ユーザー確定の5slugを再承認待ちに戻さない。公開操作の実施は別判断。                                |

## 公開に関する技術判断

この変更はcommit / pushへ進める技術検証を満たしています。両配置の生成物・SEO・旧URL・管理保存・Functionsに技術上のブロッカーは見つかっていません。本番公開も今回の変更に関するローカル検証は完了していますが、上記31の残データの現状態を人間が受け入れたうえで公開を判断してください。本番の実GitHub保存、実ドメインの301、Turnstile/Resendの実送受信は今回実行していません。commit / push / 公開はまだ行っていません。

## 保全と再適用

[人間確認の記録](migrations/creators-2026-10-03-slugs/human-review.md)、[適用前master](migrations/creators-2026-10-03-slugs/before-master.json)、[適用前map](migrations/creators-2026-10-03-slugs/before-map.json)、[baseline hashes](migrations/creators-2026-10-03-slugs/baseline.json)、[backup/適用結果](migrations/creators-2026-10-03-slugs/applied.json)、[最終検証結果](migrations/creators-2026-10-03-slugs/verification.json)で追跡できます。両songs・Work・短名資料・元human-review適用履歴はbyte不変です。

master/mapでは今回5件のslugとpreviousSlugsだけを変更し、research/inputではcurrent slugと独立したslugEvidenceを同期しました。人間確認をWeb出典として記録せず、人物同定の既存evidenceは変更していません。瀬名はpersonのまま、Dream Monsterは所属としてalias/旧表示overrideを保持しています。再applyでsource/ID/aliases/履歴/relations/原適用資料が不変であることを確認しました。

## 実行した検証

```powershell
node scripts/migrations/creators.mjs verify
node scripts/migrations/research-creators.mjs verify
node scripts/migrations/human-review-creators.mjs verify
node scripts/migrations/finalize-creator-slugs.mjs verify
node --test tests/*.test.mjs
node scripts/build.mjs
$env:BASE_PATH = "/bandori-song-atlas/"
$env:SITE_OUTPUT_DIR = ".cache/creator-final-slugs-subpath"
node scripts/build.mjs
node scripts/qa/audit-build.mjs dist https://tanimachi-bdsongs.com /
node scripts/qa/audit-build.mjs .cache/creator-final-slugs-subpath https://tanimachi-bdsongs.com /bandori-song-atlas/
# 既存Wrangler: pages functions build functions --outdir .cache/creator-final-slugs-functions
# 関連変更module: node --check
# このフェーズの変更code/metadata/資料: Prettier --check
git diff --check
```

限定整形は今回のcode・Creator metadata・current review・新phase資料・README/WORK_LOGが対象です。並行OurNotes JSONの既存style警告は保持し、そのファイルの整形writeはしていません。過去の広範囲整形拒否は前フェーズの記録です。今回も全songへの整形writeは行っていません。

初回reportのnull slugとID型build fallbackの比較失敗はfallbackを明示して修正（失敗時source変更0）。終了照合の初回deep比較はJSONに保存されないundefined属性を含んだため、sourceをbuildと同じJSON形式へserializeして全内容比較を成功させました。README/CREATORSの一括patch一致失敗後は実体を確認し、反映済みREADMEを保持してCREATORSだけ個別更新しました。誤ったsrc/admin/creators.js読取は不存在を記録し、src/jsの実体を確認しています。新Web調査・ローマ字再推測なし。

ブラウザー証拠は.cache/creator-final-slugs-ui/checks.json・http.jsonとpublic-sena.png・admin-sena.png。静的サーバー、Pages dev、管理mockはローカル検証用です。
