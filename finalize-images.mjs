// finalize-images.mjs
// Usage: node finalize-images.mjs
//
// Scans review folders (assets/images/nouns_review & assets/images/verbs_review).
// For each word, expects EXACTLY ONE surviving numbered file (after you delete 3 rejected candidates in thumbnail view).
// Renames and moves that single survivor to assets/images/nouns/{word}.png (or verbs/).
// If a word has 0 or >1 candidates remaining, skips it and warns clearly.

import fs from 'fs';
import path from 'path';

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

const VERBS = [
    'eat', 'drink', 'go', 'sit', 'stand', 'walk', 'sleep', 'want', 'need', 'like',
    'open', 'close', 'give', 'take', 'put', 'come', 'look', 'see', 'hear', 'run',
    'talk', 'say', 'read', 'write', 'wash', 'cook', 'clean', 'call', 'help', 'wake',
    'drive', 'stop', 'start', 'work', 'play', 'push', 'pull', 'hold', 'turn', 'wait',
];

function processReviewFolder(label, reviewDir, targetDir, expectedWords) {
    console.log(`\n==================================================`);
    console.log(`Processing ${label}`);
    console.log(`Review source: ${reviewDir}`);
    console.log(`Target destination: ${targetDir}`);
    console.log(`==================================================\n`);

    if (!fs.existsSync(reviewDir)) {
        console.log(`[INFO] Review directory "${reviewDir}" does not exist yet.`);
        return;
    }

    fs.mkdirSync(targetDir, { recursive: true });

    const reviewFiles = fs.readdirSync(reviewDir);

    // Group files by word: {word}_{num}.png
    const filesByWord = new Map();
    for (const file of reviewFiles) {
        const match = file.match(/^(.+)_(\d+)\.png$/i);
        if (match) {
            const word = match[1].toLowerCase();
            if (!filesByWord.has(word)) {
                filesByWord.set(word, []);
            }
            filesByWord.get(word).push(file);
        }
    }

    let finalizedCount = 0;
    const attentionList = [];

    // Check all expected words
    for (const word of expectedWords) {
        const candidates = filesByWord.get(word) || [];
        const destPath = path.join(targetDir, `${word}.png`);

        if (candidates.length === 1) {
            // Exactly 1 surviving candidate — finalize it!
            const survivor = candidates[0];
            const srcPath = path.join(reviewDir, survivor);
            fs.copyFileSync(srcPath, destPath);
            fs.unlinkSync(srcPath);
            console.log(`  [OK] "${word}" finalized from ${survivor} → ${word}.png`);
            finalizedCount++;
        } else if (candidates.length === 0) {
            // 0 candidates in review folder
            if (fs.existsSync(destPath)) {
                console.log(`  [READY] "${word}" is already finalized (${word}.png exists)`);
                finalizedCount++;
            } else {
                console.log(`  [WARN] "${word}": 0 candidates found in review folder`);
                attentionList.push({ word, reason: '0 candidates remaining in review folder' });
            }
        } else {
            // >1 candidates remaining
            console.log(`  [WARN] "${word}": ${candidates.length} candidates remaining (${candidates.join(', ')}) — delete ${candidates.length - 1} to finalize`);
            attentionList.push({
                word,
                reason: `${candidates.length} candidates remaining (${candidates.join(', ')})`,
            });
        }
    }

    // Summary
    console.log(`\n--- ${label} Summary ---`);
    console.log(`Finalized / Ready: ${finalizedCount} / ${expectedWords.length}`);
    if (attentionList.length > 0) {
        console.log(`\nWords needing attention (${attentionList.length}):`);
        for (const item of attentionList) {
            console.log(`  - ${item.word}: ${item.reason}`);
        }
    } else {
        console.log(`All ${expectedWords.length} ${label.toLowerCase()} are finalized!`);
    }
}

function run() {
    processReviewFolder(
        'Nouns',
        './assets/images/nouns_review',
        './assets/images/nouns',
        NOUNS
    );

    processReviewFolder(
        'Verbs',
        './assets/images/verbs_review',
        './assets/images/verbs',
        VERBS
    );

    console.log('\nFinalize run complete.\n');
}

run();
