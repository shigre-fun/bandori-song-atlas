import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(`dist/${file}`, "utf8");

test("public pages and imported modules use the current asset version", () => {
  const pages = [
    "index.html",
    "garupa/songs/index.html",
    "garupa/songs/1/index.html",
    "ournotes/songs/1/index.html",
    "ournotes/songs/48/index.html",
    "ournotes/songs/79/index.html",
    "admin/index.html",
  ];
  const version = read("index.html").match(/style\.css\?v=([a-f0-9]{12})/)?.[1];
  assert.ok(version);
  for (const file of pages) {
    const html = read(file);
    for (const [, asset, actualVersion] of html.matchAll(
      /(?:href|src)="[^"]*?([a-z-]+\.(?:css|js))\?v=([a-f0-9]{12})"/g,
    ))
      assert.equal(actualVersion, version, `${file}: ${asset}`);
    assert.doesNotMatch(
      html,
      /(?:href|src)="[^"]*\/(?:style|mobile|app)\.(?:css|js)"/,
      file,
    );
  }
  for (const file of ["app.js", "views.js", "domain.js", "admin.js"]) {
    const source = read(file);
    for (const [, dependency, actualVersion] of source.matchAll(
      /from "(\.\/[^"?]+\.js)(?:\?v=([a-f0-9]{12}))?"/g,
    ))
      assert.equal(actualVersion, version, `${file}: ${dependency}`);
  }
});

test("generated song pages carry the requested colors and type markers", () => {
  assert.match(read("garupa/songs/1/index.html"), /class="tag normal garupa"/);
  assert.match(read("ournotes/songs/1/index.html"), /--band: #448abd/);
  assert.match(read("ournotes/songs/48/index.html"), /--band: #79859c/);
  assert.match(read("ournotes/songs/79/index.html"), /--band: #79859c/);
  assert.match(read("ournotes/songs/1/index.html"), /song-type song-type-紅赤/);
  const css = read("style.css");
  assert.match(css, /\.tag\.garupa\s*\{/);
  assert.match(css, /\.song-type::before\s*\{/);
});
