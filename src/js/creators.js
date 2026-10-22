import { searchCreators, CREDIT_ROLES } from "./creators-data.js";
import { creatorSortLabels, creatorPagination } from "./creator-views.js";
import { roleCoverage, availableCreditRoles } from "./credit-coverage.js";
const form = document.querySelector("#creator-controls");
const searchForm = document.querySelector("#creator-search-form");
const searchInput = document.querySelector("#creator-search");
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
    if (searchInput) searchInput.value = query;
    if (searchForm) searchForm.elements.sort.value = sort;
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
    const records = [...document.querySelectorAll(".creator-record")];
    const matching = records.filter(
      (record) =>
        (!role || record.dataset.roles.split(" ").includes(role)) &&
        (!game || record.dataset.game === game),
    );
    const pagination = creatorPagination(
      matching.length,
      params,
      location.pathname,
    );
    const visible = new Set(matching.slice(pagination.start, pagination.end));
    for (const record of records) record.hidden = !visible.has(record);
    for (const card of document.querySelectorAll(".creator-work"))
      card.hidden = ![...card.querySelectorAll(".creator-record")].some(
        (record) => visible.has(record),
      );
    document.querySelector("#creator-pagination").innerHTML = pagination.html;
    status.textContent = `表示：${matching.length ? pagination.start + 1 : 0}–${pagination.end} / ${matching.length}曲`;
    document.querySelector("#creator-empty").hidden = matching.length > 0;
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
form.addEventListener("change", (event) => {
  if (event.target.tagName === "SELECT") form.requestSubmit();
});
if (data.creators)
  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (searchInput.value) params.set("q", searchInput.value);
    if (form.elements.sort.value !== "name")
      params.set("sort", form.elements.sort.value);
    history.pushState(
      null,
      "",
      location.pathname + (params.size ? `?${params}` : ""),
    );
    apply();
  });
addEventListener("popstate", apply);
document
  .querySelector("#creator-pagination")
  ?.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (
      !link ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    history.pushState(null, "", link.href);
    apply();
    document
      .querySelector("#creator-result-status")
      .scrollIntoView({ block: "start" });
  });
apply();
