import { siteURL, siteBase } from "./urls.js";
import { GAMES } from "./site-config.js";
import { normalize } from "./domain.js";
import { renderCrossSearch } from "./views.js";

const params = new URLSearchParams(location.search);
const q = params.get("q") || "";
document.querySelector("#search").value = q;
const results = document.querySelector("#cross-search-results");

if (normalize(q)) {
  results.setAttribute("aria-busy", "true");
  const notice = document.createElement("p");
  notice.className = "notice";
  notice.setAttribute("role", "status");
  notice.textContent = "全ゲームの検索用データを読み込んでいます。";
  results.prepend(notice);

  Promise.all(
    Object.values(GAMES).map(async (game) => {
      const response = await fetch(siteURL(game.catalog));
      if (!response.ok) throw new Error("Catalog unavailable");
      const data = await response.json();
      if (!Array.isArray(data.songs)) throw new Error("Invalid catalog");
      return [game.id, data];
    }),
  )
    .then((entries) => {
      results.innerHTML = renderCrossSearch(
        Object.fromEntries(entries),
        params,
        siteBase,
      );
    })
    .catch(() => {
      notice.setAttribute("role", "alert");
      notice.textContent =
        "全ゲームの検索用データを読み込めませんでした。接続を確認して再読み込みしてください。";
    })
    .finally(() => results.removeAttribute("aria-busy"));
}
