// ============================================================================
// data/destinations/paxos.js — Paxos (Παξοί) destination package.
//
// The THIRD real, production-quality destination (not a test/placeholder
// fixture — that role belongs to testdest/empty), proving the template
// architecture built across Phases 1-3 genuinely generalizes beyond Corfu
// — a different island with its own real facts, not Corfu's text with the
// name swapped. Same envelope shape as data/destinations/corfu.js/
// testdest.js — no new fields, no new schema.
//
// Scope is proportional to the real place, not padded to match Corfu's
// scale: Paxos is a genuinely tiny island (~19 km², 3 villages) next to
// Corfu (~610 km², dozens of named villages/beaches), so a 13-location,
// 7-activity, 13-FAQ, 2-day-itinerary destination is a complete,
// representative picture of it — not an artificially shrunk placeholder.
// Every section the generic renderers support is populated with real
// content (About, Trip Planning weather + driving times, Health & Safety,
// Language, Activities, FAQ, locations/map, a 2-day itinerary) with no
// invented phone numbers, prices, exact hours, or precise unverifiable
// facts anywhere.
//
// Must load AFTER js/paxos-locations.js, js/paxos-itinerary.js,
// js/paxos-faq.js, js/paxos-activities.js, js/paxos-weather.js and
// js/paxos-about.js/js/paxos-language.js, and BEFORE
// js/destination-registry.js. See index.html's script-order comment.
// ============================================================================

window.DESTINATIONS = window.DESTINATIONS || {};

