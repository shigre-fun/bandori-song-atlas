import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { creditParts } from "../../src/js/credits.js";
import { creditText, CREDIT_ROLES } from "../../src/js/credit-display.js";
import { validateCreatorDatabase } from "../../src/js/creators-data.js";
import {
  formatKey,
  separateAffiliation,
} from "../research/creator-identity.mjs";
import { patchCreditFields } from "./credit-field-patch.mjs";

export const REVIEW_DIR = "docs/human-review/creator-credits-p0-2026-10-06";
const sha = (v) => createHash("sha256").update(v).digest("hex");
const json = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
const roleName = { 作詞者: "lyricist", 編曲者: "arranger" };

export function parseAnswers(text) {
  const fields = {};
  const records = new Map();
  const scopeConfirmations = [];
  let current = null;
  for (const [i, line] of text.split(/\r?\n/).entries()) {
    const song =
      /^OurNotes:(\d+) (.+)：(編曲者|作詞者)=["”]([^"\r\n]*)"\s*$/.exec(line);
    if (song) {
      const recordId = Number(song[1]),
        role = roleName[song[3]];
      const key = `ournotes:${recordId}:${role}`;
      const prior = records.get(key);
      if (prior)
        assert.equal(prior.raw, song[4], "Conflicting duplicate answer " + key);
      current = prior ?? {
        game: "ournotes",
        recordId,
        title: song[2],
        role,
        raw: song[4] || null,
        fieldAbsent: song[4] === "欄なし",
        releaseReference: null,
        relationshipAnswer: null,
        inputLines: [],
      };
      current.inputLines.push(i + 1);
      records.set(key, current);
      continue;
    }
    const relation = /^(発売版参考|発売版との関係)=["”]([^"\r\n]*)"\s*$/.exec(
      line,
    );
    if (relation) {
      assert.ok(current, "Release answer without record scope");
      current[
        relation[1] === "発売版参考" ? "releaseReference" : "relationshipAnswer"
      ] = relation[2] || null;
      continue;
    }
    const scope =
      /^(Garupa|OurNotes):(\d+) (.+)／(作詞|作曲)「([^」]+)」は上記Creatorと同一=["”]([^"\r\n]*)"\s*$/.exec(
        line,
      );
    if (scope) {
      scopeConfirmations.push({
        game: scope[1] === "Garupa" ? "garupa" : "ournotes",
        recordId: Number(scope[2]),
        title: scope[3],
        role: scope[4] === "作詞" ? "lyricist" : "composer",
        raw: scope[5],
        answer: scope[6] || null,
        inputLine: i + 1,
      });
      continue;
    }
    const field = /^([^=\s]+)=["”]([^"\r\n]*)"\s*$/.exec(line);
    if (field) fields[field[1]] = field[2] || null;
    if (/^aliases=\[\]\s*$/.test(line)) fields.aliases = [];
    if (
      /^(?:OurNotes:\d+.+：(編曲者|作詞者)|発売版参考|発売版との関係)=/.test(
        line,
      )
    )
      throw new Error("Malformed quoted answer at line " + (i + 1));
  }
  return {
    schemaVersion: 1,
    reviewer: fields.reviewer,
    humanReviewDate: fields.humanReviewDate,
    fields,
    scopeConfirmations,
    records: [...records.values()],
  };
}

export function relationshipStatus(answer) {
  if (!answer || answer === "不明") return "UNRESOLVED";
  if (["同一編曲と確認", "同じ", "2人とも同じ", "3人とも同じ"].includes(answer))
    return "SAME_ARRANGEMENT_CONFIRMED";
  if (answer === "別編曲と確認") return "DIFFERENT_ARRANGEMENT_CONFIRMED";
  if (answer === "同一人物だが現在は石倉まろ名義のみを使用")
    return "SAME_PERSON_CONFIRMED_ARRANGEMENT_UNRESOLVED";
  if (answer === "別の人物、牧野太洋が正しい")
    return "CREDIT_CORRECTION_CONFIRMED_ARRANGEMENT_UNRESOLVED";
  return "ANSWER_RECORDED_RELATIONSHIP_UNRESOLVED";
}

export function loadBefore() {
  const baseline = json(REVIEW_DIR + "/baseline.json");
  const bytes = fs.readFileSync(REVIEW_DIR + "/before.json.gz");
  assert.equal(sha(bytes), baseline.fixtureHash, "Immutable before fixture");
  const before = JSON.parse(gunzipSync(bytes));
  for (const [p, value] of Object.entries(before.files))
    assert.equal(sha(value), baseline.sourceHashes[p], p);
  for (const [p, value] of Object.entries(before.artifacts))
    assert.equal(sha(value), baseline.artifactHashes[p], p);
  assert.equal(
    sha(fs.readFileSync(REVIEW_DIR + "/input.txt")),
    baseline.answerInputHash,
    "Immutable human answer input",
  );
  return { baseline, before };
}

