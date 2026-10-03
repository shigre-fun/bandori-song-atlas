# Phase B2 要件照合

2026-10-03。添付の0〜113、全114要件。VERIFIEDは各明示条件の実装・検証を示し、全identityや未収集編曲の完備という意味ではない。metadata除外は第108節、human補完は第48/50節に従い区別。

| 仕様番号 | 要件                                         | 判定     | 具体的証拠・確認範囲                                                                                                                               |
| -------- | -------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0        | 最重要原則                                   | VERIFIED | 報告66: Phase B2をhuman reviewへ渡せるか。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                  |
| 1        | 入力                                         | VERIFIED | 報告1: B1 package SHA / version。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                           |
| 2        | B1 packageの現在状態                         | VERIFIED | 報告1: B1 package SHA / version。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                           |
| 3        | human reviewを新規保存                       | VERIFIED | 報告3: human review反映件数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                               |
| 4        | A1：B1 proposalをそのまま承認                | VERIFIED | 報告4: A1採用12件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                         |
| 5        | A1 slug                                      | VERIFIED | 報告13: 新slug一覧。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                        |
| 6        | A2：human reviewで読み・slug確定             | VERIFIED | 報告5: A2採用14件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                         |
| 7        | former PROBABLE 7主体をhuman CONFIRMEDへ昇格 | VERIFIED | 報告6: former PROBABLE昇格7件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 8        | 宮崎京一                                     | VERIFIED | 報告6: former PROBABLE昇格7件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 9        | 母里治樹                                     | VERIFIED | 報告6: former PROBABLE昇格7件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 10       | 川渕龍成                                     | VERIFIED | 報告6: former PROBABLE昇格7件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 11       | ハルイチ                                     | VERIFIED | 報告6: former PROBABLE昇格7件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 12       | 烏屋茶房                                     | VERIFIED | 報告6: former PROBABLE昇格7件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 13       | 林英樹                                       | VERIFIED | 報告6: former PROBABLE昇格7件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 14       | o-saka                                       | VERIFIED | 報告39: o-saka != 尾崎豪確認。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 15       | former PROBABLE 7主体のslug / sortKey        | VERIFIED | 報告8: metadata BLOCKED件数。identityは確定。一次metadata本文を読めた4件のみ公開。3件は明示許可されたBLOCKED_METADATA。                            |
| 16       | ID型slugを新たに作らない                     | VERIFIED | 報告8: metadata BLOCKED件数。ID型slugを作らず保留3をrawで保持。                                                                                    |
| 17       | 既存variantのhuman confirmation              | VERIFIED | 報告7: existing variant昇格3件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                            |
| 18       | 既存IDを変更しない                           | VERIFIED | 報告17: existing ID再利用数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                               |
| 19       | 正式ID採番                                   | VERIFIED | 報告12: candidateKey→formal ID mapping全件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                |
| 20       | 採番順序                                     | VERIFIED | 報告12: candidateKey→formal ID mapping全件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                |
| 21       | former PROBABLEの採番                        | VERIFIED | 報告12: candidateKey→formal ID mapping全件。118～120固定予約、121～124を詰めない。                                                                 |
| 22       | nextId                                       | VERIFIED | 報告11: nextId。保留3により実総数121、next125。                                                                                                    |
| 23       | Creator master追加                           | VERIFIED | 報告9: formal new Creator件数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 24       | aliases                                      | VERIFIED | 報告15: alias追加数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                       |
| 25       | 所属付きalias                                | VERIFIED | 報告40: affiliation二重計上0。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 26       | affiliationParticipation                     | VERIFIED | 報告40: affiliation二重計上0。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 27       | Spirit Garden                                | VERIFIED | 報告40: affiliation二重計上0。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 28       | samfree表示                                  | VERIFIED | 報告35: ルカルカ結果。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                      |
| 29       | displayOverride                              | VERIFIED | 報告16: displayOverride数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                 |
| 30       | B2 package再生成                             | VERIFIED | 報告1: B1 package SHA / version。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                           |
| 31       | effective package gate                       | VERIFIED | 報告46: UNRESOLVED applied 0。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 32       | package dry-run                              | VERIFIED | 報告18: lyricist relation proposal数。apply-plan全dry結果。報告9/16/17/18/23/28/32/46と追加実行記録で母集団を区別。                                |
| 33       | 旧relationを壊さない                         | VERIFIED | 報告32: Composer correction 4件結果。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                       |
| 34       | role merge                                   | VERIFIED | 報告43: duplicate relation 0。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 35       | relation order                               | VERIFIED | 報告51: old display 2,652比較。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 36       | lyricist relation                            | VERIFIED | 報告18: lyricist relation proposal数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                      |
| 37       | 未解決lyricist                               | VERIFIED | 報告21: lyricist raw fallback数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                           |
| 38       | 作詞未確定50件                               | VERIFIED | 報告22: lyricist credit未確定50件維持確認。歴史50資料SHA不変。第48節human1補完を別記、現在49。                                                     |
| 39       | Garupa arranger relation                     | VERIFIED | 報告23: Garupa arranger proposal数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                        |
| 40       | Garupa arranger未確定50件                    | VERIFIED | 報告27: Garupa arranger未確定50件維持確認。歴史50資料SHA不変。第50節human2補完を別記、現在48。                                                     |
| 41       | OurNotes arranger                            | VERIFIED | 報告28: OurNotes arranger proposal数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                      |
| 42       | OurNotes確認済み5件                          | VERIFIED | 報告30: OurNotes game版確認済み5件の状態。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                  |
| 43       | OurNotes残80件                               | VERIFIED | 報告31: OurNotes残80未収集維持。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                            |
| 44       | Composer correction                          | VERIFIED | 報告32: Composer correction 4件結果。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                       |
| 45       | Garupa:249 ルカルカ★ナイトフィーバー         | VERIFIED | 報告35: ルカルカ結果。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                      |
| 46       | OurNotes:14 砂寸奏                           | VERIFIED | 報告36: 砂寸奏結果。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                        |
| 47       | OurNotes:33 Symbol IV : Earth                | VERIFIED | 報告37: Symbol IV : Earth結果。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 48       | OurNotes:66 カーネーションの咲く日に         | VERIFIED | 報告38: カーネーション結果。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                |
| 49       | Mela!                                        | VERIFIED | 報告33: Mela!結果。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                         |
| 50       | きゅ〜まい＊flower                           | VERIFIED | 報告34: きゅ〜まい＊flower結果。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                            |
| 51       | current raw表示保持                          | VERIFIED | 報告51: old display 2,652比較。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 52       | unresolved raw fallback                      | VERIFIED | 報告55: song detail link/fallback。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                         |
| 53       | roleCoverage方針                             | VERIFIED | 報告53: roleCoverage最終状態。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 54       | game-aware coverage                          | VERIFIED | 報告53: roleCoverage最終状態。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 55       | partialの意味                                | VERIFIED | 報告53: roleCoverage最終状態。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 56       | 作詞の公開                                   | VERIFIED | 報告20: lyricist完全Creator解決record数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                   |
| 57       | Garupa編曲の公開                             | VERIFIED | 報告25: Garupa arranger完全Creator解決数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                  |
| 58       | OurNotes編曲UI                               | VERIFIED | 報告31: OurNotes残80未収集維持。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                            |
| 59       | Creator detail statistics                    | VERIFIED | 報告54: Creator detail統計。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                |
| 60       | Work-level集計                               | VERIFIED | 報告54: Creator detail統計。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                |
| 61       | game filter                                  | VERIFIED | 報告54: Creator detail統計。scope-verification.jsonの全726 game/role条件、不一致0。                                                                |
| 62       | song detail                                  | VERIFIED | 報告55: song detail link/fallback。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                         |
| 63       | multiple Creator                             | VERIFIED | 報告55: song detail link/fallback。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                         |
| 64       | admin                                        | VERIFIED | 報告56: admin regression。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                  |
| 65       | admin creator                                | VERIFIED | 報告56: admin regression。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                  |
| 66       | Creator削除保護                              | VERIFIED | 報告56: admin regression。新参照Creator削除拒否はAPI unitで検証。実UIは確認表示と取消。                                                            |
| 67       | slug uniqueness                              | VERIFIED | 報告14: slug collision件数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                |
| 68       | previousSlugs                                | VERIFIED | 報告13: 新slug一覧。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                        |
| 69       | sitemap                                      | VERIFIED | 報告60: root SEO。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                          |
| 70       | canonical                                    | VERIFIED | 報告60: root SEO。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                          |
| 71       | Creator件数                                  | VERIFIED | 報告10: Creator総数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                       |
| 72       | Workは変更しない                             | VERIFIED | 報告49: Work数823。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                         |
| 73       | record数                                     | VERIFIED | 報告48: record数884。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                       |
| 74       | OurNotes並行編集                             | VERIFIED | 報告52: OurNotes並行編集保持。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 75       | field-level patch                            | VERIFIED | 報告52: OurNotes並行編集保持。credit-field-patch.mjsの構造位置patchとB2 whitespace test、全non-credit比較。                                        |
| 76       | pre-apply SHA                                | VERIFIED | 報告2: B2開始時current data SHA。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                           |
| 77       | record matching                              | VERIFIED | 報告48: record数884。B2 record mismatch CONFLICT testとapply guard。game/ID/title/workIdの4項目を確認。                                            |
| 78       | destructive operation禁止                    | VERIFIED | 報告52: OurNotes並行編集保持。今回reset/clean/force checkout/古いJSON live復元なし。限定formatterだけを実行、全source保全証明。                    |
| 79       | apply前backup                                | VERIFIED | 報告2: B2開始時current data SHA。scope-verification.jsonでbackup3fileとmanifestのbyteSHAを開始sourceと照合。                                       |
| 80       | apply script                                 | VERIFIED | 報告66: Phase B2をhuman reviewへ渡せるか。scripts/migrations/apply-credits-phase-b2.mjsのplan/apply/verify、追加実行記録。                         |
| 81       | idempotence                                  | VERIFIED | 報告43: duplicate relation 0。実2回目apply changedFiles0とB2二重plan/output SHA、alias/role重複0 scope QA。                                        |
| 82       | migration guard                              | VERIFIED | 報告41: duplicate Creator ID 0。B2 nextId/ID/metadata/record/SHA negative testsとmigration version・candidate・slug gate。                         |
| 83       | unresolved exclusion                         | VERIFIED | 報告46: UNRESOLVED applied 0。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 84       | short-name gate                              | VERIFIED | 報告45: PROBABLE applied 0。scope-verification.json：全正式token recordScope一致。B2専用short-name test。                                          |
| 85       | o-saka gate                                  | VERIFIED | 報告39: o-saka != 尾崎豪確認。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 86       | affiliations gate                            | VERIFIED | 報告40: affiliation二重計上0。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 87       | human-reviewed variants                      | VERIFIED | 報告7: existing variant昇格3件。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                            |
| 88       | human corrections tests                      | VERIFIED | 報告33: Mela!結果。B2 testsのMela/flower/SAM/砂寸奏/Symbol/Carnation全6案件、報告32〜38。                                                          |
| 89       | relation validation                          | VERIFIED | 報告44: dangling Creator reference 0。現行validateCreatorDatabase/credit-structureと既存/B2 schema negative tests、scope QAのnon-CONFIRMED fatal。 |
| 90       | no candidateKey in public data               | VERIFIED | 報告47: candidateKey public relation 0。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                    |
| 91       | display comparison                           | VERIFIED | 報告51: old display 2,652比較。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 92       | unresolved display comparison                | VERIFIED | 報告51: old display 2,652比較。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                             |
| 93       | Creator statistics                           | VERIFIED | 報告54: Creator detail統計。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                |
| 94       | high-frequency sanity check                  | VERIFIED | 報告54: Creator detail統計。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                |
| 95       | roleCoverage test                            | VERIFIED | 報告53: roleCoverage最終状態。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                              |
| 96       | responsive UI                                | VERIFIED | 報告55: song detail link/fallback。実測4組（Creator/Song×390/1280）、viewport証拠。                                                                |
| 97       | SEO                                          | VERIFIED | 報告60: root SEO。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                          |
| 98       | build                                        | VERIFIED | 報告58: root build。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                        |
| 99       | existing tests                               | VERIFIED | 報告57: test件数 / 成否。assert変更0。旧91/source fixture194＋current live35を明確に区別。                                                         |
| 100      | expected tests                               | VERIFIED | 報告57: test件数 / 成否。B2追加35件のtest名と各assertで要求20領域を確認。全884保存・current displayも検証。                                        |
| 101      | public research leakage                      | VERIFIED | 報告63: distへのresearch漏洩0。全5544file非混入＋公開JSON20fileでresearch keys/candidateKey0。                                                     |
| 102      | admin production write禁止                   | VERIFIED | 報告56: admin regression。実GitHub write0。memory-only mock保存/API読取。                                                                          |
| 103      | contact regression                           | VERIFIED | 報告62: Functions compile。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                 |
| 104      | apply後verify                                | VERIFIED | 報告48: record数884。verifyApplied＋scope-verification/current4SHA、報告41〜53。                                                                   |
| 105      | coverage report                              | VERIFIED | 報告20: lyricist完全Creator解決record数。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                   |
| 106      | unresolved lists                             | VERIFIED | 報告22: lyricist credit未確定50件維持確認。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                 |
| 107      | OurNotes手動収集                             | VERIFIED | 報告31: OurNotes残80未収集維持。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                            |
| 108      | metadata-blocked candidate                   | VERIFIED | 報告8: metadata BLOCKED件数。metadata3は予約のみ、master/relation除外。                                                                            |
| 109      | commit禁止                                   | VERIFIED | 報告65: commit/push/deploy未実施。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                          |
| 110      | git確認                                      | VERIFIED | 報告64: git diff --check。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                                  |
| 111      | 最終成果物                                   | VERIFIED | 報告66: Phase B2をhuman reviewへ渡せるか。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                  |
| 112      | PHASE_B2_REPORT                              | VERIFIED | 報告66: Phase B2をhuman reviewへ渡せるか。PHASE_B2_REPORT.mdの該当欄と参照するcurrent data/JSON・実行結果を照合。                                  |
| 113      | 最終停止条件                                 | VERIFIED | 報告66: Phase B2をhuman reviewへ渡せるか。指定された全停止条件をcurrent源/成果物/tests/build/SEO/compileで照合。                                   |

[PHASE_B2_REPORT.md](PHASE_B2_REPORT.md)（要求67欄）、[verification.json](verification.json)、[admin-mock-verification.json](admin-mock-verification.json)、[statistics.json](statistics.json)、[candidate-id-map.json](candidate-id-map.json)、[coverage.json](coverage.json)、[display-comparison.json](display-comparison.json)。既存code/tests内容、field patch guard・CONFIRMED gate・record-scope・role merge/順序・fallback・全884保全はB2 35 testsで確認。旧194はassert不変、現在実装を独立fixtureで回帰。両build/SEOはcurrent121/884を確認。
