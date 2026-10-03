# Creator DB 第2フェーズ実装報告

2026-10-02。第1フェーズの変更に追加したローカル実装・検証の報告です。commit・push・本番GitHubへの保存は実施していません。移行した実データと、ブラウザー用メモリー内fixtureは分離しています。

## UI

1. **未整備表示**：作詞・編曲を数値0で表示せず、詳細に「未整備」と表示。サイト全体の担当データが未整備であり、その人が担当していない意味ではないと説明します。
2. **一覧の構成**：名前・種別・参加楽曲数・作曲曲数。作詞/編曲の数値列と並べ替えは現時点では表示しません。参加楽曲数はunique Work単位です。
3. **詳細の構成**：参加楽曲数・収録件数・作詞（未整備）・作曲（数値）・編曲（未整備）。Elements Gardenの整備済み作曲0と、未整備の作詞/編曲を区別します。
4. **role filter**：「すべて」「作曲」のみ。古い`?role=lyricist`/`arranger`は担当で絞らず「データ整備中」の説明を表示し、game条件は維持します。単に0作品にはしません。実ブラウザーで旧作詞URL、作曲/game、戻る・進む、canonicalを確認しました。
5. **将来の切替**：`data/creators.json`のdataset全体の`roleCoverage`を変更してbuild。`lyricist`/`arranger`を十分に整備した時に`unprepared`→`ready`へ変更すると、列・集計・並べ替え・filterが共通設定から切り替わります。個人単位の登録有無では判定しません。全roleをreadyにしたrenderテストも成功しています。

## Work

6. **ちゅ、多様性。**：`wk-0594`のガルパ603/アワーノーツ80で、真部 脩一/真部脩一を確認済み`cr-0003`へ対応。旧表示はoverrideで保持。Creator全体で2作品/3収録です。
7. **春日影**：`wk-0635`のガルパ646/アワーノーツ7・79で、藤田淳平の括弧違いを確認済み`cr-0004`へ対応。旧表示はoverrideで保持。Creator全体で51作品/55収録です。
8. **warning残数**：0。2Workの`reviewRequired`/`reviewReason`を解消し、`creditReview`へ確認済みIDを根拠とする解決を記録。同一roleのID集合が同じなら確定override差は正常です。異なるID集合・未同定tokenの表示差は今後もwarningにし、異なるIDの回帰テストも成功しています。
9. **構造維持**：ガルパ799＋アワーノーツ85＝884収録、823 Work。Creator同定によるWorkの再採番・統合・分割なし。上松範康は59作品/66収録、Elements Gardenは0作品/0収録で、所属を参加として加算していません。

## 実ブラウザー

10. **Creator管理15項目**：`/admin/creators/`を開く、GitHub接続UI（ローカルmock）、一覧、alias検索、新規フォーム、name/sortKey/slug/type/aliases入力、ID readonly、編集保存、未参照削除、参照中削除拒否、ページ内削除確認・取消を実操作。新規→再取得→編集→再取得→削除を確認しました。
11. **楽曲管理11項目**：fixtureの既存ガルパ曲を開く、Creator検索・選択、composer設定、2Creator設定、順序変更、displayOverride入力、draft reload保持、既存Work選択、新規Work選択、全フォームが有効な保存直前状態を実確認。同Creatorを編曲にも追加し、overrideがrole間で共有されることも確認しました。
12. **実保存の範囲**：Creator新規・編集・削除と楽曲保存を、実フォーム操作からローカルmock GitHub APIへ実行。楽曲のmock commitは`saved-4`。下書きのない別オリジン（localhost）で接続・再取得し、Creator順序、担当、override、既存Workが同値でした。実GitHub、本番branch、公開サービスへの保存ではありません。入力直後にblurせずreloadした下書きも保持。発見した入力保持の問題を`oninput`更新へ修正して再検証しました。
13. **削除拒否**：参照中fixture Creatorを削除しようとし、「1曲・1収録」の参照数付き拒否を実確認。未参照Creatorの削除は成功、取消では一覧を維持しました。
14. **検証種別と未確認**：要求された管理26項目は実ブラウザーで確認済み。公開一覧/詳細は320・390・768・1024・1440pxの実幅、横はみ出しなし。公開alias検索・作曲数並べ替えも実確認。管理画面は実1280pxのみ（他tabへのviewport設定は反映されず、管理5幅確認済みとは扱いません）。APIテストはSHA競合・失われた応答・原子的保存・新Work生成・OurNotes保存等、DOMイベントテストはpickerの両方向順序・復元・担当追加等を補強。実ブラウザーで新Workを保存して生成する操作、OurNotesの同じ保存一連操作、実GitHub競合、本番デプロイ・反映は未確認。mockで既存Work保存を検証し、新規Workは選択までです。公開/管理2画面のconsole warn/errorは0。証拠は`reports/creator-phase2-{delete-refusal,song-refetched,mobile,desktop}.png`（ローカル、Git対象外）。作成タブを閉じ、viewportをリセットしました。

## Creator同定

