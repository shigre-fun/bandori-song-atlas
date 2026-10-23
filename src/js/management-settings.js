import { siteSettings } from "./site-config.js";
// Server/build configuration only. Never copy this module into the public assets.
export const MANAGEMENT_ASSETS = [
  "admin.js",
  "admin-news.js",
  "admin-creators.js",
  "admin.css",
  "github-store.js",
  "github-news-store.js",
  "github-creator-store.js",
  "creator-picker.js",
  "related-song-picker.js",
  "management-client.js",
];

export function managementSettings(env = {}) {
  const mode = env.MANAGEMENT_MODE || "disabled";
  if (mode === "disabled") return { enabled: false };
  if (mode !== "protected") throw new Error("Invalid MANAGEMENT_MODE");
  const segment = env.MANAGEMENT_PATH || "";
  if (!/^[a-f0-9]{32}$/.test(segment))
    throw new Error("MANAGEMENT_PATH must be 32 lowercase hex characters");
  const domain = env.CF_ACCESS_TEAM_DOMAIN || "";
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain))
    throw new Error("Invalid CF_ACCESS_TEAM_DOMAIN");
  const aud = env.CF_ACCESS_AUD || "";
  if (!/^[a-f0-9]{64}$/.test(aud)) throw new Error("Invalid CF_ACCESS_AUD");
  const emails = (env.MANAGEMENT_ALLOWED_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (
    !emails.length ||
    emails.some((s) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
  )
    throw new Error("Invalid MANAGEMENT_ALLOWED_EMAILS");
  const origin = env.MANAGEMENT_ORIGIN || "";
  if (!origin) throw new Error("Missing MANAGEMENT_ORIGIN");
  if (new URL(origin).origin !== origin || !origin.startsWith("https://"))
    throw new Error("Invalid MANAGEMENT_ORIGIN");
  return {
    enabled: true,
    segment,
    root: `${siteSettings(env).basePath}${segment}/`,
    domain,
    aud,
    emails,
    origin,
  };
}
