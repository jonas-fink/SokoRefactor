import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { api } from '../utils/api';
import { formatDate } from '../utils/formatDate';
import { CATEGORY_META } from '../categoryMeta';
import OfferCard from '../components/OfferCard';
import { useFavorites } from '../hooks/useFavorites';
import type { Activity, Category, EventsPage } from '../types';

const EventKategorie = () => {
    const { key = '' } = useParams();
    const navigate = useNavigate();
    const { isFavorite, toggle, enabled } = useFavorites();
    const [data, setData] = useState<EventsPage | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [label, setLabel] = useState('Events');
    const [page, setPage] = useState(1);
    const [error, setError] = useState('');

    const meta = CATEGORY_META[key];

    useEffect(() => {
        setPage(1);
        api.get<Activity[]>(`/activities?tags=${key}`)
            .then(setActivities)
            .catch(() => setError('Angebote konnten nicht geladen werden'));
        // Label kommt aus der Taxonomie, nicht aus einer zweiten lokalen Liste.
        api.get<Category[]>('/categories?appliesTo=activity')
            .then((cats) =>
                setLabel(cats.find((c) => c.key === key)?.label ?? 'Events'),
            )
            .catch(() => setLabel('Events'));
    }, [key]);

    useEffect(() => {
        // Ein Kategoriewechsel setzt `page` zurueck, also laufen kurz zwei
        // Anfragen. Ohne das Flag koennte die alte als letzte ankommen und die
        // richtige Liste ueberschreiben.
        let cancelled = false;
        api.get<EventsPage>(`/events?category=${key}&page=${page}`)
            .then((res) => !cancelled && setData(res))
            .catch(
                () =>
                    !cancelled &&
                    setError('Events konnten nicht geladen werden'),
            );
        return () => {
            cancelled = true;
        };
    }, [key, page]);

    const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

    // Vergangenes fliegt raus — bei den Events filtert das Backend, bei den
    // Activities niemand. Ab Mitternacht, damit ein Angebot von heute Mittag
    // nicht schon vormittags verschwindet.
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    // ponytail: Activities sind wenige und unpaginiert, sie erscheinen nur auf
    // Seite 1. Wenn es mehr werden, gehoeren sie in die Events-Aggregation.
    const entries = [
        ...(page === 1
            ? activities
                  .filter((a) => new Date(a.date).getTime() >= startOfToday)
                  .map((a) => ({
                      itemType: 'Activity' as const,
                      activity: a,
                      time: new Date(a.date).getTime(),
                  }))
            : []),
        ...(data?.events ?? []).map((e) => ({
            itemType: 'ScrapedEvent' as const,
            event: e,
            // Ohne Datum ans Ende, genau wie in der Sortierung des Backends.
            time: e.startDate ? new Date(e.startDate).getTime() : Infinity,
        })),
    ].sort((a, b) => a.time - b.time);

    return (
        <div className="flex flex-col gap-6 md:max-w-6xl mx-auto">
            <div className="flex gap-4 items-center">
                <button
                    className="card bg-surface p-2 cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <AiOutlineArrowLeft size={24} />
                </button>
                <span className={meta?.accent}>{meta?.icon}</span>
                <h2 className="text-2xl font-bold">{label}</h2>
            </div>
            {meta && <p className="text-ink-soft">{meta.description}</p>}

            {error && <p className="text-error">{error}</p>}
            {!error && data && entries.length === 0 && (
                <p className="text-ink-mute">
                    In dieser Kategorie steht gerade nichts an.
                </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry) =>
                    entry.itemType === 'Activity' ? (
                        <OfferCard
                            key={entry.activity._id}
                            itemType="Activity"
                            id={entry.activity._id}
                            title={entry.activity.title}
                            description={entry.activity.description}
                            image={entry.activity.image}
                            category={label}
                            dateLabel={formatDate(entry.activity.date)}
                            isFavorite={isFavorite(
                                'Activity',
                                entry.activity._id,
                            )}
                            onToggleFavorite={
                                enabled
                                    ? () =>
                                          toggle('Activity', entry.activity._id)
                                    : undefined
                            }
                        />
                    ) : (
                        <OfferCard
                            key={entry.event._id}
                            itemType="ScrapedEvent"
                            id={entry.event._id}
                            title={entry.event.title}
                            description={entry.event.description}
                            category={label}
                            dateLabel={formatDate(entry.event.startDate)}
                            locationLabel={entry.event.locationName}
                            href={entry.event.sourceUrl}
                            isFavorite={isFavorite(
                                'ScrapedEvent',
                                entry.event._id,
                            )}
                            onToggleFavorite={
                                enabled
                                    ? () =>
                                          toggle(
                                              'ScrapedEvent',
                                              entry.event._id,
                                          )
                                    : undefined
                            }
                        />
                    ),
                )}
            </div>

            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-4">
                    <button
                        className="btn-secondary disabled:opacity-40 cursor-pointer"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Zurück
                    </button>
                    <span className="text-sm text-ink-mute">
                        Seite {page} von {totalPages}
                    </span>
                    <button
                        className="btn-secondary disabled:opacity-40 cursor-pointer"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Weiter
                    </button>
                </div>
            )}
        </div>
    );
};

export default EventKategorie;
