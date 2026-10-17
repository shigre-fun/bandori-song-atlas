import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { bandColor } from "../src/js/domain.js";
import { GAMES } from "../src/js/site-config.js";
import {
  creatorPagination,
  renderCreatorDetail,
} from "../src/js/creator-views.js";
import { renderList } from "../src/js/views.js";

const creator = {
  id: "cr-0001",
  name: "確認用",
  slug: "layout-test",
  type: "person",
};
const coverage = { lyricist: "ready", composer: "ready", arranger: "ready" };
const songs = (count) =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    stableSongId: String(index + 1),
    gameId: index % 2 ? "ournotes" : "garupa",
    title: index === 0 ? "-HEROIC ADVENT-" : `曲${index + 1}`,
    band: index % 2 ? "millsage" : "Roselia",
    workId: "wk-0001",
    credits: [
      {
        creatorId: creator.id,
        roles: index % 2 ? ["composer", "arranger"] : ["lyricist"],
      },
    ],
  }));

test("each recording has a linked title, its own roles and game/band metadata without repeated headings", () => {
  for (const base of ["/", "/atlas/"]) {
    const html = renderCreatorDetail(creator, songs(2), [], base, coverage);
    const rows = [...html.matchAll(/<li data-game=[\s\S]*?<\/li>/g)].map(
      (m) => m[0],
    );
    assert.equal(rows.length, 2);
    assert.match(
      rows[0],
      /class="creator-song-title"[^>]*>-HEROIC ADVENT-<\/a>/,
    );
    assert.ok(rows[0].includes(`href="${base}garupa/songs/1/"`));
    assert.match(rows[0], /class="creator-record-roles">作詞<\/span>/);
    assert.match(rows[0], /--game:#D72665">ガルパ/);
    assert.match(rows[0], /class="band" style="--band:#8665bd"[^>]*>Roselia/);
    assert.match(rows[1], /--game:#2868CE">アワーノーツ/);
    assert.match(rows[1], /--band:#3b206d/);
    assert.match(rows[1], /creator-record-roles">作曲・編曲/);
    for (const row of rows) {
      assert.equal((row.match(/<a /g) ?? []).length, 1);
      assert.equal((row.match(/<div /g) ?? []).length, 2);
      assert.doesNotMatch(row, /<h2|<p>/);
    }
    assert.match(html, /収録件数：2件/);
    assert.equal((html.match(/data-work-id=/g) ?? []).length, 1);
  }
});

test("pagination uses 50 recordings, including different recordings of one Work, and preserves filters", () => {
  for (const count of [0, 1, 49, 50, 51, 100, 101]) {
    const html = renderCreatorDetail(
      creator,
      songs(count),
      [],
      "/atlas/",
      coverage,
    );
    const rows = [...html.matchAll(/<li data-game=[^>]*>/g)].map((m) => m[0]);
    assert.equal(
      rows.filter((r) => !/\bhidden\b/.test(r)).length,
      Math.min(50, count),
    );
    assert.equal(rows.length, count);
    assert.equal(
      html.includes('aria-label="参加楽曲のページ切り替え"'),
      count > 50,
    );
    const state = creatorPagination(
      count,
      new URLSearchParams("role=composer&game=ournotes&page=2"),
      "/atlas/creators/layout-test/",
    );
    assert.equal(state.page, Math.min(2, Math.max(1, Math.ceil(count / 50))));
    assert.equal(
      state.end - state.start,
      count > 50 ? Math.min(count - 50, 50) : count,
    );
    if (count > 50) {
      assert.match(state.html, /class="pagination"/);
      for (const href of state.html.matchAll(/href="([^"]+)"/g)) {
        const url = new URL(
          href[1].replaceAll("&amp;", "&"),
          "https://test.invalid",
        );
        assert.equal(url.searchParams.get("role"), "composer");
        assert.equal(url.searchParams.get("game"), "ournotes");
        assert.equal(url.pathname, "/atlas/creators/layout-test/");
      }
    }
  }
  for (const invalid of ["0", "-1", "NaN", "2.5", "Infinity", "2garbage"])
    assert.equal(
      creatorPagination(101, new URLSearchParams({ page: invalid }), "/").page,
      1,
    );
  assert.equal(
    creatorPagination(101, new URLSearchParams("page=999"), "/").page,
    3,
  );
});

test("Creator band lines use exactly the song finder colors for all bands and fallback bands", () => {
  for (const game of Object.values(GAMES))
    for (const band of [...game.bands, "その他", "Roselia × Afterglow"]) {
      const song = {
        ...songs(1)[0],
        band,
        gameId: game.id,
        category: "normal",
        type: "normal",
        difficulties: [],
        publishedAt: 1,
      };
      const list = renderList(
        { songs: [song], updatedAt: 1 },
        new URLSearchParams(),
        "/",
        game,
      );
      const detail = renderCreatorDetail(creator, [song], [], "/", coverage);
      assert.ok(list.includes(`--band:${bandColor(song, game)}`));
      assert.ok(detail.includes(`--band:${bandColor(song, game)}`));
    }
});

test("every generated public header has the four requested links in order, with About retained in the footer", () => {
  const files = fs
    .readdirSync("dist", { recursive: true })
    .filter((f) => f.endsWith(".html"));
  let count = 0;
  for (const file of files) {
    const html = fs.readFileSync(path.join("dist", file), "utf8");
    const nav = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0];
    if (!html.includes("<header>")) continue;
    assert.ok(nav, file);
    count++;
    assert.deepEqual(
      [...nav.matchAll(/<a [^>]*>([^<]+)<\/a>/g)].map((m) => m[1]),
      ["ガルパ", "アワーノーツ", "クリエイター", "お知らせ"],
      file,
    );
    const base =
      html.match(/<a class="brand" href="([^"]+)"/)?.[1] ??
      html.match(/<header>\s*<a href="([^"]+)"/)?.[1];
    assert.ok(nav.includes(`href="${base}creators/"`), file);
    if (html.includes('class="brand"'))
      assert.match(
        html.match(/<footer>[\s\S]*?<\/footer>/)[0],
        /サイトについて/,
      );
  }
  assert.ok(count > 900, `${count} public headers`);
});
