// ============================================================================
// js/testdest-weather.js — placeholder monthly weather data for the "Test
// Destination".
//
// Fictional/placeholder content only, matching the labeling convention in
// js/testdest-locations.js / js/testdest-faq.js (obviously-fake Hebrew text,
// never anything that could pass for real travel advice). Exists purely to
// prove renderWeatherTable() (js/trip-planning.js) works for a second
// destination, not just Corfu — and with fewer rows than Corfu's, to prove
// the renderer doesn't hardcode a row count.
// ============================================================================

window.TESTDEST_WEATHER = [
    {
        month: 'חודש לדוגמה 1',
        dayTemp: '00°',
        seaTemp: '00°',
        rainDays: '0',
        description: 'תיאור placeholder לבדיקת הארכיטקטורה בלבד — אין כאן מידע אמיתי על מזג אוויר בשום יעד.',
        highlight: false
    },
    {
        month: 'חודש לדוגמה 2',
        dayTemp: '00°',
        seaTemp: '00°',
        rainDays: '0',
        description: 'תיאור placeholder נוסף, מסומן כ"מומלץ" כדי לבדוק את עיצוב ה-highlight ברכיב הטבלה.',
        highlight: true
    }
];
