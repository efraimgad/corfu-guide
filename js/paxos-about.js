// ============================================================================
// paxos-about.js — real About-tab data for the Paxos destination package
// (data/destinations/paxos.js). Same shape as js/corfu-about.js's
// window.CORFU_ABOUT: { regions, quickFacts, heroBanner }.
//
// Paxos is long and narrow, not compass-quartered like Corfu — 3 regions
// (not Corfu's 4) reflecting the island's real geography, not a copy of
// Corfu's region count. Written independently, not "Corfu text with the
// name swapped" — different structure, different facts, different tone.
// ============================================================================

window.PAXOS_ABOUT = {
    regions: [
        {
            id: 'lakka',
            label: 'צפון',
            emoji: '⛵',
            title: 'לאקה השקטה ומפרץ השייטים',
            description: 'מפרץ טבעי כמעט סגור, אהוב על שייטים בזכות המחסה מרוחות. כפר קטן ורגוע עם טיילת חוף, פחות תיירותי מגאיוס.'
        },
        {
            id: 'central-west',
            label: 'מרכז ומערב',
            emoji: '🫒',
            title: 'לוגוס, חורשות זית וצוקי אירימיטיס',
            description: 'לב האי החקלאי — חורשות זית עתיקות, כפר הדייגים הציורי לוגוס, והחוף המערבי הפרוע עם מערות הים הכחולות וצוקי אירימיטיס.'
        },
        {
            id: 'gaios-south',
            label: 'דרום',
            emoji: '⚓',
            title: 'גאיוס והשער לאנטיפאקסוס',
            description: 'הבירה הקטנה של האי, נמל עם אדריכלות ניאו-קלאסית ואי מנזר קטן בכניסה. גם נקודת היציאה העיקרית לשייט אל אנטיפאקסוס.'
        }
    ],
    quickFacts: [
        { icon: '🏝️', text: 'אי קטן במיוחד — כ-19 קמ"ר בלבד' },
        { icon: '⛴️', text: 'ללא שדה תעופה — מגיעים רק בשיט, בעיקר מקורפו' },
        { icon: '🫒', text: 'מכוסה חורשות זית עתיקות' },
        { icon: '🗣️', text: 'יוונית (אנגלית נפוצה בתיירות)' },
        {
            iconHtml: '<svg class="icon-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 6.8a6.3 6.3 0 1 0 0 10.4"/><path d="M5.5 10.2h8M5.5 13.4h7"/></svg>',
            text: 'מטבע: יורו (€)'
        },
        { icon: '🌊', text: 'מוכר בעיקר בזכות אנטיפאקסוס הסמוכה ומימיה הטורקיז' }
    ],
    heroBanner: {
        imageAlt: 'איור: מפרץ ים תיכוני שקט עם חורשת זיתים',
        title: 'היכרות עם פאקסוס: האי הקטן שאין אליו שדה תעופה 🫒⛵',
        subtitle: 'דרומית לקורפו, פאקסוס הזעירה מציעה קצב חיים אחר לגמרי — כפרי דייגים ציוריים, חורשות זית עתיקות, וגישה ימית בלבד לחוף וטומי הטורקיז באנטיפאקסוס השכנה. לפני שמתכננים ביקור, הנה כל מה שכדאי לדעת על האי הקטן הזה.'
    }
};
