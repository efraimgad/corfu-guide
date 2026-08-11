// ============================================================================
// itinerary-data.js — the single source of truth for all 9 itinerary
// entries (7 numbered days + the 2 optional/alternative days), extracted
// verbatim from the real, fact-checked day-card markup that used to live
// directly in index.html (Phase A of the old-DOM subtraction effort).
//
// Shape: window.ITINERARY_DAYS = [ { key, dayNumber, isAlt, icon,
//   titleTemplate|title, subtitleTemplate|subtitle, hint?, image, rainAlt,
//   items: [ { time, title, html } ], closingNoteHtml? }, ... ]
//
// - Numbered days (1-7) carry titleTemplate/subtitleTemplate strings with
//   {date}/{weekday}/{arriveTime}/{departTime} tokens instead of the baked-
//   in date text the old markup had - resolved at render time (see
//   gtItineraryResolveTemplate() below) from the same single TRIP_CONFIG
//   source of truth js/dashboard.js's injectTripDates() already uses, so a
//   future trip-date change still only has to happen in one place. This is
//   a deliberate improvement over the old markup, which baked static dates
//   into the HTML and relied on injectTripDates() finding and overwriting
//   those specific elements by id - a lookup that no longer works once
//   these controls are authored fresh on every day-switch instead of
//   living permanently in the DOM.
// - Optional/alternative days (alt-paxos, alt-pantokrator) carry plain
//   title/subtitle/hint strings - their header text never varies with the
//   trip's dates.
// - Each item's "title" and "html" are the item's real, fact-checked
//   content, preserved as raw HTML exactly as authored (not paraphrased or
//   stripped) - including any nested tip boxes and the
//   data-price-flag-id/data-dinner-food-id placeholder elements, which
//   js/itinerary.js's fillItineraryPriceFlags()/fillItineraryDinnerHooks()/
//   checkDayVenueWarnings() fill in-place on this data structure (an
//   annotation step, not a DOM-injection one) before anything renders.
// - image/rainAlt/closingNoteHtml preserve real content (a hero photo, the
//   day's rain-alternative plan, the Pantokrator card's conditional
//   closing line) that the pre-existing new day-scrubber view
//   (js/itinerary-view.js) already did not surface anywhere (the old cards
//   carrying them were already hidden via .gt-legacy-hidden before this
//   pass) - kept here so the content survives physically deleting the old
//   markup, without this subtraction-only pass newly displaying content
//   that wasn't already visible (that's a visual-design decision for a
//   later phase, out of scope here).
// ============================================================================

