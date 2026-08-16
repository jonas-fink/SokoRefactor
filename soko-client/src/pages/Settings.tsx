import { useState } from 'react';
import { useAuth, canCreate } from '../context/auth-context';
import PageHeader from '../components/PageHeader';

const SettingsPage = () => {
    const { user, becomeCreator, changeEmail, changePassword } = useAuth();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // unkontrollierte Formulare mit FormData statt react-hook-form —
    // zwei Felder, keine Live-Validierung, die Fehlermeldung kommt ohnehin vom
    // Server (falsches Passwort, E-Mail vergeben).
    const [credMessage, setCredMessage] = useState<string | null>(null);

    const submit =
        (action: (form: FormData) => Promise<void>, done: string) =>
        async (event: React.SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();
            const form = event.currentTarget;
            setCredMessage(null);
            try {
                await action(new FormData(form));
                form.reset();
                setCredMessage(done);
            } catch (error) {
                setCredMessage((error as Error).message);
            }
        };

    const onEmail = submit(
        (f) =>
            changeEmail(
                String(f.get('email')),
                String(f.get('currentPassword')),
            ),
        'E-Mail geändert.',
    );

    const onPassword = submit(
        (f) =>
            changePassword(
                String(f.get('currentPassword')),
                String(f.get('newPassword')),
            ),
        'Passwort geändert. Andere Geräte müssen sich neu anmelden.',
    );

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
        <div className="flex flex-col gap-8 md:max-w-6xl md:p-8 mx-auto">
            <PageHeader
                title="Einstellungen"
                subtitle="Verwalte deinen Account"
            />
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

            <section className="flex flex-col gap-6 rounded-card border border-line bg-surface p-6">
                <h2 className="font-display text-2xl text-ink">Anmeldedaten</h2>

                <form onSubmit={onEmail} className="flex flex-col gap-3">
                    <label htmlFor="new-email" className="label">
                        Neue E-Mail
                    </label>
                    <input
                        id="new-email"
                        name="email"
                        type="email"
                        required
                        defaultValue=""
                        placeholder={user?.email}
                        className="field"
                    />
                    <input
                        name="currentPassword"
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="Aktuelles Passwort"
                        className="field"
                    />
                    <button
                        type="submit"
                        className="btn-secondary self-start cursor-pointer"
                    >
                        E-Mail ändern
                    </button>
                </form>

                <form onSubmit={onPassword} className="flex flex-col gap-3">
                    <label htmlFor="new-password" className="label">
                        Neues Passwort
                    </label>
                    <input
                        name="currentPassword"
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="Aktuelles Passwort"
                        className="field"
                    />
                    <input
                        id="new-password"
                        name="newPassword"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Mindestens 8 Zeichen"
                        className="field"
                    />
                    <button
                        type="submit"
                        className="btn-secondary self-start cursor-pointer"
                    >
                        Passwort ändern
                    </button>
                </form>

                {credMessage && (
                    <p className="text-sm text-ink-mute">{credMessage}</p>
                )}
            </section>
        </div>
    );
};

export default SettingsPage;