15. **作業前**：未同定341旧raw表記。元全体は342種類で、前回確認済み上松の1種類を含みます。
16. **AUTO_RESOLVED**：作業後の旧rawは5種類（前回1＋今回4）。分割名前tokenの候補群では3群（上松・真部・藤田）。Creator masterの4主体とは単位が異なり、単独Elements Gardenの旧rawは0件です。
17. **新規Creator**：2主体追加、master総数4。`cr-0003`真部脩一、`cr-0004`藤田淳平。既存IDは維持し、次IDは5。標準名は元表記、typeは人間確認された個人。読み/英字氏名を推測せず、sortKeyは元綴と`sortKeyStatus:provisional-original`、slugは`creator-0003`/`creator-0004`です。
18. **解決した旧表記**：4種類。真部の空白あり/なし2種類、藤田の括弧形式2種類。58収録のtokenを確定IDへ対応。未同定rawは341→337です。
19. **REVIEW_RECOMMENDED**：旧raw108種類。候補群では70群。確認前にmaster/relationへ反映していません。
20. **UNRESOLVED**：旧raw229種類。候補群では250群。未同定総数は108＋229＝337種類。候補群323はA0/B28/C45/D250で、元rawと分割単位が異なります。実データAは0ですが、所属あり/なしのA分類をsyntheticテストで確認しています。
21. **根拠**：既存`creator-map.json`の上松/Elements Garden明示対応、今回のユーザー仕様8で確認された真部/藤田の同一人物判断、明示mapの完全一致のみ。外部人物調査・プロフィール収集なし。候補一覧は既存legacy/credit-reportと収録IDから作成し、各群に表記・role・収録数・Work数・ゲーム・候補標準名/aliases/type/sortKey/slug・確度・根拠・状態・出典レコードを記載。未確認type/読み/slugはnull、出現数の多い順です。
22. **推測統合なし**：NFKC・空白・括弧・記号・所属差は候補提示専用。applyは候補JSONを読まず、明示mapだけを適用します。REVIEW/UNRESOLVEDが勝手にAUTOへ変わらないテストを追加。未同定名は旧表示と従来検索へfallbackします。

## migration / tests

23. **表示比較**：全884収録×3role＝2,652旧表示比較が一致。旧composer等を失わず、IDからのリンクとoverrideで表示を維持しています。
24. **migration verify**：Creator4、収録884、Work823、比較2652、warningsなし。適用前backup/hash/変更token manifestを`.cache/creator-phase2-1790938606387/`に保存。再applyでmaster/Work/両songsの内容が不変、候補reportの再生成も決定的です。
25. **全テスト**：145件成功、失敗/skipなし。サブパスでも145件成功。roleCoverage・既知2ID・warning・安全適用・候補分類・再実行の4テスト追加、picker inputイベントの保持を補強。初回の1件失敗は「最初にcreditのある曲が上松」とする旧テスト仮定を対象ID選択へ修正し、再実行成功しました。
26. **build**：ルート・サブパス`/bandori-song-atlas/`のbuildがそれぞれ終了0。最終distは整形後ソースからのルート生成物です。distは直接編集せずbuildのみで生成しています。
27. **SEO**：ルート・サブパスとも897正規ページ、884楽曲詳細（799/85）、797互換転送、897一意titleの監査成功。Creator基本canonicalとquery履歴の実ブラウザー確認も成功。ルート最終監査も終了0です。
28. **Functions compile**：既存Wrangler 4.143.0で`pages functions build functions --outdir .cache/creator-phase2-functions`成功、終了0。問い合わせFunctionsを公開せずローカルcompileしました。依存の追加・インストールなし。
29. **Git差分**：元HEADとの両games deep compareで、新規`workId`/`credits`/`creditDisplay`を除く全旧項目・groups・順序が一致。テストCreatorはメモリーのみ。ステージ差分なし、既存第1フェーズ変更を保持。変更33 JavaScript moduleのnode --checkとgit diff --check成功。Prettier整形成功、最終check成功。

## 公開判断

30. **push判断**：今回指定された公開前条件（未整備表示・既知2Work・管理26項目・表示互換・推測統合禁止・全テスト・build・SEO）を満たし、本番push可能なローカル状態と判断します。今回まず報告し、commit/pushは行いません。未同定337種類自体は旧表示fallbackがあるため今回の公開阻害条件ではありません。
31. **人間確認候補**：[creator-review.md](migrations/creators-2026-10-02/creator-review.md)と[JSON](migrations/creators-2026-10-02/creator-review.json)参照。例：藤永44収録、菊田33、岩橋32、藤間27、都丸の括弧2形式26。いずれも主体/type/読み/slugを確認してから明示mapへ登録します。今回これらを登録せず公開する場合、事前同定は必須ではありません。
32. **残るリスク**：未同定表記と新2Creatorの暫定sortKey/slugは継続確認対象。公開後のslug変更は転送を自動作成しないためURL移行を別途検討。実本番保存・デプロイは未検証、公開時はリモート先行変更・SHA・同HEADのCI/deployと本番画面を再確認してください。管理のモバイル幅、新Work/OurNotes一連保存はブラウザー未確認で、対応するAPI/DOMテストの成功と区別します。
