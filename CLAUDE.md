# ERMA Website — Claude Code context

## Project overview
Static website rewrite for ERMA Prod-Com, a Romanian horticulture 
wholesaler (Mureș county, Transylvania). Replacing a legacy 
Flask/MySQL site on Hosterion shared hosting with a static site 
on Cloudflare Pages.

Full planning brief and execution log: `docs/erma-website-rewrite-brief.md`

## Architecture

- **`catalog-site/`** — Astro project for `erma.ro` / `www.erma.ro`
  - Data: Google Sheet published as CSV
    https://docs.google.com/spreadsheets/d/e/2PACX-1vRcSnKN65amdCXAHfu6lM9uph3BAEKIGJu6sFcCG0z4Nr-7NkvVL0wHSZLX0KYWTFamdGtVHHThIdAj/pub?gid=0&single=true&output=csv
  - Schema: id, active, supplier, name, url, image, type, created_at
  - Parser: PapaParse with `header: true` — address fields by name, 
    NOT by position. Reordering Sheet columns must not break anything.
  - Languages: Romanian (`/ro/`) + Hungarian (`/hu/`)
  - Analytics: Cloudflare Web Analytics (automatic injection, no 
    snippet needed — configured in Cloudflare dashboard)

- **`sere-site/`** — Astro project for `sere.erma.ro` (not started)
  - Feature: interactive Leaflet map of 114 greenhouse installations
  - Data: `greenhouses.json` to be extracted from legacy Folium HTML

## Current status (as of 2026-04-21)

- Site built and tested: `erma-website.pages.dev/ro/` ✓
- DNS on Cloudflare ✓
- Analytics configured ✓
- **Pending: point `erma.ro` A/CNAME at Cloudflare Pages** (cutover)

## Key architectural decisions

- **No backend.** No database. No Python. Pure static.
- **Google Sheets as CMS.** 10 active rows. 3-4 updates/year. 
  Editorial workflow: edit Sheet → trigger Deploy Hook → done.
- **`public/` vs `src/img/`**: files in `public/` are served 
  verbatim (use for logos, favicon). Files in `src/img/` go 
  through astro:assets (use for hero photos and anything needing 
  AVIF/WebP conversion).
- **Partner logos in `public/partners/`** — plain `<img>` tags, 
  no pipeline. Data in `src/data/partners.json`.

## Known gotchas

- Elements rendered in `.map()` callbacks don't get the component's 
  `data-astro-cid` — use `:global()` for CSS that targets them.
- SVGs without intrinsic width/height collapse in `align-items: 
  center` flex containers. Use default `stretch` instead.
- Safari requires `xmlns="http://www.w3.org/2000/svg"` on SVG 
  files served as `<img>` — always include it.
- PapaParse is the CSV parser. Never revert to positional indexing.

## Principles

- Keep it simple. Optimize for the 3-4x/year update moment.
- Ask before adding dependencies.
- RO + HU, no English.
- No CMS beyond Google Sheets for the catalog site.