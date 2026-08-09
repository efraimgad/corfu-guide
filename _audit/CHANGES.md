# Changes applied

Four files were modified: `css/design-system.css`, `index.html`, `js/map.js`, `js/reservations.js`. No files were added or deleted, no dependencies added, no build step introduced. Every change is verified by rendering the page in a real browser, not by reading the CSS.

---

## Phase 1 — Critical bugs, dark mode, map

### Critical

**C1 — Itinerary day-context bar was white-on-white in dark mode.** `.gt-itinerary-context` used `background: var(--gt-ink-900)`, a theme-*flipping* token, while its own comment stated it needed a permanently dark surface for its `text-white` / `bg-white/15` children. Switched to `--gt-fixed-dark-bg` (the token that already exists for exactly this purpose, used by the footer) and pinned the child text colours. **1.16:1 → 16.1:1.**

**C2 — `--ion-700` deleted but still referenced.** Four call sites (`index.html` ×3, `js/reservations.js` ×1) resolved to an invalid value, rendering white-on-white invisible buttons in *both* themes. Repointed to `.gt-bg-accent`; added the missing `.gt-hover-accent` utility for the dangling hover state.

**C3 — `.glass-panel` filter bars unreadable in dark mode** (8 call sites: every filter and quick-nav bar). Hardcoded `rgba(255,254,251,0.72)` never flipped while its labels did. Tokenised as `--gt-glass-bg` / `--gt-glass-hair`, with real dark values. **1.15:1 → passes.** Same treatment for `.dashboard-panel`.

**C4 — `details` accordions stayed cream in dark mode.** `background: #fffefb` → `var(--gt-paper-raised)`. Affects every FAQ entry and every in-card tips fold.

**C5 — `bg-white/90` badges invisible in dark mode** (64 sites). Tailwind's opacity modifier compiles to a different class than `.bg-white`, so the existing remap never reached it. Added `--gt-scrim-raised` / `--gt-scrim-ink` and routed the opacity variants through them — fixes all 64 without touching the data file. **1.05:1 → passes.**

**C6 — Activities section heading invisible in both themes.** Missing `text-white`, so it inherited the same colour as its own background. **1:1 → 12.3:1.**

### High

**H1 — `--gt-primary-600` used as a solid fill behind white text.** Dark theme lightened it to `#5aa8dd` for the *text* role, breaking the *fill* role (white on it = 2.6:1). Applied the same base-fill/`-text` split the file already uses for `--gt-cat-*`: the fill token no longer flips, and `--gt-primary-600-text` carries the lightened value. **White on fill = 5.17:1.**

**H2 — Accent tokens never flipped, but their paired backgrounds did.** `--gt-primary-500/700/900`, `--gt-accent-gold-500/600/700` and `--gt-accent-olive-600` had no dark values while `--gt-primary-50/100` and `--gt-accent-gold-100` did — stranding foregrounds on backgrounds that moved out from under them. Added `-text` variants for gold, olive and primary-700; repointed `.badge-*-text`, `.verified-warn`, `.verified-tel`, `.text-blue/purple/teal/indigo/green/amber-*`.

**H3 — Map tiles bright white in dark mode** (3 instances). Added a dark-tile filter scoped to `.leaflet-tile-pane` **only** — markers, selection ring, popups and controls live in sibling panes and keep their true colours. No new network dependency.

**H4 — Leaflet chrome entirely unthemed.** There was zero Leaflet CSS in the project; popups, zoom controls, attribution and cluster bubbles were all Leaflet's hardcoded whites. Added a full theming block. **Note:** Leaflet's stylesheet is injected at runtime *after* the design system, so every override initially tied on specificity and silently lost — all selectors are `:root`-prefixed, and the attribution rule matches Leaflet's two-class depth.

**H5 — Marker colours had diverged from the tokens they claim to match.** The CSS states its category tokens are "identical to js/map.js pin colors", but a later contrast pass darkened the tokens and never updated the 13 hardcoded hexes. Added `gtCategoryColor()`, which reads the live token; deleted all 13 literals.

**H6 — Scroll gestures hijacked.** All three maps were built with Leaflet defaults, so a wheel scroll crossing the map zoomed it instead of scrolling the page. `scrollWheelZoom` now starts disabled and arms on click. Added `maxBounds` so a stray pan can't lose Corfu.

**M7** — `.text-gray-400` was pinned to a literal `#756e63` that couldn't serve both themes; routed to `--gt-ink-300`.

