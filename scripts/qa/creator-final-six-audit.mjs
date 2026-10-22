import fs from "node:fs";
import assert from "node:assert/strict";
import {
  REVIEW_DIR,
  loadBefore,
  runReview,
  sha,
} from "../migrations/creator-final-six-review.mjs";
import {
  loadInputs,
  buildLedger,
  verifyLedger,
  run,
} from "../research/creator-credit-human-todo.mjs";
const before = loadBefore(),
  plan = runReview("verify"),
  input = loadInputs(),
  ledger = buildLedger(input),
  verification = verifyLedger(input, ledger);
assert.equal(plan.dispositions.length, 6);
assert.ok(plan.dispositions.every((t) => t.status === "RESOLVED"));
assert.equal(plan.held.length, 0);
assert.equal(verification.metrics.totalSongTasks, 0);
assert.equal(verification.metrics.totalSongTodoRecords, 0);
assert.equal(verification.metrics.unmappedCurrentUnresolved, 0);
const path = "data/ournotes/songs.json",
  receipt = REVIEW_DIR + "/review.json",
  hashes = [sha(fs.readFileSync(path)), sha(fs.readFileSync(receipt))];
runReview("apply");
assert.deepEqual(
  [sha(fs.readFileSync(path)), sha(fs.readFileSync(receipt))],
  hashes,
);
run("generate");
const artifacts = fs
    .readdirSync("docs/todo/creator-credit-human-review")
    .filter((n) => n.startsWith("HUMAN_TODO_")),
  todoHashes = Object.fromEntries(
    artifacts.map((n) => [
      n,
      sha(fs.readFileSync("docs/todo/creator-credit-human-review/" + n)),
    ]),
  );
run("generate");
for (const [p, h] of Object.entries(todoHashes))
  assert.equal(
    sha(fs.readFileSync("docs/todo/creator-credit-human-review/" + p)),
    h,
  );
fs.writeFileSync(
  REVIEW_DIR + "/TASK_CORRESPONDENCE.json",
  JSON.stringify(
    {
      resolved: 6,
      remaining: 0,
      unmappedCurrentUnresolved: 0,
      tasks: plan.dispositions,
    },
    null,
    2,
  ) + "\n",
);
const result = {
  status: "PASS",
  resolved: 6,
  remaining: 0,
  creatorIdByRole: Object.fromEntries(
    plan.reviews.map((r) => [r.role, r.bindings[0].creatorId]),
  ),
  displayByRole: Object.fromEntries(plan.reviews.map((r) => [r.role, r.raw])),
  creators: input.master.creators.length,
  nextId: input.master.nextId,
  newCreators: 0,
  addedRoleBindings: 3,
  todoSongs: 0,
  todoTasks: 0,
  todoCandidates: 0,
  unmappedCurrentUnresolved: 0,
  preservation: plan.preservation,
  reapplyChangedFiles: 0,
  todoRegenerateChangedFiles: 0,
  tests: "PENDING",
  build: "PENDING",
  SEO: "PENDING",
  Functions: "PENDING",
  publication: { commit: false, push: false, deploy: false },
  dataHashes: Object.fromEntries(
    Object.keys(before.files).map((p) => [p, sha(fs.readFileSync(p))]),
  ),
};
fs.writeFileSync(
  REVIEW_DIR + "/verification.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(result);
