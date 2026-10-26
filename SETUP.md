# Connect bot -> website with NO terminal

1. Upload `src/systems/webStats.js` and the patched `index.js` to your bot host (file manager), restart the bot.
2. On GitHub (the repo your website lives in): Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens
   -> Generate. Repository access: ONLY your website repo. Permissions: Contents = Read and write. Copy the token.
3. In your bot's config.json add (or use the host's Variables tab with the same names in CAPS, e.g. WEB_STATS_GITHUB_TOKEN):
   "web_stats_github_token": "PASTE_TOKEN",
   "web_stats_github_repo": "yourgithubname/your-website-repo"
4. Restart. After ~1 minute the bot creates stats.json in the repo, then updates it every 30 min. The site reads it automatically.
Keep the token private (never put it in the website files).

## v6 notes
- Replace `src/systems/webStats.js` and `STATS-SETUP.md` on the bot host with the ones in the bot patch zip, then restart. The site then auto-shows server icons (Kitchens) and top-level user avatars (Top chefs) from `stats.json`.
- Until the bot pushes the new `stats.json`, those two sections show friendly empty states.
- Owner name is `CFG.owner` in `index.html` (and `web_owner_name` in the bot config).
- Easter egg: tap the logo 5 times.
