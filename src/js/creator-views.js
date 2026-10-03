import {
  CREDIT_ROLES,
  ROLE_LABELS,
  CREATOR_TYPES,
  creatorParticipation,
} from "./creators-data.js";
import { escapeHTML as e, safeJSON } from "./seo.js";
import { GAMES } from "./site-config.js";
import { siteURL, songPath } from "./urls.js";
import { roleCoverage, availableCreditRoles } from "./credit-coverage.js";
export const creatorPath = (creator) => `creators/${creator.slug}/`;
export const creatorSortLabels = {
  name: "名前順",
  total: "参加楽曲数順",
  lyricist: "作詞曲数順",
  composer: "作曲曲数順",
  arranger: "編曲曲数順",
};
export function filterCreatorWorks(participation, creatorId, params) {
  const role = CREDIT_ROLES.includes(params.get("role"))
    ? params.get("role")
    : "";
  const game = Object.hasOwn(GAMES, params.get("game"))
    ? params.get("game")
    : "";
  return participation.works.filter((w) =>
    w.records.some(
      (s) =>
        (!game || s.gameId === game) &&
        (!role ||
          s.credits
            .find((c) => c.creatorId === creatorId)
            ?.roles.includes(role)),
    ),
  );
}
const coverageNotice =
  '<p class="notice">作詞・編曲などの「未整備」は、サイト全体でその担当のデータ整備が完了していないことを示します。担当していないことを意味しません。</p>';
const counts = (stats, coverage, detail = false) =>
  `<dl class="creator-counts"><div><dt>参加楽曲数</dt><dd>${stats.total}</dd></div>${CREDIT_ROLES.filter(
    (r) => detail || coverage[r] === "ready",
  )
    .map(
      (r) =>
        `<div><dt>${ROLE_LABELS[r]}曲数</dt><dd>${coverage[r] === "ready" ? stats[r] : '<span class="notice">未整備</span>'}</dd></div>`,
    )
    .join("")}</dl>`;
export function renderCreators(creators, songs, base, coverage) {
  coverage = roleCoverage(coverage);
  const sorts = Object.entries(creatorSortLabels).filter(
    ([v]) => !CREDIT_ROLES.includes(v) || coverage[v] === "ready",
  );
  const entries = creators
    .map((c) => ({ ...c, stats: creatorParticipation(c.id, songs) }))
    .sort(
      (a, b) =>
        a.sortKey.localeCompare(b.sortKey, "ja") || a.id.localeCompare(b.id),
    );
  return `<h1>クリエイター</h1><p>掲載楽曲の作詞・作曲・編曲者を探せます。参加楽曲数は同じ作品の複数収録を1曲として数えます。</p><p class="notice">同定が確認できたクレジットから登録しています。未確認の表記は楽曲詳細で従来どおり表示します。</p>${coverageNotice}
<form id="creator-controls" class="creator-controls" role="search" method="get"><label for="creator-search">名前・別名で検索<input type="search" id="creator-search" name="q"></label><label for="creator-sort">並べ替え<select id="creator-sort" name="sort">${Object.entries(
    Object.fromEntries(sorts),
  )
    .map(([v, l]) => `<option value="${v}">${l}</option>`)
    .join("")}</select></label><button>表示する</button></form>
<p id="creator-result-status" role="status">${entries.length}件のクリエイター</p><div class="creator-list">${entries.map((c) => `<article class="panel creator-card" data-creator-id="${c.id}" data-total="${c.stats.total}" ${CREDIT_ROLES.map((r) => `data-${r}="${c.stats[r]}"`).join(" ")}><h2><a href="${e(siteURL(creatorPath(c), base))}">${e(c.name)}</a></h2><p>${CREATOR_TYPES[c.type]}</p>${counts(c.stats, coverage)}</article>`).join("")}</div><p id="creator-empty" class="notice" hidden>条件に該当するクリエイターはいません。</p>
<script id="creator-page-data" type="application/json">${safeJSON({ creators: entries.map(({ stats, ...c }) => c), roleCoverage: coverage })}</script>`;
}
export function renderCreatorDetail(creator, songs, works, base, coverage) {
  coverage = roleCoverage(coverage);
  const stats = creatorParticipation(creator.id, songs);
  const byId = new Map(works.map((w) => [w.id, w]));
  return `<a class="back" href="${siteURL("creators/", base)}">← クリエイター一覧に戻る</a><h1>${e(creator.name)}</h1><p>${CREATOR_TYPES[creator.type]}</p><section class="panel"><h2>参加クレジット</h2>${counts(stats, coverage, true)}<p>収録件数：${stats.recordings}件</p><p class="notice">上記は全収録の総数です。同じWorkは参加楽曲数とrole別曲数で1曲、収録件数では別々に数えます。下の絞り込みで総数は変わりません。</p>${coverageNotice}</section>
<form id="creator-controls" class="creator-controls" method="get"><label for="creator-role">担当<select id="creator-role" name="role"><option value="">すべて</option>${availableCreditRoles(
    coverage,
  )
    .map((r) => `<option value="${r}">${ROLE_LABELS[r]}</option>`)
    .join(
      "",
    )}</select></label><label for="creator-game">収録ゲーム<select id="creator-game" name="game"><option value="">すべて</option>${Object.values(
    GAMES,
  )
    .map((g) => `<option value="${g.id}">${g.shortName}</option>`)
    .join(
      "",
    )}</select></label><button>絞り込む</button></form><p id="creator-coverage-status" role="status"></p><p id="creator-result-status" role="status">表示：${stats.total}作品</p>
<div class="creator-work-list">${stats.works
    .sort(
      (a, b) =>
        (byId.get(a.workId)?.title ?? "").localeCompare(
          byId.get(b.workId)?.title ?? "",
          "ja",
        ) || a.workId.localeCompare(b.workId),
    )
    .map(
      (w) =>
        `<article class="panel creator-work" data-work-id="${w.workId}"><h2>${e(byId.get(w.workId)?.title ?? w.records[0].title)}</h2><p>${e([...new Set(w.records.map((s) => s.band))].join(" / "))}</p><p>${w.roles.map((r) => ROLE_LABELS[r]).join("・")}</p><ul>${w.records
          .map(
            (s) =>
              `<li data-game="${s.gameId}" data-roles="${s.credits.find((c) => c.creatorId === creator.id).roles.join(" ")}"><a href="${e(siteURL(songPath(GAMES[s.gameId], s.stableSongId ?? String(s.id)), base))}">${e(GAMES[s.gameId].shortName)}：${e(s.title)}</a> <span>${s.credits
                .find((c) => c.creatorId === creator.id)
                .roles.map((r) => ROLE_LABELS[r])
                .join("・")}</span></li>`,
          )
          .join("")}</ul></article>`,
    )
    .join(
      "",
    )}</div><p id="creator-empty" class="notice" ${stats.total ? "hidden" : ""}>条件に該当する参加楽曲はありません。</p><script id="creator-page-data" type="application/json">${safeJSON({ creatorId: creator.id, roleCoverage: coverage })}</script>`;
}
