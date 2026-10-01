import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadGameCatalog } from "../scripts/catalog.mjs";
import { GAMES } from "../src/js/site-config.js";
import {
  bandOrder,
  filteredSongs,
  gekisouCategory,
  selectedFilters,
  sortState,
  compareSongs,
} from "../src/js/domain.js";
import { renderList, renderDetail } from "../src/js/views.js";
import { listGarupaSongs } from "../src/js/garupa-data.js";
import { validateSong } from "../src/js/song-schema.js";

const game = GAMES.ournotes;
const songs = loadGameCatalog(game);
const data = { updatedAt: "2026-09-25", songs };

test("Our Notes assigns the requested IDs and release order", () => {
  const raw = JSON.parse(fs.readFileSync(game.dataFile, "utf8"));
  const rawSongs = raw.groups.flatMap((group) => group.songs);
  const expected = new Map([
    [64, "everscape"],
    [65, "鳴らす"],
    [66, "カーネーションの咲く日に"],
    [72, "ジャイアント・キラー・チューン"],
    [73, "ピースフル・ピーシーズ！"],
    [74, "Keep on Riddim"],
  ]);
  for (const [id, title] of expected) {
    const song = rawSongs.find((entry) => entry.id === id);
    assert.equal(song?.title, title);
    assert.equal(song?.releaseOrder, id);
  }
});

test("Our Notes stores MV status without Garupa-only fields", () => {
  const raw = JSON.parse(fs.readFileSync(game.dataFile, "utf8"));
  const exceptions = new Set([
    "碧い瞳の中に",
    "everscape",
    "カーネーションの咲く日に",
    "ジャイアント・キラー・チューン",
    "Keep on Riddim",
  ]);
  const originals = raw.groups
    .filter((group) => group.category === "オリジナル")
    .flatMap((group) => group.songs);
  // 確認済みの初期データの期待値を、新曲の未確認MVへ適用しない。
  const confirmedOriginals = originals.filter((song) => song.id <= 83);
  assert.equal(
    confirmedOriginals.filter((song) => song.mv === false).length,
    5,
  );
  for (const song of confirmedOriginals)
    assert.equal(song.mv, !exceptions.has(song.title), song.title);
  for (const song of originals)
    assert.ok(song.mv === null || typeof song.mv === "boolean", song.title);
  for (const song of listGarupaSongs(raw, game.id)) {
    assert.ok(!Object.hasOwn(song, "live3d"), song.title);
    assert.ok(!Object.hasOwn(song.difficulties, "SPECIAL"), song.title);
  }
  const present = renderDetail(
    songs.find((song) => song.id === 1),
    data,
    new URLSearchParams(),
    "/",
    game,
  );
  const absent = renderDetail(
    songs.find((song) => song.id === 38),
    data,
    new URLSearchParams(),
    "/",
    game,
  );
  const unknown = renderDetail(
    { ...songs.find((song) => song.id === 1), mv: null },
    data,
    new URLSearchParams(),
    "/",
    game,
  );
  assert.match(
    present,
    /<dt>MV<\/dt><dd><span class="pill">あり<\/span><\/dd>/,
  );
  assert.match(absent, /<dt>MV<\/dt><dd>なし<\/dd>/);
  assert.match(unknown, /<dt>MV<\/dt><dd>確認中<\/dd>/);
});

test("Our Notes retains launch IDs as its catalog grows", () => {
  const ids = new Set(songs.map((song) => song.id));
  assert.ok(songs.length >= 78);
  assert.equal(ids.size, songs.length);
  for (let id = 1; id <= 78; id++) assert.ok(ids.has(id), `launch ID ${id}`);
  assert.ok(
    songs.every(
      (song) => song.difficulties.length === game.difficulties.length,
    ),
  );
});

test("Our Notes has an independent type and three validated performance sections", () => {
  const raw = JSON.parse(fs.readFileSync(game.dataFile, "utf8"));
  const entries = listGarupaSongs(raw, game.id);
  assert.ok(entries.length >= 83);
  assert.equal(
    entries.filter((song) => song.id <= 83 && song.songType !== null).length,
    83,
  );
  assert.ok(entries.every((song) => Object.hasOwn(song, "songType")));
  assert.ok(
    entries.filter((song) => song.gekisouSections.every(Boolean)).length >= 34,
  );
  const first = entries.find((song) => song.id === 1);
  assert.equal(first.songType, "紅赤");
  assert.deepEqual(first.gekisouSections, ["COMBO", "COMBO", "COMBO"]);
  assert.throws(
    () => validateSong({ ...first, songType: "赤" }, game.id),
    /楽曲タイプ/,
  );
  assert.throws(
    () =>
      validateSong({ ...first, gekisouSections: ["LUCK", "COMBO"] }, game.id),
    /撃奏区間/,
  );
  assert.throws(
    () =>
      validateSong(
        { ...first, gekisouSections: ["LUCK", "COMBO", "OTHER"] },
        game.id,
      ),
    /撃奏区間/,
  );
  validateSong(
    { ...first, gekisouSections: ["LUCK", "COMBO", "JUST"] },
    game.id,
  );
});

