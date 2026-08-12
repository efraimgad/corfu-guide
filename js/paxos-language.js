// ============================================================================
// paxos-language.js — real Language & Daily Life data for the Paxos
// destination package (data/destinations/paxos.js). Same shape as
// js/corfu-language.js's window.CORFU_LANGUAGE: { shoppingStreets,
// souvenirs, supermarkets, phrasebook, pronunciationTip }.
//
// Deliberately NOT "Corfu's content with the word swapped": Paxos genuinely
// has no real shopping-street/supermarket-chain scene the way Corfu Town
// does (a ~2,300-person island has small family-run grocers, not Lidl/
// Sklavenitis-style chains) — that difference is represented honestly
// rather than papered over. The phrasebook selects a different, smaller
// set of categories (including ferry/boat phrases, relevant to an
// island reachable only by sea) rather than reproducing Corfu's exact 5
// categories — the underlying Greek phrases naturally overlap with
// Corfu's own (same language, not duplicated content), which is expected
// and not a leakage concern.
// ============================================================================

window.PAXOS_LANGUAGE = {
    shoppingStreets: [
        {
            icon: '🚶',
            name: 'הסמטה מול נמל גאיוס',
            description: 'שורה קצרה של חנויות קטנות — תכשיטנות מקומית, בגדים ומוצרי זית — לאורך הנמל. בניגוד לעיר קורפו, אין כאן "רחוב קניות" ממשי, רק כמה חנויות משפחתיות.',
            mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Gaios+Harbor+Paxos'
        }
    ],
    souvenirs: [
        {
            icon: '🫒',
            title: 'שמן זית מפאקסוס',
            description: 'האי מכוסה חורשות זית עתיקות ונחשב לאחד ממרכזי שמן הזית האיכותי ביוון — שמן זית כתית מעולה מקומי הוא המזכרת המובהקת ביותר של האי.'
        },
        {
            icon: '🪵',
            title: 'מוצרי עץ זית ובישום',
            description: 'קערות, לוחות חיתוך וסבוני זית טבעיים בעבודת יד, נמכרים בחנויות הקטנות בגאיוס ולוגוס.'
        },
        {
            icon: '🍯',
            title: 'דבש מקומי',
            description: 'דבש מיערות האורנים והזית של האי, נמכר לרוב ישירות על ידי יצרנים קטנים בשווקים מקומיים.'
        }
    ],
    supermarkets: [
        {
            name: 'מכולות משפחתיות בגאיוס',
            description: 'מספר מכולות קטנות ומשפחתיות במרכז גאיוס, מספיקות לצרכים בסיסיים — אין באי רשתות סופרמרקט גדולות כמו בקורפו.'
        },
        {
            name: 'חנויות נוחות בלאקה ובלוגוס',
            description: 'מכולות קטנות יותר בכפרים הצפוניים, בעיקר למוצרים בסיסיים — למגוון רחב יותר כדאי להצטייד בגאיוס.'
        }
    ],
    phrasebook: [
        {
            icon: '👋',
            title: 'ברכות בסיסיות',
            phrases: [
                { hebrew: 'שלום / היי', greek: 'Γεια σου', transliteration: 'יאסו' },
                { hebrew: 'בוקר טוב', greek: 'Καλημέρα', transliteration: 'קליימרה' },
                { hebrew: 'תודה', greek: 'Ευχαριστώ', transliteration: 'אפחריסטו' },
                { hebrew: 'להתראות', greek: 'Αντίο', transliteration: 'אנדיו' }
            ]
        },
        {
            icon: '🍽️',
            title: 'במסעדה',
            phrases: [
                { hebrew: 'כמה זה עולה?', greek: 'Πόσο κάνει;', transliteration: 'פוסו קאני?' },
                { hebrew: 'את החשבון בבקשה', greek: 'Τον λογαριασμό παρακαλώ', transliteration: 'טון לוגריאסמו פרקלו' },
                { hebrew: 'טעים!', greek: 'Νόστιμο!', transliteration: 'נוסטימו!' }
            ]
        },
        {
            icon: '⛴️',
            title: 'שיט ומעבורות',
            phrases: [
                { hebrew: 'מתי המעבורת הבאה?', greek: 'Πότε είναι το επόμενο πλοίο;', transliteration: 'פוטה אינה טו אפומנו פליו?' },
                { hebrew: 'כרטיס לאנטיפאקסוס בבקשה', greek: 'Ένα εισιτήριο για Αντίπαξους παρακαλώ', transliteration: 'אנה איסיטיריו יה אנדיפקסוס פרקלו' },
                { hebrew: 'איפה נמל המעבורות?', greek: 'Πού είναι το λιμάνι;', transliteration: 'פו אינה טו לימני?' }
            ]
        }
    ],
    pronunciationTip: {
        icon: '💡',
        title: 'טיפ הגייה',
        html: 'ביוונית יש חשיבות למקום הטעם במילה (מסומן באות המודגשת) — הטעם הלא נכון עלול לשנות את המשמעות. אל תדאגו יותר מדי: תושבי פאקסוס רגילים לתיירים ומעריכים כל ניסיון לדבר יוונית, גם לא מושלם.'
    }
};
