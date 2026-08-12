// Tests the merged Guide tab (Phase B) against the real index.html.
//
// The thing under test is an AGREEMENT between four places that can drift
// apart silently:
//   1. GT_GUIDE_PANEL_IDS       (js/ui.js)    - which switchTab() ids redirect
//   2. GT_GUIDE_PANEL_IDS_LIST  (js/guide.js) - which panels can be shown
//   3. #guide-chip-nav chips    (index.html)  - which the user can reach
//   4. <section id=...>         (index.html)  - which actually exist
// A mismatch produces no error - just a chip that does nothing, or a tab that
// redirects to a panel that never displays. Only a test catches it.
//
// Usage: node scripts/test-guide-panels.js
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;

function ok(l) { checks++; console.log('OK:   ' + l); }
function fail(l, d) { checks++; failures++; console.log('FAIL: ' + l + (d ? '\n        ' + d : '')); }
function same(a, b, l) {
    const A = [...a].sort().join(','), B = [...b].sort().join(',');
    if (A === B) ok(l + ' (' + a.length + ')');
    else fail(l, 'A = [' + A + ']\n        B = [' + B + ']');
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/index.html?destination=corfu' });
const win = dom.window;
const doc = win.document;

win.IntersectionObserver = function () { return { observe() {}, disconnect() {}, unobserve() {} }; };
win.matchMedia = win.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
win.scrollTo = () => {};

// The Day 5 deep link's scroll anchor (#act-boats) is now rendered by
// js/activities.js's renderActivitiesGrid() from destination data (Phase 2
// migration) rather than existing as static markup, so the destination-data
// bootstrap chain + that renderer have to run before checking for it -
// same reasoning as every other harness that switched to ?destination=corfu.
win.eval(
    [
        'js/html-utils.js',
        'js/locations-data.js',
        'js/itinerary-data.js',
        'js/corfu-faq.js',
        'js/corfu-activities.js',
        'data/destinations/corfu.js',
        'js/testdest-locations.js',
        'js/testdest-itinerary.js',
        'js/testdest-faq.js',
        'js/testdest-activities.js',
        'data/destinations/testdest.js',
        'data/destinations/empty.js',
        'js/destination-registry.js',
        'js/activities.js',
        'js/ui.js',
        'js/guide.js'
    ]
        .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n')
    + `\n;renderActivitiesGrid();
    window.__g = {
        uiList: GT_GUIDE_PANEL_IDS,
        guideList: GT_GUIDE_PANEL_IDS_LIST,
        validTabs: VALID_TAB_IDS,
        current: () => gtCurrentGuidePanel
    };`
);

const uiList = win.__g.uiList;
const guideList = win.__g.guideList;

console.log('--- The four sources must describe the same set ---');
same(uiList, guideList, 'ui.js list === guide.js list');

const chipIds = [...doc.querySelectorAll('#guide-chip-nav [data-guide-panel]')]
    .map(b => b.getAttribute('data-guide-panel'));
same(chipIds, guideList, 'chip nav === guide.js list');

const missingSections = guideList.filter(id => !doc.getElementById(id));
if (!missingSections.length) ok('every panel id has a real <section> (' + guideList.length + ')');
else fail('missing sections', missingSections.join(', '));

console.log('\n--- activities is specifically covered (Phase B) ---');
if (guideList.includes('activities')) ok("'activities' is a guide panel");
else fail('phase B', "'activities' missing from the panel list");
if (chipIds.includes('activities')) ok("'activities' has a reachable chip");
else fail('phase B', "'activities' has no chip - still orphaned");

console.log('\n--- Panel markup consistency (all five, not just the new one) ---');
guideList.forEach(id => {
    const el = doc.getElementById(id);
    if (!el) return;
    if (el.getAttribute('dir') === 'rtl') ok(id + ' has dir="rtl"');
    else fail(id + ' direction', 'missing dir="rtl" - inconsistent with sibling panels');
    if (el.classList.contains('tab-content')) ok(id + ' is a .tab-content section');
    else fail(id + ' class', 'not .tab-content - switchTab() will not hide it');
    if (el.getAttribute('role') === 'tabpanel') ok(id + ' role=tabpanel');
    else fail(id + ' role', 'expected role=tabpanel');
});

console.log('\n--- Behaviour: showing a panel hides the other four ---');
guideList.forEach(id => {
    win.gtShowGuidePanel(id);
    const shown = guideList.filter(p => {
        const el = doc.getElementById(p);
        return el && el.style.display === 'block';
    });
    if (shown.length === 1 && shown[0] === id) ok('showing ' + id + ' hides the other ' + (guideList.length - 1));
    else fail('exclusivity for ' + id, 'visible panels: [' + shown.join(', ') + ']');
});

console.log('\n--- Behaviour: exactly one chip selected, and it matches ---');
guideList.forEach(id => {
    win.gtShowGuidePanel(id);
    const sel = [...doc.querySelectorAll('#guide-chip-nav [aria-selected="true"]')];
    if (sel.length !== 1) fail('aria for ' + id, sel.length + ' chips selected');
    else if (sel[0].getAttribute('data-guide-panel') === id) ok(id + ' chip aria-selected matches panel');
    else fail('aria for ' + id, 'selected chip is ' + sel[0].getAttribute('data-guide-panel'));
});

console.log('\n--- Behaviour: an unknown panel id does not blank the tab ---');
win.gtShowGuidePanel('trip-planning');
win.gtShowGuidePanel('not-a-real-panel');
if (win.__g.current() === 'trip-planning') ok('invalid id falls back to the current panel');
else fail('invalid id', 'current panel became ' + win.__g.current());

console.log('\n--- Routing: guide panel ids stay valid hash targets ---');
const notValid = guideList.filter(id => !win.__g.validTabs.includes(id));
if (!notValid.length) ok('every panel id is still in VALID_TAB_IDS (#hash routing works)');
else fail('hash routing', notValid.join(', ') + ' not in VALID_TAB_IDS');

console.log('\n--- The Day 5 deep link that was the only way in ---');
const itin = fs.readFileSync(path.join(ROOT, 'js/itinerary-data.js'), 'utf8');
if (/switchTab\('activities'/.test(itin)) {
    ok('deep link still present in itinerary-data.js');
    if (uiList.includes('activities')) ok('...and now redirects into Guide instead of a dead-end tab');
    else fail('deep link', 'target is not a guide panel - user lands with no way back');
} else {
    fail('deep link', "expected switchTab('activities' in itinerary-data.js");
}
const anchor = doc.getElementById('act-boats');
if (anchor) ok("the deep link's scroll anchor #act-boats exists");
else fail('deep link anchor', '#act-boats not found');

console.log(`\n=== test-guide-panels.js: ${failures ? 'FAIL' : 'PASS'} (${checks - failures}/${checks} checks) ===`);
process.exit(failures ? 1 : 0);
