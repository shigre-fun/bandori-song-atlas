import fs from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  REVIEW_DIR,
  loadBefore,
  parseAnswers,
  planReview,
  runReview,
  verifyPreservation,
} from "../../scripts/migrations/creator-credit-p3-review.mjs";
import { creditTokens } from "../../src/js/credit-display.js";
const read = (p) => JSON.parse(fs.readFileSync(p)),
  { before } = loadBefore();
const answers = parseAnswers(
    fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8"),
  ),
  clarification = read(REVIEW_DIR + "/clarification.json"),
  allocation = read(REVIEW_DIR + "/allocation.json");
const plan = planReview(before, answers, clarification, allocation),
  master = JSON.parse(plan.output["data/creators.json"]);
const song = (p, game, id) =>
  JSON.parse(p.output[`data/${game}/songs.json`])
    .groups.flatMap((g) => g.songs)
    .find((s) => s.id === id);
test("all 208 candidates, three alias candidates and 280 role scopes are parsed without inventing review dates", () => {
  assert.equal(answers.candidates.length, 208);
  assert.equal(answers.aliases.length, 3);
  assert.equal(answers.splits.length, 3);
  assert.equal(answers.humanReviewDate, null);
  assert.equal(
    answers.candidates.reduce((n, c) => n + c.scopes.length, 0) +
      answers.aliases.reduce((n, c) => n + c.scopes.length, 0),
    280,
  );
  assert.equal(answers.issues.length, 4);
  assert.ok(
    answers.candidates
      .find((c) => c.name === "小林　泉美")
      .fields.aliases.includes("小林”mimi”泉美"),
  );
});
test("missing quotes and invalid approval/type fields stay unresolved until the user clarification", () => {
  const first = planReview(before, answers);
  assert.equal(first.registered.length, 193);
  assert.ok(first.held.some((h) => h.reason === "identityConfirmed: ひとみ"));
  assert.ok(first.held.some((h) => h.reason === "Invalid type: perosn"));
  assert.ok(first.held.some((h) => h.reason.includes("Required: slug")));
  assert.equal(plan.held.length, 0);
  assert.equal(plan.conflicts.length, 0);
  assert.equal(plan.stale.length, 0);
});
test("all current data reproduces from the immutable source and stable allocation", () => {
  runReview("verify");
  assert.equal(master.creators.length, 371);
  assert.equal(master.nextId, 372);
  assert.equal(plan.registered.length, 202);
  const again = planReview(before, answers, clarification, plan.registered);
  assert.deepEqual(again.output, plan.output);
});
test("existing IDs are reused and same-person candidate chains merge without cycles or duplicate Creators", () => {
  const id = (key) => plan.candidateMap[key];
  assert.deepEqual(id("b1-65d09c562afaab97af82"), ["cr-0053"]);
  assert.deepEqual(id("b1-10ee6df825a6122bfabf"), ["cr-0055"]);
  assert.equal(
    id("b1-aed4f55bb80088cd7920")[1],
    id("b1-0453649b5d96b1b9f98d")[0],
  );
  assert.deepEqual(
    id("b1-e25846bcdfb4a607d88f"),
    id("b1-321672e2a4b0c8e50c92"),
  );
  assert.deepEqual(
    id("b1-b95ae14fa97a45d1a0f2"),
    id("b1-e810dc473c5fe705898a"),
  );
});
test("reference cycles remain held rather than silently choosing one new Creator", () => {
  const c = structuredClone(clarification);
  c.candidates["b1-0453649b5d96b1b9f98d"].samePersonAs =
    "candidate:b1-aed4f55bb80088cd7920の2人目";
  const p = planReview(before, answers, c);
  assert.ok(p.held.some((h) => h.reason === "Candidate reference cycle"));
  assert.equal(p.candidateMap["b1-aed4f55bb80088cd7920"][1], null);
});
test("explicit new-ID declarations conflicting with old names/aliases/slugs never create a duplicate", () => {
  const c = structuredClone(clarification);
  delete c.candidates["b1-65d09c562afaab97af82"];
  const p = planReview(before, answers, c);
  assert.equal(p.candidateMap["b1-65d09c562afaab97af82"][0], null);
  assert.ok(p.held.some((h) => h.reason.includes("cr-0053")));
});
test("split fields preserve the exact raw delimiters and connect separate people, including the old Yaginuma composer", () => {
  for (const id of [60, 120, 154]) {
    const s = song(plan, "garupa", id),
      old = JSON.parse(before.files["data/garupa/songs.json"])
        .groups.flatMap((g) => g.songs)
        .find((s) => s.id === id);
    assert.equal(s.lyricist, old.lyricist);
    assert.equal(
      creditTokens(s, "lyricist", master.creators).filter((t) => t.creator)
        .length,
      2,
    );
  }
  assert.ok(
    song(plan, "garupa", 60).credits.some(
      (c) =>
        c.creatorId === "cr-0066" &&
        c.roles.includes("composer") &&
        c.roles.includes("lyricist"),
    ),
  );
});
test("unapproved records with an exactly matching new alias stay unresolved", () => {
  const s = song(plan, "garupa", 369);
  assert.ok(
    creditTokens(s, "lyricist", master.creators).some(
      (t) => t.text === "KEIGO HAYASHI" && t.unresolved,
    ),
  );
  assert.ok(
    creditTokens(s, "lyricist", master.creators).some(
      (t) => t.text === "KOHSHI ASAKAWA" && t.unresolved,
    ),
  );
});
test("a changed Work is rejected even when credits are otherwise reproducible", () => {
  const p = structuredClone(plan);
  const db = JSON.parse(p.output["data/works.json"]);
  db.works[0].title += " changed";
  p.output["data/works.json"] = JSON.stringify(db);
  assert.throws(() => verifyPreservation(before, p), /Unrelated data bytes/);
});
test("non-credit changes in a reviewed song cannot pass the preservation gate", () => {
  const p = structuredClone(plan),
    db = JSON.parse(p.output["data/garupa/songs.json"]);
  db.groups.flatMap((g) => g.songs).find((s) => s.id === 224).durationSeconds =
    999;
  p.output["data/garupa/songs.json"] = JSON.stringify(db);
  assert.throws(() => verifyPreservation(before, p), /Only credit structures/);
});
test("an existing co-author may not be dropped when another role is formalized", () => {
  const p = structuredClone(plan),
    db = JSON.parse(p.output["data/garupa/songs.json"]),
    s = db.groups.flatMap((g) => g.songs).find((s) => s.id === 60);
  s.creditDisplay.composer = [{ text: s.composer, unresolved: true }];
  s.credits = s.credits
    .map((c) => ({ ...c, roles: c.roles.filter((r) => r !== "composer") }))
    .filter((c) => c.roles.length);
  p.output["data/garupa/songs.json"] = JSON.stringify(db);
  assert.throws(
    () => verifyPreservation(before, p),
    /Existing formal participant retained/,
  );
});
test("unrelated old Creator metadata cannot be changed by a P3 identity answer", () => {
  const p = structuredClone(plan),
    db = JSON.parse(p.output["data/creators.json"]);
  db.creators[0].name += "changed";
  p.output["data/creators.json"] = JSON.stringify(db);
  assert.throws(
    () => verifyPreservation(before, p),
    /Existing master preserved/,
  );
});
test("every original P3 task has one disposition and the regenerated ledger maps every unresolved role", () => {
  const map = read(REVIEW_DIR + "/TASK_CORRESPONDENCE.json"),
    v = read(REVIEW_DIR + "/verification.json");
  assert.equal(map.rows.length, 1812);
  assert.equal(new Set(map.rows.map((r) => r.taskId)).size, 1812);
  assert.equal(map.P3TaskUnmapped, 0);
  assert.ok(map.rows.every((r) => r.status === "APPLIED"));
  assert.equal(v.after.unmappedCurrentUnresolved, 0);
  assert.equal(v.after.categoryTaskCounts.GAME_VERSION_REVIEW, 39);
});
