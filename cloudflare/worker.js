// Cloudflare Worker for Vortexia — sends /api/* and /setup to the bot, everything else to GitHub Pages.
// CHANGE ONLY THIS LINE: the HTTPS address HidenCloud gave you for the bot (no trailing slash, no port).
// Example: const BOT_ORIGIN = "https://vortexiaapi.hidenplay.net";
const BOT_ORIGIN = "https://YOUR-BOT-PUBLIC-HTTPS-ADDRESS";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const isBot = url.pathname.startsWith("/api/") || url.pathname === "/setup";
    if (!isBot) return fetch(request); // normal website (GitHub Pages)

    if (BOT_ORIGIN.includes("YOUR-BOT")) {
      return json({ ok: false, error: "Worker not configured: edit BOT_ORIGIN in worker.js" }, 500);
    }
    const target = new URL(url.pathname + url.search, BOT_ORIGIN);
    const headers = new Headers(request.headers);
    headers.set("X-Forwarded-Host", url.host);
    headers.set("X-Forwarded-Proto", "https");
    const init = { method: request.method, headers, redirect: "manual" };
    if (!["GET", "HEAD"].includes(request.method)) init.body = await request.arrayBuffer();
    try {
      return await fetch(new Request(target, init));
    } catch (e) {
      return json({ ok: false, error: "Bot is offline or BOT_ORIGIN is wrong" }, 502);
    }
  },
};

function json(body, status) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
