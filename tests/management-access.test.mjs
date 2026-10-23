import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readManagementBundle } from "../scripts/management-bundle.mjs";
import { siteSettings } from "../src/js/site-config.js";
import { managementHandler } from "../src/server/management-access.js";
import { managementSettings } from "../src/js/management-settings.js";
import { migrateManagementDrafts } from "../src/js/management-client.js";
import { managementTestEnv } from "./helpers/management.mjs";

const env = managementTestEnv;
const config = managementSettings(env);
const pair = await crypto.subtle.generateKey(
  {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  },
  true,
  ["sign", "verify"],
);
const jwk = {
  ...(await crypto.subtle.exportKey("jwk", pair.publicKey)),
  kid: "fixture-key",
  alg: "RS256",
};
const b64 = (v) =>
  Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString(
    "base64url",
  );
const claims = () => ({
  iss: config.domain,
  aud: [config.aud],
  iat: Math.floor(Date.now() / 1000) - 10,
  exp: Math.floor(Date.now() / 1000) + 600,
  email: "editor@example.invalid",
  type: "app",
});
async function token(payload = claims()) {
  const text = b64({ alg: "RS256", kid: jwk.kid }) + "." + b64(payload);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    pair.privateKey,
    new TextEncoder().encode(text),
  );
  return text + "." + Buffer.from(signature).toString("base64url");
}
async function request({
  jwt,
  path = config.root,
  origin = config.origin,
  settings = env,
} = {}) {
  let passed = 0;
  const context = {
    request: new Request(origin + path, {
      headers: jwt ? { "Cf-Access-Jwt-Assertion": jwt } : {},
    }),
    env: settings,
    data: {},
    functionPath: "/",
    waitUntil() {},
    passThroughOnException() {},
    next: async () => {
      passed++;
      return new Response("private fixture", {
        headers: { "Content-Type": "text/html" },
      });
    },
  };
  const files = Object.fromEntries(
    [
      "index.html",
      "news/index.html",
      "creators/index.html",
      "admin.js",
      "config.json",
    ].map((f) => [
      config.root + f,
      { body: "private fixture", type: "text/html" },
    ]),
  );
  const response = await managementHandler(files)(context);
  return { response, passed };
}
async function withKeys(fn) {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(String(url), config.domain + "/cdn-cgi/access/certs");
    return Response.json({ keys: [jwk] });
  };
  try {
    await fn();
  } finally {
    globalThis.fetch = original;
  }
}

test("management output defaults to disabled and rejects incomplete protected settings", () => {
  assert.deepEqual(managementSettings({}), { enabled: false });
  for (const key of [
    "MANAGEMENT_PATH",
    "CF_ACCESS_AUD",
    "CF_ACCESS_TEAM_DOMAIN",
    "MANAGEMENT_ALLOWED_EMAILS",
    "MANAGEMENT_ORIGIN",
  ])
    assert.throws(
      () => managementSettings({ ...env, [key]: "" }),
      undefined,
      key,
    );
  for (const path of ["admin", "../admin", "a".repeat(31), "a".repeat(33)])
    assert.throws(() => managementSettings({ ...env, MANAGEMENT_PATH: path }));
  assert.throws(() =>
    managementSettings({
      ...env,
      CF_ACCESS_TEAM_DOMAIN: "https://attacker.invalid",
    }),
  );
  assert.equal(
    managementSettings({ ...env, BASE_PATH: "/atlas/" }).root,
    "/atlas/" + env.MANAGEMENT_PATH + "/",
  );
});

test("private payloads have no static fallback or public routing manifest disclosure", () => {
  const current = managementSettings(process.env);
  const bundle = readManagementBundle("dist");
  if (!current.enabled) assert.deepEqual(bundle, {});
  else {
    assert.equal(Object.keys(bundle).length, 14);
    const base = siteSettings(process.env).basePath;
    for (const key of Object.keys(bundle)) {
      assert.ok(key.startsWith(current.root));
      assert.ok(!fs.existsSync(path.join("dist", key.slice(base.length))), key);
    }
    for (const file of fs
      .readdirSync("dist")
      .filter((f) => /\.(?:js|css|json|html|txt|xml)$/.test(f))) {
      assert.ok(
        !fs
          .readFileSync(path.join("dist", file), "utf8")
          .includes(current.segment),
        file,
      );
    }
  }
});

test("unauthenticated access, alternate hosts and missing config never reach private files", async () => {
  for (const options of [
    {},
    { origin: "https://fixture.pages.dev" },
    { settings: {} },
    { settings: { ...env, CF_ACCESS_AUD: "" } },
    { settings: { ...env, MANAGEMENT_ORIGIN: "" } },
  ]) {
    const { response, passed } = await request(options);
    assert.equal(passed, 0);
    assert.ok([403, 404, 503].includes(response.status));
    assert.match(response.headers.get("Cache-Control"), /no-store/);
    assert.equal(await response.text(), "");
  }
  const publicPage = await request({
    path: "/garupa/songs/",
    settings: { MANAGEMENT_MODE: "broken" },
  });
  assert.equal(publicPage.passed, 1);
  assert.equal(publicPage.response.status, 200);
});

