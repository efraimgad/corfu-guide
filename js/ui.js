// Tab ids this app actually has a .tab-content section for - used to
// validate incoming hash values (URL bar edits, bookmarks, Back/Forward)
// before ever treating one as a tab id.
const VALID_TAB_IDS = ['about', 'itinerary', 'beaches', 'food', 'attractions', 'gems', 'activities', 'shopping', 'faq'];

function getTabIdFromHash() {
    const id = location.hash.slice(1);
    return VALID_TAB_IDS.includes(id) ? id : null;
}

// The very first tab activation (page load) must not consume a Back-button
// history slot, so it uses replaceState; every activation after that
// pushes, so Back/Forward can walk through previously-viewed tabs.
let tabHistoryInitialized = false;

function switchTab(tabId, skipScroll) {
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    document.querySelectorAll('.nav-btn').forEach(el => {
        el.classList.remove('active');
        el.setAttribute('aria-selected', 'false');
    });

    const targetTab = document.getElementById(tabId);
    if(targetTab) {
        targetTab.style.display = 'block';
        // slight delay for transition
        setTimeout(() => {
            targetTab.classList.add('active');
            setupRevealAnimations(targetTab);
            if (tabId === 'food') setupScrollSpy();
            if (tabId === 'itinerary') setupTimelineScrollLife(targetTab);
        }, 10);
    }

    // Highlight the matching nav button (works whether called from a click or programmatically)
    const navBtn = document.querySelector(`.nav-btn[aria-controls="${tabId}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
        navBtn.setAttribute('aria-selected', 'true');
    }

    // Keep the URL in sync (bookmarkable/shareable tabs, working Back
    // button) - history.pushState/replaceState rather than location.hash=,
    // which would fire a redundant hashchange and re-scroll. Skipped when
    // the hash already matches (e.g. this call originated FROM a
    // hashchange/popstate event, whose handler already sees the new hash),
    // so Back/Forward never pushes a duplicate entry on top of itself.
    if (location.hash !== '#' + tabId) {
        if (!tabHistoryInitialized) {
            history.replaceState({ tab: tabId }, '', '#' + tabId);
        } else {
            history.pushState({ tab: tabId }, '', '#' + tabId);
        }
    }
    tabHistoryInitialized = true;

    if (!skipScroll) {
        // Scroll to the sticky nav's actual position rather than a fixed
        // offset: the trip dashboard above it can be ~1400px tall, so a
        // hardcoded value used to land back near the hero/dashboard
        // instead of showing the tab content that was just requested.
        const stickyNav = document.getElementById('sticky-nav-bar');
        const targetY = stickyNav ? stickyNav.getBoundingClientRect().top + window.scrollY : 100;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
    }

    syncMobileBottomNav(tabId);

    // The map FAB only makes sense on the beaches tab (the only tab
    // with a map to show), so it's only revealed there.
    const mapFabBtn = document.getElementById('map-fab-btn');
    if (mapFabBtn) mapFabBtn.classList.toggle('map-fab-visible', tabId === 'beaches');
}

// Back/Forward through previously-viewed tabs, and same-page hash edits
// (e.g. typing #food into an already-open tab's address bar) - both can
// fire independently of each other, so both are covered; a hash that
// doesn't name a real tab is silently ignored rather than switched to.
window.addEventListener('hashchange', () => {
    const tabId = getTabIdFromHash();
    if (tabId) switchTab(tabId, true);
});
window.addEventListener('popstate', () => {
    const tabId = getTabIdFromHash();
    if (tabId) switchTab(tabId, true);
});

// Keeps the mobile bottom nav's "you are here" dot in sync with the
// open tab. Beaches has two shortcuts (the plain beaches button and
// the favorites button), so it also checks which beach filter is
// currently active rather than just the tab id.
function syncMobileBottomNav(tabId) {
    const isFavoritesActive = tabId === 'beaches' &&
        document.querySelector('.beach-filter-btn[data-filter="favorites"].active') !== null;
    const activeKey = isFavoritesActive ? 'beaches-favorites' : tabId;
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === activeKey);
    });
}

// Keyboard support for the main tablist, per the standard ARIA tabs
// pattern (previously mouse-only despite role="tablist"/role="tab"
// already being declared). Direction follows the page's RTL layout:
// ArrowLeft moves forward through the tabs, ArrowRight moves back.
function handleTablistKeydown(event) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    const tabs = Array.from(event.currentTarget.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    event.preventDefault();
    let nextIndex;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === 'ArrowRight') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else nextIndex = tabs.length - 1;

    tabs[nextIndex].focus();
    tabs[nextIndex].click();
}

// Premium card entrance animation. Uses ONE shared IntersectionObserver for the whole
// page (not one per card) to keep this cheap performance-wise. Applied progressively:
// if JS fails for any reason, cards simply never get the opacity-0 class and remain visible.
const revealObserver = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target); // reveal once, then stop watching (cheaper)
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }) : null;

function setupRevealAnimations(container) {
    if (!revealObserver) return; // graceful no-op on very old browsers
    const cards = container.querySelectorAll('article:not([data-revealed]), .bg-white.rounded-2xl:not([data-revealed]), #faq-list details:not([data-revealed])');
    cards.forEach(card => {
        card.setAttribute('data-revealed', '1');
        card.classList.add('reveal-on-scroll');
        revealObserver.observe(card);
    });
}

// Scroll-spy: as the user scrolls through Food's 14 categories, highlight
// whichever category's quick-nav pill matches what's currently on screen —
// so the nav visibly tracks reading position instead of staying static.
const scrollSpyObserver = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const link = document.querySelector(`#food-quick-nav a[href="#${entry.target.id}"]`);
        if (!link) return;
        if (entry.isIntersecting) {
            document.querySelectorAll('#food-quick-nav a').forEach(a => a.classList.remove('quick-nav-active'));
            link.classList.add('quick-nav-active');
        }
    });
}, { rootMargin: '-20% 0px -70% 0px' }) : null;

