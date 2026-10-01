import {
  CONTACT_CATEGORIES,
  validContactEmail,
  validateContact,
} from "../../src/js/contact-validation.js";

const MAX_BYTES = 32 * 1024;
const TEST_SECRETS = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);
const TEST_SITES = new Set([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
  "3x00000000000000000000FF",
]);
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);
const GENERIC_ERROR =
  "送信に失敗しました。時間をおいてもう一度お試しください。";
const VERIFICATION_ERROR =
  "送信を確認できませんでした。もう一度お試しください。";

function response(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      ...headers,
    },
  });
}
const failure = (
  status,
  code,
  message = GENERIC_ERROR,
  extra = {},
  headers = {},
) => response(status, { ok: false, code, message, ...extra }, headers);

async function readBody(request) {
  if (Number(request.headers.get("Content-Length")) > MAX_BYTES)
    throw new RangeError();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new RangeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

function configured(env, hostname) {
  const keys = [
    "TURNSTILE_SITE_KEY",
    "TURNSTILE_SECRET_KEY",
    "RESEND_API_KEY",
    "CONTACT_TO_EMAIL",
    "CONTACT_FROM_EMAIL",
  ];
  if (keys.some((key) => typeof env[key] !== "string" || !env[key].trim()))
    return false;
  if (
    !validContactEmail(env.CONTACT_TO_EMAIL) ||
    /[\r\n\u0000-\u001f\u007f]/.test(env.CONTACT_FROM_EMAIL)
  )
    return false;
  const from = env.CONTACT_FROM_EMAIL.match(/^(?:[^<>]+ <)?([^<>]+)>?$/)?.[1];
  if (!validContactEmail(from)) return false;
  const usesTestKey =
    TEST_SECRETS.has(env.TURNSTILE_SECRET_KEY) ||
    TEST_SITES.has(env.TURNSTILE_SITE_KEY);
  return (
    !usesTestKey ||
    (LOOPBACK.has(hostname) &&
      TEST_SECRETS.has(env.TURNSTILE_SECRET_KEY) &&
      TEST_SITES.has(env.TURNSTILE_SITE_KEY))
  );
}

function mail(value, env, date) {
  const category = CONTACT_CATEGORIES[value.category];
  const timestamp = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return {
    from: env.CONTACT_FROM_EMAIL,
    to: [env.CONTACT_TO_EMAIL],
    subject: `[バンドリ楽曲録][${category}] お問い合わせ`,
    text: `バンドリ楽曲録からお問い合わせが届きました。\n\n種類:\n${category}\n\n対象ページ:\n${value.pageUrl || "未入力"}\n\n返信:\n${value.replyRequested ? "希望する" : "不要"}\n\n返信先:\n${value.replyRequested ? value.email : "なし"}\n\nお問い合わせ内容:\n${value.message}\n\n送信日時（日本時間）:\n${timestamp}\n`,
    ...(value.replyRequested ? { reply_to: value.email } : {}),
  };
}

// 外部通信と時刻を注入し、実メールを送らずに全分岐を検証できる。
export function createContactHandler({
  fetcher = globalThis.fetch,
  now = () => new Date(),
} = {}) {
  return async ({ request, env = {} }) => {
    if (request.method !== "POST")
      return failure(405, "method", GENERIC_ERROR, {}, { Allow: "POST" });
    const url = new URL(request.url);
    if (
      request.headers.get("Origin") !== url.origin ||
      request.headers.get("Sec-Fetch-Site") === "cross-site"
    )
      return failure(403, "verification", VERIFICATION_ERROR);
    if (
      request.headers
        .get("Content-Type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() !== "application/json"
    )
      return failure(415, "content_type");
    let input;
    try {
      input = await readBody(request);
    } catch (error) {
      return failure(
        error instanceof RangeError ? 413 : 400,
        error instanceof RangeError ? "too_large" : "invalid_json",
      );
    }
    const checked = validateContact(input);
    if (!checked.value)
      return failure(400, "validation", "入力内容を確認してください。", {
        fieldErrors: checked.fieldErrors,
      });
    if (
      input.contact_guard !== undefined &&
      (typeof input.contact_guard !== "string" || input.contact_guard !== "")
    )
      return failure(403, "verification", VERIFICATION_ERROR);
    if (
      typeof input.turnstileToken !== "string" ||
      !input.turnstileToken.trim() ||
      input.turnstileToken.length > 2048
    )
      return failure(403, "verification", VERIFICATION_ERROR);
    if (!configured(env, url.hostname))
      return failure(
        503,
        "unavailable",
        "お問い合わせは現在受付準備中です。時間をおいてもう一度お試しください。",
      );
    let verification;
    try {
      const result = await fetcher(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: env.TURNSTILE_SECRET_KEY,
            response: input.turnstileToken,
          }),
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!result.ok) return failure(502, "verification", VERIFICATION_ERROR);
      verification = await result.json();
    } catch {
      return failure(502, "verification", VERIFICATION_ERROR);
    }
    const localTest =
      LOOPBACK.has(url.hostname) &&
      TEST_SECRETS.has(env.TURNSTILE_SECRET_KEY) &&
      TEST_SITES.has(env.TURNSTILE_SITE_KEY);
    const correctContext = localTest
      ? (verification?.hostname === "example.com" &&
          verification?.action === undefined) ||
        (LOOPBACK.has(verification?.hostname) &&
          ["contact", "test"].includes(verification?.action))
      : verification?.hostname === url.hostname &&
        verification?.action === "contact";
    if (verification?.success !== true || !correctContext)
      return failure(403, "verification", VERIFICATION_ERROR);
    try {
      const sent = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mail(checked.value, env, now())),
        signal: AbortSignal.timeout(10_000),
      });
      if (!sent.ok) return failure(502, "send_failed");
      const receipt = await sent.json();
      if (typeof receipt?.id !== "string" || !receipt.id)
        return failure(502, "send_failed");
    } catch {
      return failure(502, "send_failed");
    }
    return response(200, { ok: true });
  };
}

export const onRequest = createContactHandler();
