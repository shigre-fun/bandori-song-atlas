import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadBefore } from "../../scripts/migrations/creator-credit-p0-review.mjs";
import {
  OUTPUT,
  DATA_FILES,
  loadInputs,
  currentRecords,
  buildLedger,
  verifyLedger,
  renderSongs,
  renderCreators,
  assertAnswersUntouched,
  run,
} from "../../scripts/research/creator-credit-human-todo.mjs";
import { creditText } from "../../src/js/credit-display.js";

const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const hashes = (files) =>
  Object.fromEntries(files.map((file) => [file, sha(fs.readFileSync(file))]));
const input = loadInputs();
// Keep all original assertions against their byte-verified pre-review input.
// The current database and applied answers have independent live tests.
const historical = loadBefore().before.files;
input.master = JSON.parse(historical["data/creators.json"]);
input.works = JSON.parse(historical["data/works.json"]);
input.games = Object.fromEntries(
  ["garupa", "ournotes"].map((game) => [
    game,
    JSON.parse(historical[`data/${game}/songs.json`]),
  ]),
);
input.humanReview = null;
input.humanRegistration = null;
for (const file of DATA_FILES) input.inputHashes[file] = sha(historical[file]);
const ledger = buildLedger(input);
const initialDataHashes = hashes(DATA_FILES);
const recordKey = (r) => `${r.game}:${r.recordId}`;
const byName = (name) => {
  const found = ledger.candidates.filter(
    (c) => c.standardNameCandidate === name,
  );
  assert.equal(found.length, 1, name);
  return found[0];
};
const song = (game, id) => {
  const found = ledger.songs.find((r) => r.game === game && r.recordId === id);
  assert.ok(found, `${game}:${id}`);
  return found;
};
after(() =>
  assert.deepEqual(
    hashes(DATA_FILES),
    initialDataHashes,
    "Read-only tests must preserve all current data",
  ),
);

test("every current missing credit has a complete task; historical resolved entries stay excluded", () => {
  const proof = verifyLedger(input, ledger);
  assert.equal(proof.metrics.unmappedCurrentUnresolved, 0);
  assert.equal(proof.identitySourceAudit.length, input.identities.length);
  assert.ok(
    proof.sourceAudit.some(
      (entry) => entry.status === "EXCLUDED_CURRENT_RESOLVED",
    ),
  );
  for (const record of currentRecords(input)) {
    for (const role of ["lyricist", "composer", "arranger"]) {
      if (creditText(record.song, role, input.master.creators)) continue;
      assert.ok(
        song(record.game, record.recordId).tasks.some(
          (t) => t.role === role && t.category === "CREDIT_COLLECTION",
        ),
      );
    }
  }
  for (const candidate of ledger.candidates.filter(
    (c) => c.confirmedExistingCreatorId,
  )) {
    assert.ok(
      !candidate.tasks.some((t) => t.category === "CREATOR_REGISTRATION"),
    );
    assert.ok(
      !ledger.songs
        .flatMap((s) => s.tasks)
        .some(
          (t) =>
            t.creatorCandidateKey === candidate.candidateKey &&
            t.category === "CREATOR_REGISTRATION",
        ),
    );
  }
});

test("manual OurNotes chapter lists every live empty arranger once, including newest record and exact input fields", () => {
  const expected = currentRecords(input).filter(
    (r) =>
      r.game === "ournotes" &&
      !creditText(r.song, "arranger", input.master.creators),
  );
  const manual = ledger.songs.filter((s) => s.ournotesArrangerManual);
  assert.deepEqual(
    manual.map(recordKey).sort(),
    expected.map(recordKey).sort(),
  );
  const chapter = renderSongs(ledger).split(
    "## OurNotes 編曲ゲーム内確認リスト\n",
  )[1];
  assert.equal((chapter.match(/^- \[ \]/gm) ?? []).length, expected.length);
  for (const r of expected) {
    assert.ok(chapter.includes(`OurNotes:${r.recordId} ${r.title}`));
    assert.ok(chapter.includes(r.band) && chapter.includes(r.workId));
    assert.ok(
      song(r.game, r.recordId).ournotesArrangerManual.humanAnswerFields
        .arrangerGameDisplay === null,
    );
  }
  const latest = song("ournotes", 86);
  assert.equal(latest.title, "過去を喰らう");
  assert.ok(
    latest.tasks.some(
      (t) => t.role === "lyricist" && t.category === "CREDIT_COLLECTION",
    ),
  );
  assert.ok(
    latest.tasks.some(
      (t) => t.role === "arranger" && t.category === "CREDIT_COLLECTION",
    ),
  );
  assert.ok(
    latest.tasks.some(
      (t) =>
        t.role === "composer" &&
        t.category === "CREATOR_REGISTRATION" &&
        t.creatorCandidateKey === byName("カンザキイオリ").candidateKey,
    ),
  );
});

