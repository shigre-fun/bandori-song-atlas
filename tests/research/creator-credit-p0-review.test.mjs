import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  loadBefore,
  parseAnswers,
  planReview,
  verifyPreservation,
  safeExistingCreator,
  relationshipStatus,
  REVIEW_DIR,
} from "../../scripts/migrations/creator-credit-p0-review.mjs";
import {
  loadInputs,
  buildLedger,
  verifyLedger,
  DATA_FILES,
  assertAnswersUntouched,
} from "../../scripts/research/creator-credit-human-todo.mjs";
import { creditText } from "../../src/js/credit-display.js";
import { loadRegistrationBefore } from "../../scripts/migrations/register-kanzaki-creator.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const hashes = () =>
  Object.fromEntries(DATA_FILES.map((p) => [p, sha(fs.readFileSync(p))]));
const initial = hashes();
const { before } = loadBefore();
const text = fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8");
const answers = parseAnswers(text);
const input = loadInputs();
// Retain the original P0 assertions against its byte-verified applied state.
// The subsequent registration has separate live-data regression tests.
const phaseFiles = loadRegistrationBefore().before.files;
input.master = JSON.parse(phaseFiles["data/creators.json"]);
input.works = JSON.parse(phaseFiles["data/works.json"]);
input.games = Object.fromEntries(
  ["garupa", "ournotes"].map((game) => [
    game,
    JSON.parse(phaseFiles[`data/${game}/songs.json`]),
  ]),
);
input.humanRegistration = null;
for (const file of DATA_FILES) input.inputHashes[file] = sha(phaseFiles[file]);
const plan = planReview(before.files, answers, input.identities);
const ledger = buildLedger(input);
const record = (id) =>
  input.games.ournotes.groups.flatMap((g) => g.songs).find((s) => s.id === id);
const tasks = (id, role) =>
  ledger.songs
    .find((s) => s.game === "ournotes" && s.recordId === id)
    ?.tasks.filter((t) => t.role === role) ?? [];
after(() =>
  assert.deepEqual(hashes(), initial, "Tests never mutate current sources"),
);

test("all 81 game arranger answers, duplicate 86, curly opening quotes and empty human fields are preserved", () => {
  assert.equal(answers.records.filter((r) => r.role === "arranger").length, 81);
  assert.equal(answers.records.length, 82);
  assert.equal(answers.humanReviewDate, null);
  assert.equal(answers.reviewer, "タニマチ");
  assert.equal(answers.fields["根拠URL・資料"], null);
  assert.deepEqual(answers.fields.aliases, []);
  assert.equal(answers.records.find((r) => r.recordId === 22).raw, "小木岳司");
  assert.equal(
    answers.records.find((r) => r.recordId === 86 && r.role === "arranger")
      .inputLines.length,
    2,
  );
  assert.equal(
    parseAnswers('OurNotes:1 迷星叫：編曲者=""').records[0].raw,
    null,
  );
  assert.equal(
    parseAnswers('OurNotes:1 迷星叫：編曲者="欄なし"').records[0].fieldAbsent,
    true,
  );
  assert.throws(
    () =>
      parseAnswers(
        'OurNotes:1 迷星叫：編曲者="A"\nOurNotes:1 迷星叫：編曲者="B"',
      ),
    /Conflicting duplicate/,
  );
});

test("game raw and creditDisplay retain every exact byte and participant order", () => {
  for (const answer of answers.records) {
    assert.equal(record(answer.recordId)[answer.role], answer.raw);
    assert.equal(
      creditText(record(answer.recordId), answer.role, input.master.creators),
      answer.raw,
    );
    assert.equal(
      record(answer.recordId).workId,
      plan.reviews.find(
        (r) => r.recordId === answer.recordId && r.role === answer.role,
      ).workId,
    );
  }
  assert.equal(record(59).arranger, "sabio/高村風太");
  assert.equal(record(66).arranger, "瀬名水紀(Dream Monster)、Aira");
  assert.equal(record(78).arranger, "牧野太洋");
  assert.equal(
    record(86).arranger,
    "植木建象、神田ジョン（from PENGUIN RESEARCH）",
  );
});

