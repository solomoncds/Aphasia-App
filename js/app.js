/**
 * App — Main Entry Point
 *
 * Hash-based SPA router, screen lifecycle, global initialization.
 * Opens IndexedDB → seeds if first run → renders Home screen.
 */

import { openDB, seedIfNeeded, getAll, getSettings }  from './db.js';
import { setVoice, getAvailableVoices, setRate }       from './speech.js';
import { createElement, render as renderInto,
         getGreeting, getTodayKey, formatTime,
         getTodayTheme }                              from './utils.js';
import { startSession, getSession }                   from './session.js';

/* ================================================================
   GLOBALS
   ================================================================ */

const appEl = document.getElementById('app');
let currentCleanup = null;

/* ================================================================
   ROUTER — dynamic imports for real screens, inline Home
   ================================================================ */

async function loadScreen(route) {
    switch (route) {
        case '':
        case 'home':            return { render: renderHome };
        case 'session-setup':   return await import('./screens/session-setup.js');
        case 'words-select':    return await import('./screens/words-select.js');
        case 'word-retrieval':  return await import('./screens/word-retrieval.js');
        case 'sequences':       return await import('./screens/sequences.js');
        case 'pronunciation':   return await import('./screens/pronunciation.js');
        case 'sentence-builder':return await import('./screens/sentence-builder.js');
        case 'pronoun-nouns':   return await import('./screens/pronoun-nouns.js');
        case 'verbs-pronouns':  return await import('./screens/verbs-pronouns.js');
        case 'conversation':    return await import('./screens/conversation.js');
        case 'comm-board':      return await import('./screens/comm-board.js');
        case 'session-complete':return await import('./screens/session-complete.js');
        case 'family-mode':     return await import('./screens/family-mode.js');
        case 'progress':        return await import('./screens/progress.js');
        case 'settings':        return await import('./screens/settings.js');
        default:                return { render: renderHome };
    }
}

function getRoute() {
    return window.location.hash.replace('#', '').split('?')[0] || 'home';
}

function navigate(route) {
    window.location.hash = route;
}

async function handleRoute() {
    if (currentCleanup) { currentCleanup(); currentCleanup = null; }

    const route  = getRoute();
    const mod    = await loadScreen(route);

    appEl.innerHTML = '';

    // Nav bar (hidden during exercises and session-complete)
    const exerciseRoutes = ['word-retrieval', 'words-select', 'sequences', 'pronunciation', 'sentence-builder',
                            'pronoun-nouns', 'verbs-pronouns', 'conversation', 'session-complete', 'session-setup'];
    if (!exerciseRoutes.includes(route)) {
        appEl.appendChild(createNavBar(route));
    }

    const screenEl = createElement('main', { className: 'screen container' });
    appEl.appendChild(screenEl);

    if (mod && typeof mod.render === 'function') {
        const cleanup = await mod.render(screenEl);
        if (typeof cleanup === 'function') currentCleanup = cleanup;
    }
}

/* ================================================================
   NAV BAR
   ================================================================ */

function createNavBar(activeRoute) {
    const items = [
        { route: 'home',       icon: '🏠', label: 'Home' },
        { route: 'comm-board', icon: '📢', label: 'Speak' },
        { route: 'progress',   icon: '📊', label: 'Progress' },
        { route: 'family-mode',icon: '👨‍👩‍👧', label: 'Family' },
        { route: 'settings',   icon: '⚙️', label: 'Settings' },
    ];

    const nav = createElement('nav', { className: 'nav', role: 'navigation', 'aria-label': 'Main' });

    for (const item of items) {
        const active = activeRoute === item.route;
        const btn = createElement('button', {
            className: `nav__item ${active ? 'nav__item--active' : ''}`,
            'aria-label': item.label,
            onClick: () => navigate(item.route),
        }, [
            createElement('span', { className: 'nav__icon', 'aria-hidden': 'true' }, item.icon),
            createElement('span', {}, item.label),
        ]);
        nav.appendChild(btn);
    }

    return nav;
}