test("single-record subjects and short names are fully scoped; known 植木, unknown 冬真 and their boundary remain separate", () => {
  for (const name of [
    "164",
    "96",
    "AIMI",
    "AKASAKI",
    "BETTI",
    "Chinozo",
    "DAIGO",
    "doriko",
    "eba",
    "EREN",
    "Funta3",
    "Gohgo",
    "Nor",
    "miwa",
    "ZAQ",
    "じん",
    "ナノ",
  ]) {
    const candidate = byName(name);
    assert.ok(candidate.affectedRecords.length);
    for (const affected of candidate.affectedRecords)
      assert.ok(
        affected.title &&
          affected.band &&
          affected.game &&
          affected.role &&
          affected.workId,
      );
  }
  const kano = byName("加納望");
  assert.equal(kano.affectedRecordCount, 10);
  const creatorMD = renderCreators(ledger);
  const section = creatorMD
    .split(`candidateKey: ${kano.candidateKey}`)[1]
    .split('<a id="candidate-')[0];
  for (const affected of kano.affectedRecords)
    assert.ok(section.includes(`${affected.recordId} ${affected.title}`));
  const winter = byName("冬真"),
    ueki = byName("植木建象");
  assert.equal(winter.affectedRecordCount, 3);
  assert.equal(ueki.confirmedExistingCreatorId, "cr-0098");
  const joint = song("ournotes", 40);
  assert.ok(
    joint.tasks.some(
      (t) =>
        t.role === "arranger" &&
        t.category === "CREATOR_IDENTITY" &&
        t.creatorCandidateKey === winter.candidateKey,
    ),
  );
  assert.ok(
    joint.tasks.some(
      (t) =>
        t.role === "arranger" &&
        t.category === "ROLE_REVIEW" &&
        t.creatorCandidateKey === ueki.candidateKey,
    ),
  );
  assert.ok(
    joint.tasks.some(
      (t) =>
        t.role === "arranger" &&
        t.category === "SPLIT_REVIEW" &&
        t.raw === "植木建象、冬真",
    ),
  );
  for (const candidate of ledger.candidates.filter(
    (c) => !c.confirmedExistingCreatorId,
  )) {
    assert.deepEqual(
      candidate.registrationFieldDecisions.map((d) => d.field),
      ["standardName", "reading/sortKey", "slug", "type", "aliases"],
    );
  }
});

test("conflicting release-only arranger variants preserve game collection and blocked split dependencies", () => {
  const r = song("ournotes", 66);
  assert.equal(r.currentCredits.arranger.raw, null);
  assert.equal(r.currentCredits.arranger.resolvedCreators.length, 0);
  assert.equal(r.ournotesArrangerManual.releaseVersionRaw.length, 2);
  const split = r.tasks.find(
    (t) => t.role === "arranger" && t.category === "SPLIT_REVIEW",
  );
  assert.equal(split.status, "BLOCKED");
  assert.equal(split.evidenceContext, "REFERENCE_ONLY_GAME_UNVERIFIED");
  assert.ok(split.dependencies.some((id) => id.includes("CREDIT_COLLECTION")));
  assert.ok(split.creatorCandidateKeys.includes(byName("Aira").candidateKey));
  assert.ok(r.tasks.every((t) => t.status !== "READY_FOR_CODEX_APPLY"));
});

test("completeness verifier rejects an omitted latest record", () => {
  const incomplete = structuredClone(ledger);
  incomplete.songs = incomplete.songs.filter(
    (r) => recordKey(r) !== "ournotes:86",
  );
  assert.throws(
    () => verifyLedger(input, incomplete),
    /Missing current unresolved ournotes:86/,
  );
});

test("completeness verifier rejects a removed subject even when all dangling links and its identity tasks are removed", () => {
  const incomplete = structuredClone(ledger),
    key = byName("冬真").candidateKey;
  incomplete.candidates = incomplete.candidates.filter(
    (c) => c.candidateKey !== key,
  );
  for (const r of incomplete.songs) {
    r.tasks = r.tasks.filter((t) => t.creatorCandidateKey !== key);
    for (const t of r.tasks)
      t.creatorCandidateKeys = t.creatorCandidateKeys.filter((k) => k !== key);
  }
  assert.throws(
    () => verifyLedger(input, incomplete),
    /B1 identity group omitted|Unresolved current actor omitted/,
  );
});

