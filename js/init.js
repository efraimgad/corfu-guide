document.addEventListener("DOMContentLoaded", function() {
    // Remove Luxury Hotels
    const badges = document.querySelectorAll('span.bg-purple-100.text-purple-800');
    badges.forEach(badge => {
        if (badge.textContent.includes('יוקרה')) {
            // Find the closest parent that is a hotel card container
            const card = badge.closest('.bg-white.rounded-2xl');
            if (card) {
                card.remove();
            } else if (badge.classList.contains('cursor-pointer')) {
                badge.remove(); // Remove the quick filter badge
            }
        }
    });

    // Note: removed automatic image randomization - cards already have curated real photos.
    //
    // target="_blank"/rel="noopener noreferrer" for external reference links,
    // and the deliberate absence of target="_blank" on maps.google.com links
    // (so mobile OSes open them in the native Maps app), are now set directly
    // in the markup instead of being applied blanket here.
});

// Graceful fallback for the ~150 hotlinked photos (pexels/unsplash/loremflickr):
// if one ever fails to load (dead link, ad-blocker, offline, CDN hiccup), swap
// in a soft on-brand placeholder instead of the browser's broken-image icon and
// raw (often English) alt text leaking through the Hebrew layout. Capture phase
// is required because the img "error" event does not bubble.
document.addEventListener('error', function(e) {
    const img = e.target;
    if (img.tagName !== 'IMG' || img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = 'true';
    img.removeAttribute('srcset');
    img.src = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
        '<rect width="400" height="300" fill="#f2ecdf"/>' +
        '<g transform="translate(200,150)" stroke="#a9762e" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.5">' +
        '<rect x="-45" y="-32" width="90" height="64" rx="8"/><circle r="14" cy="2"/>' +
        '</g></svg>'
    );
}, true);

// Step 10 (Phase 2): FAQPage structured data, built from the #faq-list
// <details> markup itself rather than hand-duplicating all 51 Q&A pairs a
// second time as a static JSON-LD block - question = the summary's visible
// text, answer = the rest of that <details>'s content. Stays in sync with
// the FAQ automatically since there's nothing else to keep in sync.
function injectFaqStructuredData() {
    const items = document.querySelectorAll('#faq-list details');
    if (!items.length) return;

    const mainEntity = Array.from(items).map(details => {
        const question = (details.querySelector('summary span')?.textContent || '').trim();
        const answerEl = details.querySelector(':scope > div');
        const answer = (answerEl ? answerEl.textContent : '').trim().replace(/\s+/g, ' ');
        return {
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: answer }
        };
    }).filter(q => q.name && q.acceptedAnswer.text);

    if (!mainEntity.length) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity
    });
    document.head.appendChild(script);
}

// Setup initial tab on load
document.addEventListener("DOMContentLoaded", function() {
    // Cache the scroll-handler's static elements once, now that the
    // whole document (including things defined further down, like
    // #back-to-top-btn) actually exists.
    scrollProgressBarEl = document.getElementById('scroll-progress-bar');
    backToTopBtnEl = document.getElementById('back-to-top-btn');
    stickyNavBarEl = document.getElementById('sticky-nav-bar');
    updateScrollUI(); // sets --sticky-filter-top correctly before any scroll happens

    // Open the tab named in the URL hash if it names a real tab (bookmark,
    // shared link, reload on #beaches) - that always wins. Otherwise: a
    // first-time visitor (no corfu-guide-visited key yet) lands on "about"
    // instead of straight into the itinerary; every visit after that keeps
    // the itinerary default. skipScroll:true - nothing to scroll away from
    // yet on load.
    const FIRST_VISIT_KEY = gtDestKey('corfu-guide-visited');
    gtMigrateLegacyKey('corfu-guide-visited');
    let isFirstVisit = true;
    try {
        isFirstVisit = !localStorage.getItem(FIRST_VISIT_KEY);
        localStorage.setItem(FIRST_VISIT_KEY, 'true');
    } catch (e) { /* storage unavailable (private browsing, etc.) - default to first-visit behavior */ }

    const hashTab = getTabIdFromHash();
    switchTab(hashTab || (isFirstVisit ? 'about' : 'today'), true);
    // switchTab() always syncs the URL hash to whatever tab it opens
    // (Step 12), including a synthetic default no one actually navigated
    // to - left alone, that default would get baked into the URL and then
    // wrongly win as an "explicit" hash on the next reload, defeating the
    // first-visit/return-visit logic above. Only a hash the visitor
    // actually arrived with should stick.
    if (!hashTab) {
        history.replaceState(null, '', location.pathname + location.search);
    }

    initFavoriteButtons();
    initTripProgress();
    populateDistanceSelects();
    convertCurrency();
    initDashboard();
    // Fills every dinner-slot hook (data-dinner-food-id) with the live
    // name/hours/phone/price of its matching CORFU_LOCATIONS food record -
    // see js/itinerary.js. Must run after CORFU_LOCATIONS is loaded.
    if (typeof fillItineraryDinnerHooks === 'function') fillItineraryDinnerHooks();
    // Surfaces each attraction's own priceFlag/verifyNote (formerly js/cards.js's
    // buildVerifiedInfoHTML shows the same text on its card) inline in the
    // itinerary, instead of the itinerary hardcoding a second, possibly-
    // contradicting price of its own. See js/itinerary.js.
    if (typeof fillItineraryPriceFlags === 'function') fillItineraryPriceFlags();
    // Cross-checks each day's own itinerary text against the closedDays/
    // verifiedHours of whichever CORFU_LOCATIONS record it names (Step:
    // Bug 1 second half) - must run after initDashboard() sets up
    // TRIP_CONFIG-derived day dates and after CORFU_LOCATIONS is loaded.
    if (typeof checkDayVenueWarnings === 'function') checkDayVenueWarnings();
    // New day-scrubber + row-card itinerary view (js/itinerary-view.js,
    // Phase 4 batch 3) - must run after the three calls above so its
    // row-card status badges can read their already-computed dinner/
    // price-flag/venue-warning content instead of recomputing any of it.
    if (typeof initItineraryScrubberView === 'function') initItineraryScrubberView();

    // Personal tracking widget (visited/rating/note): inject into every
    // item card and populate from whatever's cached locally from a
    // previous visit - instant, no network wait. Cloud sync then runs
    // in the background (Step 6) and re-renders only if it found
    // something new, so first paint never blocks on a request.
    if (typeof injectPersonalTrackingWidgets === 'function') {
        injectPersonalTrackingWidgets();
    }
    if (typeof initCloudSync === 'function') {
        initCloudSync();
    }

    injectFaqStructuredData();
});

// Basic offline support (see sw.js) - "page loads and works when offline",
// not a full PWA with push notifications.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
