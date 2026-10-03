# Phase B2 最終release状況（2026-10-04）

公開前検証完了（commit以降は未実施）。Creator124／新33／next125／metadata BLOCKED0、Garupa799＋OurNotes86＝885収録、Work823 byte不変、Work警告0。

metadata-only14 record-role（宮崎8編曲、母里4編曲＋2作曲）と、人間が訂正後に承認した川渕6共同編曲（220/231/243/246/248/272）を正式化。220の都丸椋太はcr-0019、224/250へ波及適用0。rawの空白・区切り・順序を維持。既存121 metadataとA/B1全452file SHA不変。

最新mainの10commit（5728144まで）、OurNotes50/51/52、9曲の並行編集、新86とGP758相互リンク、admin-state next87を保持。新86は明示リンク先の既存Workを再利用し、未収集作詞・編曲を補完しない。カンザキイオリは既存master一致0のためcomposer raw fallbackを保持。

| 担当         | 正式解決 | raw fallback |      credit未知 |
| ------------ | -------: | -----------: | --------------: |
| 作詞         |      615 |          220 |              50 |
| Garupa編曲   |      718 |           33 |              48 |
| OurNotes編曲 |        2 |            3 | 81（旧80＋新1） |
| 作曲         |      619 |          266 |               0 |

旧2652表示は消失・変更0。現在2655比較。原B2の旧空1591補完と人間作曲2補完は別分類で保存。未解決703＝credit未確定147＋split/identity473＋旧Own編曲80＋新86の3role、split59、metadata0。

253/253 tests（旧194＋旧B2 35assert変更0＋release24）、root/subpath各1018正規・885詳細・797旧曲・18旧Creator、Functions4.143.0 compile成功。744 filter組合せ一致、公開20JSON research0、Creator3名mock保存/読取・20role/18record roundtrip・削除guard3、外部mock write0。390/1280の6ページoverflow0、重大console error0。

新3名の統計：宮崎京一 8 Work/8収録（L0/C0/A8）、母里治樹 4 Work/4収録（L0/C2/A4）、川渕龍成 6 Work/6収録（L0/C0/A6）。

根拠：[release-verification.json](release-verification.json)、[human-review.json](human-review.json)、[release-parallel-preservation.json](release-parallel-preservation.json)、[CREATOR_CREDITS_RELEASE_REPORT.md](CREATOR_CREDITS_RELEASE_REPORT.md)。次：1release-ready commit→通常push→CI/既存Cloudflare Git連携のSHA確認→本番read-only→65report完成。

---

# 30名適用時点のB2履歴（以下は当時の67欄）

以下の121名・30新規・3metadata保留・旧QA件数は適用前史の記録です。現在値は上記および最新verificationを参照してください。

# Phase B2 実装・適用報告

2026-10-03。正式Creator30追加、総121 / next125、835収録にcredit field patch、Work823と全884収録を維持。commit/push/deployは行っていない。

集計の単位は明記した箇所を除きrecord-role（1収録の1担当）。raw欄patch数、Creator entry数、unique Work数は別の値。

## 1. B1 package SHA / version

version 1、SHA-256 21f9fd2b68bcba3bfc54a193e31dad5f3d98008b8a7fa2d3ff197f8aba6a0dc4。B1はapply=false / allocateFormalIds=falseのままbyte不変。[phase-b2-effective-package.json](phase-b2-effective-package.json)に出典を保持。

## 2. B2開始時current data SHA

| file                     | 開始SHA-256                                                      | 適用後SHA-256                                                    |
| ------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| data/creators.json       | 798195855e90308cd6eae3bfb1ee0573700190782b14402e9928cc6a151a4285 | 665fc19f12bc85f71da50131f502b02b7794ff2a4bc7faf26b03b748be147f78 |
| data/garupa/songs.json   | adac7542850ed434adabd40814bff035b251347ff6d6c1051b5232cf6e3ccf4f | d96fedd742a62d4f10e1ee59a81993992dfecc6f3c6c3e02de8d511ab7a36261 |
| data/ournotes/songs.json | 6d1109393baf379702bd0dd4a8b05a0dc434907e85bf1052e7e2db8a8c0339ee | a7247cd5463c8cc83aae0c76e3fce59c653931b9b7509314af2d4662b4599acb |
| data/works.json          | 0d11445f079f14631de361259277ed24076151dfe6ca7c920d6bcd13e6f379fa | 0d11445f079f14631de361259277ed24076151dfe6ca7c920d6bcd13e6f379fa |

