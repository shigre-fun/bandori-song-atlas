# 原曲作品名の全件一括点検（2026-09-29）

`data/garupa/songs.json` と `data/ournotes/songs.json` の `originalWork` がある全307曲（ガルパ288曲、アワーノーツ19曲）を、同じ実行で `node scripts/qa/audit-original-works.mjs` に通した。さらに全曲を `docs/original-work-mapping.json` と突き合わせ、対応表279件は現在値と一致し、対応表のない曲は28件だった。楽曲ID・`releaseOrder` の変更はない。全66テスト、サイト再生成、生成ページ監査も成功した。

この点検で確認できるのは記載形式と既存の調査対応表との一致までである。307曲それぞれに公式出典を1対1で紐付け直す事実確認は完了していない。したがって、下の未確定曲以外も、全件の歴代OP・ED番号、期、クールの正しさを今回の点検だけで保証しない。

## 用途を特定できなかった12曲

詳細と確認済みの資料は [原曲作品名の表記調査](ORIGINAL_WORK_RESEARCH.md#保留追加調査) に記録した。推測によるOP/EDへの変更はしていない。

| ゲーム:ID   | 曲名                           | 残る確認事項             |
| ----------- | ------------------------------ | ------------------------ |
| garupa:774  | MATSURI BAYASHI                | 楽曲自体の番組内用途     |
| garupa:804  | スターラブレイション           | ドラマのOP/ED区分        |
| garupa:136  | 夏祭り                         | ドラマのOP/ED区分        |
| garupa:311  | CQCQ                           | ドラマのOP/ED区分        |
| garupa:18   | secret base ～君がくれたもの～ | 2作品のドラマのOP/ED区分 |
| garupa:787  | ヒカリへ                       | ドラマのOP/ED区分        |
| garupa:116  | 気まぐれロマンティック         | ドラマのOP/ED区分        |
| garupa:756  | I wonder                       | ドラマのOP/ED区分        |
| garupa:648  | Subtitle                       | ドラマのOP/ED区分        |
| garupa:308  | ドラマツルギー                 | ドラマのOP/ED区分        |
| garupa:653  | 幾億光年                       | ドラマのOP/ED区分        |
| ournotes:62 | UNDEAD                         | アニメのOP/ED区分        |

## 個別の改訂対応表がない28曲

以下は全件点検時のデータ値を検査したが、`docs/original-work-mapping.json` に曲別の改訂記録がない。うち7曲は上記12曲と重複する。現在値を誤りと断定するものではなく、今回の一括点検で個別の根拠を追跡できなかった曲として記録する。

| ゲーム:ID   | 曲名                        |
| ----------- | --------------------------- |
| garupa:10   | Alchemy                     |
| garupa:774  | MATSURI BAYASHI             |
| garupa:707  | つよがるガール feat. もっさ |
| garupa:804  | スターラブレイション        |
| garupa:678  | フィクション                |
| garupa:749  | 恋人がサンタクロース        |
| garupa:8    | 空色デイズ                  |
| garupa:820  | オー！リバル                |
| garupa:775  | メロウ                      |
| garupa:634  | 輪舞-revolution             |
| garupa:787  | ヒカリへ                    |
| garupa:731  | 恋愛サーキュレーション      |
| garupa:258  | Bad Apple!! feat. nomico    |
| garupa:16   | Hacking to the Gate         |
| garupa:743  | Sincerely                   |
| garupa:632  | カゲロウデイズ              |
| garupa:14   | カルマ                      |
| garupa:733  | 怪獣                        |
| garupa:756  | I wonder                    |
| garupa:648  | Subtitle                    |
| garupa:633  | 雑踏、僕らの街              |
| garupa:760  | イケナイ太陽                |
| garupa:655  | シカ色デイズ                |
| garupa:653  | 幾億光年                    |
| ournotes:62 | UNDEAD                      |
| ournotes:68 | Pretender                   |
| ournotes:70 | ロウワー                    |
| ournotes:77 | イケナイ太陽                |

この一覧をもって今回の調査を終了する。追加の事実確認は行っていない。
