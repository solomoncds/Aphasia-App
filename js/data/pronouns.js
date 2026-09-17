/**
 * Pronouns — subject and object forms
 *
 * Each pronoun has example sentences for practice.
 * Used in the Verbs & Pronouns exercise screen with real family photos.
 */

export const STARTER_PRONOUNS = [
    // ── Subject Pronouns ─────────────────────────────────
    {
        text: 'I',
        type: 'subject',
        objectForm: 'me',
        difficultyLevel: 1,
        exampleSentences: [
            'I am happy.',
            'I eat food.',
            'I want water.',
            'I like music.',
            'I need help.'
        ]
    },
    {
        text: 'you',
        type: 'subject',
        objectForm: 'you',
        difficultyLevel: 1,
        exampleSentences: [
            'You are kind.',
            'You eat food.',
            'You like music.',
            'You need rest.',
            'You are my friend.'
        ]
    },
    {
        text: 'he',
        type: 'subject',
        objectForm: 'him',
        difficultyLevel: 2,
        exampleSentences: [
            'He is tall.',
            'He eats food.',
            'He likes music.',
            'He walks outside.',
            'He helps me.'
        ]
    },
    {
        text: 'she',
        type: 'subject',
        objectForm: 'her',
        difficultyLevel: 2,
        exampleSentences: [
            'She is kind.',
            'She drinks water.',
            'She reads a book.',
            'She talks to me.',
            'She cooks dinner.'
        ]
    },
    {
        text: 'it',
        type: 'subject',
        objectForm: 'it',
        difficultyLevel: 2,
        exampleSentences: [
            'It is big.',
            'It is on the table.',
            'It is cold outside.',
            'It is my book.',
            'It works well.'
        ]
    },
    {
        text: 'we',
        type: 'subject',
        objectForm: 'us',
        difficultyLevel: 3,
        exampleSentences: [
            'We are happy.',
            'We eat together.',
            'We go outside.',
            'We like music.',
            'We need food.'
        ]
    },
    {
        text: 'they',
        type: 'subject',
        objectForm: 'them',
        difficultyLevel: 3,
        exampleSentences: [
            'They are here.',
            'They eat dinner.',
            'They play outside.',
            'They help us.',
            'They like the garden.'
        ]
    },

    // ── Object Pronouns ──────────────────────────────────
    {
        text: 'me',
        type: 'object',
        subjectForm: 'I',
        difficultyLevel: 1,
        exampleSentences: [
            'Help me, please.',
            'Give me the cup.',
            'Talk to me.',
            'Call me later.',
            'She sees me.'
        ]
    },
    {
        text: 'him',
        type: 'object',
        subjectForm: 'he',
        difficultyLevel: 2,
        exampleSentences: [
            'I see him.',
            'Give him the book.',
            'Help him, please.',
            'Call him now.',
            'Talk to him.'
        ]
    },
    {
        text: 'her',
        type: 'object',
        subjectForm: 'she',
        difficultyLevel: 2,
        exampleSentences: [
            'I see her.',
            'Give her the phone.',
            'Help her, please.',
            'Call her now.',
            'Talk to her.'
        ]
    },
    {
        text: 'us',
        type: 'object',
        subjectForm: 'we',
        difficultyLevel: 3,
        exampleSentences: [
            'Help us, please.',
            'Give us the food.',
            'He sees us.',
            'Call us later.',
            'Talk to us.'
        ]
    },
    {
        text: 'them',
        type: 'object',
        subjectForm: 'they',
        difficultyLevel: 3,
        exampleSentences: [
            'I see them.',
            'Give them the water.',
            'Help them, please.',
            'Call them now.',
            'We like them.'
        ]
    }
].map(p => ({ ...p, category: 'pronoun' }));
