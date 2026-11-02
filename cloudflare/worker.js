// Cloudflare Worker: route https://vortexia.top/api/* (and /setup) to the bot, everything else to GitHub Pages.
// 1) Set BOT_ORIGIN to the public HTTPS address where your bot host exposes its dashboard port.
// 2) Workers > your worker > Triggers > add route: vortexia.top/*  (zone vortexia.top, DNS record proxied/orange cloud)
const BOT_ORIGIN = "https://YOUR-BOT-HOST-PUBLIC-HTTPS-ADDRESS"; // no trailing slash

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
    return fetch(request); // falls through to the normal GitHub Pages origin
  },
};
