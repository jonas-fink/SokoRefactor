import { useState } from 'react';
import { useAuth } from '../context/auth-context';
import PageHeader from '../components/PageHeader';
import PreferencePicker from '../components/PreferencePicker';
import { EMPTY_PREFERENCES, type Preferences } from '../types';

const PreferencesPage = () => {
    const { user, savePreferences } = useAuth();
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

    return (
        <div className="flex flex-col gap-8 md:max-w-6xl md:p-8 mx-auto">
            <PageHeader
                title="Deine Präferenzen"
                subtitle="Startwerte für Suche und Listen — jeder Filter lässt sich dort weiterhin frei ändern."
            />

            <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6">
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
        </div>
    );
};

export default PreferencesPage;
