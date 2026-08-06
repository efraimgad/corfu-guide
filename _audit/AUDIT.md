# Corfu Guide — Full UI/UX, Accessibility & Code Audit

**Method.** The site was served locally and rendered in headless Chromium across 7 viewports (375×667 iPhone SE, 390×844 iPhone 13, 412×915 Pixel, 820×1180 iPad, 844×390 landscape, 1440×900 desktop, 2560×1200 ultrawide) in **both** `light` and `dark` `prefers-color-scheme`, across all 15 tabs. Contrast ratios were computed from real composited `getComputedStyle` values using the WCAG relative-luminance formula, not estimated by reading CSS. Overflow, fixed-element collision, touch-target size, ARIA reference integrity and heading order were measured programmatically.

**Headline.** The design system itself is well built — the `--gt-*` token layer, the category/status colour split with separate `-text` variants, and the documented rationale in the CSS comments are genuinely above average. Almost every defect below is the *same class of bug*: **a surface colour that was hardcoded as light instead of routed through a token**, or **a token that flips in dark mode being used in a role where it must not flip**. There are 6 distinct root causes producing roughly 40 visible symptoms. Fixing the 6 causes fixes nearly all of it.

---

## Severity summary

| # | Issue | Severity | Area |
|---|---|---|---|
| C1 | Itinerary day-context bar is white-on-white in dark mode | **Critical** | Dark mode |
| C2 | `--ion-700` deleted but still referenced — 4 invisible buttons | **Critical** | Bug |
| C3 | `.glass-panel` filter bars unreadable in dark mode (8 sites) | **Critical** | Dark mode |
| C4 | `details` accordions stay cream in dark mode | **Critical** | Dark mode |
| C5 | `bg-white/90` image badges invisible in dark mode (64 sites) | **Critical** | Dark mode |
| C6 | Activities section heading is invisible in both themes | **Critical** | Bug |
| H1 | `--gt-primary-600` used as fill behind white text → 2.6:1 | High | Dark mode |
| H2 | Accent/gold/olive tokens never flip → badge text 1.8–3.1:1 | High | Dark mode |
| H3 | Map tiles are bright white in dark mode (3 instances) | High | Map |
| H4 | Leaflet chrome (popups, zoom, attribution, clusters) untheme | High | Map |
| H5 | Marker colours diverged from the tokens they claim to match | High | Map |
| H6 | Scroll-wheel / one-finger drag hijacks page scroll on maps | High | Map |
| H7 | Dashboard tile labels fail AA in **both** themes | High | A11y |
| H8 | `bg-white/15` itinerary controls fail in both themes | High | Dark mode |
| M1 | Sync indicator overlaps emergency FAB; light disc in dark mode | Medium | Mobile |
| M2 | 13 broken `aria-labelledby` references | Medium | A11y |
| M3 | Touch targets below 44px (star rating, visited, note toggles) | Medium | Mobile |
| M4 | Heading hierarchy skips h2→h4 on three tabs | Medium | A11y |
| M5 | Fixed map heights break landscape & iPhone SE | Medium | Mobile |
| M6 | 5 unlabelled form controls | Medium | A11y |
| M7 | `text-gray-400` pinned to a warm grey that never flips | Medium | Dark mode |
| M8 | Favourite button mispositioned/clipped on dual-image cards | Medium | Mobile |
| M9 | Desktop: search field and bottom nav stretch to full width | Medium | Desktop |
| M10 | 28 images without dimensions → layout shift | Medium | Performance |
| L1 | Duplicated CSS selector blocks (5× `.premium-card-image`) | Low | Code |
| L2 | Three near-identical `init*Map()` functions | Low | Code |
| L3 | `updateMapLayers()` unguarded DOM lookups | Low | Code |
| L4 | 13,760 DOM elements on first paint | Low | Performance |

---

## 1. Dark mode

### C1 — Itinerary day-context bar renders white-on-white *(Critical)*

**Where:** `css/design-system.css:981` `.gt-itinerary-context`
**Evidence:** `shots/v-itinerary-dark-390-400.png`. Measured: `.gt-h3` `rgb(255,255,255)` on `rgb(234,239,240)` = **1.16:1**; `.gt-meta` = 1.12:1; the "הושלם" control = 1.02:1.

