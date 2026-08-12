// Regression test for Phase 3 (persistent-chrome generalization): the page
// <title>, <meta name="description">, the sr-only landmark <h1>, and the
// About tab's chapter-01 hero banner (title/subtitle/image-alt) must all be
// destination-driven (js/destination-chrome.js, js/about.js's
// renderAboutHeroBanner()) — never hardcoded Corfu text, for ANY
// destination-registry.js state ('ready' with any destination, 'unknown',
// 'selector').
//
// Loads the real index.html into jsdom with scripts actually executing,
// once per state, exactly like scripts/smoke-test.js does for a single
// state — real destination switching in this app IS a full page load per
// ?destination=<id> (see js/destination-registry.js's own header), so a
// fresh jsdom instance per query string is a faithful simulation of a user
// switching destinations, not a shortcut.
//
// Usage: node scripts/test-destination-chrome.js
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');

const SCRIPT_ORDER = [...fs.readFileSync(INDEX_PATH, 'utf8').matchAll(/<script[^>]+src="((?:js|data)\/[^"]+)"/g)].map(m => m[1]);
if (!SCRIPT_ORDER.length) throw new Error('test-destination-chrome: found no js/ or data/ <script> tags in index.html');

const errors = [];
const failures = [];
function fail(msg) { failures.push(msg); console.error('FAIL:', msg); }
function ok(msg) { console.log('OK:  ', msg); }

