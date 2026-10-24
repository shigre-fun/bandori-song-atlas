import { GAMES } from "./site-config.js";
import { siteURL, songListPath, songPath } from "./urls.js";
import { BAND_THEMES, bandTheme, OTHER_BAND } from "./band-theme.js";
import {
  sortLabels,
  sortState,
  compareSongs,
  filteredSongs,
  selectedFilters,
  crossGameSongs,
  bandOrder,
  pageNumbers,
  searchPage,
  creditField,
} from "./domain.js";
import { ournotesSongTypes, gekisouKinds } from "./song-schema.js";
const motifVersion = new URL(import.meta.url).search;
const e = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const CROSS_GAME = {
  id: "cross",
  bands: BAND_THEMES.map((t) => t.name),
  categories: ["normal", "anime"],
  difficulties: GAMES.garupa.difficulties,
};
const names = { normal: "オリジナル", anime: "カバー", tie_up: "エクストラ" };
const knownPhrases = {
  "キラキラだとか夢だとか ～Sing Girls～": [
    "キラキラだとか",
    "夢だとか ",
    "～Sing Girls～",
  ],
  "STAR BEAT!〜ホシノコドウ〜": ["STAR BEAT!", "〜ホシノコドウ〜"],
  "新人類は仮想世界の夢を見るか？": ["新人類は", "仮想世界の", "夢を見るか？"],
  限界現実サバイブ天使: ["限界現実", "サバイブ天使"],
  "しゅわりん☆どり〜みん": ["しゅわりん☆", "どり〜みん"],
  "Daylight -デイライト-": ["Daylight ", "-デイライト-"],
};
const segmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("ja", { granularity: "word" })
    : null;
export function titlePhrases(title) {
  if (knownPhrases[title]) return knownPhrases[title];
  if (!segmenter) return [title];
  const result = [];
  for (const { segment } of segmenter.segment(title)) {
    if (
      result.length &&
      /^(?:は|が|を|に|へ|と|で|や|の|も|から|まで|より|って|た|だ|です|ます|ない|たい|う|る|れ|か|[\s！!？?。、，,・☆★♪）)」』】ー]+)$/.test(
        segment,
      )
    )
      result[result.length - 1] += segment;
    else result.push(segment);
  }
  return result;
}
const titleHTML = (title) =>
  titlePhrases(title)
    .map((p) => `<span class="title-phrase">${e(p)}</span>`)
    .join("<wbr>");
const pathFor = (game, base) =>
  siteURL(game.id === "cross" ? "search/" : songListPath(game), base);
function selectedRows(catalogs, params, game) {
  if (game.id !== "cross") return filteredSongs(catalogs.songs, params, game);
  const filters = selectedFilters(params, game);
  return crossGameSongs(
    catalogs,
    params.get("q") || "",
    creditField(params),
  ).filter(
    (song) =>
      (!filters.types.length ||
        filters.types.includes(song.type === "tie_up" ? "anime" : song.type)) &&
      (!filters.bands.length ||
        filters.bands.includes(String(bandOrder(song, game)))),
  );
}
function chips(group, items, selected) {
  return items
    .map(
      ({ value, label, color, fullName }) =>
        `<button type="button" class="filter-chip" data-filter="${group}" data-value="${e(value)}" aria-pressed="${selected.includes(String(value))}"${color ? ` style="--chip:${color}"` : ""}${fullName ? ` title="${e(fullName)}" aria-label="${e(fullName)}"` : ""}>${label}</button>${selected.includes(String(value)) ? `<input type="hidden" name="${group}" value="${e(value)}">` : ""}`,
    )
    .join("");
}
const hidden = (params, omit) =>
  [...params]
    .filter(([k]) => !omit.includes(k))
    .map(([k, v]) => `<input type="hidden" name="${e(k)}" value="${e(v)}">`)
    .join("");
