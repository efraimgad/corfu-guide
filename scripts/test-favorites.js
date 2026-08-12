// Regression test for the favourites feature (pre-launch audit BLOCKER B1).
//
// THE BUG THIS LOCKS DOWN: viewFavorites() (js/dashboard.js) and
// toggleFavorite() (js/favorites.js) both referenced four functions —
// filterBeaches / filterFood / filterAttractions / filterGems — that were
// deleted along with the four legacy category tabs in Phase C2. Both sites
// held them as BARE IDENTIFIERS inside an object/array literal, so every call
// threw a ReferenceError:
//   - "צפו במועדפים ←" on the dashboard did nothing at all, silently.
//   - every heart tap threw, AFTER the favourite had already been saved,
//     which is exactly why it never looked broken.
//
// Nothing in the suite touched localStorage, so nothing caught it. That gap is
// the real root cause, and this file starts closing it.
//
// The second, subtler half: favourites are an ACTIVITIES-tab feature and only
// ever that. The only [data-id] elements in the document are the 14
// <article data-id="activity-N"> cards, they are the only cards with a
// .favorite-btn, and window.CORFU_LOCATIONS holds zero `activity-*` ids. So
// viewFavorites()'s old beach-/food-/attr-/gem- prefix tally could never match
// anything either. A fix that pointed the button at Explore would look correct
// and still show an permanently empty list — so this test asserts the
// DESTINATION, not just the absence of a throw.
//
// Usage: node scripts/test-favorites.js
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;

function ok(l) { checks++; console.log('OK:   ' + l); }
function fail(l, d) { checks++; failures++; console.log('FAIL: ' + l + (d ? '\n        ' + d : '')); }
function eq(actual, expected, l) {
    if (actual === expected) ok(l + ' (' + JSON.stringify(actual) + ')');
    else fail(l, 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}
// Evaluate in page scope, returning the thrown message instead of propagating.
// Without this the whole file aborts on the first missing identifier, which is
// precisely the state this test exists to detect — it must REPORT that, not
// crash on it.
function tryEval(win, code) {
    try { return { value: win.eval(code), error: null }; }
    catch (e) { return { value: undefined, error: e.message }; }
}

// --- 1. Static: the deleted identifiers must not come back -------------------
console.log('--- No live references to the Phase C2 deleted filter functions ---');
const DELETED = ['filterBeaches', 'filterFood', 'filterAttractions', 'filterGems'];
const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'));
let liveRefs = [];
for (const f of jsFiles) {
    const src = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
    src.split('\n').forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, '');          // ignore line comments
        if (/^\s*\*/.test(line) || /^\s*\/\*/.test(line)) return; // block-comment bodies
        for (const name of DELETED) {
            if (new RegExp('\\b' + name + '\\b').test(code)) {
                liveRefs.push(`js/${f}:${i + 1}  ${line.trim().slice(0, 80)}`);
            }
        }
    });
}
if (liveRefs.length === 0) ok('0 live references to ' + DELETED.join('/'));
else fail('deleted filter functions still referenced in code', liveRefs.join('\n        '));

// --- 2. The favouritable set is exactly the activity cards ------------------
console.log('\n--- Favourites are an Activities-tab feature ---');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
const win = dom.window;
const doc = win.document;

const dataIdEls = Array.from(doc.querySelectorAll('[data-id]'));
const nonActivity = dataIdEls.filter(e => !/^activity-/.test(e.getAttribute('data-id')));
eq(nonActivity.length, 0, 'every [data-id] card is an activity-* card');
if (dataIdEls.length === 0) fail('expected some [data-id] activity cards, found none');
else ok('favouritable cards found (' + dataIdEls.length + ')');

const heartsOutsideActivities = Array.from(doc.querySelectorAll('.favorite-btn'))
    .filter(b => !b.closest('#activities-grid'));
eq(heartsOutsideActivities.length, 0, 'every .favorite-btn lives inside #activities-grid');

// --- 3. Runtime: the two previously-throwing paths ---------------------------
console.log('\n--- viewFavorites() and toggleFavorite() must not throw ---');
// jsdom supplies a real localStorage once the DOM has a url — it is a
// getter-only property, so it must be used, not replaced.
win.localStorage.clear();
win.IntersectionObserver = function () { return { observe() {}, disconnect() {}, unobserve() {} }; };
win.matchMedia = win.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
win.scrollTo = () => {};
win.requestAnimationFrame = cb => cb();
Object.defineProperty(win.HTMLElement.prototype, 'scrollIntoView', { value() {}, writable: true });

