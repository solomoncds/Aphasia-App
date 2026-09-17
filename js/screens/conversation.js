/**
 * Conversation Practice Screen
 *
 * Open-ended prompts: "What did you do today?"
 * No grammar correction, no scoring.
 * A family member can type notes or just listen.
 */

import { createElement }                                from '../utils.js';
import { isSessionActive, advanceExercise, getSession } from '../session.js';

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

    /* ── Shell ────────────────────────────────────────── */
    const topBar = createElement('div', { className: 'exercise-screen__top-bar' }, [
        createElement('button', {
            className: 'exercise-screen__back',
            onClick: () => { window.location.hash = 'home'; },
        }, '← Exit'),
        createElement('span', { className: 'exercise-screen__counter' }, 'Conversation'),
    ]);

    const body = createElement('div', { className: 'exercise__body conversation', id: 'cv-body',
        style: { justifyContent: 'flex-start', paddingTop: 'var(--sp-8)' } });

    const footer = createElement('div', { className: 'exercise__footer container', id: 'cv-footer' });

    container.className = 'screen exercise-screen';
    container.append(topBar, body, footer);

    showPrompt();

    function showPrompt() {
        const body = document.getElementById('cv-body');
        body.innerHTML = '';

        // Emoji
        body.appendChild(createElement('div', {
            style: { fontSize: '3rem', marginBottom: 'var(--sp-4)' },
        }, '💬'));

        // Prompt
        body.appendChild(createElement('h2', {
            className: 'conversation__prompt',
        }, PROMPTS[promptIdx]));

        // Encouragement
        body.appendChild(createElement('p', {
            className: 'text-secondary text-center',
            style: { fontStyle: 'italic', maxWidth: '320px' },
        }, "Take your time. There's no right or wrong answer."));

        // Notes area (optional, for family member)
        const notesSection = createElement('div', {
            className: 'conversation__note-area mt-8 w-full',
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

        body.appendChild(notesSection);

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
