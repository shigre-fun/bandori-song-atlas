import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import {
  loadBefore,
  parseAnswers,
  planRegistration,
  verifyPreservation,
  taskCorrespondence,
  runRegistration,
  REVIEW_DIR,
  IDS,
  CANDIDATE_KEY,
} from "../../scripts/migrations/register-kanow-creator.mjs";
import {
  loadInputs,
  buildLedger,
  verifyLedger,
  run,
} from "../../scripts/research/creator-credit-human-todo.mjs";
const sha = (x) => createHash("sha256").update(x).digest("hex");
const { baseline, before } = loadBefore();
const inputText = fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8");
const clarification = JSON.parse(
  fs.readFileSync(REVIEW_DIR + "/clarification.json"),
);
const answers = parseAnswers(inputText, clarification, before);
const plan = planRegistration(before.files, answers);
const input = loadInputs(),
  ledger = buildLedger(input);
const hashes = () =>
  Object.fromEntries(
    Object.keys(before.files).map((p) => [p, sha(fs.readFileSync(p))]),
  );
const initial = hashes();
after(() => assert.deepEqual(hashes(), initial, "Tests preserve live data"));

test("blank affiliation requires explicit followup, blank notes stays unanswered and global answer is not record approval", () => {
  assert.throws(
    () => parseAnswers(inputText, null, before),
    /Missing affiliation/,
  );
  assert.equal(answers.fields.affiliation, "なし");
  assert.equal(answers.fields.notes, null);
  assert.deepEqual(answers.unprovidedFields, ["備考"]);
  assert.equal(
    answers.decisions["加納望について今回確認した10収録以外へ自動適用してよい"],
    "はい",
  );
  assert.equal(answers.scopes.length, 10);
});
test("latest P1 identity, candidate key, exact records, titles and Works must match", () => {
  for (const edit of [
    (t) =>
      t.replace(
        'candidateKey="' + CANDIDATE_KEY + '"',
        'candidateKey="changed-key"',
      ),
    (t) => t.replace("## Garupa:19 空色デイズ", "## Garupa:19 別曲"),
    (t) => t.replace("wk-0019", "wk-0999"),
    (t) => t.replace("## Garupa:40", "## Garupa:41"),
  ])
    assert.throws(() => parseAnswers(edit(inputText), clarification, before));
  const b = structuredClone(before),
    c = JSON.parse(b.artifacts["HUMAN_TODO_BY_CREATOR.json"]);
  c.candidates.push({
    ...c.candidates[0],
    priority: "P1",
    candidateKey: "additional",
  });
  b.artifacts["HUMAN_TODO_BY_CREATOR.json"] = JSON.stringify(c);
  assert.throws(() => parseAnswers(inputText, clarification, b), /Latest P1/);
});
test("dynamic nextId, metadata, all previous creators and two-file-only data patch validate", () => {
  assert.equal(
    plan.creator.id,
    "cr-" +
      String(JSON.parse(before.files["data/creators.json"]).nextId).padStart(
        4,
        "0",
      ),
  );
  assert.equal(plan.creator.slug, "nozomu-kanow");
  assert.equal(plan.creator.type, "person");
  assert.deepEqual(plan.creator.aliases, []);
  const live = Object.fromEntries(
    Object.keys(before.files).map((p) => [p, fs.readFileSync(p, "utf8")]),
  );
  assert.deepEqual(live, plan.output);
  verifyPreservation(before.files, live, plan.creator, plan.scopes);
});
test("ten arranger relations preserve both co-arrangers, exact raw punctuation and affiliation without organization duplication", () => {
  assert.deepEqual(
    plan.scopes.map((s) => s.recordId),
    IDS,
  );
  assert.equal(
    plan.scopes.filter((s) => s.partnerName === "都丸椋太").length,
    6,
  );
  assert.equal(
    plan.scopes.filter((s) => s.partnerName === "母里治樹").length,
    4,
  );
  assert.equal(
    plan.scopes.every((s) => s.identity === "はい" && s.split === "はい"),
    true,
  );
  assert.equal(new Set(plan.scopes.map((s) => s.workId)).size, 10);
});
test("denied, deferred or empty identity/split answers never attach a relation or resolve that record", () => {
  for (const answer of ["いいえ", "保留", null])
    for (const field of ["identity", "split"]) {
      const a = structuredClone(answers);
      a.scopes[0][field] = answer;
      const p = planRegistration(before.files, a);
      assert.equal(p.scopes.length, 9);
      assert.equal(p.unresolvedScopes[0][field], answer);
      const old = JSON.parse(before.files["data/garupa/songs.json"])
        .groups.flatMap((g) => g.songs)
        .find((s) => s.id === 19);
      const current = JSON.parse(p.output["data/garupa/songs.json"])
        .groups.flatMap((g) => g.songs)
        .find((s) => s.id === 19);
      assert.deepEqual(current, old);
    }
});
test("ID/slug collisions, changed scope evidence and unapproved record substitution reject", () => {
  for (const change of [
    (m) => (m.nextId = 1),
    (m) => (m.creators[0].previousSlugs = ["nozomu-kanow"]),
  ]) {
    const f = { ...before.files },
      m = JSON.parse(f["data/creators.json"]);
    change(m);
    f["data/creators.json"] = JSON.stringify(m);
    assert.throws(() => planRegistration(f, answers), /CONFLICT/);
  }
  for (const field of ["title", "raw", "workId", "recordId"]) {
    const a = structuredClone(answers);
    a.scopes[0][field] = field === "recordId" ? 18 : "wrong";
    assert.throws(
      () => planRegistration(before.files, a),
      /CONFLICT|Approved scope/,
    );
  }
});
test("existing ID path reuses Creator and repeated plan changes no bytes or IDs", () => {
  const repeat = planRegistration(plan.output, answers);
  assert.equal(repeat.creatorEdits, 0);
  assert.equal(repeat.songEdits, 0);
  assert.deepEqual(repeat.output, plan.output);
  const a = structuredClone(answers);
  a.fields.samePersonAs = plan.creator.id;
  const reuse = planRegistration(plan.output, a);
  assert.deepEqual(reuse.output, plan.output);
});
test("current ledger excludes resolved P1 and exactly ten splits, preserves unrelated tasks and all prior 3432 task provenance", () => {
  assert.ok(!ledger.candidates.some((c) => c.candidateKey === CANDIDATE_KEY));
  const proof = verifyLedger(input, ledger);
  assert.equal(proof.metrics.unmappedCurrentUnresolved, 0);
  assert.equal(
    proof.metrics.totalSongTasks,
    baseline.metrics.totalSongTasks - 40,
  );
  assert.equal(
    proof.metrics.splitReviewTasks,
    baseline.metrics.splitReviewTasks - 10,
  );
  assert.equal(proof.metrics.categoryTaskCounts.GAME_VERSION_REVIEW, 39);
  const map = taskCorrespondence(before, ledger);
  assert.equal(map.unmappedOldTasks, 0);
  assert.equal(map.originalLedgerTaskCount, 3432);
  assert.deepEqual(
    map,
    JSON.parse(fs.readFileSync(REVIEW_DIR + "/TASK_CORRESPONDENCE.json")),
  );
  run("verify");
});
test("independent preservation rejects lost co-arranger, extra Creator roles, punctuation, Works and unrelated edits", () => {
  for (const kind of [
    "coarranger",
    "coarrangerRole",
    "role",
    "punctuation",
    "unrelated",
    "Work",
  ]) {
    const f = { ...plan.output };
    if (kind === "Work") f["data/works.json"] += " ";
    else {
      const d = JSON.parse(f["data/garupa/songs.json"]),
        s = d.groups.flatMap((g) => g.songs).find((s) => s.id === 19);
      if (kind === "coarranger") s.creditDisplay.arranger.shift();
      if (kind === "coarrangerRole")
        s.credits.find((c) => c.creatorId === "cr-0019").roles.push("composer");
      if (kind === "role")
        s.credits
          .find((c) => c.creatorId === plan.creator.id)
          .roles.push("composer");
      if (kind === "punctuation") s.creditDisplay.arranger[1].text = "/";
      if (kind === "unrelated") s.durationSeconds = 1;
      f["data/garupa/songs.json"] = JSON.stringify(d);
    }
    assert.throws(() =>
      verifyPreservation(before.files, f, plan.creator, plan.scopes),
    );
  }
});
test("all earlier research/review evidence stays immutable and applied result matches guarded plan", () => {
  for (const [p, h] of Object.entries(baseline.protectedEvidenceHashes))
    assert.equal(sha(fs.readFileSync(p)), h, p);
  assert.equal(runRegistration("verify").creator.id, plan.creator.id);
});
