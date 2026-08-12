# Destination Template Refactor — Phase 1 Report

Turns the Corfu guide into a reusable destination-template engine: same UI,
same design system, same interaction patterns — different destination data.
Phase 1 covers the core engine (map, explore, itinerary, state, storage,
PWA). The six editorial content tabs (About, Trip Planning, Health & Safety,
Language, Activities, FAQ) deliberately stay Corfu-only static HTML — see
"Phase 2" below for why and how.

## 1. Current architecture (before this refactor)

Static, no-build, Hebrew/RTL PWA. No bundler, no modules — every file is a
plain `<script defer>` tag mutating global scope, in an order that matters
(later files assume earlier ones already ran). Two shapes of content
existed side by side:

- **Data-driven** (~half the app by interaction surface): the Explore tab
  (beaches/food/attractions/gems cards) and the Itinerary tab (9-day
  scrubber) both already rendered from two large data files —
  `js/locations-data.js` (374KB, 169 places) and `js/itinerary-data.js`
  (113KB, 9 days) — via generic template functions in `js/explore.js` and
  `js/itinerary-view.js`. This half needed generalizing, not rebuilding.
- **Hand-authored HTML** (the other half): About, Trip Planning, Health &
  Safety, Language & Daily Life, Activities (14 write-ups), FAQ (51 Q&A
  pairs) — thousands of lines of Corfu prose directly in `index.html`, with
  no data layer at all. Out of scope for Phase 1 (see below).

## 2. What was tightly coupled to Corfu

- **Category taxonomy**: the literal array `['beaches','food','attractions','gems']`
  was hardcoded in ~8 separate spots across `js/map.js` and `js/explore.js`
  (color lookup, layer construction, tab mapping, default active-category
  lists), plus matching `--gt-cat-beach/food/attraction/gem` CSS custom
  properties. A destination with a different category set (museums, ski
  resorts, wineries) could not be added without editing this code.
- **Geography constants**: map center/bounds/zoom and the hotel-pin
  coordinate were `const` literals in `js/map.js`.
