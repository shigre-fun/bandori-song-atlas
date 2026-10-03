import fs from "node:fs";
import {
  loadLegacyCredits,
  validateReferenceUpdates,
} from "./legacy-references.mjs";
import path from "node:path";
import crypto from "node:crypto";
import {
  isConfirmedEvidence,
  isHumanReview,
  permitsNameChange,
} from "./creator-evidence.mjs";
import { fileURLToPath } from "node:url";
import { GAMES } from "../../src/js/site-config.js";
import {
  CREDIT_ROLES,
  creditText,
  validateCreatorDatabase,
} from "../../src/js/creators-data.js";
import {
  applyConfirmedCreators,
  reviewCreatorCandidates,
  markdown,
} from "./review-creators.mjs";
const directory = "docs/migrations/creators-2026-10-02";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const write = (p, value) =>
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + "\n");
export function confirmedResearchMap(master, currentMap, research) {
  const mapping = structuredClone(currentMap);
  mapping.phase = 3;
  mapping.applyRoles = ["composer"];
  mapping.note =
    "既存固定IDと一次情報/明示human-reviewのCONFIRMEDのみ。approvedReferencesの既存曲文脈限定。PROBABLE/UNRESOLVEDは登録しない。根拠はcreator-research.jsonとhuman-review資料。";
  for (const c of mapping.creators) c.researchStatus = "CONFIRMED";
  let nextId = master.nextId;
  for (const e of research.entries.filter((e) => e.status === "CONFIRMED")) {
    if (!e.evidence.some(isConfirmedEvidence))
      throw new Error(`未読・根拠不足: ${e.name}`);
    if (!["person", "organization", "unit"].includes(e.type))
      throw new Error(`type未確認: ${e.name}`);
    if (
      !e.sortKey ||
      !["confirmed", "provisional-original"].includes(e.sortKeyStatus)
    )
      throw new Error(`sortKey未確認: ${e.name}`);
    if (e.sortKeyStatus === "provisional-original" && e.sortKey !== e.name)
      throw new Error(`推測読み禁止: ${e.name}`);
    if (!e.records?.length || !e.originals?.length)
      throw new Error(`曲文脈不足: ${e.name}`);
    const matches = mapping.creators.filter(
      (c) =>
        c.name === e.name ||
        [c.name, ...(c.aliases ?? [])].some((r) => e.originals.includes(r)),
    );
    if (matches.length > 1) throw new Error(`既存ID衝突: ${e.name}`);
    const existing = matches[0];
    if (
      existing &&
      (existing.type !== e.type ||
        (existing.name !== e.name &&
          !permitsNameChange(
            e.canonicalNameChange,
            existing.id,
            existing.name,
            e.name,
          )))
    )
      throw new Error(`固定ID/type変更: ${e.name}`);
    const id = existing?.id ?? `cr-${String(nextId++).padStart(4, "0")}`;
    const value = {
      id,
      name: e.name,
      type: e.type,
      aliases: [
        ...new Set([
          ...(existing?.aliases ?? []),
          ...e.originals,
          ...(e.aliases ?? []),
        ]),
      ].filter((r) => r !== e.name),
      sortKey: e.sortKey,
      sortKeyStatus: e.sortKeyStatus,
      slug: e.slug ?? existing?.slug ?? `creator-${id.slice(3)}`,
      researchStatus: "CONFIRMED",
      approvedReferences: e.records,
      identityEvidence:
        existing?.identityEvidence ?? `根拠: creator-research.json / ${e.name}`,
    };
    if (e.evidence.some(isHumanReview))
      value.identityEvidence = `人間確認（2026-10-02）と既存一次根拠: creator-research.json / ${e.name}`;
    if (e.canonicalNameChange)
      value.canonicalNameChange = structuredClone(e.canonicalNameChange);
    const history = [
      ...new Set([
        ...(existing?.previousSlugs ?? []),
        ...(e.previousSlugs ?? []),
        ...(existing && existing.slug !== value.slug ? [existing.slug] : []),
      ]),
    ];
    if (history.length) value.previousSlugs = history;
    if (existing) Object.assign(existing, value);
    else mapping.creators.push(value);
  }
  const aliases = new Map(),
    slugs = new Set();
  for (const c of mapping.creators) {
    if (slugs.has(c.slug)) throw new Error("slug衝突");
    slugs.add(c.slug);
    for (const old of c.previousSlugs ?? []) {
      if (slugs.has(old)) throw new Error("current/previous slug衝突");
      slugs.add(old);
    }
    for (const r of [c.name, ...c.aliases]) {
      if (aliases.has(r) && aliases.get(r) !== c.id)
        throw new Error("alias衝突");
      aliases.set(r, c.id);
    }
  }
  return mapping;
}
export function coverage(songs) {
  const resolved = (s) =>
    s.creditDisplay.composer?.some((p) => p.creatorId) &&
    !s.creditDisplay.composer.some((p) => p.unresolved);
  const records = songs.filter(resolved).length;
  const workIds = [...new Set(songs.map((s) => s.workId))];
  const works = workIds.filter((id) =>
    songs.filter((s) => s.workId === id).every(resolved),
  ).length;
  return {
    recordings: records,
    totalRecordings: songs.length,
    recordingPercent: Number(((records / songs.length) * 100).toFixed(2)),
    works,
    totalWorks: workIds.length,
    workPercent: Number(((works / workIds.length) * 100).toFixed(2)),
  };
}
export function runResearch(mode) {
  if (!["report", "apply", "verify"].includes(mode))
    throw new Error("report/apply/verifyを指定");
  const master = read("data/creators.json"),
    works = read("data/works.json"),
    currentMap = read("docs/migrations/creator-map.json"),
    research = read(`${directory}/creator-research.json`),
    legacy = loadLegacyCredits(directory);
  const documents = Object.fromEntries(
    Object.values(GAMES).map((g) => [g.id, read(g.dataFile)]),
  );
  const beforeSongs = Object.values(GAMES).flatMap((g) =>
    documents[g.id].groups.flatMap((gr) =>
      gr.songs.map((s) => ({ ...s, gameId: g.id })),
    ),
  );
  const mapping = confirmedResearchMap(master, currentMap, research);
  const plan = applyConfirmedCreators(master, works, documents, mapping);
  validateReferenceUpdates(plan.songs, directory);
  if (
    plan.songs.length !== 884 ||
    works.works.length !== 823 ||
    plan.warnings.length
  )
    throw new Error("収録/Work/warning条件違反");
  if (JSON.stringify(works) !== JSON.stringify(plan.works))
    throw new Error("Work構造変更禁止");
  let comparisons = 0;
  for (const old of legacy)
    for (const role of CREDIT_ROLES) {
      comparisons++;
      if (
        creditText(
          plan.songs.find((s) => `${s.gameId}:${s.id}` === old.reference),
          role,
          plan.master.creators,
        ) !== (old[role] ?? "")
      )
        throw new Error("旧表示変更");
    }
  const strip = (s) => {
    const copy = structuredClone(s);
    delete copy.credits;
    delete copy.creditDisplay;
    return copy;
  };
  if (
    JSON.stringify(beforeSongs.map(strip)) !==
    JSON.stringify(plan.songs.map(strip))
  )
    throw new Error("旧フィールド/WorkID変更");
  const review = reviewCreatorCandidates(legacy, plan.songs, mapping, research);
  const baseline = read(`${directory}/phase3-before-review.json`);
  const summary = {
    phase: 3,
    masterBefore: master.creators.length,
    masterAfter: plan.master.creators.length,
    addedCreators: plan.master.creators.length - master.creators.length,
    changedTokens: plan.changed.length,
    remainingRawStrings: review.summary.remainingUnidentifiedStrings,
    baselineRemainingRawStrings: baseline.summary.remainingUnidentifiedStrings,
    rawStringsNewlyResolved:
      baseline.summary.remainingUnidentifiedStrings -
      review.summary.remainingUnidentifiedStrings,
    beforeCoverage: coverage(beforeSongs),
    afterCoverage: coverage(plan.songs),
    legacyDisplayComparisons: comparisons,
    warnings: plan.warnings,
    research: research.summary,
    slugChanges: master.creators
      .filter(
        (c) => mapping.creators.find((x) => x.id === c.id)?.slug !== c.slug,
      )
      .map((c) => ({
        id: c.id,
        from: c.slug,
        to: mapping.creators.find((x) => x.id === c.id).slug,
      })),
    changes: plan.changed,
  };
  if (mode === "verify") {
    validateCreatorDatabase(master, works, beforeSongs);
    if (
      plan.changed.length ||
      JSON.stringify(master) !== JSON.stringify(plan.master) ||
      JSON.stringify(currentMap) !== JSON.stringify(mapping)
    )
      throw new Error("再適用が非冪等");
    console.log(
      JSON.stringify(
        {
          mode,
          unchanged: true,
          coverage: summary.afterCoverage,
          comparisons,
          warnings: [],
        },
        null,
        2,
      ),
    );
    return;
  }
  if (mode === "report") {
    write(`${directory}/creator-map-proposed.json`, mapping);
    write(`${directory}/phase3-plan.json`, summary);
    write(`${directory}/creator-review-proposed.json`, review);
    fs.writeFileSync(
      `${directory}/creator-review-proposed.md`,
      markdown(review),
    );
    console.log(JSON.stringify({ ...summary, changes: undefined }, null, 2));
    return;
  }
  const proposal = read(`${directory}/creator-map-proposed.json`),
    reported = read(`${directory}/phase3-plan.json`);
  if (
    JSON.stringify(proposal) !== JSON.stringify(mapping) ||
    JSON.stringify(reported) !== JSON.stringify(summary)
  )
    throw new Error("実体がreport後に変化。reportを再実行");
  const backup = `.cache/creator-phase3-${Date.now()}`;
  const paths = [
    "docs/migrations/creator-map.json",
    "data/creators.json",
    "data/works.json",
    ...Object.values(GAMES).map((g) => g.dataFile),
    `${directory}/creator-review.json`,
    `${directory}/creator-review.md`,
    `${directory}/credit-report.json`,
    `${directory}/work-report.json`,
  ];
  const hashes = {};
  for (const p of paths) {
    fs.mkdirSync(path.dirname(`${backup}/${p}`), { recursive: true });
    fs.copyFileSync(p, `${backup}/${p}`);
    hashes[p] = crypto
      .createHash("sha256")
      .update(fs.readFileSync(p))
      .digest("hex");
  }
  write(`${backup}/manifest.json`, {
    phase: 3,
    beforeHashes: hashes,
    plan: summary,
  });
  write("docs/migrations/creator-map.json", mapping);
  write("data/creators.json", plan.master);
  for (const g of Object.values(GAMES)) write(g.dataFile, plan.documents[g.id]);
  write(`${directory}/creator-review.json`, review);
  fs.writeFileSync(`${directory}/creator-review.md`, markdown(review));
  const credit = read(`${directory}/credit-report.json`);
  credit.summary = {
    ...credit.summary,
    creators: plan.master.creators.length,
    linkedCreators: plan.master.creators.filter((c) =>
      plan.songs.some((s) => s.credits.some((r) => r.creatorId === c.id)),
    ).length,
    migratedRecords: plan.songs.filter((s) => s.credits.length).length,
    reviewStrings: review.summary.remainingUnidentifiedStrings,
    warnings: [],
  };
  for (const row of credit.entries) {
    const r = review.entries.find(
      (r) => r.original === row.original && r.role === row.role,
    );
    row.parts = r.parts.map((p) => ({
      ...p,
      reviewRequired: !p.creatorId,
      reason: p.creatorId
        ? "確認済みexact map（一次情報/既存ユーザー確認）"
        : "根拠不足・未調査",
    }));
    row.status = r.status;
    row.reviewRequired = r.status !== "AUTO_RESOLVED";
    row.plannedCreators = [
      ...new Set(r.parts.map((p) => p.creatorId).filter(Boolean)),
    ];
    row.aliasesCandidates = plan.master.creators
      .filter((c) => row.plannedCreators.includes(c.id))
      .flatMap((c) => c.aliases)
      .filter((a) => a !== row.original);
  }
  write(`${directory}/credit-report.json`, credit);
  write(`${directory}/phase3-applied.json`, summary);
  console.log(
    JSON.stringify(
      {
        mode,
        backup,
        master: summary.masterAfter,
        changedTokens: summary.changedTokens,
      },
      null,
      2,
    ),
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  runResearch(process.argv[2] ?? "report");
