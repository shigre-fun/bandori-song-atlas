# Creator人間レビュー確定記録

判断日：2026-10-02。受領・反映作業：2026-10-03（日本時間）。sourceTypeは`human-review`。この資料はユーザーの明示判断であり、外部Web本文による確認を装いません。

元指示：添付41a44847-240f-4989-9e8b-9c900322d45b/pasted-text-1.txt。今回の範囲は人間確認の反映・公開前slug整理・保留短名の対象提示・回帰検証です。commit/push/本番公開は禁止。

| 対象                    | 確定判断・反映方針                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 堀江晶太/kemu           | 同一person、標準名は堀江晶太。kemu aliasと既存旧表示を維持。新たな別Creatorは作らない。                                               |
| ryo/ryo(supercell)      | 同一Creator、標準名はryo。既存cr-0084を維持し、ryo(supercell)と従来標準名ryo (supercell)をaliasへ。旧表示はoverrideで保持。           |
| 藤井健太郎              | 第3フェーズの人物同定・全対象曲対応をCONFIRMEDとして維持。                                                                            |
| Kanaria                 | 第3フェーズの人物同定・全対象曲対応をCONFIRMEDとして維持。                                                                            |
| Orangestar              | 第3フェーズの人物同定・全対象曲対応をCONFIRMEDとして維持。                                                                            |
| TK                      | 現在同定済みの全recordは同一person。既存IDへの明示mapを維持。将来追加の文字列TKへ自動割当しない。                                     |
| UZ/ＵＺ/UZ(SPYAIR)      | 同一Creator、標準名UZ。既存IDを維持し各別表記はalias。既存対象曲だけに適用、将来の未知のUZは文脈確認が必要。                          |
| 瀬名水紀(Dream Monster) | 標準名瀬名水紀、type person、Dream Monsterは所属会社。次の固定IDを安全採番。所属組織の参加加算はしない。旧表示保持。                  |
| john/TOOBOE             | 同一person、グッドバイの作曲クレジット標準名はjohn。TOOBOE alias。現在の対象recordだけへ明示mapし、将来の未知のjohnを自動割当しない。 |
| JACK/Louis              | 未同定維持。登録・追加調査は今回行わずfallback表示/横断検索を保持。                                                                   |
| GEN/ARM/TAKE/yasu/KATSU | 現人物同定・ID・対象recordを変更しない。今回の人間確定とみなさず、対象曲/現在根拠/一次情報/overrideをshort-name-reviewへ提示する。    |

## ユーザーが正式採用したslug

| Creator      | slug             | 備考                                                 |
| ------------ | ---------------- | ---------------------------------------------------- |
| 藤田淳平     | junpei-fujita    | 既存slug維持、cr-0004固定。                          |
| 真部脩一     | syuichi-mabe     | cr-0003固定。AIのローマ字推測ではなくユーザー指定。  |
| 日高勇輝     | yuki-hidaka      | 既存ID維持。                                         |
| 末益涼太     | ryota-suematsu   | 既存ID維持。                                         |
| 藤原聡       | satoshi-fujihara | 藤原聡/藤原 聡/藤原　聡の空白差も同一Creatorと確定。 |
| 田淵智也     | tomoya-tabuchi   | 田淵智也/田淵 智也の空白差も同一Creatorと確定。      |
| かいりきベア | kairiki-bear     | 既存ID維持。                                         |

その他のID型slugは、実読一次資料で英字・公式URL識別子を確認できた範囲だけ変更する。提案・根拠を先にslug-reviewへ記録する。slugとsortKeyを分け、かな未確認ならprovisional-originalを保持。

旧slugはpreviousSlugsへ保持し、全Creatorのcurrent/previous間で衝突・再利用・循環を拒否する。canonical/sitemap/内部リンクは現slugのみ。旧表示2,652、884収録/823 Work/warning0と並行OurNotes編集を保持する。