test("Our Notes renders added songs and populated chart fields", () => {
  const total = Math.ceil(songs.length / 50) * 50 + 1;
  const nextId = Math.max(...songs.map((song) => song.id)) + 1;
  const prototype = songs.find((song) => song.id === 1);
  const added = Array.from({ length: total - songs.length }, (_, index) => {
    const id = nextId + index;
    return {
      ...prototype,
      id,
      stableSongId: String(id),
      slug: String(id),
      title: `追加曲${id}`,
      bpm: 180,
      bpmMin: 180,
      bpmMax: 180,
      durationSeconds: 120,
      difficulties: game.difficulties.map(() => ({ level: 20, notes: 500 })),
    };
  });
  const future = { ...data, songs: [...songs, ...added] };
  const lastPage = Math.ceil(total / 50);
  const list = renderList(
    future,
    new URLSearchParams({ page: String(lastPage) }),
    "/",
    game,
  );
  assert.ok(list.includes(`${lastPage} / ${lastPage}`));
  assert.equal((list.match(/class="song-title"/g) || []).length, 1);
  const detail = renderDetail(
    added[0],
    future,
    new URLSearchParams(),
    "/",
    game,
  );
  for (const value of ["180", "2:00", "500"]) assert.ok(detail.includes(value));
});

test("Our Notes list uses Garupa controls, multiple filters and seven sort modes", () => {
  const all = renderList(data, new URLSearchParams(), "/", game);
  const filterHeadings = [
    "楽曲の種類（複数選択可）",
    "バンド（複数選択可）",
    "楽曲タイプ（複数選択可）",
    "撃奏区間（複数選択可）",
  ];
  let previousHeading = -1;
  for (const heading of filterHeadings) {
    const index = all.indexOf(heading);
    assert.ok(index > previousHeading, heading);
    previousHeading = index;
  }
  for (const type of ["紅赤", "紺碧", "翡翠", "山吹", "紫苑"])
    assert.match(
      all,
      new RegExp(
        `class="filter-song-type-label song-type-${type}"[^>]*>.*?name="songType" value="${type}"[^>]*>.*?<span class="song-type">${type}</span>`,
        "s",
      ),
    );
  for (const mode of ["COMBO", "LUCK", "JUST"])
    assert.match(
      all,
      new RegExp(`name="gekisou" value="${mode}"[^>]*>${mode}のみ<\\/label>`),
    );
  assert.match(all, /value="mixed"[^>]*>混合<\/label>/);
  assert.match(all, /撃奏区間が未確認の曲も「混合」に含みます/);
  assert.equal(
    (all.match(/class="song-title"/g) || []).length,
    Math.min(50, songs.length),
  );
  assert.ok(all.includes(`1 / ${Math.ceil(songs.length / 50)}`));
  for (const band of game.bands) assert.ok(all.includes(band));
  for (const mode of [
    "band",
    "level",
    "notes",
    "bpm",
    "duration",
    "kana",
    "release",
  ])
    assert.ok(all.includes(`data-sort="${mode}"`));
  assert.equal(sortState(new URLSearchParams(), game).difficulty, 3);
  assert.doesNotMatch(all, /SPECIAL|エクストラ/);
  const target = songs.find((song) => song.id === 1);
  const targetBand = bandOrder(target, game);
  const params = new URLSearchParams();
  params.append("type", target.type);
  params.append(
    "type",
    game.categories.find((type) => type !== target.type),
  );
  params.append("band", String(targetBand));
  params.append("band", String(targetBand === 0 ? 1 : 0));
  params.set("q", target.title);
  const matches = filteredSongs(songs, params, game).sort(
    compareSongs("band", "forward", 3, game),
  );
  const position = matches.findIndex((song) => song.id === target.id);
  assert.ok(position >= 0);
  params.set("page", String(Math.floor(position / 50) + 1));
  const filtered = renderList(data, params, "/", game);
  assert.match(filtered, /ournotes\/songs\/1\//);
  assert.equal(
    (filtered.match(/class="song-title"/g) || []).length,
    Math.min(50, matches.length - Math.floor(position / 50) * 50),
  );
  for (const mode of [
    "band",
    "level",
    "notes",
    "bpm",
    "duration",
    "kana",
    "release",
  ])
    assert.equal(
      [...songs].sort(compareSongs(mode, "forward", 3, game)).length,
      songs.length,
    );
});

test("Our Notes type and performance filters combine OR within a group and AND across groups", () => {
  const base = songs.find((song) => song.id === 1);
  const samples = [
    {
      ...base,
      id: 1001,
      songType: "紅赤",
      gekisouSections: ["COMBO", "COMBO", "COMBO"],
    },
    {
      ...base,
      id: 1002,
      songType: "紺碧",
      gekisouSections: ["LUCK", "LUCK", "LUCK"],
    },
    {
      ...base,
      id: 1003,
      songType: "翡翠",
      gekisouSections: ["JUST", "JUST", "JUST"],
    },
    {
      ...base,
      id: 1004,
      songType: "山吹",
      gekisouSections: ["LUCK", "COMBO", "JUST"],
    },
    {
      ...base,
      id: 1005,
      songType: "紫苑",
      gekisouSections: [null, null, null],
    },
  ];
  assert.deepEqual(samples.map(gekisouCategory), [
    "COMBO",
    "LUCK",
    "JUST",
    "mixed",
    "mixed",
  ]);
  const ids = (params) =>
    filteredSongs(samples, new URLSearchParams(params), game).map(
      (song) => song.id,
    );
  assert.deepEqual(ids("songType=紅赤&songType=山吹"), [1001, 1004]);
  assert.deepEqual(ids("gekisou=COMBO&gekisou=LUCK"), [1001, 1002]);
  assert.deepEqual(ids("gekisou=mixed"), [1004, 1005]);
  assert.deepEqual(ids("songType=紅赤&songType=山吹&gekisou=mixed"), [1004]);
  assert.deepEqual(
    ids("songType=invalid&gekisou=invalid"),
    samples.map((song) => song.id),
  );
  assert.deepEqual(
    selectedFilters(
      new URLSearchParams("songType=紅赤&gekisou=COMBO"),
      GAMES.garupa,
    ).songTypes,
    [],
  );
  const filtered = renderList(
    data,
    new URLSearchParams("songType=紅赤&gekisou=COMBO"),
    "/",
    game,
  );
  assert.match(filtered, /name="songType" value="紅赤" checked/);
  assert.match(filtered, /name="gekisou" value="COMBO" checked/);
  const clear = filtered.match(/<a[^>]+id="clear-filters"[^>]*>/)?.[0] ?? "";
  assert.ok(clear);
  assert.doesNotMatch(clear, /songType|gekisou/);
  const sortLink =
    filtered.match(/<a class="sort-link" href="([^"]+)"/)?.[1] ?? "";
  assert.match(sortLink, /songType=%E7%B4%85%E8%B5%A4/);
  assert.match(sortLink, /gekisou=COMBO/);
  const detail = renderDetail(
    base,
    data,
    new URLSearchParams("songType=紅赤&gekisou=COMBO"),
    "/",
    game,
  );
  assert.match(detail, /songType=%E7%B4%85%E8%B5%A4/);
  assert.match(detail, /gekisou=COMBO/);
});