function filterPanel(params, game, base) {
  const f = selectedFilters(params, game),
    count =
      f.types.length + f.bands.length + f.songTypes.length + f.gekisou.length;
  const bands = [...game.bands, "その他"].map((band, i) => {
    const t = bandTheme(band);
    return {
      value: String(i),
      label: e(t.shortName),
      color: t.color,
      fullName: band,
    };
  });
  const reset = new URLSearchParams(params);
  for (const key of ["type", "band", "songType", "gekisou"]) reset.delete(key);
  reset.set("page", 1);
  return `<details class="song-filter-panel"><summary>絞り込む${count ? ` <span class="filter-count">${count}</span>` : ""}<span aria-hidden="true">⌄</span></summary><form id="filters" class="song-filter-form" action="${pathFor(game, base)}" method="get">${hidden(params, ["type", "band", "songType", "gekisou", "page"])}<input type="hidden" name="page" value="1"><fieldset><legend>楽曲の種類</legend><div class="filter-chips">${chips(
    "type",
    game.categories.map((value) => ({
      value,
      label:
        game.id === "cross" && value === "anime"
          ? "カバー<small>（エクストラ含む）</small>"
          : names[value],
    })),
    f.types,
  )}</div></fieldset><fieldset><legend>バンド</legend><div class="filter-chips">${chips("band", bands, f.bands)}</div></fieldset>${
    game.id === "ournotes"
      ? `<fieldset><legend>楽曲タイプ</legend><div class="filter-chips">${chips(
          "songType",
          ournotesSongTypes.map((value) => ({ value, label: value })),
          f.songTypes,
        )}</div></fieldset><fieldset><legend>撃奏区間</legend><div class="filter-chips">${chips(
          "gekisou",
          [...gekisouKinds, "mixed"].map((value) => ({
            value,
            label: value === "mixed" ? "混合" : value,
          })),
          f.gekisou,
        )}</div></fieldset>`
      : ""
  }<p class="notice">未選択の項目はすべて表示。同じ項目内はいずれか、項目間はすべてに一致する楽曲を表示します。${game.id === "ournotes" ? "撃奏区間が未確認の曲も「混合」に含みます。" : ""}</p><div class="filter-actions"><a id="clear-filters" href="${e(pathFor(game, base) + "?" + reset)}">すべて解除</a><button type="submit">この条件で表示</button></div></form></details>`;
}
function sorting(params, game, base) {
  const s = sortState(params, game);
  return `<form id="song-sort" class="song-sort" action="${pathFor(game, base)}" method="get">${hidden(params, ["sort", "difficulty", "direction", "page"])}<input type="hidden" name="page" value="1"><input type="hidden" name="direction" value="${s.direction}"><label>並び替え<select name="sort" id="sort-mode">${Object.entries(
    sortLabels,
  )
    .map(
      ([v, t]) =>
        `<option value="${v}"${s.mode === v ? " selected" : ""}>${t}</option>`,
    )
    .join(
      "",
    )}</select></label><label>難易度<select name="difficulty" id="difficulty">${game.difficulties.map((d, i) => `<option value="${i}"${s.difficulty === i ? " selected" : ""}>${d}</option>`).join("")}</select></label><button type="submit" class="sort-direction" data-reverse aria-label="${s.direction === "forward" ? "逆順にする" : "通常順にする"}">${s.direction === "forward" ? "↓" : "↑"}</button><noscript><button>並び替える</button></noscript></form>`;
}
function card(song, params, game, base) {
  const actual = GAMES[song.gameId] || game,
    theme = bandTheme(song.band),
    state = new URLSearchParams(params);
  if (game.id === "cross") state.set("from", "search");
  const href = siteURL(songPath(actual, song.stableSongId), base) + "?" + state;
  return `<li class="song-card" data-game="${actual.id}" data-band="${e(song.band)}" style="--band:${theme.color}">${theme.id ? `<span class="band-motif" aria-hidden="true" style="--motif:url('${siteURL("images/bands/" + theme.id + ".svg", base)}${motifVersion}')"></span>` : ""}<div class="song-heading"><a class="${game.id === "cross" ? "search-detail" : "song-title"}" href="${e(href)}" aria-label="${e(song.title + "（" + actual.shortName + "・" + song.band + "）の詳細")}"><span class="song-title-text">${titleHTML(song.title)}</span></a><span class="tag ${song.type}">${names[song.type]}</span></div>${game.id === "cross" ? `<span class="search-game game-label ${actual.id}">${actual.shortName}</span>` : ""}<dl class="song-difficulties" aria-label="難易度・レベル" style="--columns:${actual.difficulties.length}">${actual.difficulties.map((d, i) => `<div><dt class="diff-${i}">${d}</dt><dd class="lv${song.difficulties[i] && song.difficulties[i].level == null ? " level-unknown" : ""}">${e(song.difficulties[i]?.level ?? (song.difficulties[i] ? "未確認" : "—"))}</dd></div>`).join("")}</dl></li>`;
}
export function renderSongList(data, params, base, game = GAMES.garupa) {
  if (!data) return '<p class="notice">楽曲データを読み込んでいます。</p>';
  const s = sortState(params, game),
    rows = selectedRows(data, params, game).sort(
      (a, b) =>
        compareSongs(s.mode, s.direction, s.difficulty, game)(a, b) ||
        (a.gameId || game.id).localeCompare(b.gameId || game.id),
    );
  const pages = Math.max(1, Math.ceil(rows.length / 50)),
    page = searchPage(params, pages),
    state = new URLSearchParams(params);
  state.set("page", page);
  const pageURL = (n) => {
    const p = new URLSearchParams(state);
    p.set("page", n);
    return e(pathFor(game, base) + "?" + p);
  };
  const cross = game.id === "cross",
    q = params.get("q") || "";
  const role = creditField(params);
  const description = q
    ? role
      ? `「${e(q)}」が${{ lyricist: "作詞", composer: "作曲", arranger: "編曲", artist: "原曲アーティスト" }[role]}${role === "artist" ? "の楽曲" : "に関わった楽曲（共同制作を含む）"}`
      : `「${e(q)}」に一致する楽曲`
    : cross
      ? "ガルパとアワーノーツの全楽曲をまとめて検索。"
      : "曲名・作品名から検索できます。";
  const heading = q
    ? "検索結果"
    : cross
      ? "横断検索"
      : `${game.shortName}の楽曲を探す`;
  return `<section class="intro song-list-intro"><div><p class="eyebrow">${cross ? "ALL GAMES" : "BANG DREAM!"} · SONG DATABASE</p><h1>${heading}</h1><p>${description}</p></div><div class="count">${rows.length}<small>${cross ? "件" : "曲"}</small></div></section>${filterPanel(params, game, base)}${sorting(params, game, base)}${
    rows.length
      ? `<ul class="song-grid${cross ? " cross-search-list" : ""}">${rows
          .slice((page - 1) * 50, page * 50)
          .map((song) => card(song, state, game, base))
          .join("")}</ul>`
      : '<div class="panel empty"><h2>一致する楽曲はありません</h2><p>短い曲名や作品名で試してください。</p></div>'
  }<nav class="pagination" aria-label="一覧のページ切り替え">${page === 1 ? '<span id="prev" aria-disabled="true">前へ</span>' : `<a id="prev" href="${pageURL(page - 1)}">前へ</a>`}<span>${page} / ${pages}</span><div class="page-numbers">${pageNumbers(
    page,
    pages,
  )
    .map((n) =>
      n === null
        ? '<span class="page-gap" aria-hidden="true">…</span>'
        : `<a href="${pageURL(n)}"${n === page ? ' aria-current="page"' : ""}>${n}</a>`,
    )
    .join(
      "",
    )}</div>${page === pages ? '<span id="next" aria-disabled="true">次へ</span>' : `<a id="next" href="${pageURL(page + 1)}">次へ</a>`}</nav><p class="notice">${!cross && data.updatedAt != null ? `日本版 · データセット更新記録：${new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(data.updatedAt))}。` : ""}「—」は未実装、「未確認」はレベル未確認です。バンドは背景の色と模様で表しています。</p>${
    cross && !rows.length
      ? `<p class="search-game-links">${Object.values(GAMES)
          .map(
            (g) =>
              `<a href="${siteURL(songListPath(g), base)}">${g.shortName}の楽曲一覧へ</a>`,
          )
          .join(" ")}</p>`
      : ""
  }`;
}
