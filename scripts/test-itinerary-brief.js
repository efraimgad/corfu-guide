// ============================================================================
// test-itinerary-brief.js — guards the day-brief / day-summary layer.
//
// What this actually protects against, in order of how likely each is to
// break silently:
//
//   1. A day losing its brief. The renderer degrades to rendering nothing at
//      all when dayBrief is absent (deliberate - an empty shell would be
//      worse), which means a deleted brief is invisible rather than loud.
//   2. Authored totals creeping back in. Every number the brief shows is
//      derived from `transitions`; the moment someone types "about 75 minutes"
//      into overview prose it becomes a second source of truth that drifts.
//      This test fails on a bare drive-time figure appearing in brief prose.
//   3. transitions.between falling out of step with items. The renderer indexes
//      between[i] per item gap, so a mismatch silently drops connectors.
//   4. A brief naming a venue that does not exist in CORFU_LOCATIONS, or a
//      dinner hook pointing at a missing record - the two ways this content
//      could assert something the data cannot back.
//   5. rainAlt becoming unreachable again. It was real content read by nothing
//      for the entire life of the scrubber view; the weather fold is the only
//      thing rendering it now.
// ============================================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const sandbox = { window: {}, document: undefined, console };
vm.createContext(sandbox);
for (const f of ['js/locations-data.js', 'js/itinerary-data.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
}
const DAYS = sandbox.window.ITINERARY_DAYS;
const LOC = sandbox.window.CORFU_LOCATIONS;
const ALL_LOC = [].concat(LOC.beaches, LOC.food, LOC.attractions, LOC.gems);
const VIEW = fs.readFileSync(path.join(ROOT, 'js/itinerary-view.js'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'css/design-system.css'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let failures = 0, checks = 0;
function ok(cond, label) {
    checks++;
    if (cond) { console.log('OK:   ' + label); return true; }
    failures++; console.log('FAIL: ' + label); return false;
}
function section(t) { console.log('\n--- ' + t + ' ---'); }

// -- 1. Every day has a complete brief ---------------------------------------
section('Every itinerary day carries a usable brief');
const REQUIRED = ['theme', 'pace', 'overview', 'mustDo', 'highlights', 'bestMoment'];
const PACES = ['relaxed', 'balanced', 'active'];
let missing = [], badPace = [], emptyMust = [];
DAYS.forEach(d => {
    const b = d.dayBrief;
    if (!b) { missing.push(d.key); return; }
    REQUIRED.forEach(f => { if (!b[f] || (Array.isArray(b[f]) && !b[f].length)) missing.push(d.key + '.' + f); });
    if (!PACES.includes(b.pace)) badPace.push(d.key + '=' + b.pace);
    if (!(b.mustDo || []).length) emptyMust.push(d.key);
});
ok(missing.length === 0, `all ${DAYS.length} days have every required brief field` + (missing.length ? ' — missing: ' + missing.join(', ') : ''));
ok(badPace.length === 0, 'every pace is one of relaxed/balanced/active' + (badPace.length ? ' — bad: ' + badPace.join(', ') : ''));
ok(emptyMust.length === 0, 'every day names at least one must-do' + (emptyMust.length ? ' — empty: ' + emptyMust.join(', ') : ''));

// mustDo/recommended/optional entries must be {title, why}, not bare strings:
// the renderer reads .title and would print "undefined" for a plain string.
let malformed = [];
DAYS.forEach(d => {
    ['mustDo', 'recommended', 'optional'].forEach(rank => {
        (d.dayBrief[rank] || []).forEach((e, i) => {
            if (typeof e !== 'object' || !e.title) malformed.push(`${d.key}.${rank}[${i}]`);
        });
    });
});
ok(malformed.length === 0, 'every priority entry is an object with a title' + (malformed.length ? ' — bad: ' + malformed.join(', ') : ''));

// -- 2. Totals stay derived, never authored ----------------------------------
section('The brief never hand-types a number the transitions data owns');
// A drive figure in prose ("75 דקות נסיעה", "כ-62 ק\"מ") is the specific
// regression: it duplicates gtDayComputedTotals() and silently goes stale.
const DRIVE_PROSE = /(\d{2,3})\s*(דקות|דק׳)\s*(נסיעה|נהיגה)|(נסיעה|נהיגה)\s*של\s*כ?-?\s*(\d{2,3})\s*(דקות|דק׳)|כ?-?\s*(\d{2,3})\s*ק"מ\s*(נסיעה|נהיגה)/;
let authored = [];
DAYS.forEach(d => {
    const b = d.dayBrief;
    const prose = [b.overview, b.ifTired, b.ifEnergy, b.skipFirst,
        (b.weather || {}).sun, (b.weather || {}).cloud].filter(Boolean).join(' ');
    if (DRIVE_PROSE.test(prose)) authored.push(d.key);
});
ok(authored.length === 0, 'no brief states its own drive total in prose' + (authored.length ? ' — found in: ' + authored.join(', ') : ''));
ok(/function gtDayComputedTotals/.test(VIEW), 'gtDayComputedTotals() is the single place totals come from');
ok(!/dayBrief\.(driveMin|driveKm|totalDrive|walkMin)/.test(VIEW), 'the renderer never reads a stored total off dayBrief');

// -- 3. transitions stay in step with items ----------------------------------
section('Route connectors line up with the item list');
let badLen = [];
DAYS.forEach(d => {
    const between = (d.transitions && d.transitions.between) || [];
    if (between.length !== d.items.length - 1) {
        badLen.push(`${d.key}: between=${between.length}, needs ${d.items.length - 1}`);
    }
});
ok(badLen.length === 0, 'every day has exactly items-1 between-legs' + (badLen.length ? ' — ' + badLen.join('; ') : ''));

// A leg that claims a mode must carry the metric its connector renders, or the
// connector prints "undefined דק׳". Boat legs are the documented exception -
// gtTransitionConnectorHtml() falls back to a label when min is absent.
let badLeg = [];
DAYS.forEach(d => {
    const tr = d.transitions || {};
    [tr.fromHotel, ...(tr.between || []), tr.toHotel].filter(Boolean).forEach((l, i) => {
        if (l.mode === 'drive' && (l.min == null || l.km == null)) badLeg.push(`${d.key}[${i}] drive missing min/km`);
        if (l.mode === 'walk' && l.min == null) badLeg.push(`${d.key}[${i}] walk missing min`);
    });
});
ok(badLeg.length === 0, 'every drive/walk leg carries its own metric' + (badLeg.length ? ' — ' + badLeg.join('; ') : ''));

// -- 4. Nothing asserts a venue the data cannot back -------------------------
section('Dinner hooks resolve against the real dataset');
const byId = new Map(ALL_LOC.map(r => [r.id, r]));
let badHook = [], unverified = [];
DAYS.forEach(d => {
    d.items.forEach(item => {
        const re = /data-dinner-food-id="([^"]+)"/g;
        let m;
        while ((m = re.exec(item.html))) {
            const rec = byId.get(m[1]);
            if (!rec) badHook.push(`${d.key} -> ${m[1]}`);
            else if (!rec.verifiedHours) unverified.push(`${d.key} -> ${rec.name}`);
        }
    });
});
ok(badHook.length === 0, 'every dinner hook points at a real CORFU_LOCATIONS record' + (badHook.length ? ' — missing: ' + badHook.join(', ') : ''));
// Not a hard failure - an unverified venue is allowed, the renderer flags it
// inline. This check exists so the count is visible rather than silent.
console.log(`INFO: dinner hooks without verifiedHours: ${unverified.length}${unverified.length ? ' (' + unverified.join(', ') + ')' : ''}`);

// The two days the audit found had no dinner at all must keep having one.
['3', '6'].forEach(k => {
    const d = DAYS.find(x => x.key === k);
    const has = d.items.some(i => i.html.indexOf('data-dinner-food-id') !== -1);
    ok(has, `day ${k} still carries a dinner recommendation (was a documented hole)`);
});

// -- 5. rainAlt is reachable ------------------------------------------------
section('The rain plan the intro promises is actually rendered');
const withRain = DAYS.filter(d => d.rainAlt);
ok(withRain.length >= 7, `${withRain.length} days carry a rainAlt (expected >= 7)`);
ok(/day\.rainAlt/.test(VIEW) && /gtDayWeatherHtml/.test(VIEW), 'the weather fold renders day.rainAlt');
ok(/gtDayWeatherHtml\(day\)/.test(VIEW), 'gtDayWeatherHtml is actually called with the day');
ok(/closingNoteHtml/.test(VIEW), 'closingNoteHtml is rendered too (was also dead data)');

// -- 6. The render targets exist --------------------------------------------
section('The DOM the renderer writes into exists in index.html');
ok(/id="gt-itinerary-brief"/.test(HTML), '#gt-itinerary-brief container is present');
ok(/id="gt-itinerary-summary"/.test(HTML), '#gt-itinerary-summary container is present');
ok(/gtRenderItineraryBrief\(day\)/.test(VIEW), 'gtSelectItineraryDay renders the brief');
ok(/gtRenderItineraryDaySummary\(day\)/.test(VIEW), 'gtSelectItineraryDay renders the summary');
// Both the numbered-day and the alt-day branch must call them - the alt branch
// is the one that is easy to forget, and it is where 2 of 9 days live.
// Matched as call STATEMENTS (indented, semicolon-terminated) so the function
// declarations of the same name are not counted as call sites.
const briefCalls = (VIEW.match(/^\s+gtRenderItineraryBrief\(day\);$/gm) || []).length;
const summaryCalls = (VIEW.match(/^\s+gtRenderItineraryDaySummary\(day\);$/gm) || []).length;
ok(briefCalls === 2, `both the numbered and alt branches render the brief (found ${briefCalls} call sites)`);
ok(summaryCalls === 2, `both branches render the summary (found ${summaryCalls} call sites)`);

// -- 7. Styling exists for what the renderer emits ---------------------------
section('Every class the renderer emits has a rule');
const EMITTED = ['gt-day-brief', 'gt-day-brief__theme', 'gt-day-brief__chips', 'gt-day-stats',
    'gt-day-stat', 'gt-day-brief__overview', 'gt-judgment', 'gt-day-prio', 'gt-day-prio__group',
    'gt-day-prio__label', 'gt-day-prio__title', 'gt-day-prio__why', 'gt-day-fold',
    'gt-day-fold__summary', 'gt-day-fold__body', 'gt-day-weather__row', 'gt-day-weather__label',
    'gt-day-weather__text', 'gt-day-flex__row', 'gt-day-flex__label', 'gt-day-flex__text',
    'gt-day-summary', 'gt-day-summary__title', 'gt-day-summary__highlights',
    'gt-day-summary__facts', 'gt-day-summary__fact', 'gt-day-summary__moment',
    'gt-day-summary__note', 'gt-chip--pace',
    'gt-day-sun',
    'gt-day-nav', 'gt-day-nav__btn', 'gt-day-nav__btn--prev', 'gt-day-nav__label',
    'gt-day-nav__eyebrow', 'gt-day-nav__title', 'gt-day-nav__arrow'];
const unstyled = EMITTED.filter(c => CSS.indexOf('.' + c) === -1);
ok(unstyled.length === 0, `all ${EMITTED.length} emitted classes are styled` + (unstyled.length ? ' — unstyled: ' + unstyled.join(', ') : ''));
// The judgment marker is the mechanism keeping opinion visually separate from
// verified fact. Losing it would silently promote recommendations to facts.
ok(/\.gt-judgment::before/.test(CSS) && /content:"המלצה שלנו/.test(CSS), 'the judgment marker still prints its label');

// -- 7b. Bidi isolation on clock values -------------------------------------
section('Clock ranges are bidi-isolated so they do not read backwards');
// The whole page is dir="rtl". An en-dash between two clock times is
// bidi-neutral, so "08:00-19:00" laid out unisolated renders visually as
// "19:00-08:00" - a day that appears to start at 8pm. This was a real defect,
// caught on screen rather than in the DOM (textContent looks correct either
// way), so the guard has to assert the isolation attribute itself.
ok(/gtStatHtml\('🕘', 'טווח היום', span, true\)/.test(VIEW), 'the day-span stat is emitted with the ltr flag');
ok(/const valueAttr = ltr \? ' dir="ltr"' : '';/.test(VIEW), 'gtStatHtml turns that flag into dir="ltr"');
ok(/gt-day-summary__fact-value gt-tabular" dir="ltr"/.test(VIEW), 'the recommended-departure clock is isolated too');
// The Hebrew totals must NOT be forced LTR - that would reverse them instead.
ok(/gtStatHtml\('🚗', 'נהיגה', gtFormatMinutes\(totals\.driveMin\) \+ km\)/.test(VIEW), 'the Hebrew drive total is left RTL');

// -- 7c. Day-to-day pager ----------------------------------------------------
section('The day pager exists and stops at both ends of the trip');
ok(/function gtDayNavHtml/.test(VIEW), 'gtDayNavHtml() exists');
ok(/gtDayNavHtml\(day\)/.test(VIEW), 'the day summary renders it');
// Only the numbered days form a sequence. Alt days stand in for a numbered day
// rather than holding a position ("the day after Paxos" is not a thing).
ok(/day\.isAlt \|\| !day\.dayNumber/.test(VIEW), 'alt days render no pager');
// Generalized (Phase 1 destination-template refactor): the cutoff is now the
// active destination's own last numbered day, not a literal 7, so a
// destination with a different trip length still stops correctly.
ok(/day\.dayNumber < maxDayNumber/.test(VIEW), 'the final day renders no next link');
ok(/day\.dayNumber > 1/.test(VIEW), 'the first day renders no previous link');
ok(/data-gt-goto-day=/.test(VIEW), 'each link carries its target day as a data attribute');
ok(/\[data-gt-goto-day\]/.test(VIEW), 'a delegated click handler is wired to that attribute');
ok(/scrollIntoView/.test(VIEW), 'switching day scrolls back to the top of the itinerary');
ok(/gt-btn gt-btn--secondary/.test(VIEW), 'both links reuse the existing button treatment');
// RTL: forward points left. Getting these backwards would send readers the
// wrong way, and it is invisible to any DOM-level assertion.
ok(/'היום הבא', '←'/.test(VIEW), 'next points ← (forward in an RTL page)');
ok(/'היום הקודם', '→'/.test(VIEW), 'previous points → (backward in an RTL page)');
// Every target either link can produce must be a real day, or it is a dead end.
const maxNumbered = Math.max(...DAYS.filter(d => !d.isAlt).map(d => d.dayNumber));
ok(maxNumbered === 7, `the trip still ends at day 7 (found ${maxNumbered}) - the cutoff above assumes it`);
let dangling = [];
DAYS.forEach(d => {
    if (d.isAlt || !d.dayNumber) return;
    if (d.dayNumber < 7 && !DAYS.some(x => String(x.key) === String(d.dayNumber + 1))) dangling.push(`${d.key} -> next ${d.dayNumber + 1}`);
    if (d.dayNumber > 1 && !DAYS.some(x => String(x.key) === String(d.dayNumber - 1))) dangling.push(`${d.key} -> prev ${d.dayNumber - 1}`);
});
ok(dangling.length === 0, 'every pager target resolves to a real day' + (dangling.length ? ' - dangling: ' + dangling.join(', ') : ''));

// -- 7d. Sunrise / sunset ----------------------------------------------------
section('Daylight times are computed from the real trip dates, never stored');
const SOLAR = fs.readFileSync(path.join(ROOT, 'js/solar.js'), 'utf8');
ok(/function solarEvents/.test(SOLAR) && /function solarCorfuTimes/.test(SOLAR), 'js/solar.js provides the calculation');
ok(/gtDaySolar\(day\)/.test(VIEW), 'the day brief derives its times per day');
ok(/TRIP_CONFIG\.startDay/.test(VIEW), 'derived from the real trip start date, not a constant');
// The specific regression: someone pastes a table of times into the data file.
// That is a second source of truth that silently goes stale if the trip moves.
let storedTimes = [];
DAYS.forEach(d => {
    const b = d.dayBrief || {};
    if (b.sunsetNote && /\d{1,2}:\d{2}/.test(b.sunsetNote)) storedTimes.push(`${d.key}.sunsetNote`);
    ['sunrise', 'sunset', 'sunriseTime', 'sunsetTime'].forEach(f => { if (b[f]) storedTimes.push(`${d.key}.${f}`); });
});
// Prose is the hole this originally slipped through: day 6's overview carried
// "sunset is around 20:03 (estimate)" long after the value became computed and
// exact. Any clock time in the same sentence as זריחה/שקיעה is a second source
// of truth for something js/solar.js already owns.
DAYS.forEach(d => {
    const b = d.dayBrief || {};
    [['overview', b.overview], ['ifTired', b.ifTired], ['ifEnergy', b.ifEnergy],
     ['weather.sun', (b.weather || {}).sun], ['weather.cloud', (b.weather || {}).cloud]]
        .filter(([, v]) => v)
        .forEach(([name, text]) => {
            if (/(זריחה|שקיעה)[^<.]{0,60}\d{1,2}:\d{2}|\d{1,2}:\d{2}[^<.]{0,60}(זריחה|שקיעה)/.test(text)) {
                storedTimes.push(`${d.key}.${name}`);
            }
        });
});
// Item HTML was the remaining hole, and it is the one that actually bit: day 3
// carried "sunset around 20:06 on 4.9 (rough estimate)" inside a timeline item
// long after solar.js began computing 20:08 for that date. The brief-prose scan
// above never looked here, so the contradiction survived a whole pass.
DAYS.forEach(d => {
    d.items.forEach((item, i) => {
        if (/(זריחה|שקיעה)[^<>]{0,80}\d{1,2}:\d{2}|\d{1,2}:\d{2}[^<>]{0,80}(זריחה|שקיעה)/.test(item.html)) {
            storedTimes.push(`${d.key}.items[${i}]`);
        }
    });
});
ok(storedTimes.length === 0, 'no day hardcodes a sunrise/sunset time' + (storedTimes.length ? ' - found: ' + storedTimes.join(', ') : ''));
// Alt days have no fixed date - they stand in for whichever day you swap them
// into - so they must show a range, never one exact time presented as certain.
ok(/day\.isAlt/.test(VIEW) && /isRange/.test(VIEW), 'alt days render a range rather than a false exact time');
ok(/solar\.isRange/.test(VIEW), 'the sunset nudge is suppressed when only a range is known');
ok(/js\/solar\.js/.test(HTML), 'solar.js is loaded by index.html');
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
ok(/js\/solar\.js/.test(SW), 'solar.js is precached by the service worker');
// Clock values are bidi-isolated for the same reason the day span is.
ok(/'🌅', 'זריחה', totals\.solar\.sunrise, true/.test(VIEW), 'sunrise is bidi-isolated');
ok(/'🌇', 'שקיעה', totals\.solar\.sunset, true/.test(VIEW), 'sunset is bidi-isolated');

// -- 8. Pace labels are complete --------------------------------------------
section('Every authored pace and bestFor tag has a label');
const paceKeys = (VIEW.match(/const GT_PACE = \{[\s\S]*?\n\};/) || [''])[0];
const bestForKeys = (VIEW.match(/const GT_BEST_FOR = \{[\s\S]*?\n\};/) || [''])[0];
let unlabelled = [];
DAYS.forEach(d => {
    if (paceKeys.indexOf(d.dayBrief.pace + ':') === -1) unlabelled.push(`pace ${d.key}=${d.dayBrief.pace}`);
    (d.dayBrief.bestFor || []).forEach(t => {
        if (bestForKeys.indexOf(t + ':') === -1) unlabelled.push(`bestFor ${d.key}=${t}`);
    });
});
ok(unlabelled.length === 0, 'no day uses a pace or bestFor tag the renderer cannot label' + (unlabelled.length ? ' — ' + unlabelled.join(', ') : ''));

console.log(`\n=== test-itinerary-brief.js: ${failures ? 'FAIL' : 'PASS'} (${failures} failure(s), ${checks} checks) ===`);
process.exit(failures ? 1 : 0);
