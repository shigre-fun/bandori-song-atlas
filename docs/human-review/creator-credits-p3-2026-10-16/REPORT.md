# P3 人間確認回答の反映・検証報告

状態：反映・全検証・commit・push・deploy・本番照合完了（2026-10-17）。

当初の添付指示によるローカル完了後、2026-10-17の明示指示「commit・push・deployを行ってください。」により公開を許可。原本はinput.txt、追加の明示回答はclarification.json、人間回答と受領日/適用日時はreview.jsonへ保存。humanReviewDateは未回答nullのまま。

## 受理・適用の集計

|項目|結果|
|---|---:|
|受理Creator候補|211（新規候補208＋既存別名確認3）|
|対象担当scope|280|
|正式relation追加|283|
|作詞追加|135|
|作曲追加|136|
|編曲追加|12|
|新規Creator登録|202|
|既存IDを利用した第3節候補|6|
|第4節の別名確認|3候補・4担当|
|既存Creatorへの新しいalias追加|0（3表記とも登録済み）|
|新規Creatorのaliases採用|59表記|
|P3 task（曲）|556 → 0|
|元P3 taskの全対応（曲＋Creator項目）|1812（556＋1256）|
|P3未回答task/未解決元候補|0 / 0|
|P3TaskUnmapped|0|
|unmappedCurrentUnresolved|0|

|項目|before|after|
|---|---:|---:|
|Creator総数|169|371|
|nextId|170|372|
|ToDo曲数|271|118|
|ToDo全task数|935|375|
|候補全数|334|123|
|Work総数|826|826|
|収録曲数|888|888|

元P3の211候補・280担当・1812 taskはTASK_CORRESPONDENCE.jsonで一意に対応付けた。登録情報が整った主体だけを第3節の対象曲・担当へ適用し、原文は全888曲×3担当で不変。

## 新規Creator ID一覧

