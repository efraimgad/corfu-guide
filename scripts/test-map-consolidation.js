// Phase D: the Explore map is now the canonical "find a place" map, and the
// beaches map has no callers left outside js/map.js itself.
//
// This is the test that unblocks Phase C. The whole beach map - #beach-map,
// #beach-map-container, the layer-* checkboxes, #map-toggle-btn - lives
// INSIDE <section id="beaches">, so anything still pointing at it would break
// silently the moment that section is deleted. The 🗺️ button on every
// itinerary day card was exactly such a caller.
//
// Usage: node scripts/test-map-consolidation.js
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;
const ok = (l) => { checks++; console.log('OK:   ' + l); };
const fail = (l, d) => { checks++; failures++; console.log('FAIL: ' + l + (d ? '\n        ' + d : '')); };

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const mapJs = fs.readFileSync(path.join(ROOT, 'js/map.js'), 'utf8');
const uiJs = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf8');
const doc = new JSDOM(html).window.document;

// Assertions run against code with comments stripped. The comments here
// legitimately explain the Phase D history and mention the beaches map by
// name; matching on them would be a false positive that could only be
// "fixed" by deleting a useful explanation.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

console.log('--- The day-map button no longer depends on the beaches tab ---');
const openDay = stripComments(
    mapJs.slice(mapJs.indexOf('function openDayMap'), mapJs.indexOf('function focusMapOnDayLocations'))
);
if (/switchTab\('explore'/.test(openDay)) ok('openDayMap() switches to the explore tab');
else fail('openDayMap target', "expected switchTab('explore'");
if (!/beach/i.test(openDay)) ok('openDayMap() has no remaining beach-map references');
else fail('openDayMap', 'still references the beaches map');

const focusFn = stripComments(mapJs.slice(mapJs.indexOf('function focusMapOnDayLocations')));
const focusBody = focusFn.slice(0, focusFn.indexOf('\n}\n') + 2);
if (/exploreMapInstance/.test(focusBody)) ok('focusMapOnDayLocations() drives the explore map');
else fail('focus target', 'does not reference exploreMapInstance');
if (!/beachMapInstance/.test(focusBody)) ok('focusMapOnDayLocations() no longer drives the beaches map');
else fail('focus target', 'still references beachMapInstance');
if (!/getElementById\('layer-/.test(focusBody)) ok('no longer reads layer-* checkboxes (they live inside #beaches)');
else fail('focus target', 'still reads layer-* checkboxes from the beaches section');

console.log('\n--- The Explore map gained what it was missing ---');
const initExplore = stripComments(mapJs.slice(mapJs.indexOf('function initExploreMap'), mapJs.indexOf('function ensureExploreMapVisible')));
if (/gtBuildHotelLayer\(\)/.test(initExplore)) ok('explore map builds the hotel marker');
else fail('hotel layer', 'initExploreMap() has no hotel marker - a regression vs the beaches map');

const setCats = stripComments(mapJs.slice(mapJs.indexOf('function setExploreMapCategories')));
const setCatsBody = setCats.slice(0, setCats.indexOf('\n}\n') + 2);
if (!/hotel/.test(setCatsBody)) ok('category filtering cannot switch the hotel marker off');
else fail('hotel layer', 'setExploreMapCategories() touches the hotel layer');

console.log('\n--- Day focus supports multiple categories at once ---');
// A single itinerary day routinely spans a beach + a taverna + a gem, but
// Explore's chip row is single-select. The map layer must not inherit that
// limit, or a multi-category day would show only part of itself.
if (/setExploreMapCategories\(categories\)/.test(focusBody)) ok('day focus passes every matched category through');
else fail('multi-category', 'day focus does not pass the full category array');
if (/activeCategories\.includes/.test(setCatsBody)) ok('setExploreMapCategories() genuinely accepts an array');
else fail('multi-category', 'setExploreMapCategories() is not array-based');

console.log('\n--- No surviving DOM points at the beaches map ---');
// Handlers outside the four legacy sections survive deletion, so any of them
// still calling toggleBeachMap() would become a dead button.
const BEACH_MAP_CALLS = ['toggleBeachMap', 'beach-map-container'];
const legacyIds = ['beaches', 'food', 'attractions', 'gems'];
const legacyEls = legacyIds.map(id => doc.getElementById(id)).filter(Boolean);
const insideLegacy = (el) => legacyEls.some(s => s.contains(el));

let dead = [];
doc.querySelectorAll('[onclick]').forEach(el => {
    const code = el.getAttribute('onclick');
    if (BEACH_MAP_CALLS.some(c => code.includes(c)) && !insideLegacy(el)) {
        dead.push((el.id || el.tagName) + ' -> ' + code.slice(0, 50));
    }
});
if (!dead.length) ok('no surviving element calls the beaches map');
else fail('dead handlers after deletion', dead.join('\n        '));

console.log('\n--- The map FAB follows the canonical map ---');
const fab = doc.getElementById('map-fab-btn');
if (fab && /toggleExploreMap/.test(fab.getAttribute('onclick') || '')) ok('#map-fab-btn calls toggleExploreMap()');
else fail('map FAB', 'still wired to the beaches map');
if (/map-fab-visible', tabId === 'explore'/.test(uiJs)) ok('#map-fab-btn is revealed on the explore tab');
else fail('map FAB visibility', 'still revealed on the beaches tab');

console.log('\n--- Home map is untouched (deliberately kept) ---');
if (doc.getElementById('home-map')) ok('#home-map still present');
else fail('home map', 'missing - Phase D should not have removed it');
if (/function initHomeMap/.test(mapJs)) ok('initHomeMap() intact');
else fail('home map', 'initHomeMap() missing');

console.log(`\n=== test-map-consolidation.js: ${failures ? 'FAIL' : 'PASS'} (${checks - failures}/${checks} checks) ===`);
process.exit(failures ? 1 : 0);