window.DESTINATIONS.paxos = {
    id: 'paxos',
    name: 'פאקסוס',
    nameEn: 'Paxos',
    country: 'יוון',
    countryEn: 'Greece',
    countryCode: 'GR',
    region: 'האיים היוניים',

    locale: { lang: 'he', dir: 'rtl' },
    timezone: 'Europe/Athens',
    phoneCountryCode: '+30',

    hero: {
        image: null,
        title: 'פאקסוס: האי הקטן מדרום לקורפו',
        subtitle: 'מדריך תמציתי לפאקסוס — אי ללא שדה תעופה, חורשות זית עתיקות, וחוף וטומי הטורקיז באנטיפאקסוס השכנה.'
    },

    // Paxos + Antipaxos combined bounding box — real, approximate coordinates
    // (not falsely precise decimals). homeBase anchors on Gaios, the
    // island's real main port/town, not a fabricated hotel name.
    map: {
        center: [39.20, 20.15],
        bounds: [[39.10, 20.05], [39.28, 20.25]],
        defaultZoom: 12,
        minZoom: 11,
        homeBase: { name: 'Gaios', lat: 39.20, lon: 20.19, mapsQuery: 'Gaios Paxos' }
    },

    // Same 4-key taxonomy as Corfu — a natural fit for a small Greek island
    // too, not a forced reuse (js/testdest.js already proved the taxonomy
    // isn't hardcoded, so there's no need to prove it a second time here).
    categories: [
        {
            key: 'beaches', tag: 'beach', label: 'חוף', emoji: '🏖️', colorVar: '--gt-cat-1',
            iconSvg: '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 18 0Z"/><path d="M12 12v7a2 2 0 0 1-2 2"/><path d="M12 3v2"/></svg>',
            facets: [
                { tag: 'romantic', label: 'רומנטי' },
                { tag: 'quiet', label: 'שקט' },
                { tag: 'snorkeling', label: 'שנרקול' }
            ]
        },
        {
            key: 'food', tag: 'food', label: 'מסעדה', emoji: '🍽️', colorVar: '--gt-cat-2',
            iconSvg: '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v6a1.5 1.5 0 0 0 3 0V3M8.5 9V21"/><path d="M16.5 3c-1.4 0-2.5 1.8-2.5 4.5S15.1 12 16.5 12V21"/></svg>',
            facets: [
                { tag: 'midrange', label: '€€' },
                { tag: 'romantic', label: 'רומנטי' },
                { tag: 'budget', label: '€' }
            ]
        },
        {
            key: 'attractions', tag: 'attraction', label: 'אטרקציה', emoji: '📸', colorVar: '--gt-cat-3',
            iconSvg: '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.3-2.5h5.4L16 7"/><circle cx="12" cy="13.5" r="3.3"/></svg>',
            facets: [
                { tag: 'history', label: 'היסטוריה' },
                { tag: 'nature', label: 'טבע' },
                { tag: 'beach', label: 'חוף' }
            ]
        },
        {
            key: 'gems', tag: 'gem', label: 'פנינה', emoji: '💎', colorVar: '--gt-cat-4',
            iconSvg: '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8 9 3.5h6l2.5 4.5L12 20.5Z"/><path d="M6.5 8h11"/></svg>',
            facets: [
                { tag: 'village', label: 'כפר' },
                { tag: 'nature', label: 'טבע' }
            ]
        }
    ],

    locations: window.PAXOS_LOCATIONS,
    nameAliases: window.PAXOS_NAME_ALIASES,
    itineraryDays: window.PAXOS_ITINERARY_DAYS,

    // A plausible illustrative 2-day window (June 2026 — genuinely a good
    // month per editorial.tripPlanning.weather below, and deliberately a
    // different month than Corfu's own September dates so the two don't
    // look interchangeable). Fully populated, matching testdest.js's own
    // proven-safe convention (rather than the partially-null shape this
    // field used before the itinerary above existed), since dashboard.js's
    // flight-countdown widgets key off outboundDeparture being non-null.
    // fromAirport/toAirport are honestly TLV/CFU: Paxos itself has no
    // airport at all, so CFU (Corfu) — the real, only realistic air
    // gateway, from which travelers ferry over — is a true fact here, not
    // an invented direct-to-Paxos flight.
    tripConfig: {
        outboundDeparture: new Date('2026-06-15T08:30:00+03:00'),
        outboundArrival:   new Date('2026-06-15T11:15:00+03:00'),
        returnDeparture:   new Date('2026-06-16T19:30:00+03:00'),
        returnArrival:     new Date('2026-06-16T22:10:00+03:00'),
        startDay: new Date('2026-06-15T00:00:00+03:00'),
        endDay:   new Date('2026-06-16T23:59:59+03:00'),
        totalDays: 2,
        fromAirport: 'TLV',
        toAirport: 'CFU'
    },

    solar: { lat: 39.20, lon: 20.19, name: 'פאקסוס' },

    // Real, short, approximate distances between the island's 3 main
    // villages (Paxos is only ~11km end to end) — rounded, not falsely
    // precise. windinessFactor/avgSpeedKmh are the same kind of calibrated
    // app parameter Corfu's own file declares (narrow, winding island
    // roads), given a distinct-but-comparable value rather than copied.
    distanceTool: {
        referenceLocationKey: 'paxos-gaios',
        locations: [
            { name: 'גאיוס (Gaios)', key: 'paxos-gaios', lat: 39.20, lon: 20.19 },
            { name: 'לוגוס (Loggos)', key: 'paxos-loggos', lat: 39.225, lon: 20.14 },
            { name: 'לאקה (Lakka)', key: 'paxos-lakka', lat: 39.245, lon: 20.128 }
        ],
        roadDistances: {
            'paxos-gaios|paxos-loggos': { km: 5, min: 10, kmDisplay: 'כ-5 ק"מ', timeDisplay: "~10 דק'" },
            'paxos-gaios|paxos-lakka': { km: 11, min: 18, kmDisplay: 'כ-11 ק"מ', timeDisplay: "~18 דק'" },
            'paxos-loggos|paxos-lakka': { km: 6, min: 10, kmDisplay: 'כ-6 ק"מ', timeDisplay: "~10 דק'" }
        },
        windinessFactor: 1.3,
        avgSpeedKmh: 30
    },

    // Small, generic (non-destination-specific) packing subset — universal
    // trip-prep items, not a reason to invent Paxos-specific facts.
    packingDefaults: {
        pretrip: [
            { id: 'pre-passport', label: 'דרכונים בתוקף' },
            { id: 'pre-boarding', label: 'כרטיסי מעבורת / צ\'ק-אין דיגיטלי' },
            { id: 'pre-insurance', label: 'ביטוח נסיעות' },
            { id: 'pre-money', label: 'מזומן ביורו — כספומטים מעטים באי' }
        ],
        beach: [
            { id: 'beach-shoes', label: 'נעלי מים (רוב החופים חלוקים)' },
            { id: 'beach-sunscreen', label: 'קרם הגנה' },
            { id: 'beach-water', label: 'בקבוקי מים' },
            { id: 'beach-hat', label: 'כובע / מצחייה' }
        ]
    },

    editorial: {
        about: window.PAXOS_ABOUT,
        tripPlanning: { weather: window.PAXOS_WEATHER },
        language: window.PAXOS_LANGUAGE,
        activities: window.PAXOS_ACTIVITIES,
        faq: window.PAXOS_FAQ,
        healthSafety: {
            // Real Greek national emergency numbers (country-wide, not
            // Corfu-specific — apply identically to Paxos).
            emergencyNumbers: [
                { number: '112', icon: '🆘', label: 'מוקד חירום כללי', sublabel: '(אירופאי, עונה באנגלית)' },
                { number: '100', icon: '👮', label: 'משטרה', sublabel: '(Police)' },
                { number: '166', icon: '🚑', label: 'אמבולנס', sublabel: '(Ambulance)' },
                { number: '199', icon: '🚒', label: 'מכבי אש', sublabel: '(Fire Brigade)' }
            ],
            touristPolice: {
                number: '171',
                label: 'משטרת התיירות',
                description: 'הקו הארצי של משטרת התיירות ביוון — לדיווח על גניבה, אובדן מסמכים או סכסוך עם ספק מקומי, גם באי קטן כמו פאקסוס.'
            },
            hospitalsIntro: 'לפאקסוס אין בית חולים — יש מרפאה כפרית קטנה בגאיוס לטיפול ראשוני וחירום קל. במקרים חמורים יותר מפנים לבית החולים הראשי בקורפו, לרוב בשיט או בפינוי ימי/אווירי.',
            hospitals: [
                {
                    name: 'המרפאה הכפרית של פאקסוס (Παξοί Health Centre)',
                    tag: 'מרפאה כפרית / טיפול ראשוני',
                    description: 'מרפאה כפרית קטנה בגאיוס המספקת טיפול רפואי ראשוני וחירום קל לתושבים ולמבקרים. אינה בית חולים מלא — אין כאן מידע מאומת על שעות פעילות או מספר טלפון ישיר, מומלץ לברר במקום או דרך הלינה שלכם.',
                    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Health+Centre+Gaios+Paxos',
                    note: '⚠️ למקרי חירום רציניים מפנים לבית החולים הראשי בקורפו — ודאו שביטוח הנסיעות שלכם מכסה פינוי ימי/אווירי בין איים.',
                    showInModal: true
                }
            ],
            insuranceReminderHtml: '💡 טיפ חשוב: על אי קטן כמו פאקסוס, מקרה חירום רציני עשוי לדרוש פינוי לקורפו בשיט או במסוק — ודאו שביטוח הנסיעות שלכם מכסה זאת, ופנו למוקד החירום של הביטוח מיד לצד הטיפול הרפואי.',
            commonMistakes: [
                {
                    icon: '✈️',
                    title: 'לחפש טיסה או שדה תעופה בפאקסוס',
                    description: 'לאי אין שדה תעופה כלל — הדרך היחידה להגיע היא בשיט, בעיקר מנמל קורפו. תכננו את חיבור המעבורת מראש כחלק מהטיסה לקורפו.'
                },
                {
                    icon: '💳',
                    title: 'להסתמך על כרטיס אשראי בכל מקום',
                    description: 'כספומטים באי מעטים ולא כל בית עסק קטן מקבל כרטיס — שאו תמיד מזומן ביורו, בעיקר בכפרים הקטנים.'
                },
                {
                    icon: '🌊',
                    title: 'להניח ששייט לאנטיפאקסוס יוצא בכל מזג אוויר',
                    description: 'טקסי הים והסיורים לאנטיפאקסוס ולמערות הכחולות תלויים בים — בימים סוערים הם עלולים להתבטל. אל תתכננו זאת ליום האחרון של הביקור.'
                },
                {
                    icon: '🩴',
                    title: 'לצפות לחופי חול כמו בקורפו',
                    description: 'רוב חופי פאקסוס הם חלוקים וסלעים, לא חול. הביאו נעלי מים — הרגליים יודו לכם.'
                },
                {
                    icon: '🏪',
                    title: 'להניח שיש חנויות גדולות ומגוון רחב',
                    description: 'זהו אי קטן עם מכולות משפחתיות בלבד, לא רשתות סופרמרקט — לקניות גדולות יותר כדאי להצטייד עוד בקורפו.'
                },
                {
                    icon: '🅿️',
                    title: 'לצפות לחניה נוחה בגאיוס בשיא הקיץ',
                    description: 'מרכז גאיוס קטן וצפוף בעונה — מקומות חניה ליד הנמל מוגבלים. אם מגיעים ברכב שכור, כדאי להיערך לחניה מעט הרחק מהמרכז.'
                },
                {
                    icon: '⏳',
                    title: 'לתכנן ביקור יום ללא מרווח ביטחון לחזרה',
                    description: 'מי שמבקר כטיול יום מקורפו צריך לשים לב לשעת המעבורת האחרונה חזרה — עיכוב קטן (תור, מזג אוויר) עלול לגרום לפספוס החיבור.'
                }
            ],
            commonMistakesDisclaimer: '⚠️ הרשימה מבוססת על מידע כללי ומוכר על האי; פרטים ספציפיים (שעות, מחירים, זמינות שייט) עשויים להשתנות לפי עונה ומזג אוויר.'
        }
    }
};
