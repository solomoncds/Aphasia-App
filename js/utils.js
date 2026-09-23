/**
 * Shared Utility Functions
 * Pure helpers with no side effects — used across all screens.
 */

/* ========== DOM Helpers ========== */

/**
 * Create a DOM element with attributes and children.
 * @param {string} tag
 * @param {Object} attrs  — className, style (object), on* handlers, dataset, textContent, innerHTML, or any HTML attribute
 * @param {Array|string|Node} children
 */
export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'dataset' && typeof value === 'object') {
            for (const [k, v] of Object.entries(value)) {
                el.dataset[k] = v;
            }
        } else if (key === 'innerHTML') {
            el.innerHTML = value;
        } else if (key === 'textContent') {
            el.textContent = value;
        } else {
            el.setAttribute(key, value);
        }
    }

    for (const child of [].concat(children)) {
        if (child == null || child === false) continue;
        if (typeof child === 'string' || typeof child === 'number') {
            el.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
            el.appendChild(child);
        }
    }

    return el;
}

/**
 * Shorthand: clear a container and append new children.
 */
export function render(container, ...children) {
    container.innerHTML = '';
    for (const child of children) {
        if (child instanceof Node) container.appendChild(child);
    }
}

/* ========== Formatting ========== */

/** Format minutes into a readable duration string */
export function formatTime(minutes) {
    if (minutes < 1) return 'Less than a minute';
    const m = Math.round(minutes);
    if (m === 1) return '1 minute';
    if (m < 60) return `${m} minutes`;
    const hrs = Math.floor(m / 60);
    const rem = m % 60;
    if (rem === 0) return `${hrs} hour${hrs > 1 ? 's' : ''}`;
    return `${hrs}h ${rem}m`;
}