export function safeExistingCreator(raw, creators, record, role) {
  const found = creators.filter((c) =>
    [c.name, ...c.aliases].some((s) => formatKey(s) === formatKey(raw)),
  );
  if (found.length !== 1) return null;
  // Short ambiguous aliases need a previously approved binding in this recording.
  if (
    /^[a-z0-9-]{1,4}$/i.test(raw) &&
    !record.credits?.some((c) => c.creatorId === found[0].id)
  )
    return null;
  return {
    creatorId: found[0].id,
    basis: "EXACT_EXISTING_NAME_OR_APPROVED_ALIAS_WITH_FORMAT_EQUIVALENCE",
    role,
  };
}

function descriptor(part, answer, identities, creators, record) {
  const match = safeExistingCreator(part.text, creators, record, answer.role);
  const { normalized, affiliation } = separateAffiliation(part.text);
  let possible = identities.filter((i) =>
    [i.standardName, ...i.rawTokens, ...i.aliases].some(
      (s) =>
        formatKey(s) === formatKey(part.text) ||
        formatKey(s) === formatKey(normalized),
    ),
  );
  // This explicit answer confirms the name change only within OurNotes:75.
  if (
    answer.recordId === 75 &&
    answer.relationshipAnswer === "同一人物だが現在は石倉まろ名義のみを使用"
  )
    possible = identities.filter((i) => i.standardName === "石倉誉之");
  const group = possible.length === 1 ? possible[0] : null;
  const key = group?.identityKey ?? `review-${sha(normalized).slice(0, 20)}`;
  return {
    raw: part.text,
    normalized,
    affiliation,
    standardName: normalized,
    identityKey: key,
    creatorId: match?.creatorId ?? null,
    confidence: match ? "CONFIRMED" : "UNRESOLVED",
    safeMappingBasis: match?.basis ?? null,
    groupBasis: group
      ? `既存候補 ${group.identityKey} との照合仮説（formal同定ではない）`
      : "人間回答のゲームrawから作成した候補群（formal同定ではない）",
    reason: match
      ? "入力したゲーム担当と既存の承認済みname/aliasが一致。"
      : "ゲーム原文は人間確認済み。主体の本人情報・既存ID対応・登録情報は未確認。",
    evidence: [
      {
        document: REVIEW_DIR + "/input.txt",
        locator: `${answer.game}:${answer.recordId}:${answer.role} / line ${answer.inputLines.join(",")}`,
        sourceType: "human-review",
        reviewer: "タニマチ",
        checkedAt: null,
      },
    ],
  };
}

