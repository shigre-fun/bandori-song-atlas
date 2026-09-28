import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import {
  BRAND_ASSETS,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "../../src/js/site-config.js";

const WIDTH = 1200;
const HEIGHT = 630;
const RENDER_VERSION = 1;
const FONT_DIR = path.resolve("assets/fonts");
const LOGO_SOURCE = path.resolve("src/images/favicon.svg");

function registerFonts() {
  for (const [file, family] of [
    ["NotoSansJP-Regular.otf", "BrandRegular"],
    ["NotoSansJP-Bold.otf", "BrandBold"],
  ]) {
    const source = path.join(FONT_DIR, file);
    if (!fs.existsSync(source) || !GlobalFonts.registerFromPath(source, family))
      throw new Error(`OGP用フォントを登録できません: ${source}`);
  }
}

function accentFor(game) {
  const accent = game?.ogAccent;
  if (
    !game?.id ||
    !/^[A-Za-z0-9_-]+$/.test(game.slug) ||
    !/^#[0-9A-Fa-f]{6}$/.test(accent?.strong || "") ||
    !/^#[0-9A-Fa-f]{6}$/.test(accent?.pale || "")
  )
    throw new Error(
      `${game?.id || "未定義ゲーム"}のOGP識別色が未設定または不正です。`,
    );
  return accent;
}

function creditFor(song) {
  const credit = song.band || song.artist;
  if (!credit)
    throw new Error(
      `楽曲「${song.title}」にバンド名・アーティスト名がありません。`,
    );
  return credit;
}

export function songOgPath(game, song) {
  const accent = accentFor(game);
  if (!/^[A-Za-z0-9_-]+$/.test(song.stableSongId || ""))
    throw new Error(`OGP用stableSongIdが不正です: ${song.stableSongId}`);
  const hash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify([
        RENDER_VERSION,
        game.id,
        song.stableSongId,
        song.title,
        creditFor(song),
        game.shortName,
        accent.strong,
        accent.pale,
      ]),
    )
    .digest("hex")
    .slice(0, 12);
  return `assets/og/songs/${game.slug}/${song.stableSongId}-${hash}.png`;
}

