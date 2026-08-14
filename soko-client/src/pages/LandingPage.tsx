import { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';
import { formatDate } from '../utils/formatDate';
import type { Activity, Beratung, Category, EventsPage } from '../types';
import { NavLink } from 'react-router';
import { AiOutlineCalendar, AiOutlineNotification } from 'react-icons/ai';
import { IoChatbubblesOutline } from 'react-icons/io5';
import OfferCard from '../components/OfferCard';
import ChatModal from '../components/ChatModal';
import { useFavorites } from '../hooks/useFavorites';
import StatCard from '../components/StatCard';
import Pagination from '../components/Pagination';
import SearchFilter from '../components/SearchFilter';
import { useFilters } from '../hooks/useFilters';
import Logo from '../components/Logo';

const PAGE_SIZE = 9;

const LandingPage = () => {
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
            <header className="relative isolate grid items-center gap-8 md:grid-cols-[1.3fr_1fr] md:gap-12 md:py-6">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-28 -left-20 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
                />
                <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
                    <span className="chip bg-primary-soft text-primary">
                        Kassel Sozial Kompass
                    </span>
                    <h1 className="text-4xl font-bold text-balance lg:text-5xl">
                        Lost in Kassel?
                    </h1>
                    <p className="max-w-prose text-lg text-pretty text-ink-soft">
                        <span className="font-semibold text-primary">
                            KSoKo
                        </span>{' '}
                        hilft dir, dich zu orientieren: Hilfsangebote und
                        Events, smart gefiltert nach deinen Bedürfnissen und
                        deiner individuellen Situation. Alle Angebote sind{' '}
                        <span className="font-semibold text-primary">
                            günstig
                        </span>{' '}
                        und{' '}
                        <span className="font-semibold text-primary">
                            freiwillig
                        </span>
                        .
                    </p>
                </div>
                <div className="order-first flex justify-center md:order-0">
                    <Logo width={280} />
                </div>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
                <NavLink
                    to="/events"
                    className="card events hover:-translate-y-0.5 active:translate-y-1"
                >
                    <AiOutlineCalendar size={36} />
                    <h2 className="text-2xl font-bold">Erleben</h2>
                    <p className="text-ink-soft">Events & Angebote</p>
                </NavLink>
                <NavLink
                    to="/beratung"
                    className="card beratung hover:-translate-y-0.5 active:translate-y-1"
                >
                    <AiOutlineNotification size={36} />
                    <h2 className="text-2xl font-bold">Beratung & Hilfe</h2>
                    <p className="text-ink-soft">Kostenlos & vertraulich</p>
                </NavLink>
            </div>
            <section className="flex flex-col items-center gap-5 py-6 text-center">
                <h2 className="max-w-2xl text-3xl font-bold text-balance">
                    Du brauchst schnelle Hilfe und willst nicht nur stöbern?
                </h2>
                <button
                    type="button"
                    className="btn-cta flex w-full cursor-pointer text-xl font-bold hover:-translate-y-0.5 active:translate-y-1 sm:w-auto sm:px-8"
                    onClick={() => setChatOpen(true)}
                >
                    <IoChatbubblesOutline size={32} /> Frag mich!
                </button>
            </section>
            <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
            {/* Discover */}
            <section className="flex flex-col gap-6 pt-4">
                <div className="grid gap-6 md:grid-cols-2 md:items-end">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl font-bold text-balance lg:text-4xl">
                            Entdecke deine Umgebung
                        </h2>
                        <p className="max-w-prose text-ink-soft text-pretty">
                            Finde das Passende für dich aus einer breiten
                            Auswahl an Angeboten.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
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
                <SearchFilter
                    filters={filters}
                    setFilter={setFilter}
                    toggle={toggleFilter}
                    reset={reset}
                    activeCount={activeCount}
                    showEventFilters
                    categories={categories}
                />
            </section>
            {filteredActivities.length > 0 && (
                <section className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h2 className="text-2xl font-bold">
                            Angebote unserer Partner
                        </h2>
                        <span className="text-sm text-ink-mute">
                            {filteredActivities.length}{' '}
                            {filteredActivities.length === 1
                                ? 'Angebot'
                                : 'Angebote'}
                        </span>
                    </div>
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
            <section className="flex flex-col gap-4 pb-8">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 className="text-2xl font-bold">
                        Veranstaltungskalender der Stadt Kassel
                    </h2>
                    {data && (
                        <span className="text-sm text-ink-mute">
                            {data.total}{' '}
                            {data.total === 1
                                ? 'Veranstaltung'
                                : 'Veranstaltungen'}
                        </span>
                    )}
                </div>
                {error && !data && (
                    <p className="card bg-surface p-6 text-center text-ink-soft">
                        Die Veranstaltungen konnten nicht geladen werden.
                    </p>
                )}
                {!data && !error && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: PAGE_SIZE }, (_, i) => (
                            <div
                                key={i}
                                className="card h-56 animate-pulse bg-surface-2"
                            />
                        ))}
                    </div>
                )}
                {data?.events.length === 0 && (
                    <div className="card flex flex-col items-center gap-3 bg-surface p-8 text-center">
                        <p className="text-ink-soft">
                            Keine Veranstaltungen passen zu deiner Suche.
                        </p>
                        <button
                            type="button"
                            className="btn-secondary cursor-pointer"
                            onClick={reset}
                        >
                            Filter zurücksetzen
                        </button>
                    </div>
                )}
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
                <Pagination
                    page={filters.page}
                    totalPages={totalPages}
                    onChange={(next) => setFilter('page', next)}
                />
            </section>
        </div>
    );
};

export default LandingPage;
