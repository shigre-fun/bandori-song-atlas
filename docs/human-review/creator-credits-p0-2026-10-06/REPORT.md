# P0人間回答の適用・検証結果

OurNotesの編曲81曲と「過去を喰らう」(86)の作詞、計82担当を、回答の空白・記号・括弧・所属表記を保持して反映しました。既存Creator **124件 / nextId 125**、Work **823件**、ガルパ799曲・OurNotes86曲、表示順を保持しています。今回の変更はローカルに保存済みです。commit・push・deployは行っていません。

## 適用と保全

- 製品データの差分は `data/ournotes/songs.json` の回答対象81曲に限定。作詞1担当・編曲81担当、credits・creditDisplayを構造位置で編集（226 value edits）。個々の編曲者71参照を承認済みの既存name/aliasへ対応しました。71は曲数ではありません。新規Creator登録は0件です。
- Creator master、Work、ガルパ全データ、OurNotes admin-stateは開始時とSHA-256が完全一致。他の担当の表示・参照、non-credit field、曲順・グループ順・更新情報の変更は0件。「夢我夢中」のdurationSeconds=102も保持。
- 開始時データは旧台帳の生成SHAと一致していました。record ID・title・workIdを照合したfield patchを適用し、同じ回答の再適用は変更0件です。A/B1の452原資料と、旧台帳7ファイルのbefore snapshotをbyte単位で保全しました。
- 回答者は「タニマチ」。未記入のhumanReviewDateはnullのまま保存しています。receivedAtは処理の受領時刻であり、人間が申告した確認日ではありません。

[回答原本](input.txt) / [解析・同定判断](review.json) / [適用receipt](applied.json) / [開始時SHA](baseline.json) / [検証済みbefore snapshot](before.json.gz)

## 残した人間確認

カンザキイオリの指定5担当の同一性「はい」と、標準名・読み・sortKey・slug・person・aliases=[]・既存IDなしを保存しました。B節の**全欄が揃った場合のみ正式登録**という条件に従い、未回答の **affiliation / 根拠URL・資料 / 備考** を補完せず、正式Creator化とrelation化を保留しています。指定5担当のidentity taskは解決として除外し、登録不足欄を残しました。OurNotes:86の作詞rawは適用済みですが、作詞の同一性は指定5scopeに含まれないため追加のidentity taskを残しています。

発売版との編曲関係は42件を確認済みとして更新し、39件をGAME_VERSION_REVIEWに残しました。Mela! (75)の名義変更確認は人物の同一性、革命道中 (78)の「牧野太洋が正しい」は担当者訂正として記録し、編曲自体の同一性を推測していません。rawとformal relationが解決した曲にも未回答の版関係taskを残しています。

今回の未同定raw表記は20種類：「カンザキイオリ」、「尾崎豪（SUPA LOVE）」、「横地健太(SUPA LOVE)」、「槙島隆人（SUPA LOVE）」、「角本麻衣（SUPA LOVE）」、「UYKADO」、「eba」、「Nor」、「園田健太郎」、「哥丸雄貴」、「千石ユノ」、「高村風太」、「DjeDje」、「KENSEI」、「三村一輝」、「石倉まろ」、「牧野太洋」、「加藤貴之」、「ケンモチヒデフミ」、「Skye K」。これらは人間のidentity/registration ToDoへ反映しています。「槙島隆人（SUPA LOVE）」を、既存の「槇島隆人」へ推測で統合していません。未回答のmetadataや発売版参考から新規登録・ゲーム担当を補完していません。

## 台帳と旧taskId

[更新手順](../../todo/creator-credit-human-review/README.md) / [曲別完全台帳](../../todo/creator-credit-human-review/HUMAN_TODO_BY_SONG.md) / [Creator候補別完全台帳](../../todo/creator-credit-human-review/HUMAN_TODO_BY_CREATOR.md) / [台帳検証](../../todo/creator-credit-human-review/HUMAN_TODO_VERIFICATION.json)

| 項目 | 適用前 | 適用後 |
| --- | ---: | ---: |
| 対象曲の行数 | 368 | 340 |
| 曲task | 1435 | 1353 |
| Creator候補 | 353 | 346 |
| OurNotes編曲未収集 | 81 | 0 |
| 作詞未収集 | 50 | 49 |
| Garupa編曲未収集 | 48 | 48 |
| 現行未解決record/role | 668 | 611 |
| 現行未解決の対応漏れ | 0 | 0 |

