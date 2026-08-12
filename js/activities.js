// ============================================================================
// activities.js — renders the Activities tab's quick-nav bar and card grid
// from window.DESTINATION.editorial.activities (js/corfu-activities.js /
// js/testdest-activities.js, set via scripts/extract-activities.js).
//
// Phase 2 migration of the Activities tab out of hand-authored index.html
// markup into destination data, following the same
// window.DESTINATION-reading pattern already used by js/explore.js,
// js/map.js, js/tools.js etc (Phase 1).
//
// CRITICAL: js/favorites.js's toggleFavorite()/showActivityFavoritesOnly()
// and js/dashboard.js locate cards via `article[data-id]` inside
// #activities-grid and `.favorite-btn` with onclick="toggleFavorite(this)".
// The markup built below reproduces that exact shape - do not change class
// names/attribute names here without also checking those two files (and
// scripts/test-favorites.js).
//
// Must run BEFORE initFavoriteButtons()/injectPersonalTrackingWidgets() in
// js/init.js's DOMContentLoaded handler, since those locate their targets by
// querying the DOM for cards this function creates.
// ============================================================================

// Renders the "קפצו ישירות ל..." anchor-link bar from each activity's own
// anchor + quickNavLabel, in data order. Empty/missing data -> empty bar,
// not a throw (the 'empty' destination has editorial.activities === null).
function renderActivitiesQuickNav() {
    const nav = document.getElementById('activities-quick-nav');
    if (!nav) return;
    const list = nav.querySelector('.flex.flex-wrap.gap-2');
    if (!list) return;

    const activities = (window.DESTINATION && window.DESTINATION.editorial && window.DESTINATION.editorial.activities) || [];
    list.innerHTML = activities.filter(a => a.anchor && a.quickNavLabel).map(a =>
        `<a href="#${escapeAttr(a.anchor)}" class="text-xs font-semibold gt-bg-accent-soft gt-text-accent px-3 py-1.5 rounded-full gt-hover-accent-soft transition-colors">${escapeHtml(a.quickNavLabel)}</a>`
    ).join('');
}

// Builds one card's <img> tags (2 in every real Corfu card today, but the
// record shape doesn't assume that — see scripts/extract-activities.js).
function activityImagesHtml(images) {
    return (images || []).map((img, i) => {
        // Alternate rounded corners the way the original hand-authored pairs
        // did (first image rounds top-left, last rounds top-right); with a
        // single image both corners round, which degrades gracefully.
        const isFirst = i === 0;
        const isLast = i === (images.length - 1);
        const roundClass = (isFirst && isLast) ? 'rounded-t-2xl' : isFirst ? 'rounded-tl-2xl' : isLast ? 'rounded-tr-2xl' : '';
        return `<img src="${escapeAttr(img.src)}" alt="${escapeAttr(img.alt)}" width="300" height="400" class="w-full h-56 object-cover ${roundClass}" loading="lazy" decoding="async">`;
    }).join('\n        ');
}

function activityBadgeHtml(a) {
    if (!a.badge) return '';
    return `<span class="gt-bg-accent-soft gt-text-accent text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">${escapeHtml(a.badge)}</span>`;
}

// The h3+badge header row: cards WITH a badge wrap both in a flex row (to
// push the badge to the far side); cards without one just render the h3 —
// matches the two shapes present in the original hand-authored markup.
function activityHeaderHtml(a) {
    const h3 = `<h3 class="text-2xl font-bold gt-text-900 flex items-center gap-2">${escapeHtml(a.emoji)} ${escapeHtml(a.title)}</h3>`;
    if (!a.badge) {
        return `<h3 class="text-2xl font-bold gt-text-900 mb-4 flex items-center gap-2">${escapeHtml(a.emoji)} ${escapeHtml(a.title)}</h3>`;
    }
    return `<div class="flex justify-between items-start mb-4">
          ${h3}
          ${activityBadgeHtml(a)}
        </div>`;
}

function activityChipsHtml(a) {
    return (a.chips || []).map(c =>
        `<span class="gt-bg-accent-soft gt-text-accent px-3 py-1 rounded-full text-sm font-semibold border gt-border-accent">${escapeHtml(c)}</span>`
    ).join('\n          ');
}