**Root cause.** The rule is:

```css
.gt-itinerary-context{ background: var(--gt-ink-900); }
```

and its own comment states the intent — *"a solid **dark** surface so the relocated controls — styled with light/translucent-white Tailwind utility classes — stay legible."* But `--gt-ink-900` is a **theme-flipping ink token**: `#1a2226` in light, `#eaeff0` in dark. So in dark mode the bar becomes near-white while its children keep `text-white`, `text-white/90`, `bg-white/15` and `placeholder-white/60`.

This is exactly the trap the codebase already identified and solved for the footer, where `--gt-fixed-dark-*` was introduced precisely because *"a footer that's dark-on-light in light mode would otherwise invert."* That fix was never applied here.

**Fix.** Use `--gt-fixed-dark-bg` / `--gt-fixed-dark-hair`. Same for the `.gt-bg-ink-900` utility wherever it pairs with white text.

**Why it matters.** This is the day-by-day itinerary header — the single screen you'll actually be reading while standing in Corfu. It is currently unusable in dark mode.

---

### C3 — `.glass-panel` filter bars unreadable in dark mode *(Critical)*

**Where:** `css/design-system.css:1290`; used at `index.html:688, 1143, 1281, 1603, 1683, 1950, 2006, 2060`
**Evidence:** `shots/v-beaches-dark-390-400.png`. Measured: `"סננו לפי מה שמתאים לכם:"` = **1.15:1**, `"מציג את כל 26 החופים"` = 1.95:1, `"קפצו ישירות לקטגוריה:"` = 1.41:1.

**Root cause.** `background: rgba(255, 254, 251, 0.72)` — a hardcoded near-white frosted fill, plus `border: 1px solid rgba(255,255,255,0.5)`. Neither flips. Over the dark page it composites to a light grey slab, while the labels use `gt-text-700`/`gt-text-500`, which correctly flip *light*. Light text on a light panel.

**Fix.** Drive the glass fill from a token pair — `--gt-glass-bg` / `--gt-glass-border` — defined light in `:root` and dark in both dark blocks. Same treatment for `.dashboard-panel` (`:2475`).

---

### C4 — `details` accordions stay cream in dark mode *(Critical)*

**Where:** `css/design-system.css:1424` — `details { background: #fffefb; }`
**Evidence:** activities tab, collapsible body text measured at **1.62:1** (`rgb(194,204,206)` on `rgb(255,254,251)`).

**Root cause.** A literal hex where `var(--gt-paper-raised)` belongs. This is the identical bug the file's own comment says was already fixed for `.bg-white` — *"a hardcoded #fffefb background never flipped to match"* — but `details` was missed in that sweep. Every FAQ entry and every in-card "מידע נוסף וטיפים" fold is affected.

**Fix.** `background: var(--gt-paper-raised); border-color: var(--gt-hair);`

---

### C5 — `bg-white/90` badges invisible in dark mode *(Critical)*

**Where:** `js/locations-data.js` (63 occurrences), `js/cards.js:230`
**Evidence:** the ⭐ rating badge measured **1.05:1**; the category badge (`🏘️ כפר מסורתי`) 1.05:1.

**Root cause.** The design system remaps `.bg-white` to `var(--gt-paper-raised)`, but Tailwind's opacity modifier generates a *different class* — `.bg-white\/90` → `rgb(255 255 255 / 0.9)` — which the override never touches. The paired `text-gray-800` *does* flip (to near-white), so it's near-white on near-white.

**Fix.** Add a themed override for the opacity variants used (`bg-white/90`, `/60`, `/20`, `/15`) driven by a `--gt-scrim-raised` token. This fixes all 64 call sites without editing the data file.

---

### C6 — Activities heading invisible in **both** themes *(Critical)*

**Where:** `index.html`, activities hero — `<h2 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 flex ...">🎢 אטרקציות ופעילויות</h2>`
**Evidence:** measured `rgb(15,58,82)` on `rgb(15,58,82)` = **1:1**, both themes.

**Root cause.** The heading carries no colour class and sits on a `gt-bg-accent-strong` band (`--gt-primary-900`, `#0f3a52`). It inherits the same colour as its own background. Every sibling hero heading on the other tabs carries `text-white`; this one lost it.

