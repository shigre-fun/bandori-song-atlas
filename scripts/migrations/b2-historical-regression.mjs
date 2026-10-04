import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { historicalText } from "./credit-history.mjs";
// The prior 194 tests describe past phase states (91 Creators/unprepared roles).
// Run their unchanged assertions against byte-verified phase inputs, with today's implementation.
const root = ".cache/b2-historical-regression";
fs.mkdirSync(root, { recursive: true });
for (const directory of [
  "src",
  "scripts",
  "tests",
  "docs",
  "data",
  "templates",
  "functions",
  "assets",
]) {
  fs.cpSync(directory, path.join(root, directory), {
    recursive: true,
    force: true,
    filter: (p) =>
      !p.endsWith("credits-phase-b2.test.mjs") &&
      !p.endsWith("creator-credits-release.test.mjs") &&
      !p.endsWith("live-database.test.mjs"),
  });
}
for (const file of [
  "package.json",
  "pnpm-lock.yaml",
  "README.md",
  "wrangler.toml",
]) {
  if (fs.existsSync(file)) fs.copyFileSync(file, path.join(root, file));
}
for (const file of [
  "data/creators.json",
  "data/works.json",
  "data/garupa/songs.json",
  "data/ournotes/songs.json",
])
  fs.writeFileSync(path.join(root, file), historicalText(file));
if (!fs.existsSync(path.join(root, "node_modules")))
  fs.symlinkSync(
    path.resolve("node_modules"),
    path.resolve(root, "node_modules"),
    "junction",
  );
// Some historical static-page tests intentionally inspect dist as well as their own subpath build.
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        BASE_PATH: "/",
        SITE_BASE_PATH: "/",
        SITE_OUTPUT_DIR: "dist",
      },
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(args[0] + " exited " + code)),
    );
  });
await run(["scripts/build.mjs"]);
const testFiles = fs
  .readdirSync(root + "/tests")
  .filter(
    (n) =>
      n.endsWith(".test.mjs") &&
      n !== "credits-phase-b2.test.mjs" &&
      n !== "creator-credits-release.test.mjs" &&
      n !== "live-database.test.mjs",
  )
  .map((n) => "tests/" + n);
await run(["--test", ...testFiles]);
