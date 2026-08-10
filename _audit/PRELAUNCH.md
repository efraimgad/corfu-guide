# Corfu Guide — Pre-Launch Audit (`_audit/PRELAUNCH.md`)

**Target:** `https://efraimgad.github.io/corfu-guide/` (GitHub Pages project site)
**Branch:** `claude/corfu-guide-audit-31v8b5`
**Method:** 8 parallel read-only audit agents + orchestrator re-verification. Site served over
HTTP (`python3 -m http.server`, never `file://`), driven in headless Chromium, both
`prefers-color-scheme` values, RTL as the primary case. No source file was modified during
the audit.

---

## Verdict

> **STATUS: superseded by the Phase 3 section at the end of this file.** The
> verdict below is the Phase 1 finding, kept as the record of what was found.
> All five blockers are now fixed and verified; the current call is **GO,
> conditional on the Leaflet SRI check (H8)**.

**NO-GO.** Five blockers, and none of them are subtle: a dashboard button that is 100 % dead
because it calls four functions that no longer exist, two separately-exploitable stored-XSS
paths that execute real JavaScript from `localStorage`, an Explore-tab layout rule that
renders on top of every other tab at desktop widths, and a reveal-on-scroll animation whose
threshold can never be satisfied by the tall content panels it guards — so the FAQ,
trip-planning and language tabs render blank on arrival. Underneath them the app is in
genuinely good shape: **every single C1–C6 and H1–H8 item from the previous audit is fixed,
verified by measurement rather than by reading the CSS**; the data layer is clean (counts
exact at 28/69/34, 0/169 coordinates out of bounds, 0 duplicate IDs, 0 referential drift
across all four data files); all 7 test scripts pass; there are no global-namespace
collisions across 25 shared-global scripts, no `console.log` in production, no broken ARIA
references, no heading-order skips, no unlabelled form controls, and zero horizontal overflow
across 154 viewport × theme × tab combinations. The blockers are concentrated in one
refactor's fallout and one escaping helper — this is a short, well-defined fix list, not a
rewrite.

---

## Coverage limits (read before trusting any absence of findings)

The audit container's egress policy blocks the hosts this site actually depends on. These
are **honest gaps, not clean results**:

| Unverifiable here | Why | Command to finish outside the sandbox |
|---|---|---|
| External link liveness (417 URLs) | `images.pexels.com`, `maps.google.com`, `images.unsplash.com` all fail CONNECT with 403 | `bash scratchpad/agent2/check-links.sh scratchpad/agent2/external-urls.txt > results.tsv` |
| Leaflet SRI pin correctness | `cdnjs.cloudflare.com` unreachable | `curl -s https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js \| openssl dgst -sha384 -binary \| openssl base64 -A` |
| Live site headers / Pages config | `efraimgad.github.io` blocked; `api.github.com/repos/.../pages` rejected by proxy | `curl -sI https://efraimgad.github.io/corfu-guide/sw.js` |
| Webfont rendering metrics | `fonts.googleapis.com` resets in-browser; all rendering measured against the CSS **fallback** stack | re-run agent scripts on a normal network |
| 60 of 154 responsive matrix cells | Agent 6's exhaustive per-cell run was killed for time | re-run `scratchpad/agent6/full_matrix.js` |
| SW-initiated precache of cross-origin URLs | Playwright `context.route()` does **not** intercept fetches made from inside the service worker — proven directly. So the 5 cdnjs + 1 fonts `APP_SHELL` entries genuinely fail here; expected to succeed in production | re-run `scratchpad/agent4/sw-first-load.js` on a normal network |
| Photo cache population (`corfu-guide-images-v1`) | Same cause — once `clients.claim()` takes effect, image requests route through the SW's un-mocked `fetch()`. Cache measured 0 entries | same |
| CLS 0.49 root cause | Lighthouse's root-cause gatherer crashed in both runs | inspect `trace.json` `LayoutShift` → `impacted_nodes` |

**A methodology note that changed results.** My first contrast pass reported a 1.01:1
"white-on-white" on the flight-countdown tile. It was false: the ancestor walk read only
`background-color` and stepped past the card's `linear-gradient`. Agents 3 and 6 were warned
mid-run; Agent 3 had independently hit and fixed the same bug and discarded 7 candidates on
those grounds, Agent 6 discarded 27. `_audit/AUDIT.md` warned about this same trap for hero
photography. Chasing the false positive is what surfaced the *real* adjacent bug (H2 below).

---

## Root causes

~35 symptoms reduce to 10 causes. Fixing RC-1 and RC-2 clears four of the five blockers.

| # | Root cause | Severity | Symptoms |
|---|---|---|---|
| **RC-1** | **Phase C2 refactor** (4 category tabs → unified Explore) deleted functions and DOM sections but left callers, tooling and docs behind | BLOCKER | B1, M9, L1, L2, L3, L4 |
| **RC-2** | **User-controlled `localStorage` values reach markup with no validation at the read boundary**, and `escapeAttr` under-escapes for the nested-quoting convention it is used in | BLOCKER | B2, B3, H7 |
| **RC-3** | **A desktop-only `!important` layout rule is not scoped to the active tab**, so it out-specifies the router's inline hide | BLOCKER | B4 |
| **RC-4** | **Reveal-animation gate uses an area *ratio* of the element's own box**, unsatisfiable for elements taller than ~10× the viewport | BLOCKER | B5 |
| **RC-5** | **Remediations applied by selector list rather than by role** — newly-added markup silently misses them (the same shape the previous audit identified) | HIGH | H2, M6 |
| **RC-6** | **Coordinate-precision guard is inverted**: usable coordinates are discarded in favour of a name text-search | HIGH | H1 |
| **RC-7** | **Content pipeline shipped placeholder/duplicate imagery**, with the defect self-documented in TODOs rather than fixed | HIGH | H3, H4 |
| **RC-8** | **Non-text colour tokens tuned for decoration are used for function** (focus rings, form borders) | HIGH | H5, H6 |
| **RC-9** | **Zero test coverage of the persistence layer** — no test file references `localStorage` at all | HIGH | enabler for B1, B2, B3 |
| **RC-10** | **Hosting constraints undocumented / generator-only data persisted** — GitHub Pages specifics never written down | MEDIUM | M1–M5, M7, M8 |

