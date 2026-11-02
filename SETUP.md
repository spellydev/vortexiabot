# Vortexia Website deployment

Upload the **contents of this folder** to the root of the GitHub Pages repository (not the enclosing folder). Keep the existing page folders and assets.

## Dashboard connection
- Website: `https://vortexia.top`
- Dashboard API: `https://vortexia.top`
- Discord OAuth2 callback: `https://vortexia.top/api/auth/callback`

The Dashboard page calls the bot's API at `https://vortexia.top`. The bot host must expose the Node.js dashboard API through a working HTTPS custom-domain reverse proxy for that hostname. DNS alone, or pointing a CNAME at a provider's generic website, does not forward HTTP requests to the bot's application port.

In the Discord Developer Portal for the same application as the bot, add this exact OAuth2 redirect:
`https://vortexia.top/api/auth/callback`

Do not place bot tokens, OAuth client secrets, API keys, or session secrets in this website repository. Configure those privately in the bot host's Variables/Secrets panel or the bot's existing private config.

See the bot package's `DASHBOARD-SETUP.md` for the hosting-side checklist. The website package cannot bind the API hostname or issue its HTTPS certificate.


Single-domain note: Dashboard API requests use the same origin (/api). Configure the hosting reverse proxy so /api/* is forwarded to the Bot Node.js API. Bot and Website remain separate projects/ZIP files.


## LOGIN FIX — "API not reachable" (do these in order)
vortexia.top is a GitHub Pages site, so `/api/*` does not exist there. The bot must be reached through a Cloudflare Worker.

1. **HidenCloud → Reverse Proxy:** DELETE the existing `vortexia.top` proxy (it fights with GitHub Pages). Create a new one: HidenCloud subdomain, e.g. `vortexiaapi` on `hidenplay.net`, allocation `ariella.hidencloud.com:24611`. Wait until `https://vortexiaapi.hidenplay.net/api/health` shows `{"ok":true,...}` in your browser (bot must be running).
2. **Cloudflare → DNS:** `vortexia.top` records (the 4 GitHub IPs or CNAME) must be **Proxied (orange cloud)**.
3. **Cloudflare → Workers:** create a Worker, paste `cloudflare/worker.js`, set `BOT_ORIGIN` to the address from step 1, Deploy. Add route `vortexia.top/*` (zone: vortexia.top).
4. **Discord Developer Portal → OAuth2 → Redirects:** `https://vortexia.top/api/auth/callback`
5. Test `https://vortexia.top/api/health`, then open `https://vortexia.top/dashboard/`.

Leave `API_URL=""` in `dashboard/index.html`. Do not use the Cloudflare "Quick Tunnel" — its address changes every restart.
