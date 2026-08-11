# Itinerary Deep-Content Upgrade — Audit & Plan

Audit date: 2026-08-11. Baseline: `main` @ `34375c7`.
Read-only audit; no source file was edited before this document existed.

---

## 1. What the itinerary is today

| Layer | File | Role |
| --- | --- | --- |
| Data | `js/itinerary-data.js` | `window.ITINERARY_DAYS` — 9 entries (7 numbered + 2 alt days). Single source of truth. |
| Annotation | `js/itinerary.js` | Fills dinner slots, price flags and closed-day warnings **onto the data** at load, before render. |
| Render | `js/itinerary-view.js` | Scrubber pills → context bar → area label → row-card list → detail sheet. |
| Style | `css/design-system.css` | `.gt-*` token-driven components. |

Per-day shape today: `key, dayNumber, isAlt, icon, titleTemplate, subtitleTemplate, image,
rainAlt, dayArea, transitions, items[], hint?, closingNoteHtml?`.
Per-item shape: `time, title, html` only.

### Measured content volume

| Day | Area | Items | Item HTML | Drive (from `transitions`) | Walk | Dinner hook |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Gouvia ↔ airport | 4 | 4,306 B | 18 min / 8 km | 10 min | Ladokolla |
| 2 | Corfu Town | 7 | 6,707 B | 47 min / 25 km | 18 min | Flisvos |
| 3 | NE coast | 5 | 4,479 B | 103 min / 69 km | 0 min | **none** |
| 4 | West | 6 | 5,120 B | 74 min / 45 km | 5 min | Vrachos |
| 5 | South | 5 | 3,859 B | **126 min / 73 km** | 3 min | Captain Octopus |
| 6 | NW | 5 | 3,821 B | 75 min / 62 km | 3 min | **none** |
| 7 | Gouvia ↔ airport | 4 | 4,289 B | 18 min / 8 km | 0 min | n/a |
| alt-paxos | South + sail | 3 | 2,827 B | 30 min / 18 km + boat | 0 min | none |
| alt-pantokrator | NE mountains | 3 | 2,569 B | 95 min / 51 km | 3 min | none |

---

## 2. Findings

### F1 — The rain plan is written, promised, and invisible. (highest value)

`js/itinerary-data.js` carries a real, fact-checked `rainAlt` for **7 of 9 days**.
The itinerary intro in `index.html:1512` promises it in bold:

> "והכי חשוב - **תוכנית גיבוי מפורטת לכל יום למקרה של גשם או מזג אוויר סוער**"

`grep` for every consumer of that field (`js/itinerary.js:254`) shows its **only** use is as
plain text fed to the map-matching keyword scan. It is rendered nowhere. The same is true of
`day.image` (7 days) and `day.closingNoteHtml` (1 day) — stored, never displayed.

The requested "weather alternatives" feature is therefore ~70% already written. It needs
**surfacing, not authoring**.

### F2 — Routing is already near-optimal. No changes proposed.

The brief asks for backtracking to be removed. Measured first, straight-line km from the
Gouvia base, current stop order vs. alternatives:

| Day | As planned | Best alternative tried | Verdict |
| --- | --- | --- | --- |
| 3 | 36.1 km | — | optimal (monotonic north) |
| 4 | 29.3 km | 33.0 km (sunset beach last) | **current is better by 3.7 km** |
| 5 | 54.8 km | 54.8 km (east side first) | identical; current returns north closer |
| 6 | 46.0 km | — | optimal (monotonic west) |

The trip is hub-and-spoke from one fixed hotel in Gouvia, so day *order* cannot change total
driving at all — only intra-day stop order can, and that is already tight. **No routing
changes.** Day 5 is the long day (126 min) because the south genuinely is far, not because
the route doubles back.

### F3 — Days have no identity; items are already rich.

Every *item* carries cost, recommended duration, atmosphere and usually a tip box. Every
*day* carries a title, a subtitle and a one-line area label — nothing else. There is no
theme, pace, total time, must-do vs. optional split, or summary. **This is the real gap**,
and it is a day-level gap, not an item-level one.

### F4 — Two days have a dinner hole, and the dataset can fill both.

Day 3 ends in Kassiopi at 19:30 with a 45-min drive home and **no dinner item at all**.
Day 6's dinner item is an apology: *"⚠️ לא מצאנו המלצת ארוחת ערב ספציפית לפינה הצפון-מערבית הזו"*.

That apology is now stale. Searching `CORFU_LOCATIONS.food` by distance:

| Gap | Nearest verified venue | Distance | Hours | Rating | Verified |
| --- | --- | --- | --- | --- | --- |
| Day 3 (Kassiopi) | `food-טרילוגיה` (Trilogia Plous) | 0.2 km from the day's last stop | 12:00–23:00 | ★4.5 (594) | 2026-07-30 |
| Day 6 (Sidari) | `food-גיאלוס` (Gialos Seafood) | 3.1 km | 18:00–23:00 | ★4.8 (827) | 2026-07-30 |

