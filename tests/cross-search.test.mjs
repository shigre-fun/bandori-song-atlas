import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { loadGameCatalog } from "../scripts/catalog.mjs";
import { GAMES, siteSettings } from "../src/js/site-config.js";
import {
  crossGameSongs,
  creditField,
  searchPage,
  normalize,
  matches,
} from "../src/js/domain.js";
import { renderCrossSearch } from "../src/js/views.js";
import { crossSearchURL, siteURL, songListPath } from "../src/js/urls.js";

const catalogs = Object.fromEntries(
  Object.values(GAMES).map((game) => [
    game.id,
    { songs: loadGameCatalog(game) },
  ]),
);
const sample = catalogs.garupa.songs[0];
const fixtures = (songs) => ({ garupa: { songs }, ournotes: { songs: [] } });
const links = (html, className) =>
  [
    ...html.matchAll(new RegExp(`<a class="${className}" href="([^"]+)"`, "g")),
  ].map(
    ([, href]) =>
      new URL(href.replaceAll("&amp;", "&"), "https://example.test"),
  );
const source = (file) =>
  fs
    .readFileSync(`src/js/${file}`, "utf8")
    .replace(/import[\s\S]*?from "[^"\n]+";\s*/g, "");
const flush = () => new Promise((resolve) => setImmediate(resolve));

test("cross-game search keeps all three Meiseikyo recordings in game and band order", () => {
  assert.deepEqual(
    crossGameSongs(catalogs, "迷星叫").map((song) => [
      song.gameId,
      song.stableSongId,
      song.title,
      song.band,
    ]),
    [
      ["garupa", "473", "迷星叫", "MyGO!!!!!"],
      ["garupa", "628", "迷星叫(パラレルver.)", "あこがれの共演"],
      ["ournotes", "1", "迷星叫", "MyGO!!!!!"],
    ],
  );
  for (const base of ["/", "/bandori-song-atlas/"]) {
    const html = renderCrossSearch(
      catalogs,
      new URLSearchParams({ q: "迷星叫" }),
      base,
    );
    assert.match(html, /3<small>件<\/small>/);
    assert.deepEqual(
      links(html, "search-detail").map((url) => url.pathname),
      [
        `${base}garupa/songs/473/`,
        `${base}garupa/songs/628/`,
        `${base}ournotes/songs/1/`,
      ],
    );
    for (const link of links(html, "search-detail")) {
      assert.equal(link.searchParams.get("from"), "search");
      assert.equal(link.searchParams.get("q"), "迷星叫");
      assert.equal(link.searchParams.get("page"), "1");
    }
  }
});

test("cross-game results show each recording's levels with five Garupa and four OurNotes difficulties", () => {
  for (const base of ["/", "/bandori-song-atlas/"]) {
    const html = renderCrossSearch(
      catalogs,
      new URLSearchParams({ q: "迷星叫" }),
      base,
    );
    const cards = [
      ...html.matchAll(/<li class="panel"[^>]*>([\s\S]*?)<\/li>/g),
    ].map(([, card]) => card);
    assert.equal(cards.length, 3);
    const expected = [
      [GAMES.garupa, ["6", "13", "19", "26", "27"]],
      [GAMES.garupa, ["6", "13", "19", "26", "27"]],
      [GAMES.ournotes, ["9", "13", "20", "25"]],
    ];
    cards.forEach((card, index) => {
      const [game, levels] = expected[index];
      const list = card.match(
        /<dl class="search-difficulties"([^>]*)>([\s\S]*?)<\/dl>/,
      );
      assert.ok(list, `${game.shortName} has a difficulty list`);
      assert.match(list[1], /aria-label="難易度・レベル"/);
      assert.deepEqual(
        [...list[2].matchAll(/<dt>([^<]*)<\/dt>/g)].map(([, label]) => label),
        game.difficulties,
      );
      assert.deepEqual(
        [...list[2].matchAll(/<dd[^>]*>([^<]*)<\/dd>/g)].map(
          ([, level]) => level,
        ),
        levels,
      );
      assert.ok(card.indexOf('<p class="band"') < card.indexOf("<dl "));
      assert.match(card, /<h3><a class="search-detail"[^>]*>[^<]+<\/a><\/h3>/);
      assert.equal((card.match(/class="search-detail"/g) || []).length, 1);
      assert.doesNotMatch(card, /→ 詳細|詳細→/);
      assert.doesNotMatch(list[2], /ノーツ|641|651|342|768/);
    });
  }
});

