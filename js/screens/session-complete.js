/**
 * Session Complete Screen
 *
 * Shows summary of the just-completed session:
 *   - Exercise count, time practiced
 *   - Results breakdown (mastered / helped / unable)
 *   - Back to Home
 *
 * No abstract score, no leaderboard.
 * Calm, encouraging tone.
 */

import { createElement, formatTime } from '../utils.js';
import { endSession, getSession }    from '../session.js';

export async function render(container) {
    container.innerHTML = '';
    container.className = 'screen screen--center container';

    const session = getSession();
    let record = null;

    // End and persist the session
    if (session.active) {
        record = await endSession();
    }

    const results    = record?.results || session.results || [];
    const minutes    = record?.minutesPracticed || 0;
    const exercises  = record?.exercisesCompleted || results.length;

    const independent = results.filter(r => r.report === 'independent').length;
    const cue         = results.filter(r => r.report === 'cue').length;
    const unable      = results.filter(r => r.report === 'unable').length;

    /* ── Layout ──────────────────────────────────────── */

    // Celebration
    const emoji = createElement('div', { style: { fontSize: '4rem', marginBottom: 'var(--sp-4)' } }, '🎉');
    const title = createElement('h1', { style: { marginBottom: 'var(--sp-2)' } }, 'Well done!');
    const sub   = createElement('p', { className: 'text-secondary text-lg' },
        "You've completed today's practice.");

    // Stats
    const statsRow = createElement('div', {
        className: 'flex-row gap-6 mt-8 mb-8',
        style: { justifyContent: 'center' },
    }, [
        stat(String(exercises), 'Exercises'),
        stat(formatTime(minutes), 'Time'),
    ]);

    // Breakdown
    const breakdown = createElement('div', {
        className: 'flex-col gap-3 w-full', style: { maxWidth: '320px' },
    }, [
        breakdownRow('✓', 'Said independently', independent, 'var(--accent-green)'),
        breakdownRow('↻', 'Needed help', cue, 'var(--accent-amber)'),
        breakdownRow('→', 'To practice more', unable, 'var(--accent-rose)'),
    ]);

    // Encouragement
    const msg = createElement('p', {
        className: 'text-secondary mt-6',
        style: { fontStyle: 'italic', maxWidth: '300px', textAlign: 'center' },
    }, 'Every practice session builds new connections. Keep going!');

    // Home button
    const homeBtn = createElement('button', {
        className: 'btn btn--primary-lg mt-8',
        style: { maxWidth: '320px' },
        onClick: () => { window.location.hash = 'home'; },
    }, '🏠  Back to Home');

    container.append(emoji, title, sub, statsRow, breakdown, msg, homeBtn);
}

function stat(value, label) {
    return createElement('div', { className: 'stat' }, [
        createElement('div', { className: 'stat__value' }, value),
        createElement('div', { className: 'stat__label' }, label),
    ]);
}

function breakdownRow(icon, label, count, color) {
    return createElement('div', {
        className: 'flex-row items-center gap-3',
        style: { padding: 'var(--sp-3) var(--sp-4)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' },
    }, [
        createElement('span', { style: { fontSize: 'var(--fs-lg)', color, width: '28px', textAlign: 'center' } }, icon),
        createElement('span', { className: 'flex-1 fw-medium' }, label),
        createElement('span', { className: 'fw-bold', style: { color } }, String(count)),
    ]);
}
