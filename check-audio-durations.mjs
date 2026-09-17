import fs from 'fs';
import path from 'path';

const AUDIO_DIR = './assets/audio';

function getWavFiles(dir) {
    let files = [];
    if (!fs.existsSync(dir)) return files;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(getWavFiles(full));
        } else if (entry.isFile() && entry.name.endsWith('.wav')) {
            files.push(full);
        }
    }
    return files;
}

const allFilePaths = getWavFiles(AUDIO_DIR);

const results = [];

for (const fullPath of allFilePaths) {
    const relFile = path.relative(AUDIO_DIR, fullPath).replace(/\\/g, '/');
    const buf = fs.readFileSync(fullPath);
    if (buf.length < 44) {
        results.push({ file: relFile, durationSeconds: (0).toFixed(3), rawDuration: 0 });
        continue;
    }

    const sampleRate = buf.readUInt32LE(24);
    const bitsPerSample = buf.readUInt16LE(34);
    const channels = buf.readUInt16LE(22);
    
    // Find data chunk safely (usually at byte 36, so size at 40)
    let dataSize = 0;
    const dataIdx = buf.indexOf(Buffer.from('data'));
    if (dataIdx !== -1 && dataIdx + 8 <= buf.length) {
        dataSize = buf.readUInt32LE(dataIdx + 4);
    } else {
        dataSize = buf.readUInt32LE(40);
    }

    const bytesPerSec = sampleRate * channels * (bitsPerSample / 8);
    const durationSeconds = bytesPerSec > 0 ? (dataSize / bytesPerSec) : 0;
    results.push({ file: relFile, durationSeconds: durationSeconds.toFixed(3), rawDuration: durationSeconds });
}

results.sort((a, b) => a.rawDuration - b.rawDuration);

console.log('Shortest 20 files (likely the broken ones):');
results.slice(0, 20).forEach(r => console.log(`${r.durationSeconds}s  ${r.file}`));

const suspicious = results.filter(r => r.rawDuration < 0.15);
console.log(`\n${suspicious.length} files under 0.15s (almost certainly silent/broken):`);
suspicious.forEach(r => console.log(r.file));
