// ローカル画面検証専用。外部メール送信とSiteverify通信は模擬する。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { createContactHandler } from "../functions/api/contact.js";

const root = path.resolve(process.env.CONTACT_PREVIEW_DIR || "dist");
const port = Number(process.env.CONTACT_PREVIEW_PORT || 4175);
const origin = `http://127.0.0.1:${port}`;
const modes = [
  "success",
  "send-failed",
  "verification-failed",
  "network-failed",
];
const env = {
  TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  RESEND_API_KEY: "fixture-only",
  CONTACT_TO_EMAIL: "recipient@example.test",
  CONTACT_FROM_EMAIL: "contact@example.test",
};
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
const csp = fs
  .readFileSync("src/static/_headers", "utf8")
  .match(/Content-Security-Policy: (.+)/)?.[1]
  .trim();
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, origin);
      if (url.pathname.startsWith("/__preview/")) {
        const mode = url.pathname.split("/").at(-1);
        if (!modes.includes(mode)) {
          res.writeHead(404);
          return res.end();
        }
        res.writeHead(303, { Location: `/contact/?previewMode=${mode}` });
        return res.end();
      }
      if (["/api/contact", "/api/contact/"].includes(url.pathname)) {
        const mode = url.searchParams.get("previewMode") || "success";
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 65536) {
            res.writeHead(413);
            return res.end();
          }
          chunks.push(chunk);
        }
        if (mode === "network-failed") {
          req.socket.destroy();
          return;
        }
        const handler = createContactHandler({
          fetcher: async (endpoint) => {
            if (endpoint.includes("siteverify"))
              return Response.json({
                success: mode !== "verification-failed",
                hostname: "localhost",
                action: "test",
              });
            await setTimeout(1500);
            return Response.json(
              mode === "send-failed"
                ? { error: "fixture" }
                : { id: "fixture-accepted" },
              { status: mode === "send-failed" ? 500 : 200 },
            );
          },
        });
        const request = new Request(url, {
          method: req.method,
          headers: req.headers,
          ...(!["GET", "HEAD"].includes(req.method)
            ? { body: Buffer.concat(chunks) }
            : {}),
        });
        const result = await handler({ request, env });
        res.writeHead(result.status, Object.fromEntries(result.headers));
        return res.end(await result.text());
      }
      let file = path.resolve(root, "." + decodeURIComponent(url.pathname));
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403);
        return res.end();
      }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory())
        file = path.join(file, "index.html");
      if (!fs.existsSync(file)) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Content-Security-Policy": csp,
        "Cache-Control": "no-store",
      });
      if (path.extname(file) === ".html") {
        const chosen = url.searchParams.get("previewMode");
        const mode = modes.includes(chosen) ? chosen : "success";
        const banner = `<aside style="padding:12px;background:#fff4cb" aria-label="検証用">画面検証専用（実メール送信なし・${mode}）： ${modes.map((mode) => `<a style="text-decoration:underline;margin-right:12px" href="/__preview/${mode}">${mode}</a>`).join(" ")}</aside>`;
        return res.end(
          fs
            .readFileSync(file, "utf8")
            .replace("<body>", `<body>${banner}`)
            .replace(
              'action="/api/contact"',
              `action="/api/contact?previewMode=${mode}"`,
            ),
        );
      }
      fs.createReadStream(file).pipe(res);
    } catch {
      if (!res.headersSent) res.writeHead(500);
      res.end("Preview error");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Contact preview (no real email): ${origin}/contact/`),
  );
