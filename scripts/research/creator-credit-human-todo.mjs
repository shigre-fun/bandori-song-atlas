import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  creditText,
  creditTokens,
  CREDIT_ROLES,
} from "../../src/js/credit-display.js";
import {
  formatKey,
  isShortName,
  separateAffiliation,
} from "./creator-identity.mjs";

export const OUTPUT = "docs/todo/creator-credit-human-review";
const P0_REVIEW = "docs/human-review/creator-credits-p0-2026-10-06/review.json";
const KANZAKI_REVIEW =
  "docs/human-review/creator-kanzaki-2026-10-06/review.json";
const KANOW_REVIEW =
  "docs/human-review/creator-kanow-p1-2026-10-07/review.json";
const P2_REVIEW = "docs/human-review/creator-credits-p2-2026-10-10/review.json";
const A = "docs/migrations/credits-phase-a-2026-10-03";
const B1 = "docs/migrations/credits-phase-b1-2026-10-03";
const B2 = "docs/migrations/credits-phase-b2-2026-10-03";
export const DATA_FILES = [
  "data/creators.json",
  "data/works.json",
  "data/garupa/songs.json",
  "data/ournotes/songs.json",
];
export const CATEGORIES = {
  CREDIT_COLLECTION: "担当credit原文の収集",
  CREATOR_IDENTITY: "credit主体の同定",
  CREATOR_REGISTRATION: "未登録主体の登録情報の決定",
  SPLIT_REVIEW: "作者境界・共同credit・順序の確認",
  ALIAS_REVIEW: "既存Creatorとの表記同一性の確認",
  ROLE_REVIEW: "対象曲・版・担当の一次資料照合",
  DISPLAY_REVIEW: "既存表示と確認した原文の差の判断",
  GAME_VERSION_REVIEW: "発売版とゲーム版の関係の確認",
  METADATA_REVIEW: "公開に影響しない登録情報の改善",
};
const LABELS = { lyricist: "作詞", composer: "作曲", arranger: "編曲" };
const GAME = { garupa: "Garupa", ournotes: "OurNotes" };
const hash = (v) => crypto.createHash("sha256").update(v).digest("hex");
const uniq = (xs) => [...new Set(xs)];
const ref = (r) => `${r.game}:${r.recordId}`;
const roleRef = (r, role) => `${ref(r)}:${role}`;
const priorityMin = (xs) => xs.slice().sort()[0] ?? "P4";
const ordering = (a, b) =>
  a.priority.localeCompare(b.priority) ||
  a.game.localeCompare(b.game) ||
  a.recordId - b.recordId;
const candidateOrdering = (a, b) =>
  a.priority.localeCompare(b.priority) ||
  b.affectedRecordCount - a.affectedRecordCount ||
  a.standardNameCandidate.localeCompare(b.standardNameCandidate, "ja") ||
  a.candidateKey.localeCompare(b.candidateKey);
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const digestFiles = (ps) =>
  Object.fromEntries(ps.map((p) => [p, hash(fs.readFileSync(p))]));

export function loadInputs() {
  const paths = [
    ...DATA_FILES,
    `${A}/credit-research.json`,
    `${A}/unresolved.json`,
    `${A}/composer-audit.json`,
    ...[
      "lyricist-unconfirmed.md",
      "garupa-arranger-unconfirmed.md",
      "ournotes-arranger-manual-review.md",
      "manual-arranger-review.json",
      "unresolved-creators.md",
      "uncertain-token-occurrences.json",
      "split-review.md",
      "creator-candidates.json",
      "creator-identity-research.json",
      "normalized-records.json",
      "raw-token-map.json",
      "unconfirmed-credits.json",
    ].map((p) => `${B1}/${p}`),
    ...[
      "unresolved-after-b2.json",
      "unresolved-index.json",
      "applied-relations.json",
      "phase-b2-effective-package.json",
      "coverage.json",
      "PHASE_B2_REPORT.md",
      "CREATOR_CREDITS_RELEASE_REPORT.md",
      "baseline.json",
    ].map((p) => `${B2}/${p}`),
    "docs/migrations/creators-2026-10-02/creator-review.json",
  ];
  if (fs.existsSync(P0_REVIEW)) paths.push(P0_REVIEW);
  if (fs.existsSync(KANZAKI_REVIEW)) paths.push(KANZAKI_REVIEW);
  if (fs.existsSync(KANOW_REVIEW)) paths.push(KANOW_REVIEW);
  if (fs.existsSync(P2_REVIEW)) paths.push(P2_REVIEW);
  const inputHashes = digestFiles(paths);
  const baseline = readJSON(`${B2}/baseline.json`);
  const protectedResearchHashes = digestFiles(
    Object.keys(baseline.protectedResearch),
  );
  assert.deepEqual(
    protectedResearchHashes,
    baseline.protectedResearch,
    "Immutable A/B1 evidence",
  );
  const input = {
    inputHashes,
    protectedResearchHashes,
    head: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
    master: readJSON(DATA_FILES[0]),
    works: readJSON(DATA_FILES[1]),
    games: Object.fromEntries(
      ["garupa", "ournotes"].map((game) => [
        game,
        readJSON(`data/${game}/songs.json`),
      ]),
    ),
    phaseA: readJSON(`${A}/credit-research.json`).records,
    composerAudit: readJSON(`${A}/composer-audit.json`),
    identities: readJSON(`${B1}/creator-identity-research.json`),
    rawMap: readJSON(`${B1}/raw-token-map.json`),
    manual: readJSON(`${B1}/manual-arranger-review.json`),
    unconfirmed: readJSON(`${B1}/unconfirmed-credits.json`),
    uncertain: readJSON(`${B1}/uncertain-token-occurrences.json`),
    b1Candidates: readJSON(`${B1}/creator-candidates.json`),
    effective: readJSON(`${B2}/phase-b2-effective-package.json`),
    unresolved: readJSON(`${B2}/unresolved-after-b2.json`),
    unresolvedIndex: readJSON(`${B2}/unresolved-index.json`),
    legacy: readJSON("docs/migrations/creators-2026-10-02/creator-review.json"),
  };
  input.humanReview = fs.existsSync(P0_REVIEW) ? readJSON(P0_REVIEW) : null;
  input.humanRegistration = fs.existsSync(KANZAKI_REVIEW)
    ? readJSON(KANZAKI_REVIEW)
    : null;
  input.kanowRegistration = fs.existsSync(KANOW_REVIEW)
    ? readJSON(KANOW_REVIEW)
    : null;
  input.p2Review = fs.existsSync(P2_REVIEW) ? readJSON(P2_REVIEW) : null;
  return input;
}

function reviewedRole(input, r, role) {
  const prior = input.humanReview?.reviews.find(
    (a) =>
      ref(a) === ref(r) &&
      a.role === role &&
      a.title === r.title &&
      a.workId === r.workId,
  );
  const p2 = input.p2Review?.reviews.find(
    (a) =>
      ref(a) === ref(r) &&
      a.role === role &&
      a.title === r.title &&
      a.workId === r.workId &&
      a.raw === r.song[role],
  );
  if (p2)
    return {
      ...p2,
      requiresVersionReview: needsVersion(prior),
      relationshipStatus: prior?.relationshipStatus,
      relationshipAnswer: prior?.relationshipAnswer,
    };
  const review = input.humanReview?.reviews.find(
    (a) =>
      ref(a) === ref(r) &&
      a.role === role &&
      a.title === r.title &&
      a.workId === r.workId,
  );
  return review && review.raw === r.song[role] ? review : null;
}
function reviewedModel(input, r, role) {
  const review = reviewedRole(input, r, role);
  return review
    ? {
        rawCredit: review.raw,
        creatorTokens: review.actors,
        splitStatus:
          review.reviewKind === "P2" &&
          !review.splitConfirmed &&
          !review.boundary
            ? null
            : "HUMAN_GAME_RAW_PARTS_RECORDED",
        humanReviewId: review.humanReviewId ?? P0_REVIEW,
      }
    : null;
}
function needsVersion(review) {
  return (
    (review?.reviewKind !== "P2" || review.requiresVersionReview) &&
    review?.role === "arranger" &&
    !["SAME_ARRANGEMENT_CONFIRMED", "DIFFERENT_ARRANGEMENT_CONFIRMED"].includes(
      review.relationshipStatus,
    )
  );
}
function humanIdentityConfirmed(input, r, role, raw) {
  return (
    input.humanReview?.answers.scopeConfirmations.some(
      (a) =>
        ref(a) === ref(r) &&
        a.role === role &&
        a.title === r.title &&
        a.raw === raw &&
        a.answer === "はい",
    ) ?? false
  );
}

export function currentRecords(input) {
  return Object.entries(input.games).flatMap(([game, db]) =>
    db.groups.flatMap((g) =>
      g.songs.map((song) => ({
        game,
        recordId: song.id,
        title: song.title,
        band: g.band,
        workId: song.workId,
        song,
      })),
    ),
  );
}

function currentRole(record, role, creators) {
  const tokens = creditTokens(record.song, role, creators);
  const display = creditText(record.song, role, creators);
  const raw = record.song[role] ?? display ?? "";
  const resolved = tokens
    .filter((t) => t.creator)
    .map((t) => ({
      creatorId: t.creator.id,
      name: t.creator.name,
      displayedText: t.text,
    }));
  const unresolved = tokens.filter((t) => t.unresolved).map((t) => t.text);
  const empty = !raw && !display;
  return {
    raw: raw || null,
    displayedText: display || null,
    resolvedCreators: resolved,
    unresolvedParts: unresolved,
    empty,
    pending: empty || !!unresolved.length || (!resolved.length && !!raw),
  };
}

function evidenceFor(input, r, role) {
  const m = input.effective.normalized.find((x) => ref(x) === ref(r))?.roles[
    role
  ];
  const a = input.phaseA.find((x) => ref(x) === ref(r))?.roles[role];
  const phase = m?.phaseA ?? a;
  const evidence = [
    {
      document: `data/${r.game}/songs.json`,
      locator: `${ref(r)} / ${role}`,
      sourceType: "current-repository",
      supports: "現在の表示・role・Creator参照",
      checkedAt: null,
    },
  ];
  if (phase)
    evidence.push({
      document: `${A}/credit-research.json`,
      locator: `${ref(r)} / roles.${role}`,
      sourceType: "historical-credit-evidence",
      status: phase.evidenceStatus,
      raw: phase.raw ?? null,
      reason: phase.reason ?? "",
      sourceUrls: phase.sourceUrls ?? [],
      variants: (a?.variants ?? []).map((v) => ({
        raw: v.raw,
        evidenceId: v.evidenceId,
        sourceUrl: v.sourceUrl,
        sourceType: v.sourceType,
        checkedAt: v.checkedAt,
        sourceScope: v.sourceScope,
        sourceGame: v.sourceGame,
        applicability: v.applicability,
        notes: v.notes,
      })),
    });
  if (m)
    evidence.push({
      document: `${B2}/phase-b2-effective-package.json`,
      locator: `${ref(r)} / roles.${role}`,
      sourceType: "reviewed-package",
      raw: m.effective?.rawCredit ?? null,
      splitStatus: m.effective?.splitStatus ?? null,
      reason: m.excludedReason ?? m.effective?.splitReason ?? "",
      humanReviewId: m.humanReviewId ?? null,
      humanEvidence: m.humanEvidence ?? [],
    });
  const review = reviewedRole(input, r, role);
  if (review)
    evidence.push({
      document: P0_REVIEW,
      locator: roleRef(r, role),
      sourceType: "human-review",
      reviewer: input.humanReview.reviewer,
      checkedAt: input.humanReview.humanReviewDate,
      raw: review.raw,
      relationshipAnswer: review.relationshipAnswer,
      relationshipStatus: review.relationshipStatus,
    });
  return evidence;
}

