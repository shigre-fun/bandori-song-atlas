import {
  managementSettings,
  MANAGEMENT_ASSETS,
} from "../../src/js/management-settings.js";
import fs from "node:fs";
import { readManagementBundle } from "../../scripts/management-bundle.mjs";
import { siteSettings } from "../../src/js/site-config.js";

// Synthetic fixture only; never use these identifiers for a real deployment.
export const managementTestEnv = {
  MANAGEMENT_MODE: "protected",
  MANAGEMENT_PATH: "0123456789abcdef0123456789abcdef",
  CF_ACCESS_TEAM_DOMAIN: "https://fixture.cloudflareaccess.com",
  CF_ACCESS_AUD: "a".repeat(64),
  MANAGEMENT_ALLOWED_EMAILS: "editor@example.invalid",
  MANAGEMENT_ORIGIN: "https://tanimachi-bdsongs.com",
};
export function builtPath(file, env = process.env) {
  const config = managementSettings(env);
  if (
    file.startsWith("admin/") ||
    MANAGEMENT_ASSETS.includes(file) ||
    file === "admin-config.json"
  ) {
    if (!config.enabled)
      throw new Error("Admin fixture requires protected build settings");
    return (
      config.segment +
      "/" +
      (file.startsWith("admin/")
        ? file.slice(6)
        : file === "admin-config.json"
          ? "config.json"
          : file)
    );
  }
  return file;
}
export function readBuilt(file) {
  const relative = builtPath(file);
  const key = siteSettings(process.env).basePath + relative;
  const bundle = readManagementBundle("dist");
  return Object.hasOwn(bundle, key)
    ? bundle[key].body
    : fs.readFileSync("dist/" + relative, "utf8");
}
export function existsBuilt(relative) {
  return (
    Object.hasOwn(
      readManagementBundle("dist"),
      siteSettings(process.env).basePath + relative,
    ) || fs.existsSync("dist/" + relative)
  );
}
