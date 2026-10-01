import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createContactHandler } from "../functions/api/contact.js";
import {
  CONTACT_CATEGORIES,
  validContactEmail,
  validateContact,
} from "../src/js/contact-validation.js";
import { renderContact } from "../scripts/contact.mjs";
import { siteSettings } from "../src/js/site-config.js";

const origin = "https://tanimachi-bdsongs.com";
const env = {
  TURNSTILE_SITE_KEY: "real-site",
  TURNSTILE_SECRET_KEY: "secret-turnstile",
  RESEND_API_KEY: "secret-resend",
  CONTACT_TO_EMAIL: "private@example.com",
  CONTACT_FROM_EMAIL: "バンドリ楽曲録 <contact@example.com>",
};
const payload = (changes = {}) => ({
  category: "data",
  pageUrl: "",
  message: "お問い合わせのテストです。",
  replyRequested: false,
  email: "",
  turnstileToken: "valid-token",
  contact_guard: "",
  ...changes,
});
function request(
  input = payload(),
  { method = "POST", headers = {}, url = `${origin}/api/contact`, raw } = {},
) {
  return new Request(url, {
    method,
    headers: {
      Origin: new URL(url).origin,
      "Content-Type": "application/json",
      ...headers,
    },
    ...(method === "POST" ? { body: raw ?? JSON.stringify(input) } : {}),
  });
}
function setup(options = {}) {
  const calls = [];
  const handler = createContactHandler({
    now: () => new Date("2026-09-30T00:01:02Z"),
    fetcher: async (url, init) => {
      calls.push({ url, init, body: JSON.parse(init.body) });
      assert.ok(init.signal instanceof AbortSignal);
      if (url.includes("siteverify")) {
        if (options.verifyThrow) throw options.verifyThrow;
        return new Response(
          options.verifyRaw ??
            JSON.stringify(
              options.verification ?? {
                success: true,
                hostname: new URL(options.url || origin).hostname,
                action: "contact",
              },
            ),
          { status: options.verifyStatus || 200 },
        );
      }
      assert.equal(url, "https://api.resend.com/emails");
      if (options.sendThrow) throw options.sendThrow;
      return new Response(
        options.sendRaw ??
          JSON.stringify(options.receipt ?? { id: "accepted" }),
        { status: options.sendStatus || 200 },
      );
    },
  });
  return {
    calls,
    handler,
    run: (input = payload(), reqOptions = {}) =>
      handler({
        request: request(input, {
          ...reqOptions,
          url: reqOptions.url || options.url,
        }),
        env: options.env ?? env,
      }),
  };
}

test("contact validation accepts anonymous messages and exact length boundaries", () => {
  for (const category of Object.keys(CONTACT_CATEGORIES))
    assert.ok(validateContact(payload({ category })).value);
  for (const length of [10, 4000])
    assert.ok(
      validateContact(
        payload({ message: "あ".repeat(length), pageUrl: "x".repeat(500) }),
      ).value,
    );
  for (const message of [
    "",
    " ".repeat(15),
    "123456789",
    "あ".repeat(4001),
    null,
    10,
  ])
    assert.ok(validateContact(payload({ message })).fieldErrors.message);
  assert.ok(validateContact(payload({ message: "  1234567890  " })).value);
  assert.ok(
    validateContact(payload({ pageUrl: "x".repeat(501) })).fieldErrors.pageUrl,
  );
  for (const category of ["", "__proto__", "toString", "wrong", 10])
    assert.ok(validateContact(payload({ category })).fieldErrors.category);
  for (const input of [
    null,
    [],
    "x",
    { ...payload(), replyRequested: "yes" },
    { ...payload(), pageUrl: 3 },
    { ...payload(), pageUrl: null },
  ])
    assert.equal(validateContact(input).value, null);
});

test("reply email is conditional; all submitted emails reject injection and invalid types", () => {
  assert.ok(validateContact(payload()).value);
  assert.ok(
    validateContact(payload({ replyRequested: true })).fieldErrors.email,
  );
  assert.ok(
    validateContact(
      payload({ replyRequested: true, email: "user+tag@example.com" }),
    ).value,
  );
  for (const email of [
    "wrong",
    "a@b",
    "a@example.com\r\nBcc:x@example.com",
    "a@example.com\n",
    "a@example.com\u0000",
    "a@example.com,b@example.com",
    "Name <a@example.com>",
    "a@-example.com",
    "a".repeat(255) + "@example.com",
    10,
    [],
    null,
  ]) {
    for (const replyRequested of [true, false])
      assert.ok(
        validateContact(payload({ email, replyRequested })).fieldErrors.email,
      );
    assert.equal(validContactEmail(email), false);
  }
});

