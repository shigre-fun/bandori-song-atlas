import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { GAMES } from "../src/js/site-config.js";
import { renderList } from "../src/js/views.js";

const read = (file) => fs.readFileSync(`dist/${file}`, "utf8");

test("public pages and imported modules use the current asset version", () => {
  const pages = [
    "index.html",
    "search/index.html",
    "garupa/songs/index.html",
    "garupa/songs/1/index.html",
    "ournotes/songs/1/index.html",
    "ournotes/songs/48/index.html",
    "ournotes/songs/79/index.html",
    "admin/index.html",
    "admin/news/index.html",
  ];
  const version = read("index.html").match(/style\.css\?v=([a-f0-9]{12})/)?.[1];
  assert.ok(version);
  for (const file of pages) {
    const html = read(file);
    for (const [, asset, actualVersion] of html.matchAll(
      /(?:href|src)="[^"]*?([a-z-]+\.(?:css|js))\?v=([a-f0-9]{12})"/g,
    ))
      assert.equal(actualVersion, version, `${file}: ${asset}`);
    assert.doesNotMatch(
      html,
      /(?:href|src)="[^"]*\/(?:style|mobile|app)\.(?:css|js)"/,
      file,
    );
  }
  for (const file of [
    "app.js",
    "cross-search.js",
    "views.js",
    "domain.js",
    "admin.js",
    "admin-news.js",
    "github-news-store.js",
  ]) {
    const source = read(file);
    for (const [, dependency, actualVersion] of source.matchAll(
      /from "(\.\/[^"?]+\.js)(?:\?v=([a-f0-9]{12}))?"/g,
    )) {
      assert.equal(actualVersion, version, `${file}: ${dependency}`);
      assert.ok(
        fs.existsSync(`dist/${dependency.slice(2)}`),
        `${file}: ${dependency} is deployed`,
      );
    }
  }
});

test("generated song pages carry the requested colors and type markers", () => {
  assert.match(read("garupa/songs/1/index.html"), /class="tag normal garupa"/);
  assert.match(read("ournotes/songs/1/index.html"), /--band: #448abd/);
  assert.match(read("ournotes/songs/48/index.html"), /--band: #ee668f/);
  assert.match(read("ournotes/songs/63/index.html"), /--band: #3b206d/);
  assert.match(read("ournotes/songs/71/index.html"), /--band: #00a76f/);
  assert.match(read("ournotes/songs/79/index.html"), /--band: #79859c/);
  assert.match(
    read("ournotes/songs/48/index.html"),
    /class="tag normal ournotes"/,
  );
  assert.match(read("ournotes/songs/1/index.html"), /song-type song-type-紅赤/);
  const css = read("style.css");
  assert.match(css, /\.tag\s*\{[^}]*background: #e7f1ff/s);
  assert.match(css, /\.tag\.anime\s*\{[^}]*background: #fff0d1/s);
  assert.match(css, /\.tag\.tie_up\s*\{[^}]*background: #e4f5e9/s);
  assert.match(css, /\.song-type::before\s*\{/);
});

test("Our Notes band colors stay consistent after list rendering", () => {
  const catalog = JSON.parse(read("ournotes/songs.json"));
  for (const [id, hex] of [
    [48, "#ee668f"],
    [63, "#3b206d"],
    [71, "#00a76f"],
    [79, "#79859c"],
  ]) {
    const song = catalog.songs.find((entry) => entry.id === id);
    assert.ok(song);
    const html = renderList(
      { ...catalog, songs: [song] },
      new URLSearchParams(),
      "/",
      GAMES.ournotes,
    );
    assert.match(html, new RegExp(`--band:${hex}`), song.band);
  }
});

test("both song lists reuse the song tags and band lines in filter options", () => {
  for (const game of Object.values(GAMES)) {
    const html = read(`${game.slug}/songs/index.html`);
    const compact = html.replace(/\s+>/g, ">").replace(/>\s+</g, "><");
    const categories = [
      ...compact.matchAll(
        /<label>\s*<input type="checkbox" name="type" value="([^"]+)"[^>]*>\s*<span class="tag ([^"]+)">([^<]+)<\/span>\s*<\/label>/g,
      ),
    ];
    assert.deepEqual(
      categories.map(([, value, className]) => [value, className]),
      game.categories.map((value) => [value, value]),
    );
    const bands = [
      ...compact.matchAll(
        /<label style="--band:\s*(#[a-f0-9]{6})"\s*>\s*<input type="checkbox" name="band" value="(\d+)"[^>]*>\s*<span class="band filter-band-name">([^<]+)<\/span>\s*<\/label>/g,
      ),
    ];
    assert.deepEqual(
      bands.map(([, , index]) => Number(index)),
      game.bands.map((_, index) => index).concat(game.bands.length),
    );
    assert.deepEqual(
      bands.map(([, , , name]) => name),
      [...game.bands, "その他"].map((name) => name.replaceAll("'", "&#39;")),
    );
  }
  const css = read("style.css");
  assert.match(
    css,
    /\.band\s*\{[^}]*border-left: 3px solid var\(--band, #d82060\)/s,
  );
  assert.match(css, /\.band\s*\{[^}]*padding-left: 10px/s);
  assert.doesNotMatch(css, /\.filter-color-label::before\s*\{/);
  for (const [type, hex] of [
    ["紅赤", "#cc3670"],
    ["紺碧", "#1982d2"],
    ["翡翠", "#22c38e"],
    ["山吹", "#f0b000"],
    ["紫苑", "#b05fdf"],
  ])
    assert.match(
      css,
      new RegExp(`\\.song-type-${type}\\s*\\{[^}]*${hex}`, "s"),
    );
});
