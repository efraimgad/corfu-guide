// Regression test for Bug 1 (P0.1): extractLocationNameVariants() in
// js/itinerary.js used to be end-anchored ("^(.*?)\s*\(([^)]+)\)\s*$"),
// which never matched attraction titles - every one of them is stored as
// "<ordinal>. <name> <emoji>" (e.g. "10. המבצר הישן (Palaio Frourio) 🏰"),
// so the trailing emoji broke the end-anchor and 0 of 37 attractions ever
// pinned on any day's map.
//
// This loads the real index.html + real JS (same pattern as
// scripts/smoke-test.js - no reimplementation of the matching logic) and
// asserts that window.getDayLocationMatches(day), for every day 2-6,
// actually finds the attraction(s) genuinely named in that day's own
// itinerary prose (#day-N-body textContent), verified by hand against both
// the real HTML text and the real attraction titles in
// js/locations-data.js.
//
// Usage: node scripts/test-day-map-matching.js
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');

const SCRIPT_ORDER = [
    'js/html-utils.js',
    'js/locations-data.js',
    'js/location-shared.js',
    'js/search.js',
    'js/filters.js',
    'js/favorites.js',
    'js/notes-favorites.js',
    'js/itinerary-data.js',
    'js/itinerary.js',
    'js/itinerary-view.js',
    'js/reservations.js',
    'js/packing.js',
    'js/trip-private.js',
    'js/dashboard.js',
    'js/map.js',
    'js/explore.js',
    'js/tools.js',
    'js/ui.js',
    'js/init.js',
    'js/app-shell.js',
    'js/supabase-config.js',
    'js/database.js',
    'js/storage.js',
    'js/sync.js'
];

const failures = [];
function fail(msg) {
    failures.push(msg);
    console.error('FAIL:', msg);
}
function ok(msg) {
    console.log('OK:  ', msg);
}

// Per-day attractions that must be found, hand-verified against the real
// Day-N prose in index.html's #itinerary section and the real attraction
// titles in js/locations-data.js (after stripping the leading "N. " ordinal
// and trailing emoji). Each entry's phrase is the exact substring expected
// to appear in the day's own text - documented so a future content edit
// that breaks the match fails loudly and explains why.
const EXPECTED_ATTRACTIONS = {
    2: [
        // Day 2 heading: "🏰 המבצר הישן (Palaio Frourio)" - verbatim match
        // of attr-10's cleaned title "המבצר הישן (Palaio Frourio)".
        { id: 'attr-10', because: 'heading "המבצר הישן (Palaio Frourio)" (09:30-12:00 slot)' }
    ],
    3: [
        // Day 3 heading: "🏖️ נסיעה וטבילת בוקר בחוף ברבטי (Barbati)" -
        // verbatim match of attr-39's cleaned title "חוף ברבאטי (Barbati)"
        // via its English half "Barbati".
        { id: 'attr-39', because: '"בחוף ברבטי (Barbati)" (09:00-11:30 slot) matches via the "Barbati" variant' }
    ],
    4: [
        // Day 4 heading: "⛪ מנזר פלאוקסטריצה (Paleokastritsa Monastery)" -
        // verbatim match of attr-3's cleaned title "מנזר פלאוקסטריצה".
        { id: 'attr-3', because: 'heading "מנזר פלאוקסטריצה (Paleokastritsa Monastery)" (08:30-10:30 slot)' },
        // Day 4 heading: "🏰 ארוחת צהריים ומבצר אנגלוקסטרו (Angelokastro)" -
        // verbatim match of attr-5's cleaned title "מבצר אנגלוקסטרו".
        { id: 'attr-5', because: 'heading "מבצר אנגלוקסטרו (Angelokastro)" (14:00-17:00 slot)' },
        // Day 4 rain-alt paragraph: "האקווריום של קורפו (Corfu Aquarium)" -
        // verbatim match of attr-40's cleaned title "האקווריום של קורפו".
        { id: 'attr-40', because: 'rain-alternative paragraph "האקווריום של קורפו (Corfu Aquarium)"' }
    ],
    5: [
        // Day 5 heading: "🏛️ ארמון אכיליון (Achilleion Palace)" - verbatim
        // match of attr-2's cleaned title "ארמון אכיליון" (now that the
        // אכיליאון/אכיליון transliteration mismatch, Bug 2, is fixed).
        { id: 'attr-2', because: 'heading "ארמון אכיליון (Achilleion Palace)" (09:00-11:30 slot)' }
    ],
    6: [
        // Day 6 heading: "❤️ תעלת האהבה (Canal d'Amour) בסידארי" - verbatim
        // match of attr-4's cleaned title "תעלת האהבה (Canal d'Amour)".
        { id: 'attr-4', because: 'heading "תעלת האהבה (Canal d\'Amour)" (10:00-12:30 slot)' },
        // Day 6 heading: "🪨 קייפ דראסטיס (Cape Drastis) וצהריים בפרולדס" -
        // verbatim match of attr-12's cleaned title via "Cape Drastis".
        { id: 'attr-12', because: 'heading "קייפ דראסטיס (Cape Drastis)" (13:00-15:30 slot) matches via the "Cape Drastis" variant' },
        // Day 6 heading: "🌇 חוף לוגאס (Logas Beach) ושקיעה ב-7th Heaven" -
        // verbatim match of attr-13's cleaned title "חוף לוגאס (Sunset Beach)"
        // via its Hebrew half "חוף לוגאס".
        { id: 'attr-13', because: 'heading "חוף לוגאס (Logas Beach)" (16:30-19:30 slot) matches via the "חוף לוגאס" variant' }
    ]
};

