// Extracts the remaining static-Corfu blocks inside Trip Planning
// (#plan-weather's header, #plan-accommodation, #plan-seasonality,
// #plan-budget, #plan-transport's public-transport/fuel-parking/tolls/
// driving-from-base/ferries-summary cards + the driving-times table's two
// footnote paragraphs, and #plan-ferries) and inside Language
// (#lang-shopping's no-malls intro, its restrooms block, and
// #lang-phrasebook's intro paragraph) from index.html, verbatim - never
// retyped. These were found during a follow-up leakage audit: Phase 2 only
// migrated the repeated-record-type pieces of these tabs (weather rows,
// driving-times rows, shopping streets/souvenirs/supermarkets/phrasebook
// cards) and left the surrounding prose/heading blocks static, several of
// which turn out to name Corfu/Gouvia explicitly.
//
// Deliberately NOT extracted (confirmed genuinely generic-to-Greece, not
// Corfu-specific, so left static and untouched): the tipping-norms cards
// (#plan-money) and the currency converter; the pharmacies block
// (#lang-shopping); the car-rental card and the generic driving-safety
// bullet list inside #plan-transport (only their Corfu-naming HEADINGS are
// touched, done as plain text edits, not full data extraction, since the
// bullet content itself needs no per-destination variation).
//
// Usage: node scripts/extract-tripplanning-static.js
'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const $ = cheerio.load(html);

function text(sel, ctx) { return ($(sel, ctx).first().text() || '').trim(); }
function html_(sel, ctx) { return ($(sel, ctx).first().html() || '').trim(); }
function must(val, label) {
    if (!val) throw new Error(`extract-tripplanning-static: "${label}" came back empty - aborting`);
    return val;
}

// --- #plan-weather header ----------------------------------------------
const weatherHeading = {
    title: must(text('h3', '#plan-weather'), 'weatherHeading.title'),
    subtitle: must(text('p.mt-1', '#plan-weather'), 'weatherHeading.subtitle')
};

// --- #plan-accommodation -------------------------------------------------
const accEl = $('#plan-accommodation');
const accAreaFull = text('p.text-sm.gt-text-500.mt-1', accEl);
const accAreaLabel = must(accAreaFull.split('·')[1] ? accAreaFull.split('·')[1].trim() : '', 'accommodation.areaLabel');
const accommodation = {
    areaLabel: accAreaLabel,
    intro: must(text('p.gt-text-500.mb-6.leading-relaxed', accEl), 'accommodation.intro'),
    cards: []
};
accEl.find('.grid > div').each((i, el) => {
    const $el = $(el);
    const iconEl = $el.find('.text-3xl').first();
    const iconSvg = iconEl.find('svg').length ? $.html(iconEl.find('svg')) : null;
    accommodation.cards.push({
        icon: iconSvg ? null : iconEl.text().trim(),
        iconHtml: iconSvg,
        title: $el.find('h4').first().text().trim(),
        description: html_('p', $el)
    });
});
if (accommodation.cards.length !== 6) throw new Error(`extract-tripplanning-static: expected 6 accommodation cards, found ${accommodation.cards.length}`);

// --- #plan-seasonality -----------------------------------------------------
const seasEl = $('#plan-seasonality');
const seasonality = { bands: [], tip: '' };
seasEl.find('.grid > div').each((i, el) => {
    const $el = $(el);
    seasonality.bands.push({
        label: $el.find('h4').first().text().trim(),
        items: $el.find('ul > li').map((j, li) => $(li).html().trim()).get()
    });
});
seasonality.tip = must(html_('.gt-bg-accent-soft.rounded-xl.p-5.border-r-4 p', seasEl), 'seasonality.tip');
if (seasonality.bands.length !== 3) throw new Error(`extract-tripplanning-static: expected 3 seasonality bands, found ${seasonality.bands.length}`);

// --- #plan-budget ------------------------------------------------------
const budgetEl = $('#plan-budget');
const budget = {
    title: must(text('h3', budgetEl), 'budget.title'),
    intro: must(text('p.gt-text-500.mb-6', budgetEl), 'budget.intro'),
    days: [],
    footerTip: must(html_('p.text-xs.gt-text-500.mt-5', budgetEl), 'budget.footerTip')
};
budgetEl.find('.grid > div').each((i, el) => {
    const $el = $(el);
    const items = $el.find('ul > li').map((j, li) => {
        const $li = $(li);
        return { label: $li.find('span').first().text().trim(), value: $li.find('strong').first().text().trim() };
    }).get();
    const totalRow = $el.find('.mt-4.pt-3');
    budget.days.push({
        title: $el.find('h4').first().text().trim(),
        items,
        totalLabel: totalRow.find('span').first().text().trim(),
        totalValue: totalRow.find('span').last().text().trim()
    });
});
if (budget.days.length !== 2) throw new Error(`extract-tripplanning-static: expected 2 budget day-cards, found ${budget.days.length}`);

// --- #plan-transport: public-transport / fuel-parking / tolls / driving-from-base / ferries-summary cards
const transEl = $('#plan-transport');
const transCards = transEl.find('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 > div');
if (transCards.length !== 6) throw new Error(`extract-tripplanning-static: expected 6 #plan-transport grid cards, found ${transCards.length}`);

