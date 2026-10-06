# 人間確認ToDo集計

[曲別完全台帳](HUMAN_TODO_BY_SONG.md) / [Creator候補別完全台帳](HUMAN_TODO_BY_CREATOR.md) / [入力・更新手順](README.md)

| 項目 | 現行集計 |
| --- | ---: |
| currentRecordCount | 885 |
| currentCreatorCount | 126 |
| currentWorkCount | 823 |
| currentNextId | 127 |
| totalSongTodoRecords | 332 |
| totalSongTasks | 1305 |
| totalCreatorCandidates | 343 |
| threePlusRecordCreators | 7 |
| twoRecordCreators | 52 |
| oneRecordCreators | 284 |
| referenceOnlyCreatorCandidates | 0 |
| existingCreatorRoleCandidates | 12 |
| unregisteredCreatorCandidates | 331 |
| ournotesArrangerManualSongs | 0 |
| lyricistCollectionSongs | 49 |
| garupaArrangerCollectionSongs | 48 |
| splitReviewTasks | 53 |
| currentRawSplitReviewTasks | 53 |
| conditionalReleaseSplitReviewTasks | 0 |
| currentUnresolvedRecordRoles | 595 |
| sourceUnresolvedEntries | 1822 |
| mappedTodoEntries | 1570 |
| excludedResolvedSourceEntries | 252 |
| unmappedCurrentUnresolved | 0 |
| CREDIT_COLLECTION song tasks | 97 |
| CREATOR_IDENTITY song tasks | 522 |
| CREATOR_REGISTRATION song tasks | 522 |
| SPLIT_REVIEW song tasks | 53 |
| ALIAS_REVIEW song tasks | 4 |
| ROLE_REVIEW song tasks | 68 |
| DISPLAY_REVIEW song tasks | 0 |
| GAME_VERSION_REVIEW song tasks | 39 |
| METADATA_REVIEW song tasks | 0 |

現行：Garupa 799 / OurNotes 86。recordはgame+IDで数え、affectedRecordCountはrole重複を除く。同じWorkの別recordは統合しない。

発売版参考だけのCreator候補を含む。条件付き候補はゲーム内creditへの登場が確認できるまで正式ゲーム参加者として数えない。既存Creatorのrole/境界課題は新規登録対象にしない。過去未解決資料は各entryをcurrentへ照合し、現行formal参照で解決済みのentryは除外した。

主体343件のうち、未登録の同一主体候補331件、既存IDの担当/表記/版の確認12件。発売版参考だけの0件はこの総数の内数。split 53件はrecord+role単位のtask数で、現行rawの境界53件とゲーム原文確認に依存する発売版参考0件。過去のsplit群の数と混同しない。source entry数は入力分類間で重複があり、曲数・主体数ではない。

| 入力分類 | 読取entry | current対応 | 現行解決済み除外 | 未対応 |
| --- | ---: | ---: | ---: | ---: |
| unresolved-after-b2 | 703 | 595 | 108 | 0 |
| unresolved-index/lyricist | 220 | 218 | 2 | 0 |
| unresolved-index/garupaArranger | 33 | 23 | 10 | 0 |
| unresolved-index/ournotesArranger | 3 | 3 | 0 | 0 |
| unresolved-index/split | 59 | 57 | 2 | 0 |
| split-review | 69 | 57 | 12 | 0 |
| lyricist-unconfirmed | 50 | 49 | 1 | 0 |
| garupa-arranger-unconfirmed | 50 | 48 | 2 | 0 |
| ournotes-arranger-manual-review | 80 | 24 | 56 | 0 |
| uncertain-token-occurrences | 555 | 496 | 59 | 0 |

台帳生成処理の前後で4data SHA一致、A/B1保護資料のSHA一致、HEAD不変を検証。台帳生成自体によるデータ変更0。別途保存した人間回答の適用内容と変更前SHAは人間レビュー資料を参照。commit/push/deploy未実施。
