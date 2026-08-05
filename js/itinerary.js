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

// Collapsible day cards: click a day's header to fold/unfold its full
// timeline, so the itinerary can be scanned at a glance and expanded
// only for the day(s) currently being planned — a common pattern in
// premium trip-planner apps.
function toggleDayCard(headerEl) {
    const body = headerEl.nextElementSibling;
    const chevron = headerEl.querySelector('.day-card-chevron');
    if (!body) return;
    const wasCollapsed = body.classList.contains('day-card-collapsed');
    // Accordion behavior: opening one day (or alternate-day) card closes
    // every other one, so only a single day's timeline is ever expanded at
    // once. setAllDayCards() below is the explicit "open/close everything"
    // escape hatch and intentionally bypasses this.
    if (wasCollapsed) {
        document.querySelectorAll('.premium-day-header').forEach(otherHeader => {
            if (otherHeader === headerEl) return;
            const otherBody = otherHeader.nextElementSibling;
            const otherChevron = otherHeader.querySelector('.day-card-chevron');
            if (otherBody && !otherBody.classList.contains('day-card-collapsed')) {
                otherBody.classList.add('day-card-collapsed');
                if (otherChevron) otherChevron.style.transform = 'rotate(-90deg)';
                if (otherHeader.hasAttribute('aria-controls')) {
                    otherHeader.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }
    const isCollapsed = body.classList.toggle('day-card-collapsed');
    if (chevron) {
        chevron.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
    }
    // Only the 7 numbered day headers carry aria-controls (the 2 optional
    // alternative-day cards aren't keyboard-operable headers - see Step 13);
    // this guard keeps aria-expanded scoped to the same 7.
    if (headerEl.hasAttribute('aria-controls')) {
        headerEl.setAttribute('aria-expanded', String(!isCollapsed));
    }
}

// Enter/Space activate the header like a real button would, since a plain
// div with role="button" gets no native keyboard behavior. Ignores keys
// that originate from the checkbox/map-button nested inside the header
// (which handle their own activation and already stopPropagation() on
// click) - keydown bubbles regardless of that, so without this guard
// pressing Space on the checkbox would also toggle the card.
function handleDayHeaderKeydown(event, headerEl) {
    if (event.target !== headerEl) return;
    if (event.key === 'Enter') {
        toggleDayCard(headerEl);
    } else if (event.key === ' ') {
        event.preventDefault(); // don't let Space scroll the page
        toggleDayCard(headerEl);
    }
}

// Quick action: open or fold every day at once, for scanning the whole
// week or focusing on a single day without seven clicks.
function setAllDayCards(expand) {
    document.querySelectorAll('.premium-day-header').forEach(header => {
        const body = header.nextElementSibling;
        const chevron = header.querySelector('.day-card-chevron');
        if (!body) return;
        body.classList.toggle('day-card-collapsed', !expand);
        if (chevron) chevron.style.transform = expand ? 'rotate(0deg)' : 'rotate(-90deg)';
        if (header.hasAttribute('aria-controls')) {
            header.setAttribute('aria-expanded', String(expand));
        }
    });
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

    // Auto-collapse a day shortly after marking it complete, to reduce
    // clutter as the trip progresses. Only ever collapses — unchecking
    // never force-expands a card the user may still be reading.
    if (checkboxEl.checked) {
        const header = checkboxEl.closest('.premium-day-header');
        const body = header && header.nextElementSibling;
        if (header && body && !body.classList.contains('day-card-collapsed')) {
            setTimeout(() => toggleDayCard(header), 600);
        }
    }
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
// dump the user at the top of a 7-day list. Now it scrolls straight to,
// auto-expands, and briefly highlights the day that's actually relevant
// right now (or Day 1 before departure) — reusing the same
// expand/scroll/highlight mechanics as toggleDayCard and search results.
function viewTodayInItinerary() {
    const dayNum = window._currentTripDayNum;
    switchTab('itinerary', true);
    if (!dayNum) {
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
    }
    setTimeout(() => {
        const checkbox = document.querySelector(`.day-complete-checkbox[data-day="${dayNum}"]`);
        const header = checkbox && checkbox.closest('.premium-day-header');
        if (!header) {
            window.scrollTo({ top: 100, behavior: 'smooth' });
            return;
        }
        const body = header.nextElementSibling;
        if (body && body.classList.contains('day-card-collapsed')) {
            toggleDayCard(header);
        }
        const card = header.closest('.premium-day-card') || header;
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        card.classList.add('search-highlight');
        setTimeout(() => card.classList.remove('search-highlight'), 2000);
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

// Returns every location (any category with map coordinates) whose name
// appears in day N's own itinerary text. Empty on days with no mappable
// stops (e.g. Day 1/7, arrival/departure logistics) - callers should fall
// back to the full-island view in that case rather than show nothing.
function getDayLocationMatches(dayNum) {
    const body = document.getElementById(`day-${dayNum}-body`);
    const locations = window.CORFU_LOCATIONS;
    if (!body || !locations) return [];

    const dayText = body.textContent;
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
// CORFU_LOCATIONS record (see js/cards.js's buildVerifiedInfoHTML) - two
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

function fillItineraryPriceFlags() {
    document.querySelectorAll('[data-price-flag-id]').forEach(el => {
        const id = el.getAttribute('data-price-flag-id');
        const html = renderPriceFlagHTML(findLocationById(id));
        if (html) el.innerHTML = html;
        else el.remove(); // no caveat on the record - nothing to show
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

// +302661039649 -> +30 2661 039649 (mirrors js/cards.js's formatPhone(), a
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

function fillItineraryDinnerHooks() {
    document.querySelectorAll('[data-dinner-food-id]').forEach(el => {
        const id = el.getAttribute('data-dinner-food-id');
        el.innerHTML = renderDinnerSlotHTML(findLocationById(id));
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

// Scans every day's own timeline items for venues that carry closedDays
// and/or verifiedHours, and - only where a genuine conflict is found -
// inserts an inline ⚠️ warning into that specific event block, matching the
// site's existing .premium-tip-box ⚠️ convention (see e.g. Day 7's car
// return warning). A venue mentioned in a day's text but not actually
// closed/out-of-hours that day gets no warning at all - this deliberately
// stays silent rather than noisy.
function checkDayVenueWarnings() {
    if (!window.CORFU_LOCATIONS) return;

    for (let dayNum = 1; dayNum <= 7; dayNum++) {
        const body = document.getElementById(`day-${dayNum}-body`);
        if (!body) continue;
        const weekdayCode = getDayWeekdayCode(dayNum);

        body.querySelectorAll('.premium-timeline-item').forEach(item => {
            const contentCol = item.querySelector('.premium-content-col');
            if (!contentCol) return;
            const itemText = contentCol.textContent;
            const timeBadgeEl = item.querySelector('.premium-time-badge');
            const timeRange = timeBadgeEl ? parseTimeRange(timeBadgeEl.textContent) : null;

            Object.keys(window.CORFU_LOCATIONS).forEach(category => {
                (window.CORFU_LOCATIONS[category] || []).forEach(loc => {
                    if (!loc.closedDays && !loc.verifiedHours) return; // nothing to cross-check
                    const label = loc.name || loc.title;
                    const variants = extractLocationNameVariants(label);
                    if (!variants.some(v => itemText.includes(v))) return;
                    if (contentCol.querySelector(`[data-venue-warning-id="${loc.id}"]`)) return; // already inserted

                    const messages = [];

                    if (weekdayCode && Array.isArray(loc.closedDays) && loc.closedDays.includes(weekdayCode)) {
                        const dayHe = HE_WEEKDAY_NAME_FROM_CODE[weekdayCode] || weekdayCode;
                        messages.push(`<strong>${escapeHtml(label)} סגור בימי ${dayHe}</strong> לפי Google Places - זה בדיוק היום המתוכנן לביקור. מומלץ לאמת ולתכנן מחדש אם צריך.`);
                    }

                    if (timeRange && loc.verifiedHours) {
                        const verifiedRange = parseTimeRange(loc.verifiedHours);
                        if (verifiedRange && (timeRange.start < verifiedRange.start || timeRange.end > verifiedRange.end)) {
                            messages.push(`השעות המתוכננות (${escapeHtml(timeBadgeEl.textContent.trim())}) חורגות משעות הפתיחה המאומתות של ${escapeHtml(label)} (${escapeHtml(loc.verifiedHours)}) - מומלץ לאמת לפני ההגעה.`);
                        }
                    }

                    if (!messages.length) return;

                    const box = document.createElement('div');
                    box.className = 'premium-tip-box';
                    box.setAttribute('data-venue-warning-id', loc.id);
                    box.innerHTML = messages.map(m => `<p class="flex items-start gap-2"><span class="text-lg">⚠️</span> <span>${m}</span></p>`).join('');
                    contentCol.appendChild(box);
                });
            });
        });
    }
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

// Human-readable names for the badge text on the day being replaced -
// kept here rather than read from the DOM since the optional cards' <h4>
// titles are longer than what fits nicely in a small badge.
const OPTIONAL_CARD_NAMES = {
    'alt-paxos': 'שייט לפאקסוס',
    'alt-pantokrator': 'הר פנטוקרטור'
};

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
// localStorage state: the "הוחלף ב..." badge + dimmed/struck-through
// treatment on whichever numbered day-card is currently replaced, the
// highlighted treatment on whichever optional card replaced it, each
// <select>'s own value, and the Pantokrator card's conditionally-worded
// closing line (see updatePantokratorClosingNote below).
function applyDaySwapUI() {
    const swaps = getDaySwaps();

    document.querySelectorAll('.day-swap-badge').forEach(b => b.remove());
    document.querySelectorAll('.premium-day-card[data-day-number]').forEach(card => {
        card.classList.remove('day-swapped-out');
    });
    document.querySelectorAll('.premium-day-card[data-optional-card]').forEach(card => {
        card.classList.remove('day-swapped-in');
    });
    document.querySelectorAll('.day-swap-select').forEach(sel => {
        const cardId = sel.getAttribute('data-swap-card');
        sel.value = swaps[cardId] || '';
    });
    document.querySelectorAll('.day-swap-status').forEach(statusEl => {
        statusEl.textContent = '';
    });

    Object.keys(swaps).forEach(cardId => {
        const dayNum = swaps[cardId];
        const dayCard = document.querySelector(`.premium-day-card[data-day-number="${dayNum}"]`);
        const optionalCard = document.querySelector(`.premium-day-card[data-optional-card="${cardId}"]`);
        const cardLabel = OPTIONAL_CARD_NAMES[cardId] || 'יום חלופי';

        if (dayCard) {
            dayCard.classList.add('day-swapped-out');
            const titleEl = dayCard.querySelector('.premium-day-header h3');
            if (titleEl) {
                const badge = document.createElement('span');
                badge.className = 'day-swap-badge';
                badge.textContent = `🔄 הוחלף ב-${cardLabel}`;
                titleEl.appendChild(badge);
            }
        }
        if (optionalCard) {
            optionalCard.classList.add('day-swapped-in');
            const statusEl = optionalCard.querySelector(`.day-swap-status[data-swap-status="${cardId}"]`);
            if (statusEl) statusEl.textContent = `✅ החליף את יום ${dayNum}`;
        }
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

window.setAllDayCards = setAllDayCards;
window.toggleDayCard = toggleDayCard;
window.handleDayHeaderKeydown = handleDayHeaderKeydown;
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
