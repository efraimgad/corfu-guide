// Shared location-display helpers.
//
// Phase C1 (extraction): these were defined in js/cards.js, whose remaining
// render*Card()/renderAll*() functions exist only to populate the four legacy
// category tab sections and are deleted with them in Phase C2. These four
// helpers are NOT legacy - js/explore.js, js/storage.js and js/itinerary.js
// all depend on them, and they must outlive the sections cards.js served.
//
// Was loaded BEFORE cards.js in index.html, whose renderAll*() functions ran
// synchronously at load time and call buildVerifiedInfoHTML(), so the
// definitions have to already exist. (This ordering constraint disappears in
// Phase C2 along with cards.js itself; that has happened, and this file
// outlived it as intended.)

// ---------------------------------------------------------------------------
// Verified-details block (Step: Google Places verification pass).
//
// Only renders for records that actually carry verified fields. Anything not
// checked against Google Places shows nothing extra, so an unverified card can
// never be mistaken for a verified one.
//
// The trip runs Wed 02.09.2026 - Tue 08.09.2026, so a venue's weekly closing
// day is the single most actionable fact here: it is the difference between
// dinner and a locked door after a 40-minute mountain drive.
// ---------------------------------------------------------------------------
const HE_DAY_NAME = { SU: 'ראשון', MO: 'שני', TU: 'שלישי', WE: 'רביעי', TH: 'חמישי', FR: 'שישי', SA: 'שבת' };

// Which calendar dates of THIS trip fall on a given weekday code (SU/MO/.../SA).
//
// Lazily computed and memoized rather than a hand-typed per-destination table
// (was a fixed 7-entry object for one specific trip week) - a second source of
// truth that would have to be re-typed correctly for every new destination and
// every trip-date change. Walks every day from window.DESTINATION.tripConfig's
// startDay to endDay (inclusive - so this equally covers a 2-day trip like
// testdest's or a 9+ day one), deriving each date's real weekday + DD.MM string
// via Intl in the destination's own timezone - the same formatToParts technique
// js/dashboard.js's datePart()/formatDateDM() already use, so this can never
// disagree with how dates are formatted everywhere else on the page.
let _gtTripDayDatesCache = null;
function getTripDayDates() {
    if (_gtTripDayDatesCache) return _gtTripDayDatesCache;
    const map = {};
    const tz = window.DESTINATION.timezone;
    const { startDay, endDay } = window.DESTINATION.tripConfig;
    for (let t = startDay.getTime(); t <= endDay.getTime(); t += 86400000) {
        const date = new Date(t);
        // SU/MO/TU/WE/TH/FR/SA are exactly the first two letters of the
        // English weekday name, uppercased - no separate lookup table needed.
        const code = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(date).slice(0, 2).toUpperCase();
        const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: '2-digit', month: '2-digit' }).formatToParts(date);
        map[code] = `${parts.find(p => p.type === 'day').value}.${parts.find(p => p.type === 'month').value}`;
    }
    _gtTripDayDatesCache = map;
    return map;
}

