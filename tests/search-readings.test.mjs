import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { matches, crossGameSongs } from "../src/js/domain.js";
import { matchesMixedReading } from "../src/js/search-text.js";
import { searchCreators, CREDIT_ROLES } from "../src/js/creators-data.js";
import {
  creatorSortLabels,
  creatorPagination,
} from "../src/js/creator-views.js";
import {
  roleCoverage,
  availableCreditRoles,
} from "../src/js/credit-coverage.js";
import { loadGameCatalog } from "../scripts/catalog.mjs";
import { GAMES } from "../src/js/site-config.js";

const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const master = read("data/creators.json");

test("mixed kanji/kana song search uses the registered reading in both search paths", () => {
  const catalogs = Object.fromEntries(
    Object.values(GAMES).map((game) => [
      game.id,
      { songs: loadGameCatalog(game) },
    ]),
  );
  const song = catalogs.garupa.songs.find((s) => s.title === "夜に駆ける");
  assert.ok(song);
  for (const query of [
    "夜にかける",
    "よるに駆ける",
    "夜ニカケル",
    "夜にｶｹﾙ",
    "夜にかけ",
    "にかける",
    "ヨルニカケル",
    "夜に駆ける",
  ]) {
    assert.equal(matches(song, query), true, query);
    assert.ok(
      crossGameSongs(catalogs, query).some(
        (s) => s.id === song.id && s.gameId === "garupa",
      ),
      query,
    );
  }
  for (const query of [
    "夜にあける",
    "昼にかける",
    "夜によるにかける",
    "<script>",
  ])
    assert.equal(matches(song, query), false, query);
});

test("mixed reading supports multiple kanji runs and rejects ambiguous or missing alignment", () => {
  for (const q of [
    "世界はこいに落ちている",
    "せかいは恋におちている",
    "界はこいに",
    "こいに落ち",
  ])
    assert.equal(
      matchesMixedReading(
        "世界は恋に落ちている",
        "セカイハコイニオチテイル",
        q,
      ),
      true,
      q,
    );
  assert.equal(matchesMixedReading("夜に駆ける", "", "夜にかける"), false);
  assert.equal(
    matchesMixedReading("夜に駆ける", "マッタクチガウ", "夜にかける"),
    false,
  );
  assert.equal(
    matchesMixedReading("甲の乙", "あのいのう", "甲のいのう"),
    false,
  );
  assert.equal(matchesMixedReading("A+B", "エービー", "Aびー"), false);
});

test("all reviewed Creator readings are searchable as hiragana and katakana, with identity unchanged", () => {
  const research = read(
    "docs/research/search-readings-2026-10-22/creator-readings.json",
  );
  assert.equal(research.audit.length, research.creatorCount);
  const currentCreatorIds = new Set(
    master.creators.map((creator) => creator.id),
  );
  assert.equal(
    new Set(research.audit.map((row) => row.id)).size,
    research.creatorCount,
  );
  for (const row of research.audit)
    assert.ok(
      currentCreatorIds.has(row.id),
      `Reviewed Creator missing: ${row.id}`,
    );
  assert.equal(research.entries.length, 48);
  for (const row of research.entries) {
    const creator = master.creators.find((c) => c.id === row.id);
    assert.equal(creator.sortKey, row.reading, row.name);
    assert.ok(
      searchCreators(master.creators, row.reading).some((c) => c.id === row.id),
      row.name,
    );
    const katakana = row.reading.replace(/[ぁ-ゖ]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) + 0x60),
    );
    assert.ok(
      searchCreators(master.creators, katakana).some((c) => c.id === row.id),
      row.name,
    );
    for (const query of [creator.name, creator.slug, ...creator.aliases])
      assert.ok(
        searchCreators(master.creators, query).some((c) => c.id === row.id),
        query,
      );
  }
  for (const query of ["おだ", "オダ", "ｵﾀﾞ", "織田 あすか", "織田アスカ"])
    assert.ok(
      searchCreators(master.creators, query).some((c) => c.id === "cr-0092"),
      query,
    );
  assert.ok(
    searchCreators(master.creators, "すえます").some((c) => c.id === "cr-0021"),
  );
  assert.ok(
    !searchCreators(master.creators, "おだ").some((c) =>
      c.name.startsWith("太田"),
    ),
  );
  assert.ok(
    searchCreators(master.creators, "ふじはら").some((c) => c.id === "cr-0024"),
  );
  assert.equal(
    master.creators.filter((c) => /\p{Script=Han}/u.test(c.sortKey)).length,
    0,
  );
  assert.equal(
    searchCreators(master.creators, "").length,
    master.creators.length,
  );
  assert.equal(
    searchCreators(master.creators, "存在しないクリエイター検索文字列").length,
    0,
  );
});