// dashboard.js is loaded too because toggleFavorite() calls its
// updateDashFavCount(); in the browser both are plain <script defer> sharing
// one global scope (index.html loads favorites.js then dashboard.js), so
// evaluating them together reproduces the real environment rather than a
// stubbed approximation.
win.fetch = () => new Promise(() => {});   // dashboard's weather call: never settles, never throws
// favorites.js/dashboard.js both read window.DESTINATION (storage-key
// namespacing, TRIP_CONFIG/timezone, weather coords) at their own top level,
// so the destination-data bootstrap chain has to be evaluated first, same
// as index.html's real script order.
win.eval(
    [
        'js/html-utils.js',
        'js/locations-data.js',
        'js/itinerary-data.js',
        'data/destinations/corfu.js',
        'js/testdest-locations.js',
        'js/testdest-itinerary.js',
        'data/destinations/testdest.js',
        'js/destination-registry.js',
        'js/favorites.js',
        'js/dashboard.js'
    ]
        .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n')
);

const grid = doc.getElementById('activities-grid');
const cards = Array.from(grid.querySelectorAll('article[data-id]'));
const firstId = cards[0].getAttribute('data-id');

// Save one favourite through the real toggle path (this is what used to throw).
const TOGGLE_FIRST = `toggleFavorite(document.querySelector('#activities-grid article[data-id] .favorite-btn'))`;
eq(tryEval(win, TOGGLE_FIRST).error, null, 'toggleFavorite() does not throw');
eq(JSON.parse(win.localStorage.getItem('corfu-guide-favorites:corfu') || '[]')[0], firstId, 'favourite persisted to localStorage');

// Filter to favourites only.
const shownRes = tryEval(win, 'showActivityFavoritesOnly(true)');
eq(shownRes.error, null, 'showActivityFavoritesOnly() is defined and does not throw');
const shown = shownRes.value;
eq(shown, 1, 'favourites-only shows exactly the saved card');
const visible = cards.filter(c => c.style.display !== 'none').map(c => c.getAttribute('data-id'));
eq(visible.join(','), firstId, 'the visible card is the favourited one');
const bar = doc.getElementById('activity-fav-bar');
if (bar && bar.textContent.trim()) ok('status bar rendered with a way back out');
else fail('no status bar — a filtered view with no reset control is a trap');

// Unfavouriting while filtered must update the view live.
eq(tryEval(win, TOGGLE_FIRST).error, null, 'unfavouriting while filtered does not throw');
eq(cards.filter(c => c.style.display !== 'none').length, 0, 'unfavourited card disappears live');

// Reset restores everything and removes the bar.
tryEval(win, 'showActivityFavoritesOnly(false)');
eq(cards.filter(c => c.style.display !== 'none').length, cards.length, 'reset restores all activity cards');
eq(!!doc.getElementById('activity-fav-bar'), false, 'status bar removed when filter is off');

// --- 4. viewFavorites() targets Activities, not Explore ---------------------
console.log('\n--- viewFavorites() destination ---');
const dashSrc = fs.readFileSync(path.join(ROOT, 'js', 'dashboard.js'), 'utf8');
const fn = dashSrc.slice(dashSrc.indexOf('function viewFavorites'));
const body = fn.slice(0, fn.indexOf('\n}\n') + 1);
if (/switchTab\(\s*['"]activities['"]/.test(body)) ok("viewFavorites() switches to the 'activities' tab");
else fail("viewFavorites() must switch to 'activities' — favourites cannot appear anywhere else", body.slice(0, 200));
if (/showActivityFavoritesOnly\(\s*true\s*\)/.test(body)) ok('viewFavorites() applies the favourites-only filter');
else fail('viewFavorites() must filter to favourites, not just navigate');
if (/\bexplore\b/i.test(body)) fail('viewFavorites() must NOT target Explore — its rows carry no favourite button');
else ok('viewFavorites() does not target Explore');

console.log(`\n=== test-favorites.js: ${failures ? 'FAIL' : 'PASS'} (${failures} failure(s), ${checks} checks) ===`);
process.exit(failures ? 1 : 0);
