import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const songs = JSON.parse(
  fs.readFileSync("data/garupa/songs.json", "utf8"),
).groups.flatMap((group) => group.songs);

test("Garupa IDs and URLs follow release date and simultaneous release order", () => {
  const ordered = [...songs].sort((a, b) => a.id - b.id);
  assert.deepEqual(
    ordered.map((song) => song.id),
    ordered.map((_, index) => index + 1),
  );
  const byDate = new Map();
  for (const song of ordered) {
    const date = Date.parse(song.releaseDate);
    assert.ok(Number.isFinite(date), song.title);
    const cohort = byDate.get(date) ?? [];
    cohort.push(song);
    byDate.set(date, cohort);
  }
  const dates = [...byDate.keys()];
  assert.deepEqual(
    dates,
    [...dates].sort((a, b) => a - b),
  );
  for (const cohort of byDate.values()) {
    assert.deepEqual(
      cohort.map((song) => song.releaseOrder),
      cohort.length === 1 ? [null] : cohort.map((_, index) => index + 1),
      cohort.map((song) => song.title).join("、"),
    );
  }
  const state = JSON.parse(
    fs.readFileSync("data/garupa/admin-state.json", "utf8"),
  );
  assert.equal(state.nextId, ordered.length + 1);
});
