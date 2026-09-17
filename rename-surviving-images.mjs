// rename-surviving-images.mjs
import { STARTER_NOUNS } from './js/data/nouns.js';
import { STARTER_VERBS } from './js/data/verbs.js';
import fs from 'fs';
import path from 'path';

function renameLeftovers(folder, entries) {
    const words = entries.map(e => e.text);

    for (const word of words) {
        const cleanPath = path.join(folder, `${word}.png`);
        if (fs.existsSync(cleanPath)) continue; // already fine, skip

        const allFiles = fs.readdirSync(folder);
        const matches = allFiles.filter(f => new RegExp(`^${word}_\\d+\\.png$`).test(f));

        if (matches.length === 0) {
            console.log(`MISSING entirely: ${word}`);
        } else if (matches.length === 1) {
            fs.renameSync(path.join(folder, matches[0]), cleanPath);
            console.log(`renamed: ${matches[0]} -> ${word}.png`);
        } else {
            console.log(`MULTIPLE leftovers for "${word}" — needs manual pick: ${matches.join(', ')}`);
        }
    }
}

renameLeftovers('./assets/images/nouns', STARTER_NOUNS);
renameLeftovers('./assets/images/verbs', STARTER_VERBS);
console.log('Done.');
