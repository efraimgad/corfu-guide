// ============================================================================
// paxos-tripplanning-static.js — real Paxos content for the Trip Planning
// blocks that stayed static Corfu prose after Phase 2 (see js/corfu-
// tripplanning-static.js's header for the full list and why). Same shape,
// written independently for Paxos's own real facts — not Corfu's text with
// the name swapped, and several fields are honestly DIFFERENT in kind, not
// just content, because the underlying reality differs (e.g. Paxos has no
// fixed-route public bus network the way Corfu does).
//
// budget deliberately has NO per-item price breakdown (no `days` array):
// this project has no verified Paxos-specific price research the way
// Corfu's numbers were built from, and inventing plausible-looking euro
// figures would be exactly the fabricated precision the project's own
// rules forbid. `generalNote` is honest general wording instead — the
// renderer (js/trip-planning.js) supports either shape.
// ============================================================================

window.PAXOS_TRIPPLANNING_STATIC = {
    weatherHeading: {
        title: 'מזג אוויר עונתי בפאקסוס',
        subtitle: 'פאקסוס חולקת את אקלים האיים היוניים עם קורפו השכנה - חורף גשום יחסית וקיץ חם ויבש.'
    },
    accommodation: {
        areaLabel: 'גאיוס (Gaios), פאקסוס',
        intro: 'גאיוס היא הבירה הקטנה והנמל הראשי של האי - נקודת מוצא טבעית לכל ביקור. רוב מה שכדאי לדעת נמצא בטווח הליכה קצרה מהנמל.',
        cards: [
            {
                icon: '⚓',
                iconHtml: null,
                title: 'נמל גאיוס',
                description: 'לב האי - טיילת עם טברנות וחנויות קטנות, ומולה אי המנזר הקטן פאנאיה. כל התנועה הימית (מעבורות, טקסי-ים, סיורי שייט) יוצאת מכאן.'
            },
            {
                icon: '🏖️',
                iconHtml: null,
                title: 'חופים קרובים',
                description: '<strong>מונודנדרי:</strong> מפרץ חלוקים שקט כ-15-20 דקות נסיעה. <strong>אנטיפאקסוס:</strong> החופים הטורקיז המפורסמים, נגישים רק בסירה מהנמל.'
            },
            {
                icon: '🍽️',
                iconHtml: null,
                title: 'מסעדות וטברנות',
                description: 'שדרת הטברנות לאורך נמל גאיוס היא המרכז לארוחות. עוד אפשרויות בלוגוס ובלאקה, במרחק נסיעה קצרה. ⚠️ כמו בכל כפר קטן, עסקים משתנים משנה לשנה - בדקו ב-Google Maps עם ההגעה.'
            },
            {
                icon: '🛒',
                iconHtml: null,
                title: 'מכולות, בית מרקחת וכספומט',
                description: 'גאיוס היא הכפר הכי מבוסס באי, אך עדיין קטן בהרבה מכפרי נופש בקורפו - מכולות משפחתיות, בית מרקחת אחד ומספר מצומצם של כספומטים. אין רשתות סופרמרקט גדולות באי כלל.',
                variant: 'sunken'
            },
            {
                icon: '🏛️',
                iconHtml: null,
                title: 'העיר העתיקה של גאיוס',
                description: 'סמטאות ובתים ניאו-קלאסיים בהשפעה ונציאנית, ממש סביב הנמל - הליכה קצרה מספיקה כדי לראות את מרביתם.'
            },
            {
                icon: '🌇',
                iconHtml: null,
                title: 'שקיעה',
                description: 'גאיוס פונה לצד המזרחי/מוגן של האי, לא לים הפתוח. לשקיעה קלאסית מעל הים סעו לצוקי אירימיטיס בחוף המערבי.'
            }
        ]
    },
    seasonality: {
        bands: [
            {
                label: '❄️ נובמבר - מרץ (סגור ברובו)',
                items: [
                    'רוב הטברנות ובתי ההארחה הקטנים סגורים לגמרי',
                    'שייטי היום לאנטיפאקסוס ולמערות הכחולות כמעט ואינם פועלים',
                    'תדירות המעבורות מקורפו יורדת משמעותית',
                    'האי שקט מאוד - מתאים בעיקר למי שמחפש אווירה אותנטית, לא לשירותי תיירות מלאים'
                ]
            },
            {
                label: '🌤️ אפריל-מאי, אוקטובר (חלקי)',
                items: [
                    'עסקים פותחים/סוגרים בהדרגה - חלק מהטברנות עוד סגורות בתחילת אפריל',
                    'תדירות המעבורות והשייטים לאנטיפאקסוס עולה בהדרגה',
                    'הים עדיין קריר יחסית לשחייה ממושכת'
                ]
            },
            {
                label: '☀️ יוני - ספטמבר (הכל פתוח)',
                items: [
                    'רוב הטברנות והשירותים פתוחים במלואם',
                    'שייטי יום לאנטיפאקסוס פועלים בתדירות גבוהה',
                    'אוגוסט: עומס שיא (גם משייטים) - מומלץ להזמין שייט/מקום מראש'
                ]
            }
        ],
        tip: '<strong>💡 טיפ:</strong> פאקסוס היא אי קטן עם עסקים משפחתיים - שעות פתיחה ותדירות שייטים משתנות לפי מזג אוויר ולפי שיקול דעת הבעלים, במיוחד בשולי העונה. אם משהו ספציפי חשוב לתכנון שלכם, כדאי לוודא מראש.'
    },
    // No `days` array (no fabricated Paxos price research) — generalNote
    // instead, per the project's rule against inventing precise facts.
    budget: {
        title: 'כמה עולה יום בפאקסוס?',
        generalNote: 'לפרויקט הזה אין נתוני מחירים מאומתים וספציפיים לפאקסוס, ולכן לא נציג כאן פירוט מספרי מומצא. באופן כללי, איים יווניים קטנים עם היצע מוגבל יותר (כמו פאקסוס) נוטים להיות דומים או מעט יקרים יותר מקורפו במסעדות ובפעילויות - אך ההבדל תלוי מאוד בעונה ובמקום הספציפי. לתכנון תקציב מומלץ להתבסס על הערכה כללית ליוון ולבדוק מחירים בפועל בזמן אמת.'
    },
    transport: {
        // Honestly different in KIND, not just content: Paxos has no
        // fixed-route bus network comparable to Corfu's blue/green buses.
        publicTransport: {
            title: 'תחבורה ציבורית',
            items: [
                'לפאקסוס אין רשת אוטובוסים קווית כמו בקורפו - האי קטן מספיק שרוב המבקרים מסתדרים ברגל בתוך הכפרים, או ברכב/קטנוע שכור בין הכפרים.',
                'קיימות מוניות מקומיות מצומצמות בהיצע - מומלץ לתאם מראש בעונת השיא.'
            ]
        },
        fuelParking: {
            title: 'דלק וחניה',
            html: '<strong>תחנות דלק:</strong> מספר מצומצם באי - מומלץ לא להסתמך על מציאת תחנה בכל שעה, ולתדלק כשנתקלים בהזדמנות. <br>\n                    <strong>חניה:</strong> לא פורמלית ברוב הכפרים - בעונת השיא מרכז גאיוס יכול להיות צפוף.'
        },
        tolls: {
            title: 'כבישי אגרה (Tolls)',
            html: 'ברחבי פאקסוס <strong class="gt-text-accent underline">אין כלל</strong> כבישי אגרה - כמו בכל האיים היווניים הקטנים.'
        },
        drivingFromBase: {
            title: 'נהיגה מגאיוס - הבסיס הטבעי שלכם',
            items: [
                '<strong>ללוגוס:</strong> כ-10 דקות נסיעה (כ-5 ק"מ).',
                '<strong>ללאקה:</strong> כ-18 דקות נסיעה (כ-11 ק"מ).',
                '<strong>לאנטיפאקסוס:</strong> נגיש רק בסירה, לא ברכב - כ-20-30 דקות שייט מגאיוס.',
                '<strong>חניה:</strong> ⚠️ מרכז גאיוס מתמלא בעונת השיא - כדאי להיערך לחניה מעט הרחק מהמרכז.'
            ]
        },
        ferriesSummary: {
            title: 'מעבורות (פרומים)',
            html: '<strong>לקורפו:</strong> החיבור העיקרי של האי, מספר פעמים ביום בעונת הקיץ. <br>\n                    <strong>ליבשת יוון:</strong> קווים עונתיים מוגבלים (איגומניצה/פארגה), בעיקר בקיץ.'
        },
        roadSafetyHeadingTitle: 'טיפי נהיגה ובטיחות בכבישי פאקסוס (חשוב לקרוא!)',
        driveTimeFootnotes: {
            planningTip: 'פאקסוס קטנה מספיק (כ-11 ק"מ אורך) שאין בה "אזורים מרוחקים" באמת - הטבלה למעלה מכסה את שלושת הכפרים העיקריים בלבד.',
            shapeTip: '💡 <strong>טיפ תכנון:</strong> בניגוד לקורפו הגדולה, בפאקסוס אין צורך לתכנן ימים לפי אזור גיאוגרפי - כל האי נגיש בנסיעה של פחות מ-20 דקות מכל נקודה לכל נקודה.',
            baseAdjustmentNote: '🏨 <strong>הטבלה הזו מחושבת מגאיוס</strong>, הבירה הקטנה והנמל הראשי - נקודת המוצא הטבעית ביותר לכל ביקור באי.'
        }
    },
    ferriesDetailed: {
        title: '⛴️ מעבורות מפאקסוס: לקורפו, ליבשת ולאנטיפאקסוס',
        routes: [
            {
                title: '🇬🇷 לקורפו',
                description: 'החיבור העיקרי והתדיר ביותר של האי - מעבורות וקטמרנים מנמל גאיוס לעיר קורפו, כשעה עד שעה ורבע שייט, מספר פעמים ביום בעונת הקיץ.'
            },
            {
                title: '🇬🇷 ליבשת יוון (איגומניצה / פארגה)',
                description: 'קווים עונתיים מוגבלים, בעיקר בקיץ, מחברים ישירות ליבשת מבלי לעבור דרך קורפו - שימושי בעיקר למגיעים/יוצאים דרך היבשת.'
            },
            {
                title: '🏝️ לאנטיפאקסוס',
                description: 'לא מעבורת רגילה אלא טקסי-ים וסיורי שייט קצרים ותכופים בעונה, מגאיוס ומלאקה - הדרך היחידה להגיע לחופי וטומי וורייקה.'
            }
        ],
        disclaimer: '⚠️ <strong>חשוב:</strong> כמו בכל האיים היווניים הקטנים, לוחות זמנים ותדירויות משתנים לפי עונה ומזג אוויר ומתעדכנים בתדירות. יש לאמת ולהזמין מראש, במיוחד בשיא הקיץ.'
    }
};
