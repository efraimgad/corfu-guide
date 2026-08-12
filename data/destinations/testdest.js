// ============================================================================
// data/destinations/testdest.js — "Test Destination" package.
//
// Exists ONLY to prove the destination-template architecture generalizes
// beyond Corfu: a different name/country/map region, and — deliberately —
// a DIFFERENT category taxonomy (museums/trails instead of
// beaches/food/attractions/gems), to prove categories aren't hardcoded.
// All content is fictional/placeholder per the project's rule against
// inventing realistic-looking destination content — see
// js/testdest-locations.js and js/testdest-itinerary.js headers.
//
// Must load AFTER js/testdest-locations.js and js/testdest-itinerary.js,
// and BEFORE js/destination-registry.js.
// ============================================================================

window.DESTINATIONS = window.DESTINATIONS || {};

window.DESTINATIONS.testdest = {
    id: 'testdest',
    name: 'יעד בדיקה',
    nameEn: 'Test Destination',
    country: 'ארץ הדוגמה',
    countryEn: 'Example Country',
    countryCode: 'XX',
    region: 'אזור הבדיקה',

    locale: { lang: 'he', dir: 'rtl' },
    timezone: 'Europe/Rome',
    phoneCountryCode: '+39',

    hero: {
        image: null,
        title: 'יעד בדיקה: מדריך לדוגמה',
        subtitle: 'יעד בדיקה עם 2 קטגוריות, 4 מיקומים ו-2 ימי מסלול — נתוני placeholder להוכחת הארכיטקטורה בלבד.'
    },

    map: {
        center: [41.90, 12.50],
        bounds: [[41.70, 12.20], [42.10, 12.80]],
        defaultZoom: 10,
        minZoom: 9,
        homeBase: { name: 'מלון בדיקה', lat: 41.90, lon: 12.50, mapsQuery: 'Test Destination' }
    },

    // Deliberately NOT beaches/food/attractions/gems — proves the category
    // system is data-driven, not a hardcoded 4-item enum.
    categories: [
        {
            key: 'museums', tag: 'museum', label: 'מוזיאון', emoji: '🏛️', colorVar: '--gt-cat-1',
            iconSvg: '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16M4 21h16M6 10v11M18 10v11M12 3 3 10h18Z"/></svg>',
            facets: [{ tag: 'history', label: 'היסטוריה' }, { tag: 'quiet', label: 'שקט' }]
        },
        {
            key: 'trails', tag: 'trail', label: 'שביל', emoji: '🥾', colorVar: '--gt-cat-2',
            iconSvg: '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 10 6l4 8 2-4 4 10Z"/></svg>',
            facets: [{ tag: 'nature', label: 'טבע' }, { tag: 'family', label: 'משפחתי' }]
        }
    ],

    locations: window.TESTDEST_LOCATIONS,
    nameAliases: window.TESTDEST_NAME_ALIASES,
    itineraryDays: window.TESTDEST_ITINERARY_DAYS,

    tripConfig: {
        outboundDeparture: new Date('2026-10-01T10:00:00+02:00'),
        outboundArrival:   new Date('2026-10-01T12:00:00+02:00'),
        returnDeparture:   new Date('2026-10-03T18:00:00+02:00'),
        returnArrival:     new Date('2026-10-03T20:00:00+02:00'),
        startDay: new Date('2026-10-01T00:00:00+02:00'),
        endDay:   new Date('2026-10-03T23:59:59+02:00'),
        totalDays: 2,
        fromAirport: 'XXX',
        toAirport: 'YYY'
    },

    solar: { lat: 41.90, lon: 12.50, name: 'יעד בדיקה' },

    // Deliberately sparse — proves the distance-tool UI degrades gracefully
    // when a destination hasn't supplied road-distance data yet.
    distanceTool: {
        locations: [
            { name: 'אזור בדיקה מרכזי', key: 'testdest-center', lat: 41.90, lon: 12.50 },
            { name: 'אזור בדיקה טבעי', key: 'testdest-nature', lat: 41.88, lon: 12.52 }
        ],
        roadDistances: {},
        windinessFactor: 1.2,
        avgSpeedKmh: 40
    },

    packingDefaults: {
        pretrip: [
            { id: 'pre-passport', label: 'דרכון' },
            { id: 'pre-bookings', label: 'אישורי הזמנה' }
        ],
        beach: []
    },

    editorial: {
        about: null,
        tripPlanning: null,
        healthSafety: null,
        language: null,
        activities: null,
        faq: null
    }
};
