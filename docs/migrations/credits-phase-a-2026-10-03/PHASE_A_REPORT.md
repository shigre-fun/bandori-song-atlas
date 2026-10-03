# Phase A 作詞・作曲・編曲調査結果

2026-10-03。全884収録を原文/根拠付き取得、または調査範囲と未取得理由付きstatusに分類し、Phase Aの停止条件を満たした。今回は収集・監査のみ。人物同定、alias統合、relation適用、公開データ変更、commit/push/deployは0。

CONFIRMED件数はMULTI_SOURCE_CONFIRMEDを含む。raw取得件数はCONFLICT・matching/版reviewの原文も含む。raw unique/candidate件数を人数と解釈しない。対象gameに編曲を適用できる根拠がない発売版値は確定coverageへ含めない。

| No. | 報告項目                              | 結果                                                                                                                                                                   |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 全research record数                   | 884                                                                                                                                                                    |
| 2   | Garupa件数                            | 799                                                                                                                                                                    |
| 3   | OurNotes件数                          | 85                                                                                                                                                                     |
| 4   | 調査済みrecord数                      | 884。対象/候補の公式credit本文原文を取得したrecordは840、残44も探索範囲と未取得理由を保存。                                                                            |
| 5   | 使用した一次URL数                     | 241（creditまたは明示track context）。credit直接利用76。本文読取総数426、探索のみ185。                                                                                 |
| 6   | game-official URL数                   | 2                                                                                                                                                                      |
| 7   | BanG Dream公式discography URL数       | 237使用。読取396詳細＋26一覧、一覧で504release発見。                                                                                                                   |
| 8   | その他一次URL数                       | 2（MyGO著作者表記1、Dream Monster作品欄1）                                                                                                                             |
| 9   | browser DOM確認数                     | 3                                                                                                                                                                      |
| 10  | source unreadable数                   | 最終0。初回取得失敗3URLはbrowserで解消しretrievalAttemptsへ保存。                                                                                                      |
| 11  | lyricist raw取得件数                  | 840                                                                                                                                                                    |
| 12  | lyricist CONFIRMED件数                | 834（834 / 884 = 94.34%、MULTI_SOURCE_CONFIRMEDを含む）                                                                                                                |
| 13  | lyricist Garupa coverage              | 763 / 799 = 95.49%                                                                                                                                                     |
| 14  | lyricist OurNotes coverage            | 71 / 85 = 83.53%                                                                                                                                                       |
| 15  | arranger raw取得件数                  | 812。ゲーム/版不確実な候補も含む。                                                                                                                                     |
| 16  | arranger CONFIRMED件数                | 754（754 / 884 = 85.29%、当該game公式record根拠のみ）                                                                                                                  |
| 17  | arranger Garupa coverage              | 749 / 799 = 93.74%                                                                                                                                                     |
| 18  | arranger OurNotes coverage            | 5 / 85 = 5.88%。発売版raw44recordはNEEDS_REVIEWで別保存。                                                                                                              |
| 19  | composer比較可能件数                  | 830 / 884 = 93.89%                                                                                                                                                     |
| 20  | composer EXACT件数                    | 812                                                                                                                                                                    |
| 21  | composer FORMAT_ONLY件数              | 12                                                                                                                                                                     |
| 22  | composer KNOWN_CREATOR_EQUIVALENT件数 | 2                                                                                                                                                                      |
| 23  | composer OFFICIAL_DIFFERS件数         | 2                                                                                                                                                                      |
| 24  | composer CURRENT_MISSING件数          | 2                                                                                                                                                                      |
| 25  | composer OFFICIAL_MISSING件数         | 45                                                                                                                                                                     |
| 26  | composer MATCH_UNCERTAIN件数          | 9                                                                                                                                                                      |
| 27  | 一次資料CONFLICT件数                  | 5 record-role（4record、2作品/sourceケース）。作詞1、作曲4、編曲0。所属付き/所属なしの同定未確認を含む。                                                               |
| 28  | conflict全件概要                      | Garupa176・218(FULL)・738(パラレル)の作曲2原文（1重複掲載の影響3record）、OurNotes66の作詞/作曲の所属名義差2role。全原文/URL/contextは conflicts.md / conflicts.json。 |
| 29  | lyricist未取得件数                    | 44。未確定を含めた全件一覧は unresolved.md。                                                                                                                           |
| 30  | arranger未取得件数                    | 72。rawがある未確定58も別statusで保存。                                                                                                                                |
| 31  | lyricist unique raw数                 | 288                                                                                                                                                                    |
| 32  | arranger unique raw数                 | 107                                                                                                                                                                    |
| 33  | composer unique raw数                 | 344                                                                                                                                                                    |
| 34  | 既存Creator exact candidate数         | 113 unique raw / 86既存ID。name/alias全文完全一致だけをannotation（適用0）。                                                                                           |
| 35  | 新Creator candidate数                 | 281 unique raw（作詞/編曲を含む未同定原文。人数ではない、ID採番0）。                                                                                                   |
| 36  | 新Creator候補Top30                    | 本書下表・credit-review.md・creator-candidates.jsonに全30raw。                                                                                                         |
| 37  | 高頻度未解決raw Top50                 | 本書下表・credit-review.md・creator-candidates.jsonに全50raw。                                                                                                         |
| 38  | 同一Work内arranger差分数              | 6 Work。ゲーム公式間の確定差2、発売版の適用reviewを含む差4。自動統一0。                                                                                                |
| 39  | 同一Work内composer差分数              | 5 Work（表記差4、重複source矛盾1）。全variantも比較した参考値。                                                                                                        |
| 40  | Phase B前の人間確認推奨事項           | A：重複作曲欄/所属名義差。B：現composer実質差2・不足2。C：歌唱主体不確実5と編曲版review53。D：未取得作詞44/編曲72。E：Top50のsplit・alias・人物同定。                  |
| 41  | songs.json変更有無                    | 両gameともbyte/content変更0。保全hash一致。                                                                                                                            |
| 42  | creators.json変更有無                 | byte変更0、91主体/nextId92を保持。                                                                                                                                     |
| 43  | works.json変更有無                    | byte変更0、823 Workを保持。                                                                                                                                            |
| 44  | roleCoverage変更有無                  | 変更0：lyricist=unprepared、composer=ready、arranger=unprepared。                                                                                                      |
| 45  | OurNotes並行編集保持                  | 保持。ID50=これはぼくたちの生存のあらすじ、51=うちゅうのふしぎ、52=真夜中遊園地。書込0/rollback0。                                                                     |
| 46  | Work warning                          | 0                                                                                                                                                                      |
| 47  | 既存165+テスト結果                    | 177 / 177成功（165既存＋12追加）。最終research変更後12 / 12再成功。schema/provenance/884参照/冪等/生データ保全も成功。                                                 |
| 48  | root build                            | 成功・終了0、公開4JSONは既存build変換後の全内容と一致、research非配信。                                                                                                |
| 49  | subpath build                         | /bandori-song-atlas/成功・終了0、独立.cache出力、research非配信。                                                                                                      |
| 50  | SEO                                   | 両buildで984正規/884detail/797楽曲互換/18Creator互換、canonical/sitemap/internal links成功。                                                                           |
| 51  | Functions compile                     | Wrangler4.143.0 Compiled Worker successfully、終了0、deployなし。                                                                                                      |
| 52  | commit / push未実施確認               | commit/push/deploy全0。HEADは開始時の5e4da7e517f5640b068cabaa8aa01b036e281961のまま。staged空、変更は調査資料・追加scripts/test・WORK_LOGのみ。                        |

