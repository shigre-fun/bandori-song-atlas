import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  effectivePackage,
  createPlan,
  addRole,
  hash,
  assertResearch,
  verifyApplied,
  DIRECTORY,
} from "../scripts/migrations/apply-credits-phase-b2.mjs";
import {
  historicalJSON,
  historicalText,
} from "../scripts/migrations/credit-history.mjs";
import { patchCreditFields } from "../scripts/migrations/credit-field-patch.mjs";
import {
  creditText,
  creditRows,
  selectedCreditData,
  validateCreditStructure,
  validateCreatorDatabase,
  searchCreators,
  creatorParticipation,
} from "../src/js/creators-data.js";
import {
  roleCoverage,
  availableCreditRoles,
} from "../src/js/credit-coverage.js";
import {
  renderCreators,
  renderCreatorDetail,
  filterCreatorWorks,
} from "../src/js/creator-views.js";
import { renderDetail } from "../src/js/views.js";
import { loadGameCatalog } from "../scripts/catalog.mjs";
import { GAMES } from "../src/js/site-config.js";
const pkg = effectivePackage(),
  plan = createPlan(
    pkg,
    Object.fromEntries(
      [
        "data/creators.json",
        "data/works.json",
        "data/garupa/songs.json",
        "data/ournotes/songs.json",
      ].map((p) => [p, historicalText(p)]),
    ),
  );
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const old = historicalJSON("data/creators.json"),
  master = JSON.parse(plan.output["data/creators.json"]);
const plannedSongs = ["garupa", "ournotes"].flatMap((game) =>
  JSON.parse(plan.output["data/" + game + "/songs.json"]).groups.flatMap((g) =>
    g.songs.map((s) => ({ ...s, gameId: game, band: g.band })),
  ),
);
const song = (game, id) =>
  plannedSongs.find((s) => s.gameId === game && s.id === id);
const roleIds = (s, role) =>
  s.creditDisplay[role].filter((p) => p.creatorId).map((p) => p.creatorId);
const sourceHashes = () =>
  Object.fromEntries(
    [
      "data/creators.json",
      "data/works.json",
      "data/garupa/songs.json",
      "data/ournotes/songs.json",
    ].map((p) => [p, hash(fs.readFileSync(p))]),
  );
