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


## LOGIN FIX (why "page not found")
GitHub Pages only serves static files, so https://vortexia.top/api/auth/login does not exist there. Pick ONE:

**A) Same domain (recommended): Cloudflare Worker** — deploy `cloudflare/worker.js`, set `BOT_ORIGIN` to your bot host's public HTTPS address, add route `vortexia.top/*`. Leave `API_URL=""` in `dashboard/index.html`.

**B) Subdomain:** point `api.vortexia.top` at the bot host (HTTPS), set `const API_URL="https://api.vortexia.top"` in `dashboard/index.html`, and set `dashboard_public_url` to `https://api.vortexia.top` in the bot's `config.json`. Redirect URI in Discord becomes `https://api.vortexia.top/api/auth/callback`.

Test first: `/api/health` must return `{"ok":true,...}`. The dashboard now shows "API not reachable" instead of a 404 if it doesn't.
