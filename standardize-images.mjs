// standardize-images.mjs
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Disable sharp cache to prevent Windows EBUSY file locks
sharp.cache(false);

const folders = ['./assets/images/nouns', './assets/images/verbs'];

async function standardize(folder) {
    const files = fs.readdirSync(folder);

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const base = path.basename(file, ext);
        const targetPath = path.join(folder, `${base}.png`);

        if (ext === '.png') continue; // already correct

        const sourcePath = path.join(folder, file);
        const inputBuffer = fs.readFileSync(sourcePath);
        await sharp(inputBuffer).png().toFile(targetPath);
        fs.unlinkSync(sourcePath); // remove the original non-png file
        console.log(`converted: ${file} -> ${base}.png`);
    }
}

for (const folder of folders) {
    await standardize(folder);
}
console.log('Done.');
