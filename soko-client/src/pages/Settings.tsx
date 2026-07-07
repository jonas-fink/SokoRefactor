import { useState } from 'react';
import { useAuth } from '../context/auth-context';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { useNavigate } from 'react-router';

const SettingsPage = () => {
    const { user, becomeCreator } = useAuth();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const onBecomeCreator = async () => {
        setBusy(true);
        setError(null);
        try {
            await becomeCreator();
        } catch {
            setError('Konnte Account nicht umstellen');
        } finally {
            setBusy(false);
        }
    };

    const isCreator = user?.role === 'creator' || user?.role === 'admin';

    return (
        <div className="flex flex-col gap-8 w-full max-w-2xl px-4 min-h-screen mx-auto mt-16">
            <AiOutlineArrowLeft
                size={24}
                className="absolute top-26 left-3/12"
                onClick={() => navigate(-1)}
            />
            <div className="flex flex-col items-left gap-2">
                <h1 className="font-display text-5xl text-text">
                    Einstellungen
                </h1>
                <p className="font-sans text-text-muted">
                    Verwalte deinen Account
                </p>
            </div>
            <div className="bg-surface w-full p-8 rounded-xl flex flex-col gap-4 items-center shadow-card">
                <h2 className="font-display text-2xl text-primary">
                    Creator-Account
                </h2>
                {isCreator ? (
                    <p className="font-sans text-text-muted">
                        Du kannst jetzt Events und Aktivitäten hosten.
                    </p>
                ) : (
                    <>
                        <p className="font-sans text-text-muted">
                            Werde Creator, um eigene Events und Aktivitäten zu
                            hosten.
                        </p>
                        <button
                            type="button"
                            onClick={onBecomeCreator}
                            disabled={busy}
                            className="btn-primary w-full"
                        >
                            {busy ? 'wird umgestellt...' : 'Creator werden'}
                        </button>
                        {error && (
                            <p className="text-danger text-xs text-center">
                                {error}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