/* ================================================================
   PWA INSTALLATION
   ================================================================ */

window.deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-installable'));
});

window.addEventListener('appinstalled', () => {
    window.deferredInstallPrompt = null;
    localStorage.setItem('pwa-installed', 'true');
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
});

export function isPWAInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true
        || localStorage.getItem('pwa-installed') === 'true';
}

export function isPWADismissed() {
    return sessionStorage.getItem('pwa-install-dismissed') === 'true';
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function createInstallBanner() {
    if (isPWAInstalled() || isPWADismissed()) return null;

    const banner = createElement('div', {
        className: 'install-banner',
        id: 'pwa-install-banner',
        role: 'region',
        'aria-label': 'Install app notice',
    });

    const icon = createElement('div', { className: 'install-banner__icon', 'aria-hidden': 'true' }, '📲');

    if (isIOS()) {
        const body = createElement('div', { className: 'install-banner__body' }, [
            createElement('div', { className: 'install-banner__title' }, 'Install Speech Practice'),
            createElement('div', { className: 'install-banner__desc' }, 'Tap Share (⎋) below then "Add to Home Screen" ➕ for full offline access.'),
        ]);

        const closeBtn = createElement('button', {
            className: 'install-banner__close',
            'aria-label': 'Dismiss install notice',
            onClick: () => {
                sessionStorage.setItem('pwa-install-dismissed', 'true');
                banner.remove();
            },
        }, '✕');

        banner.append(icon, body, closeBtn);
        return banner;
    }

    const body = createElement('div', { className: 'install-banner__body' }, [
        createElement('div', { className: 'install-banner__title' }, 'Install Speech Practice'),
        createElement('div', { className: 'install-banner__desc' }, 'Add to home screen for faster, one-tap offline practice.'),
    ]);

    const installBtn = createElement('button', {
        className: 'btn btn--primary install-banner__btn',
        id: 'pwa-install-action-btn',
        onClick: async () => {
            if (window.deferredInstallPrompt) {
                window.deferredInstallPrompt.prompt();
                const { outcome } = await window.deferredInstallPrompt.userChoice;
                if (outcome === 'accepted') {
                    localStorage.setItem('pwa-installed', 'true');
                }
                window.deferredInstallPrompt = null;
                banner.remove();
            } else {
                alert('To install, tap your browser menu (⋮) and select "Install app" or "Add to Home screen".');
            }
        },
    }, 'Install App');

    const closeBtn = createElement('button', {
        className: 'install-banner__close',
        'aria-label': 'Dismiss install notice',
        onClick: () => {
            sessionStorage.setItem('pwa-install-dismissed', 'true');
            banner.remove();
        },
    }, '✕');

    const actions = createElement('div', { className: 'install-banner__actions' }, [installBtn, closeBtn]);
    banner.append(icon, body, actions);
    return banner;
}

// Dynamically display banner if beforeinstallprompt fires after Home is already rendered
window.addEventListener('pwa-installable', () => {
    if (getRoute() === '' || getRoute() === 'home') {
        if (!document.getElementById('pwa-install-banner') && !isPWAInstalled() && !isPWADismissed()) {
            const banner = createInstallBanner();
            if (banner) {
                const homeEl = document.querySelector('.screen');
                if (homeEl) homeEl.prepend(banner);
            }
        }
    }
});

/* ================================================================
   HOME SCREEN
   ================================================================ */

async function renderHome(container) {
    const greeting = getGreeting();
    const todayKey = getTodayKey();

    const allSessions = await getAll('sessions');
    const todaySessions = allSessions.filter(s => s.date === todayKey);
    const exercisesDone = todaySessions.reduce((sum, s) => sum + (s.exercisesCompleted || 0), 0);
    const minutesDone   = todaySessions.reduce((sum, s) => sum + (s.minutesPracticed || 0), 0);

    const allWords   = await getAll('words');
    const nonNumbers = allWords.filter(w => w.category !== 'number');
    const mastered   = nonNumbers.filter(w => w.status === 'independent').length;
    const improving  = nonNumbers.filter(w => w.status === 'cue' || w.status === 'model').length;
    const toPractice = nonNumbers.length - mastered - improving;

    /* ── Install Banner ───────────────────────────────── */
    const installBanner = createInstallBanner();
    if (installBanner) {
        container.appendChild(installBanner);
    }

    /* ── Today's Theme ────────────────────────────────── */
    const todayTheme = getTodayTheme(allSessions.length);

    /* ── Greeting ─────────────────────────────────────── */
    const greetingEl = createElement('h1', { className: 'home__greeting' }, `${greeting} 👋`);
    const subtitleEl = createElement('p',  { className: 'home__subtitle' }, 'Ready for today\'s practice?');

    /* ── Focus Pill ───────────────────────────────────── */
    const focusPill = createElement('div', { className: 'home__focus-pill', id: 'today-focus-pill' }, [
        createElement('span', { className: 'home__focus-pill__emoji', 'aria-hidden': 'true' }, todayTheme.emoji),
        createElement('span', {}, `Today's focus: `),
        createElement('strong', {}, todayTheme.label),
    ]);

    /* ── Start Session ────────────────────────────────── */
    const startBtn = createElement('button', {
        className: 'btn btn--primary-lg home__session-btn',
        id: 'start-session-btn',
        onClick: async () => {
            startBtn.disabled    = true;
            startBtn.textContent = 'Preparing…';
            try {
                await startSession(['words', 'sentences', 'pronoun-nouns', 'sentences-visual']);
                const s = getSession();
                if (s.queue.length > 0) {
                    navigate(s.queue[0].type);
                } else {
                    startBtn.disabled    = false;
                    startBtn.textContent = '▶  Start Today\'s Session';
                }
            } catch (err) {
                console.error('Failed to auto-start session:', err);
                startBtn.disabled    = false;
                startBtn.textContent = '▶  Start Today\'s Session';
            }
        },
    }, '▶  Start Today\'s Session');

    /* ── Progress line ────────────────────────────────── */
    const progressLine = createElement('div', { className: 'home__progress-line' }, [
        createElement('span', {},
            `${exercisesDone} exercise${exercisesDone !== 1 ? 's' : ''} · ${minutesDone} min today`),
    ]);

    /* ── Categories ───────────────────────────────────── */
    const sectionTitle = createElement('h2', { className: 'home__section-title' }, 'Practice Categories');

    const cats = [
        { route: 'words-select',      icon: '🗣️', bg: 'var(--color-card-light)',   title: 'Words',            sub: `${mastered} mastered · Practice by syllables or topic` },
        { route: 'sequences',         icon: '🔢', bg: 'var(--color-card-light)',   title: 'Sequences',        sub: 'Days, months, alphabet & prayer' },
        { route: 'pronunciation',     icon: '🔊', bg: 'var(--color-card-light)',   title: 'Pronunciation',    sub: 'Listen and repeat drills' },
        { route: 'sentence-builder',  icon: '🧩', bg: 'var(--color-card-light)',   title: 'Sentences',        sub: 'Build sentences from words' },
        { route: 'verbs-pronouns',    icon: '🏃', bg: 'var(--color-card-light)',   title: 'Verbs & Pronouns', sub: 'Action words and subjects' },
        { route: 'conversation',      icon: '💬', bg: 'var(--color-card-light)',   title: 'Conversation',     sub: 'Open-ended practice' },
        { route: 'session-setup',     icon: '⚙️', bg: 'var(--color-card-light)',   title: 'Custom Session',   sub: 'Choose specific exercise categories' },
    ];

    const catGrid = createElement('div', { className: 'home__categories' });
    for (const c of cats) {
        catGrid.appendChild(createElement('div', {
            className: 'category-card card--interactive',
            role: 'button', tabindex: '0',
            onClick: () => navigate(c.route),
        }, [
            createElement('div', { className: 'category-card__icon', style: { background: c.bg } }, c.icon),
            createElement('div', { className: 'category-card__body' }, [
                createElement('div', { className: 'category-card__title' }, c.title),
                createElement('div', { className: 'category-card__subtitle' }, c.sub),
            ]),
        ]));
    }

    /* ── Comm Board button ────────────────────────────── */
    const commBtn = createElement('button', {
        className: 'btn btn--secondary w-full home__comm-btn',
        id: 'comm-board-btn',
        onClick: () => navigate('comm-board'),
    }, '📢  Communication Board');

    /* ── Quick Stats ──────────────────────────────────── */
    const statsTitle = createElement('h2', { className: 'home__section-title mt-8' }, 'Quick Stats');
    const statsRow   = createElement('div', { className: 'flex-row gap-4', style: { justifyContent: 'center' } }, [
        mkStat(String(mastered),   'Mastered'),
        mkStat(String(improving),  'Improving'),
        mkStat(String(toPractice), 'To Practice'),
    ]);

    container.append(greetingEl, subtitleEl, focusPill, startBtn, progressLine,
                     sectionTitle, catGrid, commBtn, statsTitle, statsRow);
}

function mkStat(value, label) {
    return createElement('div', { className: 'stat' }, [
        createElement('div', { className: 'stat__value' }, value),
        createElement('div', { className: 'stat__label' }, label),
    ]);
}

/* ================================================================
   PLACEHOLDER (for Phase 5 screens not yet built)
   ================================================================ */

function renderPlaceholder(title, emoji, desc) {
    return async (container) => {
        container.className = 'screen screen--center container';
        container.append(
            createElement('div', { style: { fontSize: '4rem', marginBottom: '1rem' } }, emoji),
            createElement('h1',  { style: { marginBottom: '0.5rem' } }, title),
            createElement('p',   { className: 'text-secondary', style: { maxWidth: '320px', textAlign: 'center' } }, desc),
            createElement('div', { className: 'badge badge--amber mt-6' }, 'Coming Soon'),
            createElement('button', { className: 'btn btn--ghost mt-4', onClick: () => navigate('home') }, '← Back to Home'),
        );
    };
}

/* ================================================================
   INITIALIZATION
   ================================================================ */

async function init() {
    appEl.innerHTML = '';
    appEl.appendChild(createElement('div', { className: 'loading' }, [
        createElement('div', { className: 'spinner' }),
        createElement('p', {}, 'Preparing your practice…'),
    ]));

    try {
        await openDB();
        await seedIfNeeded();

        const settings = await getSettings();
        if (settings?.speechRate) {
            setRate(settings.speechRate);
        }
        if (settings?.voiceURI) {
            await getAvailableVoices();
            setVoice(settings.voiceURI);
        }

        window.addEventListener('hashchange', handleRoute);
        await handleRoute();

    } catch (err) {
        console.error('[app] Init failed:', err);
        appEl.innerHTML = '';
        appEl.appendChild(createElement('div', { className: 'screen screen--center container' }, [
            createElement('div', { style: { fontSize: '3rem' } }, '⚠️'),
            createElement('h2',  { style: { margin: '1rem 0 0.5rem' } }, 'Something went wrong'),
            createElement('p',   { className: 'text-secondary' }, err.message || 'Could not initialize.'),
            createElement('button', { className: 'btn btn--primary mt-6', onClick: () => location.reload() }, 'Try Again'),
        ]));
    }
}

init();

// ── Register Service Worker ──────────────────────────────
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('[sw] Registered:', reg.scope))
            .catch(err => console.warn('[sw] Registration failed:', err));
    });
}