---

## BLOCKERS

### B1 — Dashboard "צפו במועדפים" is 100 % dead; every favourite tap throws  *(RC-1)*
- **Location:** `js/dashboard.js:243`, `js/favorites.js:55-58`
- **Repro:** `node -e "...window.viewFavorites()"` against the served site; or tap any heart.
- **Evidence:** `grep -rn "function filterBeaches\|filterFood\|filterAttractions\|filterGems" js/ index.html` → **no definition anywhere**. Both sites reference them as bare identifiers inside literals:
  `js/dashboard.js:243  const filterFn = { beaches: filterBeaches, ... }[targetTab];`
  Runtime: `ReferenceError: filterBeaches is not defined at viewFavorites (js/dashboard.js:243:33)`, reproduced 100 % of runs. `toggleFavorite` throws identically at `js/favorites.js:55` — the favourite *does* save (lines 40-41 run first), then the handler dies.
- **Impact:** A traveller who saved favourites taps "View favorites" and nothing happens — no navigation, no error, silence. Every heart tap throws an uncaught exception.
- **Fix:** Replace the dead lookup with `switchTab(targetTab, true)` + `selectExploreCategory(targetTab)`; delete the dead `forEach` block in `favorites.js` (its `.beach-filter-btn` selectors also match 0 elements). **Risk:** none — the path currently does nothing.

### B2 — Stored XSS: personal rating interpolated into an attribute with zero escaping  *(RC-2)*
- **Location:** `js/notes-favorites.js:43`
- **Repro:** write `rating: '1" onmouseover="window.__pwned2=true" data-x="'` into `corfu-guide-item-state-cache`, reload, open "התיעוד שלנו", hover the row.
- **Evidence:** rendered DOM `<span ... aria-label="דירוג 1" onmouseover="window.__pwned2=true" data-x=" מתוך 5">`; dispatching `mouseover` set `window.__pwned2 = true`. Agent 5 confirmed execution; no CSP or other mitigation intervened.
- **Impact:** Arbitrary JS on pointer-over, with full page privileges — can read reservation confirmations, phone numbers and trip progress from `localStorage`, or ride an active Supabase session if sync is ever enabled.
- **Root cause:** `entry.rating` comes verbatim from `localStorage` (`js/storage.js:41-43`, never validated) and is spliced into an attribute with **no escaping call at all**.
- **Fix:** `escapeAttr(String(entry.rating))`, and coerce `rating` to an integer 1–5 or null at the storage read boundary — the same way `is_visited` is already forced with `!!`.

### B3 — Stored XSS: reservation `id` breaks out of a single-quoted `onclick` string  *(RC-2)*
- **Location:** `js/reservations.js:60-61`, `js/app-shell.js:114`; root cause `js/html-utils.js:5-9`
- **Repro:** write `id: "x'); window.__pwned = document.domain; //"` into `corfu-guide-reservations`, reload, Dashboard tab, click ✏️.
- **Evidence — verified directly by the orchestrator:**
  ```
  escapeAttr("x'); alert(1); //")        -> "x'); alert(1); //"   (unchanged)
  escapeAttr("<script>alert(1)</script>") -> unchanged
  escapeHtml('"q"') / escapeHtml("'s'")   -> unchanged
  ```
  `escapeAttr` escapes only `&` and `"` — not `'`, `<`, `>`. A genuine `.click()` produced `window.__pwned === '127.0.0.1'`.
- **Impact:** Tapping ✏️ or 🗑️ on your own saved reservation — an expected action — executes attacker-controlled JS.
- **Fix:** add `.replace(/'/g, '&#39;')` to `escapeAttr` (closes it for all 10 call sites at once), and regenerate any `id` that doesn't match the app's `res-<ts>-<rand>` shape. **Risk:** negligible.

### B4 — Explore tab renders on top of every other tab at ≥1024 px  *(RC-3)*
- **Location:** `css/design-system.css:946-951` — `#explore.gt-explore{ display:grid !important; }`
- **Repro:** fresh context at 1440×900, never visit Explore, `switchTab('about')`.
- **Evidence — verified directly by the orchestrator:**
  ```
  1440x900   activeTab=about  inline="none"  computed=grid  rect={x:112,y:90,w:1216,h:186}
  2560x1200  activeTab=about  inline="none"  computed=grid  rect={x:672,y:90,w:1216,h:186}
  390x844    computed=none  (correct)
  ```
  `#explore-subheader` renders 1184×122 on top of unrelated content. After Explore is visited once, the full map+list grid (~750 px tall) joins the leak.
- **Impact:** On both desktop viewports, every tab except Explore shows a stray filter-chip row and a large broken rectangle. Reads as a badly broken site.
- **Fix:** scope to `#explore.gt-explore.active{ display:grid !important; }`. **Risk:** re-verify the desktop split-view while Explore *is* active.

