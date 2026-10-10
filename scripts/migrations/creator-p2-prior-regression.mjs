import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  loadBefore,
  parseAnswers,
  planRegistration,
  REVIEW_DIR,
} from "./register-kanow-creator.mjs";
const root = ".cache/creator-p2-prior-regression",
  p2 = "docs/human-review/creator-credits-p2-2026-10-10";
fs.mkdirSync(root + "/.cache", { recursive: true });
for (const directory of ["src", "scripts", "tests", "docs", "data"])
  fs.cpSync(directory, path.join(root, directory), {
    recursive: true,
    force: true,
    filter: (p) => !p.replaceAll("\\", "/").startsWith(p2),
  });
// A previous interrupted copy must not retain today's P2 receipt.
const leftover = path.resolve(root, p2);
assertInside(leftover);
if (fs.existsSync(leftover)) fs.rmSync(leftover, { recursive: true });
function assertInside(p) {
  if (!p.startsWith(path.resolve(root) + path.sep))
    throw Error("Unsafe fixture path");
}
fs.copyFileSync("package.json", root + "/package.json");
const { before } = loadBefore(),
  answers = parseAnswers(
    fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8"),
    JSON.parse(fs.readFileSync(REVIEW_DIR + "/clarification.json")),
    before,
  ),
  plan = planRegistration(before.files, answers);
for (const [p, text] of Object.entries(plan.output))
  fs.writeFileSync(path.join(root, p), text);
for (const [n, text] of Object.entries(before.artifacts))
  fs.writeFileSync(
    path.join(root, "docs/todo/creator-credit-human-review", n),
    text,
  );
const run = (args) =>
  new Promise((resolve, reject) => {
    const c = spawn(process.execPath, args, { cwd: root, stdio: "inherit" });
    c.on("error", reject);
    c.on("exit", (code) =>
      code === 0 ? resolve() : reject(Error("P1 regression: " + code)),
    );
  });
await run(["scripts/research/creator-credit-human-todo.mjs", "generate"]);
await run(["--test", "tests/research/creator-kanow-registration.test.mjs"]);
