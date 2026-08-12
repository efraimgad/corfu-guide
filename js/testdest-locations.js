// ============================================================================
// testdest-locations.js — placeholder location data for the "Test
// Destination" package (data/destinations/testdest.js), used ONLY to prove
// the destination-template architecture works end-to-end for a destination
// whose category taxonomy is NOT beaches/food/attractions/gems.
//
// Every name below is deliberately fictional/labelled "בדיקה" (test) or
// "TEST" so it can never be mistaken for a real place, per the project's
// rule against inventing realistic-looking destination content. Coordinates
// are real (so the map actually renders something), but the place names
// attached to them are not.
// ============================================================================

window.TESTDEST_LOCATIONS = {
    "museums": [
        {
            "id": "museum-test-1",
            "name": "מוזיאון בדיקה מס' 1 (Test Museum #1)",
            "tags": "history,quiet",
            "image": { "src": "images/cards/history.svg", "alt": "מוזיאון בדיקה" },
            "hasRealPhoto": false,
            "description": "תיאור לדוגמה של מוזיאון בדיקה — נתוני placeholder בלבד, לא מקום אמיתי.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=41.9%2C12.5",
            "lat": 41.90, "lon": 12.50,
            "bestTime": "Morning"
        },
        {
            "id": "museum-test-2",
            "name": "מוזיאון בדיקה מס' 2 (Test Museum #2)",
            "tags": "history,family",
            "image": { "src": "images/cards/history.svg", "alt": "מוזיאון בדיקה" },
            "hasRealPhoto": false,
            "description": "תיאור לדוגמה שני — נתוני placeholder בלבד.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=41.92%2C12.48",
            "lat": 41.92, "lon": 12.48,
            "bestTime": "Afternoon"
        }
    ],
    "trails": [
        {
            "id": "trail-test-1",
            "name": "שביל בדיקה מס' 1 (Test Trail #1)",
            "tags": "nature,quiet",
            "image": { "src": "images/cards/nature.svg", "alt": "שביל בדיקה" },
            "hasRealPhoto": false,
            "description": "מסלול הליכה לדוגמה — נתוני placeholder בלבד.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=41.88%2C12.52",
            "lat": 41.88, "lon": 12.52,
            "bestTime": "Early Morning"
        },
        {
            "id": "trail-test-2",
            "name": "שביל בדיקה מס' 2 (Test Trail #2)",
            "tags": "nature,family",
            "image": { "src": "images/cards/nature.svg", "alt": "שביל בדיקה" },
            "hasRealPhoto": false,
            "description": "מסלול הליכה לדוגמה שני — נתוני placeholder בלבד.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=41.95%2C12.45",
            "lat": 41.95, "lon": 12.45,
            "bestTime": "Afternoon"
        }
    ]
};

window.TESTDEST_NAME_ALIASES = {};
