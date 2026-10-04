import { siteURL } from "../src/js/urls.js";

export const HOME_DESCRIPTION =
  "ガルパ・アワーノーツの楽曲情報をまとめた非公式データベース。楽曲名や、作詞・作曲・編曲を担当したクリエイターから参加楽曲を探せます。";

export const HERO_DESCRIPTION =
  "ガルパ・アワーノーツの楽曲情報をまとめた非公式データベース。楽曲だけでなく、作詞・作曲・編曲を担当したクリエイターからも作品を探せます。";

export function renderHomeCreators(creators, basePath = "/") {
  return `<section class="panel home-creators" aria-labelledby="home-creators-title">
<div class="home-creators-content"><h2 id="home-creators-title">クリエイターから楽曲を探す</h2>
<ul class="home-creator-roles" aria-label="クレジットの担当"><li>作詞</li><li>作曲</li><li>編曲</li></ul>
<p>バンドリ楽曲の作詞・作曲・編曲クレジットをクリエイターごとに整理しています。<br>気になる作家から、両ゲームの参加楽曲を横断して探せます。</p>
<a class="home-creators-cta" href="${siteURL("creators/", basePath)}">クリエイター一覧を見る<span aria-hidden="true"> →</span></a>
<p class="home-creators-help">名前・別名・読みから検索できます。</p></div>
<dl class="home-creator-count"><dt>登録クリエイター</dt><dd><span class="home-creator-number">${creators.length}</span><span class="sr-only">主体</span><span class="home-creator-unit" aria-hidden="true">CREATORS</span></dd></dl>
</section>`;
}