**Fix.** Add `text-white` (and verify 4.5:1 against `--gt-primary-900` — it is 12.3:1).

---

### H1 — `--gt-primary-600` used as a solid fill behind white text *(High)*

**Where:** `.gt-bg-accent`, `.gt-chip[aria-selected]`, `.gt-scrubber__day--active`, `.faq-filter-btn.active`, table `<th>`, `"חייגו 171"` emergency card, primary CTAs.
**Evidence:** white on `rgb(90,168,221)` = **2.6:1** in dark mode (light mode: 4.9:1, passes).

**Root cause.** Dark theme lightens `--gt-primary-600` to `#5aa8dd` so it works as *link/label text on a dark background*. But the same token is also used as a *background behind white text*. Those two roles need opposite adjustments.

The file already solved this exact conflict for the category colours — it kept `--gt-cat-*` fixed for solid fills and added `--gt-cat-*-text` variants for text-on-soft, with a comment explaining why. **Primary never got the same treatment.**

**Fix.** Mirror the existing pattern: keep `--gt-primary-600` as the (unflipped) fill token, add `--gt-primary-600-text` (`#5aa8dd` in dark) for text use, and point `.gt-text-accent` at the `-text` variant while `.gt-bg-accent` keeps the fill value.

---

### H2 — Accent tokens never flip, but their paired backgrounds do *(High)*

**Evidence:** `.badge-gold-*` = `rgb(122,93,38)` on `rgb(58,44,16)` = **2.21:1**; `.badge-olive-*` 3.0:1; `text-blue-800`→`--gt-primary-700` on `--gt-primary-50` = 2.09:1; `verified-closed` 2.95:1; `text-purple-800` 2.18:1.

**Root cause.** A systematic asymmetry. These tokens have **no dark-theme override**:
`--gt-primary-500`, `--gt-primary-700`, `--gt-primary-900`, `--gt-accent-gold-500/600/700`, `--gt-accent-olive-600`

…but their paired *background* tokens **do** flip: `--gt-primary-50`, `--gt-primary-100`, `--gt-accent-gold-100`. So the foreground stayed at its light-theme value while the background went dark underneath it.

**Fix.** Add dark-theme `-text` variants for gold and olive (mirroring the `--gt-cat-*-text` convention already in the file), and give `--gt-primary-700` a dark-theme text value.

---

### M7 — `text-gray-400` pinned to a non-flipping warm grey *(Medium)*

**Where:** `css/design-system.css:1521` area — `.text-gray-400, .text-slate-400 { color: #756e63; }`
**Evidence:** favourite hearts and the map-offline message measure **3.59:1** on dark.

**Root cause.** The comment explains it was hardcoded to fix a *light-mode* AA failure, but a literal hex can't serve both themes. Route through `--gt-ink-300`, which is already correctly tuned per theme (`#677375` / `#798988`).

---

### Also confirmed in dark mode

- **Shadows:** correctly re-tuned (`rgba(0,0,0,0.35–0.55)`). No issue.
- **Footer:** correctly uses `--gt-fixed-dark-*`. No issue.
- **Search field / top bar / bottom nav:** correctly tokenised. No issue.
- **`.bg-green-50` / `.bg-green-100`** (`:1486`) are literal `#f2f5ea` / `#e6ecd8` — light-only, same class of bug, lower traffic.
- **`.sync-status-indicator`** (`:2594`) is `rgba(255,255,255,0.9)` — a bright white disc in dark mode.
- Several hero-image contrast "failures" flagged by the tool are **false positives** — white text over photography that my stub replaced with a flat placeholder. `.journey-chapter` and the tab hero `h2`s are fine in production.

---

## 2. Map

### H3 — Tiles are bright white in dark mode *(High)*

**Where:** `js/map.js:128, 557, 707` — all three instances use `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` unconditionally.

**Root cause.** No dark-tile handling at all. On the Home tab the map is full-bleed, so in dark mode it is a glaring white rectangle occupying the entire viewport.

**Fix.** Apply a CSS filter to `.leaflet-tile-pane` under the dark selectors (`invert(0.92) hue-rotate(180deg) brightness(0.95) contrast(0.9) saturate(0.7)`). This needs no extra network dependency or API key, respects the existing "no new third-party requests" constraint, and — critically — the filter must be scoped to the *tile pane only* so markers, the selection ring and popups keep their true colours.

