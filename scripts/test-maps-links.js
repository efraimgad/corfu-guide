// Regression test for pre-launch audit HIGH H1.
//
// THE BUG: rebuildMapsUrl() (scripts/apply-verified-places.js) demanded >= 4
// decimal places before it would navigate by coordinate, and fell back to a
// free-text Google Maps query otherwise. That inverted the guard's purpose —
// it discarded a known point in favour of a string whose resolution is
// entirely up to Google's index.
//
// 87 of 169 records (51.5%) took that branch, every one holding a valid,
// in-bounds coordinate. The text it fell back to is a HEBREW name plus
// "Corfu" — e.g. "הטברנה של מרינה Corfu" for a small Greek taverna. Google is
// unlikely to hold a Hebrew name for such a place at all, so the query can
// resolve to nothing, or somewhere else entirely, while the correct location
// sat unused in the record.
//
// A traveller taps that link to drive somewhere. This test asserts every
// record navigates to its OWN coordinate, and that the coordinate is inside
// Corfu.
//
// NOTE ON SCOPE: this checks the URLs the app ships, not whether Google
// resolves them — external link liveness is not reachable from CI here. See
// _audit/PRELAUNCH.md's coverage table for the command to check liveness.
//
// Usage: node scripts/test-maps-links.js
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;
const ok = l => { checks++; console.log('OK:   ' + l); };
const fail = (l, d) => { checks++; failures++; console.log('FAIL: ' + l + (d ? '\n        ' + d : '')); };

// Corfu bounding box, same figures the audit used.
const LAT = [39.35, 39.85];
const LON = [19.62, 20.12];

const ctx = { window: {}, document: { addEventListener() {}, currentScript: null } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'locations-data.js'), 'utf8'), ctx);
const L = ctx.window.CORFU_LOCATIONS;

let total = 0;
const noUrl = [], textSearch = [], mismatch = [], outOfBox = [], noCoords = [];

for (const cat of Object.keys(L)) {
    for (const rec of L[cat]) {
        total++;
        const url = rec.mapsUrl || '';
        if (!url) { noUrl.push(rec.id); continue; }

        const hasCoords = typeof rec.lat === 'number' && typeof rec.lon === 'number';
        if (!hasCoords) { noCoords.push(rec.id); continue; }

        const m = decodeURIComponent(url).match(/query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
        if (!m) {
            // A record that HAS a coordinate must not navigate by name.
            textSearch.push(rec.id + ' -> ' + decodeURIComponent(url).slice(0, 70));
            continue;
        }
        const la = Number(m[1]), lo = Number(m[2]);
        if (la !== rec.lat || lo !== rec.lon) {
            mismatch.push(`${rec.id}: url ${la},${lo} vs record ${rec.lat},${rec.lon}`);
        }
        if (la < LAT[0] || la > LAT[1] || lo < LON[0] || lo > LON[1]) {
            outOfBox.push(`${rec.id}: ${la},${lo}`);
        }
    }
}

console.log('--- Every record with a coordinate must navigate BY that coordinate ---');
if (total === 0) fail('no records loaded — the scanner is broken, not the data');
else ok('scanned ' + total + ' records');

if (noUrl.length === 0) ok('every record has a mapsUrl');
else fail(noUrl.length + ' records have no mapsUrl', noUrl.slice(0, 5).join(', '));

if (textSearch.length === 0) {
    ok('0 records fall back to a name text-search while holding a coordinate');
} else {
    fail(textSearch.length + ' records navigate by NAME despite having a coordinate — '
        + 'H1 has regressed; a Hebrew name may not resolve to the right place, or to any place',
        textSearch.slice(0, 5).join('\n        '));
}

if (mismatch.length === 0) ok("every coordinate URL matches its own record's lat/lon");
else fail(mismatch.length + ' URLs point somewhere other than their record', mismatch.slice(0, 5).join('\n        '));

if (outOfBox.length === 0) ok('every coordinate URL is inside the Corfu bounding box');
else fail(outOfBox.length + ' URLs point outside Corfu', outOfBox.slice(0, 5).join('\n        '));

if (noCoords.length) console.log('NOTE: ' + noCoords.length + ' record(s) have no coordinate at all (name search is legitimate there): ' + noCoords.slice(0, 5).join(', '));

// --- The generator must not reintroduce the inverted guard ------------------
console.log('\n--- The generator prefers a coordinate over a name ---');
const gen = fs.readFileSync(path.join(ROOT, 'scripts', 'apply-verified-places.js'), 'utf8');
const fn = gen.slice(gen.indexOf('function rebuildMapsUrl'));
const body = fn.slice(0, fn.indexOf('\n}\n') + 1);
if (!body) {
    fail('could not find rebuildMapsUrl() — scanner broken, do not treat as a pass');
} else {
    // The precision test may still exist (it flags records for verification),
    // but it must not be what decides between coordinate and text.
    const guardsUrl = /hasPreciseCoords\s*\)\s*\{\s*return/.test(body.replace(/\s+/g, ' '));
    if (guardsUrl) fail('precision still gates the URL form — a coarse coordinate would fall back to a name search');
    else ok('coordinate precision no longer decides the URL form');
    if (/if\s*\(\s*hasCoords\s*\)/.test(body)) ok('any usable coordinate produces a coordinate URL');
    else fail('no `if (hasCoords)` branch found in rebuildMapsUrl()');
}

console.log(`\n=== test-maps-links.js: ${failures ? 'FAIL' : 'PASS'} (${failures} failure(s), ${checks} checks) ===`);
process.exit(failures ? 1 : 0);
