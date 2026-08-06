// One-off extraction script: parses the CURRENT index.html and produces
// js/locations-data.js (window.CORFU_LOCATIONS = { beaches, food, attractions, gems }).
//
// Run with: node scripts/extract-locations.js
//
// Strategy: rather than trying to model every micro-variant of badge/markup
// across 162 hand-written cards, we capture the *raw inner HTML* of the
// slots that vary between cards (badge rows, info panels, tip boxes,
// footer links) verbatim, and only pull out plain-text/attribute values for
// the slots that are simple and uniform (name, image, tags, id, etc). The
// render functions in js/cards.js then re-assemble the exact same wrapper
// markup around those slots, so output is byte-identical to the source.
//
// On top of that, this script derives the 5 new metadata fields required by
// the product spec (parking, vibe, beachType, bestTime, mapsUrl) using
// simple heuristics over the extracted text, documented inline below.

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const $ = cheerio.load(html, { decodeEntities: false });

// ---------------------------------------------------------------------
// Shared heuristics
// ---------------------------------------------------------------------

// Maps known Hebrew-guide filter tag tokens (already English keywords used
// verbatim in data-tags, e.g. "romantic", "family") to Title Case English
// vibe labels. Covers every tag token used across beaches/food/attractions/gems
// filter bars (see index.html filter buttons).
const TAG_VIBE_MAP = {
    family: 'Family',
    romantic: 'Romantic',
    quiet: 'Quiet',
    snorkeling: 'Snorkeling',
    organized: 'Organized',
    party: 'Party',
    adventure: 'Adventure',
    luxury: 'Luxury',
    nudist: 'Nudist',
    greek: 'Traditional Greek',
    fish: 'Fish',
    seafood: 'Seafood',
    italian: 'Italian',
    meat: 'Meat',
    cafes: 'Cafe',
    desserts: 'Dessert',
    bars: 'Bar',
    street: 'Street Food',
    finedining: 'Fine Dining',
    sunset: 'Sunset',
    beachbars: 'Beach Bar',
    veggie: 'Vegetarian',
    budget: 'Budget-Friendly',
    midrange: 'Midrange',
    upscale: 'Upscale',
    history: 'Historic',
    nature: 'Nature',
    village: 'Village',
    food: 'Culinary',
    beach: 'Beach',
    viewpoint: 'Viewpoint'
};

function vibeFromTags(tagsStr) {
    const tags = (tagsStr || '').split(',').map(t => t.trim()).filter(Boolean);
    const vibes = [];
    tags.forEach(t => {
        const v = TAG_VIBE_MAP[t];
        if (v && !vibes.includes(v)) vibes.push(v);
    });
    return vibes.slice(0, 4);
}

function addVibe(vibes, extra) {
    if (extra && !vibes.includes(extra)) vibes.push(extra);
    return vibes.slice(0, 4);
}

// Beach parking heuristic — derived from the "🅿️ חניה: ..." info-panel line.
function classifyBeachParking(text) {
    if (!text) return 'Unknown';
    const t = text;
    if (/בעייתית|קשה|מוגבל|קטנ|נסתמת|צפוף|צפופה/.test(t)) return 'Limited';
    if (/בתשלום/.test(t)) return 'Paid Lot Only';
    if (/חינם|שפע|נוח|ענק|רחב/.test(t)) return 'Easy';
    return 'Limited';
}

// Beach type heuristic — derived from the first "🏖️ ..." feature badge.
function classifyBeachType(text) {
    if (!text) return 'Sandy';
    const hasSand = /חול/.test(text);
    const hasPebble = /חלוק/.test(text);
    const hasRocky = /סלע|אבנים/.test(text);
    if (hasSand && (hasPebble || hasRocky)) return 'Sand & Pebble';
    if (hasPebble) return 'Pebble';
    if (hasRocky) return 'Rocky';
    if (hasSand) return 'Sandy';
    return 'Sandy';
}

