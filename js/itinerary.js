// Trip progress tracker: lets users mark each itinerary day as completed,
// persisted in localStorage so it survives page reloads.
const TRIP_PROGRESS_KEY = 'corfu-guide-trip-progress';
// Total day count now lives on TRIP_CONFIG (js/dashboard.js) - the single
// centralized source for every trip date/duration on the page.

function getCompletedDays() {
    try {
        const raw = localStorage.getItem(TRIP_PROGRESS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function saveCompletedDays(days) {
    try {
        localStorage.setItem(TRIP_PROGRESS_KEY, JSON.stringify(days));
    } catch (e) {
        console.warn('Could not save trip progress', e);
    }
}

function toggleDayComplete(checkboxEl) {
    const day = checkboxEl.getAttribute('data-day');
    let completed = getCompletedDays();
    if (checkboxEl.checked) {
        if (!completed.includes(day)) completed.push(day);
    } else {
        completed = completed.filter(d => d !== day);
    }
    saveCompletedDays(completed);
    updateTripProgressUI(completed);
    if (window.CorfuStorage) window.CorfuStorage.markDayDirty(day);
    // Push this change to Supabase in the background (Step 7) - never
    // blocks or reverts the local toggle above, even if it fails.
    if (typeof queueItineraryDaySync === 'function') queueItineraryDaySync(Number(day), checkboxEl.checked);
    // The old accordion's "auto-collapse a day shortly after marking it
    // complete" behavior lived here, keyed off checkboxEl.closest(
    // '.premium-day-header') - that markup (and toggleDayCard(), the
    // function it called) is gone; the new day-scrubber view
    // (js/itinerary-view.js) has no equivalent "collapsed" state to
    // auto-close.
}

function updateTripProgressUI(completed) {
    const count = completed.length;
    const pct = Math.round((count / TRIP_CONFIG.totalDays) * 100);
    const textEl = document.getElementById('trip-progress-text');
    const fillEl = document.getElementById('trip-progress-bar-fill');
    const trackEl = document.getElementById('trip-progress-bar-track');
    if (textEl) textEl.textContent = `${count} מתוך ${TRIP_CONFIG.totalDays} ימים הושלמו`;
    if (fillEl) fillEl.style.width = pct + '%';
    if (trackEl) trackEl.setAttribute('aria-valuenow', count);
}

function initTripProgress() {
    const completed = getCompletedDays();
    document.querySelectorAll('.day-complete-checkbox').forEach(cb => {
        if (completed.includes(cb.getAttribute('data-day'))) {
            cb.checked = true;
        }
    });
    updateTripProgressUI(completed);
    initDayBudgetInputs();
    applyDaySwapUI();
}

// --- Per-day "actual spent" tracker ---------------------------------------
// A lightweight companion to the day-complete checkbox above: how much was
// actually spent that day, in euros. Kept in its own localStorage key
// (rather than folded into TRIP_PROGRESS_KEY) because that key's existing
// shape is a flat array of completed day numbers, not an object keyed by
// day - reusing it here would mean changing its shape and touching the
// cloud-merge logic in storage.js that already depends on it staying an
// array. This is local-only, exactly like the rest of this file.
const DAY_BUDGET_KEY = 'corfu-guide-day-budget-actual';
// Shape: { [dayNumber]: number }

function getDayBudgetActuals() {
    try {
        const raw = localStorage.getItem(DAY_BUDGET_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) {
        return {};
    }
}

function saveDayBudgetActuals(map) {
    try {
        localStorage.setItem(DAY_BUDGET_KEY, JSON.stringify(map));
    } catch (e) {
        console.warn('Could not save day budget actuals', e);
    }
}

function updateDayBudgetActual(inputEl) {
    const day = inputEl.getAttribute('data-day');
    const raw = inputEl.value.trim();
    const map = getDayBudgetActuals();
    if (raw === '') {
        delete map[day];
    } else {
        const num = Number(raw);
        if (!Number.isFinite(num) || num < 0) return; // ignore garbage input, don't save it
        map[day] = num;
    }
    saveDayBudgetActuals(map);
    updateDayBudgetSummary(map);
}

function updateDayBudgetSummary(map) {
    const el = document.getElementById('day-budget-total');
    if (!el) return;
    const total = Object.values(map).reduce((sum, v) => sum + (Number(v) || 0), 0);
    el.textContent = total > 0 ? `💶 סה"כ הוצאות בפועל עד כה: €${total}` : '';
}

function initDayBudgetInputs() {
    const map = getDayBudgetActuals();
    document.querySelectorAll('.day-budget-input').forEach(input => {
        const day = input.getAttribute('data-day');
        if (map[day] != null) input.value = map[day];
    });
    updateDayBudgetSummary(map);
}

// The dashboard's "view full itinerary" CTA used to just switch tabs and
// dump the user at the top of a 7-day list. Now it selects, scrolls to,
// and briefly highlights the day that's actually relevant right now (or
// Day 1 before departure) - reusing the same select/scroll/highlight
// mechanics the new day-scrubber view (js/itinerary-view.js) and search
// results already use, instead of the old accordion's
// expand/scroll-to-card behavior (that markup - and toggleDayCard() as a
// way to reach a specific day - is gone; gtSelectItineraryDay() is the
// new equivalent).
function viewTodayInItinerary() {
    const dayNum = window._currentTripDayNum;
    switchTab('itinerary', true);
    if (!dayNum) {
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
    }
    setTimeout(() => {
        if (typeof gtSelectItineraryDay === 'function') gtSelectItineraryDay(String(dayNum));
        const target = document.getElementById('gt-itinerary-view');
        if (!target) {
            window.scrollTo({ top: 100, behavior: 'smooth' });
            return;
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.classList.add('search-highlight');
        setTimeout(() => target.classList.remove('search-highlight'), 2000);
    }, 150);
}

// Per-day map filtering (see js/map.js openDayMap): there is no explicit
// day -> location-id field anywhere in the data, so each day's stops are
// found by matching the place names actually written in that day's own
// itinerary text (#day-N-body) against window.CORFU_LOCATIONS' `name`
// field - the same source of truth the map/cards already use. This is
// re-derived from the live DOM/data every time the button is pressed
// (not a hand-typed id list), so it can't silently go stale if a location
// record's id or wording changes later.
//
// A location name is either a plain string ("קסיופי") or "Hebrew (English)"
// ("רוביניה (Rovinia)"); both halves are tried separately since itinerary
// text sometimes only uses one of the two languages for a given place.
// Anything 2 characters or shorter is skipped as too generic to trust
// (would false-positive on unrelated day text).
//
// Attraction (and some gem) titles additionally carry a leading list
// ordinal and a trailing decorative emoji, e.g.
// "10. המבצר הישן (Palaio Frourio) 🏰" - both are stripped before the
// "Hebrew (English)" split below runs, otherwise the split's end-anchor
// never matches (the string doesn't end with the closing paren, the emoji
// does) and the whole ordinal+emoji-laden string is kept as one unusable
// "variant" that never appears verbatim in any day's prose.
function extractLocationNameVariants(name) {
    if (!name) return [];
    let cleaned = name.trim();
    // Leading ordinal: "10. " -> ''
    cleaned = cleaned.replace(/^\d+\.\s*/, '');
    // Trailing decorative emoji (+ any variation-selector/ZWJ glue and the
    // whitespace before it). \p{Extended_Pictographic} covers the full
    // emoji range actually used in the data (🏰👑⛪🏖️🌅🫏🐠 etc.), not just a
    // narrow codepoint block, and never matches Hebrew/Latin letters or
    // parens so it can't eat part of a real name.
    cleaned = cleaned.replace(/[\s‍️\p{Extended_Pictographic}]+$/gu, '');

    const variants = [];
    // Not end-anchored anymore - the parenthetical just has to appear
    // somewhere in the cleaned string, which is now free of ordinal/emoji
    // noise on either side of it.
    const bilingual = cleaned.match(/^(.*?)\s*\(([^)]+)\)\s*(.*)$/);
    if (bilingual) {
        variants.push((bilingual[1] + ' ' + bilingual[3]).trim());
        variants.push(bilingual[2].trim());
    } else {
        variants.push(cleaned);
    }
    return variants.filter(v => v.length > 2);
}

// Plain text for one itinerary item's time badge + title + full HTML body,
// concatenated exactly the way the old #day-N-body's real DOM once read as
// plain text (time-badge span, then the content-col's h4 title + prose,
// all inside the same day body) - via a detached, never-inserted <div>
// rather than the live document, since js/itinerary-data.js's items are
// now the source of truth instead of that (deleted) DOM.
function gtItineraryItemFullText(item) {
    const el = document.createElement('div');
    el.innerHTML = `<span>${item.time}</span><span>${item.title}</span>${item.html}`;
    return el.textContent;
}

// Plain text for just an item's title + HTML body (no time badge) - what
// used to be a single .premium-content-col's own textContent, which is
// what checkDayVenueWarnings() below cross-checks per event.
function gtItineraryItemContentText(item) {
    const el = document.createElement('div');
    el.innerHTML = `<span>${item.title}</span>${item.html}`;
    return el.textContent;
}

// Returns every location (any category with map coordinates) whose name
// appears in day N's own itinerary text. Empty on days with no mappable
// stops (e.g. Day 1/7, arrival/departure logistics) - callers should fall
// back to the full-island view in that case rather than show nothing.
//
// Reads js/itinerary-data.js's window.ITINERARY_DAYS instead of the old
// #day-N-body DOM (deleted in this pass) - same output contract as
// before (verified by scripts/test-day-map-matching.js), just sourced
// from the data structure. Must run after fillItineraryDinnerHooks()/
// fillItineraryPriceFlags()/checkDayVenueWarnings() have already
// annotated each item's .html (dinner/price-flag text filled in, venue
// warnings appended) - exactly the ordering dashboard.js's initDashboard()
// already calls them in, so a day's mappable stops still include any
// venue only named inside a filled dinner slot or warning box, just like
// the old DOM-reading version did.
function getDayLocationMatches(dayNum) {
    const day = typeof findItineraryDay === 'function' ? findItineraryDay(dayNum) : null;
    const locations = window.CORFU_LOCATIONS;
    if (!day || !locations) return [];

    // Includes the day's rain-alternative paragraph (js/itinerary-data.js's
    // day.rainAlt) alongside its items - the old #day-N-body's textContent
    // this replaces included that <details> block too (a sibling of the
    // timeline, still inside the same body div), and at least one real
    // match (Day 4's rain-alt mention of Corfu Aquarium) depends on it -
    // see scripts/test-day-map-matching.js.
    const rainAltText = day.rainAlt ? gtItineraryItemFullText({ time: '', title: '', html: day.rainAlt }) : '';
    const dayText = day.items.map(gtItineraryItemFullText).join(' ') + ' ' + rainAltText;
    const matches = [];
    Object.keys(locations).forEach(category => {
        (locations[category] || []).forEach(loc => {
            if (loc.lat == null || loc.lon == null) return;
            const variants = extractLocationNameVariants(loc.name || loc.title);
            if (variants.some(v => dayText.includes(v))) {
                matches.push({ category, id: loc.id, lat: loc.lat, lon: loc.lon, name: loc.name || loc.title });
            }
        });
    });
    return matches;
}

// --- Itinerary price caveats, pulled live from CORFU_LOCATIONS -----------
// The itinerary prose used to hardcode its own price for a few attractions
// (Angelokastro "free entry", Old Fortress "~€6" twice, Achilleion "€7")
// that each already have a priceFlag/verifyNote-shaped caveat on their own
// CORFU_LOCATIONS record (see buildVerifiedInfoHTML in js/location-shared.js) - two
// numbers for the same venue that can silently drift apart. Placeholder
// elements carrying data-price-flag-id="<attraction id>" are filled in
// here with that record's own priceFlag/verifyNote text, so the itinerary
// can never assert a price that disagrees with the card.
function renderPriceFlagHTML(loc) {
    if (!loc) return '';
    const messages = [loc.priceFlag, loc.verifyNote].filter(Boolean);
    if (!messages.length) return '';
    return messages.map(m => `<p class="flex items-start gap-2"><span class="text-lg">⚠️</span> <span>${escapeHtml(m)}</span></p>`).join('');
}

// Annotates js/itinerary-data.js's window.ITINERARY_DAYS in place instead
// of querying the (deleted) live DOM: for every item whose .html still
// carries a data-price-flag-id placeholder, fills it from the matching
// CORFU_LOCATIONS record via a detached <div> (never inserted into the
// page), then writes the resulting HTML back onto item.html - so
// js/itinerary-view.js's render path always reads already-resolved
// content, the same way it read already-filled DOM before. item.hasPriceFlag
// records whether a real caveat ended up shown, for the row-card badge
// (previously a `[data-price-flag-id]` DOM presence check).
function fillItineraryPriceFlags() {
    (window.ITINERARY_DAYS || []).forEach(day => {
        day.items.forEach(item => {
            if (item.html.indexOf('data-price-flag-id') === -1) return;
            const container = document.createElement('div');
            container.innerHTML = item.html;
            let hasPriceFlag = false;
            container.querySelectorAll('[data-price-flag-id]').forEach(el => {
                const id = el.getAttribute('data-price-flag-id');
                const html = renderPriceFlagHTML(findLocationById(id));
                if (html) { el.innerHTML = html; hasPriceFlag = true; }
                else el.remove(); // no caveat on the record - nothing to show
            });
            item.html = container.innerHTML;
            item.hasPriceFlag = hasPriceFlag;
        });
    });
}

// --- Dinner-slot recommendations, pulled live from CORFU_LOCATIONS --------
// Several days used to end with no dinner slot at all (or, on Day 1, a
// slot naming no actual venue). Rather than hand-typing a venue's name/
// hours/phone into the itinerary prose - where it can silently drift from
// that venue's own card - each dinner slot below is a placeholder element
// carrying data-dinner-food-id="<food record id>", filled in here from the
// live record on load. Mirrors fillTripPrivateHooks() in js/dashboard.js:
// same "hook element + fill function" shape, just sourced from
// CORFU_LOCATIONS instead of window.TRIP_PRIVATE.
function findLocationById(id) {
    if (!window.CORFU_LOCATIONS || !id) return null;
    for (const category of Object.keys(window.CORFU_LOCATIONS)) {
        const found = (window.CORFU_LOCATIONS[category] || []).find(loc => loc.id === id);
        if (found) return found;
    }
    return null;
}

// +302661039649 -> +30 2661 039649 (mirrors formatPhone() in js/location-shared.js, a
// tiny formatting helper that isn't worth exposing globally just for this).
function formatDinnerPhone(dial) {
    const m = /^\+30(\d{4})(\d{6})$/.exec(dial);
    return m ? `+30 ${m[1]} ${m[2]}` : dial;
}

function renderDinnerSlotHTML(food) {
    if (!food) {
        return '<p>⚠️ לא נמצא רשומת מסעדה תואמת - בדקו את פרק הקולינריה.</p>';
    }
    const name = escapeHtml(food.name || food.title || '');
    const subtitle = food.subtitle ? ` <span class="text-gray-400 font-normal">(${escapeHtml(food.subtitle)})</span>` : '';
    const rows = [];

    rows.push(food.verifiedHours
        ? `<li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">🕒</span><span><strong class="font-semibold text-gray-900">שעות מאומתות:</strong> <span dir="ltr">${escapeHtml(food.verifiedHours)}</span></span></li>`
        : `<li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">🕒</span><span>⚠️ שעות לא מאומתות - מומלץ לבדוק לפני ההגעה</span></li>`);

    if (food.phone) {
        const dial = String(food.phone).replace(/[^\d+]/g, '');
        rows.push(`<li class="flex items-center gap-2"><span class="text-emerald-600 shrink-0">📞</span><a href="tel:${escapeAttr(dial)}" class="verified-tel" dir="ltr">${escapeHtml(formatDinnerPhone(dial))}</a></li>`);
    }
    if (food.price) {
        rows.push(`<li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">רמת מחירים:</strong> ${escapeHtml(food.price)}</span></li>`);
    }
    if (food.mapsUrl) {
        rows.push(`<li class="flex items-center gap-2"><span class="text-teal-600 shrink-0">📍</span><a href="${escapeAttr(food.mapsUrl)}" class="text-blue-600 hover:text-blue-800 font-medium underline">ניווט במפה</a></li>`);
    }

    return `<p>ארוחת ערב מומלצת: <strong>${name}</strong>${subtitle}.</p><ul class="space-y-1.5 text-sm mt-3">${rows.join('')}</ul>`;
}

// Same data-annotation approach as fillItineraryPriceFlags() above: fills
// each item's data-dinner-food-id placeholder via a detached <div>, then
// writes the result back onto item.html.
function fillItineraryDinnerHooks() {
    (window.ITINERARY_DAYS || []).forEach(day => {
        day.items.forEach(item => {
            if (item.html.indexOf('data-dinner-food-id') === -1) return;
            const container = document.createElement('div');
            container.innerHTML = item.html;
            container.querySelectorAll('[data-dinner-food-id]').forEach(el => {
                const id = el.getAttribute('data-dinner-food-id');
                el.innerHTML = renderDinnerSlotHTML(findLocationById(id));
            });
            item.html = container.innerHTML;
        });
    });
}

// --- Day-N closedDays/verifiedHours cross-check ---------------------------
// Reuses extractLocationNameVariants() (above) but scoped to a single
// .premium-timeline-item rather than a whole day's text, so a warning can
// be attached to the specific event block a venue is scheduled in - not
// just dumped in a generic day-level banner. Runs once on load (see
// window.checkDayVenueWarnings() call in js/init.js) and is safe to call
// again (guarded by data-venue-warning-id so it never double-inserts).
const WEEKDAY_CODE_FROM_SHORT = { Sun: 'SU', Mon: 'MO', Tue: 'TU', Wed: 'WE', Thu: 'TH', Fri: 'FR', Sat: 'SA' };
const HE_WEEKDAY_NAME_FROM_CODE = { SU: 'ראשון', MO: 'שני', TU: 'שלישי', WE: 'רביעי', TH: 'חמישי', FR: 'שישי', SA: 'שבת' };

// Day N's real weekday code (SU/MO/.../SA), derived from the same
// TRIP_CONFIG.startDay the dashboard's date injection uses (js/dashboard.js)
// - not a second hand-typed calendar that could disagree with it.
function getDayWeekdayCode(dayNum) {
    const date = new Date(TRIP_CONFIG.startDay.getTime() + (dayNum - 1) * 86400000);
    const short = new Intl.DateTimeFormat('en-US', { timeZone: TRIP_TIMEZONE, weekday: 'short' }).format(date);
    return WEEKDAY_CODE_FROM_SHORT[short] || null;
}

// "10:00 - 17:30" / "10:00-17:30" -> {start: 600, end: 1050} (minutes past
// midnight). Only the first HH:MM-HH:MM range in the string is used, so a
// verifiedHours value with a parenthetical day-specific exception (e.g.
// "18:30-00:30 (א' 19:30-00:30)") is checked against its general-case range.
function parseTimeRange(text) {
    const m = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/.exec(text || '');
    if (!m) return null;
    const toMin = (h, mm) => Number(h) * 60 + Number(mm);
    return { start: toMin(m[1], m[2]), end: toMin(m[3], m[4]) };
}

// Scans every numbered day's own timeline items (js/itinerary-data.js's
// window.ITINERARY_DAYS - the two optional/alternate days have no fixed
// real-world weekday, so they're skipped, same as the old body-per-day
// loop only ever ran for dayNum 1-7) for venues that carry closedDays
// and/or verifiedHours, and - only where a genuine conflict is found -
// appends an inline ⚠️ warning onto that specific item's .html, matching
// the site's existing .premium-tip-box ⚠️ convention (see e.g. Day 7's car
// return warning). A venue mentioned in a day's text but not actually
// closed/out-of-hours that day gets no warning at all - this deliberately
// stays silent rather than noisy. item.hasWarning records whether a
// warning box ended up attached, for the row-card badge (previously a
// `[data-venue-warning-id]` DOM presence check).
//
// Works on a detached <div> per item (never inserted into the page) rather
// than the old live #day-N-body DOM, and writes the result back onto
// item.html - so js/itinerary-view.js's render path always reads
// already-annotated content, the same way it read already-annotated DOM
// before.
function checkDayVenueWarnings() {
    if (!window.CORFU_LOCATIONS) return;

    (window.ITINERARY_DAYS || []).forEach(day => {
        if (day.dayNumber == null) return; // optional/alt days: no real weekday to cross-check
        const weekdayCode = getDayWeekdayCode(day.dayNumber);

        day.items.forEach(item => {
            const container = document.createElement('div');
            container.innerHTML = item.html;
            const itemText = gtItineraryItemContentText(item);
            const timeRange = parseTimeRange(item.time);

            Object.keys(window.CORFU_LOCATIONS).forEach(category => {
                (window.CORFU_LOCATIONS[category] || []).forEach(loc => {
                    if (!loc.closedDays && !loc.verifiedHours) return; // nothing to cross-check
                    const label = loc.name || loc.title;
                    const variants = extractLocationNameVariants(label);
                    if (!variants.some(v => itemText.includes(v))) return;
                    if (container.querySelector(`[data-venue-warning-id="${loc.id}"]`)) return; // already inserted

                    const messages = [];

                    if (weekdayCode && Array.isArray(loc.closedDays) && loc.closedDays.includes(weekdayCode)) {
                        const dayHe = HE_WEEKDAY_NAME_FROM_CODE[weekdayCode] || weekdayCode;
                        messages.push(`<strong>${escapeHtml(label)} סגור בימי ${dayHe}</strong> לפי Google Places - זה בדיוק היום המתוכנן לביקור. מומלץ לאמת ולתכנן מחדש אם צריך.`);
                    }

                    if (timeRange && loc.verifiedHours) {
                        const verifiedRange = parseTimeRange(loc.verifiedHours);
                        if (verifiedRange && (timeRange.start < verifiedRange.start || timeRange.end > verifiedRange.end)) {
                            messages.push(`השעות המתוכננות (${escapeHtml(item.time.trim())}) חורגות משעות הפתיחה המאומתות של ${escapeHtml(label)} (${escapeHtml(loc.verifiedHours)}) - מומלץ לאמת לפני ההגעה.`);
                        }
                    }

                    if (!messages.length) return;

                    const box = document.createElement('div');
                    box.className = 'premium-tip-box';
                    box.setAttribute('data-venue-warning-id', loc.id);
                    box.innerHTML = messages.map(m => `<p class="flex items-start gap-2"><span class="text-lg">⚠️</span> <span>${m}</span></p>`).join('');
                    container.appendChild(box);
                });
            });

            item.html = container.innerHTML;
            item.hasWarning = !!container.querySelector('[data-venue-warning-id]');
        });
    });
}

// --- Alternative-day swap (Step: "🔄 ימים חלופיים" now has a real action) --
// The week is already fully booked across the 7 numbered days, so "swapping
// in" an optional day (Paxos cruise / Pantokrator+Old Perithia) means
// picking which flexible middle day (2-6 - never Day 1/7, the fixed
// arrival/departure days) it stands in for. Persisted the same way day-
// complete state is: a small localStorage-backed map, { [optionalCardId]:
// dayNumber }, kept in its own key since its shape (object, not array) is
// unrelated to TRIP_PROGRESS_KEY's.
const DAY_SWAP_KEY = 'corfu-guide-day-swaps';

function getDaySwaps() {
    try {
        const raw = localStorage.getItem(DAY_SWAP_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) {
        return {};
    }
}

function saveDaySwaps(map) {
    try {
        localStorage.setItem(DAY_SWAP_KEY, JSON.stringify(map));
    } catch (e) {
        console.warn('Could not save day swaps', e);
    }
}

// Sets (or clears, if dayNum is '') which numbered day a given optional
// card replaces. A numbered day can only ever be claimed by one optional
// card at a time, so picking the same day for a second card automatically
// releases it from whichever card held it before.
function setDaySwap(cardId, dayNum) {
    const swaps = getDaySwaps();
    if (dayNum) {
        Object.keys(swaps).forEach(otherId => {
            if (otherId !== cardId && swaps[otherId] === dayNum) delete swaps[otherId];
        });
        swaps[cardId] = dayNum;
    } else {
        delete swaps[cardId];
    }
    saveDaySwaps(swaps);
    applyDaySwapUI();
}

// Re-renders every swap-dependent bit of the itinerary from the current
// localStorage state: each <select>'s own value, the matching
// .day-swap-status text, and the Pantokrator card's conditionally-worded
// closing line (see updatePantokratorClosingNote below).
//
// The old "הוחלף ב..." badge + dimmed/struck-through day-card treatment
// this used to also apply is gone along with the old .premium-day-card
// markup itself (Phase A subtraction) - the day-swap state's real
// user-visible feedback going forward is the scrubber pill dimming/
// highlighting gtSyncItineraryScrubberSwapState() (js/itinerary-view.js)
// already drives, called at the end of this function same as before.
//
// The .day-swap-select/.day-swap-status lookups below keep working
// unchanged: js/itinerary-view.js's gtSelectItineraryDay() now authors
// fresh elements with these exact classes + data-swap-card/data-swap-status
// attributes into the swap-bar whenever an alt day is the one currently
// selected (and bakes in the correct initial value/text itself, since
// this function can only update an element that already exists in the
// DOM - i.e. only while that alt day's swap-bar is actually showing).
function applyDaySwapUI() {
    const swaps = getDaySwaps();

    document.querySelectorAll('.day-swap-select').forEach(sel => {
        const cardId = sel.getAttribute('data-swap-card');
        sel.value = swaps[cardId] || '';
    });
    document.querySelectorAll('.day-swap-status').forEach(statusEl => {
        statusEl.textContent = '';
    });

    Object.keys(swaps).forEach(cardId => {
        const dayNum = swaps[cardId];
        const statusEl = document.querySelector(`.day-swap-status[data-swap-status="${cardId}"]`);
        if (statusEl) statusEl.textContent = `✅ החליף את יום ${dayNum}`;
    });

    updatePantokratorClosingNote(swaps);
    // New day-scrubber view (js/itinerary-view.js, Phase 4 batch 3): keep its
    // scrubber pills / currently-open context bar in sync with this same
    // swap state. Additive no-op if that file hasn't loaded.
    if (typeof gtSyncItineraryScrubberSwapState === 'function') gtSyncItineraryScrubberSwapState(swaps);
}

// Keeps the Pantokrator card's closing line honest in both readings: as
// just an option being browsed (where it's misleading to call it the
// trip's "last night", since Day 7/departure still follows whichever
// numbered day it wasn't actually swapped into) and as an actually-
// scheduled Day 6 replacement (where that framing becomes accurate).
function updatePantokratorClosingNote(swaps) {
    const el = document.getElementById('alt-pantokrator-closing-note');
    if (!el) return;
    const swappedIntoDay6 = swaps['alt-pantokrator'] === '6';
    el.textContent = swappedIntoDay6
        ? '🥂 מאחר שהחלפתם בזה את יום 6, זו אכן הארוחה האחרונה שלכם בקורפו לפני העזיבה ביום 7 - סעודת פרידה אמיתית.'
        : 'שימו לב: אלא אם החלפתם ביום זה ספציפית את יום 6 (בבורר למעלה), זו לא ה"ארוחה האחרונה" של הטיול - היא פשוט ארוחת ערב יפה בכפר הררי ציורי. יום 7 (עזיבה) תמיד ממשיך אחריה כרגיל.';
}

window.toggleDayComplete = toggleDayComplete;
window.viewTodayInItinerary = viewTodayInItinerary;
window.updateDayBudgetActual = updateDayBudgetActual;
window.getDayLocationMatches = getDayLocationMatches;
window.setDaySwap = setDaySwap;
window.applyDaySwapUI = applyDaySwapUI;
window.checkDayVenueWarnings = checkDayVenueWarnings;
window.findLocationById = findLocationById;
window.fillItineraryDinnerHooks = fillItineraryDinnerHooks;
window.fillItineraryPriceFlags = fillItineraryPriceFlags;
