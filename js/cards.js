// Card renderers — turn window.CORFU_LOCATIONS entries back into the exact
// same markup that used to be hand-written in index.html for the
// beaches/food/attractions/gems sections.
//
// Every render*Card() function reproduces the original wrapper tag, classes,
// onclick handlers (toggleFavorite(this) / showOnMap(...)) and data-*
// attributes (data-tags / data-name / data-id) byte-for-byte, using the
// html fragments captured by scripts/extract-locations.js for the
// slots that vary between cards. filters.js / favorites.js / map.js /
// search.js / dashboard.js all keep working unmodified because they only
// depend on those attributes and container ids, which are unchanged.
//
// On top of the original markup, every card root element also gets the new
// Step-1 metadata as data-* attributes (data-parking, data-vibe,
// data-beach-type, data-best-time, data-maps-url) for a future step to read.
// No new visible UI is added here.

function escapeAttr(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;');
}

// Step 9 (Phase 2): responsive images for hotlinked Pexels/Unsplash photos -
// both support a &w= resize param, so a srcset with a few candidate widths
// lets the browser pick a smaller download on narrow/mobile layouts instead
// of always fetching the same fixed size. Computed here from the existing
// image.src at render time (not stored in locations-data.js) since it's
// fully derivable and would otherwise be ~150 duplicated URLs to keep in
// sync. loremflickr images (size encoded in the URL path, not a query
// param) aren't covered - buildSrcset() returns null for those and the
// plain src is used as-is, same as before this step.
const RESPONSIVE_IMG_WIDTHS = [400, 800, 1200];
function buildSrcset(src) {
    if (!/images\.(pexels|unsplash)\.com/.test(src)) return null;
    return RESPONSIVE_IMG_WIDTHS.map(w => {
        const url = /[?&]w=\d+/.test(src) ? src.replace(/([?&])w=\d+/, `$1w=${w}`) : src + (src.includes('?') ? '&' : '?') + `w=${w}`;
        return `${escapeAttr(url)} ${w}w`;
    }).join(', ');
}

// Grid layouts, matched to each section's actual Tailwind grid-cols
// breakpoints in index.html: beaches/food/attractions are 1/2/3 columns
// (md/xl), gems is 1/2/3/4 (md/lg/xl).
const GRID_IMG_SIZES = '(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw';
const GEMS_IMG_SIZES = '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw';

// Returns ` srcset="..." sizes="..."` (with the leading space) or '' when
// the source doesn't support width variants - splices directly into an
// <img> tag template.
function responsiveImgAttrs(src, sizes) {
    const srcset = buildSrcset(src);
    return srcset ? ` srcset="${srcset}" sizes="${escapeAttr(sizes)}"` : '';
}

function metaAttrs(d) {
    return (
        ` data-parking="${escapeAttr(d.parking || '')}"` +
        ` data-vibe="${escapeAttr((d.vibe || []).join(','))}"` +
        ` data-beach-type="${escapeAttr(d.beachType || '')}"` +
        ` data-best-time="${escapeAttr(d.bestTime || '')}"` +
        ` data-maps-url="${escapeAttr(d.mapsUrl || '')}"`
    );
}

// Personal tracking widget (visited toggle / 1-5 rating / note) markup.
// Defined here (not js/storage.js) because this file's renderAllBeaches()
// etc. run synchronously as soon as this script loads - before storage.js
// (deferred, loaded later at the bottom of <body>) exists. storage.js's
// injectPersonalTrackingWidgets() reuses this same global function for the
// ~14 cards not yet extracted into CORFU_LOCATIONS (see js/storage.js).
function buildPersonalTrackingWidgetHTML() {
    const stars = [1, 2, 3, 4, 5].map(v => `
        <button type="button" class="pt-star" data-value="${v}" aria-label="דרגו ${v} מתוך 5 כוכבים">
            <svg class="icon-line" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.5Z"/></svg>
        </button>`).join('');

    return `
    <div class="personal-tracking-widget">
        <button type="button" class="pt-visited-btn" aria-pressed="false" title="סמנו כמקום שביקרתם בו">
            <svg class="icon-line" viewBox="0 0 24 24"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
            <span class="pt-visited-label">ביקרתי</span>
        </button>
        <div class="pt-rating" role="radiogroup" aria-label="דירוג אישי">${stars}</div>
        <button type="button" class="pt-note-toggle" aria-expanded="false" title="הוסיפו הערה אישית">
            <svg class="icon-line" viewBox="0 0 24 24"><path d="M4 20l1-4.2L16.8 4a1.5 1.5 0 0 1 2.1 0l1.1 1.1a1.5 1.5 0 0 1 0 2.1L8.2 19 4 20Z"/></svg>
        </button>
        <textarea class="pt-note-textarea hidden" rows="2" placeholder="הערה אישית..." aria-label="הערה אישית"></textarea>
    </div>`;
}

