# 残375タスク 人間回答の反映・検証報告

状態：回答反映・全375対応・全検証完了。commit / push / deployは未実施。

## 入力と範囲

元テンプレートの基準HEADはf10fa7e、実行基準は33b9264055287392b2b73189c77d365f8a01915d。先行の管理編集1件と追加2曲（ガルパ801・アワーノーツ89）/Work828をfast-forwardで取り込んだ。以前のPHP調査の未コミット記録は保全。添付input.txt、追加回答clarification.json、全入力/元375/最新384/データ/過去review SHAはbefore.json.gzに保存。人間確認日は空欄のままnull、reviewerはタニマチ。出典種別は「人間による明示確認」で、URL・資料・確認日を捏造しない。

## 結果

|項目|結果|
|---|---:|
|受理ブロック|B83 / C37 / D39 / E3 / F1|
|元task回答・状態|375件すべてRESOLVED|
|B identity / registration|129 / 129|
|C完全一致自動|25件適用、不適用0|
|C人間確認|49件適用|
|Dゲーム／発売版の編曲関係|39件すべて同一と明示確認|
|E Odd Diceの担当・原文|作詞・作曲・編曲すべて現行raw「アザミ」で確認|
|F Nor・堀江晶太|承認順に別主体、既存堀江の関係保持|
|Creator新規|75|
|B既存ID再利用|2（cr-0061 / cr-0071）|
|B候補間の同一主体統合|10（3人分割内の参照3を含む）|
|Creator総数|371 → 446|
|nextId|372 → 447|
|対象record-role|203|
|新規formal relation|206|
|作詞追加|81|
|作曲追加|56|
|編曲追加|69|
|既存alias追加|3|
|元タスク|375 → 0|
|最新全タスク|384 → 6|
|曲別ToDo|元118曲 / 適用前最新119曲 → 1曲|
|候補数|123 → 1|
|P0P2Remaining375TaskUnmapped|0|
|unmappedCurrentUnresolved|0|

元375件はTASK_CORRESPONDENCE.jsonで一意に対応。PARTIALLY_RESOLVED / STILL_NEEDS_HUMAN / BLOCKED / STALEはすべて0。対象外の新曲OurNotes:89「アイライク・ユアライク」は作詞・作曲・編曲のALIAS_REVIEWとROLE_REVIEW各3件を残し、formal relationは0件のまま。人物登録によってID候補が得られたため登録タスク3件は不要となるが、その曲への担当承認を推測していない。

## 個別の判断

- KENSEIは追加回答で「唱」の活動名として正式登録を承認。重複していた石倉まろ／石倉誉之、米米CLUBはそれぞれ1件へ統合。
- ふるっぺ・森さん・Litz、工藤大輝／花村想太／MEG.MEは、単一主体ではないとの明示回答と3人分の登録情報に基づいて分割。複合名のCreatorを作らない。
- 高村風太は既存sabio cr-0071と同じ主体。「sabio/高村風太」を1つの表示aliasとして当該編曲へ保持、人数・roleの二重計上なし。既存reading/type等は保持。
- ナユタン星人は既存cr-0061を再利用。明示されたslug変更だけnayutalien → nayutan-seijinを適用し、nayutalienをpreviousSlugsへ保存。旧URLはbuildの転送対象。
- 松任谷由実のaliasesは追加回答の半角空白「松任谷 由実」を採用。原文の全角空白「松任谷　由実」はそのまま当該roleの表示overrideとして保持。
- 尾崎豪の空白付き「尾崎豪 (SUPA LOVE)」は現行データに0件。元の括弧2表記は保持し、過去の候補tokenや証拠は書換えない。
- 所属は登録主体と分離して回答記録に保存。Elements Garden / SUPA LOVE等を別作者として追加しない。

## 保全・再現性

