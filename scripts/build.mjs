import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { format } from "prettier";
import { loadGameCatalog } from "./catalog.mjs";
import { generateBrandAssets } from "./assets/create-brand-assets.mjs";
import {
  GAMES,
  SITE_DESCRIPTION,
  siteSettings,
} from "../src/js/site-config.js";
import { GARUPA_LEGACY_PATH } from "../src/js/garupa-data.js";
import {
  absoluteURL,
  siteURL,
  songListPath,
  songPath,
} from "../src/js/urls.js";
import { renderList, renderDetail } from "../src/js/views.js";
import {
  relatedSongs,
  validateRelatedSongIds,
} from "../src/js/related-songs.js";
import {
  escapeHTML,
  safeJSON,
  detailTitle,
  detailDescription,
  breadcrumbMarkup,
  breadcrumbJSON,
} from "../src/js/seo.js";

const settings = siteSettings(process.env);
const output = path.resolve(process.env.SITE_OUTPUT_DIR || "dist");
const repositoryRoot = process.cwd();
const distRoot = path.resolve("dist");
const cacheRoot = path.resolve(".cache");
if (!(output === distRoot || output.startsWith(cacheRoot + path.sep)))
  throw new Error("SITE_OUTPUT_DIRはdistまたは.cache内にしてください。");
if (output === repositoryRoot || output === path.parse(output).root)
  throw new Error("不正な出力先です。");
if (
  fs.existsSync(output) &&
  (fs.lstatSync(output).isSymbolicLink() ||
    !fs.realpathSync(output).startsWith(repositoryRoot + path.sep))
)
  throw new Error("出力先はリポジトリ内の通常ディレクトリにしてください。");
const games = Object.values(GAMES);
const catalogs = Object.fromEntries(
  games.map((game) => [game.id, loadGameCatalog(game)]),
);
validateRelatedSongIds(catalogs);
const garupaSongs = catalogs.garupa;
const siteData = JSON.parse(fs.readFileSync("data/settings.json", "utf8"));
const adminStates = Object.fromEntries(
  games.map((game) => [
    game.id,
    JSON.parse(fs.readFileSync(game.stateFile, "utf8")),
  ]),
);
for (const game of games) {
  const state = adminStates[game.id];
  if (
    !Number.isSafeInteger(state.nextId) ||
    state.nextId <= Math.max(0, ...catalogs[game.id].map((song) => song.id))
  )
    throw new Error(
      `${game.stateFile} の nextId を全楽曲のidより大きくしてください。`,
    );
}
if (Date.parse(adminStates.garupa.updatedAt) > Date.parse(siteData.updatedAt))
  siteData.updatedAt = adminStates.garupa.updatedAt;
const catalogInfo = Object.fromEntries(
  games.map((game) => [
    game.id,
    {
      ...siteData,
      ...(game.id === "ournotes"
        ? { updatedAt: adminStates.ournotes.updatedAt }
        : {}),
      songs: catalogs[game.id],
    },
  ]),
);

const legacy = JSON.parse(fs.readFileSync(GARUPA_LEGACY_PATH, "utf8"));
const knownIds = new Set(garupaSongs.map((song) => song.stableSongId));
const seenLegacyPaths = new Set();
const redirects = [];
for (const entry of legacy) {
  if (
    entry.gameId !== "garupa" ||
    !knownIds.has(entry.stableSongId) ||
    !Array.isArray(entry.slugs) ||
    !entry.slugs.length
  )
    throw new Error("旧URL対応表に不正な楽曲IDまたはパスがあります。");
  for (const slug of entry.slugs) {
    if (
      typeof slug !== "string" ||
      !slug ||
      slug.includes("/") ||
      slug === "." ||
      slug === ".."
    )
      throw new Error("旧URL対応表の曲名パスが不正です。");
    const source = `/songs/${encodeURIComponent(slug)}/`;
    if (seenLegacyPaths.has(source.toLowerCase()))
      throw new Error(`旧URLが重複しています: ${source}`);
    seenLegacyPaths.add(source.toLowerCase());
    redirects.push({
      from: source,
      to: `/${songPath(GAMES.garupa, entry.stableSongId)}`,
      stableSongId: entry.stableSongId,
      slug,
    });
  }
}

