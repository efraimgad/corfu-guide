// ============================================================================
// health-safety.js — renders the emergency-numbers/hospital info shared by
// TWO places in index.html from window.DESTINATION.editorial.healthSafety:
//
//   1. renderEmergencyModal() fills the #emergency-modal-backdrop quick-
//      access modal (reachable from every tab via #emergency-fab-btn,
//      outside any .tab-content section) — a compact 2x2 tap-to-call grid.
//   2. renderHealthSafetyEmergency() fills the #health-emergency block
//      inside the Health & Safety tab (<section id="health-safety">) — the
//      fuller hospital cards + large emergency-number tiles + tourist-
//      police block + insurance tip.
//
// Before this migration these were two INDEPENDENTLY hand-authored copies
// of the same numbers/hospital info in index.html — the modal's own header
// comment admitted it ("Numbers and hospital details are the same ones
// shown in Practical Info (#health-emergency); this is a shortcut to them,
// not a second source of truth, so if those ever change, update both
// places."). They are now two renderers reading ONE shared data object
// instead. They intentionally still render DIFFERENT markup (compact
// tap-to-call tiles vs. large detailed cards) — this file is not trying to
// make the two locations look identical, only to stop them being two
// independently-typed copies of the same facts.
//
// Cross-checking the two original hardcoded copies while extracting this
// data found they had already drifted slightly, in three places (see
// data/destinations/corfu.js's healthSafety comment for the full data-side
// note):
//   - The 112 entry's label text itself differed: the modal said "חירום
//     כללי", the tab said "מוקד חירום כללי" (the other three numbers —
//     100/166/199 — matched exactly on their primary label). The tab's
//     fuller wording was kept as the single source.
//   - Corfu General Hospital's description text genuinely differed (not
//     just styling): the modal had a shorter version, the tab a longer one
//     with an extra sentence. Both are kept — `description` (tab, full)
//     and `shortDescription` (modal, compact) — rather than collapsing to
//     one and silently losing the other's wording.
//   - The hospital phone display differed: the tab appended "(מוקד מרכזי)"
//     after the number, the modal did not. Kept as a separate optional
//     `phoneNote` field the tab renderer appends and the modal renderer
//     ignores.
//
// The #emergency-modal-insurance div (the modal's insurance-reminder line)
// is NOT touched by renderEmergencyModal() below — it already has its own
// dynamic mechanism (js/ui.js's openEmergencyModal()/
// getEmergencyInsuranceHtml(), reading window.TRIP_PRIVATE.insurance with
// a fallback constant) that runs every time the modal opens, independent
// of page-load rendering order. Nothing here duplicates or replaces that.
//
// Both functions no-op (render nothing, no throw) when
// editorial.healthSafety is missing/null — e.g. the content-free 'empty'
// destination — same convention as js/faq-filters.js's renderFAQList() and
// js/activities.js's renderActivitiesGrid().
// ============================================================================

function getHealthSafetyData() {
    const dest = window.DESTINATION;
    return (dest && dest.editorial && dest.editorial.healthSafety) || null;
}

// One compact tap-to-call tile for the modal's 2x2 grid. Label only, no
// sublabel — the modal has always shown just the primary label, kept
// deliberately compact.
function emergencyModalNumberTile(n) {
    return `<a href="tel:${escapeAttr(n.number)}" class="gt-bg-accent-soft p-3 rounded-xl text-center border gt-border-accent gt-hover-accent-soft transition-colors">
                    <div class="font-black text-2xl gt-text-accent">${escapeHtml(n.number)}</div>
                    <div class="text-xs gt-text-accent font-bold">${escapeHtml(n.label)}</div>
                </a>`;
}

// Renders the #emergency-modal-backdrop modal's numbers grid + tourist-
// police line + hospital reference card into #emergency-modal-numbers.
function renderEmergencyModal() {
    const container = document.getElementById('emergency-modal-numbers');
    if (!container) return;

    const hs = getHealthSafetyData();
    if (!hs) { container.innerHTML = ''; return; }

    const numbers = Array.isArray(hs.emergencyNumbers) ? hs.emergencyNumbers : [];
    const gridHtml = numbers.length
        ? `<div class="grid grid-cols-2 gap-3 mb-4">
                ${numbers.map(emergencyModalNumberTile).join('\n                ')}
            </div>`
        : '';

    const tp = hs.touristPolice;
    const touristPoliceHtml = tp
        ? `<a href="tel:${escapeAttr(tp.number)}" class="block gt-bg-accent text-white p-3 rounded-xl text-center mb-4 gt-hover-accent-solid transition-colors">
                <span class="font-bold">${escapeHtml(tp.number)} - ${escapeHtml(tp.label)}</span>
            </a>`
        : '';

    // Only the one hospital flagged showInModal — the modal has always
    // referenced a single hospital, kept as a data-driven choice rather
    // than always hardcoding "the first one".
    const hospitals = Array.isArray(hs.hospitals) ? hs.hospitals : [];
    const modalHospital = hospitals.find(h => h.showInModal);
    const hospitalHtml = modalHospital
        ? `<div class="bg-white p-4 rounded-xl border gt-border-hair mb-4">
                <h5 class="font-bold gt-text-900 mb-1">${escapeHtml(modalHospital.name)}</h5>
                <p class="text-xs gt-text-500 mb-2">${escapeHtml(modalHospital.shortDescription || modalHospital.description || '')}</p>
                <div class="flex flex-wrap gap-3">
                    ${modalHospital.mapsUrl ? `<a href="${escapeAttr(modalHospital.mapsUrl)}" class="inline-flex items-center gap-1 gt-text-accent font-semibold text-sm hover:underline"><span>📍</span> ניווט</a>` : ''}
                    ${modalHospital.phone ? `<a href="tel:${escapeAttr(modalHospital.phone)}" class="inline-flex items-center gap-1 gt-text-accent font-semibold text-sm hover:underline"><span>☎️</span> ${escapeHtml(modalHospital.phoneDisplay || modalHospital.phone)}</a>` : ''}
                </div>
            </div>`
        : '';

    container.innerHTML = gridHtml + '\n            ' + touristPoliceHtml + '\n            ' + hospitalHtml;
}

