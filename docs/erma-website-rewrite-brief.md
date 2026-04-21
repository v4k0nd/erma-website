# ERMA Website Rewrite — Planning Brief

*A self-contained context document. Paste this at the start of a new session to continue planning.*

---

## 1. Company & Business Context

- **ERMA Prod-Com** — Romanian horticulture company (Mureș county, Transylvania).
- Core business: flower cuttings (butași), geraniums (muscate zonale/curgatoare), balcony flowers, chrysanthemums, seeds, perennials, poinsettias.
- Secondary business: **building and renovating greenhouses** (sere).
- Partnered with Plant Alliance Hungary, Syngenta Flowers, Elsner PAC, Schneider, Muller, Joluplant, Straathof, Kebol.
- Customer base: wholesale across Romania. Free delivery in Mureș county.
- Language audience: **Romanian + Hungarian** (Mureș has a large Hungarian-speaking population). No English needed on current site.

## 2. What the Website Actually Does

The `erma.ro` domain currently hosts **three distinct site-areas**:

1. **Modern catalog site (`/ro/` and `/hu/`)** — the 2019 rewrite. Primary job: display a grid of current season catalogs (mostly PDFs hosted by partner suppliers, one hosted on erma.ro) so that sales agents can open it during phone calls with clients, and clients can browse catalogs and call back with product codes. Updated 3–4 times per year.
2. **Old flower-cuttings site (`/ermavirag/index.html`)** — 2007-era, Web Page Maker output. Hungarian: *virág* = flower. Superseded by the modern catalog site but still reachable.
3. **Old greenhouse/irrigation site (`/ermafolia/indexsere.html`)** — 2007-era, same Web Page Maker style. Hungarian: *fólia* = foil/plastic sheeting used in greenhouse construction. Nav: Home / Solarii profesionale / Irigații / Galerie / Oferta de pret / Contact. Covers the greenhouse-construction side of the business (ERMA has built greenhouses since 2008). **`sere.erma.ro` currently redirects here.** Not superseded — still the current greenhouse-side web presence.

Total editorial workload today: the catalog grid gets touched 3–4 times per year; the other two sites are effectively static fossils.

## 3. Website History

| Year | What happened |
|---|---|
| 2007 | Built with "Web Page Maker" (Windows drag-and-drop WYSIWYG). Absolute positioning, inline styles, `<marquee>`-style JS scroller, table layouts. Still accessible at `/ermavirag/index.html`. |
| 2019 | Rewritten: mobile-responsive, Python backend for catalog switching, RO/HU language switching, Matomo Cloud analytics, GSAP animations. Live at `erma.ro/ro/` and `erma.ro/hu/`. |
| 2026 | **This rewrite** — reason for this document. |

## 4. Current Technical Stack

- **Host:** Hosterion (Romanian, cPanel).
  - *Pros:* responsive human support via chat — they got the clunky Python deploy working.
  - *Cons:* archaic cPanel, bloated with unused tools, painful for a use case this simple.
- **Backend (`~/erma-flask-py/`):** Flask app, ~160 lines, Python 3.7 under Passenger/LiteSpeed. End-of-life Python is a ticking time bomb — dependency upgrades already fail. User confirms upgrades break "in insanely difficult to troubleshoot ways" on cPanel.
  - Dependencies (`requirements.txt`): `Flask`, `Flask-SQLAlchemy`, `flask-cors`, `mysql-connector-python`, `python-dotenv`, `Flask-Assets`, `cssmin`. **Of these, only Flask + SQLAlchemy are actually used; the rest are dead weight** (no API clients, no runtime asset bundling needed in the new world, no DB in the new world).
  - Routes: 6 total (3 per language × RO/HU): `/`, `/{lang}/`, `/{lang}/about`, `/{lang}/contact`. Gallery routes exist in code but are commented out.
  - **Zero custom business logic.** Every request does: read active catalogs from MySQL, group by type, load a translations JSON, render a template.
  - Minor issues noted: `app.debug = True` in production (leaks stack traces); `SECRET_KEY` env var is being reused as the MySQL password (should be separate); `CORS` enabled globally but nothing consumes it.
