import fs from "node:fs";
import { escapeHTML } from "../src/js/seo.js";
import { NEWS_CATEGORY_LABELS, prepareNews } from "../src/js/news-data.js";

export { NEWS_CATEGORY_LABELS, prepareNews };

export function loadNews(file = "data/news.json") {
  return prepareNews(JSON.parse(fs.readFileSync(file, "utf8")));
}

export function renderNewsItems(entries, { compact = false } = {}) {
  if (!entries.length)
    return '<p class="news-empty">現在お知らせはありません。</p>';
  const heading = compact ? "h3" : "h2";
  return `<ol class="news-list${compact ? " news-list-compact" : ""}">${entries
    .map(
      ({ date, title, description, category }) => `<li class="news-item">
  <div class="news-meta"><time datetime="${escapeHTML(date)}">${escapeHTML(date.replaceAll("-", "."))}</time><span class="news-category">${escapeHTML(NEWS_CATEGORY_LABELS[category])}</span></div>
  <${heading}>${escapeHTML(title)}</${heading}>${compact ? "" : `<p>${escapeHTML(description)}</p>`}
</li>`,
    )
    .join("")}</ol>`;
}