### H4 — Leaflet chrome is entirely unthemed *(High)*

**Root cause.** `grep` confirms **zero** Leaflet selectors in `design-system.css`. Leaflet's own stylesheet ships white popups, white zoom buttons with dark glyphs, a white attribution strip, and `MarkerCluster.Default.css` ships pale lime/yellow/orange cluster discs with dark text. All of it is bright white/pastel in dark mode.

**Fix.** Add a scoped Leaflet theming block: popup wrapper + tip, zoom controls (including `:hover` and `.leaflet-disabled`), attribution bar, and the container's focus ring — all driven by `--gt-paper-raised` / `--gt-ink-*` / `--gt-hair`.

### H5 — Marker colours diverged from the tokens they claim to match *(High)*

**Root cause.** `design-system.css` states the category tokens are *"identical to js/map.js pin colors"* and lists `#2563eb / #ea580c / #9333ea / #059669`. But a later contrast pass **darkened the tokens** to `#2160eb / #bb460a / #9230ea / #047b56` — and `js/map.js` was never updated. The pins, the cluster bubbles and `GT_MAP_CATEGORY_META` still carry the old hexes, hardcoded in **13 places**. Legend chips and map pins are now measurably different colours.

**Fix.** Read the tokens at runtime via `getComputedStyle(document.documentElement).getPropertyValue('--gt-cat-beach')` in one helper, and delete the 13 literals.

### H6 — Scroll gestures hijacked *(High)*

**Root cause.** `L.map('beach-map')` is constructed with default options: `scrollWheelZoom: true`, `dragging: true`. On a long scrolling page, a wheel scroll that crosses the map zooms the map instead of scrolling the page; on mobile a one-finger drag pans the map and traps the scroll.

**Fix.** `scrollWheelZoom: false` + `map.on('click', () => map.scrollWheelZoom.enable())` (click-to-activate), and `tap: true, dragging: !L.Browser.mobile` is too aggressive — better: leave dragging on but add `touchZoom: true` and rely on the page-level fix of giving the map a bounded height. For the embedded (non-fullbleed) maps, click-to-activate wheel zoom is the right pattern.

### M5 — Fixed pixel heights *(Medium)*

`#beach-map` is `height:500px` inline; `#explore-map` is `height:400px`. On iPhone SE (667px tall) the beach map consumes 75% of the viewport; in landscape (390px tall) it is taller than the screen. The Home map is correctly done (`100dvh` minus chrome) — the other two should use `clamp()`.

### Other map findings

- **L3 (Low):** `updateMapLayers()` does `document.getElementById(checkboxId).checked` with no null guard → `TypeError` if any layer checkbox is absent. `initBeachMap()` likewise dereferences `#beach-map` unguarded, while the other two init functions *do* guard — inconsistent.
- **L2 (Low):** `initBeachMap` / `initExploreMap` / `initHomeMap` are ~85% identical (tile layer, four `buildLayerGroup` calls, hotel marker). The hotel marker `divIcon` HTML is duplicated verbatim in two places.
- **Low:** the hotel marker still uses `bindPopup`, bypassing the shared `gtOnMarkerTap` sheet mechanism every other marker uses — so one pin behaves differently from all the others.
- **Low:** no `maxBounds`; users can pan to the Atlantic with no "reset view" affordance.
- **Low:** coordination is by fixed `setTimeout(50/150/300)`. It works, but it is timing-dependent rather than event-driven.

---

## 3. Mobile

**Good news first:** there is **no horizontal page overflow at any tested width** — `documentElement.scrollWidth === clientWidth` on all 7 viewports in both themes. The chip rows and day scrubber that appear to overflow are inside intentional horizontal scrollers. The safe-area work (`env(safe-area-inset-*)`) is thorough and correct.

### M1 — Sync indicator overlaps the emergency FAB *(Medium)*

**Measured:** iPhone SE — `#emergency-fab-btn` at (24, 547) 48×48, `#sync-status-indicator` at (16, 551) 28×28 → **20×28px overlap**. On desktop the indicator instead overlaps the bottom nav bar by 28×28.

