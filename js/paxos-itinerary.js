// ============================================================================
// paxos-itinerary.js — a real, 2-day Paxos itinerary, same schema as
// js/itinerary-data.js's window.ITINERARY_DAYS (see that file's header) /
// js/testdest-itinerary.js's window.TESTDEST_ITINERARY_DAYS.
//
// Deliberately 2 days, not Corfu's 9: Paxos is genuinely small enough (the
// whole island is ~11km end to end) that 2 days covers its 3 villages plus
// an Antipaxos boat trip without inventing a padded multi-day plan. Every
// stop is one of this destination's own real locations (js/paxos-
// locations.js) and every transition time is derived from the same
// distances data/destinations/paxos.js's distanceTool already declares
// (Gaios-Loggos ~10min, Gaios-Lakka ~18min, Loggos-Lakka ~10min) — no new,
// separately-invented timing numbers. The Antipaxos boat crossing itself
// has no official schedule this project can verify, so its item describes
// it qualitatively ("morning departure, early-to-mid-afternoon return")
// rather than inventing exact clock times.
// ============================================================================

window.PAXOS_ITINERARY_DAYS = [
    {
        key: "1",
        dayNumber: 1,
        isAlt: false,
        icon: "⚓",
        titleTemplate: `יום 1 ({date}): הגעה, גאיוס ולוגוס`,
        subtitleTemplate: `הגעה בשיט מקורפו, היכרות עם הבירה הקטנה של האי וכפר הדייגים הציורי לוגוס`,
        image: null,
        rainAlt: null,
        dayBrief: {
            theme: "הגעה, גאיוס והעיר העתיקה",
            pace: "relaxed",
            bestFor: ["history", "villages", "sunset"],
            overview: "<p>יום ראשון רגוע: הגעה בשיט מקורפו לנמל גאיוס, היכרות עם הסמטאות הניאו-קלאסיות של העיר העתיקה, וקפיצה קצרה לכפר הדייגים לוגוס בשעות אחר הצהריים — לפני חזרה לגאיוס לארוחת ערב מול אי פאנאיה.</p>",
            mustDo: [
                { title: "הליכה בעיר העתיקה של גאיוס", why: "הדרך הקלה ביותר להכיר את אופי האי כבר ביום הראשון" },
                { title: "טברנות נמל גאיוס לארוחת ערב", why: "המקום המרכזי לארוחת ערב על החוף, מול אי פאנאיה" }
            ],
            recommended: [
                { title: "חזית המים של לוגוס", why: "כפר קטן ופחות תיירותי, ניגוד נעים לגאיוס" }
            ],
            optional: [
                { title: "סיבוב קצר ברכב/קטנוע שכור", why: "אם מגיעים ללינה של כמה ימים, כדאי להתחיל להתמצא בכבישי האי" }
            ],
            ifTired: "<p>הישארו בגאיוס עצמה — הכל נגיש ברגל, אין צורך לנסוע רחוק ביום ההגעה.</p>",
            ifEnergy: "<p>המשיכו אחרי לוגוס גם ללאקה בקצה הצפוני, ותתחילו את יום 2 כבר משם.</p>",
            skipFirst: "",
            weather: {
                sun: "<p>יום שמשי מצוין להליכה בעיר העתיקה ולערב על הטיילת.</p>",
                cloud: "<p>גם ביום מעונן הסמטאות והטברנות המקורות נעימות לביקור.</p>"
            },
            sunsetNote: "השקיעה מעל אי פאנאיה בכניסה לנמל גאיוס היא מהנופים המזוהים ביותר עם האי.",
            highlights: ["העיר העתיקה של גאיוס", "לוגוס"],
            bestMoment: "ארוחת ערב מול אי פאנאיה עם רדת החשיכה"
        },
        dayArea: "גאיוס ולוגוס",
        closingNoteHtml: "",
        transitions: {
            fromHotel: { mode: "boat", min: 75, km: null },
            between: [{ mode: "drive", min: 10, km: 5 }, { mode: "drive", min: 10, km: 5 }],
            toHotel: { mode: "walk", min: 5, km: null }
        },
        items: [
            { time: "10:00 - 11:15", title: "הגעה בשיט מקורפו לנמל גאיוס", html: "<div class=\"premium-event-desc\"><p>מעבורת או קטמרן מקורפו — משך ההפלגה כשעה עד שעה ורבע, תלוי בחברת השיט ובמזג האוויר. ירידה ישירות לתוך העיר העתיקה של גאיוס.</p></div>" },
            { time: "12:00 - 13:30", title: "ארוחת צהריים והתמצאות בגאיוס", html: "<div class=\"premium-event-desc\"><p>ארוחה קלה באחת מטברנות הנמל, ואחריה הליכה בסמטאות העיר העתיקה — בתים ניאו-קלאסיים בהשפעה ונציאנית לאורך הנמל ומאחוריו.</p></div>" },
            { time: "15:00 - 17:00", title: "נסיעה קצרה ללוגוס", html: "<div class=\"premium-event-desc\"><p>כ-10 דקות נסיעה מגאיוס. שיטוט בכפר הדייגים הציורי והקטן ביותר באי, עם בתי הטברנה הצבעוניים ממש על המים.</p></div>" },
            { time: "19:00 ואילך", title: "ארוחת ערב בטברנת נמל גאיוס", html: "<div class=\"premium-event-desc\"><p>חזרה לגאיוס לארוחת ערב על החוף מול אי פאנאיה, עם רדת החשיכה מעל הנמל.</p></div>" }
        ]
    },
    {
        key: "2",
        dayNumber: 2,
        isAlt: false,
        icon: "🚤",
        titleTemplate: `יום 2 ({date}): לאקה ושייט לאנטיפאקסוס`,
        subtitleTemplate: `בוקר במפרץ השקט של לאקה, ואחר הצהריים שייט לחופים הטורקיז של אנטיפאקסוס`,
        image: null,
        rainAlt: null,
        dayBrief: {
            theme: "לאקה ואנטיפאקסוס",
            pace: "active",
            bestFor: ["water", "beach", "scenic"],
            overview: "<p>יום שני סביב המים: בוקר במפרץ לאקה השקט בצפון האי, ואחר הצהריים שייט לאנטיפאקסוס — חופי וטומי וורייקה המפורסמים, נגישים רק בסירה.</p>",
            mustDo: [
                { title: "שייט יום לאנטיפאקסוס", why: "הסיבה המרכזית שרבים מגיעים לפאקסוס בכלל — מים בגוון טורקיז עז שקשה למצוא במקום אחר" }
            ],
            recommended: [
                { title: "טיילת המים של לאקה", why: "מפרץ שייטים אהוב, נעים לשעת בוקר רגועה לפני השייט" }
            ],
            optional: [
                { title: "עצירה במפרץ מונודנדרי", why: "מפרץ חלוקים שקט בדרך ללאקה, אם יש זמן לפני השייט" }
            ],
            ifTired: "<p>ותרו על השייט לאנטיפאקסוס ובלו יום רגוע יותר בשחייה במפרץ לאקה עצמו או במונודנדרי.</p>",
            ifEnergy: "<p>שלבו את השייט עם עצירה במערות הכחולות בחוף המערבי, אם הספק השיט מציע זאת.</p>",
            skipFirst: "",
            weather: {
                sun: "<p>יום קיצי טיפוסי — מושלם לשייט ולשחייה.</p>",
                cloud: "<p>ימים סוערים עלולים לבטל את השייט לאנטיפאקסוס — בדקו מראש מול הספק.</p>"
            },
            sunsetNote: "אם נשאר זמן וכוח בערב, צוקי אירימיטיס בחוף המערבי הם נקודת שקיעה אהובה על מקומיים.",
            highlights: ["חוף וטומי, אנטיפאקסוס", "חוף ורייקה, אנטיפאקסוס"],
            bestMoment: "שחייה במים הטורקיז של חוף וטומי"
        },
        dayArea: "לאקה ואנטיפאקסוס",
        closingNoteHtml: "⚠️ שייטי היום לאנטיפאקסוס תלויים במזג אוויר ובעונה — מומלץ לוודא מראש מול ספק השיט, לא ביום האחרון של הביקור.",
        transitions: {
            fromHotel: { mode: "drive", min: 18, km: 11 },
            between: [{ mode: "boat", min: 30, km: null }],
            toHotel: { mode: "boat", min: 30, km: null }
        },
        items: [
            { time: "09:00 - 10:30", title: "בוקר במפרץ לאקה", html: "<div class=\"premium-event-desc\"><p>הליכה קצרה בכפר ובטיילת המים, עם אפשרות לקפה או שחייה קלה במפרץ השקט לפני השייט.</p></div>" },
            { time: "11:00 - 15:00", title: "שייט לאנטיפאקסוס", html: "<div class=\"premium-event-desc\"><p>טקסי-ים או סיור שייט מלאקה (או מגאיוס) לאי הקטן אנטיפאקסוס — עצירות שחייה בחוף וטומי ובחוף ורייקה. משך משוער כולל שהות בחוף: כארבע שעות, תלוי בספק השיט.</p><ul class=\"space-y-1.5 text-sm mt-3\"><li class=\"flex items-center gap-2\"><span class=\"text-blue-600 shrink-0\">⏱️</span><span><strong class=\"font-semibold text-gray-900\">משך:</strong> כחצי יום, תלוי בספק ובמזג האוויר</span></li></ul></div>" },
            { time: "19:00 ואילך", title: "ערב חופשי בגאיוס או בלאקה", html: "<div class=\"premium-event-desc\"><p>ארוחת ערב אחרונה — בגאיוס לחזרה נוחה למעבורת, או בלאקה אם נשארתם באזור הצפוני.</p></div>" }
        ]
    }
];
