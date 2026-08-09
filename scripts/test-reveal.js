// Regression test for pre-launch audit BLOCKER B5.
//
// THE BUG: the shared entrance-animation IntersectionObserver (js/ui.js) used
// `threshold: 0.1`. A threshold is a fraction of the TARGET'S OWN bounding box,
// so an element taller than ~10x the viewport can never present 10% of itself
// at any scroll position. The observed set includes whole content panels — at
// 390x844 the FAQ list measures 5,634px, language-daily 3,252px,
// trip-planning 1,879px — so they were never marked .revealed and stayed at
// opacity:0 (css/design-system.css .reveal-on-scroll).
//
// User-visible effect: tapping "מדריך", the main route to trip-planning,
// safety, language and FAQ content, showed a blank screen below the intro with
// no cue to scroll. It self-healed only once the user scrolled ~800px.
//
// The invariant is "no area-ratio gate on elements that can exceed the
// viewport". Asserted against source because a live check would need a real
// layout at a specific viewport, and the defect is in the observer's
// configuration, not in any rendered pixel.
//
// Usage: node scripts/test-reveal.js
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;
const ok = l => { checks++; console.log('OK:   ' + l); };
const fail = (l, d) => { checks++; failures++; console.log('FAIL: ' + l + (d ? '\n        ' + d : '')); };

const ui = fs.readFileSync(path.join(ROOT, 'js', 'ui.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css', 'design-system.css'), 'utf8');

console.log('--- The reveal observer must not gate on an area ratio ---');

const obs = ui.match(/revealObserver\s*=[\s\S]*?\}\s*,\s*\{([^}]*)\}\s*\)/);
if (!obs) {
    fail('could not locate the revealObserver options object in js/ui.js',
        'the scanner is broken, or the observer was renamed — do not treat this as a pass');
} else {
    const opts = obs[1];
    const th = opts.match(/threshold\s*:\s*([0-9.]+)/);
    if (!th) {
        ok('no explicit threshold (defaults to 0 — fires on any intersecting pixel)');
    } else if (parseFloat(th[1]) === 0) {
        ok('threshold is 0 — fires on any intersecting pixel');
    } else {
        fail('threshold is ' + th[1] + ' — an area ratio that a panel taller than '
            + Math.round(1 / parseFloat(th[1])) + 'x the viewport can never satisfy, '
            + 'leaving it permanently at opacity:0');
    }
    if (/rootMargin/.test(opts)) ok('rootMargin retained (keeps the entrance animation feel)');
    else ok('no rootMargin (acceptable — not what B5 was about)');
}

console.log('\n--- The mechanism this depends on must still exist ---');
if (/\.reveal-on-scroll\b/.test(css)) ok('.reveal-on-scroll exists in the stylesheet');
else fail('.reveal-on-scroll not found — did the animation get removed?');

if (/opacity\s*:\s*0/.test((css.match(/\.reveal-on-scroll\s*\{[^}]*\}/) || [''])[0])) {
    ok('.reveal-on-scroll starts at opacity:0 (so the threshold genuinely matters)');
} else {
    ok('.reveal-on-scroll no longer hides content — B5 cannot recur this way');
}

if (/classList\.add\(\s*['"]revealed['"]\s*\)/.test(ui)) ok('the observer adds .revealed on intersection');
else fail('no classList.add(\'revealed\') in js/ui.js — the reveal path is broken');

// setupRevealAnimations observes whole panels, not just small cards — this is
// why the ratio was fatal. Lock in that the observed set is broad.
const setup = ui.match(/function setupRevealAnimations[\s\S]*?\n\}/);
if (setup && /querySelectorAll\(/.test(setup[0])) ok('setupRevealAnimations observes a queried set of elements');
else fail('setupRevealAnimations not found or no longer queries elements');

console.log(`\n=== test-reveal.js: ${failures ? 'FAIL' : 'PASS'} (${failures} failure(s), ${checks} checks) ===`);
process.exit(failures ? 1 : 0);