// Equipment/warning tip box — omitted entirely if the card has neither
// (both fields are optional; only the equipment line is present on every
// real Corfu card today, but nothing here assumes that will stay true).
function activityInfoBoxHtml(a) {
    if (!a.equipmentTip && !a.warningTip) return '';
    const eq = a.equipmentTip
        ? `<p class="text-sm gt-text-700 flex gap-2"><span class="text-base">🎒</span> <strong>ציוד מומלץ:</strong> ${a.equipmentTip}</p>`
        : '';
    const warn = a.warningTip
        ? `<p class="text-sm gt-text-accent flex gap-2">⚠️ <span>${a.warningTip}</span></p>`
        : '';
    return `<div class="gt-bg-sunken p-4 rounded-2xl mb-6 space-y-2 border gt-border-hair">
          ${eq}
          ${warn}
        </div>`;
}

function activityCtaHtml(a) {
    const nav = a.navigateUrl
        ? `<a href="${escapeAttr(a.navigateUrl)}" class="flex-1 text-center gt-pill-inactive py-3 rounded-xl font-bold transition-colors shadow-sm">${escapeHtml(a.navigateLabel || '')}</a>`
        : '';
    const find = a.findProviderUrl
        ? `<a href="${escapeAttr(a.findProviderUrl)}" target="_blank" rel="noopener noreferrer" class="flex-1 text-center gt-bg-accent gt-hover-accent-solid text-white py-3 rounded-xl font-bold transition-colors shadow-sm">${escapeHtml(a.findProviderLabel || '')}</a>`
        : '';
    if (!nav && !find) return '';
    return `<div class="flex flex-col sm:flex-row gap-3 mt-auto">
          ${nav}
          ${find}
        </div>`;
}

function activityExpertTipHtml(a) {
    if (!a.expertTip) return '';
    return `<details class="group/accordion mt-4 gt-bg-accent-soft/50 rounded-2xl border gt-border-accent">
          <summary class="cursor-pointer font-bold gt-text-accent p-4 flex justify-between items-center list-none">
            <span>💡 טיפים של מומחים</span>
            <span class="group-open/accordion:rotate-180 transition-transform duration-300">🔽</span>
          </summary>
          <div class="p-4 pt-0 gt-text-700 text-sm leading-relaxed border-t gt-border-accent mt-2">
            ${a.expertTip}
          </div>
        </details>`;
}

// One card's full markup. The favorite button MUST keep this exact shape —
// article[data-id], button.favorite-btn with onclick="toggleFavorite(this)" —
// see the file header.
function activityCardHtml(a) {
    return `<article class="bg-white rounded-3xl shadow-lg border gt-border-hair overflow-hidden hover:shadow-2xl transition duration-300 flex flex-col group premium-card scroll-mt-24" data-id="${escapeAttr(a.id)}" id="${escapeAttr(a.anchor || '')}"><div class="relative">
      <div class="grid grid-cols-2 gap-1 p-2 premium-card-image-dual"><button onclick="toggleFavorite(this)" class="favorite-btn absolute top-2 left-2 z-10 text-white bg-black/30 favorite-btn-hover w-9 h-9 rounded-full transition duration-300 flex items-center justify-center text-lg" title="שמור למועדפים" aria-label="שמור למועדפים">🤍</button></div>
        ${activityImagesHtml(a.images)}
      </div>
      <div class="p-6 flex-1 flex flex-col">
        ${activityHeaderHtml(a)}
        <p class="gt-text-500 mb-6 leading-relaxed flex-1">
          ${escapeHtml(a.description || '')}
        </p>

        <div class="flex flex-wrap gap-2 mb-6">
          ${activityChipsHtml(a)}
        </div>

        ${activityInfoBoxHtml(a)}

        ${activityCtaHtml(a)}

        ${activityExpertTipHtml(a)}
      </div>
    </article>`;
}

// Renders the full card grid. Empty/missing data -> empty grid, not a throw
// (the 'empty' destination has editorial.activities === null).
function renderActivitiesGrid() {
    const grid = document.getElementById('activities-grid');
    if (!grid) return;

    const activities = (window.DESTINATION && window.DESTINATION.editorial && window.DESTINATION.editorial.activities) || [];
    grid.innerHTML = activities.map(activityCardHtml).join('\n\n    ');

    renderActivitiesQuickNav();
}

window.renderActivitiesGrid = renderActivitiesGrid;
