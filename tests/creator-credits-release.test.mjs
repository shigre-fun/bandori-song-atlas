import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  effectivePackage,
  createPlan,
  applyPlan,
  verifyApplied,
  assertResearch,
  hash,
  DIRECTORY,
} from "../scripts/migrations/apply-credits-phase-b2.mjs";
import {
  releaseHistoryJSON,
  releaseHistoryBuffer,
} from "../scripts/migrations/release-history.mjs";
import {
  creditText,
  creditRows,
  selectedCreditData,
  searchCreators,
  validateCreatorDatabase,
  creatorParticipation,
} from "../src/js/creators-data.js";
import { loadGameCatalog } from "../scripts/catalog.mjs";
import { GAMES } from "../src/js/site-config.js";
import {
  parallelReview,
  approvedSource,
  nonCredit,
  verifyNonCredit,
} from "../scripts/migrations/release-parallel.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const master = read("data/creators.json"),
  pkg = effectivePackage(),
  baseline = read(DIRECTORY + "/release-baseline.json");
const songs = ["garupa", "ournotes"].flatMap((g) => loadGameCatalog(GAMES[g]));
const key = (r) => r.game + ":" + r.recordId + ":" + r.role;
for (const [id, name, sortKey, slug] of [
  ["cr-0118", "宮崎京一", "みやざききょういち", "kyoichi-miyazaki"],
  ["cr-0119", "母里治樹", "もりはるき", "haruki-mori"],
  ["cr-0120", "川渕龍成", "かわぶちりゅうせい", "ryusei-kawabuchi"],
])
  test("release human metadata " + id, () => {
    const c = master.creators.find((c) => c.id === id);
    assert.deepEqual(
      {
        id: c.id,
        name: c.name,
        sortKey: c.sortKey,
        slug: c.slug,
        type: c.type,
      },
      { id, name, sortKey, slug, type: "person" },
    );
    assert.equal(c.previousSlugs, undefined);
    const review = read(DIRECTORY + "/human-review.json").metadataReviews.find(
      (r) => r.creatorId === id,
    );
    assert.equal(review.sourceType, "human-review");
    assert.equal(review.checkedAt, "2026-10-03");
    assert.equal(review.previousStatus, "BLOCKED_METADATA");
  });
