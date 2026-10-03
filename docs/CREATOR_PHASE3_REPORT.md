# Creator第3フェーズ報告

2026-10-02。一次情報の本文確認に基づいて85主体を追加し、Creator masterは4→89件になりました。作曲のみを適用し、作詞・編曲は未整備のままです。旧表示2,652件、884収録、823 Work、warning 0を維持しました。ユーザーが別作業で変更したOurNotesのID・譜面・激奏区間は保持しています。commit / push / 本番デプロイは行っていません。

## 調査（1–6）

**1. 調査したcandidate group数：93群。** 移行前323候補のうち、一次情報を調べた主体の元表記と対応する群を数えました。堀江晶太/kemu、ryo(supercell)/ryoの2組をそれぞれ1主体として扱うため、調査主体数とは一致しません。

**2. Web調査したCreator数：91主体。** 既存の藤田淳平・真部脩一を含みます。新規登録85主体、既存確認2主体、保留4主体です。採用した実読一次URLは重複除去93件。検索結果だけで確定したものはありません。公式ゲームページでは実ブラウザーDOMから754件の曲名・バンド・作曲事実を確認しました。

**3. 主なソース種別：** 本人・バンドの公式プロフィール、所属制作会社のCreator/作品ページ、公式レーベル、ゲーム・アニメ等の作品公式クレジット、本人が登録した配信情報、発注元の公式資料。各URL・確認日・実読状態・支える事実を[creator-research.json](migrations/creators-2026-10-02/creator-research.json)に保存しています。代表例は[Elements Garden公式](https://www.ariamusic.co.jp/creators/)、[公式ゲーム作曲欄](https://bang-dream.bushimo.jp/music/)、[PENGUIN RESEARCH公式BIO](https://www.penguinresearch.jp/sp/bio/)、[真部脩一の公式レーベルBIO](https://www.toysfactory.co.jp/artist/widescreenbaroque/bio)です。

**4. CONFIRMED：87主体。** Web調査分のみの件数です。新85＋既存藤田・真部2。全候補のresearchStatusでは、既存ユーザー確認済みの上松範康を加えて88群がCONFIRMED。所属組織Elements Gardenは既存masterに保持しますが、単独の作曲クレジットがないため候補数に含みません。

**5. PROBABLE：2主体。** 瀬名水紀(Dream Monster)、john。master・クレジットへ未適用です。

**6. UNRESOLVED：調査したものは2主体。** JACK、Louis。全候補では未調査229群も含めて231群がUNRESOLVEDです。「231群すべてをWeb調査済み」とは扱いません。未同定の3収録以上の候補はすべて調査し、残る未調査は各2収録以下です。

## Creator masterとカバレッジ（7–16）

| 項目                     |     第3フェーズ前 |          最終状態 |
| ------------------------ | ----------------: | ----------------: |
| Creator数                |                 4 |                89 |
| aliases総数              |                 5 |                58 |
| 旧raw表記総数            |               342 |               342 |
| ID化済み旧raw            |                 5 |               124 |
| 残未同定raw              |               337 |               218 |
| 候補群総数               |               323 |               321 |
| 残未同定候補群           |               320 |               233 |
| 作曲完全解決収録         | 123/884（13.91%） | 631/884（71.38%） |
| 全収録の作曲完全解決Work | 111/823（13.49%） | 578/823（70.23%） |

**7. 作業前Creator数：4。** [phase3-before-master.json](migrations/creators-2026-10-02/phase3-before-master.json)を保存。

**8. 作業後Creator数：89。** person 83、unit 5、organization 1。既存cr-0001～0004のID/name/typeを維持し、nextIdは90。

**9. 新規Creator数：85。** cr-0005～0089を連番で割り当て、再適用時に追加採番しません。所属から組織の参加を自動加算していません。

**10. aliases統合数：追加53表記（総数5→58）。** 実データの所属・空白・括弧・活動名差を根拠付きで登録。主体として統合した旧候補の組は2組です。aliases登録と119 raw解決は別の集計単位です。

**11. 今回ID化した旧raw：119種類。** 累計124/342種類、今回のcomposer token置換544件。複数作曲者を含むrawは全token解決時だけ解決済みとします。

**12. 残未同定raw：218種類。** REVIEW_RECOMMENDED 24＋UNRESOLVED 194。候補単位ではAUTO_RESOLVED 88、REVIEW_RECOMMENDED 22、UNRESOLVED 211、未解決計233群。[全候補review](migrations/creators-2026-10-02/creator-review.md)に元表記・収録・Work・根拠・未確認点を残しました。

**13. ID化済み収録：631/884。** 作曲欄にIDが1つあるだけでは数えず、作曲欄全tokenが解決した収録です。

**14. 収録カバレッジ：71.38%。** 第3フェーズ前13.91%から57.47ポイント増加。

**15. ID化済みWork：578/823。** 同じWorkのすべての収録が作曲完全解決したときに数えます。FULL・ゲーム違いを二重に数えません。

**16. Workカバレッジ：70.23%。** 第3フェーズ前13.49%から56.74ポイント増加。

## 上位30 Creator（17–23）

**17. 最終status、18. name、19. type、20. slug、21. sortKey、22. 収録数、23. Work数**を下表に示します。収録件数降順、同件数は固定ID順。根拠URL数は当該主体の実読URLの重複除去数です。上松範康の0は前フェーズの明示ユーザー確認を継承したもので、今回Web未調査。provisional-originalはかな未確認の元綴です。公式英字が確認できても、日本語のかなを推測していません。

| 標準名       | type   | slug              | sortKey / 状態                      | status    | 収録 | Work | 根拠URL数 |
| ------------ | ------ | ----------------- | ----------------------------------- | --------- | ---: | ---: | --------: |
| 上松範康     | person | noriyasu-agematsu | あげまつのりやす / confirmed        | CONFIRMED |   66 |   59 |         0 |
| 藤田淳平     | person | junpei-fujita     | 藤田淳平 / provisional-original     | CONFIRMED |   55 |   51 |         3 |
| 藤永龍太郎   | person | ryutaro-fujinaga  | 藤永龍太郎 / provisional-original   | CONFIRMED |   44 |   40 |         3 |
| 菊田大介     | person | daisuke-kikuta    | 菊田大介 / provisional-original     | CONFIRMED |   33 |   32 |         3 |
| 岩橋星実     | person | seima-iwahashi    | 岩橋星実 / provisional-original     | CONFIRMED |   32 |   31 |         3 |
| 藤間仁       | person | hitoshi-fujima    | 藤間仁 / provisional-original       | CONFIRMED |   27 |   25 |         3 |
| 都丸椋太     | person | ryota-tomaru      | 都丸椋太 / provisional-original     | CONFIRMED |   26 |   24 |         2 |
| 日高勇輝     | person | creator-0020      | 日高勇輝 / provisional-original     | CONFIRMED |   22 |   21 |         1 |
| 竹田祐介     | person | yusuke-takeda     | 竹田祐介 / provisional-original     | CONFIRMED |   21 |   20 |         3 |
| 笠井雄太     | person | yuta-kasai        | 笠井雄太 / provisional-original     | CONFIRMED |   20 |   20 |         3 |
| Diggy-MO’    | person | diggy-mo          | でぃぎーもー / confirmed            | CONFIRMED |   18 |   12 |         2 |
| 長谷川大介   | person | hasegawa-daisuke  | 長谷川大介 / provisional-original   | CONFIRMED |   12 |    7 |         3 |
| 近藤世真     | person | seima-kondo       | 近藤世真 / provisional-original     | CONFIRMED |   11 |   11 |         3 |
| 末益涼太     | person | creator-0021      | 末益涼太 / provisional-original     | CONFIRMED |   11 |    9 |         1 |
| Ayase        | person | ayase             | Ayase / confirmed                   | CONFIRMED |   10 |   10 |         2 |
| 藤原聡       | person | creator-0024      | 藤原聡 / provisional-original       | CONFIRMED |    9 |    8 |         2 |
| 堀江晶太     | person | shota-horie       | 堀江晶太 / provisional-original     | CONFIRMED |    9 |    8 |         2 |
| 堀川大翼     | person | daisuke-horikawa  | 堀川大翼 / provisional-original     | CONFIRMED |    8 |    8 |         3 |
| 松坂康司     | person | koji-matsuzaka    | 松坂康司 / provisional-original     | CONFIRMED |    7 |    5 |         3 |
| 木下龍平     | person | kinoshita-ryuhei  | 木下龍平 / provisional-original     | CONFIRMED |    7 |    4 |         3 |
| HoneyWorks   | unit   | honeyworks        | HoneyWorks / confirmed              | CONFIRMED |    7 |    7 |         2 |
| DECO\*27     | person | deco27            | DECO\*27 / confirmed                | CONFIRMED |    6 |    6 |         2 |
| 田淵智也     | person | creator-0027      | 田淵智也 / provisional-original     | CONFIRMED |    6 |    6 |         2 |
| トミタカズキ | person | tomita-kazuki     | トミタカズキ / provisional-original | CONFIRMED |    5 |    3 |         3 |
| 大森元貴     | person | motoki-ohmori     | 大森元貴 / provisional-original     | CONFIRMED |    5 |    5 |         2 |
| ピノキオピー | person | pinocchiop        | ぴのきおぴー / confirmed            | CONFIRMED |    5 |    5 |         2 |
| 藤井健太郎   | person | kentaro-fujii     | 藤井健太郎 / provisional-original   | CONFIRMED |    5 |    5 |         1 |
| 大石昌良     | person | masayoshi-oishi   | おーいしまさよし / confirmed        | CONFIRMED |    5 |    5 |         2 |
| ak.homma     | person | ak-homma          | ak.homma / confirmed                | CONFIRMED |    5 |    5 |         2 |
| あらケン     | person | araken            | あらケン / provisional-original     | CONFIRMED |    4 |    2 |         3 |

## 不確定と危険ケース（24–27）

**24. PROBABLE一覧：**

| 主体                    | 収録/Work | 未確定の理由・次の確認                                                                                       |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| 瀬名水紀(Dream Monster) | 4/4       | 所属公式を開いたが本文はLOADINGのみ。対象作曲者のtype/同一性を確認できる本文が必要。読み・英字も推測しない。 |
| john                    | 1/1       | グッドバイの原曲・作曲名義との対応は強いが、主体typeとTOOBOE等の別活動との関係の一次根拠が不足。統合しない。 |

**25. 特に危険なUNRESOLVED：** JACK（BROKEN GAMES/FZMZ、1収録1Work）、Louis（I wonder/Da-iCE、1/1）。共同作者名と原曲文脈は保存しましたが、短名だけで本名・他の同名主体へ対応しません。先頭空白を含むrawも原資料に残しています。未調査229群は別途低頻度の確認待ちとして残します。

**26. 同姓同名・活動名・種別・原曲歌手の混同：**

- 藤井健太郎：対象OurNotes曲の制作を載せた[LOVE ANNEX公式](https://love-annex.jp/creators/%E8%97%A4%E4%BA%95%E5%81%A5%E5%A4%AA%E9%83%8E/)を根拠に音楽制作者へ対応。同名のテレビ制作者から推測しません。
- Orangestar：公式Creatorページと対象作曲クレジットを照合。同じ活動名の漫画家へ統合しません。
- Kanaria：本人の配信/公式作品情報とKING・酔いどれ知らず等の文脈を照合。過去の同名グループの資料を採用しません。
- 堀江晶太/kemu：[バンド公式BIO](https://www.penguinresearch.jp/sp/bio/)が同一人物を明示。1IDに統合し、楽曲の元名義はdisplayOverrideで保持。
- ryo(supercell)/ryo：supercell/EGOISTの対象曲で文脈を限定。TK、GEN、ARM、TAKE、yasu、UZ、KATSU等も既存曲referenceに限定し、将来の短名を自動解決しません。
- HoneyWorks、MYTH & ROID、ORANGE RANGE、Fear, and Loathing in Las Vegas、THE SPELLBOUNDはunit。Tom-H@ck・かいりきベア等の個人と関連unit/プロジェクトを分けています。原曲アーティスト名だけでcomposerを新規登録しません。
- Elements Garden/SUPA LOVE等の括弧は所属として記録。個人が作曲した作品を所属組織へ二重加算しません。歴史的な所属資料は現在の所属を保証するものとして扱いません。

**27. 公式ソース不一致：** 同名の「閃光」はRoselia/EveとAfterglow×レイヤ/川上洋平が別曲として公式掲載されていました。バンドを併せて照合し、当初の矛盾疑いを解消。Diggy-MO’のアポストロフィ、HYDE等の大小文字、括弧/空白差は表記差として根拠と旧表示を保持しました。今回採用した対応で未解消の作曲主体矛盾は検出していませんが、すべての旧収録に複数公式ソースが存在することを保証しません。

## slugと読み（28–30）

**28. 暫定slugから変更：藤田淳平のみ。** cr-0004は固定し、creator-0004→junpei-fujita。所属公式のJunpei Fujitaを確認済み。既存master内の短いidentityEvidenceは第2フェーズ時点の履歴で、現調査状態と公式英字は第3フェーズresearchを参照。真部脩一は公式レーベルがComposer個人と明記しますが、この本文では公式英字・かなを確認できずcreator-0003を維持しました。

**29. 今後変更可能性があるslug：安定ID形式16件。** 公式英字/本人のURL識別子を将来確認すれば変更検討できます。公式URL識別子からのslugは、それだけで英字氏名の確認とは扱いません。読みが暫定の主体は46件で、元綴sortKeyを明記しています。

| ID      | 標準名       | 現在slug     |
| ------- | ------------ | ------------ |
| cr-0003 | 真部脩一     | creator-0003 |
| cr-0020 | 日高勇輝     | creator-0020 |
| cr-0021 | 末益涼太     | creator-0021 |
| cr-0024 | 藤原聡       | creator-0024 |
| cr-0027 | 田淵智也     | creator-0027 |
| cr-0041 | かいりきベア | creator-0041 |
| cr-0048 | 片倉三起也   | creator-0048 |
| cr-0050 | 前山田健一   | creator-0050 |
| cr-0053 | 佐藤純一     | creator-0053 |
| cr-0072 | 常田真太郎   | creator-0072 |
| cr-0073 | 大橋卓弥     | creator-0073 |
| cr-0075 | 目黒将司     | creator-0075 |
| cr-0081 | 前澤寛之     | creator-0081 |
| cr-0082 | 志倉千代丸   | creator-0082 |
| cr-0083 | 篠崎あやと   | creator-0083 |
| cr-0089 | 庄司夏葵     | creator-0089 |

**30. previousSlugs / redirect設計案：** 固定IDとcurrent slugを正本にし、previousSlugsを履歴として持つ。全Creatorの新旧slugで一意性・再利用・循環を検証。旧URLから現在slugへ直接恒久転送し、canonical/sitemapは現在URLのみ。Cloudflareの\_redirectsとGitHub Pages静的互換ページをbuildで生成する案です。管理画面も過去slugとの衝突を拒否。今回のredirect追加実装は行っていません。詳細は[CREATORS.md](CREATORS.md)。

## 検証（31–40）

**31. 旧表示2,652比較：全一致。** composer/lyricist/arrangerの文字列・区切り・順序・overrideを確認。ユーザーが変更したOurNotes 50/51/52の参照は、titleと固定Work IDで確認した[record-reference-updates.json](migrations/creators-2026-10-02/record-reference-updates.json)の3件を同時変換して比較します。原legacy-creditsは変更していません。

**32. migration verify：成功。** creators.mjs verifyとresearch-creators.mjs verifyが884収録/89Creator/823 Workを確認。再適用プランは変更0、追加ID0。report-only案を検証してからhash付きbackup→applyを実行。適用時のbefore/proposed/phase3-applied資料は履歴として保持し、最終調査91件とは区別しています。Work全内容とガルパ旧項目は移行前とdeep一致。OurNotesの旧項目差分は並行編集32field（ID3・releaseOrder3・difficulties19・gekisouSections7）に完全一致し、[phase3-user-changes.json](migrations/creators-2026-10-02/phase3-user-changes.json)へ記録。Creator作業からOurNotes楽曲ファイルへの最後の書込は適用時で、並行編集は書き戻していません。ガルパのJSON整形は意味上の変更を加えていません。

**33. Work warning：0。** 既存823 Work/ID/所属収録を保持。ID循環は同じ曲実体とWorkの対応を保持したユーザー変更です。

**34. 全テスト：151成功、失敗0。** 既存全回帰に加え、CONFIRMEDのみのmap、型/根拠/読み/slug/aliases validation、非確定除外、固定ID/冪等、composer・承認済み曲限定、公開masterへの調査資料非混入、完全解決カバレッジ、3ID循環と重複拒否を検証。個人ごとの経歴を大量にtestへ固定していません。rootの最終全151に加え、subpathの全151も実施済み。最後の追加譜面更新後は両配置の再build/カタログ一致/SEOとroot全151を再確認しました。

**35. root build：成功。** node scripts/build.mjs。distの両ゲームcatalog、creators、worksが現在sourceとdeep一致。

**36. subpath build：成功。** BASE_PATH=/bandori-song-atlas/。最新sourceの最終検証出力は.cache/creator-phase3-subpath-final。両catalog/master/Workがsource一致。distは最後にroot配置を生成しました。

**37. SEO監査：両配置成功。** slug一意、title重複、canonical、sitemap、内部リンクをaudit-buildで確認。982正規ページ、884曲詳細（799/85）、797旧URL互換、正規title 982。Functionsも既存Wranglerでコンパイル成功。変更36 JS/MJSの構文、Creator作業の全変更ファイルの整形、git diff --checkを確認。OurNotes楽曲JSONは並行編集を保持するため整形書込の対象外とし、全ファイルの初回checkで出た同ファイルのstyle警告を残しています。JSON構造・データ整合性は検証済みです。

**38. sitemap総ページ数：982。** Creator一覧1＋Creator詳細89を含む正規ページ。797互換ページやquery状態・管理ページはsitemapへ入れません。

**39. 公開実ブラウザー：一覧・詳細を確認。** 89件、kemu別名→堀江晶太1主体、参加曲数順（上松59/藤田51/藤永40）、堀江9収録8Work・OurNotes絞込6作品、藤田55/51と新slug、元所属付きクレジットからのリンクを確認。詳細の絞込でも全参加数を維持。証拠は.cache/creator-phase3-uiの一覧・詳細PNG。

**40. 管理とpicker実ブラウザー：各500 Creator fixtureで確認。** /admin/creators/の別名500検索→1件、readonly固定ID、名前編集、mock保存、再取得の同値。楽曲pickerは初期100候補の外にある500を別名検索→選択、表示override、検索消去・再取得で選択保持、既存Work付きmock保存→再読込で作曲IDとoverrideを保持。console error 0。GitHub書込はメモリーfixtureのみで、本番保存0。今回の500件試験はデスクトップ操作で、モバイル500件・実機低速端末・時間計測ベンチマークは未実施。

### SSRと読み込み量

公開master JSONは21,493bytes（89件）。一覧の検索用bootstrapは28,698bytes、藤田詳細はcreatorIdとroleCoverageだけの227bytes、共通Creator controllerは3,572bytes。作品/クレジットは静的HTMLに描画済みです。Creator詳細に全masterを埋め込まず、一般トップ・曲詳細にCreator一覧bootstrapはありません。既存曲一覧が必要時に取得するcatalogには最小masterを含みます。93URLの調査資料やreviewはdistに配信しません。将来master数増加時の実機性能は別途計測できます。

### 取得失敗と検証中の問題

ariaの誤った二重相対URL、都丸の502、ゲームページの抽出失敗は正しいURL/実ブラウザー本文で解消。FMFの証明書エラーは迂回せずTBS公式へ切替。Dream MonsterのLOADING、追加夢ノ結唱公式ページの取得/遷移拒否は未読として残し、検索snippetで補いませんでした。神前の403も実ブラウザー本文で補完。初回buildの外部pnpm依存読取制限、テストcanvas EPERMは既存依存を読み取れる承認付き環境で解消。初回fixtureのsortKey/alias期待値誤りを訂正し再テスト成功。並行ID変更で旧参照verifyが失敗したためユーザーへ確認し、保持指示後に明示参照対応を追加。最後の並行notes更新で旧distとの一致が失敗し、最新sourceから両配置を再生成しました。

実ブラウザーの旧draft読込confirmはCDP timeout/getJsDialog nullとなりEscapeで取消・draft保持後、新ポートのメモリーfixtureで検証。作成した公開/管理/picker確認tabは終了。調査tabのcloseは既存エラーURLのアクセス制限で拒否され、制限迂回なし。検証server listenerは終了確認済みです。詳細経過・失敗した補助コマンドは[WORK_LOG.md](../WORK_LOG.md)。

## 公開判断（41–43）

**41. 現在の公開品質：主要な作曲者DBは公開前の人間レビューに進める品質です。** 根拠を追跡できる確定分だけを適用し、収録71.38%/Work70.23%の完全解決、旧表示・Work・検索互換・安全な再適用・大量管理操作を確認しました。全作曲者の同定完了ではありません。今回の本番公開は行っていません。

**42. push前の重点確認：** 堀江晶太/kemu、ryo(supercell)/ryoの統合、藤井健太郎の対象曲、Kanaria/Orangestarの同名区別、TK/GEN/ARM/TAKE/yasu/UZ/KATSUの曲限定対応、ゲーム公式クレジットを主根拠とする日高勇輝・末益涼太、藤田の新slugと真部の暫定slug、unit 5主体、暫定sortKey 46件とID slug 16件。PROBABLE 2主体は追加一次資料が得られるまで適用しません。

**43. 残るリスク：** 未同定raw218/候補233、特に短名と低頻度の同姓同名。日本語かな未確認による名前順の暫定性、公式URL識別子と英字氏名の違い、公開後のslug変更時のredirect未実装、作詞・編曲未整備。OurNotesだけの一部対象は公式個人/制作作品資料とローカル原曲文脈を併用し、すべての収録の公式個別クレジットを再発見したとは扱いません。外部公式ページが将来変わるため確認日を保持。今回未検証の実GitHub保存・本番配信・500件モバイル性能は、将来公開時の確認範囲です。

成果物：[creator-research.json](migrations/creators-2026-10-02/creator-research.json)、[creator-review.md](migrations/creators-2026-10-02/creator-review.md)、[creator-map.json](migrations/creator-map.json)、[phase3-verification.json](migrations/creators-2026-10-02/phase3-verification.json)。
