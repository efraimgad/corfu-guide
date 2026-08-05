// ============================================================================
// reservations.js — a lightweight local list of reservations/bookings
// (restaurant tables, tours, activities) with a confirmation number and a
// tap-to-call phone link. Local-only, same try/catch localStorage pattern
// used throughout the app (see js/storage.js's getItemStateCache).
// ============================================================================

const RESERVATIONS_KEY = 'corfu-guide-reservations';
// Shape: [{ id, place, date ('YYYY-MM-DD' or ''), time ('HH:MM' or ''),
//           confirmation, phone, partySize (number, default 2) }]

function getReservations() {
    try {
        const raw = localStorage.getItem(RESERVATIONS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function saveReservations(list) {
    try {
        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(list));
    } catch (e) {
        console.warn('Could not save reservations', e);
    }
}

function generateReservationId() {
    return `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatReservationDate(iso) {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const [y, m, d] = parts;
    return `${d}.${m}.${y}`;
}

function reservationSortKey(r) {
    // Undated reservations sort to the end rather than the (wrong) top.
    return r.date ? new Date(`${r.date}T${r.time || '00:00'}:00`).getTime() : Infinity;
}

function reservationRowHtml(r) {
    const dateLabel = [formatReservationDate(r.date), r.time || ''].filter(Boolean).join(' · ');
    const dial = r.phone ? String(r.phone).replace(/[^\d+]/g, '') : '';
    return `
    <div class="flex items-start justify-between gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100" data-reservation-id="${escapeAttr(r.id)}">
      <div class="min-w-0">
        <p class="font-bold text-gray-900">${escapeHtml(r.place || 'הזמנה')}</p>
        ${dateLabel ? `<p class="text-sm text-gray-600">📅 ${escapeHtml(dateLabel)}</p>` : ''}
        ${r.confirmation ? `<p class="text-xs text-gray-500">מס' אישור: ${escapeHtml(r.confirmation)}</p>` : ''}
        ${r.partySize ? `<p class="text-xs text-gray-500">👥 ${escapeHtml(String(r.partySize))} סועדים</p>` : ''}
        ${dial ? `<a href="tel:${escapeAttr(dial)}" class="inline-flex items-center gap-1 text-blue-600 font-semibold text-sm hover:underline mt-1" dir="ltr"><span>☎️</span> ${escapeHtml(r.phone)}</a>` : ''}
      </div>
      <div class="flex gap-1 shrink-0">
        <button onclick="openReservationForm('${escapeAttr(r.id)}')" class="text-gray-500 hover:text-[var(--ion-700)] p-2 rounded-lg hover:bg-white transition-colors" title="עריכה" aria-label="עריכת הזמנה">✏️</button>
        <button onclick="deleteReservationConfirm('${escapeAttr(r.id)}')" class="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-white transition-colors" title="מחיקה" aria-label="מחיקת הזמנה">🗑️</button>
      </div>
    </div>`;
}

function renderReservationsList() {
    const container = document.getElementById('reservations-list');
    const emptyEl = document.getElementById('reservations-empty');
    if (!container) return;
    const list = getReservations().slice().sort((a, b) => reservationSortKey(a) - reservationSortKey(b));
    if (!list.length) {
        container.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');
    container.innerHTML = list.map(reservationRowHtml).join('');
}

// Picks the most relevant reservation for the dashboard preview tile: the
// soonest one still ahead of us, falling back to the most recent past one
// (still useful right after the trip), falling back to the first undated entry.
function getNextReservation(list) {
    const now = Date.now();
    const dated = list.filter(r => r.date);
    const upcoming = dated.filter(r => reservationSortKey(r) >= now).sort((a, b) => reservationSortKey(a) - reservationSortKey(b));
    if (upcoming.length) return upcoming[0];
    if (dated.length) return dated.slice().sort((a, b) => reservationSortKey(b) - reservationSortKey(a))[0];
    return list[0] || null;
}

function renderReservationsDashboardTile() {
    const nameEl = document.getElementById('dash-reservation-name');
    const subEl = document.getElementById('dash-reservation-sub');
    if (!nameEl) return;
    const list = getReservations();
    const next = getNextReservation(list);
    if (!next) {
        nameEl.textContent = 'אין הזמנות שמורות';
        if (subEl) subEl.textContent = 'הוסיפו הזמנת מסעדה, סיור או פעילות';
        return;
    }
    nameEl.textContent = next.place || 'הזמנה';
    const dateLabel = [formatReservationDate(next.date), next.time || ''].filter(Boolean).join(' · ');
    if (subEl) subEl.textContent = dateLabel || `${list.length} הזמנות שמורות`;
}

// --- Add/edit form (inline, not a modal - keeps it simple on mobile) ------
// `prefill` ({ place, phone }) is new (Phase 4, batch 2): lets a caller that
// has NO saved reservation yet - e.g. the "הזמן" button on an Explore row
// card (js/explore.js handleExploreReserve()) - open a blank form already
// filled in with the venue's own name/phone from CORFU_LOCATIONS, instead of
// making the user retype them. Every existing call site (the reservation
// list's own ✏️ edit button, and "+ הוספת הזמנה" with no id at all) keeps
// working unchanged: they never pass a second argument, so `prefill`
// defaults to an empty object and entry (when present) still wins.
function openReservationForm(id, prefill) {
    const form = document.getElementById('reservation-form');
    if (!form) return;
    const list = getReservations();
    const entry = id ? list.find(r => r.id === id) : null;
    const pf = prefill || {};

    document.getElementById('reservation-edit-id').value = entry ? entry.id : '';
    document.getElementById('reservation-place').value = entry ? (entry.place || '') : (pf.place || '');
    document.getElementById('reservation-phone').value = entry ? (entry.phone || '') : (pf.phone || '');
    document.getElementById('reservation-date').value = entry ? (entry.date || '') : '';
    document.getElementById('reservation-time').value = entry ? (entry.time || '') : '';
    document.getElementById('reservation-confirmation').value = entry ? (entry.confirmation || '') : '';
    document.getElementById('reservation-party-size').value = entry ? (entry.partySize || 2) : 2;

    document.getElementById('reservation-form-title').textContent = entry ? 'עריכת הזמנה' : 'הזמנה חדשה';
    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    document.getElementById('reservation-place').focus();
}

function closeReservationForm() {
    const form = document.getElementById('reservation-form');
    if (!form) return;
    form.classList.add('hidden');
    ['reservation-edit-id', 'reservation-place', 'reservation-phone', 'reservation-date', 'reservation-time', 'reservation-confirmation']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('reservation-party-size').value = 2;
}

function saveReservationForm() {
    const place = document.getElementById('reservation-place').value.trim();
    if (!place) {
        document.getElementById('reservation-place').focus();
        return;
    }
    const id = document.getElementById('reservation-edit-id').value;
    const entry = {
        id: id || generateReservationId(),
        place,
        phone: document.getElementById('reservation-phone').value.trim(),
        date: document.getElementById('reservation-date').value,
        time: document.getElementById('reservation-time').value,
        confirmation: document.getElementById('reservation-confirmation').value.trim(),
        partySize: parseInt(document.getElementById('reservation-party-size').value, 10) || 2
    };

    const list = getReservations();
    const idx = list.findIndex(r => r.id === entry.id);
    if (idx >= 0) list[idx] = entry; else list.push(entry);
    saveReservations(list);

    renderReservationsList();
    renderReservationsDashboardTile();
    closeReservationForm();
}

function deleteReservationConfirm(id) {
    if (!confirm('למחוק את ההזמנה הזו?')) return;
    saveReservations(getReservations().filter(r => r.id !== id));
    renderReservationsList();
    renderReservationsDashboardTile();
}

function viewReservations() {
    const panel = document.getElementById('reservations-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initReservations() {
    renderReservationsList();
    renderReservationsDashboardTile();
}

window.openReservationForm = openReservationForm;
window.closeReservationForm = closeReservationForm;
window.saveReservationForm = saveReservationForm;
window.deleteReservationConfirm = deleteReservationConfirm;
window.viewReservations = viewReservations;
window.CorfuReservations = { init: initReservations };
