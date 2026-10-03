import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import {
  ROLES,
  keyFor,
  referenceKey,
  formatKey,
  splitCredit,
  buildIdentityResolver,
  isShortName,
} from "./creator-identity.mjs";

export const DIRECTORY = "docs/migrations/credits-phase-b1-2026-10-03";
export const PHASE_A = "docs/migrations/credits-phase-a-2026-10-03";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
export const digest = (p) =>
  crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const unique = (values) => [...new Set(values)];
const confirmedCredit = (status) =>
  ["CONFIRMED", "MULTI_SOURCE_CONFIRMED"].includes(status);
const pct = (n, d) => `${((100 * n) / d).toFixed(2)}%`;
const ref = (r) => ({
  game: r.game,
  recordId: r.recordId,
  title: r.title,
  band: r.band,
  workId: r.workId,
});
const esc = (s) =>
  String(s ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
const table = (headers, rows) =>
  `| ${headers.join(" | ")} |\n| ${headers.map(() => "---").join(" | ")} |\n${rows.map((r) => `| ${r.map(esc).join(" | ")} |`).join("\n")}\n`;
const write = (p, v) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(
    p,
    typeof v === "string" ? v : JSON.stringify(v, null, 2) + "\n",
  );
};

export function assertProtected(baseline = read(`${DIRECTORY}/baseline.json`)) {
  for (const [p, v] of Object.entries(baseline.protectedSources))
    assert.equal(
      digest(p),
      typeof v === "string" ? v : v.sha256,
      `protected source changed: ${p}`,
    );
  for (const [p, v] of Object.entries(baseline.phaseAFiles))
    assert.equal(digest(p), v, `Phase A changed: ${p}`);
  return { sources: 4, phaseAFiles: Object.keys(baseline.phaseAFiles).length };
}

export function loadInputs() {
  const baseline = read(`${DIRECTORY}/baseline.json`);
  assertProtected(baseline);
  return {
    baseline,
    phaseA: read(`${PHASE_A}/credit-research.json`),
    creators: read("data/creators.json").creators,
    humanReview: read(`${DIRECTORY}/human-review.json`),
    identityEvidence: read(`${DIRECTORY}/identity-evidence.json`),
  };
}

function sourceEvidence(record, role, raw) {
  return record.roles[role].variants
    .filter((v) => v.raw === raw)
    .map((v) => ({
      sourceUrl: v.sourceUrl,
      sourceType: "phase-a-raw",
      checkedAt: v.checkedAt,
      document: `${PHASE_A}/credit-research.json`,
      evidenceId: v.evidenceId,
      supports: `${referenceKey(record)} ${role}: ${raw}`,
      note: `原文creditとroleの証拠。単独では人物同一性を証明しない。sourceScope=${v.sourceScope}`,
    }));
}

