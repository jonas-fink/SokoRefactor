import { useRef, useState } from 'react';
import { AiOutlineFileText } from 'react-icons/ai';
import { api } from '../../utils/api';
import type { ServiceDraft } from '../../utils/services';
import type { Beratung } from '../../types';

type Props = {
    services: ServiceDraft[];
    onChange: (services: ServiceDraft[]) => void;
    /** Nur im Bearbeiten-Modus gesetzt; ohne sie gibt es keine Upload-Route. */
    beratungId?: string;
};

/**
 * Zeilenliste statt des früheren komma-getrennten Freitextfeldes.
 *
 * Der Grund ist kein Komfort: ein PUT ersetzt `services` komplett, und der
 * Controller löscht jeden `s3Key`, der danach nicht mehr referenziert ist
 * (`orphanedKeys`). Ein Freitextfeld verliert `_id` und `documents` — einmal
 * Titel korrigieren hätte damit sämtliche hochgeladenen Anträge aus S3
 * entfernt. Hier trägt jede Zeile ihren Bestand mit.
 */
const ServicesEditor = ({ services, onChange, beratungId }: Props) => {
    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
    const [uploadError, setUploadError] = useState('');
    const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

    const rename = (idx: number, name: string) =>
        onChange(services.map((s, i) => (i === idx ? { ...s, name } : s)));

    const remove = (idx: number) =>
        onChange(services.filter((_, i) => i !== idx));

    const removeDocument = (idx: number, docId: string) =>
        onChange(
            services.map((s, i) =>
                i === idx
                    ? {
                          ...s,
                          documents: s.documents.filter((d) => d._id !== docId),
                      }
                    : s,
            ),
        );

    const upload = async (idx: number, serviceId: string) => {
        const file = fileRefs.current[idx]?.files?.[0];
        if (!file || !beratungId) return;
        setUploadError('');
        setUploadingIdx(idx);
        const form = new FormData();
        form.append('document', file);
        form.append('title', file.name);
        try {
            const updated = await api.upload<Beratung>(
                `/beratungen/${beratungId}/services/${serviceId}/documents`,
                form,
            );
            // Die Antwort ist die vollstaendige Beratung — daraus uebernehmen,
            // statt nachzuladen.
            onChange(updated.services ?? []);
            if (fileRefs.current[idx]) fileRefs.current[idx].value = '';
        } catch (e) {
            setUploadError(
                e instanceof Error ? e.message : 'Upload fehlgeschlagen',
            );
        } finally {
            setUploadingIdx(null);
        }
    };

    return (
        <fieldset className="flex flex-col gap-3">
            <legend className="label">ANGEBOTE</legend>

            {services.length === 0 && (
                <p className="text-ink-mute text-xs">
                    Noch keine Angebote — z.B. Grundsicherung, Wohngeld.
                </p>
            )}

            {services.map((service, idx) => (
                <div
                    key={service._id ?? `neu-${idx}`}
                    className="border-line flex flex-col gap-2 rounded-control border p-3"
                >
                    <div className="flex items-center gap-2">
                        <input
                            aria-label={`Angebot ${idx + 1}`}
                            value={service.name}
                            onChange={(e) => rename(idx, e.target.value)}
                            placeholder="z.B. Grundsicherung"
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

                    {service.documents.map((doc) => (
                        <div
                            key={doc._id}
                            className="flex items-center gap-2 pl-1"
                        >
                            <AiOutlineFileText size={18} />
                            <span className="text-ink-soft min-w-0 flex-1 truncate text-sm">
                                {doc.title}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeDocument(idx, doc._id)}
                                className="text-error cursor-pointer text-xs underline"
                            >
                                Entfernen
                            </button>
                        </div>
                    ))}

                    {service._id && beratungId ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="file"
                                aria-label={`Antrag zu ${service.name || 'Angebot'} hochladen`}
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                ref={(el) => {
                                    fileRefs.current[idx] = el;
                                }}
                                className="field min-w-0 flex-1 text-sm"
                            />
                            <button
                                type="button"
                                disabled={uploadingIdx === idx}
                                onClick={() => upload(idx, service._id!)}
                                className="btn-secondary shrink-0 cursor-pointer"
                            >
                                {uploadingIdx === idx
                                    ? 'Lädt hoch …'
                                    : 'Hochladen'}
                            </button>
                        </div>
                    ) : (
                        <p className="text-ink-mute text-xs">
                            Anträge lassen sich hochladen, sobald das Angebot
                            gespeichert ist.
                        </p>
                    )}
                </div>
            ))}

            {uploadError && <p className="text-error text-xs">{uploadError}</p>}

            <button
                type="button"
                onClick={() =>
                    onChange([...services, { name: '', documents: [] }])
                }
                className="btn-secondary cursor-pointer self-start"
            >
                Angebot hinzufügen
            </button>
            <p className="text-ink-mute text-xs">
                Entfernte Angebote und Anträge verschwinden erst beim Speichern
                — dann aber endgültig.
            </p>
        </fieldset>
    );
};

export default ServicesEditor;
