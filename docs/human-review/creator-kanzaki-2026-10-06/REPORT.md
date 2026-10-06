# カンザキイオリ P0残件の正式登録

2026-10-06の追加回答を適用し、カンザキイオリを **cr-0125 / iori-kanzaki** として登録しました。Creatorは125件、nextIdは126です。所属・備考の空文字は明示された「なし」、根拠URL・資料の空文字はユーザーの省略許可として記録しています。

| 対象 | 曲 | 担当 | Work |
| --- | --- | --- | --- |
| Garupa:467 | 命に嫌われている。 | 作詞・作曲 | wk-0458 |
| Garupa:758 | 過去を喰らう | 作詞・作曲 | wk-0739 |
| OurNotes:86 | 過去を喰らう | 作詞・作曲 | wk-0739 |

指定3収録・6担当だけを紐付けました。原文「カンザキイオリ」と他の担当・順序、既存124件のmetadata、Work823、管理状態を登録段階で保持しました。Creatorページの参加楽曲数2、作詞2、作曲2、収録件数3を両baseで確認しています。

旧課題3366件は3354件を同IDで継続、カンザキ12件を解決。原3432件まで連鎖対応し、未対応0。版関係39件は未回答のまま残します。[最新台帳](../../todo/creator-credit-human-review/README.md)を参照してください。

検証は既存264＋台帳/P0/登録31＝**295件成功**。rootとsubpathのbuild・SEO1019ページ/885詳細・全公開catalog値・6担当リンク/canonical/sitemapを確認、再apply変更0。旧P030資料とA/B1全452資料を保持しています。Functions/UIコードは今回変更していません。

[追加回答](input.txt)、[解析・6scope](review.json)、[登録receipt](applied.json)、[旧task対応](TASK_CORRESPONDENCE.json)、[全検証・失敗と対処](verification.json)、[生成ページ照合](page-audit.json)、validation/*.txtを保存しています。旧P0の資料は当時の履歴として変更していません。

公開の追加指示を受領し、remote先行3曲（ないものねだり・シャルル・青春コンプレックス）の更新を統合しました。演奏時間118/95/138秒、HARDノーツ533/857、更新履歴を取り込み、後日確定した編曲クレジットと表示順を保持しています。[統合判断とSHA](remote-integration.json)を保存し、統合後295件・両build/SEO/生成ページ・再apply0を確認しました。2026-10-07にcommit **a1a9bba** を通常pushし、同SHAのGitHub ActionsとCloudflare deploymentの成功を確認しました。

本番の125件表示、[カンザキイオリ](https://tanimachi-bdsongs.com/creators/iori-kanzaki/)の2楽曲/3収録/作詞・作曲各2、3収録の6リンクを確認しました。18 HTTPすべて200、全885公開record・Creator/Workの値が検証済みbuildと一致し、先行3曲の更新も保持されています。[deployment証拠](deployment-status.json)と[本番照合](public-audit.json)を保存しました。

終了時の追加commitは検証記録のみです。公開済みa1a9bbaの製品ファイルと一致を確認し、再buildを省略する[Cloudflareのcommit prefix](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/#skipping-a-build-via-a-commit-message)とGitHubのskip指定を付けて保存します。