export function buildB1({ phaseA, creators, humanReview, identityEvidence }) {
  const resolver = buildIdentityResolver(
    creators,
    identityEvidence,
    humanReview,
  );
  const mappings = new Map(),
    normalized = [],
    identities = new Map();
  const addIdentity = (t, r, role, active) => {
    let i = identities.get(t.identityKey);
    if (!i) {
      i = {
        identityKey: t.identityKey,
        candidateKey: t.candidateKey,
        existingCreatorId: t.existingCreatorId,
        standardName: t.standardName,
        type: t.type,
        typeStatus: t.typeStatus,
        aliases: [],
        aliasReviewCandidates: [],
        sortKey: t.sortKey,
        sortKeyStatus: t.sortKeyStatus,
        officialLatinName: t.officialLatinName,
        confidence: t.confidence,
        evidence: [],
        notes: [],
        rolesFound: [],
        historicalRolesFound: [],
        records: [],
        activeRecords: [],
        rawTokens: [],
        recordScopes: [],
      };
      identities.set(t.identityKey, i);
    }
    if (
      { UNRESOLVED: 0, PROBABLE: 1, CONFIRMED: 2 }[t.confidence] >
      { UNRESOLVED: 0, PROBABLE: 1, CONFIRMED: 2 }[i.confidence]
    )
      i.confidence = t.confidence;
    const variants = [
      t.raw.trim(),
      t.normalized,
      ...(t.confirmedAliases ?? []),
    ].filter((a) => a !== i.standardName);
    i.aliasReviewCandidates.push(...variants);
    if (t.confidence === "CONFIRMED") i.aliases.push(...variants);
    i.evidence.push(...t.evidence);
    i.notes.push(t.reason);
    if (active) i.rolesFound.push(role);
    else i.historicalRolesFound.push(role);
    i.records.push(referenceKey(r));
    if (active) i.activeRecords.push(referenceKey(r));
    i.rawTokens.push(t.raw);
    if (t.scopePolicy === "RECORD_SCOPED") i.recordScopes.push(referenceKey(r));
  };
  for (const r of phaseA.records) {
    const reviews = humanReview.cases.filter((h) =>
      h.recordReferences.some((x) => referenceKey(x) === referenceKey(r)),
    );
    const n = {
      ...ref(r),
      roles: {},
      composerAudit: {
        phaseA: r.composerAudit,
        currentRaw: r.currentComposerRaw,
        currentCreatorIds: r.currentComposerRelationAudit.currentCreatorIds,
        humanReviewIds: reviews.map((h) => h.id),
      },
    };
    for (const role of ROLES) {
      const a = r.roles[role],
        review = reviews.find((h) => h.roles?.[role]);
      const baselineTarget = confirmedCredit(a.evidenceStatus);
      const ownAllowed =
        role !== "arranger" || r.game !== "ournotes" || baselineTarget;
      let effective = null;
      const variantResults = [];
      for (const raw of a.rawValues) {
        const split = splitCredit(raw, creators);
        const tokens = split.creatorTokens.map((t) =>
          resolver(t, r, role, sourceEvidence(r, role, raw)),
        );
        const active = ownAllowed && baselineTarget && !review;
        const occurrence = {
          ...ref(r),
          phaseACreditStatus: a.evidenceStatus,
          baselineTarget,
          active,
          supersededByHumanReview: review?.id ?? null,
          creatorTokens: tokens,
        };
        const key = `${role}:${raw}`;
        if (!mappings.has(key))
          mappings.set(key, {
            mappingKey: `raw-${keyFor(key)}`,
            role,
            ...split,
            occurrences: [],
          });
        mappings.get(key).occurrences.push(occurrence);
        for (const t of tokens) addIdentity(t, r, role, active);
        if (a.raw === raw)
          effective = {
            rawCredit: raw,
            creatorTokens: tokens,
            splitStatus: split.status,
            splitReason: split.reason,
          };
        variantResults.push({
          rawCredit: raw,
          creatorTokens: tokens,
          splitStatus: split.status,
          splitReason: split.reason,
        });
      }
      if (
        !effective &&
        baselineTarget &&
        variantResults.length &&
        variantResults.every(
          (v) =>
            v.creatorTokens.length &&
            v.creatorTokens.every((t) => t.confidence === "CONFIRMED") &&
            ["CONFIRMED_SINGLE", "CONFIRMED_SPLIT"].includes(v.splitStatus),
        )
      ) {
        const sets = variantResults.map((v) =>
          JSON.stringify(
            unique(v.creatorTokens.map((t) => t.identityKey)).sort(),
          ),
        );
        if (unique(sets).length === 1)
          effective = {
            ...variantResults[0],
            equivalentRawVariants: variantResults.map((v) => v.rawCredit),
            splitReason:
              "各原文variantを個別同定し、同じidentity集合を確認。代表rawを選び原文全variantを別欄保持。",
          };
      }
      let humanEvidence = null;
      if (review) {
        humanEvidence = review.evidence;
        const tokens = review.roles[role].map((raw) =>
          resolver({ raw, normalized: raw, affiliation: null }, r, role, [
            review.evidence,
          ]),
        );
        for (const t of tokens) addIdentity(t, r, role, ownAllowed);
        effective = {
          rawCredit: review.roles[role].join("、"),
          creatorTokens: tokens,
          splitStatus:
            tokens.length > 1 ? "CONFIRMED_SPLIT" : "CONFIRMED_SINGLE",
          splitReason: review.reason,
        };
      }
      const creditConfirmed = !!review || confirmedCredit(a.evidenceStatus);
      const target = ownAllowed && creditConfirmed;
      const resolved =
        target &&
        effective?.creatorTokens.length > 0 &&
        effective.creatorTokens.every((t) => t.confidence === "CONFIRMED") &&
        ["CONFIRMED_SINGLE", "CONFIRMED_SPLIT"].includes(effective.splitStatus);
      n.roles[role] = {
        phaseA: {
          raw: a.raw,
          rawValues: a.rawValues,
          evidenceStatus: a.evidenceStatus,
          reason: a.reason,
          sourceUrls: a.sourceUrls,
        },
        effective: effective ?? {
          rawCredit: null,
          creatorTokens: [],
          splitStatus: "UNRESOLVED",
          splitReason: a.reason,
        },
        baselineTarget,
        target,
        creditConfirmed,
        creatorResolved: !!resolved,
        resolvedBy: review ? "human-review" : null,
        humanReviewId: review?.id ?? null,
        humanEvidence,
        excludedReason: !ownAllowed
          ? "OurNotes発売版の編曲をゲーム版へ適用しない"
          : !creditConfirmed
            ? "credit自体未確定"
            : !resolved
              ? "splitまたはidentityが未確定"
              : null,
      };
    }
    normalized.push(n);
  }
  const rawMap = [...mappings.values()].sort((a, b) =>
    a.mappingKey.localeCompare(b.mappingKey),
  );
  const identityIndex = [...identities.values()]
    .map((i) => {
      const refs = unique(i.records),
        active = unique(i.activeRecords);
      const latin = i.officialLatinName;
      const slug =
        latin
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") ||
        `creator-candidate-${keyFor(i.identityKey)}`;
      return {
        ...i,
        aliases: unique(i.aliases).sort(),
        aliasReviewCandidates: unique(i.aliasReviewCandidates)
          .filter((a) => !i.aliases.includes(a))
          .sort(),
        rolesFound: unique(i.rolesFound).sort(),
        historicalRolesFound: unique(i.historicalRolesFound).sort(),
        records: refs.sort(),
        activeRecords: active.sort(),
        recordCount: refs.length,
        WorkCount: unique(
          refs.map(
            (k) => normalized.find((r) => referenceKey(r) === k)?.workId,
          ),
        ).length,
        rawTokens: unique(i.rawTokens).sort(),
        recordScopes: unique(i.recordScopes).sort(),
        notes: unique(i.notes),
        evidence: unique(i.evidence.map((e) => JSON.stringify(e))).map((s) =>
          JSON.parse(s),
        ),
        slugCandidate: slug,
        slugStatus: latin ? "primary-official-latin" : "provisional-stable-key",
        mergeStatus:
          i.confidence === "CONFIRMED"
            ? "evidence-confirmed"
            : "provisional-candidate-group",
      };
    })
    .sort(
      (a, b) =>
        b.recordCount - a.recordCount ||
        b.WorkCount - a.WorkCount ||
        a.standardName.localeCompare(b.standardName, "ja"),
    );
  const newCandidates = identityIndex.filter((i) => !i.existingCreatorId);
  const existing = identityIndex.filter((i) => i.existingCreatorId);
  const occurrenceTokens = rawMap.flatMap((x) =>
    x.occurrences.flatMap((o) => o.creatorTokens),
  );
  const roleCoverage = (game, role) => {
    const targets = normalized.filter(
      (r) => (!game || r.game === game) && r.roles[role].baselineTarget,
    );
    const resolved = targets.filter(
      (r) => r.roles[role].creatorResolved,
    ).length;
    return {
      confirmedCredit: targets.length,
      allCreatorResolved: resolved,
      rate: pct(resolved, targets.length),
      unresolved: targets
        .filter((r) => !r.roles[role].creatorResolved)
        .map(ref),
      humanAdditional: normalized
        .filter(
          (r) =>
            (!game || r.game === game) &&
            r.roles[role].target &&
            !r.roles[role].baselineTarget,
        )
        .map(ref),
    };
  };
  const coverage = {
    phaseAUniqueRaw: unique(rawMap.map((x) => x.rawCredit)).length,
    rawRoleMappings: rawMap.length,
    uniqueTokenStrings: unique(identityIndex.flatMap((x) => x.rawTokens))
      .length,
    tokenOccurrences: rawMap.reduce(
      (s, x) =>
        s + x.occurrences.reduce((s, o) => s + o.creatorTokens.length, 0),
      0,
    ),
    splitConfirmed: rawMap.filter((x) => x.status === "CONFIRMED_SPLIT").length,
    tokenizedRaw: unique(
      rawMap
        .filter((x) => x.status !== "SUPERSEDED_ROLE_ERROR")
        .map((x) => x.rawCredit),
    ).length,
    splitReviewRaw: unique(
      rawMap
        .filter((x) => x.status === "REVIEW_RECOMMENDED")
        .map((x) => x.rawCredit),
    ).length,
    supersededRoleErrorRaw: unique(
      rawMap
        .filter((x) => x.status === "SUPERSEDED_ROLE_ERROR")
        .map((x) => x.rawCredit),
    ).length,
    existingConfirmedRaw: unique(
      rawMap
        .filter((x) =>
          x.occurrences.some(
            (o) =>
              o.creatorTokens.length &&
              o.creatorTokens.every(
                (t) => t.confidence === "CONFIRMED" && t.existingCreatorId,
              ),
          ),
        )
        .map((x) => x.rawCredit),
    ).length,
    existingCreatorIds: existing.filter((x) => x.confidence === "CONFIRMED")
      .length,
    existingTokenStrings: unique(existing.flatMap((x) => x.rawTokens)).length,
    newCandidateRaw: unique(
      rawMap
        .filter((x) =>
          x.occurrences.some((o) =>
            o.creatorTokens.some((t) => t.candidateKey),
          ),
        )
        .map((x) => x.rawCredit),
    ).length,
    newCandidates: newCandidates.length,
    newConfirmed: newCandidates.filter((x) => x.confidence === "CONFIRMED")
      .length,
    newProbable: newCandidates.filter((x) => x.confidence === "PROBABLE")
      .length,
    newUnresolved: newCandidates.filter((x) => x.confidence === "UNRESOLVED")
      .length,
    aliasMergedVariants: identityIndex.reduce(
      (s, x) => s + x.aliases.length,
      0,
    ),
    affiliationTokens: rawMap
      .flatMap((x) => x.occurrences.flatMap((o) => o.creatorTokens))
      .filter((x) => x.affiliation).length,
    affiliationUniqueVariants: unique(
      rawMap.flatMap((x) =>
        x.creatorTokens.filter((t) => t.affiliation).map((t) => t.raw),
      ),
    ).length,
    recordScopedTokenMappings: rawMap
      .flatMap((x) => x.occurrences.flatMap((o) => o.creatorTokens))
      .filter((t) => t.applicability === "RECORD_SCOPED").length,
    globalTokenMappings: rawMap
      .flatMap((x) => x.occurrences.flatMap((o) => o.creatorTokens))
      .filter((t) => t.applicability === "GLOBAL_CONFIRMED").length,
    lyricist: roleCoverage(null, "lyricist"),
    garupaArranger: roleCoverage("garupa", "arranger"),
    ournotesArranger: roleCoverage("ournotes", "arranger"),
    tokenIdentityConfidence: Object.fromEntries(
      ["CONFIRMED", "PROBABLE", "UNRESOLVED"].map((c) => [
        c,
        identityIndex.filter((x) => x.confidence === c).length,
      ]),
    ),
  };
  const proposals = {
    version: 1,
    phase: "B2-proposal-only",
    allocateFormalIds: false,
    apply: false,
    inputs: {
      phaseA: PHASE_A,
      humanReview: `${DIRECTORY}/human-review.json`,
      identityResearch: `${DIRECTORY}/identity-evidence.json`,
    },
    confirmedRawMapping: [],
    proposedNewCreators: newCandidates
      .filter((i) => i.confidence === "CONFIRMED" && i.activeRecords.length)
      .map((i) => ({ ...i, id: null })),
    aliases: identityIndex
      .filter((i) => i.confidence === "CONFIRMED")
      .map((i) => ({ identityKey: i.identityKey, aliases: i.aliases })),
    displayOverrideCandidates: [],
    lyricistRelations: [],
    garupaArrangerRelations: [],
    ournotesArrangerRelations: [],
    composerCorrections: [],
    unresolvedExclusions: [],
  };
  coverage.splitConfirmedRaw = unique(
    rawMap
      .filter((x) => x.status === "CONFIRMED_SPLIT")
      .map((x) => x.rawCredit),
  ).length;
  coverage.newActiveCandidates = newCandidates.filter(
    (i) => i.activeRecords.length,
  ).length;
  coverage.rawTokenConfidence = Object.fromEntries(
    ["CONFIRMED", "PROBABLE", "UNRESOLVED"].map((c) => [
      c,
      occurrenceTokens.filter((t) => t.confidence === c).length,
    ]),
  );
  coverage.recordScopedPolicyTokens = occurrenceTokens.filter(
    (t) => t.scopePolicy === "RECORD_SCOPED",
  ).length;
  coverage.newCandidateScopeNote =
    "全3roleの原文（非確定・発売版参考を含む）と6human追加の候補群。未確定の形式差groupは仮統合で、確定人数を意味しない。";
  for (const r of normalized)
    for (const role of ROLES) {
      const v = r.roles[role];
      const row = {
        ...ref(r),
        role,
        rawCredit: v.effective.rawCredit,
        normalizedTokens: v.effective.creatorTokens,
        splitStatus: v.effective.splitStatus,
        resolvedBy: v.resolvedBy,
        humanReviewId: v.humanReviewId,
        preserveLegacyDisplay: true,
      };
      if (v.creatorResolved) {
        proposals.confirmedRawMapping.push({
          ...row,
          applicability: row.normalizedTokens.some(
            (t) => t.applicability === "RECORD_SCOPED",
          )
            ? "RECORD_SCOPED"
            : "GLOBAL_CONFIRMED",
        });
        if (role === "lyricist") proposals.lyricistRelations.push(row);
        if (role === "arranger")
          (r.game === "garupa"
            ? proposals.garupaArrangerRelations
            : proposals.ournotesArrangerRelations
          ).push(row);
      } else
        proposals.unresolvedExclusions.push({
          ...ref(r),
          role,
          category: !v.target
            ? "A_CREDIT_UNCONFIRMED"
            : v.effective.splitStatus === "REVIEW_RECOMMENDED"
              ? "C_SPLIT_UNCONFIRMED"
              : "B_IDENTITY_UNCONFIRMED",
          reason: v.excludedReason,
          tokens: row.normalizedTokens.map((t) => ({
            identityKey: t.identityKey,
            confidence: t.confidence,
            reason: t.reason,
          })),
        });
    }
  const composerReview = [];
  for (const h of humanReview.cases)
    for (const rr of h.recordReferences) {
      const r = normalized.find((r) => referenceKey(r) === referenceKey(rr));
      const v = r.roles.composer;
      const ids = v.effective.creatorTokens.map((t) => t.identityKey);
      const current = r.composerAudit.currentCreatorIds;
      let action = "KEEP_CURRENT";
      if (h.id === "human-sasunso" || h.id === "human-symbol-earth")
        action = "SUPPLEMENT_CURRENT_MISSING";
      if (h.id === "human-samfree") action = "ADD_RELATION_PRESERVE_DISPLAY";
      if (h.id === "human-carnation" && ids.some((id) => !current.includes(id)))
        action = "SUPPLEMENT_CONFIRMED_IDENTITY";
      const audit = {
        ...ref(r),
        humanReviewId: h.id,
        phaseAClassification: r.composerAudit.phaseA,
        currentRaw: r.composerAudit.currentRaw,
        normalizedComposerTokens: v.effective.creatorTokens,
        normalizedArrangerTokens: r.roles.arranger.effective.creatorTokens,
        resolvedBy: "human-review",
        action,
        note: h.reason,
        evidence: h.evidence,
      };
      composerReview.push(audit);
      if (action !== "KEEP_CURRENT" && v.creatorResolved)
        proposals.composerCorrections.push({
          ...audit,
          preserveLegacyDisplay: true,
          allowDeletion: false,
        });
    }
  proposals.displayOverrideCandidates.push({
    game: "garupa",
    recordId: 249,
    role: "composer",
    rawCredit: "SAM(samfree)",
    displayOverrideCandidate: "SAM(samfree)",
    identityKey: `b1-${keyFor(formatKey("samfree"))}`,
    sourceType: "human-review",
  });
  const unconfirmed = {
    lyricist: normalized
      .filter((r) => !r.roles.lyricist.baselineTarget)
      .map((r) => ({
        ...ref(r),
        status: r.roles.lyricist.phaseA.evidenceStatus,
        reason: r.roles.lyricist.phaseA.reason,
        b1ResolvedBy: r.roles.lyricist.resolvedBy,
      })),
    garupaArranger: normalized
      .filter((r) => r.game === "garupa" && !r.roles.arranger.baselineTarget)
      .map((r) => ({
        ...ref(r),
        status: r.roles.arranger.phaseA.evidenceStatus,
        reason: r.roles.arranger.phaseA.reason,
        b1ResolvedBy: r.roles.arranger.resolvedBy,
      })),
    ournotesArranger: normalized
      .filter((r) => r.game === "ournotes" && !r.roles.arranger.baselineTarget)
      .map((r) => ({
        ...ref(r),
        releaseVersionRaw: r.roles.arranger.phaseA.rawValues,
        currentEvidence: r.roles.arranger.phaseA,
        gameDisplayInput: null,
        checked: false,
        checkedAt: null,
        sourceNote: null,
      })),
  };
  return {
    rawMap,
    normalized,
    identityIndex,
    newCandidates,
    existing,
    coverage,
    proposals,
    composerReview,
    unconfirmed,
  };
}

