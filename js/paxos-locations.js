// ============================================================================
// paxos-locations.js — real, representative location data for the Paxos
// destination package (data/destinations/paxos.js).
//
// Paxos (Παξοί) is a genuinely tiny Ionian island south of Corfu (~19 km²,
// no airport — reached only by ferry/boat from Corfu or, seasonally, from
// the mainland) — this is deliberately a SMALL, representative set (2 per
// category, matching the project's own convention for a non-flagship
// destination — see js/testdest-locations.js), not an exhaustive guide.
// Every place listed is a real, well-documented Paxos/Antipaxos landmark;
// coordinates are approximate (rounded, not falsely precise) rather than
// invented. No opening hours, prices, or phone numbers are attached here —
// those aren't reliably known for this destination and the project's own
// rule is to omit rather than invent them.
// ============================================================================

window.PAXOS_LOCATIONS = {
    "beaches": [
        {
            "id": "paxos-voutoumi",
            "name": "חוף וטומי (Voutoumi), אנטיפאקסוס",
            "tags": "romantic,snorkeling",
            "image": { "src": "images/cards/beach.svg", "alt": "איור: חוף בגוון טורקיז" },
            "hasRealPhoto": false,
            "description": "אחד החופים המצולמים ביותר באיים היוניים — מים בגוון טורקיז עז על רקע צוקי אבן לבנים. נמצא באי הקטן אנטיפאקסוס, דרומית לפאקסוס, ומגיעים אליו רק בסירה (טקסי ים או שייט יומי מגאיוס/לאקה).",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Voutoumi+Beach+Antipaxos",
            "lat": 39.13, "lon": 20.18,
            "bestTime": "Morning"
        },
        {
            "id": "paxos-monodendri",
            "name": "מפרץ מונודנדרי (Monodendri)",
            "tags": "quiet,snorkeling",
            "image": { "src": "images/cards/beach.svg", "alt": "איור: מפרץ חלוקים שקט" },
            "hasRealPhoto": false,
            "description": "מפרץ חלוקים קטן ושקט ליד לאקה, בצד המערבי של פאקסוס עצמו — בניגוד לחופי אנטיפאקסוס, כאן לרוב שקט יותר ואין צורך בסירה.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Monodendri+Bay+Paxos",
            "lat": 39.23, "lon": 20.11,
            "bestTime": "Afternoon"
        }
    ],
    "food": [
        {
            "id": "paxos-gaios-harbor",
            "name": "טברנות נמל גאיוס (Gaios Harbor)",
            "tags": "midrange,romantic",
            "image": { "src": "images/cards/food.svg", "alt": "איור: טברנה על חוף הים" },
            "hasRealPhoto": false,
            "description": "שדרת הטברנות והבתים הניאו-קלאסיים לאורך נמל גאיוס, מול האי הקטן פאנאיה — המקום המרכזי לארוחת ערב על החוף בפאקסוס.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Gaios+Harbor+Paxos",
            "lat": 39.20, "lon": 20.19,
            "bestTime": "Evening"
        },
        {
            "id": "paxos-loggos-waterfront",
            "name": "חזית המים של לוגוס (Loggos)",
            "tags": "romantic,budget",
            "image": { "src": "images/cards/food.svg", "alt": "איור: כפר דייגים ציורי" },
            "hasRealPhoto": false,
            "description": "כפר הדייגים הקטן והציורי ביותר באי, עם שורת בתי טברנה צבעוניים ממש על המים — פחות תיירותי מגאיוס.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Loggos+Paxos",
            "lat": 39.225, "lon": 20.14,
            "bestTime": "Evening"
        }
    ],
    "attractions": [
        {
            "id": "paxos-panagia-island",
            "name": "אי פאנאיה (Panagia Island)",
            "tags": "history,nature",
            "image": { "src": "images/cards/history.svg", "alt": "איור: אי קטן עם מנזר" },
            "hasRealPhoto": false,
            "description": "איון קטן בכניסה לנמל גאיוס, עם מנזר קטן — אחד המראות המזוהים ביותר עם פאקסוס, נראה מכל שדרת הטברנות בנמל.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Panagia+Island+Gaios+Paxos",
            "lat": 39.198, "lon": 20.19,
            "bestTime": "Afternoon"
        },
        {
            "id": "paxos-blue-caves",
            "name": "המערות הכחולות (Blue Caves), חוף מערבי",
            "tags": "nature,beach",
            "image": { "src": "images/cards/nature.svg", "alt": "איור: מערת ים כחולה" },
            "hasRealPhoto": false,
            "description": "שרשרת מערות ים וקשתות סלע בחוף המערבי הפרוע של פאקסוס, המוארות במים כחולים עזים — מבוקרות בעיקר בסיורי סירה מאורגנים.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Blue+Caves+Paxos",
            "lat": 39.21, "lon": 20.10,
            "bestTime": "Morning"
        }
    ],
    "gems": [
        {
            "id": "paxos-erimitis",
            "name": "צוקי אירימיטיס (Erimitis)",
            "tags": "nature,village",
            "image": { "src": "images/cards/village.svg", "alt": "איור: צוקים מעל הים בשקיעה" },
            "hasRealPhoto": false,
            "description": "צוקי אבן גיר דרמטיים בחוף המערבי, ליד הכפר הקטן מגזיה — נקודת הצפייה בשקיעה האהובה על מקומיים, פחות מוכרת לתיירים.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Erimitis+Paxos",
            "lat": 39.213, "lon": 20.14,
            "bestTime": "Evening"
        },
        {
            "id": "paxos-lakka-bay",
            "name": "מפרץ לאקה (Lakka)",
            "tags": "village,beach",
            "image": { "src": "images/cards/village.svg", "alt": "איור: מפרץ עגון לכלי שיט" },
            "hasRealPhoto": false,
            "description": "מפרץ טבעי כמעט סגור בקצה הצפוני של האי, אהוב במיוחד על שייטים — כפר קטן ורגוע עם חוף עירוני נוח וטיילת מים.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Lakka+Paxos",
            "lat": 39.245, "lon": 20.128,
            "bestTime": "Morning"
        }
    ]
};

window.PAXOS_NAME_ALIASES = {};
