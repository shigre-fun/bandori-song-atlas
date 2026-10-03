import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { GAMES } from "../../src/js/site-config.js";
import {
  CREDIT_ROLES,
  creditText,
  validateCreatorDatabase,
} from "../../src/js/creators-data.js";
import {
  loadLegacyCredits,
  validateReferenceUpdates,
} from "./legacy-references.mjs";
import { confirmedResearchMap, coverage } from "./research-creators.mjs";
import {
  applyConfirmedCreators,
  reviewCreatorCandidates,
  markdown,
} from "./review-creators.mjs";
export const directory = "docs/migrations/creators-2026-10-02";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
const hash = (p) =>
  crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const inputs = [
  "data/creators.json",
  "data/works.json",
  ...Object.values(GAMES).map((g) => g.dataFile),
  "docs/migrations/creator-map.json",
  `${directory}/creator-research.json`,
  `${directory}/human-review-input.json`,
];
const hashes = () => Object.fromEntries(inputs.map((p) => [p, hash(p)]));
const songsOf = (docs) =>
  Object.values(GAMES).flatMap((g) =>
    docs[g.id].groups.flatMap((gr) =>
      gr.songs.map((s) => ({ ...s, gameId: g.id, band: gr.band })),
    ),
  );
const withoutCredits = (docs) => {
  const result = structuredClone(docs);
  for (const d of Object.values(result))
    for (const gr of d.groups)
      for (const s of gr.songs) {
        delete s.credits;
        delete s.creditDisplay;
      }
  return result;
};
export function humanReviewPlan() {
  const input = read(`${directory}/human-review-input.json`),
    master = read("data/creators.json"),
    works = read("data/works.json"),
    currentMap = read("docs/migrations/creator-map.json");
  const documents = Object.fromEntries(
    Object.values(GAMES).map((g) => [g.id, read(g.dataFile)]),
  );
  const mapping = confirmedResearchMap(master, currentMap, input.research);
  const plan = applyConfirmedCreators(master, works, documents, mapping);
  validateReferenceUpdates(plan.songs, directory);
  assert.deepEqual(plan.works, works, "Work内容を変更しない");
  assert.deepEqual(
    withoutCredits(plan.documents),
    withoutCredits(documents),
    "旧項目/並行編集を保持",
  );
  assert.equal(plan.songs.length, 884);
  assert.equal(works.works.length, 823);
  assert.deepEqual(plan.warnings, []);
  const legacy = loadLegacyCredits(directory);
  let comparisons = 0;
  for (const old of legacy)
    for (const role of CREDIT_ROLES) {
      assert.equal(
        creditText(
          plan.songs.find((s) => `${s.gameId}:${s.id}` === old.reference),
          role,
          plan.master.creators,
        ),
        old[role] ?? "",
        `${old.reference}/${role}`,
      );
      comparisons++;
    }
  assert.equal(comparisons, 2652);
  const baseline = read(`${directory}/human-review-before-master.json`);
  const history = read(`${directory}/human-review-baseline.json`);
  for (const id of input.deferredIds) {
    assert.deepEqual(
      plan.master.creators.find((c) => c.id === id),
      baseline.creators.find((c) => c.id === id),
      `保留master ${id}`,
    );
    assert.deepEqual(
      mapping.creators.find((c) => c.id === id),
      history.deferredMap.find((c) => c.id === id),
      `保留map ${id}`,
    );
    const relations = (docs) =>
      songsOf(docs)
        .filter((s) => s.credits.some((r) => r.creatorId === id))
        .map((s) => ({
          reference: `${s.gameId}:${s.id}`,
          workId: s.workId,
          relations: s.credits.filter((r) => r.creatorId === id),
        }));
    assert.deepEqual(
      relations(plan.documents),
      history.deferredRelations[id],
      `保留relation ${id}`,
    );
  }
  const review = reviewCreatorCandidates(
    legacy,
    plan.songs,
    mapping,
    input.research,
  );
  const summary = {
    phase: "human-review",
    reviewDate: "2026-10-02",
    decisions: input.decisions.length,
    masterBefore: baseline.creators.length,
    masterAfter: plan.master.creators.length,
    addedCreators: plan.master.creators.filter(
      (c) => !baseline.creators.some((b) => b.id === c.id),
    ),
    updatedCreatorIds: baseline.creators
      .filter(
        (c) =>
          JSON.stringify(c) !==
          JSON.stringify(plan.master.creators.find((b) => b.id === c.id)),
      )
      .map((c) => c.id),
    slugChanges: baseline.creators
      .filter(
        (c) => c.slug !== plan.master.creators.find((b) => b.id === c.id).slug,
      )
      .map((c) => ({
        id: c.id,
        name: c.name,
        from: c.slug,
        to: plan.master.creators.find((b) => b.id === c.id).slug,
      })),
    aliasesBefore: baseline.creators.reduce((n, c) => n + c.aliases.length, 0),
    aliasesAfter: plan.master.creators.reduce(
      (n, c) => n + c.aliases.length,
      0,
    ),
    rawStrings: review.summary.creditStrings,
    resolvedRaw: review.summary.autoResolvedStrings,
    remainingRaw: review.summary.remainingUnidentifiedStrings,
    baselineRemainingRaw: read(`${directory}/human-review-before-summary.json`)
      .remainingUnidentifiedStrings,
    beforeCoverage: history.coverage,
    afterCoverage: coverage(plan.songs),
    idSlugs: plan.master.creators
      .filter((c) => /^creator-\d+$/.test(c.slug))
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    provisionalSortKeys: plan.master.creators.filter(
      (c) => c.sortKeyStatus === "provisional-original",
    ).length,
    previousSlugs: plan.master.creators.flatMap((c) =>
      (c.previousSlugs ?? []).map((from) => ({ id: c.id, from, to: c.slug })),
    ),
    legacyDisplayComparisons: comparisons,
    warnings: plan.warnings,
    changedTokens: plan.changed.length,
  };
  return {
    input,
    master,
    currentMap,
    documents,
    mapping,
    plan,
    review,
    summary,
  };
}
function shortNameReview(result) {
  const { input, plan, mapping } = result;
  const rows = input.deferredIds.flatMap((id) => {
    const creator = plan.master.creators.find((c) => c.id === id),
      approved = mapping.creators.find((c) => c.id === id);
    const research = input.research.entries.find(
      (e) => e.name === creator.name,
    );
    const matched = songsOf(plan.documents).filter((s) =>
      s.credits.some((r) => r.creatorId === id),
    );
    return matched.map((s) => ({
      rawCredit: s.composer,
      name: creator.name,
      creatorId: id,
      game: s.gameId,
      songId: s.id,
      title: s.title,
      band: s.band,
      workId: s.workId,
      basis: approved.identityEvidence,
      sources: research.evidence.filter((e) => e.url),
      displayOverride:
        s.credits.find((r) => r.creatorId === id).displayOverride ?? null,
      recordCount: matched.length,
    }));
  });
  write(`${directory}/short-name-review.json`, rows);
  const esc = (v) =>
    String(v ?? "（なし：標準名を表示）").replaceAll("|", "\\|");
  fs.writeFileSync(
    `${directory}/short-name-review.md`,
    "# 短名Creatorの対象曲確認\n\n2026-10-03作成。GEN / ARM / TAKE / yasu / KATSU は第3フェーズの同定・固定ID・明示map・既存relationをそのまま保持しています。今回の人間確認による再確定・統合・分離は行っていません。以下の6収録を確認してください。作曲欄のraw creditは共同作曲者も含む旧表記の全文です。\n\n| raw credit | 現標準名 | Creator ID | game | song ID | 曲名 | バンド / 歌唱主体 | Work ID | 現在のdisplayOverride | 適用収録数 |\n| --- | --- | --- | --- | ---: | --- | --- | --- | --- | ---: |\n" +
      rows
        .map(
          (r) =>
            "| " +
            [
              r.rawCredit,
              r.name,
              r.creatorId,
              r.game,
              r.songId,
              r.title,
              r.band,
              r.workId,
              r.displayOverride,
              r.recordCount,
            ]
              .map(esc)
              .join(" | ") +
            " |",
        )
        .join("\n") +
      "\n\n" +
      input.deferredIds
        .map((id) => {
          const r = rows.find((r) => r.creatorId === id);
          return (
            `## ${r.name}（${id}）\n\n現在の同定根拠：${r.basis}。第3フェーズでは次の一次情報を確認し、上記recordだけをapprovedReferencesとして適用しました。今後の同文字列は自動同定しません。\n\n` +
            r.sources
              .map(
                (s) =>
                  `- [${s.sourceType}](${s.url})（${s.checkedAt}, ${s.access}）：${s.supports}`,
              )
              .join("\n")
          );
        })
        .join("\n\n") +
      "\n",
  );
}
function currentReports({ plan, review }) {
  write(`${directory}/creator-review.json`, review);
  fs.writeFileSync(`${directory}/creator-review.md`, markdown(review));
  const old = read(`${directory}/credit-report.json`);
  Object.assign(old.summary, {
    creators: plan.master.creators.length,
    migratedRecords: plan.songs.filter((s) => s.credits.length).length,
    linkedCreators: plan.master.creators.filter((c) =>
      plan.songs.some((s) => s.credits.some((r) => r.creatorId === c.id)),
    ).length,
    reviewStrings: review.summary.remainingUnidentifiedStrings,
    warnings: plan.warnings,
  });
  for (const row of old.entries) {
    const r = review.entries.find(
      (r) => r.original === row.original && r.role === row.role,
    );
    row.parts = r.parts.map((p) => ({
      ...p,
      reviewRequired: !p.creatorId,
      reason: p.creatorId ? "明示exact map（既存/人間確認）" : "人間確認待ち",
    }));
    row.status = r.status;
    row.reviewRequired = r.status !== "AUTO_RESOLVED";
    row.plannedCreators = [
      ...new Set(r.parts.map((p) => p.creatorId).filter(Boolean)),
    ];
    row.aliasesCandidates = plan.master.creators
      .filter((c) => row.plannedCreators.includes(c.id))
      .flatMap((c) => c.aliases ?? [])
      .filter((a) => a !== row.original);
  }
  write(`${directory}/credit-report.json`, old);
}
export function runHumanReview(mode) {
  if (!["report", "apply", "verify"].includes(mode))
    throw new Error("report/apply/verifyを指定");
  const beforeHashes = hashes(),
    result = humanReviewPlan();
  assert.deepEqual(hashes(), beforeHashes, "読取中の競合を検出");
  if (mode === "verify") {
    validateCreatorDatabase(
      result.master,
      result.plan.works,
      result.plan.songs,
    );
    assert.deepEqual(result.plan.master, result.master, "再適用master不変");
    assert.deepEqual(result.mapping, result.currentMap, "再適用map不変");
    assert.deepEqual(result.plan.documents, result.documents, "再適用楽曲不変");
    assert.deepEqual(
      read(`${directory}/creator-research.json`),
      result.input.research,
    );
    console.log(
      JSON.stringify({ mode, unchanged: true, ...result.summary }, null, 2),
    );
    return;
  }
  if (mode === "report") {
    write(`${directory}/human-review-plan.json`, {
      inputHashes: beforeHashes,
      ...result.summary,
      changes: result.plan.changed,
    });
    write(`${directory}/human-review-map-proposed.json`, result.mapping);
    write(`${directory}/human-review-proposed.json`, result.review);
    shortNameReview(result);
    console.log(JSON.stringify({ mode, ...result.summary }, null, 2));
    return;
  }
  if (
    JSON.stringify(result.plan.master) === JSON.stringify(result.master) &&
    JSON.stringify(result.mapping) === JSON.stringify(result.currentMap) &&
    JSON.stringify(result.plan.documents) ===
      JSON.stringify(result.documents) &&
    JSON.stringify(read(`${directory}/creator-research.json`)) ===
      JSON.stringify(result.input.research)
  ) {
    console.log(
      JSON.stringify({ mode, unchanged: true, ...result.summary }, null, 2),
    );
    return;
  }
  const reviewed = read(`${directory}/human-review-plan.json`);
  assert.deepEqual(
    reviewed.inputHashes,
    beforeHashes,
    "report後にsource更新。reportを再生成してください",
  );
  const backup = `.cache/creator-human-review-apply-${Date.now()}`;
  const targets = inputs
    .filter((p) => !p.endsWith("human-review-input.json"))
    .concat([
      `${directory}/creator-review.json`,
      `${directory}/creator-review.md`,
      `${directory}/credit-report.json`,
      `${directory}/work-report.json`,
    ]);
  for (const p of targets) {
    fs.mkdirSync(path.dirname(`${backup}/${p}`), { recursive: true });
    fs.copyFileSync(p, `${backup}/${p}`);
  }
  write(`${backup}/manifest.json`, {
    inputHashes: beforeHashes,
    summary: result.summary,
  });
  assert.deepEqual(hashes(), beforeHashes, "backup中の競合を検出");
  write("data/creators.json", result.plan.master);
  write("docs/migrations/creator-map.json", result.mapping);
  write(`${directory}/creator-research.json`, result.input.research);
  for (const g of Object.values(GAMES))
    if (
      JSON.stringify(result.documents[g.id]) !==
      JSON.stringify(result.plan.documents[g.id])
    )
      write(g.dataFile, result.plan.documents[g.id]);
  currentReports(result);
  write(`${directory}/human-review-applied.json`, {
    backup,
    inputHashes: beforeHashes,
    ...result.summary,
    changes: result.plan.changed,
  });
  console.log(JSON.stringify({ mode, backup, ...result.summary }, null, 2));
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  runHumanReview(process.argv[2] ?? "report");