[baseline.json](baseline.json)。開始時点の現行OurNotesを正としている。

## 3. human review反映件数

今回36主体・表記判断（A1 12＋A2 14＋旧PROBABLE 7＋既存variant 3）。B1の6楽曲human案件も明示継承。sourceType=human-review / checkedAt=2026-10-03、外部一次資料とは区別。[human-review.json](human-review.json) / [human-review.md](human-review.md)。

## 4. A1採用12件

織田あすか、Seonoo Kim、畑亜貴、植木建象、Spirit Garden、MOMIKEN、水樹奈々、あの、Gom、Aira、peppe、samfree。B1の承認metadataをそのまま採用（provisional-original sortKeyも勝手な読みに置換しない）。

## 5. A2採用14件

中村・下田・藤原・大森・小木・神田・仲町・麻枝・及川・佐藤・穴見・小林・長屋・槇島の14件。藤原=ふじわらまさき/masaki-fujiwara、小木=おぎがくし/gakushi-ogi、仲町=なかまちあられ/arale-nakamachi、槇島=まきしまたかひと/takahito-makishima。全表はhuman-review.md。

## 6. former PROBABLE昇格7件

宮崎京一・母里治樹・川渕龍成・ハルイチ・烏屋茶房・林英樹・o-sakaのidentity/typeはhuman CONFIRMED。previousB1Confidence=PROBABLEを履歴へ保持。うち4件を正式公開、3件はmetadata gateで除外。

## 7. existing variant昇格3件

田淵　智也→cr-0027、上松 範康（Elements Garden）→cr-0001、DECO＊27→cr-0026。既存IDを再利用しaliasのみ追加。

## 8. metadata BLOCKED件数

3件。宮崎京一 cr-0118、母里治樹 cr-0119、川渕龍成 cr-0120は予約枠のみ。安全な読み/公式Latin/人間可読slugの一次本文が不足。master/relationへ登録せず、14 record-roleはraw fallbackに保持。[metadata-evidence.json](metadata-evidence.json)とunresolved-index.jsonに不足・取得失敗を記録。

## 9. formal new Creator件数

30（承認26＋旧PROBABLEのmetadata通過4）。候補33のうち保留3を詰め直さない。

## 10. Creator総数

121 = 既存91＋新30。公開masterと両build masterを全件照合。

## 11. nextId

125。118～120は固定予約で欠番を再利用しない。

## 12. candidateKey→formal ID mapping全件

