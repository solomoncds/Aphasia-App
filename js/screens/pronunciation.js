/**
 * Pronunciation Drill Exercise
 *
 * Modeled on Tactus Therapy's Apraxia Therapy:
 *   1. Word shown large on screen.
 *   2. 🔊 Listen — TTS at rate 0.6.
 *   3. 🎤 Your turn — user attempts aloud.
 *   4. Listen again / Try again — unlimited, no timer.
 *   5. Self-report (✓ / ↻ / →).
 *
 * No auto-scoring. No recording required for v1.
 * Encouraging copy: "Take your time." / "Let's try that again."
 */

import { getAll, put }                                   from '../db.js';
import { speak, stopSpeaking }                           from '../speech.js';
import { createElement }                                  from '../utils.js';
import { getEncouragement, shuffleArray, capitalize }     from '../utils.js';
import { isSessionActive, getSession, advanceExercise }   from '../session.js';

const MY_TYPE = 'pronunciation';

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
        const all  = await getAll('words');
        const pool = all.filter(w => (w.category === 'noun' || w.category === 'verb') && w.status !== 'independent');
        const fallback = all.filter(w => w.category === 'noun' || w.category === 'verb');
        items      = shuffleArray(pool.length >= 5 ? pool : fallback).slice(0, 8);
        currentIdx = 0;
    }

    let reported = false;

    /* ── Shell ────────────────────────────────────────── */
    const topBar = createElement('div', { className: 'exercise-screen__top-bar' }, [
        createElement('button', {
            className: 'exercise-screen__back',
            onClick: () => { window.location.hash = 'home'; },
        }, '← Exit'),
        createElement('span', { className: 'exercise-screen__counter', id: 'pn-counter' }),
    ]);

    const progressBar = createElement('div', { className: 'exercise-screen__progress' }, [
        createElement('div', { className: 'progress-bar' }, [
            createElement('div', { className: 'progress-bar__fill progress-bar__fill--green', id: 'pn-fill' }),
        ]),
    ]);

    const body   = createElement('div', { className: 'exercise__body', id: 'pn-body' });
    const footer = createElement('div', { className: 'exercise__footer container', id: 'pn-footer' });

    container.className = 'screen exercise-screen';
    container.append(topBar, progressBar, body, footer);

    showItem();

    /* ── Render item ─────────────────────────────────── */
    function showItem() {
        const word = items[currentIdx];
        if (!word) { finish(); return; }

        reported = false;

        document.getElementById('pn-counter').textContent = `${currentIdx + 1} / ${items.length}`;
        document.getElementById('pn-fill').style.width    = `${(currentIdx / items.length) * 100}%`;

        const body = document.getElementById('pn-body');
        body.innerHTML = '';

        // Word — large
        body.appendChild(createElement('div', { className: 'exercise__word' }, capitalize(word.text)));

        // Subtitle
        body.appendChild(createElement('p', {
            className: 'exercise__prompt mt-3',
        }, 'Listen, then say the word.'));

        // Action buttons
        const actions = createElement('div', { className: 'exercise__actions mt-6' });

        // 🔊 Listen
        const listenBtn = createElement('button', {
            className: 'btn btn--primary w-full',
            onClick: async () => {
                listenBtn.classList.add('btn--speaking');
                listenBtn.textContent = '🔊  Playing…';
                try {
                    await speak(word.text);
                } finally {
                    listenBtn.classList.remove('btn--speaking');
                    listenBtn.textContent = '🔊  Listen';
                }
            },
        }, '🔊  Listen');

        // 🎤 Your turn
        const turnBtn = createElement('button', {
            className: 'btn btn--secondary w-full',
            onClick: () => {
                // Visual cue that it's their turn
                turnBtn.textContent = '🎤  Speak now…';
                turnBtn.classList.add('btn--icon-green');
                setTimeout(() => {
                    turnBtn.textContent = '🎤  Your Turn';
                    turnBtn.classList.remove('btn--icon-green');
                }, 2000);
            },
        }, '🎤  Your Turn');

        // 🔊 Listen again
        const againBtn = createElement('button', {
            className: 'btn btn--ghost w-full',
            onClick: async () => {
                againBtn.classList.add('btn--speaking');
                againBtn.textContent = '🔊  Playing…';
                try {
                    await speak(word.text);
                } finally {
                    againBtn.classList.remove('btn--speaking');
                    againBtn.textContent = '🔊  Listen Again';
                }
            },
        }, '🔊  Listen Again');

        actions.append(listenBtn, turnBtn, againBtn);
        body.appendChild(actions);

        // Encouragement placeholder
        body.appendChild(createElement('div', {
            id: 'pn-encouragement', className: 'exercise__encouragement mt-4',
        }));

        // Encouraging tip
        body.appendChild(createElement('p', {
            className: 'text-sm text-secondary mt-2 text-center',
            style: { fontStyle: 'italic' },
        }, 'Take your time. There\'s no rush.'));

        // Self-report
        renderReport();
    }

    function renderReport() {
        const footer = document.getElementById('pn-footer');
        footer.innerHTML = '';

        const label = createElement('p', {
            className: 'text-center text-sm text-secondary mb-3',
        }, 'How did it go?');

        const group = createElement('div', { className: 'self-report' });

        const btns = [
            { report: 'independent', cls: 'self-report__btn--success', icon: '✓', label: 'I said it' },
            { report: 'cue',         cls: 'self-report__btn--help',    icon: '↻', label: 'Needed help' },
            { report: 'unable',      cls: 'self-report__btn--unable',  icon: '→', label: "Couldn't say it" },
        ];

        for (const b of btns) {
            const btn = createElement('button', {
                className: `self-report__btn ${b.cls}`,
            }, [
                createElement('span', { className: 'self-report__icon' }, b.icon),
                createElement('span', {}, b.label),
            ]);
            btn.addEventListener('click', () => handleReport(b.report));
            group.appendChild(btn);
        }

        footer.append(label, group);
    }

    async function handleReport(report) {
        if (reported) return;
        reported = true;

        const word = items[currentIdx];

        // Update DB
        word.status         = report === 'independent' ? 'independent' : report === 'cue' ? 'cue' : 'unable';
        word.timesAttempted  = (word.timesAttempted || 0) + 1;
        if (report === 'independent') word.timesIndependent = (word.timesIndependent || 0) + 1;
        word.lastPracticed  = new Date().toISOString();
        await put('words', word);

        // Encouragement
        document.getElementById('pn-encouragement').textContent = getEncouragement(report);

        // Next button
        const footer = document.getElementById('pn-footer');
        footer.innerHTML = '';

        const nextBtn = createElement('button', {
            className: 'btn btn--primary-lg',
            onClick: () => goNext(report),
        }, currentIdx < items.length - 1 ? 'Next Word →' : 'Finish ✓');
        footer.appendChild(nextBtn);
    }

    function goNext(report) {
        stopSpeaking();

        if (inSession) {
            const next = advanceExercise({ wordId: items[currentIdx]?.id, type: MY_TYPE, report });
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
