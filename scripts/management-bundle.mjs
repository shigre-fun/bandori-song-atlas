import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export function managementBundleDirectory(output) {
  const id = crypto
    .createHash("sha256")
    .update(path.resolve(output))
    .digest("hex")
    .slice(0, 16);
  return path.resolve(".cache/management-bundles", id);
}
export function writeManagementBundle(output, files) {
  const directory = managementBundleDirectory(output);
  fs.mkdirSync(directory, { recursive: true });
  const json = JSON.stringify(files);
  fs.writeFileSync(path.join(directory, "assets.json"), json + "\n");
  fs.writeFileSync(
    path.join(directory, "assets.mjs"),
    "export default " + json + ";\n",
  );
  // Only dist selects the release payload. Alternative QA outputs cannot replace it.
  if (path.resolve(output) === path.resolve("dist")) {
    const runtime = path.resolve(".cache/management-runtime");
    fs.mkdirSync(runtime, { recursive: true });
    const relative = path
      .relative(runtime, path.join(directory, "assets.mjs"))
      .replaceAll("\\", "/");
    fs.writeFileSync(
      path.join(runtime, "assets.mjs"),
      `export { default } from ${JSON.stringify(relative)};\n`,
    );
  }
}
export function readManagementBundle(output) {
  return JSON.parse(
    fs.readFileSync(
      path.join(managementBundleDirectory(output), "assets.json"),
      "utf8",
    ),
  );
}

export function functionRoutes(output, protectedManagement) {
  if (!protectedManagement)
    return {
      version: 1,
      include: ["/api/contact", "/api/contact/"],
      exclude: [],
    };
  // Keep the private path out of publicly fetchable routing manifests. Known
  // public assets bypass Functions; private files never exist in static storage.
  const exclude = fs
    .readdirSync(output, { withFileTypes: true })
    .filter(
      (entry) =>
        !entry.name.startsWith("_") &&
        !entry.name.startsWith(".") &&
        entry.name !== "api",
    )
    .map((entry) => "/" + entry.name + (entry.isDirectory() ? "/*" : ""));
  exclude.unshift("/");
  if (exclude.length + 1 > 100 || exclude.some((rule) => rule.length > 100))
    throw new Error("Functions routing exceeds platform limits");
  return { version: 1, include: ["/*"], exclude };
}
