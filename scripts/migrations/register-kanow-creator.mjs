import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { locateJSON, patchCreditFields } from "./credit-field-patch.mjs";
import { creditText, CREDIT_ROLES } from "../../src/js/credit-display.js";
import { validateCreatorDatabase } from "../../src/js/creators-data.js";

export const REVIEW_DIR = "docs/human-review/creator-kanow-p1-2026-10-07";
export const CANDIDATE_KEY = "b1-e8ea1c155638e47d4330";
export const IDS = [19, 20, 21, 22, 25, 26, 29, 31, 37, 40];
const sha = (x) => createHash("sha256").update(x).digest("hex");
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const save = (p, x) => fs.writeFileSync(p, JSON.stringify(x, null, 2) + "\n");
const songs = (text) => JSON.parse(text).groups.flatMap((g) => g.songs);

export function loadBefore() {
  const baseline = read(REVIEW_DIR + "/baseline.json");
  const bytes = fs.readFileSync(REVIEW_DIR + "/before.json.gz");
  assert.equal(sha(bytes), baseline.fixtureHash, "Immutable before fixture");
  const before = JSON.parse(gunzipSync(bytes));
  for (const [p, t] of Object.entries(before.files))
    assert.equal(sha(t), baseline.sourceHashes[p], p);
  for (const [p, t] of Object.entries(before.artifacts))
    assert.equal(sha(t), baseline.artifactHashes[p], p);
  for (const [name, hash] of [
    ["input.txt", baseline.inputHash],
    ["clarification.json", baseline.clarificationHash],
  ])
    assert.equal(sha(fs.readFileSync(REVIEW_DIR + "/" + name)), hash, name);
  return { baseline, before };
}

