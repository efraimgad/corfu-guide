// Trip Planning tab: monthly weather table, plus (below) the rest of the
// tab's static-editorial blocks (accommodation, seasonality, budget,
// transport cards, detailed ferries) migrated in a follow-up leakage-fix
// pass — see js/corfu-tripplanning-static.js's header for the full context
// on what was found and why. window.DESTINATION.editorial.tripPlanning is
// an object (not just the weather array) precisely so these pieces could
// be added as sibling fields later without another restructure.
//
// Deliberately NOT migrated (confirmed genuinely generic-to-Greece, not
// Corfu-specific): the tipping-norms cards (#plan-money) and currency
// converter, the car-rental card and the generic driving-safety bullet
// list inside #plan-transport (only their destination-naming HEADINGS are
// migrated), and the road-type legend (had its Corfu-only example place
// names stripped as a plain text edit instead, since the category
// descriptions themselves need no per-destination variation).
//
// renderWeatherTable() builds the exact same <tr>/<td> markup the static
// HTML used to hand-author from window.DESTINATION.editorial.tripPlanning.weather
// (an array of {month, dayTemp, seaTemp, rainDays, description, highlight},
// populated per-destination — see js/corfu-weather.js / js/testdest-weather.js,
// auto-generated/placeholder respectively). Gracefully renders nothing
// (leaves the tbody empty) when a destination has no weather data yet
// (null/missing/empty array — e.g. the content-free 'empty' destination),
// rather than throwing.

function renderWeatherTable() {
    const tbody = document.querySelector('#plan-weather table tbody');
    if (!tbody) return;

    const dest = window.DESTINATION;
    const weather = (dest && dest.editorial && dest.editorial.tripPlanning &&
        Array.isArray(dest.editorial.tripPlanning.weather))
        ? dest.editorial.tripPlanning.weather
        : [];

    tbody.innerHTML = weather.map((row, i) => {
        const month = escapeHtml(row.month || '');
        const dayTemp = escapeHtml(row.dayTemp || '');
        const seaTemp = escapeHtml(row.seaTemp || '');
        const rainDays = escapeHtml(row.rainDays || '');
        const description = escapeHtml(row.description || '');
        const highlight = !!row.highlight;
        const isLast = i === weather.length - 1;

        // Mirrors the original hand-authored markup exactly: highlighted
        // ("recommended month") rows get the accent background/hover/text
        // treatment throughout the row; off-season rows get the plain
        // sunken-hover treatment. Every row except the very last carries
        // border-b (the original's last <tr> omitted it since the wrapping
        // .overflow-x-auto div already has its own bottom border).
        const trClasses = [
            !isLast ? 'border-b' : '',
            highlight ? 'gt-bg-accent-soft gt-hover-accent-soft' : 'gt-hover-sunken',
            'transition-colors'
        ].filter(Boolean).join(' ');

        const monthTdClass = highlight ? 'p-4 font-semibold gt-text-accent' : 'p-4 font-semibold gt-text-900';
        const dayTempTdClass = highlight ? 'p-4 text-center font-bold' : 'p-4 text-center';
        const seaTempTdClass = highlight ? 'p-4 text-center font-bold' : 'p-4 text-center';
        const descTdClass = highlight ? 'p-4 font-medium' : 'p-4';

        return `<tr class="${trClasses}"><td class="${monthTdClass}">${month}</td><td class="${dayTempTdClass}">${dayTemp}</td><td class="${seaTempTdClass}">${seaTemp}</td><td class="p-4 text-center">${rainDays}</td><td class="${descTdClass}">${description}</td></tr>`;
    }).join('\n');
}

// ============================================================================
// The rest of this file (below) renders the Trip Planning blocks migrated
// in the follow-up leakage-fix pass — accommodation, seasonality, budget,
// several #plan-transport cards, the driving-times table's footnotes, and
// the detailed ferries card. All read window.DESTINATION.editorial.tripPlanning
// directly (js/corfu-tripplanning-static.js / js/paxos-tripplanning-static.js /
// js/testdest-tripplanning-static.js, generated/hand-written respectively);
// all no-op (hide the section, or leave containers empty) rather than throw
// when a destination has none of this data yet (e.g. the empty destination).
// Trusted HTML fields (description/html/tip/items) are inserted as-is, same
// convention as js/faq-filters.js's item.a — extracted verbatim from the
// original markup, not user input.
// ============================================================================

function getTripPlanningData() {
    const dest = window.DESTINATION;
    return (dest && dest.editorial && dest.editorial.tripPlanning) || null;
}

function renderPlanWeatherHeading() {
    const tp = getTripPlanningData();
    const wh = tp && tp.weatherHeading;
    const titleEl = document.querySelector('#plan-weather h3');
    const subtitleEl = document.querySelector('#plan-weather p.mt-1');
    if (titleEl) titleEl.textContent = (wh && wh.title) || '';
    if (subtitleEl) subtitleEl.textContent = (wh && wh.subtitle) || '';
}

