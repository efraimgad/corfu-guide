// ============================================================================
// paxos-activities.js — real, representative activity data for the Paxos
// destination package (data/destinations/paxos.js). Same record shape as
// js/corfu-activities.js's window.CORFU_ACTIVITIES.
//
// Deliberately 4 entries (fewer than Corfu's 14) — enough to exercise
// renderActivitiesGrid() (js/activities.js) with real content, not an
// exhaustive activity guide. No invented prices/exact durations: chips use
// qualitative wording ("paid, varies by season") rather than a specific
// euro figure this project has no verified source for.
// ============================================================================

window.PAXOS_ACTIVITIES = [
    {
        id: "paxos-act-antipaxos-boat",
        anchor: "act-paxos-antipaxos",
        emoji: "🚤",
        title: "שייט יום לאנטיפאקסוס",
        badge: "המומלץ ביותר",
        images: [
            { src: "images/cards/beach.svg", alt: "איור: סירה קטנה מול חוף טורקיז" }
        ],
        description: "טקסי-ים או סיור שייט מאורגן מגאיוס או מלאקה לאי הקטן אנטיפאקסוס, לחופי וטומי וורייקה המפורסמים במימיהם הצלולים. פועל בעיקר בעונת הקיץ ותלוי במזג האוויר.",
        chips: ["💰 בתשלום, משתנה בעונה", "⏱️ חצי יום עד יום שלם", "👨‍👩‍👧‍👦 מתאים למשפחות"],
        equipmentTip: "בגד ים, מגבת, נעלי מים לחלוקים, ומים — באנטיפאקסוס תשתית קיוסקים מצומצמת.",
        warningTip: "כלי השיט הקטנים עלולים לא לצאת בים סוער — כדאי לבדוק מראש ולא להשאיר זאת ליום האחרון בביקור.",
        navigateUrl: "https://www.google.com/maps/search/?api=1&query=Antipaxos+boat+taxi+Gaios",
        navigateLabel: "📍 נמל גאיוס",
        findProviderUrl: "https://www.google.com/maps/search/?api=1&query=Antipaxos+water+taxi",
        findProviderLabel: "🔎 טקסי-ים לאנטיפאקסוס",
        expertTip: "בשעות הבוקר המוקדמות פחות עמוס — סירות רבות מגיעות בשיא הצהריים.",
        quickNavLabel: "🚤 שייט לאנטיפאקסוס"
    },
    {
        id: "paxos-act-blue-caves-tour",
        anchor: "act-paxos-blue-caves",
        emoji: "🕳️",
        title: "סיור סירה במערות הכחולות",
        badge: null,
        images: [
            { src: "images/cards/nature.svg", alt: "איור: כניסה למערת ים" }
        ],
        description: "סיור בסירה לאורך החוף המערבי הפרוע של פאקסוס, דרך שרשרת מערות ים וקשתות סלע מוארות במים כחולים עזים — נגיש כמעט אך ורק מהים.",
        chips: ["💰 בתשלום, משתנה בעונה", "⏱️ כשעה-שעתיים"],
        equipmentTip: "מצלמה עמידת מים אם יש — הכניסה למערות מתבצעת לרוב עם הסירה עצמה או בשחייה קצרה.",
        warningTip: null,
        navigateUrl: "https://www.google.com/maps/search/?api=1&query=Blue+Caves+Paxos",
        navigateLabel: "📍 חוף מערבי, פאקסוס",
        findProviderUrl: "https://www.google.com/maps/search/?api=1&query=Paxos+blue+caves+boat+tour",
        findProviderLabel: "🔎 סיורי סירה למערות",
        expertTip: "משולב לרוב באותו סיור עם שייט לאנטיפאקסוס — כדאי לבדוק חבילות משולבות.",
        quickNavLabel: "🕳️ המערות הכחולות"
    },
    {
        id: "paxos-act-village-walk",
        anchor: "act-paxos-village-walk",
        emoji: "🚶",
        title: "הליכה בין לוגוס ללאקה בין חורשות זית",
        badge: null,
        images: [
            { src: "images/cards/village.svg", alt: "איור: שביל בין עצי זית" }
        ],
        description: "שביל הליכה קצר ונוף מרהיב המחבר בין כפר הדייגים הציורי לוגוס לבין מפרץ לאקה השקט בצפון האי, דרך חורשות זית טיפוסיות לפאקסוס.",
        chips: ["💰 חינם", "⏱️ כשעה-שעה וחצי הליכה"],
        equipmentTip: "נעלי הליכה נוחות וכובע — רוב השביל חשוף לשמש.",
        warningTip: null,
        navigateUrl: "https://www.google.com/maps/search/?api=1&query=Loggos+to+Lakka+walking+path+Paxos",
        navigateLabel: "📍 לוגוס",
        findProviderUrl: null,
        findProviderLabel: null,
        expertTip: "עדיף בשעות הבוקר המוקדמות או לקראת הערב, לא בשיא החום של הצהריים.",
        quickNavLabel: "🚶 שביל לוגוס–לאקה"
    },
    {
        id: "paxos-act-erimitis-sunset",
        anchor: "act-paxos-erimitis",
        emoji: "🌅",
        title: "שקיעה בצוקי אירימיטיס",
        badge: null,
        images: [
            { src: "images/cards/village.svg", alt: "איור: שקיעה מעל צוקים" }
        ],
        description: "נקודת הצפייה בשקיעה האהובה על תושבי האי — צוקי אבן גיר דרמטיים בחוף המערבי, ליד הכפר הקטן מגזיה.",
        chips: ["💰 חינם", "⏱️ כשעה"],
        equipmentTip: "כלי רכב או קטנוע מומלצים — המקום מרוחק מעט מגאיוס.",
        warningTip: "קרבו לקצה הצוק בזהירות, אין גידור.",
        navigateUrl: "https://www.google.com/maps/search/?api=1&query=Erimitis+Paxos",
        navigateLabel: "📍 אירימיטיס",
        findProviderUrl: null,
        findProviderLabel: null,
        expertTip: "הגיעו כחצי שעה לפני השקיעה כדי לתפוס מקום ישיבה נוח על הסלעים.",
        quickNavLabel: "🌅 שקיעה באירימיטיס"
    }
];
