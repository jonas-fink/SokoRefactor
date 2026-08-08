import { useState } from 'react';
import { useAuth, canCreate } from '../context/auth-context';
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

    const isCreator = canCreate(user);

    return (
        <div className="flex flex-col gap-8 md:max-w-6xl p-8 mx-auto">
            <div className="flex items-center gap-3">
                <button
                    className="card bg-surface p-2 cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <AiOutlineArrowLeft size={24} />
                </button>
                <div>
                    {' '}
                    <h1 className="font-display text-2xl text-ink">
                        Einstellungen
                    </h1>
                    <p className="font-sans text-ink-mute">
                        Verwalte deinen Account
                    </p>
                </div>
            </div>
            <div className="bg-surface w-full p-8 rounded-card flex flex-col gap-4 items-center shadow-card">
                <h2 className="font-display text-2xl text-primary">
                    Creator-Account
                </h2>
                {isCreator ? (
                    <p className="font-sans text-ink-mute">
                        Du kannst jetzt Events und Aktivitäten hosten.
                    </p>
                ) : (
                    <>
                        <p className="font-sans text-ink-mute">
                            Werde Creator, um eigene Events und Aktivitäten zu
                            hosten.
                        </p>
                        <button
                            type="button"
                            onClick={onBecomeCreator}
                            disabled={busy}
                            className="btn-primary md:w-1/2 cursor-pointer"
                        >
                            {busy ? 'wird umgestellt...' : 'Creator werden'}
                        </button>
                        {error && (
                            <p className="text-error text-xs text-center">
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