test("cross-game difficulty levels distinguish absent charts from unconfirmed levels", () => {
  const html = renderCrossSearch(
    fixtures([
      {
        ...sample,
        title: "難易度テスト",
        difficulties: [
          null,
          { level: null, notes: 12345 },
          { level: 0, notes: 23456 },
          { level: 28, notes: 34567 },
        ],
      },
    ]),
    new URLSearchParams({ q: "難易度テスト" }),
  );
  const list = html.match(
    /<dl class="search-difficulties"[^>]*>([\s\S]*?)<\/dl>/,
  );
  assert.ok(list);
  const rows = [
    ...list[1].matchAll(/<dt>([^<]*)<\/dt><dd class="([^"]*)">([^<]*)<\/dd>/g),
  ];
  assert.deepEqual(
    rows.map(([, label, , value]) => [label, value]),
    [
      ["EASY", "—"],
      ["NORMAL", "未確認"],
      ["HARD", "0"],
      ["EXPERT", "28"],
      ["SPECIAL", "—"],
    ],
  );
  assert.ok(rows[1][2].split(" ").includes("level-unknown"));
  assert.doesNotMatch(list[1], /12345|23456|34567/);
});

test("cross-game difficulty level text is HTML escaped", () => {
  const html = renderCrossSearch(
    fixtures([
      {
        ...sample,
        title: "レベル文字列テスト",
        difficulties: [{ level: '<img src=x onerror="alert(1)">&' }],
      },
    ]),
    new URLSearchParams({ q: "レベル文字列テスト" }),
  );
  const list = html.match(
    /<dl class="search-difficulties"[^>]*>([\s\S]*?)<\/dl>/,
  );
  assert.ok(list);
  assert.doesNotMatch(list[1], /<img|onerror="alert/);
  assert.match(
    list[1],
    /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;&amp;/,
  );
});

test("cross-game search inherits title, reading, aliases, artist and work matching without merging equal IDs", () => {
  const song = {
    ...sample,
    title: "LOUDER",
    reading: "ラウダー",
    aliases: ["ラウド"],
    artist: "原曲歌手",
    work: "グレンラガン",
    band: "検索対象外バンド",
  };
  const data = { garupa: { songs: [song] }, ournotes: { songs: [song] } };
  for (const q of [
    "ｌｏｕｄｅｒ",
    "らうだー",
    "ラウド",
    "原曲歌手",
    "グレンラガン",
  ])
    assert.equal(crossGameSongs(data, q).length, 2, q);
  assert.equal(crossGameSongs(data, "検索対象外バンド").length, 0);
  assert.equal(
    crossGameSongs(catalogs, "グレンラガン").length,
    Object.values(catalogs).flatMap((data) =>
      data.songs.filter((song) => matches(song, "グレンラガン")),
    ).length,
  );
});

test("empty and symbol-only queries show guidance, and missing queries show an empty result", () => {
  for (const q of ["", "　 ", "!!!!!", "（ ）★"]) {
    assert.equal(crossGameSongs(catalogs, q).length, 0);
    const html = renderCrossSearch(catalogs, new URLSearchParams({ q }));
    assert.match(html, /入力して検索してください/);
    assert.doesNotMatch(html, /search-detail|一致する楽曲はありません/);
  }
  const empty = renderCrossSearch(
    catalogs,
    new URLSearchParams({ q: "存在しない楽曲xyz" }),
  );
  assert.match(empty, /0<small>件<\/small>/);
  assert.match(empty, /一致する楽曲はありません/);
  assert.match(empty, /ガルパの楽曲一覧へ/);
  assert.match(empty, /アワーノーツの楽曲一覧へ/);
});

test("pagination shows 50 results, preserves special characters and clamps invalid pages", () => {
  const q = "テスト & 曲";
  const songs = Array.from({ length: 115 }, (_, index) => ({
    ...sample,
    title: q,
    id: index + 1,
    stableSongId: String(index + 1),
    seq: index + 1,
  }));
  const data = fixtures(songs);
  const params = new URLSearchParams({ q, page: "2" });
  const html = renderCrossSearch(data, params, "/atlas/");
  assert.equal(links(html, "search-detail").length, 50);
  assert.equal(
    links(html, "search-detail")[0].pathname,
    "/atlas/garupa/songs/51/",
  );
  assert.match(html, /2 \/ 3/);
  assert.equal(links(html, "search-detail")[0].searchParams.get("q"), q);
  for (const [, href] of html.matchAll(/<a href="([^"]+)"/g)) {
    const url = new URL(href.replaceAll("&amp;", "&"), "https://example.test");
    assert.equal(url.pathname, "/atlas/search/");
    assert.equal(url.searchParams.get("q"), q);
    assert.ok(["1", "2", "3"].includes(url.searchParams.get("page")));
  }
  assert.equal(
    links(
      renderCrossSearch(data, new URLSearchParams({ q, page: "999" })),
      "search-detail",
    ).length,
    15,
  );
  for (const value of [
    "0",
    "-1",
    "1.5",
    "Infinity",
    "2x",
    "NaN",
    "9007199254740992",
  ])
    assert.equal(searchPage(new URLSearchParams({ page: value }), 3), 1, value);
  assert.equal(searchPage(new URLSearchParams({ page: "999" }), 3), 3);
  assert.equal(params.get("page"), "2");
});