function setupScrollSpy() {
    if (!scrollSpyObserver) return;
    document.querySelectorAll('#food [id^="cat-"]').forEach(el => scrollSpyObserver.observe(el));
}

// Timeline "comes alive" per item as it scrolls into view, on top of the
// existing tab-open cascade. Progressive enhancement: the .timeline-pending
// class (which is what actually hides the item) is only added here, in JS —
// so if this never runs, timeline items simply stay visible as normal.
const timelineScrollObserver = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.remove('timeline-pending');
            entry.target.classList.add('timeline-alive');
            timelineScrollObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }) : null;

function setupTimelineScrollLife(container) {
    if (!timelineScrollObserver) return;
    container.querySelectorAll('.premium-timeline-item:not([data-timeline-observed])').forEach(item => {
        item.setAttribute('data-timeline-observed', '1');
        item.classList.add('timeline-pending');
        timelineScrollObserver.observe(item);
    });
}

// Scroll progress bar + back-to-top button visibility + sticky-nav
// auto-hide. Uses requestAnimationFrame throttling to avoid excessive
// DOM writes on scroll — all three share this one listener rather than
// adding separate ones. The three elements are looked up once (cached
// below, once the DOM is ready) instead of on every scroll frame.
let scrollTicking = false;
let lastScrollY = window.scrollY;
let scrollProgressBarEl = null;
let backToTopBtnEl = null;
let stickyNavBarEl = null;
let lastStickyFilterTop = null;
function updateScrollUI() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    const bar = scrollProgressBarEl;
    if (bar) {
        bar.style.width = progress + '%';
        bar.setAttribute('aria-valuenow', Math.round(progress));
    }

    const btn = backToTopBtnEl;
    if (btn) {
        const show = scrollTop > 400;
        btn.classList.toggle('opacity-0', !show);
        btn.classList.toggle('pointer-events-none', !show);
        btn.classList.toggle('translate-y-4', !show);
    }

    // Sticky nav: hide while actively scrolling down past the hero, show
    // again the moment the user scrolls up (or is near the top) — never
    // hide it while focus is inside it, so keyboard users never lose a
    // focused tab off-screen. Desktop/tablet only: on mobile the bottom
    // tab bar only covers 5 of the 8 sections (itinerary/beaches/
    // search/food/favorites) — this nav is the only route to
    // attractions/gems/activities/shopping/FAQ, so it stays put there.
    const navBar = stickyNavBarEl;
    if (navBar && window.innerWidth >= 768) {
        const scrollingDown = scrollTop > lastScrollY;
        const focusInsideNav = navBar.contains(document.activeElement);
        if (scrollTop > 220 && scrollingDown && !focusInsideNav) {
            navBar.classList.add('nav-hidden');
        } else if (!scrollingDown || scrollTop <= 220) {
            navBar.classList.remove('nav-hidden');
        }
    } else if (navBar) {
        navBar.classList.remove('nav-hidden');
    }

    // Sticky filter bars: keep --sticky-filter-top matched to the nav
    // bar's ACTUAL current bottom edge (its rendered position, not just
    // its height), so the filter bar sits flush under it with zero gap
    // whether the nav is fully shown, mid-hide, or fully hidden.
    if (navBar) {
        const navBottom = Math.max(0, navBar.getBoundingClientRect().bottom);
        if (navBottom !== lastStickyFilterTop) {
            document.documentElement.style.setProperty('--sticky-filter-top', navBottom + 'px');
            lastStickyFilterTop = navBottom;
        }
    }

    lastScrollY = scrollTop;

    scrollTicking = false;
}
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(updateScrollUI);
        scrollTicking = true;
    }
}, { passive: true });

window.switchTab = switchTab;
window.handleTablistKeydown = handleTablistKeydown;

