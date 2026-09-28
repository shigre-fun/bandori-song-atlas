import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { auditBuild } from "../scripts/qa/audit-build.mjs";
import { GAMES, siteSettings } from "../src/js/site-config.js";
import { songPath } from "../src/js/urls.js";
import { detailTitle } from "../src/js/seo.js";

test("generated canonical pages, structured data, links and sitemap are consistent", () => {
  const settings = siteSettings(process.env);
  const result = auditBuild({
    origin: settings.origin,
    basePath: settings.basePath,
  });
  const count = JSON.parse(fs.readFileSync("dist/garupa/songs.json", "utf8"))
    .songs.length;
  const ournotesCount = JSON.parse(
    fs.readFileSync("dist/ournotes/songs.json", "utf8"),
  ).songs.length;
  const legacy = JSON.parse(
    fs.readFileSync("data/garupa/legacy-song-paths.json", "utf8"),
  );
  assert.equal(result.details, count + ournotesCount);
  assert.deepEqual(result.detailCounts, {
    garupa: count,
    ournotes: ournotesCount,
  });
  assert.equal(
    result.redirects,
    legacy.reduce((n, entry) => n + entry.slugs.length, 0),
  );
  assert.equal(result.pages, count + ournotesCount + 6);
});

test("only the four navigation pages omit the header search", () => {
  const basePath = siteSettings(process.env).basePath;
  const readPage = (path) => fs.readFileSync(`dist/${path}`, "utf8");
  const searchAction = (html) =>
    html.match(/<form action="([^"]+)" role="search">/)?.[1];
  for (const path of [
    "index.html",
    "about/index.html",
    "privacy/index.html",
    "sources/index.html",
  ]) {
    const html = readPage(path);
    assert.equal(searchAction(html), undefined, path);
    assert.match(html, /<small>SONG DATABASE<\/small>/, path);
  }
  for (const path of ["search/index.html", "404.html"])
    assert.equal(
      searchAction(readPage(path)),
      `${basePath}garupa/songs/`,
      path,
    );
  for (const game of Object.values(GAMES)) {
    const expected = `${basePath}${game.slug}/songs/`;
    assert.equal(
      searchAction(readPage(`${game.slug}/songs/index.html`)),
      expected,
      game.id,
    );
    const songs = JSON.parse(readPage(`${game.slug}/songs.json`)).songs;
    for (const song of songs) {
      const path = `${game.slug}/songs/${song.stableSongId}/index.html`;
      const html = readPage(path);
      assert.equal(searchAction(html), expected, path);
      assert.match(html, /<small>SONG DATABASE<\/small>/, path);
    }
  }
  assert.equal(siteSettings().alternateName, "BanG Dream! Song Database");
});

test("site settings normalize both deployment bases and reject conflicting settings", () => {
  assert.equal(siteSettings().name, "バンドリ楽曲録");
  const pages = siteSettings({
    SITE_ORIGIN: "https://example.test",
    BASE_PATH: "/bandori-song-atlas",
  });
  assert.equal(pages.basePath, "/bandori-song-atlas/");
  assert.equal(pages.origin, "https://example.test");
  assert.match(fs.readFileSync("dist/index.html", "utf8"), /バンドリ楽曲録/);
  if (process.env.GITHUB_REPOSITORY) {
    const config = JSON.parse(
      fs.readFileSync("dist/admin-config.json", "utf8"),
    );
    assert.equal(
      `${config.owner}/${config.repo}`,
      process.env.GITHUB_REPOSITORY,
    );
  }
  assert.equal(siteSettings({ BASE_PATH: "/" }).basePath, "/");
  assert.throws(
    () => siteSettings({ BASE_PATH: "/", SITE_BASE_PATH: "/wrong" }),
    /一致/,
  );
  assert.throws(
    () => siteSettings({ SITE_ORIGIN: "https://example.test/path" }),
    /SITE_ORIGIN/,
  );
});

test("same-title songs get unique titles and stable paths", () => {
  const songs = JSON.parse(
    fs.readFileSync("dist/garupa/songs.json", "utf8"),
  ).songs;
  const duplicates = songs.filter((song) => song.title === "オレンジ");
  assert.equal(duplicates.length, 2);
  assert.notEqual(
    detailTitle(duplicates[0], GAMES.garupa, songs),
    detailTitle(duplicates[1], GAMES.garupa, songs),
  );
  assert.equal(songPath(GAMES.garupa, "24"), "garupa/songs/24/");
});

test("query robots applies to list state but not detail queries", () => {
  const source = fs.readFileSync("src/js/query-index.js", "utf8");
  const check = (pathname, search) => {
    const appended = [];
    const document = {
      currentScript: {
        src: "https://example.test/atlas/query-index.js",
        dataset: {
          indexPage: /\/songs\/$/.test(pathname)
            ? "list"
            : pathname === "/atlas/"
              ? "root"
              : "detail",
        },
      },
      head: { append: (node) => appended.push(node) },
      createElement: () => ({}),
    };
    vm.runInNewContext(source, {
      location: { pathname, search },
      document,
      URL,
      URLSearchParams,
    });
    return appended[0]?.content;
  };
  assert.equal(check("/atlas/garupa/songs/", "?q="), "noindex,follow");
  assert.equal(
    check("/atlas/ournotes/songs/", "?sort=level"),
    "noindex,follow",
  );
  assert.equal(check("/atlas/", "?page=2"), "noindex,follow");
  assert.equal(check("/atlas/garupa/songs/24/", "?q=x"), undefined);
  assert.equal(check("/atlas/garupa/songs/", ""), undefined);
});