function buildVerifiedInfoHTML(d) {
    const rows = [];

    if (Array.isArray(d.closedDays) && d.closedDays.length) {
        const parts = d.closedDays.map(code => {
            const name = HE_DAY_NAME[code] || code;
            const date = getTripDayDates()[code];
            return date ? `${name} (${date})` : name;
        });
        rows.push(`<p class="verified-closed">🚫 <strong>סגור ביום ${parts.join(', ')}</strong></p>`);
    }

    if (d.verifiedHours) {
        rows.push(`<p class="verified-row">🕒 שעות מאומתות: <span dir="ltr">${escapeHtml(d.verifiedHours)}</span></p>`);
    }

    if (d.phone) {
        // tel: needs the raw E.164 form; the visible label keeps spaces for legibility.
        const dial = String(d.phone).replace(/[^\d+]/g, '');
        rows.push(`<p class="verified-row"><span class="gt-inline-icon">${GT_ICON_PHONE}</span> <a href="tel:${escapeAttr(dial)}" class="verified-tel" dir="ltr">${escapeHtml(formatPhone(dial))}</a></p>`);
    } else if (d.phoneNote) {
        rows.push(`<p class="verified-row verified-muted"><span class="gt-inline-icon">${GT_ICON_PHONE}</span> ${escapeHtml(d.phoneNote)}</p>`);
    }

    if (d.address) {
        rows.push(`<p class="verified-row verified-muted" dir="ltr">📍 ${escapeHtml(d.address)}</p>`);
    }

    if (d.priceFlag) {
        rows.push(`<p class="verified-row verified-warn"><span class="gt-inline-icon">${GT_ICON_WARNING}</span> ${escapeHtml(d.priceFlag)}</p>`);
    }
    if (d.verifyNote) {
        rows.push(`<p class="verified-row verified-warn"><span class="gt-inline-icon">${GT_ICON_WARNING}</span> ${escapeHtml(d.verifyNote)}</p>`);
    }

    // needsCoordCheck (coarse coordinate -> the Maps link degrades to a name
    // search) is a location-precision caveat, distinct from everything
    // above (which is all about hours/phone/price accuracy) - kept as its
    // own muted row rather than folded into the verified/unverified stamp
    // below, so the two kinds of uncertainty are never conflated.
    if (d.needsCoordCheck) {
        rows.push(`<p class="verified-row verified-muted">📍 מיקום משוער - כדאי לוודא מול Maps</p>`);
    }

    // Every card gets exactly one of these two stamps - a verified record
    // says so explicitly (✅ + the date it was checked), and one that was
    // never checked against Google Places says so just as explicitly
    // (⚠️), rather than staying visually identical to a verified one by
    // showing nothing at all.
    const stamp = d.verifiedOn
        ? `<p class="verified-stamp">✅ אומת מול Google Places ב-${escapeHtml(d.verifiedOn)}${
              d.verifiedRating ? ` · דירוג ${escapeHtml(d.verifiedRating)}${d.ratingCount ? ` (${d.ratingCount} ביקורות)` : ''}` : ''
          }</p>`
        : `<p class="verified-stamp verified-warn"><span class="gt-inline-icon">${GT_ICON_WARNING}</span> שעות לא מאומתות — כדאי לבדוק לפני ההגעה</p>`;

    return `<div class="verified-info">${rows.join('')}${stamp}</div>`;
}

// +302661039649 -> +30 2661 039649  (destination-sourced country code, was
// hardcoded to Greece's +30 specifically - see window.DESTINATION.phoneCountryCode
// and data/destinations/*.js. Still assumes a 4-digit + 6-digit split after the
// country code, same as before.)
function formatPhone(dial) {
    const cc = (window.DESTINATION && window.DESTINATION.phoneCountryCode) || '+30';
    const ccEscaped = cc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = new RegExp(`^${ccEscaped}(\\d{4})(\\d{6})$`).exec(dial);
    return m ? `${cc} ${m[1]} ${m[2]}` : dial;
}

// Personal tracking widget (visited toggle / 1-5 rating / note) markup.
// Kept out of js/storage.js because js/cards.js's renderAll*() functions used to call
// it synchronously at load time, before storage.js (deferred, loaded later)
// exists. Lives here rather than in cards.js so it outlives that file. storage.js's
// injectPersonalTrackingWidgets() reuses this same global function for the
// ~14 cards not yet extracted into CORFU_LOCATIONS (see js/storage.js).
function buildPersonalTrackingWidgetHTML() {
    const stars = [1, 2, 3, 4, 5].map(v => `
        <button type="button" class="pt-star" data-value="${v}" role="radio" aria-checked="false" aria-label="דרגו ${v} מתוך 5 כוכבים">
            <svg class="icon-line" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.5Z"/></svg>
        </button>`).join('');

    return `
    <div class="personal-tracking-widget">
        <button type="button" class="pt-visited-btn" aria-pressed="false" title="סמנו כמקום שביקרתם בו">
            <svg class="icon-line" viewBox="0 0 24 24"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
            <span class="pt-visited-label">ביקרתי</span>
        </button>
        <div class="pt-rating" role="radiogroup" aria-label="דירוג אישי">${stars}</div>
        <button type="button" class="pt-note-toggle" aria-expanded="false" title="הוסיפו הערה אישית">
            <svg class="icon-line" viewBox="0 0 24 24"><path d="M4 20l1-4.2L16.8 4a1.5 1.5 0 0 1 2.1 0l1.1 1.1a1.5 1.5 0 0 1 0 2.1L8.2 19 4 20Z"/></svg>
        </button>
        <textarea class="pt-note-textarea hidden" rows="2" placeholder="הערה אישית..." aria-label="הערה אישית"></textarea>
    </div>`;
}


window.buildVerifiedInfoHTML = buildVerifiedInfoHTML;
window.formatPhone = formatPhone;
window.buildPersonalTrackingWidgetHTML = buildPersonalTrackingWidgetHTML;
