import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { renderList, renderDetail } from "../dist/views.js";
import { GAMES, siteSettings } from "../src/js/site-config.js";
import { songPath, siteURL } from "../src/js/urls.js";
const data = JSON.parse(fs.readFileSync("dist/songs.json", "utf8"));
const reportHref = (html) =>
  html
    .match(
      /<aside\b[^>]*class="panel song-report"[^>]*>([\s\S]*?)<\/aside>/,
    )?.[1]
    ?.match(/<a\s+href="([^"]+)"/)?.[1];
test("search query and metadata cannot inject HTML", () => {
  const html = renderList(
    data,
    new URLSearchParams({ q: "<img src=x onerror=alert(1)>" }),
  );
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;img"));
  const song = { ...data.songs[0], title: "<script>alert(1)</script>" };
  assert.ok(!renderDetail(song, data).includes("<script>alert(1)</script>"));
});
test("direct detail pages render song facts without JavaScript execution", () => {
  for (const song of data.songs) {
    const html = fs.readFileSync(
      `dist/garupa/songs/${song.stableSongId}/index.html`,
      "utf8",
    );
    assert.ok(html.includes("難易度・ノーツ数"));
    assert.ok(html.includes('name="q"'));
    assert.ok(html.includes("原曲") || song.type === "normal");
    assert.ok(!html.includes("楽曲データを読み込んでいます"));
  }
});

test("every song detail has a report link carrying its stable page path", () => {
  const base = siteSettings(process.env).basePath;
  for (const game of Object.values(GAMES)) {
    const catalog = JSON.parse(fs.readFileSync(`dist/${game.catalog}`, "utf8"));
    for (const song of catalog.songs) {
      const html = fs.readFileSync(
        `dist/${songPath(game, song.stableSongId)}index.html`,
        "utf8",
      );
      const href = reportHref(html);
      assert.ok(href, `${game.id}:${song.stableSongId}`);
      const link = new URL(href, "https://example.test");
      assert.equal(link.pathname, siteURL("contact/", base));
      assert.equal(
        link.searchParams.get("pageUrl"),
        siteURL(songPath(game, song.stableSongId), base),
      );
      assert.equal(link.searchParams.size, 1);
      assert.ok(html.includes("この楽曲の情報に誤りがありますか？"));
    }
  }
});

test("report links support repository base paths without inheriting list filters", () => {
  for (const game of Object.values(GAMES)) {
    const catalog = JSON.parse(fs.readFileSync(`dist/${game.catalog}`, "utf8"));
    const song = catalog.songs[0];
    const html = renderDetail(
      song,
      catalog,
      new URLSearchParams({ q: "x&y", page: "2" }),
      "/atlas/",
      game,
    );
    const href = reportHref(html);
    const link = new URL(href, "https://example.test");
    assert.equal(link.pathname, "/atlas/contact/");
    assert.equal(
      link.searchParams.get("pageUrl"),
      siteURL(songPath(game, song.stableSongId), "/atlas/"),
    );
    assert.equal(link.searchParams.size, 1);
  }
});
test("source-work searches return a title link and absent terms have empty state", () => {
  const html = renderList(data, new URLSearchParams({ q: "グレンラガン" }));
  assert.ok(html.includes("空色デイズ"));
  assert.ok(html.includes("/garupa/songs/19/"));
  assert.ok(
    renderList(
      data,
      new URLSearchParams({ q: "xxno-match-928384xx" }),
    ).includes("一致する楽曲はありません"),
  );
});
test("out-of-range pages are bounded and all five difficulty options exist", () => {
  const html = renderList(data, new URLSearchParams({ page: "9999999" }));
  assert.ok(html.includes('id="next" aria-disabled="true"'));
  assert.ok(!html.includes("9999999 /"));
  assert.ok(html.includes('id="difficulty"'));
  for (let i = 0; i < 5; i++) assert.ok(html.includes(`value="${i}"`));
});
