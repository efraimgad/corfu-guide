// Extracts the About tab's chapter-01 hero banner (title/subtitle/image alt)
// from index.html's #about (first) .section-hero-banner, verbatim - never
// retyped. Splices the result into js/corfu-about.js's window.CORFU_ABOUT
// object (which already holds `regions`/`quickFacts` - see
// scripts/extract-about-quickfacts.js) as a new `heroBanner` field, anchored
// on the existing `quickFacts:` line (throws instead of writing if that
// anchor isn't found exactly once). data/destinations/corfu.js itself only
// references `window.CORFU_ABOUT` - it holds no inline about-data literal.
//
// Deliberately NOT extracted: the banner's chapter label ("01 — היכרות")
// and its illustration <img src> - both generic UI chrome (a chapter
// counter, a reused local SVG), not destination-specific text. Only the
// title/subtitle/image-alt - which literally name Corfu - move to data.
//
// Usage: node scripts/extract-about-hero.js
'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const indexPath = path.join(ROOT, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const $ = cheerio.load(html);

const banner = $('.section-hero-banner').first();
if (!banner.length) {
    throw new Error('extract-about-hero: no .section-hero-banner found in index.html - aborting');
}

const imageAlt = (banner.find('img').first().attr('alt') || '').trim();
const title = banner.find('.section-hero-banner-content h2').first().text().trim();
const subtitle = banner.find('.section-hero-banner-content p').first().text().trim();

if (!imageAlt || !title || !subtitle) {
    throw new Error(`extract-about-hero: one or more fields came back empty (imageAlt="${imageAlt}", title="${title}", subtitle="${subtitle}") - aborting, not writing a possibly-broken extraction`);
}

const heroBanner = { imageAlt, title, subtitle };

const aboutJsPath = path.join(ROOT, 'js/corfu-about.js');
const aboutJs = fs.readFileSync(aboutJsPath, 'utf8');

const anchor = '  quickFacts: [';
const anchorMatches = aboutJs.split(anchor).length - 1;
if (anchorMatches !== 1) {
    throw new Error(`extract-about-hero: expected exactly one "${anchor}" anchor in js/corfu-about.js, found ${anchorMatches} - aborting to avoid a bad splice`);
}

const heroBannerLiteral = `  heroBanner: ${JSON.stringify(heroBanner, null, 2).split('\n').join('\n  ')},\n`;
const updatedAboutJs = aboutJs.replace(anchor, heroBannerLiteral + anchor);

if (updatedAboutJs === aboutJs) {
    throw new Error('extract-about-hero: splice produced no change - aborting');
}

fs.writeFileSync(aboutJsPath, updatedAboutJs, 'utf8');
console.log(`Extracted About hero banner (title/subtitle/imageAlt) -> js/corfu-about.js`);
console.log(JSON.stringify(heroBanner, null, 2));