test("normal send uses fixed private addresses, plain text, category subject and JST", async () => {
  const { run, calls } = setup();
  const res = await run(
    payload({
      pageUrl: '<script>alert("url")</script>',
      message: '<script>alert("message")</script>',
    }),
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(res.headers.get("Cache-Control"), "no-store");
  assert.equal(res.headers.get("Access-Control-Allow-Origin"), null);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].body, {
    secret: env.TURNSTILE_SECRET_KEY,
    response: "valid-token",
  });
  const mail = calls[1].body;
  assert.equal(mail.from, env.CONTACT_FROM_EMAIL);
  assert.deepEqual(mail.to, [env.CONTACT_TO_EMAIL]);
  assert.equal(mail.subject, "[バンドリ楽曲録][データの訂正] お問い合わせ");
  assert.ok(mail.text.includes('<script>alert("message")</script>'));
  assert.ok(mail.text.includes("2026/09/30 09:01:02"));
  assert.equal(mail.html, undefined);
  assert.equal(mail.reply_to, undefined);
  assert.equal(
    calls[1].init.headers.Authorization,
    `Bearer ${env.RESEND_API_KEY}`,
  );
});

test("Reply-To is included only when requested, never substituted for From", async () => {
  for (const replyRequested of [true, false]) {
    const { run, calls } = setup();
    assert.equal(
      (await run(payload({ replyRequested, email: "user@example.com" })))
        .status,
      200,
    );
    assert.equal(
      calls[1].body.reply_to,
      replyRequested ? "user@example.com" : undefined,
    );
    assert.equal(calls[1].body.from, env.CONTACT_FROM_EMAIL);
  }
});

test("invalid inputs, honeypot, tokens, origins and request formats never reach providers", async () => {
  const cases = [
    [payload({ category: "wrong" }), {}, 400],
    [payload({ message: "short" }), {}, 400],
    [payload({ email: "x\n@example.com" }), {}, 400],
    [payload({ replyRequested: true }), {}, 400],
    [payload({ contact_guard: "bot" }), {}, 403],
    [payload({ contact_guard: false }), {}, 403],
    [payload({ turnstileToken: "" }), {}, 403],
    [payload({ turnstileToken: "x".repeat(2049) }), {}, 403],
    [payload(), { headers: { Origin: "https://other.example" } }, 403],
    [payload(), { headers: { Origin: "null" } }, 403],
    [payload(), { headers: { Origin: "" } }, 403],
    [payload(), { headers: { "Sec-Fetch-Site": "cross-site" } }, 403],
    [payload(), { method: "GET" }, 405],
    [payload(), { method: "OPTIONS" }, 405],
    [payload(), { headers: { "Content-Type": "text/plain" } }, 415],
    [payload(), { raw: "{bad json" }, 400],
    [payload(), { raw: "null" }, 400],
    [payload(), { raw: "[]" }, 400],
    [payload(), { raw: "x".repeat(32769) }, 413],
    [payload(), { headers: { "Content-Length": "32769" } }, 413],
  ];
  for (const [input, options, expected] of cases) {
    const { run, calls } = setup();
    const res = await run(input, options);
    assert.equal(res.status, expected, JSON.stringify(options));
    assert.equal(calls.length, 0);
    assert.equal((await res.json()).ok, false);
  }
});

test("bounded reading rejects streamed oversized bodies without Content-Length", async () => {
  const { handler, calls } = setup();
  const bytes = new TextEncoder().encode("x".repeat(33000));
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.slice(0, 16000));
      controller.enqueue(bytes.slice(16000));
      controller.close();
    },
  });
  const req = new Request(`${origin}/api/contact`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  });
  assert.equal((await handler({ request: req, env })).status, 413);
  assert.equal(calls.length, 0);
});

test("missing configuration and official test keys are refused on public hosts", async () => {
  for (const key of Object.keys(env)) {
    const { run, calls } = setup({ env: { ...env, [key]: "" } });
    assert.equal((await run()).status, 503);
    assert.equal(calls.length, 0);
  }
  for (const changes of [
    { TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA" },
    { TURNSTILE_SECRET_KEY: "2x0000000000000000000000000000000AA" },
    { TURNSTILE_SECRET_KEY: "3x0000000000000000000000000000000AA" },
    { TURNSTILE_SITE_KEY: "1x00000000000000000000AA" },
    { TURNSTILE_SITE_KEY: "2x00000000000000000000AB" },
    { TURNSTILE_SITE_KEY: "1x00000000000000000000BB" },
    { TURNSTILE_SITE_KEY: "2x00000000000000000000BB" },
    { TURNSTILE_SITE_KEY: "3x00000000000000000000FF" },
    { CONTACT_FROM_EMAIL: "user@example.com\r\nBcc:other@example.com" },
    { CONTACT_TO_EMAIL: "wrong" },
  ]) {
    const { run, calls } = setup({ env: { ...env, ...changes } });
    assert.equal((await run()).status, 503);
    assert.equal(calls.length, 0);
  }
});

test("test hostname/action exception works only with official paired keys on loopback", async () => {
  const localEnv = {
    ...env,
    TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  };
  for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
    for (const verification of [
      { success: true, hostname: "localhost", action: "test" },
      { success: true, hostname: "example.com" },
    ]) {
      const { run } = setup({
        url: `http://${host}:8788/api/contact`,
        env: localEnv,
        verification,
      });
      assert.equal((await run()).status, 200);
    }
  }
  for (const verification of [
    { success: true, hostname: "example.com", action: "wrong" },
    { success: true, hostname: "evil.test", action: "test" },
    { success: true, hostname: "localhost", action: "wrong" },
  ]) {
    const { run, calls } = setup({
      url: "http://localhost:8788/api/contact",
      env: localEnv,
      verification,
    });
    assert.equal((await run()).status, 403);
    assert.equal(calls.length, 1);
  }
});

