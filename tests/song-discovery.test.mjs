import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { GAMES } from "../src/js/site-config.js";
import { BAND_THEMES, bandTheme } from "../src/js/band-theme.js";
import {
  renderSongList,
  CROSS_GAME,
  titlePhrases,
} from "../src/js/song-list.js";
import { songUpdatedAt } from "../scripts/song-updates.mjs";
const song = (game, id, band, type = "normal", level = 10) => ({
  id,
  stableSongId: String(id),
  title: `楽曲${id}`,
  band,
  type,
  publishedAt: id,
  difficulties: game.difficulties.map(() => ({ level, notes: level * 10 })),
});
const catalogs = {
  garupa: {
    songs: [
      song(GAMES.garupa, 1, "Poppin'Party"),
      song(GAMES.garupa, 2, "Roselia", "tie_up", 20),
    ],
  },
  ournotes: { songs: [song(GAMES.ournotes, 3, "millsage", "anime", 15)] },
};
const cards = (html) =>
  [...html.matchAll(/<li class="song-card"[\s\S]*?<\/li>/g)].map((m) => m[0]);
const render = (params) =>
  renderSongList(catalogs, new URLSearchParams(params), "/atlas/", CROSS_GAME);

test("cross discovery starts with all recordings, 13 bands and only shared filters", () => {
  const html = render("");
  assert.equal(cards(html).length, 3);
  assert.equal((html.match(/data-filter="band"/g) || []).length, 13);
  assert.equal((html.match(/data-filter="type"/g) || []).length, 2);
  assert.doesNotMatch(
    html,
    /data-filter="songType"|data-filter="gekisou"|type="checkbox"|song-filter-panel" open/,
  );
  assert.equal(cards(render("type=anime")).length, 2);
  assert.equal(cards(render("type=anime&band=10")).length, 1);
  assert.match(cards(render("type=anime&band=10"))[0], /楽曲3/);
});

test("cross sorting compares games together and keeps missing SPECIAL last in either direction", () => {
  assert.deepEqual(
    cards(render("sort=level&difficulty=3")).map((h) => h.match(/楽曲\d+/)[0]),
    ["楽曲2", "楽曲3", "楽曲1"],
  );
  assert.deepEqual(
    cards(render("sort=level&difficulty=3&direction=reverse")).map(
      (h) => h.match(/楽曲\d+/)[0],
    ),
    ["楽曲1", "楽曲3", "楽曲2"],
  );
  for (const direction of ["forward", "reverse"])
    assert.match(
      cards(render(`sort=level&difficulty=4&direction=${direction}`)).at(-1),
      /楽曲3/,
    );
});

test("each official band has one SVG motif and its own sampled theme; collaborations stay neutral", () => {
  assert.equal(BAND_THEMES.length, 12);
  assert.equal(new Set(BAND_THEMES.map((t) => t.color)).size, 12);
  for (const theme of BAND_THEMES) {
    const svg = fs.readFileSync(`src/images/bands/${theme.id}.svg`, "utf8");
    assert.match(svg, /<svg/);
    assert.doesNotMatch(svg, /<script|(?:href|src)=|<image|onload/i);
    const html = renderSongList(
      { songs: [song(GAMES.garupa, 1, theme.name)] },
      new URLSearchParams(),
      "/atlas/",
      GAMES.garupa,
    );
    const card = cards(html)[0];
    assert.equal((card.match(/class="band-motif"/g) || []).length, 1);
    assert.ok(card.includes(`--band:${theme.color}`));
    assert.ok(card.includes(`/atlas/images/bands/${theme.id}.svg`));
  }
  assert.equal(bandTheme("Poppin'Party×Roselia").id, null);
  assert.equal(bandTheme("未登録バンド").id, null);
});

test("title phrase wrapping preserves every title byte and escapes card content", () => {
  for (const game of Object.values(GAMES)) {
    const data = JSON.parse(
      fs.readFileSync(`data/${game.id}/songs.json`, "utf8"),
    );
    for (const entry of data.groups.flatMap((g) => g.songs))
      assert.equal(titlePhrases(entry.title).join(""), entry.title);
  }
  const title = "新人類は仮想世界の夢を見るか？";
  assert.deepEqual(titlePhrases(title), [
    "新人類は",
    "仮想世界の",
    "夢を見るか？",
  ]);
  const html = renderSongList(
    {
      songs: [
        {
          ...catalogs.garupa.songs[0],
          title: '<img src=x onerror="x">&長い曲名',
        },
      ],
    },
    new URLSearchParams(),
    "/",
    GAMES.garupa,
  );
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;/);
  assert.match(html, /&amp;/);
});

test("filter, sort, pagination and detail links retain discovery state at a subpath", () => {
  const html = render(
    "q=楽曲&type=anime&band=3&sort=notes&difficulty=2&direction=reverse&credit=invalid&page=999",
  );
  const card = cards(html)[0];
  assert.ok(card);
  const href = card.match(/href="([^"]+)"/)[1].replaceAll("&amp;", "&");
  const url = new URL(href, "https://example.com");
  assert.equal(url.pathname, "/atlas/garupa/songs/2/");
  for (const [key, value] of Object.entries({
    q: "楽曲",
    type: "anime",
    band: "3",
    sort: "notes",
    difficulty: "2",
    direction: "reverse",
    page: "1",
    from: "search",
  }))
    assert.equal(url.searchParams.get(key), value);
  const sort = html.match(/<form id="song-sort"[\s\S]*?<\/form>/)[0];
  assert.match(sort, /name="band" value="3"/);
  assert.match(sort, /name="type" value="anime"/);
});

test("song update dates use song state rather than Creator changes or the build clock", () => {
  for (const game of ["garupa", "ournotes"]) {
    const original = songUpdatedAt(game, { updatedAt: "2026-01-01T00:00:00Z" });
    assert.equal(
      songUpdatedAt(game, {
        updatedAt: "2026-01-01T00:00:00Z",
        creatorsUpdatedAt: "2099-01-01T00:00:00Z",
      }),
      original,
    );
    assert.equal(
      songUpdatedAt(game, { updatedAt: "2026-11-01T00:00:00Z" }),
      "2026-11-01T00:00:00.000Z",
    );
  }
});
