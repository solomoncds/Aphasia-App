/**
 * Session State Manager
 *
 * Holds the current exercise queue, position, and results.
 * Screens read from this to know what to show next.
 * Supports both session mode and standalone exercise mode.
 */

import { getAll, getSettings, put } from './db.js';
import { shuffleArray, generateId, getTodayKey,
         getTodayTheme, getThemeNouns, POSSESSIVE_PRONOUNS } from './utils.js';

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
    todayTheme: null,     // { key, label, emoji } — theme for this session
};

export function getSession()       { return state; }
export function isSessionActive()  { return state.active; }

/* ── Start ─────────────────────────────────────────────── */

/**
 * Build an exercise queue and start a session.
 * @param {string[]} focusAreas — subset of SESSION_CATEGORIES keys:
 *   'words' | 'verbs-pronouns' | 'pronunciation' | 'sentences' |
 *   'sequences' | 'conversation' | 'comprehension'
 */
export async function startSession(focusAreas) {
    const allWords    = await getAll('words');
    const allSessions = await getAll('sessions');

    state.active         = true;
    state.id             = generateId();
    state.startTime      = Date.now();
    state.queue          = [];
    state.currentSegment = 0;
    state.currentItem    = 0;
    state.results        = [];
    state.focusAreas     = focusAreas;
    state.todayTheme     = getTodayTheme(allSessions.length);

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
            // Strictly use today's theme nouns — no global fallback
            const themeNouns = getThemeNouns(state.todayTheme, allWords);
            if (themeNouns.length === 0) return null;

            const unable = themeNouns.filter(w => w.status === 'unable');
            const model  = themeNouns.filter(w => w.status === 'model');
            const cue    = themeNouns.filter(w => w.status === 'cue');
            const indep  = themeNouns.filter(w => w.status === 'independent');

            let items = [
                ...pick(unable, 4),
                ...pick(model,  3),
                ...pick(cue,    2),
                ...pick(indep,  1),
            ];
            // If status-filtered picks are too few, fill from the full theme pool
            // (including mastered words) — never leak outside the theme
            if (items.length < 3) items = pick(themeNouns, Math.min(10, themeNouns.length));

            return { type: 'word-retrieval', label: 'Word Retrieval', items: shuffleArray(items) };
        }

        case 'pronunciation': {
            // Strictly use today's theme nouns — no global fallback
            const themeNouns = getThemeNouns(state.todayTheme, allWords);
            if (themeNouns.length === 0) return null;

            const candidates = themeNouns.filter(w => w.status !== 'independent');
            // Prefer non-mastered words, but use full theme pool if most are mastered
            const items = candidates.length >= 3
                ? pick(candidates, Math.min(8, candidates.length))
                : pick(themeNouns, Math.min(8, themeNouns.length));
            return { type: 'pronunciation', label: 'Pronunciation Drill', items: shuffleArray(items) };
        }

        case 'verbs-pronouns': {
            // Intentionally theme-independent: Verbs & Pronouns always rotates through
            // the full verb list regardless of today's noun category. Verb conjugation
            // practice is a separate skill from topic-based noun/sentence work.
            const verbs    = allWords.filter(w => w.category === 'verb');
            const pronouns = allWords.filter(w => w.category === 'pronoun' && w.type === 'subject');
            const items = pick(verbs, 5).map(v => ({
                ...v,
                _pronoun: pronouns.length > 0 ? pronouns[Math.floor(Math.random() * pronouns.length)] : null
            }));
            return { type: 'verbs-pronouns', label: 'Verbs & Pronouns', items };
        }

        case 'sentences': {
            // Dynamic sentences sourced from today's theme nouns.
            // Uses the 4 prescribed frames in increasing difficulty order.
            // Falls back to the curated SENTENCE_TEMPLATES if theme has no nouns.
            const themeNouns = getThemeNouns(state.todayTheme, allWords);

            if (themeNouns.length === 0) {
                // Fallback: curated templates (same as standalone screen)
                const { SENTENCE_TEMPLATES } = await import('./data/sentences.js');
                let items = [];
                for (const level of [1, 2, 3, 4]) {
                    const pool = SENTENCE_TEMPLATES.filter(s => s.level === level);
                    items.push(...pick(pool, 2));
                }
                return { type: 'sentence-builder', label: 'Sentence Builder', items: shuffleArray(items) };
            }

            // Cycle through shuffled theme nouns, one per level (repeating if needed)
            const wordPool = shuffleArray(themeNouns);
            const getWord  = (i) => wordPool[i % wordPool.length];

            const FRAMES = [
                {
                    level: 1, structure: 'S + V + O',
                    build: (w) => ({
                        level: 1, structure: 'S + V + O',
                        text:  `I want ${w.text}.`,
                        words: ['I', 'want', `${w.text}.`],
                    })
                },
                {
                    level: 2, structure: 'S + V + Det + O',
                    build: (w) => ({
                        level: 2, structure: 'S + V + Det + O',
                        text:  `Give me the ${w.text}.`,
                        words: ['Give', 'me', 'the', `${w.text}.`],
                    })
                },
                {
                    level: 3, structure: 'Wh + Aux + Det + O',
                    build: (w) => ({
                        level: 3, structure: 'Wh + Aux + Det + O',
                        text:  `Where is the ${w.text}?`,
                        words: ['Where', 'is', 'the', `${w.text}?`],
                    })
                },
                {
                    level: 4, structure: 'S + V + Det + O + Adv',
                    build: (w) => ({
                        level: 4, structure: 'S + V + Det + O + Adv',
                        text:  `I need the ${w.text} now.`,
                        words: ['I', 'need', 'the', `${w.text}`, 'now.'],
                    })
                },
            ];

            // Generate one sentence per frame, cycling words if fewer than 4 nouns
            const items = FRAMES.map((frame, i) => frame.build(getWord(i)));

            return {
                type:  'sentence-builder',
                label: `Sentences — ${state.todayTheme.label}`,
                items,
            };
        }

        case 'pronoun-nouns': {
            // Pairs shuffled theme nouns with possessive pronouns (my, your, his, her, our, their)
            const themeNouns = getThemeNouns(state.todayTheme, allWords);
            if (themeNouns.length === 0) return null;

            const nounsPool = shuffleArray(themeNouns);
            const possessives = POSSESSIVE_PRONOUNS.map(p => p.text);
            const items = possessives.map((pos, i) => {
                const noun = nounsPool[i % nounsPool.length];
                const capPossessive = pos.charAt(0).toUpperCase() + pos.slice(1);
                const imageSrc = noun.imageDataUrl || `assets/images/nouns/${noun.text.toLowerCase().trim()}.png`;
                return {
                    noun: noun.text,
                    possessive: pos,
                    phrase: `${capPossessive} ${noun.text}`,
                    nounImageSrc: imageSrc,
                    wordId: noun.id,
                    nounWord: noun,
                };
            });

            return {
                type:  'pronoun-nouns',
                label: `Pronouns & Nouns — ${state.todayTheme.label}`,
                items,
            };
        }

        case 'sentences-visual': {
            // Same as sentences, but replaces the theme noun with an image card cue
            const themeNouns = getThemeNouns(state.todayTheme, allWords);
            if (themeNouns.length === 0) return null;

            const wordPool = shuffleArray(themeNouns);
            const getWord  = (i) => wordPool[i % wordPool.length];

            const FRAMES = [
                {
                    level: 1, structure: 'S + V + O',
                    build: (w) => ({
                        level: 1, structure: 'S + V + O',
                        text:  `I want ${w.text}.`,
                        words: ['I', 'want', `${w.text}.`],
                        _imageWord: w.text,
                        _imageSrc: w.imageDataUrl || `assets/images/nouns/${w.text.toLowerCase().trim()}.png`,
                    })
                },
                {
                    level: 2, structure: 'S + V + Det + O',
                    build: (w) => ({
                        level: 2, structure: 'S + V + Det + O',
                        text:  `Give me the ${w.text}.`,
                        words: ['Give', 'me', 'the', `${w.text}.`],
                        _imageWord: w.text,
                        _imageSrc: w.imageDataUrl || `assets/images/nouns/${w.text.toLowerCase().trim()}.png`,
                    })
                },
                {
                    level: 3, structure: 'Wh + Aux + Det + O',
                    build: (w) => ({
                        level: 3, structure: 'Wh + Aux + Det + O',
                        text:  `Where is the ${w.text}?`,
                        words: ['Where', 'is', 'the', `${w.text}?`],
                        _imageWord: w.text,
                        _imageSrc: w.imageDataUrl || `assets/images/nouns/${w.text.toLowerCase().trim()}.png`,
                    })
                },
                {
                    level: 4, structure: 'S + V + Det + O + Adv',
                    build: (w) => ({
                        level: 4, structure: 'S + V + Det + O + Adv',
                        text:  `I need the ${w.text} now.`,
                        words: ['I', 'need', 'the', `${w.text}`, 'now.'],
                        _imageWord: w.text,
                        _imageSrc: w.imageDataUrl || `assets/images/nouns/${w.text.toLowerCase().trim()}.png`,
                    })
                },
            ];

            const items = FRAMES.map((frame, i) => frame.build(getWord(i)));

            return {
                type:  'sentence-builder',
                label: `Visual Sentences — ${state.todayTheme.label}`,
                items,
            };
        }

        case 'sequences': {
            // Each SEQUENCE_SET becomes one item in the segment.
            // The sequences screen checks isSessionActive() and calls advanceExercise
            // after the user finishes each set.
            const { SEQUENCE_SETS } = await import('./data/sequences.js');
            const items = SEQUENCE_SETS.map(s => ({ ...s }));
            return { type: 'sequences', label: 'Sequences', items };
        }

        case 'comprehension': {
            // Reserved placeholder — no exercises built yet.
            return null;
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