test("failed, expired, reused or mismatched Turnstile verification never sends mail", async () => {
  for (const verification of [
    { success: true, hostname: "example.com" },
    { success: false, "error-codes": ["invalid-input-response"] },
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { success: true, hostname: "other.example", action: "contact" },
    { success: true, hostname: "tanimachi-bdsongs.com", action: "other" },
    { success: "true", hostname: "tanimachi-bdsongs.com", action: "contact" },
    null,
  ]) {
    const { run, calls } = setup({ verifyRaw: JSON.stringify(verification) });
    assert.equal((await run()).status, 403);
    assert.equal(calls.length, 1);
  }
  for (const options of [
    { verifyStatus: 500 },
    { verifyRaw: "bad" },
    { verifyThrow: new DOMException("secret", "TimeoutError") },
    { verifyThrow: new Error("network") },
  ]) {
    const { run, calls } = setup(options);
    const res = await run();
    assert.equal(res.status, 502);
    assert.equal(calls.length, 1);
    assert.ok(!(await res.text()).includes("secret"));
  }
});

test("Resend failures and lost responses give generic errors and are not retried", async () => {
  for (const options of [
    { sendStatus: 429 },
    { sendStatus: 500 },
    { sendRaw: "bad" },
    { receipt: {} },
    { sendThrow: new DOMException("secret-resend", "TimeoutError") },
    { sendThrow: new Error("private@example.com") },
  ]) {
    const { run, calls } = setup(options);
    const res = await run();
    assert.equal(res.status, 502);
    assert.equal(calls.length, 2);
    const body = await res.text();
    assert.ok(!body.includes("secret-resend"));
    assert.ok(!body.includes(env.CONTACT_TO_EMAIL));
    assert.ok(!body.includes(payload().message));
  }
});

test("contact rendering contains accessible fields, no private values and an unconfigured state", () => {
  const local = (path) => `/sub/${path}`;
  const html = renderContact({ siteKey: 'public-key"<script>', local });
  assert.ok(html.includes("public-key&quot;&lt;script&gt;"));
  assert.ok(html.includes('action="/sub/api/contact"'));
  for (const name of ["category", "pageUrl", "message", "email"]) {
    assert.ok(html.includes(`for="contact-${name}"`));
    assert.ok(html.includes(`id="contact-${name}-error"`));
  }
  assert.ok(html.includes('tabindex="-1"'));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes('name="replyRequested" value="no" checked'));
  assert.ok(html.includes('type="email"'));
  assert.ok(!html.includes("secret-turnstile"));
  const missing = renderContact({ local });
  assert.ok(missing.includes("受付準備中"));
  assert.ok(!missing.includes("<form"));
});

test("generated contact page, routing and CSP preserve static pages and GitHub access", () => {
  const html = fs.readFileSync("dist/contact/index.html", "utf8");
  const settings = siteSettings(process.env);
  assert.ok(html.includes("お問い合わせ | バンドリ楽曲録"));
  assert.ok(
    html.includes(`href="${settings.origin}${settings.basePath}contact/"`),
  );
  assert.ok(!html.includes('role="search"'));
  assert.deepEqual(JSON.parse(fs.readFileSync("dist/_routes.json", "utf8")), {
    version: 1,
    include: ["/api/contact", "/api/contact/"],
    exclude: [],
  });
  const headers = fs.readFileSync("dist/_headers", "utf8");
  assert.ok(
    headers.includes("script-src 'self' https://challenges.cloudflare.com"),
  );
  assert.ok(headers.includes("frame-src https://challenges.cloudflare.com"));
  assert.ok(headers.includes("connect-src 'self' https://api.github.com"));
  const privacy = fs.readFileSync("dist/privacy/index.html", "utf8");
  for (const text of [
    "問い合わせ内容の確認",
    "サイト改善",
    "Resend",
    "Cloudflare Turnstile",
    "返信希望者への返信",
  ])
    assert.ok(privacy.includes(text));
  for (const privateValue of Object.values(env).slice(1))
    assert.ok(!html.includes(privateValue));
});
