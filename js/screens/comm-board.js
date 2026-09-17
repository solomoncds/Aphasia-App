/**
 * Communication Board Screen
 *
 * NOT an exercise — a real-time communication aid.
 * Tap a card → device speaks the phrase instantly.
 * No scoring, no logging, always one tap from Home.
 *
 * CALL cards (Pheevami, Bivaphee, Weephee, Ndzinvaphee) play
 * pre-recorded audio blobs instead of TTS. If not yet recorded,
 * tapping opens an inline record flow.
 */

import { getAll, put }        from '../db.js';
import { speak, stopSpeaking } from '../speech.js';
import { playBlob, startRecording, stopRecording,
         isRecordingSupported, isRecording as checkRecording } from '../recorder.js';
import { createElement }       from '../utils.js';

export async function render(container) {
    container.innerHTML = '';

    const cards = await getAll('commBoard');
    cards.sort((a, b) => a.order - b.order);

    /* ── Header ──────────────────────────────────────── */
    const header = createElement('h1', { className: 'comm-board__title' }, 'Communication Board');

    /* ── Grid ────────────────────────────────────────── */
    const grid = createElement('div', { className: 'comm-board__grid' });
    let speakingEl = null;

    for (const card of cards) {
        grid.appendChild(buildCard(card));
    }

    container.append(header, grid);

    /* ── Build a single card element ─────────────────── */
    function buildCard(card) {
        const needsRec = card.useAudio && !card.audioBlob;

        const children = [
            createElement('span', { className: 'comm-card__emoji', 'aria-hidden': 'true' }, card.emoji),
            createElement('span', { className: 'comm-card__text' }, card.text),
        ];

        if (needsRec) {
            children.push(createElement('span', {
                style: { fontSize: '11px', color: 'var(--accent-rose)', marginTop: '4px' }
            }, '🔴 Tap to record'));
        }

        const el = createElement('button', {
            className: 'comm-card',
            'aria-label': card.text,
        }, children);

        el.addEventListener('click', async () => {
            if (needsRec) {
                showRecordModal(card, () => {
                    // Re-build card after recording saved
                    const fresh = buildCard(card);
                    el.replaceWith(fresh);
                });
                return;
            }

            // ── Speak ───────────────────────────────────
            if (speakingEl) speakingEl.classList.remove('comm-card--speaking');
            el.classList.add('comm-card--speaking');
            speakingEl = el;

            try {
                if (card.useAudio && card.audioBlob) {
                    await playBlob(card.audioBlob);
                } else {
                    await speak(card.text);
                }
            } catch (e) { console.warn('Comm card speech error:', e); }

            el.classList.remove('comm-card--speaking');
        });

        return el;
    }

    /* ── Record Modal (for CALL cards) ───────────────── */
    function showRecordModal(card, onSaved) {
        let blob = null;

        const overlay = createElement('div', { className: 'modal-overlay' });

        const recBtn   = createElement('button', { className: 'btn btn--primary w-full' },    '🎤  Start Recording');
        const playBtn  = createElement('button', { className: 'btn btn--secondary w-full hidden' }, '▶  Play Recording');
        const saveBtn  = createElement('button', { className: 'btn btn--primary w-full hidden' },    '💾  Save');
        const cancelBtn = createElement('button', { className: 'btn btn--ghost w-full' },     'Cancel');
        const status   = createElement('p', { className: 'text-center text-sm mt-2', style: { minHeight: '24px' } });

        recBtn.addEventListener('click', async () => {
            if (checkRecording()) {
                blob = await stopRecording();
                recBtn.textContent  = '🎤  Re-record';
                playBtn.classList.remove('hidden');
                saveBtn.classList.remove('hidden');
                status.textContent  = 'Recording saved. Tap Play to preview.';
            } else {
                try {
                    await startRecording();
                    recBtn.textContent  = '⏹  Stop Recording';
                    status.innerHTML    = '<span class="recording-indicator"><span class="recording-dot"></span> Recording…</span>';
                    playBtn.classList.add('hidden');
                    saveBtn.classList.add('hidden');
                } catch {
                    status.textContent = 'Could not access microphone.';
                }
            }
        });

        playBtn.addEventListener('click', async () => {
            if (!blob) return;
            playBtn.disabled = true;
            await playBlob(blob);
            playBtn.disabled = false;
        });

        saveBtn.addEventListener('click', async () => {
            if (!blob) return;
            card.audioBlob = blob;
            await put('commBoard', card);
            overlay.remove();
            onSaved();
        });

        cancelBtn.addEventListener('click', () => overlay.remove());

        const modal = createElement('div', { className: 'modal' }, [
            createElement('h3', { className: 'modal__title' }, 'Record Pronunciation'),
            createElement('p', { className: 'modal__body' },
                `Record how to say "${card.text}". A family member should speak this clearly.`),
            createElement('div', { className: 'flex-col gap-3 mt-4' }, [
                recBtn, status, playBtn, saveBtn, cancelBtn
            ]),
        ]);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    /* ── Cleanup ─────────────────────────────────────── */
    return () => stopSpeaking();
}