[旧taskId対応表](P0_TASK_CORRESPONDENCE.json)は旧全3432taskを保持し、P0全142taskを新しい残課題または解決根拠へ対応しています。ゲーム原文82件、指定identity5件の解決を明示し、未登録人物や未回答versionを完了扱いにしていません。JSONとMarkdownの曲名・band・Work・task相互参照、独立した現行role走査、452保護SHAを検証しました。

## 検証と最終差分

| 検証 | 結果 | 保存ログ |
| --- | --- | --- |
| 既存 `pnpm test` | 198+35+24+7=264成功、失敗0 | [既存テスト](validation/p0-existing-tests.txt) |
| 旧台帳10 + P0/復旧保護11 | 21成功、失敗0（総計285） | [台帳・P0テスト](validation/p0-todo-tests-complete.txt) |
| root build | 799/86曲・797旧URL | [root build](validation/p0-root-build.txt) |
| root SEO | 1018ページ / 885詳細 / 18 Creator redirect | [root SEO](validation/p0-root-seo.txt) |
| /bandori-song-atlas/ build・SEO | 同じ件数、配置URL整合 | [subpath build](validation/p0-subpath-build.txt) / [subpath SEO](validation/p0-subpath-seo.txt) |
| Functions | Wrangler4.143.0でcompile成功 | [Functions](validation/p0-functions.txt) |
| 再apply | alreadyApplied=true、変更0 | [再apply](validation/p0-reapply.txt) |
| 台帳verify | unmappedCurrentUnresolved=0 | [台帳verify](validation/p0-ledger-verify.txt) |

[最終検証JSON](verification.json)にsource前後SHA、protected452、HEAD、旧taskId対応、両buildの公開catalogと82 raw表示の一致を保存しています。既存固定テストのassertは保持し、旧台帳10assertはbyte検証済みbefore入力、今回の現行データは追加テストで検証しました。git diff --checkと対象4 source/testのformat checkはすべて成功しました。

追跡対象の差分はWORK_LOG.mdとdata/ournotes/songs.json。追加成果物は本human-review一式、完全ToDo7ファイル、`scripts/migrations/creator-credit-p0-review.mjs`、`scripts/research/creator-credit-human-todo.mjs`、`tests/research/creator-credit-human-todo.test.mjs`、`tests/research/creator-credit-p0-review.test.mjs`です。既存製品UI・build設定・package/lock・原資料に変更はありません。distは通常buildで生成しています。data/ournotes/songs.jsonのgit diff --numstatは1212行追加・276行削除（構造内のcredits/display追記を含む）です。HEADは `a98f9bf4f2735e07f2c144cb7d3cf26dc4109f5c` のまま、indexは空です。

途中の補助失敗：Windows literal globのrgはos123、存在しないdata配下/テスト仮名の読取はos2/不存在となり、実体検索で訂正。専用テスト初回18/19は欠落検知の先行例外と期待regexの不一致を修正。generate中のBY_CREATOR.md openがUNKNOWNで失敗し部分生成が残ったため、旧SHA保護が次の再生成を拒否（2回目18/19）。旧証拠SHAまたは正確な再計算byteのみ許す復旧を追加し、任意の編集・人間回答を依然拒否するmutation testを含め最終21/21成功。UNKNOWNの原因は未確定です。既知sandbox EPERMは対象限定の承認実行で解消、承認拒否はありません。最終報告用の補助writerでテンプレート引用符のSyntaxErrorを検出し、引用符を修正して独立auditに成功。format checkのsandbox EPERMも限定した読取実行で成功しました。製品データの追加編集はありません。

今回のゲーム画面・一次資料は提供された人間回答を根拠としており、Codexが新たに実ゲームを観察したものではありません。本番への反映と本番UI確認は未実施です。以降の適用では最新のsource SHAと回答を照合してください。

## 全回答の適用対応

ゲームrawを左列、formal Creatorの対応と未解決versionを右列で確認できます。主体の列は候補を正式登録した意味ではありません。

