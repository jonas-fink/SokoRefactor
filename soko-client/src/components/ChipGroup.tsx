interface ChipGroupProps {
    legend: string;
    options: { key: string; label: string }[];
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
                    className={`cursor-pointer ${
                        selected.includes(o.key) ? 'chip-active' : 'chip'
                    }`}
                    onClick={() => onToggle(o.key)}
                >
                    {o.label}
                </button>
            ))}
        </div>
        {hint && <p className="text-ink-mute text-xs">{hint}</p>}
    </fieldset>
);

export default ChipGroup;
