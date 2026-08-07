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
        routeInfo: {
            area: "שדה התעופה ← גוביה (קבוע - שעות טיסה)",
            fixed: true,
            route: ["שדה התעופה (CFU)", "המלון (גוביה)"],
            legs: [
                { from: "שדה התעופה (CFU)", to: "המלון (גוביה)", km: 8, min: 18, note: "כביש חוף ישיר, ללא כבישי הרים - משוער" }
            ],
            totalKm: 8,
            totalMin: 18,
            parking: "אין צורך בהחלפת חניה - נסיעה ישירה אחת מהשדה למלון.",
            walking: null,
            estimateNote: "מרחק/זמן משוער (לא נמדד בניתוב חי) - יום זה קבוע לפי שעת הנחיתה ואינו חלק מהאופטימיזציה הגיאוגרפית."
        },
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
        image: { src: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&q=80&w=1200", alt: "Corfu Town" },
        rainAlt: `<p>במקום תצפיות ומבצרים בחוץ, העיר מציעה מוזיאונים פנימיים מרתקים:</p>
                    <ul class="list-disc list-inside space-y-2 ml-4">
                        <li><strong>מוזיאון האמנות האסיאתית:</strong> אוסף עצום ומפתיע מהמזרח הרחוק בתוך ארמון מרשים.</li>
                        <li><strong>המוזיאון הארכיאולוגי של קורפו:</strong> ליד חוף גריצה; מציג ממצאים מהעת העתיקה כולל הגמלון המפורסם של גורגו ממקדש ארטמיס. ⚠️ שעות וכרטיס משולב עשויים להשתנות לפי עונה - מומלץ לאמת לפני ההגעה.</li>
                        <li><strong>Casa Parlante:</strong> אחוזה מהמאה ה-19 שקמה לתחייה באמצעות רובוטים אנימטרוניים.</li>
                        <li><strong>מפעל הסבון Patounis:</strong> סיור פנימי חינמי במפעל מסורתי לסבוני שמן זית.</li>
                    </ul>
                    <p>אכלו צהריים באחת הטברנות החמימות עם אח מבוערת באזור הקמפיילו.</p>`,
        routeInfo: {
            area: "קורפו טאון וחצי האי קאנוני (מרכז-דרום האי)",
            route: ["המלון (גוביה)", "הליסטון / קורפו טאון (חניה אחת)", "המבצר הישן + קמפיילו (הליכה)", "קאנוני / ולכרנה", "המלון (גוביה)"],
            legs: [
                { from: "המלון (גוביה)", to: "הליסטון / קורפו טאון", km: 8.5, min: 15, note: "כביש חוף ישיר - משוער" },
                { from: "הליסטון", to: "המבצר הישן ← קמפיילו וסנט ספירידון", km: 0, min: 0, walk: true, note: "הכל במרחק הליכה בעיר העתיקה - לא זזים עם הרכב" },
                { from: "קורפו טאון (החניון)", to: "קאנוני / ולכרנה", km: 4.5, min: 12, note: "משוער" },
                { from: "קאנוני", to: "המלון (גוביה)", km: 12, min: 20, note: "חזרה דרך פרברי העיר - משוער" }
            ],
            totalKm: 25,
            totalMin: 47,
            parking: "חנו פעם אחת ליד כיכר הספיאנדה/הליסטון (חניון בתשלום, כ-3€ לשעה) ועשו את כל העיר העתיקה - הליסטון, המבצר הישן, קמפיילו וסנט ספירידון - ברגל. חזרו לרכב רק לנסיעה הקצרה לקאנוני, שם יש חניה נפרדת ליד המנזר.",
            walking: "כל אזור העיר העתיקה (הליסטון → המבצר הישן → קמפיילו) הוא מקטע הליכה אחד רציף, כ-1.5 ק\"מ הלוך-חזור - זו הסיבה שהחניה נשארת קבועה במקום אחד לאורך כל הבוקר.",
            estimateNote: "מרחקים/זמנים משוערים לפי נתוני ניתוב כלליים (לא ניתוב חי בזמן אמת) - יש לאמת מול Google Maps/Waze ביום הנסיעה."
        },
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
            { time: "08:00 - 08:30", title: `☕ ארוחת בוקר במלון`, html: `<div class="premium-event-desc"><p>ארוחת בוקר במלון <span class="trip-private-hotel-name">המלון שלכם</span> לפני היציאה לקורפו טאון.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כלול במלון</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כחצי שעה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע - התחלה קלילה ליום</span></li></ul></div>` },
            { time: "08:30 - 09:30", title: `☕ עצירת קפה מול הליסטון (The Liston)`, html: `<div class="premium-event-desc"><p>התחילו את הסיור בטיילת הליסטון המפורסמת שנבנתה בהשראת רחוב ריבולי בפריז. שבו באחד מבתי הקפה האלגנטיים, הזמינו קפה פרדו וצפו בעיר מתעוררת לחיים מול כיכר הספיאנדה הרחבה. שרידי המורשת הבריטית ניכרים כאן ממש - בקצה הצפוני של הספיאנדה שוכן מגרש הקריקט היחיד ביוון, שהוקם עוד בתקופת השלטון הבריטי במאה ה-19 ופעיל עד היום.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כ-4-6€ לקפה (ארוחת הבוקר עצמה כלולה במלון)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כחצי שעה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> אלגנטי ואירופאי - נהדר לצפייה בעיר מתעוררת</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">🚗</span> <span><strong>חניה:</strong> <a href="https://www.google.com/maps/search/?api=1&amp;query=39.6225,19.9234" class="text-blue-600 hover:text-blue-800 font-medium underline">Spianada Square Parking</a> (כ-3€ לשעה). חובה להגיע לפני 09:00.</span></p>
                                <p class="flex items-start gap-2"><span class="text-lg">📸</span> <span><strong>נקודת צילום:</strong> קשתות האבן המרשימות של הליסטון באור הבוקר.</span></p>
                            </div>` },
            { time: "09:30 - 12:00", title: `🏰 המבצר הישן (Palaio Frourio)`, html: `<div class="premium-event-desc"><p>חצו את התעלה מעל הים והיכנסו למבצר הוונציאני. טפסו עד לצלב שבפסגה לתצפית של 360 מעלות על העיר העתיקה, המפרץ והרי אלבניה באופק. ההליכה היא בעלייה מתונה.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ראו מחיר מאומת בכרטיס האתר (פרק אטרקציות)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה - שעה וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> היסטורי ומרשים - נוף פנורמי בתמורה לטיפוס מתון</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">💡</span> <span><strong>טיפ:</strong> נעלו נעליים נוחות.</span></p>
                                <div data-price-flag-id="attr-10"></div>
                            </div>` },
            { time: "12:00 - 14:00", title: `🛍️ שוטטות בקמפיילו (Campiello) וכנסיית סנט ספירידון`, html: `<div class="premium-event-desc"><p>לכו לאיבוד בסמטאות הצרות והציוריות של הרובע העתיק. הבניינים בצבעי פסטל עם כביסה תלויה מזכירים את נאפולי. בקרו בכנסיית סנט ספירידון (פטרון האי) ורכשו מזכרות מקומיות כמו סבוני שמן זית וליקר קומקוואט.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כניסה לכנסייה ללא עלות (תרומה מומלצת)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה - שעה וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> ציורי ואינטימי - מצוין לשוטטות ולצילום</span></li></ul></div>` },
            { time: "14:00 - 15:30", title: `🍽️ ארוחת צהריים מסורתית`, html: `<div class="premium-event-desc"><p>שבו באחת הטברנות בעיר העתיקה (למשל Marina's Tavern). חובה לטעום את המנות הקורפיות הקלאסיות: Pastitsada (פסטה עם תבשיל בקר בתבלינים) או Sofrito (בקר ברוטב יין לבן ושום).</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כ-15-20€ למנה</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה - שעה וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> אותנטי - טברנה מקומית בלב העיר העתיקה</span></li></ul></div>` },
            { time: "15:30 - 18:00", title: `✈️ קאנוני (Kanoni), מנזר ולכרנה ותצפית מטוסים`, html: `<div class="premium-event-desc"><p>סעו כ-15 דקות לחצי האי קאנוני. רדו למנזר Vlacherna האייקוני. לכו על גשר הולכי הרגל החוצה את המפרץ והרגישו את המטוסים נוחתים ממש מעל לראשכם.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות (מלבד חניה, במידת הצורך)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה וחצי - שעתיים</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> ייחודי ומרגש - אטרקציה חינמית ונדירה</span></li></ul></div>
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
        routeInfo: {
            area: "החוף הצפון-מזרחי (Barbati → Kalami → Agni → Kassiopi)",
            route: ["המלון (גוביה)", "חוף ברבטי", "מפרץ קאלאמי", "מפרץ אגני", "קסיופי", "המלון (גוביה)"],
            legs: [
                { from: "המלון (גוביה)", to: "חוף ברבטי", km: 13, min: 18, note: "כביש חוף - משוער" },
                { from: "ברבטי", to: "קאלאמי", km: 8.5, min: 15, note: "כביש חוף מתפתל - משוער" },
                { from: "קאלאמי", to: "אגני", km: 1, min: 5, note: "מפרצים סמוכים ממש - משוער" },
                { from: "אגני", to: "קסיופי", km: 11, min: 20, note: "משוער" },
                { from: "קסיופי", to: "המלון (גוביה)", km: 35, min: 45, note: "חזרה לאורך כביש החוף - משוער" }
            ],
            totalKm: 68.5,
            totalMin: 103,
            parking: "זהו יום של 'חניה-הליכה-נסיעה' לאורך כביש חוף: כל מפרץ (ברבטי, קאלאמי, אגני, קסיופי) הוא חניון קטן נפרד - אין דרך לחנות פעם אחת ולהגיע לכולם ברגל, כי הם מחוברים בכביש הרים תלול לאורך הצוק. סדר העצירות שומר על נסיעה חד-כיוונית צפונה לאורך כל הבוקר/צהריים, ורק בסוף היום יש נסיעת חזרה ארוכה אחת לגוביה - במקום לחזור ולצאת שוב.",
            walking: "בקאלאמי ובאגני ההליכה מהחניה לים קצרה (כמה עשרות מטרים); בקסיופי יש הליכה נעימה מהנמל למבצר הביזנטי (כ-10 דקות).",
            estimateNote: "מרחקים/זמנים משוערים על סמך נתוני דרכים כלליים לחוף הצפון-מזרחי - כבישים צרים ותיירות קיץ יכולים להאריך את הזמנים בפועל; יש לאמת מול Google Maps/Waze ביום הנסיעה."
        },
        transitions: {
            fromHotel: null,
            between: [
                { mode: "drive", min: 18, km: 13 },
                { mode: "drive", min: 15, km: 8.5 },
                { mode: "drive", min: 5, km: 1 },
                { mode: "drive", min: 20, km: 11, parking: "חניה בקסיופי ליד הנמל" }
            ],
            toHotel: { mode: "drive", min: 45, km: 35 }
        },
        items: [
            { time: "08:00 - 08:45", title: `☕ ארוחת בוקר במלון`, html: `<div class="premium-event-desc"><p>ארוחת בוקר במלון <span class="trip-private-hotel-name">המלון שלכם</span> לפני היציאה לחוף הצפון-מזרחי.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כלול במלון</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כ-45 דקות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע - התחלה קלילה ליום</span></li></ul></div>` },
            { time: "09:00 - 11:30", title: `🏖️ נסיעה וטבילת בוקר בחוף ברבטי (Barbati)`, html: `<div class="premium-event-desc"><p>סעו צפונה לאורך קו החוף. עצרו בחוף ברבטי - רצועת חוף ארוכה של חלוקי נחל לבנים ומים צלולים כבדולח, כשברקע מתנשא הר פנטוקרטור הירוק. שכרו מיטת שיזוף או פשוט פרסו מגבת.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות לחוף עצמו; כ-10-15€ למיטת שיזוף (אופציונלי)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעתיים - שעתיים וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> נופי ומרגיע - מים צלולים ורקע הררי</span></li></ul></div>` },
            { time: "11:30 - 14:00", title: `🏡 מפרץ קאלאמי (Kalami) והבית הלבן של משפחת דארל`, html: `<div class="premium-event-desc"><p>המשך נסיעה (כ-20 דקות) אל קאלאמי. רדו אל המפרץ הציורי, בו נמצא "הבית הלבן" (The White House) שבו התגורר הסופר לורנס דארל בשנות ה-30. המקום פועל כיום כמסעדה ובית הארחה, ונעים לקפה מול סירות המפרש.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות כניסה (עלות רק אם עוצרים לאכול/לשתות)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה - שעה וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> נוסטלגי וספרותי - מפרץ ציורי במיוחד</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">🚗</span> <span><strong>חניה:</strong> לאורך הכביש היורד לחוף קאלאמי, היזהרו בסיבובים החדים.</span></p>
                            </div>` },
            { time: "14:00 - 16:30", title: `🦞 ארוחת צהריים יוקרתית במפרץ אגני (Agni Bay)`, html: `<div class="premium-event-desc"><p>אפשר להגיע לאגני בנסיעה קצרה או לקחת מונית מים קטנה מקאלאמי. מפרץ אגני מפורסם בטברנות הדגים המצוינות שבו, הממוקמות ממש על קו המים. מומלץ מאוד להזמין מקום מראש ב-<em>Toula's Gastronomy</em> או ב-<em>Taverna Agni</em>.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כ-30-40€ למנה (יוקרתי, פירות ים טריים)</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה וחצי - שעתיים</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> יוקרתי ורגוע - ישיבה על קו המים</span></li></ul></div>` },
            { time: "16:30 - 19:30", title: `🌅 העיירה קסיופי (Kassiopi) והמבצר הביזנטי`, html: `<div class="premium-event-desc"><p>סיימו את היום בקסיופי, כפר דייגים תוסס וגדול יותר. שוטטו סביב הנמל המלא סירות דיג עץ, טפסו להריסות המבצר הביזנטי שמשקיף על העיירה, ושבו באחד הברים על קו המים לדרינק של שקיעה (שקיעה בסביבות 20:06 ב-4.9, הערכה משוערת - ראו הערה בראש פרק המסלול*).</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כניסה למבצר ללא עלות</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעתיים - שלוש שעות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> תוסס ואותנטי - כפר דייגים עם שקיעה מהממת</span></li></ul></div>` }
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
        routeInfo: {
            area: "פלאוקסטריצה (חוף מערבי)",
            route: ["המלון (גוביה)", "מנזר פלאוקסטריצה", "חוף השייט (Ampelaki/Alipa)", "לאקונס ← אנגלוקסטרו", "חוף רוביניה (שקיעה)", "נמל פלאוקסטריצה (ארוחת ערב)", "המלון (גוביה)"],
            legs: [
                { from: "המלון (גוביה)", to: "מנזר פלאוקסטריצה", km: 14, min: 18, note: "משוער" },
                { from: "המנזר", to: "חוף השייט (Ampelaki/Alipa)", km: 1, min: 5, walk: true, note: "אותו מפרץ - הליכה/נסיעה קצרה" },
                { from: "חוף השייט", to: "לאקונס ← מבצר אנגלוקסטרו", km: 9, min: 18, note: "עלייה בכביש הררי - משוער" },
                { from: "אנגלוקסטרו", to: "חוף רוביניה", km: 5, min: 10, note: "ירידה בחזרה לכיוון החוף - משוער" },
                { from: "רוביניה", to: "נמל פלאוקסטריצה (ארוחת ערב)", km: 3, min: 8, note: "משוער" },
                { from: "נמל פלאוקסטריצה", to: "המלון (גוביה)", km: 14, min: 20, note: "משוער" }
            ],
            totalKm: 46,
            totalMin: 79,
            parking: "חנו בבוקר ליד המנזר/חוף השייט (Ampelaki או Alipa) - שני היעדים האלה הם אותו מפרץ, במרחק הליכה. אחר כך יש שתי נסיעות קצרות ובלתי נמנעות (לאנגלוקסטרו ולרוביניה) כי הם באתרים נפרדים לאורך אותו כביש חוף - אין דרך לאחד אותן בלי לוותר על אחד המקומות.",
            walking: "מהמנזר לחוף השייט - הליכה קצרה. באנגלוקסטרו - טיפוס תלול אך קצר (כ-15 דקות) מהחניה למבצר. ברוביניה - הליכה של כ-15-20 דקות דרך מטע זיתים מהחניה לחוף (אין גישת רכב עד הים עצמו).",
            estimateNote: "מרחקים/זמנים משוערים. שימו לב: הסדר נשמר בכוונה סביב אילוצי שעות היום (המנזר מוקדם לפני הפקקים, אנגלוקסטרו בשעות האור המלאות, רוביניה בשקיעה) גם אם זה מוסיף כמה ק\"מ לעומת סדר גיאוגרפי 'טהור' - זהו הפשרה הנכונה בין מרחק לחוויה."
        },
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
            { time: "07:30 - 08:00", title: `☕ ארוחת בוקר במלון`, html: `<div class="premium-event-desc"><p>ארוחת בוקר מוקדמת במלון <span class="trip-private-hotel-name">המלון שלכם</span> - יוצאים מוקדם כדי להקדים את פקקי האוטובוסים בפלאוקסטריצה.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כלול במלון</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כחצי שעה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע - התחלה קצרה, יציאה מוקדמת</span></li></ul></div>` },
            { time: "08:30 - 10:30", title: `⛪ מנזר פלאוקסטריצה (Paleokastritsa Monastery)`, html: `<div class="premium-event-desc"><p>הגיעו מוקדם מאוד כדי להימנע מפקקי האוטובוסים. המנזר המטופח משנת 1228 יושב על צוק וצופה אל המפרצים. החצר מלאה בפרחי בוגנוויליה וחתולים מתוקים.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כ-2-4€ תרומה בכניסה</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> 45 דקות - שעה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> שליו ומטופח - הגעה מוקדמת חיונית</span></li></ul></div>
                            <div class="premium-tip-box">
                                <p class="flex items-start gap-2"><span class="text-lg">👗</span> <span><strong>קוד לבוש:</strong> חובה לכסות כתפיים וברכיים. בכניסה מחלקים חצאיות וצעיפים במידת הצורך.</span></p>
                            </div>` },
            { time: "10:30 - 13:30", title: `🚤 שייט לחופים נסתרים ולמערת העין הכחולה`, html: `<div class="premium-event-desc"><p>רדו לחוף Ampelaki או Alipa ושכרו סירת מנוע קטנה (עד 30 כ"ס לא דורש רישיון!) לכמה שעות. שוטו עצמאית לחוף "פרדייס" (Chomi) שאליו ניתן להגיע רק מהים, ולמערות הימיות. מי שמעדיף יכול לקחת סירת מונית מהירה.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> סירה קטנה ל-3 שעות בערך: כ-60-80€. המחיר עולה עם גודל הסירה ומשך השכירות - עד כ-250€+דלק ליום שלם/סירה גדולה יותר - ראו טווח המחירים המלא ב<a href="#" onclick="event.preventDefault(); switchTab('activities', true); setTimeout(() => document.getElementById('act-boats').scrollIntoView({behavior:'smooth'}), 150);" class="text-indigo-600 font-semibold hover:underline">כרטיס השכרת הסירות בפרק הפעילויות ←</a></span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כ-3 שעות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> הרפתקני ועצמאי - גישה בלעדית מהים בלבד</span></li></ul></div>` },
            { time: "14:00 - 17:00", title: `🏰 ארוחת צהריים ומבצר אנגלוקסטרו (Angelokastro)`, html: `<div class="premium-event-desc"><p>אכלו צהריים ב-Akron Beach Bar ואז סעו בזהירות בדרך הצרה במעלה ההר לכפר לאקונס (Lakones). משם, המשיכו לחניית מבצר אנגלוקסטרו ("טירת המלאכים"). טיפוס תלול אך קצר (כ-15 דקות) יוביל אתכם לחורבות המבצר הביזנטי עם התצפית אולי היפה ביותר בקורפו כולה.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ראו מחיר מאומת בכרטיס האתר (פרק אטרקציות); ארוחה כ-15-20€</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשעה למבצר (כולל הטיפוס הקצר)</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> דרמטי - אחת התצפיות היפות באי</span></li></ul></div>
                            <div class="premium-tip-box" data-price-flag-id="attr-5"></div>` },
            { time: "17:30 - 20:00", title: `🌅 שקיעה בחוף רוביניה (Rovinia Beach)`, html: `<div class="premium-event-desc"><p>סיימו את היום בחוף רוביניה הבתולי. מדובר בהליכה קצרה דרך מטע זיתים עתיק, עד שמגיעים למפרץ מהמם המוקף צוקים. אין כאן שמשיות או קיוסקים, רק טבע ושקיעות מרהיבות.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשעתיים (כולל הליכה במטע הזיתים)</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> בתולי וטבעי - ללא תשתיות, רק נוף ושקיעה</span></li></ul></div>` },
            { time: "20:15 ואילך", title: `🍽️ ארוחת ערב`, html: `<div class="premium-event-desc"><p>סעו בחזרה לנמל הקטן של פלאוקסטריצה לארוחת דגים, במרחק הליכה מהמנזר.</p><div class="itinerary-dinner-slot" data-dinner-food-id="food-ורכוס-טברנה-Vrachos"><p>טוען המלצה...</p></div></div>` }
        ]
    },
    {
        key: "5",
        dayNumber: 5,
        isAlt: false,
        icon: "👑",
        titleTemplate: `יום 5 ({weekday} {date}): דרום קורפו – ארמון הקיסרית, דיונות חול וטברנות דגים`,
        subtitleTemplate: `מסע מהעושר האירופי בארמון אכיליון, אל הטבע הפראי של אגם קוריסיון ועד לכפרים הדרומיים.`,
        image: { src: "https://images.pexels.com/photos/1544947/pexels-photo-1544947.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Achilleion Palace" },
        rainAlt: `<p>שימו לב: פנים ארמון אכיליון סגור לשיפוצים מ-2021, והביקור כיום הוא בגנים החיצוניים בלבד - כך שביום גשום עדיף לוותר עליו ולבחור פעילות מקורה. מומלץ במקום זאת <strong>מוזיאון שמן הזית של Mavroudis</strong> - משפחה המייצרת שמן זית מזה דורות. הסיור מתבצע בפנים, כולל הסברים מרתקים, טעימות סוגי שמנים שונים לצד לחם טרי וגבינות - חוויה קולינרית חמימה ונהדרת.</p>
                    <p>אופציה נוספת: בילוי קניות מקורה בכפר בניצס (Benitses) הסמוך - סמטאותיו עמוסות בחנויות תכשיטים, בגדים ומזכרות, ולא מעט בתי קפה נעימים לשבת בהם עד שהגשם עובר.</p>`,
        routeInfo: {
            area: "דרום קורפו (מגסטורי ועד בוקארי - חוצה את האי פעם אחת)",
            route: ["המלון (גוביה)", "ארמון אכיליון (גסטורי)", "דיונות איסוס/חליקונאס", "בוקארי (ארוחת צהריים)", "חלומאס", "בוקארי (ארוחת ערב)", "המלון (גוביה)"],
            legs: [
                { from: "המלון (גוביה)", to: "ארמון אכיליון", km: 20, min: 38, note: "דרך קורפו טאון - משוער" },
                { from: "אכיליון", to: "דיונות איסוס/חליקונאס", km: 18, min: 30, note: "דרומה, לצד המערבי - משוער" },
                { from: "איסוס/חליקונאס", to: "בוקארי", km: 10, min: 20, note: "חציית האי פעם אחת בלבד למזרח - משוער" },
                { from: "בוקארי", to: "חלומאס", km: 1.6, min: 6, note: "כפר גבעה ממש מעל בוקארי - משוער" },
                { from: "חלומאס", to: "בוקארי (ארוחת ערב)", km: 1.6, min: 6, note: "חזרה לאותה טברנה/אזור - משוער" },
                { from: "בוקארי", to: "המלון (גוביה)", km: 25, min: 38, note: "משוער" }
            ],
            totalKm: 76.2,
            totalMin: 138,
            parking: "היום הארוך ביותר מבחינת נסיעה כי דרום קורפו רחב וכולל גם את הצד המערבי (איסוס/חליקונאס) וגם את הצד המזרחי (בוקארי) - אך המסלול חוצה את האי פעם אחת בלבד (מערב→מזרח) ולא מבזבז נסיעות כפולות. חלומאס ובוקארי כמעט צמודים, כך שאפשר להשאיר את הרכב למטה ולעלות לחלומאס בקפיצה קצרה בלבד.",
            walking: "אכיליון - שוטטות בגנים המדורגים ברגל. חוף איסוס/חליקונאס - הליכה חופשית על רצועת החוף/הדיונות.",
            estimateNote: "מרחקים/זמנים משוערים - הקטע אכיליון↔חליקונאס לא אומת בניתוב חי, מבוסס על מרחקים כלליים מקורפו טאון לשני האתרים; יש לאמת מול Google Maps ביום הנסיעה."
        },
        transitions: {
            fromHotel: null,
            between: [
                { mode: "drive", min: 38, km: 20 },
                { mode: "drive", min: 30, km: 18 },
                { mode: "drive", min: 20, km: 10, parking: "חניה בבוקארי" },
                { mode: "walk", min: 3 }
            ],
            toHotel: { mode: "drive", min: 38, km: 25 }
        },
        items: [
            { time: "08:00 - 08:45", title: `☕ ארוחת בוקר במלון`, html: `<div class="premium-event-desc"><p>ארוחת בוקר במלון <span class="trip-private-hotel-name">המלון שלכם</span> לפני היציאה לדרום קורפו.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כלול במלון</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כ-45 דקות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע - התחלה קלילה ליום</span></li></ul></div>` },
            { time: "09:00 - 11:30", title: `🏛️ ארמון אכיליון (Achilleion Palace)`, html: `<div class="premium-event-desc">
                                <p class="mb-3">ארמון הקיץ המרהיב שנבנה עבור סיסי, קיסרית אוסטריה. שוטטו בגנים המדורגים המלאים בפסלים מהמיתולוגיה היוונית - אל תפספסו את פסלו העצום של אכילס הגוסס.</p>
                                <ul class="space-y-1.5 text-sm">
                                    <li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ראו מחיר מאומת בכרטיס האתר (פרק אטרקציות) - הגנים בלבד, פנים הארמון סגור לשיפוצים מ-2021</span></li>
                                    <li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה - שעה וחצי</span></li>
                                    <li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> מלכותי ושליו, נוף למפרץ ומצוין לצילום</span></li>
                                </ul>
                            </div>
                            <div class="premium-tip-box" data-price-flag-id="attr-2"></div>` },
            { time: "11:30 - 14:00", title: `🦩 דיונות החול וחוף איסוס (Issos / Halikounas)`, html: `<div class="premium-event-desc"><p>נסיעה דרומה תיקח אתכם לרצועת החוף המיוחדת המפרידה בין הים היוני לאגם קוריסיון (Korission). זהו אזור טבע מוגן בו ניתן למצוא דיונות חול שמזכירות מדבר, ובחורף/אביב ניתן לראות פלמינגו באגם. החוף נהדר לשחייה ולצפייה בגולשי קייט-סרפינג.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעתיים - שעתיים וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> פראי ופתוח - שונה מכל חוף אחר באי</span></li></ul></div>` },
            { time: "14:30 - 16:30", title: `🐟 ארוחת דגים בבוקארי (Boukari) והכפר חלומאס (Chlomos)`, html: `<div class="premium-event-desc"><p>נסיעה לצידו המזרחי של הדרום תוביל לכפר הדייגים הקטן והשקט בוקארי. שבו ב-Boukari Beach Taverna לארוחת פירות ים משובחת. לאחר מכן, סעו לכפר ההררי Chlomos לסיור בין בתים צבעוניים ותצפית כפולה - גם לים היוני וגם לאדריאטי.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כ-20-30€ למנת פירות ים</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעתיים</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> כפרי ושליו - תצפית נדירה לשני ימים בו-זמנית</span></li></ul></div>` },
            { time: "19:00 ואילך", title: `🍽️ ארוחת ערב`, html: `<div class="premium-event-desc"><p>סיימו את היום בארוחת ערב באזור בוקארי, לא הרחק מהטברנה שכבר ביקרתם בה בצהריים.</p><div class="itinerary-dinner-slot" data-dinner-food-id="food-קפטן-אוקטופוס"><p>טוען המלצה...</p></div></div>` }
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
        routeInfo: {
            area: "הצפון הפראי (סידארי → קייפ דראסטיס → פרולדס/לוגאס - צביר צפוף אחד)",
            route: ["המלון (גוביה)", "תעלת האהבה (סידארי)", "קייפ דראסטיס", "פרולדס / חוף לוגאס (שקיעה)", "המלון (גוביה)"],
            legs: [
                { from: "המלון (גוביה)", to: "תעלת האהבה (סידארי)", km: 27, min: 29, note: "משוער" },
                { from: "סידארי", to: "קייפ דראסטיס", km: 4.5, min: 8, note: "כולל הליכה קצרה מהחניה לתצפית - משוער" },
                { from: "קייפ דראסטיס", to: "פרולדס / חוף לוגאס", km: 2.5, min: 6, note: "אותו ראש-מצוק צפון-מערבי - משוער" },
                { from: "פרולדס/לוגאס", to: "המלון (גוביה)", km: 28, min: 32, note: "משוער" }
            ],
            totalKm: 62,
            totalMin: 75,
            parking: "כל שלושת האתרים (סידארי, קייפ דראסטיס, פרולדס/לוגאס) נמצאים בצביר צפוף בקצה הצפון-מערבי של האי, כמה ק\"מ זה מזה - זה כבר היום היעיל ביותר במסלול. אפשר לשקול לוותר על נסיעת הרכב לקייפ דראסטיס ולקחת את סירת התיירים הקצרה מסידארי במקום (חוסך חניה וחזרה).",
            walking: "קייפ דראסטיס - שביל עפר מהחניה לתצפית (כ-10-15 דקות הלוך-חזור). לוגאס - מדרגות מהחניה לחוף.",
            estimateNote: "מרחקים/זמנים משוערים - יש לאמת מול Google Maps/Waze ביום הנסיעה, בעיקר בעונת שיא עם עומס תיירותי."
        },
        transitions: {
            fromHotel: null,
            between: [
                { mode: "drive", min: 29, km: 27, parking: "חניה בסידארי" },
                { mode: "drive", min: 8, km: 4.5 },
                { mode: "drive", min: 6, km: 2.5 },
                { mode: "walk", min: 3 }
            ],
            toHotel: { mode: "drive", min: 32, km: 28 }
        },
        items: [
            { time: "08:30 - 09:15", title: `☕ ארוחת בוקר במלון`, html: `<div class="premium-event-desc"><p>ארוחת בוקר במלון <span class="trip-private-hotel-name">המלון שלכם</span> לפני היציאה לצפון הפראי.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כלול במלון</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כ-45 דקות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> רגוע - התחלה קלילה ליום</span></li></ul></div>` },
            { time: "10:00 - 12:30", title: `❤️ תעלת האהבה (Canal d'Amour) בסידארי`, html: `<div class="premium-event-desc"><p>הגיעו לסידארי התוססת ולכו לעבר תעלת האהבה המפורסמת. האגדה המקומית מספרת שזוג שישחה יחד לאורך התעלה יישאר יחד לנצח. גם אם המים קרים, זהו מקום טוב לצילומים עם סלעי אבן החול השכבתית הפיסוליים.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעה - שעה וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> קליל ורומנטי - אגדה מקומית ותמונות מרשימות</span></li></ul></div>` },
            { time: "13:00 - 15:30", title: `🪨 קייפ דראסטיס (Cape Drastis) וצהריים בפרולדס`, html: `<div class="premium-event-desc"><p>נסיעה קצרה מערבה תיקח אתכם לקייפ דראסטיס - הנקודה הצפונית ביותר בקורפו. החנו את הרכב למעלה ורדו ברגל בשביל העפר לתצפית מטריפה על צוקי חימר לבנים המזדקרים מהים. לאחר מכן, סעו לכפר Peroulades לארוחת צהריים מסורתית באחת הטברנות המקומיות.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות לתצפית; ארוחה כ-15€</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> 45 דקות לתצפית + כשעה לארוחה</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> דרמטי ומרשים - קצה האי הצפוני</span></li></ul></div>` },
            { time: "16:30 - 19:30", title: `🌇 חוף לוגאס (Logas Beach) ושקיעה ב-7th Heaven`, html: `<div class="premium-event-desc"><p>רדו במדרגות לחוף לוגאס המצומצם היושב תחת צוקים אימתניים. זהו 'חוף השקיעה' הרשמי. מקומיים נוהגים למרוח את הבוץ מהצוקים על הגוף כטיפול ספא טבעי. בשקיעה, עלו לבית הקפה 7th Heaven, שבו יש מרפסת זכוכית התלויה באוויר מעל התהום לתמונת אינסטגרם מנצחת (שקיעה בסביבות 20:03 ב-7.9, הערכה משוערת - ראו הערה בראש פרק המסלול*).</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ללא עלות לחוף; משקה בבית הקפה כ-8-12€</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשלוש שעות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> דרמטי ורומנטי - אחת השקיעות היפות בקורפו</span></li></ul></div>` },
            { time: "19:30 ואילך", title: `🍽️ ארוחת ערב`, html: `<div class="premium-event-desc"><p>⚠️ לא מצאנו המלצת ארוחת ערב ספציפית לפינה הצפון-מערבית הזו של האי (סידארי / פרולדס) מעבר ל-7th Heaven שכבר ביקרתם בו לשקיעה - ראו את פרק הקולינריה המסונן לאזור <a href="#" onclick="event.preventDefault(); switchTab('food', true); setTimeout(() => document.getElementById('cat-sunset').scrollIntoView({behavior:'smooth'}), 150);" class="text-blue-600 font-semibold hover:underline">📍 צפון קורפו ←</a>, או פשוט חזרו ל-7th Heaven לארוחה קלה אם אתם כבר שם.</p></div>` }
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
        routeInfo: {
            area: "גוביה ← שדה התעופה (קבוע - שעת המראה)",
            fixed: true,
            route: ["המלון (גוביה)", "שדה התעופה (CFU)"],
            legs: [
                { from: "המלון (גוביה)", to: "שדה התעופה (CFU)", km: 8, min: 18, note: "כביש חוף ישיר, כ-8 ק\"מ - משוער" }
            ],
            totalKm: 8,
            totalMin: 18,
            parking: "אין החלפת חניה - נסיעה ישירה אחת למסוף ההחזרה של חברת ההשכרה.",
            walking: null,
            estimateNote: "מרחק/זמן משוער - יום זה קבוע לפי שעת ההמראה (הרכב חייב לחזור עד 09:00) ואינו חלק מהאופטימיזציה הגיאוגרפית."
        },
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
        routeInfo: {
            area: "שייט ים (לא נהיגה) - פאקסוס/אנטיפאקסוס",
            route: ["המלון (גוביה)", "הנמל (קורפו טאון/לפקימי)", "אנטיפאקסוס (ווטומי)", "גאיוס", "הנמל", "המלון (גוביה)"],
            legs: [
                { from: "המלון (גוביה)", to: "הנמל (קורפו טאון או לפקימי, לפי החברה)", km: 9, min: 15, note: "משוער - תלוי נמל היציאה שתבחרו" },
                { from: "הנמל", to: "אנטיפאקסוס וגאיוס", km: 0, min: 0, boat: true, note: "שייט ים מאורגן - לא נסיעה ברכב" },
                { from: "הנמל", to: "המלון (גוביה)", km: 9, min: 15, note: "משוער" }
            ],
            totalKm: 18,
            totalMin: 30,
            parking: "חנו ליד הנמל שבחרתם ליום שלם - הרכב לא זז עד החזרה מהשייט בערב.",
            walking: null,
            estimateNote: "רוב היום הוא שייט ים ולא נהיגה - מרחק/זמן הנסיעה לנמל משוער בלבד."
        },
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
            { time: "13:00 - 16:30", title: `🏘️ שוטטות בעיירה גאיוס (Gaios)`, html: `<div class="premium-event-desc"><p>עגינה בבירת פאקסוס - גאיוס. תעלה ימית מהממת מוסתרת על ידי איון קטן מובילה לנמל. יהיו לכם כמה שעות לשוטט בסמטאות עמוסות בוטיקים אופנתיים, לאכול ארוחת צהריים (פירות ים טריים!) ולטעום גלידה מקומית בכיכר המרכזית.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> ארוחת צהריים כ-20-25€</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> כשלוש שעות</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> ציורי ואופנתי - בירת פאקסוס הקטנה</span></li></ul></div>` }
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
        routeInfo: {
            area: "פנטוקרטור ופלאיה פריתיה (צפון-מזרח ההררי)",
            route: ["המלון (גוביה)", "פסגת הר פנטוקרטור", "פלאיה פריתיה", "המלון (גוביה)"],
            legs: [
                { from: "המלון (גוביה)", to: "פסגת הר פנטוקרטור", km: 20, min: 40, note: "כביש הרים מפותל - משוער" },
                { from: "הפסגה", to: "פלאיה פריתיה", km: 9, min: 20, note: "ירידה מהפסגה - משוער" },
                { from: "פלאיה פריתיה", to: "המלון (גוביה)", km: 22, min: 35, note: "משוער" }
            ],
            totalKm: 51,
            totalMin: 95,
            parking: "יום הררי - חונים פעם אחת בפסגה ופעם אחת בכפר הנטוש; אין חלופה, אלו שני אתרים נפרדים בהר.",
            walking: "שוטטות חופשית ברגל בין חורבות הכפר הנטוש פלאיה פריתיה.",
            estimateNote: "מרחקים/זמנים משוערים - כביש ההר לפנטוקרטור איטי ומפותל, ייתכנו סטיות משמעותיות מהזמן המשוער בהתאם למזג האוויר והראות."
        },
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
            { time: "14:00 - 16:30", title: `🥘 ארוחת ערב חמימה מול האח בפלאיה פריתיה`, html: `<div class="premium-event-desc"><p>למרות היותו "כפר רפאים", פועלות בפלאיה פריתיה מספר טברנות מופלאות שמושכות מקומיים בסופי שבוע. שבו ב-<em>Ognistra</em> או ב-<em>Foros</em>. זה המקום לנסות מאכלים מנחמים ועמוקים, במיוחד פשטידות מקומיות (Pita) ובשרים בבישול ארוך.</p><ul class="space-y-1.5 text-sm mt-3"><li class="flex items-center gap-2"><span class="text-amber-600 shrink-0">💶</span><span><strong class="font-semibold text-gray-900">עלות:</strong> כ-15-20€ למנה</span></li><li class="flex items-center gap-2"><span class="text-blue-600 shrink-0">⏱️</span><span><strong class="font-semibold text-gray-900">משך מומלץ:</strong> שעתיים וחצי</span></li><li class="flex items-center gap-2"><span class="text-purple-600 shrink-0">✨</span><span><strong class="font-semibold text-gray-900">אווירה:</strong> חמים ומנחם - ארוחה כפרית אותנטית בלב ההרים</span></li></ul></div>` }
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
