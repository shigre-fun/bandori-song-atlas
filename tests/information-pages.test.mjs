import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { GAMES, siteSettings } from "../src/js/site-config.js";

const readPage = (path) => fs.readFileSync(`dist/${path}/index.html`, "utf8");
const plainText = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

test("information pages explain ownership, source priorities and privacy clearly", () => {
  const about = readPage("about");
  const sources = readPage("sources");
  const privacy = readPage("privacy");
  const aboutText = plainText(about);
  const sourceText = plainText(sources);
  const privacyText = plainText(privacy);

  for (const phrase of [
    "非公式ファンデータベース",
    "ガールズバンドパーティ！",
    "BanG Dream! Our Notes",
    "関係・提携のない非公式サイト",
    "運営：タニマチ",
    "権利者に帰属",
    "完全性は保証していません",
  ])
    assert.ok(aboutText.includes(phrase), phrase);
  assert.match(
    about,
    new RegExp(`href="${siteSettings(process.env).basePath}contact/"`),
  );

  for (const phrase of [
    "ガルパおよびアワーノーツ",
    "推測した数値で埋めません",
    "現在のゲーム内表示",
    "公式サイト・公式のお知らせ",
    "運営者による確認・計測",
    "公式発表値とは限りません",
    "データセット更新記録",
  ])
    assert.ok(sourceText.includes(phrase), phrase);
  for (const href of [
    "https://bang-dream.com/",
    "https://bang-dream.bushimo.jp/music/",
    "https://bang-dream-on.bushimo.jp/",
  ])
    assert.ok(sources.includes(`href="${href}"`), href);

  for (const phrase of [
    "Cloudflare Pages",
    "IPアドレス",
    "Cloudflare Web Analytics",
    "個人データを収集・利用せず",
    "通常の閲覧",
    "管理ページについて（運営者向け）",
    "GitHub API",
    "第三者配信広告は設置していません",
    "プライバシーポリシーの変更",
  ])
    assert.ok(privacyText.includes(phrase), phrase);
  assert.ok(
    privacy.includes('href="https://www.cloudflare.com/policies/privacy/"'),
  );
  assert.ok(
    privacy.includes(
      'href="https://developers.cloudflare.com/web-analytics/about/"',
    ),
  );
  assert.ok(
    privacy.includes(
      'href="https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/"',
    ),
  );
  assert.match(
    privacy,
    /最終更新：\s*<time datetime="2026-09-30">2026-09-30<\/time>/,
  );
});

test("information pages retain natural SEO metadata and footer links", () => {
  const { origin, basePath } = siteSettings(process.env);
  const sitemap = fs.readFileSync("dist/sitemap.xml", "utf8");
  for (const [slug, title] of [
    ["about", "サイトについて"],
    ["sources", "データ出典・更新方針"],
    ["privacy", "プライバシーポリシー"],
    ["contact", "お問い合わせ"],
  ]) {
    const html = readPage(slug);
    const canonical = `${origin}${basePath}${slug}/`;
    assert.ok(html.includes(`<title>${title} | バンドリ楽曲録</title>`));
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`));
    assert.ok(sitemap.includes(`<loc>${canonical}</loc>`));
    assert.match(html, /<meta\s+name="description"\s+content="[^"]+"/);
    assert.ok(html.includes('property="og:image"'));
    assert.ok(html.includes('"@type": "BreadcrumbList"'));
    for (const footer of ["about/", "sources/", "privacy/", "contact/"])
      assert.ok(html.includes(`href="${basePath}${footer}"`));
  }
});

test("list and detail pages label the recorded dataset date accurately", () => {
  for (const game of Object.values(GAMES)) {
    const catalog = JSON.parse(
      fs.readFileSync(`dist/${game.slug}/songs.json`, "utf8"),
    );
    const recordedDate = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(catalog.updatedAt));
    const list = readPage(`${game.slug}/songs`);
    const detail = readPage(
      `${game.slug}/songs/${catalog.songs[0].stableSongId}`,
    );
    assert.ok(list.includes(`データセット更新記録：${recordedDate}`));
    assert.ok(detail.includes(`データセット更新記録：${recordedDate}`));
    assert.ok(!detail.includes("データ更新："));
  }
});
