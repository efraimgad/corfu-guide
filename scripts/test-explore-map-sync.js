// Regression test for the reported bug:
//   "under גלה, press חופים, then click the option under it - nothing
//    happened on the map"
//
// The facet chips filtered the list but not the map. Group-level toggling
// (setExploreMapCategories) cannot express "these 9 of 28 beaches", so the
// map kept showing all 28 while the list showed 9. From the outside that is
// indistinguishable from a dead control.
//
// This exercises the real map code against a minimal Leaflet stub, so it
// asserts on actual marker membership rather than on source text.
//
// Usage: node scripts/test-explore-map-sync.js
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;
const ok = (l) => { checks++; console.log('OK:   ' + l); };
const fail = (l, d) => { checks++; failures++; console.log('FAIL: ' + l + (d ? '\n        ' + d : '')); };
const eq = (a, b, l) => { a === b ? ok(l + ' (' + a + ')') : fail(l, 'expected ' + b + ', got ' + a); };

// Read from index.html rather than hardcoded: a duplicated list silently
// goes stale whenever a file is added (Phase C1 added two), and the failure
// looks like an app bug rather than a harness bug.
const SCRIPT_ORDER = [...fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
    .matchAll(/<script[^>]+src="(js\/[^"]+)"/g)].map(m => m[1])
    .filter(f => fs.existsSync(path.join(ROOT, f)));

const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), { runScripts: 'outside-only' });
const win = dom.window;
win.IntersectionObserver = function () { return { observe() {}, disconnect() {}, unobserve() {} }; };
win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
win.scrollTo = () => {};

// --- Minimal Leaflet stub -------------------------------------------------
// Only the surface js/map.js actually touches. Groups track their own layers
// so membership can be asserted directly.
function LayerGroup() {
    const layers = new Set();
    return {
        _layers: layers,
        addLayer(m) { layers.add(m); return this; },
        removeLayer(m) { layers.delete(m); return this; },
        clearLayers() { layers.clear(); return this; },
        addTo(map) { map._groups.add(this); return this; },
        getLayers() { return [...layers]; }
    };
}
win.L = {
    map: () => ({
        _groups: new Set(),
        setView() { return this; },
        fitBounds() { return this; },
        invalidateSize() { return this; },
        hasLayer(g) { return this._groups.has(g); },
        removeLayer(g) { this._groups.delete(g); return this; },
        addLayer(g) { this._groups.add(g); return this; },
        on() { return this; }, off() { return this; }, remove() { return this; },
        getContainer: () => win.document.createElement('div')
    }),
    tileLayer: Object.assign(
        () => ({ addTo() { return this; }, on() { return this; }, off() { return this; }, remove() { return this; } }),
        { extend: () => function () { return { addTo() { return this; }, on() { return this; } }; } }
    ),
    layerGroup: LayerGroup,
    circleMarker: (latlng) => ({ _latlng: latlng, on() { return this; }, getLatLng() { return this._latlng; }, setLatLng(v) { this._latlng = v; return this; }, setStyle() { return this; }, addTo(m) { if (m && m._groups) m._groups.add(this); return this; }, remove() { return this; }, bindPopup() { return this; } }),
    marker: (latlng) => ({ _latlng: latlng, on() { return this; }, getLatLng: () => latlng, bindPopup() { return this; } }),
    divIcon: () => ({}),
    latLngBounds: (pts) => ({ _pts: pts }),
    Control: { extend: () => function () {} },
    DomUtil: { create: (t) => win.document.createElement(t || 'div') },
    GridLayer: { extend: () => function TileStub() {
        return { addTo() { return this; }, on() { return this; }, off() { return this; }, remove() { return this; } };
    } },
    TileLayer: { extend: () => function () {
        return { addTo() { return this; }, on() { return this; }, off() { return this; }, remove() { return this; } };
    } },
    Util: { setOptions: () => {} },
    point: (x, y) => ({ x, y })
};

win.eval(
    SCRIPT_ORDER
        .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n')
    + `\n;window.__m = {
        groups: () => exploreMapLayerGroups,
        instance: () => exploreMapInstance,
        initExplore: () => initExploreMap(),
        facet: () => exploreActiveFacet
    };`
);

const L_DATA = win.CORFU_LOCATIONS;
win.renderExploreTab();
win.__m.initExplore();

const groups = win.__m.groups();
const pins = (cat) => groups[cat] ? groups[cat].getLayers().length : -1;

console.log('--- Baseline: map built with every marker ---');
eq(pins('beaches'), L_DATA.beaches.length, 'beaches markers on the map');
if (groups.hotel) ok('hotel layer present (Phase D)');
else fail('hotel layer', 'missing from the explore map');

console.log('\n--- The reported bug: press חופים, then a facet chip ---');
win.selectExploreCategory('beaches', null);
eq(pins('beaches'), L_DATA.beaches.length, 'all beaches shown before any facet');

const countTag = (cat, tag) => L_DATA[cat].filter(d =>
    String(d.tags || '').split(',').map(t => t.trim()).includes(tag)).length;

win.selectExploreFacet('quiet');
eq(win.__m.facet(), 'quiet', 'facet is active');
eq(pins('beaches'), countTag('beaches', 'quiet'), 'MAP now matches the "שקט" facet');

win.selectExploreFacet('family');
eq(pins('beaches'), countTag('beaches', 'family'), 'MAP follows a second facet');

console.log('\n--- "הכל" restores every pin ---');
win.selectExploreFacet('');
eq(pins('beaches'), L_DATA.beaches.length, 'all beaches restored');

console.log('\n--- Markers survive repeated filtering (not destroyed) ---');
for (let i = 0; i < 5; i++) { win.selectExploreFacet('quiet'); win.selectExploreFacet(''); }
eq(pins('beaches'), L_DATA.beaches.length, 'still all beaches after 5 filter cycles');

console.log('\n--- Search narrows the map too ---');
win.handleExploreSearchInput('רוביניה');
const searched = pins('beaches');
if (searched > 0 && searched < L_DATA.beaches.length) ok('search narrows the map (' + searched + ' pins)');
else fail('search sync', 'expected a narrowed pin set, got ' + searched);
win.handleExploreSearchInput('');
eq(pins('beaches'), L_DATA.beaches.length, 'clearing search restores every pin');

console.log('\n--- Other categories filter independently ---');
win.selectExploreCategory('food', null);
win.selectExploreFacet('upscale');
eq(pins('food'), countTag('food', 'upscale'), 'food follows the €€€ facet');
eq(pins('beaches'), L_DATA.beaches.length, 'switching category left beaches unfiltered');

console.log('\n--- Day focus clears a leftover facet ---');
win.selectExploreCategory('beaches', null);
win.selectExploreFacet('quiet');
win.focusMapOnDayLocations([
    { category: 'beaches', id: L_DATA.beaches[0].id, lat: 39.6, lon: 19.8 },
    { category: 'beaches', id: L_DATA.beaches[1].id, lat: 39.7, lon: 19.9 }
]);
eq(pins('beaches'), L_DATA.beaches.length, 'day focus un-narrows so its stops cannot be hidden');

console.log(`\n=== test-explore-map-sync.js: ${failures ? 'FAIL' : 'PASS'} (${checks - failures}/${checks} checks) ===`);
process.exit(failures ? 1 : 0);
