// Tab ids this app actually has a .tab-content section for - used to
// validate incoming hash values (URL bar edits, bookmarks, Back/Forward)
// before ever treating one as a tab id.
const VALID_TAB_IDS = ['about', 'itinerary', 'beaches', 'food', 'attractions', 'gems', 'activities', 'shopping', 'faq'];

function getTabIdFromHash() {
    const id = location.hash.slice(1);
    return VALID_TAB_IDS.includes(id) ? id : null;
}

// Deep link to one specific place: "#item=<data-id>". Tabs keep their
// existing plain "#beaches" form, so old bookmarks and shared tab links
// are unaffected. Item ids contain Hebrew, so the hash is percent-encoded
// on the way out and decoded here.
function getItemIdFromHash() {
    const raw = location.hash.slice(1);
    if (raw.indexOf('item=') !== 0) return null;
    const encoded = raw.slice(5);
    if (!encoded) return null;
    try {
        return decodeURIComponent(encoded);
    } catch (e) {
        return encoded; // malformed escape sequence - use as-is rather than throwing
    }
}

// Which tab an item lives on. Checks the data first (so it resolves even
// for a category that hasn't rendered yet) and falls back to the DOM for
// the hand-written cards that have no data-layer entry.
function findItemTab(itemId) {
    const data = window.CORFU_LOCATIONS;
    if (data) {
        const keys = Object.keys(CATEGORY_RENDERERS);
        for (let i = 0; i < keys.length; i++) {
            if ((data[keys[i]] || []).some(d => d.id === itemId)) return keys[i];
        }
    }
    const el = document.querySelector(`[data-id="${CSS.escape(itemId)}"]`);
    const section = el && el.closest('.tab-content');
    return section ? section.id : null;
}

// Opens the tab an item is on, then scrolls to and briefly highlights it.
// Returns false if the hash doesn't name a real item, so callers can fall
// through to their normal tab handling.
function openItemFromHash() {
    const itemId = getItemIdFromHash();
    if (!itemId) return false;
    const tabId = findItemTab(itemId);
    if (!tabId) return false;

    // keepHash: switchTab() normally rewrites the hash to its own tab id,
    // which would overwrite the "#item=..." the visitor just arrived on
    // and break the link the moment it was opened.
    switchTab(tabId, true, true);

    setTimeout(() => {
        const el = document.querySelector(`[data-id="${CSS.escape(itemId)}"]`);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('search-highlight'); // same brief highlight search uses
        setTimeout(() => el.classList.remove('search-highlight'), 2000);
    }, 60);
    return true;
}

// The very first tab activation (page load) must not consume a Back-button
// history slot, so it uses replaceState; every activation after that
// pushes, so Back/Forward can walk through previously-viewed tabs.
let tabHistoryInitialized = false;

// Step 8 (Phase 2): beaches/food/attractions/gems used to render all their
// cards unconditionally at script-load time (js/cards.js). Now each only
// renders the first time its own tab is opened, tracked here so a second
// visit to an already-rendered tab is a no-op.
const CATEGORY_RENDERERS = {
    beaches: 'renderAllBeaches',
    food: 'renderAllFood',
    attractions: 'renderAllAttractions',
    gems: 'renderAllGems'
};
const renderedTabs = new Set();

// Cards that didn't exist yet when these ran once at page load need the
// same hydration afterwards: saved favorite state and personal-tracking
// widget state. Both are cheap full re-scans and safe to repeat on cards
// already hydrated by an earlier call. (The search index deliberately
// isn't rebuilt - it's built from CORFU_LOCATIONS, not the DOM, so it
// already covers these cards whether or not they've rendered.)
function hydrateRenderedCards() {
    if (typeof initFavoriteButtons === 'function') initFavoriteButtons();
    if (typeof injectPersonalTrackingWidgets === 'function') injectPersonalTrackingWidgets();
}

// Renders one category's cards if they aren't in the DOM yet. Returns
// whether it actually rendered anything, so callers doing several at once
// can hydrate a single time at the end instead of once per category.
function renderCategory(tabId) {
    const rendererName = CATEGORY_RENDERERS[tabId];
    if (!rendererName || renderedTabs.has(tabId)) return false;
    renderedTabs.add(tabId);
    if (typeof window[rendererName] === 'function') window[rendererName]();
    return true;
}

function ensureTabRendered(tabId) {
    if (renderCategory(tabId)) hydrateRenderedCards();
}

// Lazy rendering keeps ~162 cards off the critical path, but leaving them
// out of the DOM entirely until someone clicks the right tab also hides
// the bulk of this site's content from search-engine crawlers, browser
// Ctrl+F, screen-reader document browse, and Print/Save. So once the page
// is loaded and the browser is idle, quietly render whatever hasn't been
// rendered yet: first paint stays lean, and the DOM is still complete a
// moment later. Any tab opened before this runs is simply already done.
function renderRemainingCategories() {
    const rendered = Object.keys(CATEGORY_RENDERERS).map(renderCategory);
    if (rendered.some(Boolean)) hydrateRenderedCards();
}

function scheduleRemainingCategoryRender() {
    const run = () => renderRemainingCategories();
    // requestIdleCallback yields to anything more urgent; the timeout
    // fallback covers Safari, which still doesn't support it.
    if ('requestIdleCallback' in window) {
        requestIdleCallback(run, { timeout: 3000 });
    } else {
        setTimeout(run, 1200);
    }
}

function switchTab(tabId, skipScroll, keepHash) {
    ensureTabRendered(tabId);

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
    // keepHash is set when the URL already points at something more
    // specific than a tab (an "#item=..." deep link), which this must not
    // overwrite.
    if (!keepHash && location.hash !== '#' + tabId) {
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
    if (openItemFromHash()) return; // "#item=..." wins over plain tab hashes
    const tabId = getTabIdFromHash();
    if (tabId) switchTab(tabId, true);
});
window.addEventListener('popstate', () => {
    if (openItemFromHash()) return;
    const tabId = getTabIdFromHash();
    if (tabId) switchTab(tabId, true);
});

// One transient status message, shared by every caller (offline notice,
// share confirmation) instead of each one poking at the element itself.
let appToastTimer = null;
function showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('app-toast-visible');
    clearTimeout(appToastTimer); // a second message restarts the clock rather than inheriting the first one's
    appToastTimer = setTimeout(() => toast.classList.remove('app-toast-visible'), 4000);
}

// Share one place. Uses the OS share sheet where there is one (which is
// the phone, i.e. where someone is most likely to be sending a friend a
// restaurant), and falls back to copying the link otherwise.
function shareItem(btnEl) {
    const card = btnEl.closest('[data-id]');
    if (!card) return;
    const itemId = card.getAttribute('data-id');
    const heading = card.querySelector('h3, h4');
    const name = heading ? heading.textContent.trim() : '';
    const url = location.origin + location.pathname + location.search + '#item=' + encodeURIComponent(itemId);

    if (navigator.share) {
        navigator.share({ title: name || document.title, text: name, url }).catch(() => {
            // AbortError just means the sheet was dismissed - nothing to report.
        });
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
            .then(() => showToast('הקישור הועתק 🔗'))
            .catch(() => showToast('לא ניתן להעתיק את הקישור'));
        return;
    }
    showToast('לא ניתן לשתף בדפדפן הזה');
}

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
window.scheduleRemainingCategoryRender = scheduleRemainingCategoryRender;
window.openItemFromHash = openItemFromHash;
window.getItemIdFromHash = getItemIdFromHash;
window.showToast = showToast;
window.shareItem = shareItem;

