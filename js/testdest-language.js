// ============================================================================
// js/testdest-language.js — placeholder Language & Daily Life data for the
// "Test Destination" package.
//
// Fictional/placeholder content only, matching the labeling convention in
// js/testdest-locations.js / js/testdest-about.js (obviously-fake Hebrew
// text, never anything that could pass for real travel advice). Exists
// purely to prove js/language.js's renderers work for a second destination,
// not just Corfu — with fewer items than Corfu's in each list, to prove no
// renderer hardcodes a count. Mirrors js/corfu-language.js's shape exactly,
// including the phrasebook's separate, non-list pronunciationTip field.
// ============================================================================

window.TESTDEST_LANGUAGE = {
    shoppingStreets: [
        {
            icon: '🧪',
            name: 'רחוב בדיקה מס\' 1 (Test Street 1)',
            description: 'תיאור placeholder של רחוב קניות לדוגמה — אין כאן מידע אמיתי על שום יעד.',
            mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Test+Street+One'
        }
    ],
    souvenirs: [
        {
            icon: '🧪',
            title: 'מזכרת לדוגמה מס\' 1',
            description: 'תיאור placeholder של מזכרת לדוגמה — נתוני בדיקה בלבד.'
        },
        {
            icon: '🧪',
            title: 'מזכרת לדוגמה מס\' 2',
            description: 'תיאור placeholder שני של מזכרת לדוגמה — נתוני בדיקה בלבד.'
        }
    ],
    supermarkets: [
        {
            name: 'רשת בדיקה 1',
            description: 'תיאור placeholder של רשת סופרמרקטים לדוגמה.'
        },
        {
            name: 'רשת בדיקה 2',
            description: 'תיאור placeholder שני של רשת סופרמרקטים לדוגמה.'
        }
    ],
    phrasebook: [
        {
            icon: '🧪',
            title: 'קטגוריית ניבים לדוגמה',
            phrases: [
                {
                    hebrew: 'ביטוי לדוגמה',
                    greek: 'Δοκιμή',
                    transliteration: 'דוקימי'
                },
                {
                    hebrew: 'ביטוי לדוגמה שני',
                    greek: 'Δοκιμή δύο',
                    transliteration: 'דוקימי דיו'
                }
            ]
        }
    ],
    pronunciationTip: {
        icon: '💡',
        title: 'טיפ הגייה לדוגמה',
        html: 'טקסט placeholder על הגייה — נתוני בדיקה בלבד, אין כאן מידע אמיתי על שום שפה.'
    },
    noMallsIntro: 'טקסט placeholder על קניות ביעד הבדיקה — נתוני בדיקה בלבד.',
    restroomsHtml: 'טקסט placeholder על שירותים ציבוריים ביעד הבדיקה — נתוני בדיקה בלבד.',
    phrasebookIntro: 'טקסט placeholder פתיחה למילון הניבים — נתוני בדיקה בלבד.'
};