async function loadPage(query) {
    const html = fs.readFileSync(INDEX_PATH, 'utf8');
    const dom = new JSDOM(html, {
        url: 'http://localhost/index.html' + query,
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        beforeParse(window) {
            window.console.error = (...args) => { errors.push(args.map(String).join(' ')); };
            window.addEventListener('error', (e) => { errors.push(String(e.error && e.error.stack || e.message)); });
            window.fetch = () => Promise.reject(new Error('network disabled in test'));
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
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (typeof window.switchTab === 'function') {
        try { window.switchTab('about', true); } catch (e) { /* asserted separately if it matters */ }
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
    return window;
}

function chrome(window) {
    const { document } = window;
    return {
        title: document.title,
        metaDescription: (document.querySelector('meta[name="description"]') || {}).getAttribute
            ? document.querySelector('meta[name="description"]').getAttribute('content')
            : null,
        h1: (document.getElementById('gt-page-heading') || {}).textContent || null,
        heroTitle: (document.getElementById('about-hero-banner-title') || {}).textContent || null,
        heroSubtitle: (document.getElementById('about-hero-banner-subtitle') || {}).textContent || null,
        heroAlt: (document.getElementById('about-hero-banner-img') || {}).getAttribute
            ? document.getElementById('about-hero-banner-img').getAttribute('alt')
            : null,
        heroBannerHidden: (document.getElementById('about-hero-banner') || {}).classList
            ? document.getElementById('about-hero-banner').classList.contains('hidden')
            : null,
    };
}

const CORFU_STRINGS = ['קורפו', 'Corfu', 'CORFU'];
function containsCorfuText(...vals) {
    return vals.some(v => v && CORFU_STRINGS.some(s => v.includes(s)));
}

async function main() {
    console.log('--- Corfu (?destination=corfu): persistent chrome matches Corfu data ---');
    {
        const w = await loadPage('?destination=corfu');
        const c = chrome(w);
        if (c.title && c.title.includes('קורפו')) ok('document.title mentions קורפו: "' + c.title + '"');
        else fail('document.title does not mention קורפו for the Corfu destination', 'title="' + c.title + '"');
        if (c.h1 === c.title) ok('sr-only <h1> matches document.title');
        else fail('sr-only <h1> does not match document.title', 'h1="' + c.h1 + '" title="' + c.title + '"');
        if (c.heroTitle && c.heroTitle.includes('קורפו')) ok('About hero banner title mentions קורפו');
        else fail('About hero banner title missing/wrong for Corfu', 'heroTitle="' + c.heroTitle + '"');
        if (c.heroAlt && c.heroAlt.includes('קורפו')) ok('About hero banner image alt mentions קורפו');
        else fail('About hero banner image alt missing/wrong for Corfu', 'heroAlt="' + c.heroAlt + '"');
        if (c.heroBannerHidden === false) ok('About hero banner is visible (not .hidden)');
        else fail('About hero banner is hidden for Corfu, which has real heroBanner data');
    }

    console.log('\n--- Test Destination (?destination=testdest): DIFFERENT metadata, no Corfu leakage ---');
    {
        const w = await loadPage('?destination=testdest');
        const c = chrome(w);
        if (c.title && !containsCorfuText(c.title)) ok('document.title has no Corfu text: "' + c.title + '"');
        else fail('document.title leaks Corfu text for testdest', 'title="' + c.title + '"');
        if (c.title && c.title.includes('בדיקה')) ok('document.title reflects testdest\'s own name');
        else fail('document.title does not look like testdest\'s own title', 'title="' + c.title + '"');
        if (!containsCorfuText(c.heroTitle, c.heroSubtitle, c.heroAlt)) ok('About hero banner has no Corfu text');
        else fail('About hero banner leaks Corfu text for testdest', JSON.stringify(c));
        if (c.heroTitle && c.heroTitle.includes('בדיקה')) ok('About hero banner reflects testdest\'s own placeholder content');
        else fail('About hero banner does not look like testdest\'s own content', 'heroTitle="' + c.heroTitle + '"');
    }

    console.log('\n--- Empty destination (?destination=empty): safe generic fallback, no Corfu, no broken hero ---');
    {
        const w = await loadPage('?destination=empty');
        const c = chrome(w);
        if (!containsCorfuText(c.title, c.metaDescription, c.h1)) ok('title/meta/h1 have no Corfu text');
        else fail('empty destination leaks Corfu text in persistent chrome', JSON.stringify(c));
        if (c.heroBannerHidden === true) ok('About hero banner is cleanly hidden (empty has no heroBanner data)');
        else fail('About hero banner is not hidden for the empty destination', JSON.stringify(c));
        if (errors.length === 0) ok('no JS errors loading the empty destination');
        else fail('JS errors on the empty destination', errors.join(' | '));
    }

    console.log('\n--- Unknown destination (?destination=foobar): safe generic fallback, no Corfu fallback ---');
    {
        errors.length = 0;
        const w = await loadPage('?destination=foobar');
        const c = chrome(w);
        if (!containsCorfuText(c.title, c.metaDescription, c.h1)) ok('title/meta/h1 have no Corfu text');
        else fail('unknown destination leaks Corfu text in persistent chrome', JSON.stringify(c));
        if (c.title && c.title.includes('foobar')) ok('document.title echoes the requested unknown id');
        else fail('document.title does not echo the requested unknown id', 'title="' + c.title + '"');
        if (c.heroBannerHidden === true) ok('About hero banner is cleanly hidden (unknown falls back to empty data)');
        else fail('About hero banner is not hidden for the unknown-destination state', JSON.stringify(c));
    }

    console.log('\n--- Selector (root, no ?destination=): safe generic fallback, no Corfu fallback ---');
    {
        errors.length = 0;
        const w = await loadPage('');
        const c = chrome(w);
        if (!containsCorfuText(c.title, c.metaDescription, c.h1)) ok('title/meta/h1 have no Corfu text');
        else fail('selector state leaks Corfu text in persistent chrome', JSON.stringify(c));
        if (c.heroBannerHidden === true) ok('About hero banner is cleanly hidden on the selector state');
        else fail('About hero banner is not hidden on the selector state', JSON.stringify(c));
    }

    console.log('\n--- No duplicate ids introduced ---');
    {
        const w = await loadPage('?destination=corfu');
        const ids = {};
        w.document.querySelectorAll('[id]').forEach(el => { ids[el.id] = (ids[el.id] || 0) + 1; });
        const dupes = Object.entries(ids).filter(([, n]) => n > 1);
        if (dupes.length === 0) ok('no duplicate DOM ids');
        else fail('duplicate DOM ids found', JSON.stringify(dupes));
    }

    console.log('\n--- No destination-id branching introduced in the new chrome files ---');
    {
        const chromeJs = fs.readFileSync(path.join(ROOT, 'js/destination-chrome.js'), 'utf8');
        const aboutJs = fs.readFileSync(path.join(ROOT, 'js/about.js'), 'utf8');
        const badPattern = /\.id\s*===\s*['"](corfu|testdest|empty)['"]/;
        if (!badPattern.test(chromeJs)) ok('js/destination-chrome.js has no destination-id branching');
        else fail('js/destination-chrome.js branches on a specific destination id');
        if (!badPattern.test(aboutJs)) ok('js/about.js has no destination-id branching');
        else fail('js/about.js branches on a specific destination id');
    }

    const total = failures.length;
    console.log(`\n=== test-destination-chrome.js: ${total ? 'FAIL' : 'PASS'} (${total} failure(s)) ===`);
    process.exit(total ? 1 : 0);
}

main().catch((e) => { console.error('FATAL', e.stack || e); process.exit(1); });
