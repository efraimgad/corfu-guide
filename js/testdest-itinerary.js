// ============================================================================
// testdest-itinerary.js — placeholder itinerary data for the "Test
// Destination" package. Same shape as js/itinerary-data.js's
// window.ITINERARY_DAYS (see that file's header comment), deliberately
// short (2 numbered days, 0 alt days) — enough to exercise the itinerary
// renderer without pretending to be a real multi-day trip plan.
// ============================================================================

window.TESTDEST_ITINERARY_DAYS = [
    {
        key: "1",
        dayNumber: 1,
        isAlt: false,
        icon: "🧪",
        titleTemplate: `יום 1 ({date}): הגעה (לדוגמה)`,
        subtitleTemplate: `יום ראשון לדוגמה בלבד — נתוני placeholder`,
        image: null,
        rainAlt: null,
        dayBrief: {
            theme: "הגעה ואוריינטציה (לדוגמה)",
            pace: "relaxed",
            bestFor: ["בדיקה"],
            overview: "<p>תיאור לדוגמה של יום ראשון — נתוני placeholder בלבד.</p>",
            mustDo: [{ title: "מוזיאון בדיקה מס' 1", why: "דוגמה בלבד" }],
            recommended: [],
            optional: [],
            ifTired: "<p>נוחו במלון לדוגמה.</p>",
            ifEnergy: "<p>המשיכו לשביל בדיקה מס' 1.</p>",
            skipFirst: "",
            weather: { sun: "<p>יום שמשי לדוגמה.</p>", cloud: "<p>יום מעונן לדוגמה.</p>" },
            sunsetNote: "",
            highlights: ["מוזיאון בדיקה מס' 1"],
            bestMoment: "ביקור במוזיאון בדיקה מס' 1"
        },
        dayArea: "אזור בדיקה מרכזי",
        closingNoteHtml: "",
        transitions: {
            fromHotel: { mode: "drive", min: 15, km: 8 },
            between: [],
            toHotel: { mode: "drive", min: 15, km: 8 }
        },
        items: [
            { time: "10:00 - 12:00", title: "ביקור במוזיאון בדיקה מס' 1", html: "<div class=\"premium-event-desc\"><p>פעילות לדוגמה — נתוני placeholder בלבד, לא תוכן אמיתי.</p></div>" }
        ]
    },
    {
        key: "2",
        dayNumber: 2,
        isAlt: false,
        icon: "🧪",
        titleTemplate: `יום 2 ({date}): טבע (לדוגמה)`,
        subtitleTemplate: `יום שני לדוגמה בלבד — נתוני placeholder`,
        image: null,
        rainAlt: null,
        dayBrief: {
            theme: "טבע ושבילים (לדוגמה)",
            pace: "balanced",
            bestFor: ["בדיקה"],
            overview: "<p>תיאור לדוגמה של יום שני — נתוני placeholder בלבד.</p>",
            mustDo: [{ title: "שביל בדיקה מס' 1", why: "דוגמה בלבד" }],
            recommended: [{ title: "מוזיאון בדיקה מס' 2", why: "דוגמה בלבד" }],
            optional: [],
            ifTired: "<p>קצרו את שביל הבדיקה.</p>",
            ifEnergy: "<p>המשיכו לשביל בדיקה מס' 2.</p>",
            skipFirst: "",
            weather: { sun: "<p>יום שמשי לדוגמה.</p>", cloud: "<p>יום מעונן לדוגמה.</p>" },
            sunsetNote: "",
            highlights: ["שביל בדיקה מס' 1"],
            bestMoment: "נוף מהשביל"
        },
        dayArea: "אזור בדיקה טבעי",
        closingNoteHtml: "",
        transitions: {
            fromHotel: { mode: "drive", min: 20, km: 12 },
            between: [{ mode: "walk", min: 10 }],
            toHotel: { mode: "drive", min: 20, km: 12 }
        },
        items: [
            { time: "09:00 - 11:30", title: "הליכה בשביל בדיקה מס' 1", html: "<div class=\"premium-event-desc\"><p>פעילות לדוגמה — נתוני placeholder בלבד.</p></div>" },
            { time: "14:00 - 15:30", title: "ביקור במוזיאון בדיקה מס' 2", html: "<div class=\"premium-event-desc\"><p>פעילות לדוגמה — נתוני placeholder בלבד.</p></div>" }
        ]
    }
];
