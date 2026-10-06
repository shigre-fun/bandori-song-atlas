import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { creditText, CREDIT_ROLES } from "../../src/js/credit-display.js";
import { validateCreatorDatabase } from "../../src/js/creators-data.js";
import { locateJSON, patchCreditFields } from "./credit-field-patch.mjs";

export const REGISTRATION_DIR = "docs/human-review/creator-kanzaki-2026-10-06";
const sha = (v) => createHash("sha256").update(v).digest("hex");
const json = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const save = (p, value) =>
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + "\n");
export function protectedEvidencePath(p, baseline) {
  if (fs.existsSync(p)) return p;
  const durable = p.replace(/\.log$/, ".txt");
  assert.ok(
    durable !== p &&
      baseline.priorReviewHashes[durable] === baseline.priorReviewHashes[p],
    "Missing protected evidence: " + p,
  );
  return durable;
}
export function loadRegistrationBefore() {
  const baseline = json(REGISTRATION_DIR + "/baseline.json");
  const bytes = fs.readFileSync(REGISTRATION_DIR + "/before.json.gz");
  assert.equal(
    sha(bytes),
    baseline.fixtureHash,
    "Immutable registration before",
  );
  const before = JSON.parse(gunzipSync(bytes));
  for (const [p, text] of Object.entries(before.files))
    assert.equal(sha(text), baseline.sourceHashes[p], p);
  for (const [p, text] of Object.entries(before.artifacts))
    assert.equal(sha(text), baseline.artifactHashes[p], p);
  assert.equal(
    sha(fs.readFileSync(REGISTRATION_DIR + "/input.txt")),
    baseline.inputHash,
    "Human followup input",
  );
  return { baseline, before };
}

export function registrationAnswers(text, priorReview) {
  for (const [field, note] of [
    ["affiliation", "なし"],
    ["根拠URL・資料", "なしでよいです"],
    ["備考", "なし"],
  ])
    assert.ok(
      text.includes(field + '="" （' + note + "）"),
      "Explicit none or omission required: " + field,
    );
  assert.ok(
    text.includes(
      'OurNotes:86 過去を喰らう／作詞「カンザキイオリ」は上記Creatorと同一="はい"',
    ),
    "Missing lyricist identity answer",
  );
  const fields = structuredClone(priorReview.registration.suppliedFields);
  const decisions = {
    affiliation: { value: "", status: "EXPLICIT_NONE" },
    "根拠URL・資料": { value: "", status: "USER_APPROVED_OMISSION" },
    備考: { value: "", status: "EXPLICIT_NONE" },
  };
  for (const field of Object.keys(decisions))
    fields[field] = decisions[field].value;
  for (const field of [
    "identityConfirmed",
    "samePersonAs",
    "standardName",
    "reading",
    "sortKey",
    "slug",
    "type",
    "aliases",
    "affiliation",
    "根拠URL・資料",
    "備考",
  ])
    assert.ok(
      fields[field] !== null && fields[field] !== undefined,
      "Missing " + field,
    );
  assert.equal(fields.identityConfirmed, "はい");
  assert.equal(fields.samePersonAs, "既存IDなし");
  const scopes = [
    ...priorReview.answers.scopeConfirmations,
    {
      game: "ournotes",
      recordId: 86,
      title: "過去を喰らう",
      role: "lyricist",
      raw: "カンザキイオリ",
      answer: "はい",
      sourceDocument: REGISTRATION_DIR + "/input.txt",
    },
  ];
  assert.equal(scopes.length, 6);
  assert.equal(
    new Set(scopes.map((s) => `${s.game}:${s.recordId}:${s.role}`)).size,
    6,
  );
  return { fields, explicitDecisions: decisions, scopes };
}

