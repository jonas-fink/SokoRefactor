import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { api } from '../utils/api';

interface ChatReply {
    text: string;
    matches: { id: string; title: string; category: string }[];
    handoff: { label: string; hint: string };
    disclaimer: string | null;
}

interface ChatModalProps {
    open: boolean;
    onClose: () => void;
}

// Die Einwilligung wird pro Gerät einmal eingeholt. localStorage reicht: der
// Chat läuft ohne Konto, ein serverseitiges Consent-Log bräuchte genau die
// Zuordnung zur Person, die wir hier vermeiden.
const CONSENT_KEY = 'soko:chat-consent';

// ponytail: natives <dialog> statt Overlay-Eigenbau — Fokusfalle, Backdrop und
// Esc kommen vom Browser.
const ChatModal = ({ open, onClose }: ChatModalProps) => {
    const ref = useRef<HTMLDialogElement>(null);
    const [message, setMessage] = useState('');
    const [reply, setReply] = useState<ChatReply | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [consented, setConsented] = useState(
        () => localStorage.getItem(CONSENT_KEY) === 'ja',
    );

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

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        setLoading(true);
        setError('');
        try {
            setReply(await api.post<ChatReply>('/chat', { message }));
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
            className="m-auto w-[min(32rem,92vw)] rounded-card border border-line bg-surface p-6 text-ink shadow-modal backdrop:bg-black/40"
        >
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl">Wobei brauchst du Hilfe?</h2>
                    <p className="text-sm text-ink-mute">
                        Beschreib deine Situation in eigenen Worten.
                    </p>
                </div>
                <button
                    type="button"
                    className="label"
                    onClick={onClose}
                    aria-label="Schließen"
                >
                    ✕
                </button>
            </div>

            {!consented ? (
                /* Einwilligung vor der ersten Nachricht — ohne sie geht kein
                   Text an Google (Art. 6 Abs. 1 lit. a DSGVO). */
                <div className="flex flex-col gap-3">
                    <p className="text-ink-soft">
                        Für den Vorschlag wird dein Text an{' '}
                        <strong>Google Gemini</strong> übermittelt und dort auch
                        außerhalb der EU verarbeitet. Wir speichern ihn nicht.
                    </p>
                    <p className="text-ink-soft">
                        Bitte schreib deshalb{' '}
                        <strong>
                            keine Namen, Adressen oder Aktenzeichen
                        </strong>{' '}
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
                <form onSubmit={send} className="flex flex-col gap-3">
                    <textarea
                        className="field min-h-24 w-full"
                        maxLength={500}
                        placeholder="z. B. Ich habe Schulden und weiß nicht weiter"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="btn-primary cursor-pointer disabled:opacity-50"
                        disabled={loading || !message.trim()}
                    >
                        {loading ? 'Suche…' : 'Passende Hilfe finden'}
                    </button>
                    <p className="text-xs text-ink-mute">
                        Geht an Google Gemini — bitte keine Namen oder
                        Aktenzeichen.{' '}
                        <NavLink
                            to="/datenschutz"
                            className="underline"
                            onClick={onClose}
                        >
                            Datenschutz
                        </NavLink>
                    </p>
                </form>
            )}

            {error && <p className="mt-4 text-sm text-error">{error}</p>}

            {reply && !loading && (
                <div className="mt-5 flex flex-col gap-3">
                    <p>{reply.text}</p>

                    {reply.matches.map((m) => (
                        <NavLink
                            key={m.id}
                            to={`/beratung/detail/${m.id}`}
                            className="card block p-3 hover:-translate-y-0.5"
                            onClick={onClose}
                        >
                            <span className="font-semibold">{m.title}</span>
                        </NavLink>
                    ))}

                    {reply.disclaimer && (
                        <p className="rounded-control bg-surface-2 p-3 text-sm text-ink-soft">
                            {reply.disclaimer}
                        </p>
                    )}

                    {/* Pflichtfeld aus der API — der menschliche Ausweg steht immer. */}
                    <NavLink
                        to="/beratung"
                        className="btn-secondary cursor-pointer"
                        onClick={onClose}
                    >
                        {reply.handoff.label}
                    </NavLink>
                    <p className="text-sm text-ink-mute">{reply.handoff.hint}</p>
                </div>
            )}
        </dialog>
    );
};

export default ChatModal;
