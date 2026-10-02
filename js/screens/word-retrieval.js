/**
 * Word Retrieval Exercise
 *
 * The core aphasia exercise: show an image → "What is this?" →
 * escalate through a 3-step cueing hierarchy if needed →
 * self-report (✓ / ↻ / →).
 *
 * Cueing hierarchy (for nouns):
 *   1. Meaning hint — "You drink from it."
 *   2. First-sound hint — "It starts with 'C'."
 *   3. Full audio model — TTS plays the word.
 *
 * Self-report buttons are always visible — user can report at any hint level.
 */

import { getAll, put }                                   from '../db.js';
import { speak, stopSpeaking, speakHint }                 from '../speech.js';
import { createElement }                                  from '../utils.js';
import { getEncouragement, shuffleArray, capitalize }     from '../utils.js';
import { isSessionActive, getSession, getCurrentExercise,
         advanceExercise, getSessionProgress }            from '../session.js';

const MY_TYPE = 'word-retrieval';

export async function render(container) {
    container.innerHTML = '';

    /* ── Determine items ─────────────────────────────── */
    const inSession = isSessionActive();
    let items, itemIdx;

    if (inSession) {
        const seg = getSession().queue[getSession().currentSegment];
        if (!seg || seg.type !== MY_TYPE) { window.location.hash = 'home'; return; }
        items   = seg.items;
        itemIdx = getSession().currentItem;
    } else {
        const hash = window.location.hash;
        const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
        const params = new URLSearchParams(queryStr);
        const syllableParam = params.get('syllables') ? parseInt(params.get('syllables'), 10) : null;
        const themeParam = params.get('theme');

        const all   = await getAll('words');
        let nouns   = all.filter(w => w.category === 'noun');

        if (syllableParam) {
            nouns = nouns.filter(w => w.syllableCount === syllableParam);
        } else if (themeParam) {
            nouns = nouns.filter(w => w.theme === themeParam);
        }

        const pool  = nouns.filter(w => w.status !== 'independent');
        const candidatePool = pool.length >= 3 ? pool : nouns;
        items   = shuffleArray(candidatePool).slice(0, Math.min(10, candidatePool.length));
        itemIdx = 0;
    }

    let currentIdx = itemIdx;
    let hintLevel  = 0;          // 0 = none, 1 = meaning, 2 = first-sound, 3 = model played
    let reported   = false;
    let isSpeaking = false;

    /* ── Inactivity timers ───────────────────────────── */
    let idleTimerA = null;   // 4s — nudge toward hint
    let idleTimerB = null;   // 10s — nudge toward Next

    function clearIdleTimers() {
        clearTimeout(idleTimerA);
        clearTimeout(idleTimerB);
        idleTimerA = null;
        idleTimerB = null;
    }

    function startIdleTimerA() {
        clearIdleTimers();
        idleTimerA = setTimeout(() => {
            const hintBtn = document.getElementById('wr-hint-btn');
            if (hintBtn && !reported) {
                hintBtn.classList.add('btn--nudge');
                speakHint('Try a hint.');
            }
        }, 4000);
    }

    function startIdleTimerB() {
        clearIdleTimers();
        idleTimerB = setTimeout(() => {
            const topNext = document.getElementById('wr-top-next');
            if (topNext) topNext.classList.add('btn--nudge');
            const footerNext = document.querySelector('#wr-footer .btn--primary-lg');
            if (footerNext) footerNext.classList.add('btn--nudge');
            speak('Ready for the next one?');
        }, 10000);
    }

    /* ── Word Audio Playback ─────────────────────────── */
    async function playWordAudio() {
        const word = items[currentIdx];
        if (!word) return;

        const hearBtn = document.getElementById('wr-hear-btn');

        if (isSpeaking) {
            stopSpeaking();
            isSpeaking = false;
            if (hearBtn) {
                hearBtn.classList.remove('btn--speaking');
                hearBtn.textContent = '🔊  Hear it';
            }
            return;
        }

        isSpeaking = true;
        if (hearBtn) {
            hearBtn.classList.add('btn--speaking');
            hearBtn.textContent = '🔊  Playing…';
        }

        try {
            await speak(word.text);
        } catch (err) {
            console.warn('Playback error:', err);
        } finally {
            isSpeaking = false;
            if (hearBtn) {
                hearBtn.classList.remove('btn--speaking');
                hearBtn.textContent = '🔊  Hear it';
            }
        }
    }

    /* ── Layout shell ────────────────────────────────── */
    const backRoute = inSession ? 'home' : 'words-select';
    const topBar = createElement('div', { className: 'exercise-screen__top-bar' }, [
        createElement('button', {
            className: 'exercise-screen__back',
            onClick: () => { window.location.hash = backRoute; },
        }, inSession ? '← Exit' : '← Words'),
        createElement('span', { className: 'exercise-screen__counter', id: 'wr-counter' }),
        createElement('button', {
            className: 'exercise-screen__next',
            id: 'wr-top-next',
            onClick: () => goNext('skipped'),
        }, 'Next →'),
    ]);

    const progressBar = createElement('div', { className: 'exercise-screen__progress' }, [
        createElement('div', { className: 'progress-bar' }, [
            createElement('div', { className: 'progress-bar__fill', id: 'wr-progress-fill' }),
        ]),
    ]);

    const body = createElement('div', { className: 'exercise__body', id: 'wr-body' });
    const footer = createElement('div', { className: 'exercise__footer container', id: 'wr-footer' });

    container.append(topBar, progressBar, body, footer);
    container.className = 'screen exercise-screen';

    showItem();

    /* ── Render current item ─────────────────────────── */
    function showItem() {
        const word = items[currentIdx];
        if (!word) { finish(); return; }

        hintLevel  = 0;
        reported   = false;
        isSpeaking = false;

        // Counter & Progress
        const isLast = currentIdx >= items.length - 1;
        const topNext = document.getElementById('wr-top-next');
        if (topNext) {
            topNext.textContent = isLast ? (inSession ? 'Done ✓' : 'Finish ✓') : 'Next →';
            topNext.classList.remove('btn--nudge');
        }

        document.getElementById('wr-counter').textContent =
            `${currentIdx + 1} / ${items.length}`;

        // Progress bar
        document.getElementById('wr-progress-fill').style.width =
            `${((currentIdx) / items.length) * 100}%`;

        const body = document.getElementById('wr-body');
        body.innerHTML = '';

        // ── Task 4: Dominant "What is this?" ABOVE image ──
        body.appendChild(createElement('p', {
            className: 'exercise__big-prompt',
        }, 'What is this?'));

        body.appendChild(createElement('span', {
            className: 'exercise__prompt-arrow',
        }, '↓'));

        // Image / placeholder (custom user photo > static downloaded noun asset > placeholder emoji)
        const imageSrc = word.imageDataUrl || `assets/images/nouns/${word.text.toLowerCase().trim()}.png`;
        const imgEl = createElement('img', {
            src: imageSrc,
            alt: word.text,
            className: 'photo-preview photo-preview--interactive',
            style: { maxWidth: '200px' },
            role: 'button',
            tabIndex: 0,
            'aria-label': `Listen to ${word.text}`,
            onClick: () => { clearIdleTimers(); startIdleTimerA(); playWordAudio(); },
        });

        imgEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clearIdleTimers(); startIdleTimerA();
                playWordAudio();
            }
        });

        imgEl.onerror = () => {
            const placeholder = createElement('div', {
                className: 'photo-placeholder photo-placeholder--sm photo-preview--interactive',
                role: 'button',
                tabIndex: 0,
                'aria-label': `Listen to ${word.text}`,
                onClick: () => { clearIdleTimers(); startIdleTimerA(); playWordAudio(); },
            }, '🖼️');
            placeholder.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    clearIdleTimers(); startIdleTimerA();
                    playWordAudio();
                }
            });
            imgEl.replaceWith(placeholder);
        };

        body.appendChild(imgEl);

        // Actions area containing standalone Hear it button + hint escalation
        const actionsArea = createElement('div', {
            id: 'wr-actions',
            className: 'exercise__actions',
        });
        body.appendChild(actionsArea);

        // Standalone 🔊 "Hear it" button (always visible & usable)
        const hearBtn = createElement('button', {
            className: 'btn btn--primary w-full',
            id: 'wr-hear-btn',
            onClick: () => { clearIdleTimers(); startIdleTimerA(); playWordAudio(); },
        }, '🔊  Hear it');
        actionsArea.appendChild(hearBtn);

        // Hint area (preserves 3-step escalation sequence)
        const hintArea = createElement('div', {
            id: 'wr-hints',
            className: 'flex-col gap-3 w-full',
        });
        actionsArea.appendChild(hintArea);

        // Hint button — Task 5: shorter label
        const hintBtn = createElement('button', {
            className: 'btn btn--secondary w-full',
            id: 'wr-hint-btn',
        }, '💡  Hint 1');
        hintBtn.addEventListener('click', () => { clearIdleTimers(); startIdleTimerA(); showNextHint(); });
        hintArea.appendChild(hintBtn);

        // Encouragement placeholder
        body.appendChild(createElement('div', {
            id: 'wr-encouragement', className: 'exercise__encouragement',
        }));

        // Self-report
        renderSelfReport();

        // Start idle timer A
        startIdleTimerA();
    }

    function playHintSpeech(text) {
        if (isSpeaking) {
            isSpeaking = false;
            const hearBtn = document.getElementById('wr-hear-btn');
            if (hearBtn) {
                hearBtn.classList.remove('btn--speaking');
                hearBtn.textContent = '🔊  Hear it';
            }
        }
        speakHint(text);
    }

    function showNextHint() {
        const word     = items[currentIdx];
        const hintArea = document.getElementById('wr-hints');
        const hintBtn  = document.getElementById('wr-hint-btn');

        hintLevel++;

        if (hintLevel === 1 && word.meaningHint) {
            // Meaning hint
            const hint = createElement('div', { className: 'exercise__hint' },
                `💡 ${word.meaningHint}`);
            hintArea.insertBefore(hint, hintBtn);
            // Task 5: shorter label
            hintBtn.textContent = '🔤  Hint 2';
            hintBtn.classList.remove('btn--nudge');
            playHintSpeech(word.meaningHint);

        } else if ((hintLevel === 2 || (hintLevel === 1 && !word.meaningHint)) && word.firstSoundHint) {
            // First-sound hint
            if (hintLevel === 1) hintLevel = 2; // skip meaning if no meaning hint
            const hint = createElement('div', { className: 'exercise__hint' },
                `🔤 ${word.firstSoundHint}`);
            hintArea.insertBefore(hint, hintBtn);
            hintBtn.textContent = '🔊  Hear it';
            hintBtn.classList.remove('btn--nudge');
            playHintSpeech(word.firstSoundHint);

        } else {
            // Full model — play TTS / pre-rendered audio
            hintLevel = 3;
            hintBtn.remove();

            // Render word using large/bold typography
            const wordDisplay = createElement('div', {
                className: 'exercise__word mt-2 mb-2',
                style: { animation: 'fadeIn 0.3s ease' },
            }, capitalize(word.text));
            hintArea.appendChild(wordDisplay);

            playWordAudio();

            // Add "hear again" button
            const againBtn = createElement('button', {
                className: 'btn btn--ghost w-full mt-2',
                onClick: () => { clearIdleTimers(); startIdleTimerA(); playWordAudio(); },
            }, '🔊  Hear again');
            hintArea.appendChild(againBtn);
        }
    }

    /* ── Self-Report Buttons (2-button, inferred status) ── */
    function renderSelfReport() {
        const footer = document.getElementById('wr-footer');
        footer.innerHTML = '';

        const group = createElement('div', { className: 'self-report' });

        const gotItBtn = createElement('button', {
            className: 'self-report__btn self-report__btn--got-it',
        }, [
            createElement('span', { className: 'self-report__icon' }, '✓'),
            createElement('span', {}, 'Got it'),
        ]);
        gotItBtn.addEventListener('click', () => {
            // Infer status from hint level reached
            const inferredReport = hintLevel === 0 ? 'independent'
                                 : hintLevel <= 2  ? 'cue'
                                 :                   'model';
            handleReport(inferredReport);
        });

        const didntBtn = createElement('button', {
            className: 'self-report__btn self-report__btn--didnt-get-it',
        }, [
            createElement('span', { className: 'self-report__icon' }, '✗'),
            createElement('span', {}, "Didn't get it"),
        ]);
        didntBtn.addEventListener('click', () => handleReport('unable'));

        group.append(gotItBtn, didntBtn);
        footer.appendChild(group);
    }

    /* ── Handle Report ───────────────────────────────── */
    async function handleReport(report) {
        if (reported) return;
        reported = true;
        clearIdleTimers();

        const word = items[currentIdx];

        // Update word status in DB
        word.status          = report === 'independent' ? 'independent'
                              : report === 'cue'        ? 'cue'
                              : report === 'model'      ? 'model'
                              : 'unable';
        word.timesAttempted  = (word.timesAttempted || 0) + 1;
        if (report === 'independent') word.timesIndependent = (word.timesIndependent || 0) + 1;
        word.lastPracticed   = new Date().toISOString();
        await put('words', word);

        // Show encouragement
        const encEl = document.getElementById('wr-encouragement');
        encEl.textContent = getEncouragement(report);

        // Show correct word if not already displayed
        const body = document.getElementById('wr-body');
        if (!body.querySelector('.exercise__word')) {
            const reveal = createElement('div', {
                className: 'exercise__word mt-2', style: { animation: 'fadeIn 0.3s ease' },
            }, capitalize(word.text));
            body.appendChild(reveal);
        }

        // Replace self-report with Next button
        const footer = document.getElementById('wr-footer');
        footer.innerHTML = '';

        const nextBtn = createElement('button', {
            className: 'btn btn--primary-lg',
            onClick: () => goNext(report),
        }, currentIdx < items.length - 1 ? 'Next Word →' : 'Finish ✓');
        footer.appendChild(nextBtn);

        // Start idle timer B — nudge toward Next after 10s
        startIdleTimerB();
    }

    /* ── Next / Finish ───────────────────────────────── */
    function goNext(report = 'skipped') {
        clearIdleTimers();
        stopSpeaking();
        isSpeaking = false;

        if (inSession) {
            const next = advanceExercise({ wordId: items[currentIdx]?.id, type: MY_TYPE, report });
            if (!next) { finish(); return; }
            if (next.type !== MY_TYPE) {
                window.location.hash = next.type;
                return;
            }
            currentIdx = getSession().currentItem;
        } else {
            currentIdx++;
        }

        if (currentIdx >= items.length) { finish(); return; }
        showItem();
    }

    function finish() {
        if (inSession) {
            window.location.hash = 'session-complete';
        } else {
            window.location.hash = 'home';
        }
    }

    return () => {
        clearIdleTimers();
        stopSpeaking();
        isSpeaking = false;
    };
}