function renderBeachCard(d) {
    return `<div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden flex flex-col border border-gray-100 premium-card" data-tags="${escapeAttr(d.tags)}" data-name="${escapeAttr(d.name)}" data-id="${escapeAttr(d.id)}"${metaAttrs(d)}>
      <div class="relative h-64 group overflow-hidden premium-card-image">
        <img src="${escapeAttr(d.image.src)}" alt="${escapeAttr(d.image.alt)}" width="640" height="440"${responsiveImgAttrs(d.image.src, GRID_IMG_SIZES)} class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out" loading="lazy" decoding="async">
        <div class="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">${d.popularityBadge}</div>
      </div>
      <div class="p-6 flex-grow flex flex-col bg-gradient-to-b from-white to-gray-50/50">
        <div class="flex justify-between items-start mb-4 gap-2"><h3 class="text-2xl font-bold text-gray-900 leading-tight min-w-0">${d.name}</h3><div class="flex gap-2 flex-shrink-0"><button onclick="toggleFavorite(this)" class="favorite-btn text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2.5 rounded-full transition duration-300 shadow-sm mr-2" title="שמור למועדפים" aria-label="שמור למועדפים" aria-pressed="false">🤍</button><button onclick="showOnMap('beaches', this.closest('[data-id]').dataset.id)" class="text-teal-600 hover:text-white bg-teal-50 hover:bg-teal-600 p-2.5 rounded-full transition duration-300 shadow-sm" title="הצג במפה" aria-label="הצג במפה">🗺️</button><a href="${escapeAttr(d.mapsUrl)}" class="text-blue-500 hover:text-white bg-blue-50 hover:bg-blue-600 p-2.5 rounded-full transition duration-300 shadow-sm" title="נווט במפות גוגל" aria-label="נווט במפות גוגל">📍</a></div>
        </div>
        <p class="text-gray-600 mb-6 text-sm leading-relaxed">${d.description}</p>

        <div class="flex flex-wrap gap-1.5 mb-3">${d.tagBadgesHtml}</div>
        <div class="grid grid-cols-2 gap-2 mb-5 mt-auto">
          ${d.featureBadgesHtml}
        </div>

        <details class="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <summary class="cursor-pointer text-sm font-bold text-gray-800 p-4 hover:bg-gray-50 flex justify-between items-center transition-colors">
            <span class="flex items-center gap-2">ℹ️ מתקנים ומידע נוסף</span><span class="group-open:rotate-180 transition-transform duration-300">▼</span>
          </summary>
          <div class="p-4 bg-gray-50 text-sm text-gray-700 grid grid-cols-2 gap-3 border-t border-gray-100">
            ${d.infoPanelHtml}
          </div>
        </details>
      </div>
      ${buildPersonalTrackingWidgetHTML()}
    </div>`;
}

function renderFoodCard(d) {
    return `<div class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition duration-300 overflow-hidden flex flex-col group border border-gray-100 hover:-translate-y-1 premium-card" data-tags="${escapeAttr(d.tags)}" data-id="${escapeAttr(d.id)}"${metaAttrs(d)}>
                <div class="relative h-56 overflow-hidden premium-card-image">
                    <img src="${escapeAttr(d.image.src)}" alt="${escapeAttr(d.image.alt)}" width="400" height="330"${responsiveImgAttrs(d.image.src, GRID_IMG_SIZES)} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async">
                    <button onclick="toggleFavorite(this)" class="favorite-btn absolute top-3 left-3 text-white bg-black/30 hover:bg-red-500 w-9 h-9 rounded-full transition duration-300 flex items-center justify-center text-lg" title="שמור למועדפים" aria-label="שמור למועדפים" aria-pressed="false">🤍</button>
                    <div class="absolute top-3 right-3 flex gap-2">
                        ${d.ratingPriceHtml}
                    </div>
                </div>
                <div class="p-5 flex-1 flex flex-col">
                    <h4 class="text-xl font-bold text-gray-900 mb-1">${d.name}</h4>
                    ${d.restHtml}
                </div>
                ${buildPersonalTrackingWidgetHTML()}
            </div>`;
}