Both fit the day's timing. Gialos is closed Tuesdays; Day 6 is **Monday 07/09**, so it is
open — and the existing `checkDayVenueWarnings()` would flag it automatically if the dates
ever moved. No invention required: both are existing records with a `verifiedOn` stamp.

### F5 — Per-stop parking cannot be sourced from the dataset.

`parking` is `"Unknown"` on **144 of 169** records (85%); `bestTime` is `"Anytime"` on 100;
`beachType` is null on 141. The brief says parking details must not be invented — so per-stop
parking claims are **out of scope**. What *does* exist is real and stays: 6 researched parking
notes inside `transitions[].parking`, plus parking tips already written into item tip boxes
(e.g. Spianada, ~€3/hr). Those surface as-is.

### F6 — Weakest days, ranked.

Ranked by structural gaps, not by byte count. **Day 1 and Day 7 are deliberately thin and
will stay thin** — padding an arrival and a departure day would make the guide worse.

| Rank | Day | Why weak |
| --- | --- | --- |
| 1 | **6** | Thinnest real day (3,821 B); dinner is an apology; sunset-critical timing with no guidance on when to leave. |
| 2 | **5** | Heaviest driving (126 min) with the *second*-thinnest content; unexplained 2.5-hour gap 16:30→19:00. |
| 3 | **3** | 103 min driving, no dinner, ends far from base at 19:30. |
| 4 | **alt-pantokrator** | 3 items; the 14:00–16:30 item is titled "ארוחת ערב" (dinner) at 2pm — internally inconsistent. |
| 5 | **alt-paxos** | 3 items; ends 16:30 with no return-leg or evening guidance. |
| 6 | **4** | Solid; needs day-level framing only. |
| 7 | **2** | Richest day (6,707 B). Framing only. |
| 8 | **1 / 7** | Correctly minimal. Framing only — no new stops. |

---

## 3. Plan

### Principle

Add **one new day-level field**, `dayBrief`, to each entry in `js/itinerary-data.js`.
Nothing existing is removed or rewritten. Every number that can be computed is computed from
the existing `transitions` data at render time, so totals can never drift from the legs
they're derived from.

### Fact policy

Three visually distinct tiers, so nothing reads as more certain than it is:

1. **Verified** — from `CORFU_LOCATIONS` `verifiedHours` / `verifiedRating` / `verifiedOn`,
   surfaced through the existing dinner-hook and price-flag mechanisms. Carries its stamp.
2. **Computed** — drive/walk totals, day span, day weekday. Derived from `transitions` +
   `TRIP_CONFIG`, never hand-typed.
3. **Judgment** — pace, must-do vs. optional, what to skip, best moment, tired-day cut.
   Rendered under an explicit "המלצה שלנו" (our recommendation) treatment, never as fact.

No new external factual claims. No invented parking, prices, hours, or businesses.

### `dayBrief` schema

```js
dayBrief: {
  theme:      'string',            // one-line identity
  overview:   'html',              // one paragraph: why this day exists
  pace:       'relaxed|balanced|active',
  bestFor:    ['beach','nature',...],
  startTime:  '08:00',             // recommended departure
  mustDo:     [{ title, why }],    // 1-3 items that define the day
  recommended:[{ title, why }],
  optional:   [{ title, why }],
  ifTired:    'html',              // how to shorten
  ifEnergy:   'html',              // what to add
  skipFirst:  'string',            // lowest-priority stop, named
  weather:    { sun, cloud },      // rain reuses the existing day.rainAlt
  highlights: ['a','b','c'],
  bestMoment: 'string'
}
```

Totals (`drive`, `walk`, `span`, `intensity`) are **not** stored — computed by the renderer.

### UI

New collapsed-by-default blocks between the context bar and the row list, using existing
`.gt-*` tokens and native `<details>` for progressive disclosure (no new JS state, keyboard
and screen-reader correct for free, works in RTL):

1. **Day brief** (always open) — theme, pace chip, best-for chips, computed totals, overview.
2. **Must-do / recommended / optional** (open) — three short labelled groups.
3. *(existing row-card timeline stays exactly as-is)*
4. **Weather** (collapsed) — sun / cloud / **the existing `rainAlt`**.
5. **If tired / if energy** (collapsed).
6. **Day summary** (open) — highlights, computed totals, best moment.

Mobile-first: chips wrap, no horizontal scroll, `<details>` keeps the default view short.

### Order of work

1. Schema + renderer + CSS, proven on **Day 6** (the weakest day) end to end.
2. Then days 5, 3, 4, 2, alt-pantokrator, alt-paxos, 1, 7.
3. Fill the two dinner holes (F4) via the existing `data-dinner-food-id` mechanism.
4. Regression test: `scripts/test-itinerary-brief.js` — every day has a brief, computed
   totals match `transitions`, `rainAlt` is reachable, no `dayBrief` claims a venue that
   isn't in `CORFU_LOCATIONS`.