test("signed authorized requests reach all management pages/assets and are never cached", async () =>
  withKeys(async () => {
    for (const suffix of [
      "",
      "?game=ournotes",
      "news/",
      "creators/",
      "admin.js",
      "config.json",
    ]) {
      const { response, passed } = await request({
        path: config.root + suffix,
        jwt: await token(),
      });
      assert.equal(passed, 0, suffix);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), "private fixture");
      for (const key of [
        "Cache-Control",
        "CDN-Cache-Control",
        "Cloudflare-CDN-Cache-Control",
      ])
        assert.match(response.headers.get(key), /no-store/);
      assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
      assert.match(response.headers.get("X-Robots-Tag"), /noindex/);
    }
    const bare = await request({
      path: config.root.slice(0, -1) + "?game=ournotes",
      jwt: await token(),
    });
    assert.equal(bare.response.status, 308);
    assert.equal(
      bare.response.headers.get("Location"),
      config.origin + config.root + "?game=ournotes",
    );
  }));

test("forged, expired, wrong issuer/audience/email and missing required claims are denied", async () =>
  withKeys(async () => {
    const baseline = claims();
    const bad = [
      { ...baseline, exp: 1 },
      { ...baseline, iss: "https://other.cloudflareaccess.com" },
      { ...baseline, aud: ["b".repeat(64)] },
      { ...baseline, email: "outsider@example.invalid" },
      { ...baseline, type: "service" },
      { ...baseline, nbf: baseline.exp + 500 },
      { ...baseline, iat: baseline.exp + 500 },
    ];
    for (const key of ["iss", "aud", "exp", "iat", "email", "type"]) {
      const p = { ...baseline };
      delete p[key];
      bad.push(p);
    }
    for (const payload of bad) {
      const { response, passed } = await request({ jwt: await token(payload) });
      assert.equal(response.status, 403);
      assert.equal(passed, 0);
    }
    for (const jwt of [
      "broken",
      b64({ alg: "none" }) + "." + b64(baseline) + ".",
      (await token()).slice(0, -8) + "tampered",
    ]) {
      const r = await request({ jwt });
      assert.equal(r.response.status, 403);
      assert.equal(r.passed, 0);
    }
  }));

test("signing-key fetch failure fails closed", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("fixture offline");
  };
  try {
    const r = await request({ jwt: await token() });
    assert.equal(r.response.status, 403);
    assert.equal(r.passed, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("authorized missing private files never fall back to public static storage", async () =>
  withKeys(async () => {
    const { response, passed } = await request({
      path: config.root + "missing.html",
      jwt: await token(),
    });
    assert.equal(response.status, 404);
    assert.equal(passed, 0);
    assert.match(response.headers.get("Cache-Control"), /no-store/);
  }));

test("legacy drafts migrate both games once without replacing new edits or retaining tokens", () => {
  const data = new Map();
  const storage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
  };
  const legacy = "/atlas/admin/",
    root = "/atlas/" + env.MANAGEMENT_PATH + "/";
  for (const [prefix, suffix] of [
    ["garupa-song-draft-v1:", ""],
    ["song-draft-v2:", ":ournotes"],
  ]) {
    const key = prefix + legacy + suffix;
    storage.setItem(
      key,
      JSON.stringify({
        values: { title: "入力中", composer: "A", token: "never-copy" },
        editing: { id: 1 },
        submissionId: "operation",
        token: "never-copy",
      }),
    );
    storage.setItem(
      key + ":repository",
      JSON.stringify({
        owner: "fixture",
        repo: "atlas",
        branch: "main",
        token: "never-copy",
      }),
    );
  }
  const before = new Map(data);
  assert.equal(migrateManagementDrafts(storage, root, legacy), true);
  for (const [key, value] of before)
    assert.equal(storage.getItem(key), value, "keep original backup");
  for (const [key, value] of data)
    if (key.includes(root)) {
      assert.ok(!value.includes("never-copy"));
      assert.ok(!value.includes("token"));
    }
  const current = "garupa-song-draft-v1:" + root;
  storage.setItem(current, '{"values":{"title":"新しい下書き"}}');
  migrateManagementDrafts(storage, root, legacy);
  assert.equal(
    JSON.parse(storage.getItem(current)).values.title,
    "新しい下書き",
  );
  storage.setItem("garupa-song-draft-v1:" + legacy, "broken");
  data.delete(current);
  assert.equal(migrateManagementDrafts(storage, root, legacy), false);
  assert.equal(storage.getItem(current), null);
  assert.equal(
    migrateManagementDrafts(
      {
        getItem() {
          throw Error("denied");
        },
      },
      root,
      legacy,
    ),
    false,
  );
});
