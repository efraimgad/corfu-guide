// Asserts sw.js's APP_SHELL list matches what index.html actually loads.
//
// This is the THIRD time in this project a hand-maintained duplicate of
// index.html's own asset list has silently drifted: first the original
// audit's 10-file gap (js/itinerary-data.js and 9 others were never
// precached, discovered only by manually diffing at the start of Phase E),
// then smoke-test.js's hardcoded SCRIPT_ORDER (fixed in Phase C1 by deriving
// it from index.html instead), then test-explore-map-sync.js (same fix).
// APP_SHELL was the one duplicate list that fix was never applied to.
//
// The stakes here are the highest of the three: a missing smoke-test entry
// throws a loud ReferenceError in CI. A missing APP_SHELL entry throws
// nothing, anywhere - it fails silently in the field, only on a phone that
// lost signal before that one file's opportunistic cache hit ever happened.
// That is precisely the failure mode Phase E exists to close.
//
// Usage: node scripts/test-app-shell.js
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;
const ok = (l) => { checks++; console.log('OK:   ' + l); };
const fail = (l, d) => { checks++; failures++; console.log('FAIL: ' + l + (d ? '\n        ' + d : '')); };

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

// Real local assets index.html asks the browser to load: <script src=...> and
// <link ... href=...css...>. External (http/https) URLs are handled
// separately below, since APP_SHELL legitimately lists one (the Google Fonts
// stylesheet) and that is not a same-origin file to check for on disk.
const scriptSrcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
const cssHrefs = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"/g)].map(m => m[1]);
const localAssets = [...scriptSrcs, ...cssHrefs]
    .filter(s => !/^https?:/.test(s))
    .map(s => s.replace(/^\.\//, ''));

// js/trip-private.js is loaded by index.html but intentionally untracked
// (gitignored personal data) - it may legitimately not exist on disk in this
// checkout. Its presence in index.html's <script> tags is still what counts;
// only the on-disk existence check is skipped for it.
const OPTIONAL_UNTRACKED = ['js/trip-private.js'];

// Scoped to the APP_SHELL array literal specifically. A blanket regex over
// the whole file (an earlier draft of this test) also matched quoted strings
// in comments and later code (e.g. isThirdPartyImage's hostname literals),
// producing false "extra in APP_SHELL" failures that had nothing to do with
// precaching.
const arrayMatch = sw.match(/const APP_SHELL = \[([\s\S]*?)\];/);
if (!arrayMatch) throw new Error('test-app-shell.js: could not locate the APP_SHELL array in sw.js');
// Comments stripped before matching quotes. This bit twice during Phase E:
// a `//` comment containing a possessive apostrophe ("map.js's") reads to a
// naive quote-counting regex as an unterminated string, corrupting every
// entry after it. Rather than rely on future comments avoiding apostrophes,
// the extraction ignores comment lines entirely.
const arrayNoComments = arrayMatch[1].replace(/^\s*\/\/.*$/gm, '');
const shellEntries = [...arrayNoComments.matchAll(/'([^']+)'/g)].map(m => m[1]);

console.log('--- Every local asset index.html loads must be in APP_SHELL ---');
const missing = localAssets.filter(a => !shellEntries.includes(a));
if (!missing.length) ok(`all ${localAssets.length} local script/css assets are in APP_SHELL`);
else fail('missing from APP_SHELL', missing.join('\n        '));

console.log('\n--- APP_SHELL must not list files that no longer exist ---');
const stale = shellEntries.filter(e =>
    /^(js|css|images)\//.test(e) &&
    !OPTIONAL_UNTRACKED.includes(e) &&
    !fs.existsSync(path.join(ROOT, e))
);
if (!stale.length) ok('no stale APP_SHELL entries pointing at deleted files');
else fail('APP_SHELL lists deleted/missing files', stale.join('\n        '));

console.log('\n--- APP_SHELL must not silently miss a real file it references ---');
const scriptsOnly = localAssets.filter(a => a.endsWith('.js'));
// Only LOCAL .js entries are compared against index.html's <script> tags.
// Leaflet's two CDN .js files are legitimate APP_SHELL entries with no
// corresponding local <script src> - they are lazy-loaded at runtime by
// js/map.js's loadLeafletThen(), not statically tagged in index.html - so
// comparing them here would be a false positive, not a real gap.
const shellScripts = shellEntries.filter(e => e.endsWith('.js') && !/^https?:/.test(e));
const extraInShell = shellScripts.filter(e => !scriptsOnly.includes(e) && !OPTIONAL_UNTRACKED.includes(e));
if (!extraInShell.length) ok('every local JS file in APP_SHELL is actually loaded by index.html');
else fail('APP_SHELL has JS entries index.html does not load', extraInShell.join('\n        '));

console.log('\n--- Leaflet is precached, not just lazy-load-cached on first use ---');
// The map library is lazy-loaded from cdnjs (js/map.js loadLeafletThen()) to
// avoid blocking every page view on a library most visits never touch. Left
// alone, that means a map opened OFFLINE for the very first time - no prior
// online visit to have primed the cache - gets nothing at all: not a stale
// map, no map. Precaching these five URLs in APP_SHELL closes that gap by
// forcing the first successful fetch to happen at install() time, which by
// definition occurs online.
const leafletSrc = fs.readFileSync(path.join(ROOT, 'js/map.js'), 'utf8');
const cdnUrls = [...leafletSrc.matchAll(/'(https:\/\/cdnjs\.cloudflare\.com\/[^']+)'/g)].map(m => m[1]);
if (cdnUrls.length >= 5) ok(`found ${cdnUrls.length} Leaflet CDN URLs referenced in js/map.js`);
else fail('Leaflet CDN URLs', `expected at least 5 in js/map.js, found ${cdnUrls.length} - has loadLeafletThen() changed?`);
const notPrecached = cdnUrls.filter(u => !shellEntries.includes(u));
if (!notPrecached.length) ok('every Leaflet CDN URL js/map.js requests is precached in APP_SHELL');
else fail('Leaflet not precached', notPrecached.join('\n        '));

console.log('\n--- The one intentional external entry is still there ---');
if (shellEntries.some(e => /fonts\.googleapis\.com/.test(e))) ok('Google Fonts stylesheet is precached');
else fail('fonts', 'expected the Google Fonts URL in APP_SHELL');

console.log('\n--- install() must not let one bad URL sink the whole precache ---');
// This is what makes listing an untracked optional file (trip-private.js)
// safe in the first place - a 404 for it must not prevent every other file
// from being cached. Regression-checked here rather than assumed.
if (/cache\.add\(url\)\.catch/.test(sw)) ok('per-URL cache.add().catch() - one 404 cannot sink the precache');
else fail('install() resilience', 'expected per-URL error handling around cache.add(), found something else');

console.log(`\n=== test-app-shell.js: ${failures ? 'FAIL' : 'PASS'} (${checks - failures}/${checks} checks) ===`);
process.exit(failures ? 1 : 0);