export function planReview(files, answers, identities) {
  const master = JSON.parse(files["data/creators.json"]);
  const works = JSON.parse(files["data/works.json"]);
  const games = Object.fromEntries(
    ["garupa", "ournotes"].map((g) => [
      g,
      JSON.parse(files[`data/${g}/songs.json`]),
    ]),
  );
  const patches = new Map();
  const reviews = [];
  for (const scope of answers.scopeConfirmations) {
    const song = games[scope.game]?.groups
      .flatMap((g) => g.songs)
      .find((s) => s.id === scope.recordId);
    assert.ok(song, "Missing confirmed identity record");
    assert.equal(song.title, scope.title, "CONFLICT identity title");
    assert.equal(
      creditText(song, scope.role, master.creators),
      scope.raw,
      "CONFLICT identity raw",
    );
  }
  for (const answer of answers.records) {
    if (!answer.raw || answer.fieldAbsent) continue;
    assert.equal(answer.game, "ournotes");
    const original = games.ournotes.groups
      .flatMap((g) => g.songs)
      .find((s) => s.id === answer.recordId);
    assert.ok(original, "Missing answer record " + answer.recordId);
    assert.equal(original.title, answer.title, "CONFLICT answer title");
    assert.ok(original.workId, "Missing Work identity");
    const state = patches.get(original.id) ?? {
      title: original.title,
      workId: original.workId,
      song: structuredClone(original),
    };
    const song = state.song;
    song[answer.role] = answer.raw;
    const descriptors = creditParts(answer.raw)
      .filter((p) => p.name)
      .map((p) => descriptor(p, answer, identities, master.creators, original));
    song.creditDisplay ??= {};
    let actorIndex = 0;
    song.creditDisplay[answer.role] = creditParts(answer.raw).map((p) => {
      if (!p.name) return { text: p.text };
      const actor = descriptors[actorIndex++];
      if (!actor.creatorId) return { text: p.text, unresolved: true };
      song.credits ??= [];
      let relation = song.credits.find((c) => c.creatorId === actor.creatorId);
      if (!relation) {
        relation = { creatorId: actor.creatorId, roles: [] };
        song.credits.push(relation);
      }
      if (!relation.roles.includes(answer.role))
        relation.roles.push(answer.role);
      relation.displayOverrides ??= {};
      relation.displayOverrides[answer.role] = p.text;
      return { creatorId: actor.creatorId };
    });
    assert.equal(
      creditText(song, answer.role, master.creators),
      answer.raw,
      "Exact human raw display",
    );
    patches.set(original.id, state);
    reviews.push({
      ...answer,
      workId: original.workId,
      band: games.ournotes.groups.find((g) =>
        g.songs.some((s) => s.id === original.id),
      ).band,
      relationshipStatus: relationshipStatus(answer.relationshipAnswer),
      splitBoundaryStatus: "HUMAN_GAME_RAW_PARTS_RECORDED",
      actors: descriptors,
      fieldAbsent: false,
    });
  }
  const fieldPatches = new Map(
    [...patches].map(([id, state]) => [
      id,
      {
        title: state.title,
        workId: state.workId,
        fields: Object.fromEntries(
          ["lyricist", "arranger", "credits", "creditDisplay"]
            .filter(
              (key) =>
                JSON.stringify(state.song[key]) !==
                JSON.stringify(
                  games.ournotes.groups
                    .flatMap((g) => g.songs)
                    .find((s) => s.id === id)[key],
                ),
            )
            .map((key) => [key, state.song[key]]),
        ),
      },
    ]),
  );
  const patched = patchCreditFields(
    files["data/ournotes/songs.json"],
    fieldPatches,
  );
  const output = { ...files, "data/ournotes/songs.json": patched.text };
  const afterGames = { ...games, ournotes: JSON.parse(patched.text) };
  const all = Object.entries(afterGames).flatMap(([gameId, db]) =>
    db.groups.flatMap((g) => g.songs.map((s) => ({ ...s, gameId }))),
  );
  const validated = validateCreatorDatabase(master, works, all);
  assert.equal(validated.warnings.length, 0, "Creator/Work warnings");
  verifyPreservation(files, output, answers);
  const required = [
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
  ];
  const missing = required.filter((field) => answers.fields[field] == null);
  assert.ok(
    missing.length,
    "Complete Creator answers need an explicitly reviewed registration plan",
  );
  return {
    output,
    reviews,
    fieldPatches: [...fieldPatches].map(([recordId, value]) => ({
      recordId,
      ...value,
    })),
    edits: patched.edits,
    registration: {
      name: "カンザキイオリ",
      status: "BLOCKED_INCOMPLETE_CREATOR_FIELDS",
      missingFields: missing,
      suppliedFields: answers.fields,
      suppliedScopes: answers.scopeConfirmations,
      creatorAdded: false,
      reason:
        "回答ルール10の全欄条件に空欄がある。推測補完せず、入力されたOurNotes:86作詞rawのみ適用。",
    },
  };
}

export function verifyPreservation(before, after, answers) {
  for (const p of [
    "data/creators.json",
    "data/works.json",
    "data/garupa/songs.json",
    "data/ournotes/admin-state.json",
  ])
    assert.equal(after[p], before[p], "Unrelated file changed " + p);
  const old = JSON.parse(before["data/ournotes/songs.json"]),
    now = JSON.parse(after["data/ournotes/songs.json"]);
  assert.equal(now.groups.length, old.groups.length);
  for (const [i, group] of old.groups.entries()) {
    const current = now.groups[i];
    assert.deepEqual(
      { ...current, songs: null },
      { ...group, songs: null },
      "Group metadata/order",
    );
    assert.equal(current.songs.length, group.songs.length);
    for (const [j, prior] of group.songs.entries()) {
      const song = current.songs[j];
      const allowed = new Set(
        answers.records
          .filter((a) => a.recordId === prior.id && a.raw && !a.fieldAbsent)
          .map((a) => a.role),
      );
      assert.deepEqual(
        Object.fromEntries(
          Object.entries(song).filter(
            ([key]) =>
              !allowed.has(key) && !["credits", "creditDisplay"].includes(key),
          ),
        ),
        Object.fromEntries(
          Object.entries(prior).filter(
            ([key]) =>
              !allowed.has(key) && !["credits", "creditDisplay"].includes(key),
          ),
        ),
        "Unrelated song field " + prior.id,
      );
      for (const role of CREDIT_ROLES) {
        if (!allowed.has(role)) {
          assert.deepEqual(
            song.creditDisplay?.[role],
            prior.creditDisplay?.[role],
            "Other role display " + prior.id + ":" + role,
          );
          const relations = (s) =>
            (s.credits ?? [])
              .filter((c) => c.roles.includes(role))
              .map((c) => ({
                creatorId: c.creatorId,
                display:
                  c.displayOverrides?.[role] ?? c.displayOverride ?? null,
              }));
          assert.deepEqual(
            relations(song),
            relations(prior),
            "Other role relation " + prior.id + ":" + role,
          );
        }
      }
    }
  }
  assert.deepEqual(
    { ...now, groups: null },
    { ...old, groups: null },
    "Top-level dataset metadata",
  );
}