const template = fs.readFileSync("src/pages/template.html", "utf8");
const write = (relative, content) => {
  const file = path.resolve(output, relative);
  if (!file.startsWith(output + path.sep))
    throw new Error(`不正な生成パス: ${relative}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};
const url = (relative) => absoluteURL(relative, settings);
const local = (relative) => siteURL(relative, settings.basePath);
const xmlEscape = (value) => escapeHTML(value).replace(/&#39;/g, "&apos;");
const sitemap = [];
const home = { name: "サイトトップ", path: "" };
const listCrumb = (game) => ({
  name: `${game.shortName} 楽曲一覧`,
  path: songListPath(game),
});

async function page({
  file,
  pagePath,
  title,
  description,
  content,
  breadcrumbs = [home],
  indexable = true,
  headerSearch = true,
  imagePath = settings.assets.siteOg,
  imageAlt = `${settings.name} - ${SITE_DESCRIPTION}`,
  scripts = [],
  jsonld = [],
}) {
  const searchGame =
    games.find((game) => pagePath.startsWith(`${game.slug}/`)) || GAMES.garupa;
  const canonical = url(pagePath);
  const image = url(imagePath);
  const head = [
    `<title>${escapeHTML(title)}</title>`,
    `<meta name="description" content="${escapeHTML(description)}" />`,
    `<link rel="canonical" href="${escapeHTML(canonical)}" />`,
    ...(!indexable ? ['<meta name="robots" content="noindex,follow" />'] : []),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHTML(title)}" />`,
    `<meta property="og:description" content="${escapeHTML(description)}" />`,
    `<meta property="og:url" content="${escapeHTML(canonical)}" />`,
    `<meta property="og:site_name" content="${escapeHTML(settings.name)}" />`,
    `<meta property="og:image" content="${escapeHTML(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHTML(imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHTML(title)}" />`,
    `<meta name="twitter:description" content="${escapeHTML(description)}" />`,
    `<meta name="twitter:image" content="${escapeHTML(image)}" />`,
    `<link rel="icon" href="${escapeHTML(local(settings.assets.favicon))}" type="image/svg+xml" />`,
    `<link rel="icon" href="${escapeHTML(local(settings.assets.faviconPng))}" type="image/png" sizes="32x32" />`,
    `<link rel="apple-touch-icon" href="${escapeHTML(local(settings.assets.appleTouchIcon))}" sizes="180x180" />`,
    `<link rel="stylesheet" href="${escapeHTML(local("style.css"))}" />`,
    `<link rel="stylesheet" href="${escapeHTML(local("mobile.css"))}" />`,
    ...scripts.map(
      (script) =>
        `<script ${script === "query-index.js" ? `data-index-page="${pagePath ? "list" : "root"}" ` : 'type="module" '}src="${escapeHTML(local(script))}"></script>`,
    ),
    ...[breadcrumbJSON(breadcrumbs, settings), ...jsonld]
      .filter(Boolean)
      .map(
        (value) =>
          `<script type="application/ld+json">${safeJSON(value)}</script>`,
      ),
  ].join("\n");
  const body =
    breadcrumbMarkup(breadcrumbs, settings) +
    `<div id="app-content">${content}</div>`;
  const searchForm = headerSearch
    ? `<form action="${escapeHTML(local(songListPath(searchGame)))}" role="search">
        <label class="sr-only" for="search">${escapeHTML(searchGame.shortName)}の楽曲名・原曲の作品名で検索</label>
        <span aria-hidden="true">⌕</span>
        <input id="search" name="q" type="search" placeholder="${escapeHTML(searchGame.shortName)}の楽曲名・作品名で検索" autocomplete="off" />
        <button>検索</button>
      </form>`
    : "";
  const replacements = {
    "<!--HEAD-->": head,
    "<!--CONTENT-->": body,
    "<!--HOME_URL-->": local(""),
    "<!--LOGO_URL-->": local(settings.assets.favicon),
    "<!--GARUPA_URL-->": local(songListPath(GAMES.garupa)),
    "<!--OURNOTES_URL-->": local(songListPath(GAMES.ournotes)),
    "<!--ABOUT_URL-->": local("about/"),
    "<!--SOURCES_URL-->": local("sources/"),
    "<!--PRIVACY_URL-->": local("privacy/"),
    "<!--HEADER_SEARCH-->": searchForm,
    "<!--SITE_NAME-->": escapeHTML(settings.name),
  };
  let html = template;
  for (const [needle, replacement] of Object.entries(replacements))
    html = html.replaceAll(needle, replacement);
  write(file, await format(html, { parser: "html", printWidth: 100 }));
  if (indexable) sitemap.push(canonical);
}

