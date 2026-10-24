# vortexiabot
 Official documentation website for Vortexia — a powerful, feature-rich Discord bot with music, moderation, economy, utility, automation, and more.


## Discord login (setup)
Login uses Discord's implicit OAuth flow (no server/secret needed).
In Discord Developer Portal → your app → OAuth2 → Redirects, add EXACTLY:
- https://vortexia.top/
- https://www.vortexia.top/   (if you use www)
Scope used: `identify`. Test locally by also adding http://localhost:8777/

## SEO checklist
1. Google Search Console → add vortexia.top → submit https://vortexia.top/sitemap.xml
2. Bing Webmaster Tools → import from Search Console
3. Link the site from the bot's Discord application description, top.gg / discordbotlist pages, and the support server.
