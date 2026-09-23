/**
 * Sequences Exercise Screen
 *
 * Modeled on Tactus Therapy's Sequences exercise:
 *   - Fixed, ordered, overlearned sets (Days, Months, Alphabet, Prayer).
 *   - Automatic speech recitation practice (not correctness testing).
 *   - No self-report grading.
 *   - Audio modeling with speak() button that shifts to muted card state during playback.
 *   - Previous / Next progression with step counter (e.g. "3 / 7").
 *
 * Session mode: when launched inside a session, iterates through the session
 * segment items (each item is a SEQUENCE_SET). Finishing a set calls
 * advanceExercise() to move to the next session segment.
 */

import { SEQUENCE_SETS } from '../data/sequences.js';
import { speak, stopSpeaking } from '../speech.js';
import { createElement } from '../utils.js';
import { isSessionActive, getSession, advanceExercise } from '../session.js';

const MY_TYPE = 'sequences';

let activeSetId = null;
let currentIdx  = 0;
let isSpeaking  = false;

export async function render(container) {
    container.innerHTML = '';
    container.className = 'screen exercise-screen';

    const inSession = isSessionActive();

    if (inSession) {
        // Session mode: get the current set from the session queue
        const seg = getSession().queue[getSession().currentSegment];
        if (!seg || seg.type !== MY_TYPE) { window.location.hash = 'home'; return; }

        const setItem = seg.items[getSession().currentItem];
        activeSetId   = setItem.id;
        currentIdx    = 0;
        renderExercise(container, inSession);
    } else {
        // Standalone mode: show the set-selection menu first
        if (!activeSetId) {
            renderMenu(container);
        } else {
            renderExercise(container, false);
        }
    }

    return () => {
        stopSpeaking();
        isSpeaking = false;
    };
}

/* ── Menu: Choose Sequence (standalone only) ──────────────── */

function renderMenu(container) {
    container.innerHTML = '';

    const topBar = createElement('div', { className: 'exercise-screen__top-bar' }, [
        createElement('button', {
            className: 'exercise-screen__back',
            onClick: () => { window.location.hash = 'home'; },
        }, '← Home'),
        createElement('span', { className: 'exercise-screen__counter' }, 'Sequences'),
    ]);

    const header = createElement('div', { className: 'text-center my-4' }, [
        createElement('h1', { className: 'home__greeting', style: { fontSize: 'var(--fs-title)' } }, 'Sequences Practice'),
        createElement('p', { className: 'home__subtitle text-secondary' }, 'Overlearned lists for fluent automatic recitation'),
    ]);

    const list = createElement('div', { className: 'flex-col gap-3', style: { maxWidth: '500px', margin: '0 auto' } });

    for (const seq of SEQUENCE_SETS) {
        const card = createElement('div', {
            className: 'category-card card--interactive',
            role: 'button',
            tabIndex: 0,
            onClick: () => {
                activeSetId = seq.id;
                currentIdx  = 0;
                renderExercise(container, false);
            },
        }, [
            createElement('div', {
                className: 'category-card__icon',
                style: { background: 'var(--color-card-light)', color: 'var(--color-primary)' },
            }, seq.icon),
            createElement('div', { className: 'category-card__body' }, [
                createElement('div', { className: 'category-card__title fw-bold' }, seq.title),
                createElement('div', { className: 'category-card__subtitle text-sm' }, seq.description),
            ]),
        ]);
        list.appendChild(card);
    }

    container.append(topBar, header, list);
}

/* ── Practice: Step-by-Step Traversal ───────────────────── */

