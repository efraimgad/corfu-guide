// ============================================================================
// testdest-tripplanning-static.js — placeholder data for the Trip Planning
// blocks found in the follow-up leakage-fix pass (see js/corfu-
// tripplanning-static.js's header). Proves the new renderers work for a
// destination other than Corfu/Paxos, including the budget.generalNote
// shape (no fabricated per-item prices) — same convention as Paxos.
// ============================================================================

window.TESTDEST_TRIPPLANNING_STATIC = {
    weatherHeading: {
        title: 'מזג אוויר עונתי ביעד הבדיקה',
        subtitle: 'תיאור placeholder של האקלים ביעד הבדיקה — נתוני בדיקה בלבד.'
    },
    accommodation: {
        areaLabel: 'אזור בדיקה מרכזי, יעד בדיקה',
        intro: 'תיאור placeholder של אזור הלינה ביעד הבדיקה — נתוני בדיקה בלבד.',
        cards: [
            { icon: '🧪', iconHtml: null, title: 'כרטיס בדיקה 1', description: 'תיאור placeholder בלבד.' },
            { icon: '🧪', iconHtml: null, title: 'כרטיס בדיקה 2', description: 'תיאור placeholder שני בלבד.' }
        ]
    },
    seasonality: {
        bands: [
            { label: '❄️ עונת בדיקה סגורה', items: ['פריט placeholder 1', 'פריט placeholder 2'] },
            { label: '☀️ עונת בדיקה פתוחה', items: ['פריט placeholder 3'] }
        ],
        tip: 'טיפ placeholder בלבד.'
    },
    budget: {
        title: 'כמה עולה יום ביעד הבדיקה?',
        generalNote: 'הערת placeholder — אין נתוני מחירים אמיתיים ביעד בדיקה זה.'
    },
    transport: {
        publicTransport: { title: 'תחבורה ציבורית לדוגמה', items: ['פריט placeholder'] },
        fuelParking: { title: 'דלק וחניה לדוגמה', html: 'טקסט placeholder בלבד.' },
        tolls: { title: 'כבישי אגרה לדוגמה', html: 'טקסט placeholder בלבד.' },
        drivingFromBase: { title: 'נהיגה מאזור הבדיקה', items: ['פריט placeholder'] },
        ferriesSummary: { title: 'מעבורות לדוגמה', html: 'טקסט placeholder בלבד.' },
        roadSafetyHeadingTitle: 'טיפי נהיגה ובטיחות ביעד הבדיקה',
        driveTimeFootnotes: {
            planningTip: 'טקסט placeholder בלבד.',
            shapeTip: 'טקסט placeholder בלבד.',
            baseAdjustmentNote: 'טקסט placeholder בלבד.'
        }
    },
    ferriesDetailed: {
        title: '⛴️ מעבורות לדוגמה',
        routes: [
            { title: 'יעד לדוגמה 1', description: 'תיאור placeholder בלבד.' }
        ],
        disclaimer: 'טקסט placeholder בלבד.'
    }
};