export function verifyB1(data, inputs) {
  const {
    rawMap,
    normalized,
    identityIndex,
    newCandidates,
    proposals,
    coverage,
    unconfirmed,
  } = data;
  assert.equal(normalized.length, 884);
  assert.equal(new Set(normalized.map(referenceKey)).size, 884);
  assert.equal(coverage.phaseAUniqueRaw, 524);
  assert.equal(coverage.lyricist.confirmedCredit, 834);
  assert.equal(coverage.garupaArranger.confirmedCredit, 749);
  assert.equal(coverage.ournotesArranger.confirmedCredit, 5);
  assert.equal(unconfirmed.lyricist.length, 50);
  assert.equal(unconfirmed.garupaArranger.length, 50);
  assert.equal(unconfirmed.ournotesArranger.length, 80);
  assert.equal(
    new Set(identityIndex.map((i) => i.identityKey)).size,
    identityIndex.length,
  );
  assert.equal(
    new Set(newCandidates.map((i) => formatKey(i.standardName))).size,
    newCandidates.length,
  );
  const knownIds = new Set(inputs.creators.map((c) => c.id)),
    knownKeys = new Set(identityIndex.map((i) => i.identityKey));
  for (const r of inputs.phaseA.records)
    for (const role of ROLES)
      for (const raw of r.roles[role].rawValues)
        assert.ok(
          rawMap.some(
            (x) =>
              x.rawCredit === raw &&
              x.role === role &&
              x.occurrences.some((o) => referenceKey(o) === referenceKey(r)),
          ),
          `missing raw ${referenceKey(r)} ${role}`,
        );
  for (const x of rawMap) {
    assert.ok(x.status && x.reason);
    for (const o of x.occurrences)
      for (const t of o.creatorTokens) {
        assert.ok(
          ["CONFIRMED", "PROBABLE", "UNRESOLVED"].includes(t.confidence),
        );
        assert.ok(knownKeys.has(t.identityKey));
        if (t.existingCreatorId) assert.ok(knownIds.has(t.existingCreatorId));
        assert.equal(t.affiliationParticipation, false);
        for (const e of t.evidence)
          for (const k of [
            "sourceUrl",
            "sourceType",
            "checkedAt",
            "supports",
            "note",
          ])
            assert.ok(Object.hasOwn(e, k));
      }
  }
  for (const r of normalized)
    for (const role of ROLES) {
      const v = r.roles[role];
      if (v.creatorResolved) {
        assert.ok(v.target);
        assert.ok(v.effective.creatorTokens.length);
        assert.ok(
          v.effective.creatorTokens.every((t) => t.confidence === "CONFIRMED"),
        );
        assert.ok(
          !["REVIEW_RECOMMENDED", "SUPERSEDED_ROLE_ERROR"].includes(
            v.effective.splitStatus,
          ),
        );
      }
    }
  for (const p of proposals.confirmedRawMapping) {
    assert.ok(
      p.normalizedTokens.length &&
        p.normalizedTokens.every((t) => t.confidence === "CONFIRMED"),
    );
    assert.ok(["CONFIRMED_SPLIT", "CONFIRMED_SINGLE"].includes(p.splitStatus));
    for (const t of p.normalizedTokens) {
      assert.ok(knownKeys.has(t.identityKey));
      if (isShortName(t.standardName))
        assert.equal(t.scopePolicy, "RECORD_SCOPED");
      if (t.scopePolicy === "RECORD_SCOPED") {
        assert.equal(t.recordScope, referenceKey(p));
        assert.equal(t.applicability, "RECORD_SCOPED");
      }
      assert.ok(
        t.evidence.some(
          (e) =>
            e.sourceType === "existing-creator-db" ||
            e.sourceType === "human-review" ||
            e.pageReadStatus === "BODY_READ",
        ),
      );
    }
  }
  for (const i of identityIndex) {
    assert.ok(["person", "unit", "organization"].includes(i.type));
    assert.ok(
      i.standardName &&
        i.sortKey &&
        i.slugCandidate &&
        i.sortKeyStatus &&
        i.slugStatus,
    );
    assert.ok(Array.isArray(i.aliases));
  }
  for (const i of proposals.proposedNewCreators) {
    assert.equal(i.confidence, "CONFIRMED");
    assert.equal(i.id, null);
    assert.ok(knownKeys.has(i.identityKey));
  }
  assert.ok(
    proposals.ournotesArrangerRelations.every(
      (p) =>
        normalized.find((r) => referenceKey(r) === referenceKey(p)).roles
          .arranger.baselineTarget,
    ),
  );
  assert.ok(
    !proposals.composerCorrections.some(
      (p) => p.game === "ournotes" && p.recordId === 75,
    ),
  );
  for (const id of [176, 218, 738]) {
    const r = normalized.find((r) => r.game === "garupa" && r.recordId === id);
    assert.deepEqual(
      r.roles.composer.effective.creatorTokens.map((t) => t.standardName),
      ["末益涼太"],
    );
    assert.deepEqual(
      r.roles.arranger.effective.creatorTokens.map((t) => t.standardName),
      ["竹田祐介"],
    );
  }
  const mela = normalized.find(
    (r) => r.game === "ournotes" && r.recordId === 75,
  );
  assert.deepEqual(
    mela.roles.composer.effective.creatorTokens.map((t) => t.standardName),
    ["peppe", "穴見真吾"],
  );
  assert.deepEqual(
    mela.roles.lyricist.effective.creatorTokens.map((t) => t.standardName),
    ["長屋晴子", "小林壱誓"],
  );
  assert.ok(
    !newCandidates.some((c) =>
      inputs.creators.some((e) => e.name === c.standardName),
    ),
  );
  assert.ok(newCandidates.every((i) => !i.id && !i.creatorId));
  return {
    records: 884,
    uniqueWorkReferences: new Set(normalized.map((r) => r.workId)).size,
    identities: identityIndex.length,
    proposals: proposals.confirmedRawMapping.length,
    rawRoleMappings: rawMap.length,
  };
}