test("release count 124 nextId 125 and no shifted IDs", () => {
  assert.equal(master.creators.length, 124);
  assert.equal(master.nextId, 125);
  assert.deepEqual(
    master.creators.map((c) => c.id),
    Array.from(
      { length: 124 },
      (_, i) => "cr-" + String(i + 1).padStart(4, "0"),
    ),
  );
});
test("release all prior 121 metadata remain exact", () => {
  for (const c of releaseHistoryJSON("data/creators.json").creators)
    assert.deepEqual(
      master.creators.find((n) => n.id === c.id),
      c,
    );
});
test("release current and previous slug collision zero", () => {
  const slugs = master.creators.flatMap((c) => [
    c.slug,
    ...(c.previousSlugs ?? []),
  ]);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const c of master.creators)
    assert.doesNotMatch(c.slug, /^creator-\d+$|candidate|^cr-\d+$/);
});
test("release metadata fourteen and approved joint six restored roles", () => {
  assert.equal(
    pkg.candidateIdMap.filter((c) => c.status !== "READY").length,
    0,
  );
  const prior = releaseHistoryJSON(
    DIRECTORY + "/phase-b2-effective-package.json",
  );
  const oldKeys = new Set(prior.relations.map(key));
  const added = pkg.relations.filter((r) => !oldKeys.has(key(r)));
  assert.equal(added.length, 20);
  assert.deepEqual(
    new Set(added.map(key)),
    new Set([
      ...baseline.excludedMetadata.map(key),
      ...[220, 231, 243, 246, 248, 272].map(
        (id) => "garupa:" + id + ":arranger",
      ),
    ]),
  );
  for (const r of added) {
    const s = songs.find((s) => s.gameId === r.game && s.id === r.recordId);
    assert.deepEqual(
      s.creditDisplay[r.role]
        .filter((p) => p.creatorId)
        .map((p) => p.creatorId),
      r.creatorTokens.map((t) => t.creatorId),
    );
    assert.equal(creditText(s, r.role, master.creators), r.rawCredit);
  }
});
test("release exclusions change only approved twenty and new record three", () => {
  const old = releaseHistoryJSON(DIRECTORY + "/unresolved-after-b2.json");
  assert.equal(pkg.excluded.length, old.length - 20 + 3);
  assert.equal(pkg.excluded.length, 703);
  assert.deepEqual(
    new Set(pkg.excluded.map(key)),
    new Set([
      ...old
        .filter(
          (e) =>
            e.reason !== "BLOCKED_METADATA" &&
            ![220, 231, 243, 246, 248, 272]
              .map((id) => "garupa:" + id + ":arranger")
              .includes(key(e)),
        )
        .map(key),
      ...["lyricist", "composer", "arranger"].map(
        (role) => "ournotes:86:" + role,
      ),
    ]),
  );
  assert.equal(
    pkg.excluded.filter((e) => e.reason === "BLOCKED_METADATA").length,
    0,
  );
});
test("release approved Kawabuchi joint splits retain raw and order", () => {
  const rows = pkg.normalized.flatMap((r) =>
    Object.entries(r.roles)
      .filter(([_, v]) =>
        v.effective.creatorTokens.some((t) => t.creatorId === "cr-0120"),
      )
      .map(([role, v]) => ({ r, role, v })),
  );
  assert.equal(rows.length, 6);
  for (const { r, role, v } of rows) {
    assert.equal(v.effective.splitStatus, "CONFIRMED_SPLIT");
    assert.equal(v.creatorResolved, true);
    const s = songs.find((s) => s.gameId === r.game && s.id === r.recordId);
    assert.equal(
      s.credits.some((c) => c.creatorId === "cr-0120"),
      true,
    );
    assert.equal(creditText(s, role, master.creators), v.effective.rawCredit);
    assert.deepEqual(
      s.creditDisplay.arranger
        .filter((p) => p.creatorId)
        .map((p) => p.creatorId),
      v.effective.creatorTokens.map((t) => t.creatorId),
    );
    assert.ok(
      v.effective.creatorTokens.every(
        (t) => t.recordScope === "garupa:" + r.recordId,
      ),
    );
  }
});
test("release all 885 non-credit records equal approved parallel source", () => {
  const ignored = new Set([
    "lyricist",
    "composer",
    "arranger",
    "credits",
    "creditDisplay",
  ]);
  const omit = (s) =>
    Object.fromEntries(Object.entries(s).filter(([k]) => !ignored.has(k)));
  let n = 0;
  for (const game of ["garupa", "ournotes"]) {
    const old = JSON.parse(
        approvedSource(
          releaseHistoryBuffer("data/" + game + "/songs.json").toString("utf8"),
          game,
        ),
      ),
      current = read("data/" + game + "/songs.json");
    old.groups.forEach((g, i) => {
      assert.deepEqual(
        { ...g, songs: null },
        { ...current.groups[i], songs: null },
      );
      g.songs.forEach((s, j) => {
        assert.deepEqual(omit(current.groups[i].songs[j]), omit(s));
        n++;
      });
    });
  }
  assert.equal(n, 885);
});
test("release OurNotes intentional IDs preserved in full", () => {
  for (const [id, title] of [
    [50, "これはぼくたちの生存のあらすじ"],
    [51, "うちゅうのふしぎ"],
    [52, "真夜中遊園地"],
  ]) {
    assert.equal(
      songs.find((s) => s.gameId === "ournotes" && s.id === id).title,
      title,
    );
    assert.deepEqual(
      read("data/ournotes/songs.json")
        .groups.flatMap((g) => g.songs)
        .find((s) => s.id === id),
      releaseHistoryJSON("data/ournotes/songs.json")
        .groups.flatMap((g) => g.songs)
        .find((s) => s.id === id),
    );
  }
});
test("release Work 823 bytes unchanged and record counts exact", () => {
  assert.equal(
    hash(fs.readFileSync("data/works.json")),
    baseline.sourceHashes["data/works.json"],
  );
  assert.equal(read("data/works.json").works.length, 823);
  assert.equal(songs.length, 885);
  assert.equal(songs.filter((s) => s.gameId === "garupa").length, 799);
  assert.equal(songs.filter((s) => s.gameId === "ournotes").length, 86);
});
test("release all 2652 current displays preserved", () => {
  const oldMaster = releaseHistoryJSON("data/creators.json");
  let n = 0;
  for (const game of ["garupa", "ournotes"])
    for (const g of releaseHistoryJSON("data/" + game + "/songs.json").groups)
      for (const s of g.songs) {
        const current = songs.find((c) => c.gameId === game && c.id === s.id);
        for (const role of ["lyricist", "composer", "arranger"]) {
          assert.equal(
            creditText(current, role, master.creators),
            creditText(s, role, oldMaster.creators),
          );
          n++;
        }
      }
  assert.equal(n, 2652);
});
test("release game coverage and old80 plus new1 uncollected arranger", () => {
  assert.deepEqual(
    master.roleCoverage,
    releaseHistoryJSON("data/creators.json").roleCoverage,
  );
  assert.equal(
    songs.filter(
      (s) =>
        s.gameId === "ournotes" && !creditText(s, "arranger", master.creators),
    ).length,
    81,
  );
});
test("release new86 reuses explicit linked Work and retains unknown credits", () => {
  const manifest = parallelReview();
  const added = songs.find((s) => s.gameId === "ournotes" && s.id === 86),
    linked = songs.find((s) => s.gameId === "garupa" && s.id === 758);
  assert.equal(added.workId, linked.workId);
  assert.deepEqual(added.relatedSongIds, ["garupa:758"]);
  assert.deepEqual(linked.relatedSongIds, ["ournotes:86"]);
  assert.equal(manifest.composer.id, null);
  assert.equal(
    creditText(added, "composer", master.creators),
    "カンザキイオリ",
  );
  assert.deepEqual(added.creditDisplay.composer, [
    { text: "カンザキイオリ", unresolved: true },
  ]);
  assert.equal(added.credits.length, 0);
  assert.equal(creditText(added, "arranger", master.creators), "");
  assert.equal(creditText(added, "lyricist", master.creators), "");
  const raw = read("data/ournotes/songs.json")
    .groups.flatMap((g) => g.songs)
    .find((s) => s.id === 86);
  assert.deepEqual(nonCredit(raw), {
    ...nonCredit(manifest.remoteRecord),
    workId: linked.workId,
  });
});
test("release remote fields and admin nextId retained exactly", () => {
  const manifest = parallelReview();
  for (const game of ["garupa", "ournotes"]) {
    const current = read("data/" + game + "/songs.json").groups.flatMap(
      (g) => g.songs,
    );
    for (const item of manifest.changes[game])
      for (const change of item.changes)
        assert.deepEqual(
          current.find((s) => s.id === item.id)[change.field],
          change.remote,
        );
  }
  assert.deepEqual(read("data/ournotes/admin-state.json"), manifest.adminState);
  assert.equal(manifest.adminState.nextId, 87);
});
test("release corrected scope does not change 224 or250 credits", () => {
  const before = releaseHistoryJSON("data/garupa/songs.json").groups.flatMap(
      (g) => g.songs,
    ),
    now = read("data/garupa/songs.json").groups.flatMap((g) => g.songs);
  for (const id of [224, 250])
    assert.deepEqual(
      now.find((s) => s.id === id),
      before.find((s) => s.id === id),
    );
  const review = read(DIRECTORY + "/human-review.json").jointArrangerReviews;
  assert.deepEqual(
    review.map((r) => r.recordId),
    [220, 231, 243, 246, 248, 272],
  );
  const s = now.find((s) => s.id === 220);
  assert.deepEqual(
    s.creditDisplay.arranger.filter((p) => p.creatorId).map((p) => p.creatorId),
    ["cr-0019", "cr-0120"],
  );
});
test("release unexpected non-credit edit is rejected by verifier", () => {
  const file = "data/ournotes/songs.json",
    bytes = fs.readFileSync(file),
    data = JSON.parse(bytes);
  data.groups.flatMap((g) => g.songs).find((s) => s.id === 86)
    .durationSeconds++;
  assert.throws(
    () => verifyNonCredit(JSON.parse(bytes), data, "ournotes"),
    /non-credit ournotes:86/,
  );
});
test("release validation has no warnings or invalid states", () => {
  assert.equal(
    validateCreatorDatabase(master, read("data/works.json"), songs).warnings
      .length,
    0,
  );
  for (const r of pkg.relations)
    for (const t of r.creatorTokens) {
      assert.equal(t.confidence, "CONFIRMED");
      assert.match(t.creatorId, /^cr-\d{4}$/);
    }
});
test("release second apply changes zero files", () => {
  assert.deepEqual(applyPlan(createPlan(pkg)), {
    unchanged: true,
    changedFiles: 0,
  });
  assert.equal(verifyApplied().protectedResearch, 452);
});
test("release admin searches new names readings and slugs", () => {
  for (const id of ["cr-0118", "cr-0119", "cr-0120"]) {
    const c = master.creators.find((c) => c.id === id);
    for (const q of [c.name, c.sortKey, c.slug])
      assert.ok(searchCreators(master.creators, q).some((r) => r.id === id));
  }
});
test("release admin picker roundtrips all restored roles", () => {
  for (const r of baseline.excludedMetadata) {
    const s = songs.find((s) => s.gameId === r.game && s.id === r.recordId);
    const saved = selectedCreditData(creditRows(s), master.creators, s);
    for (const role of ["lyricist", "composer", "arranger"])
      assert.equal(
        creditText({ ...s, ...saved }, role, master.creators),
        creditText(s, role, master.creators),
      );
  }
});
test("release memberships do not create organization participation", () => {
  for (const r of baseline.excludedMetadata) {
    const s = songs.find((s) => s.gameId === r.game && s.id === r.recordId);
    assert.equal(
      s.credits.some(
        (c) => c.creatorId === "cr-0002" && c.roles.includes(r.role),
      ),
      false,
    );
  }
});
test("release human history and immutable A B1 provenance remain available", () => {
  const h = read(DIRECTORY + "/human-review.json"),
    old = releaseHistoryJSON(DIRECTORY + "/human-review.json");
  for (const [k, v] of Object.entries(old)) assert.deepEqual(h[k], v);
  assert.equal(Object.keys(assertResearch().protectedResearch).length, 452);
  assert.equal(creatorParticipation("cr-0118", songs).recordings, 8);
});