test("B2 immutable A/B1 provenance and byte-verified history", () => {
  assert.equal(Object.keys(assertResearch().protectedResearch).length, 452);
  assert.equal(old.creators.length, 91);
  assert.equal(
    hash(historicalText("data/ournotes/songs.json")),
    read(DIRECTORY + "/baseline.json").sourceHashes["data/ournotes/songs.json"],
  );
});
test("B2 adopts exactly A1 twelve, A2 fourteen, former seven and three variants", () => {
  const h = read(DIRECTORY + "/human-review.json");
  assert.equal(h.a1.length, 12);
  assert.equal(h.a2.length, 14);
  assert.equal(h.formerProbable.length, 7);
  assert.equal(h.existingVariants.length, 3);
});
test("B2 formal IDs use immutable package order with reserved gaps", () => {
  assert.equal(pkg.candidateIdMap[0].creatorId, "cr-0092");
  assert.equal(pkg.candidateIdMap[25].creatorId, "cr-0117");
  assert.equal(pkg.candidateIdMap.at(-1).creatorId, "cr-0124");
  assert.deepEqual(
    pkg.candidateIdMap
      .filter((c) => c.status === "BLOCKED_METADATA")
      .map((c) => c.creatorId),
    ["cr-0118", "cr-0119", "cr-0120"],
  );
  assert.equal(master.nextId, 125);
  assert.equal(master.creators.length, 121);
});
test("B2 all previous IDs current and previous slugs remain exact", () => {
  for (const c of old.creators) {
    const n = master.creators.find((x) => x.id === c.id);
    assert.deepEqual({ ...n, aliases: null }, { ...c, aliases: null });
    assert.ok(c.aliases.every((a) => n.aliases.includes(a)));
  }
});
test("B2 every new slug is human-readable and has no prior candidate history", () => {
  const all = master.creators.flatMap((c) => [
    c.slug,
    ...(c.previousSlugs ?? []),
  ]);
  assert.equal(new Set(all).size, all.length);
  for (const c of master.creators.slice(91)) {
    assert.doesNotMatch(c.slug, /creator-candidate|cr-\d/);
    assert.equal(c.previousSlugs, undefined);
  }
});
test("B2 user spellings for Fujiwara Ogi Nakamachi and Makishima are exact", () => {
  for (const [id, sortKey, slug] of [
    ["cr-0095", "ふじわらまさき", "masaki-fujiwara"],
    ["cr-0101", "おぎがくし", "gakushi-ogi"],
    ["cr-0105", "なかまちあられ", "arale-nakamachi"],
    ["cr-0117", "まきしまたかひと", "takahito-makishima"],
  ]) {
    const c = master.creators.find((c) => c.id === id);
    assert.equal(c.sortKey, sortKey);
    assert.equal(c.slug, slug);
  }
});
test("B2 Spirit Garden organization and o-saka person stay separate", () => {
  assert.equal(
    master.creators.find((c) => c.id === "cr-0099").type,
    "organization",
  );
  assert.equal(master.creators.find((c) => c.id === "cr-0124").type, "person");
  assert.ok(
    !master.creators.find((c) => c.id === "cr-0124").aliases.includes("尾崎豪"),
  );
  assert.ok(
    !master.creators
      .slice(91)
      .some((c) =>
        ["SUPA LOVE", "Dream Monster", "Elements Garden"].includes(c.name),
      ),
  );
});
test("B2 former probable relations never enter without human confidence and metadata", () => {
  for (const r of pkg.relations) {
    assert.equal(r.confidence, "CONFIRMED");
    assert.match(r.splitStatus, /^CONFIRMED_/);
    for (const t of r.creatorTokens) {
      assert.equal(t.confidence, "CONFIRMED");
      assert.ok(t.creatorId);
      assert.ok(!["cr-0118", "cr-0119", "cr-0120"].includes(t.creatorId));
    }
  }
});
test("B2 short name relations have an explicit matching record scope", () => {
  for (const r of pkg.relations)
    for (const t of r.creatorTokens)
      if (t.scopePolicy === "RECORD_SCOPED")
        assert.equal(t.recordScope, r.game + ":" + r.recordId);
});
test("B2 record mismatch is recorded as CONFLICT without applying that record", () => {
  const texts = { ...plan.output };
  const d = JSON.parse(texts["data/ournotes/songs.json"]);
  d.groups.flatMap((g) => g.songs).find((s) => s.id === 50).title =
    "concurrent change";
  texts["data/ournotes/songs.json"] = JSON.stringify(d);
  assert.ok(
    createPlan(pkg, texts).conflicts.some((c) => c.key === "ournotes:50"),
  );
});
test("B2 nextId and formal ID metadata conflicts reject", () => {
  const texts = { ...plan.output },
    m = JSON.parse(texts["data/creators.json"]);
  m.nextId = 126;
  texts["data/creators.json"] = JSON.stringify(m);
  assert.throws(() => createPlan(pkg, texts), /nextId/);
  m.nextId = 125;
  m.creators.find((c) => c.id === "cr-0092").slug = "wrong";
  texts["data/creators.json"] = JSON.stringify(m);
  assert.throws(() => createPlan(pkg, texts), /metadata conflict/);
});
test("B2 structural field patch leaves unrelated whitespace and values byte-identical", () => {
  const text =
    '{ "groups" : [ { "songs": [{ "id":1, "title":"x", "workId":"wk-0001", "composer":null, "notes": 42 }] } ] }\n';
  const result = patchCreditFields(
    text,
    new Map([
      [1, { title: "x", workId: "wk-0001", fields: { composer: "a" } }],
    ]),
  );
  assert.equal(result.text, text.replace('"composer":null', '"composer":"a"'));
  assert.throws(
    () =>
      patchCreditFields(
        text,
        new Map([
          [1, { title: "other", workId: "wk-0001", fields: { composer: "a" } }],
        ]),
      ),
    /CONFLICT/,
  );
});
test("B2 2652 comparisons never alter an existing nonempty display", () => {
  assert.equal(plan.displayComparison.length, 2652);
  assert.ok(
    plan.displayComparison.every((d) => !d.before || d.before === d.after),
  );
  assert.ok(
    plan.displayComparison.some(
      (d) => d.status === "PRE_EXISTING_EMPTY_FILLED",
    ),
  );
});
test("B2 all original composer roles survive", () => {
  for (const game of ["garupa", "ournotes"])
    for (const prior of historicalJSON(
      "data/" + game + "/songs.json",
    ).groups.flatMap((g) => g.songs)) {
      const s = song(game, prior.id);
      for (const c of prior.credits.filter((c) => c.roles.includes("composer")))
        assert.ok(
          s.credits.some(
            (n) => n.creatorId === c.creatorId && n.roles.includes("composer"),
          ),
        );
    }
});
test("B2 four approved composer corrections and raw SAM display", () => {
  assert.deepEqual(roleIds(song("garupa", 249), "composer"), ["cr-0113"]);
  assert.equal(song("garupa", 249).composer, "SAM(samfree)");
  assert.deepEqual(roleIds(song("ournotes", 14), "composer"), ["cr-0117"]);
  assert.deepEqual(roleIds(song("ournotes", 33), "composer"), [
    "cr-0013",
    "cr-0022",
  ]);
  assert.deepEqual(roleIds(song("ournotes", 66), "composer"), [
    "cr-0090",
    "cr-0111",
  ]);
});
test("B2 Mela correct composer is normalized without replacing display", () => {
  const s = song("ournotes", 75);
  assert.equal(s.composer, "peppe／穴見真吾");
  assert.deepEqual(roleIds(s, "lyricist"), ["cr-0116", "cr-0115"]);
  assert.deepEqual(roleIds(s, "composer"), ["cr-0112", "cr-0114"]);
});
test("B2 flower assigns Takeda to arranger only for all three versions", () => {
  for (const id of [176, 218, 738]) {
    const s = song("garupa", id);
    assert.deepEqual(roleIds(s, "composer"), ["cr-0021"]);
    assert.deepEqual(roleIds(s, "arranger"), ["cr-0009"]);
  }
});
test("B2 OwnNotes Carnation keeps release-arranger out of game fields", () => {
  const s = song("ournotes", 66);
  assert.deepEqual(roleIds(s, "lyricist"), ["cr-0111"]);
  assert.equal(
    s.arranger,
    historicalJSON("data/ournotes/songs.json")
      .groups.flatMap((g) => g.songs)
      .find((s) => s.id === 66).arranger,
  );
  assert.deepEqual(s.creditDisplay.arranger, []);
});
test("B2 OurNotes remaining eighty arranger fields unchanged including available release names", () => {
  const refs = pkg.normalized.filter(
    (r) => r.game === "ournotes" && !r.roles.arranger.target,
  );
  assert.equal(refs.length, 80);
  const prior = historicalJSON("data/ournotes/songs.json").groups.flatMap(
    (g) => g.songs,
  );
  for (const r of refs) {
    const a = prior.find((s) => s.id === r.recordId),
      b = song("ournotes", r.recordId);
    assert.equal(b.arranger, a.arranger);
    assert.deepEqual(b.creditDisplay.arranger, a.creditDisplay.arranger);
    assert.deepEqual(
      b.credits.filter((c) => c.roles.includes("arranger")),
      a.credits.filter((c) => c.roles.includes("arranger")),
    );
  }
});
test("B2 all five known OurNotes arranger credits retain links or raw fallback", () => {
  const refs = pkg.normalized.filter(
    (r) => r.game === "ournotes" && r.roles.arranger.target,
  );
  assert.equal(refs.length, 5);
  for (const r of refs) assert.ok(song("ournotes", r.recordId).arranger);
  assert.equal(refs.filter((r) => r.roles.arranger.creatorResolved).length, 2);
});
test("B2 intentional OwnNotes IDs and every non-credit field preserved", () => {
  const ignore = [
    "lyricist",
    "composer",
    "arranger",
    "credits",
    "creditDisplay",
  ];
  for (const game of ["garupa", "ournotes"])
    for (const a of historicalJSON(
      "data/" + game + "/songs.json",
    ).groups.flatMap((g) => g.songs)) {
      const b = song(game, a.id);
      for (const k of Object.keys(a).filter((k) => !ignore.includes(k)))
        assert.deepEqual(b[k], a[k], game + ":" + a.id + ":" + k);
    }
  assert.equal(song("ournotes", 50).title, "これはぼくたちの生存のあらすじ");
  assert.equal(song("ournotes", 52).title, "真夜中遊園地");
});
test("B2 game-aware coverage allows partial role with measured counts", () => {
  assert.equal(
    roleCoverage(master.roleCoverage, "ournotes").arranger,
    "partial",
  );
  assert.equal(roleCoverage(master.roleCoverage, "garupa").arranger, "ready");
  assert.deepEqual(availableCreditRoles(master.roleCoverage), [
    "lyricist",
    "composer",
    "arranger",
  ]);
  assert.throws(
    () =>
      roleCoverage({
        lyricist: "ready",
        composer: "ready",
        arranger: { garupa: "ready" },
      }),
    /roleCoverage/,
  );
});
test("B2 Creator rendered partial notice and role filters are honest", () => {
  const html = renderCreators(
    master.creators,
    plannedSongs,
    "/",
    master.roleCoverage,
  );
  assert.match(html, /アワーノーツの編曲は一部登録/);
  assert.match(html, /option value="lyricist"/);
  assert.match(html, /option value="arranger"/);
  assert.match(html, /編曲曲数/);
  const detail = renderCreatorDetail(
    master.creators[0],
    plannedSongs,
    read("data/works.json").works,
    "/",
    master.roleCoverage,
  );
  assert.match(detail, /roleCoverage/);
  assert.match(detail, /一部登録/);
});
test("B2 role-specific display preserves different raw labels and admin save order", () => {
  for (const s of plannedSongs) {
    const result = selectedCreditData(creditRows(s), master.creators, s);
    for (const role of ["lyricist", "composer", "arranger"]) {
      assert.equal(creditText(result, role, master.creators), s[role] ?? "");
      assert.deepEqual(result.creditDisplay[role], s.creditDisplay[role]);
    }
  }
});
test("B2 invalid overrides and duplicate roles cannot enter administration", () => {
  const s = structuredClone(song("garupa", 249));
  s.credits[0].displayOverrides = { bad: "x" };
  assert.throws(() => validateCreditStructure(s), /displayOverrides/);
  s.credits[0].displayOverrides = { composer: "" };
  assert.throws(() => validateCreditStructure(s), /displayOverrides/);
  const good = song("ournotes", 75),
    rows = creditRows(good);
  assert.throws(
    () => selectedCreditData([...rows, rows[0]], master.creators, good),
    /1回だけ/,
  );
});
test("B2 admin alias search includes all approved variants and new readings", () => {
  assert.ok(
    searchCreators(master.creators, "DECO＊27").some((c) => c.id === "cr-0026"),
  );
  assert.ok(
    searchCreators(master.creators, "ふじわらまさき").some(
      (c) => c.id === "cr-0095",
    ),
  );
  assert.ok(
    searchCreators(master.creators, "新藤晴一").some((c) => c.id === "cr-0121"),
  );
});
test("B2 record relations unique and all references resolve", () => {
  for (const s of plannedSongs) {
    assert.equal(
      new Set(s.credits.map((c) => c.creatorId)).size,
      s.credits.length,
    );
    validateCreditStructure(s);
    for (const c of s.credits) {
      assert.ok(master.creators.some((m) => m.id === c.creatorId));
      assert.doesNotMatch(c.creatorId, /b1-/);
    }
  }
});
test("B2 real warning zero and actual same-performance conflicts remain detectable", () => {
  const works = read("data/works.json");
  assert.equal(
    validateCreatorDatabase(master, works, plannedSongs).warnings.length,
    0,
  );
  const s = structuredClone(song("garupa", 176)),
    t = structuredClone(s);
  t.id = 999999;
  t.relatedSongIds = [];
  s.relatedSongIds = [];
  t.credits.find((c) => c.creatorId === "cr-0009").roles = t.credits
    .find((c) => c.creatorId === "cr-0009")
    .roles.filter((r) => r !== "arranger");
  t.credits = t.credits.filter((c) => c.roles.length);
  addRole(
    t,
    "arranger",
    [
      {
        creatorId: "cr-0001",
        confidence: "CONFIRMED",
        raw: master.creators[0].name,
      },
    ],
    master.creators[0].name,
    master.creators,
  );
  assert.equal(
    validateCreatorDatabase(master, works, [s, t]).warnings.filter(
      (w) => w.role === "arranger",
    ).length,
    1,
  );
});
test("B2 dry plan is byte-preserving for live sources", () => {
  const before = sourceHashes();
  createPlan(pkg);
  assert.deepEqual(sourceHashes(), before);
  assert.equal(plan.conflicts.length, 0);
});
test("B2 applying planned output twice produces zero changes and identical SHA", () => {
  const second = createPlan(pkg, plan.output);
  assert.equal(second.summary.changedFiles, 0);
  assert.equal(second.patches.length, 0);
  assert.deepEqual(second.outputHashes, plan.outputHashes);
});

