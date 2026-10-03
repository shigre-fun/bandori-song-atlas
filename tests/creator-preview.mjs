// ローカルUI検証専用。GitHubの代わりにメモリー内repositoryを使い、実通信/永続保存はしない。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { creatorRepository } from "./helpers/creator-repository.mjs";
const repository = creatorRepository({
    creatorData:
      process.env.CREATOR_FIXTURE_REAL === "1"
        ? JSON.parse(fs.readFileSync("data/creators.json", "utf8"))
        : null,
    creatorCount: process.env.CREATOR_FIXTURE_COUNT
      ? Number(process.env.CREATOR_FIXTURE_COUNT)
      : 2,
  }),
  root = path.resolve("dist"),
  port = Number(process.env.CREATOR_FIXTURE_PORT ?? 4176);
const shim = `const originalFetch=window.fetch.bind(window);window.fetch=(url,options)=>String(url).startsWith("https://api.github.com/repos/test-owner/song-atlas")?originalFetch("/test-api"+String(url).slice("https://api.github.com/repos/test-owner/song-atlas".length),options):originalFetch(url,options);`;
http
  .createServer(async (req, res) => {
    const pathname = decodeURIComponent(
      new URL(req.url, `http://127.0.0.1:${port}`).pathname,
    );
    try {
      if (pathname === "/test-fixture.js") {
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.end(shim);
        return;
      }
      if (pathname.startsWith("/test-api")) {
        let body = "";
        for await (const chunk of req) body += chunk;
        const response = await repository.fetcher(
          `https://api.github.com/repos/test-owner/song-atlas${req.url.slice(9)}`,
          { method: req.method, ...(body ? { body } : {}) },
        );
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(await response.text());
        return;
      }
      if (pathname === "/creators.json") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(repository.files["data/creators.json"]));
        return;
      }
      let file = path.resolve(root, "." + pathname);
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory())
        file = path.join(file, "index.html");
      if (!fs.existsSync(file)) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end(fs.readFileSync(path.join(root, "404.html")));
        return;
      }
      const mime = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".svg": "image/svg+xml",
      };
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] ?? "application/octet-stream",
      });
      if (pathname.startsWith("/admin/") && file.endsWith(".html"))
        res.end(
          fs
            .readFileSync(file, "utf8")
            .replace(
              "</head>",
              '<script src="/test-fixture.js"></script></head>',
            ),
        );
      else res.end(fs.readFileSync(file));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Creator UI fixture: http://127.0.0.1:${port} (memory only)`),
  );