|ID|標準名|slug|type|aliases|
|---|---|---|---|---|
|cr-0170|164|ichirokuyon|person|[]|
|cr-0171|96|kuro|person|["黒沢ダイスケ"]|
|cr-0172|AI YAZAWA|ai-yazawa|person|["矢沢あい"]|
|cr-0173|aimerrhythm|aimerrhythm|person|["Aimer"]|
|cr-0174|AIMI|aimi|person|[]|
|cr-0175|AKASAKI|akasaki|person|[]|
|cr-0176|Aqua Timez|aqua-timez|unit|[]|
|cr-0177|Benjamin Franklin|benjamin-franklin|person|[]|
|cr-0178|BETTI|betti|person|["EasyPop"]|
|cr-0179|Chinozo|chinozo|person|[]|
|cr-0180|cinema staff|cinema-staff|unit|[]|
|cr-0181|DAIGO|daigo|person|[]|
|cr-0182|doriko|doriko|person|[]|
|cr-0183|emon(Tes.)|emon-tes|person|[]|
|cr-0184|EREN|eren|person|[]|
|cr-0185|fripSide|fripside|unit|[]|
|cr-0186|Funta|funta|unit|["Funta3","Funta7"]|
|cr-0187|Goose house|goose-house|unit|[]|
|cr-0188|GRe4N BOYS|greeeen-boys|unit|["GReeeeN"]|
|cr-0189|Haruka|haruka|person|[]|
|cr-0190|Heart’s Cry|hearts-cry|unit|[]|
|cr-0191|Hibiki|hibiki|person|[]|
|cr-0192|hotaru|hotaru|person|[]|
|cr-0193|H ZETT M|h-zett-m|person|["H是都M","ヒイズミマサユ機"]|
|cr-0194|ika_mo|ika-mo|person|["鶴田加茂"]|
|cr-0195|Junky|junky|person|[]|
|cr-0196|KEIGO|keigo|person|["KEIGO HAYASHI"]|
|cr-0197|KOCHO|kocho|person|[]|
|cr-0198|Koji Mihara|koji-mihara|person|[]|
|cr-0199|Last Note.|last-note|unit|[]|
|cr-0200|leonn|leonn|person|[]|
|cr-0201|MEGUMI|megumi|person|["林原めぐみ"]|
|cr-0202|meiyo|meiyo|person|[]|
|cr-0203|MELL|mell|person|[]|
|cr-0204|minatoku|minatoku|person|["田中謙介"]|
|cr-0205|Mitchie M|mitchie-m|person|[]|
|cr-0206|MIZUE|mizue|person|[]|
|cr-0207|Mr.FanTastiC|mr-fantastic|unit|[]|
|cr-0208|MY FIRST STORY|my-first-story|unit|["マイファス"]|
|cr-0209|Nakajin|nakajin|person|["中島真一"]|
|cr-0210|Neko Hacker|neko-hacker|person|[]|
|cr-0211|Numa|numa|person|["沼能友樹"]|
|cr-0212|SCANDAL|scandal|unit|[]|
|cr-0213|小林夏海|natsumi-kobayashi|person|[]|
|cr-0214|SIAM SHADE|siam-shade|unit|[]|
|cr-0215|TAKUMA|takuma|person|[]|
|cr-0216|tetsuya|tetsuya|person|[]|
|cr-0217|TKT|tkt|person|[]|
|cr-0218|TOPHAMHAT-KYO|tophamhat-kyo|person|["TOPHAMHAT-KYO (FAKE TYPE.)","トップハムハット狂"]|
|cr-0219|WEST GROUND|west-ground|person|["西辺誠"]|
|cr-0220|y0c1e|y0c1e|person|["佐高陵平"]|
|cr-0221|yonkey|yonkey|person|["YONKEY"]|
|cr-0222|YUKI|yuki|person|["倉持有希"]|
|cr-0223|あさき|asaki|person|[]|
|cr-0224|イイジマケン|ken-iijima|person|[]|
|cr-0225|いよわ|iyowa|person|[]|
|cr-0226|かめりあ|camellia|person|[]|
|cr-0227|カヨコ|kayoko|person|["草野華余子"]|
|cr-0228|くじら|kujira|person|[]|
|cr-0229|クボナオキ|naoki-kubo|person|[]|
|cr-0230|ケリー|kelly|person|[]|
|cr-0231|シュンタロウ|shuntaro|person|[]|
|cr-0232|すぅ|suu|person|["吉田菫"]|
|cr-0233|たかはしごう|go-takahashi|person|["高橋剛"]|
|cr-0234|たくや|takuya|person|["楠瀬拓哉"]|
|cr-0235|てにをは|teniwoha|person|[]|
|cr-0236|のぼる↑|noboru|person|[]|
|cr-0237|のりぴー|noripy|person|["のりP"]|
|cr-0238|ヒグチアイ|ai-higuchi|person|["樋口愛"]|
|cr-0239|ヒトリエ|hitorie|unit|[]|
|cr-0240|ぼっちぼろまる|botchi-boromaru|person|[]|
|cr-0241|マオ|mao|person|[]|
|cr-0242|ますかっと|muscatone|person|[]|
|cr-0243|まろん|maron|person|[]|
|cr-0244|ミズノゲンキ|genki-mizuno|person|[]|
|cr-0245|もりちよこ|chiyoko-mori|person|[]|
|cr-0246|やぎぬまかな|kana-yaginuma|person|[]|
|cr-0247|やしきん|yashikin|person|[]|
|cr-0248|やなぎなぎ|yanaginagi|person|[]|
|cr-0249|ゆーまお|yumao|person|[]|
|cr-0250|ゆうゆ|yuuyu|person|[]|
|cr-0251|ゆこぴ|yukopi|person|[]|
|cr-0252|リーシャウロン|lee-shirakawa|person|[]|
|cr-0253|れるりり|rerulili|person|[]|
|cr-0254|伊藤アキラ|akira-ito|person|[]|
|cr-0255|伊藤直樹|naoki-ito|person|[]|
|cr-0256|一二三|hihumi|person|[]|
|cr-0257|永塚健登|kento-nagatsuka|person|[]|
|cr-0258|園田健太郎|kentaro-sonoda|person|["園田智也","木村有希"]|
|cr-0259|園田凌士|ryoji-sonoda|person|["園田利隆","園田有吾","おのりく"]|
|cr-0260|奥井雅美|masami-okui|person|[]|
|cr-0261|奥井康介|kousuke-okui|person|[]|
|cr-0262|岡村大輔|daisuke-okamura|person|[]|
|cr-0263|岡野裕次郎|yujiro-okano|person|["岡野裕次郎(TRYTONELABO)"]|
|cr-0264|恩田快人|yoshihito-onda|person|[]|
|cr-0265|音羽-otoha-|otoha|person|[]|
|cr-0266|河合英嗣|eiji-kawai|person|[]|
|cr-0267|河邊徹|toru-kawabe|person|[]|
|cr-0268|岩里祐穂|yuho-iwasato|person|[]|
|cr-0269|幾田りら|lila-ikuta|person|["ikura"]|
|cr-0270|吉峯暁子|kyoko-yoshimine|person|[]|
|cr-0271|宮崎誠|makoto-miyazaki|person|[]|
|cr-0272|宮川彬良|akira-miyagawa|person|[]|
|cr-0273|泣き虫|nakimushi|person|[]|
|cr-0274|吟(BUSTED ROSE)|gin|person|["羽柴吟"]|
|cr-0275|原口沙輔|sasuke-haraguchi|person|[]|
|cr-0276|吾龍|goryu|person|["KOOL"]|
|cr-0277|後藤正文|masafumi-gotoh|person|["gotch"]|
|cr-0278|AKi|aki|person|["明希","御恵明希"]|
|cr-0279|広井王子|oji-hiroi|person|[]|
|cr-0280|高瀬一矢|kazuya-takase|person|[]|
|cr-0281|黒うさP|kurousa|person|["黒うさ"]|
|cr-0282|佐々木想|so-sasaki|person|[]|
|cr-0283|阪井一生|kazuki-sakai|person|[]|
|cr-0284|桜アス恵|asue-sakura|person|["桜アス恵(TRYTONELABO)"]|
|cr-0285|三島想平|souhei-mishima|person|[]|
|cr-0286|みや|miya|person|["我妻三輪子"]|
|cr-0287|山口朗彦|akihiko-yamaguchi|person|[]|
|cr-0288|山崎寛子|hiroko-yamasaki|person|[]|
|cr-0289|山村隆太|ryuta-yamamura|person|[]|
|cr-0290|山中拓也|takuya-yamanaka|person|[]|
|cr-0291|山田高弘|takahiro-yamada|person|[]|
|cr-0292|氏原ワタル|wataru-ujihara|person|[]|
|cr-0293|寺中友将|tomomasa-teranaka|person|[]|
|cr-0294|寺島拓篤|takuma-terashima|person|[]|
|cr-0295|若林充|mitsuru-wakabayashi|person|[]|
|cr-0296|秋山澪|mio-akiyama|person|[]|
|cr-0297|俊龍|shunryu|person|[]|
|cr-0298|瞬火|matatabi|person|[]|
|cr-0299|小室みつ子|mitsuko-komuro|person|["西門加里"]|
|cr-0300|小諸鉄矢|tetsuya-komoro|person|["吉江一男"]|
|cr-0301|小森成雄|shigeo-komori|person|[]|
|cr-0302|小杉保夫|yasuo-kosugi|person|["Funky Y.K"]|
|cr-0303|小田佳奈子|kanako-oda|person|[]|
|cr-0304|小幡庸裕|yasuhiro-obata|person|[]|
|cr-0305|小林泉美|izumi-kobayashi|person|["MIMI","小林”mimi”泉美"]|
|cr-0306|新しい学校のリーダーズ|atarashii-gakko|unit|["新しい学校のリーダー達"]|
|cr-0307|新田目翔|show-aratame|person|[]|
|cr-0308|森本錬|ren-morimoto|person|[]|
|cr-0309|森由里子|yuriko-mori|person|[]|
|cr-0310|森林檎|ringo-mori|person|[]|
|cr-0311|深青結希|yuki-misao|person|[]|
|cr-0312|秦基博|motohiro-hata|person|[]|
|cr-0313|水野悠良|yura-mizuno|person|[]|
|cr-0314|菅野よう子|yoko-kanno|person|[]|
|cr-0315|折戸伸治|shinji-orito|person|[]|
|cr-0316|川上洋平|yoohei-kawakami|person|[]|
|cr-0317|川田まみ|mami-kawada|person|[]|
|cr-0318|草野正宗|masamune-kusano|person|["草野マサムネ"]|
|cr-0319|太志|futoshi|person|["太志(Aqua Timez)"]|
|cr-0320|太田雄大|yudai-ohta|person|[]|
|cr-0321|大介|daisuke|person|["大介(Aqua Timez)"]|
|cr-0322|大隅知宇|tomotaka-osumi|person|[]|
|cr-0323|大森俊之|toshiyuki-omori|person|[]|
|cr-0324|大川茂伸|shigenobu-okawa|person|[]|
|cr-0325|大濱健悟|kengo-ohama|person|[]|
|cr-0326|宅見将典|masanori-takumi|person|["Masa Takumi"]|
|cr-0327|池毅|takashi-ike|person|[]|
|cr-0328|中沢伴行|tomoyuki-nakazawa|person|[]|
|cr-0329|中田ヤスタカ|yasutaka-nakata|person|[]|
|cr-0330|町田紀彦|norihiko-machida|person|[]|
|cr-0331|椎名林檎|ringo-sheena|person|[]|
|cr-0332|田鹿祐一|yuichi-tajika|person|[]|
|cr-0333|渡辺和紀|kazunori-watanabe|person|[]|
|cr-0334|渡邊亜希子|akiko-watanabe|person|[]|
|cr-0335|祝千寿|senjyu-iwai|person|["凍堂遊維"]|
|cr-0336|東野へいと|heito-higashino|person|[]|
|cr-0337|藤井怜央|leo-fujii|person|[]|
|cr-0338|藤巻亮太|ryota-fujimaki|person|[]|
|cr-0339|藤原燈太|tota-fujiwara|person|[]|
|cr-0340|鴇沢直|nao-tokisawa|person|[]|
|cr-0341|日比野裕史|hirofumi-hibino|person|[]|
|cr-0342|破矢ジンタ|jinta-hashi|person|[]|
|cr-0343|馬渡松子|matsuko-mawatari|person|[]|
|cr-0344|馬渕直純|naozumi-mabuchi|person|[]|
|cr-0345|白戸佑輔|yusuke-shirato|person|[]|
|cr-0346|yuki-ka|yuki-ka|person|[]|
|cr-0347|飛内将大|masahiro-tobinai|person|[]|
|cr-0348|尾崎雄貴|yuuki-ozaki|person|[]|
|cr-0349|柊キライ|kirai-hiiragi|person|[]|
|cr-0350|福島智朗|tomoaki-fukushima|person|[]|
|cr-0351|分島花音|kanon-wakeshima|person|[]|
|cr-0352|片岡健太|kenta-kataoka|person|[]|
|cr-0353|北川賢一|kenichi-kitagawa|person|[]|
|cr-0354|本多友紀|yuki-honda|person|["本多友紀(Arte Refact)"]|
|cr-0355|野村陽一郎|yoichiro-nomura|person|[]|
|cr-0356|矢吹俊郎|toshiro-yabuki|person|[]|
|cr-0357|柳沢亮太|ryota-yanagisawa|person|[]|
|cr-0358|有澤孝紀|takanori-arisawa|person|[]|
|cr-0359|和賀祐希|yuki-waga|person|[]|
|cr-0360|廣澤優也|yuya-hirosawa|person|["廣澤優也(HANO)"]|
|cr-0361|斎藤真也|shinya-saito|person|[]|
|cr-0362|斎藤信治|shinji-saito|person|[]|
|cr-0363|KOHSHI|kohshi|person|["KOHSHI ASAKAWA"]|
|cr-0364|ひとみ|hitomi|person|[]|
|cr-0365|重永亮介|ryosuke-shigenaga|person|[]|
|cr-0366|杉本雄治|yuji-sugimoto|person|["ONCE"]|
|cr-0367|中村彼方|kanata-nakamura|person|["KANATA"]|
|cr-0368|津波幸平|kohei-tsunami|person|[]|
|cr-0369|田代智一|tomokazu-tashiro|person|[]|
|cr-0370|日向電工|hinatadenko|person|[]|
|cr-0371|北川勝利|katsutoshi-kitagawa|person|[]|

