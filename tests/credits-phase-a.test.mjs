import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  parseCreditLine,
  discographyFacts,
  gameFacts,
  bandMatches,
  candidateForRaw,
} from "../scripts/research/credit-evidence.mjs";
import {
  DIRECTORY,
  generate,
  verifyResearch,
  assertProtected,
  compareComposer,
  buildSchema,
} from "../scripts/research/credits-phase-a.mjs";
import { validateSchema } from "../scripts/research/research-schema.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const baseline = read(`${DIRECTORY}/baseline.json`),
  creators = read("data/creators.json").creators;
const dataset = read(`${DIRECTORY}/credit-research.json`),
  sources = read(`${DIRECTORY}/source-index.json`),
  facts = read(`${DIRECTORY}/evidence-facts.json`);
const verify = (data) =>
  verifyResearch(data, sources, facts, baseline, creators);
const source = {
  url: "https://bang-dream.com/discographies/4219/",
  sourceType: "bangdream-discography",
  pageTitle: "夢限大みゅーたいぷ「これはぼくたちの生存のあらすじ」",
  artists: "夢限大みゅーたいぷ",
  checkedAt: "2026-10-03T00:00:00Z",
  pageReadStatus: "HTTP_CONFIRMED",
  releaseDate: "2026年6月21日",
  creditLines: [
    { line: 1, text: "夢限大みゅーたいぷ「これはぼくたちの生存のあらすじ」" },
    { line: 2, text: "作詞・作曲：田淵智也" },
    { line: 3, text: "編曲：堀江晶太" },
  ],
};