const creatorAnswers = () => ({
  identityConfirmed: null,
  samePersonAs: null,
  standardName: null,
  reading: null,
  sortKey: null,
  slug: null,
  type: null,
  aliases: null,
  affiliation: null,
  checkedAt: null,
  sourceNote: null,
  notes: null,
});
const songAnswers = () => ({
  lyricistGameDisplay: null,
  composerGameDisplay: null,
  arrangerGameDisplay: null,
  checkedAt: null,
  sourceNote: null,
  notes: null,
});

export function buildLedger(input) {
  const creators = input.master.creators;
  const byId = new Map(creators.map((c) => [c.id, c]));
  const identityByKey = new Map(
    input.identities.map((c) => [c.identityKey, c]),
  );
  const formalMap = new Map(
    input.effective.candidateIdMap.map((x) => [x.candidateKey, x.creatorId]),
  );
  const modelByRef = new Map(
    input.effective.normalized.map((r) => [ref(r), r]),
  );
  const phaseARefs = new Set(input.phaseA.map(ref));
  const records = currentRecords(input);
  const songs = records.map((r) => ({
    game: r.game,
    recordId: r.recordId,
    title: r.title,
    band: r.band,
    workId: r.workId,
    latestAfterPhaseA: !phaseARefs.has(ref(r)),
    currentCredits: Object.fromEntries(
      CREDIT_ROLES.map((role) => [role, currentRole(r, role, creators)]),
    ),
    tasks: [],
  }));
  const songsByRef = new Map(songs.map((r) => [ref(r), r]));
  const candidates = new Map();
  const obligationMap = new Map();

  function descriptors(r, role, raw, supplied) {
    const effective =
      supplied ??
      reviewedModel(input, r, role) ??
      modelByRef.get(ref(r))?.roles[role]?.effective;
    if (
      effective?.creatorTokens?.length &&
      effective.rawCredit &&
      formatKey(effective.rawCredit) === formatKey(raw)
    )
      return effective.creatorTokens.map((t) => ({
        ...t,
        groupBasis: `${B2}/phase-b2-effective-package.json: ${roleRef(r, role)}`,
      }));
    const historical = input.rawMap.flatMap((m) =>
      m.occurrences
        .filter(
          (o) =>
            ref(o) === ref(r) &&
            m.role === role &&
            formatKey(m.rawCredit) === formatKey(raw),
        )
        .map((o) => ({ m, o })),
    );
    if (historical.length === 1)
      return historical[0].o.creatorTokens.map((t) => ({
        ...t,
        groupBasis: `${B1}/raw-token-map.json: ${historical[0].m.mappingKey} / ${roleRef(r, role)}`,
      }));
    const roleState = songsByRef.get(ref(r)).currentCredits[role];
    const parts = roleState.unresolvedParts.length
      ? roleState.unresolvedParts
      : [raw];
    return parts.map((part) => {
      const matches = input.identities.filter((i) =>
        [i.standardName, ...i.rawTokens, ...i.aliases].some(
          (s) => formatKey(s) === formatKey(part),
        ),
      );
      const identity = matches.length === 1 ? matches[0] : null;
      const legacy = input.legacy.candidates.find(
        (c) =>
          c.records.includes(ref(r)) &&
          [c.candidateName, ...c.originals].some(
            (s) => formatKey(s) === formatKey(part),
          ),
      );
      const { normalized, affiliation } = separateAffiliation(part);
      return {
        raw: part,
        normalized,
        affiliation,
        standardName:
          identity?.standardName ?? legacy?.candidateName ?? normalized,
        identityKey:
          identity?.identityKey ??
          `current-${hash(legacy ? JSON.stringify(legacy.originals) : `${ref(r)}:${part}`).slice(0, 20)}`,
        confidence: "UNRESOLVED",
        type: identity?.type ?? legacy?.candidateType ?? null,
        typeStatus: identity?.typeStatus ?? "unconfirmed",
        sortKey: identity?.sortKey ?? null,
        sortKeyStatus: identity?.sortKeyStatus ?? "unconfirmed",
        reason:
          "現行rawの主体を対象曲・担当の一次資料と照合する。候補名一致は人物同一性の承認ではない。",
        groupBasis: identity
          ? `${B1}/creator-identity-research.json: ${identity.identityKey}（既存候補群への照合仮説、追加recordの同一性未承認）`
          : legacy
            ? "docs/migrations/creators-2026-10-02/creator-review.json: 既存composer候補群"
            : "current-repository / record-scoped candidate",
        evidence: [],
      };
    });
  }

  function getCandidate(t, r, role, conditional) {
    const possibleGroups = input.identities.filter((i) =>
      [i.standardName, ...i.rawTokens, ...i.aliases].some(
        (raw) => formatKey(raw) === formatKey(t.raw),
      ),
    );
    const key =
      t.identityKey ??
      t.candidateKey ??
      (possibleGroups.length === 1
        ? possibleGroups[0].identityKey
        : `current-${hash(`${ref(r)}:${t.raw}`).slice(0, 20)}`);
    const identity = identityByKey.get(key);
    const confirmedId =
      t.creatorId ??
      formalMap.get(key) ??
      identity?.existingCreatorId ??
      (byId.has(key) ? key : null);
    const name =
      identity?.standardName ?? t.standardName ?? t.normalized ?? t.raw.trim();
    const exact = creators.filter((c) =>
      [c.name, ...c.aliases].some(
        (s) =>
          formatKey(s) === formatKey(name) || formatKey(s) === formatKey(t.raw),
      ),
    );
    const ids = uniq(
      [confirmedId, ...exact.map((c) => c.id)].filter((id) => byId.has(id)),
    );
    let c = candidates.get(key);
    if (!c) {
      c = {
        candidateKey: key,
        standardNameCandidate: name,
        rawVariants: [],
        roles: [],
        affectedRecords: [],
        currentConfidence: confirmedId
          ? "IDENTITY_CONFIRMED_ROLE_PENDING"
          : (identity?.confidence ?? t.confidence ?? "UNRESOLVED"),
        confirmedExistingCreatorId: confirmedId ?? null,
        existingCreatorCandidates: ids.map((id) => ({
          creatorId: id,
          name: byId.get(id).name,
          basis:
            confirmedId === id
              ? "既存の承認済みidentity対応。残るrole/境界だけ確認"
              : "name/alias/所属付き表記の候補一致。同一性未承認",
        })),
        typeCandidate: confirmedId
          ? byId.get(confirmedId)?.type
          : (identity?.type ?? t.type ?? null),
        typeStatus: confirmedId
          ? "confirmed-existing-master"
          : (identity?.typeStatus ?? t.typeStatus ?? "unconfirmed"),
        reading: confirmedId
          ? byId.get(confirmedId)?.sortKey
          : (identity?.sortKey ?? t.sortKey ?? null),
        readingStatus: confirmedId
          ? "approved-existing-master"
          : (identity?.sortKeyStatus ?? t.sortKeyStatus ?? "unconfirmed"),
        slugCandidate: confirmedId
          ? byId.get(confirmedId)?.slug
          : (identity?.slugCandidate ?? null),
        slugStatus: confirmedId
          ? "approved-existing-master"
          : (identity?.slugStatus ?? "unconfirmed"),
        aliases: confirmedId
          ? byId.get(confirmedId)?.aliases
          : (identity?.aliases ?? []),
        aliasReviewCandidates: identity?.aliasReviewCandidates ?? [],
        affiliations: [],
        evidence: [],
        unresolvedReasons: [],
        groupBasis: [],
        humanAnswerFields: creatorAnswers(),
        tasks: [],
        songTaskIds: [],
        priority: "P3",
        shortNameScopeRequired: isShortName(name),
        groupIsIdentityHypothesis: !confirmedId,
        autoApply: false,
      };
      candidates.set(key, c);
    }
    c.rawVariants = uniq([...c.rawVariants, t.raw]);
    c.roles = uniq([...c.roles, role]);
    c.affiliations = uniq([...c.affiliations, t.affiliation].filter(Boolean));
    c.groupBasis = uniq([...c.groupBasis, t.groupBasis].filter(Boolean));
    c.unresolvedReasons = uniq(
      [...c.unresolvedReasons, t.reason, ...(identity?.notes ?? [])].filter(
        Boolean,
      ),
    );
    c.evidence = [
      ...new Map(
        [
          ...c.evidence,
          ...(t.evidence ?? []),
          ...evidenceFor(input, r, role),
        ].map((x) => [JSON.stringify(x), x]),
      ).values(),
    ];
    if (name === input.humanReview?.registration.name)
      c.recordedHumanReview = {
        document: P0_REVIEW,
        status: input.humanReview.registration.status,
        suppliedFields: input.humanReview.registration.suppliedFields,
        missingFields: input.humanReview.registration.missingFields,
        scopeConfirmations: input.humanReview.registration.suppliedScopes,
      };
    const k = `${roleRef(r, role)}:${conditional ? "reference" : "current"}`;
    if (!c.affectedRecords.some((a) => a.occurrenceKey === k))
      c.affectedRecords.push({
        occurrenceKey: k,
        game: r.game,
        recordId: r.recordId,
        title: r.title,
        band: r.band,
        workId: r.workId,
        role,
        raw: t.raw,
        creditContext: conditional
          ? "REFERENCE_ONLY_GAME_UNVERIFIED"
          : "CURRENT_RAW",
        identityConfirmedForThisRole:
          (!!t.creatorId && t.confidence === "CONFIRMED") ||
          humanIdentityConfirmed(input, r, role, t.raw),
        humanAction: conditional
          ? `発売版の${LABELS[role]}候補「${t.raw}」が ${GAME[r.game]}:${r.recordId}「${r.title}」（${r.band}）のゲーム内${LABELS[role]}欄にも出るか確認し、対象なら主体・roleの根拠を回答する。`
          : `対象 ${GAME[r.game]}:${r.recordId}「${r.title}」（${r.band}）/${LABELS[role]} の「${t.raw}」がこの候補主体を指すか一次資料で確認する。`,
      });
    return c;
  }

  function addTask(s, r, role, category, raw, detail = {}) {
    const candidateKey = detail.creatorCandidateKey ?? null;
    const suffix = candidateKey ? `-${candidateKey}` : "";
    const id = `${roleRef(r, role)}:${category}${suffix}`;
    if (s.tasks.some((t) => t.taskId === id))
      return s.tasks.find((t) => t.taskId === id);
    const task = {
      taskId: id,
      category,
      role,
      priority: detail.priority ?? "P2",
      status: "NEEDS_HUMAN",
      raw,
      reason: detail.reason,
      action: detail.action,
      completionCondition: detail.completionCondition,
      creatorCandidateKey: candidateKey,
      creatorCandidateKeys:
        detail.creatorCandidateKeys ?? (candidateKey ? [candidateKey] : []),
      evidence: detail.evidence ?? evidenceFor(input, r, role),
      humanAnswerFields: detail.humanAnswerFields ?? songAnswers(),
      dependencies: detail.dependencies ?? [],
      ...detail,
    };
    s.tasks.push(task);
    for (const key of task.creatorCandidateKeys)
      candidates.get(key).songTaskIds.push(id);
    return task;
  }

  function subjectTasks(s, r, role, tokens, raw, conditional, dependency = []) {
    const actorKeys = [];
    for (const token of tokens) {
      if (
        s.currentCredits[role].resolvedCreators.some(
          (c) => c.creatorId === token.creatorId,
        )
      )
        continue;
      const c = getCandidate(token, r, role, conditional);
      actorKeys.push(c.candidateKey);
      const known = !!c.confirmedExistingCreatorId;
      const roleIdentityConfirmed =
        !!token.creatorId && token.confidence === "CONFIRMED";
      const category = conditional
        ? "GAME_VERSION_REVIEW"
        : known && roleIdentityConfirmed
          ? "ROLE_REVIEW"
          : c.existingCreatorCandidates.length
            ? "ALIAS_REVIEW"
            : "CREATOR_IDENTITY";
      const confirmedHumanIdentity = humanIdentityConfirmed(
        input,
        r,
        role,
        token.raw,
      );
      if (!confirmedHumanIdentity)
        addTask(s, r, role, category, raw, {
          creatorCandidateKey: c.candidateKey,
          priority: s.latestAfterPhaseA ? "P0" : known ? "P2" : "P3",
          tokenRaw: token.raw,
          evidenceContext: conditional
            ? "REFERENCE_ONLY_GAME_UNVERIFIED"
            : "CURRENT_RAW",
          reason: conditional
            ? "発売版原文の候補。現在のゲームcreditは未収集のため、この主体をゲーム参加者として数えない。"
            : known && roleIdentityConfirmed
              ? `identityは${c.confirmedExistingCreatorId}で承認済み。現行のこの共同欄/担当はformal参照未反映。人物の新規登録は不要。`
              : token.reason ||
                "現行creditにrawはあるが、確認済みCreatorとの対応がない。",
          action: conditional
            ? `${GAME[r.game]}:${r.recordId}「${r.title}」（${r.band}）のゲーム内${LABELS[role]}原文を先に取得し、発売版候補「${token.raw}」との一致・差を記録する。ゲーム版にも出る場合だけ本人・type・読み・slug・aliasを確認する。`
            : known && roleIdentityConfirmed
              ? `既存${c.confirmedExistingCreatorId}「${c.standardNameCandidate}」の${LABELS[role]}参加と共同欄「${raw}」内の位置をこの曲の一次資料で確認する。`
              : c.existingCreatorCandidates.length
                ? `「${token.raw}」が既存${c.existingCreatorCandidates.map((x) => x.creatorId + "「" + x.name + "」").join(" / ")}と同一か、対象曲・${LABELS[role]}の文脈付きで確認する。`
                : `raw「${token.raw}」が ${GAME[r.game]}:${r.recordId}「${r.title}」（${r.band}）の${LABELS[role]}主体を指すことを確認し、${c.standardNameCandidate}をCreator masterへ登録可能か判断する。standardName・読み/sortKey・slug・type・aliasesと根拠を回答する。`,
          completionCondition: conditional
            ? "ゲーム原文・確認日時・出典が記録され、発売版候補を適用可能か否かが回答済み。適用可能なら主体/登録情報/担当根拠も回答済み。"
            : known
              ? "この曲・担当・位置の一次根拠と既存ID対応を回答済み。"
              : "対象曲と担当に対応する本人/主体を同定し、既存IDの有無と登録必須5項目・出典を回答済み。",
          humanAnswerFields: {
            ...creatorAnswers(),
            ...(conditional ? { appliesToGame: null } : {}),
            gameCreditDisplay: null,
            roleConfirmed: null,
          },
          dependencies: dependency,
        });
      if (!known && !conditional && !c.existingCreatorCandidates.length)
        addTask(s, r, role, "CREATOR_REGISTRATION", raw, {
          creatorCandidateKey: c.candidateKey,
          priority: s.latestAfterPhaseA ? "P0" : "P3",
          reason: c.recordedHumanReview
            ? "人物情報と指定5担当の同一性は回答済み。確認欄の空欄を補完せず正式登録を保留。"
            : "現在masterにこの候補の正式IDがない。候補名・暫定読み/slug/typeをそのまま登録しない。",
          action: c.recordedHumanReview
            ? `入力済み人物情報を保持し、未回答の ${c.recordedHumanReview.missingFields.join(" / ")} だけを追加確認する。`
            : `「${c.standardNameCandidate}」のstandardName、reading/sortKey、slug、type(person/unit/organization)、必要aliasesを個別に決定する。各値の根拠と対象 ${GAME[r.game]}:${r.recordId}「${r.title}」/${LABELS[role]} への適用範囲を記録する。`,
          completionCondition: c.recordedHumanReview
            ? "B節の全確認欄が回答済み。指定されたID不在・slug・対象担当を保持し、登録前に衝突を確認できる。"
            : "identity確認後に必須5項目と根拠が回答済み。slugのcurrent/previous名前空間との衝突なしを後続適用時に検証できる。",
          humanAnswerFields: creatorAnswers(),
          dependencies: [
            ...(!confirmedHumanIdentity
              ? [roleRef(r, role) + ":CREATOR_IDENTITY-" + c.candidateKey]
              : []),
            ...dependency,
          ],
          recordedIdentityConfirmation: confirmedHumanIdentity,
          remainingCreatorFields: c.recordedHumanReview?.missingFields ?? null,
        });
    }
    return uniq(actorKeys);
  }

  for (const r of records) {
    const s = songsByRef.get(ref(r));
    for (const role of CREDIT_ROLES) {
      const state = s.currentCredits[role];
      const review = reviewedRole(input, r, role);
      if (needsVersion(review))
        addTask(s, r, role, "GAME_VERSION_REVIEW", state.raw, {
          priority: "P0",
          reason: `ゲーム編曲原文は回答済み。発売版との編曲同一性は未解決。回答：${review.relationshipAnswer ?? "空欄"}。`,
          action: `${GAME[r.game]}:${r.recordId}「${r.title}」のゲーム内編曲「${state.raw}」と発売版の編曲自体が同一か、別編曲か根拠付きで回答する。人物の同一性だけでは編曲同一性を確定しない。`,
          completionCondition:
            "同一編曲と確認 / 別編曲と確認を対象版の根拠付きで回答済み。",
          humanAnswerFields: {
            sameArrangementAsRelease: null,
            checkedAt: null,
            sourceNote: null,
          },
          recordedHumanRelationshipAnswer: review.relationshipAnswer,
          recordedRelationshipStatus: review.relationshipStatus,
          evidenceContext: "GAME_RAW_CONFIRMED_RELATIONSHIP_PENDING",
          dependencies: [],
        });
      if (!state.pending) continue;
      const model = modelByRef.get(ref(r))?.roles[role];
      const historicalRaw =
        model?.effective?.rawCredit ?? model?.phaseA?.raw ?? null;
      const manual = input.manual.find((x) => ref(x) === ref(r));
      if (state.empty) {
        const own = r.game === "ournotes" && role === "arranger";
        const release = own ? (manual?.releaseVersionRaw ?? []) : [];
        const collect = addTask(s, r, role, "CREDIT_COLLECTION", null, {
          priority: own || s.latestAfterPhaseA ? "P0" : "P2",
          releaseVersionRaw: release,
          reason: own
            ? `現在ゲーム内編曲原文は未収集。${release.length ? `発売版参考raw「${release.join(" / ")}」はゲーム版へ適用する根拠がない。` : "発売版参考rawの記録もない。"}`
            : `${LABELS[role]}の現行rawが空。資料に記載がないことを担当者なし/歌詞なしと扱わない。${model?.phaseA?.reason ?? ""}`,
          action: `${GAME[r.game]}:${r.recordId}「${r.title}」（${r.band}）のゲーム内楽曲詳細・credit画面の${LABELS[role]}欄を確認し、表示文字列を空白・記号・所属付きでそのまま記録する。欄がない場合も確認日時と画面/一次資料の根拠を記録する。${own && release.length ? "発売版の名前を転記してゲームcreditを確定しない。" : ""}`,
          completionCondition: `${role}GameDisplay、checkedAt、sourceNoteを回答済み。表示欄なし/不明の場合も明示し、空欄を担当者なしへ置換しない。`,
          humanAnswerFields: songAnswers(),
        });
        if (own) {
          s.ournotesArrangerManual = {
            currentArranger: null,
            releaseVersionRaw: release,
            releaseEvidenceStatus:
              manual?.currentEvidence?.evidenceStatus ?? "NO_RELEASE_REFERENCE",
            releaseEvidence: manual?.currentEvidence ?? null,
            humanAnswerFields: songAnswers(),
            collectionTaskId: collect.taskId,
          };
          if (release.length) {
            const referenceMaps = input.rawMap.filter(
              (m) =>
                m.role === role &&
                release.some(
                  (raw) => formatKey(raw) === formatKey(m.rawCredit),
                ) &&
                m.occurrences.some((o) => ref(o) === ref(r)),
            );
            const evidenceTokens = model?.effective?.creatorTokens?.length
              ? model.effective.creatorTokens
              : referenceMaps.flatMap((m) =>
                  m.occurrences
                    .filter((o) => ref(o) === ref(r))
                    .flatMap((o) =>
                      o.creatorTokens.map((t) => ({
                        ...t,
                        groupBasis: `${B1}/raw-token-map.json: ${m.mappingKey} / 発売版参考のみ`,
                      })),
                    ),
                );
            const keys = subjectTasks(
              s,
              r,
              role,
              evidenceTokens,
              release.join(" / "),
              true,
              [collect.taskId],
            );
            const gameTask = addTask(s, r, role, "GAME_VERSION_REVIEW", null, {
              priority: "P0",
              reason: "発売版とゲーム版の編曲同一性は未承認。",
              action: `発売版参考「${release.join(" / ")}」とゲーム内で得た ${GAME[r.game]}:${r.recordId}「${r.title}」の編曲原文・版を比較し、同一編曲か別編曲か根拠を記録する。`,
              completionCondition:
                "ゲームcredit原文と対象版の根拠、発売版との同一性/差を回答済み。",
              humanAnswerFields: {
                ...songAnswers(),
                sameArrangementAsRelease: null,
              },
              creatorCandidateKeys: keys,
              dependencies: [collect.taskId],
            });
            obligationMap.set(`manual-reference:${roleRef(r, role)}`, [
              gameTask.taskId,
            ]);
            if (
              model?.effective?.splitStatus === "REVIEW_RECOMMENDED" ||
              referenceMaps.some((m) => m.status === "REVIEW_RECOMMENDED")
            )
              addTask(s, r, role, "SPLIT_REVIEW", null, {
                priority: "P2",
                status: "BLOCKED",
                releaseVersionRaw: release,
                evidenceContext: "REFERENCE_ONLY_GAME_UNVERIFIED",
                reason:
                  "発売版の作者境界候補は未承認。ゲーム原文を先に収集し、同じ欄に出る場合だけ境界を承認する。",
                action: `発売版参考「${release.join(" / ")}」の候補 ${uniq(evidenceTokens.map((t) => `「${t.raw}」`)).join(" + ")} の共同作者境界を一次資料で確認する。OurNotes:${r.recordId}「${r.title}」（${r.band}）のゲーム内編曲が同じ原文か先に確認し、適用範囲と順序を回答する。`,
                completionCondition:
                  "ゲームcredit原文と発売版との関係が回答済み。対象ならconfirmedParts・順序・各主体・出典を回答済み。対象外なら適用不可を明示済み。",
                creatorCandidateKeys: keys,
                dependencies: [collect.taskId, gameTask.taskId],
                humanAnswerFields: {
                  confirmedParts: null,
                  appliesToGame: null,
                  checkedAt: null,
                  sourceNote: null,
                  notes: null,
                },
              });
          }
        } else if (historicalRaw)
          addTask(s, r, role, "ROLE_REVIEW", null, {
            priority: "P2",
            historicalRaw,
            reason:
              "過去資料に原文候補があるが、現在のこの担当は未確定。対象曲・role・版の一致を再確認する必要がある。",
            action: `過去原文「${historicalRaw}」と ${GAME[r.game]}:${r.recordId}「${r.title}」（${r.band}）のゲーム内${LABELS[role]}欄を照合し、対象曲・担当・版が一致する一次根拠を回答する。`,
            completionCondition:
              "当該担当の原文・対象曲/版の一致が根拠付きで回答済み。",
            dependencies: [collect.taskId],
          });
      } else {
        const tokens = descriptors(r, role, state.raw);
        const splitStatus =
          reviewedModel(input, r, role)?.splitStatus ??
          model?.effective?.splitStatus;
        const wholePending =
          (r.song.creditDisplay?.[role] ?? []).length === 1 &&
          state.unresolvedParts.length === 1;
        const splitNeeded =
          splitStatus === "REVIEW_RECOMMENDED" ||
          (!review && tokens.length > 1 && wholePending);
        const keys = subjectTasks(s, r, role, tokens, state.raw, false);
        if (splitNeeded) {
          const task = addTask(s, r, role, "SPLIT_REVIEW", state.raw, {
            priority: s.latestAfterPhaseA ? "P0" : "P2",
            reason:
              splitStatus === "REVIEW_RECOMMENDED"
                ? model.effective.splitReason
                : "過去資料は分割候補を示すが現行表示は共同欄全体が未ID化。未解決主体と境界/順序の承認を区別する。",
            action: `${GAME[r.game]}:${r.recordId}「${r.title}」（${r.band}）/${LABELS[role]} のraw「${state.raw}」を、候補 ${tokens.map((t) => `「${t.raw}」`).join(" + ")} として分割してよいか、名前内部の記号/所属/共同作者境界を一次資料で確認し、順序を回答する。単一主体なら全体を1名と回答する。`,
            completionCondition:
              "confirmedPartsを順序付きで回答し、各部分の主体/既存ID/未同定候補とroleの根拠が記録済み。",
            creatorCandidateKeys: keys,
            humanAnswerFields: {
              confirmedParts: null,
              keepWholeAsSingleCreator: null,
              creatorIdsOrCandidateKeys: null,
              checkedAt: null,
              sourceNote: null,
              notes: null,
            },
          });
          obligationMap.set(`split:${roleRef(r, role)}`, [task.taskId]);
        }
        if (
          (review?.reviewKind !== "P2" ||
            (review.reviewKind === "P2" &&
              !review.roleConfirmed &&
              !review.collection &&
              !review.splitConfirmed &&
              !review.bindings.length)) &&
          (!model?.effective?.rawCredit ||
            formatKey(model.effective.rawCredit) !== formatKey(state.raw))
        )
          addTask(s, r, role, "ROLE_REVIEW", state.raw, {
            priority: s.latestAfterPhaseA ? "P0" : "P2",
            reason:
              "現行rawと過去効果packageの原文が一致しない/原文がない。現在データを保持して出典・対象roleを確認する。",
            action: `現行「${state.raw}」を ${GAME[r.game]}:${r.recordId}「${r.title}」（${r.band}）/${LABELS[role]} の一次資料と照合し、対象曲・役割・版が一致するcredit原文を記録する。`,
            completionCondition: "原文と担当の根拠・確認日時・出典を回答済み。",
          });
      }
      obligationMap.set(
        `current:${roleRef(r, role)}`,
        s.tasks.filter((t) => t.role === role).map((t) => t.taskId),
      );
    }
  }

  for (const c of candidates.values()) {
    c.affectedRecordCount = uniq(c.affectedRecords.map(ref)).length;
    c.affectedWorkCount = uniq(c.affectedRecords.map((a) => a.workId)).length;
    c.affectedGames = uniq(c.affectedRecords.map((a) => a.game)).sort();
    c.currentRecordCount = uniq(
      c.affectedRecords
        .filter((a) => a.creditContext === "CURRENT_RAW")
        .map(ref),
    ).length;
    c.referenceOnlyRecordCount = uniq(
      c.affectedRecords
        .filter((a) => a.creditContext !== "CURRENT_RAW")
        .map(ref),
    ).length;
    const latest = c.affectedRecords.some(
      (a) =>
        songsByRef.get(ref(a)).latestAfterPhaseA ||
        !!reviewedRole(
          input,
          records.find((r) => ref(r) === ref(a)),
          a.role,
        ),
    );
    c.priority = latest
      ? "P0"
      : c.affectedRecordCount >= 4 && !c.confirmedExistingCreatorId
        ? "P1"
        : c.affectedRecordCount >= 2
          ? "P2"
          : "P3";
    c.songTaskIds = uniq(c.songTaskIds);
    c.affectedRecords.sort(
      (a, b) =>
        a.game.localeCompare(b.game) ||
        a.recordId - b.recordId ||
        a.role.localeCompare(b.role),
    );
    const conditional = c.currentRecordCount === 0;
    c.conditionalOnGameCredit = conditional;
    const missing = c.confirmedExistingCreatorId
      ? []
      : c.recordedHumanReview
        ? c.recordedHumanReview.missingFields
        : ["standardName", "reading/sortKey", "slug", "type", "aliases"];
    c.registrationFieldDecisions = missing.map((field) => ({
      field,
      status: "NEEDS_HUMAN",
      currentCandidate:
        field === "standardName"
          ? c.standardNameCandidate
          : field === "reading/sortKey"
            ? c.reading
            : field === "slug"
              ? c.slugCandidate
              : field === "type"
                ? c.typeCandidate
                : c.aliases,
      action:
        field === "aliases"
          ? "必要aliasと同一性根拠を回答する。不要なら空配列を明示する。"
          : `${field}を一次資料/人間判断で確定する。暫定候補値を未確認のまま採用しない。`,
    }));
    c.completionCondition = c.confirmedExistingCreatorId
      ? "既存identityを再登録せず、全affected曲の未承認role/境界/ゲーム版一致だけを回答済みにする。"
      : `${conditional ? "各曲のゲームcreditを確認し、候補がゲーム版に出るか回答済み。対象外なら適用不可を明示する。対象なら" : "全affected曲・担当のcredit主体の同一性を根拠付きで確認し、"}既存Creatorとの関係とstandardName、reading/sortKey、slug、type、aliasesを回答済み。短名は対象曲/role単位で承認する。`;
    if (c.recordedHumanReview) {
      c.currentConfidence = "HUMAN_IDENTITY_CONFIRMED_REGISTRATION_INCOMPLETE";
      c.completionCondition = `入力済みの人物情報と5担当の同一性回答を保持し、空の確認欄 ${missing.join(" / ")} を人間が回答する。`;
    }
    c.humanAction = c.confirmedExistingCreatorId
      ? `既存${c.confirmedExistingCreatorId}「${c.standardNameCandidate}」の残る担当・境界だけを確認する。`
      : `全affected曲の「${c.standardNameCandidate}」が同一主体か、対象曲と担当の一次credit・本人/組織の公式資料で確認する。${c.existingCreatorCandidates.length ? `既存${c.existingCreatorCandidates.map((x) => x.creatorId).join(" / ")}と同一か回答する。` : "masterに登録可能な主体か判断する。"}${c.shortNameScopeRequired ? "短名を名前だけで全曲へ適用せず、承認したrecordとroleを列挙する。" : ""}${c.affiliations.length ? `「${c.affiliations.join(" / ")}」は所属表記として確認し、個人と組織参加を二重計上しない。` : ""}${c.typeCandidate === "organization" ? "組織自体がcredit主体か確認する。" : ""}`;
    if (c.recordedHumanReview)
      c.humanAction = `人間回答を${P0_REVIEW}から保持し、不足欄 ${missing.join(" / ")} だけを追加確認する。正式登録は全欄が揃うまで保留。`;
    const hasAliasReview = songs.some((s) =>
      s.tasks.some(
        (t) =>
          t.creatorCandidateKey === c.candidateKey &&
          t.category === "ALIAS_REVIEW",
      ),
    );
    if (hasAliasReview) {
      c.humanAction = `既存${c.confirmedExistingCreatorId}「${c.standardNameCandidate}」と当該rawが同一主体か、affected曲/roleごとに確認する。承認済みidentityの再登録は不要。未承認表記と担当・版の範囲だけ回答する。`;
      c.currentConfidence = "EXISTING_IDENTITY_ALIAS_OR_ROLE_PENDING";
    }
    const primaryCategory = conditional
      ? "GAME_VERSION_REVIEW"
      : hasAliasReview
        ? "ALIAS_REVIEW"
        : c.confirmedExistingCreatorId
          ? "ROLE_REVIEW"
          : c.existingCreatorCandidates.length
            ? "ALIAS_REVIEW"
            : "CREATOR_IDENTITY";
    c.tasks.push({
      taskId: `creator:${c.candidateKey}:${primaryCategory}`,
      category: primaryCategory,
      priority: c.priority,
      status: "NEEDS_HUMAN",
      action: c.humanAction,
      reason:
        c.unresolvedReasons.join(" / ") ||
        "role/境界/版の未承認箇所を確認する。",
      completionCondition: c.completionCondition,
      humanAnswerFields: creatorAnswers(),
      songTaskIds: c.songTaskIds,
    });
    for (const decision of c.registrationFieldDecisions)
      c.tasks.push({
        taskId: `creator:${c.candidateKey}:field:${decision.field}`,
        category: "CREATOR_REGISTRATION",
        priority: c.priority,
        status: conditional ? "BLOCKED" : "NEEDS_HUMAN",
        reason: conditional
          ? "ゲーム版の当該creditに候補が出ると確認するまで、ゲーム参加者として登録/適用しない。"
          : "未登録候補の必須情報を人間が確定する必要がある。",
        action: decision.action,
        completionCondition: `${decision.field}の回答と根拠、既存IDとの関係が明示済み。`,
        humanAnswerFields: creatorAnswers(),
        dependencies: [c.tasks[0].taskId],
      });
    const aliasesPending = c.aliasReviewCandidates.filter(
      (raw) =>
        !c.confirmedExistingCreatorId ||
        ![
          byId.get(c.confirmedExistingCreatorId)?.name,
          ...(byId.get(c.confirmedExistingCreatorId)?.aliases ?? []),
        ].some((a) => formatKey(a) === formatKey(raw)),
    );
    if (aliasesPending.length && !c.confirmedExistingCreatorId)
      c.tasks.push({
        taskId: `creator:${c.candidateKey}:ALIAS_REVIEW`,
        category: "ALIAS_REVIEW",
        priority: c.priority,
        status: "NEEDS_HUMAN",
        action: `候補表記 ${aliasesPending.map((a) => `「${a}」`).join(" / ")} が「${c.standardNameCandidate}」と同一主体か確認し、承認するaliasesを回答する。`,
        reason: "B1の表記候補は人間によるalias承認ではない。",
        completionCondition: "各表記の同一性と必要aliasを根拠付きで回答済み。",
        humanAnswerFields: creatorAnswers(),
      });
    for (const taskId of c.songTaskIds) {
      const task = songs
        .flatMap((s) => s.tasks)
        .find((t) => t.taskId === taskId);
      if (
        ["CREATOR_IDENTITY", "CREATOR_REGISTRATION", "ALIAS_REVIEW"].includes(
          task.category,
        )
      )
        task.priority = c.priority;
    }
  }
  for (const s of songs) {
    s.tasks.sort(
      (a, b) =>
        a.priority.localeCompare(b.priority) ||
        a.role.localeCompare(b.role) ||
        a.category.localeCompare(b.category) ||
        a.taskId.localeCompare(b.taskId),
    );
    s.priority = priorityMin(s.tasks.map((t) => t.priority));
  }
  return {
    schemaVersion: 1,
    sourceHead: input.head,
    sourceDataHashes: Object.fromEntries(
      DATA_FILES.map((p) => [p, input.inputHashes[p]]),
    ),
    songs: songs.filter((s) => s.tasks.length).sort(ordering),
    candidates: [...candidates.values()].sort(candidateOrdering),
    obligations: [...obligationMap].map(([sourceKey, taskIds]) => ({
      sourceKey,
      taskIds,
    })),
    allCurrentRecords: records,
  };
}

