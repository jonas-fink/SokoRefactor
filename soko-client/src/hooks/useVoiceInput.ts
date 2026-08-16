import { useRef, useState } from 'react';
import { api } from '../utils/api';

/**
 * Was `MediaRecorder` je nach Browser überhaupt kann: Chrome/Firefox `webm`,
 * Safari `mp4`. Das Backend übersetzt die Container-Namen anschließend in die,
 * die Gemini akzeptiert (`services/gemini.ts`).
 */
const MIME_CANDIDATES = ['audio/webm', 'audio/mp4', 'audio/ogg'];

const pickMime = () =>
    MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));

/**
 * Sprachaufnahme für den Chat. Das Transkript geht **ins Eingabefeld**, nicht
 * direkt an den Chat: wer nicht gut schreibt, muss trotzdem prüfen können, ob
 * richtig verstanden wurde. Automatisch senden würde genau diese Kontrolle
 * nehmen.
 */
export const useVoiceInput = (
    onResult: (text: string, lang: string) => void,
) => {
    const [recording, setRecording] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const recorderRef = useRef<MediaRecorder | null>(null);

    const supported =
        typeof MediaRecorder !== 'undefined' &&
        !!navigator.mediaDevices?.getUserMedia;

    const start = async () => {
        setError('');
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            // Verweigert, kein Mikrofon, oder kein sicherer Kontext — in jedem
            // Fall ein Klartexthinweis statt eines stillen Abbruchs.
            setError('Kein Zugriff aufs Mikrofon.');
            return;
        }

        const mimeType = pickMime();
        const recorder = new MediaRecorder(
            stream,
            mimeType ? { mimeType } : undefined,
        );
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size) chunks.push(e.data);
        };

        recorder.onstop = async () => {
            // Ohne das bleibt die Aufnahmeanzeige des Browsers an.
            stream.getTracks().forEach((t) => t.stop());
            setRecording(false);
            const blob = new Blob(chunks, { type: recorder.mimeType });
            if (!blob.size) return;

            setBusy(true);
            const form = new FormData();
            form.append('audio', blob, 'aufnahme');
            try {
                const result = await api.upload<{ text: string; lang: string }>(
                    '/chat/transcribe',
                    form,
                );
                onResult(result.text, result.lang);
            } catch (e) {
                setError(
                    e instanceof Error
                        ? e.message
                        : 'Spracheingabe gerade nicht verfügbar',
                );
            } finally {
                setBusy(false);
            }
        };

        recorderRef.current = recorder;
        recorder.start();
        setRecording(true);
    };

    const stop = () => recorderRef.current?.stop();

    return { supported, recording, busy, error, start, stop };
};
