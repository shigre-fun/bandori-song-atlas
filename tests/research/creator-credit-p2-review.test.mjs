import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  loadBefore,
  loadBaseFiles,
  canonicalText,
  parseAnswers,
  planReview,
  verifyPreservation,
  runReview,
  REVIEW_DIR,
} from "../../scripts/migrations/creator-credit-p2-review.mjs";
import {
  loadInputs,
  buildLedger,
  verifyLedger,
  run,
} from "../../scripts/research/creator-credit-human-todo.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p));
const { before } = loadBefore(),
  answers = parseAnswers(fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8")),
  clarification = read(REVIEW_DIR + "/clarification.json"),
  allocation = read(REVIEW_DIR + "/allocation.json");
const plan = planReview(
  loadBaseFiles(before),
  answers,
  before,
  clarification,
  allocation,
);
test("all 481 original tasks have unique dispositions and unresolved identities remain mapped", () => {
  const map = read(REVIEW_DIR + "/TASK_CORRESPONDENCE.json");
  assert.equal(map.rows.length, 481);
  assert.equal(new Set(map.rows.map((r) => r.taskId)).size, 481);
  assert.equal(map.P2TaskUnmapped, 0);
  for (const row of map.rows)
    if (row.status !== "RESOLVED") assert.ok(row.remainingTaskIds.length);
  assert.equal(map.categories.CREDIT_COLLECTION.RESOLVED, 97);
  assert.equal(map.categories.SPLIT_REVIEW.RESOLVED, 53);
});
test("empty and malformed answers remain unanswered until explicit clarification", () => {
  assert.equal(answers.humanReviewDate, null);
  assert.equal(answers.reviewer, "タニマチ");
  const find = (key) =>
    answers.candidates.find((c) => c.candidateKey === key).entities[0];
  assert.equal(find("b1-e12eda6ee4265889dc55").affiliation, null);
  assert.equal(find("b1-4f91af38c06b9f63e032").reading, null);
  assert.equal(find("b1-2a52f798ceb56249a012").aliases, null);
  const initial = planReview(before.files, answers, before);
  assert.equal(initial.held.length, 7);
  assert.equal(initial.conflicts.length, 5);
  assert.equal(initial.stale.length, 3);
  assert.equal(plan.held.length, clarification.existingCreators ? 0 : 2);
  if (!clarification.existingCreators)
    assert.deepEqual(
      plan.held.map((c) => c.name),
      ["大橋卓弥", "常田真太郎"],
    );
  assert.equal(plan.conflicts.length, 0);
  assert.equal(plan.stale.length, 0);
});
test("saved human review reproduces every live data byte and repeat application is stable", () => {
  const live = Object.fromEntries(
    Object.keys(before.files).map((p) => [p, fs.readFileSync(p, "utf8")]),
  );
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(plan.output).map(([p, t]) => [p, canonicalText(t)]),
    ),
    Object.fromEntries(
      Object.entries(live).map(([p, t]) => [p, canonicalText(t)]),
    ),
  );
  verifyPreservation(loadBaseFiles(before), live, plan);
  runReview("verify");
  const repeat = planReview(
    loadBaseFiles(before),
    answers,
    before,
    clarification,
    allocation,
  );
  assert.deepEqual(repeat.output, plan.output);
  assert.equal(plan.registered.length, 43);
});
test("explicit identity refusals prevent per-record relations despite registered metadata", () => {
  for (const answer of [null, "いいえ", "保留"]) {
    const a = structuredClone(answers);
    a.candidates
      .find((c) => c.name === "Fukase")
      .scopes.find((s) => s.recordId === 85 && s.role === "lyricist")[
      "上記Creatorと同一"
    ] = answer;
    const p = planReview(before.files, a, before, clarification, allocation),
      id = p.candidateMap["b1-96b50efd44763aae3629"][0];
    const song = JSON.parse(p.output["data/garupa/songs.json"])
      .groups.flatMap((g) => g.songs)
      .find((s) => s.id === 85);
    assert.ok(
      !song.credits.some(
        (c) => c.creatorId === id && c.roles.includes("lyricist"),
      ),
    );
  }
});
test("split-only approval preserves unresolved P3 actors and all punctuation", () => {
  const song = JSON.parse(plan.output["data/garupa/songs.json"])
    .groups.flatMap((g) => g.songs)
    .find((s) => s.id === 111);
  assert.equal(song.composer, "影山ヒロノブ・きただにひろし");
  assert.deepEqual(song.creditDisplay.composer, [
    { text: "影山ヒロノブ", unresolved: true },
    { text: "・" },
    { text: "きただにひろし", unresolved: true },
  ]);
  assert.ok(
    !plan.registered.some((c) =>
      ["影山ヒロノブ", "きただにひろし"].includes(c.name),
    ),
  );
  const i = loadInputs(),
    l = buildLedger(i),
    v = verifyLedger(i, l);
  assert.equal(v.metrics.unmappedCurrentUnresolved, 0);
  assert.equal(v.metrics.categoryTaskCounts.GAME_VERSION_REVIEW, 39);
  assert.ok(
    l.songs
      .find((r) => r.game === "garupa" && r.recordId === 111)
      .tasks.some((t) => t.category === "CREATOR_IDENTITY"),
  );
});
test("prior Creator metadata, P0/P1 roles, Work and unrelated fields cannot be altered", () => {
  for (const kind of [
    "work",
    "duration",
    "priorCreator",
    "extraRole",
    "unrelatedRaw",
  ]) {
    const out = { ...plan.output };
    if (kind === "work") out["data/works.json"] += " ";
    else if (kind === "priorCreator") {
      const m = JSON.parse(out["data/creators.json"]);
      m.creators[0].name = "bad";
      out["data/creators.json"] = JSON.stringify(m);
    } else {
      const d = JSON.parse(out["data/garupa/songs.json"]),
        s = d.groups.flatMap((g) => g.songs).find((s) => s.id === 19);
      if (kind === "duration") s.durationSeconds = 1;
      else if (kind === "extraRole")
        s.credits.find((c) => c.creatorId === "cr-0126").roles.push("composer");
      else s.composer = "bad";
      out["data/garupa/songs.json"] = JSON.stringify(d);
    }
    assert.throws(() => verifyPreservation(loadBaseFiles(before), out, plan));
  }
});
test("Creator reuse, Unicode followups and explicit new Work scope retain fixed IDs", () => {
  const m = JSON.parse(plan.output["data/creators.json"]);
  assert.equal(m.nextId, 170);
  assert.equal(m.creators.length, 169);
  const revo = m.creators.find((c) => c.name === "Revo");
  assert.equal(revo.reading, "れう゛ぉ");
  assert.equal(revo.sortKey, revo.reading);
  assert.equal(m.creators.find((c) => c.name === "Reol").type, "person");
  assert.deepEqual(
    plan.candidateMap["b1-8e00fe4d903f403579aa"],
    plan.candidateMap["b1-1d4523c52c9646f14a3b"],
  );
  const sky = JSON.parse(plan.output["data/garupa/songs.json"])
    .groups.flatMap((g) => g.songs)
    .find((s) => s.id === 800);
  assert.equal(sky.workId, "wk-0824");
  assert.equal(sky.arranger, "藤田淳平（Elements Garden）");
});
test("current ToDo remains reproducible with all human evidence hashes unchanged", () => {
  run("verify");
});
