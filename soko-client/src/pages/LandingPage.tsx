import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { Activity, Category, ScrapedEvent } from '../types';
import { NavLink } from 'react-router';
import { AiOutlineCalendar, AiOutlineNotification } from 'react-icons/ai';
import { useAuth } from '../context/auth-context';
import OfferCard from '../components/OfferCard';
import ChatModal from '../components/ChatModal';
import { useFavorites } from '../hooks/useFavorites';

interface EventsPage {
    events: ScrapedEvent[];
    total: number;
    page: number;
    pageSize: number;
}

const formatDate = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
          })
        : 'Termin offen';

const LandingPage = () => {
    const { user } = useAuth();
    const { isFavorite, toggle, enabled } = useFavorites();
    const [query, setQuery] = useState('');
    const [data, setData] = useState<EventsPage | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [category, setCategory] = useState('');
    const [from, setFrom] = useState('');
    const [page, setPage] = useState(1);
    const [error, setError] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        // Nur Chips, die auf Angebote/Events passen — Beratungs-Keys
        // haetten hier nie einen Treffer.
        api.get<Category[]>('/categories?appliesTo=activity')
            .then(setCategories)
            .catch(() => setError(true));
        api.get<Activity[]>('/activities')
            .then(setActivities)
            .catch(() => setError(true));
    }, []);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page) });
        if (category) params.set('category', category);
        if (from) params.set('from', from);
        api.get<EventsPage>(`/events?${params}`)
            .then(setData)
            .catch(() => setError(true));
    }, [page, category, from]);

    const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

    // Gespeichert wird der Category-Key, angezeigt das Label.
    const labelOf = (key?: string) =>
        categories.find((c) => c.key === key)?.label ?? key;

    const matchesQuery = (...fields: (string | undefined)[]) =>
        fields.some((f) => f?.toLowerCase().includes(query.toLowerCase()));

    const filteredData = data?.events.filter((d) =>
        matchesQuery(d.title, d.description, d.category),
    );

    // Activities werden clientseitig gefiltert — GET /activities kennt weder
    // Pagination noch Textsuche, die Liste ist klein.
    // Vergangenes fliegt raus, genau wie bei den Events (dort filtert das
    // Backend). Ab Mitternacht, damit ein Angebot von heute Mittag nicht schon
    // vormittags verschwindet.
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const filteredActivities = activities.filter(
        (a) =>
            (!category || a.tags.includes(category)) &&
            new Date(a.date).getTime() >= startOfToday &&
            matchesQuery(a.title, a.description, ...a.tags),
    );

    return (
        <div className="mx-auto w-full py-8 flex flex-col gap-8">
            {/* Header */}
            <h1 className="md:text-5xl text-3xl">
                Guten Tag {user ? user.name : 'Guest'}. Was suchst du heute?
            </h1>
            <button
                type="button"
                className="btn-primary w-full cursor-pointer sm:w-auto sm:self-start"
                onClick={() => setChatOpen(true)}
            >
                Ich weiß nicht, wo ich anfangen soll
            </button>
            <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />

            <div className="flex gap-3 pb-8">
                <div className="card bg-brand flex flex-col justify-center items-center w-1/2 shadow-card">
                    {' '}
                    <NavLink to="/erleben" className="flex flex-col gap-2 p-4">
                        <AiOutlineCalendar size={24} />
                        <h2 className="font-bold text-xl">Erleben</h2>
                        <p className="text-md">Events & Angebote</p>
                    </NavLink>
                </div>

                <div className="card bg-warning text-primary-ink w-1/2 flex flex-col justify-center items-center shadow-card">
                    <NavLink to="/beratung" className="flex flex-col gap-2 p-4">
                        <AiOutlineNotification size={24} />
                        <h2 className="text-primary-ink font-bold text-xl">
                            Beratung & Hilfe
                        </h2>
                        <p className="text-md">Kostenlos & vertraulich</p>
                    </NavLink>
                </div>
            </div>

            {/* Discover */}
            <div className="flex flex-col lg:flex-row justify-center items-start gap-3">
                <div className="flex flex-col gap-2 flex-1">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl">
                        Entdecke deine Nachbarschaft
                    </h1>
                    <h3 className="text-ink-soft">
                        {error
                            ? 'Angebote konnten nicht geladen werden'
                            : `${data?.total ?? '…'} Angebote & Events rund aus dem Kasseler Veranstaltungskalender`}
                    </h3>
                </div>
                <div className="flex w-full flex-wrap gap-3 flex-1">
                    <input
                        type="search"
                        className="field w-full"
                        placeholder="Suche nach Schlagwort..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex w-full flex-nowrap gap-3">
                        <input
                            type="date"
                            className="field shrink-0"
                            value={from}
                            onChange={(e) => {
                                setFrom(e.target.value);
                                setPage(1);
                            }}
                        />
                        {from && (
                            <button
                                className="btn-secondary text-error"
                                onClick={() => {
                                    setFrom('');
                                    setPage(1);
                                }}
                            >
                                X
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {/* Kategorie-Chips */}
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    className={category ? 'chip' : 'chip-active'}
                    onClick={() => {
                        setCategory('');
                        setPage(1);
                    }}
                >
                    Alle
                </button>
                {categories.map((c) => (
                    <button
                        key={c.key}
                        type="button"
                        className={
                            category === c.key
                                ? 'chip-active cursor-pointer'
                                : 'chip cursor-pointer'
                        }
                        onClick={() => {
                            setCategory(c.key);
                            setPage(1);
                        }}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {filteredActivities.length > 0 && (
                <section className="flex flex-col gap-4">
                    <h2 className="text-2xl">Angebote aus der Nachbarschaft</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredActivities.map((activity) => (
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
                </section>
            )}

            <div className="mt-8 grid snap-x snap-mandatory auto-cols-[minmax(280px,1fr)] grid-flow-col grid-rows-2 gap-4 overflow-x-auto pb-4 pt-2">
                {filteredData?.map((event) => (
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

export default LandingPage;
