import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { buildB1 } from "../research/credits-phase-b1.mjs";
import { ROLES, referenceKey } from "../research/creator-identity.mjs";
import { historicalJSON } from "./credit-history.mjs";
import { patchCreditFields } from "./credit-field-patch.mjs";
import {
  parallelReview,
  parallelNormalized,
  approvedSource,
  verifyNonCredit,
} from "./release-parallel.mjs";
import { historicalText } from "./credit-history.mjs";
import {
  creditText,
  validateCreatorDatabase,
  creatorParticipation,
} from "../../src/js/creators-data.js";
export const DIRECTORY = "docs/migrations/credits-phase-b2-2026-10-03";
const B1 = "docs/migrations/credits-phase-b1-2026-10-03",
  A = "docs/migrations/credits-phase-a-2026-10-03";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
export const hash = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
const digest = (p) => hash(fs.readFileSync(p));
const write = (name, value) =>
  fs.writeFileSync(
    DIRECTORY + "/" + name,
    JSON.stringify(value, null, 2) + "\n",
  );
const unique = (a) => [...new Set(a)];
const creditFields = (s) =>
  Object.fromEntries(
    ["lyricist", "composer", "arranger", "credits", "creditDisplay"].map(
      (k) => [k, s[k] ?? null],
    ),
  );
const records = (data, game) =>
  data.groups.flatMap((g) =>
    g.songs.map((s) => ({
      ...s,
      gameId: game,
      band: g.band,
      category: g.category,
    })),
  );
