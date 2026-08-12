// ============================================================================
// data/destinations/empty.js — "Empty Destination" package.
//
// Architectural validation only, per explicit instruction: this destination
// must carry ZERO content — no locations, no itinerary items, no packing
// list, no editorial content, no placeholder/fake travel data of any kind.
// Only structural configuration a destination is REQUIRED to declare (id,
// name, map center/bounds) is real; everything else is genuinely empty.
//
// Proves the app can render a registered destination with no content
// without silently falling back to Corfu's data anywhere — every consuming
// component must degrade generically (empty list, empty state), never by
// checking this destination's id specifically.
//
// Must load AFTER js/destination-gate-shared.js is not required — this file
// has no dependency on generated location/itinerary data files (unlike
// corfu.js/testdest.js) since it deliberately has none. Must load BEFORE
// js/destination-registry.js, same as the other destination packages.
// ============================================================================

window.DESTINATIONS = window.DESTINATIONS || {};

window.DESTINATIONS.empty = {
    id: 'empty',
    name: 'יעד ריק',
    nameEn: 'Empty Destination',
    country: '',
    countryEn: '',
    countryCode: '',
    region: '',

    locale: { lang: 'he', dir: 'rtl' },
    timezone: 'UTC',
    phoneCountryCode: '',

    hero: {
        image: null,
        title: 'יעד ריק',
        subtitle: 'יעד ללא תוכן — לבדיקת הארכיטקטורה בלבד.'
    },

    // Required structural configuration: every destination must declare a
    // map center/bounds so the map component has somewhere to point at.
    // Not a real place — a neutral coordinate, not Corfu's.
    map: {
        center: [0, 0],
        bounds: [[-85, -180], [85, 180]],
        defaultZoom: 2,
        minZoom: 1,
        homeBase: null
    },

    // No categories: there is no content to categorize.
    categories: [],

    // No content whatsoever below this point.
    locations: {},
    nameAliases: {},
    itineraryDays: [],

    tripConfig: {
        outboundDeparture: null,
        outboundArrival: null,
        returnDeparture: null,
        returnArrival: null,
        startDay: null,
        endDay: null,
        totalDays: 0,
        fromAirport: '',
        toAirport: ''
    },

    solar: { lat: 0, lon: 0, name: '' },

    distanceTool: {
        locations: [],
        roadDistances: {},
        windinessFactor: 1,
        avgSpeedKmh: 1
    },

    packingDefaults: {
        pretrip: [],
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
