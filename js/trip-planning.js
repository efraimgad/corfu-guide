// Trip Planning tab: monthly weather table.
//
// Phase 2 (hybrid): only the #plan-weather table is data-driven so far — the
// rest of the Trip Planning tab (accommodation cards, budget cards, tipping
// cards, transport cards, ferries, driving-times table) stays static
// Corfu-only markup for now. window.DESTINATION.editorial.tripPlanning is an
// object (not just the weather array) precisely so those other pieces can be
// added as sibling fields later without another restructure.
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