// One hospital card in the Health & Safety tab's left column.
function healthHospitalCardHtml(h) {
    const linksHtml = (h.mapsUrl || h.phone)
        ? `<div class="flex flex-wrap gap-4 mb-2">
                        ${h.mapsUrl ? `<a href="${escapeAttr(h.mapsUrl)}" class="inline-flex items-center gap-1 gt-text-accent font-semibold text-sm hover:underline"><span>📍</span> נווט ב-Google Maps</a>` : ''}
                        ${h.phone ? `<a href="tel:${escapeAttr(h.phone)}" class="inline-flex items-center gap-1 gt-text-accent font-semibold text-sm hover:underline"><span>☎️</span> ${escapeHtml(h.phoneDisplay || h.phone)}${h.phoneNote ? ' ' + escapeHtml(h.phoneNote) : ''}</a>` : ''}
                    </div>`
        : '';
    const descMarginClass = linksHtml ? 'text-sm gt-text-500 mb-3' : 'text-sm gt-text-500';
    const noteHtml = h.note ? `<p class="text-[11px] gt-text-300">${escapeHtml(h.note)}</p>` : '';

    return `<div class="bg-white p-5 rounded-xl border gt-border-hair shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <h5 class="font-bold gt-text-900 text-lg">${escapeHtml(h.name)}</h5>
                        <span class="gt-bg-accent-soft gt-text-accent text-xs px-2 py-1 rounded font-bold">${escapeHtml(h.tag || '')}</span>
                    </div>
                    <p class="${descMarginClass}">${escapeHtml(h.description || '')}</p>
                    ${linksHtml}
                    ${noteHtml}
                </div>`;
}

// One large emergency-number tile in the Health & Safety tab's right
// column (icon + label + sublabel, unlike the modal's compact label-only
// tile).
function healthEmergencyNumberTile(n) {
    const labelHtml = n.sublabel ? `${escapeHtml(n.label)}<br>${escapeHtml(n.sublabel)}` : escapeHtml(n.label);
    return `<div class="gt-bg-accent-soft p-6 rounded-xl text-center border gt-border-accent gt-hover-accent-soft transition-colors">
                        <div class="text-4xl mb-2">${escapeHtml(n.icon || '')}</div>
                        <div class="font-black text-4xl gt-text-accent mb-1">${escapeHtml(n.number)}</div>
                        <div class="text-sm gt-text-accent font-bold">${labelHtml}</div>
                    </div>`;
}

// Renders the Health & Safety tab's #health-emergency block: the hospitals
// column (#health-hospitals-col) and the emergency-numbers column
// (#health-emergency-numbers-col). No-ops per-column if that column's
// container isn't found, and no-ops entirely if there's no healthSafety
// data (e.g. the 'empty' destination) — leaving both columns empty rather
// than throwing.
function renderHealthSafetyEmergency() {
    const hs = getHealthSafetyData();

    const hospitalsCol = document.getElementById('health-hospitals-col');
    if (hospitalsCol) {
        if (!hs) {
            hospitalsCol.innerHTML = '';
        } else {
            const hospitals = Array.isArray(hs.hospitals) ? hs.hospitals : [];
            hospitalsCol.innerHTML = `<div>
                    <h4 class="text-2xl font-bold gt-text-900 mb-2">בתי חולים ומרפאות</h4>
                    <p class="text-sm gt-text-500 mb-4">${escapeHtml(hs.hospitalsIntro || '')}</p>
                </div>
                ${hospitals.map(healthHospitalCardHtml).join('\n                ')}
                ${hs.insuranceReminderHtml ? `<div class="text-xs font-bold gt-text-accent gt-bg-accent-soft p-3 rounded-lg border gt-border-accent">
                    ${hs.insuranceReminderHtml}
                </div>` : ''}`;
        }
    }

    const numbersCol = document.getElementById('health-emergency-numbers-col');
    if (numbersCol) {
        if (!hs) {
            numbersCol.innerHTML = '';
        } else {
            const numbers = Array.isArray(hs.emergencyNumbers) ? hs.emergencyNumbers : [];
            const tp = hs.touristPolice;
            const touristPoliceHtml = tp
                ? `<div class="gt-bg-accent text-white p-5 rounded-xl text-center shadow-md flex items-center justify-center gap-4 mt-2">
                    <div class="text-3xl">🛡️</div>
                    <div class="text-right">
                        <div class="font-bold text-2xl text-white">חייגו ${escapeHtml(tp.number)}</div>
                        <div class="text-sm text-white/95 mt-1">${escapeHtml(tp.description || '')}</div>
                    </div>
                </div>`
                : '';
            numbersCol.innerHTML = `<h4 class="text-2xl font-bold gt-text-900 mb-2">מספרי חירום (חיוג חינם מכל טלפון)</h4>
                <div class="grid grid-cols-2 gap-4">
                    ${numbers.map(healthEmergencyNumberTile).join('\n                    ')}
                </div>
                ${touristPoliceHtml}`;
        }
    }
}

window.renderEmergencyModal = renderEmergencyModal;
window.renderHealthSafetyEmergency = renderHealthSafetyEmergency;
