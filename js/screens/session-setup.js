/**
 * Session Setup Screen
 *
 * "Today's session · About 30 minutes"
 * Toggle focus areas → Begin → builds exercise queue → navigates to first exercise.
 */

import { createElement }                    from '../utils.js';
import { getSettings }                       from '../db.js';
import { startSession, getSession }          from '../session.js';

export async function render(container) {
    container.innerHTML = '';

    const settings   = await getSettings();
    const minutes    = settings?.sessionLengthMinutes || 30;

    /* ── Header ──────────────────────────────────────── */
    const title    = createElement('h1', { className: 'session-setup__title' }, "Today's Session");
    const subtitle = createElement('p',  { className: 'session-setup__subtitle' }, `About ${minutes} minutes of practice`);

    /* ── Focus areas ─────────────────────────────────── */
    const AREAS = [
        { key: 'words',         icon: '🗣️', label: 'Word Retrieval',      desc: 'Find and say words with hints' },
        { key: 'pronunciation', icon: '🔊', label: 'Pronunciation Drill', desc: 'Listen and repeat words' },
        { key: 'verbs',         icon: '🏃', label: 'Verbs & Pronouns',    desc: 'Action words and subject pronouns' },
        { key: 'sentences',     icon: '🧩', label: 'Sentence Building',   desc: 'Arrange words into sentences' },
        { key: 'conversation',  icon: '💬', label: 'Conversation',        desc: 'Open-ended speaking practice' },
    ];

    const selected = new Set(AREAS.map(a => a.key));
    const list     = createElement('div', { className: 'session-setup__focus-list' });

    for (const area of AREAS) {
        const item = createElement('label', {
            className: 'session-setup__focus-item session-setup__focus-item--active',
            style: { cursor: 'pointer' },
        });

        const cb     = createElement('input', { type: 'checkbox', className: 'toggle__input' });
        cb.checked   = true;
        const slider = createElement('span', { className: 'toggle__slider' });

        const body = createElement('div', { className: 'flex-col', style: { marginLeft: 'var(--sp-3)' } }, [
            createElement('span', { className: 'fw-semibold' }, `${area.icon}  ${area.label}`),
            createElement('span', { className: 'text-sm text-secondary' }, area.desc),
        ]);

        cb.addEventListener('change', () => {
            if (cb.checked) {
                selected.add(area.key);
                item.classList.add('session-setup__focus-item--active');
            } else {
                selected.delete(area.key);
                item.classList.remove('session-setup__focus-item--active');
            }
        });

        item.append(cb, slider, body);
        list.appendChild(item);
    }

    /* ── Begin Button ────────────────────────────────── */
    const beginBtn = createElement('button', {
        className: 'btn btn--primary-lg mt-6',
        id: 'begin-session-btn',
    }, '▶  Begin');

    beginBtn.addEventListener('click', async () => {
        const areas = Array.from(selected);
        if (areas.length === 0) return;

        beginBtn.disabled    = true;
        beginBtn.textContent = 'Preparing…';

        try {
            await startSession(areas);

            const s = getSession();
            if (s.queue.length > 0) {
                window.location.hash = s.queue[0].type;
            } else {
                window.location.hash = 'home';
            }
        } catch (e) {
            console.error('Failed to start session:', e);
            beginBtn.disabled    = false;
            beginBtn.textContent = '▶  Begin';
        }
    });

    /* ── Back ────────────────────────────────────────── */
    const backBtn = createElement('button', {
        className: 'btn btn--ghost w-full mt-3',
        onClick: () => { window.location.hash = 'home'; },
    }, '← Back');

    container.append(title, subtitle, list, beginBtn, backBtn);
}
