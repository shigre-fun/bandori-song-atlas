import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { GAMES } from "../../src/js/site-config.js";
import { listGarupaSongs } from "../../src/js/garupa-data.js";
import { selectedCreditData } from "../../src/js/creators-data.js";
const sha = (value) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function creatorRepository({
  creatorCount = 2,
  creatorData = null,
} = {}) {
  const creators = creatorData
    ? structuredClone(creatorData)
    : {
        version: 1,
        nextId: 3,
        creators: [
          {
            id: "cr-0001",
            slug: "author-a",
            name: "制作名A",
            sortKey: "a",
            type: "person",
            aliases: ["旧名A"],
          },
          {
            id: "cr-0002",
            slug: "unit-b",
            name: "共同制作B",
            sortKey: "b",
            type: "unit",
            aliases: [],
          },
        ],
      };
  for (let index = 3; index <= creatorCount; index++)
    creators.creators.push({
      id: `cr-${String(index).padStart(4, "0")}`,
      slug: `fixture-creator-${index}`,
      name: `検証Creator${index}`,
      sortKey: `fixture${String(index).padStart(4, "0")}`,
      type: "person",
      aliases: [`検証別名${index}`],
    });
  creators.nextId = Math.max(creators.nextId, creatorCount + 1);
  const base = listGarupaSongs(
    JSON.parse(fs.readFileSync(GAMES.garupa.dataFile, "utf8")),
  )[0];
  const source = {
    ...base,
    id: 1,
    relatedSongIds: [],
    workId: "wk-0001",
    ...selectedCreditData(
      [{ role: "composer", creatorId: "cr-0001", displayOverride: "" }],
      creators.creators,
    ),
  };
  const { band, category, ...song } = source;
  const files = {
    "data/creators.json": creators,
    "data/works.json": {
      version: 1,
      nextId: 2,
      works: [{ id: "wk-0001", title: source.title }],
    },
    [GAMES.garupa.dataFile]: { groups: [{ band, category, songs: [song] }] },
    [GAMES.ournotes.dataFile]: { groups: [] },
    [GAMES.garupa.stateFile]: { nextId: 2 },
    [GAMES.ournotes.stateFile]: { nextId: 1 },
  };
  const calls = [],
    blobs = new Map();
  let head = "initial",
    proposed = null,
    commitParent = null,
    revision = 0,
    failAfterPatch = false,
    concurrent = false;
  const json = (v) => new Response(JSON.stringify(v));
  const fetcher = async (url, options) => {
    const route = url.replace(
      "https://api.github.com/repos/test-owner/song-atlas",
      "",
    );
    calls.push({
      route,
      method: options.method,
      body: options.body ? JSON.parse(options.body) : null,
    });
    if (route === "") return json({ permissions: { push: true } });
    if (route.startsWith("/git/ref/")) return json({ object: { sha: head } });
    if (route.startsWith("/git/commits/") && options.method === "GET")
      return json({ tree: { sha: "tree" } });
    if (route.startsWith("/git/trees/") && options.method === "GET") {
      const entries = Object.entries(files).map(([path, value]) => {
        const id = sha(value);
        blobs.set(id, structuredClone(value));
        return { path, type: "blob", sha: id };
      });
      return json({
        truncated: false,
        tree: [
          { path: "scripts/build.mjs", type: "blob", sha: "build" },
          ...entries,
        ],
      });
    }
    if (route.startsWith("/git/blobs/")) {
      const content = Buffer.from(JSON.stringify(blobs.get(route.slice(11))));
      return json({
        encoding: "base64",
        size: content.length,
        content: content.toString("base64"),
      });
    }
    if (route === "/git/trees" && options.method === "POST") {
      proposed = JSON.parse(options.body);
      return json({ sha: "proposed-tree" });
    }
    if (route === "/git/commits" && options.method === "POST") {
      commitParent = JSON.parse(options.body).parents[0];
      if (concurrent) head = "concurrent-update";
      return json({ sha: `saved-${++revision}` });
    }
    if (route.startsWith("/git/refs/")) {
      const body = JSON.parse(options.body);
      assert.equal(body.force, false);
      if (head !== commitParent) return new Response("{}", { status: 409 });
      for (const item of proposed.tree)
        files[item.path] = JSON.parse(item.content);
      head = body.sha;
      if (failAfterPatch) {
        failAfterPatch = false;
        throw new Error("lost response");
      }
      return json({ object: { sha: head } });
    }
    throw new Error(`Unexpected route ${route}`);
  };
  return {
    files,
    calls,
    fetcher,
    song: source,
    loseResponse() {
      failAfterPatch = true;
    },
    conflict() {
      concurrent = true;
    },
    masterSha() {
      return sha(files["data/creators.json"]);
    },
  };
}