- **Trip identity**: `TRIP_CONFIG` (dates/airports) and `TRIP_TIMEZONE` were
  hardcoded in `js/dashboard.js` and consumed by ~14 other files as a bare
  global; `SOLAR_CORFU` (sun position), `DISTANCE_LOCATIONS`/`ROAD_DISTANCES`
  (a Corfu-specific driving-distance calculator, including a "mountainous
  coastal roads" 1.45 windiness fudge-factor), `PACKING_ITEMS`, and a
  hardcoded `TRIP_DAY_DATES` table were each their own hardcoded constant in
  `solar.js`/`tools.js`/`packing.js`/`location-shared.js`.
- **Storage**: all 9 `localStorage` keys (favorites, itinerary progress,
  notes/ratings, budget, day-swaps, packing, reservations, dashboard
  overrides, sync queue) were un-namespaced literal strings — two
  destinations sharing an origin would corrupt each other's saved state.
- **Backend**: the Supabase schema had no destination column; `day_number`
  was constrained `1-7`, guaranteeing collision across any two 7-day trips
  sharing a project.
- **Alt-day itinerary logic**: the Paxos/Pantokrator "swap an optional day
  in" feature hardcoded those two day keys and their Hebrew prose directly
  into `itinerary.js`/`itinerary-view.js`, and the day-pager assumed exactly
  7 numbered days.

## 3. Refactoring performed

1. **Destination data layer** (`js/destination-registry.js` +
   `data/destinations/{corfu,testdest}.js`): a thin envelope, not a copy —
   the two big data files stay physically untouched and are referenced, not
   retyped, avoiding any risk of content loss. `window.DESTINATION` is
   resolved once (query param → localStorage → default `corfu`) before
   every consumer runs.
2. **Category taxonomy generalized**: `map.js`/`explore.js` now iterate
   `window.DESTINATION.categories` (2-4+ entries) instead of a hardcoded
   4-item literal. CSS tokens renamed to positional slots (`--gt-cat-1..4`)
   so up to 4 categories need zero CSS changes.
3. **Every hardcoded destination constant** (map geography, solar
   coordinates, distance-tool data, packing defaults, trip dates/timezone,
   phone country code, alt-day scrubber labels/swap logic, the day-pager's
   "last day" cutoff) now reads from `window.DESTINATION`.
4. **Storage namespacing**: all 9 keys suffixed `:${destination.id}`, with a
   one-time migration shim so existing Corfu users' saved data survives the
   refactor instead of appearing to reset.
5. **Supabase**: `destination` column + composite unique constraints added
   to both tables (migration section provided, not applied to any live DB);
   `database.js` filters/writes by destination id.
6. **Service worker**: cache version bumped, new files precached.
7. **Second destination built**: `data/destinations/testdest.js` — a small,
   clearly-labeled placeholder destination with a *different* category
   taxonomy (museums/trails, not beaches/food/attractions/gems), different
   map region, different trip length (2 days vs 9), used as the acceptance
   test, not real content.

## 4. Destination data model

```js
window.DESTINATION = {
  id, name, nameEn, country, countryEn, countryCode, region,
  locale: { lang, dir }, timezone, phoneCountryCode,
  hero: { image, title, subtitle },
  map: { center:[lat,lon], bounds:[[lat,lon],[lat,lon]], defaultZoom, minZoom,
         homeBase: { name, lat, lon, mapsQuery } },
  categories: [ { key, tag, label, emoji, iconSvg, colorVar, facets:[{tag,label}] } ],
  locations: { [categoryKey]: [ {id, name, lat, lon, ...} ] },
  nameAliases: {...},
  itineraryDays: [ {key, dayNumber, isAlt, icon, titleTemplate|title, ...} ],
  tripConfig: { outboundDeparture, ..., totalDays, fromAirport, toAirport },
  solar: { lat, lon, name },
  distanceTool: { locations, roadDistances, windinessFactor, avgSpeedKmh },
  packingDefaults: { pretrip: [...], beach: [...] },
  editorial: { about: null, tripPlanning: null, healthSafety: null,
               language: null, activities: null, faq: null }  // Phase 2 slot
};
```

`window.DESTINATIONS.<id>` holds every registered destination;
`window.DESTINATION` is whichever one is active. Helpers `gtDestKey(base)`
and `gtMigrateLegacyKey(base)` (in `js/destination-registry.js`) namespace
and migrate storage keys.

## 5. Files changed

- **New**: `js/destination-registry.js`, `data/destinations/corfu.js`,
  `data/destinations/testdest.js`, `js/testdest-locations.js`,
  `js/testdest-itinerary.js`.
- **Generalized**: `js/map.js`, `js/explore.js`, `css/design-system.css`,
  `js/favorites.js`, `js/storage.js`, `js/itinerary.js`,
  `js/itinerary-view.js`, `js/itinerary-data.js` (additive only — two new
  optional fields on one existing day record), `js/sync.js`,
  `js/dashboard.js`, `js/packing.js`, `js/reservations.js`, `js/solar.js`,
  `js/tools.js`, `js/location-shared.js`, `js/init.js`.
- **Backend/infra**: `schema.sql`, `js/database.js`, `sw.js`.
- **Wiring**: `index.html` (script load order).
- **Tests**: `scripts/smoke-test.js`, `scripts/test-explore-facets.js`,
  `scripts/test-explore-map-sync.js`, `scripts/test-day-map-matching.js`,
  `scripts/test-favorites.js`, `scripts/test-escaping.js`,
  `scripts/test-itinerary-brief.js` — updated to load the new destination
  bootstrap chain and namespaced storage keys.
- **Untouched, as intended**: `js/locations-data.js`, the bulk of
  `js/itinerary-data.js`'s real content, and every static-HTML editorial
  section in `index.html`.

## 6. How to add a new destination (e.g. Mallorca)

1. Create `js/mallorca-locations.js` setting `window.MALLORCA_LOCATIONS`
   (same shape as `CORFU_LOCATIONS`: an object keyed by category, each an
   array of `{id, name, lat, lon, tags, image, ...}` records) and
   `js/mallorca-itinerary.js` setting `window.MALLORCA_ITINERARY_DAYS`
   (same shape as `ITINERARY_DAYS`).
2. Create `data/destinations/mallorca.js`:
   ```js
   window.DESTINATIONS.mallorca = {
       id: 'mallorca', name: 'מיורקה', nameEn: 'Mallorca',
       country: 'ספרד', countryEn: 'Spain', ...,
       map: { center: [...], bounds: [...], homeBase: {...} },
       categories: [ /* whatever categories fit Mallorca — beaches, hiking,
                        wineries, whatever the content actually has */ ],
       locations: window.MALLORCA_LOCATIONS,
       itineraryDays: window.MALLORCA_ITINERARY_DAYS,
       tripConfig: {...}, solar: {...}, distanceTool: {...},
       packingDefaults: {...}, editorial: { about: null, ... }
   };
   ```
3. Add the three new `<script>` tags to `index.html`, next to `testdest`'s.
4. Add the three new files to `sw.js`'s `APP_SHELL`.
5. Visit `?destination=mallorca` (or set it as the new default in
   `destination-registry.js`'s `DEFAULT_DESTINATION_ID`).

**No UI component file needs to change.** This is the direct answer to the
Phase 1 acceptance test: adding Mallorca is a new destination package, not a
UI/application-code change.

## 7. Remaining technical debt (Phase 1 scope)

- `js/explore.js`'s per-record display logic (`exploreDisplayName`,
  `exploreSecondaryMeta`, `exploreBodyHtml`, reserve-button gating) still
  branches on Corfu's specific record fields (`restHtml`, `bodyHtml`,
  `tipHtml`, `price`, `score`) — this is *content-shape* coupling living in
  `locations-data.js`'s own record format, not a taxonomy hardcode. It
  degrades gracefully (empty string, not a crash) for destinations without
  those fields, but a destination wanting richer per-category card layouts
  would need this generalized further.