test("completeness verifier rejects a forgotten conditional split even when its parent collection remains", () => {
  const incomplete = structuredClone(ledger);
  const r = incomplete.songs.find((s) => recordKey(s) === "ournotes:66");
  const removed = r.tasks.find(
    (t) => t.role === "arranger" && t.category === "SPLIT_REVIEW",
  ).taskId;
  r.tasks = r.tasks.filter((t) => t.taskId !== removed);
  for (const c of incomplete.candidates)
    c.songTaskIds = c.songTaskIds.filter((id) => id !== removed);
  assert.throws(
    () => verifyLedger(input, incomplete),
    /Historical current split omitted/,
  );
});

test("a new current record absent from migrations receives collection and a new record-scoped identity candidate", () => {
  const extended = structuredClone(input);
  const template = currentRecords(extended).find(
    (r) => recordKey(r) === "ournotes:86",
  );
  const added = structuredClone(template.song);
  added.id =
    Math.max(
      ...currentRecords(extended)
        .filter((r) => r.game === "ournotes")
        .map((r) => r.recordId),
    ) + 1;
  added.title = "台帳の新規収録検証";
  added.composer = "台帳検証専用の新規作者";
  added.lyricist = null;
  added.arranger = null;
  added.creditDisplay = {
    lyricist: [],
    composer: [{ text: added.composer, unresolved: true }],
    arranger: [],
  };
  extended.games.ournotes.groups[0].songs.push(added);
  const expanded = buildLedger(extended);
  verifyLedger(extended, expanded);
  const row = expanded.songs.find(
    (r) => r.game === "ournotes" && r.recordId === added.id,
  );
  assert.ok(row.latestAfterPhaseA);
  assert.equal(row.priority, "P0");
  assert.ok(
    row.tasks.some(
      (t) => t.category === "CREATOR_IDENTITY" && t.role === "composer",
    ),
  );
  assert.ok(
    row.tasks.some(
      (t) => t.category === "CREATOR_REGISTRATION" && t.role === "composer",
    ),
  );
  assert.equal(
    row.tasks.filter((t) => t.category === "CREDIT_COLLECTION").length,
    2,
  );
});

test("answer protection refuses JSON answers, ready status, checked Markdown and edits with unchecked boxes", (t) => {
  fs.mkdirSync(".cache", { recursive: true });
  const directory = fs.mkdtempSync(
    path.resolve(".cache/human-todo-answer-test-"),
  );
  t.after(() => {
    assert.ok(directory.startsWith(path.resolve(".cache") + path.sep));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const jsonPath = path.join(directory, "HUMAN_TODO_BY_SONG.json");
  const mdPath = path.join(directory, "HUMAN_TODO_BY_SONG.md");
  const empty = {
    records: [
      {
        tasks: [
          {
            taskId: "fixture",
            status: "NEEDS_HUMAN",
            humanAnswerFields: { sourceNote: null },
          },
        ],
      },
    ],
  };
  fs.writeFileSync(jsonPath, JSON.stringify(empty));
  assertAnswersUntouched(directory);
  const answered = structuredClone(empty);
  answered.records[0].tasks[0].humanAnswerFields.sourceNote =
    "人間が記入した根拠";
  fs.writeFileSync(jsonPath, JSON.stringify(answered));
  assert.throws(
    () => assertAnswersUntouched(directory),
    /Human answers present/,
  );
  const ready = structuredClone(empty);
  ready.records[0].tasks[0].status = "READY_FOR_CODEX_APPLY";
  fs.writeFileSync(jsonPath, JSON.stringify(ready));
  assert.throws(
    () => assertAnswersUntouched(directory),
    /Human status changed/,
  );
  fs.writeFileSync(jsonPath, JSON.stringify(empty));
  fs.writeFileSync(mdPath, "- [x] 回答済み\n");
  assert.throws(
    () => assertAnswersUntouched(directory),
    /Human checkbox changed/,
  );
  fs.writeFileSync(mdPath, "- [ ] 未回答\n");
  fs.writeFileSync(
    path.join(directory, "HUMAN_TODO_VERIFICATION.json"),
    JSON.stringify({
      generatedArtifacts: {
        "HUMAN_TODO_BY_SONG.md": { sha256: sha(fs.readFileSync(mdPath)) },
      },
    }),
  );
  fs.appendFileSync(mdPath, "人間が入力した原文\n");
  assert.throws(
    () => assertAnswersUntouched(directory),
    /Artifact edited; preserve human answers/,
  );
});

test("repeated generation preserves every artifact byte and all source data", () => {
  const files = fs.readdirSync(OUTPUT).map((name) => path.join(OUTPUT, name));
  assert.equal(files.length, 7);
  const before = hashes(files);
  run("generate");
  assert.deepEqual(hashes(files), before);
  assert.deepEqual(hashes(DATA_FILES), initialDataHashes);
  run("verify");
});
