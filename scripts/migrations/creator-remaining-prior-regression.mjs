import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { REVIEW_DIR } from "./creator-credit-remaining-review.mjs";
import {
  loadBefore,
  loadExecutionBefore,
  parseAnswers,
  planReview,
  REVIEW_DIR as P3_DIR,
} from "./creator-credit-p3-review.mjs";
const root = ".cache/creator-remaining-prior-regression";
fs.mkdirSync(root + "/.cache", { recursive: true });
for (const d of ["src", "scripts", "tests", "docs", "data"])
  fs.cpSync(d, path.join(root, d), {
    recursive: true,
    force: true,
    filter: (p) =>
      ![REVIEW_DIR, "docs/human-review/creator-final-six-2026-10-22"].some(
        (d) => p.replaceAll("\\", "/").startsWith(d),
      ),
  });
fs.copyFileSync("package.json", root + "/package.json");
const { before } = loadBefore(),
  execution = loadExecutionBefore(before),
  answers = parseAnswers(fs.readFileSync(P3_DIR + "/input.txt", "utf8")),
  clarification = JSON.parse(fs.readFileSync(P3_DIR + "/clarification.json")),
  allocation = JSON.parse(fs.readFileSync(P3_DIR + "/allocation.json")),
  plan = planReview(execution, answers, clarification, allocation);
for (const [p, t] of Object.entries(plan.output))
  fs.writeFileSync(path.join(root, p), t);
const run = (args) =>
  new Promise((resolve, reject) => {
    const c = spawn(process.execPath, args, { cwd: root, stdio: "inherit" });
    c.on("error", reject);
    c.on("exit", (n) =>
      n === 0 ? resolve() : reject(Error("P3 prior regression " + n)),
    );
  });
await run(["scripts/research/creator-credit-human-todo.mjs", "generate"]);
await run(["--test", "tests/research/creator-credit-p3-review.test.mjs"]);