## 既存Creatorへの統合と候補間統合

|候補|candidateKey|既存ID|
|---|---|---|
|Jun Maeda|b1-883fb561e5bf9e3d9a36|cr-0106|
|じん（自然の敵Ｐ）|b1-9cabdf0f7aeba9563100|cr-0144|
|佐藤純一(fhána)|b1-65d09c562afaab97af82|cr-0053|
|神前 暁（MONACA）|b1-523fd8c7f3fc4ee47897|cr-0043|
|田中秀和(MONACA)|b1-10ee6df825a6122bfabf|cr-0055|
|八木沼悟志 yuki-ka|b1-be2f872b0d4ba21abd2f|cr-0066|

|別名確認|既存ID|結果|
|---|---|---|
|hyde|cr-0052|既存alias確認・対象担当だけformal化|
|UZ(SPYAIR)|cr-0067|既存alias確認・対象担当だけformal化|
|須田景凪|cr-0150|既存alias確認・対象担当だけformal化|

第3節の既存ID利用では既存masterの標準名・reading・slug・type・previousSlugsを保持。所属・備考は人間回答資料へ保存し、所属組織を別担当者として追加しない。

候補間の統合：樋口愛→ヒグチアイ、太志(Aqua Timez)→太志、DAYSのKOHSHI ASAKAWA→GO!!!のKOHSHI。KEIGOは別Creatorとして登録。最初の193固定IDは追加回答後も維持した。

