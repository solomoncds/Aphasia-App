// download-verb-images.mjs
// Pulls top 4 candidate photos per verb from Pixabay for human review.
// Saves to assets/images/verbs_review/{word}_1.png .. {word}_4.png

import fs from 'fs';
import path from 'path';

const API_KEY = '57511287-e404922fedf41b6fc9c611132';
const OUTPUT_DIR = './assets/images/verbs_review';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// All 40 verbs from verbs.js
const VERBS = [
    'eat', 'drink', 'go', 'sit', 'stand', 'walk', 'sleep', 'want', 'need', 'like',
    'open', 'close', 'give', 'take', 'put', 'come', 'look', 'see', 'hear', 'run',
    'talk', 'say', 'read', 'write', 'wash', 'cook', 'clean', 'call', 'help', 'wake',
    'drive', 'stop', 'start', 'work', 'play', 'push', 'pull', 'hold', 'turn', 'wait',
];

async function downloadCandidates(word) {
    const expected = [1, 2, 3, 4].map(n => path.join(OUTPUT_DIR, `${word}_${n}.png`));
    const allExist = expected.every(p => fs.existsSync(p));
    if (allExist) {
        console.log(`skip (all 4 candidates exist): ${word}`);
        return;
    }

    // Try "person {word}" first for adult action photos
    const query = `person ${word}`;
    const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true&per_page=6`;

    try {
        let res = await fetch(url);
        let data = await res.json();
        let hits = data.hits || [];

        // If fewer than 4 hits, supplement with searching the verb alone
        if (hits.length < 4) {
            const fallbackUrl = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(word)}&image_type=photo&safesearch=true&per_page=6`;
            const fbRes = await fetch(fallbackUrl);
            const fbData = await fbRes.json();
            const existingIds = new Set(hits.map(h => h.id));
            for (const h of (fbData.hits || [])) {
                if (!existingIds.has(h.id)) {
                    hits.push(h);
                    existingIds.add(h.id);
                }
                if (hits.length >= 4) break;
            }
        }

        if (hits.length === 0) {
            console.log(`[NO RESULT] ${word} — needs manual image`);
            return;
        }

        const candidates = hits.slice(0, 4);
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
    console.log(`=== Downloading candidates for ${VERBS.length} verbs to ${OUTPUT_DIR} ===\n`);

    for (let i = 0; i < VERBS.length; i++) {
        const word = VERBS[i];
        process.stdout.write(`[${i + 1}/${VERBS.length}] `);
        await downloadCandidates(word);
        await new Promise(r => setTimeout(r, 700)); // Respect Pixabay 100 req/min limit
    }

    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
    console.log(`\nDone! ${files.length} candidate files in ${OUTPUT_DIR}.`);
}

run();
