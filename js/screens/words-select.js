/**
 * Words Selection Screen
 *
 * Modeled on Tactus Therapy's Words selection interface:
 * Allows user to filter practice by:
 *   1. Syllable tier (1, 2, 3, 4 syllables) — motor speech / apraxia hierarchy
 *   2. Theme / Category (Kitchen, Food, Bathroom, Bedroom, etc.)
 *   3. Quick practice across all nouns
 */

import { getAll } from '../db.js';
import { createElement } from '../utils.js';

export async function render(container) {
    container.innerHTML = '';
    container.className = 'screen container';

    const allWords = await getAll('words');
    const nouns = allWords.filter(w => w.category === 'noun');

    // Header
    const topBar = createElement('div', { className: 'flex-row justify-between align-center mb-4' }, [
        createElement('button', {
            className: 'btn btn--ghost',
            onClick: () => { window.location.hash = 'home'; },
        }, '← Home'),
        createElement('h1', { className: 'fw-bold', style: { fontSize: 'var(--fs-title)', color: 'var(--color-primary)' } }, 'Words Practice'),
        createElement('span', { style: { width: '60px' } }), // balance spacer
    ]);

    const intro = createElement('div', { className: 'text-center mb-6' }, [
        createElement('p', { className: 'text-secondary text-sm' },
            `${nouns.length} total words available · Select a syllable tier or topic`
        ),
        createElement('button', {
            className: 'btn btn--primary mt-3',
            style: { minWidth: '220px' },
            onClick: () => { window.location.hash = 'word-retrieval'; },
        }, '▶  Practice All Words (10 Mixed)'),
    ]);

    // Section 1: Syllable Tiers (Primary Axis)
    const syllableSection = createElement('div', { className: 'mb-6' }, [
        createElement('h2', {
            className: 'fw-bold mb-3',
            style: { fontSize: 'var(--fs-body)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
        }, 'Practice by Syllables'),
    ]);

    const syllableGrid = createElement('div', { className: 'flex-col gap-2' });

    const TIERS = [
        { count: 1, label: '1 Syllable', desc: 'Shortest words · e.g. cup, plate, bread, car, shoes', icon: '1️⃣' },
        { count: 2, label: '2 Syllables', desc: 'Moderate length · e.g. water, towel, table, window', icon: '2️⃣' },
        { count: 3, label: '3 Syllables', desc: 'Longer words · computer, medicine', icon: '3️⃣' },
        { count: 4, label: '4 Syllables', desc: 'Multi-syllable · television', icon: '4️⃣' },
    ];

    for (const tier of TIERS) {
        const matching = nouns.filter(w => w.syllableCount === tier.count);
        const card = createElement('div', {
            className: 'category-card card--interactive',
            role: 'button',
            tabIndex: 0,
            style: { padding: 'var(--sp-3) var(--sp-4)' },
            onClick: () => {
                window.location.hash = `word-retrieval?syllables=${tier.count}`;
            },
        }, [
            createElement('div', {
                className: 'category-card__icon',
                style: { background: 'var(--color-card-light)', color: 'var(--color-primary)', fontSize: '1.25rem' },
            }, tier.icon),
            createElement('div', { className: 'category-card__body' }, [
                createElement('div', { className: 'flex-row justify-between align-center' }, [
                    createElement('span', { className: 'fw-bold', style: { color: 'var(--color-primary)' } }, tier.label),
                    createElement('span', {
                        className: 'badge',
                        style: {
                            background: 'var(--color-card-light)',
                            color: 'var(--color-primary)',
                            fontSize: 'var(--fs-caption)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                        },
                    }, `${matching.length} words`),
                ]),
                createElement('div', { className: 'category-card__subtitle text-sm text-secondary' }, tier.desc),
            ]),
        ]);
        syllableGrid.appendChild(card);
    }
    syllableSection.appendChild(syllableGrid);

    // Section 2: Themes / Categories (Additive)
    const themeSection = createElement('div', { className: 'mb-8' }, [
        createElement('h2', {
            className: 'fw-bold mb-3',
            style: { fontSize: 'var(--fs-body)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
        }, 'Practice by Category'),
    ]);

    const THEMES = [
        { key: 'kitchen',    label: 'Kitchen',      icon: '🍳' },
        { key: 'food-drink', label: 'Food & Drink', icon: '🍎' },
        { key: 'bathroom',   label: 'Bathroom',     icon: '🧼' },
        { key: 'bedroom',    label: 'Bedroom',      icon: '🛏️' },
        { key: 'body',       label: 'Body Parts',   icon: '🖐️' },
        { key: 'clothing',   label: 'Clothing',     icon: '👕' },
        { key: 'transport',  label: 'Transport',    icon: '🚗' },
        { key: 'outdoors',   label: 'Outdoors',     icon: '🌳' },
        { key: 'household',  label: 'Household',    icon: '📦' },
        { key: 'technology', label: 'Technology',   icon: '📺' },
    ];

    const themeGrid = createElement('div', {
        className: 'grid',
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 'var(--sp-2)',
        },
    });

    for (const t of THEMES) {
        const count = nouns.filter(w => w.theme === t.key).length;
        const tile = createElement('div', {
            className: 'card card--interactive text-center',
            role: 'button',
            tabIndex: 0,
            style: {
                padding: 'var(--sp-3)',
                background: 'var(--color-white)',
                border: '1px solid var(--color-card)',
                borderRadius: 'var(--radius-sm)',
            },
            onClick: () => {
                window.location.hash = `word-retrieval?theme=${t.key}`;
            },
        }, [
            createElement('div', { style: { fontSize: '1.5rem', marginBottom: '4px' } }, t.icon),
            createElement('div', { className: 'fw-semibold text-sm', style: { color: 'var(--color-primary)' } }, t.label),
            createElement('div', { className: 'text-xs text-secondary' }, `${count} words`),
        ]);
        themeGrid.appendChild(tile);
    }
    themeSection.appendChild(themeGrid);

    container.append(topBar, intro, syllableSection, themeSection);
}
