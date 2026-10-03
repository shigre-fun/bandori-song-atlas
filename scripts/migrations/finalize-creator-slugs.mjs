import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import {
  validateCreators,
  creatorRedirects,
  validateCreatorDatabase,
  creditText,
  CREDIT_ROLES,
} from "../../src/js/creators-data.js";
import { GAMES } from "../../src/js/site-config.js";
import { confirmedResearchMap, coverage } from "./research-creators.mjs";
import {
  applyConfirmedCreators,
  reviewCreatorCandidates,
  markdown,
} from "./review-creators.mjs";
import { loadLegacyCredits } from "./legacy-references.mjs";
export const directory = "docs/migrations/creators-2026-10-03-slugs";
const previous = "docs/migrations/creators-2026-10-02";
export const changes = [
  {
    id: "cr-0048",
    name: "片倉三起也",
    from: "creator-0048",
    to: "mikiya-katakura",
  },
  {
    id: "cr-0081",
    name: "前澤寛之",
    from: "creator-0081",
    to: "hiroyuki-maezawa",
  },
  {
    id: "cr-0082",
    name: "志倉千代丸",
    from: "creator-0082",
    to: "chiyomaru-shikura",
  },
  {
    id: "cr-0089",
    name: "庄司夏葵",
    from: "creator-0089",
    to: "natsuki-shoji",
  },
  { id: "cr-0090", name: "瀬名水紀", from: "creator-0090", to: "mizuki-sena" },
];
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const write = (p, v) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
};
const hash = (p) =>
  crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const metadataPaths = [
  "data/creators.json",
  "docs/migrations/creator-map.json",
  `${previous}/creator-research.json`,
  `${previous}/human-review-input.json`,
];
const guardPaths = [
  "data/works.json",
  ...Object.values(GAMES).map((g) => g.dataFile),
  `${previous}/short-name-review.md`,
  `${previous}/short-name-review.json`,
  `${previous}/human-review-applied.json`,
];
export function finalSlugPlan() {
  const master = read(metadataPaths[0]),
    map = read(metadataPaths[1]),
    research = read(metadataPaths[2]),
    input = read(metadataPaths[3]);
  const proposed = structuredClone({ master, map, research, input });
  for (const row of changes) {
    const c = proposed.master.creators.find((c) => c.id === row.id),
      m = proposed.map.creators.find((c) => c.id === row.id),
      e = proposed.research.entries.find((e) => e.name === row.name);
    assert.equal(c.name, row.name);
    assert.ok([row.from, row.to].includes(c.slug), `予期しないslug ${row.id}`);
    assert.equal(m.slug, c.slug);
    assert.equal(e.slug ?? `creator-${c.id.slice(3)}`, c.slug);
    const evidence = {
      sourceType: "human-review",
      access: "user-confirmed",
      checkedAt: "2026-10-03",
      document: `${directory}/human-review.md`,
      supports: `ユーザーが${row.name}（${row.id}）の正式slug ${row.to}を指定。IDと人物同定・読みは変更しない。`,
    };
    for (const target of [c, m]) {
      target.slug = row.to;
      target.previousSlugs = [
        ...new Set([...(target.previousSlugs ?? []), row.from]),
      ];
    }
    e.slug = row.to;
    e.slugEvidence ??= [];
    if (!e.slugEvidence.some((s) => s.document === evidence.document))
      e.slugEvidence.push(evidence);
    // This proof confirms only URL spelling; it cannot change identity/type/readings.
  }
  proposed.research.finalSlugReview = {
    checkedAt: "2026-10-03",
    sourceType: "human-review",
    document: `${directory}/human-review.md`,
    changes,
  };
  proposed.input.research = structuredClone(proposed.research);
  proposed.input.finalSlugReview = structuredClone(
    proposed.research.finalSlugReview,
  );
  validateCreators(proposed.master);
  assert.equal(proposed.master.creators.length, 91);
  assert.equal(proposed.master.nextId, 92);
  const strip = (c) => {
    const copy = structuredClone(c);
    delete copy.slug;
    delete copy.previousSlugs;
    return copy;
  };
  assert.deepEqual(
    master.creators.map(strip),
    proposed.master.creators.map(strip),
  );
  const documents = Object.fromEntries(
      Object.values(GAMES).map((g) => [g.id, read(g.dataFile)]),
    ),
    works = read("data/works.json");
  const songs = Object.values(GAMES).flatMap((g) =>
    documents[g.id].groups.flatMap((gr) =>
      gr.songs.map((s) => ({ ...s, gameId: g.id, band: gr.band })),
    ),
  );
  const validated = validateCreatorDatabase(proposed.master, works, songs);
  assert.equal(songs.length, 884);
  assert.equal(works.works.length, 823);
  assert.deepEqual(validated.warnings, []);
  const projectedMap = confirmedResearchMap(
    proposed.master,
    proposed.map,
    proposed.research,
  );
  assert.deepEqual(projectedMap, proposed.map, "research再適用でmapを変えない");
  const retry = applyConfirmedCreators(
    proposed.master,
    works,
    documents,
    projectedMap,
  );
  assert.deepEqual(retry.master, proposed.master);
  assert.deepEqual(retry.documents, documents);
  assert.deepEqual(retry.works, works);
  assert.equal(retry.changed.length, 0);
  const legacy = loadLegacyCredits(previous);
  let comparisons = 0;
  for (const old of legacy)
    for (const role of CREDIT_ROLES) {
      assert.equal(
        creditText(
          songs.find((s) => `${s.gameId}:${s.id}` === old.reference),
          role,
          proposed.master.creators,
        ),
        old[role] ?? "",
      );
      comparisons++;
    }
  const review = reviewCreatorCandidates(
    legacy,
    songs,
    proposed.map,
    proposed.research,
  );
  const summary = {
    changes,
    creators: 91,
    nextId: 92,
    previousSlugs: creatorRedirects(proposed.master).length,
    cloudflareRules: creatorRedirects(proposed.master).length * 2,
    staticCompatibilityPages: creatorRedirects(proposed.master).length,
    idSlugs: proposed.master.creators.filter((c) =>
      /^creator-\d+$/.test(c.slug),
    ),
    provisionalSortKeys: proposed.master.creators.filter(
      (c) => c.sortKeyStatus === "provisional-original",
    ).length,
    resolvedRaw: review.summary.autoResolvedStrings,
    remainingRaw: review.summary.remainingUnidentifiedStrings,
    coverage: coverage(songs),
    displayComparisons: comparisons,
    workWarnings: validated.warnings,
  };
  assert.equal(summary.previousSlugs, 18);
  assert.equal(summary.idSlugs.length, 0);
  assert.equal(summary.provisionalSortKeys, 47);
  assert.equal(comparisons, 2652);
  assert.equal(summary.resolvedRaw, 127);
  assert.equal(summary.remainingRaw, 215);
  assert.equal(summary.coverage.recordings, 635);
  assert.equal(summary.coverage.works, 582);
  return {
    original: { master, map, research, input },
    proposed,
    summary,
    review,
    songs,
  };
}
export function runFinalSlugs(mode) {
  if (!["report", "apply", "verify"].includes(mode))
    throw new Error("report/apply/verifyを指定");
  const inputHashes = Object.fromEntries(
      [...metadataPaths, ...guardPaths].map((p) => [p, hash(p)]),
    ),
    result = finalSlugPlan();
  assert.deepEqual(
    Object.fromEntries(Object.keys(inputHashes).map((p) => [p, hash(p)])),
    inputHashes,
    "読取中の更新を検出",
  );
  const noop =
    JSON.stringify(result.original) === JSON.stringify(result.proposed);
  if (mode === "verify") {
    assert.ok(noop, "最終slugが未適用");
    console.log(
      JSON.stringify({ mode, unchanged: true, ...result.summary }, null, 2),
    );
    return;
  }
  if (mode === "report") {
    write(`${directory}/plan.json`, { inputHashes, ...result.summary });
    if (!fs.existsSync(`${directory}/before-master.json`)) {
      write(`${directory}/before-master.json`, result.original.master);
      write(`${directory}/before-map.json`, result.original.map);
      write(`${directory}/baseline.json`, {
        guardHashes: Object.fromEntries(
          guardPaths.map((p) => [p, inputHashes[p]]),
        ),
        metadataHashes: Object.fromEntries(
          metadataPaths.map((p) => [p, inputHashes[p]]),
        ),
      });
    }
    console.log(JSON.stringify({ mode, ...result.summary }, null, 2));
    return;
  }
  if (noop) {
    console.log(
      JSON.stringify({ mode, unchanged: true, ...result.summary }, null, 2),
    );
    return;
  }
  assert.deepEqual(
    read(`${directory}/plan.json`).inputHashes,
    inputHashes,
    "report後に更新あり。再reportしてください",
  );
  const backup = `.cache/creator-final-slugs-${Date.now()}`;
  for (const p of [
    ...metadataPaths,
    ...guardPaths,
    `${previous}/creator-review.json`,
    `${previous}/creator-review.md`,
  ]) {
    fs.mkdirSync(path.dirname(`${backup}/${p}`), { recursive: true });
    fs.copyFileSync(p, `${backup}/${p}`);
  }
  write(`${backup}/manifest.json`, { inputHashes });
  assert.deepEqual(
    Object.fromEntries(Object.keys(inputHashes).map((p) => [p, hash(p)])),
    inputHashes,
    "backup中に更新あり",
  );
  for (const [i, value] of Object.values(result.proposed).entries())
    write(metadataPaths[i], value);
  write(`${previous}/creator-review.json`, result.review);
  fs.writeFileSync(`${previous}/creator-review.md`, markdown(result.review));
  assert.deepEqual(
    Object.fromEntries(guardPaths.map((p) => [p, hash(p)])),
    Object.fromEntries(guardPaths.map((p) => [p, inputHashes[p]])),
    "song/Work/短名資料/適用履歴の書込禁止",
  );
  write(`${directory}/applied.json`, {
    backup,
    inputHashes,
    ...result.summary,
  });
  console.log(JSON.stringify({ mode, backup, ...result.summary }, null, 2));
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  runFinalSlugs(process.argv[2] ?? "report");
