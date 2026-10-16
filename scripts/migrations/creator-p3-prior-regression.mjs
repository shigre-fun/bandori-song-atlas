import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  loadBefore,
  loadBaseFiles,
  parseAnswers,
  planReview,
  REVIEW_DIR,
} from "./creator-credit-p2-review.mjs";
const root = ".cache/creator-p3-prior-regression",
  p3 = "docs/human-review/creator-credits-p3-2026-10-16";
fs.mkdirSync(root + "/.cache", { recursive: true });
for (const directory of ["src", "scripts", "tests", "docs", "data"])
  fs.cpSync(directory, path.join(root, directory), {
    recursive: true,
    force: true,
    filter: (p) => !p.replaceAll("\\", "/").startsWith(p3),
  });
fs.copyFileSync("package.json", root + "/package.json");
const { before } = loadBefore(),
  answers = parseAnswers(fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8")),
  clarification = JSON.parse(
    fs.readFileSync(REVIEW_DIR + "/clarification.json"),
  ),
  allocation = JSON.parse(fs.readFileSync(REVIEW_DIR + "/allocation.json"));
const plan = planReview(
  loadBaseFiles(before),
  answers,
  before,
  clarification,
  allocation,
);
for (const [p, t] of Object.entries(plan.output))
  fs.writeFileSync(path.join(root, p), t);
const run = (args) =>
  new Promise((resolve, reject) => {
    const c = spawn(process.execPath, args, { cwd: root, stdio: "inherit" });
    c.on("error", reject);
    c.on("exit", (n) =>
      n === 0 ? resolve() : reject(Error("P2 regression: " + n)),
    );
  });
await run(["scripts/research/creator-credit-human-todo.mjs", "generate"]);
await run(["--test", "tests/research/creator-credit-p2-review.test.mjs"]);
