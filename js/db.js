/**
 * IndexedDB Wrapper — Database Layer
 *
 * Manages the 'aphasia-recovery' database with 7 object stores:
 *   words, people, places, customVocab, sessions, settings, commBoard
 *
 * On first launch, seeds starter data (nouns, verbs, pronouns,
 * numbers 1–1000, phrases) and the 13 communication board cards.
 */

import { STARTER_NOUNS }      from './data/nouns.js';
import { STARTER_VERBS }      from './data/verbs.js';
import { STARTER_PRONOUNS }   from './data/pronouns.js';
import { generateNumberEntries } from './data/numbers.js';
import { STARTER_PHRASES }    from './data/phrases.js';
import { generateId }         from './utils.js';

const DB_NAME    = 'aphasia-recovery';
const DB_VERSION = 1;

let dbInstance = null;

/* ================================================================
   OPEN / CREATE DATABASE
   ================================================================ */

/**
 * Open (or create) the database. Returns the IDBDatabase instance.
 * Idempotent — safe to call multiple times.
 */
export function openDB() {
    if (dbInstance) return Promise.resolve(dbInstance);

    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onerror = () => reject(req.error);

        req.onupgradeneeded = (e) => {
            const db = e.target.result;

            // ── words ────────────────────────────────────
            if (!db.objectStoreNames.contains('words')) {
                const ws = db.createObjectStore('words', { keyPath: 'id' });
                ws.createIndex('category', 'category', { unique: false });
                ws.createIndex('status',   'status',   { unique: false });
                ws.createIndex('theme',    'theme',    { unique: false });
                ws.createIndex('difficultyLevel', 'difficultyLevel', { unique: false });
            }

            // ── people (Family Mode) ─────────────────────
            if (!db.objectStoreNames.contains('people')) {
                const ps = db.createObjectStore('people', { keyPath: 'id' });
                ps.createIndex('name', 'name', { unique: false });
            }

            // ── places ───────────────────────────────────
            if (!db.objectStoreNames.contains('places')) {
                db.createObjectStore('places', { keyPath: 'id' });
            }

            // ── customVocab ──────────────────────────────
            if (!db.objectStoreNames.contains('customVocab')) {
                const cv = db.createObjectStore('customVocab', { keyPath: 'id' });
                cv.createIndex('text', 'text', { unique: false });
            }

            // ── sessions ─────────────────────────────────
            if (!db.objectStoreNames.contains('sessions')) {
                const ss = db.createObjectStore('sessions', { keyPath: 'id' });
                ss.createIndex('date', 'date', { unique: false });
            }

            // ── settings (single record, key = 'main') ──
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }

            // ── commBoard ────────────────────────────────
            if (!db.objectStoreNames.contains('commBoard')) {
                const cb = db.createObjectStore('commBoard', { keyPath: 'id' });
                cb.createIndex('order', 'order', { unique: false });
            }
        };

        req.onsuccess = (e) => {
            dbInstance = e.target.result;
            resolve(dbInstance);
        };
    });
}

/* ================================================================
   SEED INITIAL DATA (first launch only)
   ================================================================ */

/**
 * Check whether data has been seeded. If not, populate all stores.
 */
export async function seedIfNeeded() {
    const db = await openDB();

    // Check if words store is empty
    const count = await countRecords('words');
    if (count > 0) {
        // Migration: ensure existing words have syllableCount
        await ensureSyllableCounts();
        return;
    }

    console.log('[db] First launch — seeding starter data…');

    // ── Seed words ───────────────────────────────────────
    const allWords = [
        ...STARTER_NOUNS,
        ...STARTER_VERBS,
        ...STARTER_PRONOUNS,
        ...STARTER_PHRASES,
        ...generateNumberEntries()
    ].map(w => ({
        id: generateId(),
        imageDataUrl: null,
        status: 'unable',
        timesAttempted: 0,
        timesIndependent: 0,
        lastPracticed: null,
        ...w
    }));

    await putMany('words', allWords);

    // ── Seed communication board ─────────────────────────
    const commCards = [
        { emoji: '💧', text: 'Water',                   useAudio: false, order: 1 },
        { emoji: '🍽️', text: 'Food',                    useAudio: false, order: 2 },
        { emoji: '📱', text: 'Phone',                   useAudio: false, order: 3 },
        { emoji: '🚻', text: 'Bathroom',                useAudio: false, order: 4 },
        { emoji: '💊', text: 'Medicine',                useAudio: false, order: 5 },
        { emoji: '😴', text: "I'm tired",               useAudio: false, order: 6 },
        { emoji: '🍽️', text: "I'm hungry",              useAudio: false, order: 7 },
        { emoji: '🚪', text: 'I want to go outside',    useAudio: false, order: 8 },
        { emoji: '🆘', text: 'Please help me',          useAudio: false, order: 9 },
        { emoji: '✅', text: 'Yes',                     useAudio: false, order: 10 },
        { emoji: '❌', text: 'No',                      useAudio: false, order: 11 },
        { emoji: '😣', text: "I'm in pain",             useAudio: false, order: 12 },
        { emoji: '🛏️', text: 'I need to rest',          useAudio: false, order: 13 },
        // CALL cards — use pre-recorded audio, not TTS
        { emoji: '📞', text: 'Call Pheevami',           useAudio: true,  audioBlob: null, order: 14 },
        { emoji: '📞', text: 'Call Bivaphee',           useAudio: true,  audioBlob: null, order: 15 },
        { emoji: '📞', text: 'Call Weephee',            useAudio: true,  audioBlob: null, order: 16 },
        { emoji: '📞', text: 'Call Ndzinvaphee',        useAudio: true,  audioBlob: null, order: 17 },
    ].map(c => ({ id: generateId(), ...c }));

    await putMany('commBoard', commCards);

    // ── Seed default settings ────────────────────────────
    await put('settings', {
        key: 'main',
        voiceURI: null,
        speechRate: 0.6,
        sessionLengthMinutes: 30
    });

    console.log(`[db] Seeded ${allWords.length} words, ${commCards.length} comm cards.`);
}

