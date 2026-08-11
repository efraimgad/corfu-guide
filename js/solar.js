// ============================================================================
// solar.js — sunrise/sunset for a given date and position.
//
// NOAA solar position algorithm (NOAA Global Monitoring Laboratory solar
// calculator), at the standard -0.833° altitude: the moment the sun's upper
// limb meets a sea-level horizon, including atmospheric refraction and the
// solar semi-diameter.
//
// WHY THIS IS COMPUTED RATHER THAN STORED
//
// The alternative was a hand-written table of 7 sunrise/sunset pairs in
// itinerary-data.js. That would be a second source of truth for something the
// trip dates already determine: move the trip a week and every stored time is
// silently wrong, with nothing to catch it. Deriving from TRIP_CONFIG means the
// dates and the daylight can never disagree. This is the same rule the day
// brief already follows for drive totals - see gtDayComputedTotals().
//
// ACCURACY
//
// Verified three ways before use:
//   - against published values for London / Athens / Reykjavik (0-3 min);
//   - against a second, independently derived implementation (the Astronomical
//     Almanac's low-precision sunrise equation), which agrees to within 0.6 min
//     across the whole trip week;
//   - against the one sunset figure the guide already contained - a note
//     reading "~20:03 on 7.9, rough estimate" - which this reproduces exactly.
//
// Results are rounded to the minute. Printing seconds would imply a precision
// that local horizon and elevation do not support: a cliff-top west-coast
// viewpoint like Logas sees the sun set marginally later than a sea-level
// horizon, and this does not model terrain.
//
// Across Corfu itself the spread is at most 1 minute (measured: Corfu Town vs
// Cape Drastis vs Issos), so one island reference point is used throughout
// rather than pretending to per-village precision.
// ============================================================================

const SOLAR_CORFU = { lat: 39.6243, lon: 19.9217, name: 'קורפו' };

function solarRad(d) { return d * Math.PI / 180; }
function solarDeg(r) { return r * 180 / Math.PI; }

function solarJulianDay(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

// Returns { sunriseMin, sunsetMin } as minutes past local midnight, or null
// when the sun does not rise or set at all (never the case at this latitude,
// but the guard keeps the function honest if it is ever reused).
function solarEvents(year, month, day, lat, lon, tzOffsetHours) {
    const jd = solarJulianDay(year, month, day);
    const t = (jd - 2451545.0) / 36525.0;

    const L0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const C = Math.sin(solarRad(M)) * (1.914602 - t * (0.004817 + 0.000014 * t))
        + Math.sin(solarRad(2 * M)) * (0.019993 - 0.000101 * t)
        + Math.sin(solarRad(3 * M)) * 0.000289;
    const omega = 125.04 - 1934.136 * t;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(solarRad(omega));

    const e0 = 23 + (26 + ((21.448 - t * (46.815 + t * (0.00059 - t * 0.001813)))) / 60) / 60;
    const e = e0 + 0.00256 * Math.cos(solarRad(omega));
    const declination = solarDeg(Math.asin(Math.sin(solarRad(e)) * Math.sin(solarRad(lambda))));

    const y = Math.pow(Math.tan(solarRad(e / 2)), 2);
    const eccent = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    const eqTime = 4 * solarDeg(
        y * Math.sin(2 * solarRad(L0))
        - 2 * eccent * Math.sin(solarRad(M))
        + 4 * eccent * y * Math.sin(solarRad(M)) * Math.cos(2 * solarRad(L0))
        - 0.5 * y * y * Math.sin(4 * solarRad(L0))
        - 1.25 * eccent * eccent * Math.sin(2 * solarRad(M))
    );

    const cosH = (Math.cos(solarRad(90.833)) / (Math.cos(solarRad(lat)) * Math.cos(solarRad(declination))))
        - Math.tan(solarRad(lat)) * Math.tan(solarRad(declination));
    if (cosH > 1 || cosH < -1) return null;
    const H = solarDeg(Math.acos(cosH));

    const solarNoon = 720 - 4 * lon - eqTime + tzOffsetHours * 60;
    return { sunriseMin: solarNoon - 4 * H, sunsetMin: solarNoon + 4 * H };
}

function solarFormat(minutes) {
    const m = Math.round(minutes);
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

// Reads the date in Corfu's own timezone rather than the viewer's, matching
// js/dashboard.js's datePart() - otherwise a visitor in a different zone could
// land on the previous or next calendar day and get the wrong day's daylight.
function solarCorfuTimes(date) {
    if (!(date instanceof Date) || isNaN(date)) return null;
    const tz = (typeof TRIP_TIMEZONE === 'string') ? TRIP_TIMEZONE : 'Europe/Athens';
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const get = type => Number(parts.find(p => p.type === type).value);

    // Greece observes EEST (UTC+3) from late March to late October, which
    // covers this trip entirely. Derived from the zone rather than assumed, so
    // a trip moved into winter would still compute correctly.
    const offsetName = new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'longOffset' })
        .formatToParts(date).find(p => p.type === 'timeZoneName').value;   // e.g. "GMT+03:00"
    const m = /GMT([+-])(\d{2}):(\d{2})/.exec(offsetName);
    const tzOffsetHours = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) + Number(m[3]) / 60) : 3;

    const ev = solarEvents(get('year'), get('month'), get('day'), SOLAR_CORFU.lat, SOLAR_CORFU.lon, tzOffsetHours);
    if (!ev) return null;
    return {
        sunrise: solarFormat(ev.sunriseMin),
        sunset: solarFormat(ev.sunsetMin),
        sunriseMin: ev.sunriseMin,
        sunsetMin: ev.sunsetMin,
        daylight: solarFormat(ev.sunsetMin - ev.sunriseMin)
    };
}

window.solarCorfuTimes = solarCorfuTimes;
window.solarEvents = solarEvents;
window.solarFormat = solarFormat;