| candidateKey            | Creator ID（固定枠） | 名前          | 状態             | current slug       |
| ----------------------- | -------------------- | ------------- | ---------------- | ------------------ |
| b1-db9dc93abeb28da7e46e | cr-0092              | 織田あすか    | READY            | asuka-oda          |
| b1-706dfa00eb1eedda8c38 | cr-0093              | 中村航        | READY            | kou-nakamura       |
| b1-02162c02420c410e6184 | cr-0094              | 下田晃太郎    | READY            | kotaro-shimoda     |
| b1-6e0b6c39ddbe61fb7c27 | cr-0095              | 藤原優樹      | READY            | masaki-fujiwara    |
| b1-0bff951e166fab86db35 | cr-0096              | Seonoo Kim    | READY            | seonoo-kim         |
| b1-b5d6ad8052c51aca973f | cr-0097              | 畑亜貴        | READY            | aki-hata           |
| b1-f27622614d9cfe966501 | cr-0098              | 植木建象      | READY            | kenzo-ueki         |
| b1-2f3ac0aa9377ae457894 | cr-0099              | Spirit Garden | READY            | spirit-garden      |
| b1-d233ad1967aa7dbda0e6 | cr-0100              | 大森祥子      | READY            | shoko-oomori       |
| b1-3b0e5a5bfe76a5eb6303 | cr-0101              | 小木岳司      | READY            | gakushi-ogi        |
| b1-b528ebcd57341a509dce | cr-0102              | MOMIKEN       | READY            | momiken            |
| b1-47763b21b3c13fee3141 | cr-0103              | 神田ジョン    | READY            | john-kanda         |
| b1-e63b116451e1ce75895d | cr-0104              | 水樹奈々      | READY            | nana-mizuki        |
| b1-6f1dda77863c0f86ef66 | cr-0105              | 仲町あられ    | READY            | arale-nakamachi    |
| b1-25052ac53b02a2908801 | cr-0106              | 麻枝准        | READY            | jun-maeda          |
| b1-abadd06eea1e892807f7 | cr-0107              | あの          | READY            | ano                |
| b1-cc64468fb0fb21e82de1 | cr-0108              | 及川眠子      | READY            | neko-oikawa        |
| b1-edc4deaf7d76c9950ba6 | cr-0109              | Gom           | READY            | gom                |
| b1-d6941b445fae84ecf412 | cr-0110              | 佐藤英敏      | READY            | hidetoshi-sato     |
| b1-a44a526d6bab744bdff0 | cr-0111              | Aira          | READY            | aira               |
| b1-cee1cb2757fda7b98e2e | cr-0112              | peppe         | READY            | peppe              |
| b1-4ca81d86e6c9d89fad5f | cr-0113              | samfree       | READY            | samfree            |
| b1-56362089840ee7af1d37 | cr-0114              | 穴見真吾      | READY            | shingo-anami       |
| b1-e119ab1c5fcf8c4309e9 | cr-0115              | 小林壱誓      | READY            | issey-kobayashi    |
| b1-0b8d88f153cd3ed28196 | cr-0116              | 長屋晴子      | READY            | haruko-nagaya      |
| b1-01a6a1f7051b830f39ae | cr-0117              | 槇島隆人      | READY            | takahito-makishima |
| b1-a7ebb5f19b96341985cd | cr-0118              | 宮崎京一      | BLOCKED_METADATA | —                  |
| b1-d43891f53862909d7abb | cr-0119              | 母里治樹      | BLOCKED_METADATA | —                  |
| b1-a341ddeabf1c140432d9 | cr-0120              | 川渕龍成      | BLOCKED_METADATA | —                  |
| b1-065e0e070ab40a39c5e1 | cr-0121              | ハルイチ      | READY            | haruichi           |
| b1-397cc1de0e1b600bf103 | cr-0122              | 烏屋茶房      | READY            | karasuya-sabou     |
| b1-784ae60a37f7c4f4d380 | cr-0123              | 林英樹        | READY            | hideki-hayashi     |
| b1-e8ae9d1e92b80dadf59e | cr-0124              | o-saka        | READY            | o-saka             |

[candidate-id-map.json](candidate-id-map.json)。BLOCKED枠は公開IDを発行した状態とは扱わない。

## 13. 新slug一覧