function historicalSources(input) {
  const result = [];
  const add = (category, document, xs, role) =>
    xs.forEach((x, index) =>
      result.push({
        sourceKey: `${category}:${index}`,
        category,
        document,
        index,
        game: x.game,
        recordId: x.recordId,
        role: role ?? x.role,
        historicalRaw: x.rawCredit ?? x.raw ?? null,
      }),
    );
  add(
    "unresolved-after-b2",
    `${B2}/unresolved-after-b2.json`,
    input.unresolved,
  );
  for (const [key, xs] of Object.entries(input.unresolvedIndex))
    add(
      `unresolved-index/${key}`,
      `${B2}/unresolved-index.json`,
      xs,
      key === "lyricist"
        ? "lyricist"
        : key.endsWith("Arranger")
          ? "arranger"
          : undefined,
    );
  for (const m of input.rawMap.filter((m) => m.status === "REVIEW_RECOMMENDED"))
    m.occurrences.forEach((o, index) =>
      result.push({
        sourceKey: `split-review:${m.mappingKey}:${index}`,
        category: "split-review",
        document: `${B1}/split-review.md`,
        companion: `${B1}/raw-token-map.json`,
        mappingKey: m.mappingKey,
        game: o.game,
        recordId: o.recordId,
        role: m.role,
        historicalRaw: m.rawCredit,
      }),
    );
  add(
    "lyricist-unconfirmed",
    `${B1}/lyricist-unconfirmed.md`,
    input.unconfirmed.lyricist,
    "lyricist",
  );
  add(
    "garupa-arranger-unconfirmed",
    `${B1}/garupa-arranger-unconfirmed.md`,
    input.unconfirmed.garupaArranger,
    "arranger",
  );
  add(
    "ournotes-arranger-manual-review",
    `${B1}/ournotes-arranger-manual-review.md`,
    input.manual,
    "arranger",
  );
  add(
    "uncertain-token-occurrences",
    `${B1}/uncertain-token-occurrences.json`,
    input.uncertain,
  );
  return result;
}

