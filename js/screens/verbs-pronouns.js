/**
 * Verbs & Pronouns Exercise
 *
 * Progressive practice:
 *   Step 1 — Say the verb:  "eat"
 *   Step 2 — Pronoun + verb:  "I eat"
 *   Step 3 — Full sentence:  "I eat food."
 *
 * Uses family photos (from People store) when available to make
 * pronoun practice personally relevant ("She is eating" + photo of mum).
 */

import { getAll, put }                                   from '../db.js';
import { speak, stopSpeaking }                           from '../speech.js';
import { createElement }                                  from '../utils.js';
import { getEncouragement, shuffleArray, capitalize }     from '../utils.js';
import { isSessionActive, getSession, advanceExercise }   from '../session.js';

const MY_TYPE = 'verbs-pronouns';

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
        const all      = await getAll('words');
        const verbs    = all.filter(w => w.category === 'verb');
        const pronouns = all.filter(w => w.category === 'pronoun' && w.type === 'subject');
        items = shuffleArray(verbs).slice(0, 5).map(v => ({
            ...v,
            _pronoun: pronouns.length > 0
                ? pronouns[Math.floor(Math.random() * pronouns.length)]
                : { text: 'I' },
        }));
        currentIdx = 0;
    }

    // Load family people for photos
    const people = await getAll('people');

    let step     = 0;   // 0 = verb, 1 = pronoun+verb, 2 = full sentence
    let reported = false;

    /* ── Shell ────────────────────────────────────────── */
    const topBar = createElement('div', { className: 'exercise-screen__top-bar' }, [
        createElement('button', {
            className: 'exercise-screen__back',
            onClick: () => { window.location.hash = 'home'; },
        }, '← Exit'),
        createElement('span', { className: 'exercise-screen__counter', id: 'vp-counter' }),
        createElement('button', {
            className: 'exercise-screen__next',
            id: 'vp-top-next',
            onClick: () => goNext('skipped'),
        }, 'Next →'),
    ]);

    const progressBar = createElement('div', { className: 'exercise-screen__progress' }, [
        createElement('div', { className: 'progress-bar' }, [
            createElement('div', { className: 'progress-bar__fill', id: 'vp-fill',
                style: { background: 'var(--accent-purple)' } }),
        ]),
    ]);

    const body   = createElement('div', { className: 'exercise__body', id: 'vp-body' });
    const footer = createElement('div', { className: 'exercise__footer container', id: 'vp-footer' });

    container.className = 'screen exercise-screen';
    container.append(topBar, progressBar, body, footer);

    showItem();

    /* ── Render ───────────────────────────────────────── */
    function showItem() {
        const item = items[currentIdx];
        if (!item) { finish(); return; }

        step     = 0;
        reported = false;

        document.getElementById('vp-counter').textContent = `${currentIdx + 1} / ${items.length}`;
        document.getElementById('vp-fill').style.width    = `${(currentIdx / items.length) * 100}%`;

        renderStep();
    }

    function renderStep() {
        const item    = items[currentIdx];
        const pronoun = item._pronoun || { text: 'I' };
        const verb    = item.text;
        const example = item.exampleSentence || `${pronoun.text} ${verb}.`;

        const body = document.getElementById('vp-body');
        body.innerHTML = '';

        // Photo: family member for pronoun if available, otherwise verb action image
        const photo = findPhotoForPronoun(pronoun);
        if (photo) {
            body.appendChild(createElement('img', {
                src: photo, alt: pronoun.text || '',
                style: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' },
            }));
        } else {
            const verbKey = verb.toLowerCase().trim();
            const verbImg = createElement('img', {
                src: `assets/images/verbs/${verbKey}.png`,
                alt: verb,
                className: 'photo-preview mb-3',
                style: { maxWidth: '180px', maxHeight: '180px' },
            });
            verbImg.onerror = () => {
                // Try SVG fallback before giving up
                if (verbImg.src.endsWith('.png')) {
                    verbImg.src = `assets/images/verbs/${verbKey}.svg`;
                } else {
                    verbImg.remove();
                }
            };
            body.appendChild(verbImg);
        }

        // Step badge
        const stepLabels = ['Step 1: Say the verb', 'Step 2: Pronoun + Verb', 'Step 3: Full sentence'];
        body.appendChild(createElement('div', { className: 'badge badge--blue mt-3 mb-4' }, stepLabels[step]));

        // Target text
        let target;
        if (step === 0) {
            target = capitalize(verb);
        } else if (step === 1) {
            target = `${capitalize(pronoun.text)} ${verb}`;
        } else {
            target = example;
        }

        body.appendChild(createElement('div', { className: 'exercise__word' }, target));

        // Listen button
        const listenBtn = createElement('button', {
            className: 'btn btn--primary mt-6',
            onClick: () => speak(target),
        }, '🔊  Listen');
        body.appendChild(listenBtn);

        body.appendChild(createElement('p', {
            className: 'exercise__prompt mt-4',
        }, 'Now say it aloud.'));

        // Encouragement
        body.appendChild(createElement('div', {
            id: 'vp-encouragement', className: 'exercise__encouragement mt-3',
        }));

        // Self-report / advance step
        renderReport();
    }

    function findPhotoForPronoun(pronoun) {
        // Map pronouns to family photos if available
        if (!people || people.length === 0) return null;
        const text = pronoun.text.toLowerCase();
        if (text === 'he' || text === 'him') {
            const p = people.find(p => p.photoDataUrl && (p.relationship || '').toLowerCase() !== 'self');
            return p?.photoDataUrl || null;
        }
        if (text === 'she' || text === 'her') {
            const p = people.find(p => p.photoDataUrl);
            return p?.photoDataUrl || null;
        }
        return null;
    }

    function renderReport() {
        const ft = document.getElementById('vp-footer');
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
            btn.addEventListener('click', () => handleStepReport(b.report));
            group.appendChild(btn);
        }

        const skipBtn = createElement('button', {
            className: 'btn btn--ghost w-full mt-3',
            style: { color: 'var(--text-secondary)' },
            onClick: () => goNext('skipped'),
        }, currentIdx < items.length - 1 ? 'Next Word →' : 'Finish ✓');

        ft.append(label, group, skipBtn);
    }

    async function handleStepReport(report) {
        if (reported) return;

        const item = items[currentIdx];

        // Show encouragement
        const enc = document.getElementById('vp-encouragement');
        enc.textContent = getEncouragement(report);

        if (report === 'independent' && step < 2) {
            // Advance to next step
            step++;
            reported = false;
            setTimeout(() => renderStep(), 800);
            return;
        }

        // Final report for this word
        reported = true;

        // Update DB
        item.status         = report === 'independent' ? 'independent' : report === 'cue' ? 'cue' : 'unable';
        item.timesAttempted  = (item.timesAttempted || 0) + 1;
        if (report === 'independent') item.timesIndependent = (item.timesIndependent || 0) + 1;
        item.lastPracticed  = new Date().toISOString();
        await put('words', item);

        // Next button
        const ft = document.getElementById('vp-footer');
        ft.innerHTML = '';
        const nextBtn = createElement('button', {
            className: 'btn btn--primary-lg',
            onClick: () => goNext(report),
        }, currentIdx < items.length - 1 ? 'Next Word →' : 'Finish ✓');
        ft.appendChild(nextBtn);
    }

    function goNext(report = 'skipped') {
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