| ID      | 名前          | slug               |
| ------- | ------------- | ------------------ |
| cr-0092 | 織田あすか    | asuka-oda          |
| cr-0093 | 中村航        | kou-nakamura       |
| cr-0094 | 下田晃太郎    | kotaro-shimoda     |
| cr-0095 | 藤原優樹      | masaki-fujiwara    |
| cr-0096 | Seonoo Kim    | seonoo-kim         |
| cr-0097 | 畑亜貴        | aki-hata           |
| cr-0098 | 植木建象      | kenzo-ueki         |
| cr-0099 | Spirit Garden | spirit-garden      |
| cr-0100 | 大森祥子      | shoko-oomori       |
| cr-0101 | 小木岳司      | gakushi-ogi        |
| cr-0102 | MOMIKEN       | momiken            |
| cr-0103 | 神田ジョン    | john-kanda         |
| cr-0104 | 水樹奈々      | nana-mizuki        |
| cr-0105 | 仲町あられ    | arale-nakamachi    |
| cr-0106 | 麻枝准        | jun-maeda          |
| cr-0107 | あの          | ano                |
| cr-0108 | 及川眠子      | neko-oikawa        |
| cr-0109 | Gom           | gom                |
| cr-0110 | 佐藤英敏      | hidetoshi-sato     |
| cr-0111 | Aira          | aira               |
| cr-0112 | peppe         | peppe              |
| cr-0113 | samfree       | samfree            |
| cr-0114 | 穴見真吾      | shingo-anami       |
| cr-0115 | 小林壱誓      | issey-kobayashi    |
| cr-0116 | 長屋晴子      | haruko-nagaya      |
| cr-0117 | 槇島隆人      | takahito-makishima |
| cr-0121 | ハルイチ      | haruichi           |
| cr-0122 | 烏屋茶房      | karasuya-sabou     |
| cr-0123 | 林英樹        | hideki-hayashi     |
| cr-0124 | o-saka        | o-saka             |

新Creator previousSlugsは追加なし、内部candidate slugを履歴URLへ入れない。

## 14. slug collision件数

0。既存current / previousSlugs / 新規currentを横断してvalidation、両SEOで全121 canonicalを確認。

## 15. alias追加数

32文字列（既存3＋新30 Creator内29）。別Creator参加数へ加算しない。未確定aliasReviewCandidatesは取り込まない。

## 16. displayOverride数

現行shared displayOverride 476（旧476を保持）、担当別displayOverrides 712個（追加712）。担当別overrideを優先し、旧shared形式と後方互換。統計はidentityで集計。[statistics.json](statistics.json)。

## 17. existing ID再利用数

既存91 ID/metadata/current slug/previousSlugsを全件保持。effective正式relationで既存主体を再利用し、新IDで置き換えない。

## 18. lyricist relation proposal数

615 record-role（Garu559 / Our56）。B1 603から＋12。[coverage.json](coverage.json)。

## 19. lyricist実適用数

正式Creator解決615 record-role。raw欄整備を含む作詞patchは835、正式relation件数とは区別する。applied-relations.jsonはraw fallback整備も含む。

## 20. lyricist完全Creator解決record数

615 / credit confirmed 835。共同creditの全主体が安全に解決できる場合だけ正式化。

## 21. lyricist raw fallback数

220 = Garu204＋Our16。credit自体未確定49は別集計。原文の既存検索リンクを維持。

## 22. lyricist credit未確定50件維持確認

B1の50件一覧・全資料のbyteSHAを維持。今回明示human案件Our66カーネーション1件だけを第48節に基づき補完したため、現行未確定は49。歴史50を現在も50未確定とは誤記しない。他49は推測で埋めていない。

[作詞credit未確定50（B1履歴）](../credits-phase-b1-2026-10-03/lyricist-unconfirmed.md)、[ガルパ編曲credit未確定50（B1履歴）](../credits-phase-b1-2026-10-03/garupa-arranger-unconfirmed.md)、[OurNotes編曲80手動収集](../credits-phase-b1-2026-10-03/ournotes-arranger-manual-review.md)、[手動入力JSON](../credits-phase-b1-2026-10-03/manual-arranger-review.json)、[unresolved-index.json](unresolved-index.json)（identity fallback 作詞220/GParr51/Ourarr3、split全65収録担当、metadata3）と[元split54群](../credits-phase-b1-2026-10-03/split-review.md)。

## 23. Garupa arranger proposal数

700 record-role。B1 699から＋1。

## 24. Garupa arranger実適用数

正式700 record-role。raw欄整備を含む編曲patchは751、うちfallback51。

## 25. Garupa arranger完全Creator解決数

700 / credit confirmed 751。未確定48を別集計。