function controller() {
  const listeners = new Map();
  const element = (extra = {}) => ({
    value: "",
    addEventListener(type, fn) {
      listeners.set([this.id, type].join(":"), fn);
    },
    ...extra,
  });
  const form = element({
    id: "controls",
    elements: { q: element(), sort: element({ value: "name" }) },
  });
  form.requestSubmit = () =>
    listeners.get("controls:submit")({ preventDefault() {} });
  const search = element({ id: "search", elements: { sort: element() } });
  const input = element({ id: "input" });
  const creators = master.creators.filter((c) =>
    ["cr-0092", "cr-0001"].includes(c.id),
  );
  const cards = creators.map((c) => ({
    dataset: { creatorId: c.id, total: "1" },
    hidden: false,
  }));
  const list = { children: cards, append() {} };
  const status = element(),
    empty = element();
  const nodes = {
    "#creator-controls": form,
    "#creator-search-form": search,
    "#creator-search": input,
    "#creator-page-data": { textContent: JSON.stringify({ creators }) },
    "#creator-result-status": status,
    ".creator-list": list,
    "#creator-empty": empty,
  };
  const location = { pathname: "/atlas/creators/", search: "" };
  const history = {
    pushState(_, __, url) {
      location.search = new URL(url, "https://example.test").search;
    },
  };
  class FormData {
    constructor(form) {
      return Object.entries(form.elements).map(([key, e]) => [key, e.value]);
    }
  }
  const context = {
    document: { querySelector: (s) => nodes[s] },
    location,
    history,
    URLSearchParams,
    FormData,
    searchCreators,
    CREDIT_ROLES,
    creatorSortLabels,
    creatorPagination,
    roleCoverage,
    availableCreditRoles,
    addEventListener: (name, fn) => listeners.set(name, fn),
  };
  vm.runInNewContext(
    fs
      .readFileSync("src/js/creators.js", "utf8")
      .replace(/import[\s\S]*?from "[^"\n]+";\s*/g, ""),
    context,
  );
  const submit = () => listeners.get("search:submit")({ preventDefault() {} });
  return { listeners, form, input, cards, status, empty, location, submit };
}

test("Creator search is committed only by submit, preserves sorting, clears, and restores history", () => {
  const ui = controller();
  ui.input.value = "おだ";
  assert.equal(ui.cards.filter((c) => !c.hidden).length, 2);
  assert.equal(ui.listeners.has("input:input"), false);
  assert.equal(ui.listeners.has("search:change"), false);
  ui.submit();
  assert.deepEqual(
    ui.cards.filter((c) => !c.hidden).map((c) => c.dataset.creatorId),
    ["cr-0092"],
  );
  assert.equal(new URLSearchParams(ui.location.search).get("q"), "おだ");
  ui.input.value = "あげまつ"; // Unsubmitted text must not become a sort filter.
  ui.form.elements.sort.value = "total";
  ui.listeners.get("controls:change")({ target: { tagName: "SELECT" } });
  assert.equal(new URLSearchParams(ui.location.search).get("q"), "おだ");
  assert.equal(new URLSearchParams(ui.location.search).get("sort"), "total");
  ui.input.value = "";
  ui.submit();
  assert.equal(ui.cards.filter((c) => !c.hidden).length, 2);
  ui.location.search = "?q=" + encodeURIComponent("おだ") + "&sort=total";
  ui.listeners.get("popstate")();
  assert.equal(ui.input.value, "おだ");
  assert.equal(ui.cards.filter((c) => !c.hidden).length, 1);
  ui.input.value = "存在しないクリエイター検索文字列";
  ui.submit();
  assert.equal(ui.empty.hidden, false);
  assert.equal(ui.status.textContent, "0件のクリエイター");
});
