import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    AiOutlineArrowLeft,
    AiOutlineLock,
    AiOutlinePhone,
    AiOutlineEnvironment,
    AiOutlineFileText,
} from 'react-icons/ai';
import { api, BASE } from '../utils/api';
import MapView from '../components/map/MapView';
import { WEEKDAYS, fromMinutes } from '../schemas/beratungSchema';
import type { Beratung } from '../types';

const BeratungDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [beratung, setBeratung] = useState<Beratung | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get<Beratung>(`/beratungen/${id}`)
            .then(setBeratung)
            .catch(() => setError('Angebot konnte nicht geladen werden'));
    }, [id]);

    if (error) return <p className="py-8 text-error">{error}</p>;
    if (!beratung) return <p className="py-8 text-ink-mute">Lädt …</p>;

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto md:p-8 pb-3">
            <div className="flex gap-3 items-center">
                <button
                    className="card bg-surface p-2 cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <AiOutlineArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold">{beratung.title}</h2>
            </div>

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
                        {t}
                    </span>
                ))}
            </div>

            {(beratung.phone || beratung.address) && (
                <div className="flex md:flex-row flex-col gap-3">
                    {' '}
                    {beratung.address && (
                        <p className="flex items-center gap-3">
                            <AiOutlineEnvironment size={20} />
                            <span className="text-ink-soft">
                                {beratung.address}
                            </span>
                        </p>
                    )}
                    {beratung.phone && (
                        <a
                            href={`tel:${beratung.phone}`}
                            className="flex items-center gap-3"
                        >
                            <AiOutlinePhone size={20} />
                            <span>{beratung.phone}</span>
                        </a>
                    )}
                </div>
            )}

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
