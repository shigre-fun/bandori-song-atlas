# Split review

有限の明示reviewと候補regex splitを分離。記号だけの候補はB2から除外する。原文はraw-token-map.jsonにrole/record別保存。

| role | rawCredit | status | candidate tokens | reason |
| --- | --- | --- | --- | --- |
| lyricist | SAKURAmoti / 美波 | REVIEW_RECOMMENDED | SAKURAmoti / 美波 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | メガテラ・ゼロ | REVIEW_RECOMMENDED | メガテラ・ゼロ | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 久下真音、つむぎしゃち | REVIEW_RECOMMENDED | 久下真音 / つむぎしゃち | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 植木建象、YOUSAY | REVIEW_RECOMMENDED | 植木建象 / YOUSAY | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 瀬名水紀、Aira | REVIEW_RECOMMENDED | 瀬名水紀 / Aira | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | KANATA OKAJIMA・Carlos K. | REVIEW_RECOMMENDED | KANATA OKAJIMA・Carlos K. | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 植木建象/加藤貴之 | REVIEW_RECOMMENDED | 植木建象 / 加藤貴之 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | メガテラ・ゼロ | REVIEW_RECOMMENDED | メガテラ・ゼロ | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | ACAね×ぬゆり | REVIEW_RECOMMENDED | ACAね×ぬゆり | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | KOHSHI ASAKAWA・KEIGO HAYASHI | REVIEW_RECOMMENDED | KOHSHI ASAKAWA・KEIGO HAYASHI | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 都丸椋太（Elements Garden）/櫻澤ヒカル | REVIEW_RECOMMENDED | 都丸椋太 / 櫻澤ヒカル | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 堀江晶太、Nor | REVIEW_RECOMMENDED | 堀江晶太 / Nor | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | 烏屋 茶房、篠崎 あやと | REVIEW_RECOMMENDED | 烏屋 茶房 / 篠崎 あやと | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 山口一郎、岩寺基晴、草刈愛美、岡崎英美、江島啓一 | REVIEW_RECOMMENDED | 山口一郎 / 岩寺基晴 / 草刈愛美 / 岡崎英美 / 江島啓一 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | 白神真志朗、 Sekimen | REVIEW_RECOMMENDED | 白神真志朗 / Sekimen | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | アイナ・ジ・エンド、Shin Sakiura | REVIEW_RECOMMENDED | アイナ・ジ・エンド / Shin Sakiura | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 笠井雄太（Elements Garden）/川渕龍成 | REVIEW_RECOMMENDED | 笠井雄太 / 川渕龍成 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | 渡辺徹/森月キャス | REVIEW_RECOMMENDED | 渡辺徹 / 森月キャス | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 安部大希-amazuti-/宮崎諒-amazuti- | REVIEW_RECOMMENDED | 安部大希-amazuti- / 宮崎諒-amazuti- | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | ナユタセイジ / ナナヲアカリ | REVIEW_RECOMMENDED | ナユタセイジ / ナナヲアカリ | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 白神真志朗、千石ユノ | REVIEW_RECOMMENDED | 白神真志朗 / 千石ユノ | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | ZUN/Masayoshi Minoshima（Alstroemeria Records） | REVIEW_RECOMMENDED | ZUN / Masayoshi Minoshima（Alstroemeria Records） | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 植木建象、加藤貴之 | REVIEW_RECOMMENDED | 植木建象 / 加藤貴之 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | メガテラ・ゼロ | REVIEW_RECOMMENDED | メガテラ・ゼロ | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 哥丸雄貴、堀江晶太 | REVIEW_RECOMMENDED | 哥丸雄貴 / 堀江晶太 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 都丸椋太 （Elements Garden）/川渕龍成 | REVIEW_RECOMMENDED | 都丸椋太 / 川渕龍成 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | Carlos K.・加賀爪 タッド | REVIEW_RECOMMENDED | Carlos K.・加賀爪 タッド | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | ユリイ・カノン | REVIEW_RECOMMENDED | ユリイ・カノン | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | Nor, 堀江晶太 | REVIEW_RECOMMENDED | Nor / 堀江晶太 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | SAKURAmoti / 美波 | REVIEW_RECOMMENDED | SAKURAmoti / 美波 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 馬場　龍樹／遠藤　ナオキ | REVIEW_RECOMMENDED | 馬場　龍樹 / 遠藤　ナオキ | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 藤井健太郎、瀬名水紀(Dream Monster) | REVIEW_RECOMMENDED | 藤井健太郎 / 瀬名水紀 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 堀江晶太、白神真志朗 | REVIEW_RECOMMENDED | 堀江晶太 / 白神真志朗 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | アイナ・ジ・エンド、Shin Sakiura | REVIEW_RECOMMENDED | アイナ・ジ・エンド / Shin Sakiura | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | Reol、Giga | REVIEW_RECOMMENDED | Reol / Giga | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | 仲町あられ、堀江晶太 | REVIEW_RECOMMENDED | 仲町あられ / 堀江晶太 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 篠崎あやと、橘 亮祐 | REVIEW_RECOMMENDED | 篠崎あやと / 橘 亮祐 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | 篠崎あやと、橘 亮祐 | REVIEW_RECOMMENDED | 篠崎あやと / 橘 亮祐 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 篠崎 あやと、ヒゲドライバー | REVIEW_RECOMMENDED | 篠崎 あやと / ヒゲドライバー | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 菊田大介（Elements Garden）/ 川渕龍成 | REVIEW_RECOMMENDED | 菊田大介 / 川渕龍成 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | Fukase/Nick Rotteveel/Marcus Van Wattum | REVIEW_RECOMMENDED | Fukase / Nick Rotteveel / Marcus Van Wattum | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | こっちのけんと / GRP | REVIEW_RECOMMENDED | こっちのけんと / GRP | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 都丸椋太（Elements Garden）／川渕龍成 | REVIEW_RECOMMENDED | 都丸椋太 / 川渕龍成 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 瀬名水紀、Aira | REVIEW_RECOMMENDED | 瀬名水紀 / Aira | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | 田中怜子、小林鉄兵、Lotus Juice | REVIEW_RECOMMENDED | 田中怜子 / 小林鉄兵 / Lotus Juice | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 都丸椋太 （Elements Garden） /川渕龍成 | REVIEW_RECOMMENDED | 都丸椋太 （Elements Garden） / 川渕龍成 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 白神真志朗、千石ユノ | REVIEW_RECOMMENDED | 白神真志朗 / 千石ユノ | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | MAQUMA, JACK | REVIEW_RECOMMENDED | MAQUMA / JACK | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 涼木シンジ、Gohgo | REVIEW_RECOMMENDED | 涼木シンジ / Gohgo | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | 仲町あられ、千石ユノ、堀江晶太 | REVIEW_RECOMMENDED | 仲町あられ / 千石ユノ / 堀江晶太 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 影山ヒロノブ・きただにひろし | REVIEW_RECOMMENDED | 影山ヒロノブ・きただにひろし | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 堀江晶太、千石ユノ | REVIEW_RECOMMENDED | 堀江晶太 / 千石ユノ | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | ケンモチヒデフミ、Skye K | REVIEW_RECOMMENDED | ケンモチヒデフミ / Skye K | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | Ayase/藤田淳平（Elements Garden） | REVIEW_RECOMMENDED | Ayase / 藤田淳平 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | 瀬名水紀(Dream Monster)、Aira(Dream Monster) | REVIEW_RECOMMENDED | 瀬名水紀 / Aira | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| arranger | DjeDje、KENSEI、三村一輝 | REVIEW_RECOMMENDED | DjeDje / KENSEI / 三村一輝 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | MK-METAL・NORiMETAL | REVIEW_RECOMMENDED | MK-METAL・NORiMETAL | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 千石ユノ、堀江晶太 | REVIEW_RECOMMENDED | 千石ユノ / 堀江晶太 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | 白神真志朗、仲町あられ | REVIEW_RECOMMENDED | 白神真志朗 / 仲町あられ | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | n-buna・Orangestar | REVIEW_RECOMMENDED | n-buna・Orangestar | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | 瀬名水紀(Dream Monster)、Aira(Dream Monster) | REVIEW_RECOMMENDED | 瀬名水紀 / Aira | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| lyricist | ユリイ・カノン | REVIEW_RECOMMENDED | ユリイ・カノン | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | TAKUYA∞、彰 | REVIEW_RECOMMENDED | TAKUYA∞ / 彰 | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |
| composer | MAQUMA, JACK | REVIEW_RECOMMENDED | MAQUMA / JACK | 記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。 |

所属単独credit Elements Gardenは既存organization cr-0002として保持。Spirit Gardenは別制作ブランド。会社括弧は個人tokenのaffiliationであり参加を二重計上しない。