test("query, song title, band and accessible link names are escaped", () => {
  const value = '<img src=x onerror="alert(1)">&';
  const html = renderCrossSearch(
    fixtures([{ ...sample, title: value, band: value }]),
    new URLSearchParams({ q: value }),
  );
  assert.doesNotMatch(html, /<img|onerror="alert/);
  assert.match(html, /&lt;img/);
  assert.match(html, /&quot;alert/);
  assert.equal(links(html, "search-detail")[0].searchParams.get("q"), value);
});

function controller(q, fetcher, base = "/") {
  const input = { value: "" };
  const results = {
    innerHTML: "initial fallback links",
    attrs: new Map(),
    children: [],
    setAttribute(name, value) {
      this.attrs.set(name, value);
    },
    removeAttribute(name) {
      this.attrs.delete(name);
    },
    prepend(node) {
      this.children.unshift(node);
    },
  };
  const document = {
    querySelector: (selector) => (selector === "#search" ? input : results),
    createElement: () => ({
      attrs: new Map(),
      setAttribute(name, value) {
        this.attrs.set(name, value);
      },
    }),
  };
  vm.runInNewContext(source("cross-search.js"), {
    document,
    location: { search: "?" + new URLSearchParams({ q }) },
    URLSearchParams,
    GAMES,
    normalize,
    renderCrossSearch,
    siteBase: base,
    siteURL: (relative) => siteURL(relative, base),
    fetch: fetcher,
  });
  return { input, results };
}

test("controller waits for both catalogs and renders only the complete result on both deployment bases", async () => {
  for (const base of ["/", "/bandori-song-atlas/"]) {
    let finish;
    const requests = [];
    const ui = controller(
      "迷星叫",
      (url) => {
        requests.push(url);
        return url.includes("ournotes")
          ? new Promise((resolve) => {
              finish = resolve;
            })
          : Promise.resolve(Response.json(catalogs.garupa));
      },
      base,
    );
    assert.equal(ui.input.value, "迷星叫");
    await flush();
    assert.equal(ui.results.innerHTML, "initial fallback links");
    assert.equal(ui.results.attrs.get("aria-busy"), "true");
    assert.match(ui.results.children[0].textContent, /読み込んでいます/);
    finish(Response.json(catalogs.ournotes));
    await flush();
    assert.deepEqual(requests, [
      `${base}garupa/songs.json`,
      `${base}ournotes/songs.json`,
    ]);
    assert.equal(links(ui.results.innerHTML, "search-detail").length, 3);
    assert.equal(ui.results.attrs.has("aria-busy"), false);
  }
});

test("controller reports HTTP, network, JSON and malformed-catalog errors without partial results", async () => {
  for (const fail of [
    () => Response.error(),
    () => {
      throw new Error("offline");
    },
    () => new Response("invalid JSON"),
    () => Response.json({}),
  ]) {
    const ui = controller("迷星叫", async (url) =>
      url.includes("ournotes") ? fail() : Response.json(catalogs.garupa),
    );
    await flush();
    assert.equal(ui.results.innerHTML, "initial fallback links");
    assert.match(ui.results.children[0].textContent, /読み込めませんでした/);
    assert.equal(ui.results.children[0].attrs.get("role"), "alert");
    assert.equal(ui.results.attrs.has("aria-busy"), false);
  }
});

test("controller skips fetching catalogs for blank normalized queries", () => {
  for (const q of ["", "　", "!!!!!"]) {
    const ui = controller(q, () => assert.fail("should not fetch"));
    assert.equal(ui.input.value, q);
    assert.equal(ui.results.children.length, 0);
    assert.equal(ui.results.attrs.has("aria-busy"), false);
  }
});

test("detail return links restore cross-game query/page and retain game-list and legacy-root behavior", () => {
  for (const base of ["/", "/bandori-song-atlas/"]) {
    const run = (path, query) => {
      const back = { href: "original", textContent: "← 楽曲一覧に戻る" };
      const input = {};
      const location = {
        pathname: base + path,
        search: "?" + query,
        replace(value) {
          this.replaced = value;
        },
      };
      vm.runInNewContext(source("app.js"), {
        location,
        document: {
          querySelector: (selector) => (selector === "#search" ? input : back),
        },
        GAMES,
        URLSearchParams,
        siteBase: base,
        siteURL: (relative) => siteURL(relative, base),
        songListPath,
        crossSearchURL: (q, page) => crossSearchURL(q, page, base),
        searchPage,
        creditField,
      });
      return { back, input, location };
    };
    for (const game of Object.values(GAMES)) {
      const ui = run(
        `${game.slug}/songs/1/`,
        new URLSearchParams({ from: "search", q: "迷星叫 & ver.", page: "2" }),
      );
      assert.equal(ui.back.textContent, "← 全ゲームの検索結果に戻る");
      assert.equal(ui.back.href, crossSearchURL("迷星叫 & ver.", 2, base));
      const regular = run(`${game.slug}/songs/1/`, "q=迷星叫&page=2&band=7");
      assert.equal(regular.back.textContent, "← 楽曲一覧に戻る");
      assert.ok(regular.back.href.startsWith(`${base}${game.slug}/songs/?`));
      assert.match(regular.back.href, /band=7/);
      const invalid = run(
        `${game.slug}/songs/1/`,
        "from=search&q=test&page=-1",
      );
      assert.equal(invalid.back.href, crossSearchURL("test", 1, base));
    }
    const legacy = run("", "q=迷星叫&sort=level-3&page=2");
    assert.ok(legacy.location.replaced.startsWith(`${base}garupa/songs/?`));
    assert.match(legacy.location.replaced, /sort=level-3/);
  }
});

test("generated top/search pages expose search and no-JavaScript game links with correct metadata", () => {
  const base = siteSettings(process.env).basePath;
  const home = fs.readFileSync("dist/index.html", "utf8");
  const search = fs.readFileSync("dist/search/index.html", "utf8");
  assert.ok(
    home.indexOf('class="panel home-search"') <
      home.indexOf('class="game-cards"'),
  );
  assert.match(home, /全ゲームから楽曲を検索/);
  assert.ok(home.includes(`action="${base}search/"`));
  assert.ok(search.includes(`action="${base}search/"`));
  assert.ok(search.includes('name="robots" content="noindex,follow"'));
  assert.match(search, /cross-search\.js\?v=/);
  assert.doesNotMatch(search, /準備中/);
  for (const game of Object.values(GAMES))
    assert.ok(search.includes(`href="${base}${game.slug}/songs/"`));
  assert.ok(
    search.includes(`${siteSettings(process.env).origin}${base}search/`),
  );
});
