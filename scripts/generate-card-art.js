// Generates the self-hosted SVG illustrations used to replace loremflickr's
// random third-party photos on attraction cards, plus one wide banner for
// the attractions section-hero. Flat geometric Mediterranean scenery, drawn
// only with the five hex colors from the old css/corfu.css :root's
// "MEDITERRANEAN DESIGN SYSTEM" palette (that file is gone now - see
// css/design-system.css's --gt-accent-gold-*/--gt-accent-olive-600 for
// where those same gold/olive values live on) so no new brand color enters
// the page through an image. Hardcoded below, not re-read from any CSS
// file, so this comment is just provenance - re-running this script always
// reproduces the same bytes regardless of what's currently linked.
//
// Deterministic: writes the same bytes every run. Usage:
//   node scripts/generate-card-art.js
'use strict';

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'images', 'cards');

const CARD_SVGS = {
    'history.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" role="img">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e1edf5"/><stop offset="1" stop-color="#f7ecd9"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sky)"/>
  <circle cx="468" cy="96" r="40" fill="#c9a55f" opacity=".9"/>
  <path d="M0 268 H600 V400 H0 Z" fill="#14507a"/>
  <path d="M0 286 q60 -10 120 0 t120 0 t120 0 t120 0 t120 0 V400 H0 Z" fill="#237fae" opacity=".55"/>
  <path d="M0 314 q75 -12 150 0 t150 0 t150 0 t150 0 V400 H0 Z" fill="#237fae" opacity=".4"/>
  <path d="M0 300 q90 -34 190 -18 t180 22 V400 H0 Z" fill="#0a2540" opacity=".35"/>
  <g fill="#0a2540">
    <path d="M96 300 V196 h150 v104 Z"/>
    <path d="M96 196 h16 v-16 h18 v16 h20 v-16 h18 v16 h20 v-16 h18 v16 h20 v-16 h16 v16 Z"/>
    <path d="M246 300 V150 h72 v150 Z"/>
    <path d="M246 150 h14 v-15 h16 v15 h14 v-15 h16 v15 h12 v-15 h14 v15 Z"/>
    <path d="M318 300 V214 h122 v86 Z"/>
    <path d="M318 214 h15 v-15 h17 v15 h18 v-15 h17 v15 h18 v-15 h17 v15 h20 v-15 Z"/>
  </g>
  <g fill="#f7ecd9" opacity=".8">
    <rect x="140" y="228" width="16" height="26" rx="8"/>
    <rect x="190" y="228" width="16" height="26" rx="8"/>
    <rect x="268" y="182" width="15" height="24" rx="7.5"/>
    <rect x="360" y="244" width="15" height="24" rx="7.5"/>
    <rect x="398" y="244" width="15" height="24" rx="7.5"/>
  </g>
</svg>
`,
    'nature.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" role="img">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e1edf5"/><stop offset="1" stop-color="#f2ecdf"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sky)"/>
  <circle cx="140" cy="92" r="34" fill="#c9a55f" opacity=".9"/>
  <path d="M0 250 L120 150 L210 232 L300 138 L410 246 L510 178 L600 250 V400 H0 Z" fill="#6d7a4f" opacity=".55"/>
  <path d="M0 292 L110 208 L214 286 L322 196 L430 288 L530 232 L600 292 V400 H0 Z" fill="#6d7a4f" opacity=".8"/>
  <path d="M0 336 L128 268 L248 340 L360 272 L470 342 L600 288 V400 H0 Z" fill="#0a2540" opacity=".75"/>
  <g fill="#f2ecdf" opacity=".5">
    <circle cx="300" cy="150" r="5"/><circle cx="120" cy="162" r="4"/><circle cx="510" cy="190" r="4"/>
  </g>
</svg>
`,
    'beach.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" role="img">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e1edf5"/><stop offset="1" stop-color="#f7ecd9"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sky)"/>
  <circle cx="452" cy="88" r="36" fill="#c9a55f" opacity=".9"/>
  <path d="M0 214 q80 -46 168 -16 t150 26 V400 H0 Z" fill="#6d7a4f" opacity=".65"/>
  <path d="M600 206 q-70 -40 -152 -12 t-128 30 V400 H600 Z" fill="#6d7a4f" opacity=".5"/>
  <path d="M0 252 H600 V400 H0 Z" fill="#1a6494"/>
  <path d="M0 270 q60 -10 120 0 t120 0 t120 0 t120 0 t120 0 V400 H0 Z" fill="#e1edf5" opacity=".55"/>
  <path d="M0 298 q75 -12 150 0 t150 0 t150 0 t150 0 V400 H0 Z" fill="#e1edf5" opacity=".4"/>
  <path d="M0 356 q150 -26 300 -4 t300 -8 V400 H0 Z" fill="#e7ddc7"/>
  <g fill="#f2ecdf" opacity=".85">
    <ellipse cx="96" cy="378" rx="17" ry="9"/><ellipse cx="168" cy="386" rx="13" ry="7"/>
    <ellipse cx="416" cy="380" rx="15" ry="8"/><ellipse cx="496" cy="388" rx="12" ry="6"/>
  </g>
</svg>
`,
    'village.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" role="img">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e1edf5"/><stop offset="1" stop-color="#f2ecdf"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sky)"/>
  <circle cx="112" cy="84" r="30" fill="#c9a55f" opacity=".9"/>
  <path d="M0 268 q140 -52 300 -20 t300 -14 V400 H0 Z" fill="#6d7a4f" opacity=".45"/>
  <g>
    <rect x="74" y="256" width="104" height="112" fill="#f2ecdf"/>
    <path d="M66 256 L126 214 L186 256 Z" fill="#b8934a"/>
    <rect x="192" y="288" width="90" height="80" fill="#e7ddc7"/>
    <path d="M184 288 L237 254 L290 288 Z" fill="#b8934a"/>
    <rect x="368" y="270" width="110" height="98" fill="#f2ecdf"/>
    <path d="M360 270 L423 230 L486 270 Z" fill="#b8934a"/>
    <rect x="300" y="196" width="52" height="172" fill="#faf9f6"/>
    <path d="M292 196 L326 162 L360 196 Z" fill="#14507a"/>
    <circle cx="326" cy="238" r="13" fill="#14507a" opacity=".85"/>
  </g>
  <g fill="#14507a" opacity=".7">
    <rect x="102" y="288" width="20" height="28" rx="3"/><rect x="134" y="288" width="20" height="28" rx="3"/>
    <rect x="214" y="314" width="18" height="26" rx="3"/><rect x="246" y="314" width="18" height="26" rx="3"/>
    <rect x="396" y="300" width="20" height="28" rx="3"/><rect x="432" y="300" width="20" height="28" rx="3"/>
  </g>
  <path d="M0 368 H600 V400 H0 Z" fill="#0a2540" opacity=".25"/>
</svg>
`,
    'family.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" role="img">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e1edf5"/><stop offset="1" stop-color="#e1edf5"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sky)"/>
  <circle cx="490" cy="86" r="34" fill="#c9a55f" opacity=".9"/>
  <path d="M112 340 V178 a44 44 0 0 1 88 0 v34" fill="none" stroke="#1a6494" stroke-width="20" stroke-linecap="round"/>
  <path d="M212 340 V206 a52 52 0 0 1 104 0 v46" fill="none" stroke="#b8934a" stroke-width="20" stroke-linecap="round"/>
  <path d="M330 340 V232 a46 46 0 0 1 92 0 v40" fill="none" stroke="#6d7a4f" stroke-width="20" stroke-linecap="round"/>
  <path d="M0 316 H600 V400 H0 Z" fill="#237fae"/>
  <path d="M0 334 q60 -10 120 0 t120 0 t120 0 t120 0 t120 0 V400 H0 Z" fill="#e1edf5" opacity=".55"/>
  <path d="M0 362 q75 -12 150 0 t150 0 t150 0 t150 0 V400 H0 Z" fill="#e1edf5" opacity=".4"/>
  <g fill="#faf9f6" opacity=".7">
    <circle cx="150" cy="352" r="9"/><circle cx="270" cy="364" r="7"/><circle cx="404" cy="356" r="8"/>
  </g>
</svg>
`,
    'food.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" role="img">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e1edf5"/><stop offset="1" stop-color="#f7ecd9"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sky)"/>
  <circle cx="486" cy="92" r="34" fill="#c9a55f" opacity=".9"/>
  <path d="M0 238 H600 V400 H0 Z" fill="#1a6494"/>
  <path d="M0 256 q60 -10 120 0 t120 0 t120 0 t120 0 t120 0 V400 H0 Z" fill="#e1edf5" opacity=".55"/>
  <path d="M0 284 q75 -12 150 0 t150 0 t150 0 t150 0 V400 H0 Z" fill="#e1edf5" opacity=".4"/>
  <path d="M0 300 H600 V400 H0 Z" fill="#e7ddc7"/>
  <g stroke="#6d7a4f" stroke-width="9" fill="none" stroke-linecap="round">
    <path d="M60 122 h480"/>
    <path d="M126 122 q14 40 -6 66"/><path d="M232 122 q-16 44 6 72"/>
    <path d="M348 122 q16 38 -4 64"/><path d="M456 122 q-14 42 8 70"/>
  </g>
  <g fill="#6d7a4f" opacity=".85">
    <circle cx="120" cy="196" r="11"/><circle cx="238" cy="202" r="10"/>
    <circle cx="344" cy="192" r="11"/><circle cx="464" cy="198" r="10"/>
  </g>
  <g>
    <ellipse cx="300" cy="292" rx="112" ry="22" fill="#faf9f6"/>
    <rect x="292" y="292" width="16" height="76" fill="#b8934a"/>
    <rect x="252" y="360" width="96" height="12" rx="6" fill="#b8934a"/>
    <circle cx="262" cy="286" r="18" fill="#e1edf5"/>
    <circle cx="338" cy="286" r="18" fill="#e1edf5"/>
    <rect x="292" y="254" width="17" height="38" rx="6" fill="#14507a"/>
  </g>
</svg>
`
};

