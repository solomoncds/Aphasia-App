/**
 * Web Speech API — Text-to-Speech Wrapper
 *
 * Uses SpeechSynthesisUtterance (built-in, free, offline).
 * Default rate 0.8 for clear pronunciation modeling.
 * No cloud TTS service — everything runs on-device.
 */

let selectedVoice = null;

/* ========== Voice Management ========== */

/**
 * Get all available English voices.
 * Handles Chrome's async voiceschanged quirk.
 * @returns {Promise<SpeechSynthesisVoice[]>}
 */
export function getAvailableVoices() {
    return new Promise((resolve) => {
        let voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(filterEnglish(voices));
            return;
        }
        // Chrome loads voices asynchronously
        const onReady = () => {
            voices = speechSynthesis.getVoices();
            speechSynthesis.removeEventListener('voiceschanged', onReady);
            resolve(filterEnglish(voices));
        };
        speechSynthesis.addEventListener('voiceschanged', onReady);
    });
}

function filterEnglish(voices) {
    return voices.filter(v => v.lang.startsWith('en'));
}

/**
 * Set the voice by its voiceURI string.
 * @param {string} voiceURI
 */
export function setVoice(voiceURI) {
    const voices = speechSynthesis.getVoices();
    selectedVoice = voices.find(v => v.voiceURI === voiceURI) || null;
}

/**
 * Get the currently selected voice URI (or null).
 */
export function getSelectedVoiceURI() {
    return selectedVoice ? selectedVoice.voiceURI : null;
}

let currentAudio = null;
const audioPathCache = new Map();

/**
 * Generate candidate file paths for pre-rendered YarnGPT2 audio.
 */
function getPreRenderedAudioCandidates(text) {
    const raw = text.toLowerCase().trim();
    const slug1 = raw.replace(/['’]/g, '_').replace(/[^a-z0-9_]/g, ' ').trim().replace(/\s+/g, '_');
    const slug2 = raw.replace(/['’]/g, '').replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, '_');

    const slugs = Array.from(new Set([slug1, slug2].filter(Boolean)));
    const candidates = [];

    for (const s of slugs) {
        candidates.push(`assets/audio/audio_core/noun_${s}.wav`);
        candidates.push(`assets/audio/audio_core/verb_${s}.wav`);
        candidates.push(`assets/audio/audio_core/phrase_${s}.wav`);
        candidates.push(`assets/audio/audio_core/pronoun_${s}_subject.wav`);
        candidates.push(`assets/audio/audio_core/pronoun_${s}_object.wav`);
        candidates.push(`assets/audio/audio_core/verb_${s}_example.wav`);
        candidates.push(`assets/audio/audio_core/sentence_level1_${s}.wav`);
        candidates.push(`assets/audio/audio_core/sentence_level2_${s}.wav`);
        candidates.push(`assets/audio/audio_core/sentence_level3_${s}.wav`);
        candidates.push(`assets/audio/audio_core/sentence_level4_${s}.wav`);
        candidates.push(`assets/audio/audio_numbers/number_${s}.wav`);
    }

    return candidates;
}

/**
 * Locate pre-rendered static audio file if one exists.
 */
async function findPreRenderedAudio(text) {
    const key = text.trim().toLowerCase();
    if (audioPathCache.has(key)) {
        return audioPathCache.get(key);
    }

    const candidates = getPreRenderedAudioCandidates(text);
    for (const url of candidates) {
        try {
            const res = await fetch(url, { method: 'HEAD' });
            if (res.ok) {
                audioPathCache.set(key, url);
                return url;
            }
        } catch {
            // Ignore fetch errors
        }
    }

    audioPathCache.set(key, null);
    return null;
}

/**
 * Play a static audio file with plain Audio element.
 */
function playAudioFile(url) {
    return new Promise((resolve, reject) => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }

        const audio = new Audio(url);
        currentAudio = audio;

        audio.onended = () => {
            currentAudio = null;
            resolve();
        };

        audio.onpause = () => {
            if (currentAudio === audio) {
                currentAudio = null;
            }
            resolve();
        };

        audio.onerror = (e) => {
            currentAudio = null;
            reject(e);
        };

        audio.play().catch((err) => {
            currentAudio = null;
            reject(err);
        });
    });
}

/* ========== Speech ========== */

/**
 * Speak text aloud.
 * Plays static pre-rendered YarnGPT2 audio first; falls back to live TTS.
 * @param {string} text   — The text to speak
 * @param {number} [rate] — Speech rate (0.1 – 2.0, default 0.8)
 * @returns {Promise<void>} — Resolves when audio/speech ends
 */
export async function speak(text, rate = 0.8) {
    stopSpeaking();

    // 1. Pre-rendered YarnGPT2 audio
    const preRenderedUrl = await findPreRenderedAudio(text);
    if (preRenderedUrl) {
        try {
            await playAudioFile(preRenderedUrl);
            return;
        } catch (e) {
            // Fall back to TTS on failure
        }
    }

    // 2. TTS fallback
    return new Promise((resolve, reject) => {
        if (!isSpeechSupported()) {
            resolve();
            return;
        }

        const utt = new SpeechSynthesisUtterance(text);
        utt.rate   = rate;
        utt.pitch  = 1;
        utt.volume = 1;

        if (selectedVoice) {
            utt.voice = selectedVoice;
        }

        utt.onend = () => resolve();
        utt.onerror = (e) => {
            if (e.error === 'canceled' || e.error === 'interrupted') {
                resolve();
            } else {
                reject(e);
            }
        };

        speechSynthesis.speak(utt);
    });
}

/**
 * Speak text directly via SpeechSynthesisUtterance (no audio file lookup).
 * Used for hints and prompt cues to play immediately at specified rate (default 0.8).
 * @param {string} text
 * @param {number} [rate=0.8]
 */
export function speakHint(text, rate = 0.8) {
    stopSpeaking();
    if (!isSpeechSupported() || !text) return;

    const utt = new SpeechSynthesisUtterance(text);
    utt.rate   = rate;
    utt.pitch  = 1;
    utt.volume = 1;

    if (selectedVoice) {
        utt.voice = selectedVoice;
    }

    speechSynthesis.speak(utt);
}

/**
 * Stop any ongoing speech or static audio immediately.
 */
export function stopSpeaking() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    if (isSpeechSupported()) {
        speechSynthesis.cancel();
    }
}

/**
 * Check whether speech synthesis is available.
 */
export function isSpeechSupported() {
    return 'speechSynthesis' in window;
}
