# Relaxed-But-Rich Rework — Per-Day Review

Date: 2026-08-11. Baseline: `main` @ `2a0cce8`.
Design, CSS and visual language untouched. All work is content, plus three label
strings in the renderer (see §0).

---

## 0. The finding that reframed the brief

The premise was that too many places feel like required stops. That is true, but
it is the *second* cause. The first is arithmetic:

> **192 minutes of driving and walking were not in the timeline at all**, across
> 7 of 9 days.

Every stop had a hard clock range, and consecutive ranges were chained with zero
gap while a real drive sat between them. Day 5 scheduled Achilleion to end at
11:30 and Issos to begin at 11:30, with a 30-minute drive between. Day 3 lost 40
minutes the same way; Day 2, 42.

That is why it felt like a race. Not stop count — most days had only 3–5 stops at
2–3 hours each, which is generous. The clock was lying, so the traveller is
behind from the first transition and every block eats the next one.

Two consequences for the rework:

1. **Hard clock ranges are gone** except where reality imposes them (a flight, a
   boat, a car return, a sunset). Everything else is a soft anchor — `10:15 בערך`
   ("around 10:15") — which is honest about being a suggestion.
2. **Anchors are now spaced to clear their own legs**, with slack. Remaining
   debt: 49 min, all on days 1/7/alt-pantokrator, and all cases where the travel
   is *inside* the item itself (`"check out, drive to airport, return the car"`)
   rather than a real gap. Those are a data-modelling artifact, not a schedule
   error, and were left alone.

### The one renderer change

The three priority tiers were relabelled. No CSS, no layout, no new component —
three strings:

| Before | After |
| --- | --- |
| ⭐ חובה (*mandatory*) | ⭐ הלב של היום (*the heart of the day*) |
| 👍 מומלץ (*recommended*) | 💡 אם אתם כבר באזור (*if you're already in the area*) |
| ➕ אופציונלי (*optional*) | 🌿 אם בא לכם (*if you feel like it*) |

"חובה" was the single strongest source of the checklist feeling. Leaving it while
rewriting everything around it would have undone the work.

### Take-your-time, without new UI

Every day now carries a `closingNoteHtml` — an existing field with an existing
quiet style at the foot of the day summary, previously used by exactly one day.
It gives explicit permission to ignore the plan. No component was added.

---

## 1. Trip-level rhythm

| Day | Was | Now | Heart / area / feel-like-it |
| --- | --- | --- | --- |
| 1 arrival | logistics | logistics | 1 / 1 / – |
| 2 Corfu Town | 2 must, 08:00 | walkable, 08:30 | 1 / 3 / 1 |
| 3 NE coast | 1 must, 08:00 | slow coast, 08:45 | 1 / 3 / 1 |
| 4 Paleokastritsa | 2 must, 07:30 | adventure, 07:30 *(justified)* | 1 / 3 / 1 |
| 5 South | 2 must, 08:00, 138 min drive | **one place**, 08:30 | 1 / 2 / 2 |
| 6 NW sunset | 2 must, 08:30 | sunset-anchored, 08:45 | 1 / 2 / 1 |
| 7 departure | logistics | logistics | 2 / 1 / – |

Every day now has **exactly one** thing worth planning around. Nothing was
deleted — the demoted entries moved tier and kept their descriptions.

Rhythm: arrive → town walk → slow coast → **adventure** → **very slow** →
sunset → depart. The two heaviest days (4 and 5) remain adjacent because the
hotel is fixed and the geography cannot be reordered; Day 5 was therefore
rebuilt as the most relaxed day of the trip to absorb the impact.

---

## 2. Per-day

### Day 2 — Corfu Town

**Current problem.** Six blocks chained with zero gaps while 42 min of walking
and driving sat between them. Two "mandatory" stops. 08:00 start for a city that
does not open early.

**Heart.** The Campiello — the Venetian quarter, where the walking *is* the
thing.

**Already in the area.** Old Fortress (demoted from mandatory), Liston coffee,
Kanoni.
**If you feel like it.** St Spyridon.
**Free time.** Lunch is now open-ended (`15:15 ואילך`) rather than a 90-minute slot.

**Start 08:30** — no earlier reason exists. One parking stop, then everything on foot.

**Moved mandatory → optional:** Old Fortress.
**Vacation feel: 8/10.**

### Day 3 — North-east coast

**Current problem.** 40 min of unaccounted driving; four 2.5-hour blocks back to
back, which reads as a schedule despite being the least demanding day.

**Heart.** A long lunch at Agni Bay, plus the morning swim at Barbati.
**Already in the area.** Kassiopi, Old Fortress-style wandering, the sea taxi.
**If you feel like it.** Kalami.
**Free time.** Agni is now `14:30 ואילך` — open-ended by design.

**Start 08:45.** No constraint; the bays are better late morning anyway.

**Moved mandatory → optional:** Kalami (to *if you feel like it*).
**Vacation feel: 9/10.**

### Day 4 — Paleokastritsa

**Current problem.** The only genuinely full day, and the one place the early
start was right — but it was never explained, so it read as arbitrary.

**Heart.** The self-skippered boat to the hidden coves. Nothing else on this day
comes close, and it is the one thing that cannot be improvised later.

**Already in the area.** The monastery (demoted from mandatory — it is on the way
and only quiet early), Angelokastro, Rovinia sunset.
**If you feel like it.** Lakones viewpoint.
**Free time.** Lunch open-ended from `14:15`; both afternoon stops are droppable.

**Start 07:30 — kept, and now justified in the title itself** ("and this time
there's a reason"): the monastery is quiet only before the coach tours, and the
boat wants the calm morning water.

**Moved mandatory → optional:** Paleokastritsa Monastery.
**Vacation feel: 7/10** — deliberately the busiest day of the week.

### Day 5 — The south *(rebuilt)*

**Current problem.** The worst day in the trip. 138 min driving, 53 min of
impossible transitions, and — the real tell — **two fish meals in the same
village 4.5 hours apart**, because a "lunch" block and a "dinner" block had both
been scheduled into Boukari.

**Heart.** The Issos dunes and Lake Korission. One place, open-ended.
**Already in the area.** Achilleion gardens (on the road south), the long Boukari meal.
**If you feel like it.** Chlomos, a swim at Halikounas.

**Free time.** This is now the point of the day. The dunes have no end time and
the text says so explicitly.

**Start 08:30**, departing ~09:30. Nothing here opens or closes.

**Changes:**
- The two Boukari meals merged into **one long meal** from `17:00 ואילך`.
- Stop order changed to Issos → Chlomos → Boukari, so Chlomos becomes a genuine
  pass-by rather than a scheduled detour after lunch. **Costs 2.1 km / ~4 min**,
  measured — accepted for the pacing gain.
- Achilleion demoted, and its own `priceFlag` (interior closed for renovation
  since 2021) is now stated where it changes the decision, not buried.

**Moved mandatory → optional:** Achilleion, Chlomos.
**Vacation feel: 9/10** *(from 3)*.

### Day 6 — North-west

**Current problem.** Two mandatory stops before a sunset that is the actual
reason for the day.

**Heart.** Sunset over Logas.
**Already in the area.** Cape Drastis (demoted), Canal d'Amour.
**If you feel like it.** A swim at Sidari.
**Free time.** Everything before 17:00 is explicitly optional.

**Start 08:45.** The only hard time is sunset (~20:03); dinner moved to `20:30`
so it no longer collides with it.

**Moved mandatory → optional:** Cape Drastis.
**Vacation feel: 8/10.**

### Days 1 & 7 — arrival and departure

**Deliberately unchanged in structure.** Day 1 lands 18:15; Day 7 has a 09:00
car return against a 13:10 flight. Both got a take-your-time note and nothing
else. Padding these would make the guide worse.

**Vacation feel: 8/10 and 6/10** — a departure day cannot score higher, and
should not pretend to.

### Alt days

- **Paxos:** boat times stay exact (the operator sets them). Gaios became
  open-ended, `⭐ בלי לוח זמנים` ("no schedule").
- **Pantokrator:** a 14:00 meal titled "dinner" is now "a long meal". Its
  existing closing note already corrected the same confusion.

---

## 3. Everything moved from mandatory → optional

Nothing was deleted. Seven entries changed tier:

| Place | From | To |
| --- | --- | --- |
| Old Fortress (Palaio Frourio) | heart of Day 2 | already in the area |
| Paleokastritsa Monastery | heart of Day 4 | already in the area |
| Cape Drastis | heart of Day 6 | already in the area |
| Achilleion Palace | scheduled 2.5 h, Day 5 | already in the area, ~1 h |
| Chlomos | scheduled, Day 5 | if you feel like it |
| Kalami | scheduled, Day 3 | if you feel like it |
| Kassiopi | scheduled 3 h, Day 3 | already in the area |

---

## 4. Verification

- `npm test` — 13 scripts, all pass.
- Live sweep, 9 days × 2 themes × 3 widths: no overflow, no small touch targets,
  no page errors.
- Unaccounted travel time: **192 → 49 min**, remainder explained in §0.
- Departure times (first stop after breakfast) now 10:00–10:15 on Days 2/3/5/6.

### A regression this caused, and how it surfaced

Retitling stripped the Latin place names — `(Barbati)`, `(Cape Drastis)` — from
item titles. Those are not decoration: `js/itinerary.js` matches items to map
pins by scanning titles for venue-name variants, so the change silently unpinned
stops from the day map. `test-day-map-matching.js` caught two; auditing the rest
found **18 titles** affected. All Latin names restored.

---

## 5. Still open

- **Day 4 remains the one full day.** That is intentional, but if you want the
  week flatter, the boat could move to an alt-day slot and Day 4 become a
  beach-and-monastery day.
- **The 49 min of double-counted legs** on days 1/7/alt-pantokrator are a data
  shape question, not a pacing one: those legs describe travel already inside
  their own item. Removing them would change the connector display.
- **`alt-paxos` boat legs still carry no duration** — genuinely operator-dependent.
