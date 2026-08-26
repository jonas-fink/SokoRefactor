import { useFieldArray, useFormContext } from 'react-hook-form';
import type { FaqEntry } from '../../types';

/**
 * Häufige Fragen für `ActivityForm` und `BeratungsForm`. Zugriff über
 * `useFormContext` wie in `ContactFields` — beide Schemas tragen dasselbe Feld.
 *
 * Anders als `ServicesEditor` liegt die Liste **im** Formular: an einer FAQ
 * hängen weder `_id`s noch hochgeladene Dateien, es gibt also nichts, was ein
 * PUT versehentlich wegräumen könnte. `useFieldArray` bringt die stabilen Keys
 * mit, sonst verlieren die Felder beim Entfernen einer Zeile ihren Inhalt.
 */
type FaqForm = { faq: FaqEntry[] };

const FaqEditor = () => {
    const { control, register } = useFormContext<FaqForm>();
    const { fields, append, remove } = useFieldArray({ control, name: 'faq' });

    return (
        <fieldset className="flex flex-col gap-3">
            <legend className="label">HÄUFIGE FRAGEN</legend>

            {fields.length === 0 && (
                <p className="text-ink-mute text-xs">
                    Optional — z.B. „Muss ich mich anmelden?" oder „Brauche ich
                    einen Termin?".
                </p>
            )}

            {fields.map((field, idx) => (
                <div
                    key={field.id}
                    className="border-line flex flex-col gap-2 rounded-control border p-3"
                >
                    <div className="flex items-center gap-2">
                        <input
                            aria-label={`Frage ${idx + 1}`}
                            placeholder="z.B. Muss ich mich anmelden?"
                            {...register(`faq.${idx}.question`)}
                            className="field min-w-0 flex-1"
                        />
                        <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="btn-secondary shrink-0 cursor-pointer"
                        >
                            Entfernen
                        </button>
                    </div>
                    <textarea
                        aria-label={`Antwort ${idx + 1}`}
                        rows={2}
                        placeholder="Antwort in ein bis zwei Sätzen"
                        {...register(`faq.${idx}.answer`)}
                        className="field"
                    />
                </div>
            ))}

            <button
                type="button"
                onClick={() => append({ question: '', answer: '' })}
                className="btn-secondary cursor-pointer self-start"
            >
                Frage hinzufügen
            </button>
            <p className="text-ink-mute text-xs">
                Zeilen ohne Frage oder ohne Antwort werden beim Speichern
                verworfen.
            </p>
        </fieldset>
    );
};

export default FaqEditor;
