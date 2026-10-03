# Phase A 要求別完了照合

2026-10-03。ユーザー指定のPhase A仕様0～106を現在の成果物・source保全・実行結果へ照合した。CONFIRMED率100%は停止条件ではなく、884全件に根拠または未確認理由があることを確認した。表は人による要求と証拠の対応監査であり、すべての意味判断をschema/testだけで証明したものではない。確認範囲内のSOURCE_MISSING、source対応/版/人物同定の未確定は最終報告とreviewに残す。

証拠の正本は [dataset](credit-research.json)、[source index](source-index.json)、[coverage](coverage.json)、[検証](verification.json)、[52項目報告](PHASE_A_REPORT.md)、[Phase B review](credit-review.md)。検証結果に現在のsource SHA、20artifact SHA、現在の旧表示検証、両公開成果物/SEO/Functions/test結果を保存。再実行方法は [README](README.md)。

| 仕様番号 | 要求                                   | 判定     | 照合した現在の証拠                                                                                                                                                |
| -------- | -------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0        | 現在の公開baseline                     | 確認済み | baseline.jsonの4SHA保全、現在finalize-creator-slugs verify終了0：884/823/91、635/582、未同定215、provisional47、ID slug0、旧表示2652一致・警告0。                 |
| 1        | Phase Aの目的                          | 確認済み | credit-research.json全884、各3roleの原文/variant/provenanceまたは未取得理由。schema/semantic verify終了0。                                                        |
| 2        | Phase Aでは大量適用しない              | 確認済み | 4source SHA一致・Git差分にdata/srcなし。ID/slug/alias/Work/coverage変更0、Phase B適用0。                                                                          |
| 3        | Composerも監査対象                     | 確認済み | 884recordのcurrent/official composer比較とrelation監査、game/ID/workId/title/band/baselineReference。composer-audit全884。                                        |
| 4        | 調査単位はrecord                       | 確認済み | 884recordのcurrent/official composer比較とrelation監査、game/ID/workId/title/band/baselineReference。composer-audit全884。                                        |
| 5        | Workは参照用                           | 確認済み | 884recordのcurrent/official composer比較とrelation監査、game/ID/workId/title/band/baselineReference。composer-audit全884。                                        |
| 6        | 公式ソース優先順位                     | 確認済み | source-indexの一次URL426。ゲーム→公式発売情報→バンド/制作会社の順で本文確認。全variantのHTTP/BROWSER_CONFIRMEDをverify、非公式/snippet確定0。                     |
| 7        | 一次情報を最優先                       | 確認済み | source-indexの一次URL426。ゲーム→公式発売情報→バンド/制作会社の順で本文確認。全variantのHTTP/BROWSER_CONFIRMEDをverify、非公式/snippet確定0。                     |
| 8        | Wikipedia・ファンWiki等                | 確認済み | source-indexの一次URL426。ゲーム→公式発売情報→バンド/制作会社の順で本文確認。全variantのHTTP/BROWSER_CONFIRMEDをverify、非公式/snippet確定0。                     |
| 9        | 各recordで収集する情報                 | 確認済み | 保存schemaのrecord current/researched3raw、role variantsのURL/type/title/date/pageReadStatus/evidenceStatusとreason/notes。verify成功。                           |
| 10       | rawは原文保存                          | 確認済み | creditText/各rawをevidence-factsとsource抽出へ保持。改行・所属・内部空白の追加tests成功。正式資料はcredit/短いcontext/URLで、ページ全文/HTMLは非収録。            |
| 11       | 改行・区切りも可能な範囲で保持         | 確認済み | creditText/各rawをevidence-factsとsource抽出へ保持。改行・所属・内部空白の追加tests成功。正式資料はcredit/短いcontext/URLで、ページ全文/HTMLは非収録。            |
| 12       | source snapshotは不要                  | 確認済み | creditText/各rawをevidence-factsとsource抽出へ保持。改行・所属・内部空白の追加tests成功。正式資料はcredit/短いcontext/URLで、ページ全文/HTMLは非収録。            |
| 13       | evidenceStatus                         | 確認済み | 3role別status、reason、rawValues、provenanceを884全件保存。enum/欠落/根拠不読の負例test成功。                                                                     |
| 14       | roleごとにstatusを持てるようにする     | 確認済み | 3role別status、reason、rawValues、provenanceを884全件保存。enum/欠落/根拠不読の負例test成功。                                                                     |
| 15       | 公式ゲームMUSICページ                  | 確認済み | ゲームMUSIC759＋5を明示曲名/主体/カテゴリで照合。発売/作品補完はsourceScopeを明記。対象game編曲だけ確定、発売版編曲はreview、不足は探索理由付き。                 |
| 16       | 編曲は特にrecord単位                   | 確認済み | ゲームMUSIC759＋5を明示曲名/主体/カテゴリで照合。発売/作品補完はsourceScopeを明記。対象game編曲だけ確定、発売版編曲はreview、不足は探索理由付き。                 |
| 17       | 作詞・作曲                             | 確認済み | ゲームMUSIC759＋5を明示曲名/主体/カテゴリで照合。発売/作品補完はsourceScopeを明記。対象game編曲だけ確定、発売版編曲はreview、不足は探索理由付き。                 |
| 18       | オリジナル曲                           | 確認済み | ゲームMUSIC759＋5を明示曲名/主体/カテゴリで照合。発売/作品補完はsourceScopeを明記。対象game編曲だけ確定、発売版編曲はreview、不足は探索理由付き。                 |
| 19       | 同名曲に注意                           | 確認済み | title/band/game/category/releaseを明示キーで対応。matching用normalizationはrawと分離。誤title/band負例test成功。                                                  |
| 20       | 記号・表記差                           | 確認済み | title/band/game/category/releaseを明示キーで対応。matching用normalizationはrawと分離。誤title/band負例test成功。                                                  |
| 21       | 複数Creator                            | 確認済み | raw全文保持、tokensCandidateはREVIEW_RECOMMENDED。既存91のname/alias全文一致だけannotation、近似と所属はreview、新ID採番・relation適用0。                         |
| 22       | tokenizationは候補                     | 確認済み | raw全文保持、tokensCandidateはREVIEW_RECOMMENDED。既存91のname/alias全文一致だけannotation、近似と所属はreview、新ID採番・relation適用0。                         |
| 23       | 名前内記号に注意                       | 確認済み | raw全文保持、tokensCandidateはREVIEW_RECOMMENDED。既存91のname/alias全文一致だけannotation、近似と所属はreview、新ID採番・relation適用0。                         |
| 24       | 括弧所属                               | 確認済み | raw全文保持、tokensCandidateはREVIEW_RECOMMENDED。既存91のname/alias全文一致だけannotation、近似と所属はreview、新ID採番・relation適用0。                         |
| 25       | 既存Creator exact match                | 確認済み | raw全文保持、tokensCandidateはREVIEW_RECOMMENDED。既存91のname/alias全文一致だけannotation、近似と所属はreview、新ID採番・relation適用0。                         |
| 26       | 既存Creatorへの曖昧match               | 確認済み | raw全文保持、tokensCandidateはREVIEW_RECOMMENDED。既存91のname/alias全文一致だけannotation、近似と所属はreview、新ID採番・relation適用0。                         |
| 27       | Composer比較分類                       | 確認済み | composer-audit.json/md全884を7分類。812/12/2/2/2/45/9。差分を修正せず全文比較保存。                                                                               |
| 28       | OFFICIAL_DIFFERSは自動修正禁止         | 確認済み | composer-audit.json/md全884を7分類。812/12/2/2/2/45/9。差分を修正せず全文比較保存。                                                                               |
| 29       | Composer監査レポート                   | 確認済み | composer-audit.json/md全884を7分類。812/12/2/2/2/45/9。差分を修正せず全文比較保存。                                                                               |
| 30       | lyricist coverage                      | 確認済み | coverage.jsonのrole/game/status別数、raw取得/確定/未取得/conflict/unreadable、全record確定Work773/771/697。現在datasetから件数再照合成功。                        |
| 31       | arranger coverage                      | 確認済み | coverage.jsonのrole/game/status別数、raw取得/確定/未取得/conflict/unreadable、全record確定Work773/771/697。現在datasetから件数再照合成功。                        |
| 32       | game別coverage                         | 確認済み | coverage.jsonのrole/game/status別数、raw取得/確定/未取得/conflict/unreadable、全record確定Work773/771/697。現在datasetから件数再照合成功。                        |
| 33       | Work別coverageも参考集計               | 確認済み | coverage.jsonのrole/game/status別数、raw取得/確定/未取得/conflict/unreadable、全record確定Work773/771/697。現在datasetから件数再照合成功。                        |
| 34       | Work間credit差分                       | 確認済み | work-credit-differences.json/md：arranger6 Work（game確定差2/release review4）、composer5（表記差4/重複credit矛盾1）、全variant列挙。                             |
| 35       | 同一Work composer差分                  | 確認済み | work-credit-differences.json/md：arranger6 Work（game確定差2/release review4）、composer5（表記差4/重複credit矛盾1）、全variant列挙。                             |
| 36       | source provenance                      | 確認済み | 全variantにsource URL/ID/type/title/date/readStatus/scope、source-indexにURL一意426・利用record数。raw/URL/日時の改変拒否test成功。                               |
| 37       | checkedAt                              | 確認済み | 全variantにsource URL/ID/type/title/date/readStatus/scope、source-indexにURL一意426・利用record数。raw/URL/日時の改変拒否test成功。                               |
| 38       | sourceType                             | 確認済み | 全variantにsource URL/ID/type/title/date/readStatus/scope、source-indexにURL一意426・利用record数。raw/URL/日時の改変拒否test成功。                               |
| 39       | sourceReliability                      | 確認済み | 全variantにsource URL/ID/type/title/date/readStatus/scope、source-indexにURL一意426・利用record数。raw/URL/日時の改変拒否test成功。                               |
| 40       | URL再利用                              | 確認済み | 全variantにsource URL/ID/type/title/date/readStatus/scope、source-indexにURL一意426・利用record数。raw/URL/日時の改変拒否test成功。                               |
| 41       | 公式MUSICページの効率的抽出            | 確認済み | DOM順によるrecord対応なし。明示title/band/game/categoryでsemantic verify、ページ/trackの横断誤対応拒否test。曖昧5はMATCH_UNCERTAIN。                              |
| 42       | 自動スクレイピングの誤対応防止         | 確認済み | DOM順によるrecord対応なし。明示title/band/game/categoryでsemantic verify、ページ/trackの横断誤対応拒否test。曖昧5はMATCH_UNCERTAIN。                              |
| 43       | title normalization                    | 確認済み | DOM順によるrecord対応なし。明示title/band/game/categoryでsemantic verify、ページ/trackの横断誤対応拒否test。曖昧5はMATCH_UNCERTAIN。                              |
| 44       | FULL等                                 | 確認済み | FULL/別版/同WorkはsourceScope=work/releaseを明記。ゲーム編曲のwork/別game流用を拒否、NEEDS_REVIEW53を確定に数えない。                                             |
| 45       | sourceが同一Workにしか存在しない場合   | 確認済み | FULL/別版/同WorkはsourceScope=work/releaseを明記。ゲーム編曲のwork/別game流用を拒否、NEEDS_REVIEW53を確定に数えない。                                             |
| 46       | sourceScope                            | 確認済み | FULL/別版/同WorkはsourceScope=work/releaseを明記。ゲーム編曲のwork/別game流用を拒否、NEEDS_REVIEW53を確定に数えない。                                             |
| 47       | 原曲creditとゲーム編曲creditの混同禁止 | 確認済み | FULL/別版/同WorkはsourceScope=work/releaseを明記。ゲーム編曲のwork/別game流用を拒否、NEEDS_REVIEW53を確定に数えない。                                             |
| 48       | カバー曲の原曲Artist                   | 確認済み | 調査対象roleはlyricist/composer/arrangerだけ。歌唱主体は対応確認の参照、Original ArtistをCreatorへ適用0。                                                         |
| 49       | performer / singer                     | 確認済み | 調査対象roleはlyricist/composer/arrangerだけ。歌唱主体は対応確認の参照、Original ArtistをCreatorへ適用0。                                                         |
| 50       | 作詞作曲                               | 確認済み | 作詞作曲/作編曲/三役/明示略記を展開しcreditTextは保存。編曲をcomposerへ誤分類しない追加parser tests成功。                                                         |
| 51       | 作編曲                                 | 確認済み | 作詞作曲/作編曲/三役/明示略記を展開しcreditTextは保存。編曲をcomposerへ誤分類しない追加parser tests成功。                                                         |
| 52       | 作詞作曲編曲                           | 確認済み | 作詞作曲/作編曲/三役/明示略記を展開しcreditTextは保存。編曲をcomposerへ誤分類しない追加parser tests成功。                                                         |
| 53       | 「詞」「曲」等の略記                   | 確認済み | 作詞作曲/作編曲/三役/明示略記を展開しcreditTextは保存。編曲をcomposerへ誤分類しない追加parser tests成功。                                                         |
| 54       | 編曲者記載なし                         | 確認済み | 欄なしはCREDIT_NOT_LISTED等に区分。未取得を作詞者なし/編曲者なしと解釈しない。根拠なしNO_LYRICS使用0、test成功。                                                  |
| 55       | 作詞者記載なし                         | 確認済み | 欄なしはCREDIT_NOT_LISTED等に区分。未取得を作詞者なし/編曲者なしと解釈しない。根拠なしNO_LYRICS使用0、test成功。                                                  |
| 56       | インスト曲                             | 確認済み | 欄なしはCREDIT_NOT_LISTED等に区分。未取得を作詞者なし/編曲者なしと解釈しない。根拠なしNO_LYRICS使用0、test成功。                                                  |
| 57       | conflicting source                     | 確認済み | conflicts.json/md全5record-roleを両原文/URL/scopeで保存、勝手に一方を選ばない。release/versionが異なる編曲はreview。                                              |
| 58       | creditの時点差                         | 確認済み | conflicts.json/md全5record-roleを両原文/URL/scopeで保存、勝手に一方を選ばない。release/versionが異なる編曲はreview。                                              |
| 59       | external research tab管理              | 確認済み | source index/cacheで既読結果と取得履歴を保存。sources途中保存、再生成20artifact SHA一致、884/426重複0、ユーザー4source書戻し0。                                   |
| 60       | 調査途中保存                           | 確認済み | source index/cacheで既読結果と取得履歴を保存。sources途中保存、再生成20artifact SHA一致、884/426重複0、ユーザー4source書戻し0。                                   |
| 61       | 再実行                                 | 確認済み | source index/cacheで既読結果と取得履歴を保存。sources途中保存、再生成20artifact SHA一致、884/426重複0、ユーザー4source書戻し0。                                   |
| 62       | 調査結果ファイル                       | 確認済み | 指定dirに23必須資料＋本照合表。全884/799/85欠落0重複0、source-index URL/type/pageTitle/checkedAt/readStatus/recordCount全426を検査。                              |
| 63       | 機械可読research                       | 確認済み | 指定dirに23必須資料＋本照合表。全884/799/85欠落0重複0、source-index URL/type/pageTitle/checkedAt/readStatus/recordCount全426を検査。                              |
| 64       | 全884件存在確認                        | 確認済み | 指定dirに23必須資料＋本照合表。全884/799/85欠落0重複0、source-index URL/type/pageTitle/checkedAt/readStatus/recordCount全426を検査。                              |
| 65       | source-index                           | 確認済み | 指定dirに23必須資料＋本照合表。全884/799/85欠落0重複0、source-index URL/type/pageTitle/checkedAt/readStatus/recordCount全426を検査。                              |
| 66       | credit-review.md                       | 確認済み | credit-review.mdのPriority A～E、conflict/composer差/版matching/未取得/Creator候補と全件資料へのリンク。                                                          |
| 67       | Composer既存IDとの照合                 | 確認済み | currentComposerRelationAudit全884、既存ID整合annotationと公式raw候補。current/masterを修正せず215未同定rawを保持。                                                |
| 68       | 未同定composer raw 215                 | 確認済み | currentComposerRelationAudit全884、既存ID整合annotationと公式raw候補。current/masterを修正せず215未同定rawを保持。                                                |
| 69       | 新規Creator候補                        | 確認済み | creator-candidates.json：新候補281 rawの役割/record/Work/source/代表曲、採番0。exact113 rawは既存86ID候補、near/splitはreview。                                   |
| 70       | 新規Creator候補の同定はPhase B         | 確認済み | creator-candidates.json：新候補281 rawの役割/record/Work/source/代表曲、採番0。exact113 rawは既存86ID候補、near/splitはreview。                                   |
| 71       | existing Creator candidate             | 確認済み | creator-candidates.json：新候補281 rawの役割/record/Work/source/代表曲、採番0。exact113 rawは既存86ID候補、near/splitはreview。                                   |
| 72       | role別unique raw一覧                   | 確認済み | role raw3一覧＋raw-cross-role-indexにrecord/Work/game/source集計、Top30新・Top50未解決、game別と横断。各rawの一意性/件数再確認、別game編曲流用0。                 |
| 73       | role横断raw                            | 確認済み | role raw3一覧＋raw-cross-role-indexにrecord/Work/game/source集計、Top30新・Top50未解決、game別と横断。各rawの一意性/件数再確認、別game編曲流用0。                 |
| 74       | 高頻度候補                             | 確認済み | role raw3一覧＋raw-cross-role-indexにrecord/Work/game/source集計、Top30新・Top50未解決、game別と横断。各rawの一意性/件数再確認、別game編曲流用0。                 |
| 75       | game別特殊ケース                       | 確認済み | role raw3一覧＋raw-cross-role-indexにrecord/Work/game/source集計、Top30新・Top50未解決、game別と横断。各rawの一意性/件数再確認、別game編曲流用0。                 |
| 76       | record reference変更への耐性           | 確認済み | baselineReferenceのgame/ID/title/workId/bandを884全件保存。baseline reference変更/欠落/重複をverify拒否。                                                         |
| 77       | OurNotes並行編集                       | 確認済み | 4source全SHA一致、OurNotes50生存/51うちゅう/52真夜中保持。nextId92、作詞編曲unprepared。公開data/src変更0、両公開catalogは既存変換後全内容一致。                  |
| 78       | Garupaも原則writeしない                | 確認済み | 4source全SHA一致、OurNotes50生存/51うちゅう/52真夜中保持。nextId92、作詞編曲unprepared。公開data/src変更0、両公開catalogは既存変換後全内容一致。                  |
| 79       | Work write禁止                         | 確認済み | 4source全SHA一致、OurNotes50生存/51うちゅう/52真夜中保持。nextId92、作詞編曲unprepared。公開data/src変更0、両公開catalogは既存変換後全内容一致。                  |
| 80       | Creator master write禁止               | 確認済み | 4source全SHA一致、OurNotes50生存/51うちゅう/52真夜中保持。nextId92、作詞編曲unprepared。公開data/src変更0、両公開catalogは既存変換後全内容一致。                  |
| 81       | roleCoverage変更禁止                   | 確認済み | 4source全SHA一致、OurNotes50生存/51うちゅう/52真夜中保持。nextId92、作詞編曲unprepared。公開data/src変更0、両公開catalogは既存変換後全内容一致。                  |
| 82       | 本番表示を変えない                     | 確認済み | 4source全SHA一致、OurNotes50生存/51うちゅう/52真夜中保持。nextId92、作詞編曲unprepared。公開data/src変更0、両公開catalogは既存変換後全内容一致。                  |
| 83       | distへresearchを配信しない             | 確認済み | hidden/no-ignore含む両build5484全file inventoryにresearch資料0。公開4JSON各build全内容一致。                                                                      |
| 84       | 個人情報                               | 確認済み | 収集は公開credit活動名/所属/短い作品context。無関係個人情報・ページ全文/HTMLの正式資料収録なし。evidence-factsは参照される抽出だけ。                              |
| 85       | copyright                              | 確認済み | 収集は公開credit活動名/所属/短い作品context。無関係個人情報・ページ全文/HTMLの正式資料収録なし。evidence-factsは参照される抽出だけ。                              |
| 86       | Web取得失敗                            | 確認済み | 初回取得失敗3URLをretrievalAttemptsに残し、正規browser DOMでBROWSER_CONFIRMED。迂回やsnippet昇格なし、最終unreadable0。                                           |
| 87       | snippet fallback禁止                   | 確認済み | 初回取得失敗3URLをretrievalAttemptsに残し、正規browser DOMでBROWSER_CONFIRMED。迂回やsnippet昇格なし、最終unreadable0。                                           |
| 88       | browser DOM                            | 確認済み | 初回取得失敗3URLをretrievalAttemptsに残し、正規browser DOMでBROWSER_CONFIRMED。迂回やsnippet昇格なし、最終unreadable0。                                           |
| 89       | 調査件数                               | 確認済み | coverage.json/PHASE_A_REPORT 1～26：調査884、原文対応840、URL426読取/241使用、browser3、unreadable0。作詞834/編曲754/比較830とgame別率。                          |
| 90       | lyricist完全収集率                     | 確認済み | coverage.json/PHASE_A_REPORT 1～26：調査884、原文対応840、URL426読取/241使用、browser3、unreadable0。作詞834/編曲754/比較830とgame別率。                          |
| 91       | arranger完全収集率                     | 確認済み | coverage.json/PHASE_A_REPORT 1～26：調査884、原文対応840、URL426読取/241使用、browser3、unreadable0。作詞834/編曲754/比較830とgame別率。                          |
| 92       | composer監査率                         | 確認済み | coverage.json/PHASE_A_REPORT 1～26：調査884、原文対応840、URL426読取/241使用、browser3、unreadable0。作詞834/編曲754/比較830とgame別率。                          |
| 93       | composer差分Top                        | 確認済み | composer-audit.md全884（DIFF2/MISSING2/MATCH9含む）、conflicts.md全5、unresolved.md/JSON全130（未取得と未確定）をgame/ID/title/band/Work/role理由付き保存。       |
| 94       | conflict一覧                           | 確認済み | composer-audit.md全884（DIFF2/MISSING2/MATCH9含む）、conflicts.md全5、unresolved.md/JSON全130（未取得と未確定）をgame/ID/title/band/Work/role理由付き保存。       |
| 95       | 未取得record一覧                       | 確認済み | composer-audit.md全884（DIFF2/MISSING2/MATCH9含む）、conflicts.md全5、unresolved.md/JSON全130（未取得と未確定）をgame/ID/title/band/Work/role理由付き保存。       |
| 96       | 新Creator candidate Top                | 確認済み | credit-review.mdと最終報告のTop30新/Top50未解決、Phase B優先A～E。人物同定/適用は今回未実施。                                                                     |
| 97       | Phase B readiness                      | 確認済み | credit-review.mdと最終報告のTop30新/Top50未解決、Phase B優先A～E。人物同定/適用は今回未実施。                                                                     |
| 98       | QA                                     | 確認済み | schema/884/799/85/重複欠落0/4data SHA/Work/master/coverage/非配信/20生成SHA冪等を現在の独立proofで成功確認。verification.json。                                   |
| 99       | 既存回帰テスト                         | 確認済み | 既存165＋追加12の全177pass/0fail、最終research単独12pass。Gitで既存tests変更0。schema/誤対応/根拠/版/保全の有効な負例tests。                                      |
| 100      | build                                  | 確認済み | root/subpath build終了0・ログ保存。両SEO現在984/884/799/85/797/18。Wrangler4.143.0 Functions compile終了0。verification.json。                                    |
| 101      | 旧表示                                 | 確認済み | 現在の既存finalize-creator-slugs verify終了0：2652表示一致、884収録/823Work/91Creator、Work warning0。全protected hash保全。                                      |
| 102      | Work                                   | 確認済み | 現在の既存finalize-creator-slugs verify終了0：2652表示一致、884収録/823Work/91Creator、Work warning0。全protected hash保全。                                      |
| 103      | commit / push禁止                      | 確認済み | HEAD開始終了5e4da7e517f5640b068cabaa8aa01b036e281961、cached空。commit/push/deploy0。                                                                             |
| 104      | 最終報告                               | 確認済み | PHASE_A_REPORT.mdの番号1～52を全て存在確認、Top30/50・全conflict・coverage・未取得・差分・QA・保全を記載。local links全有効。                                     |
| 105      | 最終成果物                             | 確認済み | 必須dataset/出典/role raw/composer audit/conflict/未取得/候補/review/最終報告を実体確認。884全roleに根拠またはstatus/reason、未確定を推測で埋めない停止条件成立。 |
| 106      | 停止条件                               | 確認済み | 必須dataset/出典/role raw/composer audit/conflict/未取得/候補/review/最終報告を実体確認。884全roleに根拠またはstatus/reason、未確定を推測で埋めない停止条件成立。 |
