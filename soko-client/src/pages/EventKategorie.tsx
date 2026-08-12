import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { api } from '../utils/api';
import PageHeader from '../components/PageHeader';
import { formatDate } from '../utils/formatDate';
import { CATEGORY_META } from '../categoryMeta';
import OfferCard from '../components/OfferCard';
import Pagination from '../components/Pagination';
import SearchFilter from '../components/SearchFilter';
import { useFilters } from '../hooks/useFilters';
import { useFavorites } from '../hooks/useFavorites';
import type { Activity, Category, EventsPage } from '../types';

const EventKategorie = () => {
    const { key = '' } = useParams();
    const { isFavorite, toggle, enabled } = useFavorites();
    const {
        filters,
        setFilter,
        toggle: toggleFilter,
        reset,
        activeCount,
        query,
    } = useFilters();
    const [data, setData] = useState<EventsPage | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [label, setLabel] = useState('Events');
    const [error, setError] = useState('');

    const meta = CATEGORY_META[key];

    // Die Kategorie steht in der Route, nicht im Panel — sie kommt hier dazu.
    const eventQuery = useMemo(() => {
        const params = new URLSearchParams(query);
        params.set('category', key);
        return params.toString();
    }, [query, key]);

    // `/activities` kennt `tags` statt `category` und keinen `date`-Parameter.
    const activityQuery = useMemo(() => {
        const params = new URLSearchParams(query);
        params.delete('page');
        params.delete('date');
        params.set('tags', key);
        return params.toString();
    }, [query, key]);

    useEffect(() => {
        // Label kommt aus der Taxonomie, nicht aus einer zweiten lokalen Liste.
        api.get<Category[]>('/categories?appliesTo=activity')
            .then((cats) =>
                setLabel(cats.find((c) => c.key === key)?.label ?? 'Events'),
            )
            .catch(() => setLabel('Events'));
    }, [key]);

    useEffect(() => {
        api.get<Activity[]>(`/activities?${activityQuery}`)
            .then(setActivities)
            .catch(() => setError('Angebote konnten nicht geladen werden'));
    }, [activityQuery]);

    useEffect(() => {
        // Ein Kategoriewechsel setzt `page` zurueck, also laufen kurz zwei
        // Anfragen. Ohne das Flag koennte die alte als letzte ankommen und die
        // richtige Liste ueberschreiben.
        let cancelled = false;
        api.get<EventsPage>(`/events?${eventQuery}`)
            .then((res) => !cancelled && setData(res))
            .catch(
                () =>
                    !cancelled &&
                    setError('Events konnten nicht geladen werden'),
            );
        return () => {
            cancelled = true;
        };
    }, [eventQuery]);

    const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

    // Vergangenes fliegt raus — bei den Events filtert das Backend, bei den
    // Activities niemand. Mit Datumsauswahl genau dieser Tag, sonst alles ab
    // heute Mitternacht, damit ein Angebot von heute Mittag nicht schon
    // vormittags verschwindet. `from` ist YYYY-MM-DD; ohne Zeitanteil würde
    // Date() das als UTC lesen.
    const dayStart = filters.date
        ? new Date(`${filters.date}T00:00`).getTime()
        : new Date().setHours(0, 0, 0, 0);
    const dayEnd = filters.date
        ? new Date(dayStart).setDate(new Date(dayStart).getDate() + 1)
        : Infinity;

    // Activities sind wenige und unpaginiert, sie erscheinen nur auf
    // Seite 1. Wenn es mehr werden, gehoeren sie in die Events-Aggregation.
    const entries = [
        ...(filters.page === 1
            ? activities
                  .filter(
                      (a) =>
                          new Date(a.date).getTime() >= dayStart &&
                          new Date(a.date).getTime() < dayEnd,
                  )
                  .map((a) => ({
                      itemType: 'Activity' as const,
                      activity: a,
                      time: new Date(a.date).getTime(),
                  }))
            : []),
        // Events kommen vom Backend schon gefiltert.
        ...(data?.events ?? []).map((e) => ({
            itemType: 'ScrapedEvent' as const,
            event: e,
            // Ohne Datum ans Ende, genau wie in der Sortierung des Backends.
            time: e.startDate ? new Date(e.startDate).getTime() : Infinity,
        })),
    ].sort((a, b) => a.time - b.time);

    return (
        <div className="flex flex-col gap-6 md:max-w-6xl mx-auto md:p-8 pb-3">
            <PageHeader
                title={label}
                icon={<span className={meta?.accent}>{meta?.icon}</span>}
            />
            {meta && <p className="text-ink-soft">{meta.description}</p>}

            <SearchFilter
                filters={filters}
                setFilter={setFilter}
                toggle={toggleFilter}
                reset={reset}
                activeCount={activeCount}
                showEventFilters
            />

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

            <div className="mt-6">
                <Pagination
                    page={filters.page}
                    totalPages={totalPages}
                    onChange={(next) => setFilter('page', next)}
                />
            </div>
        </div>
    );
};

export default EventKategorie;