window.ITINERARY_DAYS = [
    {
        key: "1",
        dayNumber: 1,
        isAlt: false,
        icon: "✈️",
        titleTemplate: `יום 1 ({date}): נחיתה, איסוף רכב והתאקלמות ראשונית`,
        subtitleTemplate: `הטיסה נוחתת בשעה {arriveTime} - יום קליל שמתמקד בהגעה חלקה, איסוף הרכב השכור והתאקלמות, ללא לחץ של סיורים.`,
        image: null,
        rainAlt: null,
        dayBrief: {
            theme: `לא לתכנן כלום. באמת.`,
            pace: "relaxed",
            bestFor: ["logistics"],
            overview: `<p>הטיסה נוחתת ב-18:15, ועד שתצאו מהטרמינל עם רכב זה כבר קרוב ל-19:30. היום הזה קיים כדי להגיע, לא כדי לראות - וזה בכוונה. כל ניסיון לדחוס לכאן תחנה ראשונה נגמר באותו מקום: הגעה למלון בשעה שבה כבר לא נעים לבקש צ׳ק-אין.</p>`,
            mustDo: [
                { title: `לתעד את הרכב השכור לפני היציאה מהחניון`, why: `שריטות, דלק, קילומטראז׳ - צילום מהיר מכל הזוויות. זו הפעולה היחידה היום שעולה כסף אם מדלגים עליה.` }
            ],
            recommended: [
                { title: `לעדכן את המלון על שעת ההגעה`, why: `אתם מגיעים סביב 20:00. שווה שיידעו מראש, במיוחד לגבי נהלי צ׳ק-אין מאוחר.` }
            ],
            ifTired: `<p>אין מה לקצר - היום כבר מקוצר. אם אתם מותשים מהטיסה, טברנה קרובה עדיפה על כל בחירה "נכונה" יותר במרחק נסיעה.</p>`,
            highlights: [
                `נחיתה בשדה קטן שיוצאים ממנו מהר`,
                `הרכב באוויר, בלי לחץ של לוח זמנים`
            ],
            bestMoment: `הארוחה הראשונה בחוץ, כשכבר לא צריך להגיע לשום מקום.`
        },
        dayArea: "גוביה ↔ שדה התעופה",
        closingNoteHtml: `<p>😌 <strong>קחו את הזמן:</strong> אין כאן שום דבר לתכנן. אם הטיסה מתעכבת או שאתם פשוט הרוגים - דלגו על הארוחה בחוץ וקחו משהו ליד המלון. היום הזה קיים כדי להגיע, לא כדי לראות.</p>`,
        transitions: {
            fromHotel: null,
            between: [
                { mode: "walk", min: 5 },
                { mode: "drive", min: 18, km: 8 },
                { mode: "walk", min: 5 }
            ],
            toHotel: null
        },
        items: [
            { time: "18:15 - 19:00", title: `🛬 נחיתה בשדה התעופה יאניס קפודיסטריאס (CFU)`, html: `<div class="premium-event-desc"><p>השדה קטן וקומפקטי - יציאה מהמטוס ועד לביקורת הדרכונים ואיסוף מזוודות אורכת בדרך כלל 20-30 דקות בלבד. שדה התעופה נמצא בפועל בתוך העיר קורפו, כ-3 ק"מ מהמרכז.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות נוספת מעבר למחיר הטיסה</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כ-30-45 דקות מהנחיתה ועד יציאה מהטרמינל</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע - שדה קטן ולא עמוס</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">💡</span> <span><strong>טיפ:</strong> אם שכרתם רכב, נציג חברת ההשכרה בדרך כלל מחכה בטרמינל היציאה עם שלט. אם לא סוכם מראש - יש דלפקי השכרה בתוך המסוף.</span></p>
                            </div>` },
            { time: "19:00 - 19:30", title: `🚗 איסוף הרכב השכור`, html: `<div class="premium-event-desc"><p>בדקו את הרכב לפני היציאה מהחניון (שריטות, דלק, קילומטראז'), צלמו תיעוד מהיר מכל הזוויות. זכרו: <strong>ביוון נוהגים בצד ימין</strong> בדיוק כמו בישראל, כך שההתאמה מהירה.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> לפי ההזמנה המוקדמת שלכם</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כ-20-30 דקות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> יעיל - כדאי לבדוק את הרכב בקפידה לפני היציאה</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">📋</span> <span><strong>לא לשכוח:</strong> רישיון נהיגה בינלאומי (פנקס נייר) + רישיון ישראלי פלסטיק + דרכון.</span></p>
                                <p class="flex items-start gap-2"><span class="text-lg">🚙</span> <span><strong>פרטי ההשכרה:</strong> הרכב השכור (<span class="trip-private-car-ref">פרטי ההזמנה שלכם</span>) - כדאי לשמור את מספר ההזמנה וטלפון החברה נגישים לאורך הטיול, במיוחד לקראת ההחזרה ביום 7.</span></p>
                            </div>` },
            { time: "19:30 - 20:30", title: `🏨 נסיעה ל-<span class="trip-private-hotel-name">המלון שלכם</span> בגוביה`, html: `<div class="premium-event-desc"><p>המלון ממוקם בגוביה (Gouvia), כ-7 ק"מ צפונית לעיר קורפו על כביש החוף המזרחי - נסיעה ישירה וקלה ללא כבישי הרים, <strong>כ-15-20 דקות</strong> משדה התעופה. הכביש הראשי מהשדה עובר דרך פרברי העיר ולאורך החוף עד גוביה, ללא צמתים מסובכים.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות נוספת (כלול בדלק הרכב)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כ-15-20 דקות נהיגה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> קליל - כביש חוף ישר וקל אחרי יום טיסה</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">💡</span> <span><strong>טיפ:</strong> ⚠️ ודאו מראש מול המלון את הכתובת המדויקת להזנה ב-Google Maps / Waze, ואת נהלי הצ'ק-אין המאוחר (הטיסה נוחתת 18:15, אתם צפויים להגיע כ-20:00) - מומלץ לעדכן את המלון מראש על שעת ההגעה המשוערת.</span></p>
                            </div>` },
            { time: "20:30 ואילך", title: `🍽️ ארוחת ערב קלילה ליד המלון`, html: `<div class="premium-event-desc"><p>אחרי יום טיסה, עדיף טברנה קרובה ונוחה מאשר נסיעה רחוקה. גוביה ודאסיה הסמוכה מציעות כמה טברנות חוף נגישות ברגל או בנסיעה קצרה - ראו גם את הרשימה המלאה בסעיף <strong>"ליד מקום הלינה שלכם"</strong> בחלק "מידע מעשי". לכו לישון מוקדם - מחר מתחיל הכיף האמיתי!</p><div class="itinerary-dinner-slot" data-dinner-food-id="food-לדוקולה-Ladokolla"><p>טוען המלצה...</p></div></div>` }
        ]
    },
    {
        key: "2",
        dayNumber: 2,
        isAlt: false,
        icon: "🏛️",
        titleTemplate: `יום 2 ({weekday} {date}): קורפו טאון (Kerkyra) – קסם ונציאני וסמטאות היסטוריות`,
        subtitleTemplate: `היכרות ראשונה עם בירת האי, מבצרים עתיקים, סמטאות הקמפיילו ותצפיות מטוסים מרהיבות.`,
        image: { src: "images/cards/history.svg", alt: "איור: העיר קורפו" },
        rainAlt: `<p>במקום תצפיות ומבצרים בחוץ, העיר מציעה מוזיאונים פנימיים מרתקים:</p>
                    <ul class="list-disc list-inside space-y-2 ml-4">
                        <li><strong>מוזיאון האמנות האסיאתית:</strong> אוסף עצום ומפתיע מהמזרח הרחוק בתוך ארמון מרשים.</li>
                        <li><strong>המוזיאון הארכיאולוגי של קורפו:</strong> ליד חוף גריצה; מציג ממצאים מהעת העתיקה כולל הגמלון המפורסם של גורגו ממקדש ארטמיס. ⚠️ שעות וכרטיס משולב עשויים להשתנות לפי עונה - מומלץ לאמת לפני ההגעה.</li>
                        <li><strong>Casa Parlante:</strong> אחוזה מהמאה ה-19 שקמה לתחייה באמצעות רובוטים אנימטרוניים.</li>
                        <li><strong>מפעל הסבון Patounis:</strong> סיור פנימי חינמי במפעל מסורתי לסבוני שמן זית.</li>
                    </ul>
                    <p>אכלו צהריים באחת הטברנות החמימות עם אח מבוערת באזור הקמפיילו.</p>`,
        dayBrief: {
            theme: `עיר אחת, חניה אחת, כל השאר ברגל`,
            pace: "balanced",
            bestFor: ["sightseeing", "history", "food", "couples"],
            overview: `<p>קורפו טאון היא לא "עוד עיר עתיקה יוונית" - היא ונציאנית. ארבע מאות שנה של שלטון ונציאני, ואחריהן צרפתים ובריטים, הותירו עיר שנראית ומרגישה קרוב יותר לאיטליה: קשתות, תריסים, כביסה בין הבניינים, ומגרש קריקט בלב הכיכר המרכזית - היחיד ביוון.</p>
                <p>המבנה של היום פשוט: חונים פעם אחת ליד הליסטון, ומשם הכול ברגל עד אחר הצהריים. רק קאנוני בסוף דורש חניה שנייה. זה גם היום העמוס ביותר בתחנות בטיול, אבל המרחקים בו הם דקות הליכה - לא נסיעות.</p>`,
            mustDo: [
                { title: `הקמפיילו`, why: `הרובע הוונציאני הישן. אין כאן "אתר" לראות - ההליכה עצמה היא הדבר, וכדאי ללכת לאיבוד בו בכוונה.` }
            ],
            recommended: [
                { title: `המבצר הישן`, why: `המבצר הישן שולט על העיר וממילא תעברו למרגלותיו, אז אם בא לכם לטפס - התצפית על המפרץ והרי אלבניה שווה את זה. אין שום בעיה גם רק להסתובב בחצר.` },
                { title: `קפה מול הליסטון`, why: `הטיילת שנבנתה בהשראת רחוב ריבולי בפריז - הדרך הנכונה להתחיל את היום כאן, ולא רק בגלל הקפה.` },
                { title: `קאנוני ומנזר ולכרנה`, why: `גשר הולכי רגל אל המנזר, ומטוסים שנוחתים ממש מעל הראש. תזמון טוב לשעה שלפני השקיעה.` }
            ],
            optional: [
                { title: `כנסיית סנט ספירידון`, why: `פטרון האי, במרכז הקמפיילו ממילא. עצירה של עשר דקות בתוך מסלול ההליכה.` }
            ],
            ifTired: `<p>קצרו את המבצר הישן: אפשר להיכנס, להסתובב בחצר ולוותר על הטיפוס עד הצלב שבפסגה. חוסך כשעה ואת רוב המאמץ, ומשאיר את הקמפיילו והצהריים על כנם.</p>`,
            ifEnergy: `<p>העיר מספיק צפופה כדי שתמיד יהיה עוד משהו במרחק הליכה - מוזיאון, מפעל הסבון, או פשוט עוד סמטה. תוסיפו לפי מה שאתם עוברים לידו, לא לפי רשימה.</p>`,
            skipFirst: `קאנוני. הוא היחיד שדורש לקחת את הרכב שוב באמצע היום, ולכן הראשון שיורד אם התעכבתם בעיר.`,
            weather: {
                sun: `<p>העיר נותנת צל בסמטאות אבל לא בכיכר ולא במבצר. הליסטון בבוקר והקמפיילו בצהריים זו חלוקה טובה - הסמטאות הצרות הן המקום הקריר ביום חם.</p>`,
                cloud: `<p>זה מזג האוויר הטוב ביותר ליום הזה: הליכה ארוכה בעיר נוחה בהרבה בלי שמש, והמבצר לא מאבד כמעט כלום. אין סיבה לשנות משהו.</p>`
            },
            highlights: [
                `ללכת לאיבוד בסמטאות הקמפיילו`,
                `התצפית מהמבצר הישן על המפרץ והרי אלבניה`,
                `מטוס שנוחת מעל הראש בקאנוני`
            ],
            bestMoment: `הקפה הראשון מול קשתות הליסטון, כשהעיר עוד מתעוררת.`
        },
        dayArea: "מרכז קורפו",
        closingNoteHtml: `<p>😌 <strong>קחו את הזמן:</strong> אם התיישבתם לקפה מול הליסטון ונשארתם שעתיים, או שהלכתם לאיבוד בקמפיילו וויתרתם על קאנוני - זה לא פספוס. העיר הזאת מתגמלת שיטוט, לא רשימה.</p>`,
        transitions: {
            fromHotel: null,
            between: [
                { mode: "drive", min: 15, km: 8.5, parking: "חנו פעם אחת ליד הליסטון" },
                { mode: "walk", min: 5, m: 400 },
                { mode: "walk", min: 7, m: 500 },
                { mode: "walk", min: 3, m: 200 },
                { mode: "drive", min: 12, km: 4.5, parking: "חניה נפרדת בקאנוני" },
                { mode: "walk", min: 3 }
            ],
            toHotel: { mode: "drive", min: 20, km: 12 }
        },
        items: [
            { time: "08:30 בערך", title: `☕ בוקר רגוע במלון`, html: `<div class="premium-event-desc"><p>ארוחת בוקר במלון <span class="trip-private-hotel-name">המלון שלכם</span> לפני היציאה לקורפו טאון.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כלול במלון</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כחצי שעה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע - התחלה קלילה ליום</span></li></ul></div>` },
            { time: "10:00 בערך", title: `☕ קפה מול הליסטון`, html: `<div class="premium-event-desc"><p>התחילו את הסיור בטיילת הליסטון המפורסמת שנבנתה בהשראת רחוב ריבולי בפריז. שבו באחד מבתי הקפה האלגנטיים, הזמינו קפה פרדו וצפו בעיר מתעוררת לחיים מול כיכר הספיאנדה הרחבה. שרידי המורשת הבריטית ניכרים כאן ממש - בקצה הצפוני של הספיאנדה שוכן מגרש הקריקט היחיד ביוון, שהוקם עוד בתקופת השלטון הבריטי במאה ה-19 ופעיל עד היום.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כ-4-6€ לקפה (ארוחת הבוקר עצמה כלולה במלון)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כחצי שעה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> אלגנטי ואירופאי - נהדר לצפייה בעיר מתעוררת</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">🚗</span> <span><strong>חניה:</strong> <a href="https://www.google.com/maps/search/?api=1&amp;query=39.6225,19.9234" class="text-blue-600 hover:text-blue-800 font-medium underline">Spianada Square Parking</a> (כ-3€ לשעה). חובה להגיע לפני 09:00.</span></p>
                                <p class="flex items-start gap-2"><span class="text-lg">📸</span> <span><strong>נקודת צילום:</strong> קשתות האבן המרשימות של הליסטון באור הבוקר.</span></p>
                            </div>` },
            { time: "11:15 בערך", title: `💡 המבצר הישן (Palaio Frourio) – אם בא לכם לטפס`, html: `<div class="premium-event-desc"><p>חצו את התעלה מעל הים והיכנסו למבצר הוונציאני. טפסו עד לצלב שבפסגה לתצפית של 360 מעלות על העיר העתיקה, המפרץ והרי אלבניה באופק. ההליכה היא בעלייה מתונה.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ראו מחיר מאומת בכרטיס האתר (פרק אטרקציות)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה - שעה וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> היסטורי ומרשים - נוף פנורמי בתמורה לטיפוס מתון</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">💡</span> <span><strong>טיפ:</strong> נעלו נעליים נוחות.</span></p>
                                <div data-price-flag-id="attr-10"></div>
                            </div>` },
            { time: "13:00 בערך", title: `⭐ הקמפיילו (Campiello) – הלב של היום`, html: `<div class="premium-event-desc"><p>לכו לאיבוד בסמטאות הצרות והציוריות של הרובע העתיק. הבניינים בצבעי פסטל עם כביסה תלויה מזכירים את נאפולי. בקרו בכנסיית סנט ספירידון (פטרון האי) ורכשו מזכרות מקומיות כמו סבוני שמן זית וליקר קומקוואט.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כניסה לכנסייה ללא עלות (תרומה מומלצת)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה - שעה וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> ציורי ואינטימי - מצוין לשוטטות ולצילום</span></li></ul></div>` },
            { time: "15:15 ואילך", title: `🍽️ צהריים ארוכים בעיר`, html: `<div class="premium-event-desc"><p>שבו באחת הטברנות בעיר העתיקה (למשל Marina's Tavern). חובה לטעום את המנות הקורפיות הקלאסיות: Pastitsada (פסטה עם תבשיל בקר בתבלינים) או Sofrito (בקר ברוטב יין לבן ושום).</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כ-15-20€ למנה</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה - שעה וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> אותנטי - טברנה מקומית בלב העיר העתיקה</span></li></ul></div>` },
            { time: "17:15 בערך", title: `🌿 קאנוני (Kanoni) – אם עוד יש כוח`, html: `<div class="premium-event-desc"><p>סעו כ-15 דקות לחצי האי קאנוני. רדו למנזר Vlacherna האייקוני. לכו על גשר הולכי הרגל החוצה את המפרץ והרגישו את המטוסים נוחתים ממש מעל לראשכם.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות (מלבד חניה, במידת הצורך)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה וחצי - שעתיים</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> ייחודי ומרגש - אטרקציה חינמית ונדירה</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">🚗</span> <span><strong>הגעה:</strong> <a href="https://www.google.com/maps/search/?api=1&amp;query=39.5911,19.9186" class="text-blue-600 hover:text-blue-800 underline">חניה בקאנוני</a>.</span></p>
                                <p class="flex items-start gap-2"><span class="text-lg">📸</span> <span><strong>צילום:</strong> תמונת המטוס החולף מעל המנזר היא חובה!</span></p>
                            </div>` },
            { time: "20:00 ואילך", title: `🍽️ ארוחת ערב`, html: `<div class="premium-event-desc"><p>סיימו את היום ליד קאנוני עם ארוחת ערב על קו המים, עם נוף למפרץ ולמנזר ולכרנה.</p><div class="itinerary-dinner-slot" data-dinner-food-id="food-פליסבוס-Flisvos"><p>טוען המלצה...</p></div></div>` }
        ]
    },
    {
        key: "3",
        dayNumber: 3,
        isAlt: false,
        icon: "🌊",
        titleTemplate: `יום 3 ({weekday} {date}): החוף הצפון-מזרחי – מפרצים נסתרים ואחוזות עתיקות`,
        subtitleTemplate: `נסיעה לאורך כביש החוף הפתלתל, חופי חלוקים לבנים, טברנות על קו המים והכפר קסיופי.`,
        image: { src: "https://images.pexels.com/photos/1480807/pexels-photo-1480807.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "החוף הצפון-מזרחי" },
        rainAlt: `<p>כבישי החוף הצפון-מזרחי הופכים לחלקלקים בגשם - סעו לאט! ביום גשום מומלץ לאתגר את בלוטות הטעם בארוחת צהריים ארוכה ומפנקת במסעדת <em>Toula's</em> (שיש לה אזור מקורה ויבש המשקיף על הים הגועש). בנוסף, זה זמן טוב לבקר ב<strong>מוזיאון שמן הזית</strong> שבצפון, או להתפנק ביום ספא באחד ממלונות היוקרה (כמו Angsana או Kontokali Bay).</p>`,
        dayArea: "צפון-מזרח קורפו",
        dayBrief: {
            theme: `יום אחד, ארבעה מפרצים, אפס מרחקים גדולים`,
            pace: "relaxed",
            bestFor: ["beach", "food", "couples", "scenic"],
            overview: `<p>החוף הצפון-מזרחי הוא הפינה הירוקה של קורפו: הר פנטוקרטור יורד ישר לים, והכביש מתפתל מעל שרשרת מפרצים קטנים עם מים צלולים וחלוקים לבנים. זה היום הכי פחות "לרוץ בין אתרים" בטיול - ארבע התחנות יושבות קרוב מאוד זו לזו, והמעברים ביניהן הם 5 עד 20 דקות.</p>
                <p>הדבר היחיד שדורש תשומת לב הוא הסוף: היום נגמר בקסיופי, שהיא הנקודה הרחוקה ביותר מהמלון בכל הטיול. הנסיעה חזרה היא כ-45 דקות על כביש חוף מתפתל, ובערב זה בחושך. לכן הארוחה היא כאן ולא בבית.</p>`,
            mustDo: [
                { title: `ארוחת צהריים במפרץ אגני`, why: `טברנות דגים ממש על קו המים, בלי כביש בין השולחן לים. זה הרגע שרוב האנשים מתארים כשהם מספרים על הצפון-מזרח.` }
            ],
            recommended: [
                { title: `טבילת בוקר בברבטי`, why: `רצועה ארוכה של חלוקים לבנים ומים שקופים, ומספיק מוקדם בבוקר כדי שתהיה שקטה.` },
                { title: `מפרץ קאלאמי והבית הלבן`, why: `המפרץ שבו התגורר לורנס דארל. קטן, ציורי, ולא דורש יותר משעה.` },
                { title: `הנמל והמבצר בקסיופי`, why: `כפר דייגים אמיתי עם הריסות ביזנטיות מעליו - סיום טוב ליום לפני הארוחה.` }
            ],
            optional: [
                { title: `מונית ים מקאלאמי לאגני`, why: `אם מתחשק להגיע לארוחה מהים במקום בכביש. תלוי בהפעלה ובמזג האוויר באותו יום.` }
            ],
            ifTired: `<p>ותרו על קאלאמי. ברבטי ואגני נותנים את אותה חוויה של מפרץ ומים, והוויתור חוסך כחצי שעה נסיעה ועוד חצי שעה חנייה והליכה - מה שמקדים את כל הערב.</p>`,
            ifEnergy: `<p>קסיופי היא נקודת ההתחלה הטבעית לעליית פנטוקרטור. אם אתם שוקלים את יום ההר החלופי, שווה להסתכל על הכביש שיוצא מכאן מערבה בזמן שאתם באזור.</p>`,
            skipFirst: `קאלאמי. הוא הכי חופף לתחנות האחרות ביום, ולכן הראשון שיורד אם משהו מתעכב.`,
            weather: {
                sun: `<p>הצד הזה של האי מוגן יחסית מהרוח המערבית, ולכן הים כאן בדרך כלל שקט יותר מהמערב - יום שמשי כאן הוא בדיוק מה שצריך. חלוקי הנחל מתחממים מאוד בצהריים, אז נעלי ים שוות את מקומן בתיק.</p>`,
                cloud: `<p>עננים לא פוגעים בשום דבר ביום הזה למעט צבע המים בתמונות. אם ממש מעונן, אפשר להזיז את הדגש מהשחייה לארוחה ארוכה יותר באגני ולשוטטות ארוכה יותר בקסיופי.</p>`
            },
            highlights: [
                `שולחן על קו המים במפרץ אגני`,
                `מים שקופים וחלוקים לבנים בברבטי`,
                `ערב בנמל הדייגים של קסיופי, בלי למהר חזרה`
            ],
            bestMoment: `הצהריים הארוכים באגני, כשאין שום תחנה שצריך להספיק אחריה.`
        },
        closingNoteHtml: `<p>😌 <strong>קחו את הזמן:</strong> זה היום הכי פחות תובעני בטיול, אז אל תמלאו אותו. אם הצהריים באגני נמשכו עד חמש וויתרתם על קסיופי - עשיתם את היום הזה בדיוק נכון.</p>`,
        transitions: {
            fromHotel: null,
            between: [
                { mode: "drive", min: 18, km: 13 },
                { mode: "drive", min: 15, km: 8.5 },
                { mode: "drive", min: 5, km: 1 },
                { mode: "drive", min: 20, km: 11, parking: "חניה בקסיופי ליד הנמל" },
                { mode: "walk", min: 3, m: 200 }
            ],
            toHotel: { mode: "drive", min: 45, km: 35 }
        },
        items: [
            { time: "08:45 בערך", title: `☕ בוקר בנחת במלון`, html: `<div class="premium-event-desc"><p>ארוחת בוקר במלון <span class="trip-private-hotel-name">המלון שלכם</span> לפני היציאה לחוף הצפון-מזרחי.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כלול במלון</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כ-45 דקות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע - התחלה קלילה ליום</span></li></ul></div>` },
            { time: "10:15 בערך", title: `⭐ טבילת בוקר בחוף ברבטי (Barbati)`, html: `<div class="premium-event-desc"><p>סעו צפונה לאורך קו החוף. עצרו בחוף ברבטי - רצועת חוף ארוכה של חלוקי נחל לבנים ומים צלולים כבדולח, כשברקע מתנשא הר פנטוקרטור הירוק. שכרו מיטת שיזוף או פשוט פרסו מגבת.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות לחוף עצמו; כ-10-15€ למיטת שיזוף (אופציונלי)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעתיים - שעתיים וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> נופי ומרגיע - מים צלולים ורקע הררי</span></li></ul></div>` },
            { time: "12:45 בערך", title: `🌿 מפרץ קאלאמי (Kalami) – אם בא לכם עוד מפרץ`, html: `<div class="premium-event-desc"><p>המשך נסיעה (כ-20 דקות) אל קאלאמי. רדו אל המפרץ הציורי, בו נמצא "הבית הלבן" (The White House) שבו התגורר הסופר לורנס דארל בשנות ה-30. המקום פועל כיום כמסעדה ובית הארחה, ונעים לקפה מול סירות המפרש.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות כניסה (עלות רק אם עוצרים לאכול/לשתות)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה - שעה וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> נוסטלגי וספרותי - מפרץ ציורי במיוחד</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">🚗</span> <span><strong>חניה:</strong> לאורך הכביש היורד לחוף קאלאמי, היזהרו בסיבובים החדים.</span></p>
                            </div>` },
            { time: "14:30 ואילך", title: `⭐ צהריים ארוכים במפרץ אגני (Agni Bay)`, html: `<div class="premium-event-desc"><p>אפשר להגיע לאגני בנסיעה קצרה או לקחת מונית מים קטנה מקאלאמי. מפרץ אגני מפורסם בטברנות הדגים המצוינות שבו, הממוקמות ממש על קו המים. מומלץ מאוד להזמין מקום מראש ב-<em>Toula's Gastronomy</em> או ב-<em>Taverna Agni</em>.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כ-30-40€ למנה (יוקרתי, פירות ים טריים)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה וחצי - שעתיים</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> יוקרתי ורגוע - ישיבה על קו המים</span></li></ul></div>` },
            { time: "17:30 בערך", title: `💡 קסיופי (Kassiopi) – אתם ממילא בדרך`, html: `<div class="premium-event-desc"><p>סיימו את היום בקסיופי, כפר דייגים תוסס וגדול יותר. שוטטו סביב הנמל המלא סירות דיג עץ, טפסו להריסות המבצר הביזנטי שמשקיף על העיירה, ושבו באחד הברים על קו המים לדרינק של שקיעה (שקיעה בסביבות 20:06 ב-4.9, הערכה משוערת - ראו הערה בראש פרק המסלול*).</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כניסה למבצר ללא עלות</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעתיים - שלוש שעות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> תוסס ואותנטי - כפר דייגים עם שקיעה מהממת</span></li></ul></div>` },
            { time: "19:45 ואילך", title: `🍽️ ארוחת ערב בקסיופי`, html: `<div class="premium-event-desc"><p>אחרי הנמל והמבצר אין שום סיבה לנסוע 45 דקות רעבים - נשארים לאכול בקסיופי עצמה. <strong>טרילוגיה</strong> נמצאת על הטיילת ממש ליד המקום שבו כבר תהיו, במרחק הליכה של דקות ספורות מהנמל.</p><div class="itinerary-dinner-slot" data-dinner-food-id="food-טרילוגיה"><p>טוען המלצה...</p></div><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשעה וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> נינוח - נמל דייגים בערב, בלי למהר</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">🚗</span> <span><strong>לזכור:</strong> מכאן חזרה למלון זו נסיעה של כ-45 דקות על כביש חוף מתפתל בחושך. זו הנסיעה הארוכה ביותר של הטיול בסוף יום - שווה לקחת את זה בחשבון בכמות היין.</span></p>
                            </div>` }
        ]
    },
    {
        key: "4",
        dayNumber: 4,
        isAlt: false,
        icon: "⛵",
        titleTemplate: `יום 4 ({weekday} {date}): פלאוקסטריצה – חופי אמרלד ומנזרים תלויים`,
        subtitleTemplate: `האזור המרהיב ביותר בקורפו! מערות כחולות, נהיגת סירות עצמאית ומבצר בשחקים.`,
        image: { src: "https://images.pexels.com/photos/1109000/pexels-photo-1109000.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Paleokastritsa" },
        rainAlt: `<p>מזג אוויר סוער הופך את השייט למסוכן ואת הים לגועש במיוחד בחוף המערבי. פנו אל <strong>האקווריום של קורפו (Corfu Aquarium)</strong> בפלאוקסטריצה לביקור מקורה ומעניין, במיוחד אם אתם עם ילדים. משם סעו בזהירות למעלה ההר לכפר Lakones ושבו בבית קפה עם מרפסת סגורה זכוכית (כמו Bella Vista) והשקיפו על המפרצים הדרמטיים מלמעלה מוגנים מהגשם.</p>`,
        dayBrief: {
            theme: `היום שבו אתם נוהגים בסירה בעצמכם`,
            pace: "active",
            bestFor: ["water", "beach", "sightseeing", "couples", "sunset"],
            overview: `<p>פלאוקסטריצה היא הפוסטר של קורפו, ובצדק: שישה מפרצים ירוקים שנחתכים לתוך צוקים, ומים בצבע שקשה להאמין לו בתמונות. אבל מה שהופך את היום הזה לחריג הוא לא הנוף - זו הסירה. מנוע עד 30 כ"ס לא דורש רישיון, כלומר אתם יכולים לשכור סירה קטנה ולנווט אותה בעצמכם למפרצים שאין אליהם דרך ביבשה.</p>
                <p>היום הזה מתחיל מוקדם מכל השאר, וזה מכוון: ארוחת בוקר ב-07:30 כדי להגיע למנזר לפני שהאוטובוסים המאורגנים מגיעים. זה ההבדל בין חצר שקטה לחצר עמוסה, והוא שווה את השעון המעורר.</p>`,
            mustDo: [
                { title: `סירה עצמאית למפרצים הנסתרים`, why: `החוויה שאי אפשר לשחזר ביבשה - חופים שמגיעים אליהם רק מהים, בקצב שלכם ובלי קבוצה.` }
            ],
            recommended: [
                { title: `מנזר פלאוקסטריצה מוקדם בבוקר`, why: `המנזר פתוח מוקדם והוא שקט רק לפני שהאוטובוסים מגיעים. אם כבר קמתם לשייט, זו עצירה טבעית בדרך - ואם לא, לא נורא.` },
                { title: `מבצר אנגלוקסטרו`, why: `טיפוס מתון לתצפית על כל החוף המערבי. הדרך אליו צרה ומתפתלת - סעו לאט.` },
                { title: `שקיעה בחוף רוביניה`, why: `הליכה קצרה דרך מטע זיתים אל מפרץ בלי קיוסקים ובלי שמשיות. תביאו מים, אין שם כלום.` }
            ],
            optional: [
                { title: `עצירה בכפר לאקונס`, why: `התצפית מהכביש מעל המפרצים - עצירה של רבע שעה בדרך למעלה, לא יעד בפני עצמו.` }
            ],
            ifTired: `<p>ותרו על אנגלוקסטרו. הוא הטיפוס היחיד ביום, והדרך אליו צרה ומתישה אחרי שלוש שעות בסירה בשמש. בלעדיו היום נגמר רגוע עם צהריים ארוכים ושקיעה ברוביניה.</p>`,
            ifEnergy: `<p>אם נשאר זמן בין הסירה לצהריים, אפשר להוסיף שנורקלינג קצר במפרץ שממנו יצאתם - הציוד כבר עליכם והמים שם רדודים וצלולים.</p>`,
            skipFirst: `אנגלוקסטרו. הוא התוספת הכי תובענית פיזית ביום, והיחיד שאפשר לוותר עליו בלי לפרק את שאר המסלול.`,
            weather: {
                sun: `<p>יום שמשי הוא תנאי הסף לסירה - זו לא העדפה אסתטית. קחו קרם הגנה עמיד במים, כובע שלא עף, ומים לסירה עצמה: אין שם צל ואין איפה לקנות.</p>`,
                cloud: `<p>עננות קלה לא מבטלת את השייט, אבל צבע המים - הסיבה העיקרית להיות כאן - תלוי באור ישיר. אם השמיים אפורים לגמרי, שקלו להפוך את היום ליום יבשתי: מנזר, לאקונס, אנגלוקסטרו וצהריים ארוכים.</p>`
            },
            highlights: [
                `לנווט סירה קטנה בעצמכם בין המפרצים`,
                `חצר המנזר לפני שהאוטובוסים מגיעים`,
                `שקיעה ברוביניה, בלי אף אחד שמוכר שם כלום`
            ],
            bestMoment: `הרגע שבו מכבים את המנוע במפרץ שאין אליו כביש ופשוט נשארים במים.`
        },
        dayArea: "מערב קורפו",
        closingNoteHtml: `<p>😌 <strong>קחו את הזמן:</strong> זה היום היחיד שמתחיל מוקדם בכוונה. אחרי השייט הכול גמיש: אפשר לוותר על אנגלוקסטרו, על רוביניה, או על שניהם, ולשבת בפלאוקסטריצה עד הערב.</p>`,
        transitions: {
            fromHotel: null,
            between: [
                { mode: "drive", min: 18, km: 14, parking: "חנו ליד המנזר/חוף השייט" },
                { mode: "walk", min: 5, m: 300 },
                { mode: "drive", min: 18, km: 9 },
                { mode: "drive", min: 10, km: 5 },
                { mode: "drive", min: 8, km: 3 }
            ],
            toHotel: { mode: "drive", min: 20, km: 14 }
        },
        items: [
            { time: "07:30 בערך", title: `☕ בוקר מוקדם – והפעם יש סיבה`, html: `<div class="premium-event-desc"><p>ארוחת בוקר מוקדמת במלון <span class="trip-private-hotel-name">המלון שלכם</span> - יוצאים מוקדם כדי להקדים את פקקי האוטובוסים בפלאוקסטריצה.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כלול במלון</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כחצי שעה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע - התחלה קצרה, יציאה מוקדמת</span></li></ul></div>` },
            { time: "08:30 בערך", title: `💡 מנזר פלאוקסטריצה (Paleokastritsa Monastery) – שקט רק מוקדם`, html: `<div class="premium-event-desc"><p>הגיעו מוקדם מאוד כדי להימנע מפקקי האוטובוסים. המנזר המטופח משנת 1228 יושב על צוק וצופה אל המפרצים. החצר מלאה בפרחי בוגנוויליה וחתולים מתוקים.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כ-2-4€ תרומה בכניסה</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> 45 דקות - שעה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> שליו ומטופח - הגעה מוקדמת חיונית</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">👗</span> <span><strong>קוד לבוש:</strong> חובה לכסות כתפיים וברכיים. בכניסה מחלקים חצאיות וצעיפים במידת הצורך.</span></p>
                            </div>` },
            { time: "10:45 בערך", title: `⭐ שייט עצמאי למפרצים הנסתרים`, html: `<div class="premium-event-desc"><p>רדו לחוף Ampelaki או Alipa ושכרו סירת מנוע קטנה (עד 30 כ"ס לא דורש רישיון!) לכמה שעות. שוטו עצמאית לחוף "פרדייס" (Chomi) שאליו ניתן להגיע רק מהים, ולמערות הימיות. מי שמעדיף יכול לקחת סירת מונית מהירה.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> סירה קטנה ל-3 שעות בערך: כ-60-80€. המחיר עולה עם גודל הסירה ומשך השכירות - עד כ-250€+דלק ליום שלם/סירה גדולה יותר - ראו טווח המחירים המלא ב<a href="#" onclick="event.preventDefault(); switchTab('activities', true); setTimeout(() => document.getElementById('act-boats').scrollIntoView({behavior:'smooth'}), 150);" class="text-indigo-600 font-semibold hover:underline">כרטיס השכרת הסירות בפרק הפעילויות ←</a></span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כ-3 שעות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> הרפתקני ועצמאי - גישה בלעדית מהים בלבד</span></li></ul></div>` },
            { time: "14:15 ואילך", title: `🍽️ צהריים + 🌿 מבצר אנגלוקסטרו (Angelokastro) אם בא לכם`, html: `<div class="premium-event-desc"><p>אכלו צהריים ב-Akron Beach Bar ואז סעו בזהירות בדרך הצרה במעלה ההר לכפר לאקונס (Lakones). משם, המשיכו לחניית מבצר אנגלוקסטרו ("טירת המלאכים"). טיפוס תלול אך קצר (כ-15 דקות) יוביל אתכם לחורבות המבצר הביזנטי עם התצפית אולי היפה ביותר בקורפו כולה.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ראו מחיר מאומת בכרטיס האתר (פרק אטרקציות); ארוחה כ-15-20€</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשעה למבצר (כולל הטיפוס הקצר)</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> דרמטי - אחת התצפיות היפות באי</span></li></ul></div>
                            <div class="premium-tip-box" data-price-flag-id="attr-5"></div>` },
            { time: "17:45 בערך", title: `💡 שקיעה בחוף רוביניה (Rovinia Beach)`, html: `<div class="premium-event-desc"><p>סיימו את היום בחוף רוביניה הבתולי. מדובר בהליכה קצרה דרך מטע זיתים עתיק, עד שמגיעים למפרץ מהמם המוקף צוקים. אין כאן שמשיות או קיוסקים, רק טבע ושקיעות מרהיבות.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשעתיים (כולל הליכה במטע הזיתים)</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> בתולי וטבעי - ללא תשתיות, רק נוף ושקיעה</span></li></ul></div>` },
            { time: "20:15 ואילך", title: `🍽️ ארוחת ערב`, html: `<div class="premium-event-desc"><p>סעו בחזרה לנמל הקטן של פלאוקסטריצה לארוחת דגים, במרחק הליכה מהמנזר.</p><div class="itinerary-dinner-slot" data-dinner-food-id="food-ורכוס-טברנה-Vrachos"><p>טוען המלצה...</p></div></div>` }
        ]
    },
    {
        key: "5",
        dayNumber: 5,
        isAlt: false,
        icon: "🌾",
        titleTemplate: `יום 5 ({weekday} {date}): הדרום השקט – דיונות, אגם מלוח וארוחה ארוכה`,
        subtitleTemplate: `היום שבו לא מנסים להספיק. תחנה מרכזית אחת, כמה עצירות בדרך אם בא לכם, וארוחה שלא ממהרים ממנה.`,
        image: { src: "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "דיונות החול בדרום קורפו" },
        rainAlt: `<p>שימו לב: פנים ארמון אכיליון סגור לשיפוצים מ-2021, והביקור כיום הוא בגנים החיצוניים בלבד - כך שביום גשום עדיף לוותר עליו ולבחור פעילות מקורה. מומלץ במקום זאת מוזיאון שמן הזית של Mavroudis - משפחה המייצרת שמן זית מזה דורות. הסיור מתבצע בפנים, כולל הסברים מרתקים, טעימות סוגי שמנים שונים לצד לחם טרי וגבינות - חוויה קולינרית חמימה ונהדרת. אופציה נוספת: בילוי קניות מקורה בכפר בניצס (Benitses) הסמוך - סמטאותיו עמוסות בחנויות תכשיטים, בגדים ומזכרות, ולא מעט בתי קפה נעימים לשבת בהם עד שהגשם עובר.</p>`,
        dayArea: "דרום קורפו",
        dayBrief: {
            theme: `יום אחד, מקום אחד, בלי למהר לשום מקום`,
            pace: "relaxed",
            bestFor: ["nature", "beach", "food"],
            overview: `<p>הדרום הוא החלק של קורפו שרוב המבקרים מדלגים עליו, וזו בדיוק הסיבה ללכת אליו. אבל היום הזה בנוי אחרת משאר הטיול: <strong>יש בו תחנה מרכזית אחת</strong> - רצועת החול בין הים לאגם קוריסיון - וכל השאר הוא "אם בא לכם", לא "אחר כך".</p>
                <p>הסיבה פשוטה: זו הנסיעה הארוכה ביותר בטיול, והיא באה מיד אחרי יום פלאוקסטריצה שגם הוא ארוך. אז במקום לדחוס לתוכה ארבע תחנות, עדיף להגיע למקום אחד מיוחד ולהישאר בו כמה שבא לכם. אם בסוף היום תרגישו שראיתם "רק" את הדיונות ואכלתם ארוחה ארוכה מול המים - עשיתם את היום הזה נכון.</p>`,
            mustDo: [
                { title: `דיונות איסוס ואגם קוריסיון`, why: `אין עוד מקום כזה באי: רצועת חול בין ים פתוח לאגם מלוח, בלי מסעדות ובלי שמשיות. תישארו כמה שתרצו - אין שום דבר אחרי זה שחייבים להספיק.` }
            ],
            recommended: [
                { title: `גני ארמון אכיליון`, why: `אתם עוברים לידו ממש בדרך דרומה, אז אם בא לכם לעצור - הגנים והפסלים שווים שעה. רק דעו מראש שפנים הארמון סגור לשיפוצים מ-2021, אז אל תבנו עליו את הבוקר.` },
                { title: `ארוחת דגים ארוכה בבוקארי`, why: `כפר דייגים קטן על קו המים בצד המזרחי השקט. זו לא עצירה בדרך - זו הארוחה של היום, וכדאי להקצות לה את כל הערב.` }
            ],
            optional: [
                { title: `הכפר חלומוס`, why: `כפר הררי עם תצפית גם על הים היוני וגם על האדריאטי. הוא ממש על הדרך בין הדיונות לבוקארי - עצירה של חצי שעה אם התצפית קורצת לכם.` },
                { title: `שחייה בחליקונאס`, why: `אותה רצועת חול, קצת צפונה. רק אם הרוח נוחה - הצד הזה חשוף והים כאן לא תמיד רגוע.` }
            ],
            ifTired: `<p>אפשר לוותר גם על אכיליון וגם על חלומוס ולהפוך את זה ליום של מקום אחד: לצאת ב-10:30, להגיע לדיונות בצהריים, ולהישאר שם עד שמתחשק לאכול. זו לא גרסה מקוצצת של היום - זו כנראה הגרסה הכי טובה שלו.</p>`,
            ifEnergy: `<p>אם יצאתם מוקדם ואכיליון התברר כביקור קצר, בניצס נמצאת ממש על הכביש הראשי בדרך דרומה ולא מוסיפה נסיעה של ממש.</p>`,
            skipFirst: `אכיליון. הוא הראשון שיורד אם בא לכם בוקר איטי - במיוחד כל עוד פנים הארמון סגור.`,
            weather: {
                sun: `<p>קחו יותר מים ממה שנראה לכם שצריך, ואת כל הצל שאתם יכולים לשאת. באיסוס ובחליקונאס אין צל, אין קיוסק ואין מקלט מהשמש - זה אזור טבע מוגן, לא חוף מאורגן.</p>`,
                cloud: `<p>יום מעונן דווקא מקל על היום הזה: הדיונות והאגם נוחים בהרבה בלי שמש ישירה, והנסיעה הארוכה פחות מתישה. זה כנראה מזג האוויר האידיאלי לדרום.</p>`
            },
            highlights: [
                `רצועת החול בין הים היוני לאגם קוריסיון`,
                `ארוחה ארוכה על קו המים בבוקארי`,
                `יום שלם בלי לוח זמנים אמיתי`
            ],
            bestMoment: `הרגע שבו מבינים שאין שום תחנה אחרי הדיונות, ואפשר פשוט להישאר.`
        },
        closingNoteHtml: `<p>😌 <strong>קחו את הזמן:</strong> אם הדיונות תפסו אתכם ונשארתם שם עד אחר הצהריים, ויתרתם על חלומוס והגעתם לבוקארי רק לארוחה - זה לא "פספסתם", זה בדיוק היום הזה. הוא נבנה סביב מקום אחד, לא סביב רשימה.</p>`,
        transitions: {
            fromHotel: null,
            between: [
                { mode: "drive", min: 38, km: 20 },
                { mode: "drive", min: 30, km: 18 },
                { mode: "drive", min: 25, km: 11 },
                { mode: "drive", min: 12, km: 4, parking: "חניה בבוקארי" }
            ],
            toHotel: { mode: "drive", min: 40, km: 26 }
        },
        items: [
            { time: "08:30 בערך", title: `☕ בוקר איטי במלון`, html: `<div class="premium-event-desc"><p>אין שום סיבה למהר היום. היעד המרכזי הוא חוף פתוח שלא נסגר ולא מתמלא, אז ארוחת בוקר בנחת ויציאה סביב 09:30 היא בדיוק הקצב הנכון.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כלול במלון</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כמה שבא לכם - שעה זה סביר</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע - היום הכי לא דחוס בטיול</span></li></ul></div>` },
            { time: "10:15 בערך", title: `💡 ארמון אכיליון (Achilleion Palace) – אם בא לכם לעצור בדרך`, html: `<div class="premium-event-desc"><p>הארמון יושב ממש על הדרך דרומה, אז זו עצירה שקורית מעצמה אם מתחשק. ארמון הקיץ של סיסי, קיסרית אוסטריה, עם גנים מדורגים מלאי פסלים מהמיתולוגיה היוונית - כולל אכילס הגוסס. <strong>זו לא תחנת חובה:</strong> אם בא לכם בוקר איטי יותר, תעברו לידו בלי להרגיש שהחמצתם.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> <span data-price-flag-id="attr-2"></span></span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשעה - הגנים בלבד</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> מלכותי ושליו, נוף למפרץ ומצוין לצילום</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">ℹ️</span> <span><strong>לפני שמקצים לזה בוקר שלם:</strong> לפי ביקורות שנאספו, פנים הארמון סגור לשיפוצים מאז 2021 והביקור הוא בגנים החיצוניים בלבד. הגנים יפים, אבל לבדם זה ביקור של שעה - לא של שעתיים וחצי.</span></p>
                            </div>` },
            { time: "12:00 בערך", title: `⭐ דיונות איסוס (Issos / Halikounas) – הלב של היום`, html: `<div class="premium-event-desc"><p>רצועת החוף המפרידה בין הים היוני לאגם קוריסיון (Korission) היא המקום שבגללו נוסעים דרומה. אזור טבע מוגן עם דיונות חול שמזכירות מדבר, ים פתוח מצד אחד ואגם מלוח מהצד השני. <strong>זו התחנה היחידה ביום שכדאי לתכנן סביבה</strong> - כל השאר גמיש.</p><p>אין כאן שמשיות, קיוסקים או מסעדות, וזה בדיוק העניין. תישארו שעתיים או ארבע, לפי מה שמתחשק.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעתיים עד ארבע - כמה שבא לכם</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> פראי ופתוח - שונה מכל חוף אחר באי</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">😌</span> <span><strong>אין לאן למהר:</strong> שאר היום הוא עצירה אופציונלית וארוחה ארוכה. אם נשארתם כאן עד חמש - הכול עדיין עובד.</span></p>
                            </div>` },
            { time: "16:00 בערך", title: `🌿 הכפר חלומוס (Chlomos) – אם התצפית קורצת לכם`, html: `<div class="premium-event-desc"><p>כפר הררי קטן שיושב בדיוק בין הדיונות לבוקארי, כלומר אתם עוברים לידו ממילא. הסמטאות צרות והבתים צבעוניים, ומהקצה יש תצפית כפולה נדירה - גם על הים היוני וגם על האדריאטי. <strong>עצירה של חצי שעה, או בכלל לא.</strong></p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> 30-45 דקות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> כפרי ושליו - תצפית לשני ימים בו-זמנית</span></li></ul></div>` },
            { time: "17:00 ואילך", title: `🍽️ ארוחת דגים ארוכה בבוקארי (Boukari)`, html: `<div class="premium-event-desc"><p>כפר דייגים קטן ושקט על קו המים, בצד המזרחי של הדרום. <strong>זו לא "ארוחת צהריים" ואחריה "ארוחת ערב" - זו ארוחה אחת ארוכה</strong>, והיא הסיום של היום. שבו מול המים, הזמינו לאט, ואל תסתכלו על השעון.</p><div class="itinerary-dinner-slot" data-dinner-food-id="food-קפטן-אוקטופוס"><p>טוען המלצה...</p></div><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כ-20-30€ למנת פירות ים</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעתיים ומעלה - זו הפואנטה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> כפר דייגים בערב, בלי תפריט באנגלית</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">🚗</span> <span><strong>לזכור:</strong> מכאן חזרה למלון זו נסיעה של כ-40 דקות. אין שום דבר אחרי הארוחה, אז אפשר להישאר כמה שרוצים - רק קחו את זה בחשבון בכמות היין.</span></p>
                            </div>` }
        ]
    },
    {
        key: "6",
        dayNumber: 6,
        isAlt: false,
        icon: "🏜️",
        titleTemplate: `יום 6 ({weekday} {date}): הצפון הפראי – תצורות סלע, תעלת האהבה ושקיעות דרמטיות`,
        subtitleTemplate: `טיול אל קצוות האי הצפוניים המאופיינים בצוקי חימר לבנים, תעלות טבעיות בתוך הים וכפרי קצה.`,
        image: { src: "https://images.pexels.com/photos/409605/pexels-photo-409605.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "החוף הצפוני" },
        rainAlt: `<p>קייפ דראסטיס ותעלת האהבה סגופים לרוחות ולגשמים עזים ואינם מומלצים. במקום זאת, סעו לעיירה אכראבי (Acharavi) וטיילו ב<strong>מוזיאון הפולקלור</strong> המרתק המציג את החיים בקורפו במאות הקודמות. לאחר מכן, המשיכו לעיירה ארילס (Arillas) לסיור מודרך וטעימות במבשלת הבוטיק המקומית - <strong>Corfu Microbrewery</strong>, המייצרת בירות קראפט מעולות תחת קורת גג חמימה.</p>
                    <p>עוד שתי אופציות מקורות לאזור: <strong>מוזיאון שמן הזית של קורפו</strong>, המציג את תהליך ייצור שמן הזית המסורתי באי לצד טעימות; ו<strong>יקב Theotoky Estate</strong>, המזמין לסיור מודרך בין חביות היין וטעימות יינות מקומיים בסביבה מקורה ונעימה.</p>`,
        dayArea: "צפון-מערב קורפו",
        dayBrief: {
            theme: `היום היחיד שנבנה אחורה מהשקיעה`,
            pace: "balanced",
            bestFor: ["sunset", "scenic", "couples", "beach"],
            overview: `<p>זה לא יום של אתרים שצריך "לכסות" - יש בו בעצם דבר אחד גדול, השקיעה מעל צוקי לוגאס, וכל השאר מסודר סביבו. הצפון-מערב הוא הפינה הכי פחות ים-תיכונית בקורפו: צוקי חימר לבנים שנופלים ישר לים, אבן חול מפוסלת ברוח, וכפרים שנגמרים בבת אחת בקצה מצוק.</p>
                <p>שימו לב לנקודה אחת בתזמון: השקיעה ב-7.9 היא בסביבות <strong>20:03</strong> (הערכה - ראו ההערה בראש פרק המסלול), ולכן לא נצא מלוגאס לפניה. המשמעות היא שארוחת הערב היא אחרי 20:15, וההגעה חזרה למלון סביב 21:00. אם זה מאוחר מדי עבורכם, הפתרון הוא לוותר על תעלת האהבה בבוקר ולא לדחוס את השקיעה.</p>`,
            mustDo: [
                { title: `שקיעה מעל חוף לוגאס`, why: `הסיבה שהיום הזה קיים. המרפסת של 7th Heaven תלויה מעל התהום, והאור האחרון על צוקי החימר הוא מה שתזכרו מהיום.` }
            ],
            recommended: [
                { title: `תצפית קייפ דראסטיס`, why: `הנקודה הצפונית של האי, חצי שעה מהתעלה. חניה למעלה ושביל עפר קצר. אם השקיעה היא כל מה שבא לכם היום, אפשר להגיע ישר ללוגאס.` },
                { title: `תעלת האהבה בסידארי`, why: `סלעי אבן חול מרשימים וצילומים טובים, אבל זה גם החלק ההומה והתיירותי ביותר של היום.` }
            ],
            optional: [
                { title: `טבילה קצרה בסידארי`, why: `רק אם יצאתם מוקדם ויש עודף זמן לפני הצהריים - המים כאן רדודים ונוחים.` }
            ],
            ifTired: `<p>ותרו על תעלת האהבה וצאו מהמלון סביב 11:30 במקום 08:30. מגיעים ישר לדראסטיס לצהריים מאוחרים בפרולדס, ומשם ללוגאס לשקיעה. חוסך כשעתיים וחצי ולא פוגע בשום דבר מהותי.</p>`,
            ifEnergy: `<p>בדרך חזרה מזרחה אפשר לעצור באכראבי או בארילס - שתיהן על הציר ולא עיקוף אמיתי. שימו לב שזה ידחוף את הארוחה והחזרה למלון מאוחר יותר, אחרי יום שכבר ארוך.</p>`,
            skipFirst: `תעלת האהבה. היא הראשונה שיורדת מהיום אם משהו מתעכב - היא הכי עמוסה, והכי פחות ייחודית מבין שלוש התחנות.`,
            weather: {
                sun: `<p>יום מושלם ליום הזה בדיוק. כדאי לקחת כובע ומים - בדראסטיס ובלוגאס אין צל אמיתי ואין קיוסק, והשביל לתצפית חשוף לגמרי.</p>`,
                cloud: `<p>עננים דווקא לא הורסים כאן כלום - הם מוסיפים דרמה לצוקים הלבנים ולצילומים. מה שכן, שקיעה מעוננת עשויה להיות פחות מרשימה, אז אל תבנו עליה את כל היום: תעדפו את דראסטיס ואת התעלה, ותתייחסו לשקיעה כבונוס.</p>`
            },
            highlights: [
                `האור האחרון על צוקי החימר בלוגאס`,
                `הקצה הצפוני של האי בקייפ דראסטיס`,
                `ארוחת דגים בסידארי בדרך חזרה, בלי עיקוף`
            ],
            bestMoment: `עשרים הדקות שלפני 20:03 על המרפסת של 7th Heaven, כשהצוקים מתחילים לקבל צבע.`
        },
        closingNoteHtml: `<p>😌 <strong>קחו את הזמן:</strong> כל מה שלפני השקיעה הוא רשות. אם ישנתם עד מאוחר והגעתם רק ללוגאס בשש - קיבלתם את כל מה שהיום הזה מציע.</p>`,
        transitions: {
            fromHotel: null,
            between: [
                { mode: "drive", min: 29, km: 27, parking: "חניה בסידארי" },
                { mode: "drive", min: 8, km: 4.5 },
                { mode: "drive", min: 6, km: 2.5 },
                { mode: "drive", min: 13, km: 9 }
            ],
            toHotel: { mode: "drive", min: 27, km: 23 }
        },
        items: [
            { time: "08:45 בערך", title: `☕ בוקר רגוע במלון`, html: `<div class="premium-event-desc"><p>ארוחת בוקר במלון <span class="trip-private-hotel-name">המלון שלכם</span> לפני היציאה לצפון הפראי.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כלול במלון</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כ-45 דקות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע - התחלה קלילה ליום</span></li></ul></div>` },
            { time: "10:15 בערך", title: `🌿 תעלת האהבה (Canal d'Amour) – אם בא לכם`, html: `<div class="premium-event-desc"><p>הגיעו לסידארי התוססת ולכו לעבר תעלת האהבה המפורסמת. האגדה המקומית מספרת שזוג שישחה יחד לאורך התעלה יישאר יחד לנצח. גם אם המים קרים, זהו מקום טוב לצילומים עם סלעי אבן החול השכבתית הפיסוליים.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה - שעה וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> קליל ורומנטי - אגדה מקומית ותמונות מרשימות</span></li></ul></div>` },
            { time: "13:15 בערך", title: `💡 קייפ דראסטיס (Cape Drastis) וצהריים בפרולדס`, html: `<div class="premium-event-desc"><p>נסיעה קצרה מערבה תיקח אתכם לקייפ דראסטיס - הנקודה הצפונית ביותר בקורפו. החנו את הרכב למעלה ורדו ברגל בשביל העפר לתצפית מטריפה על צוקי חימר לבנים המזדקרים מהים. לאחר מכן, סעו לכפר Peroulades לארוחת צהריים מסורתית באחת הטברנות המקומיות.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות לתצפית; ארוחה כ-15€</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> 45 דקות לתצפית + כשעה לארוחה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> דרמטי ומרשים - קצה האי הצפוני</span></li></ul></div>` },
            { time: "17:00 בערך", title: `⭐ שקיעה מעל חוף לוגאס (Logas Beach) – הלב של היום`, html: `<div class="premium-event-desc"><p>רדו במדרגות לחוף לוגאס המצומצם היושב תחת צוקים אימתניים. זהו 'חוף השקיעה' הרשמי. מקומיים נוהגים למרוח את הבוץ מהצוקים על הגוף כטיפול ספא טבעי. בשקיעה, עלו לבית הקפה 7th Heaven, שבו יש מרפסת זכוכית התלויה באוויר מעל התהום לתמונת אינסטגרם מנצחת (שקיעה בסביבות 20:03 ב-7.9, הערכה משוערת - ראו הערה בראש פרק המסלול*).</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות לחוף; משקה בבית הקפה כ-8-12€</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשלוש שעות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> דרמטי ורומנטי - אחת השקיעות היפות בקורפו</span></li></ul></div>` },
            { time: "20:30 ואילך", title: `🍽️ ארוחת ערב בסידארי`, html: `<div class="premium-event-desc"><p>אחרי השקיעה בלוגאס, סידארי היא ממילא על הדרך חזרה דרומה - לא עיקוף. שם נמצאת מסעדת הדגים <strong>גיאלוס</strong>, שנפתחת ב-18:00 ולכן פתוחה בדיוק בשעה שתגיעו. אם אתם מותשים מהיום ולא בא לכם לעצור, אפשר גם פשוט להישאר ל-7th Heaven לארוחה קלה במקום שאתם כבר בו, או לראות את כל האפשרויות ב<a href="#" onclick="event.preventDefault(); openExploreFiltered('food', 'צפון קורפו');" class="text-blue-600 font-semibold hover:underline">📍 צפון קורפו ←</a>.</p><div class="itinerary-dinner-slot" data-dinner-food-id="food-גיאלוס"><p>טוען המלצה...</p></div></div>` }
        ]
    },
    {
        key: "7",
        dayNumber: 7,
        isAlt: false,
        icon: "🧳",
        titleTemplate: `יום 7 ({date}): יום העזיבה - צ'ק אאוט וטיסה חזרה`,
        subtitleTemplate: `הטיסה ממריאה ב-{departTime} - בוקר קצר ורגוע, בלי סיורים מרוחקים.`,
        image: null,
        rainAlt: null,
        dayBrief: {
            theme: `יום שמסתובב סביב שעה אחת: 09:00`,
            pace: "relaxed",
            bestFor: ["logistics"],
            overview: `<p>הטיסה ממריאה ב-13:10, אבל השעה שקובעת את כל הבוקר היא <strong>09:00</strong> - המועד שבו הרכב השכור חייב לחזור. משם והלאה אתם בלי רכב, כלומר כל מה שנשאר הוא מה שאפשר לעשות ברגל בשדה עצמו. לכן ארוחת הבוקר מוקדמת והאריזה נגמרת לפניה, לא אחריה.</p>
                <p>אל תתפתו לעצירה אחרונה בדרך. בין החזרת רכב לטיסה בינלאומית אין מרווח אמיתי, וזו לא השעה לגלות שהתור בדלפק ארוך מהצפוי.</p>`,
            mustDo: [
                { title: `להחזיר את הרכב עד 09:00`, why: `זו נקודת הזמן היחידה ביום שאי אפשר להזיז, והכול לפניה מסודר לפיה.` },
                { title: `לסיים לארוז לפני ארוחת הבוקר`, why: `הבוקר קצר מהרגיל. אריזה אחרי הארוחה היא מה שגורם לפספס את 09:00.` }
            ],
            recommended: [
                { title: `להגיע לדלפק הצ׳ק-אין סביב 11:10`, why: `כשעתיים לפני טיסה בינלאומית. השדה קטן והביטחון מהיר יחסית, אבל הדלפקים לא נפתחים מוקדם.` }
            ],
            ifTired: `<p>אין מה לקצר כאן בלי לסכן את הטיסה. אם אתם עייפים, ותרו על ארוחת בוקר מסודרת במלון וקחו קפה בשדה - זה הזמן היחיד שבאמת גמיש הבוקר.</p>`,
            highlights: [
                `בוקר קצר ומסודר, בלי סיורים מרוחקים`,
                `הרכב חוזר בזמן, בלי ריצה`
            ],
            bestMoment: `הקפה בשדה אחרי שהרכב כבר הוחזר וכלום כבר לא תלוי בכם.`
        },
        dayArea: "גוביה ↔ שדה התעופה",
        closingNoteHtml: `<p>😌 <strong>קחו את הזמן:</strong> אין מה לאלתר היום. הדבר היחיד שלא זז הוא החזרת הרכב ב-09:00 - כל השאר מסתדר סביבו מעצמו.</p>`,
        transitions: {
            fromHotel: null,
            between: [
                null,
                { mode: "drive", min: 18, km: 8 },
                null
            ],
            toHotel: null
        },
        items: [
            { time: "07:45 - 08:30", title: `☕ ארוחת בוקר אחרונה במלון וסידור מזוודות`, html: `<div class="premium-event-desc"><p>ארוחת בוקר במלון <span class="trip-private-hotel-name">המלון שלכם</span>. הבוקר הזה מתחיל מוקדם יותר מהרגיל כי הרכב השכור (<span class="trip-private-car-ref">פרטי ההזמנה שלכם</span>) חייב לחזור לשדה עד 09:00 - כדאי לסיים לארוז מבעוד מועד ולא להשאיר את זה לרגע האחרון.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כלול במלון</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כ-45 דקות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> יעיל אך לא נסער - הזמן חשוב הבוקר הזה</span></li></ul></div>` },
            { time: "08:30 - 09:00", title: `🚗 צ'ק-אאוט מהמלון, נסיעה לשדה והחזרת הרכב השכור`, html: `<div class="premium-event-desc"><p>צ'ק-אאוט מהמלון (בקשו לבצע אותו מוקדם אם צריך - הרכב חייב להיות בחזרה עד 09:00 בדיוק). מגוביה לשדה התעופה זו נסיעה ישירה של כ-15-20 דקות (כ-8 ק"מ) על כביש החוף ודרך פרברי העיר.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> מיכל דלק מלא נדרש בהחזרה (בדקו את תנאי ההשכרה)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כ-30 דקות, ללא מרווח לעצירות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> ממוקד - יעד ברור, בלי סטיות</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">⛽</span> <span><strong>טיפ:</strong> תדלקו בתחנה קרובה לשדה ממש לפני ההחזרה, כדי לא לשלם קנס תדלוק של חברת ההשכרה. יש תחנות דלק גם לאורך הדרך מגוביה לעיר.</span></p>
                                <p class="flex items-start gap-2"><span class="text-lg">⚠️</span> <span><strong>קריטי:</strong> הרכב השכור (<span class="trip-private-car-ref">פרטי ההזמנה שלכם</span>) חייב לחזור עד 09:00 - אל תתכננו שום עצירה בדרך לשדה הבוקר הזה.</span></p>
                            </div>` },
            { time: "09:00 - 11:10", title: `☕ זמן חופשי בשדה (בלי רכב)`, html: `<div class="premium-event-desc"><p>הרכב כבר הוחזר, אז מכאן זה כל מה שאפשר לעשות רגלית באזור השדה עצמו - בית קפה או פינת ישיבה עד שדלפקי הצ'ק-אין נפתחים (בדרך כלל כשעתיים-שלוש לפני ההמראה). אין טעם לתכנן קניות מזכרות אחרונות מחוץ לשדה - בלי רכב זה לא מעשי במרווח הזה.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> לפי קפה/חטיף בשדה</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשעתיים</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע - אין יותר מה למהר אליו</span></li></ul></div>` },
            { time: "11:10 - 13:10", title: `✈️ צ'ק-אין, ביטחון והמראה`, html: `<div class="premium-event-desc"><p>לטיסה בינלאומית מומלץ להגיע לדלפק הצ'ק-אין כשעתיים מראש - כלומר סביב 11:10. השדה קטן ותהליכי הביטחון מהירים יחסית. המראה בשעה 13:10 בדיוק לתל אביב.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות נוספת</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשעתיים (הגעה מראש ועד המראה)</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> יעיל - שדה קטן ותהליכים מהירים</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">🎉</span> <span>נחיתה בבן גוריון בשעה 15:35 - טיסה ישירה קצרה. שיהיה טיסה נעימה!</span></p>
                            </div>` }
        ]
    },
    {
        key: "alt-paxos",
        dayNumber: null,
        isAlt: true,
        icon: "⛴️",
        hint: `🔄 חלופה: החליפו יום זה אם יש תחזית ים רגועה ורוחות חלשות (טיולי השייט מבוטלים ברוח/גלים - נצלו יום שקט)`,
        title: `שייט לאיי פאקסוס ואנטי-פאקסוס (Paxos / Antipaxos)`,
        subtitle: `יום הפלגה לשרשרת האיים הדרומית המציעה מים בצבע טורקיז קריבי ועיירות ציוריות פסטליות.`,
        image: { src: "https://images.pexels.com/photos/1032652/pexels-photo-1032652.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Boat Trip Paxos" },
        rainAlt: `<p>חשוב לדעת: ספינות הנוסעים לפאקסוס מבוטלות כליל במידה ויש גשם ורוחות. במקום להיעצב, הפכו את היום ליום תרבות ופינוק! סעו ל<strong>כפר דניליה (Danilia Village)</strong> - כפר מלאכותי פסטורלי (שבו צולמה הסדרה "משפחת דארל") המשחזר באופן מופתי את קורפו של המאה ה-19 (יש לבדוק שעות פתיחה מראש). לאחר מכן, הזמינו חצי יום ספא במלון מרינה או מלון היוקרה Domes Miramare וסיימו בשתיית קוקטייל בלובי המפואר.</p>`,
        dayBrief: {
            theme: `היום היחיד שבו אתם לא נוהגים`,
            pace: "relaxed",
            bestFor: ["water", "beach", "villages", "couples"],
            overview: `<p>אחרי חמישה ימים של כבישים מתפתלים, יום שלם שבו מישהו אחר מנווט הוא שינוי קצב אמיתי - וזו חצי מהסיבה לעשות אותו. החצי השני הוא הצבע: המים סביב אנטי-פאקסוס נחשבים מהצלולים ביוון, וזה נראה אחרת ממה שראיתם עד כה בקורפו עצמה.</p>
                <p>התלות היחידה כאן היא הים. שייט מבוטל ברוח ובגלים, ולכן היום הזה נועד להיות מוחלף לתוך תחזית טובה - לא להיקבע מראש. זו הסיבה שהוא יושב כאן כיום חלופי ולא כיום ממוספר.</p>`,
            mustDo: [
                { title: `שחייה במפרץ ווטומי`, why: `הצבע שבגללו באתם. קפיצה מהספינה למים היא החוויה שמספרים עליה אחר כך.` },
                { title: `העיירה גאיוס`, why: `בירת פאקסוס - תעלה ימית שמוסתרת מאחורי איון קטן, וסמטאות שאפשר לשוטט בהן שעתיים בלי תוכנית.` }
            ],
            recommended: [
                { title: `להגיע לנמל מוקדם`, why: `יש כמה חברות מתחרות והנמל משתנה לפי ההזמנה - קורפו טאון או לפקימי. שווה לוודא מאיפה בדיוק אתם יוצאים.` }
            ],
            ifTired: `<p>אין הרבה מה לקצר ביום שמתנהל לפי לוח זמנים של ספינה. מה שכן - בגאיוס אפשר פשוט לשבת בבית קפה על התעלה במקום לשוטט, וזה עדיין יום מלא.</p>`,
            ifEnergy: `<p>אם השייט חוזר מוקדם ואתם עדיין עם כוח, אתם ממילא בדרום - אבל שימו לב שיום שלם בשמש ובמלח מתיש יותר ממה שהוא מרגיש בזמן אמת.</p>`,
            weather: {
                sun: `<p>ים שקט ורוח חלשה הם התנאי להפעלת השייט בכלל, ולכן זה בדיוק היום להחליף אליו. קחו כובע שלא עף וקרם עמיד במים - על סיפון אין צל לאורך זמן.</p>`,
                cloud: `<p>עננות בלי רוח עדיין מאפשרת שייט, אבל הצבע של המים - העיקר כאן - תלוי באור ישיר. אם התחזית אפורה, עדיף להשאיר את היום הזה כאופציה ולא להחליף אליו.</p>`
            },
            highlights: [
                `לקפוץ מהספינה למים של ווטומי`,
                `התעלה הימית שמובילה לנמל של גאיוס`,
                `יום שלם בלי מפתחות רכב`
            ],
            bestMoment: `הכניסה לגאיוס דרך התעלה, כשהעיירה נפתחת בבת אחת.`
        },
        dayArea: "דרום קורפו - שייט לפאקסוס",
        closingNoteHtml: `<p>😌 <strong>קחו את הזמן:</strong> הספינה קובעת את היום, אבל רק את ההתחלה והסוף. בגאיוס אין שום דבר שחייבים לראות - בית קפה על התעלה זו תשובה מצוינת לשאלה מה לעשות שם.</p>`,
        transitions: {
            fromHotel: { mode: "drive", min: 15, km: 9, parking: "חניה ליד הנמל ליום שלם" },
            between: [
                { mode: "boat" },
                { mode: "boat" }
            ],
            toHotel: { mode: "drive", min: 15, km: 9, boatFirst: true }
        },
        items: [
            { time: "08:00 - 10:30", title: `⚓ יציאה לנמל והפלגה`, html: `<div class="premium-event-desc"><p>הגעה מוקדמת לנמל - קורפו טאון או לפקימי, בהתאם לחברת השייט הספציפית שתזמינו (יש כמה חברות מתחרות, ראו הפניה למידע על המעבורות/שייטים בפרק "מידע מעשי"). העלייה לספינה מלווה בבריזה בוקר נעימה. השייט כולל נופים של קו החוף הדרומי ולאחר כשעה וחצי תגיעו לאי הקטנטן אנטי-פאקסוס.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ⚠️ טיול שייט יומי מאורגן לפאקסוס/אנטיפאקסוס עולה בדרך כלל כ-45-70€ לאדם (למבוגר, כולל את שתי העצירות המתוארות למטה) - מחיר משוער להזמנה מראש, תלוי בחברה ובעונה, יש לוודא מול הספק שתבחרו</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשעתיים וחצי הפלגה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע ונעים - פתיחה נעימה ליום השייט</span></li></ul></div>` },
            { time: "10:30 - 13:00", title: `🤿 שחייה בחוף ווטומי והמערות הכחולות`, html: `<div class="premium-event-desc"><p>הספינה תעגון במפרץ ווטומי (Voutoumi) - מהחופים היפים בעולם בזכות צבע הטורקיז הזוהר של מימיו וקפלו עצי זית גולשים לים. קפיצה למים מהספינה היא חוויה חובה! לאחר מכן, הפלגה לתוך המערות הכחולות המרשימות שבמערב פאקסוס.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כלול במחיר טיול השייט שהוזמן מראש (ראו הערת המחיר בסעיף הקודם)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשעתיים וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> קסום - מים טורקיז זוהרים, חובה לקפוץ למים</span></li></ul></div>` },
            { time: "13:00 ואילך", title: `⭐ העיירה גאיוס (Gaios) – בלי לוח זמנים`, html: `<div class="premium-event-desc"><p>עגינה בבירת פאקסוס - גאיוס. תעלה ימית מהממת מוסתרת על ידי איון קטן מובילה לנמל. יהיו לכם כמה שעות לשוטט בסמטאות עמוסות בוטיקים אופנתיים, לאכול ארוחת צהריים (פירות ים טריים!) ולטעום גלידה מקומית בכיכר המרכזית.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ארוחת צהריים כ-20-25€</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשלוש שעות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> ציורי ואופנתי - בירת פאקסוס הקטנה</span></li></ul></div>` }
        ]
    },
    {
        key: "alt-pantokrator",
        dayNumber: null,
        isAlt: true,
        icon: "⛰️",
        hint: `🔄 חלופה: החליפו יום זה ביום עם שמיים בהירים וללא ערפל (הנוף מהפסגה תלוי בראות - הימנעו בימים מעוננים/גשומים)`,
        title: `הפסגה הגבוהה ביותר וכפר רפאים קולינרי`,
        subtitle: `מסע בין עננים לפסגת הפנטוקרטור וירידה לכפר הנטוש פלאיה פריתיה.`,
        image: { src: "https://images.pexels.com/photos/934063/pexels-photo-934063.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Pantokrator Mountain" },
        rainAlt: `<p>אזהרה חשובה: אם יורד גשם או שיש ערפל כבד, <strong>אל תטפסו להר פנטוקרטור ברכב</strong>! הראות בפסגה תהיה אפסית והכביש מסוכן. לעומת זאת, הכפר הנטוש פלאיה פריתיה הוא המקום היפה והדרמטי ביותר בקורפו ביום גשום וערפילי! סעו לאט רק עד לכפר (הכביש לשם בטוח יותר). הצטיידו במטריה, טיילו בין החורבות האפופות ערפל קסום ולאחר מכן היכנסו לטברנה המקומית, שבו ליד קמין העצים והזמינו נזיד חם וכוס יין אדום מקומי לסיום נעים של החופשה.</p>`,
        closingNoteHtml: `<p id="alt-pantokrator-closing-note" class="text-sm text-purple-800 bg-purple-50 border border-purple-100 rounded-xl p-4 mt-2">שימו לב: אלא אם החלפתם ביום זה ספציפית את יום 6 (בבורר למעלה), זו לא ה"ארוחה האחרונה" של הטיול - היא פשוט ארוחת ערב יפה בכפר הררי ציורי. יום 7 (עזיבה) תמיד ממשיך אחריה כרגיל.</p>`,
        dayBrief: {
            theme: `906 מטר, ואז כפר שאיש לא חזר אליו`,
            pace: "balanced",
            bestFor: ["nature", "villages", "scenic", "food"],
            overview: `<p>שני מקומות, ניגוד אחד גדול. פנטוקרטור הוא הנקודה הגבוהה בקורפו, ומהפסגה - ביום בהיר - רואים את אלבניה ואת שרשרת האיים מדרום. פלאיה פריתיה שמתחתיו היא ההפך: הכפר העתיק באי, שננטש כמעט לגמרי בשנות ה-60 ונשאר עומד.</p>
                <p>שימו לב לשני דברים. הראשון - <strong>היום הזה תלוי לחלוטין בראות</strong>: בערפל אין מה לעלות, וזו הסיבה שהוא יושב כיום חלופי שמחליפים אליו לפי תחזית. השני - הוא נגמר מוקדם, סביב 16:30, ואתם חוזרים למלון לפני 17:15. זה היום היחיד בטיול שמחזיר לכם ערב שלם.</p>`,
            mustDo: [
                { title: `הפסגה של פנטוקרטור`, why: `הנוף היחיד באי שמראה לכם את כל האי בבת אחת. הכביש מתפתל מאוד - סעו לאט, וזו לא נסיעה לעשות בערפל.` },
                { title: `פלאיה פריתיה`, why: `מאות בתי אבן ונציאניים חרבים ואתר מורשת. שקט בצורה שקשה למצוא בקורפו בספטמבר.` }
            ],
            recommended: [
                { title: `ארוחה בטברנה בכפר`, why: `למרות שזה "כפר רפאים", פועלות בו טברנות שמושכות מקומיים - וזה המקום לאוכל הררי מנחם ולא לדגים.` }
            ],
            ifTired: `<p>אפשר לעשות רק את הכפר בלי הפסגה: הכביש אליו נוח יותר, והוא גם המקום שמחזיק את עצמו גם בלי הנוף מלמעלה.</p>`,
            ifEnergy: `<p>אתם חוזרים לפני 17:15 - זה מספיק זמן לערב שלם באזור המלון בלי למהר לשום מקום. אחרי יומיים של נהיגה ארוכה, זו לא בזבוז אלא בדיוק הרעיון.</p>`,
            skipFirst: `הפסגה - אבל רק בגלל מזג האוויר, לא בגלל סדר עדיפויות. בראות טובה היא הסיבה שהיום הזה קיים.`,
            weather: {
                sun: `<p>יום בהיר וללא אובך הוא כל העניין: זה ההבדל בין לראות את אלבניה ואת האיים לבין לראות אנטנה. קחו שכבה קלה - בפסגה קריר ופתוח לרוח גם בספטמבר.</p>`,
                cloud: `<p>עננות נמוכה מבטלת את הפסגה בפועל. אם זה המצב, רדו ישר לפלאיה פריתיה - הכפר דווקא נראה טוב יותר באור אפור ובערפל קל.</p>`
            },
            highlights: [
                `כל האי בבת אחת מהפסגה, בתנאי שהראות טובה`,
                `כפר אבן שננטש ונשאר עומד`,
                `לחזור למלון לפני 17:15 עם ערב פנוי`
            ],
            bestMoment: `השקט בסמטאות פלאיה פריתיה, כשקולטים שאין שם כמעט אף אחד.`
        },
        dayArea: "צפון-מזרח ההררי (פנטוקרטור)",
        transitions: {
            fromHotel: { mode: "drive", min: 40, km: 20 },
            between: [
                { mode: "drive", min: 20, km: 9 },
                { mode: "walk", min: 3 }
            ],
            toHotel: { mode: "drive", min: 35, km: 22 }
        },
        items: [
            { time: "09:00 - 11:30", title: `🏔️ טיפוס ברכב להר פנטוקרטור (Mount Pantokrator)`, html: `<div class="premium-event-desc"><p>נסיעה במעלה ההר הגבוה ביותר בקורפו (906 מטר). הדרך מלאה בפיתולים (סעו בזהירות!). בפסגה מחכה לכם מנזר פעיל ואנטנת תקשורת עצומה. הנוף ביום בהיר מאפשר לראות את כל צורת האי, את אלבניה הסמוכה, ואפילו את חופי איטליה באופק הרחוק.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות (מלבד דלק הנסיעה)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעתיים וחצי (כולל הנסיעה המפותלת)</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> מרשים ופראי - נוף פנורמי לכל האי</span></li></ul></div>` },
            { time: "12:00 - 14:00", title: `🏚️ פלאיה פריתיה (Old Perithia) – שוטטות בזמן`, html: `<div class="premium-event-desc"><p>ירידה קצרה מהפסגה אל הכפר העתיק ביותר באי שזכה למעמד "אתר מורשת". הכפר ננטש לחלוטין בשנות ה-60 וכיום ניתן לשוטט בין מאות בתי אבן ונציאניים חרבים ו-8 כנסיות מתפוררות, ביניהם כבשים רועות בחופשיות.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות כניסה</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעתיים</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> מסתורי ונוגה - כפר רפאים אותנטי</span></li></ul></div>` },
            { time: "14:00 ואילך", title: `🥘 ארוחה ארוכה מול האח בפלאיה פריתיה`, html: `<div class="premium-event-desc"><p>למרות היותו "כפר רפאים", פועלות בפלאיה פריתיה מספר טברנות מופלאות שמושכות מקומיים בסופי שבוע. שבו ב-<em>Ognistra</em> או ב-<em>Foros</em>. זה המקום לנסות מאכלים מנחמים ועמוקים, במיוחד פשטידות מקומיות (Pita) ובשרים בבישול ארוך.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כ-15-20€ למנה</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעתיים וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> חמים ומנחם - ארוחה כפרית אותנטית בלב ההרים</span></li></ul></div>` }
        ]
    }
];

// Resolves a numbered day's {date}/{weekday}/{arriveTime}/{departTime}
// title/subtitle tokens against the live TRIP_CONFIG (js/dashboard.js) -
// the same single source of truth injectTripDates() uses for every other
// date/time on the page. Falls back to the raw template (tokens left in
// place) if TRIP_CONFIG/its date helpers aren't loaded yet, which should
// never actually happen since this is only ever called at render time,
// well after every <script> tag - including dashboard.js - has already
// executed (see js/itinerary-view.js).
function gtItineraryResolveTemplate(template, dayNumber) {
    if (!template) return '';
    if (template.indexOf('{') === -1) return template;
    const haveHelpers = typeof TRIP_CONFIG !== 'undefined' && typeof dateForTripDay === 'function' &&
        typeof formatDateDM === 'function' && typeof formatWeekdayHe === 'function' && typeof formatTimeHM === 'function';
    if (!haveHelpers) return template;
    const date = dateForTripDay(dayNumber);
    return template
        .replace('{weekday}', formatWeekdayHe(date))
        .replace('{date}', formatDateDM(date))
        .replace('{arriveTime}', formatTimeHM(TRIP_CONFIG.outboundArrival))
        .replace('{departTime}', formatTimeHM(TRIP_CONFIG.returnDeparture));
}

// Real, plain-text title/subtitle for a day/alt-card entry - resolves the
// date/time template for numbered days, passes optional-card title/
// subtitle through unchanged. Used both by the itinerary-view render path
// and by search.js's index (so a search haystack always contains the same
// real date text a viewer would actually see).
function gtItineraryDayTitle(day) {
    return day.isAlt ? day.title : gtItineraryResolveTemplate(day.titleTemplate, day.dayNumber);
}
function gtItineraryDaySubtitle(day) {
    return day.isAlt ? day.subtitle : gtItineraryResolveTemplate(day.subtitleTemplate, day.dayNumber);
}

function findItineraryDay(key) {
    return (window.ITINERARY_DAYS || []).find(d => d.key === String(key));
}

window.gtItineraryResolveTemplate = gtItineraryResolveTemplate;
window.gtItineraryDayTitle = gtItineraryDayTitle;
window.gtItineraryDaySubtitle = gtItineraryDaySubtitle;
window.findItineraryDay = findItineraryDay;
