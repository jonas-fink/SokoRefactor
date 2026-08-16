import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { AiOutlineLock, AiOutlineFileText } from 'react-icons/ai';
import { api, BASE } from '../utils/api';
import PageHeader from '../components/PageHeader';
import ContactBlock from '../components/ContactBlock';
import OwnerActions from '../components/OwnerActions';
import { useAuth } from '../context/auth-context';
import MapView from '../components/map/MapView';
import { WEEKDAYS, fromMinutes } from '../schemas/beratungSchema';
import { useCategories } from '../hooks/useCategories';
import { useVocabulary } from '../hooks/useVocabulary';
import type { Beratung } from '../types';

const BeratungDetail = () => {
    const { id } = useParams();
    const [beratung, setBeratung] = useState<Beratung | null>(null);
    const [error, setError] = useState('');
    const { labelOf } = useCategories('beratung');
    const { labelOf: axisLabelOf } = useVocabulary();
    const { user } = useAuth();

    useEffect(() => {
        api.get<Beratung>(`/beratungen/${id}`)
            .then(setBeratung)
            .catch(() => setError('Angebot konnte nicht geladen werden'));
    }, [id]);

    if (error) return <p className="py-8 text-error">{error}</p>;
    if (!beratung) return <p className="py-8 text-ink-mute">Lädt …</p>;

    // Ohne Vokabular faellt die Zeile weg — ein roher Key waere schlechter.
    const axis = (keys: string[] = []) =>
        keys.map(axisLabelOf).filter(Boolean).join(', ');
    const spoken = axis(beratung.availableLanguages);
    const audience = axis(beratung.targetAudience);

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto md:p-8 pb-3">
            <PageHeader
                title={beratung.title}
                // Beratungen pflegt ausschliesslich `admin` (ARCHITEKTUR.md § 2.6).
                action={
                    user?.role === 'admin' && (
                        <OwnerActions
                            editTo={`/erstellen/beratung/${beratung._id}`}
                            deletePath={`/beratungen/${beratung._id}`}
                            redirectTo="/beratung"
                        />
                    )
                }
            />

            <img
                src={beratung.image}
                alt=""
                className="h-56 w-full rounded-card object-cover"
            />

            <div className="field flex gap-3 bg-ink text-primary-ink items-center p-3">
                <AiOutlineLock size={24} />
                <p>
                    Dieses Angebot ist{' '}
                    <span className="font-bold">kostenlos</span> und{' '}
                    <span className="font-bold">vertraulich</span>.
                </p>
            </div>

            <p className="text-ink-soft">{beratung.description}</p>
            <div className="flex flex-wrap gap-2 items-center">
                {beratung.tags.map((t) => (
                    <span key={t} className="chip">
                        {labelOf(t)}
                    </span>
                ))}
            </div>

            {(spoken || audience) && (
                <div className="flex flex-col gap-1">
                    {spoken && (
                        <p>
                            <span className="text-ink-mute">
                                Beratung auf:{' '}
                            </span>
                            <span className="text-ink-soft">{spoken}</span>
                        </p>
                    )}
                    {audience && (
                        <p>
                            <span className="text-ink-mute">Für: </span>
                            <span className="text-ink-soft">{audience}</span>
                        </p>
                    )}
                </div>
            )}

            <ContactBlock contact={beratung} />

            {beratung.services && beratung.services.length > 0 && (
                <div className="card flex flex-col gap-4 p-4">
                    <h3 className="text-xl">Angebote & Anträge</h3>
                    {beratung.services.map((service) => (
                        <div key={service._id} className="flex flex-col gap-2">
                            <h4 className="font-bold">{service.name}</h4>
                            {service.documents.length === 0 ? (
                                <p className="text-ink-mute text-sm">
                                    Keine Dokumente hinterlegt.
                                </p>
                            ) : (
                                service.documents.map((doc) => (
                                    <a
                                        key={doc._id}
                                        // öffnet den Redirect auf die presigned URL
                                        href={`${BASE}/beratungen/${beratung._id}/documents/${doc._id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-3 text-ink-soft underline"
                                    >
                                        <AiOutlineFileText size={20} />
                                        <span>{doc.title}</span>
                                    </a>
                                ))
                            )}
                        </div>
                    ))}
                </div>
            )}

            {beratung.openingHours && (
                <div className="card flex flex-col gap-1 p-4">
                    <h3 className="mb-2 text-xl">Öffnungszeiten</h3>
                    {WEEKDAYS.map(({ key, label }) => {
                        const slots = beratung.openingHours?.[key] ?? [];
                        return (
                            <div key={key} className="flex justify-between">
                                <span>{label}</span>
                                <span className="text-ink-soft">
                                    {slots.length === 0
                                        ? 'geschlossen'
                                        : slots
                                              .map(
                                                  (s) =>
                                                      `${fromMinutes(s.open)}–${fromMinutes(s.close)}`,
                                              )
                                              .join(', ')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {beratung.location?.coordinates && (
                <div className="h-72 overflow-hidden rounded-card">
                    <MapView center={beratung.location.coordinates} />
                </div>
            )}
        </div>
    );
};

export default BeratungDetail;