**Root cause.** The FAB stacking rules in `design-system.css:611–637` carefully choreograph `#emergency-fab-btn`, `#back-to-top-btn`, `#gt-tools-fab-btn` and `#map-fab-btn` — but `#sync-status-indicator` was never included in that calculation and sits at a raw `left:16px; bottom:…` with `z-index:50`, above everything.

### M3 — Touch targets below 44×44 *(Medium)*

`.pt-star` (rating stars), `.pt-visited-btn`, `.pt-note-toggle`, `.verified-tel` links, `.dashboard-card-link`, `.food-filter-btn`, and the small `gt-chip` category chips all measure under 44px. The star rating widget is the worst — hundreds of instances of a tap target well under the WCAG 2.5.5 / iOS HIG minimum, on the exact widget you'll be poking at one-handed on a beach.

### M8 — Favourite button clipped on dual-image cards *(Medium)*

On the activities tab at 390px the `.favorite-btn` measures x=378, width=44 → right edge 422, i.e. 32px past the viewport, clipped by an `overflow:hidden` ancestor. Its positioning context is `.premium-card-image` (`position:relative`) but the `left-2` physical offset interacts badly with the RTL dual-grid layout.

---

## 4. Desktop

- **M9:** the top-bar search input stretches to ~1080px on a 1440px screen — a single-line search field the width of a billboard. Needs a `max-width` (~560px) and centring.
- **M9:** the bottom tab bar spans the full 1440px (and 2560px on ultrawide), spreading five items edge to edge. It's a mobile pattern rendered at desktop scale. Constrain to `max-width` and centre it.
- Content is correctly capped at `max-width: 1280px` (`.max-w-7xl`) — that part is fine, and on a 2560px ultrawide it centres properly with no stretched cards.
- Card grids collapse sensibly; no misalignment found.

---

## 5. Visual consistency

The token scale is coherent (8px spacing grid, 5-step radius, 4-step shadow, `--gt-dur-*` motion). Genuine inconsistencies:

- **Radius:** `.rounded-xl` and `.rounded-2xl` are both remapped to `--gt-r-lg`, so two different authored intents render identically. Meanwhile raw `rounded-full`, `rounded-lg` and `rounded-md` are untouched, so four radius vocabularies coexist.
- **Shadows:** `.shadow-md` and `.shadow-lg` both map to `--gt-sh-2` — same collapse.
- **Icon sizing:** emoji glyphs (`text-4xl`, `text-5xl`, `text-3xl`) sit alongside a proper `.icon-line` SVG system. Two icon languages.
- **Buttons:** `.gt-btn--primary/--secondary` coexists with dozens of ad-hoc `bg-* text-white rounded-xl px-4 py-2` inline button recipes.
- **Disabled states:** essentially undefined. No `:disabled` styling in the design system.

---

## 6. Accessibility

Confirmed **good**: every image has `alt`; every button and link has an accessible name; `:focus-visible` rules exist; skip-link present; modals implement focus trap + Escape + focus restore; `prefers-reduced-motion` is respected for the marker pulse.

Confirmed **broken**:

- **M2 — 13 broken `aria-labelledby` references.** Every `<section class="tab-content">` points at `tab-{id}` (e.g. `aria-labelledby="tab-beaches"`), and **none of those IDs exist** in the document. Screen readers announce these regions as unlabelled.
- **M4 — heading skips.** `beaches`, `attractions`, `gems` jump h2 → h4, with no h1 in the tab.
- **M6 — 5 unlabelled controls:** `#dash-editor-input1`, `#dash-editor-input2`, `#currency-eur-input`, `#dist-from`, `#dist-to`.
- **Contrast:** ~40 AA failures, catalogued above. Note that **seven of them fail in light mode too** (dashboard tile labels 2.14–3.59:1, `.gt-text-300` captions 4.15:1, the `--ion-700` buttons at 1:1).
- **M3 — touch targets**, above.

---

## 7. Performance