function renderExercise(container, inSession) {
    container.innerHTML = '';

    const seq = SEQUENCE_SETS.find(s => s.id === activeSetId) || SEQUENCE_SETS[0];
    const items = seq.items;
    const currentItem = items[currentIdx];

    // Determine session position for the progress bar label
    let segmentLabel = 'Sequences';
    if (inSession) {
        const sess = getSession();
        segmentLabel = `Set ${sess.currentItem + 1} of ${sess.queue[sess.currentSegment].items.length}`;
    }

    const isLast = currentIdx === items.length - 1;

    function handleNext() {
        stopSpeaking();

        if (!isLast) {
            currentIdx++;
            renderExercise(container, inSession);
            return;
        }

        // Finished this set — advance session or return to menu
        if (inSession) {
            const next = advanceExercise({ type: MY_TYPE, report: 'independent' });
            if (!next) {
                window.location.hash = 'session-complete';
            } else if (next.type !== MY_TYPE) {
                window.location.hash = next.type;
            } else {
                // Another sequences set in the segment — load it
                const sess = getSession();
                const nextSetItem = sess.queue[sess.currentSegment].items[sess.currentItem];
                activeSetId = nextSetItem.id;
                currentIdx  = 0;
                renderExercise(container, true);
            }
        } else {
            activeSetId = null;
            renderMenu(container);
        }
    }

    // Top Bar
    const topBar = createElement('div', { className: 'exercise-screen__top-bar' }, [
        createElement('button', {
            className: 'exercise-screen__back',
            onClick: () => {
                stopSpeaking();
                if (inSession) {
                    window.location.hash = 'home';
                } else {
                    activeSetId = null;
                    renderMenu(container);
                }
            },
        }, inSession ? '← Exit' : '← Sequences'),
        createElement('span', { className: 'exercise-screen__counter', id: 'seq-counter' },
            `${currentIdx + 1} / ${items.length}`
        ),
        createElement('button', {
            className: 'exercise-screen__next',
            id: 'seq-top-next',
            onClick: handleNext,
        }, isLast ? (inSession ? 'Done ✓' : 'Finish ✓') : 'Next →'),
    ]);

    // Progress Bar
    const progressFill = createElement('div', {
        className: 'progress-bar__fill',
        id: 'seq-progress-fill',
        style: {
            width: `${((currentIdx + 1) / items.length) * 100}%`,
            background: 'var(--color-accent-orange)',
        },
    });
    const progressBar = createElement('div', { className: 'exercise-screen__progress' }, [
        createElement('div', { className: 'progress-bar' }, [progressFill]),
    ]);

    // Main Body
    const body = createElement('div', {
        className: 'exercise__body',
        id: 'seq-body',
        style: { justifyContent: 'center', minHeight: '320px' },
    });

    // Sequence title tag
    const badge = createElement('div', {
        className: 'badge mb-4',
        style: {
            background: 'var(--color-card-light)',
            color: 'var(--color-primary)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--fs-caption)',
            fontWeight: 'var(--fw-semibold)',
        },
    }, `${seq.title}`);

    // Large Target Text
    const textEl = createElement('div', {
        className: 'exercise__word text-center',
        style: {
            fontSize: items.length > 20 ? '3rem' : '2.25rem',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--color-primary)',
            lineHeight: '1.3',
            maxWidth: '560px',
            margin: '0 auto var(--sp-6)',
        },
    }, currentItem);

    // Audio / Listen button
    const listenBtn = createElement('button', {
        className: 'btn btn--primary',
        id: 'seq-listen-btn',
        style: { minWidth: '180px', margin: '0 auto' },
        onClick: async () => {
            if (isSpeaking) return;
            isSpeaking = true;
            listenBtn.style.background = 'var(--color-card)';
            listenBtn.style.color = 'var(--color-primary)';
            listenBtn.textContent = '🔊  Playing…';

            try {
                await speak(currentItem);
            } finally {
                isSpeaking = false;
                listenBtn.style.background = 'var(--color-primary)';
                listenBtn.style.color = 'var(--color-white)';
                listenBtn.textContent = '🔊  Listen';
            }
        },
    }, '🔊  Listen');

    body.append(badge, textEl, listenBtn);

    // Footer Controls: Previous & Next (Fixed Order)
    const footer = createElement('div', {
        className: 'exercise__footer container flex-row gap-3',
        style: { maxWidth: '480px', margin: '0 auto', paddingTop: 'var(--sp-4)' },
    });

    const prevBtn = createElement('button', {
        className: 'btn btn--secondary flex-1',
        disabled: currentIdx === 0,
        style: { opacity: currentIdx === 0 ? '0.4' : '1' },
        onClick: () => {
            if (currentIdx > 0) {
                stopSpeaking();
                currentIdx--;
                renderExercise(container, inSession);
            }
        },
    }, '← Previous');

    const nextBtn = createElement('button', {
        className: 'btn btn--primary flex-1',
        onClick: handleNext,
    }, isLast ? (inSession ? 'Done ✓' : 'Finish ✓') : 'Next →');

    footer.append(prevBtn, nextBtn);

    container.append(topBar, progressBar, body, footer);
}
