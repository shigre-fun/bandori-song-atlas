import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  DIRECTORY,
  buildB1,
  loadInputs,
  verifyB1,
  assertProtected,
  generate,
  renderArtifacts,
  digest,
} from "../scripts/research/credits-phase-b1.mjs";
import {
  splitCredit,
  separateAffiliation,
  referenceKey,
} from "../scripts/research/creator-identity.mjs";

const inputs = loadInputs();
const data = buildB1(inputs);
const record = (game, id) =>
  data.normalized.find((r) => r.game === game && r.recordId === id);
const roles = (game, id, role) =>
  record(game, id).roles[role].effective.creatorTokens;
const cloneProposal = (mutate) => {
  const p = structuredClone(data.proposals);
  mutate(p);
  return { ...data, proposals: p };
};

test("every Phase A raw and record-role survives with its original spelling", () => {
  for (const r of inputs.phaseA.records)
    for (const [role, v] of Object.entries(r.roles))
      for (const raw of v.rawValues) {
        const m = data.rawMap.find(
          (m) => m.rawCredit === raw && m.role === role,
        );
        assert.ok(
          m.occurrences.some((o) => referenceKey(o) === referenceKey(r)),
        );
      }
  assert.equal(data.coverage.phaseAUniqueRaw, 524);
});
test("protected unit names and internal name punctuation never become separator splits", () => {
  for (const raw of [
    "MYTH & ROID",
    "Fear, and Loathing in Las Vegas",
    "ORANGE RANGE",
    "Tom-H@ck",
    "DECO*27",
  ]) {
    const s = splitCredit(raw, inputs.creators);
    assert.equal(s.creatorTokens.length, 1);
    assert.equal(s.creatorTokens[0].raw, raw);
  }
});
test("a punctuation-only split remains a review candidate", () => {
  const s = splitCredit("Unknown A、Unknown B", inputs.creators);
  assert.equal(s.status, "REVIEW_RECOMMENDED");
  assert.equal(s.creatorTokens.length, 2);
  assert.equal(s.rawCredit, "Unknown A、Unknown B");
});
test("Mela human review overrides the role error and protects the current composer", () => {
  assert.deepEqual(
    roles("ournotes", 75, "lyricist").map((t) => t.standardName),
    ["長屋晴子", "小林壱誓"],
  );
  assert.deepEqual(
    roles("ournotes", 75, "composer").map((t) => t.standardName),
    ["peppe", "穴見真吾"],
  );
  assert.ok(
    !data.proposals.composerCorrections.some(
      (r) => r.game === "ournotes" && r.recordId === 75,
    ),
  );
  assert.equal(
    record("ournotes", 75).composerAudit.currentRaw,
    "peppe／穴見真吾",
  );
});
test("all three flower versions keep Takeda only in arrangement", () => {
  for (const id of [176, 218, 738]) {
    assert.deepEqual(
      roles("garupa", id, "composer").map((t) => t.existingCreatorId),
      ["cr-0021"],
    );
    assert.deepEqual(
      roles("garupa", id, "arranger").map((t) => t.existingCreatorId),
      ["cr-0009"],
    );
  }
  const s = splitCredit(
    "末益涼太（Elements Garden）竹田祐介（Elements Garden）",
    inputs.creators,
  );
  assert.equal(s.status, "SUPERSEDED_ROLE_ERROR");
  assert.equal(s.creatorTokens.length, 0);
});
test("SUPA LOVE is affiliation and joint Symbol composition reuses existing IDs", () => {
  assert.deepEqual(separateAffiliation("槇島隆人(SUPA LOVE)"), {
    normalized: "槇島隆人",
    affiliation: "SUPA LOVE",
  });
  assert.deepEqual(
    roles("ournotes", 33, "composer").map((t) => t.existingCreatorId),
    ["cr-0013", "cr-0022"],
  );
  assert.equal(roles("ournotes", 14, "composer")[0].standardName, "槇島隆人");
});
test("Dream Monster human aliases resolve Aira and fixed Sena ID without game arrangement promotion", () => {
  assert.equal(
    roles("ournotes", 66, "composer")[0].existingCreatorId,
    "cr-0090",
  );
  assert.equal(roles("ournotes", 66, "composer")[1].standardName, "Aira");
  assert.equal(record("ournotes", 66).roles.arranger.target, false);
  assert.equal(
    separateAffiliation("Aira(Dream Monster)").affiliation,
    "Dream Monster",
  );
});
test("Elements Garden affiliation and standalone organization credit stay distinct", () => {
  assert.equal(
    separateAffiliation("藤永龍太郎（Elements Garden）").normalized,
    "藤永龍太郎",
  );
  const unit = data.identityIndex.find(
    (i) => i.existingCreatorId === "cr-0002",
  );
  assert.equal(unit.type, "organization");
  const spirit = data.newCandidates.find(
    (i) => i.standardName === "Spirit Garden",
  );
  assert.equal(spirit.type, "organization");
  assert.notEqual(spirit.identityKey, unit.identityKey);
});
test("record and role variants reuse one identity and preserve all 91 existing IDs", () => {
  assert.equal(data.coverage.existingCreatorIds, 91);
  assert.equal(
    new Set(data.identityIndex.map((i) => i.identityKey)).size,
    data.identityIndex.length,
  );
  assert.equal(
    data.newCandidates.filter((i) => i.standardName === "織田あすか").length,
    1,
  );
  assert.equal(
    data.newCandidates.filter((i) => i.standardName === "中村航").length,
    1,
  );
  const kanda = data.newCandidates.filter(
    (i) => i.standardName === "神田ジョン",
  );
  assert.equal(kanda.length, 1);
  assert.equal(kanda[0].confidence, "CONFIRMED");
  assert.ok(kanda[0].aliases.includes("神田ジョン(from PENGUIN RESEARCH)"));
  assert.ok(record("ournotes", 21).roles.arranger.creatorResolved);
  assert.ok(!data.newCandidates.some((i) => i.standardName === "藤間仁"));
});
test("samfree alias and legacy display override are explicit candidates", () => {
  const c = data.newCandidates.find((i) => i.standardName === "samfree");
  assert.ok(c.aliases.includes("SAM(samfree)"));
  assert.equal(
    data.proposals.displayOverrideCandidates[0].displayOverrideCandidate,
    "SAM(samfree)",
  );
});
test("multi-source format variants require identical confirmed identity sets", () => {
  const r = structuredClone(inputs.phaseA.records[0]);
  r.roles.lyricist.raw = null;
  r.roles.lyricist.rawValues = [
    "織田あすか（Elements Garden）",
    "織田あすか(Elements Garden)",
  ];
  r.roles.lyricist.variants = r.roles.lyricist.rawValues.map((raw) => ({
    ...r.roles.lyricist.variants[0],
    raw,
  }));
  const result = buildB1({
    ...inputs,
    phaseA: { records: [r] },
    humanReview: { cases: [] },
  });
  assert.equal(
    result.normalized[0].roles.lyricist.effective.equivalentRawVariants.length,
    2,
  );
  assert.ok(result.normalized[0].roles.lyricist.creatorResolved);
  r.roles.lyricist.rawValues[1] = "Unknown Other";
  r.roles.lyricist.variants[1].raw = "Unknown Other";
  const uncertain = buildB1({
    ...inputs,
    phaseA: { records: [r] },
    humanReview: { cases: [] },
  });
  assert.equal(uncertain.normalized[0].roles.lyricist.creatorResolved, false);
});
test("short-name global matching is rejected even when an existing ID is confirmed", () => {
  const unsafe = cloneProposal((p) => {
    const row = p.confirmedRawMapping.find((r) =>
      r.normalizedTokens.some((t) => t.standardName === "john"),
    );
    assert.ok(row);
    const t = row.normalizedTokens.find((t) => t.standardName === "john");
    t.applicability = "GLOBAL_CONFIRMED";
  });
  assert.throws(() => verifyB1(unsafe, inputs));
});
test("B2 rejects probable identity, review-only split, and formally allocated new IDs", () => {
  for (const change of [
    (p) =>
      (p.confirmedRawMapping[0].normalizedTokens[0].confidence = "PROBABLE"),
    (p) => (p.confirmedRawMapping[0].splitStatus = "REVIEW_RECOMMENDED"),
    (p) => (p.proposedNewCreators[0].id = "cr-0092"),
  ]) {
    assert.throws(() => verifyB1(cloneProposal(change), inputs));
  }
});
test("the three baseline policies and all uncertainty templates have exact denominators", () => {
  assert.equal(data.coverage.lyricist.confirmedCredit, 834);
  assert.equal(data.coverage.garupaArranger.confirmedCredit, 749);
  assert.equal(data.coverage.ournotesArranger.confirmedCredit, 5);
  assert.equal(data.unconfirmed.lyricist.length, 50);
  assert.equal(data.unconfirmed.garupaArranger.length, 50);
  assert.equal(data.unconfirmed.ournotesArranger.length, 80);
  assert.ok(
    data.unconfirmed.ournotesArranger.every(
      (r) => r.gameDisplayInput === null && r.checked === false,
    ),
  );
});
test("OurNotes arrangement proposals cannot expand beyond the five game confirmations", () => {
  const bad = cloneProposal((p) =>
    p.ournotesArrangerRelations.push({
      ...p.ournotesArrangerRelations[0],
      recordId: 66,
      game: "ournotes",
    }),
  );
  assert.throws(() => verifyB1(bad, inputs));
});
test("generate reruns are deterministic and preserve human inputs, Phase A, songs, creators and Works", () => {
  const paths = [
    `${DIRECTORY}/human-review.json`,
    `${DIRECTORY}/identity-evidence.json`,
    ...Object.keys(inputs.baseline.protectedSources),
  ];
  const before = paths.map(digest);
  generate(".cache/credits-phase-b1-test");
  const names = Object.keys(renderArtifacts(data, inputs));
  const first = names.map((n) => digest(`.cache/credits-phase-b1-test/${n}`));
  generate(".cache/credits-phase-b1-test");
  assert.deepEqual(
    first,
    names.map((n) => digest(`.cache/credits-phase-b1-test/${n}`)),
  );
  assert.deepEqual(before, paths.map(digest));
  assert.equal(assertProtected().phaseAFiles, 426);
});
test("research generation cannot write into dist and build copies only public catalog sources", () => {
  assert.throws(() => generate("dist"), /Research output/);
  const build = fs.readFileSync("scripts/build.mjs", "utf8");
  assert.ok(!build.includes("credits-phase-b1"));
  assert.ok(!build.includes("docs/migrations"));
});
