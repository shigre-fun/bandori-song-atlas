import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { loadBefore, REVIEW_DIR } from "./register-kanow-creator.mjs";

// Preserve all 31 earlier ToDo/P0/Kanzaki assertions against their exact release state.
// The new P1 tests independently validate the current data and task correspondence.
const { before } = loadBefore();
const root = ".cache/creator-review-regression";
fs.mkdirSync(root, { recursive: true });
fs.mkdirSync(path.join(root, ".cache"), { recursive: true });
for (const directory of ["src", "scripts", "tests", "docs", "data"])
  fs.cpSync(directory, path.join(root, directory), {
    recursive: true,
    force: true,
    filter: (p) =>
      ![REVIEW_DIR, "docs/human-review/creator-credits-p2-2026-10-10"].some(
        (d) => p.replaceAll("\\", "/").startsWith(d),
      ),
  });
fs.copyFileSync("package.json", path.join(root, "package.json"));
for (const [p, text] of Object.entries(before.files))
  fs.writeFileSync(path.join(root, p), text);
for (const [name, text] of Object.entries(before.artifacts))
  fs.writeFileSync(
    path.join(root, "docs/todo/creator-credit-human-review", name),
    text,
  );
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error("Prior review regression exited " + code)),
    );
  });
// Regenerate only this disposable copy for the current HEAD and generator format.
await run(["scripts/research/creator-credit-human-todo.mjs", "generate"]);
await run([
  "--test",
  "tests/research/creator-credit-human-todo.test.mjs",
  "tests/research/creator-credit-p0-review.test.mjs",
  "tests/research/creator-kanzaki-registration.test.mjs",
]);