## 特殊creditの境界

|曲・担当|確定した主体|原文|
|---|---|---|
|Garupa:120 DAYS／作詞|KEIGO HAYASHI / KOHSHI ASAKAWA|KEIGO HAYASHI KOHSHI ASAKAWA|
|Garupa:154 瞬間センチメンタル／作詞|SCANDAL / 小林夏海|SCANDAL 小林夏海|
|Garupa:60 only my railgun／作詞|八木沼悟志 / yuki-ka|八木沼悟志 yuki-ka|

全体を単一Creatorとして登録せず、もとの半角スペースなどの区切りをtextで保持し、承認された個別Creatorへリンクした。八木沼悟志の既存作曲relationも保持。

## 残件と対象外の保全

今回のP3回答の保留・未回答は0。全体の未解決候補は123、曲taskは375で、HUMAN_TODO_BY_CREATOR / BY_SONGへ残した。

原P0/P2のtaskを今回の回答だけで解決した件数は0。新規masterが利用可能になったため、原8 task（GP369 KEIGO/KOHSHI、OurNotes48 yashikinの作曲/編曲）は同じ曲・担当・raw・candidateKeyの別名確認4 taskへ分類変更した。どの対象外担当もformal化せず、継続先をverification.json.retainedPriorTasksへ保存。GAME_VERSION_REVIEW39件とOurNotes46編曲のsplit課題1件を保持。

