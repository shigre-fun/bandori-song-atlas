import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { loadGameCatalog } from "../catalog.mjs";
import { GAMES } from "../../src/js/site-config.js";
import { review } from "../research/original-work.mjs";

const directory = process.argv[2] || "dist";
const base = process.argv[3] || "/";
const normalize = (s) => String(s).replace(/\s+/g, " ").trim();
const decode = (s) =>
  s
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
const result = review();
let count = 0;
for (const game of Object.values(GAMES)) {
  const songs = loadGameCatalog(game);
  const generated = JSON.parse(
    fs.readFileSync(path.join(directory, game.catalog), "utf8"),
  );
  assert.deepEqual(generated.songs, JSON.parse(JSON.stringify(songs)), game.id);
  for (const song of songs) {
    const reference = `${game.id}:${song.id}`;
    const html = fs.readFileSync(
      path.join(directory, game.id, "songs", String(song.id), "index.html"),
      "utf8",
    );
    const matches = [
      ...html.matchAll(
        /<dt>原曲の使用作品・タイアップ<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g,
      ),
    ];
    assert.equal(matches.length, 1, reference);
    assert.equal(
      normalize(decode(matches[0][1])),
      normalize(song.work || "未登録"),
      reference,
    );
    assert.ok(html.includes(`${base}${game.id}/songs/`), reference);
    if (song.type === "normal") {
      assert.doesNotMatch(html, /<dt>原曲アーティスト<\/dt>/, reference);
      assert.ok(
        html.includes(game.id === "garupa" ? "3Dライブ" : "MV"),
        reference,
      );
    } else assert.match(html, /<dt>原曲アーティスト<\/dt>/, reference);
    count++;
  }
}
assert.equal(count, 890);
for (const file of ["creators.json", "works.json"])
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(directory, file), "utf8")),
    JSON.parse(fs.readFileSync(path.join("data", file), "utf8")),
    file,
  );
const admin = fs.readFileSync(path.join(directory, "admin/index.html"), "utf8");
assert.equal((admin.match(/name="originalWork"/g) || []).length, 1);
assert.doesNotMatch(
  admin.match(/id="cover-fields"[\s\S]*?<\/div>/)[0],
  /name="originalWork"/,
);
assert.ok(admin.includes("原曲の使用作品・タイアップ"));
console.log(
  JSON.stringify(
    {
      status: "PASS",
      directory,
      base,
      details: count,
      counts: result.counts,
      nonWorkFieldsPreserved: true,
      creatorsAndWorksPreserved: true,
      sharedAdminField: true,
    },
    null,
    2,
  ),
);
