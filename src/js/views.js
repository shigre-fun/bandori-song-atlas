import { renderSongList, CROSS_GAME } from "./song-list.js";
import {
  siteURL,
  siteBase,
  songListPath,
  songPath,
  crossSearchURL,
} from "./urls.js";
import { GAMES } from "./site-config.js";
import { creditParts } from "./credits.js";
import { creditTokens, ROLE_LABELS } from "./credit-display.js";
import { roleCoverage } from "./credit-coverage.js";
import { ournotesSongTypes, gekisouKinds } from "./song-schema.js";
import {
  typeNames,
  bandOrder,
  bandColor as color,
  compareSongs,
  selectedFilters,
  filteredSongs,
  pageNumbers,
  sortState,
  sortLabels,
  nextSortParams,
  normalize,
  crossGameSongs,
  creditField,
  searchPage,
} from "./domain.js";
const e = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const date = (n) =>
  new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(n));
const badge = (s, game) =>
  `<span class="tag ${s.type} ${game.id}">${typeNames[s.type]}</span>`;
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "未確認";
  const wholeSeconds = Math.floor(seconds);
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}
const query = (p, base, game = GAMES.garupa) => {
  const x = new URLSearchParams(p);
  return siteURL(songListPath(game) + "?" + x.toString(), base);
};
export function renderCrossSearch(
  catalogs,
  params = new URLSearchParams(),
  base = siteBase,
) {
  return renderSongList(catalogs, params, base, CROSS_GAME);
}
export function renderList(
  data,
  params = new URLSearchParams(),
  base = siteBase,
  game = GAMES.garupa,
) {
  return renderSongList(data, params, base, game);
}
export function renderDetail(
  s,
  data,
  params = new URLSearchParams(),
  base = siteBase,
  game = GAMES.garupa,
  related = [],
) {
  const normalizedCredit = (role) => {
    if (!s.creditDisplay || !data.creators) return creditLinks(s[role], role);
    return (
      creditTokens(s, role, data.creators)
        .map((p) =>
          p.creator
            ? `<a class="credit-link" href="${e(siteURL(`creators/${p.creator.slug}/`, base))}">${e(p.text)}</a>`
            : p.unresolved
              ? creditLinks(p.text, role)
              : e(p.text),
        )
        .join("") ||
      (role === "arranger" &&
      roleCoverage(data.roleCoverage, game.id)[role] === "partial"
        ? "未整備・確認中"
        : "未確認")
    );
  };
  const creditLinks = (value, field) =>
    value
      ? creditParts(value)
          .map((part) =>
            part.name
              ? `<a class="credit-link" href="${e(crossSearchURL(part.text.trim(), 1, base, field))}" aria-label="${e(`${part.text.trim()}の${ROLE_LABELS[field] ? `${ROLE_LABELS[field]}に関わった` : "原曲アーティストの"}楽曲一覧`)}">${e(part.text)}</a>`
              : e(part.text),
          )
          .join("")
      : "未確認";
  const reportParams = new URLSearchParams({
    pageUrl: siteURL(songPath(game, s.stableSongId), base),
  });
  const reportURL = siteURL(`contact/?${reportParams}`, base);
  return `<a class="back" href="${e(query(params, base, game))}">← 楽曲一覧に戻る</a>
<section class="detail-top" style="--band:${color(s, game)}">${badge(s, game)}<h1>${e(s.title)}</h1>
<p class="detail-game">${e(game.name)}</p>
<div class="detail-band">${e(s.band)}</div>
</section>
<div class="detail-grid">
<section class="panel" data-game="${e(game.id)}">
<h2>難易度・ノーツ数</h2>
<table>
<thead>
<tr>
<th scope="col">難易度</th>
<th scope="col">レベル</th>
<th scope="col">ノーツ数</th>
</tr>
</thead>
<tbody>${s.difficulties
    .map(
      (d, i) => `<tr>
<th scope="row" class="diff-${i}">${game.difficulties[i]}</th>
<td class="lv diff-${i}">${d?.level ?? (d ? "未確認" : "—")}</td>
<td class="lv">${d ? (d.notes?.toLocaleString("ja-JP") ?? "未確認") : "—"}</td>
</tr>`,
    )
    .join("")}</tbody>
</table>
<p class="notice">「—」は未実装の難易度です。未確認の数値は確認後に追加します。</p>
</section>
<section class="panel">
<h2>楽曲情報</h2>
<dl>
<dt>配信日（日本版）</dt>
<dd>${date(s.publishedAt)}</dd>
<dt>基本BPM</dt><dd>${e(s.bpm ?? "未確認")}</dd>
<dt>BPMの下限〜上限</dt><dd>${e(s.bpmMin ?? s.bpm ?? "未確認")} 〜 ${e(s.bpmMax ?? s.bpm ?? "未確認")}</dd>
${game.id === "ournotes" ? `<dt>演奏バンド・参加アーティスト</dt><dd>${e(s.band)}</dd>` : ""}
<dt>楽曲演奏時間（ゲーム内）</dt><dd>${formatDuration(s.durationSeconds)}</dd>
${
  game.id === "ournotes"
    ? `<dt>楽曲タイプ</dt><dd>${s.songType ? `<span class="song-type song-type-${e(s.songType)}">${e(s.songType)}</span>` : "未確認"}</dd>
<dt>撃奏区間</dt><dd>${s.gekisouSections?.some(Boolean) ? s.gekisouSections.map((kind, index) => `${index + 1}.${e(kind || "未確認")}`).join(" / ") : "未確認"}</dd>`
    : ""
}
${game.id === "garupa" ? `<dt>演奏バンド・参加アーティスト</dt><dd>${e(s.band)}</dd>` : ""}
<dt>作詞</dt><dd>${normalizedCredit("lyricist")}</dd>
<dt>作曲</dt><dd>${normalizedCredit("composer")}</dd>
<dt>編曲</dt><dd>${normalizedCredit("arranger")}</dd>${
    s.type === "normal"
      ? game.id === "garupa"
        ? `<dt>3Dライブ</dt>
<dd>${s.live3d === true ? '<span class="pill">対応</span>' : s.live3d === false ? "非対応" : "確認中"}</dd>`
        : `<dt>MV</dt><dd>${s.mv === true ? '<span class="pill">あり</span>' : s.mv === false ? "なし" : "確認中"}</dd>`
      : `<dt>原曲アーティスト</dt>
<dd>${creditLinks(s.artist, "artist")}</dd>`
  }
<dt>原曲の使用作品・タイアップ</dt>
<dd>${e(s.work || "未登録")}</dd></dl>
</section>
</div>
${related.length ? `<section class="panel related-songs"><h2>同じ楽曲の別の譜面・収録先</h2><ul>${related.map((other) => `<li><a href="${e(siteURL(songPath(GAMES[other.gameId], other.stableSongId), base))}">${e(other.title)}</a><span>${e(GAMES[other.gameId].shortName)} · ${e(other.band)}</span></li>`).join("")}</ul></section>` : ""}
<aside class="panel song-report" aria-label="楽曲情報の訂正・報告"><p><span>この楽曲の情報に誤りがありますか？</span><a href="${e(reportURL)}"><span aria-hidden="true">→ </span>情報を訂正・報告</a></p></aside>
<p class="data-note">データセット更新記録：${date(data.updatedAt)} · 日本版</p>`;
}
