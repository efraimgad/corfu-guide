// ============================================================================
// destination-chrome.js — sets the page's persistent chrome (document.title,
// the <meta name="description"> tag, and the sr-only landmark <h1>) from the
// active destination, for all three js/destination-registry.js states
// ('ready', 'selector', 'unknown'). This is the piece that used to be
// hardcoded Corfu text baked directly into index.html's <head>/<body> -
// visible even when a different destination (or no destination) was active.
//
// Runs as a plain <script defer>, so the DOM (the <title>/<meta>/<h1> this
// touches) already exists - no need to wait for DOMContentLoaded. Must load
// after js/destination-registry.js (reads window.GT_DESTINATION_STATE /
// window.GT_REQUESTED_DESTINATION_ID / window.DESTINATION).
//
// 'ready': uses the active destination's own hero.title/hero.subtitle -
// data/destinations/*.js already declared these fields (destination
// identity metadata from an earlier round), they were simply never read by
// anything until now. Not a new abstraction - this file is the first
// consumer of an existing one.
//
// 'selector'/'unknown': generic, destination-agnostic copy that matches
// js/destination-gate.js's own on-page wording for those states - never a
// Corfu-specific fallback, even briefly. index.html's own static <title>/
// <meta description>/<h1> defaults (what a user sees for one frame before
// this script runs, or if it somehow fails to) are ALSO generic for the
// same reason - see index.html's own comment at those tags.
//
// Deliberately does NOT touch the Open Graph / Twitter Card meta tags or
// the JSON-LD block: those describe the site's one fixed canonical
// production URL (see index.html's <link rel="canonical">) for social-
// preview/crawler consumption. That URL carries no ?destination= param and
// is never re-fetched after a client-side change, so editing those tags
// here would have zero effect on any real crawler - out of scope for this
// phase, and a product decision (what should the shared link advertise?)
// rather than an architecture question either way.
// ============================================================================

(function () {
    const GENERIC_APP_NAME = 'מדריך טיולים';

    function setChrome(title, description) {
        if (title) document.title = title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && description) metaDesc.setAttribute('content', description);
        const h1 = document.getElementById('gt-page-heading');
        if (h1 && title) h1.textContent = title;
    }

    const state = window.GT_DESTINATION_STATE;

    if (state === 'ready' && window.DESTINATION) {
        const hero = window.DESTINATION.hero || {};
        const title = hero.title || window.DESTINATION.name || GENERIC_APP_NAME;
        const description = hero.subtitle || `${GENERIC_APP_NAME} עבור ${window.DESTINATION.name || ''}`.trim();
        setChrome(title, description);
    } else if (state === 'unknown') {
        const id = window.GT_REQUESTED_DESTINATION_ID || '';
        setChrome(
            `היעד "${id}" אינו קיים — ${GENERIC_APP_NAME}`,
            'היעד המבוקש אינו קיים במערכת. בחרו יעד רשום מתוך הרשימה.'
        );
    } else {
        // 'selector' (and any unexpected state - same safe generic fallback,
        // never Corfu-specific).
        setChrome(
            `בחירת יעד — ${GENERIC_APP_NAME}`,
            'בחרו יעד כדי להתחיל לתכנן את הטיול.'
        );
    }
})();
