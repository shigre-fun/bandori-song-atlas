import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { GitHubCreatorStore } from "../src/js/github-creator-store.js";
import { GitHubStore } from "../src/js/github-store.js";
import { GAMES } from "../src/js/site-config.js";
import { listGarupaSongs } from "../src/js/garupa-data.js";
import {
  selectedCreditData,
  enteredCreditData,
  creditRows,
} from "../src/js/creators-data.js";
const settings = { owner: "test-owner", repo: "song-atlas", branch: "main" };
const sha = (value) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
import { creatorRepository } from "./helpers/creator-repository.mjs";

for (const game of Object.values(GAMES))
  test(`${game.id} direct lyricist/composer/arranger entry adds, reloads, edits and clears without inferred identities`, async () => {
    const repo = creatorRepository();
    const store = new GitHubStore(settings, "fake-token", repo.fetcher, game);
    const creators = repo.files["data/creators.json"].creators;
    const names = {
      lyricist: "作詞A、作詞B",
      composer: "制作名A",
      arranger: "編曲C（ゲーム版）",
    };
    const input = {
      ...structuredClone(repo.song),
      ...enteredCreditData([], creators, null, names, Object.keys(names)),
      workId: undefined,
      ...(game.id === "ournotes"
        ? { mv: null, songType: null, gekisouSections: [null, null, null] }
        : {}),
    };
    if (game.id === "ournotes") {
      delete input.live3d;
      delete input.difficulties.SPECIAL;
    }
    const saved = await store.addSong(input, `${game.id}-direct-credit-add`);
    let loaded = await store.loadSong(saved.id);
    for (const role of Object.keys(names))
      assert.equal(loaded.song[role], names[role]);
    assert.deepEqual(loaded.song.credits, []); // Even a matching name is not automatically identified.
    const updatedNames = { ...names, composer: "改訂作曲者", arranger: "" };
    await store.updateSong(
      {
        ...loaded.song,
        ...enteredCreditData(
          creditRows(loaded.song),
          creators,
          loaded.song,
          updatedNames,
          ["composer", "arranger"],
        ),
      },
      loaded,
      `${game.id}-direct-credit-edit`,
    );
    loaded = await store.loadSong(saved.id);
    assert.equal(loaded.song.lyricist, names.lyricist);
    assert.equal(loaded.song.composer, "改訂作曲者");
    assert.equal(loaded.song.arranger, null);
    assert.deepEqual(loaded.song.creditDisplay.arranger, []);
    assert.equal(loaded.song.id, saved.id);
    const linked = enteredCreditData(
      [
        ...creditRows(loaded.song),
        { creatorId: "cr-0001", role: "composer", displayOverride: "" },
      ],
      creators,
      loaded.song,
      updatedNames,
      [],
    );
    await store.updateSong(
      { ...loaded.song, ...linked },
      loaded,
      `${game.id}-direct-credit-link`,
    );
    loaded = await store.loadSong(saved.id);
    assert.equal(loaded.song.composer, "制作名A");
    assert.deepEqual(loaded.song.creditDisplay.composer, [
      { creatorId: "cr-0001" },
    ]);
    assert.equal(loaded.song.lyricist, names.lyricist);
  });
