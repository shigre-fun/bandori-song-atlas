import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadGameCatalog } from "../scripts/catalog.mjs";
import { validateCreatorDatabase } from "../src/js/creators-data.js";
import { GAMES } from "../src/js/site-config.js";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const master = read("data/creators.json");
const works = read("data/works.json");
const catalogs = Object.fromEntries(
  Object.values(GAMES).map((game) => [game.id, loadGameCatalog(game)]),
);

test("live Creator and Work references validate after ordinary song edits", () => {
  assert.deepEqual(
    validateCreatorDatabase(master, works, Object.values(catalogs).flat())
      .warnings,
    [],
  );
});

test("live builds preserve every current song field and Creator/Work master", () => {
  for (const game of Object.values(GAMES)) {
    const generated = read(`dist/${game.catalog}`);
    assert.deepEqual(
      generated.songs,
      JSON.parse(JSON.stringify(catalogs[game.id])),
    );
    assert.deepEqual(generated.creators, master.creators);
    assert.deepEqual(generated.roleCoverage, master.roleCoverage);
  }
  assert.deepEqual(read("dist/creators.json"), master);
  assert.deepEqual(read("dist/works.json"), works);
});

test("live administrator IDs remain valid as songs are added or edited", () => {
  for (const game of Object.values(GAMES)) {
    const state = read(game.stateFile);
    assert.ok(Number.isSafeInteger(state.nextId));
    assert.ok(
      state.nextId > Math.max(...catalogs[game.id].map((song) => song.id)),
    );
  }
  assert.ok(
    master.nextId >
      Math.max(
        ...master.creators.map((creator) => Number(creator.id.slice(3))),
      ),
  );
});
