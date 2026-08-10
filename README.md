# the-corfuguide

A static, no-build, Hebrew-RTL travel-guide PWA for Corfu.
Production: **https://efraimgad.github.io/corfu-guide/**

There is no framework, no bundler and no build step for the application itself.
`index.html` loads ~24 plain `<script defer>` files from `js/` that share one
global scope in document order. That is a deliberate property of this project —
please do not add a pipeline to "fix" it.

---

## Running it locally

Serve it over HTTP. **Never open `index.html` via `file://`** — that breaks the
service worker, `fetch`, and module behaviour, so what you see will not be what
ships.

```bash
python3 -m http.server 8899 --bind 127.0.0.1   # then http://127.0.0.1:8899/
# or
npx serve .
```

## Tests

```bash
npm install     # jsdom + cheerio, dev only
npm test        # 12 scripts, all must pass
```

`npm test` is an `&&` chain, so a failure stops the run and every later script
is simply unreported — not passing. Individual runs: `npm run test:facets`,
`test:guide`, `test:map`, `test:mapsync`, `test:shell`, `test:favorites`,
`test:escaping`, `test:isolation`, `test:reveal`, `test:maps`.

## The one build step

```bash
npm run build:css     # Tailwind 3.4 -> tailwind-production.css
```

Only needed if you change `css/tailwind-input.css` or add Tailwind classes that
are not already in the output. `css/design-system.css` is hand-written and is
**not** generated — edit it directly.

---

## Deploying (GitHub Pages)

The site is a **project site**, served from a subpath (`/corfu-guide/`). Every
URL in the app is relative for that reason — no `src="/js/..."`, no absolute
`start_url`. Keep it that way or the deploy breaks in ways that only show up in
production.

### What GitHub Pages gives you

- **HTTPS** — required for service-worker registration. Satisfied automatically.
- **`Cache-Control: max-age=600`** on served files.

### What GitHub Pages does NOT give you, and cannot

- **No custom response headers.** `_headers`, `netlify.toml`, `vercel.json` and
  `.htaccess` are all inert here. Do not add them; they will look like
  configuration and do nothing.
- **`sw.js` therefore cannot be served `no-cache`.** A returning visitor can
  keep the previous service worker for up to ~10 minutes after a deploy. That
  window is bounded and acceptable — but it makes `CACHE_NAME` the only lever
  you have (see below).
- **No `frame-ancestors` / clickjacking protection.** A CSP can only be
  delivered here as a `<meta http-equiv>`, and the spec ignores
  `frame-ancestors`, `report-uri`, `report-to` and `sandbox` when set that way.
  Getting those would mean moving off Pages to a host that allows headers.
- **`robots.txt` in this repo is never read.** Crawlers only fetch
  `https://efraimgad.github.io/robots.txt`, which is served from the separate
  `efraimgad.github.io` repository. `sitemap.xml` at the subpath *is* fetchable
  and can be submitted to Search Console directly.

### Every deploy that changes an APP_SHELL file

**Bump `CACHE_NAME` in `sw.js`.** This is not optional and it is not
automatic.

The service worker only re-installs when its own bytes change. If you ship new
JS or CSS without bumping `CACHE_NAME`, `sw.js` is byte-identical, the browser
never re-installs it, and the stale cache entry persists **indefinitely** — not
bounded by any TTL — until some unrelated future bump happens to refresh it.

`APP_SHELL` must also stay in step with what `index.html` actually loads.
`npm run test:shell` diffs the two and fails on drift in either direction.

### `js/trip-private.js`

Referenced by `index.html` and listed in `APP_SHELL`, but intentionally **not
in the repo** — it holds personal hotel and flight details. Its 404 is expected
and is swallowed per-URL by the service worker's `install()`, so it does not
sink the rest of the precache. Create your own copy locally if you want those
panels populated.

### Do not add `.nojekyll`

Pages runs Jekyll by default, and Jekyll skips underscore-prefixed
directories — which is the only reason `_audit/` is not currently published at
a live URL. Adding `.nojekyll` would expose the full audit history. Nothing in
this repo needs it: there are zero Liquid hazards (`{{` / `{%` counts are 0
across `index.html`, `sw.js`, `manifest.json` and all of `js/`).

---

## Network dependencies

Everything below is third-party and can fail. The app is expected to degrade
honestly when it does — with a visible message, never a hang or a blank box.

| Host | Used for | Cached? | Offline behaviour |
|---|---|---|---|
| `cdnjs.cloudflare.com` | Leaflet + marker-cluster, lazy-loaded on first map open | via the generic SW branch after one successful load | Hebrew "map unavailable" message |
| `tile.openstreetmap.org`, `basemaps.cartocdn.com` | Map tiles | **deliberately not cached** (see the long note in `sw.js`) | tiles blank, markers still draw |
| `images.pexels.com`, `images.unsplash.com` | Location photos | cache-first, capped at 200 | previously-seen photos persist |
| `fonts.googleapis.com` / `gstatic` | Assistant webfont | app-shell | falls back to the CSS font stack |
| `api.open-meteo.com` | Dashboard weather tile | not cached | "📡 לא זמין" |
| `*.supabase.co` | Optional sync, **disabled by default** | never cached | writes queue locally |

Supabase stays off until `js/supabase-config.js` holds real credentials; in the
shipped state it makes zero network calls.

---

## Audit

`_audit/PRELAUNCH.md` is the current pre-launch audit: findings, evidence,
verified status for every earlier `_audit/AUDIT.md` item, and the GO/NO-GO
call. `_audit/AUDIT.md` and `_audit/CHANGES.md` are the previous round and are
kept for history — read them alongside PRELAUNCH's status table, not on their
own.