test("unresolved composer is preserved while the same Creator gains another role", async () => {
  const repo = creatorRepository(),
    store = new GitHubStore(settings, "fake-token", repo.fetcher);
  const song = repo.files[GAMES.garupa.dataFile].groups[0].songs[0];
  song.composer = "制作名A、未同定名";
  song.creditDisplay.composer.push(
    { text: "、" },
    { text: "未同定名", unresolved: true },
  );
  const editing = await store.loadSong(1);
  const credit = selectedCreditData(
    [
      { creatorId: "cr-0001", role: "composer", displayOverride: "" },
      { creatorId: "cr-0001", role: "lyricist", displayOverride: "" },
    ],
    repo.files["data/creators.json"].creators,
    editing.song,
  );
  const saved = await store.updateSong(
    { ...editing.song, ...credit },
    editing,
    "pending-other-role-001",
  );
  assert.equal(saved.editing.song.composer, "制作名A、未同定名");
  assert.equal(saved.editing.song.lyricist, "制作名A");
  assert.deepEqual(
    saved.editing.song.creditDisplay.composer,
    song.creditDisplay.composer,
  );
});
test("Creator GitHub add/edit/delete uses fixed IDs, SHA and non-force atomic commits", async () => {
  const repo = creatorRepository(),
    store = new GitHubCreatorStore(settings, "fake-token", repo.fetcher);
  await store.connect();
  const loaded = await store.loadCreators();
  assert.equal(loaded.data.creators.length, 2);
  let saved = await store.saveCreator({
    creator: {
      name: "新規",
      sortKey: "しんき",
      slug: "new-creator",
      type: "organization",
      aliases: [],
    },
    expectedSha: loaded.sha,
    operationId: "create-operation-0001",
  });
  assert.equal(saved.data.creators[2].id, "cr-0003");
  assert.equal(saved.data.nextId, 4);
  const original = repo.files[GAMES.garupa.dataFile].groups[0].songs[0];
  saved = await store.saveCreator({
    creator: {
      ...saved.data.creators[0],
      name: "新しい制作名",
      slug: "new-author-a",
    },
    expectedSha: repo.masterSha(),
    operationId: "update-operation-0001",
  });
  assert.equal(saved.data.creators[0].id, "cr-0001");
  assert.equal(
    repo.files[GAMES.garupa.dataFile].groups[0].songs[0].composer,
    "新しい制作名",
  );
  assert.equal(
    repo.files[GAMES.garupa.dataFile].groups[0].songs[0].credits[0].creatorId,
    "cr-0001",
  );
  assert.ok(original);
  await assert.rejects(
    store.saveCreator({
      deleteId: "cr-0001",
      expectedSha: repo.masterSha(),
      operationId: "delete-operation-0001",
    }),
    /1曲（1収録）/,
  );
  await store.saveCreator({
    deleteId: "cr-0003",
    expectedSha: repo.masterSha(),
    operationId: "delete-operation-0002",
  });
  assert.equal(repo.files["data/creators.json"].creators.length, 2);
  assert.equal(repo.files["data/creators.json"].nextId, 4);
});
test("Creator stale SHA, duplicate slug and immutable-ID errors never write", async () => {
  const repo = creatorRepository(),
    store = new GitHubCreatorStore(settings, "fake-token", repo.fetcher),
    creator = repo.files["data/creators.json"].creators[0];
  for (const mutation of [
    { creator, expectedSha: "old" },
    { creator: { ...creator, slug: "unit-b" }, expectedSha: repo.masterSha() },
    { creator: { ...creator, id: "cr-9999" }, expectedSha: repo.masterSha() },
  ])
    await assert.rejects(
      store.saveCreator({ ...mutation, operationId: "invalid-operation-001" }),
    );
  assert.equal(repo.calls.filter((c) => c.method !== "GET").length, 0);
});
test("Creator concurrent branch update is rejected and lost-response retry is idempotent", async () => {
  const repo = creatorRepository(),
    store = new GitHubCreatorStore(settings, "fake-token", repo.fetcher),
    entry = {
      name: "新規",
      sortKey: "x",
      slug: "new-x",
      type: "person",
      aliases: [],
    },
    expectedSha = repo.masterSha();
  repo.loseResponse();
  await assert.rejects(
    store.saveCreator({
      creator: entry,
      expectedSha,
      operationId: "retry-operation-0001",
    }),
    /通信/,
  );
  const count = repo.calls.filter((c) => c.method === "POST").length;
  const retry = await store.saveCreator({
    creator: entry,
    expectedSha,
    operationId: "retry-operation-0001",
  });
  assert.equal(retry.alreadySaved, true);
  assert.equal(repo.calls.filter((c) => c.method === "POST").length, count);
  assert.equal(retry.data.creators.filter((c) => c.slug === "new-x").length, 1);
  repo.conflict();
  await assert.rejects(
    store.saveCreator({
      creator: { ...entry, slug: "new-y" },
      expectedSha: repo.masterSha(),
      operationId: "conflict-operation-001",
    }),
    /競合/,
  );
  assert.equal(
    repo.files["data/creators.json"].creators.filter((c) => c.slug === "new-y")
      .length,
    0,
  );
});
test("normalized song add chooses creators, combines roles and allocates Work in the same commit", async () => {
  const repo = creatorRepository(),
    store = new GitHubStore(settings, "fake-token", repo.fetcher);
  const credits = selectedCreditData(
    [
      { role: "composer", creatorId: "cr-0001", displayOverride: "特別表記" },
      { role: "arranger", creatorId: "cr-0001", displayOverride: "特別表記" },
      { role: "composer", creatorId: "cr-0002", displayOverride: "" },
    ],
    repo.files["data/creators.json"].creators,
  );
  const input = { ...repo.song, ...credits, title: "新作", workId: undefined };
  const saved = await store.addSong(input, "song-add-operation-001");
  assert.equal(saved.id, 2);
  assert.equal(saved.editing.song.workId, "wk-0002");
  assert.equal(saved.editing.song.composer, "特別表記、共同制作B");
  assert.equal(saved.editing.song.credits.length, 2);
  const tree = repo.calls.findLast((c) => c.route === "/git/trees").body.tree;
  assert.ok(tree.some((f) => f.path === "data/works.json"));
  assert.ok(tree.some((f) => f.path === GAMES.garupa.stateFile));
  const editing = await store.loadSong(2);
  const changed = {
    ...editing.song,
    ...selectedCreditData(
      [{ role: "lyricist", creatorId: "cr-0002", displayOverride: "" }],
      repo.files["data/creators.json"].creators,
    ),
  };
  await store.updateSong(changed, editing, "song-edit-operation-001");
  assert.equal(
    repo.files[GAMES.garupa.dataFile].groups[0].songs[1].lyricist,
    "共同制作B",
  );
  assert.equal(repo.files["data/works.json"].works.length, 2);
});
test("both-game links use the selected Work and reject invalid Creator or mismatched Work", async () => {
  const repo = creatorRepository(),
    store = new GitHubStore(
      settings,
      "fake-token",
      repo.fetcher,
      GAMES.ournotes,
    );
  const input = {
    ...structuredClone(repo.song),
    title: "別ゲーム収録",
    relatedSongIds: ["garupa:1"],
    mv: null,
    songType: null,
    gekisouSections: [null, null, null],
  };
  delete input.live3d;
  delete input.difficulties.SPECIAL;
  await store.addSong(input, "ournotes-normalized-001");
  assert.equal(
    repo.files[GAMES.ournotes.dataFile].groups[0].songs[0].workId,
    "wk-0001",
  );
  assert.deepEqual(
    repo.files[GAMES.garupa.dataFile].groups[0].songs[0].relatedSongIds,
    ["ournotes:1"],
  );
  const before = repo.calls.filter((c) => c.method !== "GET").length;
  await assert.rejects(
    store.addSong({ ...input, workId: undefined }, "ournotes-normalized-002"),
    /workIdが不一致/,
  );
  await assert.rejects(
    store.addSong({ ...input, credits: [] }, "ournotes-normalized-003"),
    /Creator/,
  );
  await assert.rejects(
    store.addSong(
      {
        ...input,
        creditDisplay: {
          lyricist: [],
          composer: [{ text: "未登録自由名" }],
          arranger: [],
        },
        credits: [],
      },
      "ournotes-normalized-004",
    ),
    /自由文字列/,
  );
  assert.equal(repo.calls.filter((c) => c.method !== "GET").length, before);
});