test("Our Notes detail follows Garupa field order without official-image link", () => {
  const target = songs.find((song) => song.id === 1);
  const detail = renderDetail(target, data, new URLSearchParams(), "/", game);
  const headings = [
    "難易度・ノーツ数",
    "楽曲情報",
    "配信日（日本版）",
    "基本BPM",
    "BPMの下限〜上限",
    "演奏バンド・参加アーティスト",
    "楽曲演奏時間（ゲーム内）",
    "楽曲タイプ",
    "撃奏区間",
    "作曲",
  ];
  let previous = -1;
  for (const heading of headings) {
    const index = detail.indexOf(heading);
    assert.ok(index > previous, heading);
    previous = index;
  }
  for (const difficulty of game.difficulties)
    assert.ok(detail.includes(difficulty));
  assert.match(detail, /song-type-紅赤">紅赤<\/span>/);
  assert.match(detail, /1.COMBO \/ 2.COMBO \/ 3.COMBO/);
  assert.match(
    renderDetail(
      {
        ...songs.find((song) => song.id === 5),
        gekisouSections: [null, null, null],
      },
      data,
      new URLSearchParams(),
      "/",
      game,
    ),
    /<dt>撃奏区間<\/dt><dd>未確認<\/dd>/,
  );
  assert.doesNotMatch(
    detail,
    /SPECIAL|収録曲の公式発表を見る|fromtyo.jp\/media/,
  );
  const cover = renderDetail(
    songs.find((song) => song.type === "anime"),
    data,
    new URLSearchParams(),
    "/",
    game,
  );
  assert.match(cover, /原曲アーティスト/);
  assert.match(cover, /原曲の使用作品・タイアップ/);
  const generated = fs.readFileSync("dist/ournotes/songs/1/index.html", "utf8");
  const heading = detail.match(/<h1>.*?<\/h1>/s)?.[0];
  assert.ok(heading && generated.includes(heading));
  assert.match(generated, /アワーノーツの楽曲名・作品名で検索/);
  assert.match(
    generated,
    /action="\/(?:bandori-song-atlas\/)?ournotes\/songs\/"/,
  );
});
