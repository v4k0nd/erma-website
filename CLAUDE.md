# ERMA Website — Claude Code context

## Project overview
Static website rewrite for ERMA Prod-Com, a Romanian horticulture wholesaler (Mureș county, Transylvania). Replacing a legacy Flask/MySQL site on Hosterion shared hosting with a static site deployed to Cloudflare Pages.

Full planning brief in `docs/erma-website-rewrite-brief.md` — read this first for context.

## Architecture

- **`catalog-site/`** — Astro project for `erma.ro` and `www.erma.ro`. Priority 1. **LIVE on Cloudflare Pages staging.**
  - Data source: Google Sheet published as CSV
    - URL: https://docs.google.com/spreadsheets/d/e/2PACX-1vRcSnKN65amdCXAHfu6lM9uph3BAEKIGJu6sFcCG0z4Nr-7NkvVL0wHSZLX0KYWTFamdGtVHHThIdAj/pub?gid=0&single=true&output=csv
  - Languages: Romanian (default) + Hungarian, routes `/ro/` and `/hu/`
  - Analytics: Cloudflare Web Analytics (free, cookieless). Matomo Cloud trial expired April 2024; data not recoverable.
  - Staging URL: https://erma-website.pages.dev/
  - GitHub repo: v4k0nd/erma-website (private)

- **`sere-site/`** — Astro project for `sere.erma.ro`. Priority 2 (not started).
  - Feature: interactive Leaflet map of 114 greenhouse installations
  - Data: `greenhouses.json` extracted from legacy Folium HTML (see brief §13)

## Build configuration (Cloudflare Pages)

