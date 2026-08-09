// One-off analysis: what outside the four legacy tab sections still depends
// on DOM that lives INSIDE them? Anything listed here breaks the moment those
// sections are deleted (Phase C).
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const LEGACY = ['beaches', 'food', 'attractions', 'gems'];

const doc = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')).window.document;

const ids = new Set();
LEGACY.forEach(t => {
    const s = doc.getElementById(t);
    if (s) s.querySelectorAll('[id]').forEach(e => ids.add(e.id));
});
console.log('DOM ids inside the 4 legacy sections: ' + ids.size);

// cards.js and filters.js exist only to serve those sections, so they die
// with them - a reference from there is not a blocker. Everything else is.
const OWNED_BY_LEGACY = ['js/cards.js', 'js/filters.js'];

const files = fs.readdirSync(path.join(ROOT, 'js'))
    .map(f => 'js/' + f)
    .filter(f => !OWNED_BY_LEGACY.includes(f));

const hits = {};
for (const id of ids) {
    for (const f of files) {
        const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
        if (src.includes("'" + id + "'") || src.includes('"' + id + '"') || src.includes('`' + id + '`')) {
            (hits[f] = hits[f] || []).push(id);
        }
    }
}

console.log('\nReferenced from JS that will SURVIVE deletion:');
const entries = Object.entries(hits);
if (!entries.length) console.log('  (none)');
entries.forEach(([f, v]) => console.log('  ' + f + '\n    -> ' + v.join(', ')));

console.log('\nFunctions defined in legacy-owned files but called elsewhere:');
const owned = OWNED_BY_LEGACY.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
const defined = [...owned.matchAll(/^function\s+([A-Za-z0-9_]+)/gm)].map(m => m[1]);
const outside = files.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
    + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
defined.forEach(fn => {
    const calls = (outside.match(new RegExp('\\b' + fn + '\\s*\\(', 'g')) || []).length;
    if (calls > 0) console.log('  ' + fn + '() -> ' + calls + ' call site(s) outside');
});
