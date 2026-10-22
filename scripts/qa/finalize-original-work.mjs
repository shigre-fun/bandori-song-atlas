import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { gzipSync, gunzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import {
  directory,
  review,
  applyReview,
  digest,
} from "../research/original-work.mjs";

assert.equal(process.version, "v22.23.4");
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
assert.equal(git("rev-parse", "--short=7", "HEAD"), "60ebfd6");
assert.equal(git("diff", "--cached", "--name-only"), "");
const allowed = new Set([
  "README.md",
  "WORK_LOG.md",
  "data/garupa/songs.json",
  "data/ournotes/songs.json",
  "src/js/admin.js",
  "src/js/views.js",
  "src/pages/admin.html",
  "templates/README.md",
]);
for (const file of git("diff", "--name-only").split(/\r?\n/).filter(Boolean))
  assert.ok(allowed.has(file), file);
const newFiles = new Set([
  "scripts/research/original-work.mjs",
  "scripts/qa/original-work.mjs",
  "scripts/qa/finalize-original-work.mjs",
  "tests/research/original-work.test.mjs",
  "docs/PHP_SECURITY_REVIEW_2026-10-21.md",
]);
for (const file of git("ls-files", "--others", "--exclude-standard")
  .split(/\r?\n/)
  .filter(Boolean))
  assert.ok(newFiles.has(file) || file.startsWith(directory + "/"), file);
const before = ["garupa", "ournotes"].map((g) =>
  digest(fs.readFileSync(`data/${g}/songs.json`)),
);
applyReview();
assert.deepEqual(
  ["garupa", "ournotes"].map((g) =>
    digest(fs.readFileSync(`data/${g}/songs.json`)),
  ),
  before,
  "再適用で変更",
);
const result = review();
assert.deepEqual(result.counts, {
  existing: 308,
  confirmed: 164,
  none: 2,
  human_review: 416,
});
const validation = directory + "/validation";
const source = path.resolve(validation, "standard-tests.txt");
const archive = path.resolve(validation, "standard-tests-first-failed.txt.gz");
assert.ok(source.startsWith(path.resolve(directory) + path.sep));
assert.ok(archive.startsWith(path.resolve(directory) + path.sep));
const raw = fs.existsSync(source)
  ? fs.readFileSync(source)
  : gunzipSync(fs.readFileSync(archive));
const first = raw.toString("utf8");
const numbers = (text, kind) =>
  [...text.matchAll(new RegExp(`^# ${kind} (\\d+)\\r?$`, "gm"))].map((m) =>
    Number(m[1]),
  );
assert.deepEqual(numbers(first, "tests"), [219, 35, 24, 11]);
assert.deepEqual(numbers(first, "pass"), [219, 35, 24, 10]);
assert.deepEqual(numbers(first, "fail"), [0, 0, 0, 1]);
assert.match(first, /work: null/);
if (fs.existsSync(source)) {
  fs.writeFileSync(archive, gzipSync(raw));
  assert.deepEqual(gunzipSync(fs.readFileSync(archive)), raw);
  fs.unlinkSync(source); // Only this task's verified, losslessly archived failure log.
}
const current = fs.readFileSync(validation + "/current-tests.txt", "utf8");
assert.deepEqual(numbers(current, "tests"), [15]);
assert.deepEqual(numbers(current, "pass"), [15]);
assert.deepEqual(numbers(current, "fail"), [0]);
for (const prefix of ["root", "subpath"]) {
  const pages = JSON.parse(
    fs.readFileSync(`${validation}/${prefix}-pages.json`, "utf8"),
  );
  assert.equal(pages.status, "PASS");
  assert.equal(pages.details, 890);
  const seo = fs.readFileSync(`${validation}/${prefix}-seo.txt`, "utf8");
  assert.match(seo, /pages: 1345/);
  assert.match(seo, /details: 890/);
  const build = fs.readFileSync(`${validation}/${prefix}-build.txt`, "utf8");
  assert.match(build, /ガルパ801曲・アワーノーツ89曲/);
}
assert.match(
  fs.readFileSync(validation + "/format.txt", "utf8"),
  /All matched files use Prettier code style/,
);
git("diff", "--check");
const files = [
  ...new Set([
    ...allowed,
    ...[...newFiles].filter((p) => !p.includes("PHP_SECURITY")),
    ...fs
      .readdirSync(directory)
      .filter((p) => fs.statSync(path.join(directory, p)).isFile())
      .map((p) => directory + "/" + p),
    ...fs.readdirSync(validation).map((p) => validation + "/" + p),
  ]),
].filter((p) => !p.endsWith("verification.json"));
const proof = {
  date: "2026-10-22",
  status: "PASS_LOCAL_IMPLEMENTATION_AND_REVIEW_LIST",
  runtime: process.version,
  head: git("rev-parse", "HEAD"),
  total: 890,
  targets: 582,
  counts: result.counts,
  changedRecordings: 166,
  perGame: Object.fromEntries(
    ["garupa", "ournotes"].map((game) => [
      game,
      Object.fromEntries(
        ["existing", "confirmed", "none", "human_review"].map((status) => [
          status,
          result.rows.filter(
            (s) => s.reference.startsWith(game + ":") && s.status === status,
          ).length,
        ]),
      ),
    ]),
  ),
  tests: {
    historical: 278,
    currentAndNew: 15,
    totalPassing: 293,
    initialStandardFailure:
      "live catalog compared with stale dist before root rebuild; current 11 passed after build",
    initialAdminFixtureFailure:
      "minute-resolution OurNotes date was incorrectly sliced; fixture corrected, all 4 passed",
  },
  pages: { root: 890, subpath: 890, seoPagesPerBuild: 1345 },
  idempotent: true,
  nonWorkFieldsPreserved: true,
  existing308Preserved: true,
  firstFailureLog: {
    uncompressedSHA256: digest(raw),
    gzipSHA256: digest(fs.readFileSync(archive)),
    lossless: true,
  },
  publication: "not requested; no commit, push or deploy",
  limitations: [
    "Official domains returned maintenance HTTP503; search-preserved official pages and independent official publishers were used",
    "416 unresolved entries intentionally remain null/未登録 for human review",
    "Local static output and real form extraction tested; no real GitHub write or production/browser deployment test",
  ],
  files: Object.fromEntries(files.map((p) => [p, digest(fs.readFileSync(p))])),
};
fs.writeFileSync(
  directory + "/verification.json",
  JSON.stringify(proof, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    status: proof.status,
    counts: proof.counts,
    tests: 293,
    pages: 1780,
    idempotent: true,
  }),
);
