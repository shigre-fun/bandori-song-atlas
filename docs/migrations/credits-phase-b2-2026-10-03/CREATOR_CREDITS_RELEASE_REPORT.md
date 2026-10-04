# Creator credits release report（公開完了）

根拠：[release-verification.json](release-verification.json)、[release-requirements-audit.md](release-requirements-audit.md)、[release-deployment-verification.json](release-deployment-verification.json)、[production-verification.json](production-verification.json)、[production-browser-verification.json](production-browser-verification.json)、[production-assets-verification.json](production-assets-verification.json)、[production-admin-read-verification.json](production-admin-read-verification.json)。原B2履歴はPHASE_B2_REPORT下部・fixtureへ保持。

## 1. release date

2026-10-04（日本時間）

## 2. final commit SHA

769bbed983c7ec828c16cd57dadcef0725048443（公開コードcommit。終了検証文書は別のaudit-only commitで同期）

## 3. commit message

feat: add lyricist and arranger creator credits

## 4. pushed branch

main → origin/main、通常push。公開済み10commitを祖先に保持。

## 5. CI status

成功。[Actions](https://github.com/shigre-fun/bandori-song-atlas/actions/runs/37134688084)

## 6. Cloudflare deployment status

既存Git連携成功。[Cloudflare](https://dash.cloudflare.com/?to=/0371eacbdeb1f15a79ad2a4b8b7c05cd/pages/view/bandori-song-atlas/1b5dc9d8-e4f8-4a94-9737-30c83bb254d1)

## 7. deployed SHA

769bbed983c7ec828c16cd57dadcef0725048443

## 8. production domain

https://tanimachi-bdsongs.com

## 9. Creator count

124

## 10. nextId

125

## 11. new Creator count

91から33追加

## 12. cr-0118 宮崎京一

cr-0118 宮崎京一 / みやざききょういち / kyoichi-miyazaki / person。8 Work・8収録、L0/C0/A8。

## 13. cr-0119 母里治樹

cr-0119 母里治樹 / もりはるき / haruki-mori / person。4 Work・4収録、L0/C2/A4。

## 14. cr-0120 川渕龍成

cr-0120 川渕龍成 / かわぶちりゅうせい / ryusei-kawabuchi / person。6 Work・6収録、L0/C0/A6。

## 15. metadata blocked 0

0、過去BLOCKED履歴をfixtureへ保持

## 16. record count

885＝Garupa799＋OurNotes86（最新人間承認）

## 17. Work count

823、data/works.json byte SHA不変

## 18. Work warning

0

## 19. lyricist formal resolution

615/835、raw220、未知50

## 20. Garupa arranger formal resolution

718/751、raw33、未知48

## 21. OurNotes arranger formal resolution

2/5、raw3、未収集81

## 22. composer resolution

619/885、raw266。新86のカンザキイオリはmaster未登録のためraw保持。

## 23. fallback counts

作詞220／GP編曲33／Own編曲3／作曲266

## 24. credit unconfirmed counts

旧未確定147、作詞未知50/GP編曲未知48。新86の作詞・編曲未収集2は別記。

## 25. OurNotes uncollected arranger 80

旧80件＋新86の1件＝81。旧手動資料不変。

## 26. duplicate ID

0

## 27. duplicate slug

current＋previous collision0、ID型current0

## 28. dangling ref

0

## 29. unresolved formal relation

CONFIRMED-only。未同定・非承認splitへ波及0。

## 30. candidateKey public relation

公開20JSON research key0

## 31. roleCoverage

L/C両game ready、編曲GP ready/Own partial

## 32. old display comparison

旧2652比較で既存の非空表示変更・消失0、現在2655比較。原旧空1591＋人間作曲2補完は別分類。

## 33. OurNotes parallel edits preserved

OurNotes50/51/52全field保持。最新9曲non-credit＋86新曲＋GP758相互リンク＋admin-state next87保持。

## 34. tests

253/253成功（旧194＋旧B2 35assert不変＋新24）。最終並行編集後release24も再成功。CIとCloudflareも同じ253件全成功。

## 35. root build

成功

## 36. subpath build

/bandori-song-atlas/成功

## 37. root SEO

1018正規・885詳細・797旧曲・18旧Creator

## 38. subpath SEO

rootと同件数、origin/base canonical一致

## 39. Functions compile

Wrangler4.143.0 compile成功。Cloudflare Wrangler3.114.17も成功。

## 40. production /creators/

HTTP200、124 Creator

## 41. new 3 Creator pages

3名200、current canonical一致

## 42. representative Creator pages

asuka-oda/kou-nakamura/kotaro-shimoda/spirit-garden/samfree/aira 200

## 43. sitemap

124 current Creator URL、1018 canonical、候補URL0

## 44. canonical

全124 Creator current URLとcanonical一致

## 45. Mela!

長屋晴子→小林壱誓／peppe→穴見真吾、順序・リンク保持

## 46. きゅ〜まい＊flower

3収録の末益涼太・竹田祐介リンク正常

## 47. ルカルカ★ナイトフィーバー

samfree identityリンク、SAM(samfree)原文保持

## 48. 砂寸奏

槇島隆人作曲リンク正常

## 49. Symbol IV : Earth

長谷川大介→Diggy-MO’共同作曲順序保持

## 50. カーネーションの咲く日に

Aira作詞、瀬名水紀→Aira作曲

## 51. affiliation double count 0

所属は人物rawに保持、別organization relation0

## 52. fallback production

未同定rawとlegacy cross-search保持、誤Creatorリンク0

## 53. OurNotes partial UI

編曲一部登録と全81未整備・確認中表示、編曲者なし誤表示0

## 54. admin smoke

3admin200。Creator124件は同じ管理読取実装とユーザーの接続後画面表示で確認。GitHub GETのみ、保存0。

## 55. contact smoke

/contact/200、GET /api/contact405、メール送信0

## 56. static assets

全33 JS/CSS 200・公開commitのGit blobと厳密一致。環境別asset識別子もbuild入力から再計算一致。

## 57. browser console

代表4ページの重大console error0

## 58. responsive

390/1280の一覧・詳細・曲ページoverflow0

## 59. redirects

18旧slug×2形式＝36、direct301→current1hop。新3のredirect追加0

## 60. research leakage

両build2777file/20JSON非混入、本番内部research URL非配信

## 61. production bug有無

本番重大bug0。remote新86 workId未整備によるbuild失敗は今回の明示Work付与で解消。

## 62. post-release correction有無

製品hotfixなし。Cloudflare初回は旧Build commandが歴史fixtureを迂回し237件中25失敗。設定をpnpm test経由へ修正し、同769bbedで253件成功・公開成功。履歴guardの弱体化0。

## 63. remaining unresolved

703＝旧credit147＋split/identity473＋旧Own80＋新86 L/A未収集2・composer未同定1。split59、metadata0。

## 64. future OurNotes manual collection

旧80手動資料452SHA不変、新1を区別。追加収集未実施。

## 65. final release judgment

全release gate成功、公開完了。