export function planRegistration(files, answers) {
  assert.deepEqual(
    answers.scopes.map((s) => `${s.game}:${s.recordId}:${s.role}`).sort(),
    [
      "garupa:467:composer",
      "garupa:467:lyricist",
      "garupa:758:composer",
      "garupa:758:lyricist",
      "ournotes:86:composer",
      "ournotes:86:lyricist",
    ].sort(),
    "Approved scope only",
  );
  const master = JSON.parse(files["data/creators.json"]);
  const id = "cr-0125";
  const creator = {
    id,
    name: answers.fields.standardName,
    slug: answers.fields.slug,
    type: answers.fields.type,
    reading: answers.fields.reading,
    sortKey: answers.fields.sortKey,
    sortKeyStatus: "confirmed",
    aliases: answers.fields.aliases,
  };
  const existing = master.creators.find((c) => c.id === id);
  if (existing)
    assert.deepEqual(existing, creator, "CONFLICT registered Creator metadata");
  else {
    assert.equal(master.nextId, 125, "CONFLICT Creator nextId");
    assert.equal(master.creators.length, 124);
    assert.ok(
      !master.creators.some(
        (c) =>
          c.name === creator.name ||
          (c.aliases ?? []).includes(creator.name) ||
          [c.slug, ...(c.previousSlugs ?? [])].includes(creator.slug),
      ),
      "CONFLICT identity or slug",
    );
  }
  const output = { ...files };
  let creatorEdits = 0;
  if (!existing) {
    const text = files["data/creators.json"],
      root = locateJSON(text),
      array = root.properties.get("creators"),
      next = root.properties.get("nextId");
    const last = array.children.at(-1);
    const edits = [
      { start: next.start, end: next.end, value: "126" },
      {
        start: last.end,
        end: last.end,
        value:
          ",\n    " +
          JSON.stringify(creator, null, 2).replaceAll("\n", "\n    "),
      },
    ];
    let patched = text;
    for (const e of edits.sort((a, b) => b.start - a.start))
      patched = patched.slice(0, e.start) + e.value + patched.slice(e.end);
    output["data/creators.json"] = patched;
    creatorEdits = edits.length;
  }
  const afterMaster = JSON.parse(output["data/creators.json"]);
  const patches = { garupa: new Map(), ournotes: new Map() };
  const scopes = [];
  for (const scope of answers.scopes) {
    assert.equal(scope.answer, "はい");
    assert.equal(scope.raw, creator.name);
    assert.ok(["lyricist", "composer"].includes(scope.role));
    const sourcePath = `data/${scope.game}/songs.json`;
    const db = JSON.parse(files[sourcePath]);
    const original = db.groups
      .flatMap((g) => g.songs)
      .find((s) => s.id === scope.recordId);
    assert.ok(original, "Missing scoped record");
    assert.equal(original.title, scope.title, "CONFLICT scope title");
    assert.equal(
      original.workId,
      scope.game === "garupa" && scope.recordId === 467 ? "wk-0458" : "wk-0739",
      "CONFLICT scoped Work",
    );
    assert.equal(
      creditText(original, scope.role, master.creators),
      scope.raw,
      "CONFLICT scope raw",
    );
    assert.equal(original[scope.role], scope.raw, "CONFLICT raw field");
    const state = patches[scope.game].get(original.id) ?? {
      title: original.title,
      workId: original.workId,
      song: structuredClone(original),
    };
    const song = state.song;
    song.credits ??= [];
    let relation = song.credits.find((c) => c.creatorId === id);
    if (!relation) {
      relation = { creatorId: id, roles: [] };
      song.credits.push(relation);
    }
    if (!relation.roles.includes(scope.role)) relation.roles.push(scope.role);
    relation.displayOverrides ??= {};
    relation.displayOverrides[scope.role] = scope.raw;
    song.creditDisplay[scope.role] = [{ creatorId: id }];
    assert.equal(creditText(song, scope.role, afterMaster.creators), scope.raw);
    patches[scope.game].set(original.id, state);
    scopes.push({
      ...scope,
      workId: original.workId,
      creatorId: id,
      sourceDocument:
        scope.sourceDocument ??
        "docs/human-review/creator-credits-p0-2026-10-06/review.json",
    });
  }
  let songEdits = 0;
  for (const game of ["garupa", "ournotes"]) {
    const patch = new Map(
      [...patches[game]].map(([recordId, s]) => [
        recordId,
        {
          title: s.title,
          workId: s.workId,
          fields: {
            credits: s.song.credits,
            creditDisplay: s.song.creditDisplay,
          },
        },
      ]),
    );
    const result = patchCreditFields(files[`data/${game}/songs.json`], patch);
    output[`data/${game}/songs.json`] = result.text;
    songEdits += result.edits;
  }
  verifyRegistrationPreservation(files, output, scopes);
  const songs = ["garupa", "ournotes"].flatMap((game) =>
    JSON.parse(output[`data/${game}/songs.json`]).groups.flatMap((g) =>
      g.songs.map((s) => ({ ...s, gameId: game })),
    ),
  );
  assert.deepEqual(
    validateCreatorDatabase(
      afterMaster,
      JSON.parse(output["data/works.json"]),
      songs,
    ).warnings,
    [],
  );
  return { output, creator, scopes, creatorEdits, songEdits };
}