export function parseAnswers(text, clarification, before) {
  const field = (key) =>
    text.match(new RegExp("^" + key + '="([^"”]*)["”]', "m"))?.[1] || null;
  const fields = Object.fromEntries(
    [
      "humanReviewDate",
      "reviewer",
      "candidateKey",
      "identityConfirmed",
      "samePersonAs",
      "standardName",
      "reading",
      "sortKey",
      "slug",
      "type",
    ].map((k) => [k, field(k)]),
  );
  assert.equal(fields.candidateKey, CANDIDATE_KEY);
  assert.equal(fields.identityConfirmed, "はい");
  for (const [k, v] of Object.entries(fields))
    assert.ok(v, "Missing answer " + k);
  fields.aliases = JSON.parse(
    text.match(/^aliases=(\[[^\r\n]*\])/m)?.[1] ?? "null",
  );
  assert.ok(Array.isArray(fields.aliases), "Missing aliases answer");
  fields.affiliation = field("affiliation");
  if (fields.affiliation === null && clarification?.field === "affiliation") {
    assert.equal(clarification.answer, "所属は「なし」で確定");
    assert.equal(clarification.value, "なし");
    fields.affiliation = clarification.value;
  }
  assert.ok(
    fields.affiliation,
    "Missing affiliation answer; blank stays unanswered",
  );
  fields.notes = field("備考");
  const oldCreators = JSON.parse(
    before.artifacts["HUMAN_TODO_BY_CREATOR.json"],
  );
  assert.deepEqual(
    oldCreators.candidates
      .filter((c) => c.priority === "P1")
      .map((c) => c.candidateKey),
    [CANDIDATE_KEY],
    "Latest P1 changed",
  );
  const candidate = oldCreators.candidates.find(
    (c) => c.candidateKey === CANDIDATE_KEY,
  );
  assert.equal(candidate.standardNameCandidate, "加納望");
  assert.deepEqual(
    candidate.affectedRecords.map((r) => r.recordId).sort((a, b) => a - b),
    IDS,
  );
  const sections = [
    ...text.matchAll(
      /^## Garupa:(\d+) ([^\r\n]+)\r?\n([\s\S]*?)(?=^## Garupa:|^# ===)/gm,
    ),
  ];
  const scopes = sections.map((m) => {
    const recordId = Number(m[1]);
    const r = candidate.affectedRecords.find((r) => r.recordId === recordId);
    assert.ok(r, "Unapproved record");
    assert.equal(m[2], r.title, "Scope title");
    const raw = m[3].match(/現在の編曲原文：\r?\n([^\r\n]+)/)?.[1];
    const bandWork = m[3].match(/^([^\r\n]+) \/ (wk-\d+)$/m);
    assert.equal(bandWork?.[1], r.band, "Scope band");
    assert.equal(bandWork?.[2], r.workId, "Scope Work");
    const identity =
      m[3].match(/加納望は上記Creatorと同一="([^"\r\n]*)"/)?.[1] || null;
    const split =
      m[3].match(/共同編曲としてsplitしてよい="([^"\r\n]*)"/)?.[1] || null;
    for (const answer of [identity, split])
      assert.ok(answer === null || ["はい", "いいえ", "保留"].includes(answer));
    return {
      game: "garupa",
      recordId,
      title: r.title,
      band: r.band,
      workId: r.workId,
      role: "arranger",
      raw,
      identity,
      split,
    };
  });
  assert.deepEqual(
    scopes.map((s) => s.recordId),
    IDS,
    "Exactly ten distinct approved records",
  );
  const decisions = Object.fromEntries(
    [...text.matchAll(/^([^\r\n]+)="(はい|いいえ|保留)"/gm)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  return {
    fields,
    scopes,
    decisions,
    unprovidedFields: fields.notes === null ? ["備考"] : [],
    scopePolicy:
      "ONLY_EXPLICIT_RECORD_IDENTITY_AND_SPLIT; NO_GLOBAL_PROPAGATION",
  };
}

export function planRegistration(files, answers) {
  assert.deepEqual(
    answers.scopes.map((s) => s.recordId),
    IDS,
    "Approved scope only",
  );
  assert.equal(answers.fields.identityConfirmed, "はい");
  assert.ok(answers.fields.affiliation, "Missing affiliation");
  const master = JSON.parse(files["data/creators.json"]);
  const f = answers.fields;
  const output = { ...files };
  const same =
    f.samePersonAs !== "既存IDなし"
      ? master.creators.find((c) => c.id === f.samePersonAs)
      : null;
  if (f.samePersonAs !== "既存IDなし")
    assert.ok(same, "Existing Creator ID required");
  const registered = master.creators.find((c) => c.name === f.standardName);
  const id =
    same?.id ??
    registered?.id ??
    "cr-" + String(master.nextId).padStart(4, "0");
  const creator = same ?? {
    id,
    name: f.standardName,
    slug: f.slug,
    type: f.type,
    reading: f.reading,
    sortKey: f.sortKey,
    sortKeyStatus: "confirmed",
    aliases: f.aliases,
  };
  if (registered && !same)
    assert.deepEqual(registered, creator, "CONFLICT existing metadata");
  const exists = master.creators.some((c) => c.id === id);
  if (exists)
    assert.deepEqual(
      master.creators.find((c) => c.id === id),
      creator,
      "CONFLICT occupied Creator ID",
    );
  let creatorEdits = 0;
  if (!exists) {
    assert.ok(
      !master.creators.some(
        (c) =>
          c.id === id ||
          [c.slug, ...(c.previousSlugs ?? [])].includes(f.slug) ||
          c.name === f.standardName ||
          (c.aliases ?? []).includes(f.standardName),
      ),
      "CONFLICT ID/slug/identity",
    );
    const text = files["data/creators.json"],
      root = locateJSON(text),
      next = root.properties.get("nextId"),
      last = root.properties.get("creators").children.at(-1);
    const newline = text.includes("\r\n") ? "\r\n" : "\n";
    const edits = [
      { start: next.start, end: next.end, value: String(master.nextId + 1) },
      {
        start: last.end,
        end: last.end,
        value:
          "," +
          newline +
          "    " +
          JSON.stringify(creator, null, 2).replaceAll("\n", newline + "    "),
      },
    ];
    let patched = text;
    for (const e of edits.sort((a, b) => b.start - a.start))
      patched = patched.slice(0, e.start) + e.value + patched.slice(e.end);
    output["data/creators.json"] = patched;
    creatorEdits = 2;
  }
  const nowMaster = JSON.parse(output["data/creators.json"]),
    patches = new Map(),
    applied = [];
  for (const scope of answers.scopes) {
    const old = songs(files["data/garupa/songs.json"]).find(
      (s) => s.id === scope.recordId,
    );
    assert.equal(old.title, scope.title, "CONFLICT scoped title");
    assert.equal(old.workId, scope.workId, "CONFLICT scoped Work");
    assert.equal(
      creditText(old, "arranger", master.creators),
      scope.raw,
      "CONFLICT scoped raw",
    );
    if (scope.identity !== "はい" || scope.split !== "はい") continue;
    const match = scope.raw.match(
      /^(都丸椋太|母里治樹)（Elements Garden）([／/])加納望$/,
    );
    assert.ok(match, "Unreviewed boundary");
    const partner = master.creators.find((c) => c.name === match[1]);
    assert.ok(partner, "Missing existing co-arranger");
    const song = structuredClone(old);
    for (const [c, raw] of [
      [partner, match[1] + "（Elements Garden）"],
      [creator, "加納望"],
    ]) {
      let relation = song.credits.find((r) => r.creatorId === c.id);
      if (!relation) {
        relation = { creatorId: c.id, roles: [] };
        song.credits.push(relation);
      }
      if (!relation.roles.includes("arranger")) relation.roles.push("arranger");
      relation.displayOverrides ??= {};
      relation.displayOverrides.arranger = raw;
    }
    song.creditDisplay.arranger = [
      { creatorId: partner.id },
      { text: match[2] },
      { creatorId: id },
    ];
    assert.equal(creditText(song, "arranger", nowMaster.creators), scope.raw);
    patches.set(song.id, {
      title: song.title,
      workId: song.workId,
      fields: { credits: song.credits, creditDisplay: song.creditDisplay },
    });
    applied.push({
      ...scope,
      creatorId: id,
      partnerId: partner.id,
      partnerName: partner.name,
    });
  }
  const result = patchCreditFields(files["data/garupa/songs.json"], patches);
  output["data/garupa/songs.json"] = result.text;
  verifyPreservation(files, output, creator, applied);
  return {
    output,
    creator,
    scopes: applied,
    unresolvedScopes: answers.scopes.filter(
      (s) => s.identity !== "はい" || s.split !== "はい",
    ),
    creatorEdits,
    songEdits: result.edits,
  };
}

export function verifyPreservation(before, after, creator, scopes) {
  for (const p of Object.keys(before))
    if (!["data/creators.json", "data/garupa/songs.json"].includes(p))
      assert.equal(after[p], before[p], "Unrelated file " + p);
  const oldM = JSON.parse(before["data/creators.json"]),
    nowM = JSON.parse(after["data/creators.json"]);
  const added = !oldM.creators.some((c) => c.id === creator.id);
  assert.equal(nowM.creators.length, oldM.creators.length + Number(added));
  assert.equal(nowM.nextId, oldM.nextId + Number(added));
  assert.deepEqual(
    nowM.creators.filter((c) => c.id !== creator.id),
    oldM.creators.filter((c) => c.id !== creator.id),
  );
  assert.deepEqual(
    { ...oldM, creators: null, nextId: null },
    { ...nowM, creators: null, nextId: null },
  );
  const b = JSON.parse(before["data/garupa/songs.json"]),
    a = JSON.parse(after["data/garupa/songs.json"]);
  const oldSongs = new Map(
    b.groups.flatMap((g) => g.songs).map((s) => [s.id, s]),
  );
  const reset = structuredClone(a);
  for (const g of reset.groups)
    for (const s of g.songs) {
      const old = oldSongs.get(s.id);
      const scope = scopes.find((x) => x.recordId === s.id);
      if (!scope) {
        assert.deepEqual(s, old, "Unscoped record " + s.id);
        continue;
      }
      assert.deepEqual(
        { ...s, credits: null, creditDisplay: null },
        { ...old, credits: null, creditDisplay: null },
        "Unrelated non-credit/raw fields",
      );
      for (const role of CREDIT_ROLES) {
        assert.equal(
          creditText(s, role, nowM.creators),
          creditText(old, role, oldM.creators),
          "Exact display " + s.id + ":" + role,
        );
        if (role !== "arranger")
          assert.deepEqual(s.creditDisplay[role], old.creditDisplay[role]);
      }
      assert.deepEqual(
        s.credits.filter(
          (c) => ![creator.id, scope.partnerId].includes(c.creatorId),
        ),
        old.credits.filter(
          (c) => ![creator.id, scope.partnerId].includes(c.creatorId),
        ),
        "Unrelated relations",
      );
      for (const [id, text] of [
        [scope.partnerId, scope.partnerName + "（Elements Garden）"],
        [creator.id, "加納望"],
      ]) {
        const prior = old.credits.find((c) => c.creatorId === id);
        const expected = structuredClone(prior ?? { creatorId: id, roles: [] });
        expected.roles = [...new Set([...expected.roles, "arranger"])];
        expected.displayOverrides = {
          ...(expected.displayOverrides ?? {}),
          arranger: text,
        };
        assert.deepEqual(
          s.credits.find((c) => c.creatorId === id),
          expected,
          "Only approved arranger relation amendment",
        );
      }
      assert.deepEqual(
        s.creditDisplay.arranger.map((p) => p.creatorId).filter(Boolean),
        [scope.partnerId, creator.id],
      );
      assert.ok(
        !s.credits.some(
          (c) => c.creatorId === "cr-0002" && c.roles.includes("arranger"),
        ),
        "Elements Garden double count",
      );
      s.credits = old.credits;
      s.creditDisplay = old.creditDisplay;
    }
  assert.deepEqual(reset, b, "Dataset metadata/order");
  const all = [
    ...songs(after["data/garupa/songs.json"]).map((s) => ({
      ...s,
      gameId: "garupa",
    })),
    ...songs(after["data/ournotes/songs.json"]).map((s) => ({
      ...s,
      gameId: "ournotes",
    })),
  ];
  assert.deepEqual(
    validateCreatorDatabase(nowM, JSON.parse(after["data/works.json"]), all)
      .warnings,
    [],
  );
  const bindings = all
    .flatMap((s) =>
      (s.credits ?? [])
        .filter((c) => c.creatorId === creator.id)
        .flatMap((c) => c.roles.map((r) => s.gameId + ":" + s.id + ":" + r)),
    )
    .sort();
  assert.deepEqual(
    bindings,
    [
      ...new Set([
        ...["garupa", "ournotes"].flatMap((game) =>
          songs(before[`data/${game}/songs.json`]).flatMap((s) =>
            (s.credits ?? [])
              .filter((c) => c.creatorId === creator.id)
              .flatMap((c) => c.roles.map((role) => `${game}:${s.id}:${role}`)),
          ),
        ),
        ...scopes.map((s) => s.game + ":" + s.recordId + ":" + s.role),
      ]),
    ].sort(),
    "No unapproved roles or records",
  );
}

export function runRegistration(mode = "verify") {
  assert.ok(["plan", "apply", "verify"].includes(mode));
  const { baseline, before } = loadBefore();
  const answers = parseAnswers(
    fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8"),
    read(REVIEW_DIR + "/clarification.json"),
    before,
  );
  const plan = planRegistration(before.files, answers);
  for (const [p, h] of Object.entries(baseline.protectedEvidenceHashes))
    assert.equal(sha(fs.readFileSync(p)), h, "Protected evidence " + p);
  const current = Object.fromEntries(
    Object.keys(before.files).map((p) => [p, fs.readFileSync(p, "utf8")]),
  );
  const matches = (expected) =>
    Object.entries(current).every(([p, t]) => t === expected[p]);
  if (matches(before.files) && !matches(plan.output)) {
    assert.equal(
      execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
      baseline.head,
      "HEAD changed before initial apply",
    );
    for (const [name, text] of Object.entries(before.artifacts))
      assert.equal(
        fs.readFileSync(
          "docs/todo/creator-credit-human-review/" + name,
          "utf8",
        ),
        text,
        "Latest ledger changed; preserve human answers",
      );
  } else
    execFileSync("git", ["merge-base", "--is-ancestor", baseline.head, "HEAD"]);
  assert.ok(
    matches(before.files) || matches(plan.output),
    "CONFLICT current source; preserve user edits",
  );
  if (mode === "apply") {
    for (const [p, t] of Object.entries(plan.output))
      if (current[p] !== t) fs.writeFileSync(p, t);
    save(REVIEW_DIR + "/review.json", {
      schemaVersion: 1,
      status: "APPLIED",
      reviewer: answers.fields.reviewer,
      humanReviewDate: answers.fields.humanReviewDate,
      sourceHead: baseline.head,
      inputSha256: baseline.inputHash,
      clarificationSha256: baseline.clarificationHash,
      creator: plan.creator,
      affiliation: answers.fields.affiliation,
      answers,
      scopes: plan.scopes,
      unresolvedScopes: plan.unresolvedScopes,
      commitPushDeployPerformed: false,
    });
  }
  if (mode === "verify") assert.ok(matches(plan.output), "Not applied yet");
  console.log(
    JSON.stringify(
      {
        mode,
        creator: plan.creator,
        relationRecords: plan.scopes.length,
        splitResolved: plan.scopes.length,
        changedFiles: Object.keys(current).filter(
          (p) => current[p] !== plan.output[p],
        ),
        unprovidedOptionalFields: answers.unprovidedFields,
      },
      null,
      2,
    ),
  );
  return plan;
}

export function taskCorrespondence(before, ledger) {
  const oldSongs = JSON.parse(
    before.artifacts["HUMAN_TODO_BY_SONG.json"],
  ).records;
  const oldCreators = JSON.parse(
    before.artifacts["HUMAN_TODO_BY_CREATOR.json"],
  ).candidates;
  const currentTasks = [
    ...ledger.songs.flatMap((s) => s.tasks),
    ...ledger.candidates.flatMap((c) => c.tasks),
  ];
  const byId = new Map(currentTasks.map((t) => [t.taskId, t]));
  const entries = [];
  for (const row of [...oldSongs, ...oldCreators])
    for (const task of row.tasks) {
      const now = byId.get(task.taskId);
      if (now) {
        assert.deepEqual(
          now.humanAnswerFields,
          task.humanAnswerFields,
          "Preserve pending answers",
        );
        assert.equal(now.category, task.category);
        entries.push({
          oldTaskId: task.taskId,
          status: "CONTINUING",
          newTaskIds: [task.taskId],
        });
        continue;
      }
      const scopedSong =
        row.game === "garupa" &&
        IDS.includes(row.recordId) &&
        task.role === "arranger" &&
        [
          "CREATOR_IDENTITY",
          "CREATOR_REGISTRATION",
          "SPLIT_REVIEW",
          "ROLE_REVIEW",
        ].includes(task.category);
      const scopedCreator =
        (row.candidateKey === CANDIDATE_KEY ||
          ["cr-0119", "cr-0019"].includes(row.confirmedExistingCreatorId)) &&
        row.affectedRecords.every(
          (r) =>
            r.game === "garupa" &&
            IDS.includes(r.recordId) &&
            r.role === "arranger",
        );
      assert.ok(
        scopedSong || scopedCreator,
        "Unrelated old task removed: " + task.taskId,
      );
      entries.push({
        oldTaskId: task.taskId,
        status: "RESOLVED_BY_P1_HUMAN_REVIEW",
        newTaskIds: [],
        evidence: REVIEW_DIR + "/review.json",
      });
    }
  const map = new Map(entries.map((e) => [e.oldTaskId, e]));
  const prior = read(
    "docs/human-review/creator-kanzaki-2026-10-06/TASK_CORRESPONDENCE.json",
  );
  const original = prior.originalLedgerEntries.map((e) => ({
    ...e,
    currentTaskIds: e.newTaskIds.flatMap((id) => {
      const mapped = map.get(id);
      assert.ok(mapped, "Earlier ledger task omitted: " + id);
      return mapped.newTaskIds;
    }),
  }));
  return {
    schemaVersion: 1,
    oldTaskCount: entries.length,
    continuing: entries.filter((e) => e.status === "CONTINUING").length,
    resolved: entries.filter((e) => e.status !== "CONTINUING").length,
    unmappedOldTasks: 0,
    originalLedgerTaskCount: original.length,
    entries,
    originalLedgerEntries: original,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  runRegistration(process.argv[2] ?? "verify");