function writePng(output, relative, canvas) {
  const target = path.resolve(output, relative);
  if (!target.startsWith(output + path.sep))
    throw new Error(`不正な画像生成パス: ${relative}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, canvas.toBuffer("image/png"));
}

function font(ctx, size, bold = false) {
  ctx.font = `${size}px ${bold ? "BrandBold" : "BrandRegular"}`;
}

function fitSingleLine(ctx, text, maxWidth, start, minimum, bold = false) {
  for (let size = start; size >= minimum; size--) {
    font(ctx, size, bold);
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  throw new Error(`OGPに文字が収まりません: ${text}`);
}

function fitTitle(ctx, title, maxWidth) {
  if (!title?.trim()) throw new Error("OGP用の楽曲名が空です。");
  const graphemes = [
    ...new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(title),
  ].map((part) => part.segment);
  for (let size = 84; size >= 38; size--) {
    font(ctx, size, true);
    if (ctx.measureText(title).width <= maxWidth)
      return { size, lines: [title] };
    let best = null;
    for (let split = 1; split < graphemes.length; split++) {
      const first = graphemes.slice(0, split).join("").trimEnd();
      const second = graphemes.slice(split).join("").trimStart();
      if (!first || !second) continue;
      const firstWidth = ctx.measureText(first).width;
      const secondWidth = ctx.measureText(second).width;
      if (firstWidth > maxWidth || secondWidth > maxWidth) continue;
      const naturalBreak =
        /\s/u.test(graphemes[split - 1]) || /\s/u.test(graphemes[split]);
      const splitsAsciiWord =
        /[A-Za-z0-9]$/u.test(first) && /^[A-Za-z0-9]/u.test(second);
      const score =
        Math.abs(firstWidth - secondWidth) +
        (naturalBreak ? 0 : 120) +
        (splitsAsciiWord ? 10000 : 0);
      if (!best || score < best.score) best = { score, lines: [first, second] };
    }
    if (best) return { size, lines: best.lines };
  }
  throw new Error(`OGPに2行で収まらない楽曲名です: ${title}`);
}

function background(ctx, accent = null) {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#FFFFFF");
  gradient.addColorStop(1, "#F3F7FF");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = accent?.pale || "#EEF3FF";
  ctx.beginPath();
  ctx.arc(1120, 62, 215, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FDECF4";
  ctx.beginPath();
  ctx.arc(60, 610, 130, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#E3EAF5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(38, 38, 1124, 554, 34);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent?.strong || "#5366B5";
  ctx.fillRect(90, 542, 90, 5);
  ctx.fillStyle = "#C8D7EE";
  for (const x of [1050, 1078, 1106]) {
    ctx.beginPath();
    ctx.arc(x, 547, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderSiteOg(logo, domain) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");
  background(ctx);
  ctx.drawImage(logo, 98, 180, 174, 174);
  ctx.fillStyle = "#1F2D47";
  fitSingleLine(ctx, SITE_NAME, 790, 80, 66, true);
  ctx.fillText(SITE_NAME, 305, 245);
  ctx.fillStyle = "#56627A";
  fitSingleLine(ctx, SITE_DESCRIPTION, 785, 38, 28);
  ctx.fillText(SITE_DESCRIPTION, 308, 316);
  ctx.strokeStyle = "#E1E9F5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(307, 355);
  ctx.lineTo(1075, 355);
  ctx.stroke();
  ctx.fillStyle = "#6D7892";
  font(ctx, 26);
  ctx.fillText(domain, 101, 518);
  return canvas;
}

function renderSongOg(logo, game, song, domain) {
  const accent = accentFor(game);
  const credit = creditFor(song);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");
  background(ctx, accent);
  ctx.drawImage(logo, 92, 85, 75, 75);
  ctx.fillStyle = "#26344E";
  font(ctx, 34, true);
  ctx.fillText(SITE_NAME, 186, 137);
  ctx.fillStyle = accent.strong;
  ctx.beginPath();
  ctx.roundRect(920, 91, 195, 62, 30);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  font(ctx, game.shortName.length > 4 ? 27 : 30, true);
  ctx.textAlign = "center";
  ctx.fillText(game.shortName, 1017, 133);
  ctx.textAlign = "left";
  const { size, lines } = fitTitle(ctx, song.title, 1000);
  ctx.fillStyle = "#1F2D47";
  font(ctx, size, true);
  const firstBaseline = lines.length === 1 ? 342 : 303;
  for (const [index, line] of lines.entries())
    ctx.fillText(line, 99, firstBaseline + index * (size + 10));
  ctx.fillStyle = "#53617B";
  fitSingleLine(ctx, credit, 995, 40, 24);
  ctx.fillText(credit, 102, 469);
  ctx.fillStyle = "#6D7892";
  font(ctx, 23);
  ctx.fillText(domain, 102, 520);
  return canvas;
}

export async function generateBrandAssets(output, catalogs, games, settings) {
  registerFonts();
  const domain = new URL(settings.origin).hostname;
  const logo = await loadImage(fs.readFileSync(LOGO_SOURCE));
  for (const [size, relative] of [
    [32, BRAND_ASSETS.faviconPng],
    [180, BRAND_ASSETS.appleTouchIcon],
    [512, BRAND_ASSETS.logo],
  ]) {
    const canvas = createCanvas(size, size);
    canvas.getContext("2d").drawImage(logo, 0, 0, size, size);
    writePng(output, relative, canvas);
  }
  writePng(output, BRAND_ASSETS.siteOg, renderSiteOg(logo, domain));
  const songImages = new Map();
  for (const game of games) {
    accentFor(game);
    for (const song of catalogs[game.id] || []) {
      const relative = songOgPath(game, song);
      writePng(output, relative, renderSongOg(logo, game, song, domain));
      songImages.set(`${game.id}:${song.stableSongId}`, relative);
    }
  }
  return songImages;
}
