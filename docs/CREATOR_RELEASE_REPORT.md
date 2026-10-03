# Creator DB本番公開結果

2026-10-03（日本時間）。検証済みのCreator DBを既存のGit連携で公開しました。[本番Creator一覧](https://tanimachi-bdsongs.com/creators/)で確認しています。正式な機械可読記録は[release記録](releases/creator-db-2026-10-03.json)です。

## 指定42項目

| 番号 | 項目                           | 結果                                                                                                                                                                                             |
| ---- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | commit hash                    | 機能公開：`d140705b7363e67f1f8f9c0fdc2296629bb9d149`。この報告と終了記録は後続のdocs commitにまとめます。                                                                                        |
| 2    | commit message                 | `feat: add creator database and work-based credits`。記録更新は既存慣習の`[skip ci] docs: record creator database publication`。                                                                 |
| 3    | push branch                    | `main` → `origin/main`、既存remote `shigre-fun/bandori-song-atlas`。                                                                                                                             |
| 4    | remote commit一致              | feature push後のremote SHAがd140705の完全SHAと一致。記録push後のHEADとremote照合は終了auditで確認します。                                                                                        |
| 5    | 最終git status                 | feature commit後clean。終了資料だけを追加し、記録commit/push後のstatusは終了auditと最終応答へ記録します。                                                                                        |
| 6    | CI結果                         | [GitHub Actions 37090952031](https://github.com/shigre-fun/bandori-song-atlas/actions/runs/37090952031)のbuild/deployがともにcompleted/success、head SHAはd140705。                              |
| 7    | Cloudflare deploy結果          | [Cloudflare Pages check 111111304422](https://github.com/shigre-fun/bandori-song-atlas/runs/111111304422) completed/success。deployment `488582a5-982e-46a0-99b3-66645fa2b8f4`。既存方式で公開。 |
| 8    | 本番へ反映されたcommit         | Cloudflare checkのhead SHAがd140705。本番4JSONがsourceと一致し、Git blobから再計算したasset版`189e6c4a2626`が本番と一致。                                                                        |
| 9    | deploy URL / production domain | [本番ドメイン](https://tanimachi-bdsongs.com/creators/)で実HTTP・実ブラウザー確認。GitHub Pages deployも成功。                                                                                   |
| 10   | /creators/                     | HTTP200、91件とリンク・表示を確認。390pxで横はみ出しなし。                                                                                                                                       |
| 11   | Creator件数                    | 本番91主体。aliasは主体数に加算しません。                                                                                                                                                        |
| 12   | 代表詳細                       | 指定11名のHTTP200、title/canonical、Work数/収録数、担当、game/role絞込、楽曲リンクを確認。下表参照。                                                                                             |
| 13   | 新5slug                        | mikiya-katakura / hiroyuki-maezawa / chiyomaru-shikura / natsuki-shoji / mizuki-sena、全200。                                                                                                    |
| 14   | 旧5slug 301                    | creator-0048 / 0081 / 0082 / 0089 / 0090が対応する新slugへ直接301、末尾slash有無の双方を確認。                                                                                                   |
| 15   | 代表旧slug                     | creator-0003→syuichi-mabe、creator-0004→junpei-fujitaも直接301。旧18slugの全36形式を確認。                                                                                                       |
| 16   | query保持                      | 新5名の旧URLで`?game=ournotes&role=composer`をLocationに保持。真部の実ブラウザー遷移はqueryと`#app`も保持。                                                                                      |
| 17   | redirect chainなし             | 全36旧URLからcurrent URLへ直接301。転送先は200で追加転送なし。                                                                                                                                   |
| 18   | canonical                      | current91詳細の基本URLと一致。絞込URLでもqueryなしcanonicalを確認。                                                                                                                              |
| 19   | sitemap                        | HTTP200、current Creator91 URL、旧slug0。                                                                                                                                                        |
| 20   | Garupa→Creator                 | 上松・藤田・ryo・UZ・john・最終slug4名の曲から固定IDに対応するCreatorへ正常遷移。                                                                                                                |
| 21   | OurNotes→Creator               | 堀江：`/ournotes/songs/44/`、瀬名：`/ournotes/songs/64/`から正常遷移。                                                                                                                           |
| 22   | Creator→Garupa                 | 指定11名のうち9名をGarupa作品リンクから詳細に移動しCreatorへ往復。                                                                                                                               |
| 23   | Creator→OurNotes               | 堀江・瀬名の作品からOurNotes詳細へ移動しCreatorへ往復。game filterのURLと総数保持も確認。                                                                                                        |
| 24   | 未同定fallback                 | JACK：BROKEN GAMES（Garupa707）、Louis：I wonder（Garupa734）。旧表記を維持し従来composer横断検索に曲が出ることを確認。                                                                          |
| 25   | 作詞・編曲未整備               | 指定11詳細で両担当が「未整備」。0件に置き換えていません。                                                                                                                                        |
| 26   | /admin/                        | HTTP200、楽曲入力・Creator選択・接続UIが正常表示。本番テスト保存0。                                                                                                                              |
| 27   | /admin/creators/               | HTTP200、一覧・入力・接続UIが正常表示。本番テスト保存0。                                                                                                                                         |
| 28   | /admin/news/                   | HTTP200、入力・接続UIが正常表示。本番テスト保存0。                                                                                                                                               |
| 29   | /contact/                      | HTTP200、問い合わせ入力・送信ボタンを正常表示。実送信0。                                                                                                                                         |
| 30   | Functions状態                  | ローカルcompile成功。本番GET `/api/contact`は405 / `method`で非送信確認。実メール送信は再実行していません。                                                                                      |
| 31   | JS/CSS 404なし                 | 公開33ファイル（JS30/CSS3）すべて200、改行と生成版数を考慮した内容がrelease sourceと一致。                                                                                                       |
| 32   | console error                  | Creator・楽曲・検索・管理・問い合わせのブラウザーwarn/error記録0。                                                                                                                               |
| 33   | 884収録                        | Garupa799 + OurNotes85 = 884。公開両catalogが検証済みsourceと一致。                                                                                                                              |
| 34   | 823 Work                       | 823維持。公開Work JSON全内容一致。                                                                                                                                                               |
| 35   | Creator 91                     | master91 / nextId92、ID型slug0、旧slug18、暫定sortKey47。                                                                                                                                        |
| 36   | Work warning 0                 | release precommit verifyで0、以降Work/data変更なし。                                                                                                                                             |
| 37   | 旧表示維持                     | 作詞/作曲/編曲の旧2,652表示が本番catalogでも全一致。displayOverrideとraw fallbackを保持。                                                                                                        |
| 38   | OurNotes並行編集保持           | ID循環変更・譜面・激奏区間・releaseOrder・時間などの意図した変更を保持。release開始時hashと一致、整形writeなし。                                                                                 |
| 39   | 本番で見つかった問題           | 公開不具合なし。初回asset比較はCRLF/LFと派生版数の差、検索assertは読込前で失敗したため検証手順を修正し成功。                                                                                     |
| 40   | 追加修正commit                 | 本番後のcode/data修正commitなし。公開前にslugテスト1件のignored cache依存を解消しfeature commitへ含めました。後続は結果資料だけ。                                                                |
| 41   | 本番公開の最終判断             | Creator DBの本番公開は正常完了。CI/Cloudflare成功、実本番内容一致、全smoke成功。                                                                                                                 |
| 42   | 公開後の残課題                 | 未同定raw215、暫定sortKey47、JACK/Louis、作詞/編曲未整備、今後のCreator追加更新。ユーザー受入済みの継続整備項目。GEN/ARM/TAKE/yasu/KATSUの既存mappingも保持。                                    |

## 指定11名の本番詳細

全件HTTP200、氏名に対応するtitle、基本URLのcanonicalを確認。作曲曲数は参加Work数と同じ、作詞/編曲は未整備です。game/role filterは表示作品を絞り、全参加Work数と全収録件数を変更しません。

| Creator    | slug              | 参加Work | 収録件数 |
| ---------- | ----------------- | -------- | -------- |
| 上松範康   | noriyasu-agematsu | 59       | 66       |
| 藤田淳平   | junpei-fujita     | 51       | 55       |
| 堀江晶太   | shota-horie       | 8        | 9        |
| ryo        | ryo-supercell     | 4        | 4        |
| UZ         | uz                | 3        | 3        |
| john       | john              | 1        | 1        |
| 瀬名水紀   | mizuki-sena       | 4        | 4        |
| 片倉三起也 | mikiya-katakura   | 4        | 4        |
| 前澤寛之   | hiroyuki-maezawa  | 3        | 3        |
| 志倉千代丸 | chiyomaru-shikura | 3        | 3        |
| 庄司夏葵   | natsuki-shoji     | 2        | 4        |

## 最新sourceでの公開前検証

4 migration verify、root/subpath build・両SEO監査、Functions compile、42変更JS/mjs構文、diff checkが成功。全165テストが成功し、SEOは各984正規ページ・884楽曲詳細・797楽曲互換・18Creator互換を確認しました。両生成物のcatalog/master/Work全JSONが現sourceと一致しています。

公開前に見つかった唯一のrelease blockerは、最終slugテストがignored固定cacheとroot固定baseを前提にしていたことです。同テストだけを所有tempでの独立subpath buildと現在base/origin参照へ変更し、既存assertを全維持しました。新checkoutの実CIも成功しています。公開機能・データ・UIに追加変更はありません。

正式100ファイルをレビュー・明示stageし、indexと確認済み内容の全一致、秘密情報・不要な公開local path混入なし、cache/dist/画像のstageなしを確認。Prettier readonly全100チェックは4警告で終了1でした。再生成されたcurrent review2資料だけを整え、98ファイルのstrict checkは成功。`data/ournotes/songs.json`と歴史snapshot `human-review-before-master.json`の既存2警告はbyte保持のため変更していません。

## 本番sourceと表示の検証方法

本番4JSONは正規build済みsourceとdeep比較し全一致。公開33JS/CSSはCRLF/LFとbuildが付ける12桁asset版のqueryだけを正規化して全文比較し全一致、すべてのmodule importは本番版数を使用しています。さらにbuildと同じSHA256処理をpush済みGit blobへ適用し、本番版`189e6c4a2626`と一致しました。Windowsローカル版`6c441d623424`との違いはGit checkoutの改行コードによるものです。

Cloudflare自身のGitHub checkはhead SHA d140705とdeploy成功を返し、本番内容比較と併せて別commitの公開でないことを確認しました。Wranglerは未ログインのため直接管理APIには接続していません。

390pxの一覧/瀬名詳細は両方clientWidth375、scrollWidth375、bodyWidth375で横はみ出しなし。画像はローカル検証cacheに保持し、正式commitには含めません。確認tabは終了しviewportはリセット済み。本番保存・外部メール送信は0です。

## 公開後の継続整備

完全ID化は635/884収録（71.83%）、582/823 Work（70.72%）を維持。未同定raw215、暫定読み47、JACK/Louis、作詞/編曲は別途確認し、根拠または人間確認がある更新だけを適用します。今回は追加調査・人物再判定・slug追加変更・Work再編を行っていません。過去フェーズの証拠は当時の記録として保持しています。