Also: theme-aware `--gt-danger-text` (red is kept unaliased for genuine safety signals, but still needed a per-theme value); `.sync-status-indicator` no longer a bright white disc.

---

## Phase 2 — Mobile, desktop, accessibility

- **M1** — `#sync-status-indicator` was outside the FAB stacking arithmetic entirely: 20×28px overlap with the emergency FAB on every phone, and 28×28px on top of the bottom nav on desktop. Brought into the shared column. **Now zero collisions.**
- **M2** — 13 `aria-labelledby="tab-*"` references pointed at IDs that **do not exist** anywhere in the document, so every tab region was announced unlabelled. Replaced with real `aria-label`s.
- **M3** — Touch targets raised to the 44px WCAG 2.5.5 / iOS HIG minimum: star rating, visited, note toggle, filter chips, tel links, in-card action links, circular icon buttons. The visual size is unchanged — the extra area is transparent padding. **~1,281 sub-44px instances → 9.**
- **M4** — Heading hierarchy: `h2 → h4` skips on beaches/attractions/gems fixed by promoting 5 headings to `h3`. Purely semantic; sizing comes from the unchanged utility classes.
- **M5** — Map heights were fixed pixels (500px/400px). On iPhone SE that ate 75% of the viewport; in landscape it was taller than the screen. Now `clamp()`.
- **M6** — 5 form controls had a visible `<label>` directly above them but no `for` attribute, so the association was visual only. Added.
- **M8** — Favourite button on collapsed dual-image cards resolved to x=378 on a 390px viewport (32px outside the card, clipped). Re-anchored with a logical inset.
- **M9** — Desktop: search field capped at 560px (was stretching to ~1080px on a 1440px monitor), and the bottom nav's five items no longer fling to the corners of an ultrawide.

---

## Phase 3 — Consistency, cleanup

- **Disabled states** — the system defined hover, active, focus-visible and aria-selected but never disabled, so a disabled control was visually identical to an enabled one. Added uniform treatment covering both `:disabled` and `aria-disabled` (several controls are anchors/divs that can't carry the native attribute).
- **Map code consolidated** — three near-identical `init*Map()` functions collapsed into `gtCreateMap()` / `gtBuildCategoryLayers()` / `gtBuildHotelLayer()`. The hotel marker's `divIcon` HTML was duplicated verbatim in two places; now one.
- **Null guards** — `updateMapLayers()` dereferenced checkboxes unguarded (a missing control threw a `TypeError` that aborted the whole layer sync); `initBeachMap()` dereferenced `#beach-map` unguarded while the other two guarded. Both fixed.
- **`--gt-ink-300` retuned** (`#677375` → `#616d6f`) — it had been verified against `--gt-paper` and `--gt-paper-raised` but not `--gt-paper-sunken`, where it was 4.15:1, and that is the surface the trip-planning footnotes sit on.

### Not done, deliberately

**CSS selector "duplicates" (audit item L1) were overstated.** On inspection the repeated `.premium-card-image`, `.tab-content` and `.section-hero-banner-img` blocks set *complementary* properties across sections rather than overriding each other. Merging them would be churn with regression risk for no behavioural gain.

**The two UX findings are untouched**, because they are judgment calls rather than defects: 15 tabs behind 5 nav slots (with the same restaurant reachable through two different card UIs), and three map instances with three different interaction models. Both are worth a conversation before anyone changes them.

**~9 sub-44px touch targets remain** — a long tail of one-off controls.

---

## Final QA

| Check | Before | After |
|---|---|---|
| Dark-mode AA contrast failures | ~40 across 12 tabs | **0** |
| Light-mode AA contrast failures | 7 | **0** |
| Horizontal page overflow (7 viewports × 2 themes) | none | **none** |
| Console / page errors | none | **none** |
| Broken ARIA references | 13 | **0** |
| Unlabelled form controls | 5 | **0** |
| Heading-level skips | 3 tabs | **0** |
| Sub-44px touch targets | ~1,281 | **9** |
| Floating-button collisions | 2 | **0** |
| Duplicate element IDs | 0 | **0** |

One regression was introduced and caught by the QA pass: a module-scope `L.latLngBounds` reference that threw `"L is not defined"` on every page load, since Leaflet is lazy-loaded. Fixed and re-verified.

The map was additionally tested end-to-end against real Leaflet (44 markers rendering, clustering active, category colours reading from tokens, tile filter applied, chrome themed in both modes). The CDN URLs and SRI hashes were then restored and the temporary local copies deleted.
