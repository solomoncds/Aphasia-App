/**
 * Progress Screen
 *
 * Shows word status breakdown, recent transitions, and session history.
 * No abstract score — real status labels like "Water: Needed help → Independent."
 */

import { getAll }                                      from '../db.js';
import { createElement, formatDateShort, STATUS_LABELS } from '../utils.js';

export async function render(container) {
    container.innerHTML = '';

    const allWords   = await getAll('words');
    const sessions   = await getAll('sessions');
    const nonNumbers = allWords.filter(w => w.category !== 'number');

    const mastered   = nonNumbers.filter(w => w.status === 'independent');
    const improving  = nonNumbers.filter(w => w.status === 'cue' || w.status === 'model');
    const needsWork  = nonNumbers.filter(w => w.status === 'unable');

    /* ── Title ────────────────────────────────────────── */
    container.appendChild(createElement('h1', { className: 'mb-6' }, '📊 Progress'));

    /* ── Overview stats ───────────────────────────────── */
    const statsGrid = createElement('div', { className: 'progress-screen__stats' }, [
        statCard(String(mastered.length),  'Mastered',    'var(--accent-green)'),
        statCard(String(improving.length), 'Improving',   'var(--accent-amber)'),
        statCard(String(needsWork.length), 'To Practice', 'var(--accent-rose)'),
    ]);
    container.appendChild(statsGrid);

    /* ── Breakdown by category ────────────────────────── */
    const catSection = createElement('div', { className: 'progress-screen__section' });
    catSection.appendChild(createElement('h3', { className: 'progress-screen__section-title' }, '📂 By Category'));

    const categories = ['noun', 'verb', 'pronoun', 'phrase'];
    const catLabels  = { noun: 'Nouns', verb: 'Verbs', pronoun: 'Pronouns', phrase: 'Phrases' };

    const barGroup = createElement('div', { className: 'progress-screen__bar-group' });
    for (const cat of categories) {
        const words  = nonNumbers.filter(w => w.category === cat);
        const ind    = words.filter(w => w.status === 'independent').length;
        const total  = words.length;
        const pct    = total > 0 ? Math.round((ind / total) * 100) : 0;

        const item = createElement('div', { className: 'progress-screen__bar-item' }, [
            createElement('div', { className: 'progress-screen__bar-label' }, [
                createElement('span', {}, catLabels[cat] || cat),
                createElement('span', {}, `${ind}/${total} (${pct}%)`),
            ]),
            createElement('div', { className: 'progress-bar' }, [
                createElement('div', {
                    className: 'progress-bar__fill progress-bar__fill--green',
                    style: { width: `${pct}%` },
                }),
            ]),
        ]);
        barGroup.appendChild(item);
    }
    catSection.appendChild(barGroup);
    container.appendChild(catSection);

    /* ── Recent transitions ───────────────────────────── */
    const practiced = nonNumbers
        .filter(w => w.lastPracticed && w.timesAttempted > 0)
        .sort((a, b) => new Date(b.lastPracticed) - new Date(a.lastPracticed))
        .slice(0, 10);

    if (practiced.length > 0) {
        const transSection = createElement('div', { className: 'progress-screen__section' });
        transSection.appendChild(createElement('h3', { className: 'progress-screen__section-title' }, '🔄 Recent Activity'));

        const list = createElement('div', { className: 'progress-screen__transitions' });
        for (const w of practiced) {
            const statusLabel = STATUS_LABELS[w.status] || w.status;
            const badge = w.status === 'independent' ? 'badge--green'
                        : w.status === 'cue'         ? 'badge--amber'
                        :                              'badge--rose';

            list.appendChild(createElement('div', { className: 'transition-item' }, [
                createElement('span', { className: 'transition-item__word' }, w.text),
                createElement('span', { className: `badge ${badge}` }, statusLabel),
                createElement('span', {
                    className: 'text-sm text-secondary',
                    style: { marginLeft: 'auto' },
                }, `${w.timesAttempted} tries`),
            ]));
        }
        transSection.appendChild(list);
        container.appendChild(transSection);
    }

    /* ── Session history ──────────────────────────────── */
    if (sessions.length > 0) {
        const sessSection = createElement('div', { className: 'progress-screen__section' });
        sessSection.appendChild(createElement('h3', { className: 'progress-screen__section-title' }, '📅 Session History'));

        const sorted = [...sessions].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10);
        const list   = createElement('div', { className: 'flex-col gap-2' });

        for (const s of sorted) {
            list.appendChild(createElement('div', {
                className: 'card flex-row items-center gap-4',
                style: { padding: 'var(--sp-3) var(--sp-4)' },
            }, [
                createElement('span', { className: 'fw-semibold' }, formatDateShort(s.date)),
                createElement('span', { className: 'text-sm text-secondary flex-1' },
                    `${s.exercisesCompleted} exercises · ${s.minutesPracticed} min`),
            ]));
        }

        sessSection.appendChild(list);
        container.appendChild(sessSection);
    }

    /* ── Numbers progress (collapsed) ─────────────────── */
    const numbers = allWords.filter(w => w.category === 'number');
    const numMastered = numbers.filter(w => w.status === 'independent').length;

    container.appendChild(createElement('div', { className: 'progress-screen__section' }, [
        createElement('h3', { className: 'progress-screen__section-title' }, '🔢 Numbers'),
        createElement('div', { className: 'progress-screen__bar-item' }, [
            createElement('div', { className: 'progress-screen__bar-label' }, [
                createElement('span', {}, '1–1000'),
                createElement('span', {}, `${numMastered}/1000`),
            ]),
            createElement('div', { className: 'progress-bar' }, [
                createElement('div', {
                    className: 'progress-bar__fill',
                    style: { width: `${(numMastered / 1000) * 100}%`, background: 'var(--accent-purple)' },
                }),
            ]),
        ]),
    ]));
}

function statCard(value, label, color) {
    return createElement('div', { className: 'stat' }, [
        createElement('div', { className: 'stat__value', style: { color } }, value),
        createElement('div', { className: 'stat__label' }, label),
    ]);
}
