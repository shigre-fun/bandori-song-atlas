import { test } from "node:test";
import assert from "node:assert/strict";
import { initContact } from "../src/js/contact.js";

// DOM APIの最小fixture。実ブラウザー確認と併用して送信状態の競合を検証する。
class Control {
  constructor(value = "") {
    this.value = value;
    this.hidden = false;
    this.disabled = false;
    this.handlers = new Map();
    this.attrs = new Map();
    this.classes = new Set();
    this.classList = {
      toggle: (name, add) =>
        add ? this.classes.add(name) : this.classes.delete(name),
      contains: (name) => this.classes.has(name),
    };
  }
  addEventListener(name, callback) {
    this.handlers.set(name, [...(this.handlers.get(name) || []), callback]);
  }
  async emit(name, event = { preventDefault() {} }) {
    await Promise.all((this.handlers.get(name) || []).map((fn) => fn(event)));
  }
  setAttribute(name, value) {
    this.attrs.set(name, value);
  }
  removeAttribute(name) {
    this.attrs.delete(name);
  }
  focus() {
    this.focused = true;
  }
}

function ui(
  fetcher = async () => Response.json({ ok: true }),
  { url = "https://example.test/contact/", values = {} } = {},
) {
  const nodes = new Map();
  for (const id of [
    "form",
    "submit",
    "fields",
    "status",
    "email",
    "email-field",
    "category",
    "pageUrl",
    "message",
    "guard",
    "turnstile",
    "success",
    "success-title",
    "success-reply",
  ])
    nodes.set(`contact-${id}`, new Control());
  for (const id of [
    "category",
    "pageUrl",
    "message",
    "replyRequested",
    "email",
  ])
    nodes.set(`contact-${id}-error`, new Control());
  const radioNo = new Control("no"),
    radioYes = new Control("yes");
  radioNo.checked = true;
  radioYes.checked = false;
  const form = nodes.get("contact-form");
  form.action = "https://example.test/api/contact";
  form.dataset = { sitekey: "public-key" };
  form.querySelectorAll = () => [radioNo, radioYes];
  form.reset = () => {
    for (const id of ["category", "message", "pageUrl", "email"])
      nodes.get(`contact-${id}`).value = "";
    radioNo.checked = true;
    radioYes.checked = false;
  };
  nodes.get("contact-success").hidden = true;
  let script, config;
  let resets = 0,
    renders = 0,
    removed = 0;
  const container = nodes.get("contact-turnstile");
  container.clientWidth = 400;
  const windowEvents = new Control();
  for (const [id, value] of Object.entries(values))
    nodes.get(`contact-${id}`).value = value;
  const doc = {
    getElementById: (id) => nodes.get(id),
    createElement: () => new Control(),
    head: {
      append: (element) => {
        script = element;
      },
    },
    defaultView: {
      location: new URL(url),
      addEventListener: (...args) => windowEvents.addEventListener(...args),
      turnstile: {
        render: (element, options) => {
          assert.equal(element, container);
          config = options;
          renders++;
          return "widget";
        },
        reset: () => {
          resets++;
        },
        remove: () => {
          removed++;
        },
      },
    },
  };
  initContact(doc, fetcher);
  const node = (id) => nodes.get(`contact-${id}`);
  return {
    node,
    form,
    load: () => script.emit("load"),
    scriptError: () => script.emit("error"),
    token: () => config.callback("verified-token"),
    expire: () => config["expired-callback"](),
    widgetError: () => config["error-callback"](),
    submit: () => form.emit("submit"),
    reply: async (wanted) => {
      radioYes.checked = wanted;
      radioNo.checked = !wanted;
      await radioYes.emit("change");
    },
    resize: async (width) => {
      container.clientWidth = width;
      await windowEvents.emit("resize");
    },
    get config() {
      return config;
    },
    get resets() {
      return resets;
    },
    get renders() {
      return renders;
    },
    get removed() {
      return removed;
    },
  };
}
const valid = (view) => {
  view.node("category").value = "other";
  view.node("message").value = "画面からのテスト問い合わせです。";
};

test("song reports prefill either game URL and data category, ready for message-only input", async () => {
  for (const path of ["/garupa/songs/24/", "/atlas/ournotes/songs/song-1/"]) {
    let payload;
    const base = path.startsWith("/atlas/") ? "/atlas/" : "/";
    const view = ui(
      async (_url, options) => {
        payload = JSON.parse(options.body);
        return Response.json({ ok: true });
      },
      {
        url: `https://example.test${base}contact/?${new URLSearchParams({ pageUrl: path })}`,
      },
    );
    assert.equal(view.node("pageUrl").value, `https://example.test${path}`);
    assert.equal(view.node("category").value, "data");
    assert.equal(view.node("message").value, "");
    assert.equal(view.node("email").disabled, true);
    view.node("message").value = "この楽曲の基本BPMが異なっています。";
    await view.load();
    view.token();
    await view.submit();
    assert.equal(payload.category, "data");
    assert.equal(payload.pageUrl, `https://example.test${path}`);
    assert.equal(payload.replyRequested, false);
    assert.equal(view.form.hidden, true);
  }
});

