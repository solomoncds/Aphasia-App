/**
 * Sentence Builder Exercise
 *
 * Tap-to-arrange word cards into correct sentence order.
 * Uses tap-to-append (not drag-and-drop) — more reliable
 * when motor coordination is a factor.
 *
 * 4-level complexity ramp:
 *   1. S + V            — "I eat."
 *   2. S + V + O        — "I eat food."
 *   3. S + V + O + Adv  — "I eat food outside."
 *   4. S + Aux + V + O  — "I am eating food outside."
 */

import { speak, stopSpeaking }                         from '../speech.js';
import { createElement }                                from '../utils.js';
import { shuffleArray }                                 from '../utils.js';
import { SENTENCE_TEMPLATES }                           from '../data/sentences.js';
import { isSessionActive, getSession, advanceExercise } from '../session.js';

const MY_TYPE = 'sentence-builder';

export async function render(container) {
    container.innerHTML = '';

    /* ── Items ────────────────────────────────────────── */
    const inSession = isSessionActive();
    let items, currentIdx;

    if (inSession) {
        const seg = getSession().queue[getSession().currentSegment];
        if (!seg || seg.type !== MY_TYPE) { window.location.hash = 'home'; return; }
        items      = seg.items;
        currentIdx = getSession().currentItem;
    } else {
        // Standalone: pick 2 per level
        items = [];
        for (const level of [1, 2, 3, 4]) {
            const pool = SENTENCE_TEMPLATES.filter(s => s.level === level);
            const picked = shuffleArray(pool).slice(0, 2);
            items.push(...picked);
        }
        currentIdx = 0;
    }

    /* ── Shell ────────────────────────────────────────── */
    const topBar = createElement('div', { className: 'exercise-screen__top-bar' }, [
        createElement('button', {
            className: 'exercise-screen__back',
            onClick: () => { window.location.hash = 'home'; },
        }, '← Exit'),
        createElement('span', { className: 'exercise-screen__counter', id: 'sb-counter' }),
    ]);

    const progressBar = createElement('div', { className: 'exercise-screen__progress' }, [
        createElement('div', { className: 'progress-bar' }, [
            createElement('div', { className: 'progress-bar__fill progress-bar__fill--amber', id: 'sb-fill' }),
        ]),
    ]);

    const body   = createElement('div', { className: 'exercise__body', id: 'sb-body', style: { justifyContent: 'flex-start', paddingTop: 'var(--sp-6)' } });
    const footer = createElement('div', { className: 'exercise__footer container', id: 'sb-footer' });

    container.className = 'screen exercise-screen';
    container.append(topBar, progressBar, body, footer);

    showItem();

    /* ── Render item ─────────────────────────────────── */
    function showItem() {
        const sentence = items[currentIdx];
        if (!sentence) { finish(); return; }

        const target = sentence.words;  // correct order, e.g. ['I', 'eat', 'food.']

        // Tracks: bank = available cards, workspace = placed cards
        // Each card is { word, origIdx }
        let bank      = target.map((w, i) => ({ word: w, origIdx: i }));
        bank          = shuffleArray(bank);
        let workspace = [];
        let solved    = false;

        // Update counter
        document.getElementById('sb-counter').textContent = `${currentIdx + 1} / ${items.length}`;
        document.getElementById('sb-fill').style.width    = `${(currentIdx / items.length) * 100}%`;

        const body = document.getElementById('sb-body');
        body.innerHTML = '';

        // Level badge
        body.appendChild(createElement('div', { className: 'badge badge--blue mb-4' },
            `Level ${sentence.level} · ${sentence.structure}`));

        // Instruction
        body.appendChild(createElement('p', { className: 'exercise__prompt mb-4' },
            'Tap the words in the right order to build the sentence.'));

        // 🔊 Hear button
        const hearBtn = createElement('button', {
            className: 'btn btn--ghost mb-4',
            onClick: () => speak(sentence.text),
        }, '🔊  Hear the sentence');
        body.appendChild(hearBtn);

        // Workspace
        const wsEl = createElement('div', {
            className: 'sentence-builder__workspace', id: 'sb-workspace',
        });
        body.appendChild(wsEl);

        // Bank
        const bankEl = createElement('div', {
            className: 'sentence-builder__bank', id: 'sb-bank',
        });
        body.appendChild(bankEl);

        // Encouragement
        body.appendChild(createElement('div', {
            id: 'sb-encouragement', className: 'exercise__encouragement mt-4',
        }));

        renderCards();

        // Footer: empty until solved
        const ft = document.getElementById('sb-footer');
        ft.innerHTML = '';

        /* ── Render cards ────────────────────────────── */
        function renderCards() {
            const wsEl   = document.getElementById('sb-workspace');
            const bankEl = document.getElementById('sb-bank');
            wsEl.innerHTML   = '';
            bankEl.innerHTML = '';

            // Workspace cards (tap to remove)
            if (workspace.length === 0) {
                wsEl.appendChild(createElement('span', {
                    className: 'text-sm text-secondary',
                    style: { fontStyle: 'italic' },
                }, 'Tap words below to build your sentence…'));
            }

            for (let i = 0; i < workspace.length; i++) {
                const card = workspace[i];
                const el = createElement('button', {
                    className: 'word-card word-card--placed',
                    onClick: () => {
                        if (solved) return;
                        // Move back to bank
                        workspace.splice(i, 1);
                        bank.push(card);
                        renderCards();
                    },
                }, card.word);
                wsEl.appendChild(el);
            }

            // Bank cards (tap to place)
            for (let i = 0; i < bank.length; i++) {
                const card = bank[i];
                const el = createElement('button', {
                    className: 'word-card',
                    onClick: () => {
                        if (solved) return;
                        // Move to workspace
                        bank.splice(i, 1);
                        workspace.push(card);
                        renderCards();
                        checkSolution();
                    },
                }, card.word);
                bankEl.appendChild(el);
            }

            // If solved, mark cards green
            if (solved) {
                wsEl.classList.add('sentence-builder__workspace--correct');
                wsEl.querySelectorAll('.word-card').forEach(c =>
                    c.classList.replace('word-card--placed', 'word-card--correct'));
            }
        }

        function checkSolution() {
            if (workspace.length !== target.length) return;

            const correct = workspace.every((c, i) => c.origIdx === i);
            if (!correct) return;

            solved = true;
            renderCards();

            document.getElementById('sb-encouragement').textContent = 'You built it! 🎉';

            // Play the sentence
            speak(sentence.text);

            // Show Next button
            const ft = document.getElementById('sb-footer');
            ft.innerHTML = '';
            const nextBtn = createElement('button', {
                className: 'btn btn--primary-lg',
                onClick: () => goNext(),
            }, currentIdx < items.length - 1 ? 'Next Sentence →' : 'Finish ✓');
            ft.appendChild(nextBtn);
        }
    }

    /* ── Next / Finish ───────────────────────────────── */
    function goNext() {
        stopSpeaking();

        if (inSession) {
            const next = advanceExercise({ type: MY_TYPE, report: 'independent' });
            if (!next) { finish(); return; }
            if (next.type !== MY_TYPE) { window.location.hash = next.type; return; }
            currentIdx = getSession().currentItem;
        } else {
            currentIdx++;
        }

        if (currentIdx >= items.length) { finish(); return; }
        showItem();
    }

    function finish() {
        window.location.hash = inSession ? 'session-complete' : 'home';
    }

    return () => stopSpeaking();
}
