import { spawn } from "node:child_process";
// Preserve every historical assertion; exercise the live B2 database separately.
await import("./b2-historical-regression.mjs");
await import("./b2-release-regression.mjs");
const code = await new Promise((resolve, reject) => {
  const child = spawn(
    process.execPath,
    ["--test", "tests/creator-credits-release.test.mjs"],
    { stdio: "inherit" },
  );
  child.on("error", reject);
  child.on("exit", resolve);
});
process.exitCode = code;
