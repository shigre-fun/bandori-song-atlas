import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { spawn } from "node:child_process";

// These assertions describe the completed migration, including exact non-credit
// values at release time. Later administrator edits belong to the live tests.
const bytes = fs.readFileSync(
  "tests/fixtures/creator-release-2026-10-03.json.gz",
);
const hash = (value) => createHash("sha256").update(value).digest("hex");
assert.equal(
  hash(bytes),
  "126c2cd7239123eb2ed352dfde2a73a9328ca91091cfbb90262caddcb225ad27",
);
const fixture = JSON.parse(gunzipSync(bytes));
assert.equal(fixture.commit, "769bbed983c7ec828c16cd57dadcef0725048443");
const root = ".cache/creator-release-regression";
fs.mkdirSync(root, { recursive: true });
for (const directory of [
  "src",
  "scripts",
  "tests",
  "docs",
  "data",
  "templates",
  "functions",
  "assets",
])
  fs.cpSync(directory, path.join(root, directory), {
    recursive: true,
    force: true,
  });
fs.copyFileSync("package.json", path.join(root, "package.json"));
for (const [file, entry] of Object.entries(fixture.files)) {
  const data = Buffer.from(entry.base64, "base64");
  assert.equal(hash(data), entry.sha256, file);
  assert.ok(file.startsWith("data/") && !file.includes(".."));
  fs.writeFileSync(path.join(root, file), data);
}
if (!fs.existsSync(path.join(root, "node_modules")))
  fs.symlinkSync(
    path.resolve("node_modules"),
    path.resolve(root, "node_modules"),
    "junction",
  );
await new Promise((resolve, reject) => {
  const child = spawn(
    process.execPath,
    ["--test", "tests/creator-credits-release.test.mjs"],
    { cwd: root, stdio: "inherit" },
  );
  child.on("error", reject);
  child.on("exit", (code) =>
    code === 0
      ? resolve()
      : reject(new Error("Creator release regression exited " + code)),
  );
});
