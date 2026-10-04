import { spawn } from "node:child_process";
// Preserve every historical assertion; validate the current database separately.
await import("./b2-historical-regression.mjs");
await import("./b2-release-regression.mjs");
await import("./creator-release-regression.mjs");
const code = await new Promise((resolve, reject) => {
  const child = spawn(
    process.execPath,
    ["--test", "tests/home.test.mjs", "tests/live-database.test.mjs"],
    { stdio: "inherit" },
  );
  child.on("error", reject);
  child.on("exit", resolve);
});
process.exitCode = code;
