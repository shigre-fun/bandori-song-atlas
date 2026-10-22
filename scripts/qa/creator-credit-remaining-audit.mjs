import fs from "node:fs";
import assert from "node:assert/strict";
import {
  REVIEW_DIR,
  loadBefore,
  runReview,
  sha,
} from "../migrations/creator-credit-remaining-review.mjs";
import {
  loadInputs,
  buildLedger,
  verifyLedger,
  run,
} from "../research/creator-credit-human-todo.mjs";
const save = (name, x) =>
    fs.writeFileSync(
      REVIEW_DIR + "/" + name,
      JSON.stringify(x, null, 2) + "\n",
    ),
  before = loadBefore(),
  plan = runReview("verify"),
  input = loadInputs(),
  ledger = buildLedger(input),
  verification = verifyLedger(input, ledger),
  current = ledger.songs.flatMap((s) => s.tasks),
  original = before.previous.records.flatMap((s) => s.tasks);
const correspondence = original.map((t) => {
  const answer = plan.taskAnswers[t.taskId],
    live = current.find((c) => c.taskId === t.taskId),
    record = plan.reviews.find((r) => r.taskIds.includes(t.taskId));
  let status = live
    ? "STILL_NEEDS_HUMAN"
    : answer && record
      ? "RESOLVED"
      : "BLOCKED";
  return {
    taskId: t.taskId,
    category: t.category,
    status,
    answer: answer ?? null,
    reviewedScope: record
      ? `${record.game}:${record.recordId}:${record.role}`
      : null,
    raw: t.raw,
    candidateKey: t.creatorCandidateKey,
  };
});
assert.equal(correspondence.length, 375);
assert.equal(correspondence.filter((t) => t.status === "RESOLVED").length, 375);
assert.equal(verification.metrics.unmappedCurrentUnresolved, 0);
const oldSongs = new Map(
    ["garupa", "ournotes"].flatMap((g) =>
      JSON.parse(before.files[`data/${g}/songs.json`]).groups.flatMap((x) =>
        x.songs.map((s) => [`${g}:${s.id}`, s]),
      ),
    ),
  ),
  actual = new Set(),
  expected = new Set();
for (const [key, s] of oldSongs) {
  const [game, id] = key.split(":"),
    song = input.games[game].groups
      .flatMap((g) => g.songs)
      .find((s) => s.id === Number(id));
  for (const rel of song.credits)
    for (const role of rel.roles)
      if (
        !s.credits.some(
          (c) => c.creatorId === rel.creatorId && c.roles.includes(role),
        )
      )
        actual.add(`${key}:${role}:${rel.creatorId}`);
}
for (const t of correspondence)
  for (const id of t.answer?.creatorIds ?? []) {
    const key = t.taskId.split(":").slice(0, 2).join(":"),
      role = t.taskId.split(":")[2],
      s = oldSongs.get(key);
    if (!s.credits.some((c) => c.creatorId === id && c.roles.includes(role)))
      expected.add(`${key}:${role}:${id}`);
  }
assert.deepEqual(
  [...actual].sort(),
  [...expected].sort(),
  "Actual added relations exactly equal approved scope set",
);
const newer = before.ledger.songs
  .flatMap((s) => s.tasks)
  .filter((t) => !original.some((o) => o.taskId === t.taskId));
assert.equal(newer.length, 9);
assert.equal(ledger.songs.length, 1);
assert.equal(ledger.songs[0].game, "ournotes");
assert.equal(ledger.songs[0].recordId, 89);
assert.equal(current.length, 6);
assert.ok(current.every((t) => t.taskId.startsWith("ournotes:89:")));
assert.equal(
  input.games.ournotes.groups.flatMap((g) => g.songs).find((s) => s.id === 89)
    .credits.length,
  0,
);
const products = Object.keys(plan.output),
  hashes = Object.fromEntries(
    products.map((p) => [p, sha(fs.readFileSync(p))]),
  ),
  receipt = sha(fs.readFileSync(REVIEW_DIR + "/review.json"));
runReview("apply");
assert.equal(
  sha(fs.readFileSync(REVIEW_DIR + "/review.json")),
  receipt,
  "Receipt reapply unchanged",
);
for (const [p, h] of Object.entries(hashes))
  assert.equal(sha(fs.readFileSync(p)), h, "Data reapply unchanged");
run("generate");
const artifacts = fs
    .readdirSync("docs/todo/creator-credit-human-review")
    .filter((n) => /^HUMAN_TODO_/.test(n)),
  todoHashes = Object.fromEntries(
    artifacts.map((n) => [
      n,
      sha(fs.readFileSync("docs/todo/creator-credit-human-review/" + n)),
    ]),
  );
run("generate");
for (const [n, h] of Object.entries(todoHashes))
  assert.equal(
    sha(fs.readFileSync("docs/todo/creator-credit-human-review/" + n)),
    h,
    "ToDo regeneration unchanged",
  );
save("TASK_CORRESPONDENCE.json", {
  P0P2Remaining375TaskUnmapped: 0,
  counts: {
    RESOLVED: 375,
    PARTIALLY_RESOLVED: 0,
    STILL_NEEDS_HUMAN: 0,
    BLOCKED: 0,
    STALE: 0,
  },
  tasks: correspondence,
  newOutOfScopeTasks: newer.map((t) => t.taskId),
  currentOutstandingTasks: current.map((t) => t.taskId),
});
const result = {
  status: "PASS",
  originalTasks: 375,
  P0P2Remaining375TaskUnmapped: 0,
  unmappedCurrentUnresolved: 0,
  originalRemaining: 0,
  currentTasks: 6,
  currentSongs: 1,
  currentCandidates: 1,
  newCreatorCount: plan.registered.length,
  creators: input.master.creators.length,
  nextId: input.master.nextId,
  automaticMatches: Object.values(plan.taskAnswers).filter((a) => a.automatic)
    .length,
  versionAnswers: plan.versionAnswers,
  roleAnswers: plan.roleAnswers,
  aliasAdditions: plan.aliasChanges,
  slugChanges: plan.metadataChanges,
  preservation: plan.preservation,
  addedBindings: actual.size,
  reapplyChangedFiles: 0,
  todoRegenerateChangedFiles: 0,
  tests: "PENDING",
  build: "PENDING",
  SEO: "PENDING",
  Functions: "PENDING",
  publication: { commit: false, push: false, deploy: false },
  dataHashes: hashes,
};
save("verification.json", result);
console.log(result);
