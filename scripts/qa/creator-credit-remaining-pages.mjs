import fs from "node:fs";
import assert from "node:assert/strict";
import { creatorParticipation } from "../../src/js/creators-data.js";
import { REVIEW_DIR } from "../migrations/creator-credit-remaining-review.mjs";
import {
  creditTokens,
  CREDIT_ROLES,
  ROLE_LABELS,
} from "../../src/js/credit-display.js";
import { escapeHTML } from "../../src/js/seo.js";
const directory = process.argv[2] ?? "dist",
  label = process.argv[3] ?? "root";
const read = (p) => JSON.parse(fs.readFileSync(p));
const master = read("data/creators.json"),
  songs = ["garupa", "ournotes"].flatMap(
    (g) => read(`${directory}/${g}/songs.json`).songs,
  );
assert.deepEqual(read(directory + "/creators.json"), master);
assert.deepEqual(read(directory + "/works.json"), read("data/works.json"));
const rows = [];
const prefix = label === "subpath" ? "/bandori-song-atlas" : "";
const pages = new Map();
let rawFields = 0;
for (const game of ["garupa", "ournotes"]) {
  for (const song of read(`${directory}/${game}/songs.json`).songs) {
    const id = song.stableSongId;
    const html = fs.readFileSync(
      `${directory}/${game}/songs/${id}/index.html`,
      "utf8",
    );
    pages.set(`${game}:${id}`, html);
    for (const role of CREDIT_ROLES) {
      const part = html.match(
        new RegExp(`<dt>${ROLE_LABELS[role]}</dt>\\s*<dd>([\\s\\S]*?)</dd>`),
      )?.[1];
      assert.ok(part, `${game}:${id} ${role}`);
      for (const token of creditTokens(song, role, master.creators)) {
        if (token.creator) {
          assert.ok(
            part.includes(`href="${prefix}/creators/${token.creator.slug}/"`),
            token.creator.id,
          );
          assert.ok(
            part.includes(escapeHTML(token.text)),
            `${game}:${id} ${role} raw name`,
          );
        }
      }
      rawFields++;
    }
  }
}
const review = read(REVIEW_DIR + "/review.json");
let reviewedBindings = 0;
for (const scope of review.reviews) {
  const html = pages.get(`${scope.game}:${scope.recordId}`);
  const part = html.match(
    new RegExp(`<dt>${ROLE_LABELS[scope.role]}</dt>\\s*<dd>([\\s\\S]*?)</dd>`),
  )?.[1];
  for (const a of scope.applied) {
    const creator = master.creators.find((c) => c.id === a.creatorId);
    assert.ok(
      part.includes(`href="${prefix}/creators/${creator.slug}/"`),
      `${scope.game}:${scope.recordId} ${scope.role}`,
    );
    assert.ok(part.includes(escapeHTML(a.raw)), a.raw);
    reviewedBindings++;
  }
}
assert.equal(
  reviewedBindings,
  review.reviews.reduce((n, r) => n + r.applied.length, 0),
);
for (const creator of master.creators) {
  const html = fs.readFileSync(
      `${directory}/creators/${creator.slug}/index.html`,
      "utf8",
    ),
    stats = creatorParticipation(creator.id, songs);
  assert.ok(html.includes(`収録件数：${stats.recordings}件`), creator.id);
  const ids = [...html.matchAll(/data-work-id="(wk-\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    new Set(ids),
    new Set(stats.works.map((w) => w.workId)),
    creator.id,
  );
  assert.equal(ids.length, stats.total);
  assert.equal(
    [...html.matchAll(/<li\b[^>]*data-game=/g)].length,
    stats.recordings,
  );
  rows.push({
    id: creator.id,
    slug: creator.slug,
    works: stats.total,
    records: stats.recordings,
    lyricist: stats.lyricist,
    composer: stats.composer,
    arranger: stats.arranger,
  });
}
const p1 = rows.find((c) => c.id === "cr-0126");
assert.equal(p1.works, 10);
assert.equal(p1.records, 10);
assert.equal(p1.arranger, 10);
const result = {
  result: "PASS",
  directory,
  creators: rows.length,
  songs: songs.length,
  allWorkAndRecordCountsMatch: true,
  rawFields,
  reviewedBindings,
  kanow: p1,
  rows,
};
fs.writeFileSync(
  `${REVIEW_DIR}/${label}-page-audit.json`,
  JSON.stringify(result, null, 2) + "\n",
);
console.log({
  result: "PASS",
  creators: rows.length,
  songs: songs.length,
  kanow: p1,
});
