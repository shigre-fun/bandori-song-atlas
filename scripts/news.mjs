import fs from "node:fs";
import { escapeHTML } from "../src/js/seo.js";

export const NEWS_CATEGORY_LABELS = Object.freeze({
  site: "サイト",
  data: "データ更新",
  feature: "機能追加",
  maintenance: "メンテナンス",
});

export function prepareNews(entries) {
  if (!Array.isArray(entries))
    throw new Error("お知らせは配列にしてください。");
  return entries
    .map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        throw new Error(`お知らせ${index + 1}件目が不正です。`);
      for (const field of ["date", "title", "description", "category"])
        if (typeof entry[field] !== "string" || !entry[field].trim())
          throw new Error(`お知らせ${index + 1}件目の${field}が不正です。`);
      const { date, title, description, category } = entry;
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
      )
        throw new Error(`お知らせ${index + 1}件目の日付が不正です。`);
      if (!Object.hasOwn(NEWS_CATEGORY_LABELS, category))
        throw new Error(`お知らせ${index + 1}件目のカテゴリが不正です。`);
      return { date, title, description, category, index };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.index - b.index)
    .map(({ index, ...entry }) => entry);
}

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
