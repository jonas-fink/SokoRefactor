import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { api } from '../utils/api';
import PageHeader from '../components/PageHeader';
import MapView from '../components/map/MapView';
import ContactBlock from '../components/ContactBlock';
import OwnerActions from '../components/OwnerActions';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../context/auth-context';
import {
    AiFillHeart,
    AiOutlineHeart,
    AiOutlineEnvironment,
    AiOutlineCalendar,
} from 'react-icons/ai';
import { formatDate } from '../utils/formatDate';
import { useCategories } from '../hooks/useCategories';
import { useVocabulary } from '../hooks/useVocabulary';
import type { Activity, ItemType, ScrapedEvent } from '../types';

const AngebotDetail = () => {
    const { itemType, id } = useParams<{ itemType: ItemType; id: string }>();
    const { isFavorite, toggle, enabled } = useFavorites();
    const [item, setItem] = useState<Activity | ScrapedEvent | null>(null);
    const [error, setError] = useState('');
    const { labelOf } = useCategories('activity');
    const { labelOf: axisLabelOf } = useVocabulary();
    const { user } = useAuth();

    useEffect(() => {
        if (!itemType || !id) return;
        const path =
            itemType === 'Activity' ? `/activities/${id}` : `/events/${id}`;
        api.get<Activity | ScrapedEvent>(path)
            .then(setItem)
            .catch(() => setError('Angebot konnte nicht geladen werden'));
    }, [itemType, id]);

    if (error) return <p className="py-8 text-error">{error}</p>;
    if (!item || !itemType || !id)
        return <p className="py-8 text-ink-mute">Lädt …</p>;

    const isActivity = itemType === 'Activity';
    const activity = isActivity ? (item as Activity) : null;
    const event = isActivity ? null : (item as ScrapedEvent);
    // Events bekommen ihre Koordinaten nachtraeglich vom Geocoder — wer keine
    // hat, zeigt eben nur den Ortsnamen.
    const coordinates =
        activity?.location?.coordinates ?? event?.location?.coordinates;
    const favorite = isFavorite(itemType, id);
    // Nur eigene Activities — ScrapedEvents gehoeren dem Scraper, nicht uns.
    // Dieselbe Regel wie `isDocOwner` im Backend: Owner **oder** Admin.
    const canManage =
        !!activity &&
        !!user &&
        (user.role === 'admin' || activity.userId?._id === user.id);
    // Ohne Vokabular faellt die Zeile weg — ein roher Key waere schlechter.
    const axis = (keys: string[] = []) =>
        keys.map(axisLabelOf).filter(Boolean).join(', ');
    const spoken = axis(item.availableLanguages);
    const audience = axis(item.targetAudience);

    return (
        <div className="mx-auto flex md:max-w-6xl flex-col gap-6 md:p-8 pb-3">
            <PageHeader
                action={
                    <div className="flex shrink-0 gap-2">
                        {enabled && (
                            <button
                                type="button"
                                aria-label={
                                    favorite
                                        ? 'Aus Sammlung entfernen'
                                        : 'Zur Sammlung'
                                }
                                aria-pressed={favorite}
                                className="btn-secondary text-error cursor-pointer shrink-0"
                                onClick={() => toggle(itemType, id)}
                            >
                                {favorite ? (
                                    <AiFillHeart size={20} />
                                ) : (
                                    <AiOutlineHeart size={20} />
                                )}
                            </button>
                        )}
                        {canManage && (
                            <OwnerActions
                                editTo={`/erstellen/aktivitaet/${id}`}
                                deletePath={`/activities/${id}`}
                                redirectTo="/events"
                            />
                        )}
                    </div>
                }
            />

            {activity?.image && (
                <img
                    src={activity.image}
                    alt=""
                    className="h-64 w-full rounded-card object-cover"
                />
            )}

            <h1 className="text-2xl font-bold wrap-break-words">
                {item.title}
            </h1>

            <div className="flex flex-wrap gap-2">
                {event?.category && (
                    <span className="chip">{labelOf(event.category)}</span>
                )}
                {activity?.tags.map((t) => (
                    <span key={t} className="chip">
                        {labelOf(t)}
                    </span>
                ))}
            </div>

            <p className="text-ink-soft">{item.description}</p>

            {(spoken || audience) && (
                <div className="flex flex-col gap-1">
                    {spoken && (
                        <p>
                            <span className="text-ink-mute">Sprachen: </span>
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

            <div className="field flex flex-col md:flex-row items-start gap-3 md:gap-6">
                <p className="flex gap-3">
                    <AiOutlineCalendar size={20} />
                    {formatDate(activity ? activity.date : event?.startDate)}
                </p>
                {event?.locationName && (
                    <p className="flex gap-3">
                        <AiOutlineEnvironment size={20} />
                        {event.locationName}
                    </p>
                )}
                {activity && (
                    <p>
                        {activity.price === 0
                            ? 'Kostenlos'
                            : `${activity.price} €`}
                    </p>
                )}
            </div>

            {activity && <ContactBlock contact={activity} />}

            {coordinates && (
                <div className="h-72 overflow-hidden rounded-card">
                    <MapView center={coordinates} />
                </div>
            )}

            {event?.sourceUrl && (
                <a
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary self-start"
                >
                    Zur Quelle
                </a>
            )}
        </div>
    );
};

export default AngebotDetail;
