// Merges Google-Places-verified restaurant/attraction data into
// js/locations-data.js. Idempotent: re-running it against an
// already-enriched file re-derives the same output (0 coordinate moves,
// same mapsUrl/hrefs), since the verified-*.json files are the source of
// truth for lat/lon/placeId/etc.
//
// Usage: node scripts/apply-verified-places.js
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCATIONS_PATH = path.join(ROOT, 'js', 'locations-data.js');

global.window = {};
require(LOCATIONS_PATH);
const L = global.window.CORFU_LOCATIONS;

const verifiedPlaces = JSON.parse(fs.readFileSync(path.join(ROOT, 'verified-places.json'), 'utf8'));
const verifiedAttractions = JSON.parse(fs.readFileSync(path.join(ROOT, 'attractions-verified.json'), 'utf8'));

const VERIFIED_ON = '2026-07-30';

function haversineMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

function decimalPlaces(n) {
    const s = String(n);
    const i = s.indexOf('.');
    return i === -1 ? 0 : s.length - i - 1;
}

const coordMoves = []; // { id, name, meters }
const enrichedIds = [];

function enrichRecord(record, verified, extraFields) {
    const oldLat = record.lat;
    const oldLon = record.lon;
    const newLat = verified.lat;
    const newLon = verified.lon;

    if (typeof oldLat === 'number' && typeof oldLon === 'number') {
        const meters = haversineMeters(oldLat, oldLon, newLat, newLon);
        if (meters > 150) {
            coordMoves.push({ id: record.id, name: record.name || record.id, meters });
        }
    }

    record.lat = newLat;
    record.lon = newLon;
    if (verified.placeId) record.placeId = verified.placeId;
    if (verified.phone) record.phone = verified.phone;
    if (verified.hours) record.verifiedHours = verified.hours;
    if (Array.isArray(verified.closedDays) && verified.closedDays.length > 0) {
        record.closedDays = verified.closedDays;
    }
    if (verified.address) record.address = verified.address;
    if (verified.rating != null) record.verifiedRating = verified.rating;
    if (verified.ratingCount != null) record.ratingCount = verified.ratingCount;
    if (verified.phoneNote) record.phoneNote = verified.phoneNote;
    record.verifiedOn = VERIFIED_ON;

    if (extraFields) {
        if (verified.PRICE_FLAG) record.priceFlag = verified.PRICE_FLAG;
        if (verified.NOTE) record.verifyNote = verified.NOTE;
    }

    // A fresh verified pin supersedes any earlier "coarse coordinate" flag.
    delete record.needsCoordCheck;

    enrichedIds.push(record.id);
}

(L.food || []).forEach((record) => {
    const verified = verifiedPlaces[record.id];
    if (verified) enrichRecord(record, verified, false);
});

(L.attractions || []).forEach((record) => {
    const verified = verifiedAttractions[record.id];
    // Skip reference-only keys (ALL-CAPS / underscore keys, not attr-N ids).
    if (verified && /^attr-\d+$/.test(record.id)) enrichRecord(record, verified, true);
});

// ---------------------------------------------------------------------------
// Rebuild mapsUrl for every record in every category, and repoint the
// baked-in <a href="..."> nav links inside restHtml/bodyHtml/infoPanelHtml.
// ---------------------------------------------------------------------------

const HREF_FIELDS = ['restHtml', 'bodyHtml', 'infoPanelHtml'];
const MAPS_HREF_RE = /href="https:\/\/(?:www\.)?(?:maps\.google\.com\/\?q=|www\.google\.com\/maps\/search\/\?api=1&query=)[^"]*"/g;

let linksRebuilt = 0;
let hrefsRepointed = 0;
const needsCoordCheck = [];

function extractLegacyQueryText(record) {
    for (const field of HREF_FIELDS) {
        const html = record[field];
        if (!html) continue;
        const m = html.match(/href="https:\/\/(?:www\.)?maps\.google\.com\/\?q=([^"]*)"/);
        if (m) {
            try {
                return decodeURIComponent(m[1].replace(/\+/g, ' '));
            } catch (e) {
                return m[1].replace(/\+/g, ' ');
            }
        }
    }
    return null;
}

function rebuildMapsUrl(record) {
    const hasPlaceId = !!record.placeId;
    const hasPreciseCoords =
        typeof record.lat === 'number' &&
        typeof record.lon === 'number' &&
        decimalPlaces(record.lat) >= 4 &&
        decimalPlaces(record.lon) >= 4;

    const coordQuery = encodeURIComponent(`${record.lat},${record.lon}`);
    if (hasPlaceId) {
        return `https://www.google.com/maps/search/?api=1&query=${coordQuery}&query_place_id=${record.placeId}`;
    }
    if (hasPreciseCoords) {
        return `https://www.google.com/maps/search/?api=1&query=${coordQuery}`;
    }
    const legacyText = extractLegacyQueryText(record) || `${record.name || record.id} Corfu`;
    record.needsCoordCheck = true;
    needsCoordCheck.push(record.id);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(legacyText)}`;
}

Object.keys(L).forEach((category) => {
    (L[category] || []).forEach((record) => {
        const newUrl = rebuildMapsUrl(record);
        if (record.mapsUrl !== newUrl) linksRebuilt++;
        record.mapsUrl = newUrl;

        HREF_FIELDS.forEach((field) => {
            if (!record[field]) return;
            const before = record[field];
            const after = before.replace(MAPS_HREF_RE, `href="${newUrl}"`);
            if (after !== before) hrefsRepointed++;
            record[field] = after;
        });
    });
});

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

const header = `// Auto-generated. Location records for the Corfu guide.
//
// Fields added by scripts/apply-verified-places.js (${VERIFIED_ON}):
//   placeId        Google Place ID - pins the exact venue in Maps
//   phone          E.164 phone number, rendered as a tap-to-call link
//   verifiedHours  opening hours as reported by Google Places
//   closedDays     weekday codes the venue is CLOSED (SU/MO/TU/WE/TH/FR/SA)
//   verifiedRating Google rating at time of verification
//   address        street address as listed by Google
//   verifiedOn     date the above were checked
//   needsCoordCheck true when the coordinate is still coarse (<4 decimals)
//                   and the map link therefore falls back to a name search
//
// Records WITHOUT these fields have not been verified against Google Places -
// their hours/ratings are the original hand-entered values. Do not present
// them as verified.
//
// mapsUrl is generated, never hand-edited: re-run the script to rebuild.

window.CORFU_LOCATIONS = `;

const output = header + JSON.stringify(L, null, 2) + ';\n';
fs.writeFileSync(LOCATIONS_PATH, output, 'utf8');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

coordMoves.sort((a, b) => b.meters - a.meters);

console.log('=== apply-verified-places.js summary ===');
console.log(`Records enriched:        ${enrichedIds.length}`);
console.log(`mapsUrl links rebuilt:   ${linksRebuilt}`);
console.log(`Baked-in hrefs repointed: ${hrefsRepointed}`);
console.log('');
console.log(`Coordinates moved >150m (${coordMoves.length}), largest first:`);
coordMoves.forEach((m) => {
    console.log(`  ${(m.meters / 1000).toFixed(2)} km  ${m.id}  (${m.name})`);
});
console.log('');
console.log(`Records still needing a coordinate check (${needsCoordCheck.length}):`);
needsCoordCheck.forEach((id) => console.log(`  ${id}`));