## 26. Garupa arranger raw fallback数

51。既存rawを維持し、部分的に同定できた名前だけを勝手にrelationへ昇格しない。

## 27. Garupa arranger未確定50件維持確認

歴史50件の一覧/資料をbyte不変で保持。きゅ〜まい＊flowerの明示human判断（第50節）により176/218の2件を確認済みへ反映し、現行未確定48。738を含む3版の役割を統一したがWork identityは変更しない。他48を推測補完していない。

## 28. OurNotes arranger proposal数

ゲーム版確認済みから2 record-roleのみ。発売版の値を提案へ昇格しない。

## 29. OurNotes arranger実適用数

2 record-role。Our21は植木＋神田の2主体、Our77は既存藤井健太郎。raw補完を含む編曲patchは5。

## 30. OurNotes game版確認済み5件の状態

| ID  | 曲                 | 状態                                                          |
| --- | ------------------ | ------------------------------------------------------------- |
| 21  | 青春コンプレックス | 植木建象 cr-0098、神田ジョン cr-0103。公式順序/所属表記を維持 |
| 40  | 残酷な天使のテーゼ | 植木建象、冬真の全raw fallback（共同identity未解決）          |
| 61  | オリオンをなぞる   | 岡村大輔のraw fallback                                        |
| 70  | ロウワー           | 太田雄大のraw fallback                                        |
| 77  | イケナイ太陽       | 藤井健太郎 cr-0033                                            |

## 31. OurNotes残80未収集維持

80/85のarranger値とkey有無を開始実体から保持（未入力keyへnullを追加しない）。manual-arranger-review.json / mdのSHA不変。発売版参考44件をゲーム版へ流用していない。

## 32. Composer correction 4件結果

Garu249、Our14、Our33、Our66。全allowDeletion=false、旧composer roleを削除しない。既存完全解決607/882 credit→B2後617/884 credit、raw fallback275→267。4補正以外に承認済みraw identityを正式IDへリンク化した結果も含む。

## 33. Mela!結果

Our75：L 長屋晴子cr-0116→小林壱誓cr-0115、C peppecr-0112→穴見真吾cr-0114。既存composer「peppe／穴見真吾」を削除・文字置換せず、個別リンク化。

## 34. きゅ〜まい＊flower結果

Garu176/218/738：C 末益涼太cr-0021、A 竹田祐介cr-0009。竹田をcomposerに追加しない。各版のWork IDを維持。

## 35. ルカルカ結果

Garu249：samfree cr-0113をC/Lへ正式化。C表示SAM(samfree)を維持。

## 36. 砂寸奏結果

Our14：C 槇島隆人cr-0117、SUPA LOVEは所属aliasのみ。

## 37. Symbol IV : Earth結果

Our33：C 長谷川大介cr-0013→Diggy-MO’cr-0022。原文Diggy-MO'のASCIIアポストロフィを担当別表示で保持。SUPA LOVEを参加へ追加しない。

## 38. カーネーション結果

Our66：L Aira cr-0111、C 瀬名水紀cr-0090→Aira cr-0111。瀬名水紀(Dream Monster)表示を保持。A発売版参考はゲーム欄へ反映しない。

## 39. o-saka != 尾崎豪確認

o-saka cr-0124 person。尾崎豪をname/alias/alternative identityへ一切追加せず、専用negative testで固定。

## 40. affiliation二重計上0

所属を理由に追加した組織relationは0。EG / SUPA LOVE / Dream Monsterはperson表示にのみ保持。Spirit Garden cr-0099 organizationはcredit主体そのものとして正式化し、Elements Garden cr-0002と区別。

## 41. duplicate Creator ID 0

現行master121件・候補固定33枠・2回目apply/validatorで0。

## 42. duplicate slug 0

現行と過去slug履歴を含む0。ID型current slugも0。

## 43. duplicate relation 0

全884 recordの同一Creator entry重複0。C/L/Aは同一entryへrolesをmerge、空/重複/不正roleをfatalにする。

## 44. dangling Creator reference 0