### B5 — Primary content panels render invisible on arrival  *(RC-4)*
- **Location:** `js/ui.js:260-267` (`threshold: 0.1`), `css/design-system.css:1778` (`.reveal-on-scroll{opacity:0}`)
- **Repro:** navigate to `faq` / `trip-planning` / `language-daily`, do not scroll, wait.
- **Evidence — verified directly by the orchestrator** (filtered to elements *in the viewport*; an off-screen element at `opacity:0` is correct behaviour, so Agent 6's per-tab counts are corrected here):
  ```
  about          inViewport=1  stillInvisible=1  height=293
  trip-planning  inViewport=1  stillInvisible=1  height=1879
  language-daily inViewport=1  stillInvisible=1  height=3252
  faq            inViewport=2  stillInvisible=1  height=5634
  ```
  A 5,634 px panel can never present 10 % of its own box near the top of the page, so `.revealed` is never added. Still `opacity:0` after 2.5 s settle.
- **Impact:** Tapping "מדריך" — the main route to trip-planning, safety, language and FAQ content — shows a blank screen below the intro, with no cue to scroll. It self-heals once the user scrolls ~800 px, which most users will not think to do on an apparently-empty screen.
- **Fix:** `threshold: 0` (fire on any intersection), or drop the ratio gate for containers that can exceed the viewport. **Risk:** low — changes only the animation trigger, not layout.
- **Adjudication note:** Agent 3 dismissed this as a sampling artifact; it re-tested candidates after `scrollIntoView()`, which reveals the element and legitimately clears it from a *contrast* sweep. Correct for its lane, wrong to generalise. Agent 6 is right about the mechanism.

---

## HIGH

**H1 — Navigation falls back to a name text-search for 51.5 % of locations *(RC-6)*.**
`js/locations-data.js` (87/169 records `needsCoordCheck:true`); logic at `scripts/apply-verified-places.js:122-141`. Verified by orchestrator: **all 87 have a text-search `mapsUrl`, 0 have a coordinate pin**, despite holding valid in-bounds coordinates —
`beach-גליפאדה-Glyfada lat 39.5937 lon 19.808` → `?api=1&query=גליפאדה (Glyfada) Corfu`.
The guard demands ≥4 decimals; `19.808` is 3 decimals ≈ **110 m**, ample for a pin. A guard meant to protect accuracy is *reducing* it for half the guide. **Fix:** fall back to `query=lat,lon` whenever coordinates exist, reserving the name search for records with no coordinates at all.

**H2 — Flight-countdown number unreadable in light mode *(RC-5)*.**
`css/design-system.css:2977`. Verified by orchestrator: `#dash-countdown` is `rgb(26,34,38)` on `linear-gradient(135deg, rgb(15,58,82), rgb(19,90,124))` = **1.34:1 / 2.14:1** against the two stops. Passes in dark (10.36:1) only because `--gt-ink-900` flips while the card gradient does not. The sibling `.dashboard-card-label` *does* get a white override at `:2944-2945`; `.dashboard-card-value` was missed. **Fix:** `.dashboard-card-highlight .dashboard-card-value { color:#fff; }`.

**H3 — A photo the code itself labels "Gulf of Mexico sunset" is used in 8 live placements *(RC-7)*.**
`js/locations-data.js:129,616,969,3895,4241,4356` + `index.html:329,1569`. One placement carries `alt="העיר העתיקה של קורפו, אדריכלות ונציאנית"` — a false description. Four TODOs in the data file and two in `index.html` document the defect without fixing it. **Fix:** 8 distinct location-appropriate photos; delete the TODOs.

**H4 — 22 photos reused across 2–7 unrelated places; the flag that would disclose it is dead *(RC-7)*.**
131 remote image refs backed by only 90 unique URLs. One Pexels URL backs 7 different restaurants. All 169 records carry `hasRealPhoto:false`, and `grep` shows it is read nowhere outside the data file. **Fix:** source distinct photos, or wire `hasRealPhoto` into the card renderer as a "תמונה כללית" badge.

**H5 — Focus ring ~1.1:1 on the emergency FAB and back-to-top *(RC-8)*.**
`css/design-system.css:463-464`. Light: `rgb(250,227,224)` ring on `rgb(244,246,246)` page = **1.13:1**; back-to-top **1.11:1**; dark FAB **1.18:1**. WCAG 1.4.11 needs 3:1. These are the first tab-stops on load, and the emergency button is the one needed under stress. Most of the app's focus system is fine (2.65–3.59:1 solid outlines) — only these two use a soft-token box-shadow with `outline:none`. **Fix:** solid outline or two-layer ring.

**H6 — `--gt-hair` borders 1.11–1.40:1 in both themes *(RC-8)*.**
`css/design-system.css:50` / `:260` / `:350`, 29 CSS rules + 188 `.gt-border-hair` uses. Text inputs are WCAG 1.4.11's own named example. **Fix:** add `--gt-hair-strong` (~3:1) for functional boundaries, keep `--gt-hair` for decorative dividers. Triaging 188 usages is the real cost.

**H7 — `escapeAttr` is structurally unsafe for the convention it is used in *(RC-2)*.**
`js/html-utils.js:5-9`. Six call sites embed its output inside a single-quoted JS string nested in a double-quoted attribute. Five are safe only because their inputs are app-generated ids that cannot contain `'` — a property of the *callers*, not the function. **Fix:** as B3, plus consider `data-*` + delegated listeners longer term.

**H8 — Leaflet SRI pin unverifiable, and the failure mode is a permanently dead map.**
`js/map.js:47`. npm's leaflet 1.9.4 ships **no** `leaflet.min.js` — cdnjs generates that variant itself, so a legitimate byte difference is plausible and the mismatch is *not* proof of a wrong hash. Verdict: **UNVERIFIABLE-BUT-HIGH-RISK**. Mitigating: Agent 1 drove a genuinely blocked cdnjs and both surviving map paths render a real Hebrew fallback (`לא ניתן לטעון את המפה כרגע (חיבור אינטרנט נדרש)`) — no blank box, no hung spinner. **Correction to the record:** `_audit/CHANGES.md:90` says the hashes were *"restored"* after local testing, **not verified** — it is not evidence the pin is correct. **Fix:** run the `curl | openssl dgst` command before shipping.

**H9 — `.gt-topbar` does not grow for `env(safe-area-inset-top)`.**
`css/design-system.css:628-635`: fixed `height:64px` **plus** `padding-top:env(...)` under `border-box`, so the inset eats content room instead of growing the box. At a simulated 44 px inset the search box and status chips render 10–12 px below the bar's own bottom edge; ~25–36 px on an iPhone 14/15 Pro Max. Every other fixed element adds the inset additively via `calc()`. **Fix:** `height: calc(64px + env(safe-area-inset-top, 0));`.

**H10 — Home map can double-initialise and throw.**
`js/ui.js:132-136` calls `gtActivateHomeMap()` twice per Home-tab entry; both chain onto the same `leafletLoadPromise`, so `initHomeMap()` runs twice and the second `L.map()` throws `Map container is already initialized`. Reproduced 3/3. Map still renders. **Fix:** `if (homeMapInstance) return;` as the first line of `initHomeMap()`.

**H11 — No deployment documentation exists at all.**
No README, no host config. Combined with M1/M2 below, a deployer has nothing to work from. **Fix:** a README section covering the GitHub Pages constraints in M1/M2 and the `CACHE_NAME` discipline in M3.

---

## MEDIUM

**M1 — GitHub Pages cannot set response headers, so `sw.js` cannot be `no-cache`.**
`_headers` / `netlify.toml` / `vercel.json` are **dead files** on this host. Pages serves `Cache-Control: max-age=600`, bounding the stale-worker window at ~10 minutes — acceptable, but it makes bumping `CACHE_NAME` the *only* update lever. Document; do not "fix".

**M2 — A `robots.txt` in this repo would be silently ignored.**
On a project site, crawlers read `https://efraimgad.github.io/robots.txt`, which lives in the **`efraimgad.github.io` repo**, not this one. `sitemap.xml` at the subpath is still fetchable and submittable.

**M3 — `CACHE_NAME` is currently consistent, but the discipline has no safety net.**
`sw.js:12` = `corfu-guide-v21`. Agent 4 established via `git diff 2771ae8 4e56873 -- sw.js` that the v19→v21 bump landed in the **same commit** as every new `APP_SHELL` entry, and the working tree is clean — so **there is no live drift**. The risk is structural, not present: if a bump is ever missed, the SW script stays byte-identical, the browser never re-installs, and the stale entry persists **indefinitely** — not bounded by any TTL. **Fix:** a pre-deploy check that fails if any `APP_SHELL` file changed without a `CACHE_NAME` bump. Agent 4 also notes the background revalidation is a plain `fetch(request)` with no `cache: 'reload'`, so on Pages' `max-age=600` that fetch can itself be served from the browser's HTTP cache, extending convergence beyond the nominal 2 navigations.

**M3b — `APP_SHELL` precaches a font URL nothing requests, and omits the one the page loads.**
`sw.js:74` precaches `...family=Assistant:...&family=Frank+Ruhl+Libre:...&display=swap`; `index.html:51` requests `...family=Assistant:...&display=swap`. Different query strings = different cache keys. `Frank Ruhl Libre` is referenced nowhere in the CSS (`grep -n "Frank" index.html css/design-system.css` → no output). So install() spends a request on a stylesheet for an unused font, while the stylesheet the page actually loads is only cached opportunistically via the generic branch after a first successful online fetch. **Fix:** make `sw.js:74` the exact URL `index.html:51` requests. **Risk:** none, one-line string.

**M4 — Canonical / `og:url` / `twitter:url` / `sitemap.xml` absent** *(now unblocked)*. Apply:
```
<link rel="canonical" href="https://efraimgad.github.io/corfu-guide/">
<meta property="og:url"  content="https://efraimgad.github.io/corfu-guide/">
<meta name="twitter:url" content="https://efraimgad.github.io/corfu-guide/">
sitemap <loc>https://efraimgad.github.io/corfu-guide/</loc>
```

**M5 — Manifest and `theme-color` drifted from the design tokens.**
`theme-color` `#0d3355` vs measured topbar `#ffffff` (light) / `#182022` (dark); no `media`-scoped dark variant; `background_color` `#faf9f6` vs measured `--gt-paper` `#f4f6f6`; manifest missing `id` and `description`; `favicon.ico` 404s. Note `id` changes app identity for anyone who already installed.

**M6 — 21 sub-44 px touch targets in the itinerary day header *(RC-5)*.**
Single template at `js/itinerary-view.js:314` × 7 days: complete-toggle 94.7×**36**, budget input 80×**28**, map button 38×**30**, plus a dashboard CTA at 130×**36**. The 44 px floor was applied by selector list (`css/design-system.css:1673`) and this template was never added. `CHANGES.md`'s "~9 remaining" undercounts.

**M7 — 59.5 KB of generator-only markup ships in `locations-data.js` *(RC-10)*.**
`tagBadgesHtml` (28), `featureBadgesHtml` (28), `ratingPriceHtml` (69) — read only by `scripts/extract-locations.js`, the generator. **59,527 B of 445,964 B = 13.35 %** (Agent 8's correction to my initial 14.8 %, which used a character count and undercounted Hebrew at 2 bytes/char). `restHtml`/`bodyHtml` **are** consumed at `js/explore.js:346-347` — not dead. **Fix:** delete the three keys directly; `rating`/`price` are independent persisted fields. **Do not** re-run the generator — see M8.

**M8 — `scripts/extract-locations.js` would blank the data file if run.**
Its selectors (`#beaches-grid`, `#attractions-grid`, `#gems-container-grid`) target DOM deleted in Phase C2; it writes unconditionally at `:339`. `scripts/recolor-badges.js:9-10` already warns: *"confirmed - do not run it again"*. `scripts/add-latlon.js` is likewise broken but fails fast. `scripts/generate-maskable-icons.js` needs `sharp`, which is not in `package.json`.

**M9 — Undocumented weather API call on every load.**
`api.open-meteo.com/v1/forecast?...` (`js/dashboard.js:283`) fires unconditionally, is not in `APP_SHELL`, not in `TILE_HOSTS`, and is not covered by the "Supabase is disabled" posture. Belongs in the CSP `connect-src` and the offline story.

**M10 — No CSP, and a strict one is unachievable on this host.**
113 inline `onclick` + 5 `onkeydown` + 4 `oninput` in `index.html`, ~18 more generated at runtime, 59 inline `style=`, plus the JSON-LD `<script>`. Any CSP needs `script-src 'unsafe-inline'`, which by definition does **not** stop B2/B3. On Pages the only delivery is `<meta>`, which cannot express `frame-ancestors`, `report-uri` or `sandbox` — **clickjacking protection is unavailable on this host, full stop**. Full proposed policy in Appendix A.

**M11 — Sticky filter bars transiently collide with the FAB column.** `#faq-filter-bar` vs `#emergency-fab-btn` = 1,762 px² at 390×844, before any scroll; resolves on scroll.

**M12 — Images without intrinsic dimensions: real at the attribute level, no measured shift.**
Refined across two agents: **all 29 static `<img>` in `index.html` have both `width` and `height`**; the gap is entirely in the two `js/explore.js` templates (`:373`, `:645`), giving 34 of 63 rendered images missing dimensions once Explore is visited. Measured CLS from that path = **0.00036** (and Agent 6 measured 0.000 on Explore load) because `css/design-system.css:556` pins `.gt-row-card__thumb` to 64×64 in CSS before decode. AUDIT.md M10's "→ layout shift" framing is therefore wrong on impact though right on the attribute count. `.gt-explore-sheet-thumb` (`:1043`) sets only `max-height` and is comparatively more exposed. **Fix:** add width/height to the two templates for spec/Lighthouse compliance — hygiene, not a live CLS bug.

**M13 — Google Fonts is a plain render-blocking `<link>`.**
`index.html:49-51` uses `preconnect` ×2 then a blocking stylesheet link. `preconnect` speeds connection setup but does **not** make the stylesheet non-blocking. The 9.0 s FCP measured here is a **sandbox artifact** (the host resets after ~12.5 s through this proxy) and is *not* a production number — Google Fonts' real CDN is typically <300 ms. But the pattern is host-independent: any slow path (corporate proxy, ad-blocker, regional hiccup) stalls first paint entirely. **Fix:** preload + onload-swap with a `<noscript>` fallback, or self-host — which would also close M3b.

---

## LOW

- **L1** — `_audit/AUDIT.md` presents all C1–C6/H1–H8 as open defects though every one is fixed, and cites `js/cards.js:230`, a file that does not exist. A stale audit doc is itself a finding.
- **L2** — 16 stale `js/cards.js` references in comments across 10 files; `js/map.js:3`, `js/html-utils.js:2`.
- **L3** — `js/map.js:62` credits the deleted `initBeachMap` with the fallback that `initExploreMap`/`initHomeMap` actually provide.
- **L4** — `mapLayerGroups` (`js/map.js:9`) is the only truly zero-reference declaration out of 369; `beachMapInstance` is read at `:633` but never reassigned, so that branch is permanently dead.
- **L5** — `.premium-card-image` has **2** true duplicate blocks (`css/design-system.css:2089`, `:2164`), not AUDIT.md's 5; no conflicting properties. The other 5 selectors it names are already resolved.
- **L6** — 6 of 69 restaurants have no `rating`; renders gracefully, reflects genuine absence.
- **L7** — Google Fonts stylesheet has no SRI, correctly (UA-varying response) but without the comment its Leaflet counterpart carries.
- **L8** — `_audit/` is unpublished only because Jekyll skips underscore dirs. Adding `.nojekyll` — a commonly recommended Pages fix — would publish the audit history live. Verified 0 Liquid hazards, so nothing forces it.
- **L9** — No `'use strict'` in any of 25 files; implicit-global creation possible on any future typo.

---

## Performance & PWA measurements

Lighthouse 12.2.1, mobile, `--throttling-method=simulate` (4× CPU, 1.6 Mbps).
**All byte figures are uncompressed** — `python3 -m http.server` sends no `Content-Encoding`,
while GitHub Pages' Fastly CDN gzips/brotlis text assets (typically 65–80 % smaller for this
content). Timing numbers are correspondingly pessimistic versus production.

| Metric | Primary run | Fonts-blocked diagnostic | Desktop |
|---|---|---|---|
| Performance score | 0.54 | 0.44 | 0.79 |
| FCP | 9.0 s ⚠️ | 3.6 s | 1.6 s |
| LCP | 9.9 s ⚠️ | 8.5 s | 1.6 s |
| Speed Index | 22.9 s ⚠️ | 3.6 s | 8.3 s |
| TBT | 100 ms | 190 ms | 30 ms |
| CLS | 0.0004 | 0.49 ⁉️ | 0 |

⚠️ = inflated by the `fonts.googleapis.com` sandbox hang (M13), **not production numbers**.

**Transferred: 1,306 KiB across 35 requests** — Script 843,310 B (26 files), Document 295,969 B,
Stylesheet 197,850 B. Unused on first paint: `design-system.css` **84.2 %** (141,222 B),
`tailwind-production.css` **77.8 %**, `js/map.js` 57.7 %, `js/explore.js` 58.6 % (the latter two
expected — those tabs aren't open).

**Corrects an assumption in the brief:** `locations-data.js` (446 KB) and `design-system.css`
(168 KB) are the largest files but are **not** the CPU bottleneck. Lighthouse `bootup-time`'s
top contributors are Unattributable 376 ms, `index.html` 348 ms, `js/init.js` 256 ms,
`js/ui.js` 243 ms, `js/search.js` 123 ms — `locations-data.js` doesn't make the top 5, because a
flat array-of-objects literal parses very cheaply per byte. The 84 % unused CSS is a real
"one stylesheet for 15 tabs" tradeoff, but it is not a parse-cost problem.

**⁉️ CLS 0.49 — UNRESOLVED, deliberately not rated.** It appears only under the combination of
CPU throttling *and* a fast-failing font, and it contradicts three other measurements (primary
Lighthouse run 0.0004, Agent 4's own unthrottled Playwright repro 0.0004, Agent 6's Explore-load
observer 0.000). Lighthouse's `RootCauses`/`TraceElements` gatherers crashed
(`Cannot read properties of undefined (reading 'frame_sequence')`) in both runs, so **no shifting
element can be named**. Reported as a number without a diagnosis. **Do not action it without a
working root-cause trace** — inspect `trace.json`'s `LayoutShift` events for `impacted_nodes`.

### Offline behaviour — VERIFIED PASS (independently, twice)

The highest-stakes question in the brief. Measured by both Agent 4 and the orchestrator, with
byte-identical results:

```
Service worker:  active, 1 cache (corfu-guide-v21), 40 entries, trip-private absent
Offline reload:  title intact, content present, all 11 tab sections present
Offline map:     "לא ניתן לטעון את המפה כרגע (חיבור אינטרנט נדרש)."
Offline weather: "📡 לא זמין / לא הצלחנו לטעון תחזית חיה כרגע"
```

No silent hang, no spinner, no blank grey box. `APP_SHELL` has 47 entries;
47 − 1 (`trip-private.js`, 404 by design) − 6 (cross-origin, unreachable in-sandbox) = **40**, an
exact match to what landed. The `cache.add(url).catch(() => {})` isolation at `sw.js:109` is
confirmed empirically, not just by reading the comment. Agent 4 also checked all 47×47 entry
pairs for the `endsWith` substring hazard at `sw.js:214` — **zero collisions**, and the two
branches (`:214-233` and `:238-250`) run identical logic anyway, so a collision would be
behaviourally inert.

---

## `_audit/AUDIT.md` verified status

Every item re-tested against current code. **Nothing was taken on the document's word.**

| ID | Claim (then) | Status | Measured now |
|---|---|---|---|
| C1 | Itinerary context bar 1.16:1 | **FIXED** | 16.14:1 / meta 9.59:1 |
| C2 | `--ion-700` dangling, 4 invisible buttons | **FIXED** | 2 refs, both in comments |
| C3 | `.glass-panel` 1.15:1 | **FIXED** | 6.09:1 dark / 5.47:1 light |
| C4 | `details` cream in dark, 1.62:1 | **FIXED** | 6.09:1 dark / 10.18:1 light, 69 elements |
| C5 | `bg-white/90` badges 1.05:1 | **FIXED** | CSS override added; markup renders 0× (lives in dead `ratingPriceHtml`) → see M7 |
| C6 | Activities heading 1:1 | **FIXED** | 12.02:1, both themes |
| H1 | `--gt-primary-600` fill 2.6:1 | **FIXED** | 5.17:1, `-text` split added |
| H2 | Gold/olive never flip, 2.21:1 | **FIXED** | 6.47:1 dark / 8.71:1 light in the detail sheet |
| H3 | Map tiles white in dark | **FIXED** | tile filter `css/design-system.css:1241-1274` |
| H4 | Leaflet chrome unthemed | **FIXED** | popup/bar/attribution themed `:1283-1308` |
| H5 | Marker colours diverged | **FIXED** | `gtCategoryColor()` reads tokens at runtime |
| H6 | Scroll hijack | **FIXED** | `scrollWheelZoom:false` + click-to-enable |
| H7 | Dashboard labels fail both themes | **FIXED** | 5.19–9.82:1 across all 11 tiles — **but see H2 above: `.dashboard-card-value` was missed** |
| H8 | `bg-white/15` controls fail | **FIXED** | 10.05:1 |
| M1 | Sync indicator vs FAB | **FIXED** | 0 px² overlap, 10/10 combos, 68 px clearance |
| M2 | 13 broken `aria-labelledby` | **FIXED** | **0** broken, verified statically + at runtime |
| M3 | Touch targets <44 px | **PARTIAL** | named controls fixed; **21 new ones** in `itinerary-view.js:314` → M6 |
| M4 | Heading skips on 3 tabs | **FIXED** | 0 skips, exactly one `<h1>` |
| M5 | Fixed map heights | **FIXED** | `dvh` calc + landscape floor; fits with 60 px spare |
| M6 | 5 unlabelled controls | **FIXED** | 0 unlabelled |
| M7 | `text-gray-400` warm grey | **FIXED** | routed to `--gt-ink-300`; 0 live instances |
| M8 | Favourite button clipped | **FIXED** | fully inside card, 8 px clearance |
| M9 | Desktop full-width stretch | **FIXED** | search capped 560 px, nav buttons 180 px centred |
| M10 | 28 images without dimensions | **STILL PRESENT** | 28/28 confirmed, **but CLS = 0.000** → M12 |
| L1 | 5× duplicate CSS blocks | **OVERSTATED** | 2 true duplicates, no conflicts |
| L2 | 3 near-identical `init*Map()` | **FIXED** | 2 remain, ~31–36 % overlap, diverge by design |
| L3 | `updateMapLayers()` unguarded | **FIXED** | function deleted; no live equivalent found |
| L4 | 13,760 DOM nodes | **STALE — 5.3× overstated** | **2,601** at DOMContentLoaded / FCP / load / networkidle; **3,019** after visiting every tab. Corroborated three ways: my measurement (2,601 / 2,947), Agent 4's (2,601 / 3,019), and Lighthouse's own `dom-size` audit (2,572). Cause: `js/ui.js:16-20` lazy-renders each tab on first open; AUDIT.md L4 predates that refactor. |

---

## GO / NO-GO

**Current: NO-GO.**

### Must fix to flip to GO
1. **B1** — restore or replace the four `filter*` calls (`js/dashboard.js:243`, `js/favorites.js:55-58`).
2. **B2** — escape + validate `rating` (`js/notes-favorites.js:43`, `js/storage.js:41-43`).
3. **B3 / H7** — escape `'` in `escapeAttr` (`js/html-utils.js:5-9`) and validate reservation `id`.
4. **B4** — scope the Explore grid rule to `.active` (`css/design-system.css:946-951`).
5. **B5** — `threshold: 0` on the reveal observer (`js/ui.js:260-267`).
6. **H1** — fall back to `query=lat,lon` instead of a name search (`scripts/apply-verified-places.js:122-141`) and regenerate `mapsUrl` for the 87 records.
7. **H2** — white `.dashboard-card-value` inside `.dashboard-card-highlight`.
8. **H8** — settle the Leaflet SRI hash against real cdnjs. **This one needs a human on a normal network.**
9. **H3** — replace the 8 wrong-location photo placements, and fix the false `alt` at `index.html:329`.

### Should fix before launch (not GO-blocking, but cheap and traveller-facing)
H5, H6, H9, H10, M4, M5, M6.

### Must accompany the fixes
- Regression tests for every BLOCKER and HIGH — **RC-9 is why these shipped**: no test file references `localStorage` at all. Priority: favourites/notes round-trip, `escapeAttr`/`escapeHtml` unit tests, reservation `id` validation, reveal-observer visibility, tab-isolation at ≥1024 px.
- Bump `CACHE_NAME` **once, at the end**.
- Document the GitHub Pages constraints (M1, M2, M3, H11).

### Verified clean — no action
Data layer (counts 28/69/34 exact, 0/169 out-of-bounds coordinates, 0 duplicate IDs, 0 referential drift, 0 missing local images, 0 malformed/plain-`http` URLs); `schema.sql` RLS (both tables, 4/4 operations, `auth.uid()` on every policy, `WITH CHECK` present); no secrets in full git history; `trip-private.js` never committed; 14/14 + 3/3 external links carry `rel="noopener noreferrer"`; zero Supabase requests in the disabled state; search never touches `new RegExp` (10 metacharacter queries pass); no defer load-order violations across 26 scripts; no global collisions across 369 declarations; no `console.log`; subpath deployment correct for GitHub Pages (0 absolute-root paths, relative SW registration, `#itinerary` deep link verified); horizontal overflow 0 px across 154 combos; all 7 test scripts pass in 8.35 s; **offline degrades honestly** — map and weather both show explicit Hebrew unavailable-messages, SW reaches `activated` with 40/40 reachable `APP_SHELL` entries cached and the `trip-private.js` 404 isolated; no `endsWith` substring collisions across 47×47 `APP_SHELL` pairs; `CACHE_NAME` currently consistent with `APP_SHELL`.

---

## Appendix A — Proposed CSP (`<meta>` delivery, GitHub Pages)

Place as the first element in `<head>`, before the JSON-LD `<script>` and stylesheet — a
`<meta>` CSP only governs markup parsed after it.

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; img-src 'self' data: https://tile.openstreetmap.org https://basemaps.cartocdn.com https://images.pexels.com https://images.unsplash.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.open-meteo.com https://*.supabase.co; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">
```

**What breaks without `'unsafe-inline'`:** all 113 `onclick` + 5 `onkeydown` + 4 `oninput`
handlers in `index.html`, ~18 more generated in `js/` template strings, 59 inline `style=`
attributes, and the JSON-LD block. **Unachievable on this host:** `frame-ancestors`,
`report-uri`/`report-to`, `sandbox`. **This CSP does not mitigate B2 or B3** — inline
execution is exactly what `'unsafe-inline'` permits.

---
---

# Phase 3 — Remediation, and the verification pass

14 commits, one root cause each. Every fix was re-verified against the exact
repro that proved the defect, `npm test` was re-run after each, and an
all-tabs/both-themes sweep checked for adjacent regressions. `CACHE_NAME` was
bumped **once**, at the end (`v21` → `v22`).

The test suite went from **7 scripts to 12**. Every new test was
mutation-checked — confirmed to *fail cleanly* against the pre-fix code rather
than crash — because a regression test that cannot fail is worse than none.

## What was fixed

| ID | Finding | Before | After | Commit |
|----|---------|--------|-------|--------|
| B1 | Favourites button dead, every heart tap threw | `ReferenceError` 100% | runs clean; 14→1 filter works | `5edc2a0` |
| B2 | Stored XSS via `rating` | executes on hover | payload inert, rating 4 still renders ★★★★☆ | `694537f` |
| B3 | Stored XSS via reservation `id` | executes on click | payload inert, valid ids untouched | `694537f` |
| B4 | Explore leaked onto every tab ≥1024px | `computed=grid`, 1216×186 | `computed=none` at 390/1440/2560 | `3e2b8a8` |
| B5 | Content panels invisible on arrival | 5,634px panel at `opacity:0` | all reveal, no scroll needed | `09b8055` |
| H1 | Navigation by Hebrew name search | 87/169 (51.5%) | 169/169 navigate by coordinate | `56568e9` |
| H2 | Countdown unreadable in light mode | 1.34:1 | **12.02:1** | `aa28e37` |
| H3 | "Gulf of Mexico sunset" photo | 9 placements, 2 false `alt` | 0 | `aa28e37` |
| H5 | Focus rings invisible | 1.11–1.18:1 | **3.24–5.14:1** | `ea8e07d` |
| H6 | Form borders invisible | 1.28–1.31:1 | **3.55–3.68:1** | `ea8e07d` |
| H9 | Topbar overflows under a notch | 10–12px | **0** | `a16d3ac` |
| H10 | Map double-init threw | 3/3 runs | **0** errors | `be1e1d4` |
| M4/M5 | Canonical, og:url, sitemap, manifest | absent / drifted | added, resynced to tokens | `4b3ef7f` |
| M7 | Dead generator-only payload | 64,897 B (14.75%) | removed | `c21499b` |
| M8 | Extractor would blank the dataset | writes silently | refuses, exits 1 | `96ef510` |
| M3b | APP_SHELL font URL drift | both directions | matches `index.html` | `a92937e` |
| M6 | Itinerary touch targets | 21 under 44px | 44×44 | `a49c6d5` |
| H11/M1/M2 | No deployment docs | none | `README.md` | `fd0b03d` |

## Verification pass (Agents 1, 3, 4, 6 re-run)

```
Runtime      all 11 tabs x both themes: pageErrors 0
             (5 console errors remain, all environment: trip-private.js 404 by
              design, blocked fonts, blocked open-meteo, harness Leaflet bytes)
Security     both stored-XSS payloads inert; pageErrors 0
Contrast     C1 9.59  C3 6.09/5.47  C4 6.09/10.18  H7 7.32/5.19  — 0 failing
Non-text     focus 5.14/4.77 light, 3.24/3.50 dark; borders 3.55/3.68
Layout       #explore computed=none at 390x844, 1440x900, 2560x1200
Reveal       trip-planning, language-daily, faq all reveal without scrolling
PWA          cache corfu-guide-v22, 40 entries, trip-private absent
Offline      map "לא ניתן לטעון את המפה כרגע", weather "📡 לא זמין" — honest
DOM          2,607 first paint / 2,953 all tabs (AUDIT.md L4's 13,760 is stale)
Tests        12/12 passing
```

## Still open

**Gating — needs a human on an unrestricted network:**

- **H8, the Leaflet SRI pin.** `cdnjs` is unreachable from the audit sandbox, so
  the hash at `js/map.js:47` could never be checked against the real bytes.
  npm ships no `leaflet.min.js` (cdnjs generates that variant itself), so the
  mismatch against npm's `dist/leaflet.js` is *not* proof of a wrong hash —
  but it is not proof of a right one either. If the pin is wrong, Leaflet never
  executes and every map is permanently dead, though it fails honestly with the
  Hebrew fallback rather than a blank box.
  ```
  curl -s https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js \
    | openssl dgst -sha384 -binary | openssl base64 -A
  ```
  Note: `_audit/CHANGES.md:90` says the hashes were *"restored"* after local
  testing, **not verified** — it is not evidence either way.

**Deliberately not fixed — these are content or product decisions, not defects
with a mechanical fix:**

- **H4.** 22 images still reused across 2–7 unrelated records (one Pexels URL
  backs 7 different restaurants), and `hasRealPhoto` is `false` on all 169
  records while being read nowhere. Needs real photography, or a decision to
  surface a "generic photo" badge. Substituting more stock would be motion,
  not progress.
- **M10, CSP.** A `<meta>`-delivered policy is written out in Appendix A and
  would restrict origins, but it cannot mitigate B2/B3 (inline execution is
  exactly what `'unsafe-inline'` permits, and 113 inline handlers require it)
  and cannot deliver `frame-ancestors` on this host at all. Worth adding as
  defence in depth; not worth pretending it is a security control here.
- **M12 and M13 were subsequently fixed** (commit `f5d612b`): the font now
  loads non-blocking with a `<noscript>` fallback and an explicitly
  Hebrew-capable fallback stack, and both `js/explore.js` image templates carry
  intrinsic dimensions with `aspect-ratio:16/9` on the sheet thumb — the one
  variant that genuinely reserved no box.
- **M11**, the transient sticky-bar/FAB overlap, is left alone deliberately.
  It resolves the moment the user scrolls, the FAB already sits above the chip
  rather than under it, and there is no general fix that does not either shorten
  those bars or move the FAB column — both worse trades than the symptom.
- **The CSP is deliberately NOT shipped**, despite being written out in
  Appendix A. On this host it can only be a `<meta>` tag, which cannot express
  `frame-ancestors`, `report-uri` or `sandbox`; it cannot mitigate B2/B3,
  because 113 inline handlers force `'unsafe-inline'`, which is exactly what
  those exploits used; and a subtly wrong policy breaks the app in production
  on a host where **you cannot hot-fix a header** — the failure mode this whole
  audit exists to avoid. The security value is near zero here and the downside
  is a broken app for travellers offline in Greece. Add it only alongside a
  migration to a host that supports real headers, or after converting the
  inline handlers to delegated listeners.
- **The CLS 0.49 is now EXPLAINED, and is not a product defect.** The
  independent verification pass reproduced it and found the cause: Lighthouse
  does not use the harness's route stubbing, so its own `network-requests`
  audit shows the Google Fonts stylesheet and the open-meteo fetch both
  **hanging unresolved** (`statusCode: -1`, no `endTime`) rather than failing
  fast. The shift is blocked-host placeholder collapse, not layout instability
  in the app. Directly instrumented measurement of the same page and tab, with
  those hosts stubbed, gives **0.00036**. Four measurements now agree
  (0.0004 / 0.0004 / 0.000 / 0.00036) against one distorted outlier.
  Lighthouse's absolute scores are not usable evidence in this sandbox.
- **External link liveness** across 417 URLs — still unverifiable here. The
  exported list and a ready-to-run script are in the coverage table above.

### The LOW tail, and one item rejected on evidence

The remaining LOW findings were cleared in `2202076`: the stale-pointer
comments, the dead `mapLayerGroups` / `beachMapInstance` declarations, the
duplicate `.premium-card-image` cross-reference, the Google Fonts SRI
rationale, banners on the two one-off scripts that cannot run, and — finding
O-3 — a SUPERSEDED banner plus a verified-status column on `_audit/AUDIT.md`
itself, so it no longer reads as an open list of six critical defects that are
all fixed.

**`'use strict'` (L9) was attempted and rejected on evidence, not preference.**
Adding it to all 25 files broke **7 of the 12 test scripts**
(`TypeError: win.focusMapOnDayLocations is not a function`). The cause is real
and specific: the tests load source by joining files and running them through
`win.eval()`, and a strict-mode `eval` gets its own scope, so top-level function
declarations no longer leak to the global object. In a browser, `<script>` tags
would still publish them — so this is a test-harness incompatibility rather
than proof the app breaks.

That distinction does not rescue the change. Adopting `'use strict'` would mean
rewriting how every test loads the code, immediately before launch, to gain
protection against a class of bug the audit measured at **zero occurrences**
(369 top-level declarations scanned, 0 collisions, 12 implicit-global
candidates all false positives). The suite is the only safety net this project
has; trading it for a hypothetical benefit is the wrong way round. Reverted,
12/12 restored.

Worth doing later, alongside a change to how the tests load source — not as a
pre-launch edit.

**Two LOW items remain open by choice:** a 180×180 `apple-touch-icon` (needs an
image library this project deliberately does not depend on; iOS downscales the
existing 192 correctly), and `og:image` / `twitter:image` still hotlinked to
Pexels — social-card-only, so it affects no offline behaviour, and no
replacement could be sourced or content-verified from this sandbox.

---

## Revised call

**GO, conditional on one check.**

All five blockers are fixed and verified. Every WCAG failure found is measured
clean in both themes. The data layer was already sound and is now more so:
navigation resolves to coordinates for the whole guide rather than name-searching
half of it, and the only actively misleading content — a photo of the Gulf of
Mexico captioned as Corfu — is gone.

The single thing standing between this and an unconditional GO is **H8**: run
the `curl | openssl` command above and compare against `js/map.js:47`. If it
matches, ship. If it does not, update the `integrity` attribute and ship.

Everything else on the open list is a known, documented, non-blocking trade-off.
