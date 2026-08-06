import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { api } from '../utils/api';
import MapView from '../components/map/MapView';
import { useFavorites } from '../hooks/useFavorites';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import type { Activity, ItemType, ScrapedEvent } from '../types';

const formatDate = (iso?: string | null) =>
    iso
        ? new Date(iso).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
          })
        : 'Termin offen';

const AngebotDetail = () => {
    const { itemType, id } = useParams<{ itemType: ItemType; id: string }>();
    const { isFavorite, toggle, enabled } = useFavorites();
    const [item, setItem] = useState<Activity | ScrapedEvent | null>(null);
    const [error, setError] = useState('');

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
    const coordinates = activity?.location?.coordinates;
    const favorite = isFavorite(itemType, id);

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-8">
            <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl sm:text-4xl">{item.title}</h1>
                {enabled && (
                    <button
                        type="button"
                        aria-label={
                            favorite ? 'Aus Sammlung entfernen' : 'Zur Sammlung'
                        }
                        aria-pressed={favorite}
                        className="btn-secondary text-error"
                        onClick={() => toggle(itemType, id)}
                    >
                        {favorite ? (
                            <AiFillHeart size={20} />
                        ) : (
                            <AiOutlineHeart size={20} />
                        )}
                        Merken
                    </button>
                )}
            </div>

            {activity?.image && (
                <img
                    src={activity.image}
                    alt=""
                    className="h-64 w-full rounded-card object-cover"
                />
            )}

            <div className="flex flex-wrap gap-2">
                {event?.category && (
                    <span className="chip">{event.category}</span>
                )}
                {activity?.tags.map((t) => (
                    <span key={t} className="chip">
                        {t}
                    </span>
                ))}
            </div>

            <p className="text-ink-soft">{item.description}</p>

            <div className="field flex-col items-start gap-1">
                <p>{formatDate(activity ? activity.date : event?.startDate)}</p>
                {event?.locationName && <p>{event.locationName}</p>}
                {activity && (
                    <p>
                        {activity.price === 0
                            ? 'Kostenlos'
                            : `${activity.price} €`}
                    </p>
                )}
            </div>

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
