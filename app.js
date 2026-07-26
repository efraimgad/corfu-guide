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

            // Ensure all links open in a new tab, safely: without rel=noopener
            // the new page can reach back via window.opener and redirect this
            // tab (reverse tabnabbing) — every http(s) link on the page goes
            // through here, so this one line covers all ~200 of them.
            const links = document.querySelectorAll('a');
            links.forEach(link => {
                if (link.hasAttribute('href') && (link.href.startsWith('http') || link.href.startsWith('https'))) {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                }
            });

            // Note: removed automatic image randomization - cards already have curated real photos.
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

        // Global search across beaches, food, attractions, hidden gems, activities
        // and the FAQ. Builds the search index live from the DOM (no separate data
        // duplication to maintain).
        let searchActiveIndex = -1;

        function performGlobalSearch(query) {
            const resultsBox = document.getElementById('global-search-results');
            const input = document.getElementById('global-search-input');
            const q = query.trim().toLowerCase();
            searchActiveIndex = -1;

            if (q.length < 2) {
                resultsBox.classList.add('hidden');
                resultsBox.innerHTML = '';
                input.setAttribute('aria-expanded', 'false');
                input.setAttribute('aria-activedescendant', '');
                return;
            }

            const sources = [
                { selector: '#beaches [data-name]', tabId: 'beaches', icon: '🏖️', getName: el => el.getAttribute('data-name') },
                { selector: '#food h4', tabId: 'food', icon: '🍽️', getName: el => el.textContent },
                { selector: '#attractions h3', tabId: 'attractions', icon: '📸', getName: el => el.textContent.replace(/^\d+\.\s*/, '') },
                { selector: '#gems h3', tabId: 'gems', icon: '💎', getName: el => el.textContent },
                { selector: '#activities-grid article h3', tabId: 'activities', icon: '🚤', getName: el => el.textContent },
                { selector: '#faq-list details', tabId: 'faq', icon: '❓', getName: el => (el.querySelector('summary span')?.textContent || '').replace(/^\d+\.\s*/, '') }
            ];

            let matches = [];
            sources.forEach(src => {
                document.querySelectorAll(src.selector).forEach(el => {
                    const name = src.getName(el).trim();
                    if (name.toLowerCase().includes(q)) {
                        matches.push({ name, tab: src.tabId, icon: src.icon, el });
                    }
                });
            });

            matches = matches.slice(0, 8);

            if (matches.length === 0) {
                resultsBox.innerHTML = '<p class="p-4 text-sm text-slate-400 text-center">לא נמצאו תוצאות עבור "' + query.trim() + '"</p>';
            } else {
                resultsBox.innerHTML = matches.map((m, i) =>
                    `<button type="button" id="search-option-${i}" role="option" onclick="goToSearchResult(${i})" onmouseenter="setSearchActiveIndex(${i})" class="w-full text-right px-4 py-2.5 text-sm hover:bg-teal-50 flex items-center gap-2 border-b border-slate-50 last:border-0">
                        <span>${m.icon}</span><span>${m.name}</span>
                    </button>`
                ).join('');
            }
            window._searchMatches = matches;
            resultsBox.classList.remove('hidden');
            input.setAttribute('aria-expanded', 'true');
        }

        // Keyboard-drive the results list: Down/Up move the highlighted option,
        // Enter selects it (or the first result if none highlighted yet),
        // Escape closes the dropdown and gives focus back to a clean input.
        function handleSearchKeydown(event) {
            const resultsBox = document.getElementById('global-search-results');
            const matches = window._searchMatches || [];
            if (resultsBox.classList.contains('hidden') || matches.length === 0) return;

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSearchActiveIndex((searchActiveIndex + 1) % matches.length);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSearchActiveIndex((searchActiveIndex - 1 + matches.length) % matches.length);
            } else if (event.key === 'Enter') {
                event.preventDefault();
                goToSearchResult(searchActiveIndex >= 0 ? searchActiveIndex : 0);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                resultsBox.classList.add('hidden');
                event.target.setAttribute('aria-expanded', 'false');
                event.target.value = '';
            }
        }

        function setSearchActiveIndex(index) {
            const options = document.querySelectorAll('#global-search-results [role="option"]');
            options.forEach(opt => opt.classList.remove('bg-teal-50'));
            searchActiveIndex = index;
            const active = options[index];
            if (active) {
                active.classList.add('bg-teal-50');
                active.scrollIntoView({ block: 'nearest' });
                document.getElementById('global-search-input').setAttribute('aria-activedescendant', active.id);
            }
        }

        function goToSearchResult(index) {
            const match = (window._searchMatches || [])[index];
            if (!match) return;

            switchTab(match.tab, true);
            document.getElementById('global-search-results').classList.add('hidden');
            document.getElementById('global-search-input').value = '';

            // Wait for the tab's display to update before scrolling to the card
            setTimeout(() => {
                let card = match.el.closest('article, .bg-white.rounded-2xl') || match.el;
                if (card.tagName === 'DETAILS') card.open = true;
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add('search-highlight');
                setTimeout(() => card.classList.remove('search-highlight'), 2000);
            }, 50);
        }

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            const searchBox = document.getElementById('global-search-results');
            const searchInput = document.getElementById('global-search-input');
            if (searchBox && searchInput && !searchInput.contains(e.target) && !searchBox.contains(e.target)) {
                searchBox.classList.add('hidden');
            }
        });

        // Beach filter system
        function filterBeaches(tag) {
            const grid = document.getElementById('beaches-grid');
            if (!grid) return;
            const cards = grid.querySelectorAll('[data-tags]');
            let visibleCount = 0;
            const favorites = getFavorites();

            cards.forEach(card => {
                const cardTags = (card.getAttribute('data-tags') || '').split(',');
                let show;
                if (tag === 'all') {
                    show = true;
                } else if (tag === 'favorites') {
                    show = favorites.includes(card.getAttribute('data-id'));
                } else {
                    show = cardTags.includes(tag);
                }
                card.style.display = show ? '' : 'none';
                if (show) visibleCount++;
            });

            // Update button active states
            document.querySelectorAll('.beach-filter-btn').forEach(btn => {
                const isActive = btn.getAttribute('data-filter') === tag;
                btn.classList.toggle('active', isActive);
                btn.classList.toggle('bg-blue-600', isActive);
                btn.classList.toggle('text-white', isActive);
                btn.classList.toggle('bg-gray-100', !isActive);
                btn.classList.toggle('text-gray-700', !isActive);
            });
            syncMobileBottomNav('beaches');

            // Update count message
            const countEl = document.getElementById('beach-filter-count');
            if (countEl) {
                const total = cards.length;
                if (tag === 'favorites') {
                    countEl.textContent = visibleCount > 0
                        ? `מציג ${visibleCount} חופים שמורים`
                        : `עדיין לא שמרתם חופים - לחצו על הלב בכרטיס כדי להוסיף`;
                } else {
                    countEl.textContent = (tag === 'all')
                        ? `מציג את כל ${total} החופים`
                        : `מציג ${visibleCount} מתוך ${total} חופים`;
                }
            }
            const emptyEl = document.getElementById('beaches-empty-state');
            if (emptyEl) emptyEl.classList.toggle('hidden', !(visibleCount === 0 && tag !== 'favorites'));
        }

        // Attractions filter system
        function filterAttractions(tag) {
            const grid = document.getElementById('attractions-grid');
            if (!grid) return;
            const cards = grid.querySelectorAll('[data-tags]');
            let visibleCount = 0;
            const favorites = getFavorites();

            cards.forEach(card => {
                const cardTags = (card.getAttribute('data-tags') || '').split(',');
                let show;
                if (tag === 'all') {
                    show = true;
                } else if (tag === 'favorites') {
                    show = favorites.includes(card.getAttribute('data-id'));
                } else {
                    show = cardTags.includes(tag);
                }
                card.style.display = show ? '' : 'none';
                if (show) visibleCount++;
            });

            document.querySelectorAll('.attr-filter-btn').forEach(btn => {
                const isActive = btn.getAttribute('data-filter') === tag;
                btn.classList.toggle('active', isActive);
                btn.classList.toggle('bg-blue-600', isActive);
                btn.classList.toggle('text-white', isActive);
                btn.classList.toggle('bg-gray-100', !isActive);
                btn.classList.toggle('text-gray-700', !isActive);
            });

            const countEl = document.getElementById('attr-filter-count');
            if (countEl) {
                const total = cards.length;
                if (tag === 'favorites') {
                    countEl.textContent = visibleCount > 0
                        ? `מציג ${visibleCount} אטרקציות שמורות`
                        : `עדיין לא שמרתם אטרקציות - לחצו על הלב בכרטיס כדי להוסיף`;
                } else {
                    countEl.textContent = (tag === 'all')
                        ? `מציג את כל ${total} האטרקציות`
                        : `מציג ${visibleCount} מתוך ${total} אטרקציות`;
                }
            }
            const emptyEl = document.getElementById('attractions-empty-state');
            if (emptyEl) emptyEl.classList.toggle('hidden', !(visibleCount === 0 && tag !== 'favorites'));
        }

        // Hidden gems filter system
        function filterGems(tag) {
            const grid = document.getElementById('gems-container-grid');
            if (!grid) return;
            const cards = grid.querySelectorAll('[data-tags]');
            let visibleCount = 0;
            const favorites = getFavorites();

            cards.forEach(card => {
                const cardTags = (card.getAttribute('data-tags') || '').split(',');
                let show;
                if (tag === 'all') {
                    show = true;
                } else if (tag === 'favorites') {
                    show = favorites.includes(card.getAttribute('data-id'));
                } else {
                    show = cardTags.includes(tag);
                }
                card.style.display = show ? '' : 'none';
                if (show) visibleCount++;
            });

            document.querySelectorAll('.gem-filter-btn').forEach(btn => {
                const isActive = btn.getAttribute('data-filter') === tag;
                btn.classList.toggle('active', isActive);
                btn.classList.toggle('bg-blue-600', isActive);
                btn.classList.toggle('text-white', isActive);
                btn.classList.toggle('bg-gray-100', !isActive);
                btn.classList.toggle('text-gray-700', !isActive);
            });

            const countEl = document.getElementById('gem-filter-count');
            if (countEl) {
                const total = cards.length;
                if (tag === 'favorites') {
                    countEl.textContent = visibleCount > 0
                        ? `מציג ${visibleCount} פנינים שמורות`
                        : `עדיין לא שמרתם פנינים - לחצו על הלב בכרטיס כדי להוסיף`;
                } else {
                    countEl.textContent = (tag === 'all')
                        ? `מציג את כל ${total} הפנינים`
                        : `מציג ${visibleCount} מתוך ${total} פנינים`;
                }
            }
            const emptyEl = document.getElementById('gems-empty-state');
            if (emptyEl) emptyEl.classList.toggle('hidden', !(visibleCount === 0 && tag !== 'favorites'));
        }

        // Restaurant filter system
        function filterFood(tag) {
            const cards = document.querySelectorAll('#food [data-tags]');
            let visibleCount = 0;
            const favorites = getFavorites();

            cards.forEach(card => {
                const cardTags = (card.getAttribute('data-tags') || '').split(',');
                let show;
                if (tag === 'all') {
                    show = true;
                } else if (tag === 'favorites') {
                    show = favorites.includes(card.getAttribute('data-id'));
                } else {
                    show = cardTags.includes(tag);
                }
                card.style.display = show ? '' : 'none';
                if (show) visibleCount++;
            });

            document.querySelectorAll('.food-filter-btn').forEach(btn => {
                const isActive = btn.getAttribute('data-filter') === tag;
                btn.classList.toggle('active', isActive);
                if (isActive) {
                    btn.classList.add('bg-blue-600', 'text-white');
                    btn.classList.remove('bg-gray-100', 'bg-green-50', 'bg-blue-50', 'bg-purple-50', 'bg-amber-50', 'text-gray-700', 'text-green-800', 'text-blue-800', 'text-purple-800', 'text-amber-800');
                } else {
                    btn.classList.remove('bg-blue-600', 'text-white');
                    if (!btn.classList.contains('bg-gray-100') && !['budget','midrange','upscale','luxury'].includes(btn.getAttribute('data-filter'))) {
                        btn.classList.add('bg-gray-100', 'text-gray-700');
                    }
                }
            });

            const countEl = document.getElementById('food-filter-count');
            if (countEl) {
                const total = cards.length;
                if (tag === 'favorites') {
                    countEl.textContent = visibleCount > 0
                        ? `מציג ${visibleCount} מסעדות שמורות`
                        : `עדיין לא שמרתם מסעדות - לחצו על הלב בכרטיס כדי להוסיף`;
                } else {
                    countEl.textContent = (tag === 'all')
                        ? `מציג את כל ${total} המסעדות`
                        : `מציג ${visibleCount} מתוך ${total} מסעדות`;
                }
            }
            const emptyEl = document.getElementById('food-empty-state');
            if (emptyEl) emptyEl.classList.toggle('hidden', !(visibleCount === 0 && tag !== 'favorites'));
        }

        // FAQ search/filter
        let faqActiveCategory = 'all';

        function applyFAQFilters() {
            const input = document.getElementById('faq-search-input');
            const q = (input ? input.value : '').trim().toLowerCase();
            const items = document.querySelectorAll('#faq-list details');
            let visibleCount = 0;

            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                const matchesQuery = q.length < 2 || text.includes(q);
                const matchesCategory = faqActiveCategory === 'all' || item.getAttribute('data-cat') === faqActiveCategory;
                const show = matchesQuery && matchesCategory;
                item.style.display = show ? '' : 'none';
                if (show) visibleCount++;
            });

            const countEl = document.getElementById('faq-search-count');
            if (countEl) {
                countEl.textContent = (q.length < 2 && faqActiveCategory === 'all')
                    ? `מציג את כל ${items.length} השאלות`
                    : `מציג ${visibleCount} מתוך ${items.length} שאלות`;
            }
            const emptyEl = document.getElementById('faq-empty-state');
            if (emptyEl) emptyEl.classList.toggle('hidden', visibleCount !== 0);
        }

        function filterFAQ(query) {
            applyFAQFilters();
        }

        function filterFAQCategory(cat) {
            faqActiveCategory = cat;
            document.querySelectorAll('.faq-filter-btn').forEach(btn => {
                const isActive = btn.getAttribute('data-filter') === cat;
                btn.classList.toggle('active', isActive);
                btn.classList.toggle('bg-indigo-600', isActive);
                btn.classList.toggle('text-white', isActive);
                btn.classList.toggle('bg-gray-100', !isActive);
                btn.classList.toggle('text-gray-700', !isActive);
            });
            applyFAQFilters();
        }

        
        const FAVORITES_KEY = 'corfu-guide-favorites';

        function getFavorites() {
            try {
                const raw = localStorage.getItem(FAVORITES_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (e) {
                return [];
            }
        }

        function saveFavorites(favArr) {
            try {
                localStorage.setItem(FAVORITES_KEY, JSON.stringify(favArr));
            } catch (e) {
                console.warn('Could not save favorites', e);
            }
        }

        function toggleFavorite(btnEl) {
            const card = btnEl.closest('[data-id]');
            if (!card) return;
            const id = card.getAttribute('data-id');
            let favorites = getFavorites();

            if (favorites.includes(id)) {
                favorites = favorites.filter(f => f !== id);
                btnEl.classList.remove('text-red-500', 'bg-red-50', 'favorite-btn--active');
                btnEl.classList.add('text-gray-400', 'bg-gray-50');
            } else {
                favorites.push(id);
                btnEl.classList.remove('text-gray-400', 'bg-gray-50');
                btnEl.classList.add('text-red-500', 'bg-red-50', 'favorite-btn--active');
            }
            saveFavorites(favorites);
            updateDashFavCount();
            // Push this change to Supabase in the background (Step 7) - never
            // blocks or reverts the local toggle above, even if it fails.
            if (typeof queueItemStateSync === 'function') queueItemStateSync(id);

            // Small tactile confirmation that the tap registered
            btnEl.classList.remove('heart-pop');
            void btnEl.offsetWidth; // restart the animation even if toggled twice quickly
            btnEl.classList.add('heart-pop');

            // If currently viewing "favorites only" in any filterable section,
            // refresh that view live so an unfavorited card disappears immediately.
            [
                ['.beach-filter-btn', filterBeaches],
                ['.food-filter-btn', filterFood],
                ['.attr-filter-btn', filterAttractions],
                ['.gem-filter-btn', filterGems]
            ].forEach(([selector, filterFn]) => {
                const activeBtn = document.querySelector(selector + '.active');
                if (activeBtn && activeBtn.getAttribute('data-filter') === 'favorites') {
                    filterFn('favorites');
                }
            });
        }

        // Applies saved favorite state to every heart button on the page (all sections, not just beaches)
        function initFavoriteButtons() {
            const favorites = getFavorites();
            document.querySelectorAll('[data-id]').forEach(card => {
                const id = card.getAttribute('data-id');
                const btn = card.querySelector('.favorite-btn');
                if (btn && favorites.includes(id)) {
                    btn.classList.add('favorite-btn--active');
                    btn.classList.remove('text-gray-400', 'bg-gray-50');
                    btn.classList.add('text-red-500', 'bg-red-50');
                }
            });
        }

        // Trip progress tracker: lets users mark each itinerary day as completed,
        // persisted in localStorage so it survives page reloads.
        const TRIP_PROGRESS_KEY = 'corfu-guide-trip-progress';
        const TOTAL_TRIP_DAYS = 7;

        function getCompletedDays() {
            try {
                const raw = localStorage.getItem(TRIP_PROGRESS_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (e) {
                return [];
            }
        }

        function saveCompletedDays(days) {
            try {
                localStorage.setItem(TRIP_PROGRESS_KEY, JSON.stringify(days));
            } catch (e) {
                console.warn('Could not save trip progress', e);
            }
        }

        // Collapsible day cards: click a day's header to fold/unfold its full
        // timeline, so the itinerary can be scanned at a glance and expanded
        // only for the day(s) currently being planned — a common pattern in
        // premium trip-planner apps.
        function toggleDayCard(headerEl) {
            const body = headerEl.nextElementSibling;
            const chevron = headerEl.querySelector('.day-card-chevron');
            if (!body) return;
            const isCollapsed = body.classList.toggle('day-card-collapsed');
            if (chevron) {
                chevron.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
        }

        // Quick action: open or fold every day at once, for scanning the whole
        // week or focusing on a single day without seven clicks.
        function setAllDayCards(expand) {
            document.querySelectorAll('.premium-day-header').forEach(header => {
                const body = header.nextElementSibling;
                const chevron = header.querySelector('.day-card-chevron');
                if (!body) return;
                body.classList.toggle('day-card-collapsed', !expand);
                if (chevron) chevron.style.transform = expand ? 'rotate(0deg)' : 'rotate(-90deg)';
            });
        }

        function toggleDayComplete(checkboxEl) {
            const day = checkboxEl.getAttribute('data-day');
            let completed = getCompletedDays();
            if (checkboxEl.checked) {
                if (!completed.includes(day)) completed.push(day);
            } else {
                completed = completed.filter(d => d !== day);
            }
            saveCompletedDays(completed);
            updateTripProgressUI(completed);
            // Push this change to Supabase in the background (Step 7) - never
            // blocks or reverts the local toggle above, even if it fails.
            if (typeof queueItineraryDaySync === 'function') queueItineraryDaySync(Number(day), checkboxEl.checked);

            // Auto-collapse a day shortly after marking it complete, to reduce
            // clutter as the trip progresses. Only ever collapses — unchecking
            // never force-expands a card the user may still be reading.
            if (checkboxEl.checked) {
                const header = checkboxEl.closest('.premium-day-header');
                const body = header && header.nextElementSibling;
                if (header && body && !body.classList.contains('day-card-collapsed')) {
                    setTimeout(() => toggleDayCard(header), 600);
                }
            }
        }

        function updateTripProgressUI(completed) {
            const count = completed.length;
            const pct = Math.round((count / TOTAL_TRIP_DAYS) * 100);
            const textEl = document.getElementById('trip-progress-text');
            const fillEl = document.getElementById('trip-progress-bar-fill');
            const trackEl = document.getElementById('trip-progress-bar-track');
            if (textEl) textEl.textContent = `${count} מתוך ${TOTAL_TRIP_DAYS} ימים הושלמו`;
            if (fillEl) fillEl.style.width = pct + '%';
            if (trackEl) trackEl.setAttribute('aria-valuenow', count);
        }

        function initTripProgress() {
            const completed = getCompletedDays();
            document.querySelectorAll('.day-complete-checkbox').forEach(cb => {
                if (completed.includes(cb.getAttribute('data-day'))) {
                    cb.checked = true;
                }
            });
            updateTripProgressUI(completed);
        }

        // Interactive map of all beaches
        const BEACH_LOCATIONS = [
            { name: "פלאוקסטריצה (Agios Spyridon)", lat: 39.6726, lon: 19.7011 },
            { name: "רוביניה (Rovinia)", lat: 39.6644, lon: 19.7214 },
            { name: "פורטו טימוני (Porto Timoni)", lat: 39.7208, lon: 19.6586 },
            { name: "אגיוס גאורגיוס פגון", lat: 39.7155, lon: 19.6738 },
            { name: "לוגאס - חוף השקיעה (Logas)", lat: 39.7942, lon: 19.6631 },
            { name: "תעלת האהבה (Canal d'Amour)", lat: 39.7963, lon: 19.6976 },
            { name: "סידארי (Sidari)", lat: 39.7915, lon: 19.7042 },
            { name: "ארילאס (Arillas)", lat: 39.7423, lon: 19.6508 },
            { name: "אגיוס סטפנוס צפון-מערב", lat: 39.7589, lon: 19.6465 },
            { name: "גליפאדה (Glyfada)", lat: 39.5937, lon: 19.8080 },
            { name: "פלקאס - קונטוגיאלוס", lat: 39.5866, lon: 19.8142 },
            { name: "מירטיוטיסה (Myrtiotissa)", lat: 39.5947, lon: 19.7997 },
            { name: "ארמונס (Ermones)", lat: 39.6105, lon: 19.7801 },
            { name: "ליאפדס - חוף גפירה (Liapades)", lat: 39.6698, lon: 19.7397 },
            { name: "איסוס (Issos)", lat: 39.4328, lon: 19.9366 },
            { name: "הליקונאס (Halikounas)", lat: 39.4623, lon: 19.8973 },
            { name: "מרתיאס (Marathias)", lat: 39.4180, lon: 20.0035 },
            { name: "גרדנוס (Gardenos)", lat: 39.3871, lon: 20.0340 },
            { name: "ארקודילאס (Arkoudilas)", lat: 39.3700, lon: 20.0850 },
            { name: "קאבוס (Kavos)", lat: 39.3860, lon: 20.1130 },
            { name: "ברבטי (Barbati)", lat: 39.7214, lon: 19.8665 },
            { name: "ניסאקי (Nissaki)", lat: 39.7258, lon: 19.8974 },
            { name: "מפרץ אגני (Agni)", lat: 39.7356, lon: 19.9272 },
            { name: "קלאמי (Kalami)", lat: 39.7431, lon: 19.9351 },
            { name: "קרסיה (Kerasia)", lat: 39.7565, lon: 19.9408 },
            { name: "קסיופי - בטאריה וקנוני", lat: 39.7946, lon: 19.9213 }
        ];

        const FOOD_LOCATIONS = [
            { name: "מסעדת רקס (Rex)", lat: 39.6243, lon: 19.9217 },
            { name: "טולה גסטרונומיה", lat: 39.7394, lon: 19.9381 },
            { name: "הטברנה של מרינה", lat: 39.6210, lon: 19.9190 },
            { name: "ג'ורג' & אלנה טברנה", lat: 39.6240, lon: 19.9200 },
            { name: "קלימטריה", lat: 39.4600, lon: 19.9700 },
            { name: "אבלי (Avli)", lat: 39.6250, lon: 19.9210 },
            { name: "סלטו (Salto)", lat: 39.6230, lon: 19.9190 },
            { name: "הבית הלבן", lat: 39.7390, lon: 19.9380 },
            { name: "אקרוגיאלי", lat: 39.6700, lon: 19.7500 },
            { name: "בוקארי ביץ'", lat: 39.4400, lon: 19.9800 },
            { name: "גיאלוס", lat: 39.7500, lon: 19.9000 },
            { name: "א-מנו (A Mano)", lat: 39.6235, lon: 19.9215 },
            { name: "קפטן אוקטופוס", lat: 39.4600, lon: 19.9600 },
            { name: "טברנת קראסיה", lat: 39.7500, lon: 19.9300 },
            { name: "טרילוגיה", lat: 39.7600, lon: 19.9200 },
            { name: "הבאר הוונציאנית", lat: 39.6240, lon: 19.9200 },
            { name: "לה פמיליה", lat: 39.6250, lon: 19.9210 },
            { name: "מוראג'יה (Mouragia)", lat: 39.6260, lon: 19.9240 },
            { name: "נוליטה (Nolita)", lat: 39.6238, lon: 19.9218 },
            { name: "פסטה איטליאנה", lat: 39.6500, lon: 19.9000 },
            { name: "נינוס טברנה", lat: 39.6220, lon: 19.9210 },
            { name: "דה גריל האוס", lat: 39.6400, lon: 19.9100 },
            { name: "לדוקולה (Ladokolla)", lat: 39.6500, lon: 19.8500 },
            { name: "פיתה פיתה", lat: 39.6230, lon: 19.9220 },
            { name: "פליסבוס (Flisvos)", lat: 39.5980, lon: 19.9110 },
            { name: "קפה ליסטון", lat: 39.6245, lon: 19.9225 },
            { name: "מיקרו קפה (Mikro Café)", lat: 39.6238, lon: 19.9225 },
            { name: "גבאו ארוחות בוקר", lat: 39.6250, lon: 19.9100 },
            { name: "קבליירי גג", lat: 39.6230, lon: 19.9240 },
            { name: "פפט קפה", lat: 39.6210, lon: 19.9220 },
            { name: "פפג'ורג'יס פטיסרי", lat: 39.6242, lon: 19.9236 },
            { name: "סטארניו בייקרי (Starenio)", lat: 39.6238, lon: 19.9210 },
            { name: "קוקוצי סושי בר (Kukutsi)", lat: 39.5990, lon: 19.9100 },
            { name: "הנזל וגרטל", lat: 39.6250, lon: 19.9220 },
            { name: "דה קייק בוטיק", lat: 39.6200, lon: 19.9150 },
            { name: "אימאברי", lat: 39.6200, lon: 19.9250 },
            { name: "פאזוזו", lat: 39.5800, lon: 19.8200 },
            { name: "סקייויו (Skyview)", lat: 39.6000, lon: 19.9050 },
            { name: "נאוק אזור", lat: 39.6220, lon: 19.9260 },
            { name: "ברבטי קלאב", lat: 39.7100, lon: 19.8700 },
            { name: "דיוניסוס (Dionysos)", lat: 39.6240, lon: 19.9210 },
            { name: "סול סופלאקי", lat: 39.6220, lon: 19.9100 },
            { name: "בוגנוויליה (Bougainvillea)", lat: 39.5980, lon: 19.9090 },
            { name: "ברגר בר", lat: 39.6300, lon: 19.9200 },
            { name: "פיצטה", lat: 39.6210, lon: 19.9110 },
            { name: "אטרוסקו", lat: 39.6800, lon: 19.8400 },
            { name: "ארקדיון ביסטרו (Arcadion Bistrot)", lat: 39.6245, lon: 19.9238 },
            { name: "פומו ד'אורו", lat: 39.6240, lon: 19.9220 },
            { name: "אורה (Ora)", lat: 39.6270, lon: 19.9260 },
            { name: "רוזמרינו (Rosmarino)", lat: 39.6236, lon: 19.9212 },
            { name: "7th Heaven Cafe", lat: 39.7877, lon: 19.6672 },
            { name: "סאנסט טברנה (Sunset Taverna)", lat: 39.6850, lon: 19.6860 },
            { name: "אמפלונאס (Ambelonas)", lat: 39.6120, lon: 19.7980 },
            { name: "כריס פלייס / סופיה (Chris Place)", lat: 39.5390, lon: 19.8350 },
            { name: "אקרון ביץ' בר (Akron)", lat: 39.673348, lon: 19.715083 },
            { name: "נגואל ביץ' בר (Nagual)", lat: 39.5904, lon: 19.8169 },
            { name: "סיירנס לאונג' (Sirens)", lat: 39.4180, lon: 20.0035 },
            { name: "אליה טברנה (Elia)", lat: 39.6245, lon: 19.9218 },
            { name: "פאנה סובלאקי (Pane e Souvlaki)", lat: 39.6261, lon: 19.9206 },
            { name: "סטאברוס גריל (Stavros)", lat: 39.6122, lon: 19.8312 },
            { name: "ביזו קפה (Bizou Vegan Café)", lat: 39.6244, lon: 19.9201 },
            { name: "אוברג'ין (Aubergine)", lat: 39.6234, lon: 19.9228 },
            { name: "טאבולה ראסה (Tabule Rasa)", lat: 39.6241, lon: 19.9192 }
        ];

        const ATTRACTION_LOCATIONS = [
            { name: "העיר העתיקה של קורפו", lat: 39.6243, lon: 19.9217 },
            { name: "ארמון אכיליון", lat: 39.5730, lon: 19.8780 },
            { name: "מנזר פלאוקסטריצה", lat: 39.6726, lon: 19.7011 },
            { name: "תעלת האהבה (Canal d'Amour)", lat: 39.7963, lon: 19.6976 },
            { name: "מבצר אנגלוקסטרו", lat: 39.6784, lon: 19.6872 },
            { name: "הר פנטוקראטור", lat: 39.7481, lon: 19.8650 },
            { name: "חוף פורטו טימוני", lat: 39.7208, lon: 19.6586 },
            { name: "כפר קסיופי", lat: 39.7946, lon: 19.9213 },
            { name: "מנזר ולכרנה ואי העכבר", lat: 39.5975, lon: 19.9106 },
            { name: "המבצר הישן", lat: 39.6255, lon: 19.9280 },
            { name: "המבצר החדש", lat: 39.6280, lon: 19.9200 },
            { name: "כף דרסטיס", lat: 39.7977, lon: 19.6747 },
            { name: "חוף לוגאס (שקיעה)", lat: 39.7942, lon: 19.6631 },
            { name: "כפר אפיאונס", lat: 39.7192, lon: 19.6586 },
            { name: "חוף אגיוס גורדיוס", lat: 39.5470, lon: 19.8530 },
            { name: "חוף גליפאדה", lat: 39.5937, lon: 19.8080 },
            { name: "פארק המים אקוולנד", lat: 39.5750, lon: 19.8450 },
            { name: "הבית של משפחת דארל (קלאמי)", lat: 39.7431, lon: 19.9351 },
            { name: "ארמון מון רפוס", lat: 39.6100, lon: 19.9250 },
            { name: "תצפית הקייזר (פלקאס)", lat: 39.6000, lon: 19.8100 },
            { name: "אגם קוריסיון", lat: 39.4400, lon: 19.9000 },
            { name: "בר לה גרוטה", lat: 39.6730, lon: 19.7000 },
            { name: "המוזיאון לאמנות אסייתית", lat: 39.6250, lon: 19.9250 },
            { name: "כנסיית ספירידון הקדוש", lat: 39.6245, lon: 19.9205 },
            { name: "כיכר ספיאנאדה וליסטון", lat: 39.6242, lon: 19.9236 },
            { name: "חוף רוביניה", lat: 39.6644, lon: 19.7214 },
            { name: "מערות הים של פלאוקסטריצה", lat: 39.6730, lon: 19.7000 },
            { name: "מפלי נימפס", lat: 39.7500, lon: 19.7500 },
            { name: "הכפר הנטוש פריטיה", lat: 39.7300, lon: 19.8500 },
            { name: "מקלט החמורים של קורפו", lat: 39.6900, lon: 19.7550 },
            { name: "חוף איסוס", lat: 39.4328, lon: 19.9366 },
            { name: "מפרץ אגני", lat: 39.7356, lon: 19.9272 },
            { name: "כפר הדייגים קולורה", lat: 39.7500, lon: 19.9300 },
            { name: "חוף קרסיה", lat: 39.7565, lon: 19.9408 },
            { name: "יער ומנזר ארקודילס", lat: 39.3700, lon: 20.0850 },
            { name: "כפר דניליה", lat: 39.6600, lon: 19.8500 },
            { name: "האי וידו", lat: 39.6350, lon: 19.9250 },
            { name: "גשר הקייזר", lat: 39.5700, lon: 19.8800 },
            { name: "חוף ברבאטי", lat: 39.7214, lon: 19.8665 },
            { name: "האקווריום של קורפו", lat: 39.6720, lon: 19.7020 }
        ];

        const GEMS_LOCATIONS = [
            { name: "חוף רוביניה (Rovinia)", lat: 39.6644, lon: 19.7214 },
            { name: "פריתיה העתיקה (Old Perithia)", lat: 39.7300, lon: 19.8500 },
            { name: "כף דראסטיס (Cape Drastis)", lat: 39.7977, lon: 19.6747 },
            { name: "אחוזת תיאוטוקי (Theotoky Estate)", lat: 39.6100, lon: 19.8300 },
            { name: "חוף חומי (Chomi Beach)", lat: 39.6700, lon: 19.7220 },
            { name: "מפלי נימפס (Nymphes Waterfalls)", lat: 39.7500, lon: 19.7500 },
            { name: "שמורת הטבע ארימיטיס (Erimitis)", lat: 39.7780, lon: 19.9000 },
            { name: "הכפר אפיאונס (Afionas)", lat: 39.7192, lon: 19.6586 },
            { name: "אמבלונאס קורפו (Ambelonas)", lat: 39.6120, lon: 19.7980 },
            { name: "סוקראקי (Sokraki)", lat: 39.7000, lon: 19.7300 },
            { name: "אגם קוריסיון (Lake Korission)", lat: 39.4461, lon: 19.9069 },
            { name: "יער ארקודילאס (Arkoudilas Forest)", lat: 39.3700, lon: 20.0850 },
            { name: "חוף סטלארי (Stellari Beach)", lat: 39.6650, lon: 19.7300 },
            { name: "כס הקיסר בפלקאס (Kaiser's Throne)", lat: 39.6000, lon: 19.8100 },
            { name: "הטברנה של מרינה (Marina's Tavern)", lat: 39.6220, lon: 19.9190 },
            { name: "מערת גראבה (Grava Cave)", lat: 39.7700, lon: 19.8800 },
            { name: "הכפר חלומאס (Chlomos)", lat: 39.4500, lon: 19.9500 },
            { name: "חוף אקולי (Akoli Beach)", lat: 39.7750, lon: 19.8950 },
            { name: "גן לוצ'יולה (Lucciola Garden)", lat: 39.6500, lon: 19.7500 },
            { name: "חוף גיאילי (Giali Beach)", lat: 39.6650, lon: 19.7350 },
            { name: "חוף לימני, גליקו (Limni Beach)", lat: 39.6600, lon: 19.8400 },
            { name: "מוזיאון הפולקלור בסינראדס", lat: 39.5700, lon: 19.8300 },
            { name: "ארט קפה, קלימטיה", lat: 39.7500, lon: 19.7700 },
            { name: "כפר קוואלורי (Kavalouri)", lat: 39.7500, lon: 19.7100 },
            { name: "יקב פונטיגליו (Pontiglio)", lat: 39.4200, lon: 19.9500 },
            { name: "Toula's Gastronomy", lat: 39.7394, lon: 19.9381 },
            { name: "סטרינילס (Strinilas)", lat: 39.7200, lon: 19.8300 },
            { name: "מיקרו ניסי (Micro Nisi)", lat: 39.4000, lon: 19.9800 },
            { name: "מערת פנטוקרטור", lat: 39.7500, lon: 19.8600 },
            { name: "מפרץ אגני (Agni Bay)", lat: 39.7356, lon: 19.9272 },
            { name: "אחוזת מון רפוס (Mon Repos)", lat: 39.6100, lon: 19.9250 },
            { name: "התצפית הנסתרת בפורטו טימוני", lat: 39.7208, lon: 19.6586 },
            { name: "כירה כריסיקו (Kyra Chrysikou)", lat: 39.6500, lon: 19.8600 }
        ];

        let beachMapInstance = null;
        let mapLayerGroups = { beaches: null, food: null, attractions: null, gems: null };

        // Loads Leaflet + the marker-cluster plugin on first use only (they
        // used to load unconditionally from head tags on every page view).
        // Safe to call every time toggleBeachMap() runs - after the first
        // successful load it just calls back immediately.
        let leafletLoadPromise = null;
        function loadLeafletThen(callback) {
            if (typeof L !== 'undefined') { callback(); return; }
            if (!leafletLoadPromise) {
                leafletLoadPromise = new Promise((resolve, reject) => {
                    const addCss = href => {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = href;
                        document.head.appendChild(link);
                    };
                    addCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
                    addCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css');
                    addCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css');

                    const leafletScript = document.createElement('script');
                    leafletScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
                    leafletScript.onload = () => {
                        const clusterScript = document.createElement('script');
                        clusterScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js';
                        clusterScript.onload = resolve;
                        clusterScript.onerror = reject;
                        document.head.appendChild(clusterScript);
                    };
                    leafletScript.onerror = reject;
                    document.head.appendChild(leafletScript);
                });
            }
            leafletLoadPromise.then(callback).catch(() => callback()); // initBeachMap already shows a friendly fallback if L is still undefined
        }

        function toggleBeachMap() {
            const container = document.getElementById('beach-map-container');
            const btn = document.getElementById('map-toggle-btn');
            const isHidden = container.style.display === 'none';

            container.style.display = isHidden ? 'block' : 'none';
            btn.textContent = isHidden ? '🗺️ הסתר את המפה' : '🗺️ הצג מפה מאוחדת של כל האי (חופים, מסעדות, אטרקציות)';

            if (isHidden && !beachMapInstance) {
                loadLeafletThen(() => setTimeout(initBeachMap, 50));
            } else if (isHidden && beachMapInstance) {
                setTimeout(() => beachMapInstance.invalidateSize(), 50);
            }
        }

        // Lookup index so cards can find their marker (and vice versa) by name + layer type
        const mapMarkerIndex = {};

        function buildLayerGroup(locations, color, layerKey) {
            // Use marker clustering when the plugin is available; fall back to a plain layer group otherwise
            const group = (typeof L.markerClusterGroup === 'function')
                ? L.markerClusterGroup({
                    maxClusterRadius: 50,
                    iconCreateFunction: cluster => L.divIcon({
                        html: `<div style="background:${color};color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);">${cluster.getChildCount()}</div>`,
                        className: '',
                        iconSize: [36, 36]
                    })
                })
                : L.layerGroup();

            locations.forEach(loc => {
                const marker = L.circleMarker([loc.lat, loc.lon], {
                    radius: 7, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.9
                });
                const mapsUrl = `https://maps.google.com/?q=${loc.lat},${loc.lon}`;
                marker.bindPopup(
                    `<strong>${loc.name}</strong><br>` +
                    `<a href="${mapsUrl}" target="_blank" style="color:#2563eb;">📍 נווט לשם</a>` +
                    (layerKey === 'beaches' ? `<br><a href="#" onclick="openCardFromMap('${layerKey}','${loc.name.replace(/'/g, "\\'")}'); return false;" style="color:#0d9488;">📇 פתח כרטיס</a>` : '')
                );
                group.addLayer(marker);
                mapMarkerIndex[layerKey + '::' + loc.name] = marker;
            });
            return group;
        }

        function initBeachMap() {
            if (typeof L === 'undefined') {
                document.getElementById('beach-map').innerHTML = '<p class="text-center text-gray-400 p-10">לא ניתן לטעון את המפה כרגע (חיבור אינטרנט נדרש).</p>';
                return;
            }
            beachMapInstance = L.map('beach-map').setView([39.62, 19.85], 10);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(beachMapInstance);

            mapLayerGroups.beaches = buildLayerGroup(BEACH_LOCATIONS, '#2563eb', 'beaches');
            mapLayerGroups.food = buildLayerGroup(FOOD_LOCATIONS, '#ea580c', 'food');
            mapLayerGroups.attractions = buildLayerGroup(ATTRACTION_LOCATIONS, '#9333ea', 'attractions');
            mapLayerGroups.gems = buildLayerGroup(GEMS_LOCATIONS, '#059669', 'gems');

            // A single distinct marker for the confirmed accommodation, styled
            // differently from the category dots so it stands out as "home base".
            // Coordinates are the village center (Gouvia), not a pinpoint street
            // address, since the exact property location hasn't been confirmed.
            const hotelIcon = L.divIcon({
                html: '<div style="background:#e11d48;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"><span style="transform:rotate(45deg);font-size:14px;">🏨</span></div>',
                className: '',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });
            mapLayerGroups.hotel = L.layerGroup([
                L.marker([39.6500, 19.8520], { icon: hotelIcon }).bindPopup(
                    '<strong>Tessera Boutique Hotel & Villas</strong><br>גוביה (Gouvia) - מקום הלינה שלכם<br>' +
                    '<a href="https://maps.google.com/?q=Tessera+Boutique+Hotel+%26+Villas+Gouvia+Corfu" target="_blank" style="color:#2563eb;">📍 נווט לשם</a>'
                )
            ]);

            // Beaches + hotel layers on by default (matches checkbox defaults)
            mapLayerGroups.beaches.addTo(beachMapInstance);
            mapLayerGroups.hotel.addTo(beachMapInstance);
        }

        // Marker popup -> jump back to the matching card in its tab
        function openCardFromMap(layerKey, name) {
            const tabMap = { beaches: 'beaches', food: 'food', attractions: 'attractions', gems: 'gems' };
            const tabId = tabMap[layerKey] || 'attractions';
            switchTab(tabId, true);
            setTimeout(() => {
                let card = document.querySelector(`#${tabId} [data-name="${CSS.escape(name)}"]`);
                if (!card) {
                    // Attractions/food cards may not have data-name; fall back to matching by heading text
                    const headings = document.querySelectorAll(`#${tabId} h3, #${tabId} h4`);
                    for (const h of headings) {
                        if (h.textContent.includes(name)) { card = h.closest('article, .bg-white.rounded-2xl'); break; }
                    }
                }
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('search-highlight');
                    setTimeout(() => card.classList.remove('search-highlight'), 2000);
                }
            }, 60);
        }

        // Card -> highlight its marker on the map (opens map if needed, pans, opens popup)
        function showOnMap(layerKey, name) {
            const container = document.getElementById('beach-map-container');
            const openMapAndFocus = () => {
                const marker = mapMarkerIndex[layerKey + '::' + name];
                const group = mapLayerGroups[layerKey];
                if (!marker || !beachMapInstance) return;
                // Make sure the relevant layer is checked/visible
                const checkbox = document.getElementById('layer-' + layerKey);
                if (checkbox && !checkbox.checked) {
                    checkbox.checked = true;
                    updateMapLayers();
                }
                // zoomToShowLayer handles un-clustering and panning correctly when clustering is active;
                // fall back to a plain setView + openPopup if the cluster plugin isn't available.
                if (group && typeof group.zoomToShowLayer === 'function') {
                    group.zoomToShowLayer(marker, () => marker.openPopup());
                } else {
                    beachMapInstance.setView(marker.getLatLng(), 14, { animate: true });
                    marker.openPopup();
                }
            };

            if (container.style.display === 'none') {
                toggleBeachMap();
                setTimeout(() => {
                    if (!beachMapInstance) { setTimeout(openMapAndFocus, 300); } else { openMapAndFocus(); }
                }, 150);
            } else if (!beachMapInstance) {
                setTimeout(openMapAndFocus, 150);
            } else {
                openMapAndFocus();
            }
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function updateMapLayers() {
            if (!beachMapInstance) return;
            const layerConfig = [
                { checkboxId: 'layer-beaches', key: 'beaches' },
                { checkboxId: 'layer-food', key: 'food' },
                { checkboxId: 'layer-attractions', key: 'attractions' },
                { checkboxId: 'layer-gems', key: 'gems' },
                { checkboxId: 'layer-hotel', key: 'hotel' }
            ];
            layerConfig.forEach(({ checkboxId, key }) => {
                const checked = document.getElementById(checkboxId).checked;
                const group = mapLayerGroups[key];
                if (!group) return;
                if (checked && !beachMapInstance.hasLayer(group)) {
                    group.addTo(beachMapInstance);
                } else if (!checked && beachMapInstance.hasLayer(group)) {
                    beachMapInstance.removeLayer(group);
                }
            });
        }

        // Distance calculator
        const DISTANCE_LOCATIONS = [
            { name: "העיר העתיקה קורפו (Corfu Town)", lat: 39.6243, lon: 19.9217 },
            { name: "פלקאס (Pelekas)", lat: 39.6000, lon: 19.8170 },
            { name: "אגיוס גורדיוס (Agios Gordios)", lat: 39.5470, lon: 19.8530 },
            { name: "ארמונס (Ermones)", lat: 39.6105, lon: 19.7801 },
            { name: "גליפאדה (Glyfada)", lat: 39.5937, lon: 19.8080 },
            { name: "פלאוקסטריצה (Paleokastritsa)", lat: 39.6726, lon: 19.7011 },
            { name: "סידארי (Sidari)", lat: 39.7915, lon: 19.7042 },
            { name: "רודה (Roda)", lat: 39.7790, lon: 19.7930 },
            { name: "אכרווי (Acharavi)", lat: 39.7830, lon: 19.8170 },
            { name: "קאסיופי (Kassiopi)", lat: 39.7946, lon: 19.9213 },
            { name: "ברבטי (Barbati)", lat: 39.7214, lon: 19.8665 },
            { name: "ניסאקי (Nissaki)", lat: 39.7258, lon: 19.8974 },
            { name: "גוביה (Gouvia) - מקום הלינה שלכם", lat: 39.6500, lon: 19.8520 },
            { name: "דאסיה (Dassia)", lat: 39.6500, lon: 19.8500 },
            { name: "איפסוס (Ipsos)", lat: 39.7000, lon: 19.8170 },
            { name: "בניצס (Benitses)", lat: 39.5433, lon: 19.9139 },
            { name: "מוראיטיקה / מסונגי (Moraitika)", lat: 39.5200, lon: 19.9000 },
            { name: "קאבוס (Kavos)", lat: 39.3860, lon: 20.1130 }
        ];

        function haversineKm(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }

        function populateDistanceSelects() {
            const fromSel = document.getElementById('dist-from');
            const toSel = document.getElementById('dist-to');
            if (!fromSel || !toSel) return;

            DISTANCE_LOCATIONS.forEach((loc, idx) => {
                const opt1 = document.createElement('option');
                opt1.value = idx;
                opt1.textContent = loc.name;
                fromSel.appendChild(opt1);

                const opt2 = document.createElement('option');
                opt2.value = idx;
                opt2.textContent = loc.name;
                toSel.appendChild(opt2);
            });
            // default "from" to Gouvia (this trip's confirmed accommodation)
            const gouviaIdx = DISTANCE_LOCATIONS.findIndex(l => l.name.includes('גוביה'));
            fromSel.selectedIndex = gouviaIdx >= 0 ? gouviaIdx : 0;
            toSel.selectedIndex = 5;
        }

        function calculateDistance() {
            const fromIdx = parseInt(document.getElementById('dist-from').value);
            const toIdx = parseInt(document.getElementById('dist-to').value);
            const from = DISTANCE_LOCATIONS[fromIdx];
            const to = DISTANCE_LOCATIONS[toIdx];

            const resultBox = document.getElementById('dist-result');
            const resultText = document.getElementById('dist-result-text');
            const resultTime = document.getElementById('dist-result-time');
            const resultLink = document.getElementById('dist-result-link');

            if (fromIdx === toIdx) {
                resultBox.classList.remove('hidden');
                resultText.textContent = "זו אותה נקודה 🙂";
                resultTime.textContent = "";
                resultLink.style.display = 'none';
                return;
            }

            const straightKm = haversineKm(from.lat, from.lon, to.lat, to.lon);
            // Road-windiness correction factor for Corfu's mountainous coastal roads
            const roadKm = straightKm * 1.45;
            const avgSpeedKmh = 32; // accounts for narrow, winding roads
            const minutes = Math.round((roadKm / avgSpeedKmh) * 60);
            const hours = Math.floor(minutes / 60);
            const remMin = minutes % 60;
            const timeStr = hours > 0 ? `כ-${hours} שעות ${remMin > 0 ? 'ו-' + remMin + ' דקות' : ''}` : `כ-${minutes} דקות`;

            resultBox.classList.remove('hidden');
            resultText.textContent = `${from.name} ⟶ ${to.name}: כ-${Math.round(roadKm)} ק"מ`;
            resultTime.textContent = `זמן נהיגה משוער: ${timeStr}`;
            resultLink.href = `https://maps.google.com/?saddr=${from.lat},${from.lon}&daddr=${to.lat},${to.lon}`;
            resultLink.style.display = 'inline-block';
        }

        
        // Currency converter (approximate fixed rates, 2026)
        const CURRENCY_RATES = { ILS: 3.60, USD: 1.14, GBP: 0.85 };

        function convertCurrency() {
            const input = document.getElementById('currency-eur-input');
            if (!input) return;
            const eur = parseFloat(input.value) || 0;
            document.getElementById('currency-result-ils').textContent = `₪${(eur * CURRENCY_RATES.ILS).toFixed(2)}`;
            document.getElementById('currency-result-usd').textContent = `$${(eur * CURRENCY_RATES.USD).toFixed(2)}`;
            document.getElementById('currency-result-gbp').textContent = `£${(eur * CURRENCY_RATES.GBP).toFixed(2)}`;
        }

        // ==========================================================================
        // TRAVEL DASHBOARD
        // Trip window: 02.09.2026 15:40 (departure) → 08.09.2026 15:35 (landing back).
        // ==========================================================================
        const TRIP_DEPARTURE = new Date('2026-09-02T15:40:00+03:00');
        const TRIP_START_DAY = new Date('2026-09-02T00:00:00+03:00');
        const TRIP_END_DAY   = new Date('2026-09-08T23:59:59+03:00');
        const DASH_STORAGE_KEY = 'corfu-guide-dashboard';
        // The confirmed accommodation for this trip. Shown as the dashboard's
        // default hotel entry unless the traveler edits it to something else
        // (their edit is saved to localStorage and always takes priority).
        const DEFAULT_HOTEL = { name: 'Tessera Boutique Hotel & Villas', note: 'גוביה (Gouvia)' };

        const ITINERARY_DAY_TITLES = {
            1: 'נחיתה, איסוף רכב והתאקלמות ראשונית',
            2: 'קורפו טאון – קסם ונציאני וסמטאות היסטוריות',
            3: 'החוף הצפון-מזרחי – מפרצים נסתרים ואחוזות עתיקות',
            4: 'פלאוקסטריצה – חופים אמרלד ומנזרים תלויים',
            5: 'דרום קורפו – ארמון הקיסרית, דיונות חול וטברנות דגים',
            6: 'הצפון הפראי – תצורות סלע, תעלת האהבה ושקיעות דרמטיות',
            7: 'יום העזיבה – צ׳ק אאוט וטיסה חזרה'
        };

        function initDashboard() {
            updateDashCountdown();
            setInterval(updateDashCountdown, 60000); // refresh every minute, not every second — no need to redraw constantly
            updateDashToday();
            updateDashFavCount();
            loadDashEditorState();
            fetchDashWeather();
        }

        function updateDashCountdown() {
            const el = document.getElementById('dash-countdown');
            if (!el) return;
            const now = new Date();
            const diffMs = TRIP_DEPARTURE - now;
            if (diffMs <= 0) {
                el.textContent = (now <= TRIP_END_DAY) ? 'אתם בטיול! 🎉' : 'הטיול הסתיים';
                return;
            }
            const days = Math.floor(diffMs / 86400000);
            const hours = Math.floor((diffMs % 86400000) / 3600000);
            el.textContent = days > 0 ? `${days} ימים` : `${hours} שעות`;
        }

        function updateDashToday() {
            const el = document.getElementById('dash-today');
            if (!el) return;
            const now = new Date();
            if (now < TRIP_START_DAY) {
                const daysLeft = Math.ceil((TRIP_START_DAY - now) / 86400000);
                el.textContent = `הטיול מתחיל בעוד ${daysLeft} ימים`;
                window._currentTripDayNum = 1; // trip hasn't started — "view itinerary" opens on day 1
            } else if (now > TRIP_END_DAY) {
                el.textContent = 'הטיול הסתיים — מקווים שנהניתם!';
                window._currentTripDayNum = null; // no single "current day" once the trip is over
            } else {
                const dayNum = Math.floor((now - TRIP_START_DAY) / 86400000) + 1;
                el.textContent = `יום ${dayNum}: ${ITINERARY_DAY_TITLES[dayNum] || ''}`;
                window._currentTripDayNum = dayNum;
            }
        }

        // The dashboard's "view full itinerary" CTA used to just switch tabs and
        // dump the user at the top of a 7-day list. Now it scrolls straight to,
        // auto-expands, and briefly highlights the day that's actually relevant
        // right now (or Day 1 before departure) — reusing the same
        // expand/scroll/highlight mechanics as toggleDayCard and search results.
        function viewTodayInItinerary() {
            const dayNum = window._currentTripDayNum;
            switchTab('itinerary', true);
            if (!dayNum) {
                window.scrollTo({ top: 100, behavior: 'smooth' });
                return;
            }
            setTimeout(() => {
                const checkbox = document.querySelector(`.day-complete-checkbox[data-day="${dayNum}"]`);
                const header = checkbox && checkbox.closest('.premium-day-header');
                if (!header) {
                    window.scrollTo({ top: 100, behavior: 'smooth' });
                    return;
                }
                const body = header.nextElementSibling;
                if (body && body.classList.contains('day-card-collapsed')) {
                    toggleDayCard(header);
                }
                const card = header.closest('.premium-day-card') || header;
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                card.classList.add('search-highlight');
                setTimeout(() => card.classList.remove('search-highlight'), 2000);
            }, 150);
        }

        function updateDashFavCount() {
            const el = document.getElementById('dash-fav-count');
            if (!el) return;
            el.textContent = getFavorites().length;
        }

        // Favorites span four different tabs (beach-/food-/attr-/gem-), so a
        // single "view favorites" action jumps to whichever tab currently holds
        // the most saved items — the most useful single destination — with that
        // tab's own "favorites" filter already applied. Defaults to beaches
        // (matching the mobile bottom-nav heart button) when nothing is saved yet.
        function viewFavorites() {
            const favorites = getFavorites();
            const counts = { beaches: 0, food: 0, attractions: 0, gems: 0 };
            const prefixToTab = { 'beach-': 'beaches', 'food-': 'food', 'attr-': 'attractions', 'gem-': 'gems' };
            favorites.forEach(id => {
                const prefix = Object.keys(prefixToTab).find(p => id.startsWith(p));
                if (prefix) counts[prefixToTab[prefix]]++;
            });
            const tabByCount = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
            const targetTab = (tabByCount && tabByCount[1] > 0) ? tabByCount[0] : 'beaches';

            const filterFn = { beaches: filterBeaches, food: filterFood, attractions: filterAttractions, gems: filterGems }[targetTab];
            switchTab(targetTab, true);
            setTimeout(() => filterFn('favorites'), 150);
            window.scrollTo({ top: 100, behavior: 'smooth' });
        }

        // Live weather via Open-Meteo — free, no API key required. Honest fallback
        // to the seasonal reference already documented in the Shopping section if
        // the network call fails, rather than showing fake live-looking numbers.
        function fetchDashWeather() {
            const valEl = document.getElementById('dash-weather');
            const subEl = document.getElementById('dash-weather-sub');
            if (!valEl) return;
            fetch('https://api.open-meteo.com/v1/forecast?latitude=39.6243&longitude=19.9217&current_weather=true')
                .then(r => r.ok ? r.json() : Promise.reject())
                .then(data => {
                    const w = data && data.current_weather;
                    if (!w) return Promise.reject();
                    const icon = weatherCodeToIcon(w.weathercode);
                    valEl.textContent = `${icon} ${Math.round(w.temperature)}°C`;
                    subEl.textContent = 'תחזית חיה כרגע';
                })
                .catch(() => {
                    valEl.textContent = '☀️ ~28°C';
                    subEl.textContent = 'ממוצע עונתי (לא זמין חי)';
                });
        }

        function weatherCodeToIcon(code) {
            if (code === 0) return '☀️';
            if (code <= 2) return '🌤️';
            if (code === 3) return '☁️';
            if (code >= 51 && code <= 67) return '🌧️';
            if (code >= 95) return '⛈️';
            return '🌤️';
        }

        // Hotel / car rental editor — saved locally only. The hotel defaults to
        // this trip's confirmed accommodation (DEFAULT_HOTEL); car rental has no
        // confirmed booking, so it starts empty and simply offers to remember
        // whatever the traveler adds themselves. Editing either is always saved
        // to localStorage and takes priority over the default.
        let dashEditorType = null;

        let dashEditorTriggerEl = null; // remembers what was focused before the modal opened

        function openDashEditor(type) {
            dashEditorType = type;
            dashEditorTriggerEl = document.activeElement;
            const isHotel = type === 'hotel';
            document.getElementById('dash-editor-title').textContent = isHotel ? 'פרטי לינה' : 'פרטי רכב שכור';
            document.getElementById('dash-editor-label').textContent = isHotel ? 'שם המלון / Airbnb' : 'חברת השכרה';
            document.getElementById('dash-editor-label2').textContent = isHotel ? 'הערה (תאריך צ׳ק-אין וכו׳)' : 'הערה (מספר הזמנה, שעת איסוף וכו׳)';

            const saved = getDashSavedData();
            const entry = saved[type] || (isHotel ? DEFAULT_HOTEL : {});
            document.getElementById('dash-editor-input1').value = entry.name || '';
            document.getElementById('dash-editor-input2').value = entry.note || '';

            document.getElementById('dash-editor-backdrop').classList.remove('hidden');
            document.body.classList.add('modal-open');
            document.getElementById('dash-editor-input1').focus();
        }

        function closeDashEditor() {
            document.getElementById('dash-editor-backdrop').classList.add('hidden');
            document.body.classList.remove('modal-open');
            dashEditorType = null;
            if (dashEditorTriggerEl) dashEditorTriggerEl.focus(); // return focus to whatever opened it
        }

        // Escape closes whichever modal is open, matching standard dialog keyboard behavior
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            const dashModal = document.getElementById('dash-editor-backdrop');
            if (dashModal && !dashModal.classList.contains('hidden')) closeDashEditor();
            const upgradeModal = document.getElementById('upgrade-session-backdrop');
            if (upgradeModal && !upgradeModal.classList.contains('hidden')) closeUpgradeSessionModal();
        });

        function getDashSavedData() {
            try {
                return JSON.parse(localStorage.getItem(DASH_STORAGE_KEY)) || {};
            } catch (e) {
                return {};
            }
        }

        function saveDashEditor() {
            if (!dashEditorType) return;
            const name = document.getElementById('dash-editor-input1').value.trim();
            const note = document.getElementById('dash-editor-input2').value.trim();
            const saved = getDashSavedData();
            if (name) {
                saved[dashEditorType] = { name, note };
            } else {
                delete saved[dashEditorType];
            }
            try {
                localStorage.setItem(DASH_STORAGE_KEY, JSON.stringify(saved));
            } catch (e) { /* ignore quota errors — non-critical feature */ }
            renderDashEntry(dashEditorType, saved[dashEditorType]);
            closeDashEditor();
        }


        function renderDashEntry(type, entry) {
            const emptyEl = document.getElementById(`dash-${type}-empty`);
            const filledEl = document.getElementById(`dash-${type}-filled`);
            const nameEl = document.getElementById(`dash-${type}-name`);
            if (!emptyEl || !filledEl || !nameEl) return;
            if (entry && entry.name) {
                nameEl.textContent = entry.note ? `${entry.name} · ${entry.note}` : entry.name;
                emptyEl.classList.add('hidden');
                filledEl.classList.remove('hidden');
            } else {
                emptyEl.classList.remove('hidden');
                filledEl.classList.add('hidden');
            }
        }

        function loadDashEditorState() {
            const saved = getDashSavedData();
            renderDashEntry('hotel', saved.hotel || DEFAULT_HOTEL);
            renderDashEntry('car', saved.car);
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

        // Step 2.3: the hero photo's Ken Burns drift (.hero-kb-img) runs on a
        // 26s infinite loop - left running, it burns CPU/GPU for the entire
        // session even once the user has scrolled far past the hero and it's
        // nowhere on screen. animation-play-state: paused freezes it exactly
        // where it is (not a reset), so resuming is seamless whether the user
        // scrolls back up once or dozens of times.
        const heroKbObserver = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                entry.target.classList.toggle('hero-kb-paused', !entry.isIntersecting);
            });
        }, { threshold: 0 }) : null;

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
                document.documentElement.style.setProperty('--sticky-filter-top', navBottom + 'px');
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
            if (typeof initUpgradeSessionBanner === 'function') {
                initUpgradeSessionBanner();
            }

            const heroKbImg = document.querySelector('.hero-kb-img');
            if (heroKbImg && heroKbObserver) heroKbObserver.observe(heroKbImg);
        });
