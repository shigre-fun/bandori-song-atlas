import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadLegacyCredits } from "../scripts/migrations/legacy-references.mjs";
import vm from "node:vm";
import {
  CREDIT_ROLES,
  validateCreators,
  validateWorks,
  validateCreatorDatabase,
  creditText,
  selectedCreditData,
  creatorParticipation,
  searchCreators,
} from "../src/js/creators-data.js";
import {
  renderCreators,
  renderCreatorDetail,
  filterCreatorWorks,
} from "../src/js/creator-views.js";
import { renderDetail } from "../src/js/views.js";
import { GAMES } from "../src/js/site-config.js";
import { loadGameCatalog } from "../scripts/catalog.mjs";
import { creditField, crossGameSongs } from "../src/js/domain.js";
import { crossSearchURL } from "../src/js/urls.js";
const clone = (value) => structuredClone(value);
const master = JSON.parse(fs.readFileSync("data/creators.json", "utf8"));
const workMaster = JSON.parse(fs.readFileSync("data/works.json", "utf8"));
const songs = Object.values(GAMES).flatMap((g) => loadGameCatalog(g));
const cr = master.creators[0];
test("real master, IDs, types and record references validate; unresolved names do not become identities", () => {
  const result = validateCreatorDatabase(master, workMaster, songs);
  assert.equal(result.warnings.length, 0);
  assert.equal(new Set(songs.map((s) => s.workId)).size, 823);
  assert.equal(songs.length, 884);
  assert.equal(
    songs.filter((s) => s.credits.some((c) => c.creatorId === cr.id)).length,
    66,
  );
  assert.equal(creatorParticipation("cr-0002", songs).recordings, 0);
  assert.ok(
    songs.some((s) => s.creditDisplay.composer.some((p) => p.unresolved)),
  );
});
test("Creator schema rejects duplicate IDs/slugs, empty required fields, bad types and aliases", () => {
  for (const mutate of [
    (d) => d.creators.push(clone(d.creators[0])),
    (d) => (d.creators[1].slug = d.creators[0].slug),
    (d) => (d.creators[0].name = " "),
    (d) => (d.creators[0].sortKey = ""),
    (d) => (d.creators[0].type = "unknown"),
    (d) => (d.creators[0].aliases = "alias"),
    (d) => (d.creators[0].aliases = [1]),
    (d) => (d.nextId = 1),
  ]) {
    const d = clone(master);
    mutate(d);
    assert.throws(() => validateCreators(d));
  }
  const renamed = clone(master);
  renamed.creators[0].slug = "new-slug";
  assert.doesNotThrow(() =>
    validateCreatorDatabase(renamed, workMaster, songs),
  );
});
test("relations reject absent creator/work, bad/duplicate roles, repeated relations and wrong override types", () => {
  const sample = songs.find((s) => s.credits.length);
  for (const mutate of [
    (s) => (s.workId = "wk-9999"),
    (s) => (s.credits[0].creatorId = "cr-9999"),
    (s) => (s.credits[0].roles = ["artist"]),
    (s) => (s.credits[0].roles = ["composer", "composer"]),
    (s) => s.credits.push(clone(s.credits[0])),
    (s) => (s.credits[0].displayOverride = 123),
    (s) => (s.composer = null),
    (s) => (s.creditDisplay.composer = [{ text: "lost" }]),
  ]) {
    const all = clone(songs),
      s = all.find((s) => s.gameId === sample.gameId && s.id === sample.id);
    mutate(s);
    assert.throws(() => validateCreatorDatabase(master, workMaster, all));
  }
  const bad = clone(workMaster);
  bad.works.push(clone(bad.works[0]));
  assert.throws(() => validateWorks(bad));
  assert.throws(
    () => validateCreatorDatabase(master, workMaster, [...songs, songs[0]]),
    /レコード/,
  );
});
test("work identity follows explicit links including FULL, never titles alone", () => {
  const get = (g, id) => songs.find((s) => s.gameId === g && s.id === id);
  assert.equal(get("garupa", 179).workId, get("garupa", 230).workId);
  assert.equal(get("garupa", 473).workId, get("ournotes", 1).workId);
  assert.equal(get("garupa", 473).workId, get("garupa", 628).workId);
  assert.notEqual(get("garupa", 387).workId, get("garupa", 646).workId);
  const all = clone(songs);
  all.find((s) => s.gameId === "ournotes" && s.id === 1).workId = all.find(
    (s) => s.gameId === "ournotes" && s.id === 2,
  ).workId;
  assert.throws(
    () => validateCreatorDatabase(master, workMaster, all),
    /workIdが不一致/,
  );
});
test("migration retains every old credit byte for three roles and all other song fields", () => {
  const before = loadLegacyCredits();
  for (const old of before) {
    const s = songs.find((s) => `${s.gameId}:${s.id}` === old.reference);
    for (const role of CREDIT_ROLES)
      assert.equal(
        creditText(s, role, master.creators),
        old[role] ?? "",
        old.reference,
      );
  }
  const report = JSON.parse(
    fs.readFileSync(
      "docs/migrations/creators-2026-10-02/credit-report.json",
      "utf8",
    ),
  );
  assert.equal(report.summary.originalReviewStrings, 341);
  assert.equal(report.summary.reviewStrings, 215);
  assert.equal(
    report.entries.reduce((sum, r) => sum + r.count, 0),
    songs.filter((s) => s.composer).length,
  );
});
test("alias search works without creating alias identities", () => {
  assert.equal(searchCreators(master.creators, "elements GARDEN").length, 14);
  assert.equal(searchCreators(master.creators, "あげまつ")[0].id, cr.id);
  assert.equal(searchCreators(master.creators, "unknown").length, 0);
});
test("multi role/multi creator selections preserve per-role order and display overrides", () => {
  const rows = [
    { role: "lyricist", creatorId: "cr-0001", displayOverride: "表示A" },
    { role: "composer", creatorId: "cr-0002", displayOverride: "" },
    { role: "composer", creatorId: "cr-0001", displayOverride: "表示A" },
    { role: "arranger", creatorId: "cr-0001", displayOverride: "表示A" },
  ];
  const result = selectedCreditData(rows, master.creators);
  assert.equal(result.credits.length, 2);
  assert.deepEqual(result.credits[0].roles, [
    "lyricist",
    "composer",
    "arranger",
  ]);
  assert.equal(result.composer, "Elements Garden、表示A");
  assert.equal(result.lyricist, "表示A");
  const reorderedKeys = rows.map((r) => ({
    creatorId: r.creatorId,
    displayOverride: r.displayOverride,
    role: r.role,
  }));
  assert.deepEqual(
    selectedCreditData(reorderedKeys, master.creators, result),
    result,
  );
  assert.throws(
    () =>
      selectedCreditData(
        [{ creatorId: cr.id, role: "artist" }],
        master.creators,
      ),
    /担当/,
  );
  assert.throws(
    () => selectedCreditData([...rows, rows[0]], master.creators),
    /1回/,
  );
  assert.throws(
    () =>
      selectedCreditData(
        [{ role: "composer", creatorId: "cr-9999", displayOverride: "" }],
        master.creators,
      ),
    /登録済み/,
  );
  const original = songs.find((s) =>
    s.creditDisplay.composer.some((p) => p.unresolved),
  );
  assert.equal(
    selectedCreditData([], master.creators, original).composer,
    original.composer,
  );
  assert.throws(
    () =>
      selectedCreditData(
        [{ role: "composer", creatorId: cr.id, displayOverride: "" }],
        master.creators,
        original,
      ),
    /確認待ち/,
  );
});
test("unique Work/recording/role counts deduplicate games and FULL and count each role once", () => {
  const credit = selectedCreditData(
    [
      { role: "composer", creatorId: cr.id, displayOverride: "" },
      { role: "lyricist", creatorId: cr.id, displayOverride: "" },
    ],
    master.creators,
  );
  const records = [
    { ...songs[0], ...credit, gameId: "garupa", id: 1, workId: "wk-0001" },
    { ...songs[0], ...credit, gameId: "ournotes", id: 1, workId: "wk-0001" },
    { ...songs[0], ...credit, gameId: "garupa", id: 2, workId: "wk-0001" },
    { ...songs[0], ...credit, gameId: "garupa", id: 3, workId: "wk-0002" },
  ];
  const stats = creatorParticipation(cr.id, records);
  assert.equal(stats.total, 2);
  assert.equal(stats.recordings, 4);
  assert.equal(stats.composer, 2);
  assert.equal(stats.lyricist, 2);
  assert.equal(stats.arranger, 0);
  assert.equal(
    filterCreatorWorks(
      stats,
      cr.id,
      new URLSearchParams("game=ournotes&role=composer"),
    ).length,
    1,
  );
  const separate = [
    { ...records[0], credits: [{ creatorId: cr.id, roles: ["composer"] }] },
    { ...records[1], credits: [{ creatorId: cr.id, roles: ["lyricist"] }] },
  ];
  assert.equal(
    filterCreatorWorks(
      creatorParticipation(cr.id, separate),
      cr.id,
      new URLSearchParams("game=ournotes&role=composer"),
    ).length,
    0,
  );
});
test("static creator pages include facts, game links, controls, aliases, and ID links on both bases", () => {
  for (const base of ["/", "/atlas/"]) {
    const list = renderCreators(master.creators, songs, base),
      detail = renderCreatorDetail(cr, songs, workMaster.works, base);
    assert.match(list, /名前順/);
    assert.match(list, /creator-search/);
    assert.ok(list.includes(`${base}creators/${cr.slug}/`));
    assert.match(detail, /参加楽曲数/);
    assert.match(detail, /収録件数：66件/);
    assert.ok(detail.includes(`${base}ournotes/songs/23/`));
    const sample = songs.find((s) =>
        s.credits.some((c) => c.creatorId === cr.id),
      ),
      html = renderDetail(
        sample,
        { updatedAt: Date.now(), creators: master.creators },
        new URLSearchParams(),
        base,
        GAMES[sample.gameId],
      );
    assert.ok(html.includes(`${base}creators/${cr.slug}/`));
    assert.ok(html.includes("上松範康（Elements Garden）"));
    assert.match(html, /<dt>作詞<\/dt>/);
    assert.match(html, /<dt>編曲<\/dt>/);
  }
});
test("legacy role search includes all three creator roles and retains artist distinction", () => {
  for (const role of CREDIT_ROLES) {
    assert.equal(creditField(new URLSearchParams(`credit=${role}`)), role);
    assert.equal(
      new URL(
        crossSearchURL("A", 1, "/atlas/", role),
        "https://x.test",
      ).searchParams.get("credit"),
      role,
    );
    const data = {
      garupa: { songs: [{ ...songs[0], [role]: "A", artist: "B" }] },
      ournotes: { songs: [] },
    };
    assert.equal(crossGameSongs(data, "A", role).length, 1);
    assert.equal(crossGameSongs(data, "A", "artist").length, 0);
  }
});
test("published creator SEO/static content/routes/admin safeguards are generated", () => {
  const list = fs.readFileSync("dist/creators/index.html", "utf8"),
    detail = fs.readFileSync(`dist/creators/${cr.slug}/index.html`, "utf8"),
    sitemap = fs.readFileSync("dist/sitemap.xml", "utf8");
  assert.match(list, /<h1>クリエイター<\/h1>/);
  assert.ok(detail.includes(cr.name));
  assert.match(detail, /name="description"/);
  assert.match(detail, /rel="canonical"[^>]*creators\/noriyasu-agematsu\//);
  assert.ok(sitemap.includes(`creators/${cr.slug}/`));
  assert.doesNotMatch(sitemap, /admin\/creators/);
  const admin = fs.readFileSync("dist/admin/creators/index.html", "utf8");
  assert.match(admin, /noindex,nofollow/);
  assert.match(admin, /name="id"[^>]*readonly/);
  assert.doesNotMatch(
    fs.readFileSync("src/js/admin-creators.js", "utf8"),
    /localStorage|document\.cookie/,
  );
});
