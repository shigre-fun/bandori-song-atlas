import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  releaseHistoryBuffer,
  releaseHistoryFiles,
} from "./release-history.mjs";
// Keep the original 35 B2 assertions unchanged and run today's code against their approved inputs.
const root = ".cache/b2-release-regression";
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
])
  fs.cpSync(directory, path.join(root, directory), {
    recursive: true,
    force: true,
  });
fs.copyFileSync("package.json", path.join(root, "package.json"));
for (const file of releaseHistoryFiles) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), releaseHistoryBuffer(file));
}
if (!fs.existsSync(path.join(root, "node_modules")))
  fs.symlinkSync(
    path.resolve("node_modules"),
    path.resolve(root, "node_modules"),
    "junction",
  );
await new Promise((resolve, reject) => {
  const child = spawn(
    process.execPath,
    ["--test", "tests/credits-phase-b2.test.mjs"],
    { cwd: root, stdio: "inherit" },
  );
  child.on("error", reject);
  child.on("exit", (code) =>
    code === 0 ? resolve() : reject(new Error("B2 regression exited " + code)),
  );
});
