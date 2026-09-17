/**
 * Starter Verbs — 40 common daily-life verbs
 *
 * Verbs get a first-sound cue only (no meaning hint — restating a verb
 * as a definition usually just uses the word itself).
 * Each verb includes an example sentence for context and syllableCount.
 * (All verbs have 1 syllable except 'open' which has 2).
 */

export const STARTER_VERBS = [

    // ── Level 1 — Basic daily actions ────────────────────
    { text: 'eat',    syllableCount: 1, difficultyLevel: 1, firstSoundHint: 'It starts with "E".',  exampleSentence: 'I eat food.' },
    { text: 'drink',  syllableCount: 1, difficultyLevel: 1, firstSoundHint: 'It starts with "Dr".', exampleSentence: 'I drink water.' },
    { text: 'go',     syllableCount: 1, difficultyLevel: 1, firstSoundHint: 'It starts with "G".',  exampleSentence: 'I go outside.' },
    { text: 'sit',    syllableCount: 1, difficultyLevel: 1, firstSoundHint: 'It starts with "S".',  exampleSentence: 'I sit on a chair.' },
    { text: 'stand',  syllableCount: 1, difficultyLevel: 1, firstSoundHint: 'It starts with "St".', exampleSentence: 'I stand up.' },
    { text: 'walk',   syllableCount: 1, difficultyLevel: 1, firstSoundHint: 'It starts with "W".',  exampleSentence: 'I walk to the door.' },
    { text: 'sleep',  syllableCount: 1, difficultyLevel: 1, firstSoundHint: 'It starts with "Sl".', exampleSentence: 'I sleep at night.' },
    { text: 'want',   syllableCount: 1, difficultyLevel: 1, firstSoundHint: 'It starts with "W".',  exampleSentence: 'I want water.' },
    { text: 'need',   syllableCount: 1, difficultyLevel: 1, firstSoundHint: 'It starts with "N".',  exampleSentence: 'I need help.' },
    { text: 'like',   syllableCount: 1, difficultyLevel: 1, firstSoundHint: 'It starts with "L".',  exampleSentence: 'I like music.' },

    // ── Level 2 — Common actions ─────────────────────────
    { text: 'open',   syllableCount: 2, difficultyLevel: 2, firstSoundHint: 'It starts with "O".',  exampleSentence: 'I open the door.' },
    { text: 'close',  syllableCount: 1, difficultyLevel: 2, firstSoundHint: 'It starts with "Cl".', exampleSentence: 'I close the window.' },
    { text: 'give',   syllableCount: 1, difficultyLevel: 2, firstSoundHint: 'It starts with "G".',  exampleSentence: 'I give you the book.' },
    { text: 'take',   syllableCount: 1, difficultyLevel: 2, firstSoundHint: 'It starts with "T".',  exampleSentence: 'I take the cup.' },
    { text: 'put',    syllableCount: 1, difficultyLevel: 2, firstSoundHint: 'It starts with "P".',  exampleSentence: 'I put it on the table.' },
    { text: 'come',   syllableCount: 1, difficultyLevel: 2, firstSoundHint: 'It starts with "C".',  exampleSentence: 'Come here, please.' },
    { text: 'look',   syllableCount: 1, difficultyLevel: 2, firstSoundHint: 'It starts with "L".',  exampleSentence: 'I look at the picture.' },
    { text: 'see',    syllableCount: 1, difficultyLevel: 2, firstSoundHint: 'It starts with "S".',  exampleSentence: 'I see the bird.' },
    { text: 'hear',   syllableCount: 1, difficultyLevel: 2, firstSoundHint: 'It starts with "H".',  exampleSentence: 'I hear the music.' },
    { text: 'run',    syllableCount: 1, difficultyLevel: 2, firstSoundHint: 'It starts with "R".',  exampleSentence: 'I run in the park.' },

    // ── Level 3 — Communication & tasks ──────────────────
    { text: 'talk',   syllableCount: 1, difficultyLevel: 3, firstSoundHint: 'It starts with "T".',  exampleSentence: 'I talk to my friend.' },
    { text: 'say',    syllableCount: 1, difficultyLevel: 3, firstSoundHint: 'It starts with "S".',  exampleSentence: 'I say hello.' },
    { text: 'read',   syllableCount: 1, difficultyLevel: 3, firstSoundHint: 'It starts with "R".',  exampleSentence: 'I read a book.' },
    { text: 'write',  syllableCount: 1, difficultyLevel: 3, firstSoundHint: 'It starts with "Wr".', exampleSentence: 'I write my name.' },
    { text: 'wash',   syllableCount: 1, difficultyLevel: 3, firstSoundHint: 'It starts with "W".',  exampleSentence: 'I wash my hands.' },
    { text: 'cook',   syllableCount: 1, difficultyLevel: 3, firstSoundHint: 'It starts with "C".',  exampleSentence: 'I cook dinner.' },
    { text: 'clean',  syllableCount: 1, difficultyLevel: 3, firstSoundHint: 'It starts with "Cl".', exampleSentence: 'I clean the house.' },
    { text: 'call',   syllableCount: 1, difficultyLevel: 3, firstSoundHint: 'It starts with "C".',  exampleSentence: 'I call my friend.' },
    { text: 'help',   syllableCount: 1, difficultyLevel: 3, firstSoundHint: 'It starts with "H".',  exampleSentence: 'Please help me.' },
    { text: 'wake',   syllableCount: 1, difficultyLevel: 3, firstSoundHint: 'It starts with "W".',  exampleSentence: 'I wake up early.' },

    // ── Level 4 — Extended vocabulary ────────────────────
    { text: 'drive',  syllableCount: 1, difficultyLevel: 4, firstSoundHint: 'It starts with "Dr".', exampleSentence: 'I drive to the store.' },
    { text: 'stop',   syllableCount: 1, difficultyLevel: 4, firstSoundHint: 'It starts with "St".', exampleSentence: 'I stop at the light.' },
    { text: 'start',  syllableCount: 1, difficultyLevel: 4, firstSoundHint: 'It starts with "St".', exampleSentence: 'I start working.' },
    { text: 'work',   syllableCount: 1, difficultyLevel: 4, firstSoundHint: 'It starts with "W".',  exampleSentence: 'I work every day.' },
    { text: 'play',   syllableCount: 1, difficultyLevel: 4, firstSoundHint: 'It starts with "Pl".', exampleSentence: 'I play with the children.' },
    { text: 'push',   syllableCount: 1, difficultyLevel: 4, firstSoundHint: 'It starts with "P".',  exampleSentence: 'I push the door open.' },
    { text: 'pull',   syllableCount: 1, difficultyLevel: 4, firstSoundHint: 'It starts with "P".',  exampleSentence: 'I pull the handle.' },
    { text: 'hold',   syllableCount: 1, difficultyLevel: 4, firstSoundHint: 'It starts with "H".',  exampleSentence: 'I hold the cup.' },
    { text: 'turn',   syllableCount: 1, difficultyLevel: 4, firstSoundHint: 'It starts with "T".',  exampleSentence: 'I turn left at the road.' },
    { text: 'wait',   syllableCount: 1, difficultyLevel: 4, firstSoundHint: 'It starts with "W".',  exampleSentence: 'I wait for the bus.' },

].map(v => ({ ...v, category: 'verb' }));
