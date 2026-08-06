// Shared HTML-escaping helpers, used by every module that builds markup via
// template strings (cards.js, reservations.js, packing.js, notes-favorites.js).
// Loaded first so it's available no matter which of those loads next.

function escapeAttr(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;');
}

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Shared .icon-line SVGs (see css/design-system.css's .icon-line rule) for the
// small set of emoji that were functioning as standalone UI icons (buttons,
// badges, chips) rather than body-prose decoration - Phase E, sub-step 3.
// Same 24x24 viewBox / stroke-only convention as the existing nav icons
// (index.html's dashboard-quicknav-btn / gt-app-nav SVGs). Each constant is
// aria-hidden="true" by default since every call site keeps or adds its own
// accessible name (aria-label/title) on the parent control.
const GT_ICON_MAP = '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></svg>';
const GT_ICON_PHONE = '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.5c-1.1 0-2 .9-2 2 0 7.2 5.8 13 13 13 1.1 0 2-.9 2-2v-2.1c0-.5-.3-.9-.8-1l-3.1-.7c-.4-.1-.8 0-1.1.3l-1.2 1.2a10.6 10.6 0 0 1-4.6-4.6l1.2-1.2c.3-.3.4-.7.3-1.1l-.7-3.1c-.1-.5-.5-.8-1-.8H6.5Z"/></svg>';
const GT_ICON_WARNING = '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 3 19h18Z"/><path d="M12 10v4"/><circle cx="12" cy="16.7" r="0.15" fill="currentColor" stroke-width="1.4"/></svg>';
const GT_ICON_EURO = '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 6.8a6.3 6.3 0 1 0 0 10.4"/><path d="M5.5 10.2h8M5.5 13.4h7"/></svg>';
const GT_ICON_CLOCK = '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.5 2"/></svg>';
