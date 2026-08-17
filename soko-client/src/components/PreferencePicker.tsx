import { useVocabulary } from '../hooks/useVocabulary';
import { useCategories } from '../hooks/useCategories';
import ChipGroup from './ChipGroup';
import { CATEGORY_META } from '../categoryMeta';
import type { Preferences } from '../types';

export type PreferenceSection = keyof Preferences;

interface PreferencePickerProps {
    value: Preferences;
    onChange: (next: Preferences) => void;
    /** Der Wizard zeigt einen Abschnitt pro Schritt, das Profil alle. */
    sections?: PreferenceSection[];
}

const ALL: PreferenceSection[] = [
    'languages',
    'audiences',
    'categories',
    'freeOnly',
];

/**
 * Die Praeferenz-Auswahl — zwei Aufrufer: der Onboarding-Wizard
 * (`pages/Willkommen.tsx`, ein Abschnitt pro Schritt) und das Profil
 * (`pages/Profile.tsx`, alle auf einmal). Speichern tut sie nicht: wer sie
 * einbaut, entscheidet, wann der `PATCH` faellt.
 */
const PreferencePicker = ({
    value,
    onChange,
    sections = ALL,
}: PreferencePickerProps) => {
    const { languages, audiences } = useVocabulary();
    const { categories } = useCategories();

    const toggle = (key: 'languages' | 'audiences' | 'categories', v: string) =>
        onChange({
            ...value,
            [key]: value[key].includes(v)
                ? value[key].filter((k) => k !== v)
                : [...value[key], v],
        });

    return (
        <div className="flex flex-col gap-6">
            {sections.includes('languages') && languages.length > 0 && (
                <ChipGroup
                    legend="Sprache"
                    options={languages}
                    selected={value.languages}
                    onToggle={(k) => toggle('languages', k)}
                    hint="Angebote ohne Sprachangabe bleiben sichtbar."
                />
            )}

            {sections.includes('audiences') && audiences.length > 0 && (
                <ChipGroup
                    legend="Für wen"
                    options={audiences}
                    selected={value.audiences}
                    onToggle={(k) => toggle('audiences', k)}
                />
            )}

            {sections.includes('categories') && categories.length > 0 && (
                <ChipGroup
                    legend="Themen"
                    options={categories.map((c) => ({
                        ...c,
                        icon: CATEGORY_META[c.key]?.icon,
                    }))}
                    selected={value.categories}
                    onToggle={(k) => toggle('categories', k)}
                />
            )}

            {sections.includes('freeOnly') && (
                <label className="flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        className="size-5 accent-primary"
                        checked={value.freeOnly}
                        onChange={(e) =>
                            onChange({ ...value, freeOnly: e.target.checked })
                        }
                    />
                    Nur kostenlose Angebote
                </label>
            )}
        </div>
    );
};

export default PreferencePicker;
