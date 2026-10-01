import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  NEWS_CATEGORY_LABELS,
  loadNews,
  prepareNews,
  renderNewsItems,
} from "../scripts/news.mjs";
import { OPERATOR_X_URL, siteSettings } from "../src/js/site-config.js";

const read = (path) => fs.readFileSync(`dist/${path}`, "utf8");
const entry = (date, title, category = "site") => ({
  date,
  title,
  description: `${title}の説明`,
  category,
});

test("news data is validated and sorted newest first with stable same-day order", () => {
  const sorted = prepareNews([
    entry("2026-09-01", "古い"),
    entry("2026-09-30", "同日1", "feature"),
    entry("2026-09-30", "同日2", "data"),
    entry("2026-10-01", "最新", "maintenance"),
  ]);
  assert.deepEqual(
    sorted.map(({ title }) => title),
    ["最新", "同日1", "同日2", "古い"],
  );
  const compact = renderNewsItems(sorted.slice(0, 3), { compact: true });
  assert.equal((compact.match(/<li class="news-item">/g) || []).length, 3);
  assert.ok(!compact.includes("古い"));
  assert.ok(!compact.includes("の説明"));
  for (const label of Object.values(NEWS_CATEGORY_LABELS))
    assert.ok(renderNewsItems(sorted).includes(label));
  assert.throws(() => prepareNews([entry("2026-02-30", "無効")]), /日付/);
  assert.throws(() => prepareNews([entry("2026-09-30", "")]), /title/);
  assert.throws(
    () => prepareNews([entry("2026-09-30", "不明", "unknown")]),
    /カテゴリ/,
  );
});

test("home and news page use the same source and expose the configured X profile", () => {
  const data = loadNews();
  const home = read("index.html");
  const news = read("news/index.html");
  const about = read("about/index.html");
  const footer = read("privacy/index.html");
  const base = siteSettings(process.env).basePath;
  assert.ok(data.length > 0);
  for (const item of data.slice(0, 3)) {
    assert.ok(home.includes(item.title));
    assert.ok(news.includes(item.title));
  }
  assert.equal(
    (home.match(/<li class="news-item">/g) || []).length,
    Math.min(3, data.length),
  );
  assert.equal(
    (news.match(/<li class="news-item">/g) || []).length,
    data.length,
  );
  assert.ok(home.includes(`href="${base}news/"`));
  assert.ok(
    home.indexOf('class="game-cards"') <
      home.indexOf('class="panel home-news"'),
  );
  assert.ok(
    home.indexOf('class="panel home-news"') <
      home.indexOf('class="panel home-x"'),
  );
  assert.ok(home.includes(`href="${OPERATOR_X_URL}"`));
  assert.ok(about.includes(`href="${OPERATOR_X_URL}"`));
  assert.ok(footer.includes(`href="${OPERATOR_X_URL}"`));
  assert.ok(footer.includes("X（タニマチ・外部サイト）"));
  assert.ok(about.includes("運営者タニマチのX（外部サイト）"));
  for (const item of data) {
    assert.ok(news.includes(`<time datetime="${item.date}">`));
    assert.ok(news.includes(item.date.replaceAll("-", ".")));
  }
  assert.ok(news.includes(">サイト</span>"));
  assert.ok(news.includes(data[0].description));
  assert.ok(!read("404.html").includes('class="news-list"'));
});

test("news page inherits canonical, OGP and sitemap metadata", () => {
  const { origin, basePath } = siteSettings(process.env);
  const canonical = `${origin}${basePath}news/`;
  const news = read("news/index.html");
  assert.ok(news.includes("<title>お知らせ | バンドリ楽曲録</title>"));
  assert.ok(news.includes(`<link rel="canonical" href="${canonical}"`));
  assert.ok(news.includes(`<meta property="og:url" content="${canonical}"`));
  assert.ok(news.includes('"@type": "BreadcrumbList"'));
  assert.ok(read("sitemap.xml").includes(`<loc>${canonical}</loc>`));
});
