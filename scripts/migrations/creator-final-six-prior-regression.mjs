import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { loadBefore, REVIEW_DIR } from "./creator-final-six-review.mjs";
const root = ".cache/creator-final-six-prior-regression";
fs.mkdirSync(root + "/.cache", { recursive: true });
for (const d of ["src", "scripts", "tests", "docs", "data"])
  fs.cpSync(d, path.join(root, d), {
    recursive: true,
    force: true,
    filter: (p) => !p.replaceAll("\\", "/").startsWith(REVIEW_DIR),
  });
fs.copyFileSync("package.json", root + "/package.json");
for (const [p, t] of Object.entries(loadBefore().files))
  fs.writeFileSync(path.join(root, p), t);
const run = (args) =>
  new Promise((resolve, reject) => {
    const c = spawn(process.execPath, args, { cwd: root, stdio: "inherit" });
    c.on("error", reject);
    c.on("exit", (n) =>
      n === 0
        ? resolve()
        : reject(Error("Previous 375 review regression " + n)),
    );
  });
await run(["scripts/research/creator-credit-human-todo.mjs", "generate"]);
await run([
  "--test",
  "tests/research/creator-credit-remaining-review.test.mjs",
]);
