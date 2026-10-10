# P2 人間確認回答の反映・検証

状態：ローカル適用完了。公開・本番検証は後述。

入力原本はinput.txt、追加回答はclarification.json、開始時点はbefore.json.gz/baseline.json、先行14更新はremote-inputs.json.gz/remote-integration.jsonへ保存。現在のWork825・全887収録を保持し、P2の承認済み担当欄だけ変更する。

開始HEADは7f16715、先行更新取込HEADは653455ad8ba752a47c53283f49b5925b7d4880f8。配信日・BPM・演奏時間・譜面・revisionと管理更新日時をremote値で保持。Odd Diceの新しいraw3担当も保持し、人物同定は行わない。

## 元P2 481taskの対応

|分類|解決|identity依存|追加人間確認|
|---|---:|---:|---:|
|ROLE_REVIEW|46|22|0|
|SPLIT_REVIEW|53|0|0|
|CREATOR_IDENTITY|131|0|0|
|CREATOR_REGISTRATION|131|0|0|
|CREDIT_COLLECTION|97|0|0|
|ALIAS_REVIEW|1|0|0|

元481件の対応漏れP2TaskUnmapped=0。詳細はTASK_CORRESPONDENCE.json。境界だけ解決した共同作者は、未同定の部分を別identity/registration/alias課題として保持。roleが確認済みでも全体のformal参加を確定できない22件はBLOCKED_BY_OTHER_IDENTITY。

引用符内の非空回答受理1417項目（テンプレートcurrentRaw/対象Creatorの文脈は除外）、原文収集100欄（元97＋新曲800の3担当）、candidate45群、個別同一性/formal回答131行、role/alias69行、split53行を解析。humanReviewDateは空欄のまま、reviewerはタニマチ。引用符異常4箇所のうちGRP/Revo/ZENTAは追加回答、GP212原文は同じ担当のB回答から採用。

## 件数

|項目|作業開始時|現行|
|---|---:|---:|
|Creator総数|126|169|
|nextId|127|170|
|ToDo対象曲|334|271|
|ToDo task|1314|935|
|Creator候補|344|334|
|作詞credit未収集|51|0|
|Garupa編曲credit未収集|49|0|
|OurNotes編曲credit未収集|1|0|
|split未解決|53|1|
|unmappedCurrentUnresolved|0|0|

formal relation増加：作詞81・作曲63・編曲30（record+Creator+role単位）。GAME_VERSION_REVIEWは39件を保持。元台帳は885収録/1305task/343候補で古いため、before比較は実際の開始887収録/1314task/344候補を用いた。先行更新も現行件数へ含む。

新規Creator登録43人、次の固定IDを採番。既存Creatorのメタデータ・旧slugは変更0。

|ID|標準名|slug|type|aliases|
|---|---|---|---|---|
|cr-0127|Fukase|fukase|person|[]|
|cr-0128|冬真|touma|person|[]|
|cr-0129|ACAね|acane|person|[]|
|cr-0130|DJ松永|dj-matsunaga|person|["松永邦彦"]|
|cr-0131|meg rock|meg-rock|person|["日向めぐみ"]|
|cr-0132|miwa|miwa|person|[]|
|cr-0133|OSTER project|oster-project|unit|[]|
|cr-0134|Shin Sakiura|shin-sakiura|person|[]|
|cr-0135|TAKESHI ASAKAWA|takeshi-asakawa|person|["TAKE"]|
|cr-0136|TAKU INOUE|taku-inoue|person|["井上拓"]|
|cr-0137|ZAQ|zaq|person|[]|
|cr-0138|アイナ・ジ・エンド|aina-the-end|person|[]|
|cr-0139|うらん|uran|person|["rino"]|
|cr-0140|こだまさおり|saori-codama|person|[]|
|cr-0141|こっちのけんと|kocchi-no-kento|person|["菅生健人"]|
|cr-0142|コレサワ|koresawa|person|[]|
|cr-0143|シノダ|shinoda|person|[]|
|cr-0144|じん|jin|person|["自然の敵P"]|
|cr-0145|ツミキ|tsumiki|person|[]|
|cr-0146|つんく|tsunku|person|[]|
|cr-0147|なとり|natori|person|[]|
|cr-0148|ナナホシ管弦楽団|nanahoshi-kangengakudan|person|["岩見陸"]|
|cr-0149|ナノ|nano|person|[]|
|cr-0150|バルーン|balloon|person|["須田景凪"]|
|cr-0151|ヒゲドライバー|hige-driver|person|[]|
|cr-0152|メガテラ・ゼロ|megater-zero|person|[]|
|cr-0153|井上秋緒|akio-inoue|person|[]|
|cr-0154|加藤祐介|yusuke-kato|person|[]|
|cr-0155|古屋真|shin-furuya|person|[]|
|cr-0156|山口一郎|ichiro-yamaguchi|person|[]|
|cr-0157|森月キャス|kyasu-morizuki|person|[]|
|cr-0158|星街すいせい|suisei-hosimati|person|[]|
|cr-0159|千綿偉功|hidenori-chiwata|person|[]|
|cr-0160|太田雅友|masatomo-ota|person|[]|
|cr-0161|大久保薫|kaoru-okubo|person|[]|
|cr-0162|谷口鮪|maguro-taniguchi|person|[]|
|cr-0163|田邊駿一|shunichi-tanabe|person|[]|
|cr-0164|渡辺徹|toru-watanabe|person|[]|
|cr-0165|藤林聖子|shoko-fujibayashi|person|[]|
|cr-0166|GRP|grp|person|[]|
|cr-0167|Reol|reol|person|[]|
|cr-0168|Revo|revo|person|[]|
|cr-0169|ZENTA|zenta|person|["土橋善太"]|