export function renderArtifacts(data, inputs) {
  const {
    rawMap,
    normalized,
    identityIndex,
    newCandidates,
    existing,
    coverage,
    proposals,
    composerReview,
    unconfirmed,
  } = data;
  const listing = (title, rows) =>
    `# ${title}\n\nPhase Aのbaseline未確定一覧。B1人間解消は別欄で追跡する。\n\n${table(
      ["game", "ID", "title", "band", "workId", "status", "reason", "B1 human"],
      rows.map((r) => [
        r.game,
        r.recordId,
        r.title,
        r.band,
        r.workId,
        r.status,
        r.reason,
        r.b1ResolvedBy,
      ]),
    )}`;
  const identityTable = (rows) =>
    table(
      [
        "candidate / ID",
        "standardName",
        "record",
        "Work",
        "roles",
        "confidence",
        "reason",
      ],
      rows.map((i) => [
        i.identityKey,
        i.standardName,
        i.recordCount,
        i.WorkCount,
        i.rolesFound.join(", "),
        i.confidence,
        i.notes.join(" "),
      ]),
    );
  const splitReview = rawMap.filter((x) => x.status === "REVIEW_RECOMMENDED");
  const uncertain = identityIndex.filter((i) => i.confidence !== "CONFIRMED");
  const uncertainOccurrences = rawMap.flatMap((x) =>
    x.occurrences.flatMap((o) =>
      o.creatorTokens
        .filter((t) => t.confidence !== "CONFIRMED")
        .map((t) => ({ raw: x.rawCredit, role: x.role, ...ref(o), token: t })),
    ),
  );
  const sourceIndex = {
    checkedAt: "2026-10-03",
    sources: unique(
      identityIndex
        .flatMap((i) => i.evidence)
        .filter((e) => e.pageReadStatus === "BODY_READ")
        .map((e) => JSON.stringify(e)),
    ).map((x) => JSON.parse(x)),
    failedAttempts: inputs.identityEvidence.attempts,
  };
  return {
    "raw-token-map.json": rawMap,
    "normalized-records.json": normalized,
    "creator-identity-research.json": identityIndex,
    "creator-candidates.json": newCandidates,
    "existing-creator-matches.json": existing,
    "coverage.json": coverage,
    "phase-b2-package.json": proposals,
    "composer-corrections.json": composerReview,
    "unconfirmed-credits.json": unconfirmed,
    "manual-arranger-review.json": unconfirmed.ournotesArranger,
    "identity-source-index.json": sourceIndex,
    "uncertain-token-occurrences.json": uncertainOccurrences,
    "split-review.md": `# Split review\n\n有限の明示reviewと候補regex splitを分離。記号だけの候補はB2から除外する。原文はraw-token-map.jsonにrole/record別保存。\n\n${table(
      ["role", "rawCredit", "status", "candidate tokens", "reason"],
      splitReview.map((x) => [
        x.role,
        x.rawCredit,
        x.status,
        x.creatorTokens.map((t) => t.normalized).join(" / "),
        x.reason,
      ]),
    )}\n所属単独credit Elements Gardenは既存organization cr-0002として保持。Spirit Gardenは別制作ブランド。会社括弧は個人tokenのaffiliationであり参加を二重計上しない。\n`,
    "unresolved-creators.md": `# Creator未確定一覧\n\nPROBABLE/UNRESOLVEDはすべてB2自動適用から除外する。型・形式差groupは暫定。記号付き団体名の確定splitは禁止。\n\n## PROBABLE 全件\n\n${identityTable(uncertain.filter((i) => i.confidence === "PROBABLE"))}\n## UNRESOLVED 全件（低頻度も含む）\n\n${identityTable(uncertain.filter((i) => i.confidence === "UNRESOLVED"))}\n## 確定creditでCreator未解決 全record-role\n\n${table(
      ["game", "ID", "title", "role", "reason"],
      proposals.unresolvedExclusions
        .filter((x) => x.category !== "A_CREDIT_UNCONFIRMED")
        .map((x) => [x.game, x.recordId, x.title, x.role, x.reason]),
    )}\n`,
    "lyricist-unconfirmed.md": listing("作詞未確定50件", unconfirmed.lyricist),
    "garupa-arranger-unconfirmed.md": listing(
      "Garupa編曲未確定50件",
      unconfirmed.garupaArranger,
    ),
    "ournotes-arranger-manual-review.md": `# OurNotesゲーム版編曲 手動確認80件\n\n発売版rawは参考資料。ゲーム版へ適用しない。JSONのgameDisplayInput・checkedAt・sourceNoteへゲーム内原文を入力できる。checkedをtrueにするには原文と確認日が必要。\n\n${table(
      [
        "ID",
        "title",
        "band",
        "workId",
        "発売版raw",
        "current evidence",
        "arranger(game display)",
        "checked",
        "確認日・根拠",
      ],
      unconfirmed.ournotesArranger.map((r) => [
        r.recordId,
        r.title,
        r.band,
        r.workId,
        r.releaseVersionRaw.join(" / "),
        r.currentEvidence.evidenceStatus,
        "",
        "[ ]",
        "",
      ]),
    )}`,
    "composer-corrections.md": `# B1 composer audit補正\n\nPhase Aは変更せずhuman-reviewを別資料へ反映。全${composerReview.length}record、適用候補${proposals.composerCorrections.length}record。Mela現composerは正しくKEEP_CURRENT。竹田は編曲だけ。正式writeは行わない。\n\n${table(
      [
        "game",
        "ID",
        "title",
        "Phase A",
        "normalized composer",
        "action",
        "human case",
      ],
      composerReview.map((r) => [
        r.game,
        r.recordId,
        r.title,
        r.phaseAClassification,
        r.normalizedComposerTokens.map((t) => t.standardName).join(" / "),
        r.action,
        r.humanReviewId,
      ]),
    )}`,
    "README.md": `# Phase B1 Creator identity normalization\n\n正本入力は変更しないPhase A（${PHASE_A}）、baseline.json、human-review.json、identity-evidence.json。\n\n再生成：\n\n\`node scripts/research/credits-phase-b1.mjs generate\`\n\n検証：\n\n\`node scripts/research/credits-phase-b1.mjs verify\`\n\nraw-token-mapはraw+roleにoccurrencesを持ち、元原文と暫定splitを保存。normalized-recordsは人間override後のrecord、creator-identity-researchはrole横断identity index。CONFIRMEDでも短名はrecord scopeを持つ。candidateKeyは正式IDではない。\n\nB2はphase-b2-package.jsonのrecord別CONFIRMEDだけを扱う。新Creatorはid=null、既存IDは固定、未確定除外を必ず読む。raw単位で短名を全recordにglobal解決しない。displayOverrideCandidatesを含め旧表示を保存する。aliasは実raw/一次活動名のみ。所属は参加ではない。OurNotes編曲は5baselineだけ。公開役割coverageはunprepared/ready/unpreparedのまま。\n\nPhase B1はsongs/master/Work/UI write0、commit/push/deploy0。検証結果と54項目はPHASE_B1_REPORT.md・verification.jsonへ保存。\n`,
  };
}

