import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import {
  humanReviewPlan,
  directory,
} from "../scripts/migrations/human-review-creators.mjs";
import {
  isHumanReview,
  isConfirmedEvidence,
} from "../scripts/migrations/creator-evidence.mjs";
import { confirmedResearchMap } from "../scripts/migrations/research-creators.mjs";
import { applyConfirmedCreators } from "../scripts/migrations/review-creators.mjs";
import {
  validateCreators,
  creatorRedirects,
  creditText,
} from "../src/js/creators-data.js";
import { GitHubCreatorStore } from "../src/js/github-creator-store.js";
import { creatorRepository } from "./helpers/creator-repository.mjs";
import { loadLegacyCredits } from "../scripts/migrations/legacy-references.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const settings = { owner: "test-owner", repo: "song-atlas", branch: "main" };
test("repeated human apply keeps source bytes and original application evidence unchanged", () => {
  assert.equal(read("data/creators.json").creators.length, 91);
  const files = [
    "data/creators.json",
    "data/works.json",
    "data/garupa/songs.json",
    "data/ournotes/songs.json",
    "docs/migrations/creator-map.json",
    `${directory}/creator-research.json`,
    `${directory}/human-review-applied.json`,
  ];
  const before = files.map((p) => fs.readFileSync(p, "utf8"));
  const run = spawnSync(
    process.execPath,
    ["scripts/migrations/human-review-creators.mjs", "apply"],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(run.stdout).unchanged, true);
  assert.deepEqual(
    files.map((p) => fs.readFileSync(p, "utf8")),
    before,
  );
});
test("human evidence stays explicit; ryo fixed-ID rename preserves all prior displays", () => {
  const result = humanReviewPlan(),
    e = result.input.research.entries.find((e) => e.name === "ryo");
  assert.ok(isHumanReview(e.canonicalNameChange.evidence));
  assert.equal(e.canonicalNameChange.evidence.url, undefined);
  assert.ok(isConfirmedEvidence(e.canonicalNameChange.evidence));
  const ryo = result.plan.master.creators.find((c) => c.id === "cr-0084");
  assert.equal(ryo.name, "ryo");
  assert.ok(ryo.aliases.includes("ryo(supercell)"));
  const legacy = loadLegacyCredits(directory);
  for (const s of result.plan.songs.filter(
    (s) =>
      s.gameId === "garupa" && s.credits.some((r) => r.creatorId === ryo.id),
  ))
    assert.equal(
      creditText(s, "composer", result.plan.master.creators),
      legacy.find((b) => b.reference === `garupa:${s.id}`).composer,
    );
  const proposed = structuredClone(result.input.research);
  delete proposed.entries.find((e) => e.name === "ryo").canonicalNameChange;
  const baseline = read(`${directory}/human-review-before-master.json`),
    map = {
      ...result.mapping,
      creators: result.mapping.creators.map((c) =>
        c.id === "cr-0084" ? { ...c, name: "ryo (supercell)" } : c,
      ),
    };
  assert.throws(() => confirmedResearchMap(baseline, map, proposed), /固定ID/);
});
test("confirmed people retain aliases and affiliation is not another participant; deferred five are unchanged", () => {
  const { plan } = humanReviewPlan(),
    byName = (name) => plan.master.creators.find((c) => c.name === name);
  assert.ok(byName("堀江晶太").aliases.includes("kemu"));
  assert.ok(byName("UZ").aliases.includes("ＵＺ"));
  assert.ok(byName("UZ").aliases.includes("UZ(SPYAIR)"));
  assert.ok(byName("john").aliases.includes("TOOBOE"));
  const sena = byName("瀬名水紀");
  assert.equal(sena.id, "cr-0090");
  assert.equal(sena.type, "person");
  assert.ok(sena.aliases.includes("瀬名水紀(Dream Monster)"));
  for (const song of plan.songs.filter((s) =>
    s.credits.some((r) => r.creatorId === sena.id),
  ))
    assert.equal(
      song.credits.filter(
        (r) =>
          plan.master.creators.find((c) => c.id === r.creatorId).name ===
          "Dream Monster",
      ).length,
      0,
    );
  assert.equal(byName("john").id, "cr-0091");
  assert.equal(
    plan.master.creators.filter((c) => /^(JACK|Louis)$/.test(c.name)).length,
    0,
  );
  for (const raw of ["JACK", "Louis"])
    assert.ok(
      plan.songs.some((s) =>
        s.creditDisplay.composer.some(
          (p) => p.unresolved && p.text.trim() === raw,
        ),
      ),
    );
  assert.equal(read(`${directory}/short-name-review.json`).length, 6);
});
test("future TK, UZ and john records cannot resolve by name or alias; only approved composer references apply", () => {
  const { mapping, plan } = humanReviewPlan();
  for (const name of ["TK", "UZ", "john"]) {
    const c = mapping.creators.find((c) => c.name === name);
    const make = (id, text) => ({
      id,
      title: "将来曲",
      workId: `wk-${String(id).padStart(4, "0")}`,
      composer: text,
      lyricist: text,
      arranger: null,
      credits: [],
      creditDisplay: {
        composer: [{ text, unresolved: true }],
        lyricist: [{ text, unresolved: true }],
        arranger: [],
      },
    });
    const songs = [make(9991, name), make(9992, c.aliases[0] ?? name)];
    const p = applyConfirmedCreators(
      plan.master,
      {
        version: 1,
        nextId: 9993,
        works: songs.map((s) => ({ id: s.workId, title: s.title })),
      },
      { garupa: { groups: [{ songs }] }, ournotes: { groups: [] } },
      mapping,
    );
    assert.equal(p.changed.length, 0);
    assert.ok(
      p.songs.every(
        (s) => s.credits.length === 0 && s.creditDisplay.composer[0].unresolved,
      ),
    );
    assert.ok(c.approvedReferences.length > 0);
  }
});
test("current and historical slug namespace prevents reuse, duplicates, invalid paths and redirect cycles", () => {
  const c = {
    id: "cr-0001",
    name: "A",
    sortKey: "a",
    slug: "current-a",
    type: "person",
    aliases: [],
    previousSlugs: ["old-a"],
  };
  const master = { version: 1, nextId: 3, creators: [c] };
  validateCreators(master);
  assert.deepEqual(creatorRedirects(master), [
    { creatorId: c.id, from: "/creators/old-a/", to: "/creators/current-a/" },
  ]);
  for (const history of [["current-a"], ["old-a", "old-a"], ["../bad"]])
    assert.throws(() =>
      validateCreators({
        ...master,
        creators: [{ ...c, previousSlugs: history }],
      }),
    );
  for (const reverse of [false, true]) {
    const other = { ...c, id: "cr-0002", slug: "old-a", previousSlugs: [] };
    assert.throws(
      () =>
        validateCreators({
          ...master,
          creators: reverse ? [other, c] : [c, other],
        }),
      /slug/,
    );
    const cycle = { ...other, slug: "old-a", previousSlugs: ["current-a"] };
    assert.throws(
      () => validateCreators({ ...master, creators: [c, cycle] }),
      /slug/,
    );
  }
});
test("admin omission preserves history; forged history, old-slug reuse and history deletion are refused before commits", async () => {
  const repo = creatorRepository(),
    store = new GitHubCreatorStore(settings, "fake-token", repo.fetcher);
  repo.files["data/creators.json"].creators[1].previousSlugs = ["old-unit"];
  const creator = { ...repo.files["data/creators.json"].creators[1] };
  delete creator.previousSlugs;
  let saved = await store.saveCreator({
    creator: { ...creator, aliases: ["改名検証"] },
    expectedSha: repo.masterSha(),
    operationId: "keep-history-operation-01",
  });
  assert.deepEqual(saved.data.creators[1].previousSlugs, ["old-unit"]);
  saved = await store.saveCreator({
    creator: { ...creator, slug: "new-unit" },
    expectedSha: repo.masterSha(),
    operationId: "change-slug-operation-02",
  });
  assert.deepEqual(saved.data.creators[1].previousSlugs, [
    "old-unit",
    "unit-b",
  ]);
  const commits = repo.calls.filter(
    (c) => c.route === "/git/commits" && c.method === "POST",
  ).length;
  for (const patch of [
    { previousSlugs: [] },
    { previousSlugs: ["fake"] },
    { slug: "old-unit" },
    { slug: "unit-b" },
  ])
    await assert.rejects(
      () =>
        store.saveCreator({
          creator: { ...creator, slug: "new-unit", ...patch },
          expectedSha: repo.masterSha(),
          operationId: "refuse-history-operation-03",
        }),
      /slug|履歴/,
    );
  await assert.rejects(
    () =>
      store.saveCreator({
        deleteId: creator.id,
        expectedSha: repo.masterSha(),
        operationId: "refuse-delete-operation-04",
      }),
    /履歴/,
  );
  assert.equal(
    repo.calls.filter((c) => c.route === "/git/commits" && c.method === "POST")
      .length,
    commits,
  );
});
test("static creator redirect preserves query filters and fragment in one replace", () => {
  let result;
  vm.runInNewContext(fs.readFileSync("src/js/legacy-redirect.js", "utf8"), {
    URL,
    document: {
      querySelector: (s) => {
        assert.ok(s.includes("#new-creator-url"));
        return { href: "https://example.test/creators/new/" };
      },
    },
    location: {
      search: "?role=composer&game=ournotes",
      hash: "#songs",
      replace: (v) => {
        result = v;
      },
    },
  });
  assert.equal(
    result,
    "https://example.test/creators/new/?role=composer&game=ournotes#songs",
  );
});
test("all human proposal invariants including 2652 strings and Work preservation pass", () => {
  const result = humanReviewPlan();
  assert.equal(result.plan.master.creators.length, 91);
  assert.equal(result.plan.master.nextId, 92);
  assert.equal(result.summary.legacyDisplayComparisons, 2652);
  assert.deepEqual(result.plan.warnings, []);
  assert.equal(result.summary.remainingRaw, 215);
  const historical = read(`${directory}/human-review-applied.json`);
  assert.equal(historical.slugChanges.length, 12);
  assert.equal(historical.previousSlugs.length, 13);
  assert.equal(historical.idSlugs.length, 5);
  assert.equal(result.summary.slugChanges.length, 16);
  assert.equal(result.summary.previousSlugs.length, 18);
  assert.equal(result.summary.idSlugs.length, 0);
});
test("generated old creator pages use current canonical, both 301 rules and only current sitemap entries", () => {
  const data = read("dist/creators.json"),
    redirects = creatorRedirects(data),
    sitemap = fs.readFileSync("dist/sitemap.xml", "utf8"),
    rules = fs.readFileSync("dist/_redirects", "utf8");
  const page = fs.readFileSync("dist/creators/index.html", "utf8");
  const base = new URL(sitemap.match(/<loc>([^<]+)<\/loc>/)[1]).pathname;
  assert.equal(redirects.length, 18);
  for (const r of redirects) {
    const html = fs.readFileSync(`dist${r.from}index.html`, "utf8");
    const old = base + r.from.slice(1),
      current = base + r.to.slice(1);
    assert.ok(html.includes('content="noindex,follow"'));
    assert.match(
      html,
      new RegExp(`rel="canonical"[^>]*${r.to.replaceAll("/", "\\/")}`),
    );
    assert.ok(html.includes(`href="${current}"`));
    assert.ok(rules.includes(`${old} ${current} 301`));
    assert.ok(rules.includes(`${old.slice(0, -1)} ${current} 301`));
    assert.ok(!sitemap.includes(r.from));
    assert.ok(sitemap.includes(r.to));
    assert.ok(!page.includes(`href="${old}"`));
  }
});