全890曲×3担当=2670欄の表示原文、全非credit項目・group/top-level、全既存関係、全Work828、既存371Creatorのmetadataを保持（承認alias追加とcr-0061のslug履歴追加のみ例外）。実際の206追加が承認taskのID/role集合と完全一致することを独立監査。全旧reviewファイルSHAを再照合。ID/slug/previousSlugs重複・dangling参照・重複relationはDB validationで0。再applyのdata/receipt差分0、全ToDo再生成差分0。

## 検証

全363test（canonical289＋既存review62＋今回12）、root/subpath build801/89、SEO1345ページ/890詳細、全446Creator/2670欄/承認link両配置、Functions compile（Wrangler4.143.0）がすべて成功。verification.jsonに9source/データ/全原logのSHA、validation/に成功と初回失敗の原logを保存。追跡/未追跡の差分checkと20項目の最終要件gateも成功。COMPLETION_AUDIT.jsonに各要件・証拠・成功結果を保存。

## 失敗と対処

- 初回の一括読取は出力上限で切り捨て。分割と全構造化で回復。bootstrap診断は旧台帳のrecordsをsongsと誤認したが、既に保存したsnapshotを再作成せず独立照合で訂正。
- 初回parserはC節の空行数を誤認。全375taskId集合の一致guardが301件で停止し、実改行へ対応して375件一致。
- 初回planでDB validationのAPI型/戻り値、unresolved=falseの禁止、補助置換の括弧構文を検出し訂正。初回のtoken照合は登録taskにtokenRawがないため名称差で停止し、承認された同一候補のrawVariants/aliasesだけから現在の完全な主体表記を選択するよう修正。全原文保全。
- 台帳のB1 source guardは旧名石倉誉之および共同欄Norの対応を検出。承認taskId・candidateMap・実role bindingの三者一致で過去候補を追跡し、共同作者のIDを混ぜないよう限定。guardを削除せず全source監査を維持。
- 対象testの曲名「僕は...」の引用符は、テンプレートの囲みと実タイトルにある引用符の境界を解釈。実ID/Work/現行title/rawを変更せず照合。
- Prettierのsandbox EPERMは許可実行で成功、自動承認拒否なし。P3隔離回帰の初回は最新admin-stateを混ぜた差を検出し失敗。当時のSHA付きremote fixture＋承認planで全dataを復元して旧13test成功。現行データを巻き戻していない。
- 補助rgのWindows glob指定エラーと未生成log読取は、実ファイル一覧/生成済みlogで訂正。

## 新規Creator一覧