// distと検証用.cache出力のみを再生成する。旧ページや削除曲の残骸を残さない。
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const songImages = await generateBrandAssets(output, catalogs, games, settings);
const adminModules = new Set([
  "admin.js",
  "related-song-picker.js",
  "github-store.js",
  "garupa-data.js",
  "song-schema.js",
  "site-config.js",
  "urls.js",
]);
const adminAssetVersion = crypto
  .createHash("sha256")
  .update(fs.readFileSync("src/pages/admin.html"))
  .update(fs.readFileSync("src/styles/admin.css"))
  .update(
    [...adminModules]
      .map((name) => fs.readFileSync(`src/js/${name}`, "utf8"))
      .join("\n"),
  )
  .digest("hex")
  .slice(0, 12);
for (const [directory, names] of [
  [
    "js",
    [
      "app.js",
      "domain.js",
      "views.js",
      "related-songs.js",
      "urls.js",
      "site-config.js",
      "seo.js",
      "song-schema.js",
      "garupa-data.js",
      "github-store.js",
      "admin.js",
      "related-song-picker.js",
      "query-index.js",
      "legacy-redirect.js",
    ],
  ],
  ["styles", ["style.css", "mobile.css", "admin.css"]],
  ["images", ["favicon.svg"]],
  ["static", ["_headers"]],
])
  for (const name of names)
    if (directory === "js" && adminModules.has(name)) {
      const source = fs.readFileSync(`src/${directory}/${name}`, "utf8");
      write(
        name,
        source.replace(
          /from "(\.\/[^"?]+\.js)"/g,
          `from "$1?v=${adminAssetVersion}"`,
        ),
      );
    } else fs.copyFileSync(`src/${directory}/${name}`, path.join(output, name));

write(GAMES.garupa.catalog, JSON.stringify(catalogInfo.garupa, null, 2) + "\n");
write(
  GAMES.ournotes.catalog,
  JSON.stringify(catalogInfo.ournotes, null, 2) + "\n",
);
// 既存の公開カタログを参照する古いブックマークと管理画面の移行期間用。
write(
  "songs.json",
  JSON.stringify({ ...siteData, songs: garupaSongs }, null, 2) + "\n",
);

await page({
  file: "index.html",
  pagePath: "",
  headerSearch: false,
  title: `${settings.name} | バンドリ楽曲データベース`,
  description:
    "ガルパとアワーノーツの楽曲データを探せる非公式データベース。ゲームごとの楽曲一覧と情報を公開しています。",
  content: `<section class="intro"><div><p class="eyebrow">BANG DREAM! · SONG DATABASE</p><h1>${escapeHTML(settings.name)}</h1><p>バンドリの楽曲情報をゲームごとに探せます。</p></div></section><div class="game-cards">${games.map((game) => `<section class="panel"><h2>${escapeHTML(game.name)}</h2><p>${catalogs[game.id].length}曲を掲載しています。</p><a href="${local(songListPath(game))}">楽曲一覧を見る</a></section>`).join("")}</div>`,
  scripts: ["query-index.js", "app.js"],
  jsonld: [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.name,
      url: url(""),
      ...(settings.alternateName
        ? { alternateName: settings.alternateName }
        : {}),
    },
  ],
});

