import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { creditParts, matchesCredit } from "../src/js/credits.js";
import { crossGameSongs, creditField, searchPage } from "../src/js/domain.js";
import { renderDetail, renderCrossSearch } from "../src/js/views.js";
import { GAMES } from "../src/js/site-config.js";
import { crossSearchURL, siteURL, songListPath } from "../src/js/urls.js";
import { loadGameCatalog } from "../scripts/catalog.mjs";

const catalogs = Object.fromEntries(
  Object.values(GAMES).map((game) => [
    game.id,
    { songs: loadGameCatalog(game) },
  ]),
);
const sample = catalogs.garupa.songs[0];
const names = (value) =>
  creditParts(value)
    .filter((part) => part.name)
    .map((part) => part.text.trim());
const urls = (html, className) =>
  [
    ...html.matchAll(new RegExp(`<a class="${className}" href="([^"]+)"`, "g")),
  ].map(
    ([, href]) =>
      new URL(href.replaceAll("&amp;", "&"), "https://example.test"),
  );

test("credits split every supported collaboration delimiter and retain parentheses and single names", () => {
  for (const separator of [
    "、",
    ", ",
    "／",
    "/",
    "・",
    " ＆ ",
    " & ",
    "×",
    ";",
    "\n",
  ])
    assert.deepEqual(names(`作曲者A（所属、A/B）${separator}作曲者B`), [
      "作曲者A（所属、A/B）",
      "作曲者B",
    ]);
  for (const name of [
    "アイナ・ジ・エンド",
    "メガテラ・ゼロ",
    "ユリイ・カノン",
    "ブレンド・A",
    "Fear, and Loathing in Las Vegas",
    "神様、僕は気づいてしまった",
    "MYTH & ROID",
    "LIP×LIP",
  ])
    assert.deepEqual(names(name), [name]);
  assert.deepEqual(names("アイナ・ジ・エンド、Shin Sakiura"), [
    "アイナ・ジ・エンド",
    "Shin Sakiura",
  ]);
  assert.deepEqual(names("Neru feat.鏡音リン、鏡音レン"), [
    "Neru",
    "鏡音リン",
    "鏡音レン",
  ]);
  assert.deepEqual(names("Orangestar feat.夏背 & ルワン"), [
    "Orangestar",
    "夏背",
    "ルワン",
  ]);
  assert.deepEqual(names("大橋卓弥 常田真太郎"), ["大橋卓弥", "常田真太郎"]);
  assert.deepEqual(
    names("逢坂大河（釘宮理恵）櫛枝実乃梨（堀江由衣）川嶋亜美（喜多村英梨）"),
    [
      "逢坂大河（釘宮理恵）",
      "櫛枝実乃梨（堀江由衣）",
      "川嶋亜美（喜多村英梨）",
    ],
  );
  assert.deepEqual(names(null), []);
});

test("individual matching handles affiliations, width, spaces and case without substring matches", () => {
  assert.ok(
    matchesCredit(
      "上松 範康（Elements Garden）/日高勇輝（Elements Garden）",
      "上松範康",
    ),
  );
  assert.ok(matchesCredit("ＵＺ", "UZ(SPYAIR)"));
  assert.ok(matchesCredit("Diggy-MO’、松坂康司(SUPA LOVE)", "diggy-mo'"));
  assert.ok(!matchesCredit("堀江晶太、白神真志朗", "堀江"));
  assert.ok(!matchesCredit(null, "堀江晶太"));
  assert.ok(!matchesCredit("堀江晶太", "（所属）"));
});

test("role searches include solo and collaborative credits from both games and exclude the other role", () => {
  const songs = [
    { ...sample, id: 1, composer: "作曲者A", artist: "別人" },
    { ...sample, id: 2, composer: "作曲者B、作曲者A（所属）", artist: "別人" },
    { ...sample, id: 3, composer: "別人", artist: "作曲者A" },
    { ...sample, id: 4, composer: "作曲者AB", artist: null },
  ];
  const data = {
    garupa: { songs },
    ournotes: { songs: [{ ...songs[1], composer: "作曲者A/作曲者C" }] },
  };
  assert.deepEqual(
    crossGameSongs(data, "作曲者A", "composer").map((s) => [s.gameId, s.id]),
    [
      ["garupa", 1],
      ["garupa", 2],
      ["ournotes", 2],
    ],
  );
  assert.deepEqual(
    crossGameSongs(data, "作曲者A", "artist").map((s) => s.id),
    [3],
  );
  assert.deepEqual(
    crossGameSongs(data, "作曲者B", "composer").map((s) => s.id),
    [2],
  );
  const real = crossGameSongs(catalogs, "日高勇輝", "composer");
  assert.ok(real.some((s) => names(s.composer).length > 1));
  assert.ok(real.some((s) => names(s.composer).length === 1));
  assert.ok(
    crossGameSongs(catalogs, "Diggy-MO’", "composer").some(
      (s) => s.gameId === "ournotes",
    ),
  );
  assert.ok(
    crossGameSongs(catalogs, "水樹奈々", "artist").some((s) =>
      s.artist.includes("×"),
    ),
  );
});

