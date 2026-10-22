# 人間確認ToDo集計

[曲別完全台帳](HUMAN_TODO_BY_SONG.md) / [Creator候補別完全台帳](HUMAN_TODO_BY_CREATOR.md) / [入力・更新手順](README.md)

| 項目 | 現行集計 |
| --- | ---: |
| currentRecordCount | 890 |
| currentCreatorCount | 446 |
| currentWorkCount | 828 |
| currentNextId | 447 |
| totalSongTodoRecords | 0 |
| totalSongTasks | 0 |
| totalCreatorCandidates | 0 |
| threePlusRecordCreators | 0 |
| twoRecordCreators | 0 |
| oneRecordCreators | 0 |
| referenceOnlyCreatorCandidates | 0 |
| existingCreatorRoleCandidates | 0 |
| unregisteredCreatorCandidates | 0 |
| ournotesArrangerManualSongs | 0 |
| lyricistCollectionSongs | 0 |
| garupaArrangerCollectionSongs | 0 |
| splitReviewTasks | 0 |
| currentRawSplitReviewTasks | 0 |
| conditionalReleaseSplitReviewTasks | 0 |
| currentUnresolvedRecordRoles | 0 |
| sourceUnresolvedEntries | 1822 |
| mappedTodoEntries | 0 |
| excludedResolvedSourceEntries | 1822 |
| unmappedCurrentUnresolved | 0 |
| CREDIT_COLLECTION song tasks | 0 |
| CREATOR_IDENTITY song tasks | 0 |
| CREATOR_REGISTRATION song tasks | 0 |
| SPLIT_REVIEW song tasks | 0 |
| ALIAS_REVIEW song tasks | 0 |
| ROLE_REVIEW song tasks | 0 |
| DISPLAY_REVIEW song tasks | 0 |
| GAME_VERSION_REVIEW song tasks | 0 |
| METADATA_REVIEW song tasks | 0 |

現行：Garupa 801 / OurNotes 89。recordはgame+IDで数え、affectedRecordCountはrole重複を除く。同じWorkの別recordは統合しない。

発売版参考だけのCreator候補を含む。条件付き候補はゲーム内creditへの登場が確認できるまで正式ゲーム参加者として数えない。既存Creatorのrole/境界課題は新規登録対象にしない。過去未解決資料は各entryをcurrentへ照合し、現行formal参照で解決済みのentryは除外した。

主体0件のうち、未登録の同一主体候補0件、既存IDの担当/表記/版の確認0件。発売版参考だけの0件はこの総数の内数。split 0件はrecord+role単位のtask数で、現行rawの境界0件とゲーム原文確認に依存する発売版参考0件。過去のsplit群の数と混同しない。source entry数は入力分類間で重複があり、曲数・主体数ではない。

| 入力分類 | 読取entry | current対応 | 現行解決済み除外 | 未対応 |
| --- | ---: | ---: | ---: | ---: |
| unresolved-after-b2 | 703 | 0 | 703 | 0 |
| unresolved-index/lyricist | 220 | 0 | 220 | 0 |
| unresolved-index/garupaArranger | 33 | 0 | 33 | 0 |
| unresolved-index/ournotesArranger | 3 | 0 | 3 | 0 |
| unresolved-index/split | 59 | 0 | 59 | 0 |
| split-review | 69 | 0 | 69 | 0 |
| lyricist-unconfirmed | 50 | 0 | 50 | 0 |
| garupa-arranger-unconfirmed | 50 | 0 | 50 | 0 |
| ournotes-arranger-manual-review | 80 | 0 | 80 | 0 |
| uncertain-token-occurrences | 555 | 0 | 555 | 0 |

台帳生成処理の前後で4data SHA一致、A/B1保護資料のSHA一致、HEAD不変を検証。台帳生成自体によるデータ変更0。別途保存した人間回答の適用内容と変更前SHAは人間レビュー資料を参照。commit/push/deploy未実施。
