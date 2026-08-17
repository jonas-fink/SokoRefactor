import type { ReactNode } from 'react';

export interface ChipOption {
    key: string;
    label: string;
    /** Themen-Chips zeigen das Kategorie-Icon aus `categoryMeta.tsx`. */
    icon?: ReactNode;
    /** Eigenname der Sprache, z. B. „العربية" — steht hinter dem Label. */
    endonym?: string;
}

interface ChipGroupProps {
    legend: string;
    options: ChipOption[];
    selected: string[];
    onToggle: (key: string) => void;
    hint?: string;
}

/**
 * Mehrfachauswahl aus einer geschlossenen Liste (Kategorien, Sprachen,
 * Zielgruppen). Freitext gibt es hier bewusst nicht: die Werte sind
 * Datenbank-Keys, die das Backend gegen eine Whitelist prueft — ein Tippfehler
 * waere sonst ein 400 nach dem Absenden statt gar keiner Eingabe.
 */
const ChipGroup = ({
    legend,
    options,
    selected,
    onToggle,
    hint,
}: ChipGroupProps) => (
    <fieldset className="flex flex-col gap-2">
        <legend className="label">{legend}</legend>
        <div className="flex flex-wrap gap-2">
            {options.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    aria-pressed={selected.includes(o.key)}
                    // Die Icons stehen mit `size={24}` in `categoryMeta.tsx` —
                    // im Chip zu gross, CSS gewinnt gegen das Attribut.
                    className={`inline-flex cursor-pointer items-center gap-1.5 [&_svg]:size-5 ${
                        selected.includes(o.key) ? 'chip-active' : 'chip'
                    }`}
                    onClick={() => onToggle(o.key)}
                >
                    {o.icon}
                    {o.label}
                    {/* `dir="auto"` isoliert das Fragment: ohne das rutscht der
                        Trenner bei Arabisch und Farsi auf die falsche Seite. */}
                    {o.endonym && (
                        <span dir="auto" className="text-ink-mute">
                            · {o.endonym}
                        </span>
                    )}
                </button>
            ))}
        </div>
        {hint && <p className="text-ink-mute text-xs">{hint}</p>}
    </fieldset>
);

export default ChipGroup;
