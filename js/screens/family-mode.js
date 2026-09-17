/**
 * Family Mode Screen
 *
 * Three tabs: People · Places · Custom Vocab
 *
 * People:  name, relationship, photo → stored in 'people' store
 * Places:  name, photo → stored in 'places' store
 * Custom Vocab: word, photo, optional recorded pronunciation → stored in 'customVocab' store
 *
 * Photos via <input type="file" accept="image/*"> → FileReader → data URL.
 * Audio via MediaRecorder → Blob → stored in IndexedDB.
 * Nothing is ever uploaded anywhere.
 */

import { getAll, put, remove }                                 from '../db.js';
import { startRecording, stopRecording, playBlob,
         isRecording as checkRecording, isRecordingSupported } from '../recorder.js';
import { createElement, generateId }                            from '../utils.js';

export async function render(container) {
    container.innerHTML = '';

    let activeTab = 'people';

    /* ── Header ──────────────────────────────────────── */
    container.appendChild(createElement('h1', { className: 'mb-4' }, '👨‍👩‍👧‍👦 Family Mode'));

    /* ── Tabs ────────────────────────────────────────── */
    const tabs = createElement('div', { className: 'tabs mb-6' });
    const tabDefs = [
        { key: 'people', label: '👤 People' },
        { key: 'places', label: '📍 Places' },
        { key: 'vocab',  label: '📝 Custom Vocab' },
    ];

    for (const t of tabDefs) {
        const btn = createElement('button', {
            className: `tab ${t.key === activeTab ? 'tab--active' : ''}`,
            dataset: { tab: t.key },
            onClick: () => switchTab(t.key),
        }, t.label);
        tabs.appendChild(btn);
    }
    container.appendChild(tabs);

    /* ── Content area ────────────────────────────────── */
    const content = createElement('div', { id: 'fm-content' });
    container.appendChild(content);

    function switchTab(key) {
        activeTab = key;
        tabs.querySelectorAll('.tab').forEach(t =>
            t.classList.toggle('tab--active', t.dataset.tab === key));
        renderTab();
    }

    async function renderTab() {
        const el = document.getElementById('fm-content');
        el.innerHTML = '';

        if (activeTab === 'people')  await renderPeopleTab(el);
        if (activeTab === 'places')  await renderPlacesTab(el);
        if (activeTab === 'vocab')   await renderVocabTab(el);
    }

    /* ──────────────────────────────────────────────────
       PEOPLE TAB
       ────────────────────────────────────────────────── */
    async function renderPeopleTab(el) {
        const people = await getAll('people');

        // Add button
        const addBtn = createElement('button', {
            className: 'btn btn--primary w-full mb-4',
            onClick: () => showAddForm(el, 'people'),
        }, '+ Add Person');
        el.appendChild(addBtn);

        // List
        if (people.length === 0) {
            el.appendChild(createElement('div', { className: 'empty-state' }, [
                createElement('div', { className: 'empty-state__icon' }, '👤'),
                createElement('p', { className: 'empty-state__text' },
                    'Add family members to personalize exercises with real photos.'),
            ]));
            return;
        }

        for (const p of people) {
            el.appendChild(listItem(
                p.photoDataUrl, p.name, p.relationship || '',
                () => removePerson(p.id),
            ));
        }
    }

    async function removePerson(id) {
        if (!confirm('Remove this person?')) return;
        await remove('people', id);
        renderTab();
    }

    /* ──────────────────────────────────────────────────
       PLACES TAB
       ────────────────────────────────────────────────── */
    async function renderPlacesTab(el) {
        const places = await getAll('places');

        const addBtn = createElement('button', {
            className: 'btn btn--primary w-full mb-4',
            onClick: () => showAddForm(el, 'places'),
        }, '+ Add Place');
        el.appendChild(addBtn);

        if (places.length === 0) {
            el.appendChild(createElement('div', { className: 'empty-state' }, [
                createElement('div', { className: 'empty-state__icon' }, '📍'),
                createElement('p', { className: 'empty-state__text' },
                    'Add meaningful places to use in exercises.'),
            ]));
            return;
        }

        for (const p of places) {
            el.appendChild(listItem(
                p.photoDataUrl, p.name, '',
                () => removePlace(p.id),
            ));
        }
    }

    async function removePlace(id) {
        if (!confirm('Remove this place?')) return;
        await remove('places', id);
        renderTab();
    }

    /* ──────────────────────────────────────────────────
       CUSTOM VOCAB TAB
       ────────────────────────────────────────────────── */
    async function renderVocabTab(el) {
        const vocab = await getAll('customVocab');

        const addBtn = createElement('button', {
            className: 'btn btn--primary w-full mb-4',
            onClick: () => showAddForm(el, 'vocab'),
        }, '+ Add Word');
        el.appendChild(addBtn);

        if (vocab.length === 0) {
            el.appendChild(createElement('div', { className: 'empty-state' }, [
                createElement('div', { className: 'empty-state__icon' }, '📝'),
                createElement('p', { className: 'empty-state__text' },
                    'Add custom words with photos and optional recorded pronunciations.'),
            ]));
            return;
        }

        for (const v of vocab) {
            const item = listItem(
                v.photoDataUrl, v.text, v.audioBlob ? '🎤 Has recording' : '',
                () => removeVocab(v.id),
            );
            // Play recording button if audio exists
            if (v.audioBlob) {
                const playBtn = createElement('button', {
                    className: 'btn btn--ghost', style: { fontSize: 'var(--fs-sm)', padding: 'var(--sp-2)' },
                    onClick: (e) => { e.stopPropagation(); playBlob(v.audioBlob); },
                }, '▶');
                item.querySelector('.list-item__body').appendChild(playBtn);
            }
            el.appendChild(item);
        }
    }

    async function removeVocab(id) {
        if (!confirm('Remove this word?')) return;
        await remove('customVocab', id);
        renderTab();
    }

    /* ──────────────────────────────────────────────────
       ADD FORM
       ────────────────────────────────────────────────── */
    function showAddForm(parent, type) {
        // Remove existing form if any
        const existing = document.getElementById('fm-add-form');
        if (existing) existing.remove();

        const form = createElement('div', {
            id: 'fm-add-form', className: 'family-mode__add-form',
        });

        const nameInput = createElement('input', {
            className: 'form-input',
            placeholder: type === 'people' ? 'Name' : type === 'places' ? 'Place name' : 'Word',
        });

        let relInput = null;
        if (type === 'people') {
            relInput = createElement('input', {
                className: 'form-input',
                placeholder: 'Relationship (e.g. Mother, Brother)',
            });
        }

        // Photo picker
        let photoDataUrl = null;
        const photoPreview = createElement('div', {
            className: 'photo-placeholder photo-placeholder--sm',
            id: 'fm-photo-preview',
        }, '📷');

        const fileInput = createElement('input', {
            type: 'file', accept: 'image/*', style: { display: 'none' },
        });
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                photoDataUrl = e.target.result;
                photoPreview.innerHTML = '';
                photoPreview.classList.remove('photo-placeholder');
                photoPreview.appendChild(createElement('img', {
                    src: photoDataUrl, className: 'photo-preview',
                    style: { maxWidth: '120px', borderRadius: 'var(--radius-md)' },
                }));
            };
            reader.readAsDataURL(file);
        });

        const photoBtn = createElement('button', {
            className: 'btn btn--secondary',
            onClick: () => fileInput.click(),
        }, '📷  Add Photo');

        // Audio recording (vocab only)
        let audioBlob = null;
        let audioSection = null;

        if (type === 'vocab' && isRecordingSupported()) {
            audioSection = createElement('div', { className: 'flex-col gap-2' });

            const recBtn = createElement('button', {
                className: 'btn btn--secondary',
            }, '🎤  Record Pronunciation');

            const recStatus = createElement('span', { className: 'text-sm text-secondary' });

            recBtn.addEventListener('click', async () => {
                if (checkRecording()) {
                    audioBlob = await stopRecording();
                    recBtn.textContent  = '🎤  Re-record';
                    recStatus.textContent = '✅ Recorded';
                } else {
                    await startRecording();
                    recBtn.textContent  = '⏹  Stop';
                    recStatus.innerHTML = '<span class="recording-indicator"><span class="recording-dot"></span> Recording…</span>';
                }
            });

            audioSection.append(recBtn, recStatus);
        }

        // Save
        const saveBtn = createElement('button', {
            className: 'btn btn--primary w-full',
        }, '💾  Save');

        saveBtn.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            if (!name) { nameInput.focus(); return; }

            const genId = generateId;

            if (type === 'people') {
                await put('people', {
                    id: genId(),
                    name,
                    relationship: relInput?.value.trim() || '',
                    photoDataUrl,
                });
            } else if (type === 'places') {
                await put('places', {
                    id: genId(),
                    name,
                    photoDataUrl,
                });
            } else {
                await put('customVocab', {
                    id: genId(),
                    text: name,
                    photoDataUrl,
                    audioBlob: audioBlob || null,
                });
            }

            form.remove();
            renderTab();
        });

        const cancelBtn = createElement('button', {
            className: 'btn btn--ghost w-full',
            onClick: () => form.remove(),
        }, 'Cancel');

        form.append(nameInput);
        if (relInput) form.appendChild(relInput);
        form.append(photoPreview, fileInput, photoBtn);
        if (audioSection) form.appendChild(audioSection);
        form.append(saveBtn, cancelBtn);

        parent.insertBefore(form, parent.children[1]); // after the Add button
    }

    /* ──────────────────────────────────────────────────
       LIST ITEM HELPER
       ────────────────────────────────────────────────── */
    function listItem(photo, title, subtitle, onDelete) {
        const avatar = photo
            ? createElement('img', { src: photo, className: 'list-item__avatar' })
            : createElement('div', { className: 'list-item__avatar' }, '👤');

        const deleteBtn = createElement('button', {
            className: 'btn btn--ghost', style: { color: 'var(--accent-rose)', padding: 'var(--sp-2)' },
            onClick: onDelete,
        }, '✕');

        return createElement('div', { className: 'list-item' }, [
            avatar,
            createElement('div', { className: 'list-item__body' }, [
                createElement('div', { className: 'list-item__title' }, title),
                subtitle ? createElement('div', { className: 'list-item__subtitle' }, subtitle) : null,
            ].filter(Boolean)),
            createElement('div', { className: 'list-item__action' }, [deleteBtn]),
        ]);
    }

    // Initial render
    renderTab();
}
