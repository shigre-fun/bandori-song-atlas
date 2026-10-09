import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadGameCatalog } from "../scripts/catalog.mjs";
import { validateCreatorDatabase } from "../src/js/creators-data.js";
import { GAMES } from "../src/js/site-config.js";
import { GitHubStore } from "../src/js/github-store.js";
import { creditRows, enteredCreditData } from "../src/js/creators-data.js";
import { creatorRepository } from "./helpers/creator-repository.mjs";

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

test("every live song detail uses 作詞・作曲・編曲 in order for every category", () => {
  for (const game of Object.values(GAMES))
    for (const song of catalogs[game.id]) {
      const html = fs.readFileSync(
        `dist/${game.id}/songs/${song.stableSongId}/index.html`,
        "utf8",
      );
      const labels = [...html.matchAll(/<dt>(作詞|作曲|編曲)<\/dt>/g)].map(
        (match) => match[1],
      );
      assert.deepEqual(
        labels,
        ["作詞", "作曲", "編曲"],
        `${game.id}:${song.id}`,
      );
      assert.ok(!html.includes("原曲の作曲者"), `${game.id}:${song.id}`);
    }
});

test("live 夢我夢中 saves other fields with every existing credit and Creator unchanged", async () => {
  const repo = creatorRepository({ creatorData: master });
  repo.files["data/works.json"] = structuredClone(works);
  for (const game of Object.values(GAMES)) {
    repo.files[game.dataFile] = read(game.dataFile);
    repo.files[game.stateFile] = read(game.stateFile);
  }
  const game = GAMES.ournotes;
  const song = catalogs[game.id].find((song) => song.title === "夢我夢中");
  assert.ok(song, "The reported song must be tested against the live data");
  const store = new GitHubStore(
    { owner: "test-owner", repo: "song-atlas", branch: "main" },
    "fake-token",
    repo.fetcher,
    game,
  );
  const editing = await store.loadSong(song.id);
  const before = structuredClone(repo.files);
  const credit = enteredCreditData(
    creditRows(editing.song),
    master.creators,
    editing.song,
    editing.song,
    [],
  );
  const durationSeconds = (editing.song.durationSeconds ?? 0) + 1;
  const input = { ...editing.song, ...credit, durationSeconds };
  await store.updateSong(input, editing, "live-mugamuchu-unrelated-edit");
  const loaded = await store.loadSong(song.id);
  assert.equal(loaded.song.durationSeconds, durationSeconds);
  for (const [field, value] of Object.entries(editing.song))
    if (!["durationSeconds", "revision"].includes(field))
      assert.deepEqual(loaded.song[field], value, field);
  assert.equal(loaded.song.id, song.id);
  assert.deepEqual(
    repo.files["data/creators.json"],
    before["data/creators.json"],
  );
  assert.deepEqual(repo.files["data/works.json"], before["data/works.json"]);
  assert.deepEqual(
    repo.files[GAMES.garupa.dataFile],
    before[GAMES.garupa.dataFile],
  );
  const tree = repo.calls.find(
    (call) => call.route === "/git/trees" && call.method === "POST",
  );
  assert.deepEqual(
    tree.body.tree.map((entry) => entry.path).sort(),
    [game.dataFile, game.stateFile].sort(),
  );
});