/** Format date for display — "Monday, September 5" */
export function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** Short date — "Sep 5" */
export function formatDateShort(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Today's date as YYYY-MM-DD */
export function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

/* ========== Greeting ========== */

/** Time-of-day greeting */
export function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

/* ========== Randomization ========== */

/** Fisher-Yates shuffle — returns a new array */
export function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/** Pick n random items (returns single item when n === 1) */
export function pickRandom(array, n = 1) {
    const shuffled = shuffleArray(array);
    return n === 1 ? shuffled[0] : shuffled.slice(0, n);
}

/* ========== Misc ========== */

/** Debounce a function call */
export function debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

/** Generate a unique ID */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Capitalize first letter */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ========== Word Status ========== */

/** Human-readable labels for word statuses */
export const STATUS_LABELS = {
    unable: 'Needs Practice',
    model: 'Learning',
    cue: 'Improving',
    independent: 'Mastered'
};

/** Status progression order (worst → best) */
export const STATUS_ORDER = ['unable', 'model', 'cue', 'independent'];

/** Map self-report button to the status it sets */
export const REPORT_TO_STATUS = {
    independent: 'independent',   // ✓ I said it
    cue: 'cue',                   // ↻ Needed help
    unable: 'unable'              // → Couldn't say it
};

/* ========== Encouraging Messages ========== */

const ENCOURAGEMENT = {
    independent: [
        'You found it! 🎉',
        'Well done!',
        'Great work!',
        'You got it!',
        'Nicely said!'
    ],
    cue: [
        'Good attempt.',
        'Getting closer.',
        'Nice try — you\'re improving.',
        'That\'s progress.',
        'Keep going, you\'re doing well.'
    ],
    unable: [
        'Let\'s try that again later.',
        'That\'s a tricky one.',
        'No worries — we\'ll come back to it.',
        'It takes practice.',
        'You\'ll get there.'
    ]
};

/** Get a random encouraging message for a self-report */
export function getEncouragement(report) {
    const list = ENCOURAGEMENT[report] || ENCOURAGEMENT.unable;
    return list[Math.floor(Math.random() * list.length)];
}

/* ========== Category Metadata ========== */

export const CATEGORIES = {
    noun:    { label: 'Words',         emoji: '🗣️', color: 'var(--accent-blue)' },
    verb:    { label: 'Verbs',         emoji: '🏃', color: 'var(--accent-green)' },
    pronoun: { label: 'Pronouns',      emoji: '👤', color: 'var(--accent-amber)' },
    number:  { label: 'Numbers',       emoji: '🔢', color: 'var(--accent-purple)' },
    phrase:  { label: 'Phrases',       emoji: '💬', color: 'var(--accent-rose)' }
};

export const POSSESSIVE_PRONOUNS = [
    { text: 'my',    person: '1st', number: 'singular' },
    { text: 'your',  person: '2nd', number: 'singular/plural' },
    { text: 'his',   person: '3rd', number: 'singular', gender: 'masculine' },
    { text: 'her',   person: '3rd', number: 'singular', gender: 'feminine' },
    { text: 'our',   person: '1st', number: 'plural' },
    { text: 'their', person: '3rd', number: 'plural' },
];

/**
 * Canonical session-category list.
 * Single source of truth used by Session Setup checkboxes AND session.js buildSegment().
 * The `key` values map 1-to-1 to switch-case labels in buildSegment().
 * `disabled` categories are shown in the UI but cannot be toggled on.
 */
export const SESSION_CATEGORIES = [
    { key: 'words',            icon: '🗣️', label: 'Words',                 desc: 'Find and say words with picture hints' },
    { key: 'sentences',        icon: '🧩', label: 'Sentences',             desc: 'Build sentences from today\'s words' },
    { key: 'pronoun-nouns',    icon: '👥', label: 'Pronoun + Noun',        desc: 'His knife, her spoon, my cup' },
    { key: 'sentences-visual', icon: '🖼️', label: 'Visual Sentences',      desc: 'Sentence building with picture cards' },
    { key: 'verbs-pronouns',   icon: '🏃', label: 'Verbs & Pronouns',      desc: 'Action words and subject pronouns' },
    { key: 'pronunciation',    icon: '🔊', label: 'Pronunciation Drill',   desc: 'Listen and repeat words clearly' },
    { key: 'sequences',        icon: '🔢', label: 'Sequences',             desc: 'Days, months, alphabet & prayer' },
    { key: 'conversation',     icon: '💬', label: 'Conversation Practice', desc: 'Open-ended speaking practice' },
    { key: 'comprehension',    icon: '🧠', label: 'Comprehension',         desc: 'Coming soon — not yet available', disabled: true },
];

/* ========== Themed Daily Sessions ========== */

/**
 * 11-slot noun-theme rotation table.
 * Each entry has:
 *   key   — matches the `theme` field used in nouns.js
 *   label — human-readable display name
 *   emoji — used on the Home screen pill
 *   texts — (optional) allowlist of exact noun texts; used for the 11th slot
 *           to isolate "Important Items" from the broader 'household' group.
 */
export const NOUN_THEMES = [
    { key: 'kitchen',    label: 'Kitchen',         emoji: '🍳' },
    { key: 'food-drink', label: 'Food & Drink',    emoji: '🥗' },
    { key: 'bathroom',   label: 'Bathroom',        emoji: '🚿' },
    { key: 'bedroom',    label: 'Bedroom',         emoji: '🛏️' },
    { key: 'body',       label: 'Body Parts',      emoji: '🫀' },
    { key: 'clothing',   label: 'Clothing',        emoji: '👕' },
    { key: 'transport',  label: 'Transport',       emoji: '🚗' },
    { key: 'outdoors',   label: 'Outdoors',        emoji: '🌳' },
    { key: 'household',  label: 'Household',       emoji: '🏠',
      texts: null },    // all household nouns (table, phone, book, pen, bag, box)
    { key: 'technology', label: 'Technology',      emoji: '📺' },
    { key: 'household',  label: 'Everyday Items',  emoji: '💊',
      texts: ['medicine', 'money', 'paper'] },  // isolated important-items subset
];

/**
 * Return today's theme entry based on total completed sessions.
 * @param {number} totalSessions — length of the sessions store
 * @returns {object} NOUN_THEMES entry
 */
export function getTodayTheme(totalSessions) {
    return NOUN_THEMES[totalSessions % NOUN_THEMES.length];
}

/**
 * Filter allWords down to nouns that belong to the given theme entry.
 * Respects the optional `texts` allowlist for the 11th slot.
 * @param {{ key: string, texts?: string[]|null }} themeEntry
 * @param {object[]} allWords — full words array from IndexedDB
 * @returns {object[]}
 */
export function getThemeNouns(themeEntry, allWords) {
    return allWords.filter(w => {
        if (w.category !== 'noun') return false;
        if (w.theme !== themeEntry.key) return false;
        if (themeEntry.texts) {
            return themeEntry.texts.includes(w.text.toLowerCase());
        }
        // Slot 8 (household) must EXCLUDE the texts-listed important-items words
        // so the two household slots don't overlap.
        if (themeEntry.key === 'household' && !themeEntry.texts) {
            const importantItems = ['medicine', 'money', 'paper'];
            return !importantItems.includes(w.text.toLowerCase());
        }
        return true;
    });
}