## 検証

- 4か所の引用符欠落、ひとみのidentity誤記、perosn3か所、既存2人の新規宣言衝突、KOHSHI相互参照/所属、重永亮介の不完全なsamePersonAsは、追加人間回答で解消。空欄を自動補完していない。
- 旧Creator・previousSlug・旧formal共同者、Work、原文/区切り/括弧・非担当fieldを保持。ID/slug/previousSlugの衝突、dangling Creator/Work、不正type、対象外追加を検証。
- 再applyで全data byte変更0、human review receipt byte変更0。回答・固定採番・immutable snapshotから全dataを再現。ToDoはverify/generate反復でも不変を確認する。
- tests: {"result":"PASS","canonical":285,"p3":13,"oldReview":31,"p1":10,"p2":8,"total":347}
- build: {"root":"PASS","subpath":"PASS","garupa":800,"ournotes":88}
- SEO: {"root":"PASS","subpath":"PASS","pages":1268,"details":888}
- Functions: {"result":"PASS","wrangler":"4.143.0"}
- diff check: PASS
- 意図しない差分: 0

## 失敗・対処と検証範囲

- 初回添付一括出力は表示上限で切り捨て。分割読取と全208候補の構造化解析/保存で回復。
- 初回apply前の馬渡 松子は空白付き候補名と現在の標準表記が異なり、該当scopeのexact token照合に失敗。人間が記入した標準名/aliasesも当該scopeの照合値へ加え、rawを変えず解決。
- 初回P0/P2 guardはtaskIdの分類変更を誤って脱落と判定。未解決の同scope/同candidate/同rawへの継続を明示して修正し、対象外formal追加0を検証。
- timestampだけでレビューの入力SHAが変わらないよう、同一追加回答の再applyでは適用日時も保持。原本日時欄は未回答のまま。