test("both games render individual role links, retain original credit text, escape HTML and leave unknown values unlinked", () => {
  for (const base of ["/", "/atlas/"])
    for (const game of Object.values(GAMES)) {
      const composer =
        "藤田淳平（Elements Garden）/日高勇輝（Elements Garden）";
      const artist = "T.M.Revolution × 水樹奈々";
      const html = renderDetail(
        { ...sample, type: "anime", composer, artist },
        { updatedAt: sample.publishedAt },
        new URLSearchParams(),
        base,
        game,
      );
      const links = urls(html, "credit-link");
      assert.deepEqual(
        links.map((url) => [
          url.searchParams.get("credit"),
          url.searchParams.get("q"),
        ]),
        [
          ["composer", "藤田淳平（Elements Garden）"],
          ["composer", "日高勇輝（Elements Garden）"],
          ["artist", "T.M.Revolution"],
          ["artist", "水樹奈々"],
        ],
      );
      for (const link of links) assert.equal(link.pathname, `${base}search/`);
      const dd = [...html.matchAll(/<dd>([\s\S]*?)<\/dd>/g)].map(([, value]) =>
        value.replace(/<[^>]*>/g, ""),
      );
      assert.ok(dd.includes(composer));
      assert.ok(dd.includes(artist));
      assert.equal(
        urls(
          renderDetail(
            { ...sample, composer: null, artist: null, type: "anime" },
            { updatedAt: sample.publishedAt },
          ),
          "credit-link",
        ).length,
        0,
      );
      const malicious = renderDetail(
        { ...sample, composer: '<img src=x onerror="alert(1)">', artist: null },
        { updatedAt: sample.publishedAt },
      );
      assert.doesNotMatch(malicious, /<img|onerror="alert/);
      assert.match(malicious, /&lt;img/);
    }
});

test("credit result pagination and detail navigation preserve name and role on both bases", () => {
  for (const base of ["/", "/atlas/"])
    for (const credit of ["composer", "artist"]) {
      const q = "Giga";
      const songs = Array.from({ length: 115 }, (_, index) => ({
        ...sample,
        id: index + 1,
        stableSongId: String(index + 1),
        [credit]: "Giga ＆ TeddyLoid",
      }));
      const params = new URLSearchParams({ q, credit, page: "2" });
      const html = renderCrossSearch(
        { garupa: { songs }, ournotes: { songs: [] } },
        params,
        base,
      );
      assert.match(html, /115<small>件<\/small>/);
      assert.match(
        html,
        credit === "composer" ? /作曲に関わった楽曲/ : /原曲アーティストの楽曲/,
      );
      assert.equal(urls(html, "search-detail").length, 50);
      for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
        const url = new URL(
          href.replaceAll("&amp;", "&"),
          "https://example.test",
        );
        assert.equal(url.searchParams.get("q"), q);
        assert.equal(url.searchParams.get("credit"), credit);
      }
      const back = {};
      vm.runInNewContext(
        fs
          .readFileSync("src/js/app.js", "utf8")
          .replace(/import[\s\S]*?from "[^"\n]+";\s*/g, ""),
        {
          location: {
            pathname: base + "garupa/songs/1/",
            search: urls(html, "search-detail")[0].search,
          },
          document: {
            querySelector: (selector) => (selector === ".back" ? back : {}),
          },
          GAMES,
          URLSearchParams,
          siteBase: base,
          siteURL: (relative) => siteURL(relative, base),
          songListPath,
          crossSearchURL,
          creditField,
          searchPage,
        },
      );
      assert.equal(back.href, crossSearchURL(q, 2, base, credit));
    }
  assert.equal(creditField(new URLSearchParams({ credit: "__proto__" })), null);
});

test("credit search controller loads both catalogs and renders role-specific results", async () => {
  const results = {
    setAttribute() {},
    removeAttribute() {},
    prepend() {},
    innerHTML: "",
  };
  const params = new URLSearchParams({ q: "日高勇輝", credit: "composer" });
  const requests = [];
  vm.runInNewContext(
    fs
      .readFileSync("src/js/cross-search.js", "utf8")
      .replace(/import[\s\S]*?from "[^"\n]+";\s*/g, ""),
    {
      location: { search: "?" + params },
      document: {
        querySelector: (selector) => (selector === "#search" ? {} : results),
        createElement: () => ({ setAttribute() {} }),
      },
      URLSearchParams,
      GAMES,
      normalize: (value) => value,
      renderCrossSearch,
      siteBase: "/",
      siteURL,
      fetch: async (url) => {
        requests.push(url);
        return Response.json(
          url.includes("ournotes") ? catalogs.ournotes : catalogs.garupa,
        );
      },
    },
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests.length, 2);
  assert.match(results.innerHTML, /作曲に関わった楽曲/);
  assert.equal(
    urls(results.innerHTML, "search-detail").length,
    crossGameSongs(catalogs, "日高勇輝", "composer").length,
  );
});