for (const game of games) {
  const songs = catalogs[game.id];
  await page({
    file: `${game.slug}/songs/index.html`,
    pagePath: songListPath(game),
    title: `${game.seoName} 楽曲一覧${game.fields.includes("bpm") ? "・BPM・難易度・ノーツ数" : ""} | ${settings.name}`,
    description: `${game.name}の${songs.length}曲を曲名・バンド${game.fields.includes("level") ? "・難易度" : "・種類"}などで検索できます。`,
    breadcrumbs: [home, listCrumb(game)],
    content: renderList(
      catalogInfo[game.id],
      new URLSearchParams(),
      settings.basePath,
      game,
    ),
    scripts: ["query-index.js", "app.js"],
  });
  for (const song of songs) {
    if (!/^[A-Za-z0-9_-]+$/.test(song.stableSongId))
      throw new Error(`${game.slug}のstableSongIdが不正です。`);
    if (game.id === "garupa" && !/^[1-9][0-9]*$/.test(song.stableSongId))
      throw new Error("ガルパのstableSongIdは正の整数にしてください。");
    const imagePath = songImages.get(`${game.id}:${song.stableSongId}`);
    if (!imagePath)
      throw new Error(
        `楽曲OGP画像がありません: ${game.id}/${song.stableSongId}`,
      );
    await page({
      file: `${game.slug}/songs/${song.stableSongId}/index.html`,
      pagePath: songPath(game, song.stableSongId),
      title: detailTitle(song, game, songs),
      description: detailDescription(song, game),
      imagePath,
      imageAlt: `「${song.title}」 - ${song.band || song.artist} / ${game.shortName} | ${settings.name}`,
      breadcrumbs: [
        home,
        listCrumb(game),
        { name: song.title, path: songPath(game, song.stableSongId) },
      ],
      content: renderDetail(
        song,
        catalogInfo[game.id],
        new URLSearchParams(),
        settings.basePath,
        game,
        relatedSongs(song, catalogs),
      ),
      scripts: ["app.js"],
    });
  }
}