export function verifyLedger(input, ledger) {
  const current = currentRecords(input);
  const registration = input.humanRegistration;
  if (registration?.status === "APPLIED") {
    assert.deepEqual(
      input.master.creators.find((c) => c.id === registration.creator.id),
      registration.creator,
      "Applied registration metadata",
    );
    assert.equal(
      registration.scopes.length,
      6,
      "Applied registration scope count",
    );
    const allowed = new Set(registration.scopes.map((s) => roleRef(s, s.role)));
    assert.equal(allowed.size, 6, "Applied registration unique scopes");
    for (const scope of registration.scopes) {
      const r = current.find((r) => ref(r) === ref(scope));
      assert.ok(r, "Applied registration record");
      assert.equal(r.title, scope.title, "Applied registration title");
      assert.equal(r.workId, scope.workId, "Applied registration Work");
      assert.equal(r.song[scope.role], scope.raw, "Applied registration raw");
      const tokens = creditTokens(r.song, scope.role, input.master.creators);
      assert.equal(tokens.length, 1, "Applied registration token count");
      assert.equal(
        tokens[0].creator?.id,
        registration.creator.id,
        "Applied registration binding",
      );
      assert.equal(tokens[0].text, scope.raw, "Applied registration display");
      assert.ok(
        r.song.credits.some(
          (c) =>
            c.creatorId === registration.creator.id &&
            c.roles.includes(scope.role),
        ),
        "Applied registration relation",
      );
    }
    for (const r of current)
      for (const relation of r.song.credits ?? [])
        if (relation.creatorId === registration.creator.id)
          for (const role of relation.roles)
            assert.ok(
              allowed.has(roleRef(r, role)),
              "Unapproved registration scope",
            );
  }
  const songs = new Map(ledger.songs.map((r) => [ref(r), r]));
  assert.equal(songs.size, ledger.songs.length, "One row per record");
  const tasks = new Map(
    ledger.songs.flatMap((s) => s.tasks).map((t) => [t.taskId, t]),
  );
  assert.equal(
    tasks.size,
    ledger.songs.reduce((n, s) => n + s.tasks.length, 0),
    "Task IDs unique",
  );
  const candidates = new Map(ledger.candidates.map((c) => [c.candidateKey, c]));
  assert.equal(
    candidates.size,
    ledger.candidates.length,
    "Candidate keys unique",
  );
  const masterById = new Map(input.master.creators.map((c) => [c.id, c]));
  const formalMap = new Map(
    input.effective.candidateIdMap.map((c) => [c.candidateKey, c.creatorId]),
  );
  const identitySourceAudit = input.identities.map((identity) => {
    const candidate = candidates.get(identity.identityKey);
    const approvedCurrentBindings = current
      .filter((r) => identity.records.includes(ref(r)))
      .flatMap((r) =>
        CREDIT_ROLES.flatMap((role) =>
          creditTokens(r.song, role, input.master.creators)
            .filter(
              (t) =>
                t.creator &&
                [
                  identity.standardName,
                  ...identity.rawTokens,
                  ...identity.aliases,
                ].some((raw) => formatKey(raw) === formatKey(t.text)),
            )
            .map((t) => ({
              game: r.game,
              recordId: r.recordId,
              role,
              displayedText: t.text,
              creatorId: t.creator.id,
            })),
        ),
      );
    const boundIds = uniq(approvedCurrentBindings.map((x) => x.creatorId));
    const formalId =
      identity.existingCreatorId ??
      formalMap.get(identity.identityKey) ??
      (masterById.has(identity.identityKey)
        ? identity.identityKey
        : boundIds.length === 1
          ? boundIds[0]
          : null);
    const reviewedReplacement =
      !candidate &&
      !formalId &&
      identity.records.every((key) => {
        const r = current.find((r) => ref(r) === key);
        return (
          r &&
          (input.p2Review?.reviews.some(
            (a) =>
              ref(a) === key &&
              ((a.candidateKeys?.includes(identity.identityKey) &&
                (input.p2Review.candidateMap[identity.identityKey]?.length ??
                  0) > 1 &&
                input.p2Review.candidateMap[identity.identityKey].every((id) =>
                  r.song.credits.some(
                    (c) => c.creatorId === id && c.roles.includes(a.role),
                  ),
                )) ||
                (a.splitConfirmed &&
                  identity.rawTokens.some(
                    (raw) => formatKey(raw) === formatKey(a.raw),
                  ))),
          ) ||
            input.humanReview?.reviews.some(
              (a) =>
                ref(a) === key &&
                a.role === "arranger" &&
                a.raw === r.song.arranger &&
                !a.actors.some(
                  (actor) => actor.identityKey === identity.identityKey,
                ),
            ))
        );
      });
    assert.ok(
      candidate || formalId || reviewedReplacement,
      "B1 identity group omitted: " + identity.identityKey,
    );
    return {
      sourceKey: identity.identityKey,
      standardName: identity.standardName,
      status: candidate
        ? "MAPPED_PENDING_TASKS"
        : reviewedReplacement
          ? "EXCLUDED_REPLACED_BY_HUMAN_GAME_RAW"
          : "EXCLUDED_CURRENT_REGISTERED_AND_RESOLVED",
      existingCreatorId: formalId,
      approvedCurrentBindings,
      candidateKey: candidate?.candidateKey ?? null,
      songTaskIds: candidate?.songTaskIds ?? [],
      reason: candidate
        ? "現在の未ID化raw/未確認role/発売版参考に残る課題を候補台帳へ対応。"
        : reviewedReplacement
          ? "対象の発売版参考候補は人間回答のゲーム原文に含まれない。別の主体を復活・自動登録しない。"
          : "現行masterに登録済みで、現行の当該対象に未承認課題なし。",
    };
  });
  const currentAudit = [];
  for (const r of current)
    for (const role of CREDIT_ROLES) {
      // Independently walk every live record and role, including records absent from all migrations.
      const parts = r.song.creditDisplay?.[role] ?? [];
      const raw =
        r.song[role] || creditText(r.song, role, input.master.creators);
      const pending =
        !raw ||
        parts.some((p) => p.unresolved) ||
        (!parts.some((p) => p.creatorId) && !!raw);
      const ids = (songs.get(ref(r))?.tasks ?? [])
        .filter((t) => t.role === role)
        .map((t) => t.taskId);
      if (pending)
        assert.ok(ids.length, "Missing current unresolved " + roleRef(r, role));
      else
        assert.equal(
          ids.filter(
            (id) =>
              !(
                needsVersion(reviewedRole(input, r, role)) &&
                tasks.get(id).category === "GAME_VERSION_REVIEW"
              ),
          ).length,
          0,
          "Resolved current role must not reappear: " + roleRef(r, role),
        );
      if (!raw)
        assert.ok(
          ids.some((id) => tasks.get(id).category === "CREDIT_COLLECTION"),
          "Missing collection " + roleRef(r, role),
        );
      if (pending && raw) {
        const model =
          reviewedModel(input, r, role) ??
          input.effective.normalized.find((x) => ref(x) === ref(r))?.roles[role]
            ?.effective;
        const liveFormal = new Set(
          parts.filter((p) => p.creatorId).map((p) => p.creatorId),
        );
        const knownTokens =
          model?.rawCredit && formatKey(model.rawCredit) === formatKey(raw)
            ? model.creatorTokens
            : null;
        const pendingActors = knownTokens?.length
          ? knownTokens.filter((t) => !liveFormal.has(t.creatorId))
          : parts.filter((p) => p.unresolved).map((p) => ({ raw: p.text }));
        for (const actor of pendingActors) {
          const groups = input.identities.filter((i) =>
            [i.standardName, ...i.rawTokens, ...i.aliases].some(
              (text) => formatKey(text) === formatKey(actor.raw),
            ),
          );
          const key =
            actor.identityKey ??
            actor.candidateKey ??
            (groups.length === 1 ? groups[0].identityKey : null);
          const matches = ledger.candidates.filter(
            (c) =>
              (!key || c.candidateKey === key) &&
              c.affectedRecords.some(
                (a) =>
                  ref(a) === ref(r) &&
                  a.role === role &&
                  formatKey(a.raw) === formatKey(actor.raw) &&
                  a.creditContext === "CURRENT_RAW",
              ),
          );
          assert.equal(
            matches.length,
            1,
            "Unresolved current actor omitted/duplicated: " +
              roleRef(r, role) +
              " / " +
              actor.raw,
          );
        }
      }
      if (needsVersion(reviewedRole(input, r, role)))
        assert.ok(
          ids.some((id) => tasks.get(id).category === "GAME_VERSION_REVIEW"),
          "Missing reviewed game version " + roleRef(r, role),
        );
      if (pending)
        currentAudit.push({
          sourceKey: `current:${roleRef(r, role)}`,
          game: r.game,
          recordId: r.recordId,
          title: r.title,
          band: r.band,
          workId: r.workId,
          role,
          raw: raw || null,
          taskIds: ids,
          status: "MAPPED",
        });
    }
  for (const s of ledger.songs)
    for (const t of s.tasks) {
      assert.ok(CATEGORIES[t.category]);
      assert.ok(
        ["TODO", "BLOCKED", "NEEDS_HUMAN", "READY_FOR_CODEX_APPLY"].includes(
          t.status,
        ),
      );
      assert.notEqual(
        t.status,
        "READY_FOR_CODEX_APPLY",
        "No new human answers were supplied",
      );
      for (const field of ["reason", "action", "completionCondition"])
        assert.ok(t[field], field + " " + t.taskId);
      assert.ok(t.humanAnswerFields);
      for (const key of t.creatorCandidateKeys)
        assert.ok(
          candidates.get(key)?.songTaskIds.includes(t.taskId),
          "Broken song→Creator link",
        );
      for (const dependency of t.dependencies)
        assert.ok(tasks.has(dependency), "Missing dependency: " + dependency);
    }
  for (const c of ledger.candidates) {
    assert.equal(
      c.affectedRecordCount,
      uniq(c.affectedRecords.map(ref)).length,
    );
    assert.equal(
      c.affectedWorkCount,
      uniq(c.affectedRecords.map((a) => a.workId)).length,
    );
    for (const id of c.songTaskIds)
      assert.ok(
        tasks.get(id)?.creatorCandidateKeys.includes(c.candidateKey),
        "Broken Creator→song link",
      );
    for (const a of c.affectedRecords)
      assert.ok(
        c.songTaskIds.some((id) => id.startsWith(roleRef(a, a.role) + ":")),
        "Missing affected record role",
      );
    if (c.confirmedExistingCreatorId)
      assert.ok(
        !c.tasks.some((t) => t.category === "CREATOR_REGISTRATION"),
        "Existing Creator registration",
      );
  }
  assert.deepEqual(
    ledger.songs,
    ledger.songs.slice().sort(ordering),
    "Song sorting",
  );
  assert.deepEqual(
    ledger.candidates,
    ledger.candidates.slice().sort(candidateOrdering),
    "Creator sorting",
  );
  const sourceAudit = historicalSources(input).map((entry) => {
    const r = current.find((r) => ref(r) === ref(entry));
    assert.ok(r, "Historical record absent from current: " + ref(entry));
    const state = currentRole(r, entry.role, input.master.creators);
    const mapped = (songs.get(ref(r))?.tasks ?? [])
      .filter((t) => t.role === entry.role)
      .map((t) => t.taskId);
    if (
      state.pending &&
      !reviewedRole(input, r, entry.role) &&
      (entry.category === "split-review" ||
        entry.category === "unresolved-index/split")
    )
      assert.ok(
        mapped.some((id) => tasks.get(id).category === "SPLIT_REVIEW"),
        "Historical current split omitted: " + entry.sourceKey,
      );
    return {
      ...entry,
      title: r.title,
      band: r.band,
      workId: r.workId,
      currentRaw: state.raw,
      status: state.pending
        ? "MAPPED_CURRENT_UNRESOLVED"
        : "EXCLUDED_CURRENT_RESOLVED",
      taskIds: state.pending ? mapped : [],
      reason: state.pending
        ? entry.historicalRaw && entry.historicalRaw !== state.raw
          ? "過去rawは現行rawと異なる。現行担当のcollection/role/identity課題に対応し、過去主体を自動復活させない。"
          : "現行でも当該担当に人間作業が残る。"
        : "現行formal Creator参照で当該担当が解決済み。過去未解決項目を復活させない。",
    };
  });
  const unmapped = [
    ...currentAudit,
    ...sourceAudit.filter((x) => x.status === "MAPPED_CURRENT_UNRESOLVED"),
  ].filter((x) => !x.taskIds.length);
  assert.equal(unmapped.length, 0, "Unmapped current unresolved");
  const counts = Object.fromEntries(
    Object.keys(CATEGORIES).map((key) => [
      key,
      [...tasks.values()].filter((t) => t.category === key).length,
    ]),
  );
  const collection = (game, role) =>
    ledger.songs.filter(
      (s) =>
        (!game || s.game === game) &&
        s.tasks.some(
          (t) => t.category === "CREDIT_COLLECTION" && t.role === role,
        ),
    ).length;
  const metrics = {
    currentRecordCount: current.length,
    currentCreatorCount: input.master.creators.length,
    currentWorkCount: input.works.works.length,
    currentNextId: input.master.nextId,
    currentGameCounts: Object.fromEntries(
      Object.keys(input.games).map((g) => [
        g,
        current.filter((r) => r.game === g).length,
      ]),
    ),
    totalSongTodoRecords: ledger.songs.length,
    totalSongTasks: tasks.size,
    totalCreatorCandidates: ledger.candidates.length,
    threePlusRecordCreators: ledger.candidates.filter(
      (c) => c.affectedRecordCount >= 3,
    ).length,
    twoRecordCreators: ledger.candidates.filter(
      (c) => c.affectedRecordCount === 2,
    ).length,
    oneRecordCreators: ledger.candidates.filter(
      (c) => c.affectedRecordCount === 1,
    ).length,
    referenceOnlyCreatorCandidates: ledger.candidates.filter(
      (c) => c.conditionalOnGameCredit,
    ).length,
    existingCreatorRoleCandidates: ledger.candidates.filter(
      (c) => c.confirmedExistingCreatorId,
    ).length,
    unregisteredCreatorCandidates: ledger.candidates.filter(
      (c) => !c.confirmedExistingCreatorId,
    ).length,
    ournotesArrangerManualSongs: collection("ournotes", "arranger"),
    lyricistCollectionSongs: collection(null, "lyricist"),
    garupaArrangerCollectionSongs: collection("garupa", "arranger"),
    splitReviewTasks: counts.SPLIT_REVIEW,
    currentRawSplitReviewTasks: [...tasks.values()].filter(
      (t) =>
        t.category === "SPLIT_REVIEW" &&
        t.evidenceContext !== "REFERENCE_ONLY_GAME_UNVERIFIED",
    ).length,
    conditionalReleaseSplitReviewTasks: [...tasks.values()].filter(
      (t) =>
        t.category === "SPLIT_REVIEW" &&
        t.evidenceContext === "REFERENCE_ONLY_GAME_UNVERIFIED",
    ).length,
    categoryTaskCounts: counts,
    currentUnresolvedRecordRoles: currentAudit.length,
    sourceUnresolvedEntries: sourceAudit.length,
    mappedTodoEntries: sourceAudit.filter(
      (x) => x.status === "MAPPED_CURRENT_UNRESOLVED",
    ).length,
    excludedResolvedSourceEntries: sourceAudit.filter(
      (x) => x.status === "EXCLUDED_CURRENT_RESOLVED",
    ).length,
    unmappedCurrentUnresolved: unmapped.length,
  };
  const sourceCategoryCounts = Object.fromEntries(
    uniq(sourceAudit.map((x) => x.category)).map((category) => {
      const xs = sourceAudit.filter((x) => x.category === category);
      return [
        category,
        {
          total: xs.length,
          mapped: xs.filter((x) => x.taskIds.length).length,
          excludedCurrentResolved: xs.filter((x) => !x.taskIds.length).length,
          unmapped: 0,
        },
      ];
    }),
  );
  return {
    metrics,
    sourceCategoryCounts,
    currentAudit,
    sourceAudit,
    identitySourceAudit,
    unmapped,
  };
}

