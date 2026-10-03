import { searchCreators, CREDIT_ROLES } from "./creators-data.js";
import { creatorSortLabels } from "./creator-views.js";
import { roleCoverage, availableCreditRoles } from "./credit-coverage.js";
const form = document.querySelector("#creator-controls");
const data = JSON.parse(
  document.querySelector("#creator-page-data").textContent,
);
const status = document.querySelector("#creator-result-status");
const coverage = roleCoverage(data.roleCoverage);
function apply() {
  const params = new URLSearchParams(location.search);
  if (data.creators) {
    const query = params.get("q") ?? "",
      sort =
        Object.hasOwn(creatorSortLabels, params.get("sort")) &&
        (!CREDIT_ROLES.includes(params.get("sort")) ||
          coverage[params.get("sort")] !== "unprepared")
          ? params.get("sort")
          : "name";
    form.elements.q.value = query;
    form.elements.sort.value = sort;
    const matching = new Set(
      searchCreators(data.creators, query).map((c) => c.id),
    );
    const byId = new Map(data.creators.map((c) => [c.id, c]));
    const list = document.querySelector(".creator-list"),
      cards = [...list.children];
    cards.sort(
      (a, b) =>
        (sort === "name"
          ? 0
          : Number(b.dataset[sort]) - Number(a.dataset[sort])) ||
        byId
          .get(a.dataset.creatorId)
          .sortKey.localeCompare(byId.get(b.dataset.creatorId).sortKey, "ja") ||
        a.dataset.creatorId.localeCompare(b.dataset.creatorId),
    );
    for (const card of cards) {
      card.hidden = !matching.has(card.dataset.creatorId);
      list.append(card);
    }
    status.textContent = `${matching.size}件のクリエイター`;
    document.querySelector("#creator-empty").hidden = matching.size > 0;
  } else {
    const role = availableCreditRoles(coverage).includes(params.get("role"))
        ? params.get("role")
        : "",
      game = ["garupa", "ournotes"].includes(params.get("game"))
        ? params.get("game")
        : "";
    form.elements.role.value = role;
    document.querySelector("#creator-coverage-status").textContent =
      CREDIT_ROLES.includes(params.get("role")) &&
      roleCoverage(data.roleCoverage, game)[params.get("role")] === "unprepared"
        ? "指定した担当はデータ整備中です。担当では絞り込まず、登録済みの参加作品を表示します。"
        : roleCoverage(data.roleCoverage, game).arranger === "partial" &&
            (!role || role === "arranger")
          ? "アワーノーツの編曲は一部登録です。確認済みの登録分を表示しています。未整備は担当者なしを意味しません。"
          : "";
    form.elements.game.value = game;
    let count = 0;
    for (const card of document.querySelectorAll(".creator-work")) {
      let show = false;
      for (const record of card.querySelectorAll("li[data-game]")) {
        record.hidden = Boolean(
          (role && !record.dataset.roles.split(" ").includes(role)) ||
            (game && record.dataset.game !== game),
        );
        if (!record.hidden) show = true;
      }
      card.hidden = !show;
      if (show) count++;
    }
    status.textContent = `表示：${count}作品`;
    document.querySelector("#creator-empty").hidden = count > 0;
  }
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(form))
    if (value && !(key === "sort" && value === "name")) params.set(key, value);
  history.pushState(
    null,
    "",
    location.pathname + (params.size ? `?${params}` : ""),
  );
  apply();
});
form.addEventListener("change", () => form.requestSubmit());
if (data.creators)
  form.elements.q.addEventListener("input", () => form.requestSubmit());
addEventListener("popstate", apply);
apply();
