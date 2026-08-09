// Regression test for pre-launch audit BLOCKER B4.
//
// THE BUG: css/design-system.css's desktop split-view rule was
//     #explore.gt-explore { display:grid !important; }
// inside a >=1024px media query. switchTab() (js/ui.js) hides a non-active tab
// with an inline style.display='none', and `!important` in a stylesheet beats
// an inline declaration — so #explore stayed a live grid on EVERY other tab at
// desktop widths. Measured at 1440x900 on a session that had never opened
// Explore: #explore rendered 1216x186 with its chip row and search box painted
// on top of About/Dashboard/Guide content, growing to the full ~750px map+list
// grid once Explore had been visited once.
//
// This is asserted against the stylesheet SOURCE rather than a live browser
// because the defect is a specificity relationship, not a rendered pixel — the
// same approach scripts/test-map-consolidation.js already takes. A browser
// check would also need a >=1024px viewport, which jsdom does not evaluate
// media queries for.
//
// Usage: node scripts/test-tab-isolation.js
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;
const ok = l => { checks++; console.log('OK:   ' + l); };
const fail = (l, d) => { checks++; failures++; console.log('FAIL: ' + l + (d ? '\n        ' + d : '')); };

const css = fs.readFileSync(path.join(ROOT, 'css', 'design-system.css'), 'utf8');
const ui = fs.readFileSync(path.join(ROOT, 'js', 'ui.js'), 'utf8');

console.log('--- Any `display:...!important` on a tab section must be .active-scoped ---');

// Scan line-wise for a selector line naming a tab section, then look ahead a
// few lines for a display:!important in that block. Deliberately simple and
// line-based: an earlier regex version silently matched nothing and therefore
// reported OK on broken CSS, which is worse than having no check at all.
const TAB_IDS = 'explore|home|about|dashboard|guide|itinerary|activities|faq|trip-planning|health-safety|language-daily';
const lines = css.split('\n');
let forced = 0, scoped = 0;
lines.forEach((line, i) => {
    const sel = line.trim();
    if (!new RegExp('^#(' + TAB_IDS + ')[.#:\\[]').test(sel)) return;
    if (!sel.includes('{')) return;
    // Look inside this block (until its closing brace, max 12 lines).
    let body = '';
    for (let j = i; j < Math.min(i + 12, lines.length); j++) {
        body += lines[j] + '\n';
        if (lines[j].includes('}')) break;
    }
    if (!/display\s*:[^;]*!important/.test(body)) return;
    forced++;
    if (/\.active\b/.test(sel)) { scoped++; ok('`' + sel.replace('{', '').trim() + '` is .active-scoped'); }
    else fail('`' + sel.replace('{', '').trim() + '` forces display with !important but is NOT .active-scoped — '
        + "it will out-specify switchTab()'s inline display:none and render on top of every other tab");
});
if (forced === 0) fail('scan found no display:!important tab rule at all — the scanner is broken, not the CSS',
    'expected to find at least the #explore desktop split-view rule');
else ok('scanned ' + forced + ' forced-display tab rule(s), ' + scoped + ' correctly scoped');

// The specific rule this test was written for must exist and be scoped.
console.log('\n--- The Explore desktop split-view rule specifically ---');
if (/#explore\.gt-explore\.active\s*\{/.test(css)) {
    ok('#explore.gt-explore.active exists (scoped form)');
} else if (/#explore\.gt-explore\s*\{/.test(css)) {
    fail('#explore.gt-explore is still unscoped — B4 has regressed');
} else {
    fail('the Explore desktop grid rule was not found at all', 'did the selector get renamed?');
}

// The scoping only works because switchTab() maintains .active.
console.log('\n--- switchTab() must maintain the .active class the rule depends on ---');
if (/classList\.add\(\s*['"]active['"]\s*\)/.test(ui)) ok("switchTab() adds .active to the target tab");
else fail("no classList.add('active') found in js/ui.js — the .active scoping above would never match");
if (/classList\.remove\(\s*['"]active['"]\s*\)/.test(ui)) ok('.active is removed from non-target tabs');
else fail("no classList.remove('active') found in js/ui.js");

console.log(`\n=== test-tab-isolation.js: ${failures ? 'FAIL' : 'PASS'} (${failures} failure(s), ${checks} checks) ===`);
process.exit(failures ? 1 : 0);
