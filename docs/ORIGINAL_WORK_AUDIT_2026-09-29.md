# 原曲作品名の全件一括点検（2026-09-29）

`data/garupa/songs.json` と `data/ournotes/songs.json` の `originalWork` がある全307曲（ガルパ288曲、アワーノーツ19曲）を、同じ実行で `node scripts/qa/audit-original-works.mjs` に通した。さらに全曲を `docs/original-work-mapping.json` と突き合わせ、対応表279件は現在値と一致し、対応表のない曲は28件だった。この点検時点では楽曲ID・`releaseOrder` の変更はなかった。全66テスト、サイト再生成、生成ページ監査も成功した。後のガルパID再採番に合わせ、この資料のIDは新番号へ更新した。旧番号は `docs/GARUPA_ID_RENUMBER_2026-09-29.csv` を参照。

この点検で確認できるのは記載形式と既存の調査対応表との一致までである。307曲それぞれに公式出典を1対1で紐付け直す事実確認は完了していない。したがって、下の未確定曲以外も、全件の歴代OP・ED番号、期、クールの正しさを今回の点検だけで保証しない。

## 用途を特定できなかった12曲

詳細と確認済みの資料は [原曲作品名の表記調査](ORIGINAL_WORK_RESEARCH.md#保留追加調査) に記録した。推測によるOP/EDへの変更はしていない。

| ゲーム:ID   | 曲名                           | 残る確認事項             |
| ----------- | ------------------------------ | ------------------------ |
| garupa:751  | MATSURI BAYASHI                | 楽曲自体の番組内用途     |
| garupa:780  | スターラブレイション           | ドラマのOP/ED区分        |
| garupa:126  | 夏祭り                         | ドラマのOP/ED区分        |
| garupa:298  | CQCQ                           | ドラマのOP/ED区分        |
| garupa:23   | secret base ～君がくれたもの～ | 2作品のドラマのOP/ED区分 |
| garupa:764  | ヒカリへ                       | ドラマのOP/ED区分        |
| garupa:110  | 気まぐれロマンティック         | ドラマのOP/ED区分        |
| garupa:734  | I wonder                       | ドラマのOP/ED区分        |
| garupa:627  | Subtitle                       | ドラマのOP/ED区分        |
| garupa:297  | ドラマツルギー                 | ドラマのOP/ED区分        |
| garupa:632  | 幾億光年                       | ドラマのOP/ED区分        |
| ournotes:62 | UNDEAD                         | アニメのOP/ED区分        |

## 個別の改訂対応表がない28曲

以下は全件点検時のデータ値を検査したが、`docs/original-work-mapping.json` に曲別の改訂記録がない。うち7曲は上記12曲と重複する。現在値を誤りと断定するものではなく、今回の一括点検で個別の根拠を追跡できなかった曲として記録する。

| ゲーム:ID   | 曲名                        |
| ----------- | --------------------------- |
| garupa:20   | Alchemy                     |
| garupa:751  | MATSURI BAYASHI             |
| garupa:687  | つよがるガール feat. もっさ |
| garupa:780  | スターラブレイション        |
| garupa:658  | フィクション                |
| garupa:727  | 恋人がサンタクロース        |
| garupa:19   | 空色デイズ                  |
| garupa:792  | オー！リバル                |
| garupa:752  | メロウ                      |
| garupa:612  | 輪舞-revolution             |
| garupa:764  | ヒカリへ                    |
| garupa:708  | 恋愛サーキュレーション      |
| garupa:246  | Bad Apple!! feat. nomico    |
| garupa:26   | Hacking to the Gate         |
| garupa:721  | Sincerely                   |
| garupa:609  | カゲロウデイズ              |
| garupa:21   | カルマ                      |
| garupa:710  | 怪獣                        |
| garupa:734  | I wonder                    |
| garupa:627  | Subtitle                    |
| garupa:610  | 雑踏、僕らの街              |
| garupa:737  | イケナイ太陽                |
| garupa:634  | シカ色デイズ                |
| garupa:632  | 幾億光年                    |
| ournotes:62 | UNDEAD                      |
| ournotes:68 | Pretender                   |
| ournotes:70 | ロウワー                    |
| ournotes:77 | イケナイ太陽                |

この一覧をもって今回の調査を終了する。追加の事実確認は行っていない。
