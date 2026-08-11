# Pass 2 — Itinerary Content Audit

Date: 2026-08-11. Baseline: `main` @ `1702f57`. **Audit only — nothing edited.**

---

## 1. Trip facts found in code

From `TRIP_CONFIG` (`js/dashboard.js:12`), not assumed:

| Fact | Value |
| --- | --- |
| Outbound | TLV→CFU, dep **02/09/2026 15:40**, lands **18:15** (+03:00) |
| Return | CFU→TLV, dep **08/09/2026 13:10**, lands 15:35 |
| Trip span | 02/09 → 08/09/2026, `totalDays: 7` |
| Timezone | `Europe/Athens` (EEST, UTC+3 all week) |
| Base | Gouvia — every day is hub-and-spoke from one hotel |
| Car | Rental; details deliberately private (`js/trip-private.js`) |
| Daylight | Computed by `js/solar.js`: sunrise 07:09→07:15, sunset 20:11→20:02 |

**Answers you gave** (not in code): driving/heat tolerable *but "vacation mode"*; keep the
beach/town balance as-is; **you don't eat fish or seafood**; nothing booked yet.

---

## 2. Previous pass — what it solved, what it didn't (10 lines)

1. Killed 192 min of unrunnable schedule; **0 impossible transitions remain** (re-measured).
2. Replaced hard clock ranges with soft anchors on all five touring days.
3. Relabelled tiers away from "חובה" (mandatory) → heart / already-nearby / if-you-feel-like-it.
4. Reduced every day to exactly **one** anchor; demoted 7 places without deleting any.
5. Added `ifTired` to all 9 days and a take-your-time note to all 9.
6. Surfaced `rainAlt` (7 days) and `closingNoteHtml`, previously rendered nowhere.
7. Added computed, date-specific sunrise/sunset; retired two "rough estimate" captions.
8. **Still broken:** a third estimate caption survived, and it contradicts `solar.js`.
9. **Never addressed:** the food layer. Every pass treated restaurants as fixed furniture.
10. **Never addressed:** the week has no genuine low-drive rest day between arrival and departure.

---

## 3. Measurement table

Driving/times from the repo's own `gtDayComputedTotals()`, run in a real browser — not eyeballed.

| Day | Drive | km | ⭐ | 💡 | 🌿 | Hard times | First item | `ifTired` | `rainAlt` | Free time |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 18m | 8 | 1 | 1 | 0 | 3 | 18:15 | ✓ | ✗ | ✓ |
| 2 | 47m | 25 | 1 | 3 | 1 | 0 | 08:30 | ✓ | ✓ | ✓ |
| 3 | 103m | 69 | 1 | 3 | 1 | 0 | 08:45 | ✓ | ✓ | ✓ |
| 4 | 74m | 45 | 1 | 3 | 1 | 0 | 07:30 | ✓ | ✓ | ✓ |
| 5 | **145m** | 79 | 1 | 2 | 2 | 0 | 08:30 | ✓ | ✓ | ✓ |
| 6 | 83m | 66 | 1 | 2 | 1 | 0 | 08:45 | ✓ | ✓ | ✓ |
| 7 | 18m | 8 | 2 | 1 | 0 | 4 | 07:45 | ✓ | ✗ | ✗ |
| alt-paxos | 30m | 18 | 2 | 1 | 0 | 2 | 08:00 | ✓ | ✓ | ✓ |
| alt-pantokrator | 95m | 51 | 2 | 1 | 0 | 2 | 09:00 | ✓ | ✓ | ✓ |

**Measurement caveat worth stating:** the "departure" column is the *first item*, which on days
2/3/5/6 is an unhurried hotel breakfast. Real departure is 10:00–10:15. No day leaves before
09:30 without cause; Day 4's 07:30 carries its reason in the data ("והפעם יש סיבה" — monastery
before the coaches, calm water for the boat).

---

## 4. Week-level distribution

- Drive sequence d1→d7: **18 → 47 → 103 → 74 → 145 → 83 → 18**.
- Days over 150 min: **none** (Day 5 at 145 is closest).
- Anchors: exactly 1 on every touring day — at the **floor** of §12's "1–2", not above it.
- Hard clock times: 11 total, all on days 1/7/alt — none on the five touring days.
- Solar: 1 hardcoded value in content (see P0). Otherwise `solar.js` is sole source.

**Tripwires crossed: 2** — Day 5 approaches the driving limit but does not cross; the real
crossings are the week-shape rule and the solar rule.

---

## 5. Findings (deduplicated across the three lenses)

`day | problem | evidence | proposed change | confidence`

### P0 — factually wrong

**1. Day 3 | A hardcoded sunset that contradicts `solar.js` | HIGH**
`items[4]` (Kassiopi) reads *"שקיעה בסביבות **20:06** ב-4.9, הערכה משוערת - ראו הערה בראש פרק
המסלול*"*. `solar.js` computes **20:08** for 04/09. Three faults at once: it duplicates the single
source of truth (§7), it disagrees with it by 2 minutes (§9), and it calls itself an estimate while
the exact value renders at the top of the same day. The footnote it points to no longer describes
anything. → **Delete the parenthetical.** The sunset time is already on screen. Confidence: HIGH
(both values machine-checked).

### P1 — materially degrades the day

**2. All week | The food layer assumes a fish eater | HIGH**
You don't eat seafood. Measured: **4 of 7 meals are seafood-led**, and one is a Day 3 **anchor**.

