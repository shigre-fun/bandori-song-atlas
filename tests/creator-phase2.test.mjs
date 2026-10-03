import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadLegacyCredits } from "../scripts/migrations/legacy-references.mjs";
import { spawnSync } from "node:child_process";
import { loadGameCatalog } from "../scripts/catalog.mjs";
import { GAMES } from "../src/js/site-config.js";
import {
  roleCoverage,
  availableCreditRoles,
} from "../src/js/credit-coverage.js";
import {
  renderCreators,
  renderCreatorDetail,
} from "../src/js/creator-views.js";
import {
  validateCreatorDatabase,
  creatorParticipation,
  creditText,
} from "../src/js/creators-data.js";
import {
  reviewCreatorCandidates,
  applyConfirmedCreators,
} from "../scripts/migrations/review-creators.mjs";
const master = JSON.parse(fs.readFileSync("data/creators.json", "utf8"));
const works = JSON.parse(fs.readFileSync("data/works.json", "utf8"));
const songs = Object.values(GAMES).flatMap(loadGameCatalog);
const map = JSON.parse(
  fs.readFileSync("docs/migrations/creator-map.json", "utf8"),
);
test("unprepared role counts and filters are distinct from a measured zero and switch through dataset coverage", () => {
  assert.deepEqual(availableCreditRoles(master.roleCoverage), ["composer"]);
  assert.throws(() => roleCoverage({ composer: "ready" }), /roleCoverage/);
  const list = renderCreators(master.creators, songs, "/", master.roleCoverage);
  assert.doesNotMatch(
    list,
    /<dt>作詞曲数<\/dt>|<dt>編曲曲数<\/dt>|option value="lyricist"|option value="arranger"/,
  );
  const detail = renderCreatorDetail(
    master.creators[0],
    songs,
    works.works,
    "/",
    master.roleCoverage,
  );
  assert.match(detail, /<dt>作詞曲数<\/dt><dd><span class="notice">未整備/);
  assert.match(detail, /<dt>編曲曲数<\/dt><dd><span class="notice">未整備/);
  assert.match(detail, /<dt>作曲曲数<\/dt><dd>59/);
  assert.doesNotMatch(
    detail,
    /option value="lyricist"|option value="arranger"/,
  );
  const ready = { lyricist: "ready", composer: "ready", arranger: "ready" };
  const full = renderCreatorDetail(
    master.creators[0],
    songs,
    works.works,
    "/",
    ready,
  );
  assert.match(full, /<dt>作詞曲数<\/dt><dd>0/);
  assert.match(full, /option value="lyricist"/);
});
test("human-confirmed spellings share fixed identities, keep overrides and remove Work warnings", () => {
  const get = (g, id) => songs.find((s) => s.gameId === g && s.id === id);
  for (const refs of [
    [get("garupa", 603), get("ournotes", 80)],
    [get("garupa", 646), get("ournotes", 7), get("ournotes", 79)],
  ]) {
    assert.equal(new Set(refs.map((s) => s.credits[0].creatorId)).size, 1);
    assert.equal(new Set(refs.map((s) => s.workId)).size, 1);
    assert.ok(
      new Set(refs.map((s) => creditText(s, "composer", master.creators)))
        .size > 1,
    );
    assert.ok(!works.works.find((w) => w.id === refs[0].workId).reviewRequired);
  }
  assert.equal(
    validateCreatorDatabase(master, works, songs).warnings.length,
    0,
  );
  const agematsu = creatorParticipation("cr-0001", songs);
  assert.equal(agematsu.total, 59);
  assert.equal(agematsu.recordings, 66);
  assert.equal(songs.length, 884);
  assert.equal(works.works.length, 823);
  // A genuine identity mismatch is still a warning, even when both names have IDs.
  const altered = structuredClone(songs),
    target = altered.find((s) => s.gameId === "ournotes" && s.id === 80);
  target.credits = [{ creatorId: "cr-0001", roles: ["composer"] }];
  target.creditDisplay.composer = [{ creatorId: "cr-0001" }];
  target.composer = "上松範康";
  assert.equal(
    validateCreatorDatabase(master, works, altered).warnings.length,
    1,
  );
});
test("candidate A/B/C/D hints never become AUTO_RESOLVED or apply without exact map", () => {
  const originals = [
    "候補（Elements Garden）",
    "候補",
    "別 名",
    "別名",
    "別主体（所属不明）",
    "単独名",
    "確認名",
  ];
  const legacy = originals.map((composer, i) => ({
    reference: `garupa:${i + 1}`,
    composer,
  }));
  const fixture = legacy.map((s, i) => ({
    gameId: "garupa",
    id: i + 1,
    workId: `wk-${String(i + 1).padStart(4, "0")}`,
    composer: s.composer,
    credits: [],
    creditDisplay: {
      lyricist: [],
      composer: [{ text: s.composer, unresolved: true }],
      arranger: [],
    },
  }));
  const mapping = {
    creators: [
      {
        id: "cr-0001",
        name: "確認名",
        slug: "confirmed",
        sortKey: "確認名",
        type: "person",
        aliases: [],
      },
    ],
  };
  const review = reviewCreatorCandidates(legacy, fixture, mapping);
  assert.equal(
    review.candidates.find((c) => c.originals.includes("候補")).group,
    "A",
  );
  assert.equal(
    review.candidates.find((c) => c.originals.includes("別 名")).group,
    "B",
  );
  assert.equal(
    review.candidates.find((c) => c.originals.includes("別主体（所属不明）"))
      .group,
    "C",
  );
  assert.equal(
    review.candidates.find((c) => c.originals.includes("単独名")).group,
    "D",
  );
  assert.equal(review.summary.autoResolvedStrings, 1);
  const docs = {
    garupa: { groups: [{ songs: fixture }] },
    ournotes: { groups: [] },
  };
  const applied = applyConfirmedCreators(
    { version: 1, nextId: 1, creators: [] },
    {
      version: 1,
      nextId: 8,
      works: fixture.map((s) => ({ id: s.workId, title: s.composer })),
    },
    docs,
    mapping,
  );
  assert.equal(applied.changed.length, 1);
  assert.equal(applied.master.creators.length, 1);
  assert.ok(
    applied.songs
      .slice(0, 6)
      .every((s) => s.creditDisplay.composer[0].unresolved),
  );
});
test("review report is deterministic, complete and migration reapply preserves IDs/data", () => {
  const legacy = loadLegacyCredits();
  const research = JSON.parse(
    fs.readFileSync(
      "docs/migrations/creators-2026-10-02/creator-research.json",
      "utf8",
    ),
  );
  const review = reviewCreatorCandidates(legacy, songs, map, research);
  assert.deepEqual(
    review,
    JSON.parse(
      fs.readFileSync(
        "docs/migrations/creators-2026-10-02/creator-review.json",
        "utf8",
      ),
    ),
  );
  assert.equal(review.summary.creditStrings, 342);
  assert.equal(review.summary.remainingUnidentifiedStrings, 215);
  assert.equal(
    review.summary.autoResolvedStrings +
      review.summary.reviewRecommendedStrings +
      review.summary.unresolvedStrings,
    342,
  );
  const paths = [
    "data/creators.json",
    "data/works.json",
    "data/garupa/songs.json",
    "data/ournotes/songs.json",
  ];
  const before = paths.map((p) => fs.readFileSync(p, "utf8"));
  const run = spawnSync(
    process.execPath,
    ["scripts/migrations/review-creators.mjs", "apply"],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(
    paths.map((p) => fs.readFileSync(p, "utf8")),
    before,
  );
});
