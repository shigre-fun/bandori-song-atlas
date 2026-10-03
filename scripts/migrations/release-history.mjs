import fs from "node:fs";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { hash, DIRECTORY } from "./apply-credits-phase-b2.mjs";
const baseline = JSON.parse(
  fs.readFileSync(DIRECTORY + "/release-baseline.json", "utf8"),
);
const buffer = fs.readFileSync(baseline.historicalFixture.path);
assert.equal(hash(buffer), baseline.historicalFixture.sha256);
const fixture = JSON.parse(gunzipSync(buffer));
export function releaseHistoryBuffer(file) {
  const entry = fixture.files[file];
  assert.ok(entry, "Missing pre-release fixture: " + file);
  const bytes = Buffer.from(entry.base64, "base64");
  assert.equal(hash(bytes), baseline.historicalFixture.files[file]);
  assert.equal(hash(bytes), entry.sha256);
  return bytes;
}
export const releaseHistoryJSON = (file) =>
  JSON.parse(releaseHistoryBuffer(file).toString("utf8"));
export const releaseHistoryFiles = Object.keys(fixture.files);
