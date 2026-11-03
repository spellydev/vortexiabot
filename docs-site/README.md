# Vortexia Docs — docs.vortexia.top

This is the documentation site bundled inside the website package.

## Deploy the docs subdomain
1. Create a separate static-site project/repository for the docs subdomain (do not mix it with the bot project).
2. Upload the **contents of this `docs-site` folder** as the site root.
3. Configure the custom domain `docs.vortexia.top` in that static host. The included `CNAME` file is for GitHub Pages.
4. In DNS, add the host's required record for `docs` (for GitHub Pages, use the target shown by GitHub Pages; do not put a port in a CNAME).
5. Enable HTTPS and verify `https://docs.vortexia.top/`.

The main website remains `https://vortexia.top/`. Its Docs links point to this subdomain. The Discord bot remains a separate project.
