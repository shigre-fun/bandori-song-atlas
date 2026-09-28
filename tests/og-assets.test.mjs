import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { songOgPath } from "../scripts/assets/create-brand-assets.mjs";
import {
  BRAND_ASSETS,
  GAMES,
  SITE_DESCRIPTION,
  SITE_NAME,
  siteSettings,
} from "../src/js/site-config.js";
import { escapeHTML } from "../src/js/seo.js";

const settings = siteSettings(process.env);
const read = (relative) => fs.readFileSync(path.join("dist", relative));
const dimension = (relative) => {
  const png = read(relative);
  assert.equal(png.subarray(1, 4).toString(), "PNG", relative);
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
};
const headTag = (html, key, name, attribute = "content") =>
  [...html.matchAll(/<(?:meta|link)\b[^>]*>/g)]
    .map(([tag]) => tag)
    .find((tag) => tag.includes(`${key}="${name}"`))
    ?.match(new RegExp(`${attribute}="([^"]*)"`))?.[1];

test("brand images and the shared top OGP have expected dimensions and head links", () => {
  for (const [file, width, height] of [
    [BRAND_ASSETS.faviconPng, 32, 32],
    [BRAND_ASSETS.appleTouchIcon, 180, 180],
    [BRAND_ASSETS.logo, 512, 512],
    [BRAND_ASSETS.siteOg, 1200, 630],
  ])
    assert.deepEqual(dimension(file), [width, height]);
  assert.match(read(BRAND_ASSETS.favicon).toString(), /<svg\b/);
  const html = read("index.html").toString();
  const image = `${settings.origin}${settings.basePath}${BRAND_ASSETS.siteOg}`;
  assert.equal(headTag(html, "property", "og:image"), image);
  assert.equal(headTag(html, "name", "twitter:image"), image);
  assert.equal(
    headTag(html, "property", "og:image:alt"),
    escapeHTML(`${SITE_NAME} - ${SITE_DESCRIPTION}`),
  );
  assert.equal(
    headTag(html, "rel", "apple-touch-icon", "href"),
    `${settings.basePath}${BRAND_ASSETS.appleTouchIcon}`,
  );
  assert.equal(
    headTag(html, "type", "image/svg+xml", "href"),
    `${settings.basePath}${BRAND_ASSETS.favicon}`,
  );
  assert.equal(
    headTag(html, "type", "image/png", "href"),
    `${settings.basePath}${BRAND_ASSETS.faviconPng}`,
  );
});

test("every song page refers to its own existing 1200 x 630 OGP image", () => {
  for (const game of Object.values(GAMES)) {
    const songs = JSON.parse(read(game.catalog)).songs;
    const generated = new Set();
    for (const song of songs) {
      const relative = songOgPath(game, song);
      generated.add(path.basename(relative));
      assert.deepEqual(dimension(relative), [1200, 630], relative);
      const html = read(
        `${game.slug}/songs/${song.stableSongId}/index.html`,
      ).toString();
      const image = headTag(html, "property", "og:image");
      assert.equal(image, `${settings.origin}${settings.basePath}${relative}`);
      assert.equal(headTag(html, "name", "twitter:image"), image);
      assert.equal(headTag(html, "property", "og:image:width"), "1200");
      assert.equal(headTag(html, "property", "og:image:height"), "630");
      assert.equal(
        headTag(html, "name", "twitter:card"),
        "summary_large_image",
      );
      assert.equal(
        headTag(html, "property", "og:image:alt"),
        escapeHTML(
          `「${song.title}」 - ${song.band || song.artist} / ${game.shortName} | ${SITE_NAME}`,
        ),
      );
    }
    assert.deepEqual(
      new Set(fs.readdirSync(path.join("dist", "assets/og/songs", game.slug))),
      generated,
    );
  }
});

test("game colors, hash changes, Japanese and punctuation samples are handled", async () => {
  for (const [game, ids] of [
    [GAMES.garupa, ["149", "755", "289", "725"]],
    [GAMES.ournotes, ["28", "76", "30", "37"]],
  ]) {
    const songs = JSON.parse(read(game.catalog)).songs;
    for (const id of ids) {
      const song = songs.find((entry) => entry.stableSongId === id);
      assert.ok(song, `${game.id}/${id}`);
      const image = await loadImage(read(songOgPath(game, song)));
      const canvas = createCanvas(1200, 630);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const pixel = [...ctx.getImageData(1000, 115, 1, 1).data].slice(0, 3);
      const hex =
        `#${pixel.map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
      assert.equal(hex, game.ogAccent.strong);
      assert.notEqual(
        songOgPath(game, { ...song, title: `${song.title}!` }),
        songOgPath(game, song),
      );
    }
  }
  assert.throws(
    () =>
      songOgPath(
        { id: "new", slug: "new", shortName: "新ゲーム" },
        { stableSongId: "1", title: "曲", band: "バンド" },
      ),
    /OGP識別色/,
  );
});