元のローカル検証記録はlocal-REPORT.md/local-verification.json/COMPLETION_AUDIT.jsonへ保管。2026-10-17に公開と本番照合を完了。元headは32a97950e55cc79c4c826cbc6006a19d16f52e21、テンプレート基準653455aからの先行管理更新・新曲OurNotes88/Work826・区切り/mobile修正を保持。詳細の数値・source SHA・data SHA・検証原logはverification.jsonとvalidation/を参照。

## 2026-10-17 公開完了

製品コミット：99bd967becfb4da6ee0d14dddac44023323a873e。通常push後、同SHAのActions 38928833303（build/deploy）、Cloudflare Pages、GitHub Pages 7123669339 がすべてsuccess。

先行4管理更新をf10fa7eへfast-forwardして保持し、remote-inputs.json.gz/remote-integration.jsonを保存。最新データで347test・root/subpath build/SEO・Functions成功。202新規ID・283relation・2664表示原文・既存全relation・169既存Creator metadata・Work826・全非担当項目を保持。

[本番](https://tanimachi-bdsongs.com/)と[GitHub Pages](https://shigre-fun.github.io/bandori-song-atlas/)の各20HTTP・7module全文・全catalog/master・全888曲詳細・全371Creatorページ（新規202含む）の表示とリンクが検証済みbuildに一致。原文と全表示項目を全件比較。本番OGP3画像1200×630、favicon、404、旧Creator URLの301も成功。公開証拠はpublication/、現在の検証結果はverification.json、公開前guardはPUBLICATION_PREFLIGHT.json。

終了記録のみskip CI文書commit/pushで同期する。製品ファイルの追加変更はなし。

初回GitHub PagesのGP335応答はHTTP503で監査が停止（session80267/exit1）。初回ログとincident記録を保存し、429/5xxだけ最大3回の再試行を許可して全888件を再照合。比較条件の緩和・製品変更・再deployはなし。最終成功記録に各再試行も保存。
