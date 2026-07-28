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

function metaAttrs(d) {
    return (
        ` data-parking="${escapeAttr(d.parking || '')}"` +
        ` data-vibe="${escapeAttr((d.vibe || []).join(','))}"` +
        ` data-beach-type="${escapeAttr(d.beachType || '')}"` +
        ` data-best-time="${escapeAttr(d.bestTime || '')}"` +
        ` data-maps-url="${escapeAttr(d.mapsUrl || '')}"`
    );
}

function renderBeachCard(d) {
    return `<div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden flex flex-col border border-gray-100 premium-card" data-tags="${escapeAttr(d.tags)}" data-name="${escapeAttr(d.name)}" data-id="${escapeAttr(d.id)}"${metaAttrs(d)}>
      <div class="relative h-64 group overflow-hidden premium-card-image">
        <img src="${escapeAttr(d.image.src)}" alt="${escapeAttr(d.image.alt)}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out" loading="lazy" decoding="async">
        <div class="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">${d.popularityBadge}</div>
      </div>
      <div class="p-6 flex-grow flex flex-col bg-gradient-to-b from-white to-gray-50/50">
        <div class="flex justify-between items-start mb-4 gap-2"><h3 class="text-2xl font-bold text-gray-900 leading-tight min-w-0">${d.name}</h3><div class="flex gap-2 flex-shrink-0"><button onclick="toggleFavorite(this)" class="favorite-btn text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2.5 rounded-full transition duration-300 shadow-sm mr-2" title="שמור למועדפים">🤍</button><button onclick="showOnMap('beaches', this.closest('[data-name]').dataset.name)" class="text-teal-600 hover:text-white bg-teal-50 hover:bg-teal-600 p-2.5 rounded-full transition duration-300 shadow-sm" title="הצג במפה">🗺️</button><a href="${escapeAttr(d.mapsUrl)}" class="text-blue-500 hover:text-white bg-blue-50 hover:bg-blue-600 p-2.5 rounded-full transition duration-300 shadow-sm" title="נווט במפות גוגל">📍</a></div>
        </div>
        <p class="text-gray-600 mb-6 text-sm leading-relaxed text-justify">${d.description}</p>

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
    </div>`;
}

function renderFoodCard(d) {
    return `<div class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition duration-300 overflow-hidden flex flex-col group border border-gray-100 hover:-translate-y-1 premium-card" data-tags="${escapeAttr(d.tags)}" data-id="${escapeAttr(d.id)}"${metaAttrs(d)}>
                <div class="relative h-56 overflow-hidden premium-card-image">
                    <img src="${escapeAttr(d.image.src)}" alt="${escapeAttr(d.image.alt)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async">
                    <button onclick="toggleFavorite(this)" class="favorite-btn absolute top-3 left-3 text-white bg-black/30 hover:bg-red-500 w-9 h-9 rounded-full transition duration-300 flex items-center justify-center text-lg" title="שמור למועדפים" aria-label="שמור למועדפים">🤍</button>
                    <div class="absolute top-3 right-3 flex gap-2">
                        ${d.ratingPriceHtml}
                    </div>
                </div>
                <div class="p-5 flex-1 flex flex-col">
                    <h4 class="text-xl font-bold text-gray-900 mb-1">${d.name}</h4>
                    ${d.restHtml}
                </div>
            </div>`;
}

function renderAttractionCard(d) {
    return `<article class="${d.cardClass}" data-id="${escapeAttr(d.id)}" data-tags="${escapeAttr(d.tags)}"${metaAttrs(d)}>
      <div class="h-48 relative premium-card-image"><img src="${escapeAttr(d.image.src)}" alt="${escapeAttr(d.image.alt)}" class="w-full h-full object-cover" loading="lazy" decoding="async"><button onclick="toggleFavorite(this)" class="favorite-btn absolute top-3 left-3 text-white bg-black/30 hover:bg-red-500 w-8 h-8 rounded-full transition duration-300 flex items-center justify-center text-base" title="שמור למועדפים" aria-label="שמור למועדפים">🤍</button><span class="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow">${d.score}</span></div>
      <div class="p-4 flex-grow space-y-3">
        <h3 class="text-lg font-bold text-gray-900">${d.title}</h3>${d.bodyHtml}
      </div>
    </article>`;
}

function renderGemCard(d) {
    return `<article class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition duration-300 flex flex-col relative group premium-card" data-id="${escapeAttr(d.id)}" data-tags="${escapeAttr(d.tags)}"${metaAttrs(d)}>
        <div class="relative h-56 overflow-hidden premium-card-image">
          <img src="${escapeAttr(d.image.src)}" alt="${escapeAttr(d.image.alt)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" decoding="async"><button onclick="toggleFavorite(this)" class="favorite-btn absolute top-3 left-3 z-10 text-white bg-black/30 hover:bg-red-500 w-9 h-9 rounded-full transition duration-300 flex items-center justify-center text-lg" title="שמור למועדפים" aria-label="שמור למועדפים">🤍</button>
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

renderAllBeaches();
renderAllFood();
renderAllAttractions();
renderAllGems();
