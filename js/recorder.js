/**
 * MediaRecorder Wrapper
 *
 * Records audio via the user's microphone → Blob.
 * Blobs are stored directly in IndexedDB (customVocab, commBoard).
 * No audio is ever uploaded anywhere.
 */

let mediaRecorder = null;
let audioChunks = [];
let currentStream = null;

/* ========== Feature Detection ========== */

/** Check if recording is supported in this browser */
export function isRecordingSupported() {
    return 'MediaRecorder' in window && navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices;
}

/* ========== Recording ========== */

/**
 * Start recording audio from the microphone.
 * Requests permission if not already granted.
 * @returns {Promise<void>} — resolves once recording begins
 */
export async function startRecording() {
    if (!isRecordingSupported()) {
        throw new Error('Recording is not supported in this browser.');
    }

    audioChunks = [];

    currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(currentStream, {
        mimeType: getSupportedMimeType()
    });

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.start();
}

/**
 * Stop recording and return the audio as a Blob.
 * @returns {Promise<Blob>}
 */
export function stopRecording() {
    return new Promise((resolve, reject) => {
        if (!mediaRecorder || mediaRecorder.state !== 'recording') {
            reject(new Error('No recording in progress.'));
            return;
        }

        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: getSupportedMimeType() });
            audioChunks = [];
            releaseStream();
            resolve(blob);
        };

        mediaRecorder.stop();
    });
}

/**
 * Cancel an in-progress recording without saving.
 */
export function cancelRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.onstop = null;  // prevent resolve
        mediaRecorder.stop();
    }
    audioChunks = [];
    releaseStream();
}

/** Whether recording is currently active */
export function isRecording() {
    return mediaRecorder && mediaRecorder.state === 'recording';
}

/* ========== Playback ========== */

/**
 * Play an audio Blob.
 * @param {Blob} blob
 * @returns {Promise<void>}
 */
export function playBlob(blob) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audio.onended = () => {
            URL.revokeObjectURL(url);
            resolve();
        };

        audio.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(e);
        };

        audio.play().catch((err) => {
            URL.revokeObjectURL(url);
            reject(err);
        });
    });
}

/* ========== Internal ========== */

function releaseStream() {
    if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
    }
}

function getSupportedMimeType() {
    const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
    ];
    for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return 'audio/webm';           // fallback
}