async function main() {
    const html = fs.readFileSync(INDEX_PATH, 'utf8');
    const dom = new JSDOM(html, {
        url: 'http://localhost/index.html',
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        beforeParse(window) {
            window.console.error = () => {}; // not testing console hygiene here
            window.fetch = () => Promise.reject(new Error('network disabled in test'));
        }
    });

    const { window } = dom;
    const { document } = window;

    for (const rel of SCRIPT_ORDER) {
        const abs = path.join(ROOT, rel);
        if (!fs.existsSync(abs)) continue;
        const el = document.createElement('script');
        el.textContent = fs.readFileSync(abs, 'utf8');
        document.body.appendChild(el);
    }

    document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (typeof window.getDayLocationMatches !== 'function') {
        fail('window.getDayLocationMatches is not defined');
    } else {
        // Sanity check first: before the Bug-1 fix this was 0 for every
        // single day, for every attraction. Assert the aggregate is now
        // non-zero across days 2-6 as a coarse regression guard, then
        // check the specific hand-verified ids per day below.
        let totalAttractionMatches = 0;

        for (const day of [2, 3, 4, 5, 6]) {
            const matches = window.getDayLocationMatches(day);
            const attractionMatches = matches.filter((m) => m.category === 'attractions');
            totalAttractionMatches += attractionMatches.length;
            const matchedIds = new Set(attractionMatches.map((m) => m.id));

            const expected = EXPECTED_ATTRACTIONS[day] || [];
            for (const { id, because } of expected) {
                if (matchedIds.has(id)) {
                    ok(`Day ${day}: matched ${id} (${because})`);
                } else {
                    fail(`Day ${day}: expected attraction ${id} to match (${because}), but getDayLocationMatches(${day}) attractions were: [${[...matchedIds].join(', ') || 'none'}]`);
                }
            }
        }

        if (totalAttractionMatches === 0) {
            fail('0 attraction matches across days 2-6 - the extractLocationNameVariants() regex fix regressed');
        } else {
            ok(`${totalAttractionMatches} total attraction matches across days 2-6 (was 0 before the Bug-1 fix)`);
        }
    }

    console.log('');
    console.log(`=== test-day-map-matching.js: ${failures.length === 0 ? 'PASS' : 'FAIL'} (${failures.length} failure(s)) ===`);
    if (failures.length > 0) process.exitCode = 1;

    window.close();
}

main().catch((e) => {
    console.error('test-day-map-matching.js crashed:', e.stack || e.message);
    process.exitCode = 1;
});