test("B2 live applied data equals reviewed plan and verifies zero second writes", () => {
  assert.equal(verifyApplied().secondApplyChangedFiles, 0);
  for (const [file, sha] of Object.entries(plan.outputHashes))
    assert.equal(hash(fs.readFileSync(file)), sha, file);
});

test("B2 admin mock protects newly referenced lyricist and preserves coverage on edit", async () => {
  const { creatorRepository } = await import(
    "./helpers/creator-repository.mjs"
  );
  const { GitHubCreatorStore } = await import(
    "../src/js/github-creator-store.js"
  );
  const repo = creatorRepository({ creatorData: read("data/creators.json") });
  for (const file of Object.keys(repo.files)) repo.files[file] = read(file);
  const store = new GitHubCreatorStore(
    { owner: "test-owner", repo: "song-atlas", branch: "main" },
    "mock-only-token",
    repo.fetcher,
  );
  await store.connect();
  const loaded = await store.loadCreators();
  await assert.rejects(
    store.saveCreator({
      deleteId: "cr-0092",
      expectedSha: loaded.sha,
      operationId: "b2-reference-protect-0001",
    }),
    /参照されているため削除できません/,
  );
  const actor = loaded.data.creators.find((c) => c.id === "cr-0095");
  const saved = await store.saveCreator({
    creator: { ...actor, aliases: [...actor.aliases, "B2モック編集"] },
    expectedSha: repo.masterSha(),
    operationId: "b2-alias-mock-save-0001",
  });
  assert.ok(
    saved.data.creators
      .find((c) => c.id === "cr-0095")
      .aliases.includes("B2モック編集"),
  );
  assert.deepEqual(saved.data.roleCoverage, master.roleCoverage);
  for (const game of ["garupa", "ournotes"])
    assert.deepEqual(
      repo.files[GAMES[game].dataFile],
      read(GAMES[game].dataFile),
    );
});
test("B2 live song details have distinct resolved links and honest OurNotes unknown arrangers", () => {
  const own = loadGameCatalog(GAMES.ournotes),
    s = own.find((s) => s.id === 66);
  const html = renderDetail(
    s,
    {
      songs: own,
      creators: master.creators,
      roleCoverage: master.roleCoverage,
      updatedAt: "2026-10-03",
    },
    {},
    "/",
    GAMES.ournotes,
  );
  assert.match(html, /creators\/aira\//);
  assert.match(html, /creators\/mizuki-sena\//);
  assert.match(html, /未整備・確認中/);
  const raw = pkg.excluded.find(
    (r) =>
      r.game === "ournotes" && r.role === "lyricist" && r.target && r.rawCredit,
  );
  const fallback = renderDetail(
    own.find((s) => s.id === raw.recordId),
    {
      songs: own,
      creators: master.creators,
      roleCoverage: master.roleCoverage,
      updatedAt: "2026-10-03",
    },
    {},
    "/",
    GAMES.ournotes,
  );
  assert.match(fallback, /credit=lyricist/);
});
test("B2 SHA conflict rejects apply before any write", async () => {
  const { applyPlan } = await import(
    "../scripts/migrations/apply-credits-phase-b2.mjs"
  );
  const before = sourceHashes(),
    bad = createPlan(pkg);
  bad.inputHashes["data/ournotes/songs.json"] = "incorrect";
  assert.throws(() => applyPlan(bad), /source SHA/);
  assert.deepEqual(sourceHashes(), before);
});

test("B2 CLI plan after apply preserves original review artifacts and source bytes", async () => {
  const { spawnSync } = await import("node:child_process");
  const paths = [
    ...Object.keys(sourceHashes()),
    ...[
      "apply-plan.json",
      "applied-relations.json",
      "phase-b2-effective-package.json",
      "coverage.json",
      "display-comparison.json",
    ].map((name) => DIRECTORY + "/" + name),
  ];
  const before = paths.map((p) => hash(fs.readFileSync(p)));
  const result = spawnSync(
    process.execPath,
    ["scripts/migrations/apply-credits-phase-b2.mjs", "plan"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.savedPlanPreserved, true);
  assert.equal(summary.changedFiles, 0);
  assert.deepEqual(
    paths.map((p) => hash(fs.readFileSync(p))),
    before,
  );
});