## 全CONFLICTとcomposer要確認

| game/ID     | Work    | 曲 / band                                      | role     | 全原文                                                                               | 根拠                                                                                                           |
| ----------- | ------- | ---------------------------------------------- | -------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| garupa:218  | wk-0176 | [FULL] きゅ〜まい＊flower / Pastel＊Palettes   | composer | 末益涼太（Elements Garden） ⟷ 末益涼太（Elements Garden）竹田祐介（Elements Garden） | [game-official](https://bang-dream.bushimo.jp/music/)                                                          |
| garupa:176  | wk-0176 | きゅ〜まい＊flower / Pastel＊Palettes          | composer | 末益涼太（Elements Garden） ⟷ 末益涼太（Elements Garden）竹田祐介（Elements Garden） | [game-official](https://bang-dream.bushimo.jp/music/)                                                          |
| garupa:738  | wk-0176 | きゅ〜まい＊flower(パラレルver.) / スキを貫け♡ | composer | 末益涼太（Elements Garden） ⟷ 末益涼太（Elements Garden）竹田祐介（Elements Garden） | [game-official](https://bang-dream.bushimo.jp/music/)                                                          |
| ournotes:66 | wk-0812 | カーネーションの咲く日に / millsage            | lyricist | Aira(Dream Monster) ⟷ Aira                                                           | [bangdream-discography](https://bang-dream.com/discographies/4234/) [agency-official](https://dreamonster.jp/) |
| ournotes:66 | wk-0812 | カーネーションの咲く日に / millsage            | composer | 瀬名水紀(Dream Monster)、Aira(Dream Monster) ⟷ 瀬名水紀、Aira                        | [bangdream-discography](https://bang-dream.com/discographies/4234/) [agency-official](https://dreamonster.jp/) |

所属名義差は同一人物か未確定の保守的なCONFLICTで、別人の断定ではない。通常版の重複作曲欄は一つの公式source内の矛盾。FULL/パラレルへの影響はsourceScope=workを明記した。

| game/ID     | 曲                        | 分類             | 現在raw         | 公式raw                          |
| ----------- | ------------------------- | ---------------- | --------------- | -------------------------------- |
| garupa:249  | ルカルカ★ナイトフィーバー | OFFICIAL_DIFFERS | SAM(samfree)    | samfree                          |
| ournotes:14 | 砂寸奏                    | CURRENT_MISSING  | —               | 槇島隆人(SUPA LOVE)              |
| ournotes:33 | Symbol IV : Earth         | CURRENT_MISSING  | —               | 長谷川大介(SUPA LOVE)、Diggy-MO' |
| ournotes:75 | Mela!                     | OFFICIAL_DIFFERS | peppe／穴見真吾 | 小林 壱誓                        |

## 取得と未取得の範囲

ゲーム公式759＋5掲載欄を実DOMで読み、全26公式一覧の504releaseから関連artist/cover collectionの396詳細を本文確認。MyGO公式著作者表記、Dream Monster公式作品詳細を追加確認した。原文取得840record、公式track contextだけのrecordと対応未発見も含め884すべてを記録した。非公式Wiki・歌詞サイト・検索snippetは確定根拠に使用していない。

SOURCE_MISSINGは今回の確認範囲内の未発見で、全Webでの不存在を証明しない。CREDIT_NOT_LISTEDは対象公式contextの本文にroleがないことを意味し、担当者なし/NO_LYRICSとは扱わない。将来のゲーム内creditや本人/原曲公式の追加確認で更新可能。

確認済み一次ページ： [ガルパ公式MUSIC](https://bang-dream.bushimo.jp/music/)、[OurNotes公式MUSIC](https://bang-dream-on.bushimo.jp/music/)、[公式ディスコグラフィ](https://bang-dream.com/discographies/)、[MyGO著作者表記](https://bang-dream.com/mygo_inst/)、[Dream Monster作品欄](https://dreamonster.jp/)。全URL/確認日時/読取結果/利用record数はsource-index.json。取得失敗を回避せず、browserで本文確認できた3URLは取得履歴も保持。

## Role coverageとWork参考値

| role     | raw取得 | 確定 | 未取得 | CONFLICT | 全record確定Work /823 |
| -------- | ------- | ---- | ------ | -------- | --------------------- |
| lyricist | 840     | 834  | 44     | 1        | 773                   |
| composer | 839     | 830  | 45     | 4        | 771                   |
| arranger | 812     | 754  | 72     | 0        | 697                   |

## Phase B新Creator候補 Top30

全文字列が未登録らしい候補であり、複数主体の可能性を含む。既存Creator候補も含め、split/所属/活動名の確認後に適用判断する。

| raw                                   | roles                      | records | Work | sources | 代表曲                                                                                                                                                 |
| ------------------------------------- | -------------------------- | ------- | ---- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 織田あすか（Elements Garden）         | lyricist                   | 263     | 247  | 2       | garupa:277 !NVADE SHOW!<br>garupa:703 'FIGHT' ADDICT<br>garupa:533 -N-E-M-E-S-I-S-<br>garupa:255 A DECLARATION OF ×××<br>garupa:528 BATTLE CRY         |
| 中村航                                | lyricist                   | 79      | 75   | 2       | garupa:777 Amore<br>garupa:80 B.O.F<br>garupa:264 Breakthrough!<br>garupa:536 Chu Chueen!<br>garupa:89 CiRCLING                                        |
| 下田晃太郎（Elements Garden）         | arranger/composer          | 37      | 36   | 1       | garupa:517 トウキョウ・シャンディ・ランデヴ<br>garupa:391 ヴァンパイア<br>garupa:367 怪物<br>garupa:324 春〜spring〜<br>garupa:573 ボッカデラベリタ    |
| 藤原優樹(SUPA LOVE)                   | lyricist                   | 36      | 20   | 11      | garupa:535 処救生<br>garupa:597 名無声<br>garupa:489 壱雫空<br>garupa:520 影色舞<br>garupa:697 往欄印                                                  |
| 織田あすか(Elements Garden)           | lyricist                   | 24      | 24   | 19      | garupa:703 'FIGHT' ADDICT<br>garupa:582 V.I.P MONSTER<br>garupa:631 WELCOME TO PANDEMONIUM<br>garupa:675 Dazzle the Destiny<br>garupa:585 Floral Haven |
| Seonoo Kim（Elements Garden）         | arranger/composer          | 16      | 16   | 1       | garupa:640 STEP by STEP UP↑↑↑↑<br>garupa:477 ヒロイン育成計画<br>garupa:459 一逢のFull Glory<br>garupa:592 SOULSOUP<br>garupa:529 裸の勇者             |
| 畑亜貴                                | lyricist                   | 10      | 10   | 1       | garupa:181 Daydream café<br>garupa:50 God knows...<br>garupa:117 Fantastic future<br>garupa:406 秘密の扉から会いにきて<br>garupa:340 DAYS of DASH      |
| Spirit Garden                         | lyricist                   | 8       | 7    | 1       | garupa:328 Domination to world<br>garupa:345 Sacred world<br>garupa:289 mind of Prominence<br>garupa:339 灼熱 Bonfire!<br>garupa:238 Break your desire |
| 都丸椋太（Elements Garden）／宮崎京一 | arranger                   | 8       | 8    | 1       | garupa:44 MOON PRIDE<br>garupa:23 secret base ～君がくれたもの～<br>garupa:35 そばかす<br>garupa:24 ドリームパレード<br>garupa:28 いーあるふぁんくらぶ |
| 都丸椋太（Elements Garden）／加納望   | arranger                   | 6       | 6    | 1       | garupa:20 Alchemy<br>garupa:31 光るなら<br>garupa:19 空色デイズ<br>garupa:37 ETERNAL BLAZE<br>garupa:26 Hacking to the Gate                            |
| 大森祥子                              | lyricist                   | 5       | 5    | 1       | garupa:29 Don’t say “lazy”<br>garupa:381 Listen!!<br>garupa:129 GO! GO! MANIAC<br>garupa:323 Happy Girl<br>garupa:286 おジャ魔女カーニバル!!           |
| ハルイチ                              | lyricist                   | 4       | 4    | 1       | garupa:199 ミュージック・アワー<br>garupa:262 ヒトリノ夜<br>garupa:310 アゲハ蝶<br>garupa:515 サウダージ                                               |
| 小木岳司                              | arranger                   | 4       | 4    | 1       | garupa:556 Lioness' Pride<br>garupa:570 ノンブレス・オブリージュ<br>garupa:547 ホワイトノイズ<br>garupa:521 猛独が襲う                                 |
| 中村 航                               | lyricist                   | 4       | 2    | 1       | garupa:160 Jumpin'<br>garupa:237 [FULL] キズナミュージック♪<br>garupa:148 キズナミュージック♪<br>garupa:466 キズナミュージック♪（3Dライブモード対応）  |
| 母里治樹（Elements Garden）           | arranger/composer          | 4       | 4    | 1       | garupa:38 キミにもらったもの<br>garupa:85 Dragon Night<br>garupa:78 恋は渾沌の隷也<br>garupa:51 花園電気ギター！！！                                   |
| あの、真部 脩一                       | lyricist                   | 3       | 2    | 1       | garupa:603 ちゅ、多様性。<br>garupa:757 許婚っきゅん<br>ournotes:80 ちゅ、多様性。                                                                     |
| 及川眠子                              | lyricist                   | 3       | 2    | 1       | garupa:86 残酷な天使のテーゼ<br>garupa:25 魂のルフラン<br>ournotes:40 残酷な天使のテーゼ                                                               |
| 植木建象、冬真                        | arranger                   | 3       | 3    | 2       | garupa:627 Subtitle<br>garupa:622 遥か彼方<br>ournotes:40 残酷な天使のテーゼ                                                                           |
| 母里治樹（Elements Garden）/加納望    | arranger                   | 3       | 3    | 1       | garupa:22 Butter-Fly<br>garupa:29 Don’t say “lazy”<br>garupa:21 カルマ                                                                                 |
| ACAね                                 | composer/lyricist          | 2       | 2    | 1       | garupa:258 秒針を噛む<br>garupa:334 ヒューマノイド                                                                                                     |
| Fukase                                | lyricist                   | 2       | 2    | 1       | garupa:85 Dragon Night<br>garupa:676 最高到達点                                                                                                        |
| meg rock                              | lyricist                   | 2       | 2    | 1       | garupa:19 空色デイズ<br>garupa:708 恋愛サーキュレーション                                                                                              |
| miwa                                  | composer/lyricist          | 2       | 2    | 1       | garupa:247 chAngE<br>garupa:764 ヒカリへ                                                                                                               |
| MOMIKEN                               | lyricist                   | 2       | 2    | 1       | garupa:112 イマジネーション<br>garupa:655 オレンジ                                                                                                     |
| o-saka(SUPA LOVE)                     | arranger                   | 2       | 1    | 2       | garupa:650 Crucifix X<br>ournotes:26 Crucifix X                                                                                                        |
| Reol                                  | lyricist                   | 2       | 2    | 1       | garupa:272 劣等上等<br>garupa:659 第六感                                                                                                               |
| Revo                                  | composer/lyricist          | 2       | 2    | 1       | garupa:44 MOON PRIDE<br>garupa:49 紅蓮の弓矢                                                                                                           |
| shito、Gom                            | lyricist                   | 2       | 2    | 1       | garupa:477 ヒロイン育成計画<br>garupa:756 金曜日のおはよう                                                                                             |
| ZAQ                                   | arranger/composer/lyricist | 2       | 2    | 1       | garupa:398 Sparkling Daydream<br>garupa:396 Brand new Pastel Road！                                                                                    |
| ZENTA                                 | arranger                   | 2       | 2    | 1       | garupa:372 DEPARTURES<br>garupa:278 恋しさと せつなさと 心強さと                                                                                       |

## 高頻度未解決raw Top50

| raw                                                    | roles                      | records | Work | sources | 代表曲                                                                                                                                                 |
| ------------------------------------------------------ | -------------------------- | ------- | ---- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 織田あすか（Elements Garden）                          | lyricist                   | 263     | 247  | 2       | garupa:277 !NVADE SHOW!<br>garupa:703 'FIGHT' ADDICT<br>garupa:533 -N-E-M-E-S-I-S-<br>garupa:255 A DECLARATION OF ×××<br>garupa:528 BATTLE CRY         |
| 中村航                                                 | lyricist                   | 79      | 75   | 2       | garupa:777 Amore<br>garupa:80 B.O.F<br>garupa:264 Breakthrough!<br>garupa:536 Chu Chueen!<br>garupa:89 CiRCLING                                        |
| 下田晃太郎（Elements Garden）                          | arranger/composer          | 37      | 36   | 1       | garupa:517 トウキョウ・シャンディ・ランデヴ<br>garupa:391 ヴァンパイア<br>garupa:367 怪物<br>garupa:324 春〜spring〜<br>garupa:573 ボッカデラベリタ    |
| 藤原優樹(SUPA LOVE)                                    | lyricist                   | 36      | 20   | 11      | garupa:535 処救生<br>garupa:597 名無声<br>garupa:489 壱雫空<br>garupa:520 影色舞<br>garupa:697 往欄印                                                  |
| 織田あすか(Elements Garden)                            | lyricist                   | 24      | 24   | 19      | garupa:703 'FIGHT' ADDICT<br>garupa:582 V.I.P MONSTER<br>garupa:631 WELCOME TO PANDEMONIUM<br>garupa:675 Dazzle the Destiny<br>garupa:585 Floral Haven |
| Seonoo Kim（Elements Garden）                          | arranger/composer          | 16      | 16   | 1       | garupa:640 STEP by STEP UP↑↑↑↑<br>garupa:477 ヒロイン育成計画<br>garupa:459 一逢のFull Glory<br>garupa:592 SOULSOUP<br>garupa:529 裸の勇者             |
| 畑亜貴                                                 | lyricist                   | 10      | 10   | 1       | garupa:181 Daydream café<br>garupa:50 God knows...<br>garupa:117 Fantastic future<br>garupa:406 秘密の扉から会いにきて<br>garupa:340 DAYS of DASH      |
| Spirit Garden                                          | lyricist                   | 8       | 7    | 1       | garupa:328 Domination to world<br>garupa:345 Sacred world<br>garupa:289 mind of Prominence<br>garupa:339 灼熱 Bonfire!<br>garupa:238 Break your desire |
| 都丸椋太（Elements Garden）／宮崎京一                  | arranger                   | 8       | 8    | 1       | garupa:44 MOON PRIDE<br>garupa:23 secret base ～君がくれたもの～<br>garupa:35 そばかす<br>garupa:24 ドリームパレード<br>garupa:28 いーあるふぁんくらぶ |
| 都丸椋太（Elements Garden）／加納望                    | arranger                   | 6       | 6    | 1       | garupa:20 Alchemy<br>garupa:31 光るなら<br>garupa:19 空色デイズ<br>garupa:37 ETERNAL BLAZE<br>garupa:26 Hacking to the Gate                            |
| 大森祥子                                               | lyricist                   | 5       | 5    | 1       | garupa:29 Don’t say “lazy”<br>garupa:381 Listen!!<br>garupa:129 GO! GO! MANIAC<br>garupa:323 Happy Girl<br>garupa:286 おジャ魔女カーニバル!!           |
| ハルイチ                                               | lyricist                   | 4       | 4    | 1       | garupa:199 ミュージック・アワー<br>garupa:262 ヒトリノ夜<br>garupa:310 アゲハ蝶<br>garupa:515 サウダージ                                               |
| 小木岳司                                               | arranger                   | 4       | 4    | 1       | garupa:556 Lioness' Pride<br>garupa:570 ノンブレス・オブリージュ<br>garupa:547 ホワイトノイズ<br>garupa:521 猛独が襲う                                 |
| 中村 航                                                | lyricist                   | 4       | 2    | 1       | garupa:160 Jumpin'<br>garupa:237 [FULL] キズナミュージック♪<br>garupa:148 キズナミュージック♪<br>garupa:466 キズナミュージック♪（3Dライブモード対応）  |
| 藤永龍太郎(Elements Garden)                            | arranger/composer          | 4       | 4    | 5       | garupa:585 Floral Haven<br>garupa:685 Requiem for Fate<br>garupa:768 XV<br>garupa:691 Drive Your Heart                                                 |
| 母里治樹（Elements Garden）                            | arranger/composer          | 4       | 4    | 1       | garupa:38 キミにもらったもの<br>garupa:85 Dragon Night<br>garupa:78 恋は渾沌の隷也<br>garupa:51 花園電気ギター！！！                                   |
| あの、真部 脩一                                        | lyricist                   | 3       | 2    | 1       | garupa:603 ちゅ、多様性。<br>garupa:757 許婚っきゅん<br>ournotes:80 ちゅ、多様性。                                                                     |
| 及川眠子                                               | lyricist                   | 3       | 2    | 1       | garupa:86 残酷な天使のテーゼ<br>garupa:25 魂のルフラン<br>ournotes:40 残酷な天使のテーゼ                                                               |
| 松坂康司(SUPA LOVE)、Diggy-MO’                         | composer                   | 3       | 2    | 3       | garupa:641 Georgette Me, Georgette You<br>garupa:649 Imprisoned XII<br>ournotes:25 Imprisoned XII                                                      |
| 植木建象、冬真                                         | arranger                   | 3       | 3    | 2       | garupa:627 Subtitle<br>garupa:622 遥か彼方<br>ournotes:40 残酷な天使のテーゼ                                                                           |
| 長谷川大介 (SUPA LOVE)                                 | arranger/composer          | 3       | 2    | 2       | garupa:664 焚音打<br>ournotes:15 焚音打<br>ournotes:30 Symbol I : △                                                                                    |
| 藤間 仁（Elements Garden）                             | arranger/composer          | 3       | 2    | 1       | garupa:211 Sasanqua<br>garupa:223 [FULL] えがお･シング･あ･ソング<br>garupa:180 えがお･シング･あ･ソング                                                 |
| 藤間仁(Elements Garden)                                | arranger/composer          | 3       | 3    | 3       | garupa:596 Listen to Smile!<br>garupa:583 サンバロハッピ〜！<br>garupa:698 スタ〜リング ☆じぶん☆                                                       |
| 母里治樹（Elements Garden）/加納望                     | arranger                   | 3       | 3    | 1       | garupa:22 Butter-Fly<br>garupa:29 Don’t say “lazy”<br>garupa:21 カルマ                                                                                 |
| 末益涼太（Elements Garden）竹田祐介（Elements Garden） | composer                   | 3       | 1    | 1       | garupa:218 [FULL] きゅ〜まい＊flower<br>garupa:176 きゅ〜まい＊flower<br>garupa:738 きゅ〜まい＊flower(パラレルver.)                                   |
| ACAね                                                  | composer/lyricist          | 2       | 2    | 1       | garupa:258 秒針を噛む<br>garupa:334 ヒューマノイド                                                                                                     |
| Fukase                                                 | lyricist                   | 2       | 2    | 1       | garupa:85 Dragon Night<br>garupa:676 最高到達点                                                                                                        |
| meg rock                                               | lyricist                   | 2       | 2    | 1       | garupa:19 空色デイズ<br>garupa:708 恋愛サーキュレーション                                                                                              |
| miwa                                                   | composer/lyricist          | 2       | 2    | 1       | garupa:247 chAngE<br>garupa:764 ヒカリへ                                                                                                               |
| MOMIKEN                                                | lyricist                   | 2       | 2    | 1       | garupa:112 イマジネーション<br>garupa:655 オレンジ                                                                                                     |
| o-saka(SUPA LOVE)                                      | arranger                   | 2       | 1    | 2       | garupa:650 Crucifix X<br>ournotes:26 Crucifix X                                                                                                        |
| o-saka(SUPA LOVE)、Diggy-MO’                           | composer                   | 2       | 1    | 2       | garupa:650 Crucifix X<br>ournotes:26 Crucifix X                                                                                                        |
| Reol                                                   | lyricist                   | 2       | 2    | 1       | garupa:272 劣等上等<br>garupa:659 第六感                                                                                                               |
| Revo                                                   | composer/lyricist          | 2       | 2    | 1       | garupa:44 MOON PRIDE<br>garupa:49 紅蓮の弓矢                                                                                                           |
| shito、Gom                                             | lyricist                   | 2       | 2    | 1       | garupa:477 ヒロイン育成計画<br>garupa:756 金曜日のおはよう                                                                                             |
| TAKESHI ASAKAWA                                        | composer                   | 2       | 2    | 1       | garupa:120 DAYS<br>garupa:369 COLORS                                                                                                                   |
| TAKU INOUE                                             | composer                   | 2       | 1    | 2       | garupa:542 Stellar Stellar<br>ournotes:82 Stellar Stellar                                                                                              |
| ZAQ                                                    | arranger/composer/lyricist | 2       | 2    | 1       | garupa:398 Sparkling Daydream<br>garupa:396 Brand new Pastel Road！                                                                                    |
| ZENTA                                                  | arranger                   | 2       | 2    | 1       | garupa:372 DEPARTURES<br>garupa:278 恋しさと せつなさと 心強さと                                                                                       |
| アイナ・ジ・エンド、Shin Sakiura                       | composer/lyricist          | 2       | 1    | 2       | garupa:754 革命道中<br>ournotes:78 革命道中                                                                                                            |
| あらケン(SUPA LOVE)、Diggy-MO’                         | composer                   | 2       | 1    | 1       | garupa:662 八芒星ダンス<br>ournotes:27 八芒星ダンス                                                                                                    |
| うらん                                                 | lyricist                   | 2       | 2    | 1       | garupa:183 ときめきポポロン♪<br>garupa:379 ハッピー☆マテリアル                                                                                         |
| カンザキイオリ                                         | composer/lyricist          | 2       | 2    | 1       | garupa:467 命に嫌われている。<br>garupa:758 過去を喰らう                                                                                               |
| こだまさおり                                           | lyricist                   | 2       | 2    | 1       | garupa:590 ギミー！レボリューション<br>garupa:357 ぼなぺてぃーと♡Ｓ                                                                                    |
| コレサワ                                               | composer/lyricist          | 2       | 2    | 1       | garupa:654 最上級にかわいいの！<br>garupa:450 乙女はサイコパス                                                                                         |
| シノダ                                                 | composer/lyricist          | 2       | 2    | 1       | garupa:706 オン・ザ・フロントライン<br>garupa:705 ビューティ・フォー                                                                                   |
| じん                                                   | composer/lyricist          | 2       | 2    | 1       | garupa:508 燦々<br>garupa:509 チルドレンレコード(Re:boot)                                                                                              |
| ツミキ                                                 | composer/lyricist          | 2       | 2    | 1       | garupa:517 トウキョウ・シャンディ・ランデヴ<br>garupa:452 フォニイ                                                                                     |
| ナナホシ管弦楽団                                       | lyricist                   | 2       | 1    | 1       | garupa:373 シル・ヴ・プレジデント<br>garupa:448 シル・ヴ・プレジデント                                                                                 |
| ナノ                                                   | lyricist                   | 2       | 2    | 1       | garupa:282 Nevereverland<br>garupa:295 SAVIOR OF SONG                                                                                                  |

## 再実行・検証・成果物

`node scripts/research/credits-phase-a.mjs generate`はofflineで原文/参照から再生成し、4source保全hashが変わっていたら停止する（ユーザー編集を書き戻さない）。`verify`は保存schemaと884重複/欠落0、原文と根拠の対応、同game編曲、既存完全一致candidateを検査する。新schemaの利用keywordを全検査し、未対応keywordを黙って通さない。生成20資料のhashは二回再生成して全一致。生成sourceの確認日をrerunで更新しない。

追加6module・1testの構文/Prettier、既存4verify、177tests、両build/SEO、Functions compile、source/data/Work/coverage保全、公開カタログは既存変換後の全内容一致、Creator/Work JSONはsource内容一致、research非配信を成功確認。最初の新テスト1件はroleCoverage enumの誤記で失敗し、実体に合わせ修正後全成功。HTTP inline quoting/rg globの補助失敗とJS本文未取得もWORK_LOG/verification/source取得履歴に記録した。最終audit初回は既存テストの過去review整形差分を検出して停止し、HEADとの内容一致を確認して自身の整形差分だけ除き再成功。既存OurNotesと履歴資料のformatはbyte保全のため変更しない。

正本は [credit-research.json](credit-research.json)。[source index](source-index.json)、[coverage](coverage.json)、[lyricist raw](lyricist-raw.json)、[arranger raw](arranger-raw.json)、[composer audit](composer-audit.md)、[conflicts全件](conflicts.md)、[未確定130record全件](unresolved.md)、[新候補と既存候補](creator-candidates.json)、[優先review](credit-review.md)、[Work差分](work-credit-differences.md)、[検証結果](verification.json)を保存。原文を支える参照抽出だけをevidence-facts.jsonに収録し、対象外の抽出を確定evidenceとして配信しない。

最終照合時、編集用groups形式と公開用songs形式を直接比較していたため、大きい失敗diff生成で処理が停滞した。既存loadGameCatalog/settingsの変換後全内容で照合し、両4JSON一致を確認した。Windowsのメモリ/ページング不足と一部tool kernel終了も記録し、独立した小さい処理で全必要gateを成功確認。自身のjob以外のprocessやOS設定は変更していない。詳細はWORK_LOGとverification.json。

仕様0～106の番号別照合は [要求別完了照合](requirements-audit.md)。検証結果には20生成資料のSHA256と、現在再実行した旧表示2652件・884/823/91・警告0のverify結果も保存した。
