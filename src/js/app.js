import { siteURL, siteBase, songListPath } from "./urls.js";
import { GAMES } from "./site-config.js";
import { renderList } from "./views.js";
import { connectSongControls } from "./song-controls.js";
import { searchPage } from "./domain.js";
const pagePath = "/" + location.pathname.slice(siteBase.length);
const params = new URLSearchParams(location.search);
const pageGame = Object.values(GAMES).find((game) =>
  pagePath.startsWith("/" + game.slug + "/"),
);
const listURL = (values, game = GAMES.garupa) =>
  siteURL(songListPath(game) + "?" + new URLSearchParams(values));
if (
  pagePath === "/" &&
  ["q", "sort", "page", "difficulty", "direction", "type", "band"].some((key) =>
    params.has(key),
  )
) {
  location.replace(listURL(params));
} else {
  const search = document.querySelector("#search");
  if (search) search.value = params.get("q") || "";
  const backLink = document.querySelector(".back");
  if (backLink && params.size && pageGame) {
    if (params.get("from") === "search") {
      const state = new URLSearchParams({
        q: params.get("q") || "",
        page: String(searchPage(params)),
      });
      for (const [key, value] of params)
        if (!["from", "q", "page"].includes(key)) state.append(key, value);
      backLink.href = siteURL("search/?" + state);
      backLink.textContent = "← 全ゲームの検索結果に戻る";
    } else backLink.href = listURL(params, pageGame);
  }
  if (pageGame && pagePath === "/" + songListPath(pageGame)) {
    fetch(siteURL(pageGame.catalog))
      .then((response) => {
        if (!response.ok) throw Error("Catalog unavailable");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.songs)) throw Error("Invalid catalog");
        if (params.size)
          document.querySelector("#app-content").innerHTML = renderList(
            data,
            params,
            siteBase,
            pageGame,
          );
        connectSongControls(params);
      })
      .catch(() => {
        const notice = document.createElement("p");
        notice.className = "notice";
        notice.setAttribute("role", "alert");
        notice.textContent =
          "検索用データを読み込めませんでした。接続を確認して再読み込みしてください。";
        document.querySelector("#app-content").prepend(notice);
      });
  }
}