const BANNER_SVG = {
    'banner-attractions.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 500" width="1600" height="500" role="img">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e1edf5"/><stop offset="1" stop-color="#f7ecd9"/>
  </linearGradient></defs>
  <rect width="1600" height="500" fill="url(#sky)"/>
  <circle cx="1260" cy="120" r="70" fill="#c9a55f" opacity=".9"/>
  <path d="M0 300 q220 -90 460 -30 t420 20 t420 10 t300 -40 V500 H0 Z" fill="#6d7a4f" opacity=".45"/>
  <path d="M0 360 q260 -60 520 -10 t480 24 t420 -6 V500 H0 Z" fill="#0a2540" opacity=".18"/>
  <g fill="#0d3355">
    <path d="M180 420 V300 h150 v120 Z"/>
    <path d="M180 300 h16 v-16 h18 v16 h20 v-16 h18 v16 h20 v-16 h18 v16 h20 v-16 h16 v16 Z"/>
    <path d="M400 420 V330 h150 v90 Z"/>
    <path d="M400 330 h16 v-15 h18 v15 h20 v-15 h18 v15 h20 v-15 h18 v15 h20 v-15 h16 v15 Z"/>
    <path d="M1000 420 V310 h180 v110 Z"/>
    <path d="M1000 310 h18 v-17 h20 v17 h22 v-17 h20 v17 h22 v-17 h20 v17 h22 v-17 h18 v17 Z"/>
    <rect x="720" y="250" width="55" height="170"/>
    <path d="M712 250 L747 210 L782 250 Z"/>
    <circle cx="747" cy="296" r="14" fill="#f7ecd9" opacity=".8"/>
  </g>
  <g fill="#f7ecd9" opacity=".75">
    <rect x="220" y="340" width="18" height="28" rx="9"/><rect x="270" y="340" width="18" height="28" rx="9"/>
    <rect x="1040" y="340" width="17" height="26" rx="8.5"/><rect x="1090" y="340" width="17" height="26" rx="8.5"/><rect x="1140" y="340" width="17" height="26" rx="8.5"/>
  </g>
  <path d="M0 430 H1600 V500 H0 Z" fill="#14507a" opacity=".85"/>
  <path d="M0 448 q120 -14 240 0 t240 0 t240 0 t240 0 t240 0 t200 -10 V500 H0 Z" fill="#237fae" opacity=".5"/>
</svg>
`
};

fs.mkdirSync(OUT_DIR, { recursive: true });

const written = [];
for (const [name, svg] of Object.entries({ ...CARD_SVGS, ...BANNER_SVG })) {
    fs.writeFileSync(path.join(OUT_DIR, name), svg, 'utf8');
    written.push(name);
}

console.log(`Wrote ${written.length} SVG(s) to ${path.relative(process.cwd(), OUT_DIR)}/:`);
written.forEach((name) => console.log(`  ${name}`));

module.exports = { THEMES: Object.keys(CARD_SVGS).map((f) => f.replace(/\.svg$/, '')) };