test("only exact approved aliases produce formal IDs; unknown names and Kanji variants cannot register or merge", () => {
  assert.equal(
    safeExistingCreator(
      "神田ジョン（from PENGUIN RESEARCH）",
      input.master.creators,
      record(86),
      "arranger",
    ).creatorId,
    "cr-0103",
  );
  assert.equal(
    safeExistingCreator(
      "槙島隆人（SUPA LOVE）",
      input.master.creators,
      record(14),
      "arranger",
    ),
    null,
  );
  assert.equal(
    safeExistingCreator(
      "藤井健太郎(Dream Monster)",
      input.master.creators,
      record(78),
      "arranger",
    ),
    null,
  );
  assert.equal(
    safeExistingCreator(
      "TK",
      input.master.creators,
      { credits: [] },
      "arranger",
    ),
    null,
  );
  assert.equal(
    record(78).credits.some(
      (c) => c.creatorId === "cr-0033" && c.roles.includes("arranger"),
    ),
    false,
  );
  assert.equal(
    record(66).credits.filter((c) => c.roles.includes("arranger")).length,
    2,
  );
  assert.equal(input.master.creators.length, 124);
});

test("unanswered arrangement relations remain tasks even for fully resolved formal game credits", () => {
  assert.ok(
    tasks(1, "arranger").some((t) => t.category === "GAME_VERSION_REVIEW"),
  );
  assert.ok(
    !tasks(1, "arranger").some((t) => t.category === "CREDIT_COLLECTION"),
  );
  assert.ok(
    !tasks(3, "arranger").some((t) => t.category === "GAME_VERSION_REVIEW"),
  );
  assert.equal(relationshipStatus("不明"), "UNRESOLVED");
  assert.equal(relationshipStatus("同じ"), "SAME_ARRANGEMENT_CONFIRMED");
  assert.match(
    relationshipStatus("同一人物だが現在は石倉まろ名義のみを使用"),
    /ARRANGEMENT_UNRESOLVED/,
  );
  assert.match(
    relationshipStatus("別の人物、牧野太洋が正しい"),
    /ARRANGEMENT_UNRESOLVED/,
  );
  for (const id of [75, 78])
    assert.ok(
      tasks(id, "arranger").some((t) => t.category === "GAME_VERSION_REVIEW"),
    );
});

test("new game participants are full identity/registration todos; old conditional release tasks are removed", () => {
  for (const name of [
    "UYKADO",
    "高村風太",
    "牧野太洋",
    "加藤貴之",
    "ケンモチヒデフミ",
    "Skye K",
  ]) {
    const candidate = ledger.candidates.find(
      (c) => c.standardNameCandidate === name,
    );
    assert.ok(candidate, name);
    assert.equal(candidate.confirmedExistingCreatorId, null);
    assert.equal(candidate.priority, "P0");
    assert.ok(
      candidate.tasks.some((t) => t.category === "CREATOR_REGISTRATION"),
    );
    assert.ok(
      candidate.affectedRecords.every((r) => r.creditContext === "CURRENT_RAW"),
    );
  }
  assert.ok(
    !tasks(66, "arranger").some((t) =>
      [
        "CREDIT_COLLECTION",
        "CREATOR_IDENTITY",
        "CREATOR_REGISTRATION",
        "SPLIT_REVIEW",
        "GAME_VERSION_REVIEW",
      ].includes(t.category),
    ),
  );
  const proof = verifyLedger(input, ledger);
  assert.equal(proof.metrics.unmappedCurrentUnresolved, 0);
  assert.equal(proof.metrics.ournotesArrangerManualSongs, 0);
});

test("Kanzaki supplied metadata and five identity answers are retained while missing fields block registration", () => {
  assert.deepEqual(plan.registration.missingFields, [
    "affiliation",
    "根拠URL・資料",
    "備考",
  ]);
  assert.equal(plan.registration.creatorAdded, false);
  assert.equal(answers.scopeConfirmations.length, 5);
  for (const scope of answers.scopeConfirmations) {
    const row = ledger.songs.find(
      (r) => r.game === scope.game && r.recordId === scope.recordId,
    );
    assert.ok(
      row.tasks.some(
        (t) => t.role === scope.role && t.category === "CREATOR_REGISTRATION",
      ),
    );
    assert.ok(
      !row.tasks.some(
        (t) => t.role === scope.role && t.category === "CREATOR_IDENTITY",
      ),
    );
  }
  assert.equal(record(86).lyricist, "カンザキイオリ");
  assert.ok(!input.master.creators.some((c) => c.name === "カンザキイオリ"));
  const candidate = ledger.candidates.find(
    (c) => c.standardNameCandidate === "カンザキイオリ",
  );
  assert.equal(
    candidate.recordedHumanReview.suppliedFields.slug,
    "iori-kanzaki",
  );
  assert.deepEqual(
    candidate.registrationFieldDecisions.map((d) => d.field),
    plan.registration.missingFields,
  );
});

