/**
 * Conversation Practice Screen
 *
 * Open-ended prompts: "What did you do today?"
 * No grammar correction, no scoring.
 * A family member can type notes or just listen.
 *
 * When inside a session, shows a collapsible "Words to try today" panel
 * listing today's theme nouns as a soft suggestion — the user is never
 * required to use them, and the prompts remain fully open-ended.
 */

import { createElement, getThemeNouns }                from '../utils.js';
import { isSessionActive, advanceExercise, getSession } from '../session.js';
import { getAll }                                       from '../db.js';

const PROMPTS = [
    'What did you do today?',
    'Tell me about your morning.',
    'What would you like to eat?',
    'How are you feeling right now?',
    'What is your favourite food?',
    'Tell me about someone you love.',
    'What do you see outside the window?',
    'What did you have for breakfast?',
    'What would you like to do later?',
    'Tell me about a happy memory.',
    'What is the weather like today?',
    'Who did you talk to today?',
    'What room are you in right now?',
    'What sounds can you hear?',
    'What are you looking forward to?',
];

export async function render(container) {
    container.innerHTML = '';

    const inSession = isSessionActive();
    let promptIdx   = Math.floor(Math.random() * PROMPTS.length);

    /* ── Today's theme word suggestions (session mode only) ── */
    let themeWords = [];   // array of noun text strings
    let themeMeta  = null; // { label, emoji }

    if (inSession) {
        const sess = getSession();
        if (sess.todayTheme) {
            themeMeta = sess.todayTheme;
            const allWords = await getAll('words');
            themeWords = getThemeNouns(sess.todayTheme, allWords)
                .map(w => w.text)
                .sort();   // alphabetical for easy scanning
        }
    }

    /* ── Shell ────────────────────────────────────────── */
    const topBar = createElement('div', { className: 'exercise-screen__top-bar' }, [
        createElement('button', {
            className: 'exercise-screen__back',
            onClick: () => { window.location.hash = 'home'; },
        }, '← Exit'),
        createElement('span', { className: 'exercise-screen__counter' }, 'Conversation'),
    ]);

    const body   = createElement('div', { className: 'exercise__body conversation', id: 'cv-body',
        style: { justifyContent: 'flex-start', paddingTop: 'var(--sp-6)' } });
    const footer = createElement('div', { className: 'exercise__footer container', id: 'cv-footer' });

    container.className = 'screen exercise-screen';
    container.append(topBar, body, footer);

    showPrompt();

    function showPrompt() {
        const bodyEl = document.getElementById('cv-body');
        bodyEl.innerHTML = '';

        // Emoji
        bodyEl.appendChild(createElement('div', {
            style: { fontSize: '3rem', marginBottom: 'var(--sp-4)' },
        }, '💬'));

        // Prompt
        bodyEl.appendChild(createElement('h2', {
            className: 'conversation__prompt',
        }, PROMPTS[promptIdx]));

        // Encouragement
        bodyEl.appendChild(createElement('p', {
            className: 'text-secondary text-center',
            style: { fontStyle: 'italic', maxWidth: '320px' },
        }, "Take your time. There's no right or wrong answer."));

        // ── "Words to try today" panel (session mode, theme words available) ──
        if (themeWords.length > 0 && themeMeta) {
            bodyEl.appendChild(buildWordsTryPanel(themeWords, themeMeta));
        }

        // Notes area (optional, for family member)
        const notesSection = createElement('div', {
            className: 'conversation__note-area mt-6 w-full',
            style: { maxWidth: '500px' },
        });

        notesSection.appendChild(createElement('label', {
            className: 'form-label mb-2',
        }, '📝 Notes (optional — for family member)'));

        notesSection.appendChild(createElement('textarea', {
            className: 'conversation__textarea form-input',
            placeholder: 'Type any notes here…',
            rows: '4',
        }));

        bodyEl.appendChild(notesSection);

        // Footer: Next prompt + End
        const ft = document.getElementById('cv-footer');
        ft.innerHTML = '';

        const nextBtn = createElement('button', {
            className: 'btn btn--secondary w-full',
            onClick: () => {
                promptIdx = (promptIdx + 1) % PROMPTS.length;
                showPrompt();
            },
        }, '💬  Another Prompt');

        const endBtn = createElement('button', {
            className: 'btn btn--primary-lg mt-3',
            onClick: () => {
                if (inSession) {
                    advanceExercise({ type: 'conversation', report: 'independent' });
                    window.location.hash = 'session-complete';
                } else {
                    window.location.hash = 'home';
                }
            },
        }, inSession ? 'Finish Session ✓' : 'Done ✓');

        ft.append(nextBtn, endBtn);
    }
}

/* ── Words-to-try panel builder ───────────────────────────── */

/**
 * Builds a collapsible suggestion panel showing today's theme words.
 * Uses a <details>/<summary> for zero-JS expand/collapse.
 * This is intentionally soft — a visual nudge, nothing more.
 */
function buildWordsTryPanel(words, theme) {
    const details = createElement('details', {
        className: 'conv-words-panel mt-6 w-full',
        style: { maxWidth: '500px' },
    });

    const summary = createElement('summary', {
        className: 'conv-words-panel__summary',
    }, [
        createElement('span', { 'aria-hidden': 'true' }, `${theme.emoji} `),
        createElement('span', {}, `Words to try today — `),
        createElement('strong', {}, theme.label),
    ]);

    const chipWrap = createElement('div', { className: 'conv-words-panel__chips' });
    for (const word of words) {
        chipWrap.appendChild(
            createElement('span', { className: 'conv-words-panel__chip' }, word)
        );
    }

    const hint = createElement('p', {
        className: 'conv-words-panel__hint',
    }, 'These are just suggestions — use any words that feel natural.');

    details.append(summary, chipWrap, hint);
    return details;
}
