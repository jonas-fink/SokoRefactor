import {
    AiOutlineLogout,
    AiOutlineMoon,
    AiOutlineSetting,
    AiOutlineSun,
} from 'react-icons/ai';
import { useState } from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '../context/auth-context';
import { formatDate } from '../utils/formatDate';
import PreferencePicker from '../components/PreferencePicker';
import { EMPTY_PREFERENCES, type Preferences } from '../types';

const Profile = () => {
    const { user, logout, savePreferences, changeEmail, changePassword } =
        useAuth();
    const [prefs, setPrefs] = useState<Preferences>(
        user?.preferences ?? EMPTY_PREFERENCES,
    );
    const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>(
        'idle',
    );

    const onSave = async () => {
        setStatus('saving');
        try {
            await savePreferences(prefs);
            setStatus('done');
        } catch {
            setStatus('error');
        }
    };

    // ponytail: unkontrollierte Formulare mit FormData statt react-hook-form —
    // zwei Felder, keine Live-Validierung, die Fehlermeldung kommt ohnehin vom
    // Server (falsches Passwort, E-Mail vergeben).
    const [credMessage, setCredMessage] = useState<string | null>(null);

    const submit =
        (action: (form: FormData) => Promise<void>, done: string) =>
        async (event: React.FormEvent<HTMLFormElement>) => {
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

    // ponytail: kein ThemeContext — das DOM ist der State, gesetzt vom
    // Inline-Script in index.html. Nur diese Komponente schreibt ihn.
    const [dark, setDark] = useState(() =>
        document.documentElement.classList.contains('dark'),
    );

    const toggleTheme = () => {
        const next = !dark;
        document.documentElement.classList.toggle('dark', next);
        document.documentElement.style.colorScheme = next ? 'dark' : 'light';
        localStorage.setItem('soko:theme', next ? 'dark' : 'light');
        setDark(next);
    };

    const initials =
        user?.name
            ?.split(' ')
            .map((part) => part[0])
            .join('') ?? '';

    return (
        <div className="flex flex-col gap-4 mx-auto md:max-w-6xl md:p-8">
            <div className="flex gap-4 items-center">
                <div className="flex items-center justify-center rounded-full w-20 h-20 text-3xl p-4 bg-primary">
                    <p className="font-bold text-4xl">{initials}</p>
                </div>

                <div>
                    {' '}
                    <h2 className="text-2xl">{user?.name}</h2>
                    {user && (
                        <p>Mitlgied seit dem {formatDate(user.createdAt)}</p>
                    )}
                </div>
            </div>
            <div>
                <div className="flex w-full flex-col gap-3">
                    <NavLink to="/settings" className="flex field gap-3">
                        <AiOutlineSetting size={24} className="text-primary" />
                        Einstellungen
                    </NavLink>
                    <button
                        className="flex field gap-3 cursor-pointer items-center"
                        onClick={toggleTheme}
                        role="switch"
                        aria-checked={dark}
                    >
                        {dark ? (
                            <AiOutlineSun size={24} className="text-primary" />
                        ) : (
                            <AiOutlineMoon size={24} className="text-primary" />
                        )}
                        {dark ? 'Heller Modus' : 'Dunkler Modus'}
                    </button>
                    <button
                        className="flex field gap-3 cursor-pointer"
                        onClick={logout}
                    >
                        <AiOutlineLogout size={24} className="text-primary " />
                        Logout
                    </button>
                </div>
            </div>

            <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6">
                <div>
                    <h2 className="font-display text-2xl text-ink">
                        Deine Präferenzen
                    </h2>
                    <p className="text-sm text-ink-mute">
                        Startwerte für Suche und Listen — jeder Filter lässt
                        sich dort weiterhin frei ändern.
                    </p>
                </div>

                <PreferencePicker
                    value={prefs}
                    onChange={(next) => {
                        setPrefs(next);
                        setStatus('idle');
                    }}
                />

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="btn-primary cursor-pointer"
                        disabled={status === 'saving'}
                        onClick={onSave}
                    >
                        {status === 'saving' ? 'speichert...' : 'Speichern'}
                    </button>
                    {status === 'done' && (
                        <p className="text-sm text-ink-mute">Gespeichert.</p>
                    )}
                    {status === 'error' && (
                        <p className="text-error text-sm">
                            Konnte nicht gespeichert werden.
                        </p>
                    )}
                </div>
            </section>

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

export default Profile;
