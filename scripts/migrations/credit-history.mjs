import fs from "node:fs";
import zlib from "node:zlib";
import crypto from "node:crypto";
import assert from "node:assert/strict";
const dir = "docs/migrations/credits-phase-b2-2026-10-03";
let snapshot;
// Immutable phase inputs for historical migrations and tests; never a live restore/write source.
export function historicalText(file) {
  if (!snapshot) {
    const baseline = JSON.parse(
      fs.readFileSync(dir + "/baseline.json", "utf8"),
    );
    const compressed = fs.readFileSync(dir + "/pre-apply-sources.json.gz");
    assert.equal(
      crypto.createHash("sha256").update(compressed).digest("hex"),
      baseline.historicalSourceFixture.sha256,
    );
    snapshot = JSON.parse(zlib.gunzipSync(compressed).toString("utf8"));
    for (const [p, t] of Object.entries(snapshot))
      assert.equal(
        crypto.createHash("sha256").update(t).digest("hex"),
        baseline.sourceHashes[p],
        p,
      );
  }
  assert.ok(
    Object.hasOwn(snapshot, file),
    "Unsupported historical input " + file,
  );
  return snapshot[file];
}
export const historicalJSON = (file) => JSON.parse(historicalText(file));
