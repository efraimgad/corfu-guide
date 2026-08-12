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
const io_read = (p) => fs.readFileSync(p, 'utf8');

// Load order is READ FROM index.html rather than duplicated here.
//
// It used to be a hardcoded array, which silently went stale the moment
// Phase C1 added js/location-shared.js and js/faq-filters.js: index.html
// loaded them, this test did not, and every tab failed with
// "buildVerifiedInfoHTML is not defined" - a failure in the harness that
// looked exactly like a failure in the app. Deriving it from the real
// <script> tags means the two can no longer disagree.
//
// js/trip-private.js is intentionally untracked/optional - a missing file
// must not break the test (see the existsSync guard below).
const SCRIPT_ORDER = [...io_read(INDEX_PATH).matchAll(/<script[^>]+src="((?:js|data)\/[^"]+)"/g)].map(m => m[1]);
if (!SCRIPT_ORDER.length) throw new Error('smoke-test: found no js/ or data/ <script> tags in index.html');

const TABS = ['home', 'about', 'dashboard', 'itinerary', 'explore', 'beaches', 'food', 'attractions', 'gems', 'activities', 'trip-planning', 'health-safety', 'language-daily', 'faq', 'guide'];

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
    console.log(`INFO: tel: links : ${telLinkCount} (expected ~33)`);

    if (window.SUPABASE_ENABLED === false) ok('window.SUPABASE_ENABLED is false with placeholder credentials');
    else fail(`window.SUPABASE_ENABLED is ${window.SUPABASE_ENABLED}, expected false`);

    const indicator = document.getElementById('sync-status-indicator');
    if (indicator && indicator.hidden === true) ok('#sync-status-indicator.hidden is true when Supabase is disabled');
    else fail(`#sync-status-indicator.hidden is ${indicator && indicator.hidden}, expected true`);

    const supabaseScripts = Array.from(document.querySelectorAll('script[src*="supabase-js"]'));
    if (supabaseScripts.length === 0) ok('zero <script> tags referencing supabase-js in the rendered DOM');
    else fail(`${supabaseScripts.length} <script> tag(s) referencing supabase-js found`);

    // Rendered card counts must always match the real data array lengths -
    // this is what guards against stale hardcoded counts drifting from the
    // actual CORFU_LOCATIONS data ever again.
    const locations = window.CORFU_LOCATIONS || {};
    // Phase C2: the four legacy grids (#beaches-grid etc.) are gone with
    // their sections. The same coverage - "every record in CORFU_LOCATIONS
    // actually reaches the screen" - now applies to the Explore tab, which
    // renders one .gt-explore-row per record for the selected category.
    //
    // Explore lazy-renders in batches above EXPLORE_VIRTUALIZE_THRESHOLD, so
    // the DOM count can legitimately be lower than the record count for big
    // categories; the assertion is therefore "every record is reachable",
    // checked against the row set Explore builds, not a raw querySelectorAll.
    ['beaches', 'food', 'attractions', 'gems'].forEach((category) => {
        window.selectExploreCategory(category, null);
        const expected = (locations[category] || []).length;
        const built = window.buildExploreEntriesForTest
            ? window.buildExploreEntriesForTest(category).filter(e => e.type === 'row').length
            : document.querySelectorAll('#explore-list .gt-explore-row').length;
        if (built === expected) ok(`explore/${category}: ${built} rows match CORFU_LOCATIONS.${category}.length`);
        else fail(`explore/${category}: built ${built} row(s), but CORFU_LOCATIONS.${category}.length is ${expected}`);
    });

    // The legacy tab ids must still ROUTE (bookmarks, old links, the hash
    // router), even though their sections no longer exist.
    ['beaches', 'food', 'attractions', 'gems'].forEach((legacy) => {
        window.switchTab(legacy, true);
        // display is set synchronously; the .active class is added in a
        // 10ms setTimeout inside switchTab(), so asserting on it here would
        // be testing the timer, not the redirect.
        const explore = document.getElementById('explore');
        const legacySection = document.getElementById(legacy);
        if (!legacySection) ok(`#${legacy} section is gone`);
        else fail(`#${legacy} section still present after Phase C2`);
        if (explore && explore.style.display === 'block') ok(`switchTab('${legacy}') redirects to #explore`);
        else fail(`switchTab('${legacy}') did not land on #explore`);
    });

    const metaDescription = document.querySelector('meta[name="description"]');
    const metaContent = metaDescription ? metaDescription.getAttribute('content') : '';
    if (metaContent.includes('33')) fail(`meta description still contains a stale "33" count: "${metaContent}"`);
    else if (metaContent.includes(String((locations.gems || []).length))) {
        ok(`meta description contains the real gems count (${(locations.gems || []).length})`);
    } else {
        fail(`meta description does not mention the real gems count (${(locations.gems || []).length}): "${metaContent}"`);
    }

    // VALID_TAB_IDS (js/ui.js) and TABS (this file) are two independently
    // maintained lists of the same 12 tab ids - the IA restructure that
    // split "shopping" into trip-planning/health-safety/language-daily left
    // both in sync by hand, but nothing enforced that. Compare them by
    // extracting VALID_TAB_IDS straight from source (it's a top-level
    // const, not a window property, so it isn't reachable from here at
    // runtime) rather than trusting they'll always be edited together.
    const uiJsSrc = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf8');
    const validTabIdsMatch = uiJsSrc.match(/const VALID_TAB_IDS\s*=\s*\[([^\]]+)\]/);
    if (!validTabIdsMatch) {
        fail('could not find VALID_TAB_IDS in js/ui.js to compare against TABS');
    } else {
        const validTabIds = validTabIdsMatch[1].match(/'([^']+)'/g).map((s) => s.slice(1, -1));
        const a = [...validTabIds].sort();
        const b = [...TABS].sort();
        if (JSON.stringify(a) === JSON.stringify(b)) {
            ok(`VALID_TAB_IDS (js/ui.js) and TABS (this file) match: ${a.length} tab ids`);
        } else {
            fail(`VALID_TAB_IDS (js/ui.js) and TABS (this file) have drifted - js/ui.js: [${a.join(', ')}] vs smoke-test.js: [${b.join(', ')}]`);
        }
    }

    // Every venue the itinerary names via a data-*-id hook (dinner slots,
    // price-flag placeholders filled from the attraction record at load
    // time) must resolve to a real CORFU_LOCATIONS record - a typo'd id
    // here silently renders "טוען המלצה..." forever instead of failing loudly.
    //
    // These hooks live in window.ITINERARY_DAYS's item.html strings
    // (js/itinerary-data.js), not the DOM - since the day-scrubber view
    // (js/itinerary-view.js) only ever renders whichever single day/card
    // is currently selected, most days' hooks are never actually inserted
    // into the page at once, unlike the old always-in-DOM (just
    // CSS-hidden) accordion this replaced. Collecting them straight from
    // the data structure covers every day regardless of which one is
    // selected, and still verifies the fill functions
    // (fillItineraryDinnerHooks()/fillItineraryPriceFlags(), js/itinerary.js)
    // actually ran, since a hook whose venue lookup fails leaves its
    // data-*-id attribute in place with no id ever removed.
    function collectItineraryHookIds(attrName) {
        const ids = [];
        (window.ITINERARY_DAYS || []).forEach((day) => {
            (day.items || []).forEach((item) => {
                const container = document.createElement('div');
                container.innerHTML = item.html || '';
                container.querySelectorAll(`[${attrName}]`).forEach((el) => ids.push(el.getAttribute(attrName)));
            });
        });
        return ids;
    }

    const dinnerHookIds = collectItineraryHookIds('data-dinner-food-id');
    if (dinnerHookIds.length === 0) {
        fail('no data-dinner-food-id dinner hooks found in window.ITINERARY_DAYS');
    } else {
        const foodIds = new Set((locations.food || []).map((d) => d.id));
        const badDinnerHooks = dinnerHookIds.filter((id) => !foodIds.has(id));
        if (badDinnerHooks.length === 0) {
            ok(`all ${dinnerHookIds.length} data-dinner-food-id hooks resolve to a real CORFU_LOCATIONS.food record`);
        } else {
            badDinnerHooks.forEach((id) => fail(`data-dinner-food-id="${id}" does not match any CORFU_LOCATIONS.food id`));
        }
    }

    const priceFlagHookIds = collectItineraryHookIds('data-price-flag-id');
    if (priceFlagHookIds.length === 0) {
        fail('no data-price-flag-id hooks found in window.ITINERARY_DAYS');
    } else {
        const attractionIds = new Set((locations.attractions || []).map((d) => d.id));
        const badPriceHooks = priceFlagHookIds.filter((id) => !attractionIds.has(id));
        if (badPriceHooks.length === 0) {
            ok(`all ${priceFlagHookIds.length} data-price-flag-id hooks resolve to a real CORFU_LOCATIONS.attractions record`);
        } else {
            badPriceHooks.forEach((id) => fail(`data-price-flag-id="${id}" does not match any CORFU_LOCATIONS.attractions id`));
        }
    }

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