function accommodationCardHtml(c) {
    const isSunken = c.variant === 'sunken';
    const wrapClass = isSunken ? 'gt-bg-sunken rounded-xl p-6 shadow-sm border gt-border-hair' : 'gt-bg-accent-soft rounded-xl p-6 shadow-sm border gt-border-accent';
    const titleClass = isSunken ? 'font-bold gt-text-900 mb-2' : 'font-bold gt-text-accent mb-2';
    const descClass = isSunken ? 'text-sm gt-text-700 leading-relaxed' : 'text-sm gt-text-accent leading-relaxed';
    const iconMarkup = c.iconHtml ? c.iconHtml : escapeHtml(c.icon || '');
    return `<div class="${wrapClass}">
                <div class="text-3xl mb-2">${iconMarkup}</div>
                <h4 class="${titleClass}">${escapeHtml(c.title || '')}</h4>
                <p class="${descClass}">${c.description || ''}</p>
            </div>`;
}

function renderPlanAccommodation() {
    const section = document.getElementById('plan-accommodation');
    if (!section) return;
    const tp = getTripPlanningData();
    const acc = tp && tp.accommodation;

    if (!acc) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');

    const areaLabelEl = document.getElementById('plan-accommodation-area-label');
    const introEl = document.getElementById('plan-accommodation-intro');
    const cardsEl = document.getElementById('plan-accommodation-cards');
    if (areaLabelEl) areaLabelEl.textContent = acc.areaLabel || '';
    if (introEl) introEl.textContent = acc.intro || '';
    if (cardsEl) {
        const cards = Array.isArray(acc.cards) ? acc.cards : [];
        cardsEl.innerHTML = cards.map(accommodationCardHtml).join('');
    }
}

function seasonalityBandHtml(band) {
    const items = Array.isArray(band.items) ? band.items : [];
    return `<div class="gt-bg-accent-soft rounded-xl p-5 border-2 gt-border-accent">
                <h4 class="font-bold gt-text-accent mb-3 text-lg flex items-center gap-2">${escapeHtml(band.label || '')}</h4>
                <ul class="text-sm gt-text-accent space-y-2 list-disc list-inside">
                    ${items.map(it => `<li>${it}</li>`).join('')}
                </ul>
            </div>`;
}

function renderPlanSeasonality() {
    const section = document.getElementById('plan-seasonality');
    if (!section) return;
    const tp = getTripPlanningData();
    const seas = tp && tp.seasonality;

    if (!seas) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');

    const bandsEl = document.getElementById('plan-seasonality-bands');
    const tipEl = document.getElementById('plan-seasonality-tip');
    if (bandsEl) {
        const bands = Array.isArray(seas.bands) ? seas.bands : [];
        bandsEl.innerHTML = bands.map(seasonalityBandHtml).join('');
    }
    if (tipEl) tipEl.innerHTML = seas.tip || '';
}

function budgetDayCardHtml(day) {
    const items = Array.isArray(day.items) ? day.items : [];
    return `<div class="gt-bg-accent-soft rounded-xl p-6 border-2 gt-border-accent">
                <h4 class="font-bold gt-text-accent mb-4 text-xl flex items-center gap-2">${escapeHtml(day.title || '')}</h4>
                <ul class="text-sm gt-text-accent space-y-2.5">
                    ${items.map(it => `<li class="flex justify-between"><span>${escapeHtml(it.label || '')}</span><strong>${escapeHtml(it.value || '')}</strong></li>`).join('')}
                </ul>
                <div class="mt-4 pt-3 border-t-2 gt-border-accent flex justify-between items-center">
                    <span class="font-bold gt-text-accent text-lg">${escapeHtml(day.totalLabel || '')}</span>
                    <span class="font-extrabold gt-text-accent text-2xl">${escapeHtml(day.totalValue || '')}</span>
                </div>
            </div>`;
}

// Renders #plan-budget. Two shapes: `days` (Corfu's real per-item price
// breakdown) or `generalNote` (honest general wording used instead when a
// destination has no verified price research — see js/paxos-tripplanning-
// static.js's own header for why fabricating one would be wrong).
function renderPlanBudget() {
    const section = document.getElementById('plan-budget');
    if (!section) return;
    const tp = getTripPlanningData();
    const budget = tp && tp.budget;

    if (!budget) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');

    const titleEl = document.getElementById('plan-budget-title');
    const introEl = document.getElementById('plan-budget-intro');
    const daysEl = document.getElementById('plan-budget-days');
    const noteEl = document.getElementById('plan-budget-general-note');
    const footerEl = document.getElementById('plan-budget-footer-tip');

    if (titleEl) titleEl.textContent = budget.title || '';

    const hasDays = Array.isArray(budget.days) && budget.days.length > 0;
    if (introEl) { introEl.textContent = hasDays ? (budget.intro || '') : ''; introEl.classList.toggle('hidden', !hasDays); }
    if (daysEl) {
        daysEl.classList.toggle('hidden', !hasDays);
        daysEl.innerHTML = hasDays ? budget.days.map(budgetDayCardHtml).join('') : '';
    }
    if (noteEl) {
        const hasNote = !hasDays && !!budget.generalNote;
        noteEl.classList.toggle('hidden', !hasNote);
        noteEl.innerHTML = hasNote ? budget.generalNote : '';
    }
    if (footerEl) { footerEl.innerHTML = hasDays ? (budget.footerTip || '') : ''; footerEl.classList.toggle('hidden', !hasDays); }
}

