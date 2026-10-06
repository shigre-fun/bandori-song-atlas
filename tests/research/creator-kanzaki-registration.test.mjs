import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import {
  REGISTRATION_DIR,
  loadRegistrationBefore,
  registrationAnswers,
  planRegistration,
  verifyRegistrationPreservation,
  runRegistration,
  registrationTaskCorrespondence,
  protectedEvidencePath,
} from "../../scripts/migrations/register-kanzaki-creator.mjs";
import {
  DATA_FILES,
  loadInputs,
  buildLedger,
  verifyLedger,
} from "../../scripts/research/creator-credit-human-todo.mjs";
import { creditText } from "../../src/js/credit-display.js";

const sha = (x) => createHash("sha256").update(x).digest("hex");
const hashes = () =>
  Object.fromEntries(DATA_FILES.map((p) => [p, sha(fs.readFileSync(p))]));
const initial = hashes();
const { baseline, before } = loadRegistrationBefore();
const text = fs.readFileSync(REGISTRATION_DIR + "/input.txt", "utf8");
const answers = registrationAnswers(text, before.priorReview);
const plan = planRegistration(before.files, answers);
const input = loadInputs();
const ledger = buildLedger(input);
const record = (files, game, id) =>
  JSON.parse(files[`data/${game}/songs.json`])
    .groups.flatMap((g) => g.songs)
    .find((s) => s.id === id);
after(() =>
  assert.deepEqual(hashes(), initial, "Tests do not alter live sources"),
);

test("explicit none and user-approved evidence omission are distinct from missing answers", () => {
  assert.equal(answers.fields.affiliation, "");
  assert.equal(answers.fields["根拠URL・資料"], "");
  assert.equal(answers.fields["備考"], "");
  assert.equal(
    answers.explicitDecisions["根拠URL・資料"].status,
    "USER_APPROVED_OMISSION",
  );
  assert.equal(answers.scopes.length, 6);
  for (const marker of [" （なし）", " （なしでよいです）", '同一="はい"'])
    assert.throws(
      () => registrationAnswers(text.replace(marker, ""), before.priorReview),
      /Explicit none|identity answer/,
    );
});

test("new fixed ID and metadata append preserves every existing Creator and unrelated source byte", () => {
  const master = JSON.parse(plan.output["data/creators.json"]);
  assert.deepEqual(plan.creator, {
    id: "cr-0125",
    name: "カンザキイオリ",
    slug: "iori-kanzaki",
    type: "person",
    reading: "かんざきいおり",
    sortKey: "かんざきいおり",
    sortKeyStatus: "confirmed",
    aliases: [],
  });
  assert.equal(master.creators.length, 125);
  assert.equal(master.nextId, 126);
  assert.deepEqual(
    master.creators.slice(0, -1),
    JSON.parse(before.files["data/creators.json"]).creators,
  );
  verifyRegistrationPreservation(before.files, plan.output, plan.scopes);
  assert.equal(plan.output["data/works.json"], before.files["data/works.json"]);
  assert.equal(
    plan.output["data/ournotes/admin-state.json"],
    before.files["data/ournotes/admin-state.json"],
  );
  assert.equal(record(plan.output, "ournotes", 85).durationSeconds, 102);
  const actual = Object.fromEntries(
    Object.keys(before.files).map((p) => [p, fs.readFileSync(p, "utf8")]),
  );
  assert.deepEqual(
    actual,
    plan.output,
    "Applied sources equal exact guarded plan",
  );
});

test("only six approved songwriter bindings change; exact raw and existing arranger order remain", () => {
  for (const scope of plan.scopes) {
    const song = record(plan.output, scope.game, scope.recordId);
    assert.equal(song[scope.role], scope.raw);
    assert.equal(
      creditText(song, scope.role, input.master.creators),
      scope.raw,
    );
    assert.deepEqual(song.creditDisplay[scope.role], [
      { creatorId: "cr-0125" },
    ]);
    assert.ok(
      song.credits
        .find((c) => c.creatorId === "cr-0125")
        .roles.includes(scope.role),
    );
  }
  const old = record(before.files, "ournotes", 86),
    now = record(plan.output, "ournotes", 86);
  assert.deepEqual(
    now.credits.filter((c) => c.creatorId !== "cr-0125"),
    old.credits,
  );
  assert.deepEqual(now.creditDisplay.arranger, old.creditDisplay.arranger);
  assert.equal(now.arranger, "植木建象、神田ジョン（from PENGUIN RESEARCH）");
  const bindings = [];
  for (const game of ["garupa", "ournotes"])
    for (const s of JSON.parse(
      plan.output[`data/${game}/songs.json`],
    ).groups.flatMap((g) => g.songs))
      for (const c of s.credits ?? [])
        if (c.creatorId === "cr-0125")
          for (const role of c.roles) bindings.push(`${game}:${s.id}:${role}`);
  assert.deepEqual(
    bindings.sort(),
    answers.scopes.map((s) => `${s.game}:${s.recordId}:${s.role}`).sort(),
  );
});