test("combined and abbreviated credit labels expand roles without conflating arrangement and composition", () => {
  for (const [text, roles] of [
    ["作詞・作曲：A", ["lyricist", "composer"]],
    ["作編曲：B", ["composer", "arranger"]],
    ["作詞作曲編曲：C", ["lyricist", "composer", "arranger"]],
    ["作詞・作曲・編曲：D", ["lyricist", "composer", "arranger"]],
    ["編曲：E", ["arranger"]],
    ["詞：F / 曲：G", ["lyricist", "composer"]],
  ])
    assert.deepEqual(
      parseCreditLine(text).values.map((v) => v.role),
      roles,
    );
  assert.equal(
    parseCreditLine("作詞：A　作曲：B　編曲：C / D").values[2].raw,
    "C / D",
  );
});
test("raw punctuation, internal spaces and source credit labels survive extraction", () => {
  const raw = "植木建象、神田ジョン(from PENGUIN RESEARCH)";
  assert.equal(parseCreditLine("編曲：" + raw).values[0].raw, raw);
  assert.equal(parseCreditLine("作曲：佐藤　英敏").values[0].raw, "佐藤　英敏");
  const [f] = discographyFacts(source);
  assert.equal(f.title, "これはぼくたちの生存のあらすじ");
  assert.deepEqual(f.credits, {
    lyricist: "田淵智也",
    composer: "田淵智也",
    arranger: "堀江晶太",
  });
  assert.ok(f.creditText.includes("作詞・作曲："));
  const noHeading = structuredClone(source);
  noHeading.creditLines.shift();
  assert.equal(discographyFacts(noHeading)[0].title, f.title);
  const other = structuredClone(source);
  other.artists = "MyGO!!!!!";
  assert.notEqual(discographyFacts(other)[0].title, f.title);
});
test("track sequencing and explicit artist context prevent credits crossing to a different song or band", () => {
  const s = {
    ...source,
    creditLines: [
      { line: 1, text: "1. A" },
      { line: 2, text: "作詞：a" },
      { line: 3, text: "作曲：b" },
      { line: 4, text: "2. B" },
      { line: 5, text: "作詞・作曲：c" },
    ],
  };
  const f = discographyFacts(s);
  assert.equal(f.length, 2);
  assert.equal(f[0].title, "A");
  assert.equal(f[1].title, "B");
  assert.equal(f[1].credits.composer, "c");
  assert.equal(bandMatches(f[0], { band: "MyGO!!!!!" }), false);
});
test("game definition lists with inline label values are still raw role evidence", () => {
  const s = {
    url: "https://bang-dream.bushimo.jp/music/",
    pageTitle: "Music",
    checkedAt: "2026-10-03T00:00:00Z",
    pageReadStatus: "BROWSER_CONFIRMED",
    sourceType: "game-official",
    rows: [
      {
        title: "じょいふる",
        artist: "Poppin'Party",
        bandClass: "poppinparty",
        category: "extra",
        creditFields: [
          { label: "作曲 水野良樹", value: null, creditText: "作曲 水野良樹" },
          {
            label: "編曲",
            value: "日高勇輝(Elements Garden)",
            creditText: "編曲：日高勇輝(Elements Garden)",
          },
        ],
      },
    ],
  };
  const [f] = gameFacts(s, "garupa");
  assert.equal(f.credits.composer, "水野良樹");
  assert.equal(f.credits.arranger, "日高勇輝(Elements Garden)");
});
test("all 884 references and current raw fields are covered exactly once, with byte guards and unchanged roleCoverage", () => {
  assert.equal(verify(dataset).records, 884);
  assertProtected(baseline);
  assert.equal(dataset.records.filter((r) => r.game === "garupa").length, 799);
  assert.equal(dataset.records.filter((r) => r.game === "ournotes").length, 85);
  const r = dataset.records.find(
    (r) => r.game === "ournotes" && r.recordId === 50,
  );
  assert.equal(r.title, "これはぼくたちの生存のあらすじ");
  assert.equal(r.roles.composer.raw, "田淵智也");
  assert.deepEqual(read("data/creators.json").roleCoverage, {
    lyricist: "unprepared",
    composer: "ready",
    arranger: "unprepared",
  });
});
test("schema rejects missing roles, invalid status, malformed provenance and unsupported schema keywords", () => {
  let d = structuredClone(dataset);
  delete d.records[0].roles.lyricist;
  assert.throws(() => verify(d), /missing lyricist/);
  d = structuredClone(dataset);
  d.records[0].roles.composer.evidenceStatus = "UNKNOWN";
  assert.throws(() => verify(d), /enum/);
  d = structuredClone(dataset);
  d.records[0].roles.composer.variants[0].sourceUrl = "http://example.com";
  assert.throws(() => verify(d), /pattern/);
  assert.throws(
    () => validateSchema({}, { type: "object", unsupported: true }),
    /Unsupported/,
  );
  assert.deepEqual(
    read(`${DIRECTORY}/credit-research.schema.json`),
    buildSchema(),
  );
});
test("validator rejects duplicate, absent or renamed baseline records and altered credit raw evidence", () => {
  let d = structuredClone(dataset);
  d.records[1] = d.records[0];
  assert.throws(() => verify(d), /Duplicate/);
  d = structuredClone(dataset);
  d.records.pop();
  assert.throws(() => verify(d), /short|884/);
  d = structuredClone(dataset);
  d.records[0].title += "x";
  assert.throws(() => verify(d), /Baseline/);
  d = structuredClone(dataset);
  d.records[0].roles.composer.variants[0].raw += "x";
  assert.throws(() => verify(d), /Raw value|altered/);
});
test("confirmed credit cannot use missing or unread source provenance", () => {
  const d = structuredClone(dataset),
    r = d.records.find((r) => r.roles.composer.variants.length);
  r.roles.composer.variants[0].sourceId = "s-missing";
  assert.throws(() => verify(d), /Source value|Dangling/);
  const badSources = structuredClone(sources),
    used = dataset.records[0].roles.composer.variants[0].sourceId;
  badSources.find((s) => s.id === used).readStatus = "SOURCE_UNREADABLE";
  assert.throws(
    () => verifyResearch(dataset, badSources, facts, baseline, creators),
    /altered|Unread/,
  );
});
test("arranger game reuse is forbidden, release arrangements remain review-only and missing credits are not no-lyrics", () => {
  for (const r of dataset.records)
    for (const v of r.roles.arranger.variants)
      if (v.applicability === "applicable") {
        assert.equal(v.sourceScope, "record");
        assert.equal(v.sourceGame, r.game);
      }
  const release = dataset.records.find(
    (r) => r.game === "ournotes" && r.recordId === 50,
  );
  assert.equal(release.roles.arranger.evidenceStatus, "NEEDS_REVIEW");
  assert.equal(release.roles.arranger.raw, "堀江晶太");
  const d = structuredClone(dataset),
    r = d.records.find((r) =>
      r.roles.arranger.variants.some((v) => v.applicability === "applicable"),
    );
  r.roles.arranger.variants[0].sourceGame = "ournotes";
  assert.throws(() => verify(d), /arranger/);
  assert.ok(
    dataset.records.every(
      (r) => r.roles.lyricist.evidenceStatus !== "NO_LYRICS",
    ),
  );
});
test("primary conflicting duplicate composer blocks are retained and never selected or auto-fixed", () => {
  const r = dataset.records.find(
    (r) => r.game === "garupa" && r.recordId === 176,
  );
  assert.equal(r.roles.composer.evidenceStatus, "CONFLICT");
  assert.equal(r.roles.composer.raw, null);
  assert.equal(r.roles.composer.rawValues.length, 2);
  assert.equal(r.composerAudit, "MATCH_UNCERTAIN");
  assert.equal(r.currentComposerRaw, "末益涼太（Elements Garden）");
});
test("Creator exact annotation is whole-raw only; splitting and near matches remain candidates", () => {
  const a = candidateForRaw("上松範康（Elements Garden）", creators);
  assert.equal(a.existingCreatorCandidateId, "cr-0001");
  const b = candidateForRaw("上松範康 / 竹田祐介", creators);
  assert.equal(b.status, "UNRESOLVED");
  assert.equal(b.tokenizationStatus, "REVIEW_RECOMMENDED");
  assert.equal(b.existingCreatorCandidateId, undefined);
  const c = candidateForRaw("上松 範康", creators);
  assert.equal(c.status, "REVIEW_RECOMMENDED");
  assert.equal(c.existingCreatorCandidateId, undefined);
  assert.equal(
    compareComposer(
      "B",
      {
        evidenceStatus: "CONFIRMED",
        variants: [{ raw: "A", applicability: "applicable" }],
      },
      creators,
    ),
    "OFFICIAL_DIFFERS",
  );
});
test("offline generation is repeat-safe and never changes user source files", () => {
  const a = generate(),
    bytes = Object.fromEntries(
      Object.keys(a.outputs).map((f) => [
        f,
        fs.readFileSync(`${DIRECTORY}/${f}`, "utf8"),
      ]),
    );
  generate();
  for (const [file, content] of Object.entries(bytes))
    assert.equal(
      fs.readFileSync(`${DIRECTORY}/${file}`, "utf8"),
      content,
      file,
    );
  assertProtected(baseline);
});