function renderPlanTransportStatic() {
    const tp = getTripPlanningData();
    const t = tp && tp.transport;

    const publicEl = document.getElementById('plan-transport-public');
    const fuelEl = document.getElementById('plan-transport-fuel-parking');
    const tollsEl = document.getElementById('plan-transport-tolls');
    const drivingEl = document.getElementById('plan-transport-driving-from-base');
    const ferriesEl = document.getElementById('plan-transport-ferries-summary');
    const roadSafetyTitleEl = document.getElementById('plan-road-safety-title');
    const planningTipEl = document.getElementById('plan-drivetimes-tip');
    const shapeTipEl = document.getElementById('plan-drivetimes-shape-tip');
    const baseNoteEl = document.getElementById('plan-drivetimes-base-note');

    if (publicEl) {
        const pt = t && t.publicTransport;
        publicEl.querySelector('h4') && (publicEl.querySelector('h4').textContent = (pt && pt.title) || '');
        const ul = publicEl.querySelector('ul');
        if (ul) ul.innerHTML = (pt && Array.isArray(pt.items) ? pt.items : []).map(it => `<li>${it}</li>`).join('');
    }
    if (fuelEl) {
        const f = t && t.fuelParking;
        fuelEl.querySelector('h4') && (fuelEl.querySelector('h4').textContent = (f && f.title) || '');
        const p = fuelEl.querySelector('p');
        if (p) p.innerHTML = (f && f.html) || '';
    }
    if (tollsEl) {
        const tl = t && t.tolls;
        tollsEl.querySelector('h4') && (tollsEl.querySelector('h4').textContent = (tl && tl.title) || '');
        const p = tollsEl.querySelector('p');
        if (p) p.innerHTML = (tl && tl.html) || '';
    }
    if (drivingEl) {
        const d = t && t.drivingFromBase;
        drivingEl.querySelector('h4') && (drivingEl.querySelector('h4').textContent = (d && d.title) || '');
        const ul = drivingEl.querySelector('ul');
        if (ul) ul.innerHTML = (d && Array.isArray(d.items) ? d.items : []).map(it => `<li>${it}</li>`).join('');
    }
    if (ferriesEl) {
        const fr = t && t.ferriesSummary;
        ferriesEl.querySelector('h4') && (ferriesEl.querySelector('h4').textContent = (fr && fr.title) || '');
        const p = ferriesEl.querySelector('p');
        if (p) p.innerHTML = (fr && fr.html) || '';
    }
    if (roadSafetyTitleEl) roadSafetyTitleEl.textContent = (t && t.roadSafetyHeadingTitle) || '';
    if (planningTipEl) planningTipEl.innerHTML = (t && t.driveTimeFootnotes && t.driveTimeFootnotes.planningTip) || '';
    if (shapeTipEl) shapeTipEl.innerHTML = (t && t.driveTimeFootnotes && t.driveTimeFootnotes.shapeTip) || '';
    if (baseNoteEl) baseNoteEl.innerHTML = (t && t.driveTimeFootnotes && t.driveTimeFootnotes.baseAdjustmentNote) || '';
}

function ferryRouteCardHtml(r) {
    return `<div class="bg-white rounded-lg p-4 border gt-border-accent">
                <p class="font-bold gt-text-accent mb-1">${escapeHtml(r.title || '')}</p>
                <p class="gt-text-accent">${r.description || ''}</p>
            </div>`;
}

function renderPlanFerriesDetailed() {
    const section = document.getElementById('plan-ferries');
    if (!section) return;
    const tp = getTripPlanningData();
    const fd = tp && tp.ferriesDetailed;

    if (!fd) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');

    const titleEl = document.getElementById('plan-ferries-title');
    const routesEl = document.getElementById('plan-ferries-routes');
    const disclaimerEl = document.getElementById('plan-ferries-disclaimer');
    if (titleEl) titleEl.innerHTML = `<span class="text-2xl">⛴️</span> ${escapeHtml((fd.title || '').replace(/^⛴️\s*/, ''))}`;
    if (routesEl) {
        const routes = Array.isArray(fd.routes) ? fd.routes : [];
        routesEl.innerHTML = routes.map(ferryRouteCardHtml).join('');
    }
    if (disclaimerEl) disclaimerEl.innerHTML = fd.disclaimer || '';
}

// Single entry point called from js/init.js — runs every renderer above in
// one place so a new field added to editorial.tripPlanning only needs one
// new function here, not a new init.js call site.
function renderTripPlanningStatic() {
    renderPlanWeatherHeading();
    renderPlanAccommodation();
    renderPlanSeasonality();
    renderPlanBudget();
    renderPlanTransportStatic();
    renderPlanFerriesDetailed();
}
window.renderTripPlanningStatic = renderTripPlanningStatic;
