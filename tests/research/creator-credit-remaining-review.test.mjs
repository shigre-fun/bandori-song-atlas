import fs from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { creditRows, selectedCreditData } from "../../src/js/creators-data.js";
import {
  REVIEW_DIR,
  loadBefore,
  parseAnswers,
  planReview,
  verifyPreservation,
  runReview,
} from "../../scripts/migrations/creator-credit-remaining-review.mjs";
import {
  loadInputs,
  buildLedger,
  verifyLedger,
} from "../../scripts/research/creator-credit-human-todo.mjs";
const before = loadBefore(),
  answers = parseAnswers(fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8")),
  clarification = JSON.parse(
    fs.readFileSync(REVIEW_DIR + "/clarification.json"),
  ),
  allocation = JSON.parse(fs.readFileSync(REVIEW_DIR + "/allocation.json")),
  plan = planReview(before, answers, clarification, allocation),
  master = JSON.parse(plan.output["data/creators.json"]);
const song = (g, id) =>
  JSON.parse(plan.output[`data/${g}/songs.json`])
    .groups.flatMap((g) => g.songs)
    .find((s) => s.id === id);

test("every newly introduced relation keeps its canonical structure when the editor saves unchanged credits", () => {
  for (const game of ["garupa", "ournotes"]) {
    const original = JSON.parse(
      before.files[`data/${game}/songs.json`],
    ).groups.flatMap((g) => g.songs);
    for (const s of JSON.parse(
      plan.output[`data/${game}/songs.json`],
    ).groups.flatMap((g) => g.songs)) {
      const old = original.find((p) => p.id === s.id),
        canonical = selectedCreditData(creditRows(s), master.creators, s);
      for (const rel of s.credits.filter(
        (c) => !old.credits.some((o) => o.creatorId === c.creatorId),
      ))
        assert.deepEqual(
          canonical.credits.find((c) => c.creatorId === rel.creatorId),
          rel,
          `${game}:${s.id}:${rel.creatorId}`,
        );
    }
  }
});
test("the exact original 375 tasks are parsed and human date stays unanswered", () => {
  assert.deepEqual(
    [
      answers.candidates.length,
      answers.aliases.length,
      answers.versions.length,
      answers.roles.length,
    ],
    [83, 74, 39, 3],
  );
  assert.equal(Object.keys(plan.taskAnswers).length, 375);
  assert.equal(answers.humanReviewDate, null);
  assert.equal(answers.reviewer, "タニマチ");
  assert.equal(answers.aliases.filter((a) => a.auto).length, 25);
});
test("unanswered and malformed values are held until explicit clarification", () => {
  const p = planReview(before, answers);
  assert.ok(p.held.some((h) => h.uid === "B022"));
  assert.ok(p.held.some((h) => h.uid === "B030"));
  assert.ok(p.held.some((h) => h.uid === "B075"));
  assert.ok(!p.taskAnswers["garupa:800:composer:ALIAS_REVIEW-cr-0004"]);
  assert.equal(
    p.versionAnswers.find(
      (v) => v.taskId === "ournotes:6:arranger:GAME_VERSION_REVIEW",
    ).answer,
    null,
  );
  assert.equal(plan.held.length, 0);
});
test("75 stable IDs are allocated once; aliases and scoped candidate merges do not duplicate identities", () => {
  assert.equal(master.creators.length, 446);
  assert.equal(master.nextId, 447);
  assert.equal(plan.registered.length, 75);
  assert.equal(new Set(master.creators.map((c) => c.id)).size, 446);
  assert.deepEqual(
    plan.output,
    planReview(before, answers, clarification, plan.registered).output,
  );
  assert.equal(master.creators.filter((c) => c.name === "米米CLUB").length, 1);
  assert.equal(master.creators.filter((c) => c.name === "石倉まろ").length, 1);
});
test("compound subjects split into distinct approved people without a compound Creator", () => {
  for (const name of ["ふるっぺ・森さん・Litz", "工藤大輝 / 花村想太 / MEG.ME"])
    assert.ok(!master.creators.some((c) => c.name === name));
  for (const title of ["森さん", "Litz", "工藤大輝"])
    assert.ok(master.creators.some((c) => c.name === title));
  assert.equal(plan.candidateMap["current-c0d947c79a5463c9cdfd"].length, 3);
  assert.equal(plan.candidateMap["current-391dd0c6d7a0f40365a0"].length, 3);
});
test("all 25 automatic matches are exact full-string and unique in the original master", () => {
  const original = JSON.parse(before.files["data/creators.json"]).creators;
  for (const a of answers.aliases.filter((a) => a.auto)) {
    assert.equal(
      original.filter((c) => [c.name, ...c.aliases].includes(a.token)).length,
      1,
    );
    assert.equal(plan.taskAnswers[a.taskId].automatic, true);
  }
  assert.equal(
    plan.taskAnswers["garupa:308:lyricist:ALIAS_REVIEW-b1-b528ebcd57341a509dce"]
      .automatic,
    false,
  );
});
test("39 release relationships, three raw/role confirmations and the Nor split are independent approvals", () => {
  assert.equal(
    plan.versionAnswers.filter((v) => v.answer === "はい").length,
    39,
  );
  assert.equal(plan.roleAnswers.filter((v) => v.answer === "はい").length, 3);
  const s = song("ournotes", 46),
    nor = master.creators.find((c) => c.name === "Nor");
  assert.ok(
    s.credits.some(
      (c) => c.creatorId === nor.id && c.roles.includes("arranger"),
    ),
  );
  assert.ok(
    s.credits.some(
      (c) => c.creatorId === "cr-0028" && c.roles.includes("arranger"),
    ),
  );
});
test("sabio / 高村風太 is one existing Creator with the full unchanged display", () => {
  const s = song("ournotes", 59);
  assert.equal(s.arranger, "sabio/高村風太");
  assert.equal(s.creditDisplay.arranger.filter((p) => p.creatorId).length, 1);
  assert.equal(
    s.creditDisplay.arranger.find((p) => p.creatorId).creatorId,
    "cr-0071",
  );
  assert.ok(
    master.creators
      .find((c) => c.id === "cr-0071")
      .aliases.includes("sabio/高村風太"),
  );
});
test("the explicitly changed slug retains previous URLs and all other existing metadata", () => {
  const c = master.creators.find((c) => c.id === "cr-0061");
  assert.equal(c.slug, "nayutan-seijin");
  assert.ok(c.previousSlugs.includes("nayutalien"));
  assert.deepEqual(plan.metadataChanges, [
    { id: "cr-0061", oldSlug: "nayutalien", newSlug: "nayutan-seijin" },
  ]);
});
test("all 2670 raw fields, Work and unrelated fields and prior evidence are preserved", () => {
  const p = verifyPreservation(before, plan);
  assert.equal(p.rawFields, 2670);
  assert.equal(p.bindings, 206);
  assert.equal(p.WorkChanges, 0);
  assert.equal(p.unrelatedChanges, 0);
});
test("the unlisted new song remains unresolved with no global expansion", () => {
  const s = song("ournotes", 89);
  assert.equal(s.credits.length, 0);
  const input = loadInputs(),
    l = buildLedger(input),
    v = verifyLedger(input, l);
  assert.equal(v.metrics.totalSongTasks, 6);
  assert.equal(v.metrics.unmappedCurrentUnresolved, 0);
  assert.ok(l.songs.every((s) => s.game === "ournotes" && s.recordId === 89));
});
test("input/task mismatches fail before writing and current plan reproduces every changed file", () => {
  const a = structuredClone(answers);
  a.candidates[0].candidateKey = "wrong";
  assert.throws(
    () => planReview(before, a, clarification, allocation),
    /Input candidate/,
  );
  runReview("verify");
  assert.equal(plan.conflicts.length, 0);
  assert.equal(plan.stale.length, 0);
});
