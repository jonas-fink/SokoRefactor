import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../utils/api';
import PageHeader from '../components/PageHeader';
import OfferCard from '../components/OfferCard';
import SearchFilter from '../components/SearchFilter';
import OrtFilter from '../components/OrtFilter';
import MapView, { type MapMarker } from '../components/map/MapView';
import { formatDate } from '../utils/formatDate';
import { useFilters } from '../hooks/useFilters';
import { useCategories } from '../hooks/useCategories';
import { useFavorites } from '../hooks/useFavorites';
import type { Activity, Beratung } from '../types';

const Karte = () => {
    const {
        filters,
        setFilter,
        setFilters,
        toggle: toggleFilter,
        reset,
        activeCount,
        query,
    } = useFilters();
    const { categories, labelOf } = useCategories();
    const { isFavorite, toggle, enabled } = useFavorites();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [beratungen, setBeratungen] = useState<Beratung[]>([]);
    const [error, setError] = useState('');
    const locate = useRef<(() => void) | null>(null);

    const baseQuery = useMemo(() => {
        const params = new URLSearchParams(query);
        const category = params.get('category');
        params.delete('category');
        params.delete('page');
        if (category) params.set('tags', category);
        return params;
    }, [query]);

    const activityQuery = useMemo(() => {
        const params = new URLSearchParams(baseQuery);
        params.delete('date');
        return params.toString();
    }, [baseQuery]);

    const beratungQuery = useMemo(() => {
        const params = new URLSearchParams(baseQuery);
        params.delete('date');
        params.delete('free');
        return params.toString();
    }, [baseQuery]);

    useEffect(() => {
        api.get<Activity[]>(`/activities?${activityQuery}`)
            .then(setActivities)
            .catch(() => setError('Angebote konnten nicht geladen werden'));
    }, [activityQuery]);

    useEffect(() => {
        api.get<Beratung[]>(`/beratungen?${beratungQuery}`)
            .then(setBeratungen)
            .catch(() =>
                setError('Beratungsstellen konnten nicht geladen werden'),
            );
    }, [beratungQuery]);

    const markers: MapMarker[] = useMemo(
        () => [
            ...activities.map((a) => ({
                id: a._id,
                lng: a.location.coordinates[0],
                lat: a.location.coordinates[1],
                title: a.title,
                href: `/angebot/Activity/${a._id}`,
            })),
            ...beratungen.map((b) => ({
                id: b._id,
                lng: b.location.coordinates[0],
                lat: b.location.coordinates[1],
                title: b.title,
                href: `/beratung/detail/${b._id}`,
            })),
        ],
        [activities, beratungen],
    );

    const center = useMemo(
        (): [number, number] | undefined =>
            filters.lng !== undefined && filters.lat !== undefined
                ? [filters.lng, filters.lat]
                : undefined,
        [filters.lng, filters.lat],
    );

    return (
        <div className="mx-auto flex flex-col gap-6 pb-3 md:max-w-6xl md:p-8">
            <PageHeader
                title="In deiner Nähe"
                subtitle="Angebote und Beratungsstellen auf der Karte"
            />

            <div className="rounded-card h-[60dvh] overflow-hidden">
                <MapView
                    center={center}
                    markers={markers}
                    onGeolocate={(lng, lat) =>
                        setFilters({
                            lng,
                            lat,
                            distance: filters.distance ?? 5,
                        })
                    }
                    onLocateReady={(trigger) => {
                        locate.current = trigger;
                    }}
                />
            </div>

            {error && <p className="text-error">{error}</p>}
            {!error && markers.length === 0 && (
                <p className="text-ink-mute">
                    Hier steht gerade nichts an – erweitere den Umkreis oder
                    setze die Filter zurück.
                </p>
            )}

            <OrtFilter
                filters={filters}
                setFilter={setFilter}
                setFilters={setFilters}
                onLocate={() => locate.current?.()}
            />

            <SearchFilter
                filters={filters}
                setFilter={setFilter}
                toggle={toggleFilter}
                reset={reset}
                activeCount={activeCount}
                categories={categories}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activities.map((a) => (
                    <OfferCard
                        key={a._id}
                        itemType="Activity"
                        id={a._id}
                        title={a.title}
                        description={a.description}
                        image={a.image}
                        category={labelOf(a.tags[0])}
                        dateLabel={formatDate(a.date)}
                        locationLabel={a.address}
                        isFavorite={isFavorite('Activity', a._id)}
                        onToggleFavorite={
                            enabled
                                ? () => toggle('Activity', a._id)
                                : undefined
                        }
                    />
                ))}
                {beratungen.map((b) => (
                    <OfferCard
                        key={b._id}
                        itemType="Beratung"
                        id={b._id}
                        to={`/beratung/detail/${b._id}`}
                        title={b.title}
                        description={b.description}
                        image={b.image}
                        category={labelOf(b.tags[0])}
                        locationLabel={b.address}
                        isFavorite={isFavorite('Beratung', b._id)}
                        onToggleFavorite={
                            enabled
                                ? () => toggle('Beratung', b._id)
                                : undefined
                        }
                    />
                ))}
            </div>
        </div>
    );
};

export default Karte;