function renderAttractionCard(d) {
    return `<article class="${d.cardClass}" data-id="${escapeAttr(d.id)}" data-tags="${escapeAttr(d.tags)}"${metaAttrs(d)}>
      <div class="h-48 relative premium-card-image"><img src="${escapeAttr(d.image.src)}" alt="${escapeAttr(d.image.alt)}" width="400" height="300"${responsiveImgAttrs(d.image.src, GRID_IMG_SIZES)} class="w-full h-full object-cover" loading="lazy" decoding="async"><button onclick="toggleFavorite(this)" class="favorite-btn absolute top-3 left-3 text-white bg-black/30 hover:bg-red-500 w-8 h-8 rounded-full transition duration-300 flex items-center justify-center text-base" title="שמור למועדפים" aria-label="שמור למועדפים" aria-pressed="false">🤍</button><span class="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow">${d.score}</span></div>
      <div class="p-4 flex-grow space-y-3">
        <h3 class="text-lg font-bold text-gray-900">${d.title}</h3>${d.bodyHtml}
      </div>
      ${buildPersonalTrackingWidgetHTML()}
    </article>`;
}

function renderGemCard(d) {
    return `<article class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition duration-300 flex flex-col relative group premium-card" data-id="${escapeAttr(d.id)}" data-tags="${escapeAttr(d.tags)}"${metaAttrs(d)}>
        <div class="relative h-56 overflow-hidden premium-card-image">
          <img src="${escapeAttr(d.image.src)}" alt="${escapeAttr(d.image.alt)}" width="400" height="320"${responsiveImgAttrs(d.image.src, GEMS_IMG_SIZES)} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" decoding="async"><button onclick="toggleFavorite(this)" class="favorite-btn absolute top-3 left-3 z-10 text-white bg-black/30 hover:bg-red-500 w-9 h-9 rounded-full transition duration-300 flex items-center justify-center text-lg" title="שמור למועדפים" aria-label="שמור למועדפים" aria-pressed="false">🤍</button>
          <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
            ${d.typeBadgeHtml}
          </div>
        </div>
        <div class="p-6 flex flex-col flex-grow">
          <h3 class="text-2xl font-bold text-slate-800 mb-2">${d.name}</h3>
          <p class="text-slate-600 text-sm leading-relaxed mb-4 flex-grow">
            ${d.description}
          </p>
          <details class="mb-5 group/accordion bg-slate-50 rounded-xl p-3 border border-slate-100">
            <summary class="cursor-pointer font-semibold text-teal-700 hover:text-teal-900 flex items-center justify-between outline-none text-sm">
              <span>טיפ מיוחד</span>
              <span class="transition-transform group-open/accordion:rotate-180">▼</span>
            </summary>
            <div class="pt-2 text-sm text-slate-600 leading-relaxed mt-1">
              ${d.tipHtml}
            </div>
          </details>
          <a href="${escapeAttr(d.mapsUrl)}" class="mt-auto flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm">
            📍 נווט ב-Google Maps
          </a>
        </div>
        ${buildPersonalTrackingWidgetHTML()}
      </article>`;
}

function renderAllBeaches() {
    const grid = document.getElementById('beaches-grid');
    if (!grid || !window.CORFU_LOCATIONS) return;
    grid.innerHTML = window.CORFU_LOCATIONS.beaches.map(renderBeachCard).join('\n');
}

function renderAllFood() {
    if (!window.CORFU_LOCATIONS) return;
    const byCategory = {};
    window.CORFU_LOCATIONS.food.forEach(d => {
        (byCategory[d.category] = byCategory[d.category] || []).push(d);
    });
    Object.keys(byCategory).forEach(catId => {
        const header = document.getElementById(catId);
        if (!header) return;
        const grid = header.nextElementSibling;
        if (!grid || !grid.classList.contains('grid')) return;
        grid.innerHTML = byCategory[catId].map(renderFoodCard).join('\n');
    });
}

function renderAllAttractions() {
    const grid = document.getElementById('attractions-grid');
    if (!grid || !window.CORFU_LOCATIONS) return;
    grid.innerHTML = window.CORFU_LOCATIONS.attractions.map(renderAttractionCard).join('\n');
}

function renderAllGems() {
    const grid = document.getElementById('gems-container-grid');
    if (!grid || !window.CORFU_LOCATIONS) return;
    grid.innerHTML = window.CORFU_LOCATIONS.gems.map(renderGemCard).join('\n');
}

window.renderBeachCard = renderBeachCard;
window.renderFoodCard = renderFoodCard;
window.renderAttractionCard = renderAttractionCard;
window.renderGemCard = renderGemCard;
window.renderAllBeaches = renderAllBeaches;
window.renderAllFood = renderAllFood;
window.renderAllAttractions = renderAllAttractions;
window.renderAllGems = renderAllGems;

// Step 8 (Phase 2): these no longer run unconditionally at load - each
// only runs the first time its tab is actually opened, via
// ensureTabRendered() in js/ui.js's switchTab().
