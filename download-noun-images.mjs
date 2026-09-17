// download-noun-images.mjs
// Pulls top 4 candidate photos per noun from Pixabay for human review.
// Saves to assets/images/nouns_review/{word}_1.png .. {word}_4.png

import fs from 'fs';
import path from 'path';

const API_KEY = '57511287-e404922fedf41b6fc9c611132';
const OUTPUT_DIR = './assets/images/nouns_review';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// All 84 nouns from nouns.js
const NOUNS = [
    'cup','plate','bowl','spoon','fork','knife','glass','pot','pan','kettle','stove','fridge',
    'water','juice','milk','bread','rice','egg','fruit','meat','soup','tea',
    'soap','towel','toilet','sink','toothbrush','mirror','shower','comb',
    'bed','pillow','blanket','lamp','clock','chair','door','window',
    'head','hand','arm','leg','foot','eye','ear','nose','mouth','finger',
    'shirt','pants','shoes','socks','hat','jacket','dress','belt',
    'car','bus','key','road','wheel','bike',
    'tree','flower','sun','rain','house','garden','sky','grass',
    'table','phone','book','pen','bag','box',
    'computer','television','remote','light','fan',
    'medicine','money','paper',
];

async function downloadCandidates(word) {
    // Check if we already have 4 candidates
    const expected = [1, 2, 3, 4].map(n => path.join(OUTPUT_DIR, `${word}_${n}.png`));
    const allExist = expected.every(p => fs.existsSync(p));
    if (allExist) {
        console.log(`skip (all 4 candidates exist): ${word}`);
        return;
    }

    const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(word)}&image_type=photo&safesearch=true&per_page=6`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.hits || data.hits.length === 0) {
            console.log(`[NO RESULT] ${word} — needs manual image`);
            return;
        }

        const candidates = data.hits.slice(0, 4);
        let savedCount = 0;

        for (let i = 0; i < candidates.length; i++) {
            const outPath = path.join(OUTPUT_DIR, `${word}_${i + 1}.png`);
            if (fs.existsSync(outPath)) {
                savedCount++;
                continue;
            }

            try {
                const imgUrl = candidates[i].webformatURL;
                const imgRes = await fetch(imgUrl);
                const buffer = Buffer.from(await imgRes.arrayBuffer());
                fs.writeFileSync(outPath, buffer);
                savedCount++;
            } catch (err) {
                console.error(`  Failed candidate ${i + 1} for ${word}: ${err.message}`);
            }
        }

        console.log(`saved: ${word} (${savedCount}/${candidates.length} candidates)`);
    } catch (err) {
        console.error(`ERROR fetching ${word}: ${err.message}`);
    }
}

async function run() {
    console.log(`=== Downloading candidates for ${NOUNS.length} nouns to ${OUTPUT_DIR} ===\n`);

    for (let i = 0; i < NOUNS.length; i++) {
        const word = NOUNS[i];
        process.stdout.write(`[${i + 1}/${NOUNS.length}] `);
        await downloadCandidates(word);
        await new Promise(r => setTimeout(r, 700)); // Respect Pixabay 100 req/min limit
    }

    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
    console.log(`\nDone! ${files.length} candidate files in ${OUTPUT_DIR}.`);
}

run();