岩見陸（b1-8e00fe4d903f403579aa）は、追加回答によりナナホシ管弦楽団（b1-1d4523c52c9646f14a3b）と同じ固定Creatorへ統合。標準名・slugはナナホシ管弦楽団/nanahoshi-kangengakudan、alias岩見陸を採用。Reolはperson、ユニット名義の備考はOSTER projectへ移した。Revoのreading/sortKeyは追加回答の文字列「れう゛ぉ」を保存し、別Unicode表記へ勝手に置換しない。所属なし・根拠なしは明示人間回答としてreviewに保存。

## 残件

- identity未解決：P3等の未確認人物はsplit回答だけでは登録・同定しない。原文だけ判明したFukase追加作詞/谷口鮪追加作詞なども、個別scope承認のない箇所へ自動展開しない。
- OurNotes46編曲は元P2 481taskのsplit回答対象外で、現在の1件のsplit課題として保持。

新たな候補44群（現在の独立tokenとして生じたものも含む）。候補はidentity確定ではない。
- b1-db9dc93abeb28da7e46e: 織田あすか
- cr-0011: 近藤世真
- cr-0009: 竹田祐介
- cr-0010: 笠井雄太
- cr-0007: 岩橋星実
- cr-0020: 日高勇輝
- cr-0012: 堀川大翼
- cr-0022: Diggy-MO’
- cr-0070: THE SPELLBOUND
- cr-0008: 藤間仁
- cr-0024: 藤原聡
- cr-0078: atsuko
- current-dac92014ff66f3f49be9: Carlos K.
- cr-0059: Fear, and Loathing in Las Vegas
- current-8935eb59174b09438a34: FUNKY MONKEY BABYS
- current-035c8b7c5a228c9ba174: KANATA OKAJIMA
- current-543af9140a4b47b523ef: KEIGO HAYASHI
- current-37249a393f31fc1ee38b: KOHSHI ASAKAWA
- current-48cf41bc4a884dbef89d: kz
- current-297f7f25cc446332fd44: MK-METAL
- current-96bc57add1c48e4f0934: n-buna
- cr-0068: YUI
- current-fc6cae540d69a28f9520: アザミ
- current-ff0fe7f9b0981226cf85: きただにひろし
- cr-0016: トミタカズキ
- b1-065e0e070ab40a39c5e1: ハルイチ
- current-c0d947c79a5463c9cdfd: ふるっぺ・森さん・Litz
- current-42b1569d3f9a29bde9fb: 加賀爪 タッド
- cr-0006: 菊田大介
- current-391dd0c6d7a0f40365a0: 工藤大輝 / 花村想太 / MEG.ME
- current-979592585b3a81b9b2ea: 山崎あおい
- current-7a26a6c255e970242564: 秋元 康
- cr-0076: 秋田ひろむ
- current-75e8a5b4665b0fbb7f5e: 松任谷　由実
- cr-0047: 水野良樹
- b1-706dfa00eb1eedda8c38: 中村航
- current-0e351cf7f749f04bc27f: 都丸椋太（Elements Garden）
- current-334fc89b4af944671a1d: 都丸椋太（Elements Garden）
- current-a13640d86a7693717949: 都丸椋太（Elements Garden）
- current-b7ce5703d9eac3544358: 都丸椋太（Elements Garden）
- cr-0033: 藤井健太郎
- cr-0005: 藤永龍太郎
- current-1714adb574697fbc6b55: 米米CLUB
- cr-0048: 片倉三起也

## 検証と再現

- 43追加CreatorのID/current slug/previous slug名前空間、type、全887のCreator/Work参照とrole構造を検査。重複・dangling0。
- 原文/括弧/区切り/空白は担当別displayOverridesとcreditDisplayから全文再現。所属組織を別参加者として追加しない。P0/P1の既存formal役割と加納望10件を保持。Work identity・非担当fieldは最新remoteデータと一致。
- 同じ保存回答の再applyで全dataファイルの変更0。saved reviewとimmutable snapshotから全dataを再現（GitのCRLF/LF filterのみ正規化）。
- 対象P2 test8、旧ToDo/P0/神崎31、加納望P1 10、canonical pnpm test273（205+35+24+9）を検証。最新実行結果と未完了はWORK_LOG/verification.jsonに記録。
- root/subpath build800/87、SEO1065ページ/887詳細、全169CreatorページのWork/収録数とP1加納望10/10/編曲10を検査。Functions wrangler4.143.0 compile成功。

## 失敗・対処

- 初期のtoken前後空白・既存formal Creatorを含む共同欄・途中plan更新guard・B1全体候補の分割監査でassert失敗を検出し、原文を変えずscope照合/保全/保存採番/部分候補への対応を修正。
- 旧31review testの初回はROLE抑制がP0へ波及したため失敗。P2だけへ限定し、同じ旧assertを保った隔離回帰31/31成功。
- Prettier依存読取EPERMは承認付き実行で解消。既登録2人のmetadata矛盾はguardで検出し、早期の同名slug再利用を撤回して該当2収録のformal適用を保留し、後の明示回答「はい、既存Creatorを使う」で既存IDを利用して反映した。
- remote入力取得の初回git showはNode既定buffer不足ENOBUFS。128MiBへ増加し、SHAで固定したsnapshotを取得。不存在guard補助ファイル読取とパッチの古い文脈2回は補助失敗で、製品反映なし。

## commit / push / deploy

ユーザーの追加指示により、全情報反映と検証が終了した後に実施する。追加回答により大橋卓弥cr-0073・常田真太郎cr-0072を再利用し、Garupa153/416作詞を反映した。全検証終了後に今回のcommit/push/deployを実施する。remote既存deployの成功を今回の公開成功とは扱わない。
