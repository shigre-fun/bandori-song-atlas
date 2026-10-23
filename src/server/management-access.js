import cloudflareAccess from "@cloudflare/pages-plugin-cloudflare-access";
import { managementSettings } from "../js/management-settings.js";

function privateResponse(response) {
  const result = new Response(response.body, response);
  result.headers.set("Cache-Control", "private, no-store, max-age=0");
  result.headers.set("CDN-Cache-Control", "no-store");
  result.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  result.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  result.headers.set("Referrer-Policy", "no-referrer");
  result.headers.set("X-Content-Type-Options", "nosniff");
  result.headers.set("X-Frame-Options", "DENY");
  return result;
}
const denied = (status) => privateResponse(new Response(null, { status }));

export async function managementAccess(context, servePrivate) {
  const url = new URL(context.request.url);
  // Public pages/contact never depend on Access settings or key availability.
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return denied(400);
  }
  if (/\/(?:_routes\.json|_headers|_redirects|_worker\.js)$/.test(pathname))
    return denied(404);
  const candidate = /(?:^|\/)[a-f0-9]{32}(?:\/|$)/.test(pathname);
  if (!candidate) {
    // Reject retired URLs before Pages can return a cached legacy asset.
    if (/(?:^|\/)admin(?:[./-]|$)/.test(pathname)) return denied(404);
    return context.next();
  }
  let settings;
  try {
    settings = managementSettings(context.env);
  } catch {
    return denied(503);
  }
  if (
    !settings.enabled ||
    url.origin !== settings.origin ||
    !(
      pathname === settings.root.slice(0, -1) ||
      pathname.startsWith(settings.root)
    )
  )
    return denied(404);
  if (!context.request.headers.get("Cf-Access-Jwt-Assertion"))
    return denied(403);
  try {
    // The official plugin verifies the RSA signature against the team's keys.
    // Require all claims explicitly as well: plugin 1.0.5 treats missing claims as optional.
    let authorized = false;
    const response = await cloudflareAccess({
      domain: settings.domain,
      aud: settings.aud,
    })({
      ...context,
      functionPath: "/",
      next: async () => {
        const p = context.data.cloudflareAccess?.JWT?.payload;
        const now = Date.now() / 1000;
        if (
          !p ||
          p.iss !== settings.domain ||
          !Array.isArray(p.aud) ||
          !p.aud.includes(settings.aud) ||
          !Number.isFinite(p.exp) ||
          p.exp <= now ||
          !Number.isFinite(p.iat) ||
          p.iat > now + 60 ||
          (p.nbf !== undefined && (!Number.isFinite(p.nbf) || p.nbf > now)) ||
          typeof p.email !== "string" ||
          !settings.emails.includes(p.email.toLowerCase()) ||
          p.type !== "app"
        )
          return denied(403);
        authorized = true;
        if (url.pathname === settings.root.slice(0, -1)) {
          url.pathname += "/";
          return new Response(null, {
            status: 308,
            headers: { Location: url.toString() },
          });
        }
        return servePrivate();
      },
    });
    return authorized ? privateResponse(response) : denied(403);
  } catch {
    return denied(403);
  }
}

export function managementHandler(files) {
  return (context) =>
    managementAccess(context, () => {
      if (!["GET", "HEAD"].includes(context.request.method))
        return new Response(null, {
          status: 405,
          headers: { Allow: "GET, HEAD" },
        });
      const pathname = decodeURIComponent(
        new URL(context.request.url).pathname,
      );
      const key = pathname.endsWith("/") ? pathname + "index.html" : pathname;
      const asset = Object.hasOwn(files, key) ? files[key] : null;
      if (!asset) return new Response(null, { status: 404 });
      return new Response(
        context.request.method === "HEAD" ? null : asset.body,
        { headers: { "Content-Type": asset.type } },
      );
    });
}
