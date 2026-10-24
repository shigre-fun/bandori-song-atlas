import { siteURL, siteBase } from "./urls.js";
import { GAMES } from "./site-config.js";
import { renderCrossSearch } from "./views.js";
import { connectSongControls } from "./song-controls.js";
const params = new URLSearchParams(location.search);
const input = document.querySelector("#search");
if (input) input.value = params.get("q") || "";
const results = document.querySelector("#cross-search-results");
results.setAttribute("aria-busy", "true");
const notice = document.createElement("p");
notice.className = "notice";
notice.setAttribute("role", "status");
notice.textContent = "全ゲームの検索用データを読み込んでいます。";
if (params.get("q")) results.prepend(notice);
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
    if (params.size)
      results.innerHTML = renderCrossSearch(
        Object.fromEntries(entries),
        params,
        siteBase,
      );
    connectSongControls(params);
    notice.hidden = true;
  })
  .catch(() => {
    notice.hidden = false;
    notice.setAttribute("role", "alert");
    notice.textContent =
      "全ゲームの検索用データを読み込めませんでした。接続を確認して再読み込みしてください。";
    results.prepend(notice);
  })
  .finally(() => results.removeAttribute("aria-busy"));
