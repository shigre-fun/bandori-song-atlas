import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  finalSlugPlan,
  directory,
} from "../scripts/migrations/finalize-creator-slugs.mjs";
import { validateCreators, creatorRedirects } from "../src/js/creators-data.js";
import { siteSettings } from "../src/js/site-config.js";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const expected = [
  ["cr-0048", "片倉三起也", "creator-0048", "mikiya-katakura"],
  ["cr-0081", "前澤寛之", "creator-0081", "hiroyuki-maezawa"],
  ["cr-0082", "志倉千代丸", "creator-0082", "chiyomaru-shikura"],
  ["cr-0089", "庄司夏葵", "creator-0089", "natsuki-shoji"],
  ["cr-0090", "瀬名水紀", "creator-0090", "mizuki-sena"],
];
test("five user-selected current slugs preserve all fixed identities, metadata, readings and previous history", () => {
  const p = finalSlugPlan(),
    baseline = read(`${directory}/before-master.json`),
    after = p.proposed.master;
  const exact = structuredClone(baseline);
  for (const [id, name, old, slug] of expected) {
    const c = exact.creators.find((c) => c.id === id);
    assert.equal(c.name, name);
    c.slug = slug;
    c.previousSlugs = [...(c.previousSlugs ?? []), old];
    const actual = after.creators.find((c) => c.id === id);
    assert.equal(actual.slug, slug);
    assert.ok(actual.previousSlugs.includes(old));
  }
  assert.deepEqual(after, exact);
  validateCreators(after);
  assert.equal(after.creators.length, 91);
  assert.equal(after.nextId, 92);
  assert.equal(
    after.creators.filter((c) => /^creator-\d+$/.test(c.slug)).length,
    0,
  );
  assert.equal(
    after.creators.filter((c) => c.sortKeyStatus === "provisional-original")
      .length,
    47,
  );
  assert.equal(creatorRedirects(after).length, 18);
});
test("final slugs add exactly five map histories; short-name identities and every other mapping remain unchanged", () => {
  const p = finalSlugPlan(),
    baseline = read(`${directory}/before-map.json`),
    exact = structuredClone(baseline);
  for (const [id, , old, slug] of expected) {
    const c = exact.creators.find((c) => c.id === id);
    c.slug = slug;
    c.previousSlugs = [...(c.previousSlugs ?? []), old];
  }
  assert.deepEqual(p.proposed.map, exact);
  for (const [id, name, , slug] of expected) {
    const e = p.proposed.research.entries.find((e) => e.name === name);
    const s = e.slugEvidence.at(-1);
    assert.equal(s.sourceType, "human-review");
    assert.equal(s.access, "user-confirmed");
    assert.equal(s.url, undefined);
    assert.equal(s.checkedAt, "2026-10-03");
    assert.ok(s.supports.includes(id) && s.supports.includes(slug));
  }
  assert.ok(
    !p.proposed.master.creators.some((c) => /^(JACK|Louis)$/.test(c.name)),
  );
  for (const raw of ["JACK", "Louis"])
    assert.ok(
      p.songs.some((s) =>
        s.creditDisplay.composer.some(
          (p) => p.unresolved && p.text.trim() === raw,
        ),
      ),
    );
});
test("coverage, 2652 legacy displays and all Work/record counts stay unchanged after URL-only migration", () => {
  const { summary: s } = finalSlugPlan();
  assert.equal(s.displayComparisons, 2652);
  assert.deepEqual(s.workWarnings, []);
  assert.equal(s.resolvedRaw, 127);
  assert.equal(s.remainingRaw, 215);
  assert.deepEqual(s.coverage, {
    recordings: 635,
    totalRecordings: 884,
    recordingPercent: 71.83,
    works: 582,
    totalWorks: 823,
    workPercent: 70.72,
  });
});
test("repeated final slug apply is byte-preserving for metadata, songs, Work, short-name documents and original evidence", () => {
  assert.ok(
    read("data/creators.json").creators.find((c) => c.id === "cr-0090").slug ===
      "mizuki-sena",
  );
  const paths = [
    "data/creators.json",
    "data/works.json",
    "data/garupa/songs.json",
    "data/ournotes/songs.json",
    "docs/migrations/creator-map.json",
    "docs/migrations/creators-2026-10-02/creator-research.json",
    "docs/migrations/creators-2026-10-02/human-review-input.json",
    "docs/migrations/creators-2026-10-02/human-review-applied.json",
    "docs/migrations/creators-2026-10-02/short-name-review.md",
    `${directory}/applied.json`,
  ];
  const before = paths.map((p) => fs.readFileSync(p, "utf8"));
  const run = spawnSync(
    process.execPath,
    ["scripts/migrations/finalize-creator-slugs.mjs", "apply"],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(run.stdout).unchanged, true);
  assert.deepEqual(
    paths.map((p) => fs.readFileSync(p, "utf8")),
    before,
  );
});
test("all five generated pages and history redirects use only current canonical and sitemap targets on both bases", () => {
  const settings = siteSettings(process.env);
  fs.mkdirSync(".cache", { recursive: true });
  const subpathRoot = fs.mkdtempSync(".cache/creator-slug-test-");
  try {
    const built = spawnSync(process.execPath, ["scripts/build.mjs"], {
      encoding: "utf8",
      env: {
        ...process.env,
        BASE_PATH: "/bandori-song-atlas/",
        SITE_BASE_PATH: "/bandori-song-atlas/",
        SITE_OUTPUT_DIR: subpathRoot,
      },
    });
    assert.equal(built.status, 0, built.stderr);
    for (const [root, base] of [
      ["dist", settings.basePath],
      [subpathRoot, "/bandori-song-atlas/"],
    ]) {
      const sitemap = fs.readFileSync(`${root}/sitemap.xml`, "utf8"),
        list = fs.readFileSync(`${root}/creators/index.html`, "utf8"),
        rules = fs.readFileSync(`${root}/_redirects`, "utf8");
      for (const [, name, old, slug] of expected) {
        const current = `${base}creators/${slug}/`,
          retired = `${base}creators/${old}/`,
          html = fs.readFileSync(`${root}/creators/${slug}/index.html`, "utf8"),
          compat = fs.readFileSync(
            `${root}/creators/${old}/index.html`,
            "utf8",
          );
        assert.ok(html.includes(`<h1>${name}</h1>`));
        assert.ok(html.includes(`href="${settings.origin}${current}"`));
        assert.ok(compat.includes(`href="${settings.origin}${current}"`));
        assert.ok(compat.includes(`href="${current}"`));
        assert.ok(sitemap.includes(current));
        assert.ok(!sitemap.includes(retired));
        assert.ok(list.includes(`href="${current}"`));
        assert.ok(!list.includes(`href="${retired}"`));
        assert.ok(rules.includes(`${retired} ${current} 301`));
        assert.ok(rules.includes(`${retired.slice(0, -1)} ${current} 301`));
      }
      assert.equal(rules.trim().split(/\r?\n/).length, 36);
    }
  } finally {
    assert.ok(
      fs
        .realpathSync(subpathRoot)
        .startsWith(fs.realpathSync(".cache") + path.sep),
    );
    fs.rmSync(subpathRoot, { recursive: true });
  }
});
