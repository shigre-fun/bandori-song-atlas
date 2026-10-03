import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { discographyIndex, discographyDetail } from "./credits-html.mjs";
import {
  normalizeTitle,
  BAND_CLASSES,
  cleanTrackTitle,
  titleVariant,
} from "./credit-evidence.mjs";
const directory = "docs/migrations/credits-phase-a-2026-10-03";
const cache = ".cache/credits-phase-a";
fs.mkdirSync(cache, { recursive: true });
fs.mkdirSync(path.join(directory, "sources"), { recursive: true });
const key = (url) =>
  crypto.createHash("sha256").update(url).digest("hex").slice(0, 16);
const write = (p, x) => {
  const content = JSON.stringify(x, null, 2) + "\n";
  if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== content)
    fs.writeFileSync(p, content);
};
async function readPage(url, kind) {
  const file = path.join(cache, `fetch-${key(url)}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  let result;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) }),
      html = await response.text();
    result = {
      url,
      checkedAt: new Date().toISOString(),
      status: response.status,
      readStatus: response.ok ? "HTTP_CONFIRMED" : "SOURCE_UNREADABLE",
      kind,
      ...(response.ok
        ? {
            parsed:
              kind === "index"
                ? discographyIndex(html, url)
                : discographyDetail(html),
          }
        : { reason: `HTTP ${response.status}` }),
    };
    if (response.ok && !result.parsed) {
      result.readStatus = "SOURCE_UNREADABLE";
      result.reason = "Expected official discography body not found";
    }
  } catch (error) {
    result = {
      url,
      kind,
      checkedAt: new Date().toISOString(),
      readStatus: "SOURCE_UNREADABLE",
      reason: error.message,
    };
  }
  write(file, result);
  return result;
}
const queue = ["https://bang-dream.com/discographies/"],
  seen = new Set(),
  index = [],
  entries = new Map();
while (queue.length) {
  const url = queue.shift();
  if (seen.has(url)) continue;
  seen.add(url);
  const page = await readPage(url, "index");
  index.push(page);
  if (page.parsed) {
    for (const entry of page.parsed.entries) entries.set(entry.url, entry);
    for (const next of page.parsed.pagination)
      if (!seen.has(next)) queue.push(next);
  }
  write(path.join(directory, "sources/discography-discovery.json"), {
    sourceType: "bangdream-discography",
    sourceReliability: "PRIMARY",
    pages: index,
    entries: [...entries.values()],
  });
  console.log(`Index ${seen.size}: ${url} (${entries.size} releases)`);
}
const baseline = JSON.parse(
  fs.readFileSync(path.join(directory, "baseline.json"), "utf8"),
);
const gameSources = Object.fromEntries(
  ["garupa", "ournotes"].map((game) => [
    game,
    JSON.parse(
      fs.readFileSync(
        path.join(directory, `sources/game-${game}-music.json`),
        "utf8",
      ),
    ),
  ]),
);
const needs = baseline.records.filter(
  (r) =>
    gameSources[r.game].rows.filter(
      (x) =>
        normalizeTitle(x.title) === normalizeTitle(r.title) &&
        (normalizeTitle(x.artist) === normalizeTitle(r.band) ||
          normalizeTitle(BAND_CLASSES[x.bandClass] ?? "") ===
            normalizeTitle(r.band)),
    ).length !== 1,
);
const bands = new Set(
  needs.filter((r) => r.type === "normal").map((r) => r.band),
);
const targets = [...entries.values()].filter(
  (e) =>
    !e.categories.some((x) => ["Blu-ray", "LP", "夢ノ結唱"].includes(x)) &&
    (e.artists.some((a) => bands.has(a)) ||
      e.artists.some((a) => ["シャッフルユニット", "その他"].includes(a)) ||
      /カバーコレクション/.test(e.title)),
);
write(path.join(directory, "sources/discography-targets.json"), {
  selection:
    "不足originalの明示artist、シャッフル/その他、カバーコレクション。indexの実hrefのみ。",
  urls: targets,
});
for (const [i, entry] of targets.entries()) {
  const page = await readPage(entry.url, "detail");
  const parsed = page.parsed;
  // Keep only credit-containing lines and adjoining track headings, never full article text.
  const useful = new Set();
  if (parsed) {
    for (let j = 0; j < parsed.lines.length; j++)
      if (
        /(?:作詞|作曲|編曲|作編曲)\s*[:：]|作詞[・/／]作曲\s*[:：]|作曲[・/／]編曲\s*[:：]|作詞[・/／]作曲[・/／]編曲\s*[:：]/.test(
          parsed.lines[j],
        )
      ) {
        useful.add(j);
        if (j > 0 && parsed.lines[j - 1].length <= 160) useful.add(j - 1);
        if (
          j > 1 &&
          !/作詞|作曲|編曲|作編曲/.test(parsed.lines[j - 1]) &&
          parsed.lines[j - 2].length <= 160
        )
          useful.add(j - 2);
      }
  }
  const trackContexts = [];
  if (parsed) {
    for (const record of baseline.records) {
      if (
        !entry.artists.includes(record.band) &&
        !parsed.artists
          .split("\n")
          .some((x) => normalizeTitle(x) === normalizeTitle(record.band))
      )
        continue;
      const wanted = normalizeTitle(titleVariant(record.title));
      const line = parsed.lines.find(
        (text) =>
          text.length <= 160 &&
          normalizeTitle(cleanTrackTitle(text)) === wanted,
      );
      const quoted = new RegExp(
        "[「『]" +
          titleVariant(record.title).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
          "[」』]",
      ).test(parsed.pageTitle);
      if (line || quoted)
        trackContexts.push({
          game: record.game,
          recordId: record.recordId,
          workId: record.workId,
          title: record.title,
          band: record.band,
          scope:
            record.title === titleVariant(record.title) ? "release" : "work",
          context: line ?? parsed.pageTitle,
          method: "explicit artist + track title / quoted release title",
        });
    }
  }
  const source = {
    url: entry.url,
    sourceType: "bangdream-discography",
    sourceReliability: "PRIMARY",
    checkedAt: page.checkedAt,
    pageReadStatus: page.readStatus,
    httpStatus: page.status ?? null,
    pageTitle: parsed?.pageTitle ?? entry.title,
    artists: parsed?.artists ?? entry.artists.join(" / "),
    releaseDate: parsed?.releaseDate ?? null,
    creditLines: parsed
      ? [...useful]
          .sort((a, b) => a - b)
          .map((j) => ({ line: j + 1, text: parsed.lines[j] }))
      : [],
    trackContexts,
    indexTitle: entry.title,
    indexArtists: entry.artists,
    reason: page.reason ?? null,
  };
  write(
    path.join(
      directory,
      "sources",
      `discography-${entry.url.match(/\/discographies\/(\d+)/)[1]}.json`,
    ),
    source,
  );
  console.log(
    `Detail ${i + 1}/${targets.length}: ${entry.url} (${source.creditLines.length} lines, ${source.pageReadStatus})`,
  );
}
console.log(
  JSON.stringify({
    records: baseline.records.length,
    indexPages: index.length,
    discoveredReleases: entries.size,
    targetPages: targets.length,
    done: true,
  }),
);