const md = (x) =>
  String(x ?? "未収集/未決定")
    .replaceAll("|", "\\|")
    .replace(/[\r\n]+/g, " ");
const shown = (x) =>
  x == null
    ? "未収集/未決定"
    : Array.isArray(x)
      ? x.length
        ? x
            .map((v) => (typeof v === "object" ? JSON.stringify(v) : v))
            .join(" / ")
        : "空配列（未承認なら不要とは断定しない）"
      : typeof x === "object"
        ? JSON.stringify(x)
        : String(x);
const songAnchor = (r) => `${r.game}-${r.recordId}`;
const candidateAnchor = (c) => "candidate-" + c.candidateKey;
const answerLine = (fields) =>
  Object.keys(fields)
    .map((k) => `${k}: ${shown(fields[k])}`)
    .join("； ");
function evidenceMD(evidence) {
  return evidence
    .map(
      (e) =>
        `  - ${md(e.document ?? e.sourceUrl ?? e.url ?? "保存済み一次根拠")}； ${md(e.locator ?? e.supports ?? e.note ?? "")}； status=${md(e.status ?? e.sourceType ?? "根拠記録")}； raw=${md(e.raw ?? "")}； reason=${md(e.reason ?? e.note ?? "")}； checkedAt=${md(e.checkedAt)}${e.sourceUrl ? `； URL=${md(e.sourceUrl)}` : ""}${e.sourceUrls?.length ? `； URLs=${e.sourceUrls.map(md).join(" / ")}` : ""}${e.variants?.length ? `； variants=${e.variants.map((v) => `${md(v.raw)} [${md(v.sourceUrl)} / ${md(v.evidenceId)} / ${md(v.sourceScope)} / ${md(v.applicability)}]`).join("； ")}` : ""}${e.humanReviewId ? `； humanReviewId=${md(e.humanReviewId)}` : ""}`,
    )
    .join("\n");
}

