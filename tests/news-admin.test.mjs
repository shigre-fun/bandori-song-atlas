import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { GitHubNewsStore, NEWS_PATH } from "../src/js/github-news-store.js";
import { prepareNews } from "../src/js/news-data.js";
import { siteSettings } from "../src/js/site-config.js";

const first = JSON.parse(fs.readFileSync(NEWS_PATH, "utf8"));
const entry = (date, title, category = "site") => ({
  date,
  category,
  title,
  description: `${title}の本文`,
});

function remote({ rejectPatch = false, loseResponse = false } = {}) {
  let head = "1".repeat(40);
  let fileSha = "a".repeat(40);
  let news = structuredClone(first);
  let proposed;
  let writes = 0;
  const calls = [];
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status });
  const fetcher = async (url, options) => {
    assert.ok(
      url.startsWith("https://api.github.com/repos/test-owner/song-atlas"),
    );
    assert.equal(options.headers.Authorization, "Bearer test-token");
    const route = url.replace(
      "https://api.github.com/repos/test-owner/song-atlas",
      "",
    );
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ route, method: options.method, body });
    if (options.method === "GET") {
      if (route === "") return json({ permissions: { push: true } });
      if (route.startsWith("/git/ref/")) return json({ object: { sha: head } });
      if (route.startsWith("/git/commits/"))
        return json({ tree: { sha: "t".repeat(40) } });
      if (route.startsWith("/git/trees/"))
        return json({
          truncated: false,
          tree: [
            { path: "scripts/build.mjs", type: "blob", sha: "b".repeat(40) },
            {
              path: "data/garupa/songs.json",
              type: "blob",
              sha: "c".repeat(40),
            },
            {
              path: "data/garupa/admin-state.json",
              type: "blob",
              sha: "d".repeat(40),
            },
            { path: NEWS_PATH, type: "blob", sha: fileSha },
          ],
        });
      if (route === `/git/blobs/${fileSha}`) {
        const bytes = Buffer.from(JSON.stringify(news));
        return json({
          encoding: "base64",
          size: bytes.length,
          content: bytes.toString("base64"),
        });
      }
    }
    if (route === "/git/trees" && options.method === "POST") {
      proposed = body;
      return json({ sha: "2".repeat(40) });
    }
    if (route === "/git/commits" && options.method === "POST") {
      assert.deepEqual(body.parents, [head]);
      return json({ sha: "3".repeat(40) });
    }
    if (route.startsWith("/git/refs/") && options.method === "PATCH") {
      assert.equal(body.force, false);
      if (rejectPatch) return json({}, 422);
      news = JSON.parse(proposed.tree[0].content);
      fileSha = String(writes + 4).repeat(40);
      head = body.sha;
      writes++;
      if (loseResponse) {
        loseResponse = false;
        throw new Error("Response lost after save");
      }
      return json({ object: { sha: head } });
    }
    throw new Error(`Unexpected mock request: ${options.method} ${route}`);
  };
  return {
    fetcher,
    calls,
    get news() {
      return news;
    },
    get writes() {
      return writes;
    },
    changeNews(value) {
      news = value;
      fileSha = "f".repeat(40);
      head = "e".repeat(40);
    },
  };
}

const client = (server) =>
  new GitHubNewsStore(
    { owner: "test-owner", repo: "song-atlas", branch: "main" },
    "test-token",
    server.fetcher,
  );

test("news manager connects, lists, adds and edits the existing JSON only", async () => {
  const server = remote();
  const store = client(server);
  await store.connect();
  const initial = await store.loadNews();
  assert.deepEqual(initial.entries, prepareNews(first));
  const added = await store.saveNews({
    entry: entry("2026-10-01", "新規", "feature"),
    expectedSha: initial.sha,
  });
  assert.equal(server.writes, 1);
  assert.deepEqual(
    added.entries.map((item) => item.title),
    ["新規", first[0].title],
  );
  assert.deepEqual(server.news, added.entries);
  assert.deepEqual(
    server.calls
      .find((call) => call.route === "/git/trees")
      .body.tree.map((item) => item.path),
    [NEWS_PATH],
  );
  const loaded = await store.loadNews();
  const edited = await store.saveNews({
    entry: entry("2026-10-02", "修正済み", "data"),
    index: 0,
    expectedSha: loaded.sha,
  });
  assert.equal(server.writes, 2);
  assert.equal(edited.entries[0].title, "修正済み");
  assert.equal(server.news[1].title, first[0].title);
  assert.ok(!JSON.stringify(server.news).includes("test-token"));
  assert.ok(!JSON.stringify(server.calls).includes("test-token"));
});

