/**
 * Settings Screen
 *
 * Voice selection, speech rate, session length,
 * export/import backup (the entire "cloud" — one JSON file).
 */

import { getSettings, updateSetting, exportAllData, importAllData,
         clearStore, openDB, seedIfNeeded }          from '../db.js';
import { getAvailableVoices, setVoice, setRate, speak } from '../speech.js';
import { createElement }                              from '../utils.js';

export async function render(container) {
    container.innerHTML = '';

    const settings = await getSettings() || {};
    const voices   = await getAvailableVoices();

    container.appendChild(createElement('h1', { className: 'mb-6' }, '⚙️ Settings'));

    /* ── Voice ────────────────────────────────────────── */
    const voiceSection = section('Voice');

    const voiceSelect = createElement('select', {
        className: 'form-input form-select',
    });
    voiceSelect.appendChild(createElement('option', { value: '' }, 'Default voice'));
    for (const v of voices) {
        const opt = createElement('option', { value: v.voiceURI }, `${v.name} (${v.lang})`);
        if (v.voiceURI === settings.voiceURI) opt.selected = true;
        voiceSelect.appendChild(opt);
    }
    voiceSelect.addEventListener('change', async () => {
        const uri = voiceSelect.value;
        await updateSetting('voiceURI', uri || null);
        setVoice(uri);
    });

    const testBtn = createElement('button', {
        className: 'btn btn--ghost mt-2',
        onClick: () => speak('Hello, how are you today?'),
    }, '🔊  Test Voice');

    voiceSection.append(
        createElement('div', { className: 'form-group' }, [
            createElement('label', { className: 'form-label' }, 'Select Voice'),
            voiceSelect,
        ]),
        testBtn,
    );
    container.appendChild(voiceSection);

    /* ── Speech Rate ──────────────────────────────────── */
    const rateSection = section('Speech Rate');

    const rateValue = createElement('span', { className: 'fw-semibold' },
        String(settings.speechRate || 0.6));

    const rateSlider = createElement('input', {
        type: 'range', className: 'form-range', min: '0.4', max: '1.0', step: '0.1',
        value: String(settings.speechRate || 0.6),
    });
    rateSlider.addEventListener('input', () => {
        rateValue.textContent = rateSlider.value;
    });
    rateSlider.addEventListener('change', async () => {
        const val = parseFloat(rateSlider.value);
        await updateSetting('speechRate', val);
        setRate(val);
    });

    rateSection.append(
        createElement('div', { className: 'form-group' }, [
            createElement('div', { className: 'flex-between' }, [
                createElement('label', { className: 'form-label' }, 'Speed'),
                rateValue,
            ]),
            rateSlider,
            createElement('div', { className: 'flex-between text-sm text-secondary mt-1' }, [
                createElement('span', {}, 'Slower'),
                createElement('span', {}, 'Faster'),
            ]),
        ]),
    );
    container.appendChild(rateSection);

    /* ── Session Length ────────────────────────────────── */
    const lenSection = section('Session Length');

    const lenOptions = [15, 30, 45, 60];
    const lenSelect  = createElement('select', { className: 'form-input form-select' });
    for (const m of lenOptions) {
        const opt = createElement('option', { value: String(m) }, `${m} minutes`);
        if (m === (settings.sessionLengthMinutes || 30)) opt.selected = true;
        lenSelect.appendChild(opt);
    }
    lenSelect.addEventListener('change', async () => {
        await updateSetting('sessionLengthMinutes', parseInt(lenSelect.value));
    });

    lenSection.append(
        createElement('div', { className: 'form-group' }, [
            createElement('label', { className: 'form-label' }, 'Target Session Length'),
            lenSelect,
        ]),
    );
    container.appendChild(lenSection);

    /* ── Backup ───────────────────────────────────────── */
    const backupSection = section('Backup & Restore');

    // Export
    const exportBtn = createElement('button', {
        className: 'btn btn--secondary w-full',
    }, '📥  Export Backup');

    exportBtn.addEventListener('click', async () => {
        exportBtn.disabled    = true;
        exportBtn.textContent = 'Exporting…';

        try {
            const data = await exportAllData();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);

            const a = createElement('a', {
                href: url,
                download: `speech-practice-backup-${new Date().toISOString().slice(0, 10)}.json`,
            });
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            exportBtn.textContent = '✅  Downloaded!';
            setTimeout(() => { exportBtn.textContent = '📥  Export Backup'; exportBtn.disabled = false; }, 2000);
        } catch (e) {
            console.error('Export failed:', e);
            exportBtn.textContent = '❌  Export failed';
            exportBtn.disabled    = false;
        }
    });

    // Import
    const importBtn  = createElement('button', { className: 'btn btn--secondary w-full mt-3' }, '📤  Import Backup');
    const fileInput  = createElement('input', { type: 'file', accept: '.json', style: { display: 'none' } });

    importBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        if (!confirm('This will replace ALL current data. Are you sure?')) return;

        importBtn.disabled    = true;
        importBtn.textContent = 'Importing…';

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await importAllData(data);

            importBtn.textContent = '✅  Restored!';
            setTimeout(() => location.reload(), 1500);
        } catch (e) {
            console.error('Import failed:', e);
            importBtn.textContent = '❌  Import failed';
            importBtn.disabled    = false;
        }
    });

    backupSection.append(exportBtn, importBtn, fileInput);
    container.appendChild(backupSection);

    /* ── Danger Zone ──────────────────────────────────── */
    const dangerSection = createElement('div', { className: 'settings-screen__danger' });
    dangerSection.appendChild(createElement('h3', {
        className: 'progress-screen__section-title',
        style: { color: 'var(--accent-rose)' },
    }, '⚠️ Danger Zone'));

    const resetBtn = createElement('button', {
        className: 'btn btn--ghost w-full',
        style: { color: 'var(--accent-rose)' },
    }, '🗑  Reset All Data');

    resetBtn.addEventListener('click', async () => {
        if (!confirm('Delete ALL data? This cannot be undone.')) return;
        if (!confirm('Are you really sure? Export a backup first if needed.')) return;

        const stores = ['words', 'people', 'places', 'customVocab', 'sessions', 'settings', 'commBoard'];
        for (const s of stores) await clearStore(s);
        await seedIfNeeded();
        location.reload();
    });

    dangerSection.appendChild(resetBtn);
    container.appendChild(dangerSection);
}

function section(title) {
    const el = createElement('div', { className: 'settings-screen__section' });
    el.appendChild(createElement('h3', { className: 'settings-screen__section-title' }, title));
    return el;
}