function songSection(s) {
  const out = [
    `<a id="${songAnchor(s)}"></a>`,
    `### ${GAME[s.game]}:${s.recordId} ${md(s.title)}`,
    "",
    `- [ ] ${GAME[s.game]}:${s.recordId}「${md(s.title)}」の下記回答を完了する`,
    "",
    `game=${GAME[s.game]} / recordId=${s.recordId} / band=${md(s.band)} / workId=${s.workId} / priority=${s.priority}`,
    "",
    "| role | current raw | 現行formal Creator | identity確認済み・欄全体未ID化 | unresolved表示部分 |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const role of CREDIT_ROLES) {
    const credit = s.currentCredits[role];
    const identified = uniq(
      s.tasks
        .filter(
          (t) =>
            t.role === role &&
            t.category === "ROLE_REVIEW" &&
            t.creatorCandidateKey,
        )
        .map((t) => t.action),
    );
    out.push(
      `| ${LABELS[role]} / ${role} | ${md(credit.raw)} | ${credit.resolvedCreators.length ? credit.resolvedCreators.map((c) => `${c.creatorId} ${md(c.name)}（表示 ${md(c.displayedText)}）`).join(" / ") : "正式参照なし"} | ${identified.map(md).join(" / ") || "なし"} | ${credit.unresolvedParts.map(md).join(" / ") || (credit.empty ? "原文未収集" : "なし")} |`,
    );
  }
  if (s.ournotesArrangerManual)
    out.push(
      "",
      `発売版参考raw：${s.ournotesArrangerManual.releaseVersionRaw.map(md).join(" / ") || "保存済み参考rawなし"}。発売版の値はゲーム版へ自動適用しない。`,
      "",
      `ゲーム内編曲の入力欄：${answerLine(s.ournotesArrangerManual.humanAnswerFields)}`,
    );
  for (const t of s.tasks) {
    out.push(
      "",
      `#### ${t.category} / ${t.role} / ${t.priority} / ${t.status}`,
      "",
      `taskId: ${t.taskId}`,
      "",
      `raw: ${md(t.raw)}${t.tokenRaw ? ` / 主体token:「${md(t.tokenRaw)}」` : ""}`,
      "",
      `理由: ${md(t.reason)}`,
      "",
      `実行: ${md(t.action)}`,
      "",
      `完了条件: ${md(t.completionCondition)}`,
      "",
      `回答欄: ${answerLine(t.humanAnswerFields)}`,
    );
    if (t.creatorCandidateKeys.length)
      out.push(
        "",
        `Creator候補: ${t.creatorCandidateKeys.map((k) => `[${k}](HUMAN_TODO_BY_CREATOR.md#candidate-${k})`).join(" / ")}`,
      );
    if (t.dependencies.length)
      out.push("", `先に回答するtask: ${t.dependencies.join(" / ")}`);
    out.push("", "根拠:", "", evidenceMD(t.evidence));
  }
  return out.join("\n");
}

export function renderSongs(ledger) {
  const songs = ledger.songs;
  const out = [
    "# 人間確認ToDo・曲別完全台帳",
    "",
    `基準HEAD: ${ledger.sourceHead}。現行raw・formal参照を正とする。各recordの完全なtask本文は一か所だけに置く。以下の分類章は同じファイル内の完全本文への索引。taskの回答を揃えてrecordのcheckboxを完了する。未回答はNEEDS_HUMAN、発売版だけの候補登録はBLOCKED。今回の適用はない。`,
    "",
    "## P0 最新・ゲーム内手動確認",
    "",
    ...songs
      .filter((s) => s.priority === "P0")
      .map(
        (s) =>
          `- [${GAME[s.game]}:${s.recordId} ${md(s.title)}](#${songAnchor(s)}) / ${md(s.band)} / ${s.workId} / ${s.latestAfterPhaseA ? "Phase A/B1後の追加曲" : "ゲーム内編曲原文の直接確認"}`,
      ),
  ];
  const chapters = [
    [
      "作詞credit未収集",
      (t, s) => t.category === "CREDIT_COLLECTION" && t.role === "lyricist",
    ],
    [
      "Garupa編曲credit未収集",
      (t, s) =>
        t.category === "CREDIT_COLLECTION" &&
        t.role === "arranger" &&
        s.game === "garupa",
    ],
    [
      "OurNotes編曲ゲーム内確認",
      (t, s) =>
        t.category === "CREDIT_COLLECTION" &&
        t.role === "arranger" &&
        s.game === "ournotes",
    ],
    [
      "Creator identity未解決",
      (t) =>
        ["CREATOR_IDENTITY", "CREATOR_REGISTRATION", "ALIAS_REVIEW"].includes(
          t.category,
        ),
    ],
    ["split review", (t) => t.category === "SPLIT_REVIEW"],
    [
      "その他",
      (t) =>
        [
          "ROLE_REVIEW",
          "DISPLAY_REVIEW",
          "GAME_VERSION_REVIEW",
          "METADATA_REVIEW",
        ].includes(t.category),
    ],
  ];
  for (const [title, accept] of chapters) {
    out.push(
      "",
      `## ${title}`,
      "",
      "| record・曲名 | band / Work | role / category / priority |",
      "| --- | --- | --- |",
    );
    for (const s of songs.filter((s) => s.tasks.some((t) => accept(t, s))))
      out.push(
        `| [${GAME[s.game]}:${s.recordId} ${md(s.title)}](#${songAnchor(s)}) | ${md(s.band)} / ${s.workId} | ${s.tasks
          .filter((t) => accept(t, s))
          .map((t) => `${t.role} / ${t.category} / ${t.priority}`)
          .join("； ")} |`,
      );
  }
  out.push(
    "",
    "## 曲別task完全本文",
    "",
    "OurNotesの編曲未収集recordは次の独立章に全taskをまとめる。ここはpriority → game → recordId順。",
    "",
  );
  for (const s of songs.filter((s) => !s.ournotesArrangerManual))
    out.push(songSection(s), "");
  out.push(
    "## OurNotes 編曲ゲーム内確認リスト",
    "",
    "対象recordごとにcheckboxを一つ置く。発売版参考rawの有無を明示し、同じrecordの作詞・作曲・Creator課題もこの節内に全件記載する。priority → game → recordId順。",
    "",
  );
  for (const s of songs.filter((s) => s.ournotesArrangerManual))
    out.push(songSection(s), "");
  return out.join("\n");
}

function candidateSection(c) {
  const out = [
    `<a id="${candidateAnchor(c)}"></a>`,
    `### ${md(c.standardNameCandidate)} / ${c.priority}`,
    "",
    `candidateKey: ${c.candidateKey}`,
    "",
    `影響：${c.affectedRecordCount}収録 / ${c.affectedWorkCount} Work / ${c.affectedGames.map((g) => GAME[g]).join(" / ")}。現行rawの対象=${c.currentRecordCount}収録、発売版参考の対象=${c.referenceOnlyRecordCount}収録（この参考担当のゲーム参加は未確定。同じrecordの異なるroleが双方に入る場合がある）。`,
    "",
    `raw variants: ${c.rawVariants.map((r) => `「${md(r)}」`).join(" / ")}`,
    "",
    `role: ${c.roles.join(" / ")} / confidence: ${c.currentConfidence} / type候補: ${md(c.typeCandidate)}（${c.typeStatus}）`,
    "",
    `読み/sortKey候補: ${md(c.reading)}（${c.readingStatus}） / slug候補: ${md(c.slugCandidate)}（${c.slugStatus}）`,
    "",
    `aliases: ${md(shown(c.aliases))} / alias確認候補: ${md(shown(c.aliasReviewCandidates))}`,
    "",
    `既存Creator候補: ${c.existingCreatorCandidates.map((x) => `${x.creatorId}「${md(x.name)}」：${md(x.basis)}`).join(" / ") || "現在のmasterに対応する承認済みIDなし"}`,
    "",
    `所属: ${c.affiliations.map(md).join(" / ") || "所属付き表記の記録なし"}。${c.affiliations.length ? "個人の所属表記として確認し、組織自体への参加を二重計上しない。組織が主語のcreditなら組織主体として別途回答する。" : c.typeCandidate === "organization" || /CLUB|BABYS|LOVE|Garden|Monster/.test(c.standardNameCandidate) ? "個人/ユニット/組織のどれがcredit主体か確認する。" : "主体typeは人間が確認する。"}`,
    "",
    `候補group根拠: ${c.groupBasis.map(md).join(" / ")}`,
    "",
    `未解決理由: ${c.unresolvedReasons.map(md).join(" / ") || "role/境界/ゲーム版一致に未承認箇所がある。"}`,
    "",
    `人間の実行: ${md(c.humanAction)}`,
    "",
    `完了条件: ${md(c.completionCondition)}`,
    "",
    "#### affected songs（収録・担当ごとに全件）",
    "",
    "| game:ID・曲名 | band / Work | role / raw | 現在の扱い・実行内容 |",
    "| --- | --- | --- | --- |",
  ];
  if (c.recordedHumanReview)
    out.push(
      "",
      `回答済み人物情報（追加確認欄と区別）：${md(JSON.stringify(c.recordedHumanReview.suppliedFields))}。不足：${c.recordedHumanReview.missingFields.join(" / ")}。原本：${P0_REVIEW}`,
      "",
    );
  for (const a of c.affectedRecords)
    out.push(
      `| [${GAME[a.game]}:${a.recordId} ${md(a.title)}](HUMAN_TODO_BY_SONG.md#${songAnchor(a)}) | ${md(a.band)} / ${a.workId} | ${a.role} / ${md(a.raw)} | ${a.creditContext} / ${md(a.humanAction)} |`,
    );
  out.push("", "#### 人間回答task", "");
  for (const t of c.tasks)
    out.push(
      `- [ ] ${t.category} / ${t.priority} / ${t.status} / ${md(t.action)}`,
      "",
      `  taskId: ${t.taskId}`,
      "",
      `  理由: ${md(t.reason)}`,
      "",
      `  完了: ${md(t.completionCondition)}`,
      "",
      `  入力: ${answerLine(t.humanAnswerFields)}`,
      "",
    );
  out.push(
    `相互参照songTaskIds: ${c.songTaskIds.join(" / ")}`,
    "",
    "#### 根拠",
    "",
    evidenceMD(c.evidence),
  );
  return out.join("\n");
}

export function renderCreators(ledger) {
  const out = [
    "# 人間確認ToDo・Creator候補別完全台帳",
    "",
    `基準HEAD: ${ledger.sourceHead}。候補群は人物同一性の断定ではない。既存B1 identity groupを維持し、境界が未確定なら候補tokenの同定とsplit承認を別に回答する。発売版参考だけの候補はゲーム内確認を先に行う。priority → affectedRecordCount降順 → standardName順。`,
    "",
  ];
  for (const [title, accept] of [
    ["3収録以上", (c) => c.affectedRecordCount >= 3],
    ["2収録", (c) => c.affectedRecordCount === 2],
    ["1収録のみのCreator候補", (c) => c.affectedRecordCount === 1],
  ]) {
    out.push(
      `## ${title}`,
      "",
      "完全本文への索引。全affected曲・全回答欄は、この同じファイルの各候補本文に記載。",
      "",
    );
    for (const c of ledger.candidates.filter(accept))
      out.push(
        `- [${md(c.standardNameCandidate)}](#${candidateAnchor(c)}) / ${c.candidateKey} / ${c.priority} / ${c.affectedRecordCount}収録 / ${c.affectedWorkCount} Work${c.conditionalOnGameCredit ? " / 発売版参考のみ・ゲーム未確認" : ""}`,
      );
    out.push("");
  }
  out.push("## Creator候補・全task完全本文", "");
  for (const c of ledger.candidates) out.push(candidateSection(c), "");
  return out.join("\n");
}

export function renderSummary(verification) {
  const m = verification.metrics;
  return [
    "# 人間確認ToDo集計",
    "",
    "[曲別完全台帳](HUMAN_TODO_BY_SONG.md) / [Creator候補別完全台帳](HUMAN_TODO_BY_CREATOR.md) / [入力・更新手順](README.md)",
    "",
    "| 項目 | 現行集計 |",
    "| --- | ---: |",
    ...Object.entries(m)
      .filter(([, v]) => typeof v === "number")
      .map(([k, v]) => `| ${k} | ${v} |`),
    ...Object.entries(m.categoryTaskCounts).map(
      ([k, v]) => `| ${k} song tasks | ${v} |`,
    ),
    "",
    `現行：Garupa ${m.currentGameCounts.garupa} / OurNotes ${m.currentGameCounts.ournotes}。recordはgame+IDで数え、affectedRecordCountはrole重複を除く。同じWorkの別recordは統合しない。`,
    "",
    "発売版参考だけのCreator候補を含む。条件付き候補はゲーム内creditへの登場が確認できるまで正式ゲーム参加者として数えない。既存Creatorのrole/境界課題は新規登録対象にしない。過去未解決資料は各entryをcurrentへ照合し、現行formal参照で解決済みのentryは除外した。",
    "",
    `主体${m.totalCreatorCandidates}件のうち、未登録の同一主体候補${m.unregisteredCreatorCandidates}件、既存IDの担当/表記/版の確認${m.existingCreatorRoleCandidates}件。発売版参考だけの${m.referenceOnlyCreatorCandidates}件はこの総数の内数。split ${m.splitReviewTasks}件はrecord+role単位のtask数で、現行rawの境界${m.currentRawSplitReviewTasks}件とゲーム原文確認に依存する発売版参考${m.conditionalReleaseSplitReviewTasks}件。過去のsplit群の数と混同しない。source entry数は入力分類間で重複があり、曲数・主体数ではない。`,
    "",
    "| 入力分類 | 読取entry | current対応 | 現行解決済み除外 | 未対応 |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...Object.entries(verification.sourceCategoryCounts).map(
      ([k, v]) =>
        `| ${k} | ${v.total} | ${v.mapped} | ${v.excludedCurrentResolved} | ${v.unmapped} |`,
    ),
    "",
    "台帳生成処理の前後で4data SHA一致、A/B1保護資料のSHA一致、HEAD不変を検証。台帳生成自体によるデータ変更0。別途保存した人間回答の適用内容と変更前SHAは人間レビュー資料を参照。commit/push/deploy未実施。",
    "",
  ].join("\n");
}

