import fs from "node:fs";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";
import { quoted, sha } from "./creator-credit-remaining-review.mjs";
import { patchCreditFields } from "./credit-field-patch.mjs";
import { CREDIT_ROLES, creditText } from "../../src/js/credit-display.js";
import { validateCreatorDatabase } from "../../src/js/creators-data.js";
export const REVIEW_DIR = "docs/human-review/creator-final-six-2026-10-22";
export { sha };
export const loadBefore = () =>
  JSON.parse(gunzipSync(fs.readFileSync(REVIEW_DIR + "/before.json.gz")));
const read = (p) => JSON.parse(fs.readFileSync(p));
export function parseAnswers(text) {
  const result = { humanReviewDate: null, reviewer: null, roles: {} };
  let role = null;
  // Remove only the pasted document's line-wrap markup, never normalize credit names.
  for (const line of text
    .replaceAll("&amp;#x20;", " ")
    .replaceAll("&#x20;", " ")
    .replace(/\\\r?\n/g, "\n")
    .split(/\r?\n/)) {
    const section = line.match(/^■ (\d+)\./);
    if (section) {
      role =
        { 1: "lyricist", 2: "composer", 3: "arranger" }[section[1]] ?? null;
      if (role) result.roles[role] = {};
      continue;
    }
    if (!role) continue;
    const pair = line.trim().match(/^([^=]+)=(.*)$/);
    if (!pair) continue;
    const key = pair[1],
      value = quoted(pair[2]);
    if (/^現行の.+担当・credit原文は正しい$/.test(key))
      result.roles[role].roleConfirmed = value;
    else if (key === "既存Creatorへの紐付けを承認する")
      result.roles[role].bindingApproved = value;
    else if (key.startsWith("原文を訂正する場合"))
      result.roles[role].correctedRaw = value;
    else if (key === "既存Creator指定（必要な場合のみ）")
      result.roles[role].specifiedCreator = value;
    else if (key === "備考") result.roles[role].notes = value;
  }
  return result;
}
export function planReview(before, answers) {
  const path = "data/ournotes/songs.json",
    data = JSON.parse(before.files[path]),
    original = data.groups.flatMap((g) => g.songs).find((s) => s.id === 89);
  assert.equal(original.title, "アイライク・ユアライク");
  assert.equal(original.workId, "wk-0827");
  const song = structuredClone(original),
    master = JSON.parse(before.files["data/creators.json"]),
    tasks = before.ledger.songs.flatMap((r) =>
      r.tasks.map((t) => ({
        ...t,
        game: r.game,
        recordId: r.recordId,
        title: r.title,
        workId: r.workId,
      })),
    );
  assert.equal(tasks.length, 6);
  assert.equal(new Set(tasks.map((t) => t.taskId)).size, 6);
  const reviews = [],
    dispositions = [],
    held = [];
  for (const role of CREDIT_ROLES) {
    const answer = answers.roles[role] ?? {},
      raw = original[role],
      target = tasks.filter((t) => t.role === role);
    assert.equal(target.length, 2);
    assert.deepEqual(target.map((t) => t.category).sort(), [
      "ALIAS_REVIEW",
      "ROLE_REVIEW",
    ]);
    for (const t of target) {
      assert.equal(t.game, "ournotes");
      assert.equal(t.recordId, 89);
      assert.equal(t.title, original.title);
      assert.equal(t.workId, original.workId);
      assert.equal(t.raw, raw);
    }
    let reason = null,
      creator = null;
    if (answer.roleConfirmed !== "はい" || answer.bindingApproved !== "はい")
      reason = "Both raw/role and binding must be explicitly approved";
    else if (answer.correctedRaw)
      reason = "A correction was supplied despite approval of the current raw";
    else {
      const candidates = master.creators.filter((c) =>
        [c.name, ...(c.aliases ?? [])].includes(raw),
      );
      if (answer.specifiedCreator) {
        const specified = master.creators.filter(
          (c) =>
            c.id === answer.specifiedCreator ||
            c.name === answer.specifiedCreator,
        );
        if (
          specified.length === 1 &&
          candidates.some((c) => c.id === specified[0].id)
        )
          creator = specified[0];
        else
          reason = "Specified Creator conflicts with the current exact credit";
      } else if (candidates.length === 1) creator = candidates[0];
      else reason = "Exact Creator match is absent or ambiguous";
    }
    if (creator) {
      assert.equal(creditText(original, role, master.creators), raw);
      const parts = song.creditDisplay[role];
      assert.equal(parts.length, 1, "Only a whole single subject can be bound");
      assert.equal(parts[0].text, raw);
      assert.equal(parts[0].unresolved, true);
      let rel = song.credits.find((c) => c.creatorId === creator.id);
      if (!rel) {
        rel = { creatorId: creator.id, roles: [] };
        song.credits.push(rel);
      }
      if (!rel.roles.includes(role)) rel.roles.push(role);
      if (raw !== creator.name) {
        rel.displayOverrides ??= {};
        rel.displayOverrides[role] = raw;
      }
      song.creditDisplay[role] = [{ creatorId: creator.id }];
      reviews.push({
        game: "ournotes",
        recordId: 89,
        title: original.title,
        workId: original.workId,
        role,
        raw,
        actors: [
          {
            raw,
            creatorId: creator.id,
            identityKey: creator.id,
            confidence: "CONFIRMED",
          },
        ],
        bindings: [{ creatorId: creator.id, raw }],
        roleConfirmed: true,
        splitConfirmed: false,
        requiresVersionReview: false,
        reviewKind: "FinalSix",
        humanReviewId: REVIEW_DIR + "/review.json",
        taskIds: target.map((t) => t.taskId),
      });
    } else held.push({ role, reason });
    for (const t of target)
      dispositions.push({
        taskId: t.taskId,
        role,
        category: t.category,
        raw,
        status: creator ? "RESOLVED" : "STILL_NEEDS_HUMAN",
        creatorId: creator?.id ?? null,
        roleAnswer: answer.roleConfirmed ?? null,
        bindingAnswer: answer.bindingApproved ?? null,
        reason,
      });
  }
  const output = patchCreditFields(
    before.files[path],
    new Map([
      [
        89,
        {
          title: original.title,
          workId: original.workId,
          fields: { credits: song.credits, creditDisplay: song.creditDisplay },
        },
      ],
    ]),
  ).text;
  validateCreatorDatabase(
    master,
    JSON.parse(before.files["data/works.json"]),
    ["garupa", "ournotes"].flatMap((g) =>
      JSON.parse(
        g === "ournotes" ? output : before.files["data/garupa/songs.json"],
      ).groups.flatMap((group) =>
        group.songs.map((s) => ({ ...s, gameId: g })),
      ),
    ),
  );
  return {
    output: { [path]: output },
    reviews,
    dispositions,
    held,
    answers,
    sourceType: "人間による明示確認",
    humanReviewDate: null,
    reviewer: null,
    inputHash: sha(fs.readFileSync(REVIEW_DIR + "/input.txt")),
  };
}
export function verifyPreservation(before, plan) {
  const path = "data/ournotes/songs.json",
    data = JSON.parse(before.files[path]),
    updated = JSON.parse(plan.output[path]),
    master = JSON.parse(before.files["data/creators.json"]);
  const old = data.groups.flatMap((g) => g.songs).find((s) => s.id === 89),
    current = updated.groups.flatMap((g) => g.songs).find((s) => s.id === 89);
  for (const role of CREDIT_ROLES) {
    assert.equal(
      creditText(current, role, master.creators),
      creditText(old, role, master.creators),
    );
    assert.equal(current[role], old[role]);
  }
  for (const rel of old.credits)
    for (const role of rel.roles)
      assert.ok(
        current.credits.some(
          (c) => c.creatorId === rel.creatorId && c.roles.includes(role),
        ),
      );
  for (const s of [old, current]) {
    delete s.credits;
    delete s.creditDisplay;
  }
  assert.deepEqual(
    updated,
    data,
    "No unrelated song, field, group, or top-level changes",
  );
  for (const [p, t] of Object.entries(before.files))
    if (p !== path)
      assert.equal(
        fs.readFileSync(p, "utf8"),
        t,
        "Unrelated data/Creator/Work bytes " + p,
      );
  for (const [p, h] of Object.entries(before.protectedHashes))
    assert.equal(
      sha(fs.readFileSync(p)),
      h,
      "Prior human review evidence " + p,
    );
  return {
    rawFieldsPreserved: 3,
    otherSongsChanged: 0,
    CreatorChanges: 0,
    WorkChanges: 0,
    unrelatedChanges: 0,
  };
}
export function runReview(mode = "verify") {
  assert.ok(["plan", "apply", "verify"].includes(mode));
  const before = loadBefore(),
    answers = parseAnswers(fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8")),
    plan = planReview(before, answers);
  plan.preservation = verifyPreservation(before, plan);
  const receiptPath = REVIEW_DIR + "/review.json";
  if (mode === "apply") {
    const prior = fs.existsSync(receiptPath) ? read(receiptPath) : null;
    for (const [p, t] of Object.entries(plan.output)) {
      assert.ok(
        [sha(before.files[p]), prior?.outputHashes?.[p]].includes(
          sha(fs.readFileSync(p)),
        ),
        "User edit since reviewed snapshot " + p,
      );
      if (fs.readFileSync(p, "utf8") !== t) fs.writeFileSync(p, t);
    }
    const receipt = {
      ...plan,
      output: undefined,
      outputHashes: Object.fromEntries(
        Object.entries(plan.output).map(([p, t]) => [p, sha(t)]),
      ),
      appliedAt: prior?.appliedAt ?? new Date().toISOString(),
    };
    fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + "\n");
  } else if (mode === "verify")
    for (const [p, t] of Object.entries(plan.output))
      assert.equal(fs.readFileSync(p, "utf8"), t, p);
  console.log({
    mode,
    resolved: plan.dispositions.filter((t) => t.status === "RESOLVED").length,
    held: plan.held,
    roles: plan.reviews.map((r) => ({
      role: r.role,
      creatorId: r.bindings[0].creatorId,
      raw: r.raw,
    })),
  });
  return plan;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  runReview(process.argv[2] ?? "verify");
