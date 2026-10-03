import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
test("migration stages are repeat-safe, preserve every unrelated field and restore only unedited data", () => {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "creator-migration-test-"),
  );
  const files = ["data/garupa/songs.json", "data/ournotes/songs.json"],
    before = new Map();
  try {
    for (const file of files) {
      const document = JSON.parse(fs.readFileSync(file, "utf8"));
      for (const group of document.groups)
        for (const song of group.songs) {
          delete song.workId;
          delete song.credits;
          delete song.creditDisplay;
        }
      const content = JSON.stringify(document, null, 2) + "\n";
      before.set(file, content);
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), content);
    }
    fs.mkdirSync(path.join(root, "docs/migrations"), { recursive: true });
    fs.copyFileSync(
      "docs/migrations/creator-map.json",
      path.join(root, "docs/migrations/creator-map.json"),
    );
    const run = (mode) =>
      spawnSync(
        process.execPath,
        [path.resolve("scripts/migrations/creators.mjs"), mode],
        { cwd: root, encoding: "utf8" },
      );
    assert.equal(run("report").status, 0);
    assert.equal(fs.existsSync(path.join(root, "data/creators.json")), false);
    assert.equal(run("apply").status, 0);
    assert.equal(run("verify").status, 0);
    for (const file of files) {
      const original = JSON.parse(before.get(file)),
        after = JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
      for (const group of after.groups)
        for (const song of group.songs) {
          delete song.workId;
          delete song.credits;
          delete song.creditDisplay;
        }
      assert.deepEqual(after, original);
    }
    const actual = fs.readFileSync(path.join(root, files[0]), "utf8");
    assert.equal(run("apply").status, 1);
    assert.equal(fs.readFileSync(path.join(root, files[0]), "utf8"), actual);
    fs.appendFileSync(path.join(root, files[0]), "\n");
    assert.equal(run("restore").status, 1);
    assert.ok(fs.existsSync(path.join(root, "data/creators.json")));
    fs.writeFileSync(path.join(root, files[0]), actual);
    assert.equal(run("restore").status, 0);
    for (const file of files)
      assert.equal(
        fs.readFileSync(path.join(root, file), "utf8"),
        before.get(file),
      );
    assert.equal(fs.existsSync(path.join(root, "data/works.json")), false);
  } finally {
    assert.ok(
      path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep),
    );
    fs.rmSync(root, { recursive: true, force: true });
  }
});
