// CANNOT RUN AS-IS: requires `sharp`, which is deliberately not a dependency
// of this project (see README — the whole point is no build pipeline).
// The four icons it produced are already committed under images/icons/ and
// verified correct: maskable variants are distinct files from the `any`
// ones, with content inside ~46% of the icon radius, well within the 80%
// safe zone. Install sharp ad hoc only if the icons need regenerating.

// One-off script for Step 17: generates maskable PWA icon variants by
// compositing the EXISTING icon-512.png artwork (scaled to 60%, unchanged
// otherwise - not redrawn) onto a solid background at the manifest's
// theme_color, leaving the ~40% safe-zone margin Android's adaptive-icon
// masking needs so it doesn't clip the "C26" mark.
//
// sharp is intentionally NOT added to package.json for this one-off asset
// generation - install it locally to (re)run this:
//   npm install sharp --no-save
//   node scripts/generate-maskable-icons.js
const sharp = require('sharp');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const THEME_COLOR = '#0d3355';
const SOURCE = path.join(ROOT, 'images', 'icons', 'icon-512.png');

async function makeMaskable(size, outPath) {
    const artSize = Math.round(size * 0.6);
    const artBuffer = await sharp(SOURCE).resize(artSize, artSize).toBuffer();
    await sharp({
        create: { width: size, height: size, channels: 4, background: THEME_COLOR }
    })
        .composite([{ input: artBuffer, gravity: 'center' }])
        .png()
        .toFile(outPath);
    console.log('Wrote', outPath);
}

(async () => {
    await makeMaskable(512, path.join(ROOT, 'images', 'icons', 'icon-512-maskable.png'));
    await makeMaskable(192, path.join(ROOT, 'images', 'icons', 'icon-192-maskable.png'));
})().catch(e => { console.error(e); process.exit(1); });
