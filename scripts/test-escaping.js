// Regression test for the two stored-XSS blockers (pre-launch audit B2/B3)
// and the escaping primitive underneath them.
//
// THREAT MODEL: everything in localStorage is attacker-reachable — a shared or
// family device, a browser extension, or a payload synced from another
// session. The app read those values back and interpolated them into markup.
//
// B2 (js/notes-favorites.js): a saved `rating` went into an aria-label with no
//    escaping at all, so `1" onmouseover="…` became a real event handler and
//    ran on hover.
// B3 (js/reservations.js): a reservation `id` went into
//    onclick="openReservationForm('…')" — a single-quoted JS string nested in a
//    double-quoted attribute. escapeAttr() escaped & and " but not ', so the
//    id closed the string and the rest was compiled as JavaScript, executing
//    when the traveller tapped edit or delete on their own reservation.
//
// Both are fixed at two levels, and this file asserts BOTH, because either
// alone leaves the class open:
//   1. escapeAttr() escapes ' — closes every current and future call site.
//   2. Values are normalised at the localStorage read boundary — a rating is
//      an integer 1-5 or nothing; a reservation id matches the app's own shape
//      or is regenerated.
//
// Usage: node scripts/test-escaping.js
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;
const ok = l => { checks++; console.log('OK:   ' + l); };
const fail = (l, d) => { checks++; failures++; console.log('FAIL: ' + l + (d ? '\n        ' + d : '')); };
function eq(actual, expected, l) {
    if (actual === expected) ok(l + ' (' + JSON.stringify(actual) + ')');
    else fail(l, 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}
// Evaluate in page scope, reporting a throw as a value rather than
// propagating it. A missing identifier is exactly the regression this file
// exists to catch, so it must be REPORTED, not allowed to abort the run and
// hide every later assertion.
function ev(win, code) {
    try { return win.eval(code); }
    catch (e) { return '<<threw: ' + e.message + '>>'; }
}

const load = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const dom = new JSDOM('<!doctype html><body>', { runScripts: 'outside-only', url: 'http://localhost/' });
const win = dom.window;
win.eval(load('js/html-utils.js'));

// --- 1. escapeAttr must neutralise the quote that made B3 work -------------
console.log('--- escapeAttr() ---');
const ea = s => ev(win, 'escapeAttr(' + JSON.stringify(s) + ')');
eq(ea("it's"), 'it&#39;s', "escapes the single quote");
eq(ea('"q"'), '&quot;q&quot;', 'escapes the double quote');
eq(ea('&'), '&amp;', 'escapes the ampersand');
eq(ea('&<>'), '&amp;<>', 'leaves < > alone (harmless inside a quoted attribute)');
eq(ea(null), '', 'null -> empty string');
eq(ea(undefined), '', 'undefined -> empty string');
eq(ea(123), '123', 'numbers coerce');
// The exact B3 payload must no longer be able to close the JS string.
const payload = "x'); window.__pwned = document.domain; //";
const escaped = ea(payload);
if (!/'/.test(escaped)) ok('the B3 payload contains no raw quote after escaping');
else fail('the B3 payload still contains a raw single quote', escaped);
// & must be escaped FIRST, or the entities above get double-escaped.
eq(ea("&'"), '&amp;&#39;', 'ampersand escaped first (no double-escaping)');

console.log('\n--- escapeHtml() ---');
const eh = s => ev(win, 'escapeHtml(' + JSON.stringify(s) + ')');
eq(eh('&<>'), '&amp;&lt;&gt;', 'escapes & < > in that order');
eq(eh('<script>x</script>'), '&lt;script&gt;x&lt;/script&gt;', 'neutralises a script tag');
eq(eh(null), '', 'null -> empty string');

// --- 2. Item-state normalisation (B2 root cause) ---------------------------
console.log('\n--- normalizeItemState(): a rating is an integer 1-5 or nothing ---');
const w2 = new JSDOM('<!doctype html><body>', { runScripts: 'outside-only', url: 'http://localhost/' }).window;
ev(w2, load('js/storage.js'));
const norm = v => ev(w2, 'normalizeItemState(' + JSON.stringify({ rating: v }) + ').rating');
eq(norm('1" onmouseover="window.__pwned2=true" data-x="'), null, 'the B2 payload is rejected');
eq(norm('<img src=x onerror=alert(1)>'), null, 'an HTML payload is rejected');
eq(norm(4), 4, 'a legitimate rating survives');
eq(norm('3'), 3, 'a numeric string coerces');
eq(norm(0), null, '0 is out of range');
eq(norm(6), null, '6 is out of range');
eq(norm(2.5), null, 'a non-integer is rejected');
eq(norm(null), null, 'null stays null');
eq(ev(w2, 'normalizeItemState(null).is_visited'), false, 'a null record yields the declared shape');
eq(ev(w2, 'normalizeItemState({note: 42}).note'), '', 'a non-string note is rejected');

// --- 3. Reservation id normalisation (B3 root cause) -----------------------
console.log('\n--- getReservations(): a malformed id is regenerated, not round-tripped ---');
const w3 = new JSDOM('<!doctype html><body>', { runScripts: 'outside-only', url: 'http://localhost/' }).window;
ev(w3, load('js/html-utils.js') + '\n;\n' + load('js/reservations.js'));
w3.localStorage.setItem('corfu-guide-reservations', JSON.stringify([
    { id: payload, place: 'Evil', partySize: 2 },
    { id: 'res-1750000000000-abc12', place: 'Legit', partySize: 2 },
]));
const list = ev(w3, 'JSON.stringify(getReservations())');
let parsed; try { parsed = JSON.parse(list); } catch (e) { parsed = []; fail('getReservations() did not return usable JSON', String(list).slice(0,120)); }
eq(parsed.length, 2, 'both records survive (malformed ids are repaired, not dropped)');
if (parsed[0].id !== payload) ok('the crafted id was replaced (' + parsed[0].id + ')');
else fail('the crafted id round-tripped into the app unchanged');
if (/^res-\d+-[a-z0-9]+$/.test(parsed[0].id)) ok('the replacement matches the app id shape');
else fail('the replacement is not a valid app id', parsed[0].id);
eq(parsed[1].id, 'res-1750000000000-abc12', 'a legitimate id is left untouched');
eq(parsed[0].place, 'Evil', 'the rest of the record is preserved');

// --- 4. The rendered attribute cannot break out ----------------------------
console.log('\n--- end to end: the rendered onclick attribute ---');
const rendered = ev(w3, 
    `"onclick=\\"openReservationForm('" + escapeAttr(${JSON.stringify(payload)}) + "')\\""`);
if (!/openReservationForm\('x'\)/.test(rendered)) ok('the JS string is not terminated early');
else fail('the payload still closes the JS string', rendered);
if (rendered.indexOf('window.__pwned') === -1 || !/'\);/.test(rendered)) ok('no executable breakout in the rendered attribute');
else fail('rendered attribute still contains a breakout', rendered);

console.log(`\n=== test-escaping.js: ${failures ? 'FAIL' : 'PASS'} (${failures} failure(s), ${checks} checks) ===`);
process.exit(failures ? 1 : 0);