export function verifyRegistrationPreservation(before, after, scopes) {
  for (const p of ["data/works.json", "data/ournotes/admin-state.json"])
    assert.equal(after[p], before[p], "Unrelated file " + p);
  const oldMaster = JSON.parse(before["data/creators.json"]),
    nowMaster = JSON.parse(after["data/creators.json"]);
  for (const c of oldMaster.creators)
    assert.deepEqual(
      nowMaster.creators.find((n) => n.id === c.id),
      c,
      "Existing Creator " + c.id,
    );
  assert.deepEqual(
    { ...oldMaster, creators: null, nextId: null },
    { ...nowMaster, creators: null, nextId: null },
    "Master unrelated metadata",
  );
  for (const game of ["garupa", "ournotes"]) {
    const old = JSON.parse(before[`data/${game}/songs.json`]),
      now = JSON.parse(after[`data/${game}/songs.json`]);
    assert.deepEqual(
      { ...old, groups: null },
      { ...now, groups: null },
      "Dataset metadata",
    );
    assert.equal(old.groups.length, now.groups.length);
    for (const [i, g] of old.groups.entries()) {
      const current = now.groups[i];
      assert.deepEqual(
        { ...g, songs: null },
        { ...current, songs: null },
        "Band order/metadata",
      );
      assert.equal(g.songs.length, current.songs.length);
      for (const [j, song] of g.songs.entries()) {
        const n = current.songs[j];
        const roles = new Set(
          scopes
            .filter((s) => s.game === game && s.recordId === song.id)
            .map((s) => s.role),
        );
        assert.deepEqual(
          { ...song, credits: null, creditDisplay: null },
          { ...n, credits: null, creditDisplay: null },
          "Raw/non-credit/order " + game + ":" + song.id,
        );
        assert.deepEqual(
          (n.credits ?? []).filter((c) => c.creatorId !== "cr-0125"),
          (song.credits ?? []).filter((c) => c.creatorId !== "cr-0125"),
          "Other relations",
        );
        for (const role of CREDIT_ROLES) {
          assert.equal(
            creditText(n, role, nowMaster.creators),
            creditText(song, role, oldMaster.creators),
            "Exact display " + game + ":" + song.id + ":" + role,
          );
          if (!roles.has(role))
            assert.deepEqual(
              n.creditDisplay?.[role],
              song.creditDisplay?.[role],
              "Other role display",
            );
        }
        if (!roles.size) assert.deepEqual(n, song, "Unscoped song");
      }
    }
  }
}

