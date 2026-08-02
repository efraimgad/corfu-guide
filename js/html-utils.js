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
