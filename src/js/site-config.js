export const SITE_NAME = "バンドリ楽曲録";
export const SITE_ALTERNATE_NAME = "BanG Dream! Song Database";
export const SITE_ORIGIN = "https://tanimachi-bdsongs.com";
export const BASE_PATH = "/";
export const SITE_DESCRIPTION = "ガルパ・アワーノーツの非公式楽曲データベース";
export const BRAND_ASSETS = Object.freeze({
  favicon: "favicon.svg",
  faviconPng: "favicon-32.png",
  appleTouchIcon: "apple-touch-icon.png",
  logo: "assets/logo-512.png",
  siteOg: "assets/og/site.png",
});

/** @typedef {{ id: string, slug: string, name: string, shortName: string, seoName: string, ogAccent: { strong: string, pale: string }, difficulties: string[], categories: string[], fields: string[], catalog: string, dataFile: string }} Game */

/** @type {Record<string, Game>} */
export const GAMES = {
  garupa: {
    id: "garupa",
    slug: "garupa",
    name: "バンドリ！ガールズバンドパーティ！",
    shortName: "ガルパ",
    seoName: "ガルパ",
    ogAccent: { strong: "#D72665", pale: "#FFF0F5" },
    difficulties: ["EASY", "NORMAL", "HARD", "EXPERT", "SPECIAL"],
    bands: [
      "Poppin'Party",
      "Afterglow",
      "Pastel＊Palettes",
      "Roselia",
      "ハロー、ハッピーワールド！",
      "Morfonica",
      "RAISE A SUILEN",
      "MyGO!!!!!",
      "Ave Mujica",
    ],
    categories: ["normal", "anime", "tie_up"],
    fields: ["bpm", "level", "notes", "releaseDate", "durationSeconds"],
    catalog: "garupa/songs.json",
    dataFile: "data/garupa/songs.json",
    stateFile: "data/garupa/admin-state.json",
  },
  ournotes: {
    id: "ournotes",
    slug: "ournotes",
    name: "バンドリ！アワーノーツ",
    shortName: "アワーノーツ",
    seoName: "アワーノーツ",
    ogAccent: { strong: "#2868CE", pale: "#EDF4FF" },
    difficulties: ["EASY", "NORMAL", "HARD", "EXPERT"],
    bands: [
      "MyGO!!!!!",
      "Ave Mujica",
      "夢限大みゅーたいぷ",
      "millsage",
      "一家Dumb Rock!",
    ],
    categories: ["normal", "anime"],
    fields: ["bpm", "level", "notes", "releaseDate", "durationSeconds"],
    catalog: "ournotes/songs.json",
    dataFile: "data/ournotes/songs.json",
    stateFile: "data/ournotes/admin-state.json",
  },
};

const normalizedBase = (value) => {
  const normalized = value.endsWith("/") ? value : `${value}/`;
  if (!/^\/(?:[A-Za-z0-9_.-]+\/)*$/.test(normalized))
    throw new Error("BASE_PATHは/または英数字等のパスにしてください。");
  return normalized;
};

export function siteSettings(env = {}) {
  const legacy = env.SITE_BASE_PATH ? normalizedBase(env.SITE_BASE_PATH) : null;
  const explicit = env.BASE_PATH ? normalizedBase(env.BASE_PATH) : null;
  if (legacy && explicit && legacy !== explicit)
    throw new Error("BASE_PATHとSITE_BASE_PATHが一致しません。");
  const origin = env.SITE_ORIGIN || SITE_ORIGIN;
  const parsed = new URL(origin);
  if (!/^https?:$/.test(parsed.protocol) || parsed.origin !== origin)
    throw new Error("SITE_ORIGINはパスなしのHTTP(S) originにしてください。");
  return {
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    origin,
    basePath: explicit || legacy || BASE_PATH,
    assets: BRAND_ASSETS,
  };
}