全recordの全credit entry / creditDisplay tokenがmaster121に解決。validator＋B2 test＋両buildで確認。

## 45. PROBABLE applied 0

正式relationのPROBABLE適用0。旧7はhumanによる明示昇格後にmetadata gateを通る4だけ適用。B1履歴を保持。

## 46. UNRESOLVED applied 0

正式relationのUNRESOLVED適用0。除外720 record-role（未確定credit147 / split・identity479 / metadata14 / Our発売版80）の全件を[unresolved-after-b2.json](unresolved-after-b2.json)に保持。

## 47. candidateKey public relation 0

公開credit identityは全てcr-NNNN。candidateKeyや調査confidence/provenanceはmigration docsに限定。

## 48. record数884

Garu799＋Our85。収録順序/group/既存IDと全non-credit fieldを開始実体と比較して不変。

## 49. Work数823

Works source byteSHA 0d11445f079f14631de361259277ed24076151dfe6ca7c920d6bcd13e6f379fa、開始から完全一致。

## 50. Work warning

0。編曲はゲーム/演奏バンド別の版を比較し、未解決creditを確定作者の相違とみなさない。確定した同一演奏版の相違を検出するnegative testはwarning1になる。

## 51. old display 2,652比較

MATCH 1,059、PRE_EXISTING_EMPTY_FILLED 1,591、HUMAN_APPROVED_SUPPLEMENT 2（Our14/33の旧空composer）。既存非空displayの変更/消失は0、旧composer非空882は完全一致。追加L/Aを含む全原文順序を担当別creditDisplayで保持。[display-comparison.json](display-comparison.json)。

## 52. OurNotes並行編集保持

意図したID50「これはぼくたちの生存のあらすじ」、51「うちゅうのふしぎ」、52「真夜中遊園地」を保持。difficulty/charts/撃奏/releaseOrder/全その他non-credit fieldも各884件deep比較。旧snapshotをliveへ復元せずcurrent fileの5credit fieldのみ構造patch。

## 53. roleCoverage最終状態

L/Cは両ゲームready、A Garu ready / Our partial。旧flat ready/unpreparedを受理する後方互換。readyは公開対象という意味で100%収集済みとは表現しない。Our未入力80は「未整備・確認中」、Creatorの編曲数は「一部登録」説明付き。

## 54. Creator detail統計

| Creator       | unique Work | 収録 | 作詞Work | 作曲Work | 編曲Work |
| ------------- | ----------- | ---- | -------- | -------- | -------- |
| 織田あすか    | 253         | 270  | 253      | 0        | 0        |
| 中村航        | 77          | 83   | 77       | 0        | 0        |
| 下田晃太郎    | 38          | 39   | 0        | 2        | 38       |
| 藤原優樹      | 20          | 36   | 20       | 0        | 0        |
| Seonoo Kim    | 17          | 17   | 0        | 1        | 17       |
| Spirit Garden | 7           | 8    | 7        | 0        | 0        |
| Aira          | 1           | 1    | 1        | 1        | 0        |
| samfree       | 1           | 1    | 1        | 1        | 0        |
| 槇島隆人      | 1           | 1    | 0        | 1        | 0        |

[statistics.json](statistics.json)は全121件/Top30を収録。織田B1候補272→正式270収録/253Work。Garu236/461はidentityが解決済みでもcredit自体未確定のため適用除外、raw保持。中村83候補→83収録/77Work。フィルターは一覧だけを絞り、上段総数は全収録値と明示。

## 55. song detail link/fallback

両配置それぞれ2023個のCreator creditリンクと1064個の検索fallbackを維持。共同者は個別リンク、公式rawの担当別順序を保存。全884 HTMLの確認＋Our66実画面390/desktop。各80未入力arrangerに未整備表示。

## 56. admin regression

