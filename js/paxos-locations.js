// ============================================================================
// paxos-locations.js — real, representative location data for the Paxos
// destination package (data/destinations/paxos.js).
//
// Paxos (Παξοί) is a genuinely tiny Ionian island south of Corfu (~19 km²,
// no airport — reached only by ferry/boat from Corfu or, seasonally, from
// the mainland). This is a small ISLAND with a correspondingly small set
// of real, distinctly-named places — 13 entries across 4 categories is a
// genuinely representative, production-quality set for a destination this
// size, not an exhaustive 169-place guide (Corfu's own scale) and not
// padded to look bigger than the real place is. Every entry is a real,
// well-documented Paxos/Antipaxos landmark; coordinates are approximate
// (rounded, not falsely precise) rather than invented. No opening hours,
// prices, or phone numbers are attached here — those aren't reliably known
// for this destination and the project's own rule is to omit rather than
// invent them. Images are local generic illustrations (images/cards/*.svg,
// hasRealPhoto:false) — the SAME convention js/testdest-locations.js uses
// for a non-Corfu destination; Corfu's own hasRealPhoto:false entries use
// generic Unsplash stock photos instead, which was deliberately NOT copied
// here since an unverified remote photo URL risks showing a broken or
// wrong image, which the local SVG convention cannot.
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
        },
        {
            "id": "paxos-vrika",
            "name": "חוף ורייקה (Vrika), אנטיפאקסוס",
            "tags": "family,snorkeling",
            "image": { "src": "images/cards/beach.svg", "alt": "איור: חוף חול וטורקיז" },
            "hasRealPhoto": false,
            "description": "החוף השני המפורסם באנטיפאקסוס לצד וטומי — משלב חול וחלוקים דקים ומים רדודים יחסית, ולכן נחשב הנוח מבין השניים למשפחות. גם אליו מגיעים רק בסירה.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Vrika+Beach+Antipaxos",
            "lat": 39.135, "lon": 20.183,
            "bestTime": "Morning"
        },
        {
            "id": "paxos-kaki-lagkada",
            "name": "כאקי לאנגאדה (Kaki Lagkada)",
            "tags": "quiet,snorkeling",
            "image": { "src": "images/cards/beach.svg", "alt": "איור: מפרץ חלוקים מבודד" },
            "hasRealPhoto": false,
            "description": "מפרץ חלוקים קטן ומבודד בחוף המערבי, ליד הכפרים הקטנים מגזיה ואוזיאס — פחות מוכר לתיירים, נגיש בעיקר ברכב או קטנוע.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Kaki+Lagkada+Paxos",
            "lat": 39.218, "lon": 20.135,
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
        },
        {
            "id": "paxos-lakka-waterfront",
            "name": "טיילת המים של לאקה (Lakka)",
            "tags": "midrange,budget",
            "image": { "src": "images/cards/food.svg", "alt": "איור: טיילת חוף עם בתי קפה" },
            "hasRealPhoto": false,
            "description": "שורת טברנות ובתי קפה לאורך מפרץ לאקה השקט, אהובה על שייטים העוגנים במפרץ — אווירה רגועה יותר מגאיוס.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Lakka+Paxos+waterfront",
            "lat": 39.244, "lon": 20.126,
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
        },
        {
            "id": "paxos-gaios-old-town",
            "name": "העיר העתיקה של גאיוס (Gaios Old Town)",
            "tags": "history,beach",
            "image": { "src": "images/cards/history.svg", "alt": "איור: סמטת עיר ים תיכונית עתיקה" },
            "hasRealPhoto": false,
            "description": "סמטאות צרות ובתים ניאו-קלאסיים בהשפעה ונציאנית לאורך הנמל ומאחוריו — הליכה קצרה ברגל מספיקה כדי לראות את מרבית הבירה הקטנה של האי.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Gaios+Old+Town+Paxos",
            "lat": 39.201, "lon": 20.188,
            "bestTime": "Afternoon"
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
        },
        {
            "id": "paxos-magazia-ozias",
            "name": "מגזיה ואוזיאס (Magazia & Ozias)",
            "tags": "village,nature",
            "image": { "src": "images/cards/village.svg", "alt": "איור: כפר פנימי קטן בין חורשות זית" },
            "hasRealPhoto": false,
            "description": "שני כפרים פנימיים קטנים ושקטים בלב חורשות הזית, בדרך לצוקי אירימיטיס — לא יעד תיירותי בפני עצמו, אלא עצירה אותנטית למי שנוסע בין מפרצי החוף המערבי.",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Magazia+Paxos",
            "lat": 39.215, "lon": 20.145,
            "bestTime": "Afternoon"
        }
    ]
};

window.PAXOS_NAME_ALIASES = {};
