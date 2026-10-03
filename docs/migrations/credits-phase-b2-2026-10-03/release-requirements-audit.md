# 最終release requirement audit（公開前検証完了（commit以降は未実施））

2026-10-04。885曲と訂正後6共同編曲は最新人間承認を優先。旧229assertとA/B1原資料を保持。

| §   | 要件                                      | 状態         | 根拠                                                                  |
| --- | ----------------------------------------- | ------------ | --------------------------------------------------------------------- |
| 0   | 現在のPhase B2 baseline                   | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 1   | 今回追加されたhuman review                | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 2   | human-reviewとして保存                    | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 3   | cr-0118〜cr-0120を正式master化            | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 4   | Creator総数                               | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 5   | slug                                      | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 6   | aliases                                   | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 7   | 母里治樹の所属表記                        | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 8   | 3名のrelation復帰                         | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 9   | relation applicability                    | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 10  | expected relation増分                     | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 11  | Phase B2成果物更新                        | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 12  | PHASE_B2_REPORT更新                       | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 13  | candidate map                             | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 14  | unresolved-after-b2                       | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 15  | coverage再計算                            | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 16  | 宮崎京一                                  | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 17  | 母里治樹                                  | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 18  | 川渕龍成                                  | 検証済み     | 訂正後6件の人間承認・joint receipt、220都丸=cr-0019                   |
| 19  | Work-level statistics                     | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 20  | existing 121 Creator保全                  | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 21  | songsへのfield patchのみ                  | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 22  | OurNotes並行編集保全                      | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 23  | non-credit deep compare                   | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 24  | Work                                      | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 25  | record                                    | 検証済み     | 人間が885曲保持を承認、GP799/Own86・Work823                           |
| 26  | roleCoverage                              | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 27  | OurNotes arranger残80                     | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 28  | unresolvedを勝手に解決しない              | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 29  | Composer correction維持                   | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 30  | o-saka negative identity維持              | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 31  | existing variant維持                      | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 32  | affiliations                              | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 33  | display                                   | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 34  | displayOverrides                          | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 35  | Creator detail                            | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 36  | song detail                               | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 37  | admin Creator                             | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 38  | admin song                                | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 39  | sitemap                                   | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 40  | canonical                                 | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 41  | previousSlugs                             | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 42  | slug collision                            | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 43  | ID型current slug                          | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 44  | migration idempotence                     | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 45  | validation fatal conditions               | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 46  | tests                                     | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 47  | expected test count                       | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 48  | root build                                | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 49  | subpath build                             | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 50  | root SEO                                  | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 51  | subpath SEO                               | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 52  | Functions compile                         | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 53  | research leakage                          | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 54  | browser local smoke                       | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 55  | B2 report最終更新                         | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 56  | release前git review                       | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 57  | diff scope確認                            | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 58  | secret確認                                | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 59  | local path                                | 検証済み     | release-verification.json／253tests／SHA付きreceipt・non-credit深比較 |
| 60  | commit                                    | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 61  | commit後verify                            | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 62  | push                                      | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 63  | push結果                                  | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 64  | GitHub Actions                            | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 65  | Cloudflare deploy                         | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 66  | deploy SHA                                | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 67  | production base                           | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 68  | production creators index                 | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 69  | new Creator pages production              | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 70  | representative existing new Creator pages | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 71  | canonical production                      | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 72  | sitemap production                        | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 73  | song detail production                    | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 74  | Mela! production                          | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 75  | きゅ〜まい＊flower production             | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 76  | ルカルカ★ナイトフィーバー production      | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 77  | 砂寸奏 production                         | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 78  | Symbol IV : Earth production              | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 79  | カーネーションの咲く日に production       | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 80  | affiliation production                    | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 81  | roleCoverage production                   | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 82  | OurNotes未収集表示                        | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 83  | Creator statistics production             | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 84  | Creator filters production                | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 85  | fallback production                       | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 86  | admin production read-only smoke          | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 87  | Creator admin production                  | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 88  | contact production                        | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 89  | static assets                             | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 90  | browser console                           | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 91  | responsive production                     | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 92  | redirects                                 | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 93  | historical Creator redirects              | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 94  | record / Work production sanity           | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 95  | Creator production sanity                 | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 96  | invalid state 0                           | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 97  | production research leakage               | 公開確認待ち | commit→通常push→CI/CF exact SHA→本番実測                              |
| 98  | production report                         | 公開確認待ち | 65項目の公開前値を保存、公開後に実証へ更新                            |
| 99  | release report項目                        | 公開確認待ち | 65項目の公開前値を保存、公開後に実証へ更新                            |
| 100 | production bugがあった場合                | 本番検証待ち | 重大問題時は根本原因と最小hotfixを記録                                |
| 101 | release後勝手に追加調査しない             | 遵守         | release以外の調査・収集を開始しない                                   |
| 102 | 今回のrelease完了条件                     | 公開確認待ち | 65項目の公開前値を保存、公開後に実証へ更新                            |