export function generate(outputDirectory = DIRECTORY) {
  const out = path
    .relative(process.cwd(), path.resolve(outputDirectory))
    .replaceAll("\\", "/");
  assert.ok(
    out === DIRECTORY || out.startsWith(".cache/"),
    "Research output must stay in B1 directory or workspace .cache",
  );
  const inputs = loadInputs(),
    data = buildB1(inputs);
  const result = verifyB1(data, inputs);
  const artifacts = renderArtifacts(data, inputs);
  for (const [name, value] of Object.entries(artifacts))
    write(`${outputDirectory}/${name}`, value);
  assertProtected(inputs.baseline);
  return {
    ...result,
    artifacts: Object.keys(artifacts),
    coverage: data.coverage,
  };
}

export function verifySaved() {
  const inputs = loadInputs(),
    data = buildB1(inputs);
  const result = verifyB1(data, inputs);
  for (const [name, v] of Object.entries(renderArtifacts(data, inputs)))
    assert.equal(
      fs.readFileSync(`${DIRECTORY}/${name}`, "utf8"),
      typeof v === "string" ? v : JSON.stringify(v, null, 2) + "\n",
      `generated artifact drift ${name}`,
    );
  return { ...result, protected: assertProtected(inputs.baseline) };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const mode = process.argv[2] ?? "verify";
  const result =
    mode === "generate"
      ? generate(process.argv[3] ?? DIRECTORY)
      : mode === "verify"
        ? verifySaved()
        : null;
  assert.ok(
    result,
    "Usage: credits-phase-b1.mjs generate|verify [output directory]",
  );
  const { coverage, ...summary } = result;
  console.log(
    JSON.stringify(
      {
        ...summary,
        ...(coverage
          ? {
              coverage: {
                phaseAUniqueRaw: coverage.phaseAUniqueRaw,
                newCandidates: coverage.newCandidates,
                newConfirmed: coverage.newConfirmed,
                newProbable: coverage.newProbable,
                newUnresolved: coverage.newUnresolved,
                lyricist: {
                  ...coverage.lyricist,
                  unresolved: coverage.lyricist.unresolved.length,
                  humanAdditional: coverage.lyricist.humanAdditional.length,
                },
                garupaArranger: {
                  ...coverage.garupaArranger,
                  unresolved: coverage.garupaArranger.unresolved.length,
                  humanAdditional:
                    coverage.garupaArranger.humanAdditional.length,
                },
                ournotesArranger: {
                  ...coverage.ournotesArranger,
                  unresolved: coverage.ournotesArranger.unresolved.length,
                  humanAdditional:
                    coverage.ournotesArranger.humanAdditional.length,
                },
              },
            }
          : {}),
      },
      null,
      2,
    ),
  );
}