| OurNotes ID | 曲名 | 担当 | 保存したゲームraw | 既存ID / 残課題 | 発売版との編曲関係 |
| ---: | --- | --- | --- | --- | --- |
| 1 | 迷星叫 | 編曲 | 長谷川大介(SUPA LOVE) | 長谷川大介(SUPA LOVE) → cr-0013 | 未解決 |
| 2 | 壱雫空 | 編曲 | hisakuni(SUPA LOVE) | hisakuni(SUPA LOVE) → cr-0018 | 未解決 |
| 3 | 碧天伴走 | 編曲 | 木下龍平(SUPA LOVE) | 木下龍平(SUPA LOVE) → cr-0015 | 同一編曲と確認 |
| 4 | 影色舞 | 編曲 | 木下龍平(SUPA LOVE) | 木下龍平(SUPA LOVE) → cr-0015 | 未解決 |
| 5 | 潜在表明 | 編曲 | 鈴木裕明(SUPA LOVE) | 鈴木裕明(SUPA LOVE) → cr-0046 | 未解決 |
| 6 | 音一会 | 編曲 | 尾崎豪（SUPA LOVE） | 尾崎豪（SUPA LOVE） → 同定/登録待ち | 未解決 |
| 7 | 春日影（MyGO!!!!! ver.） | 編曲 | 藤田淳平（Elements Garden） | 藤田淳平（Elements Garden） → cr-0004 | 未解決 |
| 8 | 詩超絆 | 編曲 | 横地健太(SUPA LOVE) | 横地健太(SUPA LOVE) → 同定/登録待ち | 同一編曲と確認 |
| 9 | 迷路日々 | 編曲 | 松坂康司(SUPA LOVE) | 松坂康司(SUPA LOVE) → cr-0014 | 同一編曲と確認 |
| 10 | 無路矢 | 編曲 | 庄司夏葵（SUPA LOVE） | 庄司夏葵（SUPA LOVE） → cr-0089 | 未解決 |
| 11 | 名無声 | 編曲 | 金崎真士(SUPA LOVE) | 金崎真士(SUPA LOVE) → cr-0045 | 未解決 |
| 12 | 歩拾道 | 編曲 | 庄司夏葵(SUPA LOVE) | 庄司夏葵(SUPA LOVE) → cr-0089 | 同一編曲と確認 |
| 13 | 端程山 | 編曲 | トミタカズキ(SUPA LOVE) | トミタカズキ(SUPA LOVE) → cr-0016 | 未解決 |
| 14 | 砂寸奏 | 編曲 | 槙島隆人（SUPA LOVE） | 槙島隆人（SUPA LOVE） → 同定/登録待ち | 未解決 |
| 15 | 焚音打 | 編曲 | 長谷川大介(SUPA LOVE) | 長谷川大介(SUPA LOVE) → cr-0013 | 未解決 |
| 16 | 聿日箋秋 | 編曲 | トミタカズキ(SUPA LOVE) | トミタカズキ(SUPA LOVE) → cr-0016 | 同一編曲と確認 |
| 17 | 証命讃歌 | 編曲 | 高橋涼（SUPA LOVE） | 高橋涼（SUPA LOVE） → cr-0038 | 同一編曲と確認 |
| 18 | 往欄印 | 編曲 | 長谷川大介(SUPA LOVE) | 長谷川大介(SUPA LOVE) → cr-0013 | 未解決 |
| 19 | ないものねだり | 編曲 | 植木建象、神田ジョン(from PENGUIN RESEARCH) | 植木建象 → cr-0098 / 神田ジョン(from PENGUIN RESEARCH) → cr-0103 | 未解決 |
| 20 | シャルル | 編曲 | 植木建象、神田ジョン(from PENGUIN RESEARCH) | 植木建象 → cr-0098 / 神田ジョン(from PENGUIN RESEARCH) → cr-0103 | 未解決 |
| 22 | ホワイトノイズ | 編曲 | 小木岳司 | 小木岳司 → cr-0101 | 未解決 |
| 23 | Ave Mujica | 編曲 | 藤間仁（Elements Garden） | 藤間仁（Elements Garden） → cr-0008 | 未解決 |
| 24 | KiLLKiSS | 編曲 | 長谷川大介(SUPA LOVE) | 長谷川大介(SUPA LOVE) → cr-0013 | 同一編曲と確認 |
| 25 | Imprisoned XII | 編曲 | 松坂康司(SUPA LOVE) | 松坂康司(SUPA LOVE) → cr-0014 | 同一編曲と確認 |
| 26 | Crucifix X | 編曲 | o-saka(SUPA LOVE) | o-saka(SUPA LOVE) → cr-0124 | 同一編曲と確認 |
| 27 | 八芒星ダンス | 編曲 | あらケン(SUPA LOVE) | あらケン(SUPA LOVE) → cr-0017 | 未解決 |
| 28 | 顔 | 編曲 | 木下龍平(SUPA LOVE) | 木下龍平(SUPA LOVE) → cr-0015 | 同一編曲と確認 |
| 29 | 天球(そら)のMúsica | 編曲 | 高橋涼(SUPA LOVE) | 高橋涼(SUPA LOVE) → cr-0038 | 同一編曲と確認 |
| 30 | Symbol I : △ | 編曲 | 長谷川大介(SUPA LOVE) | 長谷川大介(SUPA LOVE) → cr-0013 | 同一編曲と確認 |
| 31 | Symbol II : Air | 編曲 | 高橋涼(SUPA LOVE) | 高橋涼(SUPA LOVE) → cr-0038 | 同一編曲と確認 |
| 32 | Symbol III : ▽ | 編曲 | トミタカズキ(SUPA LOVE) | トミタカズキ(SUPA LOVE) → cr-0016 | 同一編曲と確認 |
| 33 | Symbol IV : Earth | 編曲 | 長谷川大介(SUPA LOVE) | 長谷川大介(SUPA LOVE) → cr-0013 | 同一編曲と確認 |
| 34 | Ether | 編曲 | 長谷川大介(SUPA LOVE) | 長谷川大介(SUPA LOVE) → cr-0013 | 同一編曲と確認 |
| 35 | 黒のバースデイ | 編曲 | 賀佐泰洋（SUPA LOVE） | 賀佐泰洋（SUPA LOVE） → cr-0044 | 未解決 |
| 36 | Choir ‘S’ Choir | 編曲 | 角本麻衣（SUPA LOVE） | 角本麻衣（SUPA LOVE） → 同定/登録待ち | 未解決 |
| 37 | Mas?uerade Rhapsody Re?uest | 編曲 | あらケン（SUPA LOVE） | あらケン（SUPA LOVE） → cr-0017 | 未解決 |
| 38 | 碧い瞳の中に | 編曲 | Diggy-MO'、松坂康司(SUPA LOVE) | Diggy-MO' → cr-0022 / 松坂康司(SUPA LOVE) → cr-0014 | 同一編曲と確認 |
| 39 | The Whole Blue World | 編曲 | Diggy-MO' | Diggy-MO' → cr-0022 | 未解決 |
| 41 | 堕天 | 編曲 | UYKADO | UYKADO → 同定/登録待ち | 未解決 |
| 42 | 暗黒天国 | 編曲 | UYKADO | UYKADO → 同定/登録待ち | 未解決 |
| 43 | KINGS | 編曲 | UYKADO | UYKADO → 同定/登録待ち | 未解決 |
| 44 | ✞animaるパーティ✞開催中✞ | 編曲 | 堀江晶太 | 堀江晶太 → cr-0028 | 未解決 |
| 45 | エンプティパペット | 編曲 | eba | eba → 同定/登録待ち | 同一編曲と確認 |
| 46 | 限界現実サバイブ天使 | 編曲 | Nor、堀江晶太 | Nor → 同定/登録待ち / 堀江晶太 → cr-0028 | 同一編曲と確認 |
| 47 | ビッグマウス | 編曲 | 堀江晶太、Nor | 堀江晶太 → cr-0028 / Nor → 同定/登録待ち | 同一編曲と確認 |
| 48 | 夢現妄想世界 | 編曲 | 園田健太郎 | 園田健太郎 → 同定/登録待ち | 同一編曲と確認 |
| 49 | コハク | 編曲 | 堀江晶太 | 堀江晶太 → cr-0028 | 同一編曲と確認 |
| 50 | これはぼくたちの生存のあらすじ | 編曲 | 堀江晶太 | 堀江晶太 → cr-0028 | 同一編曲と確認 |
| 51 | うちゅうのふしぎ | 編曲 | sabio | sabio → cr-0071 | 同一編曲と確認 |
| 52 | 真夜中遊園地 | 編曲 | 哥丸雄貴、堀江晶太 | 哥丸雄貴 → 同定/登録待ち / 堀江晶太 → cr-0028 | 同一編曲と確認 |
| 53 | チューニング | 編曲 | 堀江晶太、千石ユノ | 堀江晶太 → cr-0028 / 千石ユノ → 同定/登録待ち | 同一編曲と確認 |
| 54 | 超惑星Xへの旅 | 編曲 | TeddyLoid・堀江晶太 | TeddyLoid → cr-0031 / 堀江晶太 → cr-0028 | 未解決 |
| 55 | TearJerker | 編曲 | sabio | sabio → cr-0071 | 同一編曲と確認 |
| 56 | Face The Next | 編曲 | 白神真志朗、千石ユノ | 白神真志朗 → cr-0074 / 千石ユノ → 同定/登録待ち | 同一編曲と確認 |
| 57 | in my words | 編曲 | 白神真志朗 | 白神真志朗 → cr-0074 | 同一編曲と確認 |
| 58 | 愛は衝動 | 編曲 | sabio | sabio → cr-0071 | 同一編曲と確認 |
| 59 | 六兆年と一夜物語 | 編曲 | sabio/高村風太 | sabio → cr-0071 / 高村風太 → 同定/登録待ち | 未解決 |
| 60 | 唱 | 編曲 | DjeDje、KENSEI、三村一輝 | DjeDje → 同定/登録待ち / KENSEI → 同定/登録待ち / 三村一輝 → 同定/登録待ち | 同一編曲と確認 |
| 62 | UNDEAD | 編曲 | DjeDje、三村一輝 | DjeDje → 同定/登録待ち / 三村一輝 → 同定/登録待ち | 未解決 |
| 63 | 起死開戦 | 編曲 | 藤井健太郎 | 藤井健太郎 → cr-0033 | 同一編曲と確認 |
| 64 | everscape | 編曲 | 藤井健太郎 | 藤井健太郎 → cr-0033 | 同一編曲と確認 |
| 65 | 鳴らす | 編曲 | 藤井健太郎 | 藤井健太郎 → cr-0033 | 未解決 |
| 66 | カーネーションの咲く日に | 編曲 | 瀬名水紀(Dream Monster)、Aira | 瀬名水紀(Dream Monster) → cr-0090 / Aira → cr-0111 | 同一編曲と確認 |
| 67 | 青のすみか | 編曲 | 藤井健太郎 | 藤井健太郎 → cr-0033 | 同一編曲と確認 |
| 68 | Pretender | 編曲 | 石倉まろ | 石倉まろ → 同定/登録待ち | 未解決 |
| 69 | unravel | 編曲 | 藤井健太郎 | 藤井健太郎 → cr-0033 | 同一編曲と確認 |
| 71 | ホーミー・タイッ！！ | 編曲 | 藤井健太郎 | 藤井健太郎 → cr-0033 | 同一編曲と確認 |
| 72 | ジャイアント・キラー・チューン | 編曲 | 藤井健太郎 | 藤井健太郎 → cr-0033 | 同一編曲と確認 |
| 73 | ピースフル・ピーシーズ！ | 編曲 | 藤井健太郎 | 藤井健太郎 → cr-0033 | 未解決 |
| 74 | Keep on Riddim | 編曲 | 瀬名水紀(Dream Monster) | 瀬名水紀(Dream Monster) → cr-0090 | 同一編曲と確認 |
| 75 | Mela! | 編曲 | 石倉まろ | 石倉まろ → 同定/登録待ち | 未解決（回答：同一人物だが現在は石倉まろ名義のみを使用） |
| 76 | サムライハート(Some Like It Hot!!) | 編曲 | 藤井健太郎 | 藤井健太郎 → cr-0033 | 未解決 |
| 78 | 革命道中 | 編曲 | 牧野太洋 | 牧野太洋 → 同定/登録待ち | 未解決（回答：別の人物、牧野太洋が正しい） |
| 79 | 春日影 | 編曲 | 藤田淳平（Elements Garden） | 藤田淳平（Elements Garden） → cr-0004 | 未解決 |
| 80 | ちゅ、多様性。 | 編曲 | 白神真志朗 | 白神真志朗 → cr-0074 | 未解決 |
| 81 | 空に歌えば | 編曲 | 植木建象、神田ジョン(from PENGUIN RESEARCH) | 植木建象 → cr-0098 / 神田ジョン(from PENGUIN RESEARCH) → cr-0103 | 未解決 |
| 82 | Stellar Stellar | 編曲 | 牧野太洋 | 牧野太洋 → 同定/登録待ち | 同一編曲と確認 |
| 83 | ファタール | 編曲 | 植木建象、加藤貴之 | 植木建象 → cr-0098 / 加藤貴之 → 同定/登録待ち | 未解決 |
| 84 | 微笑みの爆弾 | 編曲 | 牧野太洋 | 牧野太洋 → 同定/登録待ち | 同一編曲と確認 |
| 85 | 夢我夢中 | 編曲 | ケンモチヒデフミ、Skye K | ケンモチヒデフミ → 同定/登録待ち / Skye K → 同定/登録待ち | 同一編曲と確認 |
| 86 | 過去を喰らう | 編曲 | 植木建象、神田ジョン（from PENGUIN RESEARCH） | 植木建象 → cr-0098 / 神田ジョン（from PENGUIN RESEARCH） → cr-0103 | 未解決 |
| 86 | 過去を喰らう | 作詞 | カンザキイオリ | カンザキイオリ → 同定/登録待ち | 対象外 |