test("scope substitutions, changed recording evidence, occupied IDs and historical slug reuse reject", () => {
  const bad = structuredClone(answers);
  bad.scopes[0].recordId = 468;
  assert.throws(
    () => planRegistration(before.files, bad),
    /Approved scope only/,
  );
  for (const field of ["title", "lyricist", "workId"]) {
    const files = { ...before.files };
    const db = JSON.parse(files["data/garupa/songs.json"]);
    const s = db.groups.flatMap((g) => g.songs).find((s) => s.id === 467);
    s[field] = "wrong";
    files["data/garupa/songs.json"] = JSON.stringify(db);
    assert.throws(
      () => planRegistration(files, answers),
      /CONFLICT scope|CONFLICT scoped|CONFLICT raw/,
    );
  }
  for (const change of [
    (m) => (m.nextId = 127),
    (m) => (m.creators[0].previousSlugs = ["iori-kanzaki"]),
    (m) => m.creators.push({ ...plan.creator, name: "別人" }),
  ]) {
    const files = { ...before.files },
      m = JSON.parse(files["data/creators.json"]);
    change(m);
    files["data/creators.json"] = JSON.stringify(m);
    assert.throws(() => planRegistration(files, answers), /CONFLICT/);
  }
});

test("repeated registration produces identical bytes and zero structural edits", () => {
  const again = planRegistration(plan.output, answers);
  assert.equal(again.creatorEdits, 0);
  assert.equal(again.songEdits, 0);
  assert.deepEqual(again.output, plan.output);
});

test("current ledger removes resolved identity and registration tasks while keeping all 39 version reviews", () => {
  assert.ok(
    !ledger.candidates.some(
      (c) => c.standardNameCandidate === "カンザキイオリ",
    ),
  );
  for (const scope of plan.scopes) {
    const tasks =
      ledger.songs.find(
        (s) => s.game === scope.game && s.recordId === scope.recordId,
      )?.tasks ?? [];
    assert.ok(!tasks.some((t) => t.role === scope.role));
  }
  assert.equal(
    ledger.songs
      .flatMap((s) => s.tasks)
      .filter((t) => t.category === "GAME_VERSION_REVIEW").length,
    39,
  );
  const proof = verifyLedger(input, ledger);
  assert.equal(proof.metrics.currentUnresolvedRecordRoles, 605);
  assert.equal(proof.metrics.unmappedCurrentUnresolved, 0);
});

test("independent verification detects lost bindings, extra roles, and altered registration metadata", () => {
  for (const kind of ["binding", "role", "metadata"]) {
    const edited = structuredClone(input);
    const s = edited.games.ournotes.groups
      .flatMap((g) => g.songs)
      .find((s) => s.id === 86);
    if (kind === "binding")
      s.creditDisplay.lyricist = [{ unresolved: "カンザキイオリ" }];
    if (kind === "role")
      s.credits.find((c) => c.creatorId === "cr-0125").roles.push("arranger");
    if (kind === "metadata")
      edited.master.creators.find((c) => c.id === "cr-0125").name = "別名";
    assert.throws(
      () => verifyLedger(edited, buildLedger(edited)),
      /Applied registration|Unapproved registration/,
    );
  }
});

test("immutable original P0 and research evidence remains byte-verified after registration", () => {
  assert.equal(Object.keys(baseline.protectedResearch).length, 452);
  for (const [p, h] of Object.entries({
    ...baseline.priorReviewHashes,
    ...baseline.protectedResearch,
  }))
    assert.equal(
      sha(fs.readFileSync(protectedEvidencePath(p, baseline))),
      h,
      p,
    );
  assert.equal(
    before.priorReview.registration.status,
    "BLOCKED_INCOMPLETE_CREATOR_FIELDS",
  );
  assert.equal(runRegistration("verify").creator.id, "cr-0125");
});

test("every prior task remains mapped or resolved by this explicit registration", () => {
  const map = registrationTaskCorrespondence(before, ledger);
  const saved = JSON.parse(
    fs.readFileSync(REGISTRATION_DIR + "/TASK_CORRESPONDENCE.json"),
  );
  assert.deepEqual(saved.entries, map.entries);
  assert.equal(map.unmappedOldTasks, 0);
  assert.equal(saved.originalLedgerTaskCount, 3432);
  assert.equal(saved.originalLedgerEntries.length, 3432);
  const current = new Set(
    [
      ...ledger.songs.flatMap((s) => s.tasks),
      ...ledger.candidates.flatMap((c) => c.tasks),
    ].map((t) => t.taskId),
  );
  for (const e of [...saved.entries, ...saved.originalLedgerEntries])
    for (const id of e.newTaskIds) assert.ok(current.has(id), id);
});