// 本文を変更した日だけ更新する。ビルド日時からは算出しない。
const privacyUpdatedOn = "2026-09-29";
const informationPages = [
  {
    slug: "about",
    name: "サイトについて",
    description: `${settings.name}の目的と運営者、非公式サイトとしての立場、掲載情報の扱いを説明します。`,
    content: `<h1>サイトについて</h1><section class="panel">
<h2>このサイトについて</h2>
<p>${escapeHTML(settings.name)}は、「バンドリ！ ガールズバンドパーティ！」と「BanG Dream! Our Notes」の楽曲情報を、ゲームごとに検索・参照しやすい形で整理する個人運営の非公式ファンデータベースです。</p>
<p>運営：タニマチ</p>
<h2>非公式サイトについて</h2>
<p>本サイトは株式会社ブシロード、BanG Dream! Project、各ゲームの運営会社その他の関係各社とは関係・提携のない非公式サイトです。公式サイト・公式サービスではありません。</p>
<h2>権利について</h2>
<p>BanG Dream!、各ゲーム、楽曲、バンドその他関連する名称・商標・著作物等の権利は、それぞれの権利者に帰属します。</p>
<h2>掲載情報について</h2>
<p>正確で新しい情報の掲載に努めていますが、ゲームの更新や確認・反映までの時間差により、実際のゲーム内情報と異なる場合があります。掲載情報の完全性は保証していません。</p>
<h2>ご連絡</h2>
<p>データの誤り、権利関係、その他のご連絡は<a href="https://github.com/shigre-fun/bandori-song-atlas/issues">GitHub Issues</a>からお願いします。投稿内容は公開されます。</p>
</section>`,
  },
  {
    slug: "sources",
    name: "データ出典・更新方針",
    description: `${settings.name}のガルパ・アワーノーツ楽曲情報の出典、確認の優先順位、計測値の扱いを説明します。`,
    content: `<h1>データ出典・更新方針</h1><section class="panel">
<h2>データの管理</h2>
<p>ガルパおよびアワーノーツの楽曲情報は、原則として各ゲーム内で確認できる情報、公式サイト・公式のお知らせ、その他の公式公開資料を参照して手動で管理しています。既存のガルパの数値には、公開データとの照合や運営者の調査に基づくものもあります。確認できない項目は未確認とし、推測した数値で埋めません。</p>
<h2>確認時の優先順位</h2>
<ol><li>現在のゲーム内表示</li><li>公式サイト・公式のお知らせ</li><li>その他の公式公開資料</li><li>運営者による確認・計測</li></ol>
<p>過去の公式資料と現在のゲーム内表示が異なる場合は、原則として現在のゲーム内表示を優先して修正します。</p>
<h2>BPMと演奏時間</h2>
<p>基本BPMは楽曲中で継続時間が最も長いBPM値を採用します。演奏時間はガルパではリハーサルモードに表示される時間を使用し、アワーノーツでは実測値の秒未満を切り捨てます。BPMや演奏時間には、運営者が確認・算出・計測した値を掲載する場合があり、公式発表値とは限りません。</p>
<h2>データセット更新記録</h2>
<p>楽曲一覧と詳細に表示する「データセット更新記録」は、管理データに記録された日付です。ビルド日や個別の楽曲の最終変更日ではありません。手動編集がすぐにこの日付へ反映されない場合もあります。</p>
<h2>主に参照する公式情報</h2>
<ul><li><a href="https://bang-dream.com/">BanG Dream!公式サイト</a></li><li><a href="https://bang-dream.bushimo.jp/music/">ガルパ公式楽曲ページ</a></li><li><a href="https://bang-dream-on.bushimo.jp/">アワーノーツ公式サイト</a></li></ul>
</section>`,
  },
  {
    slug: "privacy",
    name: "プライバシーポリシー",
    description: `${settings.name}のCloudflareによる配信・アクセス解析と、管理ページで扱う情報を説明します。`,
    content: `<h1>プライバシーポリシー</h1><section class="panel">
<h2>サイトの配信</h2>
<p>当サイトはCloudflare Pages等のCloudflareのサービスを利用して配信しています。アクセス時には、サービス提供・セキュリティ・通信処理のため、IPアドレスや通信に関する情報がCloudflareによって処理される場合があります。詳しくは<a href="https://www.cloudflare.com/policies/privacy/">Cloudflareのプライバシーポリシー</a>をご覧ください。</p>
<h2>アクセス解析</h2>
<p>利用状況と表示性能の把握のため、Cloudflare Web Analyticsを利用しています。Cloudflareの説明によると、Web Analytics自体は分析目的のCookieやlocalStorageを使わず、訪問者の個人データを収集・利用せず、個人を識別するフィンガープリントも行いません。<a href="https://developers.cloudflare.com/web-analytics/about/">サービスの説明</a>と<a href="https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/">計測方法の説明</a>をご覧ください。</p>
<h2>通常の閲覧</h2>
<p>通常の閲覧に際して、当サイト運営者が氏名・住所・電話番号等を直接入力させる機能はありません。検索・絞り込み条件はURLのクエリに含まれます。</p>
<h2>管理ページについて（運営者向け）</h2>
<p>管理ページは入力途中の楽曲データと接続先設定をブラウザーのlocalStorageに保存します。GitHubへの保存時には、入力したアクセストークンを使ってGitHub APIと通信します。アクセストークンは画面内のメモリーにのみ保持し、ブラウザーの保存領域には記録しません。</p>
<h2>広告と外部サイト</h2>
<p>現在、第三者配信広告は設置していません。外部リンク先では、そのサイトの取り扱い方針が適用されます。</p>
<h2>プライバシーポリシーの変更</h2>
<p>利用サービスやサイト機能の変更等に応じて、本ポリシーを変更する場合があります。</p>
<p>最終更新：<time datetime="${privacyUpdatedOn}">${privacyUpdatedOn}</time></p>
</section>`,
  },
];
for (const info of informationPages)
  await page({
    file: `${info.slug}/index.html`,
    pagePath: `${info.slug}/`,
    title: `${info.name} | ${settings.name}`,
    description: info.description,
    breadcrumbs: [home, { name: info.name, path: `${info.slug}/` }],
    content: info.content,
    headerSearch: false,
  });

