/**
 * Session State Manager
 *
 * Holds the current exercise queue, position, and results.
 * Screens read from this to know what to show next.
 * Supports both session mode and standalone exercise mode.
 */

import { getAll, getSettings, put } from './db.js';
import { shuffleArray, generateId, getTodayKey } from './utils.js';

/* ── State ─────────────────────────────────────────────── */

const state = {
    active: false,
    id: null,
    startTime: null,
    queue: [],            // [{ type, label, items[] }]
    currentSegment: 0,
    currentItem: 0,
    results: [],          // [{ wordId, type, report, timestamp }]
    focusAreas: [],
};

export function getSession()       { return state; }
export function isSessionActive()  { return state.active; }

/* ── Start ─────────────────────────────────────────────── */

/**
 * Build an exercise queue and start a session.
 * @param {string[]} focusAreas — ['words','pronunciation','verbs','sentences','conversation']
 */
export async function startSession(focusAreas) {
    const allWords = await getAll('words');

    state.active         = true;
    state.id             = generateId();
    state.startTime      = Date.now();
    state.queue          = [];
    state.currentSegment = 0;
    state.currentItem    = 0;
    state.results        = [];
    state.focusAreas     = focusAreas;

    for (const area of focusAreas) {
        const segment = await buildSegment(area, allWords);
        if (segment && segment.items.length > 0) {
            state.queue.push(segment);
        }
    }

    return state;
}

async function buildSegment(area, allWords) {
    switch (area) {

        case 'words': {
            const nouns = allWords.filter(w => w.category === 'noun');
            const unable   = nouns.filter(w => w.status === 'unable');
            const model    = nouns.filter(w => w.status === 'model');
            const cue      = nouns.filter(w => w.status === 'cue');
            const indep    = nouns.filter(w => w.status === 'independent');

            let items = [
                ...pick(unable, 4),
                ...pick(model,  3),
                ...pick(cue,    2),
                ...pick(indep,  1),
            ];
            // If not enough from prioritised buckets, fill from all nouns
            if (items.length < 5) items = pick(nouns, 10);

            return { type: 'word-retrieval', label: 'Word Retrieval', items: shuffleArray(items) };
        }

        case 'pronunciation': {
            const candidates = allWords.filter(w =>
                (w.category === 'noun' || w.category === 'verb') && w.status !== 'independent'
            );
            const fallback = allWords.filter(w => w.category === 'noun' || w.category === 'verb');
            const items = candidates.length >= 5 ? pick(candidates, 8) : pick(fallback, 8);
            return { type: 'pronunciation', label: 'Pronunciation Drill', items: shuffleArray(items) };
        }

        case 'verbs': {
            const verbs    = allWords.filter(w => w.category === 'verb');
            const pronouns = allWords.filter(w => w.category === 'pronoun' && w.type === 'subject');
            const items = pick(verbs, 5).map(v => ({
                ...v,
                _pronoun: pronouns.length > 0 ? pronouns[Math.floor(Math.random() * pronouns.length)] : null
            }));
            return { type: 'verbs-pronouns', label: 'Verbs & Pronouns', items };
        }

        case 'sentences': {
            const { SENTENCE_TEMPLATES } = await import('./data/sentences.js');
            let items = [];
            for (const level of [1, 2, 3, 4]) {
                const pool = SENTENCE_TEMPLATES.filter(s => s.level === level);
                items.push(...pick(pool, 2));
            }
            return { type: 'sentence-builder', label: 'Sentence Builder', items: shuffleArray(items) };
        }

        case 'conversation': {
            return { type: 'conversation', label: 'Conversation', items: [{ id: 'conv' }] };
        }

        default: return null;
    }
}

/** Pick up to n random items from an array. Always returns an array. */
function pick(arr, n) {
    if (!arr || arr.length === 0) return [];
    const shuffled = shuffleArray(arr);
    return shuffled.slice(0, Math.min(n, shuffled.length));
}

/* ── Navigation ────────────────────────────────────────── */

/** Get the current exercise (type + item + counters). Returns null if done. */
export function getCurrentExercise() {
    if (!state.active || state.currentSegment >= state.queue.length) return null;

    const seg  = state.queue[state.currentSegment];
    if (state.currentItem >= seg.items.length) return null;

    return {
        type:         seg.type,
        label:        seg.label,
        item:         seg.items[state.currentItem],
        itemIndex:    state.currentItem,
        itemCount:    seg.items.length,
        segmentIndex: state.currentSegment,
        segmentCount: state.queue.length,
    };
}

/** Record a result and advance. Returns the next exercise or null. */
export function advanceExercise(result) {
    if (result) state.results.push({ ...result, timestamp: Date.now() });

    const seg = state.queue[state.currentSegment];

    if (state.currentItem < seg.items.length - 1) {
        state.currentItem++;
    } else if (state.currentSegment < state.queue.length - 1) {
        state.currentSegment++;
        state.currentItem = 0;
    } else {
        // All done
        return null;
    }

    return getCurrentExercise();
}

/* ── End / Save ────────────────────────────────────────── */

/** End the session and persist it to IndexedDB. */
export async function endSession() {
    if (!state.active) return null;

    const minutes = Math.max(1, Math.round((Date.now() - state.startTime) / 60000));

    const record = {
        id:                 state.id,
        date:               getTodayKey(),
        exercisesCompleted: state.results.length,
        minutesPracticed:   minutes,
        wordIds:            state.results.map(r => r.wordId).filter(Boolean),
        results:            state.results,
    };

    await put('sessions', record);

    state.active         = false;
    state.queue          = [];
    state.currentSegment = 0;
    state.currentItem    = 0;

    return record;
}

/** Overall progress through the session (0–1). */
export function getSessionProgress() {
    if (!state.active || state.queue.length === 0) return 0;

    let total = 0, done = 0;
    for (let s = 0; s < state.queue.length; s++) {
        const n = state.queue[s].items.length;
        total += n;
        if      (s < state.currentSegment)  done += n;
        else if (s === state.currentSegment) done += state.currentItem;
    }
    return total > 0 ? done / total : 0;
}