export function runReview(mode) {
  assert.ok(["plan", "apply", "verify"].includes(mode));
  const { baseline, before } = loadBefore();
  const answers = parseAnswers(
    fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8"),
  );
  const identities = json(
    "docs/migrations/credits-phase-b1-2026-10-03/creator-identity-research.json",
  );
  const plan = planReview(before.files, answers, identities);
  assert.equal(
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    baseline.head,
    "HEAD changed; review scope again",
  );
  for (const [p, hash] of Object.entries(baseline.protectedResearch))
    assert.equal(sha(fs.readFileSync(p)), hash, "Protected research " + p);
  const target = "data/ournotes/songs.json";
  const outputHash = sha(plan.output[target]);
  for (const [p, hash] of Object.entries(baseline.sourceHashes)) {
    const current = sha(fs.readFileSync(p));
    assert.ok(
      current === hash || (p === target && current === outputHash),
      "CONFLICT live SHA; preserve edits and reconcile field patch " + p,
    );
  }
  const alreadyApplied = sha(fs.readFileSync(target)) === outputHash;
  if (mode === "apply") {
    if (!alreadyApplied) fs.writeFileSync(target, plan.output[target]);
    const saved = {
      schemaVersion: 1,
      sourceType: "human-review",
      reviewer: answers.reviewer,
      humanReviewDate: answers.humanReviewDate,
      receivedAt: baseline.receivedAt,
      inputSha256: baseline.answerInputHash,
      sourceHead: baseline.head,
      answers,
      reviews: plan.reviews,
      registration: plan.registration,
    };
    write(REVIEW_DIR + "/review.json", saved);
    const receipt = {
      schemaVersion: 1,
      result: "PASS",
      sourceHashesBefore: baseline.sourceHashes,
      sourceHashesAfter: Object.fromEntries(
        Object.keys(before.files).map((p) => [p, sha(fs.readFileSync(p))]),
      ),
      patches: plan.fieldPatches,
      structuralValueEdits: plan.edits,
      reviewedRecordRoles: plan.reviews.length,
      arrangerAnswers: plan.reviews.filter((r) => r.role === "arranger").length,
      lyricistAnswers: plan.reviews.filter((r) => r.role === "lyricist").length,
      formalArrangerBindings: plan.reviews
        .filter((r) => r.role === "arranger")
        .reduce((n, r) => n + r.actors.filter((a) => a.creatorId).length, 0),
      unresolvedActors: plan.reviews.flatMap((r) =>
        r.actors
          .filter((a) => !a.creatorId)
          .map((a) => ({
            game: r.game,
            recordId: r.recordId,
            role: r.role,
            raw: a.raw,
            identityKey: a.identityKey,
          })),
      ),
      gameVersionConfirmed: plan.reviews.filter((r) =>
        [
          "SAME_ARRANGEMENT_CONFIRMED",
          "DIFFERENT_ARRANGEMENT_CONFIRMED",
        ].includes(r.relationshipStatus),
      ).length,
      gameVersionUnresolved: plan.reviews.filter(
        (r) =>
          r.role === "arranger" &&
          ![
            "SAME_ARRANGEMENT_CONFIRMED",
            "DIFFERENT_ARRANGEMENT_CONFIRMED",
          ].includes(r.relationshipStatus),
      ).length,
      unrelatedFieldsChanged: 0,
      workIdentityChanged: 0,
      existingCreatorMetadataChanged: 0,
      newCreators: 0,
      commitPushDeployPerformed: false,
    };
    write(REVIEW_DIR + "/applied.json", receipt);
  }
  if (mode === "verify") {
    assert.ok(alreadyApplied, "Plan is not applied");
    verifyPreservation(
      before.files,
      Object.fromEntries(
        Object.keys(before.files).map((p) => [p, fs.readFileSync(p, "utf8")]),
      ),
      answers,
    );
    assert.deepEqual(json(REVIEW_DIR + "/review.json").reviews, plan.reviews);
  }
  console.log(
    JSON.stringify(
      {
        mode,
        alreadyApplied,
        changedFiles: mode === "apply" && !alreadyApplied ? 1 : 0,
        reviewedRecordRoles: plan.reviews.length,
        registration: plan.registration.status,
        unresolvedActorNames: [
          ...new Set(
            plan.reviews.flatMap((r) =>
              r.actors.filter((a) => !a.creatorId).map((a) => a.raw),
            ),
          ),
        ],
      },
      null,
      2,
    ),
  );
  return plan;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  runReview(process.argv[2] ?? "verify");
