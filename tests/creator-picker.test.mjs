import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import * as data from "../src/js/creators-data.js";

// Isolated DOM fixture: exercise actual picker event handlers without a GitHub/browser connection.
function harness(previous = null, workCount = 2) {
  class Element {
    constructor(tag = "input") {
      this.tag = tag;
      this.children = [];
      this.attributes = {};
      this._value = "";
      this.textContent = "";
    }
    get value() {
      return this._value;
    }
    set value(v) {
      this._value =
        this.tag === "select" && !this.children.some((c) => c.value === v)
          ? ""
          : v;
    }
    append(...children) {
      this.children.push(...children);
    }
    replaceChildren(...children) {
      this.children = children;
      if (this.tag === "select") this._value = children[0]?.value ?? "";
    }
    setAttribute(k, v) {
      this.attributes[k] = v;
    }
  }
  class Option extends Element {
    constructor(text, value) {
      super("option");
      this.textContent = text;
      this.value = value;
    }
  }
  const selectors = [
    "#credit-status",
    "#selected-creators",
    "#credit-creator",
    "#credit-search",
    "#work-search",
    "#refresh-creator-options",
    "#add-credit",
    "#credit-role",
    "#credit-override",
  ];
  const elements = Object.fromEntries(
    selectors.map((s) => [
      s,
      new Element(s === "#credit-creator" ? "select" : "input"),
    ]),
  );
  elements["#credit-role"].value = "composer";
  const form = {
    elements: {
      creatorRows: new Element(),
      composer: new Element(),
      workId: new Element("select"),
    },
  };
  form.elements.workId.replaceChildren(new Option("新しい作品", ""));
  const creators = [
    {
      id: "cr-0001",
      slug: "a",
      name: "制作A",
      sortKey: "a",
      type: "person",
      aliases: ["別名A"],
    },
    {
      id: "cr-0002",
      slug: "b",
      name: "制作B",
      sortKey: "b",
      type: "unit",
      aliases: [],
    },
  ];
  const works = Array.from({ length: workCount }, (_, i) => ({
    id: `wk-${String(i + 1).padStart(4, "0")}`,
    title: `作品${i + 1}`,
  }));
  let loaded = 0,
    draft = null;
  const context = vm.createContext({
    ...data,
    document: {
      querySelector: (s) => elements[s],
      createElement: (t) => new Element(t),
    },
    Option,
  });
  const source = fs
    .readFileSync("src/js/creator-picker.js", "utf8")
    .replace(/^import[\s\S]*?from "\.\/creators-data.js";/, "")
    .replace("export function", "function");
  vm.runInContext(source, context);
  const picker = context.createCreatorPicker({
    form,
    getStore: () => ({
      loadCreatorOptions: async () => {
        loaded++;
        return { creators, works };
      },
    }),
    getPrevious: () => previous,
    onChange: () => {
      draft = {
        rows: form.elements.creatorRows.value,
        workId: form.elements.workId.value,
      };
    },
  });
  return {
    picker,
    form,
    elements,
    loaded: () => loaded,
    draft: () => draft,
    rows: () => JSON.parse(form.elements.creatorRows.value || "[]"),
    add: (id, role, override = "") => {
      elements["#credit-creator"].value = id;
      elements["#credit-role"].value = role;
      elements["#credit-override"].value = override;
      elements["#add-credit"].onclick();
    },
    button: (name) =>
      elements["#selected-creators"].children
        .flatMap((li) => li.children)
        .find((e) => e.attributes["aria-label"] === name),
  };
}
test("picker events search aliases, add multiple roles/creators, order, override, remove and preserve draft rows", async () => {
  const h = harness();
  await h.picker.refresh();
  h.elements["#credit-search"].value = "別名A";
  h.elements["#credit-search"].oninput();
  assert.equal(h.elements["#credit-creator"].children.length, 1);
  h.add("cr-0001", "composer", "表示A");
  h.elements["#credit-search"].value = "";
  h.elements["#credit-search"].oninput();
  h.add("cr-0002", "composer");
  h.add("cr-0001", "lyricist");
  h.add("cr-0001", "lyricist");
  assert.equal(h.rows().length, 3);
  assert.match(h.elements["#credit-status"].textContent, /既に/);
  h.button("作曲：制作Bを前へ").onclick();
  assert.equal(h.picker.entered().composer, "制作B、表示A");
  h.button("作曲：制作Bを後へ").onclick();
  assert.equal(h.picker.entered().composer, "表示A、制作B");
  const input =
    h.elements["#selected-creators"].children[0].children[1].children[0];
  input.value = "更新表示";
  input.oninput();
  assert.equal(h.picker.entered().lyricist, "更新表示");
  assert.equal(h.picker.entered().credits.length, 2);
  h.button("作曲：制作Bを削除").onclick();
  assert.equal(h.picker.entered().composer, "更新表示");
  const saved = h.draft();
  const restored = harness();
  restored.form.elements.creatorRows.value = saved.rows;
  restored.picker.setWork(saved.workId);
  await restored.picker.refresh();
  assert.deepEqual(restored.rows(), h.rows());
  assert.equal(restored.picker.entered().lyricist, "更新表示");
});
test("Work draft selection survives unavailable options, refresh limits and search changes", async () => {
  const h = harness(null, 150);
  h.picker.setWork("wk-0150");
  assert.equal(h.form.elements.workId.value, "wk-0150");
  await h.picker.refresh();
  assert.equal(h.form.elements.workId.value, "wk-0150");
  assert.ok(h.form.elements.workId.children.length <= 102);
  h.elements["#work-search"].value = "作品2";
  h.elements["#work-search"].oninput();
  assert.equal(h.form.elements.workId.value, "wk-0150");
  assert.match(
    fs.readFileSync("src/js/admin.js", "utf8"),
    /element\.name === "workId"[\s\S]*?creatorPicker\.setWork\(value\)/,
  );
});
test("loaded unresolved credit keeps its display and blocks changing only the pending role", async () => {
  const old = {
    workId: "wk-0001",
    credits: [],
    creditDisplay: {
      lyricist: [],
      composer: [{ text: "確認待ち名", unresolved: true }],
      arranger: [],
    },
    composer: "確認待ち名",
  };
  const h = harness(old);
  h.picker.setSong(old);
  await h.picker.refresh();
  h.add("cr-0001", "composer");
  assert.equal(h.rows().length, 0);
  assert.match(h.elements["#credit-status"].textContent, /確認待ち/);
  h.add("cr-0001", "lyricist");
  assert.equal(h.picker.entered().composer, "確認待ち名");
  assert.equal(h.picker.entered().lyricist, "制作A");
  assert.equal(h.picker.entered().workId, "wk-0001");
});
