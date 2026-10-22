import fs from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  REVIEW_DIR,
  loadBefore,
  parseAnswers,
  planReview,
  verifyPreservation,
  runReview,
  sha,
} from "../../scripts/migrations/creator-final-six-review.mjs";
import {
  loadInputs,
  buildLedger,
  verifyLedger,
} from "../../scripts/research/creator-credit-human-todo.mjs";
const before = loadBefore(),
  answers = parseAnswers(fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8")),
  plan = planReview(before, answers),
  song = JSON.parse(plan.output["data/ournotes/songs.json"])
    .groups.flatMap((g) => g.songs)
    .find((s) => s.id === 89);
test("all six explicit positive answers including the typographic quote are read; optional blanks stay null", () => {
  for (const role of ["lyricist", "composer", "arranger"]) {
    assert.equal(answers.roles[role].roleConfirmed, "はい");
    assert.equal(answers.roles[role].bindingApproved, "はい");
    assert.equal(answers.roles[role].specifiedCreator, "");
    assert.equal(answers.roles[role].correctedRaw, "");
  }
  assert.equal(answers.humanReviewDate, null);
  assert.equal(answers.reviewer, null);
});
test("missing or negative approvals do not acquire a relation or resolve their two tasks", () => {
  for (const value of [null, "", "いいえ", "保留"]) {
    const a = structuredClone(answers);
    a.roles.lyricist.bindingApproved = value;
    const p = planReview(before, a);
    assert.equal(
      p.dispositions.filter((d) => d.status === "RESOLVED").length,
      4,
    );
    assert.ok(
      p.dispositions
        .filter((d) => d.role === "lyricist")
        .every((d) => d.status === "STILL_NEEDS_HUMAN"),
    );
    const s = JSON.parse(p.output["data/ournotes/songs.json"])
      .groups.flatMap((g) => g.songs)
      .find((s) => s.id === 89);
    assert.ok(!s.credits.some((c) => c.roles.includes("lyricist")));
  }
});
test("ambiguous exact names or a conflicting requested ID are held without guessing", () => {
  const b = structuredClone(before),
    m = JSON.parse(b.files["data/creators.json"]);
  m.creators.push({
    id: "cr-0999",
    name: "牧野太洋",
    slug: "different-makino",
    type: "person",
    sortKey: "まきの",
    aliases: [],
  });
  m.nextId = 1000;
  b.files["data/creators.json"] = JSON.stringify(m);
  assert.equal(
    planReview(b, answers).dispositions.filter((d) => d.status === "RESOLVED")
      .length,
    0,
  );
  const a = structuredClone(answers);
  a.roles.composer.specifiedCreator = "cr-0001";
  assert.equal(planReview(before, a).held.length, 1);
});
test("all roles bind the unique existing cr-0375 once and preserve the actual displayed raw", () => {
  assert.deepEqual(song.credits, [
    { creatorId: "cr-0375", roles: ["lyricist", "composer", "arranger"] },
  ]);
  for (const role of ["lyricist", "composer", "arranger"]) {
    assert.equal(song[role], "牧野太洋");
    assert.deepEqual(song.creditDisplay[role], [{ creatorId: "cr-0375" }]);
  }
  assert.equal(plan.dispositions.length, 6);
  assert.ok(
    plan.dispositions.every(
      (d) => d.creatorId === "cr-0375" && d.status === "RESOLVED",
    ),
  );
});
test("the independent preservation gate rejects unrelated song or timing edits", () => {
  verifyPreservation(before, plan);
  const p = structuredClone(plan),
    data = JSON.parse(p.output["data/ournotes/songs.json"]);
  data.groups.flatMap((g) => g.songs).find((s) => s.id === 88).title +=
    " changed";
  p.output["data/ournotes/songs.json"] = JSON.stringify(data);
  assert.throws(() => verifyPreservation(before, p), /No unrelated/);
});
test("Creator master, Work, all prior human reviews and all other data stay byte-identical", () => {
  const v = verifyPreservation(before, plan);
  assert.equal(v.CreatorChanges, 0);
  assert.equal(v.WorkChanges, 0);
  assert.equal(v.otherSongsChanged, 0);
  assert.equal(plan.sourceType, "人間による明示確認");
  assert.equal(plan.humanReviewDate, null);
  assert.equal(plan.reviewer, null);
});
test("a second application changes no data or receipt bytes and allocates no ID", () => {
  const paths = [
      "data/ournotes/songs.json",
      "data/creators.json",
      REVIEW_DIR + "/review.json",
    ],
    hashes = paths.map((p) => sha(fs.readFileSync(p)));
  runReview("apply");
  assert.deepEqual(
    paths.map((p) => sha(fs.readFileSync(p))),
    hashes,
  );
  runReview("verify");
});
test("the complete live ToDo has zero songs, zero tasks and zero unmapped current roles", () => {
  const input = loadInputs(),
    ledger = buildLedger(input),
    v = verifyLedger(input, ledger);
  assert.equal(input.master.creators.length, 446);
  assert.equal(v.metrics.totalSongTodoRecords, 0);
  assert.equal(v.metrics.totalSongTasks, 0);
  assert.equal(v.metrics.totalCreatorCandidates, 0);
  assert.equal(v.metrics.unmappedCurrentUnresolved, 0);
  assert.equal(
    input.finalSixReview.dispositions.filter((d) => d.status === "RESOLVED")
      .length,
    6,
  );
});