// bestTime heuristic shared by attractions (has an explicit "🌅 זמן:" field)
function classifyBestTimeFromHebrew(text) {
    if (!text) return 'Anytime';
    if (/שקיעה/.test(text)) return 'Sunset';
    if (/בוקר/.test(text) && /מוקד/.test(text)) return 'Early Morning';
    if (/בוקר/.test(text)) return 'Morning';
    if (/אחר הצהריים|צהריים|אחה"צ/.test(text)) return 'Afternoon';
    if (/ערב/.test(text)) return 'Evening';
    return 'Anytime';
}

const results = { beaches: [], food: [], attractions: [], gems: [] };

// ---------------------------------------------------------------------
// BEACHES
// ---------------------------------------------------------------------
$('#beaches-grid > div.premium-card').each((i, el) => {
    const $c = $(el);
    const id = $c.attr('data-id');
    const name = $c.attr('data-name');
    const tags = $c.attr('data-tags') || '';

    const $img = $c.find('.premium-card-image img').first();
    const image = { src: $img.attr('src') || '', alt: $img.attr('alt') || '' };
    const popularityBadge = $c.find('.premium-card-image > div.absolute').first().text().trim();

    const description = $c.find('p.text-gray-600.mb-6.text-sm.leading-relaxed.text-justify').first().html().trim();

    const tagBadgesHtml = $c.find('div.flex.flex-wrap.gap-1\\.5.mb-3').first().html().trim();
    const featureBadgesHtml = $c.find('div.grid.grid-cols-2.gap-2.mb-5.mt-auto').first().html().trim();
    const infoPanelHtml = $c.find('details .p-4.bg-gray-50').first().html().trim();

    const mapsUrl = $c.find('a[title="נווט במפות גוגל"]').attr('href') || '';

    const firstFeatureText = $c.find('div.grid.grid-cols-2.gap-2.mb-5.mt-auto > span').first().text();
    const parkingMatch = infoPanelHtml.match(/🅿️\s*חניה:\s*([^<]*)/);
    const parkingRaw = parkingMatch ? parkingMatch[1].trim() : '';

    let vibe = vibeFromTags(tags);
    if (/שקיע/.test(popularityBadge) || /שקיע/.test(tagBadgesHtml)) vibe = addVibe(vibe, 'Sunset');
    if (/עומס גבוה/.test(tagBadgesHtml)) vibe = addVibe(vibe, 'Popular');

    let bestTime = 'Anytime';
    if (/שקיע/.test(popularityBadge)) bestTime = 'Sunset';
    else if (/עומס גבוה/.test(tagBadgesHtml)) bestTime = 'Early Morning';

    results.beaches.push({
        id, name, tags, image, popularityBadge, description,
        tagBadgesHtml, featureBadgesHtml, infoPanelHtml,
        mapsUrl,
        parking: classifyBeachParking(parkingRaw),
        vibe,
        beachType: classifyBeachType(firstFeatureText),
        bestTime
    });
});

// ---------------------------------------------------------------------
// FOOD (grouped under 14 static category headers, kept as static HTML)
// ---------------------------------------------------------------------
const FOOD_CATEGORY_IDS = ['cat-greek', 'cat-fish', 'cat-seafood', 'cat-italian', 'cat-meat', 'cat-cafes',
    'cat-desserts', 'cat-bars', 'cat-street', 'cat-finedining', 'cat-sunset', 'cat-beachbars', 'cat-family', 'cat-veggie'];

FOOD_CATEGORY_IDS.forEach(catId => {
    const $catHeader = $('#' + catId);
    const $grid = $catHeader.next('.grid');
    $grid.find('> .premium-card').each((i, el) => {
        const $c = $(el);
        const id = $c.attr('data-id');
        const tags = $c.attr('data-tags') || '';

        const $img = $c.find('.premium-card-image img').first();
        const image = { src: $img.attr('src') || '', alt: $img.attr('alt') || '' };

        const ratingPriceHtml = $c.find('.absolute.top-3.right-3.flex.gap-2').first().html().trim();
        const ratingMatch = ratingPriceHtml.match(/⭐\s*([\d.]+)/);
        const priceMatch = ratingPriceHtml.match(/>(\${1,4}(?:-\${1,4})?)</);

        // The 14 categories don't all share the same card body shape: the
        // first ~10 categories use a fixed 3-line body (recommended dish /
        // hours / reservation) inside a ".space-y-3" div, but the later
        // "sunset" / "beach bars" / "family" / "veggie" categories (added
        // afterwards) have richer cards — an extra description line, price,
        // parking, pros/cons — inside a differently-classed body div. Rather
        // than modeling both shapes, capture everything in the content
        // wrapper *except* the <h4> name as one raw HTML blob, in original
        // order. This reproduces either shape exactly; metadata below is
        // derived from its text.
        const $content = $c.find('.p-5.flex-1.flex.flex-col').first();
        const name = $content.find('> h4').first().text().trim();
        let restHtml = '';
        $content.children().each((j, ch) => {
            if ((ch.tagName || '').toLowerCase() !== 'h4') restHtml += $.html(ch);
        });
        const contentText = $content.text();

        const subtitle = $content.find('> p').first().text().trim();
        const regionText = $content.find('> span.inline-flex').first().text().trim();
        const mapsUrl = $content.find('a[href*="maps.google"], a:contains("ניווט")').last().attr('href') || '';

        let vibe = vibeFromTags(tags);
        if (catId === 'cat-sunset') vibe = addVibe(vibe, 'Sunset');
        if (catId === 'cat-finedining') vibe = addVibe(vibe, 'Luxury');
        if (catId === 'cat-family') vibe = addVibe(vibe, 'Family');
        if (catId === 'cat-beachbars') vibe = addVibe(vibe, 'Relaxed');

        let bestTime = 'Anytime';
        if (catId === 'cat-sunset') bestTime = 'Sunset';
        else if (catId === 'cat-cafes' || catId === 'cat-desserts') bestTime = 'Morning';
        else if (catId === 'cat-bars' || catId === 'cat-beachbars') bestTime = 'Evening';

        // A handful of the richer (later-added) food cards spell out parking
        // explicitly (🅿️ ...); reuse the same beach heuristic when present.
        const parkingMatch = contentText.match(/🅿️\s*([^\n]*?)(?=(🍳|🕒|💶|✅|❌|🎯|$))/);
        const parking = parkingMatch ? classifyBeachParking(parkingMatch[1].trim()) : 'Unknown';

        results.food.push({
            id, category: catId, tags, image,
            ratingPriceHtml, rating: ratingMatch ? ratingMatch[1] : null, price: priceMatch ? priceMatch[1] : null,
            name, subtitle, region: regionText, restHtml,
            mapsUrl,
            parking,
            vibe,
            beachType: null,
            bestTime
        });
    });
});

// ---------------------------------------------------------------------
// ATTRACTIONS
// ---------------------------------------------------------------------
$('#attractions-grid > article.premium-card').each((i, el) => {
    const $c = $(el);
    const id = $c.attr('data-id');
    const tags = $c.attr('data-tags') || '';
    const cardClass = $c.attr('class');

    const $img = $c.find('.premium-card-image img').first();
    const image = { src: $img.attr('src') || '', alt: $img.attr('alt') || '' };
    const score = $c.find('.premium-card-image > span.absolute').first().text().trim();

    // Cards 1-26 have a "⏱️/💰/🕒 stats grid" between the description and the
    // details accordion; cards 27-40 (a later addition to the guide) skip
    // straight from description to the accordion. Rather than modeling both
    // shapes, capture every child of the content wrapper *except* the <h3>
    // as one raw HTML blob, in original order — this reproduces either
    // shape exactly and metadata is derived from its text below.
    const $content = $c.find('.p-4.flex-grow.space-y-3').first();
    const title = $content.find('> h3').first().text().trim();
    let bodyHtml = '';
    $content.children().each((j, ch) => {
        if ((ch.tagName || '').toLowerCase() !== 'h3') bodyHtml += $.html(ch);
    });
    const bodyText = $content.text();

    const mapsUrl = $c.find('.flex.flex-wrap.gap-2.mt-3 a').first().attr('href') || '';

    const timeMatch = bodyText.match(/🌅\s*זמן:\s*([^💰⏱️🕒👥🌡️]*)/);
    const bestTime = classifyBestTimeFromHebrew(timeMatch ? timeMatch[1] : bodyText);

    let vibe = vibeFromTags(tags);
    if (bestTime === 'Sunset') vibe = addVibe(vibe, 'Sunset');

    results.attractions.push({
        id, tags, cardClass, image, score, title,
        bodyHtml,
        mapsUrl,
        parking: 'Unknown',
        vibe,
        beachType: null,
        bestTime
    });
});

// ---------------------------------------------------------------------
// GEMS
// ---------------------------------------------------------------------
$('#gems-container-grid > article.premium-card').each((i, el) => {
    const $c = $(el);
    const id = $c.attr('data-id');
    const tags = $c.attr('data-tags') || '';

    const $img = $c.find('.premium-card-image img').first();
    const image = { src: $img.attr('src') || '', alt: $img.attr('alt') || '' };
    const typeBadgeHtml = $c.find('.premium-card-image > div.absolute').first().html().trim();

    const name = $c.find('h3').first().text().trim();
    const description = $c.find('p.text-slate-600').first().html().trim();

    const tipHtml = $c.find('details > div').first().html().trim();
    const tipText = $c.find('details > div').first().text();

    const mapsUrl = $c.find('a.mt-auto').first().attr('href') || '';

    let bestTime = 'Anytime';
    if (/שקיעה/.test(tipText)) bestTime = 'Sunset';
    else if (/בוקר/.test(tipText) && /מוקד/.test(tipText)) bestTime = 'Early Morning';

    let vibe = vibeFromTags(tags);
    if (bestTime === 'Sunset') vibe = addVibe(vibe, 'Sunset');
    if (bestTime === 'Early Morning') vibe = addVibe(vibe, 'Quiet');

    results.gems.push({
        id, tags, image, typeBadgeHtml, name, description,
        tipHtml,
        mapsUrl,
        parking: 'Unknown',
        vibe,
        beachType: null,
        bestTime
    });
});

// ---------------------------------------------------------------------
// Sanity counts
// ---------------------------------------------------------------------
console.log('beaches:', results.beaches.length);
console.log('food:', results.food.length);
console.log('attractions:', results.attractions.length);
console.log('gems:', results.gems.length);

// ---------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------
const banner = `// Auto-generated by scripts/extract-locations.js from the original index.html.
// Do not hand-edit the extracted fields lightly — regenerate via the script
// if the source markup changes. New metadata fields (parking, vibe,
// beachType, bestTime, mapsUrl) were derived by heuristics — see the
// extraction script for exact rules, and spot-check ambiguous cards.
`;

const out = banner + 'window.CORFU_LOCATIONS = ' + JSON.stringify(results, null, 2) + ';\n';
fs.writeFileSync(path.join(ROOT, 'js', 'locations-data.js'), out, 'utf8');
console.log('Wrote js/locations-data.js');
