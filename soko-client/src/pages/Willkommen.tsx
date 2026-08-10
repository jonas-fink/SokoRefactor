import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/auth-context';
import PreferencePicker, {
    type PreferenceSection,
} from '../components/PreferencePicker';
import { EMPTY_PREFERENCES, type Preferences } from '../types';

const STEPS: {
    section: PreferenceSection;
    title: string;
    hint: string;
}[] = [
    {
        section: 'languages',
        title: 'In welchen Sprachen möchtest du Angebote sehen?',
        hint: 'Mehrfachauswahl. Angebote ohne Sprachangabe zeigen wir immer.',
    },
    {
        section: 'audiences',
        title: 'Für wen suchst du?',
        hint: 'Auch mehrere — für dich, deine Familie, deine Kinder.',
    },
    {
        section: 'categories',
        title: 'Welche Themen interessieren dich?',
        hint: 'Damit starten Startseite und Listen bereits vorgefiltert.',
    },
];

/**
 * Onboarding nach der Registrierung. Ausserhalb von `AppLayout` — waehrend des
 * Onboardings gibt es noch nichts zu navigieren.
 *
 * Beide Ausgaenge (fertig **und** „Überspringen") speichern, weil erst
 * `preferencesSetAt` den Wizard beendet. Schlaegt der `PATCH` fehl, geht es
 * trotzdem weiter: ein Onboarding darf niemanden vor der App einsperren.
 */
const Willkommen = () => {
    const { savePreferences } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [prefs, setPrefs] = useState<Preferences>(EMPTY_PREFERENCES);
    const [busy, setBusy] = useState(false);

    const finish = async (value: Preferences) => {
        setBusy(true);
        try {
            await savePreferences(value);
        } catch {
            // ponytail: kein Retry, kein Fehlerbanner — ohne Praeferenzen
            // funktioniert die App, sie ist nur nicht vorgefiltert.
        } finally {
            navigate('/', { replace: true });
        }
    };

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-4 pt-16">
            <div className="flex flex-col gap-3">
                <div
                    className="h-2 w-full overflow-hidden rounded-full bg-line"
                    role="progressbar"
                    aria-valuenow={step + 1}
                    aria-valuemin={1}
                    aria-valuemax={STEPS.length}
                    aria-label="Fortschritt"
                >
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                            width: `${((step + 1) / STEPS.length) * 100}%`,
                        }}
                    />
                </div>
                <p className="text-xs text-ink-mute">
                    Schritt {step + 1} von {STEPS.length}
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <h1 className="font-display text-4xl text-ink">
                    {current.title}
                </h1>
                <p className="font-sans text-ink-mute">{current.hint}</p>
            </div>

            <div className="rounded-card border border-line bg-surface p-6">
                <PreferencePicker
                    value={prefs}
                    onChange={setPrefs}
                    sections={[current.section]}
                />
            </div>

            <div className="flex items-center justify-between gap-3 pb-16">
                <button
                    type="button"
                    className="text-sm text-ink-mute hover:text-ink cursor-pointer"
                    disabled={busy}
                    onClick={() => finish(prefs)}
                >
                    Überspringen
                </button>

                <div className="flex gap-3">
                    {step > 0 && (
                        <button
                            type="button"
                            className="btn-secondary cursor-pointer"
                            disabled={busy}
                            onClick={() => setStep(step - 1)}
                        >
                            Zurück
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn-primary cursor-pointer"
                        disabled={busy}
                        onClick={() =>
                            isLast ? finish(prefs) : setStep(step + 1)
                        }
                    >
                        {isLast ? 'Los geht’s' : 'Weiter'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Willkommen;
