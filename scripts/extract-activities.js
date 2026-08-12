// One-off extraction script: parses the CURRENT index.html and produces
// js/corfu-activities.js (window.CORFU_ACTIVITIES = [ ...14 records... ]).
//
// Run with: node scripts/extract-activities.js
//
// Strategy: mirrors scripts/extract-locations.js — pull structured fields
// (id, anchor, title, chips, links, image src/alt) as plain values, and for
// the two free-text tip lines (🎒 equipment / ⚠️ warning) and the expert-tip
// accordion answer, capture the raw HTML content verbatim (after stripping
// only the constant icon/label markup that js/activities.js re-adds itself),
// so nothing is retyped or paraphrased by hand.
//
// Every one of the 14 #activities-grid cards was confirmed (by a separate
// grep/regex pass, not by eyeballing) to have exactly 2 images and exactly 1
// expert-tip accordion; only the badge (3/14 cards) and the warning line
// (1/14 cards) are actually optional. The script still treats all of these
// as optional/nullable rather than assuming the current shape forever.

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const $ = cheerio.load(html, { decodeEntities: false });

const activities = [];

$('#activities-grid > article[data-id]').each((i, el) => {
    const $c = $(el);
    const id = $c.attr('data-id');
    const anchor = $c.attr('id') || null;

    // --- images: whatever <img> tags sit inside the card's top ".relative"
    // wrapper, in document order. Do not assume exactly 2.
    const images = $c.find('div.relative > img').map((j, img) => {
        const $img = $(img);
        return { src: $img.attr('src') || '', alt: $img.attr('alt') || '' };
    }).get();

    // --- title: h3 text, split into emoji (first whitespace-delimited
    // token) + the rest.
    const h3Text = $c.find('h3').first().text().trim();
    const titleMatch = h3Text.match(/^(\S+)\s*(.*)$/);
    const emoji = titleMatch ? titleMatch[1] : '';
    const title = titleMatch ? titleMatch[2] : h3Text;

    // --- badge: the small uppercase pill next to the h3. Only present on
    // cards whose h3 is wrapped in a flex row alongside it (3 of 14).
    const badgeText = $c.find('.p-6 span.uppercase.tracking-wide').first().text().trim();
    const badge = badgeText || null;

    // --- description paragraph.
    const description = $c.find('p.gt-text-500.mb-6.leading-relaxed.flex-1').first().text().trim();

    // --- chips row (price / duration / audience pills).
    const chips = $c.find('div.flex.flex-wrap.gap-2.mb-6 > span').map((j, s) => $(s).text().trim()).get();

    // --- equipment tip (🎒 line): strip the icon span + "ציוד מומלץ:"
    // <strong> label, keep the rest of the paragraph's markup/text verbatim.
    let equipmentTip = null;
    const $eq = $c.find('.gt-bg-sunken p.gt-text-700').first();
    if ($eq.length) {
        const $clone = $eq.clone();
        $clone.find('span.text-base').remove();
        $clone.find('strong').first().remove();
        equipmentTip = ($clone.html() || '').trim();
    }

    // --- warning tip (⚠️ line): only 1 of 14 cards has this. The emoji sits
    // bare in the <p>, followed by a <span> wrapping the actual message —
    // capture that span's content verbatim.
    let warningTip = null;
    const $warn = $c.find('.gt-bg-sunken p.gt-text-accent').first();
    if ($warn.length) {
        const $span = $warn.find('span').first();
        warningTip = (($span.length ? $span.html() : $warn.html()) || '').trim();
    }

    // --- CTA row: two links, capture both href AND label text since labels
    // vary card to card ("📍 נווט בוויז/גוגל" vs "📍 נמל קורפו" vs "🌐 ..." etc).
    const $links = $c.find('div.flex.flex-col.sm\\:flex-row.gap-3.mt-auto > a');
    const navigateUrl = $links.eq(0).attr('href') || null;
    const navigateLabel = $links.eq(0).text().trim() || null;
    const findProviderUrl = $links.eq(1).attr('href') || null;
    const findProviderLabel = $links.eq(1).text().trim() || null;

    // --- expert-tip accordion answer (verbatim HTML of the answer div).
    let expertTip = null;
    const $expert = $c.find('details.group\\/accordion > div').first();
    if ($expert.length) {
        expertTip = ($expert.html() || '').trim();
    }

    // --- quick-nav label: the matching #activities-quick-nav anchor's text.
    let quickNavLabel = null;
    if (anchor) {
        const $navLink = $(`#activities-quick-nav a[href="#${anchor}"]`).first();
        if ($navLink.length) quickNavLabel = $navLink.text().trim();
    }

    activities.push({
        id, anchor, emoji, title, badge, images, description, chips,
        equipmentTip, warningTip,
        navigateUrl, navigateLabel, findProviderUrl, findProviderLabel,
        expertTip, quickNavLabel
    });
});

console.log('activities:', activities.length);
activities.forEach(a => {
    console.log(' -', a.id, a.anchor, JSON.stringify(a.title), 'imgs=' + a.images.length,
        'badge=' + (a.badge ? 'yes' : 'no'), 'warn=' + (a.warningTip ? 'yes' : 'no'),
        'expert=' + (a.expertTip ? 'yes' : 'no'));
});

if (activities.length === 0) {
    console.error('\nREFUSING TO WRITE js/corfu-activities.js — extracted 0 records.');
    console.error('The #activities-grid selector matched nothing; check index.html for markup changes.');
    process.exit(1);
}

const banner = `// Auto-generated by scripts/extract-activities.js from the original index.html.
// Do not hand-edit lightly — regenerate via the script if the source markup
// changes. See the script header for the exact extraction rules for each
// field (particularly equipmentTip/warningTip/expertTip, which strip only
// constant icon/label markup and keep the rest verbatim).
`;

const targetPath = path.join(ROOT, 'js', 'corfu-activities.js');
const out = banner + 'window.CORFU_ACTIVITIES = ' + JSON.stringify(activities, null, 2) + ';\n';
fs.writeFileSync(targetPath, out, 'utf8');
console.log('\nWrote js/corfu-activities.js (' + activities.length + ' records)');
