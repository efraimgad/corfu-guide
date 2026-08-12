// ============================================================================
// testdest-activities.js — placeholder activity data for the "Test
// Destination" package (data/destinations/testdest.js). Same record shape as
// js/corfu-activities.js's window.CORFU_ACTIVITIES (see scripts/extract-
// activities.js for the field list), deliberately just 2 entries — enough to
// exercise js/activities.js's renderActivitiesGrid() without pretending to
// be a real activity list.
//
// Every name/description below is deliberately fictional/labelled "בדיקה"
// (test) so it can never be mistaken for a real activity, per the project's
// rule against inventing realistic-looking destination content — same
// convention as js/testdest-locations.js and js/testdest-itinerary.js.
// ============================================================================

window.TESTDEST_ACTIVITIES = [
    {
        id: "activity-test-1",
        anchor: "act-test-1",
        emoji: "🧪",
        title: "פעילות בדיקה מס' 1",
        badge: null,
        images: [
            { src: "images/cards/nature.svg", alt: "איור לדוגמה של פעילות בדיקה" }
        ],
        description: "תיאור לדוגמה של פעילות בדיקה ראשונה — נתוני placeholder בלבד, לא פעילות אמיתית.",
        chips: ["💰 0€ (לדוגמה)", "⏱️ שעה (לדוגמה)", "👨‍👩‍👧‍👦 לדוגמה בלבד"],
        equipmentTip: "ציוד לדוגמה בלבד — אין צורך בציוד אמיתי.",
        warningTip: null,
        navigateUrl: "https://www.google.com/maps/search/?api=1&query=41.9%2C12.5",
        navigateLabel: "📍 נווט (לדוגמה)",
        findProviderUrl: "https://www.google.com/maps/search/?api=1&query=test%20activity",
        findProviderLabel: "🔎 מצאו ספק (לדוגמה)",
        expertTip: "טיפ לדוגמה בלבד — נתוני placeholder.",
        quickNavLabel: "🧪 פעילות בדיקה מס' 1"
    },
    {
        id: "activity-test-2",
        anchor: "act-test-2",
        emoji: "🧪",
        title: "פעילות בדיקה מס' 2",
        badge: "TEST",
        images: [
            { src: "images/cards/nature.svg", alt: "איור לדוגמה של פעילות בדיקה" },
            { src: "images/cards/history.svg", alt: "איור לדוגמה שני" }
        ],
        description: "תיאור לדוגמה של פעילות בדיקה שנייה — נתוני placeholder בלבד, לא פעילות אמיתית.",
        chips: ["💰 10€ (לדוגמה)", "⏱️ שעתיים (לדוגמה)"],
        equipmentTip: "ציוד לדוגמה שני בלבד.",
        warningTip: "אזהרה לדוגמה בלבד — נתוני placeholder, לא מידע אמיתי.",
        navigateUrl: "https://www.google.com/maps/search/?api=1&query=41.92%2C12.48",
        navigateLabel: "📍 נווט (לדוגמה)",
        findProviderUrl: "https://www.google.com/maps/search/?api=1&query=test%20activity%202",
        findProviderLabel: "🔎 מצאו ספק (לדוגמה)",
        expertTip: "טיפ לדוגמה שני — נתוני placeholder בלבד.",
        quickNavLabel: "🧪 פעילות בדיקה מס' 2"
    }
];