export function assertResearch() {
  const b = read(DIRECTORY + "/baseline.json");
  for (const [p, h] of Object.entries(b.protectedResearch))
    assert.equal(digest(p), h, "Immutable A/B1 " + p);
  assert.equal(digest(b.b1Package.path), b.b1Package.sha256, "B1 package SHA");
  assert.equal(read(b.b1Package.path).version, 1, "B1 package version");
  return b;
}
export function effectivePackage() {
  const baseline = assertResearch(),
    original = read(B1 + "/phase-b2-package.json");
  const human = read(DIRECTORY + "/human-review.json");
  assert.equal(human.version, 1);
  assert.equal(original.apply, false);
  assert.equal(original.allocateFormalIds, false);
  assert.equal(human.a1.length, 12);
  assert.equal(human.a2.length, 14);
  assert.equal(human.formerProbable.length, 7);
  const old = historicalJSON("data/creators.json");
  assert.equal(old.nextId, 92);
  assert.equal(old.creators.length, 91);
  const creators = structuredClone(old.creators);
  for (const v of human.existingVariants) {
    const c = creators.find((c) => c.id === v.creatorId);
    assert.ok(c);
    if (!c.aliases.includes(v.raw)) c.aliases.push(v.raw);
  }
  const evidence = read(B1 + "/identity-evidence.json");
  const b1Candidates = read(B1 + "/creator-candidates.json");
  const candidates = Array.isArray(b1Candidates)
    ? b1Candidates
    : b1Candidates.candidates;
  for (const h of human.formerProbable) {
    const previous = candidates.find((c) => c.standardName === h.standardName);
    assert.equal(previous.confidence, "PROBABLE");
    const entries = evidence.entries.filter(
      (e) => e.standardName === h.standardName,
    );
    for (const e of entries) {
      e.confidence = "CONFIRMED";
      e.type = "person";
      e.aliases = unique([...e.aliases, ...h.aliases]);
      e.note = "B2 explicit human identity review";
    }
    if (!entries.length)
      evidence.entries.push({
        standardName: h.standardName,
        aliases: h.aliases,
        type: "person",
        confidence: "CONFIRMED",
        applicability: "GLOBAL_CONFIRMED",
        evidence: [],
        note: "B2 explicit human identity review",
      });
  }
  const model = buildB1({
    phaseA: read(A + "/credit-research.json"),
    creators,
    humanReview: read(B1 + "/human-review.json"),
    identityEvidence: evidence,
  });
  const names = [
    ...original.proposedNewCreators.map((c) => c.standardName),
    ...human.formerProbable.map((c) => c.standardName),
  ];
  assert.equal(names.length, 33);
  assert.equal(new Set(names).size, 33);
  const map = names.map((name, index) => {
    const base =
      original.proposedNewCreators.find((c) => c.standardName === name) ??
      model.newCandidates.find((c) => c.standardName === name);
    assert.ok(base, "Missing approved " + name);
    const a1 = human.a1.find((c) => c.standardName === name),
      a2 = human.a2.find((c) => c.standardName === name),
      extra = human.formerProbable.find((c) => c.standardName === name);
    const reviewedMetadata = (human.metadataReviews ?? []).find(
      (review) => review.name === name,
    );
    if (reviewedMetadata) {
      assert.equal(reviewedMetadata.sourceType, "human-review");
      assert.equal(reviewedMetadata.checkedAt, "2026-10-03");
      assert.equal(
        reviewedMetadata.creatorId,
        "cr-" + String(92 + index).padStart(4, "0"),
      );
      assert.equal(extra?.identityConfidence, "CONFIRMED");
      assert.equal(extra?.metadata.status, "BLOCKED_METADATA");
    }
    const metadata =
      reviewedMetadata ??
      a2 ??
      (a1 ? { ...a1, slug: a1.slugCandidate } : extra.metadata);
    const blocked = metadata.status === "BLOCKED_METADATA";
    return {
      candidateKey: base.candidateKey,
      standardName: name,
      creatorId: "cr-" + String(92 + index).padStart(4, "0"),
      confidence: "CONFIRMED",
      previousB1Confidence: extra ? "PROBABLE" : "CONFIRMED",
      status: blocked ? "BLOCKED_METADATA" : "READY",
      metadata: blocked
        ? metadata
        : {
            name,
            slug: metadata.slug,
            type: metadata.type ?? base.type,
            sortKey: metadata.sortKey ?? base.sortKey,
            sortKeyStatus: metadata.sortKeyStatus ?? "provisional-original",
            aliases: unique([
              ...(base.aliases ?? []),
              ...(extra?.aliases ?? []),
            ]).filter((a) => a !== name),
          },
      officialLatinName:
        metadata.officialLatinName ?? base.officialLatinName ?? null,
      recordReferences: base.records ?? base.activeRecords ?? [],
    };
  });
  const slugs = new Set(
    old.creators.flatMap((c) => [c.slug, ...(c.previousSlugs ?? [])]),
  );
  for (const c of map.filter((c) => c.status === "READY")) {
    assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.metadata.slug));
    assert.ok(!/creator-candidate|cr-\d/.test(c.metadata.slug));
    assert.ok(!slugs.has(c.metadata.slug), "slug collision");
    slugs.add(c.metadata.slug);
  }
  const byCandidate = new Map(map.map((c) => [c.candidateKey, c]));
  const approvedToken = (t) => {
    if (t.confidence !== "CONFIRMED") return null;
    if (t.scopePolicy === "RECORD_SCOPED")
      assert.ok(t.recordScope, "short-name scope");
    if (t.existingCreatorId) return t.existingCreatorId;
    const m = byCandidate.get(t.candidateKey);
    return m?.status === "READY" ? m.creatorId : null;
  };
  const normalized = model.normalized.map((r) => ({
    ...r,
    roles: Object.fromEntries(
      ROLES.map((role) => {
        const v = structuredClone(r.roles[role]);
        v.effective.creatorTokens = v.effective.creatorTokens.map((t) => ({
          ...t,
          creatorId: approvedToken(t),
        }));
        const joint = (human.jointArrangerReviews ?? []).find(
          (review) =>
            review.game === r.game &&
            review.recordId === r.recordId &&
            review.role === role,
        );
        if (joint) {
          assert.equal(joint.sourceType, "human-review");
          assert.equal(joint.checkedAt, "2026-10-04");
          assert.equal(role, "arranger");
          assert.equal(r.game, "garupa");
          assert.ok([220, 231, 243, 246, 248, 272].includes(r.recordId));
          assert.equal(joint.title, r.title);
          assert.equal(joint.workId, r.workId);
          assert.equal(joint.rawCredit, v.effective.rawCredit);
          assert.equal(joint.tokens.length, v.effective.creatorTokens.length);
          v.effective.creatorTokens = v.effective.creatorTokens.map(
            (token, index) => {
              const reviewed = joint.tokens[index];
              assert.equal(reviewed.raw, token.raw);
              const existing = old.creators.find(
                (c) => c.id === reviewed.creatorId,
              );
              const candidate = map.find(
                (c) =>
                  c.creatorId === reviewed.creatorId && c.status === "READY",
              );
              assert.ok(existing || candidate);
              assert.ok(
                reviewed.creatorId === token.creatorId ||
                  reviewed.creatorId === "cr-0120" ||
                  (r.recordId === 220 && reviewed.creatorId === "cr-0019"),
              );
              return {
                ...token,
                standardName: existing?.name ?? candidate.standardName,
                creatorId: reviewed.creatorId,
                existingCreatorId: existing?.id ?? null,
                candidateKey: candidate?.candidateKey ?? null,
                identityKey: existing?.id ?? candidate.candidateKey,
                confidence: "CONFIRMED",
                applicability: "RECORD_SCOPED",
                scopePolicy: "RECORD_SCOPED",
                recordScope: referenceKey(r),
                reason: joint.reason,
                evidence: [...token.evidence, joint],
              };
            },
          );
          v.effective.splitStatus = "CONFIRMED_SPLIT";
          v.effective.splitReason = joint.reason;
          v.excludedReason = null;
          v.resolvedBy = "human-review";
          v.humanReviewId = joint.reviewId;
          v.humanEvidence = joint;
        }
        v.creatorResolved =
          v.target &&
          ["CONFIRMED_SINGLE", "CONFIRMED_SPLIT"].includes(
            v.effective.splitStatus,
          ) &&
          v.effective.creatorTokens.length > 0 &&
          v.effective.creatorTokens.every((t) => t.creatorId);
        return [role, v];
      }),
    ),
  }));
  const parallel = parallelReview();
  if (parallel) {
    assert.equal(normalized.length, 884);
    const matches = old.creators.filter(
      (c) =>
        c.name === parallel.record.composer ||
        c.aliases.includes(parallel.record.composer),
    );
    assert.ok(matches.length <= 1);
    assert.equal(matches[0]?.id ?? null, parallel.composer.id);
    const linked = normalized.find(
      (r) => r.game === "garupa" && r.recordId === 758,
    );
    assert.equal(linked.workId, parallel.record.workId);
    normalized.push(parallelNormalized(parallel));
  }
  const relationRows = normalized.flatMap((r) =>
    ROLES.filter((role) => r.roles[role].creatorResolved).map((role) => ({
      game: r.game,
      recordId: r.recordId,
      title: r.title,
      band: r.band,
      workId: r.workId,
      role,
      confidence: "CONFIRMED",
      splitStatus: r.roles[role].effective.splitStatus,
      rawCredit: r.roles[role].effective.rawCredit,
      creatorTokens: r.roles[role].effective.creatorTokens,
      humanReviewId: r.roles[role].humanReviewId,
    })),
  );
  return {
    version: 1,
    phase: "B2-effective",
    sourcePackage: baseline.b1Package,
    humanReviewSha256: digest(DIRECTORY + "/human-review.json"),
    candidateIdMap: map,
    existingVariants: human.existingVariants,
    normalized,
    relations: relationRows,
    composerCorrections: model.proposals.composerCorrections,
    excluded: normalized.flatMap((r) =>
      ROLES.filter((role) => !r.roles[role].creatorResolved).map((role) => ({
        game: r.game,
        recordId: r.recordId,
        title: r.title,
        workId: r.workId,
        role,
        rawCredit: r.roles[role].effective.rawCredit,
        target: r.roles[role].target,
        reason: r.roles[role].excludedReason ?? "BLOCKED_METADATA",
        tokens: r.roles[role].effective.creatorTokens.map((t) => ({
          raw: t.raw,
          identityKey: t.identityKey,
          confidence: t.confidence,
          creatorId: t.creatorId,
        })),
      })),
    ),
  };
}
// Preserve the spelling used by each role. The legacy shared override continues to apply to existing roles.
export function addRole(song, role, tokens, raw, master) {
  const parts = [],
    byId = new Map(master.map((c) => [c.id, c]));
  let cursor = 0;
  const seen = new Set();
  for (const t of tokens) {
    assert.ok(t.creatorId && t.confidence === "CONFIRMED");
    assert.ok(!seen.has(t.creatorId), "duplicate author in role");
    seen.add(t.creatorId);
    const start = raw.indexOf(t.raw, cursor);
    assert.ok(start >= cursor, "raw author order " + raw);
    if (start > cursor) parts.push({ text: raw.slice(cursor, start) });
    let relation = song.credits.find((c) => c.creatorId === t.creatorId);
    if (!relation) {
      relation = { creatorId: t.creatorId, roles: [] };
      song.credits.push(relation);
    }
    const hadRole = relation.roles.includes(role);
    if (!hadRole) relation.roles.push(role);
    const normal = relation.displayOverride ?? byId.get(t.creatorId).name;
    if (normal !== t.raw) {
      relation.displayOverrides ??= {};
      relation.displayOverrides[role] = t.raw;
    } else if (relation.displayOverrides?.[role])
      delete relation.displayOverrides[role];
    parts.push({ creatorId: t.creatorId });
    cursor = start + t.raw.length;
  }
  if (cursor < raw.length) parts.push({ text: raw.slice(cursor) });
  // The migration never removes an existing role or its displayed author.
  assert.ok(
    song.credits
      .filter((c) => c.roles.includes(role))
      .every((c) => seen.has(c.creatorId)),
    "existing role would be deleted",
  );
  song.creditDisplay[role] = parts;
  song[role] = raw || null;
}
function normalizeComposer(song, row, master) {
  if (!row) return false;
  let changed = false;
  const parts = song.creditDisplay.composer ?? [];
  const tokens = row.creatorTokens;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p.unresolved) continue;
    const t = tokens.find(
      (t) =>
        t.raw === p.text ||
        t.normalized === p.text ||
        t.standardName === p.text ||
        master.find((c) => c.id === t.creatorId)?.aliases.includes(p.text),
    );
    if (!t) continue;
    let relation = song.credits.find((c) => c.creatorId === t.creatorId);
    if (!relation) {
      relation = { creatorId: t.creatorId, roles: [] };
      song.credits.push(relation);
    }
    if (!relation.roles.includes("composer")) relation.roles.push("composer");
    if (
      (relation.displayOverride ??
        master.find((c) => c.id === t.creatorId).name) !== p.text
    ) {
      relation.displayOverrides ??= {};
      relation.displayOverrides.composer = p.text;
    }
    parts[i] = { creatorId: t.creatorId };
    changed = true;
  }
  return changed;
}
export function createPlan(
  pkg = effectivePackage(),
  texts = Object.fromEntries(
    [
      "data/creators.json",
      "data/garupa/songs.json",
      "data/ournotes/songs.json",
      "data/works.json",
    ].map((p) => [p, fs.readFileSync(p, "utf8")]),
  ),
) {
  assert.equal(pkg.phase, "B2-effective");
  assert.equal(pkg.version, 1);
  const baseline = read(DIRECTORY + "/baseline.json"),
    master = JSON.parse(texts["data/creators.json"]),
    beforeMaster = structuredClone(master);
  for (const old of baseline.existingCreators ??
    historicalJSON("data/creators.json").creators) {
    const current = master.creators.find((c) => c.id === old.id);
    assert.ok(current, "existing ID deleted");
    assert.equal(current.slug, old.slug);
    assert.deepEqual(current.previousSlugs, old.previousSlugs);
  }
  assert.ok(master.nextId === 92 || master.nextId === 125, "nextId guard");
  const aliasChanges = [];
  for (const v of pkg.existingVariants) {
    const c = master.creators.find((c) => c.id === v.creatorId);
    if (!c.aliases.includes(v.raw)) {
      c.aliases.push(v.raw);
      aliasChanges.push(v);
    }
  }
  for (const candidate of pkg.candidateIdMap) {
    if (candidate.status !== "READY") continue;
    const expected = { id: candidate.creatorId, ...candidate.metadata };
    const found = master.creators.find((c) => c.id === candidate.creatorId);
    if (found) assert.deepEqual(found, expected, "formal ID metadata conflict");
    else {
      const insertAt = master.creators.findIndex((c) => c.id > expected.id);
      master.creators.splice(
        insertAt < 0 ? master.creators.length : insertAt,
        0,
        expected,
      );
    }
  }
  master.nextId = 125;
  master.roleCoverage = {
    lyricist: { garupa: "ready", ournotes: "ready" },
    composer: { garupa: "ready", ournotes: "ready" },
    arranger: { garupa: "ready", ournotes: "partial" },
  };
  const rows = new Map(
    pkg.relations.map((r) => [r.game + ":" + r.recordId + ":" + r.role, r]),
  );
  const effective = new Map(pkg.normalized.map((r) => [referenceKey(r), r]));
  const corrections = new Set(
    pkg.composerCorrections.map((r) => r.game + ":" + r.recordId),
  );
  const patches = [],
    applied = [],
    conflicts = [],
    displayComparison = [];
  const output = { ...texts };
  for (const game of ["garupa", "ournotes"]) {
    const path = "data/" + game + "/songs.json",
      data = JSON.parse(texts[path]),
      patchMap = new Map();
    for (const g of data.groups)
      for (const song of g.songs) {
        const key = game + ":" + song.id,
          record = effective.get(key),
          before = structuredClone(song);
        if (
          !record ||
          record.title !== song.title ||
          record.workId !== song.workId ||
          record.band !== g.band
        ) {
          conflicts.push({
            key,
            title: song.title,
            workId: song.workId,
            reason: "CONFLICT record identity",
          });
          continue;
        }
        for (const role of ["lyricist", "arranger"]) {
          const v = record.roles[role];
          if (!v.target) continue;
          const row = rows.get(key + ":" + role),
            oldText = creditText(song, role, master.creators);
          if (oldText) {
            // A repeated application must be a no-op; never replace existing nonempty raw text.
            if (
              row &&
              (song.creditDisplay[role] ?? []).every((p) => !p.unresolved)
            )
              continue;
            if (!row) continue;
            if (row.rawCredit !== oldText) {
              conflicts.push({
                key,
                role,
                reason: "CONFLICT nonempty display differs",
              });
              continue;
            }
          }
          if (row) {
            addRole(
              song,
              role,
              row.creatorTokens,
              row.rawCredit,
              master.creators,
            );
            applied.push({
              ...row,
              action: "CONFIRMED_RELATION",
              changed:
                JSON.stringify(creditFields(before)) !==
                JSON.stringify(creditFields(song)),
            });
          } else if (v.effective.rawCredit && !oldText) {
            song[role] = v.effective.rawCredit;
            song.creditDisplay[role] = [
              { text: v.effective.rawCredit, unresolved: true },
            ];
            applied.push({
              game,
              recordId: song.id,
              title: song.title,
              workId: song.workId,
              role,
              action: "RAW_FALLBACK_ONLY",
              changed: true,
            });
          }
        }
        const row = rows.get(key + ":composer");
        if (
          corrections.has(key) &&
          !creditText(song, "composer", master.creators)
        ) {
          assert.ok(row);
          addRole(
            song,
            "composer",
            row.creatorTokens,
            row.rawCredit,
            master.creators,
          );
          applied.push({
            ...row,
            action: "HUMAN_APPROVED_SUPPLEMENT",
            changed: true,
          });
        } else if (normalizeComposer(song, row, master.creators)) {
          applied.push({
            ...row,
            action: "NORMALIZE_CURRENT_DISPLAY",
            changed: true,
          });
        }
        for (const role of ROLES) {
          const oldText = creditText(before, role, beforeMaster.creators),
            newText = creditText(song, role, master.creators);
          assert.ok(
            !oldText || oldText === newText,
            "nonempty display changed " + key + " " + role,
          );
          displayComparison.push({
            game,
            recordId: song.id,
            title: song.title,
            role,
            before: oldText,
            after: newText,
            status:
              oldText === newText
                ? "MATCH"
                : role === "composer"
                  ? "HUMAN_APPROVED_SUPPLEMENT"
                  : "PRE_EXISTING_EMPTY_FILLED",
          });
          for (const c of before.credits.filter((c) => c.roles.includes(role)))
            assert.ok(
              song.credits.some(
                (n) => n.creatorId === c.creatorId && n.roles.includes(role),
              ),
              "existing relation deleted",
            );
        }
        if (
          JSON.stringify(creditFields(before)) !==
          JSON.stringify(creditFields(song))
        ) {
          const fields = Object.fromEntries(
            ["lyricist", "composer", "arranger", "credits", "creditDisplay"]
              .filter(
                (k) => JSON.stringify(before[k]) !== JSON.stringify(song[k]),
              )
              .map((k) => [k, song[k]]),
          );
          patchMap.set(song.id, {
            title: song.title,
            workId: song.workId,
            fields,
          });
          patches.push({
            game,
            recordId: song.id,
            title: song.title,
            workId: song.workId,
            before: creditFields(before),
            after: creditFields(song),
            changedFields: Object.keys(fields),
          });
        }
      }
    output[path] = patchCreditFields(texts[path], patchMap).text;
  }
  // Master has metadata changes only; source songs use structural field patches.
  if (JSON.stringify(master) !== JSON.stringify(beforeMaster))
    output["data/creators.json"] = JSON.stringify(master, null, 2) + "\n";
  const songs = ["garupa", "ournotes"].flatMap((game) =>
    records(JSON.parse(output["data/" + game + "/songs.json"]), game),
  );
  const validation = validateCreatorDatabase(
    master,
    JSON.parse(texts["data/works.json"]),
    songs,
  );
  const coverage = {};
  for (const [label, game, role] of [
    ["lyricist", null, "lyricist"],
    ["garupaArranger", "garupa", "arranger"],
    ["ournotesArranger", "ournotes", "arranger"],
  ]) {
    const targets = pkg.normalized.filter(
      (r) => (!game || r.game === game) && r.roles[role].target,
    );
    const full = targets.filter((r) => r.roles[role].creatorResolved);
    coverage[label] = {
      creditConfirmed: targets.length,
      fullyResolved: full.length,
      rawFallback: targets.length - full.length,
      unknown: pkg.normalized.filter(
        (r) => (!game || r.game === game) && !r.roles[role].target,
      ).length,
      proposalRelations: pkg.relations.filter(
        (r) => r.role === role && (!game || r.game === game),
      ).length,
      appliedRelations: applied.filter(
        (r) =>
          r.role === role &&
          (!game || r.game === game) &&
          r.action === "CONFIRMED_RELATION",
      ).length,
    };
  }
  return {
    version: 1,
    phase: "B2-plan",
    packageSha256: hash(JSON.stringify(pkg)),
    inputHashes: Object.fromEntries(
      Object.entries(texts).map(([p, t]) => [p, hash(t)]),
    ),
    outputHashes: Object.fromEntries(
      Object.entries(output).map(([p, t]) => [p, hash(t)]),
    ),
    candidateIdMap: pkg.candidateIdMap,
    aliasChanges,
    patches,
    applied,
    conflicts,
    displayComparison,
    coverage,
    statistics: master.creators.map((c) => ({
      creatorId: c.id,
      name: c.name,
      ...creatorParticipation(c.id, songs),
      works: undefined,
    })),
    summary: {
      newCreators: master.creators.length - 91,
      creators: master.creators.length,
      nextId: master.nextId,
      blocked: pkg.candidateIdMap.filter((c) => c.status !== "READY").length,
      records: songs.length,
      works: JSON.parse(texts["data/works.json"]).works.length,
      warnings: validation.warnings.length,
      patches: patches.length,
      displayComparisons: displayComparison.length,
      conflicts: conflicts.length,
      changedFiles: Object.keys(output).filter((p) => output[p] !== texts[p])
        .length,
    },
    warnings: validation.warnings,
    output,
  };
}
export function savePlan(plan, pkg) {
  const { output, ...publicPlan } = plan;
  write("phase-b2-effective-package.json", pkg);
  write("candidate-id-map.json", pkg.candidateIdMap);
  write("apply-plan.json", publicPlan);
  write("coverage.json", plan.coverage);
  write("display-comparison.json", plan.displayComparison);
  write("unresolved-after-b2.json", pkg.excluded);
}
export function applyPlan(plan) {
  assert.equal(plan.conflicts.length, 0, "CONFLICT blocks apply");
  assert.equal(plan.summary.records, parallelReview() ? 885 : 884);
  assert.equal(plan.summary.works, 823);
  assert.equal(plan.warnings.length, 0, "Work warnings require review");
  assertResearch();
  for (const [p, h] of Object.entries(plan.inputHashes))
    assert.equal(digest(p), h, "CONFLICT source SHA " + p);
  const recomputed = createPlan(effectivePackage());
  assert.equal(
    plan.packageSha256,
    recomputed.packageSha256,
    "effective package changed",
  );
  assert.deepEqual(
    plan.outputHashes,
    recomputed.outputHashes,
    "plan was edited",
  );
  for (const [p, t] of Object.entries(plan.output))
    assert.equal(hash(t), plan.outputHashes[p], "plan output SHA");
  const changed = Object.entries(plan.output).filter(
    ([p, t]) => digest(p) !== hash(t),
  );
  if (!changed.length) return { unchanged: true, changedFiles: 0 };
  const backup = ".cache/credits-phase-b2-" + Date.now();
  fs.mkdirSync(backup, { recursive: true });
  for (const [p] of changed) {
    fs.mkdirSync(backup + "/" + p.slice(0, p.lastIndexOf("/")), {
      recursive: true,
    });
    fs.copyFileSync(p, backup + "/" + p);
  }
  fs.writeFileSync(
    backup + "/manifest.json",
    JSON.stringify(
      { inputHashes: plan.inputHashes, outputHashes: plan.outputHashes },
      null,
      2,
    ),
  );
  for (const [p, t] of changed) {
    assert.equal(
      digest(p),
      plan.inputHashes[p],
      "CONFLICT immediately before write",
    );
    fs.writeFileSync(p, t);
  }
  write("applied-relations.json", {
    version: 1,
    backup,
    inputHashes: plan.inputHashes,
    outputHashes: plan.outputHashes,
    relations: plan.applied,
    summary: plan.summary,
  });
  return {
    unchanged: false,
    changedFiles: changed.length,
    backup,
    ...plan.summary,
  };
}
export function verifyApplied() {
  const pkg = effectivePackage(),
    plan = createPlan(pkg);
  assert.equal(plan.summary.changedFiles, 0, "second apply changes source");
  assert.equal(plan.conflicts.length, 0);
  assert.equal(plan.warnings.length, 0);
  const baseline = assertResearch(),
    old = historicalJSON("data/creators.json"),
    current = read("data/creators.json");
  for (const game of ["garupa", "ournotes"]) {
    const file = "data/" + game + "/songs.json",
      prior = JSON.parse(approvedSource(historicalText(file), game)),
      now = read(file);
    verifyNonCredit(prior, now, game);
  }
  assert.equal(
    digest("data/works.json"),
    baseline.sourceHashes["data/works.json"],
  );
  for (const c of old.creators) {
    const n = current.creators.find((n) => n.id === c.id);
    assert.deepEqual({ ...n, aliases: null }, { ...c, aliases: null });
    assert.ok(c.aliases.every((a) => n.aliases.includes(a)));
  }
  const applied = read(DIRECTORY + "/applied-relations.json");
  assert.equal(
    applied.summary.displayComparisons,
    parallelReview() ? 2655 : 2652,
  );
  for (const candidate of pkg.candidateIdMap.filter(
    (c) => c.status !== "READY",
  ))
    assert.ok(!current.creators.some((c) => c.id === candidate.creatorId));
  return {
    ...plan.summary,
    secondApplyChangedFiles: 0,
    protectedResearch: Object.keys(baseline.protectedResearch).length,
    workSha256: digest("data/works.json"),
    coverage: plan.coverage,
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const mode = process.argv[2] ?? "plan";
  if (mode === "verify") console.log(JSON.stringify(verifyApplied(), null, 2));
  else {
    const pkg = effectivePackage(),
      plan = createPlan(pkg);
    if (mode === "plan") {
      const savedPlanPreserved = fs.existsSync(
        DIRECTORY + "/applied-relations.json",
      );
      if (!savedPlanPreserved) savePlan(plan, pkg);
      console.log(
        JSON.stringify({ ...plan.summary, savedPlanPreserved }, null, 2),
      );
    } else if (mode === "apply")
      console.log(JSON.stringify(applyPlan(plan), null, 2));
    else throw new Error("Use plan|apply|verify");
  }
}
