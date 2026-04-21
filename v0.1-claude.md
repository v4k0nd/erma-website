# ERMA Website — Claude Code context

## Project overview
Static website rewrite for ERMA Prod-Com, a Romanian horticulture wholesaler (Mureș county, Transylvania). Replacing a legacy Flask/MySQL site on Hosterion shared hosting with a static site deployed to Cloudflare Pages.

Full planning brief in `docs/erma-website-rewrite-brief.md` — read this first for context.

## Architecture

- **`catalog-site/`** — Astro project for `erma.ro` and `www.erma.ro`. Priority 1.
  - Data source: Google Sheet published as CSV
    - URL: https://docs.google.com/spreadsheets/d/e/2PACX-1vRcSnKN65amdCXAHfu6lM9uph3BAEKIGJu6sFcCG0z4Nr-7NkvVL0wHSZLX0KYWTFamdGtVHHThIdAj/pub?gid=0&single=true&output=csv
  - Languages: Romanian (default) + Hungarian, routes `/ro/` and `/hu/`
  - Analytics: Matomo Cloud (preserve existing tracking)

- **`sere-site/`** — Astro project for `sere.erma.ro`. Priority 2 (build after catalog site is live).
  - Feature: interactive Leaflet map of 114 greenhouse installations
  - Data: `greenhouses.json` extracted from legacy Folium HTML (see brief §13)

## Current status

- DNS migrated to Cloudflare (completed April 2026). Nameservers `keaton.ns.cloudflare.com` / `paislee.ns.cloudflare.com`.
- Google Sheet created and published as CSV feed.
- New site builds not yet started — Hosterion still serves erma.ro.
- All historical content preserved in `/ermavirag/` and `/ermafolia/` on Hosterion — will be archived with `noindex` once migration completes.

## Principles

- Keep it simple. Original Flask app was 160 lines doing basic CRUD. Don't over-engineer.
- Editorial workload is 3–4 catalog swaps per year via Google Sheet. Optimize the build for "dead simple editorial UX," not for developer cleverness.
- Ask before adding dependencies. The old stack had 5 unused Python packages. Don't repeat that.
- Romanian + Hungarian, no English for now.

## Non-goals

- No CMS beyond Google Sheets for the catalog site.
- No backend. No database. No Python.
- No fancy animations on V1. Polish later.