- Per-tag badge CSS classes (`.gt-cat-${tag}-bg`) only have rules for
  Corfu's 4 tags — a destination with different tags (like testdest's
  `museum`/`trail`) gets an unstyled (colorless) badge. Low-visual-impact,
  documented, not fixed in Phase 1.
- `manifest.json` and `index.html`'s meta/OG/JSON-LD tags stay Corfu's —
  these are static files fetched before any JS runs, so per-destination
  values would require a build/server step, which is explicitly out of
  scope ("no build pipeline"). Destination switching today is a
  same-deployment, client-side feature (`?destination=`), not a way to spin
  up a separately-installable PWA per destination.
- The alt-day swap feature's closing-note prose generalizes only as far as
  the data allows — it works for any destination that defines a
  `closingNote` on an alt day, but a destination with a structurally
  different "optional day" concept would need its own logic, not just data.
- Supabase migration SQL is written but not applied to any live database —
  `SUPABASE_ENABLED` is off by default; someone with real credentials needs
  to run the migration section before this matters in practice.

## 8. Phase 2: migrating the editorial content tabs

These six sections are still Corfu-only static HTML in `index.html`. Unlike
Explore/Itinerary, there's no existing template to generalize — each needs
its own schema and renderer designed from scratch. Per-section assessment:

| Section | Current form | Proposed schema | Renderer difficulty | Recommendation |
|---|---|---|---|---|
| **FAQ** | 51 `<details>` Q&A pairs, already filterable via `js/faq-filters.js` (DOM-based, not data-driven) | `destination.editorial.faq: [{q, a, tags}]` | Low — nearly identical to the Explore-tab pattern already proven in Phase 1 (render a list from an array) | **Migrate first.** Most mechanical, most repetitive, best return for effort. |
| **Activities** | 14 hand-written write-ups with embedded Google Maps search links | `destination.editorial.activities: [{title, body: html, mapsQuery, image}]` | Low-medium — mostly a direct lift, `bodyHtml` can stay as authored HTML per activity (see note below) | Migrate second — same shape as a location record, reuses patterns from `locations-data.js`. |
| **Trip Planning** | One long section mixing several unrelated things: driving-times table, ferry info, budget/shopping tips, monthly weather table | Split into distinct pieces: `practicalInfo.drivingTimes: [{from,to,km,min}]`, `practicalInfo.arrival: {airport, ferries: [...]}`, `practicalInfo.weather: [{month, high, low, rainDays, note}]`, `practicalInfo.budgetTips: html` | Medium — the driving-times table already has a code twin in `distanceTool` from Phase 1 (worth unifying rather than maintaining two distance datasets) | Migrate, but plan it as several small typed schemas, not one blob — some pieces (tables) are genuinely structured data; the shopping/budget prose is not. |
| **About** | Hero banner + 4 "island character" region cards + intro paragraph | `destination.editorial.about: {intro: html, regions: [{name, description, highlights}]}` | Low-medium | Migrate — the region-card pattern is close to a location-record pattern already. |
| **Health & Safety** | Emergency numbers/hospital block (duplicated once in a modal) + prose sections | `destination.editorial.healthSafety: {emergencyNumbers: [{label,number}], hospital: {name,phone,address}, sections: [{title, body: html}]}` | Low for the structured emergency block (genuinely tabular data worth extracting even before full Phase 2, since it's duplicated twice today); medium for the prose | Migrate the emergency-contact block early regardless of the rest — it's real structured data, low effort, and fixes an existing duplication bug risk. |
| **Language & Daily Life** | Free-form prose: local phrases, customs, daily-life tips | `destination.editorial.language: {sections: [{title, body: html}]}` — or just `html: string` | Low to implement, but low value as structured data — this content has no meaningful sub-fields to query, filter, or reuse | **Keep as HTML/Markdown, not deeply-nested JS objects.** A single `{title, bodyHtml}[]` array (or even one big `bodyHtml` string) is honest about what this content actually is: an editorial essay, not queryable data. Forcing it into a rigid schema would only make it harder to write, for no runtime benefit. |

**General principle for Phase 2**: sections with real substructure the UI
would filter/sort/query on (FAQ tags, activity locations, driving-time
pairs, emergency contacts) are worth a typed schema. Sections that are just
long-form prose (Language & Daily Life, and the non-tabular parts of Trip
Planning/About) should stay as `{title, bodyHtml}` blocks — an HTML/Markdown
string per section, not hundreds of nested fields. That keeps a future
destination author writing prose in something close to Markdown, not
fighting a deeply nested JSON schema for content that was never structured
data in the first place. Each renderer, once built, is genuinely
destination-agnostic and small (a loop over an array), matching the pattern
Explore/Itinerary already proved in Phase 1.