B2 live全884のcreditRows→selectedCreditData保存形式を検証。Creator browser121件/藤原読み検索/別名mock保存saved-1→再取得、削除確認取消。新参照cr-0092の削除はAPI unitで253Work/270収録の参照として拒否。楽曲Our66でAira picker検索・L/C共同relationのmock保存saved-2が成功。mock APIから全884のID/roles/担当別順序/coverageを再読取照合。グローバルcredit entry順はrole mergeで変わり得るが担当別順は不変。[admin-mock-verification.json](admin-mock-verification.json)。本番write 0。

## 57. test件数 / 成否

pnpm test：既存194＋B2追加35＝229/229成功。既存test/assertは変更0。旧91/source byteに固定された既存テストはSHA確認済みhistorical fixtureを独立.cache workspaceへコピーし現行実装で実行、liveへrestoreしない。現行121/884は追加35・全884 admin/API・両build/SEOで検証。human-review sourceType補足後もB2 live35成功。

## 58. root build

node scripts/build.mjs成功、session97439終了0。distは直接編集せず生成。

## 59. subpath build

BASE_PATH / SITE_BASE_PATH=/bandori-song-atlas/、SITE_OUTPUT_DIR=.cache/credits-phase-b2-subpathで成功、session91834終了0。

## 60. root SEO

1014正規URL/884詳細/797旧曲互換/18旧Creator互換/title1014。全121 current slug canonical/sitemap/internal links成功。

## 61. subpath SEO

同じ1014/884/797/18/title1014。正しいSITE_ORIGIN=https://tanimachi-bdsongs.comで成功。最初の誤origin呼出は終了1、訂正後の結果で判定。

## 62. Functions compile

Wrangler 4.143.0 pages functions build functions --outdir .cache/credits-phase-b2-functions成功、session49265終了0。contactはbuild/compileおよび既存回帰で検証。本番メール送信なし。

## 63. distへのresearch漏洩0

root/subpath各2772file、計5544fileを検査。A/B1/B2 research/evidence/human/manual docs 0。公開JSON10ファイルはcatalog/master/redirect/admin configのみ。

## 64. git diff --check

成功（終了0）。変更量/ステージ状態/HEADを終了時にも照合。既存A/B1資料452fileをSHA検証、削除0。

## 65. commit/push/deploy未実施

全て未実施。HEAD 5e4da7e517f5640b068cabaa8aa01b036e281961 のまま。ステージ空。mockのsaved-1/saved-2はテストメモリー上の名称で実Git commit/GitHub writeではない。

## 66. Phase B2をhuman reviewへ渡せるか

可。CONFIRMEDだけの正式適用・coverage UI・current source保全・全QAを満たしたローカルworking tree。metadata3/未同定/fallbackは指定どおり除外し可視化。[requirements-audit.md](requirements-audit.md)（全114要件）と[verification.json](verification.json)で照合。

## 67. release前残課題

人間によるこのdiffレビュー後にreleaseを別途指示する。3metadataは安全な読み/公式Latin/slugが揃うまで予約維持。未同定/未確定credit/split、Our80ゲーム内編曲は手動収集を継続。A1で承認された暫定sortKeyは将来確認して改善。参照リンクを下記から確認できる。

[作詞credit未確定50（B1履歴）](../credits-phase-b1-2026-10-03/lyricist-unconfirmed.md)、[ガルパ編曲credit未確定50（B1履歴）](../credits-phase-b1-2026-10-03/garupa-arranger-unconfirmed.md)、[OurNotes編曲80手動収集](../credits-phase-b1-2026-10-03/ournotes-arranger-manual-review.md)、[手動入力JSON](../credits-phase-b1-2026-10-03/manual-arranger-review.json)、[unresolved-index.json](unresolved-index.json)（identity fallback 作詞220/GParr51/Ourarr3、split全65収録担当、metadata3）と[元split54群](../credits-phase-b1-2026-10-03/split-review.md)。

実browserの保存後追加再読込操作中にCUA/CDPが応答停止したため、その追加UI再読込の成功は主張しない。保存成功と別API読取の全884検証を根拠にする。390pxとdesktopはそれ以前に実測/撮影済み。

