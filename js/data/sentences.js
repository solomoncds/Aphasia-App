/**
 * Sentence Builder Templates — 32 sentences across 4 complexity levels
 *
 * Each template has:
 *   level   — 1 (S+V) to 4 (S+Aux+V+O+Prep/Adv)
 *   text    — the complete correct sentence
 *   words   — the word cards in correct order (user rearranges these)
 *   structure — grammar label
 *
 * Tap-to-append mechanic (not drag-and-drop) — more reliable
 * when motor coordination is a factor.
 */

export const SENTENCE_TEMPLATES = [

    // ── Level 1: Subject + Verb ──────────────────────────
    { level: 1, text: 'I eat.',      words: ['I', 'eat.'],      structure: 'S + V' },
    { level: 1, text: 'I drink.',    words: ['I', 'drink.'],    structure: 'S + V' },
    { level: 1, text: 'I walk.',     words: ['I', 'walk.'],     structure: 'S + V' },
    { level: 1, text: 'I sit.',      words: ['I', 'sit.'],      structure: 'S + V' },
    { level: 1, text: 'I sleep.',    words: ['I', 'sleep.'],    structure: 'S + V' },
    { level: 1, text: 'I read.',     words: ['I', 'read.'],     structure: 'S + V' },
    { level: 1, text: 'He runs.',    words: ['He', 'runs.'],    structure: 'S + V' },
    { level: 1, text: 'She talks.',  words: ['She', 'talks.'],  structure: 'S + V' },

    // ── Level 2: Subject + Verb + Object ─────────────────
    { level: 2, text: 'I eat food.',        words: ['I', 'eat', 'food.'],        structure: 'S + V + O' },
    { level: 2, text: 'I drink water.',      words: ['I', 'drink', 'water.'],      structure: 'S + V + O' },
    { level: 2, text: 'I read a book.',      words: ['I', 'read', 'a', 'book.'],   structure: 'S + V + O' },
    { level: 2, text: 'I open the door.',    words: ['I', 'open', 'the', 'door.'], structure: 'S + V + O' },
    { level: 2, text: 'I want the phone.',   words: ['I', 'want', 'the', 'phone.'], structure: 'S + V + O' },
    { level: 2, text: 'She likes the garden.', words: ['She', 'likes', 'the', 'garden.'], structure: 'S + V + O' },
    { level: 2, text: 'He drives the car.',  words: ['He', 'drives', 'the', 'car.'], structure: 'S + V + O' },
    { level: 2, text: 'We eat the rice.',    words: ['We', 'eat', 'the', 'rice.'],  structure: 'S + V + O' },

    // ── Level 3: Subject + Verb + Object + Prep/Adverb ───
    { level: 3, text: 'I eat food outside.',       words: ['I', 'eat', 'food', 'outside.'],       structure: 'S + V + O + Adv' },
    { level: 3, text: 'I drink water slowly.',      words: ['I', 'drink', 'water', 'slowly.'],      structure: 'S + V + O + Adv' },
    { level: 3, text: 'I read a book today.',       words: ['I', 'read', 'a', 'book', 'today.'],    structure: 'S + V + O + Adv' },
    { level: 3, text: 'I walk to the door.',        words: ['I', 'walk', 'to', 'the', 'door.'],     structure: 'S + V + Prep' },
    { level: 3, text: 'She sits on the chair.',     words: ['She', 'sits', 'on', 'the', 'chair.'],  structure: 'S + V + Prep' },
    { level: 3, text: 'He goes to the house.',      words: ['He', 'goes', 'to', 'the', 'house.'],   structure: 'S + V + Prep' },
    { level: 3, text: 'We eat food together.',      words: ['We', 'eat', 'food', 'together.'],      structure: 'S + V + O + Adv' },
    { level: 3, text: 'I sleep in the bed.',        words: ['I', 'sleep', 'in', 'the', 'bed.'],     structure: 'S + V + Prep' },

    // ── Level 4: Subject + Aux + Verb + Object + Prep/Adv
    { level: 4, text: 'I am eating food outside.',     words: ['I', 'am', 'eating', 'food', 'outside.'],     structure: 'S + Aux + V + O + Adv' },
    { level: 4, text: 'She is drinking water now.',     words: ['She', 'is', 'drinking', 'water', 'now.'],     structure: 'S + Aux + V + O + Adv' },
    { level: 4, text: 'He is reading a book today.',    words: ['He', 'is', 'reading', 'a', 'book', 'today.'], structure: 'S + Aux + V + O + Adv' },
    { level: 4, text: 'We are walking to the house.',   words: ['We', 'are', 'walking', 'to', 'the', 'house.'], structure: 'S + Aux + V + Prep' },
    { level: 4, text: 'I am going to the garden.',      words: ['I', 'am', 'going', 'to', 'the', 'garden.'],   structure: 'S + Aux + V + Prep' },
    { level: 4, text: 'She is sitting on the chair.',   words: ['She', 'is', 'sitting', 'on', 'the', 'chair.'], structure: 'S + Aux + V + Prep' },
    { level: 4, text: 'He is cooking food inside.',     words: ['He', 'is', 'cooking', 'food', 'inside.'],     structure: 'S + Aux + V + O + Adv' },
    { level: 4, text: 'We are playing in the garden.',  words: ['We', 'are', 'playing', 'in', 'the', 'garden.'], structure: 'S + Aux + V + Prep' },
];
