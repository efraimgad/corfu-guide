// Tests the Explore facet filter (Phase A) against the REAL locations data,
// in a real DOM, with the real explore.js executing - not a mock of it.
//
// Usage: node scripts/test-explore-facets.js
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let failures = 0;
let checks = 0;

function ok(label) { checks++; console.log('OK:   ' + label); }
function fail(label, detail) {
    checks++; failures++;
    console.log('FAIL: ' + label + (detail ? '\n        ' + detail : ''));
}
function eq(actual, expected, label) {
    if (actual === expected) ok(label + ' (' + actual + ')');
    else fail(label, 'expected ' + expected + ', got ' + actual);
}

// --- Boot a DOM with just the pieces explore.js touches ---------------------
const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div id="explore-cat-tablist"></div>
  <div id="explore-facet-row" class="hidden"></div>
  <input id="explore-search-input">
  <div id="explore-subheader"></div>
  <div id="explore-list"></div>
  <div id="explore-empty-state"></div>
  <div id="explore-filter-count"></div>
</body></html>`, { runScripts: 'outside-only', url: 'http://localhost/index.html?destination=corfu' });

const win = dom.window;
// Real html-utils.js, not a stub: it owns escapeHtml/escapeAttr AND the
// shared GT_ICON_* constants explore.js renders into every row. A hand-rolled
// stub would drift from production and give false confidence.
win.IntersectionObserver = function () {
    return { observe() {}, disconnect() {}, unobserve() {} };
};

// Loaded as ONE script, in index.html's own order. They must share a scope:
// `const EXPLORE_FACETS` is module-level in explore.js and is not exported to
// window, so a second, separate eval() could not see it. The tail exposes the
// internals this test asserts on - reading real state rather than re-deriving
// it, so the test can actually catch the code being wrong.
// Derived from index.html rather than hardcoded - a duplicated list goes
// stale whenever a file is added or (Phase C2) deleted, and the resulting
// failure looks like an app bug rather than a harness bug.
const SCRIPTS = [...fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
    .matchAll(/<script[^>]+src="((?:js|data)\/[^"]+)"/g)].map(m => m[1])
    .filter(f => fs.existsSync(path.join(ROOT, f)));
win.eval(
    SCRIPTS.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n')
    + `\n;window.__t = {
        facets: EXPLORE_FACETS,
        groups: (c) => buildExploreGroups(c),
        activeFacet: () => exploreActiveFacet,
        activeCat: () => exploreActiveCategory
    };`
);

const L = win.CORFU_LOCATIONS;
const FACETS = win.__t.facets;

function rowsShown() {
    win.eval('renderExploreList()');
    return win.__t.groups(win.__t.activeCat()).reduce((n, g) => n + g.rows.length, 0);
}
let currentCat = 'beaches';
function selectCat(c) { currentCat = c; win.selectExploreCategory(c, null); }
function selectFacet(t) { win.selectExploreFacet(t); }

// Independently recount the tags straight from the data, so the expected
// numbers come from the source of truth rather than from the code under test.
function countTag(cat, tag) {
    return L[cat].filter(d => String(d.tags || '').split(',')
        .map(t => t.trim()).includes(tag)).length;
}

console.log('--- Scenario 1: happy path, every facet on every category ---');
for (const cat of Object.keys(FACETS)) {
    for (const f of FACETS[cat]) {
        selectCat(cat);
        selectFacet(f.tag);
        eq(rowsShown(), countTag(cat, f.tag), `${cat} / ${f.label} (${f.tag})`);
    }
}

console.log('\n--- Scenario 5: substring collision (the real trap) ---');
// 'beach' is an attractions/gems tag; 'beachbars' is a food tag. A naive
// tags.includes('beach') would match both. Whole-token equality must not.
selectCat('food');
selectFacet('');
const foodBeachbars = countTag('food', 'beachbars');
if (foodBeachbars > 0) ok(`food has ${foodBeachbars} 'beachbars' records to collide with`);
else fail('fixture check', "expected some 'beachbars' records in food");
selectCat('attractions');
selectFacet('beach');
const attrBeach = rowsShown();
eq(attrBeach, countTag('attractions', 'beach'), "attractions 'beach' excludes 'beachbars'");
const anyBeachbarsLeaked = win.__t.groups('attractions')
    .some(g => g.rows.some(d => String(d.tags || '').includes('beachbars')));
if (!anyBeachbarsLeaked) ok("no 'beachbars' record leaked into the beach facet");
else fail('substring collision', "a 'beachbars' record matched the 'beach' facet");

console.log('\n--- Scenario 2: facet AND search combine ---');
selectCat('food');
selectFacet('upscale');
const upscaleAll = rowsShown();
win.handleExploreSearchInput('טאון');
const upscaleSearched = rowsShown();
if (upscaleSearched <= upscaleAll) ok(`search narrows within facet (${upscaleAll} -> ${upscaleSearched})`);
else fail('facet+search', `search widened the set: ${upscaleAll} -> ${upscaleSearched}`);
if (upscaleSearched > 0) ok('facet+search still returns results (predicates AND, not XOR)');
else fail('facet+search', 'combination returned zero - predicates may be mutually exclusive');

console.log('\n--- Scenario 3: switching category resets the facet ---');
selectCat('food');
selectFacet('budget');
selectCat('beaches');
eq(win.__t.activeFacet(), '', 'facet reset on category switch');
eq(rowsShown(), L.beaches.length, 'all beaches shown after switch');

console.log('\n--- Scenario 4: "all" restores the full set ---');
for (const cat of Object.keys(FACETS)) {
    selectCat(cat);
    selectFacet(FACETS[cat][0].tag);
    selectFacet('');
    eq(rowsShown(), L[cat].length, `${cat} / all`);
}

console.log('\n--- Scenario 6: food region grouping survives a facet ---');
selectCat('food');
selectFacet('midrange');
const groups = win.__t.groups('food');
if (groups.length > 1 && groups.every(g => g.label)) ok(`food still grouped by region (${groups.length} groups)`);
else fail('grouping', `expected multiple labelled region groups, got ${groups.length}`);

console.log('\n--- Scenario 8: ARIA - exactly one selected chip ---');
for (const cat of Object.keys(FACETS)) {
    selectCat(cat);
    const row = win.document.getElementById('explore-facet-row');
    const chips = row.querySelectorAll('[role="tab"]');
    eq(chips.length, FACETS[cat].length + 1, `${cat} chip count (facets + "all")`);
    const sel = row.querySelectorAll('[aria-selected="true"]').length;
    eq(sel, 1, `${cat} exactly one aria-selected`);
}

console.log('\n--- Scenario: invalid facet is rejected, not applied ---');
selectCat('beaches');
selectFacet('upscale'); // a food tag, not valid for beaches
eq(win.__t.activeFacet(), '', 'cross-category facet rejected');

console.log('\n--- Scenario: no facet narrows to zero (a dead control) ---');
for (const cat of Object.keys(FACETS)) {
    for (const f of FACETS[cat]) {
        const n = countTag(cat, f.tag);
        if (n >= 3) ok(`${cat}/${f.label} matches ${n} records`);
        else fail(`${cat}/${f.label}`, `only ${n} records - too few to be a useful filter`);
    }
}

console.log(`\n=== test-explore-facets.js: ${failures ? 'FAIL' : 'PASS'} `
    + `(${checks - failures}/${checks} checks) ===`);
process.exit(failures ? 1 : 0);
