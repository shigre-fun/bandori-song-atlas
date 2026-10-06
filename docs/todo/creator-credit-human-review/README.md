# Creator / credit 人間確認ToDo台帳

[曲別完全台帳](HUMAN_TODO_BY_SONG.md) / [Creator候補別完全台帳](HUMAN_TODO_BY_CREATOR.md) / [集計](HUMAN_TODO_SUMMARY.md)

[曲JSON](HUMAN_TODO_BY_SONG.json) / [Creator JSON](HUMAN_TODO_BY_CREATOR.json) / [完全性検証](HUMAN_TODO_VERIFICATION.json)

この台帳は現行repositoryの人間作業を列挙する。各recordはgame+recordIdで識別する。曲本文は一つのセクションに全taskをまとめ、OurNotes編曲未収集曲は独立章にまとめる。Creator候補はB1 identity groupを使い、追加recordや候補表記の同一性は人間確認待ちのまま保持する。JSONのsourceHeadとsourceDataHashesが作業対象の基準。

作業は各taskのactionを実行し、humanAnswerFieldsへ回答する。根拠に対象曲名・band・game・role・版・確認日時と出典を含める。情報がない場合は不明/欄なしを明示し、空欄を担当者なし・歌詞なしへ置き換えない。曲側checkboxはそのrecordの全taskを回答してからチェックする。Creator側は主体/登録情報の各checkboxを回答してからチェックする。

JSONを編集する場合、taskIdとcandidateKeyを変更しない。song taskのcreatorCandidateKeyとCreatorのsongTaskIdsが相互参照。各taskの回答を同じtaskIdでMarkdownにも書ける。aliasesが不要なら[]、同一の既存CreatorがないならsamePersonAsに「既存IDなし」と明示する。回答者と根拠はnotes/sourceNoteへ記録する。各record/roleを承認した範囲を明記する。

状態はTODO、BLOCKED、NEEDS_HUMAN、READY_FOR_CODEX_APPLY。人間判断が済み、completionConditionを満たす回答・出典・適用範囲が揃ったtaskだけREADY_FOR_CODEX_APPLYにする。依存task未回答はBLOCKEDのまま。発売版参考の編曲候補はゲーム内原文との一致を先に確認し、発売版からゲームへ自動転記しない。候補type/personや暫定sortKey/slugは承認済み値ではない。所属を個人と組織参加の二重計上に使わない。

台帳生成scriptは読み取りと台帳作成だけを行う。データ・UI・公開設定への適用機能はない。適用依頼では回答済みtaskだけを選び、sourceHead/sourceDataHashesとの差を確認し、ID/slug衝突・同一性・role・版・表示維持を検証してから別途適用する。未回答taskは適用対象外。

2026-10-06 P0回答のゲーム編曲81担当とOurNotes:86作詞原文を適用済み。回答原本・旧taskId対応・当時の不足欄・検証は [人間レビュー](../../human-review/creator-credits-p0-2026-10-06/REPORT.md) に保存。ゲーム原文が正式参照で解決しても、未回答の発売版との編曲同一性はGAME_VERSION_REVIEWに残す。
カンザキイオリの追加回答を適用し、cr-0125として正式登録。指定3曲の作詞・作曲6担当を紐付け、登録・同定残件を解決。[追加回答と検証](../../human-review/creator-kanzaki-2026-10-06/REPORT.md)。

生成：node scripts/research/creator-credit-human-todo.mjs generate

検証：node scripts/research/creator-credit-human-todo.mjs verify

テスト：node --test tests/research/creator-credit-human-todo.test.mjs

生成は上記7成果物だけを書き込む。回答済み/状態変更/checkbox変更を検知すると上書きを拒否する。再生成前に人間回答を保全する。verifyは生成時の入力SHAと現行を照合し、全current record/role・過去source entry・cross-link・Markdown本文/checkboxを検証する。

task category

| category | 意味 |
| --- | --- |
| CREDIT_COLLECTION | 担当credit原文の収集 |
| CREATOR_IDENTITY | credit主体の同定 |
| CREATOR_REGISTRATION | 未登録主体の登録情報の決定 |
| SPLIT_REVIEW | 作者境界・共同credit・順序の確認 |
| ALIAS_REVIEW | 既存Creatorとの表記同一性の確認 |
| ROLE_REVIEW | 対象曲・版・担当の一次資料照合 |
| DISPLAY_REVIEW | 既存表示と確認した原文の差の判断 |
| GAME_VERSION_REVIEW | 発売版とゲーム版の関係の確認 |
| METADATA_REVIEW | 公開に影響しない登録情報の改善 |

DISPLAY_REVIEW/METADATA_REVIEWは現行で独立の未承認課題が確認できなければ0件。過去human承認済みmetadataを再度未完了にしない。Composerの現行rawも全件走査し、B2原文がないものは現行rawを保持して対象曲/roleの一次確認taskにする。
