import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { review, recordings } from "../../scripts/research/original-work.mjs";
import { loadGameCatalog } from "../../scripts/catalog.mjs";
import { GAMES } from "../../src/js/site-config.js";
import { renderDetail } from "../../src/js/views.js";
import { validateSong } from "../../src/js/song-schema.js";
import { updateGarupaSong, findGarupaSong } from "../../src/js/garupa-data.js";

test("all 582 review targets have evidence or an individually searched human-review entry; unrelated song data and 308 existing values are preserved", () => {
  const result = review();
  assert.deepEqual(result.counts, {
    existing: 308,
    confirmed: 164,
    none: 418,
    human_review: 0,
  });
  for (const song of recordings()) {
    const row = result.rows.find((r) => r.reference === song.reference);
    assert.equal(song.originalWork, row.value, song.reference);
    if (row.status === "human_review")
      assert.ok(row.searches.length && !row.value);
    else if (row.status !== "existing") assert.ok(row.findings.length);
  }
  const human = JSON.parse(
    fs.readFileSync(
      "docs/research/original-work-2026-10-22/human-review.json",
      "utf8",
    ),
  );
  assert.equal(human.count, 0);
  assert.deepEqual(
    human.rows.map((s) => s.reference),
    result.rows
      .filter((s) => s.status === "human_review")
      .map((s) => s.reference),
  );
  const confirmed = JSON.parse(
    fs.readFileSync(
      "docs/research/original-work-2026-10-22/human-confirmation.json",
      "utf8",
    ),
  );
  assert.equal(confirmed.references.length, 416);
  assert.equal(
    confirmed.references.filter((r) => r.startsWith("garupa:")).length,
    370,
  );
  assert.equal(
    confirmed.references.filter((r) => r.startsWith("ournotes:")).length,
    46,
  );
  for (const ref of confirmed.references) {
    const row = result.rows.find((r) => r.reference === ref);
    assert.equal(row.value, "なし", ref);
    assert.equal(row.findings[0].sourceType, "user_confirmation", ref);
  }
});

test("all 890 details render exactly one work field for every category and deployment prefix", () => {
  let count = 0;
  for (const game of Object.values(GAMES))
    for (const s of loadGameCatalog(game)) {
      for (const base of ["/", "/bandori-song-atlas/"]) {
        const html = renderDetail(
          s,
          { updatedAt: "2026-10-22" },
          new URLSearchParams(),
          base,
          game,
        );
        assert.equal(
          (html.match(/<dt>原曲の使用作品・タイアップ<\/dt>/g) || []).length,
          1,
          `${game.id}:${s.id}`,
        );
        assert.ok(
          html.includes(
            `<dd>${(s.work || "未登録").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</dd>`,
          ),
          `${game.id}:${s.id}`,
        );
        if (s.type === "normal")
          assert.doesNotMatch(html, /<dt>原曲アーティスト<\/dt>/);
        else assert.match(html, /<dt>原曲アーティスト<\/dt>/);
      }
      count++;
    }
  assert.equal(count, 890);
});

test("work text is escaped and absence remains distinct from unknown on original recordings", () => {
  const s = loadGameCatalog(GAMES.garupa).find((s) => s.type === "normal");
  for (const [work, expected] of [
    [null, "未登録"],
    ["なし", "なし"],
    ["<script>&\"'", "&lt;script&gt;&amp;&quot;&#39;"],
  ]) {
    const html = renderDetail({ ...s, work }, { updatedAt: "2026-10-22" });
    assert.ok(html.includes(`<dd>${expected}</dd>`));
    assert.doesNotMatch(html, /<script>/);
  }
});

test("the real admin form extraction preserves original work text through a database update for both games, including none and clearing to unknown", () => {
  const source = fs.readFileSync("src/js/admin.js", "utf8");
  const fn = source.slice(
    source.indexOf("function enteredSong()"),
    source.indexOf('form.addEventListener("submit"'),
  );
  for (const game of Object.values(GAMES)) {
    const raw = JSON.parse(fs.readFileSync(game.dataFile, "utf8"));
    const original = recordings().find(
      (s) => s.game === game.id && s.category === "オリジナル",
    );
    for (const work of [" アニメ「確認済み作品」OP ", "なし", ""]) {
      const values = {
        ...original,
        originalWork: work,
        guests: "",
        otherBand: "",
        releaseDate: original.releaseDate.replace(/(Z|[+-]\d{2}:\d{2})$/, ""),
        aliases: "",
        live3d: JSON.stringify(original.live3d ?? null),
        mv: JSON.stringify(original.mv ?? null),
      };
      const elements = new Proxy(
        {},
        {
          get: (_, key) => {
            const chart = String(key).match(
              /^(EASY|NORMAL|HARD|EXPERT|SPECIAL)-(enabled|level|notes)$/,
            );
            if (chart)
              return chart[2] === "enabled"
                ? { checked: Boolean(original.difficulties[chart[1]]) }
                : {
                    value: String(
                      original.difficulties[chart[1]]?.[chart[2]] ?? "",
                    ),
                  };
            return { value: String(values[key] ?? "") };
          },
        },
      );
      const { song } = vm.runInNewContext(fn + "\nenteredSong()", {
        form: { elements },
        game,
        relatedReferences: () => original.relatedSongIds || [],
        creatorPicker: {
          entered: () => ({
            workId: original.workId,
            credits: original.credits,
            creditDisplay: original.creditDisplay,
            lyricist: original.lyricist,
            arranger: original.arranger,
          }),
        },
        validateSong,
      });
      assert.equal(song.originalWork, work.trim() || null);
      const copy = structuredClone(raw);
      song.id = original.id;
      updateGarupaSong(copy, song, game.id);
      assert.equal(
        findGarupaSong(copy, original.id).song.originalWork,
        work.trim() || null,
      );
    }
  }
  const html = fs.readFileSync("src/pages/admin.html", "utf8");
  assert.doesNotMatch(
    html.match(/id="cover-fields"[\s\S]*?<\/div>/)[0],
    /name="originalWork"/,
  );
});
