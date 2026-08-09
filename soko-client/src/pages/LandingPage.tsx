import { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';
import { formatDate } from '../utils/formatDate';
import type { Activity, Beratung, Category, EventsPage } from '../types';
import { NavLink } from 'react-router';
import { AiOutlineCalendar, AiOutlineNotification } from 'react-icons/ai';
import { IoChatbubblesOutline } from 'react-icons/io5';
import { useAuth } from '../context/auth-context';
import OfferCard from '../components/OfferCard';
import ChatModal from '../components/ChatModal';
import { useFavorites } from '../hooks/useFavorites';
import StatCard from '../components/StatCard';
import Pagination from '../components/Pagination';
import SearchFilter from '../components/SearchFilter';
import { useFilters } from '../hooks/useFilters';

const PAGE_SIZE = 9;

const LandingPage = () => {
    const { user } = useAuth();
    const { isFavorite, toggle, enabled } = useFavorites();
    // `toggleFilter` statt `toggle`: `useFavorites` bringt schon eines mit.
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [beratungCount, setBeratungCount] = useState(0);
    const [activityPage, setActivityPage] = useState(1);
    const [error, setError] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    // `/activities` kennt `tags` statt `category`, ist unpaginiert und filtert
    // (noch) nicht nach Datum — das bleibt unten clientseitig.
    const activityQuery = useMemo(() => {
        const params = new URLSearchParams(query);
        const category = params.get('category');
        params.delete('category');
        params.delete('page');
        params.delete('date');
        if (category) params.set('tags', category);
        return params.toString();
    }, [query]);

    useEffect(() => {
        api.get<Category[]>('/categories?appliesTo=activity')
            .then(setCategories)
            .catch(() => setError(true));
        api.get<Beratung[]>('/beratungen')
            .then((b) => setBeratungCount(b.length))
            .catch(() => setError(true));
    }, []);

    // Beide Listen filtert das Backend — clientseitig faende die Suche bei den
    // paginierten Events nur die gerade sichtbare Seite.
    useEffect(() => {
        api.get<EventsPage>(`/events?${query}`)
            .then(setData)
            .catch(() => setError(true));
    }, [query]);

    useEffect(() => {
        api.get<Activity[]>(`/activities?${activityQuery}`)
            .then(setActivities)
            .catch(() => setError(true));
    }, [activityQuery]);

    const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

    // Gespeichert wird der Category-Key, angezeigt das Label.
    const labelOf = (key?: string) =>
        categories.find((c) => c.key === key)?.label ?? key;

    // Nur noch das Datum filtert clientseitig: `/activities` kennt keinen
    // `date`-Parameter. Mit Auswahl genau dieser Tag, sonst alles ab heute
    // Mitternacht — dieselbe Logik wie im Backend für die Events.
    // `filters.date` ist YYYY-MM-DD; ohne Zeitanteil läse Date() das als UTC.
    const dayStart = filters.date
        ? new Date(`${filters.date}T00:00`).getTime()
        : new Date().setHours(0, 0, 0, 0);
    const dayEnd = filters.date
        ? new Date(dayStart).setDate(new Date(dayStart).getDate() + 1)
        : Infinity;
    const filteredActivities = activities.filter(
        (a) =>
            new Date(a.date).getTime() >= dayStart &&
            new Date(a.date).getTime() < dayEnd,
    );

    // Clientseitige Pagination: geladen ist ohnehin alles, und die Textsuche
    // muss über die komplette Liste laufen, nicht nur über die aktuelle Seite.
    // Beim Filtern schrumpft die Liste — geclamped statt per Effect zurückgesetzt.
    const activityPages = Math.ceil(filteredActivities.length / PAGE_SIZE);
    const currentActivityPage = Math.min(activityPage, activityPages || 1);
    const visibleActivities = filteredActivities.slice(
        (currentActivityPage - 1) * PAGE_SIZE,
        currentActivityPage * PAGE_SIZE,
    );

    return (
        <div className="mx-auto md:max-w-6xl md:p-8 pb-3 flex flex-col gap-8">
            {/* Header */}
            <h1 className="md:text-5xl text-3xl self-start md:pb-8 font-bold">
                Willkommen{' '}
                <span className="text-primary">
                    {user ? user.name : 'lieber Gast'}
                </span>
                ! Was suchst du heute?
            </h1>

            <div className="flex md:flex-row flex-col gap-3 md:min-w-3xl w-full mx-auto justify-center items-center">
                {' '}
                <NavLink
                    to="/events"
                    className="card events active:translate-y-1"
                >
                    <AiOutlineCalendar size={36} />
                    <h2 className="font-bold text-3xl">Erleben</h2>
                    <p className="text-md">Events & Angebote</p>
                </NavLink>
                <NavLink
                    to="/beratung"
                    className="card beratung active:translate-y-1"
                >
                    <AiOutlineNotification size={36} />
                    <h2 className=" font-bold text-3xl">Beratung & Hilfe</h2>
                    <p className="text-md">Kostenlos & vertraulich</p>
                </NavLink>
            </div>
            <div className="flex flex-col gap-6 items-center pt-6">
                <h3 className="text-3xl font-bold">
                    Du brauchst schnelle Hilfe und willst nicht nur stöbern?
                </h3>{' '}
                <button
                    type="button"
                    className="btn-cta flex w-full cursor-pointer sm:w-auto  font-bold text-xl active:translate-y-1"
                    onClick={() => setChatOpen(true)}
                >
                    <IoChatbubblesOutline size={36} /> Frag mich!
                </button>
            </div>

            <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />

            {/* Discover */}
            <div className="flex flex-col justify-center w-full mx-auto pt-8">
                <div className="flex md:flex-row flex-col gap-6 md:justify-between">
                    <div className="flex flex-col gap-3">
                        <h1 className="md:text-3xl text-3xl lg:text-5xl font-bold">
                            Entdecke deine Umgebung
                        </h1>
                        <p className="text-ink-soft">
                            Finde das passende für dich aus einer breiten
                            Auswahl an Angeboten
                        </p>
                        <SearchFilter
                            filters={filters}
                            setFilter={setFilter}
                            toggle={toggleFilter}
                            reset={reset}
                            activeCount={activeCount}
                            showEventFilters
                            categories={categories}
                        />
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-3 md:flex-row">
                            <StatCard
                                title="Veranstaltungen"
                                count={data?.total ?? 0}
                                description={
                                    error
                                        ? 'Konnten nicht geladen werden'
                                        : activeCount > 0 || filters.q
                                          ? 'Passend zu deinem Filter'
                                          : 'in Kassel & Umgebung'
                                }
                                className="stat-events items-center"
                            />
                            <StatCard
                                title="Beratungsangebote"
                                count={beratungCount}
                                description="Umsonst & vertraulich"
                                className="stat-beratung items-center"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {filteredActivities.length > 0 && (
                <section className="flex flex-col gap-4">
                    <h2 className="text-2xl">Angebote unserer Partner</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleActivities.map((activity) => (
                            <OfferCard
                                key={activity._id}
                                itemType="Activity"
                                id={activity._id}
                                title={activity.title}
                                description={activity.description}
                                image={activity.image}
                                category={labelOf(activity.tags[0])}
                                dateLabel={formatDate(activity.date)}
                                isFavorite={isFavorite(
                                    'Activity',
                                    activity._id,
                                )}
                                onToggleFavorite={
                                    enabled
                                        ? () => toggle('Activity', activity._id)
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                    <Pagination
                        page={currentActivityPage}
                        totalPages={activityPages}
                        onChange={setActivityPage}
                    />
                </section>
            )}
            <h2 className="text-2xl">
                Veranstaltungskalender der Stadt Kassel
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data?.events.map((event) => (
                    <OfferCard
                        key={event._id}
                        itemType="ScrapedEvent"
                        id={event._id}
                        title={event.title}
                        description={event.description}
                        category={labelOf(event.category)}
                        dateLabel={formatDate(event.startDate)}
                        locationLabel={event.locationName}
                        href={event.sourceUrl}
                        isFavorite={isFavorite('ScrapedEvent', event._id)}
                        onToggleFavorite={
                            enabled
                                ? () => toggle('ScrapedEvent', event._id)
                                : undefined
                        }
                    />
                ))}
            </div>
            <div className="pb-8">
                <Pagination
                    page={filters.page}
                    totalPages={totalPages}
                    onChange={(next) => setFilter('page', next)}
                />
            </div>
        </div>
    );
};

export default LandingPage;
