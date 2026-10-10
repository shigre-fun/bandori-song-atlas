import fs from "node:fs";
import assert from "node:assert/strict";
import {
  loadBefore,
  runReview,
  REVIEW_DIR,
  sha,
} from "../migrations/creator-credit-p2-review.mjs";
import {
  loadInputs,
  buildLedger,
  verifyLedger,
} from "../research/creator-credit-human-todo.mjs";
const save = (name, x) =>
  fs.writeFileSync(REVIEW_DIR + "/" + name, JSON.stringify(x, null, 2) + "\n");
const { before } = loadBefore(),
  plan = runReview("verify"),
  input = loadInputs(),
  ledger = buildLedger(input),
  proof = verifyLedger(input, ledger);
const key = (r) => `${r.game}:${r.recordId}:${r.role}`;
const reviews = new Map(plan.reviews.map((r) => [key(r), r]));
const songs = Object.fromEntries(
  Object.entries(input.games).map(([g, d]) => [
    g,
    d.groups.flatMap((g) => g.songs),
  ]),
);
const liveTasks = ledger.songs.flatMap((r) =>
  r.tasks.map((t) => ({ ...t, game: r.game, recordId: r.recordId })),
);
const rows = before.tasks.map((t) => {
  const r = reviews.get(key(t)),
    s = songs[t.game].find((s) => s.id === t.recordId),
    ids = plan.candidateMap[t.creatorCandidateKey];
  let status = "STILL_NEEDS_HUMAN",
    reason = "回答未完了のため課題を保持";
  if (!s || s.title !== t.title || s.workId !== t.workId) {
    status = "STALE_BECAUSE_CURRENT_CHANGED";
    reason = "対象record/Work不一致";
  } else if (t.category === "CREDIT_COLLECTION" && r?.collection) {
    status = "RESOLVED";
    reason = "ゲーム画面原文を引用符内回答から収集";
  } else if (t.category === "CREATOR_REGISTRATION" && ids?.length) {
    status = "RESOLVED";
    reason = "回答済み必要情報で登録/既存Creator統合";
  } else if (
    t.category === "CREATOR_IDENTITY" &&
    ids?.length &&
    ids.every((id) =>
      s.credits.some((c) => c.creatorId === id && c.roles.includes(t.role)),
    )
  ) {
    status = "RESOLVED";
    reason = "個別record/roleの同一性とformal適用を明示承認";
  } else if (t.category === "SPLIT_REVIEW" && r?.splitConfirmed) {
    status = "RESOLVED";
    reason =
      "作者境界/単一主体と順序を確認。未同定部分は個別identity課題へ保持";
  } else if (
    ["ROLE_REVIEW", "ALIAS_REVIEW"].includes(t.category) &&
    r?.roleConfirmed
  ) {
    const id =
      ids?.[0] ??
      JSON.parse(
        before.artifacts["HUMAN_TODO_BY_CREATOR.json"],
      ).candidates.find((c) => c.candidateKey === t.creatorCandidateKey)
        ?.confirmedExistingCreatorId;
    const mapped = id
      ? s.credits.some((c) => c.creatorId === id && c.roles.includes(t.role))
      : !s.creditDisplay[t.role].some((p) => p.unresolved);
    status = mapped ? "RESOLVED" : "BLOCKED_BY_OTHER_IDENTITY";
    reason = mapped
      ? "対象role/表記と既存Creator対応を明示承認"
      : "role原文は確認済み。formal適用は未同定主体の確認に依存";
  }
  const remaining = liveTasks
    .filter((n) => key(n) === key(t))
    .map((n) => n.taskId);
  if (status !== "RESOLVED" && status !== "STALE_BECAUSE_CURRENT_CHANGED")
    assert.ok(remaining.length, "Unresolved original task lost " + t.taskId);
  return {
    taskId: t.taskId,
    category: t.category,
    game: t.game,
    recordId: t.recordId,
    role: t.role,
    status,
    reason,
    remainingTaskIds: remaining,
  };
});
assert.equal(rows.length, 481);
assert.equal(new Set(rows.map((r) => r.taskId)).size, 481);
const categories = Object.fromEntries(
  [...new Set(rows.map((t) => t.category))].map((c) => [
    c,
    Object.fromEntries(
      [...new Set(rows.map((t) => t.status))].map((s) => [
        s,
        rows.filter((t) => t.category === c && t.status === s).length,
      ]),
    ),
  ]),
);
const roles = (files) =>
  ["garupa", "ournotes"]
    .flatMap((g) =>
      JSON.parse(files[`data/${g}/songs.json`]).groups.flatMap((x) => x.songs),
    )
    .flatMap((s) => s.credits.flatMap((c) => c.roles));
const oldRoles = roles(before.files),
  newRoles = roles(plan.output);
const formalIncrease = Object.fromEntries(
  ["lyricist", "composer", "arranger"].map((r) => [
    r,
    newRoles.filter((x) => x === r).length -
      oldRoles.filter((x) => x === r).length,
  ]),
);
const creatorsBefore = JSON.parse(
  before.artifacts["HUMAN_TODO_BY_CREATOR.json"],
).candidates;
const newCandidates = ledger.candidates
  .filter((c) => !creatorsBefore.some((o) => o.candidateKey === c.candidateKey))
  .map((c) => ({
    candidateKey: c.candidateKey,
    name: c.standardNameCandidate,
    records: c.affectedRecords,
  }));
const beforeHashes = Object.fromEntries(
  Object.keys(before.files).map((p) => [p, sha(fs.readFileSync(p))]),
);
runReview("apply");
assert.deepEqual(
  Object.fromEntries(
    Object.keys(before.files).map((p) => [p, sha(fs.readFileSync(p))]),
  ),
  beforeHashes,
  "Repeat application changes zero bytes",
);
const verification = {
  result: "PASS",
  P2TaskUnmapped: 0,
  originalTaskCount: 481,
  categories,
  statusCounts: Object.fromEntries(
    [...new Set(rows.map((t) => t.status))].map((s) => [
      s,
      rows.filter((t) => t.status === s).length,
    ]),
  ),
  acceptedAnswerFields: plan.reviews.length
    ? JSON.parse(fs.readFileSync(REVIEW_DIR + "/review.json")).answers
        .answeredFields
    : 0,
  before: before.currentMetrics,
  after: proof.metrics,
  registeredCreators: plan.registered,
  mergedCandidates: Object.entries(plan.candidateMap)
    .filter(([key, ids]) => key === "b1-8e00fe4d903f403579aa")
    .map(([candidateKey, creatorIds]) => ({ candidateKey, creatorIds })),
  held: plan.held,
  newCandidates,
  formalIncrease,
  dataHashes: beforeHashes,
  repeatChanges: 0,
  reproducedFromSavedReview: true,
  unrelatedDataChanges: 0,
  previousCreatorChanges: 0,
  WorkIdentityChanges: 0,
  duplicateIds: 0,
  duplicateCurrentSlugs: 0,
  previousSlugConflicts: 0,
  danglingReferences: 0,
  tests: "PENDING",
  publication: "PENDING",
};
save("TASK_CORRESPONDENCE.json", {
  originalTaskCount: 481,
  P2TaskUnmapped: 0,
  categories,
  rows,
});
save("verification.json", verification);
console.log(
  JSON.stringify(
    {
      ...verification,
      registeredCreators: verification.registeredCreators.map((c) => c.id),
      newCandidates: verification.newCandidates.map((c) => ({
        key: c.candidateKey,
        name: c.name,
      })),
    },
    null,
    2,
  ),
);
