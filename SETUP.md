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
