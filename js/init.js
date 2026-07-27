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

// Setup initial tab on load
document.addEventListener("DOMContentLoaded", function() {
    // Cache the scroll-handler's static elements once, now that the
    // whole document (including things defined further down, like
    // #back-to-top-btn) actually exists.
    scrollProgressBarEl = document.getElementById('scroll-progress-bar');
    backToTopBtnEl = document.getElementById('back-to-top-btn');
    stickyNavBarEl = document.getElementById('sticky-nav-bar');
    updateScrollUI(); // sets --sticky-filter-top correctly before any scroll happens

    // activate itinerary initially
    const firstTab = document.getElementById('itinerary');
    if(firstTab) {
        firstTab.style.display = 'block';
        setTimeout(() => {
            firstTab.classList.add('active');
            setupRevealAnimations(firstTab);
            setupTimelineScrollLife(firstTab);
        }, 50);
    }
    initFavoriteButtons();
    initTripProgress();
    populateDistanceSelects();
    convertCurrency();
    initDashboard();

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
});

// Basic offline support (see sw.js) - "page loads and works when offline",
// not a full PWA with push notifications.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}
