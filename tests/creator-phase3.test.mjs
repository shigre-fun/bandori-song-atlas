import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { rebaseLegacyCredits } from "../scripts/migrations/legacy-references.mjs";
import {
  confirmedResearchMap,
  coverage,
} from "../scripts/migrations/research-creators.mjs";
import { applyConfirmedCreators } from "../scripts/migrations/review-creators.mjs";
import { isConfirmedEvidence } from "../scripts/migrations/creator-evidence.mjs";
const empty = {
  version: 1,
  nextId: 1,
  creators: [],
  roleCoverage: {
    composer: "ready",
    lyricist: "unprepared",
    arranger: "unprepared",
  },
};
const evidence = {
  url: "https://example.com/credit",
  access: "read",
  checkedAt: "2026-10-02",
  supports: "作品公式で個人作曲者を確認",
};
const candidate = {
  name: "作者",
  originals: ["作者（所属）"],
  type: "person",
  sortKey: "作者",
  sortKeyStatus: "provisional-original",
  slug: null,
  records: ["garupa:1"],
  status: "CONFIRMED",
  evidence: [evidence],
};
const research = (entries) => ({ checkedAt: "2026-10-02", entries });
test("explicit user-approved recording ID rotation rebases references simultaneously and rejects accidental merging", () => {
  const legacy = [
    { reference: "ournotes:50", composer: "A" },
    { reference: "ournotes:51", composer: "B" },
    { reference: "ournotes:52", composer: "C" },
  ];
  const updates = {
    references: [
      { from: "ournotes:50", to: "ournotes:52", title: "A", workId: "wk-0001" },
      { from: "ournotes:51", to: "ournotes:50", title: "B", workId: "wk-0002" },
      { from: "ournotes:52", to: "ournotes:51", title: "C", workId: "wk-0003" },
    ],
  };
  assert.deepEqual(
    rebaseLegacyCredits(legacy, updates).map((s) => s.reference),
    ["ournotes:52", "ournotes:50", "ournotes:51"],
  );
  assert.deepEqual(
    legacy.map((s) => s.composer),
    ["A", "B", "C"],
  );
  assert.throws(
    () => rebaseLegacyCredits(legacy, { references: [updates.references[0]] }),
    /重複/,
  );
});
test("official research excludes every non-confirmed entry and preserves fixed IDs on retry", () => {
  const map = confirmedResearchMap(
    empty,
    { creators: [], roleCoverage: empty.roleCoverage },
    research([
      candidate,
      { ...candidate, name: "保留", status: "PROBABLE" },
      { ...candidate, name: "不明", status: "UNRESOLVED" },
    ]),
  );
  assert.equal(map.creators.length, 1);
  assert.equal(map.creators[0].id, "cr-0001");
  assert.equal(map.creators[0].slug, "creator-0001");
  assert.deepEqual(
    confirmedResearchMap({ ...empty, nextId: 2 }, map, research([candidate])),
    map,
  );
});
test("unread evidence, guessed kana, duplicate aliases, slug collisions and changed entity types stop before writes", () => {
  const initial = { creators: [] };
  for (const patch of [
    { evidence: [{ ...evidence, access: "snippet-only" }] },
    { sortKey: "さくしゃ" },
    { type: null },
    { records: [] },
  ])
    assert.throws(() =>
      confirmedResearchMap(
        empty,
        initial,
        research([{ ...candidate, ...patch }]),
      ),
    );
  assert.throws(() =>
    confirmedResearchMap(
      empty,
      initial,
      research([
        candidate,
        { ...candidate, name: "別人", originals: ["作者（所属）"] },
      ]),
    ),
  );
  assert.throws(
    () =>
      confirmedResearchMap(
        empty,
        initial,
        research([
          { ...candidate, slug: "same" },
          {
            ...candidate,
            name: "別人",
            sortKey: "別人",
            originals: ["別人"],
            slug: "same",
          },
        ]),
      ),
    /slug/,
  );
  const registered = confirmedResearchMap(
    empty,
    initial,
    research([candidate]),
  );
  assert.throws(
    () =>
      confirmedResearchMap(
        { ...empty, nextId: 2 },
        registered,
        research([{ ...candidate, type: "unit" }]),
      ),
    /type/,
  );
});
test("short-name mapping applies to approved work references and composer only; evidence stays outside public master", () => {
  const c = {
    ...candidate,
    name: "TK",
    sortKey: "TK",
    sortKeyStatus: "confirmed",
    originals: ["TK"],
    slug: "tk",
  };
  const map = confirmedResearchMap(
    empty,
    { creators: [], roleCoverage: empty.roleCoverage },
    research([c]),
  );
  const song = (id) => ({
    id,
    title: "曲",
    workId: `wk-${String(id).padStart(4, "0")}`,
    composer: "TK",
    lyricist: "TK",
    arranger: null,
    credits: [],
    creditDisplay: {
      composer: [{ text: "TK", unresolved: true }],
      lyricist: [{ text: "TK", unresolved: true }],
      arranger: [],
    },
  });
  const documents = {
    garupa: { groups: [{ songs: [song(1), song(2)] }] },
    ournotes: { groups: [] },
  };
  const works = {
    version: 1,
    nextId: 3,
    works: [
      { id: "wk-0001", title: "曲" },
      { id: "wk-0002", title: "曲" },
    ],
  };
  const p = applyConfirmedCreators(empty, works, documents, map);
  assert.equal(p.changed.length, 1);
  assert.equal(p.songs[0].credits[0].creatorId, "cr-0001");
  assert.equal(p.songs[1].creditDisplay.composer[0].unresolved, true);
  assert.equal(p.songs[0].creditDisplay.lyricist[0].unresolved, true);
  assert.equal("identityEvidence" in p.master.creators[0], false);
  assert.equal("approvedReferences" in p.master.creators[0], false);
  assert.deepEqual(documents.garupa.groups[0].songs[0].credits, []);
});
test("coverage counts only fully resolved composers and requires every recording of a Work", () => {
  const songs = [
    {
      workId: "a",
      creditDisplay: {
        composer: [
          { creatorId: "cr-0001" },
          { text: "不明", unresolved: true },
        ],
      },
    },
    { workId: "b", creditDisplay: { composer: [{ creatorId: "cr-0001" }] } },
    {
      workId: "b",
      creditDisplay: { composer: [{ text: "不明", unresolved: true }] },
    },
  ];
  const c = coverage(songs);
  assert.equal(c.recordings, 1);
  assert.equal(c.works, 0);
  assert.equal(c.totalWorks, 2);
});
test("all frequent unresolved baseline candidates have a research decision and retained sources exclude search snippets", () => {
  const dir = "docs/migrations/creators-2026-10-02/";
  const r = JSON.parse(fs.readFileSync(dir + "creator-research.json", "utf8"));
  const baseline = JSON.parse(
    fs.readFileSync(dir + "phase3-before-review.json", "utf8"),
  );
  for (const c of baseline.candidates.filter(
    (c) => c.recordCount >= 3 && c.status !== "AUTO_RESOLVED",
  ))
    assert.ok(
      r.entries.some((e) => e.originals.some((v) => c.originals.includes(v))),
      c.candidateName,
    );
  for (const e of r.entries.filter((e) => e.status === "CONFIRMED"))
    assert.ok(e.evidence.some(isConfirmedEvidence), e.name);
});