- **Root directory:** `catalog-site` (NOT repo root — it's a monorepo)
- **Build command:** `npm install --production && npm run build`
- **Build output:** `dist`
- **Framework preset:** Astro
- **Production branch:** `main`
- **Deploy Hook:** configured for manual rebuilds (URL in project settings)

## Current status (end of session 2026-04-20)

### Done
- DNS migrated to Cloudflare. Nameservers `keaton.ns.cloudflare.com` / `paislee.ns.cloudflare.com`. SPF cleaned (MiniCRM include removed), DMARC added in monitor mode.
- Catalog site V1 built and deployed to Cloudflare Pages staging.
- Google Sheet published as CSV, fetched at build time by `src/lib/catalogs.ts`.
- RO + HU pages with ~12 active catalogs grouped by 6 types (balcon, gradina, seminte, crizanteme, radacini, poinsettia).
- Header: sticky white bar with 8px green top border, 6px bottom border, ERMA hibiscus logo (`public/logo.svg`), uppercase nav links, native language `<select>`.
- Cards: 3D tilt on hover (mousemove JS, guarded by `@media (hover: hover)` for touch devices), soft green shadow, title overlaid on image with dark gradient (no white strip below).
- About pages: full RO + HU content in `src/content/about-{ro,hu}.txt`. 7 partners: Schneider, Elsner PAC, JoluPlant, Straathof, Kebol, Müller, Dobay, Vester.
- Contact pages: phone numbers JS-obfuscated with `tel:` links, Google Maps iframe embedded, responsive grid (info + map side-by-side → stacks on mobile).
- Headers and body text padded 2rem left for proper indentation.
- Deploy Hook + iOS Shortcut set up for manual rebuilds when Google Sheet updates.

### Not yet done
- `erma.ro` A record still points to Hosterion (185.250.104.21). DNS cutover to Cloudflare Pages is the next execution step.
- `/ermavirag/` and `/ermafolia/` legacy sites not yet archived with `noindex`.
- `sere.erma.ro` greenhouse site not started.
- Hosterion hosting plan still active (decommission after 2 weeks of stable Pages traffic).

## Design tokens

- **Brand green:** `#2d6a2d` (headers, logo, links, active states)
- **Accent green:** `#7cb342` (borders, select borders)
- **Background:** `#f5f5f2` (site bg)
- **Image letterbox:** `#e8e8e8` (card image container)
- **Text:** `#1a1a1a`
- **Font:** system-ui, sans-serif (no custom fonts on V1)

## Principles

- Keep it simple. Original Flask app was 160 lines doing basic CRUD. Don't over-engineer.
- Editorial workload is 3–4 catalog swaps per year via Google Sheet. Optimize the build for "dead simple editorial UX," not for developer cleverness.
- Ask before adding dependencies. The old stack had 5 unused Python packages. Don't repeat that.
- Romanian + Hungarian, no English for now.
- No new CSS frameworks. Plain CSS in Base.astro + per-page `<style>` blocks.

## Gotchas learned (important)

- **Astro CSS scoping + `:global()`.** Astro compiles `<style>` selectors with `[data-astro-cid-xxx]`. Slotted content (children rendered via `<slot />`) doesn't carry that attribute, so rules targeting slotted elements silently never match. Fix: wrap selectors in `:global()`. This bit us for `.card img` (object-fit was computing as `fill` instead of `contain`) and `main p` (padding never applied).
- **Flexbox + max-height/max-width percentages on images = sizing bug.** `display: flex; align-items: center` on a container combined with `max-width/max-height: 100%` on the child `<img>` produces wrong sizes (zoomed/cropped). Don't use flex to center an image — use `object-fit: contain` on an image with `width: 100%; height: 100%`.
- **Astro SVG imports can break.** `import logo from '../img/logo.svg'` + `<img src={logo.src}>` rendered as raw XML in browser. Fix: put the SVG in `public/` and use a plain string path `<img src="/logo.svg" />`.
- **Cloudflare Pages uses npm, not bun.** Even if you use `bun` locally, Cloudflare's build runner uses npm. Keep `bun.lock` and `package-lock.json` both in the repo.
- **TypeScript 6.x is too new for `@astrojs/check@0.9.8`.** Peer dependency requires `^5.0.0`. Downgrade to `typescript: "^5.4.0"`.
- **Repo is a monorepo.** `package.json` lives in `catalog-site/`, not at the root. Cloudflare Pages needs `Root directory: catalog-site` set in build settings.
- **`npm install --production` still validates the full dependency tree.** Peer conflicts will fail the build even if the conflicting package isn't installed. Fix conflicts in `package.json` rather than relying on flags.

## File structure

```
catalog-site/
├── astro.config.mjs
├── package.json                 # TypeScript pinned to ^5.4.0
├── bun.lock
├── public/
│   ├── _redirects               # Cloudflare Pages: / → /ro/
│   ├── robots.txt
│   ├── logo.svg                 # ERMA hibiscus logo
│   ├── favicon.svg
│   └── favicon.png
├── src/
│   ├── content/
│   │   ├── about-ro.txt
│   │   ├── about-hu.txt
│   │   ├── contact-ro.txt
│   │   └── contact-hu.txt
│   ├── img/
│   │   ├── logo.svg             # source (also copied to public/)
│   │   ├── logo-xml.svg         # unused alternative
│   │   ├── favicon.svg
│   │   └── favicon.png
│   ├── layouts/
│   │   └── Base.astro           # header, logo, global styles, tilt JS
│   ├── lib/
│   │   └── catalogs.ts          # CSV fetch, parser, groupByType, TYPE_ORDER
│   └── pages/
│       ├── index.astro          # redirects to /ro/
│       ├── ro/
│       │   ├── index.astro      # catalog grid
│       │   ├── about.astro
│       │   └── contact.astro
│       └── hu/
│           ├── index.astro
│           ├── about.astro
│           └── contact.astro
```

## Non-goals

- No CMS beyond Google Sheets for the catalog site.
- No backend. No database. No Python.
- No heavy animations or frameworks. Current tilt + hover effects are the ceiling for V1.
- No English translations yet.

## Next execution steps

1. Point `erma.ro` A record at Cloudflare Pages (delete 185.250.104.21 A record, add CNAME to `erma-website.pages.dev`).
2. Watch Matomo 2 weeks for traffic anomalies.
3. Decommission Hosterion hosting plan.
4. Archive `/ermavirag/` and `/ermafolia/` with `noindex`.
5. Build `sere.erma.ro` (Leaflet map of 114 greenhouses — extraction script in brief §13).
6. Near 2026-10-18 domain expiration: decide transfer-or-renew.
