import { test } from "node:test";
import assert from "node:assert/strict";
import { renderList } from "../src/js/views.js";
import {
  renderCreators,
  renderCreatorDetail,
} from "../src/js/creator-views.js";
import { GAMES } from "../src/js/site-config.js";

const creator = {
  id: "cr-0001",
  slug: "sample",
  name: "制作A",
  sortKey: "a",
  type: "person",
};
const ready = { lyricist: "ready", composer: "ready", arranger: "ready" };
const song = (game, id = 1, work = "なし") => ({
  gameId: game.id,
  id,
  stableSongId: String(id),
  title: "表示テスト",
  band: game.bands[0],
  type: "normal",
  work,
  workId: `wk-${String(id).padStart(4, "0")}`,
  publishedAt: 1,
  difficulties: game.difficulties.map(() => ({ level: 10, notes: 100 })),
  credits: [
    { creatorId: creator.id, roles: ["lyricist", "composer", "arranger"] },
  ],
  songType: "紅赤",
  bpm: 150,
  durationSeconds: 90,
});
const compactRoleText = (html) =>
  [
    ...html.matchAll(/<span class="creator-role-counts">([\s\S]*?)<\/span>/g),
  ].map((m) => m[1].replace(/<[^>]+>/g, ""));

test("song cards omit works, release dates and band text while retaining accessible titles and levels", () => {
  for (const game of Object.values(GAMES)) {
    const songs = [
      song(game, 1),
      song(game, 2, "アニメ「作品」OP"),
      song(game, 3, null),
    ];
    const html = renderList(
      { songs, updatedAt: 1 },
      new URLSearchParams("page=1&sort=release"),
      "/atlas/",
      game,
    );
    assert.equal((html.match(/class="song-title"/g) || []).length, 3);
    assert.equal((html.match(/class="song-title-text"/g) || []).length, 3);
    const cards = [
      ...html.matchAll(/<li class="song-card"[\s\S]*?<\/li>/g),
    ].map((m) => m[0]);
    assert.equal(cards.length, 3);
    for (const card of cards) {
      assert.equal(
        (card.match(/<dt /g) || []).length,
        game.difficulties.length,
      );
      assert.doesNotMatch(
        card,
        /song-work|release-date|song-timing|list-song-type|class="band"|基本BPM|演奏時間/,
      );
      assert.equal((card.match(/class="band-motif"/g) || []).length, 1);
    }
    for (const s of songs)
      assert.ok(html.includes("/atlas/" + game.id + "/songs/" + s.id + "/?"));
    assert.doesNotMatch(html, /アニメ「作品」OP/);
  }
});

test("Creator list and summary role counts use single ASCII spaces with correct deduplicated totals", () => {
  const songs = [
    song(GAMES.garupa),
    { ...song(GAMES.ournotes), workId: "wk-0001" },
  ];
  const list = renderCreators([creator], songs, "/", ready);
  const detail = renderCreatorDetail(
    creator,
    songs,
    [{ id: "wk-0001", title: "表示テスト" }],
    "/",
    ready,
  );
  for (const html of [list, detail]) {
    assert.deepEqual(compactRoleText(html), ["作詞 1 作曲 1 編曲 1"]);
    assert.ok(html.includes('class="creator-total">参加楽曲数 <b>1</b>'));
    assert.ok(html.includes("<dt>作曲曲数</dt><dd>1</dd>"));
    assert.ok(!compactRoleText(html)[0].includes("、"));
    assert.ok(!compactRoleText(html)[0].includes("　"));
  }
  assert.match(list, /class="creator-type">個人/);
  assert.match(detail, /class="panel creator-summary"/);
  assert.match(detail, /class="creator-summary-recordings">収録件数：2件/);
  assert.match(detail, /creator-summary-description/);
});

test("mobile counts preserve unprepared and partial coverage instead of inventing zero values", () => {
  const coverage = {
    lyricist: "unprepared",
    composer: "ready",
    arranger: "partial",
  };
  const detail = renderCreatorDetail(creator, [], [], "/", coverage);
  assert.deepEqual(compactRoleText(detail), [
    "作詞 未整備 作曲 0 編曲 0 一部登録",
  ]);
  assert.deepEqual(
    compactRoleText(renderCreators([creator], [], "/", coverage)),
    ["作曲 0 編曲 0 一部登録"],
  );
});

test("long titles remain fully escaped and are not replaced by ellipses", () => {
  const row = {
    ...song(GAMES.ournotes),
    title: '長い曲名 "<script>"',
    work: '作品 "<b>"',
    songType: null,
  };
  const html = renderList(
    { songs: [row], updatedAt: 1 },
    new URLSearchParams(),
    "/",
    GAMES.ournotes,
  );
  assert.match(html, /aria-label="長い曲名 &quot;&lt;script&gt;&quot;/);
  assert.match(html, /class="title-phrase"/);
  assert.doesNotMatch(html, /<script>|list-song-type|作品 &quot;&lt;b&gt;/);
});