test("news manager rejects invalid input and stale file versions before writing", async () => {
  const server = remote();
  const store = client(server);
  const loaded = await store.loadNews();
  const callCount = server.calls.length;
  await assert.rejects(
    store.saveNews({
      entry: entry("2026-02-30", "無効"),
      expectedSha: loaded.sha,
    }),
    /日付/,
  );
  await assert.rejects(
    store.saveNews({
      entry: entry("2026-10-01", "無効", "unknown"),
      expectedSha: loaded.sha,
    }),
    /カテゴリ/,
  );
  assert.equal(server.calls.length, callCount);
  server.changeNews([entry("2026-10-03", "別端末の更新")]);
  await assert.rejects(
    store.saveNews({
      entry: entry("2026-10-04", "競合"),
      expectedSha: loaded.sha,
    }),
    /最新データを読み直してください/,
  );
  assert.equal(server.writes, 0);
  assert.equal(server.news[0].title, "別端末の更新");
});

test("news manager does not force a rejected ref update or retry an uncertain save", async () => {
  const rejected = remote({ rejectPatch: true });
  const rejectedStore = client(rejected);
  const loaded = await rejectedStore.loadNews();
  await assert.rejects(
    rejectedStore.saveNews({
      entry: entry("2026-10-01", "拒否"),
      expectedSha: loaded.sha,
    }),
    /最新データを読み直してください/,
  );
  assert.equal(rejected.writes, 0);

  const uncertain = remote({ loseResponse: true });
  const uncertainStore = client(uncertain);
  const before = await uncertainStore.loadNews();
  await assert.rejects(
    uncertainStore.saveNews({
      entry: entry("2026-10-01", "通信切断"),
      expectedSha: before.sha,
    }),
    /通信/,
  );
  assert.equal(uncertain.writes, 1);
  const after = await uncertainStore.loadNews();
  assert.equal(
    after.entries.filter((item) => item.title === "通信切断").length,
    1,
  );
});

test("the separate admin page is private, versioned and leaves song admin intact", () => {
  const base = siteSettings(process.env).basePath;
  const admin = fs.readFileSync("dist/admin/index.html", "utf8");
  const newsAdmin = fs.readFileSync("dist/admin/news/index.html", "utf8");
  const script = fs.readFileSync("dist/admin-news.js", "utf8");
  const version = admin.match(/admin\.js\?v=([a-f0-9]{12})/)?.[1];
  assert.ok(version);
  assert.ok(admin.includes(`href="${base}admin/news/"`));
  assert.ok(newsAdmin.includes(`href="${base}admin/?game=ournotes"`));
  assert.ok(newsAdmin.includes(`admin-news.js?v=${version}`));
  assert.ok(newsAdmin.includes(`admin.css?v=${version}`));
  assert.match(newsAdmin, /name="robots" content="noindex,nofollow"/);
  for (const field of ["date", "category", "title", "description"])
    assert.ok(newsAdmin.includes(`name="${field}"`));
  assert.ok(script.includes(`./github-news-store.js?v=${version}`));
  assert.ok(script.includes(`./news-data.js?v=${version}`));
  assert.ok(!/localStorage|sessionStorage|document\.cookie/.test(script));
  assert.deepEqual(
    JSON.parse(fs.readFileSync("dist/news.json", "utf8")),
    prepareNews(first),
  );
  assert.match(admin, /楽曲を追加・修正/);
});