| Day | Meal | Tier | Issue |
| --- | --- | --- | --- |
| 3 | Agni Bay | **⭐ anchor** | Titled "🦞 seafood lunch"; the day's defining experience |
| 4 | Vrachos | dinner hook | Harbour taverna — menu unknown, `VERIFY` |
| 5 | Boukari | 💡 + hook | Titled "ארוחת דגים"; hook is literally **Captain Octopus** |
| 6 | Gialos | dinner hook | Record name is "Gialos **Seafood**" |

→ Reframe rather than relocate. Agni Bay stays an anchor — the anchor is *a long lunch at the
waterline*, not the fish; retitle away from 🦞/דגים. Day 5 likewise. Days 4/6 need either a
verified alternative or an honest line saying it's a seafood house. Confidence: HIGH on the
diagnosis, LOW on any specific replacement (see §8).

**3. Day 5 | The evening rests on the dataset's weakest record | HIGH**
`food-קפטן-אוקטופוס` is the **only** food record in use with no `verifiedHours`, no
`verifiedRating`, no `verifiedOn` — every sibling was verified 2026-07-30. It is also explicitly an
octopus restaurant. It closes the day you rebuilt around one long meal. → Replace or demote.
Confidence: HIGH.

**4. Week shape | No genuine rest day between arrival and departure | MEDIUM**
Touring days 2–6 drive 47/103/74/145/83 — **none under 45 min**. The two sub-45 days are the
arrival evening and the departure morning, which are structurally low-drive, not restful. Day 4
(07:30 start, boat) sits immediately before Day 5 (145 min, the longest). → Either accept
deliberately, or soften Day 5 further so the pair reads as one big day and one slow one.
Confidence: MEDIUM — this is a judgment about feel, not a fact.

### P2 — polish

**5. alt-pantokrator | Two hard clock ranges with no constraint | MEDIUM**
`09:00-11:30` (mountain drive) and `12:00-14:00` (a ruined village) have no opening hour, boat or
booking behind them — §5 says prefer natural language. → Soften to anchors, as days 2–6 already
are. Confidence: MEDIUM.

**6. Day 7 | Breakfast as a hard range | LOW**
`07:45-08:30` is a consequence of the real 09:00 car return, not a constraint itself. Defensible as
is. → Optional softening. Confidence: LOW.

---

## 6. Per-day before → after

| Day | Before | After (if approved) |
| --- | --- | --- |
| 1 | unchanged | unchanged |
| 2 | unchanged | unchanged |
| 3 | Anchor = "🦞 seafood lunch, Agni"; stale 20:06 caption | Anchor = long waterside lunch; caption deleted (**P0**) |
| 4 | Dinner hook Vrachos, menu unknown | Unchanged pending `VERIFY` |
| 5 | "🍽️ long fish meal"; hook = Captain Octopus | Retitled; hook replaced or demoted |
| 6 | Dinner hook Gialos Seafood | Kept, with an honest "this is a seafood house" line |
| 7 | unchanged | unchanged (or P2 softening) |
| alt-paxos | unchanged | unchanged |
| alt-pantokrator | 2 hard ranges | Soft anchors (**P2**) |

---

## 7. VERIFY — never to enter content as fact

The food records carry **no menu text at all** (checked: `desc` empty on every one). Nothing below
can be asserted from the data:

| Item | What needs checking | Suggested source |
| --- | --- | --- |
| Agni Bay tavernas | Do they serve substantial non-seafood mains? | Menu photos / phone |
| `food-ורכוס` (Vrachos) | Menu; also **the ID resolves to no record** under that name | Dataset + venue |
| `food-קלימטריה` (★4.7, verified) | Non-seafood mains? Nearest strong South alternative | Menu / phone |
| `food-הבית-הלבן` (★4.3, verified, Kalami — already on Day 3) | Menu | Menu / phone |
| Sidari (Day 6) | Any verified non-seafood taverna at all? Dataset shows none | Local search |
| `food-קפטן-אוקטופוס` | Hours, rating — wholly unverified | Google / phone |

---

## 8. Files that would change

- `js/itinerary-data.js` — content fields only (titles, prose, dinner-hook IDs). In scope per §3.
- `scripts/test-itinerary-brief.js` — **needs your approval.** The existing solar guard scans
  `dayBrief` prose only, which is exactly why the Day 3 caption survived. Extending it to item HTML
  is a test-file change, not content. I have not done it.

No CSS, layout, component, renderer, schema or `index.html` change is required for anything above.

---

## 9. Disagreements with the brief

1. **The week-shape tripwire flatters the week.** "Fewer than 2 days under 45 min" counts arrival
   and departure days, which are low-drive by construction. Measured over touring days only, the
   week has **zero** rest days. I've reported it as crossed (P1) rather than passing on a
   technicality — flagging because it's the opposite reading to a literal one.
2. **§12 says 1–2 anchors; every day has exactly 1.** Given §0's warning about hollowing out, the
   risk here is not too many anchors but too few. I am *not* proposing additions — only noting the
   week sits at the floor, so further relaxation should be resisted.
3. **The most valuable finding this pass came from you, not the code.** Nothing measurable flagged
   the food problem; it needed the preference question. Worth remembering next pass.

---

## 10. Recommendation

**P0 is one deletion.** P1 item 2 is the substantive work and is mostly retitling — the *places*
stay, the fish framing goes. P1 item 3 needs one dataset decision. P1 item 4 is a judgment call for
you. P2 is optional.

If you'd rather not chase menus, the honest minimum is **P0 + retitling Days 3 and 5 away from
fish**, leaving venue choice to you on the ground. That alone removes the "anchor you can't eat"
problem without asserting anything unverified.

**Awaiting approval. No content file has been touched.**