export function runRegistration(mode = "verify") {
  assert.ok(["plan", "apply", "verify"].includes(mode));
  const { baseline, before } = loadRegistrationBefore();
  const answers = registrationAnswers(
    fs.readFileSync(REGISTRATION_DIR + "/input.txt", "utf8"),
    before.priorReview,
  );
  const plan = planRegistration(before.files, answers);
  for (const [p, h] of Object.entries({
    ...baseline.protectedResearch,
    ...baseline.priorReviewHashes,
  }))
    assert.equal(
      sha(fs.readFileSync(protectedEvidencePath(p, baseline))),
      h,
      "Protected evidence " + p,
    );
  const current = Object.fromEntries(
    Object.keys(before.files).map((p) => [p, fs.readFileSync(p, "utf8")]),
  );
  const matchesBefore = Object.entries(current).every(
    ([p, t]) => t === before.files[p],
  );
  const matchesAfter = Object.entries(current).every(
    ([p, t]) => t === plan.output[p],
  );
  if (matchesBefore && !matchesAfter)
    assert.equal(
      execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
      baseline.head,
      "HEAD changed before initial apply",
    );
  else
    execFileSync("git", ["merge-base", "--is-ancestor", baseline.head, "HEAD"]);
  assert.ok(
    matchesBefore || matchesAfter,
    "CONFLICT current source SHA; preserve user edits",
  );
  if (mode === "apply") {
    if (!matchesAfter)
      for (const [p, t] of Object.entries(plan.output))
        if (t !== before.files[p]) fs.writeFileSync(p, t);
    save(REGISTRATION_DIR + "/review.json", {
      schemaVersion: 1,
      status: "APPLIED",
      reviewer: before.priorReview.reviewer,
      humanReviewDate: null,
      receivedAt: baseline.receivedAt,
      inputSha256: baseline.inputHash,
      sourceHead: baseline.head,
      creator: plan.creator,
      explicitDecisions: answers.explicitDecisions,
      scopes: plan.scopes,
      priorReviewDocument:
        "docs/human-review/creator-credits-p0-2026-10-06/review.json",
      evidenceUrlOmissionApprovedByUser: true,
      missingFields: [],
      commitPushDeployPerformed: false,
    });
    save(REGISTRATION_DIR + "/applied.json", {
      schemaVersion: 1,
      result: "PASS",
      sourceHashesBefore: baseline.sourceHashes,
      sourceHashesAfter: Object.fromEntries(
        Object.entries(plan.output).map(([p, t]) => [p, sha(t)]),
      ),
      creator: plan.creator,
      creatorCount: 125,
      nextId: 126,
      workCount: 823,
      recordCount: 885,
      scopedRelations: 6,
      recordCountPatched: 3,
      creatorEdits: plan.creatorEdits,
      songEdits: plan.songEdits,
      unrelatedFieldsChanged: 0,
      rawDisplaysChanged: 0,
      existingCreatorMetadataChanged: 0,
      commitPushDeployPerformed: false,
    });
  }
  if (mode === "verify") {
    assert.ok(matchesAfter, "Not applied");
    verifyRegistrationPreservation(before.files, current, plan.scopes);
    assert.deepEqual(
      json(REGISTRATION_DIR + "/review.json").creator,
      plan.creator,
    );
  }
  const result = {
    mode,
    alreadyApplied: matchesAfter,
    changedFiles: mode === "apply" && !matchesAfter ? 3 : 0,
    creatorId: plan.creator.id,
    slug: plan.creator.slug,
    creatorCount: 125,
    nextId: 126,
    relations: 6,
  };
  console.log(JSON.stringify(result, null, 2));
  return plan;
}

export function registrationTaskCorrespondence(before, ledger) {
  const oldSongs = JSON.parse(
    before.artifacts["HUMAN_TODO_BY_SONG.json"],
  ).records;
  const oldCreators = JSON.parse(
    before.artifacts["HUMAN_TODO_BY_CREATOR.json"],
  ).candidates;
  const key = oldCreators.find(
    (c) => c.standardNameCandidate === "カンザキイオリ",
  ).candidateKey;
  const currentIds = new Set(
    [
      ...ledger.songs.flatMap((s) => s.tasks),
      ...ledger.candidates.flatMap((c) => c.tasks),
    ].map((t) => t.taskId),
  );
  const previous = [
    ...oldSongs.flatMap((s) =>
      s.tasks.map((t) => ({
        ...t,
        game: s.game,
        recordId: s.recordId,
        title: s.title,
      })),
    ),
    ...oldCreators.flatMap((c) =>
      c.tasks.map((t) => ({ ...t, candidateKey: c.candidateKey })),
    ),
  ];
  const entries = previous.map((t) => {
    const pending = currentIds.has(t.taskId);
    if (!pending)
      assert.ok(
        t.candidateKey === key ||
          t.creatorCandidateKey === key ||
          t.creatorCandidateKeys?.includes(key) ||
          (t.taskId === "ournotes:86:lyricist:ROLE_REVIEW" &&
            t.raw === "カンザキイオリ"),
        "Unknown removed task: " + t.taskId,
      );
    return {
      oldTaskId: t.taskId,
      oldPriority: t.priority,
      oldCategory: t.category,
      game: t.game ?? null,
      recordId: t.recordId ?? null,
      title: t.title ?? null,
      creatorId: pending ? null : "cr-0125",
      status: pending
        ? "PENDING_SAME_TASK_ID"
        : "RESOLVED_HUMAN_CREATOR_REGISTRATION",
      newTaskIds: pending ? [t.taskId] : [],
      humanReviewDocument: pending ? null : REGISTRATION_DIR + "/review.json",
    };
  });
  assert.equal(new Set(entries.map((e) => e.oldTaskId)).size, entries.length);
  return {
    schemaVersion: 1,
    oldTaskCount: previous.length,
    currentTaskCount: currentIds.size,
    resolvedTaskCount: entries.filter((e) => !e.newTaskIds.length).length,
    unmappedOldTasks: 0,
    entries,
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  runRegistration(process.argv[2] ?? "verify");
