import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { AiOutlineAudio, AiOutlineAudioMuted } from 'react-icons/ai';
import { api } from '../utils/api';
import { useAuth } from '../context/auth-context';
import { useVoiceInput } from '../hooks/useVoiceInput';
import type { ChatReply, ChatTurn as Turn } from '../types';

interface ChatModalProps {
    open: boolean;
    onClose: () => void;
}

// Die Einwilligung wird pro Gerät einmal eingeholt. localStorage reicht: der
// Chat läuft ohne Konto, ein serverseitiges Consent-Log bräuchte genau die
// Zuordnung zur Person, die wir hier vermeiden.
const CONSENT_KEY = 'soko:chat-consent';

const ChatModal = ({ open, onClose }: ChatModalProps) => {
    const { user } = useAuth();
    const ref = useRef<HTMLDialogElement>(null);
    const threadRef = useRef<HTMLDivElement>(null);
    const [message, setMessage] = useState('');
    const [turns, setTurns] = useState<Turn[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [consented, setConsented] = useState(
        () => localStorage.getItem(CONSENT_KEY) === 'ja',
    );
    // Von der Spracheingabe erkannt — sorgt dafuer, dass die Antwort in
    // derselben Sprache kommt. Beim Tippen bleibt es leer.
    const [lang, setLang] = useState('');

    const voice = useVoiceInput((text, detected) => {
        setMessage((m) => (m ? `${m} ${text}` : text));
        setLang(detected);
    });

    // Der Handoff ist serverseitig konstant — einmal unten anheften statt in
    // jeder Bubble wiederholen. Der menschliche Ausweg steht damit dauerhaft da.
    const handoff = turns.findLast((t) => t.role === 'bot')?.reply.handoff;

    const consent = () => {
        localStorage.setItem(CONSENT_KEY, 'ja');
        setConsented(true);
    };

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    // Verlauf beim Öffnen nachladen — nur eingeloggt, nur serverseitig
    // gespeichert. Gäste starten jedes Mal leer, das ist die Zusage.
    useEffect(() => {
        if (!open || !user) return;
        api.get<Turn[]>('/chat/history')
            .then(setTurns)
            .catch(() => {}); // Kein Verlauf ist kein Fehler, der Chat läuft.
    }, [open, user]);

    const clearHistory = async () => {
        setTurns([]);
        setError('');
        try {
            await api.delete('/chat/history');
        } catch {
            setError('Der Verlauf konnte nicht gelöscht werden.');
        }
    };

    // Neue Beiträge sollen sichtbar sein, ohne dass jemand scrollt.
    useEffect(() => {
        const thread = threadRef.current;
        if (thread) thread.scrollTop = thread.scrollHeight;
    }, [turns.length, loading]);

    const send = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const text = message.trim();
        if (!text || loading) return;

        // Verlauf für den Request: der Server ist zustandslos, den Kontext für
        // Rückfragen liefern wir mit — ohne den gerade getippten Beitrag.
        const history = turns.map((t) =>
            t.role === 'user'
                ? { role: 'user' as const, text: t.text }
                : { role: 'bot' as const, text: t.reply.text },
        );

        setTurns([...turns, { role: 'user', text }]);
        setMessage('');
        setLoading(true);
        setError('');
        try {
            const reply = await api.post<ChatReply>('/chat', {
                message: text,
                // Eingeloggt lädt der Server den Verlauf selbst und ignoriert
                // diesen hier — dann gar nicht erst schicken.
                history: user ? [] : history.slice(-10),
                ...(lang ? { lang } : {}),
            });
            setTurns((prev) => [...prev, { role: 'bot', reply }]);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Etwas ist schiefgelaufen',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            className={`m-auto hidden max-w-3xl flex-col overflow-hidden rounded-card border border-line bg-surface p-0 text-ink shadow-modal open:flex backdrop:bg-black/40 ${
                consented ? 'h-[min(85dvh,42rem)]' : 'max-h-[85dvh]'
            }`}
        >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line p-4">
                <div>
                    <h2 className="text-2xl">Wobei brauchst du Hilfe?</h2>
                    <p className="text-sm text-ink-mute">
                        Beschreib deine Situation in eigenen Worten.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    {/* Eingeloggt wird der Verlauf gespeichert — dann muss er
                        sich auch löschen lassen (Art. 17 DSGVO). */}
                    {user && turns.length > 0 && (
                        <button
                            type="button"
                            className="cursor-pointer text-sm text-ink-mute underline hover:text-error"
                            onClick={clearHistory}
                        >
                            Verlauf löschen
                        </button>
                    )}
                    <button
                        type="button"
                        className="label"
                        onClick={onClose}
                        aria-label="Schließen"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {!consented ? (
                /* Einwilligung vor der ersten Nachricht — ohne sie geht kein
                   Text an Google (Art. 6 Abs. 1 lit. a DSGVO). */
                <div className="flex flex-col gap-3 overflow-y-auto p-4">
                    <p className="text-ink-soft">
                        Für den Vorschlag wird dein Text an{' '}
                        <strong>Google Gemini</strong> übermittelt und dort auch
                        außerhalb der EU verarbeitet.{' '}
                        {user
                            ? 'Weil du eingeloggt bist, speichern wir den Verlauf zu deinem Konto — du kannst ihn jederzeit oben löschen, sonst verfällt er nach 90 Tagen.'
                            : 'Wir speichern ihn nicht.'}
                    </p>
                    <p className="text-ink-soft">
                        Du kannst auch <strong>sprechen</strong> statt tippen —
                        in deiner Sprache. Die Aufnahme geht dafür ebenfalls an
                        Google Gemini, wird dort in Text umgewandelt und bei uns
                        nicht gespeichert. Den Text siehst du vorher und kannst
                        ihn ändern.
                    </p>
                    <p className="text-ink-soft">
                        Bitte sag oder schreib deshalb{' '}
                        <strong>keine Namen, Adressen oder Aktenzeichen</strong>{' '}
                        — „Ich habe Mietschulden" reicht völlig.
                    </p>
                    <p className="text-sm text-ink-mute">
                        Lieber ohne? Alle Angebote findest du auch über{' '}
                        <NavLink
                            to="/beratung"
                            className="underline"
                            onClick={onClose}
                        >
                            Beratung &amp; Hilfe
                        </NavLink>
                        . Details:{' '}
                        <NavLink
                            to="/datenschutz"
                            className="underline"
                            onClick={onClose}
                        >
                            Datenschutz
                        </NavLink>
                        .
                    </p>
                    <button
                        type="button"
                        className="btn-primary cursor-pointer"
                        onClick={consent}
                    >
                        Verstanden, Chat starten
                    </button>
                </div>
            ) : (
                <>
                    <div
                        ref={threadRef}
                        className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 bg-surface"
                    >
                        {turns.length === 0 && (
                            <p className="text-sm text-ink-mute">
                                z. B. „Ich habe Schulden und weiß nicht weiter".
                                Du kannst danach jederzeit nachfragen.
                            </p>
                        )}

                        {turns.map((turn, i) =>
                            turn.role === 'user' ? (
                                <p
                                    key={i}
                                    className="ml-auto max-w-[85%] rounded-card bg-primary px-3.5 py-2.5 text-primary-ink"
                                >
                                    {turn.text}
                                </p>
                            ) : (
                                <div
                                    key={i}
                                    className="mr-auto flex max-w-[90%] flex-col gap-2 rounded-card bg-surface-2 px-3.5 py-2.5"
                                >
                                    {/* Vor dem Antworttext: in einer Notlage
                                        zaehlt die Nummer, nicht der Satz. */}
                                    {turn.reply.urgent?.map((h) => (
                                        <a
                                            key={h.number}
                                            href={`tel:${h.number.replace(/\s/g, '')}`}
                                            className="flex min-h-11 flex-col justify-center rounded-control border border-error px-3 py-2"
                                        >
                                            <span className="font-semibold">
                                                {h.label}: {h.number}
                                            </span>
                                            <span className="text-sm text-ink-soft">
                                                {h.hint}
                                            </span>
                                        </a>
                                    ))}

                                    <p>{turn.reply.text}</p>

                                    {turn.reply.matches.map((m) => (
                                        <NavLink
                                            key={`${m.itemType}:${m.id}`}
                                            to={
                                                m.itemType === 'Beratung'
                                                    ? `/beratung/detail/${m.id}`
                                                    : `/angebot/${m.itemType}/${m.id}`
                                            }
                                            className="card block p-3 hover:-translate-y-0.5"
                                            onClick={onClose}
                                        >
                                            <span className="font-semibold">
                                                {m.title}
                                            </span>
                                        </NavLink>
                                    ))}

                                    {turn.reply.disclaimer && (
                                        <p className="rounded-control bg-surface p-3 text-sm text-ink-soft">
                                            {turn.reply.disclaimer}
                                        </p>
                                    )}
                                </div>
                            ),
                        )}

                        {loading && (
                            <p className="mr-auto rounded-card bg-surface-2 px-3.5 py-2.5 text-ink-mute">
                                Suche…
                            </p>
                        )}
                    </div>

                    <div className="shrink-0 border-t border-line p-4">
                        {error && (
                            <p className="mb-2 text-sm text-error">{error}</p>
                        )}

                        {/* Pflichtfeld aus der API — der menschliche Ausweg steht immer. */}
                        {handoff && (
                            <div className="mb-3 flex flex-col gap-1">
                                <NavLink
                                    to="/beratung"
                                    className="btn-secondary cursor-pointer hover:border-accent-strong hover:text-accent-strong active:translate-y-1 transition-colors duration-300 ease-in"
                                    onClick={onClose}
                                >
                                    {handoff.label}
                                </NavLink>
                                <p className="text-xs text-ink-mute">
                                    {handoff.hint}
                                </p>
                            </div>
                        )}

                        <form onSubmit={send} className="flex items-end gap-2">
                            <textarea
                                className="field min-w-0 flex-1 resize-none"
                                rows={1}
                                maxLength={500}
                                // Ohne das laeuft ein arabisches oder farsi
                                // Transkript in der falschen Leserichtung.
                                dir="auto"
                                placeholder={
                                    turns.length
                                        ? 'Nachfragen…'
                                        : 'z. B. Ich habe Schulden...'
                                }
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    // Enter sendet, Shift+Enter macht eine Zeile.
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        e.currentTarget.form?.requestSubmit();
                                    }
                                }}
                            />
                            {/* Faellt weg, wo der Browser nicht aufnehmen kann. */}
                            {voice.supported && (
                                <button
                                    type="button"
                                    aria-label={
                                        voice.recording
                                            ? 'Aufnahme beenden'
                                            : 'Nachricht sprechen'
                                    }
                                    aria-pressed={voice.recording}
                                    disabled={voice.busy}
                                    onClick={
                                        voice.recording
                                            ? voice.stop
                                            : voice.start
                                    }
                                    className={`btn-secondary shrink-0 cursor-pointer disabled:opacity-50 ${
                                        voice.recording ? 'text-error' : ''
                                    }`}
                                >
                                    {voice.recording ? (
                                        <AiOutlineAudioMuted size={20} />
                                    ) : (
                                        <AiOutlineAudio size={20} />
                                    )}
                                </button>
                            )}
                            <button
                                type="submit"
                                className="btn-primary shrink-0 cursor-pointer disabled:opacity-50 hover:brightness-110 active:translate-y-1"
                                disabled={loading || !message.trim()}
                            >
                                Senden
                            </button>
                        </form>

                        {voice.recording && (
                            <p className="mt-2 text-xs text-ink-soft">
                                Aufnahme läuft — sprich, und tippe dann auf das
                                Symbol.
                            </p>
                        )}
                        {voice.busy && (
                            <p className="mt-2 text-xs text-ink-mute">
                                Wird in Text umgewandelt …
                            </p>
                        )}
                        {voice.error && (
                            <p className="text-error mt-2 text-xs">
                                {voice.error}
                            </p>
                        )}

                        <p className="mt-2 text-xs text-ink-mute">
                            Google Gemini hat Einblick in diese Daten — bitte
                            keine Namen oder Aktenzeichen.{' '}
                            <NavLink
                                to="/datenschutz"
                                className="underline"
                                onClick={onClose}
                            >
                                Datenschutz
                            </NavLink>
                        </p>
                    </div>
                </>
            )}
        </dialog>
    );
};

export default ChatModal;