5. Bump `CACHE_NAME` once at the end.

### Explicitly not doing

- No routing changes (F2 — measured, current is optimal or tied).
- No per-stop parking claims (F5 — cannot be sourced).
- No padding of Day 1 / Day 7.
- No new dependencies, no build step.

---

## 4. What was built

All 9 days carry a `dayBrief`. Content volume is deliberately uneven — the
arrival and departure days stayed short, as planned:

| Day | Brief | Summary | Folds |
| --- | --- | --- | --- |
| 1 | 945 ch | 214 ch | 1 |
| 2 | 2,881 ch | 244 ch | 2 |
| 3 | 2,596 ch | 261 ch | 2 |
| 4 | 2,591 ch | 274 ch | 2 |
| 5 | 2,946 ch | 282 ch | 2 |
| 6 | 2,824 ch | 284 ch | 2 |
| 7 | 1,162 ch | 211 ch | 1 |
| alt-paxos | 2,160 ch | 230 ch | 2 |
| alt-pantokrator | 2,358 ch | 441 ch | 2 |

### Dead data revived

All three previously-unrendered fields now surface: `rainAlt` (7 days, in the
weather fold), `closingNoteHtml` (Pantokrator, in the day summary). `image`
remains unrendered — see the open item below.

### Content fixes the data itself proved were needed

1. **Day 6 dinner** — the "we found no recommendation" apology replaced with
   `food-גיאלוס`, verified 2026-07-30, via the existing dinner hook.
2. **Day 6 timing** — the timeline said leave at 19:30 while the stated reason
   to be there was a ~20:03 sunset. Dinner moved to 20:15.
3. **Day 3 dinner** — the day ended 45 min from the hotel with no dinner item;
   `food-טרילוגיה` added, 0.2 km from the last stop, so the new leg is a walk.
4. **Two stale connector legs** — Day 5's Chlomos→dinner and Day 6's
   Logas→dinner were 3-minute walks, correct only while "dinner" meant
   "wherever you already stand". Both are now drive legs whose distance is
   derived from the records' own coordinates scaled by that day's observed
   road/straight ratio, and labelled as derived in the source.

### Defects found during implementation

- **Bidi reversal (real, user-visible).** `08:00–19:00` rendered visually as
  `19:00–08:00` on every day: the en-dash is bidi-neutral, so an RTL page lays
  the halves out right-to-left. Caught on a screenshot, not in the DOM —
  `textContent` reads correctly either way. Fixed with per-value `dir="ltr"`,
  matching the convention `verifiedHours` already used, and verified by
  comparing the on-screen x-position of the first and last glyph runs. Guarded
  by three assertions.
- **Grid overflow at every phone width.** `.gt-day-stats` chose two 143px
  columns while the drive stat needed 178px. The track floor is now set from
  the widest value the renderer can actually produce (190px), with `flex-wrap`
  as a safety net.
- **Fold summary overflow.** The label was a bare text node in a flex row and
  could only shrink to its longest word. It now has its own span with
  `flex:1 1 0%`, plus a custom chevron replacing the suppressed native marker.
- **A test that failed for the wrong reason.** The call-site count matched the
  function declarations too. Fixed the assertion, then confirmed it genuinely
  fails by unwiring the alt-day branch and watching it report `found 1`.

### Verification

- `npm test` — 13 scripts, all pass. New: `scripts/test-itinerary-brief.js`,
  29 checks.
- Live sweep, 9 days × 2 themes × 3 widths (360/390/768): no page overflow, no
  inner overflow, no fold summary under the 44px touch floor, no page errors.
  Run twice to confirm stability after an initial measurement race.
- WCAG contrast, composited, all 20 new text selectors × 9 days × 2 themes:
  zero failures, worst 4.51:1 against a 4.5 requirement.
- `CACHE_NAME` bumped once, `v22` → `v23`.

### Still open (owner decisions, not code)

- **`day.image` is still unrendered** on 7 days. Surfacing it means adding a
  hero image to the day view — a visual-design decision, and two of the seven
  point at generic stock photography rather than the real place. Worth deciding
  deliberately rather than as a side effect of this pass.
- **Day 5's Achilleion block.** Its own `priceFlag` says the interior has been
  closed for renovation since 2021 and that reviews report €7 against a guide
  price of €12. The brief now surfaces this, but if the interior is still shut
  the 2.5-hour block is closer to a 1-hour one — worth confirming before the
  trip, and it would free up a morning.
- **`alt-paxos` boat legs carry no duration.** The connector falls back to a
  label, so nothing is broken, but the sailing time is genuinely unknown and
  varies by operator.
