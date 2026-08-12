// ============================================================================
// paxos-weather.js — seasonal weather data for the Paxos destination package
// (data/destinations/paxos.js). Same record shape as js/corfu-weather.js's
// window.CORFU_WEATHER.
//
// Paxos shares the Ionian Sea's general climate pattern with Corfu (the two
// islands are ~20km apart), so broad, well-known seasonal ranges are
// legitimate general knowledge — but deliberately presented as 4 SEASONAL
// bands with rounded ranges rather than Corfu's month-by-month table, to
// avoid implying a false precision (exact monthly averages) this project
// has no destination-specific source to verify for Paxos specifically.
// ============================================================================

window.PAXOS_WEATHER = [
    {
        month: 'אביב (מרץ–מאי)',
        dayTemp: '15-22°',
        seaTemp: '15-19°',
        rainDays: 'יורד בהדרגה',
        description: 'האי מוריק ופורח, ירוק במיוחד — נעים להליכות ולסיורי סירה, אך הים עדיין קריר לשחייה ממושכת עד סוף התקופה.',
        highlight: false
    },
    {
        month: 'קיץ (יוני–ספטמבר)',
        dayTemp: '26-32°',
        seaTemp: '24-27°',
        rainDays: 'נדירים',
        description: 'העונה החמה והיבשה — ימים ארוכים ושמשיים, מים חמים ונעימים, ותנועת שייט מלאה לאנטיפאקסוס. גם השיא התיירותי של האי.',
        highlight: true
    },
    {
        month: 'סתיו (אוקטובר–נובמבר)',
        dayTemp: '18-25°',
        seaTemp: '20-24°',
        rainDays: 'עולה בהדרגה',
        description: 'ים עדיין נעים בתחילת התקופה ופחות עומס — אך קווי שיט עונתיים לאנטיפאקסוס ולמערות הכחולות מצטמצמים לקראת סוף העונה.',
        highlight: false
    },
    {
        month: 'חורף (דצמבר–פברואר)',
        dayTemp: '10-15°',
        seaTemp: '14-16°',
        rainDays: 'תכופים',
        description: 'עונה שקטה מאוד עם גשם ורוח — חלק גדול מבתי העסק התיירותיים סגורים, מתאים בעיקר למי שמחפש אי יווני אותנטי ושקט.',
        highlight: false
    }
];