function cardAt(i) {
    const $el = $(transCards.get(i));
    return { title: $el.find('h4').first().text().trim(), html: html_('p', $el) };
}
function listCardAt(i) {
    const $el = $(transCards.get(i));
    return { title: $el.find('h4').first().text().trim(), items: $el.find('ul > li').map((j, li) => $(li).html().trim()).get() };
}

const publicTransport = listCardAt(0); // בס"ד card 0: public transport (ul list)
const fuelParking = cardAt(2);         // card 2: fuel/parking
const tolls = cardAt(3);               // card 3: tolls
const drivingFromBaseEl = $(transCards.get(4));
const drivingFromBase = {
    title: drivingFromBaseEl.find('h4').first().text().trim(),
    items: drivingFromBaseEl.find('ul > li').map((j, li) => $(li).html().trim()).get()
};
const ferriesSummary = cardAt(5); // card 5: short ferries summary inside the grid

const driveTimeFootnotes = {
    planningTip: must(html_('.gt-bg-accent-soft.rounded-xl.p-6.border-r-4.gt-border-accent.shadow-sm.mb-8 > p.text-sm', transEl), 'driveTimeFootnotes.planningTip'),
    shapeTip: must(html_('.gt-bg-accent-soft.rounded-xl.p-6.border-r-4.gt-border-accent.shadow-sm.mb-8 > p.text-xs.mt-3', transEl), 'driveTimeFootnotes.shapeTip'),
    baseAdjustmentNote: must(html_('.gt-bg-accent-soft.rounded-xl.p-6.border-r-4.gt-border-accent.shadow-sm.mb-8 > p.text-xs.mt-2', transEl), 'driveTimeFootnotes.baseAdjustmentNote')
};

const roadSafetyHeadingTitle = must(text('.gt-bg-accent-soft.rounded-xl.p-6.border-r-4.gt-border-accent.shadow-sm.flex h4', transEl), 'roadSafetyHeading.title');

// --- #plan-ferries (detailed) ------------------------------------------
const ferriesEl = $('#plan-ferries');
const ferriesDetailed = {
    title: must(text('h4', ferriesEl), 'ferriesDetailed.title'),
    routes: ferriesEl.find('.grid > div').map((i, el) => {
        const $el = $(el);
        return { title: $el.find('p').first().text().trim(), description: html_('p:nth-of-type(2)', $el) };
    }).get(),
    disclaimer: must(html_('p.text-xs.gt-text-accent.mt-4', ferriesEl), 'ferriesDetailed.disclaimer')
};
if (ferriesDetailed.routes.length !== 4) throw new Error(`extract-tripplanning-static: expected 4 ferry routes, found ${ferriesDetailed.routes.length}`);

// --- Language: no-malls intro, restrooms, phrasebook intro ---------------
const noMallsIntro = must(html_('#lang-shopping .gt-bg-accent-soft.p-5.rounded-xl.border p'), 'language.noMallsIntro');
const restroomsHtml = must(html_('#lang-shopping .bg-white.rounded-xl.p-6.border.gt-border-hair.shadow-sm.mt-6 p'), 'language.restroomsHtml');
const phrasebookIntro = must(text('#lang-phrasebook p.gt-text-500.mb-6'), 'language.phrasebookIntro');

// --- Write output --------------------------------------------------------
const tripPlanningStatic = {
    weatherHeading, accommodation, seasonality, budget,
    transport: { publicTransport, fuelParking, tolls, drivingFromBase, ferriesSummary, roadSafetyHeadingTitle, driveTimeFootnotes },
    ferriesDetailed
};

const outTP = `// Auto-generated by scripts/extract-tripplanning-static.js from the
// original index.html. Do not hand-edit lightly — regenerate via the
// script if the source markup changes. These are the Trip Planning blocks
// that stayed static Corfu-specific prose after Phase 2's weather/driving-
// times migration (accommodation-area info, seasonality, budget, several
// #plan-transport cards, and the detailed ferries card) — found and
// migrated in a follow-up leakage-fix pass.
window.CORFU_TRIPPLANNING_STATIC = ${JSON.stringify(tripPlanningStatic, null, 2)};
`;
fs.writeFileSync(path.join(ROOT, 'js/corfu-tripplanning-static.js'), outTP, 'utf8');

// Extend js/corfu-language.js with the 3 new fields (splice, same pattern
// as scripts/extract-about-hero.js used for js/corfu-about.js).
const langPath = path.join(ROOT, 'js/corfu-language.js');
const langJs = fs.readFileSync(langPath, 'utf8');
const anchor = '  pronunciationTip:';
if (langJs.split(anchor).length - 1 !== 1) {
    throw new Error('extract-tripplanning-static: could not find a unique "pronunciationTip:" anchor in js/corfu-language.js');
}
const newFieldsLiteral = `  noMallsIntro: ${JSON.stringify(noMallsIntro)},\n  restroomsHtml: ${JSON.stringify(restroomsHtml)},\n  phrasebookIntro: ${JSON.stringify(phrasebookIntro)},\n${anchor}`;
const updatedLangJs = langJs.replace(anchor, newFieldsLiteral);
if (updatedLangJs === langJs) throw new Error('extract-tripplanning-static: splice into js/corfu-language.js produced no change');
fs.writeFileSync(langPath, updatedLangJs, 'utf8');

console.log('Extracted Trip Planning static blocks -> js/corfu-tripplanning-static.js');
console.log('Extended js/corfu-language.js with noMallsIntro/restroomsHtml/phrasebookIntro');
