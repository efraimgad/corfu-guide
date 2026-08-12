// Placeholder About-region data for the "Test Destination" package — proves
// renderAboutRegions() (js/about.js) works for a destination other than
// Corfu. Fictional, clearly labelled "בדיקה" (test), matching the
// placeholder convention already used in js/testdest-locations.js.
window.TESTDEST_ABOUT = {
    regions: [
        {
            id: 'region-test-1',
            label: 'אזור 1',
            emoji: '🧪',
            title: 'אזור בדיקה מס\' 1',
            description: 'תיאור לדוגמה של אזור בדיקה — נתוני placeholder בלבד, לא תוכן אמיתי.'
        },
        {
            id: 'region-test-2',
            label: 'אזור 2',
            emoji: '🧪',
            title: 'אזור בדיקה מס\' 2',
            description: 'תיאור לדוגמה שני — נתוני placeholder בלבד.'
        }
    ],
    // Placeholder quick-facts pills — proves renderAboutQuickFacts()
    // (js/about.js) works for a destination other than Corfu, including the
    // {iconHtml, text} raw-markup pill shape (Corfu's currency pill uses an
    // inline <svg> instead of an emoji).
    quickFacts: [
        { icon: '🧪', text: 'עובדה לדוגמה מס\' 1 — נתוני placeholder בלבד' },
        { icon: '🧪', text: 'עובדה לדוגמה מס\' 2 — נתוני placeholder בלבד' },
        { iconHtml: '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/></svg>', text: 'מטבע לדוגמה: יורו (€)' }
    ]
};
