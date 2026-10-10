import fs from "node:fs";
import assert from "node:assert/strict";
import { creatorParticipation } from "../../src/js/creators-data.js";
import { REVIEW_DIR } from "../migrations/creator-credit-p2-review.mjs";
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
  assert.equal([...html.matchAll(/<li data-game=/g)].length, stats.recordings);
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
