# 原曲作品名の表記調査

対象は `data/garupa/songs.json` の288曲と `data/ournotes/songs.json` の19曲、計307曲の `originalWork`。個別に変更した値は [`original-work-mapping.json`](original-work-mapping.json) に記録した。`node scripts/qa/audit-original-works.mjs` で媒体ごとの用途記載を確認できる。

## 表記方針

- TVアニメは `アニメ` に統一する。第2期が放送済みの場合に期を、第2クールがある場合にクールを記す。両クールで同じ曲が使われる場合は両方を記す。長期放送でOPの切替がクール境界と一致しない作品は、誤ったクール数を避けてOP番号を記す。
- 同じ曲が複数の期で使われた場合は、各使用箇所を列挙する。
- 挿入歌や作品全体の主題歌のようにOP/ED以外の用法は、OP/EDと偽らず公式の分類に合わせる。
- 映画は主題歌、エンディング主題歌、挿入歌、劇中歌を出典に合わせて記載する。
- CMは `CM「広告主・商品名」テーマソング` に統一する。これは表示形式の統一であり、広告主が「テーマソング」という呼称を使ったという意味ではない。

## 照合済みの主な出典

- 『チェンソーマン』第1・7・12話ED：[第1話](https://www.chainsawman.dog/tvseries/bddvd/)、[第7話](https://chainsawman.dog/news/221122_02/)、[第12話](https://chainsawman.dog/news/221227_02/)。
- 『SPY×FAMILY』の期・クールと曲名：[第1期](https://spy-family.net/tvseries/music/index_season1.php)、[第2期](https://spy-family.net/tvseries/music/index_season2.php)。
- 『呪術廻戦』の期・クールと曲名：[第1期第1クール](https://jujutsukaisen.jp/music/1st_01.php)、[第2期「懐玉・玉折」](https://jujutsukaisen.jp/news/20230521_01.php)。
- 『ダンダダン』第2期OP：[公式ニュース](https://anime-dandadan.com/news/1861/)。
- 『東京リベンジャーズ』の「ホワイトノイズ」は[聖夜決戦編](https://tokyo-revengers-anime.com/news/archives/2853)と[天竺編](https://tokyo-revengers-anime.com/news/archives/3768)の両方でOP。
- 『僕のヒーローアカデミア』第2期第2クール「空に歌えば」：[公式音楽ページ](https://heroaca.com/music/music_2nd_2/)。
- 『ぼっち・ざ・ろっく！』「青春コンプレックス」は[OP](https://bocchi.rocks/omnibus/news/?article_id=61499)。[第2期の制作発表](https://bocchi.rocks/omnibus/news/?article_id=67179)を確認。
- 『よふかしのうた』「堕天」は[第1期OP](https://yofukashi-no-uta.com/1st/news/archives/111)。
- 『かみちゃまかりん』「暗黒天国」は[OP](https://www.lantis.jp/release-item/LHCM-1031.html)。『K』「KINGS」は[OP](https://www.kingrecords.co.jp/cs/g/gKICM-3253/)。
- 『【推しの子】』「ファタール」は[第2期OP](https://ichigoproduction.com/Season2/news/index00170000.html)。
- 『東京喰種』「unravel」は[第1期OP](https://www.marv.jp/special/tokyoghoul/first/music_1st.html)。
- 『銀魂』「サムライハート」は[第2期の第202～214話ED](https://www.bn-pictures.co.jp/gintama/cd/02.php)。
- 『ご注文はうさぎですか？』の[第1期OP](https://gochiusa.com/series_cd/orderthesongs.html)と[第2期OP・ED](https://www.gochiusa.com/series_cd/2/)。
- 『BLEACH』「＊ ～アスタリスク～」「D-tecnoLife」は[第1・第2クールOP](https://www.sonymusic.co.jp/artist/BLEACH/discography/buy/SVWC-7421)。
- 『ラブライブ！スーパースター!!』「START!! True dreams」は[第1期OP](https://www.lantis.jp/title/f317644cbce6fbb864fed1c372cdfd15/all.html)、『NEW GAME!!』「STEP by STEP UP↑↑↑↑」は[第2期OP](https://newgame-anime.com/movie/)、『マッシュル』「Bling-Bang-Bang-Born」は[第2期OP](https://mashle.pw/news/?id=64222)。
- 『ヴィジランテ』「けっかおーらい」は[第1期OP](https://vigilante-anime.com/music/1st.html)、『薬屋のひとりごと』「百花繚乱」は[第2期第1クールOP](https://kusuriyanohitorigoto.jp/season2/music/)、『シャングリラ・フロンティア』「BROKEN GAMES」は[第1期OP](https://anime.shangrilafrontier.com/topics/153/)。
- 『葬送のフリーレン』「勇者」は[第1期第1クールOP](https://frieren-anime.jp/music/1st_1/)、『WIND BREAKER』「絶対零度」は[第1期OP](https://wb-anime.net/music/op01.html)、『僕のヒーローアカデミア』「だから、ひとりじゃない」は[第2期第1クールED](https://heroaca.com/music/music_2nd_1/)。
- 『Re:ゼロから始める異世界生活』の[第1期第1・第2クールOP/ED](https://re-zero-anime.jp/tv/music/tv1r.html)と[第3期OP](https://re-zero-anime.jp/tv/music/tv3.html)。
- 『とある科学の超電磁砲』の[第1期OP2曲](https://toaru-project.com/railgun/goods/cd/)、[第2期「sister's noise」](https://toaru-project.com/railgun_s/goods/cd/)、[第3期「final phase」](https://toaru-project.com/railgun_t/music/)。
- 『【推しの子】』の[第1期「アイドル」OP](https://ichigoproduction.com/Season1/news/index00280000.html)、[第1期「サインはB」劇中のキャラクター曲](https://ichigoproduction.com/Season1/music/)、[第2期「POP IN 2」第24話挿入歌](https://ichigoproduction.com/Season2/news/index01130000.html)。
- 『ゾンビランドサガ』の[第1期OP](https://zombielandsaga.com/1st/discography/detail.php?id=1016079)と[第2期OP](https://zombielandsaga.com/disc_comics/detail.php?id=1018217)。
- 『進撃の巨人』の[第1期第1クールOP](https://shingeki.tv/season1/music/op.php)、[第1期第2クールED](https://shingeki.tv/season1/music/ed2.php)、[The Final Season Part 2 ED](https://shingeki.tv/final/music/ed2/)。
- 映画『NANA』「GLAMOROUS SKY」は[主題歌](https://www.sonymusic.co.jp/artist/NANA/discography/buy/AICL-1650)、『HELLO WORLD』「イエスタデイ」は[主題歌](https://hello-world-movie.com/song/)、『君に届け』は[主題歌](https://www.flumpool.jp/discography/2571/)、『青夏』「青と夏」は[主題歌](https://www.universal-music.co.jp/mrsgreenapple/news/2018-07-12/)。
- 『ONE PIECE FILM RED』の[主題歌・劇中歌の区別](https://www.onepiece-film.jp/red/info/694/)、『劇場版 SPY×FAMILY CODE: White』[「SOULSOUP」主題歌](https://spy-family.net/codewhite/music/music.php)、『THE FIRST SLAM DUNK』[「第ゼロ感」エンディング主題歌](https://slamdunk-movie.jp/about/staff/)。
- 『ストリートファイターII MOVIE』「恋しさと せつなさと 心強さと」は[カプコンによる挿入歌の表記](https://www.capcom.co.jp/ir/feature/2017_sf30th.html)。『ドラえもん のび太の恐竜2006』「ボクノート」は[主題歌](https://www.office-augusta.com/sukimaswitch/discography/?id=623&page_no=1)。『バクマン。』「新宝島」は[主題歌](https://sakanaction.jp/news/detail/589?categoryId=1%2C2)。『新世紀エヴァンゲリオン劇場版 シト新生』「魂のルフラン」は[主題歌](https://www.kingrecords.co.jp/cs/g/gKICM-3122/)。

## 保留・追加調査

`node scripts/qa/audit-original-works.mjs` が以下の12曲を未特定として報告する。番組・作品での起用は確認できても、OP/EDの別や曲そのものの起用が資料で確定できないため、推測では書き換えない。

- アワーノーツID62「UNDEAD」：[作品公式音楽ページ](https://www.monogatari-series.com/oms/2024/music/)は「主題歌」と記載し、別の曲をOPとして記載している。OP/EDは未特定。
- ガルパID774「MATSURI BAYASHI」：『魁!ミュージック』6月度マンスリーアーティストという既存情報は曲自体のOP/ED等の用途を証明しない。[フジテレビの記事](https://www.fujitv.co.jp/muscat/20195648.html)には別のライブでの演奏が記載されるが、当該番組での用途は未特定。
- ガルパID804「スターラブレイション」：[フジテレビ](https://www.fujitv.co.jp/b_hp/Last_Cinderella_r/index.html)はドラマ主題歌と記すが、OP/EDの別は未特定。
- ガルパID136「夏祭り」：『ふしぎな話』でのドラマ主題歌起用は確認済みだが、OP/EDの別は未特定。『ReLIFE』第12話EDは確認済み。
- ガルパID311「CQCQ」：[TBS](https://www.tbs.co.jp/anasore/news/)はドラマ主題歌と記すが、OP/EDの別は未特定。
- ガルパID18「secret base ～君がくれたもの～」：[TBS](https://www.tbs.co.jp/tbs-ch/item/d0549/)は『キッズ・ウォー3』の主題歌と記すが、OP/EDの別は未特定。
- ガルパID787「ヒカリへ」：[フジテレビ](https://www.fujitv.co.jp/b_hp/richman-poorwoman_r/)はドラマ主題歌と記すが、OP/EDの別は未特定。
- ガルパID116「気まぐれロマンティック」：[フジテレビ](https://www.fujitv.co.jp/b_hp/celeb/)はドラマ主題歌と記すが、OP/EDの別は未特定。
- ガルパID756「I wonder」：[Da-iCE公式映像](https://www.youtube.com/watch?v=i9mGHG8kqoA)はドラマ主題歌と記すが、OP/EDの別は未特定。
- ガルパID648「Subtitle」：[フジテレビ](https://www.fujitv.co.jp/silent/cast-staff/)はドラマ主題歌と記すが、OP/EDの別は未特定。
- ガルパID308「ドラマツルギー」：[番組の起用発表](https://natalie.mu/music/news/352094)はドラマ主題歌と記すが、OP/EDの別は未特定。
- ガルパID653「幾億光年」：[TBS](https://www.tbs.co.jp/EyeLoveYou_tbs/index.html)はドラマ主題歌と記すが、OP/EDの別は未特定。

『ぼっち・ざ・ろっく！』は[第2期制作発表](https://bocchi.rocks/)はあるが、2026年9月時点で未放送のため、収録済みの曲には期を付けない。『東京リベンジャーズ』の「Cry Baby」は[公式ディスコグラフィー](https://tokyo-revengers-anime.com/product/)が第1期の両編でOPと記載。『無職転生』の「オン・ザ・フロントライン」は[公式告知](https://mushokutensei.jp/news/240228_1/)の第2期第2クールOPに合わせた。

『プリパラ』の「Make it!」は[第1期OP](https://avex.jp/pripara/1st/news/detail.php?id=1012768)で、[次曲が第2クールから開始](https://avex.jp/pripara/1st/news/detail.php?id=1014530)。「ドリームパレード」は[第2期開始時のOP](https://avex.jp/pripara/1st/news/index.php)で、[次曲が第2期第3クールOP](https://www.avexnet.jp/contents/IRISX-XXXX-XXXX/discography/1010882)。『シティーハンター』の「Get Wild」は[制作会社の第1シリーズ全51話ED記載](https://www.sunrise-inc.co.jp/work/news.php?id=15920)。『BLACK LAGOON』は[公式の第1・第2シーズン区分](https://www.blacklagoon.jp/character.html)、[レーベルのOP記載](https://nbcuni-music.com/ive/mell/contents/hp0007/index00070000.html)、[第2期の楽曲情報](https://www.animatetimes.com/tag/details.php?id=12843)を照合した。

続編の固有タイトルも期を明記した。『魔法少女リリカルなのは A’s』の「ETERNAL BLAZE」は[作品公式のOP一覧](https://www.nanoha.com/archive2/goods/goods_a%27sshudaika.html)、『PSYCHO-PASS 2』の「Fallen」は[作品公式の第2期ED記載](https://psycho-pass.com/news/20230628_01.php)、『DARKER THAN BLACK -流星の双子-』の「ツキアカリのミチシルベ」は[第2期公式音楽ページ](https://www.d-black.net/2nd/music/index.html)、『Re：␣ハマトラ』は[作品公式の第2期表記](https://www.hamatorapj.com/event/)、『東京喰種 √A』の「季節は次々死んでいく」は[制作会社の第2期ED記載](https://www.marv.jp/titles/av/4116/)を確認した。
『涼宮ハルヒの憂鬱』の「God knows...」「ハレ晴レユカイ」は、[レーベルの第1期・第2期区別](https://www.lantis.jp/haruhi_comp/talk.html)と[楽曲一覧](https://www.lantis.jp/haruhi_comp/)を照合して第1期とした。
『銀魂゜』の「DAY×DAY」と「プライド革命」は、[制作会社の第3期表記](https://www.bn-pictures.co.jp/gintama/story/list.php)と[レーベルの第1・第2OP一覧](https://www.aniplex.co.jp/gintama/music/)に従い、第3期の第1・第2クールとした。

- 『東京リベンジャーズ』「Cry Baby」は[第1期OP](https://tokyo-revengers-anime.com/news/archives/103)、「トーキョーワンダー。」は[第1期第2クールED](https://tokyo-revengers-anime.com/news/archives/473)。
- 『鋼の錬金術師』2003年版「メリッサ」「READY STEADY GO」は[第1・第2クールOP](https://www.sonymusic.co.jp/artist/MikaNakashima/info/227776)。2009年版「again」「瞬間センチメンタル」は[公式アーティスト一覧](https://www.hagaren.jp/fa/about/artist.html)の第1クールOPと2010年1月開始の第4クールED。

- 『交響詩篇エウレカセブン』「DAYS」は[FLOW公式レーベルのOP記載](https://www.sonymusic.co.jp/artist/Flow/discography/buy/KSCL-2557)。『SSSS.GRIDMAN』「UNION」は[公式音楽ページ](https://gridman.net/product/cd/op.php)、『多田くんは恋をしない』「オトモダチフィルム」は[公式音楽ページ](https://tadakoi.tv/music.html)。
- 『うる星やつら』2022年版の「アイウエ」「トウキョウ・シャンディ・ランデヴ」は[公式音楽ページ](https://uy-allstars.com/music/)の第1クールOP/ED。『山田くんと7人の魔女』「くちづけDiamond」は[レーベルのOP記載](https://www.a-sketch.com/discography/%E3%81%8F%E3%81%A1%E3%81%A5%E3%81%91diamond/)。
- 『ONE PIECE』「Wake up!」は[公式ニュース](https://one-piece.com/greg/o20141119_0297/index.html)でOP、「ウィーアー！」は[公式ニュース](https://one-piece.com/news/o20211119_13349/index.html)で初代OPと記載。

- 『NARUTO』少年篇と疾風伝の[公式OP一覧](https://naruto-official.com/anime/naruto1)・[疾風伝OP一覧](https://naruto-official.com/anime/naruto2)で「GO!!!」「ブルーバード」「シルエット」を照合。『四月は君の嘘』「光るなら」は[前期OP](https://www.kimiuso.jp/music/01.html)。『BEASTARS』「怪物」は[第2期OP](https://bst-anime.com/sp/)。『青の祓魔師』「CORE PRIDE」は[2011年版OP](https://ao-ex.com/tv2017/sp/music/opening.html)。

- 『Re:ゼロから始める異世界生活』第2期「Realize」「Memento」は[公式音楽ページ](https://re-zero-anime.jp/tv/music/tv2.html)の前半クールOP/ED。『炎炎ノ消防隊』「インフェルノ」は[第1期第1クールOP](https://fireforce-anime.jp/season1/caststaff/)、「SPARK-AGAIN」は[第2期第1クールOP](https://fireforce-anime.jp/season2/music/)。『機動戦士ガンダム 水星の魔女』「祝福」は[第1期OP](https://gundam-official.com/witch-from-mercury/news/detail.php?id=20059)、「slash」は[第2期OP](https://www.gundam.info/product/cd/01_11368.html)。

- CMとして既に記録された曲は媒体表記を `CM「広告主・商品」テーマソング` に統一。これは記載済み広告用途の明確化で、追加の起用先を推定していない。「怪獣の花唄」のWILDish起用は[メーカー資料](https://www.maruha-nichiro.co.jp/corporate/news_center/news_topics/20210317_frozen_newcm.pdf)でも照合。

- 『シティーハンター』「Get Wild」は[作品公式によるED表記](https://cityhunter.jp/news/ch_35_game/)。『HUNTER×HUNTER』「Just Awake」は[日本テレビの音楽一覧](https://www.ntv.co.jp/hunterhunter/music/index.html)でED。『BLEACH』「Rolling star」は[レーベルのOP記載](https://www.sonymusic.co.jp/artist/Yui/discography/buy/SRCL-6468)、「chAngE」は[レーベルのOP記載](https://www.sonymusic.co.jp/artist/miwa/info/338511)。『PSYCHO-PASS』「abnormalize」「名前のない怪物」は[作品公式の前期OP/ED記載](https://psycho-pass.com/news/20230628_01.php)。

- 『ヒロインたるもの！』「ヒロイン育成計画」は[HoneyWorks公式の最終話特殊ED記載](https://honeyworks.jp/news/8381/)。『山田くんと7人の魔女』「オドループ」は[OAD版EDの報道](https://natalie.mu/music/news/127467)に従いTV版と区別。『ReLIFE』「HOT LIMIT」「夏祭り」は[アニメ公式の各話EDアルバム曲順](https://relife-anime.com/music/ending.html)の2番目・12番目からそれぞれ第2・第12話EDと判断。「ふしぎな話」の主題歌は[発売当時のCD記載](https://joshinweb.jp/dp/4988009486598.html)。

- 『月刊少女野崎くん』「君じゃなきゃダメみたい」は[歌手公式のOP記載](https://www.014014.jp/news/2211)。『メジャー』「心絵」は[エイベックスのOP記載](https://avex.jp/heisei_hits_avex/)で第1シリーズに使用。1996年版『るろうに剣心』「1/3の純情な感情」は[ソニーのED記載](https://www.sonymusic.co.jp/Music/Arch/SMER/SiamShade/download/d2.html)、「そばかす」は[ソニーのOP記載](https://www.sonymusic.co.jp/Music/Info/hitstyle/mhcl_779.html)。『覇穹 封神演義』「Keep the Heat and Fire Yourself Up」は[公式音楽ページ](https://www.tvhoushin-engi.com/music/index.html)で初代OP。

- 『ノラガミ』「午夜の待ち合わせ」と第2期『ARAGOTO』「狂乱 Hey Kids!!」は[作品公式の周年ページ](https://noragami-anime.net/10th_anniv/)でOP。『王様ランキング』「裸の勇者」は[第2クールOP](https://www.aniplex.co.jp/lineup/osama-ranking/news/detail/?id=59538)。『リコリス・リコイル』「ALIVE」は[公式音楽ページ](https://lycoris-recoil.com/music/op.html)。『SHIROBAKO』「COLORFUL BOX」は[公式ノンクレジット第1クールOP映像](https://www.youtube.com/watch?v=Tv8yJbgnxz0)。

- 『転生したらスライムだった件』「Nameless Story」「Storyteller」は[公式の第1期・第2期OP一覧](https://www.ten-sura.com/goods_event/goods/cd/post/6187)で照合。各期とも後続の第2弾OPがあるため第1クールとした。『ウィッチクラフトワークス』「divine intervention」は[公式CDページ](https://www.witch-cw-anime.jp/cd.html)でOP。

- 『おそ松さん』「はなまるぴっぴはよいこだけ」は[第1期のOP](https://osomatsusan.com/sp/1st/discography/detail.php?id=1011155)。『けいおん！』「ふわふわ時間」は[放送局資料の劇中歌表記](https://www.tbs.co.jp/anime/k-on/k-on_tv/disc/cd_1.html)、『けいおん!!』「GO! GO! MANIAC」「Listen!!」は[放送局のOP/ED情報](https://www.tbs.co.jp/anime/k-on/k-on_tv/news/news1002.html)。『ゆるゆり』第1期OPは[公式音楽ページ](https://yuruyuri.com/1st/music/)。『NEW GAME!』第1期OPは[公式広報資料](https://newgame-anime.com/assets/special/newspaper/newgame-newspaper-lv1.pdf)。

- 『変態王子と笑わない猫。』「Fantastic future」は[OP](https://www.kingrecords.co.jp/cs/g/gKICM-1441/)、「Baby Sweet Berry Love」は[ED](https://www.kingrecords.co.jp/cs/g/gKICM-91442/)。「DISCOTHEQUE」は[『ロザリオとバンパイア CAPU2』OP](https://news.kingrecords.co.jp/2026/04/53358/)。「Q&A リサイタル!」は[『となりの怪物くん』OP](https://www.tk-anime.info/special/opwp.html)。「Synchrogazer」は[『シンフォギア』第1期OP](https://www.kingrecords.co.jp/cs/g/gKICM-1377/)。「深愛」は[『WHITE ALBUM』前期OP](https://www.kingrecords.co.jp/cs/g/gKICA-2505/)。

- 『おジャ魔女どれみ』初代「おジャ魔女カーニバル!!」と第4作『ドッカ～ン！』「DANCE! おジャ魔女」は[東映の各作品音楽一覧](https://lineup.toei-anim.co.jp/ja/tv/doremi/song/)・[第4作一覧](https://lineup.toei-anim.co.jp/ja/tv/doremi_D/song/)でOP。『美少女戦士セーラームーン』DALI版「ムーンライト伝説」は[1992年版の東映OP一覧](https://lineup.toei-anim.co.jp/ja/tv/sailor_moon/song/)、ももいろクローバーZ「MOON PRIDE」は[Crystal版公式OP記載](https://sailormoon-official.com/animation/news/moon_pride.php)で区別。『プリパラ』「Make it!」は[公式CDページ](https://avex.jp/pripara/discography/detail.php?id=1008372)でOP。

- 『ギルティクラウン』「My Dearest」「The Everlasting Guilty Crown」は[公式商品ページ](https://guilty-crown.jp/goods/)で初代・新OP。『Angel Beats!』「Crow Song」は[公式制作コラム](https://www.angelbeats.jp/colum/cl09.html)で第1話の劇中演奏と照合。『蒼穹のファフナー』「Shangri-La」は[公式レーベル作品集](https://www.kingrecords.co.jp/cs/g/gKIZC-90764/)で初代OPと最終話EDの両方。

- 『D.Gray-man』「激動」は[ソニーのOP開始告知](https://www.sonymusic.co.jp/artist/UVERworld/info/229921)。『マギ』「V.I.P」は[アニプレックスの初代OP告知](https://www.aniplex.co.jp/lineup/magi/news/detail/?id=15297)。『ブラック・ジャック』「月光花」は[エイベックスのOP記載](https://avexnet.jp/release/1003250)。『中二病でも恋がしたい！』「Sparkling Daydream」は[歌手公式の第1期OP記載](https://zaqzaqzaq.jp/discography/sparkling-daydream%E3%80%90%E9%80%9A%E5%B8%B8%E7%9B%A4%E3%80%91/)。

- 『恋は雨上がりのように』「ノスタルジックレインフォール」は[公式OP情報](https://www.koiame-anime.com/music.html)、『アオハライド』「世界は恋に落ちている」は[公式OP情報](https://aoha-anime.com/product/cds/01.html)、『俺ガイル続』「春擬き」は[第2期OPの制作者インタビュー](https://www.lisani.jp/0000001556/)、『のうりん』「秘密の扉から会いにきて」は[作詞家公式のOP記載](https://akihata.jp/works/music/4563/)。

## 追加照合（2026-09-29）

- 『ハナヤマタ』「花ハ踊レヤいろはにほ」は[作品公式のOP告知](https://hanayamata.com/news/detail.php?id=1012668)、『ONE PIECE』「ココロのちず」は[作品公式のウォーターセブン編OP表記](https://one-piece.com/news/71321/index.html)。『BLACK LAGOON』「Red fraction」は[レーベルのOP表記](https://nbcuni-music.com/ive/mell/contents/hp0007/index00070000.html)、『ノーゲーム・ノーライフ』「This game」は[作品公式音楽ページ](https://ngnl.jp/tv/goods/music.html)。
- 『DARKER THAN BLACK -流星の双子-』「ツキアカリのミチシルベ」は[ソニーのOP記載](https://www.sonymusic.co.jp/artist/stereopony/discography/buy/SRCL-7145)、『シュタインズ・ゲート ゼロ』「ファティマ」は[作品公式OP告知](https://steinsgate0-anime.com/newsdetail/cd/%E3%82%AA%E3%83%BC%E3%83%97%E3%83%8B%E3%83%B3%E3%82%B0%E4%B8%BB%E9%A1%8C%E6%AD%8C%E3%80%8C%E3%83%95%E3%82%A1%E3%83%86%E3%82%A3%E3%83%9E%E3%80%8D/)、『艦これ』「海色」は[作品公式OP一覧](https://kancolle-anime.jp/goods/?page=cd)、『バジリスク』「甲賀忍法帖」は[キングレコードOP記載](https://www.kingrecords.co.jp/cs/g/gKICM-1819/)。
- 『金色のガッシュベル!!』「カサブタ」は[東映のOP一覧](https://lineup.toei-anim.co.jp/ja/tv/GB/song/)、2001年版『シャーマンキング』「Northern lights」は[キングレコードの新OP表記](https://www.kingrecords.co.jp/cs/g/gKICM-3027/)。長期放送作品ではクール数の推測を避け、OP番号を記載した。『ゆるキャン△』「SHINY DAYS」は[作品公式OP一覧](https://yurucamp.jp/first/music/)、『革命機ヴァルヴレイヴ』の2曲は[第1期音楽](https://www.valvrave.com/music/1st.html)と[第2期音楽](https://www.valvrave.com/music/)を照合。
- 『あなたのことはそれほど』「CQCQ」は[TBSの主題歌告知](https://www.tbs.co.jp/anasore/news/)、ドラマ『卒うた』「奏」は[スキマスイッチ公式テーマソング告知](https://www.sonymusic.co.jp/artist/sukimaswitch/info/334114)。『オレンジデイズ』「上海ハニー」は[TBSの商品説明](https://shopping.tbs.co.jp/tbs/product/P0072935)が劇中で使われる曲と明記。映画『ラフ ROUGH』の「奏」「全力少年」は[サントラ紹介](https://www.cdjournal.com/news/-/12355)で挿入歌として区別。『天体観測』の同名曲は[放送局の後年の番組情報](https://datazoo.jp/w/BUMP%2BOF%2BCHICKEN/69538760)などで挿入歌と確認。
- 「Nevereverland」は[歌手ナノの公式映像説明](https://www.youtube.com/watch?v=Hx_nMs-sjZg)で、TVアニメではなくOVA『アークIX』主題歌と記載。『AIR』「鳥の詩」は[Key公式](https://key.visualarts.gr.jp/product/air/qa/)のゲームOP、『リトルバスターズ!』同名曲も[Key公式](https://key.visualarts.gr.jp/event/character1/)のゲームOP。『ペルソナ4』「Reach Out To The Truth」は[アトラスの戦闘曲表記](https://www.atlus.co.jp/gamemusic/discography/reach-out-to-the-truth-revival/)、『ペルソナ3』「キミの記憶」は[制作関係者のED表記](https://blog.ja.playstation.com/2018/05/18/20180518-personadance/)。『レヴュースタァライト -Re LIVE-』「ディスカバリー！」は[共同開発会社のゲームテーマソング発表](https://prtimes.jp/main/html/rd/p/000001321.000001348.html)。
- イベント『SNOW MIKU 2017』「スターナイトスノウ」は[公式テーマソング一覧](https://snowmiku.com/2017/info_yukimiku.html)、2014年「好き！雪！本気マジック」は[公式サイト](https://snowmiku.com/2014/)のテーマ曲。『v flower DJ NIGHT』「ベノム」は[作曲者公式動画](https://www.youtube.com/watch?v=oRJBwaZ59fQ)のテーマソング表記。『第76回NHK全国学校音楽コンクール』「YELL」は[NHK出版の課題曲集](https://www.nhk-book.co.jp/detail/000000554352023.html)に中学校の部課題曲と記載。『ゾンビ・デ・ダンス』「唱」は[USJ発表](https://www.usj.co.jp/company/news/2023/0807/)で使用確認。
- 情報・音楽番組の用途は「踊」の[番組テーマソング報道](https://barks.jp/news/905201/)、「あの夢をなぞって」の[天気コーナー月間曲報道](https://realsound.jp/2020/06/post-561120.html/amp)、「群青」の[ダンス企画テーマ曲発表](https://prtimes.jp/main/html/rd/p/000001666.000055377.html)などで区別。「舞台に立って」は[歌手公式](https://yoasobi-fc.com/s/n135/page/officialdetail?id=565703)のNHKスポーツテーマ2024。『目撃!ドキュン』「春〜spring〜」は[小学館辞典](https://kotobank.jp/word/%E6%98%A5%EF%BD%9Espring%EF%BD%9E-1746580)のED表記を使用。

## 出典が特定できない項目

- ガルパID774「MATSURI BAYASHI」の従来の `フジテレビ系「魁!ミュージック」6月度マンスリーアーティスト` は[レーベル曲一覧](https://www.jvcmusic.co.jp/-/Discography/A024518/VICL-37158.html)にも原曲の番組内用途が明記されず、確認できるのはKEYTALKのアーティスト起用のみ。曲自身のOP/ED・番組使用曲は推測で補わず、元の記述を維持。
- アワーノーツID62「UNDEAD」は[作品公式の「主題歌」表記](https://www.monogatari-series.com/oms/2024/music/)を維持。OP/EDとしての用途は確認できない。