|ID|標準名|slug|
|---|---|---|
|cr-0372|宝野アリカ|allica-takarano|
|cr-0373|UYKADO|uykado|
|cr-0374|加藤貴之|takayuki-kato|
|cr-0375|牧野太洋|taiyo-makino|
|cr-0376|DjeDje|djedje|
|cr-0377|Nor|nor|
|cr-0378|R-指定|r-shitei|
|cr-0379|ぬゆり|nulut|
|cr-0380|横地健太|kenta-yokochi|
|cr-0381|三村一輝|kazuki-mimura|
|cr-0382|千石ユノ|yuno-sengoku|
|cr-0383|唐沢美帆|miho-karasawa|
|cr-0384|尾崎豪|go-ozaki|
|cr-0385|Carlos K.|carlos-k|
|cr-0386|eba|eba|
|cr-0387|FUNKY MONKEY BΛBY’S|funky-monkey-babys|
|cr-0388|Gohgo|gohgo|
|cr-0389|JACK|jack|
|cr-0390|岡嶋かな多|kanata-okajima|
|cr-0391|kz|kz|
|cr-0392|Lotus Juice|lotus-juice|
|cr-0393|Louis|louis|
|cr-0394|MAQUMA|maquma|
|cr-0395|Marcus Van Wattum|marcus-van-wattum|
|cr-0396|Masayoshi Minoshima|masayoshi-minoshima|
|cr-0397|MEG.ME|meg-me|
|cr-0398|n-buna|n-buna|
|cr-0399|Naoki-T|naoki-t|
|cr-0400|Nicky Romero|nicky-romero|
|cr-0401|NORiMETAL|norimetal|
|cr-0402|SAKURAmoti|sakuramoti|
|cr-0403|Sekimen|sekimen|
|cr-0404|SKYTOPIA|skytopia|
|cr-0405|YOUSAY|yousay|
|cr-0406|ZUN|zun|
|cr-0407|アザミ|azami|
|cr-0408|きただにひろし|hiroshi-kitadani|
|cr-0409|ケンモチヒデフミ|hidefumi-kenmochi|
|cr-0410|つむぎしゃち|shachi-tsumugi|
|cr-0411|ナナヲアカリ|nanaoakari|
|cr-0412|ふるっぺ|furuppe|
|cr-0413|森さん|mori-san|
|cr-0414|Litz|litz|
|cr-0415|ユリイ・カノン|yurry-canon|
|cr-0416|安部大希|daiki-abe|
|cr-0417|影山ヒロノブ|hironobu-kageyama|
|cr-0418|遠藤ナオキ|naoki-endo|
|cr-0419|岡崎英美|emi-okazaki|
|cr-0420|岡野昭仁|akihito-okano|
|cr-0421|加賀爪タッド|tadd-kagatsume|
|cr-0422|花村想太|sota-hanamura|
|cr-0423|角本麻衣|mai-kakumoto|
|cr-0424|岩寺基晴|motoharu-iwadera|
|cr-0425|橘亮祐|ryosuke-tachibana|
|cr-0426|久下真音|mine-kushita|
|cr-0427|宮崎諒|ryo-miyazaki|
|cr-0428|工藤大輝|taiki-kudo|
|cr-0429|江島啓一|keiichi-ejima|
|cr-0430|山崎あおい|aoi-yamazaki|
|cr-0431|秋元康|yasushi-akimoto|
|cr-0432|小林鉄兵|teppei-kobayashi|
|cr-0433|彰|akira|
|cr-0434|松任谷由実|yumi-matsutoya|
|cr-0435|草刈愛美|ami-kusakari|
|cr-0436|田中怜子|reiko-tanaka|
|cr-0437|馬場龍樹|ryuki-baba|
|cr-0438|美波|minami|
|cr-0439|涼木シンジ|shinji-suzuki|
|cr-0440|哥丸雄貴|yuki-utamaru|
|cr-0441|櫻澤ヒカル|hikaru-sakurazawa|
|cr-0442|KENSEI|kensei|
|cr-0443|渡辺未来|miki-watanabe|
|cr-0444|石倉まろ|maro-ishikura|
|cr-0445|米米CLUB|kome-kome-club|
|cr-0446|多田慎也|shinya-tada|

## 追加alias

- cr-0102：ＭＯＭＩＫＥＮ（garupa:308:lyricist:ALIAS_REVIEW-b1-b528ebcd57341a509dce）
- cr-0162：谷口 鮪（ournotes:19:lyricist:ALIAS_REVIEW-b1-145122f57cd75aa7c5a0）
- cr-0071：sabio/高村風太（ournotes:59:arranger:CREATOR_IDENTITY-review-589e9fbfb8b6c014ad7c）

## 管理画面での保存形式の回帰確認

標準テストの初回は夢我夢中のSkye K表示がrole別overrideからgeneric overrideへ正規化される構造差を検出。新規relationだけ共有selectedCreditDataに合わせて保存し、既存relationは維持。全新規relationの編集roundtripテストを追加して12件成功。修正後の最初のtarget22では未再buildのcatalog比較だけ失敗（保存テストは成功）したため、root buildを先行して全pnpm testを再実行し成功。初回失敗もvalidation/に保持。

初回失敗logにNodeのdiff診断由来の行末空白があり未追跡差分checkで検出。原logを改変せずvalidation/*.txt.gzへgzip保存し、元bytes/SHAをfailed-log-evidence.jsonへ記録して再検証。成功logは通常のtxtを維持。