- **Database:** MySQL, one table `catalogs` with 6 columns: `id`, `name`, `url`, `image`, `type`, `active`, `created_at`. **This is a spreadsheet pretending to be a database.** Zero joins, zero relationships, zero write traffic from the public web — only the admin/office team adds/edits rows.
- **Frontend:** Jinja templates in `~/erma-flask-py/templates/{ro,hu}/`, custom CSS in `static/css/`, GSAP for load-in animations, Matomo tracking embedded. Custom font files (Blanco, MDPrimer) in `static/fonts/`.
- **Translations:** `translations/ro.json`, `translations/hu.json`, `translations/template.json`. Clean separation — trivial to port to any i18n system.
- **Git setup:** `public_html/.git/` exists, remote is **`git@github.com:v4k0nd/erma-website-cpanel.git`** (GitHub repo, owned by the user's personal account). Last 4 commits are just the abandoned GitHub Actions experiment. The repo is reusable as the starting point of the new project if desired — or a fresh repo is equally fine at this scale. GitHub Actions config itself is abandoned/non-functional per user and can be discarded.
- **Cron jobs:** none (`crontab -l` empty). Nothing scheduled to worry about.
- **Database contents confirmed via direct SQL query:**
  - 28 total rows in `catalogs`, grouped by type: gradina (garden) × 3, crizanteme (chrysanthemums) × 3, radacini (roots) × 2, balcon × 1, poinsettia × 1, seminte (seeds) × 1 — the remainder are `active=false` historical rows.
  - ~12 active catalog rows at any given time. This is the entire editorial workload.
- **Redirects preserved in `.htaccess`:**
  - `/fb` → `https://fb.me/ErmaProdCom`
  - `/erma-catalog` → `/kataloguspdf/catalog-flori-ERMA-bienale-2020.pdf` *(stale — points to a 2020 file; verify intent before migrating)*
  - HTTPS enforcement sitewide.
- **Analytics:** Matomo Cloud (privacy-respecting — keep this).
- **Languages:** RO (default) + HU, via `/ro/` and `/hu/` URL prefixes.

### The greenhouse map — better news than we expected

`public_html/maps/` contains **four pre-rendered Folium HTML files** (dated Jan 2022). Folium is a Python library that generates fully self-contained Leaflet HTML — the Python already ran once, the output is static HTML. Files:
- `df_2019_gh-erma-foliahaz.html`
- `df_2020_gh-erma-foliahaz.html`
- `df_2021_gh-erma-foliahaz.html`
- `df_all_2019_2021_gh-erma-foliahaz.html` — the combined map, **114 greenhouse markers** (confirmed via `grep -c "L.marker"`)

**Implications:**
- The map has never actually needed a server. Deploys as static HTML anywhere.
- The original Python generator script is not on Hosterion — probably a notebook on an old PC. We don't need it. The 114 marker coordinates and popup content are embedded in the HTML and can be parsed out with a one-off script into a clean JSON data file.
- Once extracted to JSON, the new `sere.erma.ro` site uses Leaflet (or MapLibre) directly in the browser to render the map from that JSON. No Python runtime anywhere in the new architecture.
- Current popups read "n/a" — an opportunity to enrich with greenhouse name, year, photo, and a link to the existing `galeria/<site-name>/` image folders (some `galeria/` subfolders are already named after installation sites like `campia turzii cluj` and `folia curteni mures`).
- Haven't been updated since 2022 — confirms this is low-priority / no recency pressure.

### Content footprint

- Total `~ermaro/` home directory: **2.9 GB**, dominated by `public_html/galeria/` (photo archives of greenhouse sites and flower varieties).
- Catalog PDFs: in `public_html/kataloguspdf/` and `public_html/katalogusok/`.
- Custom fonts, CSS, images: ~a few MB, in `~/erma-flask-py/static/`.
- Total "stuff worth preserving" once dependency folders and build artifacts are excluded: probably under 1 GB.


- **Domain:** `erma.ro`, registered 2005-10-20, **expires 2026-10-18** (6 months from now — natural deadline).
  - Registrar: Hosterion SRL (Romanian).
  - Nameservers: `ns1/ns2.hosterion.com`, `ns1/ns2.hosterion.net` — DNS also at Hosterion.
  - DNSSEC: not enabled (no DS records).
  - Server IP: `185.250.x.x` (Hosterion shared hosting, `gaia.hosterion.net`).
  - cPanel version 110.
- **Email:** **Google Workspace Gmail** on erma.ro.
  - MX records point to `aspmx.l.google.com` + alt1-4 (standard Google Workspace setup, confirmed via dig).
  - SPF record currently: `v=spf1 include:_spf.google.com include:spf.minicrm.io ~all`. **MiniCRM is no longer used** (cancelled ~4 years ago) — the `include:spf.minicrm.io` entry should be removed during the DNS cleanup. Current CRM is **Odoo**; if Odoo sends mail from `@erma.ro` addresses, an Odoo SPF include + DKIM setup will be needed (TBC).
  - DKIM configured (`default._domainkey.erma.ro`).
  - **DMARC: absent.** Opportunity to add `v=DMARC1; p=none; rua=mailto:...` in report-only mode during the DNS move. Zero risk, improves deliverability and visibility.
  - Other TXT tokens present: `apple-domain-verification=...` (purpose TBD — possibly Apple Business Connect or an old verification) and `mc-domain-verification=...` (Mailchimp — still in use?).
  - **Critical consequence:** email is entirely independent of Hosterion. Only the MX/SPF/DKIM/DMARC DNS records need to survive a migration. No mailbox data lives on Hosterion.
- **Third-party SaaS dependencies in DNS** (TBC with user):
  - ~~MiniCRM~~ — no longer used, SPF include can be removed.
  - Odoo — current CRM. Does it send mail from `@erma.ro`? If yes, needs SPF/DKIM setup.
  - Mailchimp — possibly active (verification token present), status unconfirmed.
  - Apple — verification token present, purpose unknown.
- **`sere.erma.ro` currently redirects to `erma.ro/ermafolia/indexsere.html`** — the legacy greenhouse site. So the subdomain is not free to "just reuse"; we have to handle the legacy content first (either archive `ermafolia/` and redesign `sere.erma.ro` as the new greenhouse site, or keep the redirect temporarily and switch it later).
- **Not present / not set** (all fine): no IPv6 (AAAA), no DNSSEC (DNSKEY/DS), no CAA restrictions. Cloudflare DNS would add IPv6 + DNSSEC for free.

### Layer decoupling (important)

The four layers can be moved independently and in any order:

| Layer | Current | Notes |
|---|---|---|
| Domain registrar | Hosterion SRL | Controls the .ro registration itself. Can stay or transfer. |
| DNS hosting | Hosterion nameservers | Controls where records live. Easiest layer to move. |
| Website hosting | Hosterion shared hosting | The actual files + Python runtime. |
| Email | Google Workspace | Untouched by any migration as long as MX/SPF/DKIM/DMARC records are preserved. |

## 5. Goals for This Project

1. **Move off Hosterion** to a new hosting provider.
2. **Redesign the main catalog site** at `erma.ro` / `www.erma.ro` — primary priority.
3. **Redesign the greenhouse site** at `sere.erma.ro` — secondary priority, "nice to have" per the user. Includes an interactive map/gallery of greenhouses ERMA has built as the standout feature.
4. **Archive older versions** (`/ermavirag/` and `/ermafolia/`) with `noindex` but reachable by direct URL.
5. **Hosting bill must be invoiceable to ERMA** — the company needs a proper fiscal invoice (factură) it can book as a business expense. Constrains hosting choice (EU VAT handling or Romanian entity).
6. **Clean up stale DNS artifacts** during migration: remove MiniCRM SPF include, evaluate Mailchimp/Apple tokens, add DMARC in report-only mode, add Odoo SPF/DKIM if needed.

### Open architectural question: does the greenhouse map need Python?

The original framing was "a map written in Python." For a static list of greenhouse sites (coordinates + photos + year + description), a fully client-side map using Leaflet or MapLibre with a JSON data file is simpler, free to host, and requires no backend. Python only becomes necessary if you want:
- A database-backed admin interface to edit greenhouses on the fly
- Server-side analytics per greenhouse
- Integration with external APIs at request time

**If we skip Python, the entire stack becomes free-tier static hosting — no VPS, no server maintenance.** Worth deciding deliberately. See §9 for how this changes the stack.

## 6. Constraints & Non-Negotiables

- **Editorial workflow must stay dead simple.** 3–4 catalog updates per year. Whoever is updating should not need to touch a cPanel or deploy Python to swap a PDF and a thumbnail.
- **Language support:** RO + HU must continue to work.
- **Invoicing:** provider must issue a proper invoice to the Romanian legal entity.
- **Don't lose Matomo history** or break analytics continuity if avoidable.
- **Don't break existing URLs that Google has indexed** without 301 redirects.

## 7. Key Decisions to Make (Planning Phase)

### 7a. Architecture *(locked in)*

**Two independent static sites on separate subdomains:**
- `erma.ro` / `www.erma.ro` — catalog site (primary priority).
- `sere.erma.ro` — greenhouse/irrigation business site (secondary priority), includes the interactive greenhouse gallery/map.

**Map implementation: static JSON + client-side Leaflet. No backend.** Decided: the existing maps are Folium HTML output (confirmed by inspection of `public_html/maps/`), meaning they were always static. The 114 greenhouse markers will be extracted from the existing combined HTML file into a JSON data file, then rendered by a modern Leaflet or MapLibre component in the new site. This keeps the entire stack on free static hosting with no VPS, no server to maintain, no runtime to break.

**Data extraction plan (one-off task during the rewrite):**
1. Parse `public_html/maps/df_all_2019_2021_gh-erma-foliahaz.html` to pull out the 114 `L.marker([lat, lng], {})` coordinates.
2. Match each marker to its popup content (currently mostly "n/a" — low information, but anchors the structure).
3. Enrich: add greenhouse name, year, client (if public), link to `galeria/<site>/` photos where a matching folder exists.
4. Save as `greenhouses.json` in the new sere-site repo. This becomes the editable source of truth going forward.

**Rewriting the main catalog site:**
The existing Flask app is ~160 lines of render-template glue over a 6-column MySQL table. The database has no write traffic from the public web — only office staff add/edit rows. This means the entire thing can be collapsed into a static site generator reading a data file managed by the CMS. No MySQL, no Python runtime, no Passenger, no LiteSpeed config, no CloudLinux Passenger magic. The 3-4 catalog updates per year happen via the CMS admin UI, which commits changes to git, which triggers a rebuild. Done.

### 7b. Hosting candidates (need invoice-to-company)
- **Hetzner (Germany)** — cheap, reliable, issues EU invoices with reverse-charge VAT for Romanian companies. Good for a small VPS if Python is needed.
- **Netlify / Vercel / Cloudflare Pages** — free tier covers the static side easily; verify each can issue a proper invoice to a Romanian SRL with VAT ID.
- **OVH / Contabo** — EU-based, invoice-friendly.
- **Staying Romanian:** ClausWeb, or a simpler plan at a different Romanian provider if human-support-in-Romanian is valued (as Hosterion's chat was).

### 7c. Editing workflow for catalogs *(refined with content-volume data)*

**Maintainer profile:**
- *Primary:* 25-year-old office employee, 7 years at ERMA. Comfortable with a web admin panel; probably fine with git if shown once, but not the point.
- *Stretch goal:* a Gen X adult should be able to update the site from an **iPhone 17 on the go**.

**Content volume (confirmed from live DB):** 28 rows total in the `catalogs` table, ~12 active at any time, across 6 types. The entire editorial job is: change a PDF link, change a thumbnail, toggle `active`. Maybe add one new row per catalog season.

The mobile-on-iPhone stretch goal rules out pure git/YAML workflows (editing and committing from a phone is painful for non-developers). But at this volume, even a full CMS may be overkill. Three serious candidates:

**Option 1 — Google Sheet as source of truth** (newly recommended for consideration given the volume)
- One row per catalog with columns `name`, `url`, `image`, `type`, `active` — matches the existing DB schema 1:1.
- Office staff already know Google Sheets; Google Workspace is already paid-for; the Sheets iOS app is excellent; version history is built in.
- At build time, the static site generator fetches the sheet (via a published CSV URL or the Sheets API) and rebuilds.
- Image uploads would still need somewhere to live — either commit them to the site repo or use a simple folder on Google Drive / Cloudflare R2.
- **Strongest case for the Gen X mobile stretch goal** since there's no new tool to learn.
- Weakest case: no image upload UI, moderate brittleness if a non-developer renames a column header.

**Option 2 — Sanity (headless CMS)**
- Polished mobile admin (their Studio works well on iPhone 17 Safari).
- Generous free tier; very easy to model "catalog with title, thumbnail, PDF link, language, active flag."
- Content lives in Sanity's cloud; the static site pulls it at build time via their API.
- Built-in image upload and hosting.
- Best for future scope expansion; slightly overkill for 12 active rows.

**Option 3 — Decap CMS**
- Git-backed: content lives in the repo as YAML/JSON alongside code.
- Free, self-hosted at `/admin` on the site itself.
- Mobile UX is functional but rougher than Sanity.
- Good if version-control-of-content matters more than admin polish.

*Avoid:* raw git edits via GitHub mobile app — the Gen X stretch user will hit a merge conflict or broken YAML indent on day three and give up.

**Updated recommendation for the catalog site specifically:** given the dozen-active-rows reality, **Google Sheets** is worth serious consideration. It aligns perfectly with the Gen-X-on-iPhone stretch goal (no new tool to learn) and matches the actual volume (not a CMS-scale problem). Sanity remains the right answer if image-uploads-from-mobile or future content types are expected.

The `sere.erma.ro` site has more complex content (greenhouse records with photos, descriptions, coordinates), so a proper CMS makes more sense there. It's fine — and probably good — for the two sites to use different editing tools.

### 7d. Archiving the old sites *(decided, scope expanded)*
**Intent confirmed: not indexed by Google, still reachable by direct URL.**

**Two directories to archive, not one:**
- `/ermavirag/` — old flower-cuttings site (superseded by the modern catalog site).
- `/ermafolia/` — old greenhouse/irrigation site (to be superseded by the new `sere.erma.ro` site once that redesign is done).

Plan:
- Keep both paths reachable at their current URLs (or move to `erma.ro/archive/ermavirag/` and `erma.ro/archive/ermafolia/` — either works, just be consistent with 301s if moving).
- Add `<meta name="robots" content="noindex, nofollow">` to every page in those directories.
- Add `Disallow: /ermavirag/` and `Disallow: /ermafolia/` in `robots.txt` as a belt-and-braces signal.
- Submit removal requests in Google Search Console once noindex is live, so they drop from the index faster.
- Remove any remaining internal links from the main site and sitemap.
- **Timing note:** `/ermafolia/` stays live and primary for greenhouse info until the new `sere.erma.ro` site is ready; archiving it is the *last* step of the sere-site redesign, not a day-one action.

*Note: `robots.txt` alone does not guarantee de-indexing — if another site links to the archive, Google can still list it. The meta tag is the real enforcer; robots.txt is the hint.*

## 8. Open Questions for the User

*Resolved:* archiving intent • map subdomain • maintainer profile • email provider (Google Workspace) • registrar (Hosterion SRL, expires 2026-10-18) • DMARC absent (add in monitor mode) • DNSSEC/IPv6/CAA absent (fine) • MiniCRM cancelled (remove from SPF) • `sere.erma.ro` serves `/ermafolia/` • scope (two redesigned sites) • **map architecture: static Leaflet + JSON data file, no backend** • greenhouse count: **114** • **catalog count: 28 rows, ~12 active** • no cron jobs • existing GitHub repo: `v4k0nd/erma-website-cpanel` • **Odoo: handled by a third-party vendor — not our migration concern** • **Mailchimp & Apple TXT records: leave alone, inert** • **registrar access: user has it**.

Still open (deferred to execution, not blocking the planning phase):

1. **Budget confirmation.** With confirmed static stack, realistic floor is €0–2/month plus domain. Worth the conversation with accounting before acting, but not blocking.
2. **Greenhouse popup content.** What each pin should display — name + year at minimum, photo/client/link nice-to-have. A content-gathering task for the sere-site phase.
3. **Add English?** Defer to design phase. Not needed today, easy to add.
4. **SEO importance.** Affects effort on meta tags / sitemaps; defer to build phase.
5. **Hosterion hosting plan billing date & cost.** For timing the decommission. A 2-minute lookup whenever needed.
6. **Transfer the .ro domain away from Hosterion?** Defer to October 2026, near expiration.
7. **TALMOB partnership on the sere site.** Ask whoever manages vendor relationships before redesigning that section.
8. **`/erma-catalog` redirect.** Points to a 2020 PDF — update destination during content migration.
9. **Reuse existing GitHub repo or start fresh?** Minor; most cleanly, start a fresh repo for the new project and archive `erma-website-cpanel` on GitHub.
10. **Rotate the MySQL password.** Moot once the Flask app is decommissioned; low priority until then.
11. **CMS for catalog site: Google Sheet vs Sanity.** Decide in the build phase based on whether mobile image uploads matter.

## 9. Hosting & Domain Plan — Concrete Options

### 9a. Recommended migration sequence (lowest risk)

Each step is independently reversible until the one after it happens:

1. **Move DNS to Cloudflare (or Hetzner DNS).** Free. Copy every record 1:1, wait for propagation, change nameservers at the registrar. Email keeps working because MX/SPF/DKIM/DMARC are preserved. After this, DNS edits are fast and mobile-friendly.
2. **Build the new static site.** Develop locally or on a staging URL. Nothing changes for the live site yet.
3. **Point `erma.ro` / `www.erma.ro` at the new static host** (change A/CNAME records — now easy since DNS moved). Old Hosterion stays live but unreferenced.
4. **Stand up the Python service on `sere.erma.ro` (or `harta.erma.ro`).** Separate subdomain record, separate host.
5. **Watch Matomo for 2 weeks.** Confirm traffic patterns are intact, no 404 spikes.
6. **Decommission Hosterion hosting.** Cancel plan. Leave registration (separate line item) until its renewal decision.
7. **(Optional, later)** Transfer the domain registration away from Hosterion closer to the 2026-10-18 expiration.

### 9b. Hosting options by layer

**Domain registrar (for the `erma.ro` registration itself):**
| Option | Invoicing | Notes |
|---|---|---|
| Stay at Hosterion SRL | Romanian factură ✓ | Easiest. ~€10/year. Annoying UI but you rarely touch it. |
| Cloudflare Registrar | US invoice | At-cost pricing, no markup. Must already be a Cloudflare DNS user. Some Romanian accountants dislike non-factură receipts. |
| Gandi (France) | EU invoice with VAT ID ✓ | ~€15/year. Clean UI, reliable. |
| Porkbun (US) | US invoice | Very cheap, great UX. Same accounting caveat as Cloudflare. |

*Recommendation:* **Stay at Hosterion for now.** The registrar layer is the one that matters least and moves least. Revisit near the 2026-10-18 expiration.

**DNS hosting:**
| Option | Cost | Notes |
|---|---|---|
| **Cloudflare DNS** | Free | Best-in-class UI, mobile app, fastest propagation, free DNSSEC. Recommended. |
| Hetzner DNS | Free with Hetzner account | EU-based. Good if you're already using Hetzner for the VPS. |
| Stay at Hosterion | Included | No reason to — UI is the whole reason we're moving. |

*Recommendation:* **Cloudflare DNS.** Zero cost, dramatic UX improvement, preserves everything.

**Static site hosting (the main erma.ro site):**
| Option | Cost | Invoicing | Notes |
|---|---|---|---|
| **Cloudflare Pages** | Free | Cloudflare (US/EU entity) | Integrates with Cloudflare DNS. Fast global CDN. Deploy from git. |
| Netlify | Free tier | US invoice w/ VAT ID | Most polished DX. Generous free tier. |
| Vercel | Free tier | US invoice (EU entity available) | Excellent, slightly more "framework-coupled" feel. |
| Hetzner Cloud VPS | ~€4/mo | German VAT invoice, reverse-charge ✓ | Overkill for static but clean invoicing. |

*Recommendation:* **Cloudflare Pages** (if DNS moves to Cloudflare) or **Netlify** (if not).

**Python service hosting (the greenhouse map on `sere.erma.ro`):**
| Option | Cost | Invoicing | Notes |
|---|---|---|---|
| **Hetzner Cloud VPS (CX22)** | ~€4.50/mo | German VAT invoice, reverse-charge ✓ | Full control, EU jurisdiction, clean accounting. Recommended. |
| Fly.io | Free tier + pay-as-you-go | US invoice | Easy deploys, scales to zero. |
| Railway | Free tier + pay-as-you-go | US invoice | Simplest developer experience. |
| Render | Free tier (with sleep) | US invoice | Free tier has cold starts that may be annoying for a map. |

*Recommendation:* **Hetzner Cloud VPS.** €4–5/month, clean EU invoicing to a Romanian SRL, enough headroom for the map + any future small service, and it keeps everything under one trusted European provider.

### 9c. Recommended final stack *(confirmed static — no Python runtime needed)*

| Layer | Provider | Monthly cost |
|---|---|---|
| Domain registrar | Hosterion SRL (unchanged for now) | ~€1/mo amortized |
| DNS | Cloudflare | €0 |
| Static site — `erma.ro` | Cloudflare Pages | €0 |
| Static site — `sere.erma.ro` (incl. map) | Cloudflare Pages | €0 |
| Email | Google Workspace (unchanged) | unchanged |
| Analytics | Matomo Cloud (unchanged) | unchanged |
| CMS | Sanity free tier or Decap | €0 |

**Total added/changed:** ~€0/month. Everything free-tier or unchanged.

Hosterion's current shared plan presumably costs something — even modest savings there make this migration net-positive on cost. The bigger win is removing the Python runtime, MySQL, Passenger, LiteSpeed, and CloudLinux env-var plumbing that caused the "broke in insanely difficult to troubleshoot ways" problem.

## 10. Suggested Project Phases (Not Execution — Planning Only)

1. **Discovery** — answer remaining open questions above; confirm DMARC + `sere.erma.ro` status via dig.
2. **Decide stack** — lock in the choices in §9c (or revise); choose CMS (Sanity vs Decap).
3. **Move DNS to Cloudflare** — lowest-risk first step, reversible, no user-visible change.
4. **Build in parallel** — new site on a staging URL; old site stays live untouched.
5. **Migrate content** — catalogs, both languages, archive pages with noindex.
6. **Greenhouse map applet** — prototype on `sere.erma.ro`, then integrate.
7. **DNS cutover for main site** — point `erma.ro` / `www.erma.ro` at the new static host. MX records stay pointed at Google. Add 301 redirects for any changed URLs.
8. **Observation window** — 2+ weeks watching Matomo for traffic anomalies and 404 spikes.
9. **Decommission Hosterion hosting plan.** Keep registration until near expiration, then revisit.

## 11. DNS Migration Checklist (to Cloudflare)

The first execution step of the project. DNS migration is the single highest-risk action — a bad MX change can mean no email for days — so this is the one part that deserves a precise, reversible, sequenced plan before anything is touched live.

### Why this step goes first

- DNS moving to Cloudflare changes nothing user-visible (the records point at the same places) but dramatically improves the editing UX.
- After DNS is moved, every subsequent step (pointing sites at new hosts, archiving old content, adding new subdomains) is a simple record edit instead of a hosting-panel wrestling match.
- DNS is independently reversible: point nameservers back to Hosterion, everything returns to the prior state.
- Email (Google Workspace) is preserved as long as MX/SPF/DKIM/DMARC are copied faithfully.

### Pre-flight (before touching anything)

1. **Full current DNS snapshot.** Save the output of this single `dig` command as a text file on your Mac:
   ```bash
   for r in A AAAA MX TXT NS SOA CAA DNSKEY CNAME SRV; do
     echo "=== $r ==="; dig erma.ro $r +noall +answer;
   done > erma-dns-before-$(date +%Y%m%d).txt
   dig _dmarc.erma.ro TXT +noall +answer >> erma-dns-before-$(date +%Y%m%d).txt
   dig default._domainkey.erma.ro TXT +noall +answer >> erma-dns-before-$(date +%Y%m%d).txt
   dig www.erma.ro +noall +answer >> erma-dns-before-$(date +%Y%m%d).txt
   dig sere.erma.ro +noall +answer >> erma-dns-before-$(date +%Y%m%d).txt
   ```
   This is the canonical reference if anything needs to be reverted.
2. **Screenshot the full cPanel Zone Editor** — every record, including TTLs. Belt and braces.
3. **Confirm Google Workspace admin access.** You need to be able to log into `admin.google.com` to resolve any email issue that might arise.
4. **Answer the remaining open questions that affect DNS** before starting: Odoo email, Mailchimp status, Apple token purpose. Each one is either "keep it" or "drop it" — no migration should be a guess.
5. **Lower all Hosterion TTLs to 300 (5 minutes) at least 48 hours ahead.** Each record's current TTL is 14400 (4 hours). Lowering before migration means if anything goes wrong, recovery is minutes, not hours. This is a small edit in Hosterion's DNS panel.

### Step 1: Create Cloudflare account and add the domain

1. Create a Cloudflare account (or use existing).
2. Add site `erma.ro`. Cloudflare auto-imports DNS records by reading Hosterion's nameservers. **Always verify — auto-import is usually good but not perfect.**
3. Compare Cloudflare's imported records to the `dig` snapshot. Every record in the snapshot must be present. If anything is missing, add it manually.

### Step 2: Clean up stale records *before* cutover

Easier to do in Cloudflare's UI than in Hosterion's, and safer to do *before* nameservers change (so Hosterion remains the source of truth until we're ready):

- **Remove** `include:spf.minicrm.io` from the SPF record. New SPF becomes:
  ```
  v=spf1 include:_spf.google.com ~all
  ```
- **Add DMARC record** in report-only mode. Create TXT at `_dmarc.erma.ro`:
  ```
  v=DMARC1; p=none; rua=mailto:dmarc-reports@erma.ro; fo=1
  ```
  (or any address you check — a Google Workspace alias `dmarc-reports@erma.ro` is standard).
- **Leave alone** — the following are all confirmed "do not touch":
  - Mailchimp TXT (`mc-domain-verification=...`) — inert, harmless.
  - Apple TXT (`apple-domain-verification=...`) — inert, harmless.
  - Odoo SPF/DKIM — a third-party vendor handles this when they're ready; not our migration concern.
  - All MX records (Google Workspace).
  - Main SPF Google include (`include:_spf.google.com`).
  - DKIM (`default._domainkey.erma.ro`).
  - All A/CNAME records pointing at Hosterion — these stay during DNS migration and change only later when the new site is ready.


### Step 3: Change nameservers (the actual cutover moment)

1. In Hosterion's **registrar** control panel (the domain control, separate from cPanel), change the nameservers from `ns1/ns2.hosterion.com` / `ns1/ns2.hosterion.net` to the two Cloudflare nameservers assigned to your account.
2. Cloudflare's onboarding page has a "Check nameservers" button — it'll confirm the switch. Propagation is usually minutes to an hour; can take up to 24 hours in pathological cases.
3. **Do not delete the Hosterion DNS zone yet.** Keep it intact for at least a week as a rollback safety net.

### Step 4: Verify email still works

Within minutes of propagation, do these in order:
1. Send an email from a `@erma.ro` Gmail account to an external address (your personal Gmail) — must arrive.
2. Send an email from your personal Gmail back to a `@erma.ro` address — must arrive.
3. Check `dig erma.ro MX` resolves from Cloudflare correctly.
4. Check `dig erma.ro TXT` shows the new (cleaned-up) SPF and the new DMARC.
5. After 24–48 hours, check the DMARC report emails start arriving. They're XML, slightly ugly, but they confirm the setup is working and reveal any rogue senders using erma.ro.

If any of these fail, the emergency rollback is: Hosterion registrar panel → change nameservers back to Hosterion's. Propagation reverses within the (now-lowered) TTL window.

### Step 5: Post-cutover cleanup

Only after email is verified stable for at least 48 hours:
- Raise TTLs back to something sensible (1 hour = 3600 is a good default; Cloudflare proxies mask TTL impact anyway).
- Enable Cloudflare DNSSEC (one click; publishes DS records automatically via registrar). Optional but free win.
- Enable IPv6 (Cloudflare Pages adds AAAA automatically when you connect sites later).

### What this does *not* do

This step only moves DNS hosting. It does **not** touch:
- The Hosterion hosting plan (still serving the website).
- The `erma.ro` domain registration (still at Hosterion SRL).
- Any mailbox content (all at Google).
- The website itself (Flask app continues running on Hosterion until replaced).

The site keeps working exactly as before. The only change is who's answering DNS queries.

### Abort criteria

Revert immediately if any of these happen in the first hour:
- Any `@erma.ro` email fails to send or receive.
- `dig erma.ro` returns different answers than the pre-flight snapshot (beyond the intended SPF/DMARC/cleanup changes).
- Any subdomain stops resolving.

Reversal: Hosterion registrar → nameservers back to original. Done.

## 12. Things to Remember

- **Resist scope creep.** The core job is "agent opens site during call, catalogs visible." Fancy animations and heavy frameworks are how the current site ended up with a Python backend for a catalog grid.
- **Optimize for the 3–4x/year update moment** — that is when this project pays off or fails.
- **The old site's value is sentimental/historical.** Don't overspend preserving it — noindex + reachable-by-URL is the settled plan, no further polish needed on those pages.
- **Hosterion's human support was genuinely helpful** — whatever replaces it shouldn't be a fully anonymous system if the team values being able to reach a human. (Hetzner has decent support; Cloudflare free tier does not — acceptable trade-off given the scope.)
- **Email is safe** as long as MX/SPF/DKIM/DMARC records are copied verbatim during the DNS move. Google Workspace doesn't care where DNS is hosted.
- **Domain expiration 2026-10-18** is a natural checkpoint. Nothing has to move by then, but it's a good "revisit everything" date.

## 13. Useful Snippets for the Execution Phase

### Extract 114 greenhouse coordinates from existing Folium HTML

Run on the Mac against the rsync'd backup:

```python
import re, json

src = 'home-snapshot/public_html/maps/df_all_2019_2021_gh-erma-foliahaz.html'
html = open(src).read()

# Folium emits L.marker( \n [lat, lng], \n {} — multi-line
markers = re.findall(r'L\.marker\(\s*\[([0-9.\-]+),\s*([0-9.\-]+)\]', html)

data = [{'lat': float(lat), 'lng': float(lng)} for lat, lng in markers]
print(f'{len(data)} markers extracted')  # expect 114

with open('greenhouses-coords.json', 'w') as f:
    json.dump(data, f, indent=2)
```

This produces `greenhouses-coords.json`, the starting point for the new sere-site map data. Enrichment (names, years, photos, client info) is content work for that phase — the coordinates are the hard part and they're already on disk.

### Full DNS snapshot (run before any migration)

```bash
for r in A AAAA MX TXT NS SOA CAA DNSKEY CNAME SRV; do
  echo "=== $r ==="; dig erma.ro $r +noall +answer;
done > erma-dns-before-$(date +%Y%m%d).txt
dig _dmarc.erma.ro TXT +noall +answer >> erma-dns-before-$(date +%Y%m%d).txt
dig default._domainkey.erma.ro TXT +noall +answer >> erma-dns-before-$(date +%Y%m%d).txt
dig www.erma.ro +noall +answer >> erma-dns-before-$(date +%Y%m%d).txt
dig sere.erma.ro +noall +answer >> erma-dns-before-$(date +%Y%m%d).txt
```

### Content backup from Hosterion

```bash
rsync -avz --progress \
  --exclude='nodevenv' --exclude='virtualenv' --exclude='actions-runner' \
  --exclude='.vscode-server' --exclude='.cache' --exclude='node_modules' \
  hosterion-erma:~ ./home-snapshot/
```

### Catalog table backup (read-only user, InnoDB-safe)

```bash
mysqldump -u ermaro_viewer -p -h localhost \
  --no-tablespaces --skip-lock-tables --single-transaction \
  ermaro_catalogs > catalogs-backup-$(date +%Y%m%d).sql
```

---

## Handoff: Planning → Execution

Planning phase is complete. The brief above is the full context needed to continue in a new session or with a new collaborator. Recommended next steps, in order:

1. **Execute the DNS migration** (§11). Reserve a focused 2-hour window, read the whole checklist first, work through it once. Lowest-risk step in the project and the one that unlocks everything else.
2. **Lock in the catalog-site editing workflow** — decide Google Sheet vs Sanity based on whether mobile image uploads matter. Experiment: try both free tiers over a weekend; pick the one that feels less annoying.
3. **Build the catalog site on a staging URL.** Port the 28-row catalog data from the SQL dump (or the CSV) into the chosen CMS. Rebuild the current design in a modern static site generator (Astro is a good default — it handles the multi-language routing and asset bundling cleanly).
4. **Migrate `erma.ro` / `www.erma.ro` to the new host.** Point DNS records at the new static site. The Flask app on Hosterion becomes officially dormant.
5. **Build the `sere.erma.ro` site.** Extract the 114 markers (snippet above), enrich with whatever content is gatherable, ship a modern greenhouse-business site with an interactive map.
6. **Archive `/ermavirag/` and `/ermafolia/`** with noindex + reachable, as per §7d.
7. **Decommission Hosterion hosting plan** after a 2-week stability window.
8. **Revisit at domain expiration (2026-10-18):** transfer-or-renew decision.

The whole sequence is multi-month in elapsed calendar time but small in actual effort hours. Don't rush it. Each step is independently verifiable and independently reversible until the one after it.

---

## Execution log
### Session 2026-04-21

**Homepage V2 — DONE.** `/ro/` and `/hu/` replaced with a proper 
landing page. `/ro/cataloage` and `/hu/katalogusok` added as 
dedicated catalog routes so sales agents can bookmark the grid 
directly. CatalogGrid extracted into a shared component.

Homepage sections: full-bleed hero (greenhouse photo, bilingual 
tagline), CTA row, partner logo strip (9 suppliers, greyscale → 
full color on hover), teaser cards for Cataloage and Sere.

**Hero image pipeline:** hero moved to `src/img/` and processed 
via `astro:assets` — 5.6 MB JPEG → 89 KB AVIF at 800w. Full 
`<picture>` with AVIF + WebP + JPEG fallback, `fetchpriority=high`.

**Partner logos:** 9 logo files in `public/partners/` (SVG where 
available, PNG/JPG for Dobay/JoluPlant/Vester). Plain `<img>` 
tags with `/partners/${logo}` paths — no astro:assets pipeline, 
intentional (logos are small, lazy-loaded below fold, not worth 
complexity). Data in `src/data/partners.json` with `name`, 
`displayName`, `logo`, `url` fields.

**Catalog filter — DONE.** `/ro/cataloage` and `/hu/katalogusok` 
have category pill bar, supplier dropdown, search box. Filter 
state synced to URL query params (`?cat=&supplier=&q=`) — 
bookmarkable and shareable. Progressive enhancement: full grid 
renders server-side, filter UI hidden without JS. Keyboard: 
`/` focuses search, `Esc` clears.

**CSV parser rewritten with PapaParse — DONE.** Replaced fragile 
positional indexing (cols[5], cols[6]) with header-based field 
access (`row.active`, `row.supplier`, etc.). Sheet columns can 
now be reordered without breaking the site. Discovered the hard 
way: supplier column added to Sheet shifted active from index 5 
to index 1, silently emptying the catalog grid.

**Google Sheet updated:** `supplier` column added. Current schema: 
`id, active, supplier, name, url, image, type, created_at`. 
10 active rows. 7 unique suppliers.

**Analytics:** Matomo Cloud trial expired April 2024 — data gone, 
not recoverable. Replaced with **Cloudflare Web Analytics** 
(free, cookieless, GDPR-compliant, no snippet needed — automatic 
injection via Cloudflare). Configured in Cloudflare dashboard 
under Analytics & Logs → Web Analytics → erma.ro. Will show 
traffic once DNS cutover completes.

**Mobile header fixed:**
- iOS SVG broken: added `xmlns="http://www.w3.org/2000/svg"` to 
  `public/logo.svg` — Safari requires xmlns when serving SVG as 
  image/svg+xml
- Nav wrapping: `public/logo-icon.svg` (flower only) swapped in 
  via `<picture>` at ≤600px; nav drops uppercase and font-weight 
  at mobile to fit 4 HU nav items on one line at 390px

**Gotchas discovered:**
- SVGs without intrinsic `width`/`height` attributes collapse to 
  0×0 inside `align-items: center` flex containers. Fix: remove 
  `align-items` and let default `stretch` fill the container.
- Elements rendered in `.map()` callbacks don't receive the 
  component's `data-astro-cid` — scoped CSS rules compiled to 
  `.class[data-astro-cid-xxx]` never match. Use `:global()`.
- CSV positional indexing is a silent bomb. Always use 
  header-based parsing (PapaParse).
- `public/` assets bypass `astro:assets` entirely — files there 
  are served verbatim. Use `src/img/` for anything that should 
  be processed (hero photos). Use `public/` for assets that 
  should be served as-is (logos, favicon, partner images).
- `.claude/launch.json` added for preview server auto-verify.

### Updated: Still to do

1. **Point `erma.ro` A/CNAME records at Cloudflare Pages** 
   (replace Hosterion IP 185.250.104.21). This is the cutover.
2. **Watch Cloudflare Web Analytics** for 2 weeks post-cutover 
   (Matomo is gone — see above).
3. **Decommission Hosterion hosting plan** (not registrar) after 
   stability window.
4. **Archive `/ermavirag/` and `/ermafolia/`** with noindex (§7d).
5. **Build `sere.erma.ro`** — extract 114 greenhouse markers from 
   Folium HTML (snippet §13), build Leaflet map, gallery.
6. **At 2026-10-18 domain expiration:** transfer-or-renew decision.
7. **Maybe-eventually:** copy-PDF-link button per card, 
   build-time thumbnail caching, real hero photo from ARW archive.

### Session 2026-04-20

**DNS migration (§11) — DONE.** Nameservers switched from Hosterion to Cloudflare (`keaton.ns.cloudflare.com` / `paislee.ns.cloudflare.com`). SPF cleaned (MiniCRM include removed). DMARC added in monitor mode (`p=none; rua=mailto:dmarc-reports@erma.ro`). Email verified working both directions. Apple and Mailchimp TXT tokens left alone. DNSSEC skipped (registrar friction). Pre-flight snapshot saved.

**Catalog site V1 — DONE.** Astro project at `catalog-site/`. Google Sheets CSV confirmed as CMS (chose over Sanity/Decap for simplicity at 12-row scale). Deployed to Cloudflare Pages at `https://erma-website.pages.dev/`. GitHub repo `v4k0nd/erma-website` (private). Builds on push to `main`. Deploy Hook configured for manual rebuilds when Sheet updates.

Design state at end of session:
- Sticky white header with 8px green top border, 6px bottom, ERMA hibiscus logo
- Card grid with 3D tilt on hover (desktop only), title overlaid on image with dark gradient (no white strip)
- Matomo Cloud tracking preserved, site ID '1' (traffic continuity with old site)
- About pages with full content for both languages (`src/content/about-{ro,hu}.txt`) — 7 partners including Straathof and Müller
- Contact pages with JS-obfuscated phone numbers (clickable `tel:` links) and Google Maps iframe embed

**Still pending before going live:**
- `erma.ro` A record still points to Hosterion (185.250.104.21). CNAME cutover to Cloudflare Pages is the one remaining step to "go live."

**Gotchas discovered (worth preserving for future sessions):**
- Astro's `<style>` blocks scope all selectors to the component. Slotted content doesn't carry the scope attribute. Use `:global()` wrappers for rules targeting children rendered via `<slot />` — otherwise the CSS silently fails to match.
- `display: flex; align-items: center` + `max-width/max-height: 100%` on a child `<img>` produces sizing bugs. Use `object-fit: contain` without flex alignment instead.
- Astro SVG imports can break (raw XML rendering in browser). Use `public/logo.svg` with plain `<img src="/logo.svg" />` instead of import + `.src`.
- TypeScript 6.x breaks `@astrojs/check@0.9.8` peer dep. Pin to `^5.4.0` in `package.json`.
- Cloudflare Pages needs `Root directory: catalog-site` in build settings because the repo is a monorepo (sere-site/ will live alongside later).

### Still to do

1. Point `erma.ro` A/CNAME records at Cloudflare Pages (replace Hosterion IP).
2. Watch Matomo 2 weeks for traffic anomalies or 404 spikes.
3. Decommission Hosterion hosting plan (not registrar).
4. Archive `/ermavirag/` and `/ermafolia/` with noindex (§7d).
5. Build `sere.erma.ro` — extract 114 greenhouse markers from Folium HTML (snippet §13), build Leaflet map, gallery, enrichment.
6. At 2026-10-18 domain expiration: transfer-or-renew decision.
