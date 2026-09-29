import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const migrationBase = "6102fd9";
const previous = (path) =>
  JSON.parse(
    execFileSync("git", ["show", `${migrationBase}:${path}`], {
      encoding: "utf8",
    }),
  );
const flatten = (data) => data.groups.flatMap((group) => group.songs);
const rows = fs
  .readFileSync("docs/GARUPA_ID_RENUMBER_2026-09-29.csv", "utf8")
  .trimEnd()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const match = /^"(\d+)","(\d+)","((?:[^"]|"")*)","([^"]+)"$/.exec(line);
    assert.ok(match, line);
    return {
      oldId: Number(match[1]),
      newId: Number(match[2]),
      title: match[3].replaceAll('""', '"'),
      date: match[4],
    };
  });
const ids = new Map(rows.map((row) => [row.oldId, row.newId]));
assert.equal(ids.size, rows.length);
const remap = (reference) =>
  reference.replace(/^garupa:(\d+)$/, (_, id) => {
    assert.ok(ids.has(Number(id)), reference);
    return `garupa:${ids.get(Number(id))}`;
  });

const oldGarupa = new Map(
  flatten(previous("data/garupa/songs.json")).map((song) => [song.id, song]),
);
const newGarupa = new Map(
  flatten(read("data/garupa/songs.json")).map((song) => [song.id, song]),
);
assert.equal(rows.length, oldGarupa.size);
assert.equal(newGarupa.size, oldGarupa.size);
for (const row of rows) {
  const before = oldGarupa.get(row.oldId);
  const after = newGarupa.get(row.newId);
  assert.ok(before && after, `${row.oldId} → ${row.newId}`);
  assert.equal(before.title, row.title);
  assert.equal(before.releaseDate, row.date);
  const expected = {
    ...before,
    id: row.newId,
    releaseOrder: after.releaseOrder,
    ...(before.relatedSongIds && {
      relatedSongIds: before.relatedSongIds.map(remap),
    }),
  };
  assert.deepEqual(after, expected, before.title);
}

const oldOur = flatten(previous("data/ournotes/songs.json"));
const newOur = flatten(read("data/ournotes/songs.json"));
assert.equal(newOur.length, oldOur.length);
let retainedUserEdits = 0;
for (const before of oldOur) {
  const after = newOur.find((song) => song.id === before.id);
  assert.ok(after);
  const expected = {
    ...before,
    ...(before.relatedSongIds && {
      relatedSongIds: before.relatedSongIds.map(remap),
    }),
  };
  for (const level of ["EASY", "NORMAL", "HARD", "EXPERT"]) {
    if (
      after.difficulties[level]?.notes !== before.difficulties[level]?.notes
    ) {
      expected.difficulties = { ...expected.difficulties };
      expected.difficulties[level] = {
        ...expected.difficulties[level],
        notes: after.difficulties[level].notes,
      };
      retainedUserEdits++;
    }
  }
  if (
    JSON.stringify(after.gekisouSections) !==
    JSON.stringify(before.gekisouSections)
  ) {
    expected.gekisouSections = after.gekisouSections;
    retainedUserEdits++;
  }
  assert.deepEqual(after, expected, `ournotes:${before.id}`);
}
assert.ok(retainedUserEdits > 0);

const oldLegacy = previous("data/garupa/legacy-song-paths.json");
const newLegacy = read("data/garupa/legacy-song-paths.json");
assert.deepEqual(
  newLegacy,
  oldLegacy.map((entry) => ({
    ...entry,
    stableSongId:
      entry.gameId === "garupa"
        ? String(ids.get(Number(entry.stableSongId)))
        : entry.stableSongId,
  })),
);
const oldMapping = previous("docs/original-work-mapping.json");
const newMapping = read("docs/original-work-mapping.json");
assert.deepEqual(
  newMapping,
  Object.fromEntries(
    Object.entries(oldMapping).map(([reference, value]) => [
      remap(reference),
      value,
    ]),
  ),
);
const oldTiming = previous("data/garupa/song-timing-research.json");
const newTiming = read("data/garupa/song-timing-research.json");
assert.deepEqual(newTiming, {
  ...oldTiming,
  records: oldTiming.records.map((record) => ({
    ...record,
    id: ids.get(record.id),
  })),
});
console.log(
  `旧新対応${rows.length}曲・旧曲名URL${oldLegacy.length}件・作品名対応${Object.keys(oldMapping).length}件・演奏時間調査${oldTiming.records.length}件・アワーノーツ先行変更${retainedUserEdits}項目を照合しました。`,
);
