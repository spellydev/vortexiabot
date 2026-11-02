// Cloudflare Worker for Vortexia — routes /api/* and /setup to the bot.
// CHANGE ONLY THIS LINE:
const BOT_ORIGIN = "https://YOUR-BOT-PUBLIC-HTTPS-ADDRESS"; // no trailing slash

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname === "/setup") {
      const target = new URL(url.pathname + url.search, BOT_ORIGIN);
      const headers = new Headers(request.headers);
      headers.set("X-Forwarded-Host", url.host);
      headers.set("X-Forwarded-Proto", "https");
      return fetch(new Request(target, { method: request.method, headers, body: request.body, redirect: "manual" }));
    }
    return fetch(request);
  },
};