function renderReadme(input) {
  return `# Creator / credit 人間確認ToDo台帳

[曲別完全台帳](HUMAN_TODO_BY_SONG.md) / [Creator候補別完全台帳](HUMAN_TODO_BY_CREATOR.md) / [集計](HUMAN_TODO_SUMMARY.md)

[曲JSON](HUMAN_TODO_BY_SONG.json) / [Creator JSON](HUMAN_TODO_BY_CREATOR.json) / [完全性検証](HUMAN_TODO_VERIFICATION.json)

この台帳は現行repositoryの人間作業を列挙する。各recordはgame+recordIdで識別する。曲本文は一つのセクションに全taskをまとめ、OurNotes編曲未収集曲は独立章にまとめる。Creator候補はB1 identity groupを使い、追加recordや候補表記の同一性は人間確認待ちのまま保持する。JSONのsourceHeadとsourceDataHashesが作業対象の基準。

作業は各taskのactionを実行し、humanAnswerFieldsへ回答する。根拠に対象曲名・band・game・role・版・確認日時と出典を含める。情報がない場合は不明/欄なしを明示し、空欄を担当者なし・歌詞なしへ置き換えない。曲側checkboxはそのrecordの全taskを回答してからチェックする。Creator側は主体/登録情報の各checkboxを回答してからチェックする。

JSONを編集する場合、taskIdとcandidateKeyを変更しない。song taskのcreatorCandidateKeyとCreatorのsongTaskIdsが相互参照。各taskの回答を同じtaskIdでMarkdownにも書ける。aliasesが不要なら[]、同一の既存CreatorがないならsamePersonAsに「既存IDなし」と明示する。回答者と根拠はnotes/sourceNoteへ記録する。各record/roleを承認した範囲を明記する。

状態はTODO、BLOCKED、NEEDS_HUMAN、READY_FOR_CODEX_APPLY。人間判断が済み、completionConditionを満たす回答・出典・適用範囲が揃ったtaskだけREADY_FOR_CODEX_APPLYにする。依存task未回答はBLOCKEDのまま。発売版参考の編曲候補はゲーム内原文との一致を先に確認し、発売版からゲームへ自動転記しない。候補type/personや暫定sortKey/slugは承認済み値ではない。所属を個人と組織参加の二重計上に使わない。

台帳生成scriptは読み取りと台帳作成だけを行う。データ・UI・公開設定への適用機能はない。適用依頼では回答済みtaskだけを選び、sourceHead/sourceDataHashesとの差を確認し、ID/slug衝突・同一性・role・版・表示維持を検証してから別途適用する。未回答taskは適用対象外。

${input?.humanReview ? "2026-10-06 P0回答のゲーム編曲81担当とOurNotes:86作詞原文を適用済み。回答原本・旧taskId対応・当時の不足欄・検証は [人間レビュー](../../human-review/creator-credits-p0-2026-10-06/REPORT.md) に保存。ゲーム原文が正式参照で解決しても、未回答の発売版との編曲同一性はGAME_VERSION_REVIEWに残す。" : ""}
${input?.humanRegistration?.status === "APPLIED" ? "カンザキイオリの追加回答を適用し、cr-0125として正式登録。指定3曲の作詞・作曲6担当を紐付け、登録・同定残件を解決。[追加回答と検証](../../human-review/creator-kanzaki-2026-10-06/REPORT.md)。" : input?.humanReview ? "カンザキイオリは確認欄が未完備のため未登録。" : ""}
${input?.kanowRegistration?.status === "APPLIED" ? "加納望のP1回答と所属「なし」の追加回答を適用し、" + input.kanowRegistration.creator.id + "として正式登録。明示承認されたGarupaの10収録だけに共同編曲relationを適用。原文・所属表記・順序を保持し、未回答の備考や他曲へ補完・展開しない。[P1回答と検証](../../human-review/creator-kanow-p1-2026-10-07/REPORT.md)。" : ""}

生成：node scripts/research/creator-credit-human-todo.mjs generate

検証：node scripts/research/creator-credit-human-todo.mjs verify

テスト：node --test tests/research/creator-credit-human-todo.test.mjs

生成は上記7成果物だけを書き込む。回答済み/状態変更/checkbox変更を検知すると上書きを拒否する。再生成前に人間回答を保全する。verifyは生成時の入力SHAと現行を照合し、全current record/role・過去source entry・cross-link・Markdown本文/checkboxを検証する。

task category

| category | 意味 |
| --- | --- |
${Object.entries(CATEGORIES)
  .map(([k, v]) => `| ${k} | ${v} |`)
  .join("\n")}

DISPLAY_REVIEW/METADATA_REVIEWは現行で独立の未承認課題が確認できなければ0件。過去human承認済みmetadataを再度未完了にしない。Composerの現行rawも全件走査し、B2原文がないものは現行rawを保持して対象曲/roleの一次確認taskにする。
`;
}