/**
 * Migration helper: add syllableCount to existing words in IndexedDB if missing.
 */
async function ensureSyllableCounts() {
    try {
        const existing = await getAll('words');
        const missing = existing.filter(w => (w.category === 'noun' || w.category === 'verb') && !w.syllableCount);
        if (missing.length === 0) return;

        const nounMap = new Map(STARTER_NOUNS.map(n => [n.text.toLowerCase(), n.syllableCount]));
        const verbMap = new Map(STARTER_VERBS.map(v => [v.text.toLowerCase(), v.syllableCount]));

        const updates = [];
        for (const w of missing) {
            const key = (w.text || '').toLowerCase().trim();
            const count = w.category === 'noun' ? nounMap.get(key) : verbMap.get(key);
            if (count) {
                w.syllableCount = count;
                updates.push(w);
            }
        }

        if (updates.length > 0) {
            await putMany('words', updates);
            console.log(`[db] Migrated ${updates.length} words with syllableCount.`);
        }
    } catch (err) {
        console.warn('[db] Syllable migration skipped:', err.message);
    }
}

/* ================================================================
   CRUD HELPERS
   ================================================================ */

/** Get all records from a store */
export async function getAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    });
}

/** Get a single record by its primary key */
export async function getById(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    });
}

/** Get all records matching an index value */
export async function getByIndex(storeName, indexName, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const idx = store.index(indexName);
        const req = idx.getAll(value);
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    });
}

/** Put (insert or update) a single record */
export async function put(storeName, record) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(record);
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    });
}

/** Put many records in a single transaction */
export async function putMany(storeName, records) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        for (const rec of records) {
            store.put(rec);
        }
        tx.oncomplete = () => resolve();
        tx.onerror    = () => reject(tx.error);
    });
}

/** Delete a record by its primary key */
export async function remove(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror   = () => reject(req.error);
    });
}

/** Count records in a store */
export async function countRecords(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    });
}

/** Clear all records in a store */
export async function clearStore(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror   = () => reject(req.error);
    });
}

/** Get settings (returns the single 'main' settings record) */
export async function getSettings() {
    return await getById('settings', 'main');
}

/** Update a single setting key */
export async function updateSetting(key, value) {
    const settings = await getSettings();
    if (settings) {
        settings[key] = value;
        await put('settings', settings);
    }
}

/* ================================================================
   BACKUP — Export / Import
   ================================================================ */

const ALL_STORES = ['words', 'people', 'places', 'customVocab', 'sessions', 'settings', 'commBoard'];

/**
 * Export all data as a JSON-serializable object.
 * Blobs (audio) are converted to Base64 data URLs for JSON transport.
 */
export async function exportAllData() {
    const data = {};
    for (const storeName of ALL_STORES) {
        const records = await getAll(storeName);
        // Convert Blob fields to Base64
        data[storeName] = await Promise.all(records.map(rec => serializeRecord(rec)));
    }
    data._exportDate = new Date().toISOString();
    data._version = DB_VERSION;
    return data;
}

/**
 * Import data from a backup object, replacing all existing data.
 */
export async function importAllData(data) {
    for (const storeName of ALL_STORES) {
        if (data[storeName]) {
            await clearStore(storeName);
            const records = await Promise.all(data[storeName].map(rec => deserializeRecord(rec)));
            await putMany(storeName, records);
        }
    }
}

/* ── Blob ↔ Base64 helpers ────────────────────────────── */

async function serializeRecord(record) {
    const out = { ...record };
    for (const key of Object.keys(out)) {
        if (out[key] instanceof Blob) {
            out[key] = await blobToBase64(out[key]);
            out[`_blob_${key}`] = true;  // mark for deserialization
        }
    }
    return out;
}

async function deserializeRecord(record) {
    const out = { ...record };
    for (const key of Object.keys(out)) {
        if (out[`_blob_${key}`]) {
            out[key] = base64ToBlob(out[key]);
            delete out[`_blob_${key}`];
        }
    }
    return out;
}

function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

function base64ToBlob(dataUrl) {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
}
