# 人間確認ToDo集計

[曲別完全台帳](HUMAN_TODO_BY_SONG.md) / [Creator候補別完全台帳](HUMAN_TODO_BY_CREATOR.md) / [入力・更新手順](README.md)

| 項目 | 現行集計 |
| --- | ---: |
| currentRecordCount | 888 |
| currentCreatorCount | 371 |
| currentWorkCount | 826 |
| currentNextId | 372 |
| totalSongTodoRecords | 118 |
| totalSongTasks | 375 |
| totalCreatorCandidates | 123 |
| threePlusRecordCreators | 11 |
| twoRecordCreators | 16 |
| oneRecordCreators | 96 |
| referenceOnlyCreatorCandidates | 0 |
| existingCreatorRoleCandidates | 27 |
| unregisteredCreatorCandidates | 96 |
| ournotesArrangerManualSongs | 0 |
| lyricistCollectionSongs | 0 |
| garupaArrangerCollectionSongs | 0 |
| splitReviewTasks | 1 |
| currentRawSplitReviewTasks | 1 |
| conditionalReleaseSplitReviewTasks | 0 |
| currentUnresolvedRecordRoles | 175 |
| sourceUnresolvedEntries | 1822 |
| mappedTodoEntries | 473 |
| excludedResolvedSourceEntries | 1349 |
| unmappedCurrentUnresolved | 0 |
| CREDIT_COLLECTION song tasks | 0 |
| CREATOR_IDENTITY song tasks | 129 |
| CREATOR_REGISTRATION song tasks | 129 |
| SPLIT_REVIEW song tasks | 1 |
| ALIAS_REVIEW song tasks | 74 |
| ROLE_REVIEW song tasks | 3 |
| DISPLAY_REVIEW song tasks | 0 |
| GAME_VERSION_REVIEW song tasks | 39 |
| METADATA_REVIEW song tasks | 0 |

現行：Garupa 800 / OurNotes 88。recordはgame+IDで数え、affectedRecordCountはrole重複を除く。同じWorkの別recordは統合しない。

発売版参考だけのCreator候補を含む。条件付き候補はゲーム内creditへの登場が確認できるまで正式ゲーム参加者として数えない。既存Creatorのrole/境界課題は新規登録対象にしない。過去未解決資料は各entryをcurrentへ照合し、現行formal参照で解決済みのentryは除外した。

主体123件のうち、未登録の同一主体候補96件、既存IDの担当/表記/版の確認27件。発売版参考だけの0件はこの総数の内数。split 1件はrecord+role単位のtask数で、現行rawの境界1件とゲーム原文確認に依存する発売版参考0件。過去のsplit群の数と混同しない。source entry数は入力分類間で重複があり、曲数・主体数ではない。

| 入力分類 | 読取entry | current対応 | 現行解決済み除外 | 未対応 |
| --- | ---: | ---: | ---: | ---: |
| unresolved-after-b2 | 703 | 169 | 534 | 0 |
| unresolved-index/lyricist | 220 | 23 | 197 | 0 |
| unresolved-index/garupaArranger | 33 | 6 | 27 | 0 |
| unresolved-index/ournotesArranger | 3 | 0 | 3 | 0 |
| unresolved-index/split | 59 | 40 | 19 | 0 |
| split-review | 69 | 40 | 29 | 0 |
| lyricist-unconfirmed | 50 | 44 | 6 | 0 |
| garupa-arranger-unconfirmed | 50 | 35 | 15 | 0 |
| ournotes-arranger-manual-review | 80 | 23 | 57 | 0 |
| uncertain-token-occurrences | 555 | 93 | 462 | 0 |

台帳生成処理の前後で4data SHA一致、A/B1保護資料のSHA一致、HEAD不変を検証。台帳生成自体によるデータ変更0。別途保存した人間回答の適用内容と変更前SHAは人間レビュー資料を参照。commit/push/deploy未実施。
