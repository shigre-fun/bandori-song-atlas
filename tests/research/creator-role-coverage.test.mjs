import { test } from "node:test";
import assert from "node:assert/strict";
import {
  auditCurrentCoverage,
  summarizeCreditCoverage,
} from "../../scripts/qa/creator-role-coverage.mjs";
import {
  renderCreators,
  renderCreatorDetail,
} from "../../src/js/creator-views.js";
import {
  roleCoverage,
  availableCreditRoles,
} from "../../src/js/credit-coverage.js";

const creator = {
  id: "cr-0001",
  name: "担当者",
  slug: "author",
  sortKey: "a",
  type: "person",
};
const ready = { lyricist: "ready", composer: "ready", arranger: "ready" };

test("current ready metadata is supported by every recording and role, including complete joint credits", () => {
  const audit = auditCurrentCoverage();
  assert.equal(audit.status, "PASS");
  assert.deepEqual(audit.dbWarnings, []);
  assert.deepEqual(audit.missing, []);
  for (const [game, group] of Object.entries(audit.games)) {
    assert.ok(group.songs > 0);
    assert.deepEqual(roleCoverage(audit.roleCoverage, game), ready);
    assert.deepEqual(
      availableCreditRoles(audit.roleCoverage, game),
      Object.keys(ready),
    );
    for (const counts of Object.values(group.roles)) {
      assert.equal(counts.raw, group.songs);
      assert.equal(counts.fullyLinked, group.songs);
      assert.equal(
        counts.empty +
          counts.placeholders +
          counts.unresolvedRecords +
          counts.unlinkedTextRecords,
        0,
      );
    }
  }
});

test("one formal name does not hide an unresolved co-credit, missing raw, or placeholder", () => {
  const base = {
    gameId: "ournotes",
    id: 1,
    title: "fixture",
    workId: "wk-0001",
    lyricist: "担当者／別人",
    composer: "",
    arranger: "未確認",
    credits: [{ creatorId: creator.id, roles: ["lyricist"] }],
    creditDisplay: {
      lyricist: [
        { creatorId: creator.id },
        { text: "／" },
        { text: "別人", unresolved: true },
      ],
      composer: [],
      arranger: [{ text: "未確認", unresolved: true }],
    },
  };
  const result = summarizeCreditCoverage([base], { creators: [creator] });
  assert.equal(result.missing.length, 3);
  assert.equal(result.games.ournotes.roles.lyricist.formalRecords, 1);
  assert.equal(result.games.ournotes.roles.lyricist.fullyLinked, 0);
  assert.equal(result.games.ournotes.roles.composer.empty, 1);
  assert.equal(result.games.ournotes.roles.arranger.placeholders, 1);
});

test("ready list and detail omit obsolete notices and keep all role controls and numeric zero counts", () => {
  const list = renderCreators([creator], [], "/", ready);
  const detail = renderCreatorDetail(creator, [], [], "/", ready);
  for (const html of [list, detail])
    assert.doesNotMatch(html, /一部登録|未整備|未確認の表記/);
  assert.match(list, /Creatorに紐付いたクレジットを集計/);
  for (const role of Object.keys(ready))
    assert.match(detail, new RegExp(`option value="${role}"`));
  assert.match(detail, /編曲曲数<\/dt><dd>0/);
});

test("partial and unprepared datasets continue to disclose incomplete coverage", () => {
  const partial = {
    ...ready,
    arranger: { garupa: "ready", ournotes: "partial" },
  };
  assert.match(
    renderCreators([creator], [], "/", partial),
    /アワーノーツの編曲は一部登録/,
  );
  assert.match(
    renderCreatorDetail(creator, [], [], "/", partial),
    /アワーノーツの編曲は一部登録/,
  );
  assert.match(
    renderCreatorDetail(creator, [], [], "/", {
      ...ready,
      lyricist: "unprepared",
    }),
    /作詞曲数<\/dt><dd><span class="notice">未整備/,
  );
});
