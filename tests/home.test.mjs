import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  HOME_DESCRIPTION,
  HERO_DESCRIPTION,
  renderHomeCreators,
} from "../scripts/home.mjs";
import { OPERATOR_X_URL, siteSettings } from "../src/js/site-config.js";

const master = JSON.parse(fs.readFileSync("data/creators.json", "utf8"));
const home = () => fs.readFileSync("dist/index.html", "utf8");
const count = (html) =>
  Number(html.match(/class="home-creator-number">\s*(\d+)\s*</)?.[1]);

test("home Creator count follows the master and grows without a fixed count", () => {
  assert.equal(
    count(renderHomeCreators(master.creators)),
    master.creators.length,
  );
  assert.equal(count(home()), master.creators.length);
  assert.equal(
    count(
      renderHomeCreators([...master.creators, { id: "test-next-creator" }]),
    ),
    master.creators.length + 1,
  );
  assert.match(home(), /<dt>登録クリエイター<\/dt>/);
  assert.match(home(), /class="sr-only">主体<\/span\s*>/);
  assert.match(home(), /class="home-creator-unit" aria-hidden="true">CREATORS/);
});

test("home Creator CTA works at root and subpath with descriptive static roles", () => {
  for (const base of ["/", "/bandori-song-atlas/"]) {
    const section = renderHomeCreators(master.creators, base);
    assert.ok(section.includes(`href="${base}creators/"`));
    assert.match(section, /クリエイター一覧を見る/);
    for (const role of ["作詞", "作曲", "編曲"])
      assert.ok(section.includes(`<li>${role}</li>`));
    assert.doesNotMatch(section, /<button|<script/);
  }
  assert.ok(
    home().includes(`href="${siteSettings(process.env).basePath}creators/"`),
  );
});

test("home presents Creator discovery before news and compact operator information", () => {
  const html = home();
  const markers = [
    'class="intro home-intro"',
    'class="panel home-search"',
    'class="game-cards"',
    'class="panel home-creators"',
    'class="panel home-news"',
    'class="home-x"',
    "<footer>",
  ].map((marker) => html.indexOf(marker));
  assert.ok(markers.every((position) => position >= 0));
  assert.ok(
    markers.every(
      (position, index) => index === 0 || position > markers[index - 1],
    ),
  );
  assert.match(html, /aria-labelledby="home-creators-title"/);
  assert.match(
    html,
    /<h2 id="home-creators-title">クリエイターから楽曲を探す<\/h2>/,
  );
  const operator = html.match(/<aside class="home-x"[\s\S]*?<\/aside>/)?.[0];
  assert.ok(operator);
  assert.ok(operator.includes(`href="${OPERATOR_X_URL}"`));
  assert.match(operator, /運営者：タニマチ/);
  assert.doesNotMatch(
    operator,
    /<h[1-6]|class="panel|class="home-creators-cta/,
  );
});

test("home Hero and description explain Creator discovery and keep existing brand assets", () => {
  const html = home();
  const text = html.replace(/\s+/g, "");
  assert.ok(text.includes(HERO_DESCRIPTION.replace(/\s+/g, "")));
  assert.ok(text.includes(HOME_DESCRIPTION.replace(/\s+/g, "")));
  for (const metadata of [
    'name="description"',
    'property="og:description"',
    'name="twitter:description"',
  ]) {
    assert.ok(html.includes(metadata));
  }
  assert.doesNotMatch(
    HERO_DESCRIPTION + HOME_DESCRIPTION,
    /完全収録|全クレジット/,
  );
  const { assets, basePath } = siteSettings(process.env);
  assert.ok(html.includes(`${basePath}${assets.favicon}`));
  assert.ok(html.includes(`${basePath}${assets.siteOg}`));
});
