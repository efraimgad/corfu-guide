// Loads the real index.html into jsdom with scripts actually executing,
// switches every tab so all renderers run, and asserts the trust/honesty
// invariants this pass is supposed to guarantee.
//
// Usage: node scripts/smoke-test.js
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');

// Same load order as index.html's own <script> tags (js/trip-private.js is
// intentionally untracked/optional - missing it must not break the test).
const SCRIPT_ORDER = [
    'js/locations-data.js',
    'js/cards.js',
    'js/search.js',
    'js/filters.js',
    'js/favorites.js',
    'js/notes-favorites.js',
    'js/itinerary.js',
    'js/reservations.js',
    'js/packing.js',
    'js/trip-private.js',
    'js/dashboard.js',
    'js/map.js',
    'js/tools.js',
    'js/ui.js',
    'js/init.js',
    'js/supabase-config.js',
    'js/database.js',
    'js/storage.js',
    'js/sync.js'
];

const TABS = ['about', 'itinerary', 'beaches', 'food', 'attractions', 'gems', 'activities', 'shopping', 'faq'];

const errors = [];
const failures = [];
function fail(msg) {
    failures.push(msg);
    console.error('FAIL:', msg);
}
function ok(msg) {
    console.log('OK:  ', msg);
}

async function main() {
    const html = fs.readFileSync(INDEX_PATH, 'utf8');
    const dom = new JSDOM(html, {
        url: 'http://localhost/index.html',
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        beforeParse(window) {
            window.console.error = (...args) => {
                errors.push(args.map(String).join(' '));
            };
            window.addEventListener('error', (e) => {
                errors.push(String(e.error && e.error.stack || e.message));
            });
            // jsdom has no real navigation/CSS engine for Google Fonts, and no
            // fetch backend here - not part of what we're testing.
            window.fetch = () => Promise.reject(new Error('network disabled in smoke test'));
        }
    });

    const { window } = dom;
    const { document } = window;

    for (const rel of SCRIPT_ORDER) {
        const abs = path.join(ROOT, rel);
        if (!fs.existsSync(abs)) continue; // js/trip-private.js may legitimately be absent
        const el = document.createElement('script');
        el.textContent = fs.readFileSync(abs, 'utf8');
        document.body.appendChild(el);
    }

    document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true, cancelable: true }));

    // Give any microtask-queued init code (e.g. initCloudSync's early return)
    // a tick to settle before we start asserting.
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (typeof window.switchTab !== 'function') {
        fail('window.switchTab is not defined - cannot exercise tab renderers');
    } else {
        for (const tab of TABS) {
            try {
                window.switchTab(tab, true);
            } catch (e) {
                fail(`switchTab('${tab}') threw: ${e.stack || e.message}`);
            }
        }
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    // --- Assertions ----------------------------------------------------------

    if (errors.length === 0) {
        ok('zero console errors / thrown exceptions during load and tab-switching');
    } else {
        errors.forEach((e) => fail('console error / exception: ' + e));
    }

    const html2 = document.documentElement.outerHTML;

    const exampleComLinks = document.querySelectorAll('a[href*="example.com"]');
    if (exampleComLinks.length === 0) ok('zero example.com links in the rendered DOM');
    else fail(`${exampleComLinks.length} example.com link(s) still present`);

    const loremflickrImgs = document.querySelectorAll('img[src*="loremflickr"]');
    if (loremflickrImgs.length === 0) ok('zero loremflickr image sources in the rendered DOM');
    else fail(`${loremflickrImgs.length} loremflickr image(s) still present`);

    const legacyMapsLinks = document.querySelectorAll('a[href*="maps.google.com/?q="]');
    if (legacyMapsLinks.length === 0) ok('zero maps.google.com/?q= links in the rendered DOM');
    else fail(`${legacyMapsLinks.length} legacy maps.google.com/?q= link(s) still present`);

    const imgs = Array.from(document.querySelectorAll('img[src^="images/"]'));
    const missingImages = imgs.filter((img) => !fs.existsSync(path.join(ROOT, decodeURIComponent(img.getAttribute('src')))));
    if (missingImages.length === 0) ok(`all ${imgs.length} local images/... <img src> paths exist on disk`);
    else missingImages.forEach((img) => fail(`missing image on disk: ${img.getAttribute('src')}`));

    const allImgs = Array.from(document.querySelectorAll('img'));
    const emptyAlt = allImgs.filter((img) => !img.getAttribute('alt') || !img.getAttribute('alt').trim());
    if (emptyAlt.length === 0) ok(`all ${allImgs.length} <img> elements have non-empty alt`);
    else fail(`${emptyAlt.length} <img> element(s) with empty/missing alt`);

    const placeIdLinkCount = document.querySelectorAll('a[href*="query_place_id="]').length;
    console.log(`INFO: links containing query_place_id= : ${placeIdLinkCount} (expected ~31)`);

    const telLinkCount = document.querySelectorAll('a[href^="tel:"]').length;
    console.log(`INFO: tel: links : ${telLinkCount} (expected ~27)`);

    if (window.SUPABASE_ENABLED === false) ok('window.SUPABASE_ENABLED is false with placeholder credentials');
    else fail(`window.SUPABASE_ENABLED is ${window.SUPABASE_ENABLED}, expected false`);

    const indicator = document.getElementById('sync-status-indicator');
    if (indicator && indicator.hidden === true) ok('#sync-status-indicator.hidden is true when Supabase is disabled');
    else fail(`#sync-status-indicator.hidden is ${indicator && indicator.hidden}, expected true`);

    const supabaseScripts = Array.from(document.querySelectorAll('script[src*="supabase-js"]'));
    if (supabaseScripts.length === 0) ok('zero <script> tags referencing supabase-js in the rendered DOM');
    else fail(`${supabaseScripts.length} <script> tag(s) referencing supabase-js found`);

    console.log('');
    console.log(`=== smoke-test.js: ${failures.length === 0 ? 'PASS' : 'FAIL'} (${failures.length} failure(s)) ===`);
    if (failures.length > 0) process.exitCode = 1;

    // jsdom's window (e.g. dashboard.js's setInterval) keeps the event loop
    // alive forever otherwise - close it explicitly once we're done asserting.
    window.close();
}

main().catch((e) => {
    console.error('smoke-test.js crashed:', e.stack || e.message);
    process.exitCode = 1;
});