await page({
  file: "search/index.html",
  pagePath: "search/",
  title: `ゲーム横断検索 | ${settings.name}`,
  description: "ゲーム横断検索の準備状況とゲーム別の楽曲検索への入口。",
  breadcrumbs: [home, { name: "ゲーム横断検索", path: "search/" }],
  indexable: false,
  content: `<h1>ゲーム横断検索</h1><div class="panel"><h2>準備中</h2><p>現在はゲームごとの一覧から探してください。</p>${games.map((game) => `<p><a href="${local(songListPath(game))}">${escapeHTML(game.shortName)}の楽曲一覧へ</a></p>`).join("")}</div>`,
});
await page({
  file: "404.html",
  pagePath: "404.html",
  title: `ページが見つかりません | ${settings.name}`,
  description: "指定されたページが見つかりません。",
  indexable: false,
  content: `<h1>ページが見つかりません</h1><p>URLを確認するか、<a href="${local("")}">サイトトップ</a>から探してください。</p>`,
});

for (const redirect of redirects) {
  const target = url(redirect.to.slice(1));
  const link = local(redirect.to.slice(1));
  write(
    `songs/${redirect.slug}/index.html`,
    await format(
      `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${escapeHTML(target)}"><title>ページが移動しました | ${escapeHTML(settings.name)}</title><script type="module" src="${local("legacy-redirect.js")}"></script></head><body><main><h1>楽曲ページが移動しました</h1><p><a id="new-song-url" href="${escapeHTML(link)}">新しい楽曲ページへ</a></p></main></body></html>`,
      { parser: "html" },
    ),
  );
}
write(
  "legacy-redirects.json",
  JSON.stringify(
    redirects.map(({ from, to }) => ({ from, to })),
    null,
    2,
  ) + "\n",
);
write(
  "legacy-redirects.csv",
  "from,to\n" +
    redirects
      .map(
        ({ from, to }) =>
          `"${from.replaceAll('"', '""')}","${to.replaceAll('"', '""')}"`,
      )
      .join("\n") +
    "\n",
);
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((entry) => `  <url><loc>${xmlEscape(entry)}</loc></url>`).join("\n")}\n</urlset>\n`,
);
write(
  "robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${url("sitemap.xml")}\n`,
);

const adminHTML = fs
  .readFileSync("src/pages/admin.html", "utf8")
  .replace('src="/admin.js"', `src="/admin.js?v=${adminAssetVersion}"`)
  .replace('href="/admin.css"', `href="/admin.css?v=${adminAssetVersion}"`)
  .replace(/(href|src|action)="\//g, `$1="${settings.basePath}`)
  .replaceAll("<!--SITE_NAME-->", escapeHTML(settings.name));
write("admin/index.html", await format(adminHTML, { parser: "html" }));
const [owner = "", repo = ""] = (process.env.GITHUB_REPOSITORY || "").split(
  "/",
);
write(
  "admin-config.json",
  JSON.stringify({ owner, repo, branch: "main" }, null, 2) + "\n",
);

write(".nojekyll", "");
fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync(
  "reports/quality-report.json",
  JSON.stringify(
    {
      songs: garupaSongs.length,
      difficulties: garupaSongs.reduce(
        (n, song) => n + song.difficulties.filter(Boolean).length,
        0,
      ),
      missingArtists: garupaSongs
        .filter((song) => song.type !== "normal" && !song.artist)
        .map((song) => song.title),
      missingComposers: garupaSongs
        .filter((song) => !song.composer)
        .map((song) => song.title),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `${games.map((game) => `${game.shortName}${catalogs[game.id].length}曲`).join("・")}の正規ページ、${redirects.length}件の旧URL互換ページを生成しました。`,
);