- **L4 — 13,760 DOM elements** rendered on load. All 15 tabs are in the DOM at once with `display:none` toggling. It works, but it's a heavy first paint and a large memory footprint on an older phone.
- **M10 — 28 images with no `width`/`height`** → cumulative layout shift as photos arrive. (`loading="lazy"` is otherwise applied well — only 1 image missing it.)
- **Good:** Leaflet + MarkerCluster (~150KB) are correctly lazy-loaded behind first map use, with SRI hashes. That's a genuinely well-executed optimisation.
- **Good:** marker clustering is enabled with a sensible `maxClusterRadius: 50`.
- `tailwind-production.css` is 29KB minified — reasonable.
- `js/locations-data.js` is 4,581 lines shipped synchronously; it's the largest single blocking asset.

---

## 8. Code quality

- **L1 — duplicated selector blocks:** `.premium-card-image` defined 5×, `.gt-explore-verified-fold` 4×, `.verified-info` / `.section-next-steps` / `.dashboard-card-highlight` / `.premium-card:hover` 3× each, scattered across the 2,792-line stylesheet. Later definitions silently win; editing the first one has no effect.
- **Dead code:** `--ion-700` (4 refs, C2), `--olive-600` (1 ref in a comment), `tailwind-production.css` contains zero `dark:` variants yet the config has no `darkMode` setting — the Tailwind dark strategy is unused, which is *why* the design system had to re-map utilities by hand.
- **L2 — three near-identical map init functions**, above.
- **192 inline `onclick` handlers** and **112 `window.*` global exports** — the architecture is "no build step, everything global", which is a legitimate choice here, but it means no dead-code elimination is possible and the global namespace is very crowded.
- **51 `innerHTML` assignments** — mostly fed by trusted local data, and `escapeAttr`/`html-utils.js` is used in the right places. Not a security issue for a personal, private guide, but worth knowing.
- The CSS comments are genuinely excellent — they explain *why*, cite the audit phase, and record what was verified by rendering vs. by reading. Several of the bugs above are cases where the comment states the correct intent and the code drifted from it.

---

## 9. User experience

- **Navigation is the weak point.** There are 15 tabs but only 5 bottom-nav slots, with the remaining 10 behind an "עוד" sheet. Content is split across two overlapping systems: a new Explore/Home experience *and* the older beaches/food/attractions/gems tabs kept as a "hidden fallback". The same restaurant is reachable through two different UIs with two different card designs and two different detail sheets. For a two-person guide this is more surface than it needs.
- **Three separate maps** (Home, Explore, beaches) with three different interaction models — the Home map is full-bleed, Explore is a toggle that becomes a split-view at ≥1024px, beaches is a toggle-only. A user won't build a mental model of "the map".
- **Positive:** the honesty layer is excellent — `verified-*` badges, "שעות פתיחה לא אומתו" warnings, real haversine distances from the hotel rather than invented "15 min away" estimates. That's the kind of thing that actually helps on the ground.
- **Positive:** the personal tracking layer (visited / rating / notes) is the right feature for this use case.

## 10. Content presentation

- Restaurant and beach cards are information-dense in a good way — status, distance, price, verified flags all visible without a tap.
- The itinerary's timeline row layout reads well; the compact 64×64 row thumbnails are the right call.
- **Suggestion:** the `<details>` "מידע נוסף וטיפים" folds hide genuinely useful planning info (tips, equipment, "is it worth it") one tap deep on every card. On desktop, where there's room, these could default open.
- **Suggestion:** the tip/callout boxes use at least four visual treatments (`.premium-tip-box`, `.verified-info`, `bg-blue-50/50` details, amber badge rows). One callout component with `--info/--warn/--tip` variants would make the content scan faster.

---

# Fix plan

**Phase 1 — Critical + dark mode + map.** C1–C6, H1–H6, M7. Introduce the missing token pairs (`--gt-glass-*`, `--gt-scrim-*`, `-text` variants for primary/gold/olive), fix the fixed-dark surfaces, theme Leaflet completely, drive marker colours from tokens, fix wheel-zoom.

**Phase 2 — Mobile, desktop, accessibility.** M1–M6, M8, M9. FAB collision, touch targets, ARIA IDs, heading order, form labels, responsive map heights, desktop max-widths.

**Phase 3 — Consistency, performance, cleanup.** M10, L1–L4. De-duplicate CSS blocks, consolidate the map init functions, add image dimensions, define disabled states, remove dead tokens.

Each phase is re-verified with the same automated contrast/overflow/collision harness, and Phase 3 ends with a full re-run across all 15 tabs × 7 viewports × 2 themes.
