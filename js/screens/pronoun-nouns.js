/**
 * Pronoun + Noun Exercise Screen
 *
 * Progressive possessive phrase practice:
 *   Step 1: Read & Say — "His knife" (with image + text)
 *   Step 2: Recall & Say — "His ____" (image + possessive prompt, patient recalls noun)
 *
 * Uses today's theme nouns paired with possessive pronouns (my, your, his, her, our, their).
 */

import { getAll, put }                                   from '../db.js';
import { speak, stopSpeaking }                           from '../speech.js';
import { createElement, getEncouragement, shuffleArray,
         capitalize, POSSESSIVE_PRONOUNS, getTodayTheme,
         getThemeNouns }                                 from '../utils.js';
import { isSessionActive, getSession, advanceExercise }   from '../session.js';

const MY_TYPE = 'pronoun-nouns';

export async function render(container) {
    container.innerHTML = '';

    const inSession = isSessionActive();
    let items, currentIdx;

    if (inSession) {
        const seg = getSession().queue[getSession().currentSegment];
        if (!seg || seg.type !== MY_TYPE) { window.location.hash = 'home'; return; }
        items      = seg.items;
        currentIdx = getSession().currentItem;
    } else {
        // Standalone mode: pair available nouns with possessive pronouns
        const allWords   = await getAll('words');
        const allSessions = await getAll('sessions');
        const theme      = getTodayTheme(allSessions.length);
        let themeNouns   = getThemeNouns(theme, allWords);
        if (themeNouns.length === 0) {
            themeNouns = allWords.filter(w => w.category === 'noun');
        }
        const nounsPool = shuffleArray(themeNouns);
        const possessives = POSSESSIVE_PRONOUNS.map(p => p.text);
        items = possessives.map((pos, i) => {
            const noun = nounsPool[i % nounsPool.length] || { text: 'item', id: 'n_' + i };
            const capPossessive = capitalize(pos);
            const imageSrc = noun.imageDataUrl || `assets/images/nouns/${noun.text.toLowerCase().trim()}.png`;
            return {
                noun: noun.text,
                possessive: pos,
                phrase: `${capPossessive} ${noun.text}`,
                nounImageSrc: imageSrc,
                wordId: noun.id,
                nounWord: noun,
            };
        });
        currentIdx = 0;
    }

    let step       = 1;     // 1 = read & say, 2 = recall & say
    let reported   = false;
    let isSpeaking = false;

    /* ── Audio Playback ─────────────────────────────── */
    async function playPhraseAudio() {
        const item = items[currentIdx];
        if (!item) return;

        const hearBtn = document.getElementById('pn-hear-btn');

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
            await speak(item.phrase);
        } catch (err) {
            console.warn('TTS playback error:', err);
        } finally {
            isSpeaking = false;
            if (hearBtn) {
                hearBtn.classList.remove('btn--speaking');
                hearBtn.textContent = '🔊  Hear it';
            }
        }
    }

    /* ── Layout Shell ────────────────────────────────── */
    const backRoute = inSession ? 'home' : 'words-select';
    const topBar = createElement('div', { className: 'exercise-screen__top-bar' }, [
        createElement('button', {
            className: 'exercise-screen__back',
            onClick: () => { window.location.hash = backRoute; },
        }, inSession ? '← Exit' : '← Back'),
        createElement('span', { className: 'exercise-screen__counter', id: 'pn-counter' }),
        createElement('button', {
            className: 'exercise-screen__next',
            id: 'pn-top-next',
            onClick: () => goNext('skipped'),
        }, 'Next →'),
    ]);

    const progressBar = createElement('div', { className: 'exercise-screen__progress' }, [
        createElement('div', { className: 'progress-bar' }, [
            createElement('div', { className: 'progress-bar__fill', id: 'pn-progress-fill' }),
        ]),
    ]);

    const body   = createElement('div', { className: 'exercise__body', id: 'pn-body' });
    const footer = createElement('div', { className: 'exercise__footer container', id: 'pn-footer' });

    container.className = 'screen exercise-screen';
    container.append(topBar, progressBar, body, footer);

    showItem();

    /* ── Show Current Item ───────────────────────────── */
    function showItem() {
        const item = items[currentIdx];
        if (!item) { finish(); return; }

        step       = 1;
        reported   = false;
        const isLast = currentIdx >= items.length - 1;
        const topNext = document.getElementById('pn-top-next');
        if (topNext) {
            topNext.textContent = isLast ? (inSession ? 'Done ✓' : 'Finish ✓') : 'Next →';
        }

        document.getElementById('pn-counter').textContent =
            `${currentIdx + 1} / ${items.length}`;

        document.getElementById('pn-progress-fill').style.width =
            `${(currentIdx / items.length) * 100}%`;

        renderStep();
    }

    /* ── Render Step (1: Read & Say, 2: Recall & Say) ── */
    function renderStep() {
        const item = items[currentIdx];
        if (!item) return;

        const body = document.getElementById('pn-body');
        body.innerHTML = '';

        // Noun Image with graceful error fallback
        const imgEl = createElement('img', {
            src: item.nounImageSrc,
            alt: item.noun,
            className: 'photo-preview photo-preview--interactive',
            style: { maxWidth: '200px', maxHeight: '180px', objectFit: 'contain' },
            role: 'button',
            tabIndex: 0,
            'aria-label': `Listen to ${item.phrase}`,
            onClick: playPhraseAudio,
        });

        imgEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playPhraseAudio();
            }
        });

        imgEl.onerror = () => {
            const placeholder = createElement('div', {
                className: 'photo-placeholder photo-placeholder--sm photo-preview--interactive',
                role: 'button',
                tabIndex: 0,
                'aria-label': `Listen to ${item.phrase}`,
                onClick: playPhraseAudio,
            }, '🖼️');
            placeholder.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playPhraseAudio();
                }
            });
            imgEl.replaceWith(placeholder);
        };
        body.appendChild(imgEl);

        // Step Badge
        const stepLabel = step === 1 ? 'Step 1: Read & Say' : 'Step 2: Recall & Say';
        body.appendChild(createElement('div', {
            className: 'badge badge--blue mt-3 mb-2',
        }, stepLabel));

        // Target Phrase Display
        const capPossessive = capitalize(item.possessive);
        const displayWord = step === 1
            ? item.phrase
            : `${capPossessive}  ______`;

        const wordEl = createElement('div', {
            className: 'exercise__word',
            style: { fontSize: 'var(--fs-2xl)', minHeight: '48px' },
        }, displayWord);
        body.appendChild(wordEl);

        // Standalone Hear it button
        const hearBtn = createElement('button', {
            className: 'btn btn--ghost mt-2',
            id: 'pn-hear-btn',
            onClick: playPhraseAudio,
        }, '🔊  Hear it');
        body.appendChild(hearBtn);

        // Prompt
        const promptText = step === 1
            ? 'Say the phrase aloud.'
            : 'Look at the picture. Say the full phrase.';
        body.appendChild(createElement('p', {
            className: 'exercise__prompt mt-3',
        }, promptText));

        // Encouragement Area
        body.appendChild(createElement('div', {
            id: 'pn-encouragement',
            className: 'exercise__encouragement mt-2',
        }));

        renderReport();
    }

    /* ── Self-Report Buttons ─────────────────────────── */
    function renderReport() {
        const ft = document.getElementById('pn-footer');
        ft.innerHTML = '';

        const label = createElement('p', {
            className: 'text-center text-sm text-secondary mb-3',
        }, 'How did you do?');

        const group = createElement('div', { className: 'self-report' });

        const btns = [
            { report: 'independent', cls: 'self-report__btn--success', icon: '✓', label: 'I said it' },
            { report: 'cue',         cls: 'self-report__btn--help',    icon: '↻', label: 'Needed help' },
            { report: 'unable',      cls: 'self-report__btn--unable',  icon: '→', label: "Couldn't" },
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

        const skipBtn = createElement('button', {
            className: 'btn btn--ghost w-full mt-3',
            style: { color: 'var(--text-secondary)' },
            onClick: () => goNext('skipped'),
        }, currentIdx < items.length - 1 ? 'Next Phrase →' : 'Finish ✓');

        ft.append(label, group, skipBtn);
    }

    /* ── Handle Self-Report ──────────────────────────── */
    async function handleReport(report) {
        if (reported) return;

        const item = items[currentIdx];

        // Encouragement feedback
        const enc = document.getElementById('pn-encouragement');
        if (enc) enc.textContent = getEncouragement(report);

        // Step progression: If user said it independently on Step 1, advance to Step 2 (Recall)
        if (report === 'independent' && step === 1) {
            step = 2;
            setTimeout(() => renderStep(), 750);
            return;
        }

        // Final report for this item
        reported = true;

        // If the noun word is from the database, update its record
        if (item.nounWord && item.nounWord.id) {
            try {
                const w = item.nounWord;
                w.timesAttempted = (w.timesAttempted || 0) + 1;
                if (report === 'independent') {
                    w.timesIndependent = (w.timesIndependent || 0) + 1;
                }
                w.lastPracticed = new Date().toISOString();
                await put('words', w);
            } catch (err) {
                console.warn('Could not update word record:', err);
            }
        }

        // Show Next button
        const ft = document.getElementById('pn-footer');
        ft.innerHTML = '';
        const isLast = currentIdx >= items.length - 1;
        const nextBtn = createElement('button', {
            className: 'btn btn--primary-lg',
            onClick: () => goNext(report),
        }, isLast ? 'Finish ✓' : 'Next Phrase →');
        ft.appendChild(nextBtn);
    }

    /* ── Advance / Next ──────────────────────────────── */
    function goNext(report = 'skipped') {
        stopSpeaking();

        if (inSession) {
            const next = advanceExercise({
                wordId: items[currentIdx]?.wordId,
                type: MY_TYPE,
                report,
            });
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
