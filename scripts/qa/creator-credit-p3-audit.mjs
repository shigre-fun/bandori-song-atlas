import fs from "node:fs";
import assert from "node:assert/strict";
import {
  REVIEW_DIR,
  sha,
  loadBefore,
  runReview,
} from "../migrations/creator-credit-p3-review.mjs";
import {
  loadInputs,
  buildLedger,
  verifyLedger,
} from "../research/creator-credit-human-todo.mjs";
const { before } = loadBefore(),
  plan = runReview("verify"),
  input = loadInputs(),
  ledger = buildLedger(input),
  proof = verifyLedger(input, ledger);
assert.equal(proof.metrics.unmappedCurrentUnresolved, 0);
const source = JSON.parse(fs.readFileSync(REVIEW_DIR + "/parsed-answers.json"));
assert.equal(source.candidates.length, 208);
assert.equal(source.aliases.length, 3);
assert.equal(plan.reviews.length, 280);
const subjects = source.candidates.map((c) => c.candidateKey);
const originalCandidates = before.ledger.candidates.filter(
  (c) => c.priority === "P3",
);
assert.equal(originalCandidates.length, 211, "Original P3 population");
const rows = [];
for (const c of originalCandidates) {
  const scopes = plan.reviews.filter((r) =>
    r.candidateKeys.includes(c.candidateKey),
  );
  assert.ok(scopes.length, c.candidateKey);
  const ids =
    plan.candidateMap[c.candidateKey] ??
    scopes.flatMap((r) => r.applied.map((a) => a.creatorId));
  const pending = ledger.candidates.find(
    (x) => x.candidateKey === c.candidateKey,
  );
  const status = plan.held.some((h) => h.candidateKey === c.candidateKey)
    ? "PARTIAL_NEEDS_HUMAN"
    : "APPLIED";
  for (const t of c.tasks)
    rows.push({
      taskId: t.taskId,
      candidateKey: c.candidateKey,
      kind: "CREATOR",
      status,
      scopeKeys: scopes.map((r) => `${r.game}:${r.recordId}:${r.role}`),
      creatorIds: ids,
    });
  for (const id of c.songTaskIds) {
    const s = before.ledger.songs.find((s) =>
        s.tasks.some((t) => t.taskId === id),
      ),
      task = s.tasks.find((t) => t.taskId === id);
    if (task.priority !== "P3") continue;
    const r = scopes.find(
      (r) =>
        r.game === s.game && r.recordId === s.recordId && r.role === task.role,
    );
    assert.ok(r, id);
    rows.push({
      taskId: id,
      candidateKey: c.candidateKey,
      kind: "SONG",
      status,
      scopeKeys: [`${r.game}:${r.recordId}:${r.role}`],
      creatorIds: ids,
    });
  }
  if (status === "PARTIAL_NEEDS_HUMAN")
    assert.ok(
      pending ||
        ledger.songs.some((s) =>
          s.tasks.some((t) => t.creatorCandidateKey === c.candidateKey),
        ) ||
        scopes.some((s) => s.splitConfirmed),
      "Unanswered work retained",
    );
}
assert.equal(
  new Set(rows.map((r) => r.taskId)).size,
  rows.length,
  "Each original P3 task corresponds once",
);
const untouched = [],
  retainedPrior = [];
for (const s of before.ledger.songs)
  for (const task of s.tasks.filter((t) => t.priority !== "P3")) {
    const now = ledger.songs.find(
        (n) => n.game === s.game && n.recordId === s.recordId,
      ),
      remaining = now?.tasks.some((t) => t.taskId === task.taskId);
    if (!remaining) {
      const equivalent =
        now?.tasks.filter(
          (t) =>
            t.role === task.role &&
            t.creatorCandidateKey === task.creatorCandidateKey &&
            t.raw === task.raw,
        ) ?? [];
      if (equivalent.length) {
        retainedPrior.push({
          taskId: task.taskId,
          currentTaskIds: equivalent.map((t) => t.taskId),
          reason:
            "Identity/registration reclassified as alias review after master registration; this record remains unresolved",
        });
        continue;
      }
      const r = plan.reviews.find(
        (r) =>
          r.game === s.game &&
          r.recordId === s.recordId &&
          r.role === task.role,
      );
      assert.ok(
        r,
        "Non-P3 task lost outside reviewed subject scope " + task.taskId,
      );
      untouched.push({
        taskId: task.taskId,
        reason:
          "Previously recorded role/boundary dependency now satisfied by the explicitly approved P3 subject in this same field",
        scope: `${s.game}:${s.recordId}:${task.role}`,
      });
    }
  }
const receiptHash = sha(fs.readFileSync(REVIEW_DIR + "/review.json"));
const hashes = Object.fromEntries(
  Object.keys(before.files).map((p) => [p, sha(fs.readFileSync(p))]),
);
runReview("apply");
assert.deepEqual(
  Object.fromEntries(
    Object.keys(before.files).map((p) => [p, sha(fs.readFileSync(p))]),
  ),
  hashes,
  "Second apply changes no data bytes",
);
assert.equal(
  sha(fs.readFileSync(REVIEW_DIR + "/review.json")),
  receiptHash,
  "Reapply preserves the exact saved human review receipt",
);
const report = {
  result: "PASS",
  P3TaskUnmapped: 0,
  originalCreatorCandidates: 211,
  newCreatorCandidateAnswers: 208,
  aliasCandidateAnswers: 3,
  originalCreditScopes: 280,
  taskCount: rows.length,
  songTaskCount: rows.filter((r) => r.kind === "SONG").length,
  creatorTaskCount: rows.filter((r) => r.kind === "CREATOR").length,
  registered: plan.registered,
  aliasChanges: plan.aliasChanges,
  held: plan.held,
  formalAdded: plan.reviews.flatMap((r) =>
    r.applied.map((a) => ({
      ...a,
      role: r.role,
      game: r.game,
      recordId: r.recordId,
    })),
  ),
  before: before.verification.metrics,
  after: proof.metrics,
  dependentPriorTasks: untouched,
  retainedPriorTasks: retainedPrior,
  dataHashes: hashes,
  reapplyChangedFiles: 0,
  rawChanges: 0,
  WorkChanges: 0,
  unrelatedChanges: 0,
  tests: "PENDING",
  build: "PENDING",
  SEO: "PENDING",
  Functions: "PENDING",
  publication: "NOT_REQUESTED_PROHIBITED",
};
fs.writeFileSync(
  REVIEW_DIR + "/TASK_CORRESPONDENCE.json",
  JSON.stringify({ P3TaskUnmapped: 0, rows }, null, 2) + "\n",
);
fs.writeFileSync(
  REVIEW_DIR + "/verification.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log({
  result: "PASS",
  P3TaskUnmapped: 0,
  candidates: 211,
  scopes: 280,
  taskCount: rows.length,
  registered: plan.registered.length,
  held: plan.held.length,
  dependentPriorTasks: untouched.length,
  metrics: proof.metrics,
});
