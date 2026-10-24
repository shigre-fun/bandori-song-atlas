import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { builtPath, readBuilt, existsBuilt } from "./helpers/management.mjs";
import { GAMES } from "../src/js/site-config.js";
import { renderList } from "../src/js/views.js";

const read = (file) => readBuilt(file);

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
    "admin/creators/index.html",
    "creators/index.html",
    "creators/noriyasu-agematsu/index.html",
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
    "creators.js",
    "creator-views.js",
    "creators-data.js",
    "credit-structure.js",
    "credit-display.js",
    "credit-coverage.js",
    "admin-creators.js",
    "creator-picker.js",
    "github-creator-store.js",
  ]) {
    const source = read(file);
    for (const [, dependency, actualVersion] of source.matchAll(
      /from "(\.{1,2}\/[^"?]+\.js)(?:\?v=([a-f0-9]{12}))?"/g,
    )) {
      assert.equal(actualVersion, version, `${file}: ${dependency}`);
      assert.ok(
        existsBuilt(
          path.posix.normalize(
            path.posix.join(path.posix.dirname(builtPath(file)), dependency),
          ),
        ),
        `${file}: ${dependency} is deployed`,
      );
    }
  }
});

test("generated song pages carry the requested colors and type markers", () => {
  assert.match(read("garupa/songs/1/index.html"), /class="tag normal garupa"/);
  assert.match(read("ournotes/songs/1/index.html"), /--band: #61a1c8/);
  assert.match(read("ournotes/songs/48/index.html"), /--band: #ef909f/);
  assert.match(read("ournotes/songs/63/index.html"), /--band: #bb52f0/);
  assert.match(read("ournotes/songs/71/index.html"), /--band: #ffbb5f/);
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
    [48, "#ef909f"],
    [63, "#bb52f0"],
    [71, "#ffbb5f"],
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

test("both song lists expose compact category and band chips without checkboxes", () => {
  for (const game of Object.values(GAMES)) {
    const html = read(game.slug + "/songs/index.html");
    assert.equal(
      (html.match(/data-filter="type"/g) || []).length,
      game.categories.length,
    );
    assert.equal(
      (html.match(/data-filter="band"/g) || []).length,
      game.bands.length + 1,
    );
    assert.doesNotMatch(html, /type="checkbox"|複数選択可/);
    for (const band of game.bands)
      assert.ok(html.includes(band.replaceAll("'", "&#39;")));
    assert.match(html, /<details class="song-filter-panel">/);
    assert.match(html, /aria-pressed="false"/);
  }
});