## 検証コマンドと証拠

| コマンド                                                                                                           | 結果・証拠                                                   |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| pnpm test                                                                                                          | 194＋35成功 / ../../../.cache/b2-final-tests.log             |
| node --test tests/credits-phase-b2.test.mjs                                                                        | human-review更新後35成功 / ../../../.cache/b2-live-final.log |
| node scripts/migrations/apply-credits-phase-b2.mjs verify                                                          | 2回目changedFiles0 / verification.json                       |
| node scripts/build.mjs                                                                                             | 成功 / ../../../.cache/b2-root-build.log                     |
| node .cache/b2-build-subpath.mjs                                                                                   | 成功 / ../../../.cache/b2-subpath-build.log                  |
| node scripts/qa/audit-build.mjs                                                                                    | 成功 / ../../../.cache/b2-root-seo-final.log                 |
| node scripts/qa/audit-build.mjs .cache/credits-phase-b2-subpath https://tanimachi-bdsongs.com /bandori-song-atlas/ | 成功 / ../../../.cache/b2-subpath-seo-final.log              |
| pnpm dlx wrangler@4.143.0 pages functions build functions --outdir .cache/credits-phase-b2-functions               | 成功 / ../../../.cache/b2-functions.log                      |
| git diff --check                                                                                                   | 成功 / ../../../.cache/b2-git-diff-check.log                 |

## 画面検証

Creator detail: 390×844でscrollWidth375、1280×900で1265。Song detail: 同じ2実幅で375/1265。横overflowなし。OurNotes filterで織田の作詞2作品、編曲0作品に一部登録説明を併記。

[Creator mobile](../../../.cache/credits-phase-b2-ui/detail-390.png)、[Song mobile](../../../.cache/credits-phase-b2-ui/song-390.png)、[Creator desktop](../../../.cache/credits-phase-b2-ui/detail-desktop.png)、[Song desktop](../../../.cache/credits-phase-b2-ui/song-desktop.png)、[Creator admin保存](../../../.cache/credits-phase-b2-ui/admin-saved.png)。一時証拠は.cache内で、公開buildには入らない。

## migrationの実行記録と追加照合

[apply script](../../../scripts/migrations/apply-credits-phase-b2.mjs)は plan / apply / verify を提供。apply前のdry planは新30・既存91維持・L615 / GParr700 / Ourarr2・Composer correction4・追加担当別override712。除外はPROBABLE token0、UNRESOLVED token510（出現単位）、metadata3主体/14 record-role、split54原文担当群（65収録担当）。採番・slug・version/nextId・record game/ID/title/workIdと4source SHAを照合し、CONFLICTがあれば適用を拒否する。

3変更fileの実backupは.cache/credits-phase-b2-1791028035906でmanifest/入力SHA一致。2回目実applyはunchanged=true、changedFiles0。詳細は[apply-plan](apply-plan.json)、[実適用](applied-relations.json)、[scope QA](scope-verification.json)。scope QAは全121×2ゲーム×3担当=726filter条件のWork集合を現行recordsから独立計算して不一致0、公開JSON20fileのresearch field0、全alias/role重複0、non-CONFIRMED addRole拒否・全record scope一致を確認。

human-review JSONは当初からexplicit-user-reviewとして記録したが、最終照合時にroot sourceType=human-reviewを補足した。その注記だけでeffective/開始時planを再生成したため、初回applyの論理package SHA d34a2cd669744a47c3f0d52c1dce3eb2c9fa0b0b45d9cfb9a4593b9bf172c360から現在の98b8198df1e2461100f6d62e12bfe0fc8a7f752ff86165f06e33725abc45a3daへ変更。全output SHA/relations/display比較は初回applyから完全一致で、公開4sourceに再書込はない。B1 package/全provenanceは不変。

適用後のCLI planはdry-run結果のみを表示し、初回の比較資料を上書きしない。B2追加35テストは現行4sourceと初回plan/coverage/display-comparison等のSHAが再実行後も同一であることを検証している。
