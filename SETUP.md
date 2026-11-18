# Vortexia Website — Static Deployment

This archive contains the static website only. The Discord bot is a separate runtime project.

## Main pages
- Main website: https://vortexia.top/
- Commands: https://vortexia.top/commands/
- Documentation: https://docs.vortexia.top/
- Privacy Policy: https://vortexia.top/privacy/
- Terms of Service: https://vortexia.top/terms/
- Message Content Intent review guide: https://vortexia.top/message-content-intent/
- Support: https://discord.gg/7RfWAKeAZZ

## Deploy
1. Extract the archive.
2. Upload the contents of `vortexiabot-main/` to the static host's root/public directory.
3. Keep `CNAME` at the website root for GitHub Pages custom-domain hosting.
4. Confirm the three policy/review URLs are publicly reachable over HTTPS.
5. Check the privacy policy against the exact production bot configuration and hosting provider before submitting any Discord review.

This package contains no Discord OAuth routes, bot API proxy, bot runtime, bot token or API secrets. Never place secrets in this public website repository.
