// ============================================================================
// data/destinations/corfu.js — Corfu destination package.
//
// This is a thin envelope, not a copy: the two big data files
// (js/locations-data.js, 374KB / 169 places, and js/itinerary-data.js,
// 113KB / 9 days) stay exactly where they are and keep their exact shape -
// window.CORFU_LOCATIONS / window.CORFU_NAME_ALIASES / window.ITINERARY_DAYS
// - so nothing here risks transcribing or losing real content. This file
// only adds the destination-identity metadata and the handful of small
// constants (map center, category taxonomy, solar coordinates, distance-tool
// data, packing defaults, trip window) that used to be hardcoded directly
// inside js/map.js, js/explore.js, js/solar.js, js/tools.js, js/packing.js
// and js/dashboard.js.
//
// Must load AFTER js/locations-data.js and js/itinerary-data.js, and BEFORE
// js/destination-registry.js. See index.html's script-order comment.
// ============================================================================

window.DESTINATIONS = window.DESTINATIONS || {};

window.DESTINATIONS.corfu = {
    id: 'corfu',
    name: 'קורפו',
    nameEn: 'Corfu',
    country: 'יוון',
    countryEn: 'Greece',
    countryCode: 'GR',
    region: 'האיים היוניים',

    locale: { lang: 'he', dir: 'rtl' },
    timezone: 'Europe/Athens',
    phoneCountryCode: '+30',

    hero: {
        image: null,
        title: 'קורפו 2026: מדריך הטיולים השלם',
        subtitle: 'מדריך קורפו 2026: 28 חופים, 69 מסעדות, מסלולי טיול שעתיים מפורטים, ו-34 פנינים נסתרות.'
    },

    // Map center/bounds/home-base — previously GT_CORFU_CENTER,
    // GT_CORFU_BOUNDS_LATLNG and the hardcoded [39.6500, 19.8520] hotel-pin
    // coordinate in js/map.js. homeBase is a destination-level default
    // anchor point (used for the hotel pin + "distance from hotel"
    // calculations); the traveler's actual hotel NAME still comes from the
    // gitignored js/trip-private.js (window.TRIP_PRIVATE), unrelated to
    // destination data.
    map: {
        center: [39.62, 19.85],
        bounds: [[39.20, 19.30], [39.95, 20.40]],
        defaultZoom: 10,
        minZoom: 9,
        homeBase: { name: 'Gouvia', lat: 39.6500, lon: 19.8520, mapsQuery: 'Gouvia Corfu' }
    },

    // Category taxonomy — previously hardcoded as the literal array
    // ['beaches','food','attractions','gems'] in ~8 places across js/map.js
    // and js/explore.js, plus GT_MAP_CATEGORY_META's per-key emoji/label and
    // EXPLORE_FACETS' per-key secondary filter chips. colorVar is a generic
    // positional CSS custom property (--gt-cat-1..4 in css/design-system.css)
    // so up to 4 categories need zero CSS edits; a 5th+ needs one new rule.
    categories: [
        {
            key: 'beaches', tag: 'beach', label: 'חוף', emoji: '🏖️', colorVar: '--gt-cat-1',
            iconSvg: '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 18 0Z"/><path d="M12 12v7a2 2 0 0 1-2 2"/><path d="M12 3v2"/></svg>',
            facets: [
                { tag: 'family', label: 'משפחתי' },
                { tag: 'romantic', label: 'רומנטי' },
                { tag: 'quiet', label: 'שקט' },
                { tag: 'snorkeling', label: 'שנרקול' }
            ]
        },
        {
            key: 'food', tag: 'food', label: 'מסעדה', emoji: '🍽️', colorVar: '--gt-cat-2',
            iconSvg: '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v6a1.5 1.5 0 0 0 3 0V3M8.5 9V21"/><path d="M16.5 3c-1.4 0-2.5 1.8-2.5 4.5S15.1 12 16.5 12V21"/></svg>',
            facets: [
                { tag: 'budget', label: '€' },
                { tag: 'midrange', label: '€€' },
                { tag: 'upscale', label: '€€€' }
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
                { tag: 'food', label: 'אוכל' },
                { tag: 'village', label: 'כפר' },
                { tag: 'nature', label: 'טבע' },
                { tag: 'beach', label: 'חוף' }
            ]
        }
    ],

    // References, not copies — see the file header.
    locations: window.CORFU_LOCATIONS,
    nameAliases: window.CORFU_NAME_ALIASES,
    itineraryDays: window.ITINERARY_DAYS,

    // Previously js/dashboard.js's TRIP_CONFIG — the single source of truth
    // for every trip date/time shown anywhere on the page.
    tripConfig: {
        outboundDeparture: new Date('2026-09-02T15:40:00+03:00'),
        outboundArrival:   new Date('2026-09-02T18:15:00+03:00'),
        returnDeparture:   new Date('2026-09-08T13:10:00+03:00'),
        returnArrival:     new Date('2026-09-08T15:35:00+03:00'),
        startDay: new Date('2026-09-02T00:00:00+03:00'),
        endDay:   new Date('2026-09-08T23:59:59+03:00'),
        totalDays: 7,
        fromAirport: 'TLV',
        toAirport: 'CFU'
    },

    // Previously js/solar.js's SOLAR_CORFU.
    solar: { lat: 39.6243, lon: 19.9217, name: 'קורפו' },

    // Previously js/tools.js's DISTANCE_LOCATIONS / ROAD_DISTANCES / the
    // 1.45 windiness correction and 32km/h average-speed fallback constants.
    distanceTool: {
        locations: [
            { name: 'העיר העתיקה קורפו (Corfu Town)', key: 'corfu-town', lat: 39.6243, lon: 19.9217 },
            { name: 'פלקאס (Pelekas)', key: 'pelekas', lat: 39.6000, lon: 19.8170 },
            { name: 'אגיוס גורדיוס (Agios Gordios)', key: 'agios-gordios', lat: 39.5470, lon: 19.8530 },
            { name: 'ארמונס (Ermones)', key: 'ermones', lat: 39.6105, lon: 19.7801 },
            { name: 'גליפאדה (Glyfada)', key: 'glyfada', lat: 39.5937, lon: 19.8080 },
            { name: 'פלאוקסטריצה (Paleokastritsa)', key: 'paleokastritsa', lat: 39.6726, lon: 19.7011 },
            { name: 'סידארי (Sidari)', key: 'sidari', lat: 39.7915, lon: 19.7042 },
            { name: 'רודה (Roda)', key: 'roda', lat: 39.7790, lon: 19.7930 },
            { name: 'אכרווי (Acharavi)', key: 'acharavi', lat: 39.7830, lon: 19.8170 },
            { name: 'קאסיופי (Kassiopi)', key: 'kassiopi', lat: 39.7946, lon: 19.9213 },
            { name: 'ברבטי (Barbati)', key: 'barbati', lat: 39.7214, lon: 19.8665 },
            { name: 'ניסאקי (Nissaki)', key: 'nissaki', lat: 39.7258, lon: 19.8974 },
            { name: 'גוביה (Gouvia) - מקום הלינה שלכם', key: 'gouvia', lat: 39.6500, lon: 19.8520 },
            { name: 'דאסיה (Dassia)', key: 'dassia', lat: 39.6800, lon: 19.8398 },
            { name: 'איפסוס (Ipsos)', key: 'ipsos', lat: 39.6995, lon: 19.8395 },
            { name: 'בניצס (Benitses)', key: 'benitses', lat: 39.5433, lon: 19.9139 },
            { name: 'מוראיטיקה / מסונגי (Moraitika)', key: 'moraitika', lat: 39.5200, lon: 19.9000 },
            { name: 'קאבוס (Kavos)', key: 'kavos', lat: 39.3860, lon: 20.1130 }
        ],
        roadDistances: {
            'corfu-town|pelekas': { km: 13, min: 20 },
            'agios-gordios|corfu-town': { km: 18, min: 35 },
            'barbati|corfu-town': { km: 20, min: 30 },
            'corfu-town|nissaki': { km: 22, min: 35 },
            'corfu-town|paleokastritsa': { km: 25, min: 38 },
            'corfu-town|roda': { km: 36, min: 50 },
            'corfu-town|sidari': { km: 37, min: 50 },
            'corfu-town|kassiopi': { km: 35, min: 55 },
            'acharavi|corfu-town': { km: 44, min: 60 },
            'corfu-town|kavos': { km: 46, min: 67 },
            'barbati|gouvia': { km: 11, min: 18 },
            'gouvia|nissaki': { km: 13, min: 23 },
            'gouvia|kassiopi': { km: 26, min: 43 },
            'gouvia|roda': { km: 27, min: 38 },
            'gouvia|sidari': { km: 28, min: 38 },
            'acharavi|gouvia': { km: 35, min: 48 },
            'gouvia|pelekas': { km: 22, min: 32 },
            'agios-gordios|gouvia': { km: 27, min: 47 },
            'gouvia|paleokastritsa': { km: 34, min: 50 },
            'gouvia|kavos': { km: 55, min: 79 }
        },
        windinessFactor: 1.45,
        avgSpeedKmh: 32
    },

    // Previously js/packing.js's PACKING_ITEMS.
    packingDefaults: {
        pretrip: [
            { id: 'pre-passport', label: 'דרכונים בתוקף' },
            { id: 'pre-boarding', label: 'כרטיסי טיסה / צ\'ק-אין דיגיטלי' },
            { id: 'pre-license', label: 'רישיון נהיגה בינלאומי' },
            { id: 'pre-bookings', label: 'אישורי הזמנה (מלון, רכב, טיסות)' },
            { id: 'pre-insurance', label: 'ביטוח נסיעות' },
            { id: 'pre-money', label: 'כרטיסי אשראי + מזומן ביורו' },
            { id: 'pre-chargers', label: 'מטענים וכבלים' },
            { id: 'pre-adapter', label: 'מתאם חשמל אירופאי (תקע C/F)' },
            { id: 'pre-meds', label: 'תרופות קבועות + תיק עזרה ראשונה' },
            { id: 'pre-sunscreen', label: 'קרם הגנה SPF גבוה' },
            { id: 'pre-swimwear', label: 'בגדי ים ומגבות חוף' },
            { id: 'pre-shoes', label: 'נעליים נוחות להליכה + נעלי מים' }
        ],
        beach: [
            { id: 'beach-towel', label: 'מגבת חוף' },
            { id: 'beach-sunscreen', label: 'קרם הגנה' },
            { id: 'beach-water', label: 'בקבוקי מים' },
            { id: 'beach-hat', label: 'כובע / מצחייה' },
            { id: 'beach-sunglasses', label: 'משקפי שמש' },
            { id: 'beach-snorkel', label: 'משקפת שנירקול' },
            { id: 'beach-cash', label: 'כסף מזומן קטן' },
            { id: 'beach-powerbank', label: 'טלפון + סוללה ניידת' },
            { id: 'beach-keys', label: 'מפתחות רכב (בשקית עמידה למים)' }
        ]
    },

    // Phase 2 slot: the About / Trip Planning / Health & Safety / Language /
    // Activities / FAQ tabs stay Corfu-only static HTML in index.html for
    // Phase 1 (see _audit/ for the Phase 2 migration plan). This object
    // exists now so Phase 2 has a shape to land in without another
    // architectural pass — left null on purpose, unused by any renderer yet.
    editorial: {
        about: null,
        tripPlanning: null,
        healthSafety: null,
        language: null,
        activities: null,
        faq: null
    }
};