test("field patch preserves all unrelated values, pre-existing roles, Works, metadata, IDs and intentional administrator edits", () => {
  const live = phaseFiles;
  verifyPreservation(before.files, live, answers);
  assert.equal(record(85).durationSeconds, 102);
  assert.equal(input.master.nextId, 125);
  assert.equal(input.works.works.length, 823);
  assert.equal(
    plan.output["data/ournotes/songs.json"],
    live["data/ournotes/songs.json"],
  );
  const bad = structuredClone(answers);
  bad.records[0].title = "wrong recording";
  assert.throws(
    () => planReview(before.files, bad, input.identities),
    /CONFLICT answer title/,
  );
  const edited = structuredClone(live);
  const db = JSON.parse(edited["data/ournotes/songs.json"]);
  db.groups[0].songs[0].durationSeconds += 1;
  edited["data/ournotes/songs.json"] = JSON.stringify(db);
  assert.throws(
    () => verifyPreservation(before.files, edited, answers),
    /Unrelated song field/,
  );
});

test("completeness checks reject deleting new identity or a version task whose formal game raw is already resolved", () => {
  const missingVersion = structuredClone(ledger);
  const row = missingVersion.songs.find(
    (s) => s.game === "ournotes" && s.recordId === 1,
  );
  row.tasks = row.tasks.filter(
    (t) => t.role !== "arranger" || t.category !== "GAME_VERSION_REVIEW",
  );
  assert.throws(
    () => verifyLedger(input, missingVersion),
    /Missing reviewed game version/,
  );
  const missingActor = structuredClone(ledger);
  missingActor.candidates = missingActor.candidates.filter(
    (c) => c.standardNameCandidate !== "Skye K",
  );
  assert.throws(
    () => verifyLedger(input, missingActor),
    /B1 identity group omitted|Unresolved current actor omitted/,
  );
});

test("applying the same reviewed fields to applied output performs zero structural writes", () => {
  const again = planReview(plan.output, answers, input.identities);
  assert.equal(again.edits, 0);
  assert.equal(
    again.output["data/ournotes/songs.json"],
    plan.output["data/ournotes/songs.json"],
  );
});

test("interrupted generation accepts only exact expected bytes and still protects every other edit", (t) => {
  const root = path.resolve(".cache");
  const directory = fs.mkdtempSync(path.join(root, "p0-interrupted-"));
  t.after(() => {
    assert.ok(directory.startsWith(root + path.sep));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const oldText = "old generated artifact\n",
    expected = "new generated artifact\n";
  fs.writeFileSync(
    path.join(directory, "HUMAN_TODO_VERIFICATION.json"),
    JSON.stringify({
      generatedArtifacts: { "README.md": { sha256: sha(oldText) } },
    }),
  );
  fs.writeFileSync(path.join(directory, "README.md"), expected);
  assert.throws(() => assertAnswersUntouched(directory), /Artifact edited/);
  assertAnswersUntouched(directory, { "README.md": expected });
  fs.appendFileSync(path.join(directory, "README.md"), "human note");
  assert.throws(
    () => assertAnswersUntouched(directory, { "README.md": expected }),
    /Artifact edited/,
  );
});

test("all old P0 task IDs and resolutions retain provenance and valid pending task links", () => {
  const correspondence = JSON.parse(
    fs.readFileSync(REVIEW_DIR + "/P0_TASK_CORRESPONDENCE.json"),
  );
  const old = JSON.parse(
    before.artifacts["HUMAN_TODO_BY_SONG.json"],
  ).records.flatMap((s) => s.tasks);
  const creatorOld = JSON.parse(
    before.artifacts["HUMAN_TODO_BY_CREATOR.json"],
  ).candidates.flatMap((c) => c.tasks);
  const oldP0 = [...old, ...creatorOld]
    .filter((t) => t.priority === "P0")
    .map((t) => t.taskId)
    .sort();
  assert.deepEqual(
    correspondence.entries
      .filter((e) => e.oldPriority === "P0")
      .map((e) => e.oldTaskId)
      .sort(),
    oldP0,
  );
  assert.equal(correspondence.unmappedOldTasks, 0);
  const current = new Set(
    [
      ...ledger.songs.flatMap((s) => s.tasks),
      ...ledger.candidates.flatMap((c) => c.tasks),
    ].map((t) => t.taskId),
  );
  for (const item of correspondence.entries)
    for (const id of item.newTaskIds) assert.ok(current.has(id), id);
  assert.equal(
    correspondence.entries.filter((e) => e.status === "RESOLVED_HUMAN_GAME_RAW")
      .length,
    82,
  );
  assert.equal(
    correspondence.entries.filter(
      (e) => e.status === "RESOLVED_HUMAN_SCOPED_IDENTITY",
    ).length,
    5,
  );
});
