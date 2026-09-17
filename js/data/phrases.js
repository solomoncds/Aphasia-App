/**
 * Starter Phrases — 30 common daily phrases
 *
 * Grouped by context: greetings, social, requests, communication, time/place.
 * These are practiced as whole units, not word-by-word.
 */

export const STARTER_PHRASES = [

    // ── Greetings ────────────────────────────────────────
    { text: 'Good morning',       difficultyLevel: 1, context: 'greeting' },
    { text: 'Good afternoon',     difficultyLevel: 1, context: 'greeting' },
    { text: 'Good evening',       difficultyLevel: 1, context: 'greeting' },
    { text: 'Good night',         difficultyLevel: 1, context: 'greeting' },
    { text: 'Hello',              difficultyLevel: 1, context: 'greeting' },
    { text: 'Goodbye',            difficultyLevel: 1, context: 'greeting' },

    // ── Social ───────────────────────────────────────────
    { text: 'Thank you',          difficultyLevel: 1, context: 'social' },
    { text: 'You\'re welcome',    difficultyLevel: 2, context: 'social' },
    { text: 'Please',             difficultyLevel: 1, context: 'social' },
    { text: 'Excuse me',          difficultyLevel: 2, context: 'social' },
    { text: 'I\'m sorry',         difficultyLevel: 2, context: 'social' },
    { text: 'How are you?',       difficultyLevel: 2, context: 'social' },
    { text: 'I\'m fine',          difficultyLevel: 1, context: 'social' },
    { text: 'I love you',         difficultyLevel: 1, context: 'social' },

    // ── Requests ─────────────────────────────────────────
    { text: 'I need help',        difficultyLevel: 1, context: 'request' },
    { text: 'I need water',       difficultyLevel: 1, context: 'request' },
    { text: 'I\'m hungry',        difficultyLevel: 1, context: 'request' },
    { text: 'I\'m thirsty',       difficultyLevel: 2, context: 'request' },
    { text: 'I\'m tired',         difficultyLevel: 1, context: 'request' },
    { text: 'I want to go home',  difficultyLevel: 3, context: 'request' },
    { text: 'I want to go outside', difficultyLevel: 3, context: 'request' },

    // ── Communication ────────────────────────────────────
    { text: 'Yes, please',        difficultyLevel: 1, context: 'communication' },
    { text: 'No, thank you',      difficultyLevel: 1, context: 'communication' },
    { text: 'I don\'t know',      difficultyLevel: 2, context: 'communication' },
    { text: 'I don\'t understand', difficultyLevel: 3, context: 'communication' },
    { text: 'Can you repeat that?', difficultyLevel: 3, context: 'communication' },
    { text: 'Wait a moment',      difficultyLevel: 2, context: 'communication' },
    { text: 'Come here, please',  difficultyLevel: 2, context: 'communication' },

    // ── Time & Place ─────────────────────────────────────
    { text: 'What time is it?',         difficultyLevel: 2, context: 'time-place' },
    { text: 'Where is the bathroom?',   difficultyLevel: 3, context: 'time-place' },

].map(p => ({ ...p, category: 'phrase' }));