test("report prefill ignores unsafe or non-song URLs and leaves normal contact empty", () => {
  for (const pageUrl of [
    "",
    "https://other.test/garupa/songs/24/",
    "//other.test/garupa/songs/24/",
    "https://user:password@example.test/garupa/songs/24/",
    "javascript:alert(1)",
    "https://[invalid",
    "/about/",
    "/garupa/songs/",
    "x".repeat(501),
  ]) {
    const view = ui(undefined, {
      url: `https://example.test/contact/?${new URLSearchParams({ pageUrl })}`,
    });
    assert.equal(view.node("pageUrl").value, "", pageUrl);
    assert.equal(view.node("category").value, "", pageUrl);
  }
  const normal = ui();
  assert.equal(normal.node("pageUrl").value, "");
  assert.equal(normal.node("category").value, "");
});

test("report prefill removes search/hash and keeps existing user input editable", () => {
  const url = `https://example.test/contact/?${new URLSearchParams({ pageUrl: "/garupa/songs/24/?q=test#notes" })}`;
  const clean = ui(undefined, { url });
  assert.equal(
    clean.node("pageUrl").value,
    "https://example.test/garupa/songs/24/",
  );
  clean.node("pageUrl").value = "基本BPM欄について";
  clean.node("category").value = "other";
  assert.equal(clean.node("pageUrl").value, "基本BPM欄について");
  assert.equal(clean.node("category").value, "other");
  const restored = ui(undefined, {
    url,
    values: { pageUrl: "利用者の対象ページ説明", category: "bug" },
  });
  assert.equal(restored.node("pageUrl").value, "利用者の対象ページ説明");
  assert.equal(restored.node("category").value, "bug");
});

test("client focuses invalid inputs and conditionally enables reply email", async () => {
  let calls = 0;
  const view = ui(async () => {
    calls++;
    return Response.json({ ok: true });
  });
  await view.load();
  view.token();
  assert.equal(view.node("email-field").hidden, true);
  await view.submit();
  assert.equal(calls, 0);
  assert.equal(view.node("category").focused, true);
  assert.equal(view.node("message-error").hidden, false);
  valid(view);
  await view.reply(true);
  assert.equal(view.node("email").required, true);
  await view.submit();
  assert.equal(calls, 0);
  assert.equal(view.node("email-error").hidden, false);
  view.node("email").value = "invalid";
  await view.submit();
  assert.equal(calls, 0);
  await view.reply(false);
  assert.equal(view.node("email").disabled, true);
  assert.equal(view.node("email").value, "");
});

test("client blocks a second submission while pending and announces success", async () => {
  let resolve,
    calls = 0,
    submitted;
  const pending = new Promise((finish) => {
    resolve = finish;
  });
  const view = ui(async (url, options) => {
    calls++;
    submitted = JSON.parse(options.body);
    return pending;
  });
  await view.load();
  view.token();
  valid(view);
  const first = view.submit();
  assert.equal(view.node("submit").disabled, true);
  assert.equal(view.node("submit").textContent, "送信しています…");
  assert.equal(view.node("fields").disabled, true);
  await view.submit();
  assert.equal(calls, 1);
  resolve(Response.json({ ok: true }));
  await first;
  assert.equal(submitted.email, "");
  assert.equal(submitted.replyRequested, false);
  assert.equal(view.form.hidden, true);
  assert.equal(view.node("success").hidden, false);
  assert.equal(view.node("success-title").focused, true);
  assert.equal(view.node("success-reply").hidden, true);
  assert.equal(view.node("message").value, "");
});

test("client preserves input, resets token and allows retry after API/network failures", async () => {
  for (const scenario of [
    "send_failed",
    "verification",
    "validation",
    "unavailable",
    "network",
    "invalid_json",
  ]) {
    let calls = 0;
    const view = ui(async () => {
      calls++;
      if (calls > 1) return Response.json({ ok: true });
      if (scenario === "network") throw new Error("network");
      if (scenario === "invalid_json") return new Response("bad");
      return Response.json(
        {
          ok: false,
          code: scenario,
          fieldErrors: { message: "内容を確認してください。" },
        },
        { status: 400 },
      );
    });
    await view.load();
    view.token();
    valid(view);
    await view.reply(true);
    view.node("email").value = "user@example.com";
    await view.submit();
    assert.ok(view.node("message").value.length > 10);
    assert.equal(view.node("email").value, "user@example.com");
    assert.equal(view.form.hidden, false);
    assert.equal(view.node("fields").disabled, false);
    assert.equal(view.resets, 1);
    assert.equal(view.node("submit").disabled, true);
    view.token();
    assert.equal(view.node("submit").disabled, false);
    await view.submit();
    assert.equal(view.form.hidden, true);
    assert.equal(view.node("success-reply").hidden, false);
  }
});

test("client handles widget loading failures, expiry, verification errors and narrow widths", async () => {
  const failed = ui();
  await failed.scriptError();
  assert.equal(failed.node("submit").disabled, true);
  assert.ok(failed.node("status").textContent.includes("読み直して"));
  const view = ui();
  await view.load();
  view.token();
  assert.equal(view.config.action, "contact");
  assert.equal(view.config.size, "flexible");
  view.expire();
  assert.equal(view.node("submit").disabled, true);
  view.token();
  assert.equal(view.node("submit").disabled, false);
  assert.equal(view.node("status").textContent, "送信できます。");
  view.widgetError();
  assert.equal(view.node("submit").disabled, true);
  await view.resize(248);
  assert.equal(view.config.size, "compact");
  assert.equal(view.removed, 1);
  assert.equal(view.renders, 2);
  await view.resize(260);
  assert.equal(view.renders, 2);
  await view.resize(600);
  assert.equal(view.config.size, "flexible");
});