function renderProof(ledger, verification, songsMD, creatorsMD) {
  for (const s of ledger.songs)
    assert.equal(
      songsMD.split(`<a id="${songAnchor(s)}"></a>`).length - 1,
      1,
      "Song full section exactly once",
    );
  for (const c of ledger.candidates) {
    assert.equal(
      creatorsMD.split(`<a id="${candidateAnchor(c)}"></a>`).length - 1,
      1,
      "Creator full section exactly once",
    );
    const section = creatorsMD
      .split(`<a id="${candidateAnchor(c)}"></a>`)[1]
      .split('<a id="candidate-')[0];
    for (const a of c.affectedRecords)
      assert.ok(
        section.includes(`${GAME[a.game]}:${a.recordId} ${md(a.title)}`) &&
          section.includes(md(a.band)),
        "Affected song missing in Markdown",
      );
  }
  for (const task of ledger.songs.flatMap((s) => s.tasks))
    assert.ok(
      songsMD.includes("taskId: " + task.taskId),
      "Task Markdown omission",
    );
  const manualSection = songsMD.split(
    "## OurNotes 編曲ゲーム内確認リスト\n",
  )[1];
  assert.equal(
    (manualSection.match(/^- \[ \]/gm) ?? []).length,
    verification.metrics.ournotesArrangerManualSongs,
    "One manual checkbox per record",
  );
  return {
    everySongFullSectionOnce: true,
    everyCandidateFullSectionOnce: true,
    everyAffectedSongRendered: true,
    everySongTaskRendered: true,
    manualCheckboxCount: verification.metrics.ournotesArrangerManualSongs,
    sortedByPriority: true,
  };
}

export function assertAnswersUntouched(directory = OUTPUT, expectedFiles = {}) {
  const proofPath = path.join(directory, "HUMAN_TODO_VERIFICATION.json");
  if (fs.existsSync(proofPath))
    for (const [name, info] of Object.entries(
      readJSON(proofPath).generatedArtifacts,
    )) {
      const artifact = path.join(directory, name);
      const currentHash = hash(fs.readFileSync(artifact));
      // Recover our own interrupted writes only when bytes exactly equal the
      // newly computed artifact. Any other edit still protects human answers.
      assert.ok(
        currentHash === info.sha256 ||
          (expectedFiles[name] !== undefined &&
            currentHash === hash(expectedFiles[name])),
        "Artifact edited; preserve human answers: " + name,
      );
    }
  for (const name of [
    "HUMAN_TODO_BY_SONG.json",
    "HUMAN_TODO_BY_CREATOR.json",
  ]) {
    const p = path.join(directory, name);
    if (!fs.existsSync(p)) continue;
    const data = readJSON(p);
    const walk = (v) => {
      if (!v || typeof v !== "object") return;
      if (v.taskId && v.status)
        assert.ok(
          ["NEEDS_HUMAN", "BLOCKED"].includes(v.status),
          "Human status changed; preserve answers",
        );
      if (v.humanAnswerFields)
        assert.ok(
          Object.values(v.humanAnswerFields).every((x) => x == null),
          "Human answers present; refuse overwrite",
        );
      Object.values(v).forEach(walk);
    };
    walk(data);
  }
  for (const name of ["HUMAN_TODO_BY_SONG.md", "HUMAN_TODO_BY_CREATOR.md"]) {
    const p = path.join(directory, name);
    if (fs.existsSync(p))
      assert.ok(
        !/- \[[xX]\]/.test(fs.readFileSync(p, "utf8")),
        "Human checkbox changed; refuse overwrite",
      );
  }
}

export function run(mode) {
  assert.ok(["generate", "verify"].includes(mode), "Use generate or verify");
  const input = loadInputs();
  const executionHead = input.head;
  const previousProofPath = path.join(OUTPUT, "HUMAN_TODO_VERIFICATION.json");
  if (fs.existsSync(previousProofPath)) {
    const previous = readJSON(previousProofPath);
    // An unchanged source snapshot retains its recorded ancestor through later commits.
    // Current input hashes and all generated bytes still undergo the full verification.
    if (
      JSON.stringify(previous.inputHashes) === JSON.stringify(input.inputHashes)
    ) {
      assert.match(previous.sourceHead, /^[a-f0-9]{40}$/);
      execFileSync("git", [
        "merge-base",
        "--is-ancestor",
        previous.sourceHead,
        executionHead,
      ]);
      input.head = previous.sourceHead;
    }
  }
  const ledger = buildLedger(input);
  const verification = verifyLedger(input, ledger);
  const songsMD = renderSongs(ledger),
    creatorsMD = renderCreators(ledger);
  const markdownProof = renderProof(ledger, verification, songsMD, creatorsMD);
  const core = {
    schemaVersion: ledger.schemaVersion,
    sourceHead: ledger.sourceHead,
    sourceDataHashes: ledger.sourceDataHashes,
  };
  const files = {
    "README.md": renderReadme(input),
    "HUMAN_TODO_BY_SONG.md": songsMD,
    "HUMAN_TODO_BY_CREATOR.md": creatorsMD,
    "HUMAN_TODO_BY_SONG.json":
      JSON.stringify({ ...core, records: ledger.songs }, null, 2) + "\n",
    "HUMAN_TODO_BY_CREATOR.json":
      JSON.stringify({ ...core, candidates: ledger.candidates }, null, 2) +
      "\n",
    "HUMAN_TODO_SUMMARY.md": renderSummary(verification),
  };
  const after = digestFiles(DATA_FILES);
  assert.deepEqual(
    after,
    ledger.sourceDataHashes,
    "Current data must remain byte-identical",
  );
  assert.equal(
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    executionHead,
    "HEAD unchanged",
  );
  const proof = {
    schemaVersion: 1,
    result: "PASS",
    sourceHead: input.head,
    ...verification,
    markdownProof,
    sourceDataHashesBefore: ledger.sourceDataHashes,
    sourceDataHashesAfter: after,
    currentDataChanged: 0,
    inputHashes: input.inputHashes,
    protectedResearchFileCount: Object.keys(input.protectedResearchHashes)
      .length,
    protectedResearchHashes: input.protectedResearchHashes,
    headUnchanged: true,
    commitPushDeployPerformed: false,
    taskAnswersSupplied: false,
    appliedHumanReview: input.humanReview
      ? {
          document: P0_REVIEW,
          inputSha256: input.humanReview.inputSha256,
          reviewedRecordRoles: input.humanReview.reviews.length,
          registration: input.humanReview.registration.status,
        }
      : null,
    appliedCreatorRegistration: input.humanRegistration
      ? {
          document: KANZAKI_REVIEW,
          inputSha256: input.humanRegistration.inputSha256,
          creatorId: input.humanRegistration.creator.id,
          status: input.humanRegistration.status,
          scopedRelations: input.humanRegistration.scopes.length,
          missingFields: input.humanRegistration.missingFields,
        }
      : null,
    appliedP1Registration: input.kanowRegistration
      ? {
          document: KANOW_REVIEW,
          inputSha256: input.kanowRegistration.inputSha256,
          clarificationSha256: input.kanowRegistration.clarificationSha256,
          creatorId: input.kanowRegistration.creator.id,
          scopedRecords: input.kanowRegistration.scopes.length,
          unprovidedOptionalFields:
            input.kanowRegistration.answers.unprovidedFields,
        }
      : null,
    appliedP2Review: input.p2Review
      ? {
          document: P2_REVIEW,
          inputSha256: input.p2Review.inputHash,
          registeredCreators: input.p2Review.registered.length,
          reviewedRecordRoles: input.p2Review.reviews.length,
          heldCandidates: input.p2Review.held.map((c) => c.candidateKey),
        }
      : null,
    generatedArtifacts: Object.fromEntries(
      Object.entries(files).map(([name, text]) => [
        name,
        { sha256: hash(text), bytes: Buffer.byteLength(text) },
      ]),
    ),
  };
  files["HUMAN_TODO_VERIFICATION.json"] = JSON.stringify(proof, null, 2) + "\n";
  if (mode === "generate") {
    assertAnswersUntouched(OUTPUT, files);
    fs.mkdirSync(OUTPUT, { recursive: true });
    for (const [name, content] of Object.entries(files))
      fs.writeFileSync(path.join(OUTPUT, name), content);
  } else {
    for (const [name, content] of Object.entries(files))
      assert.equal(
        fs
          .readFileSync(path.join(OUTPUT, name), "utf8")
          .replaceAll("\r\n", "\n"),
        content,
        "Artifact stale/edited: " + name,
      );
  }
  assert.deepEqual(
    digestFiles(DATA_FILES),
    after,
    "Output writing must not touch source data",
  );
  assert.deepEqual(
    digestFiles(Object.keys(input.protectedResearchHashes)),
    input.protectedResearchHashes,
    "A/B1 unchanged after generation",
  );
  assert.deepEqual(
    digestFiles(Object.keys(input.inputHashes)),
    input.inputHashes,
    "All evidence inputs unchanged after generation",
  );
  console.log(JSON.stringify({ mode, ...verification.metrics }, null, 2));
  return { input, ledger, proof };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  run(process.argv[2] ?? "verify");
