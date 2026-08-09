import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { formatDate } from '../utils/formatDate';
import type { Activity, Beratung, Category, EventsPage } from '../types';
import { NavLink } from 'react-router';
import { AiOutlineCalendar, AiOutlineNotification } from 'react-icons/ai';
import { useAuth } from '../context/auth-context';
import OfferCard from '../components/OfferCard';
import ChatModal from '../components/ChatModal';
import { useFavorites } from '../hooks/useFavorites';
import StatCard from '../components/StatCard';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 9;

const LandingPage = () => {
    const { user } = useAuth();
    const { isFavorite, toggle, enabled } = useFavorites();
    const [query, setQuery] = useState('');
    const [data, setData] = useState<EventsPage | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [beratungCount, setBeratungCount] = useState(0);
    const [category, setCategory] = useState('');
    const [from, setFrom] = useState('');
    const [page, setPage] = useState(1);
    const [activityPage, setActivityPage] = useState(1);
    const [error, setError] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        api.get<Category[]>('/categories?appliesTo=activity')
            .then(setCategories)
            .catch(() => setError(true));
        api.get<Activity[]>('/activities')
            .then(setActivities)
            .catch(() => setError(true));
        api.get<Beratung[]>('/beratungen')
            .then((b) => setBeratungCount(b.length))
            .catch(() => setError(true));
    }, []);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page) });
        if (category) params.set('category', category);
        if (from) params.set('date', from);
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
    // Mit Datumsauswahl genau dieser Tag, sonst alles ab heute Mitternacht —
    // dieselbe Logik wie im Backend für die Events.
    // `from` ist YYYY-MM-DD; ohne Zeitanteil würde Date() das als UTC lesen.
    const dayStart = from
        ? new Date(`${from}T00:00`).getTime()
        : new Date().setHours(0, 0, 0, 0);
    const dayEnd = from
        ? new Date(dayStart).setDate(new Date(dayStart).getDate() + 1)
        : Infinity;
    const filteredActivities = activities.filter(
        (a) =>
            (!category || a.tags.includes(category)) &&
            new Date(a.date).getTime() >= dayStart &&
            new Date(a.date).getTime() < dayEnd &&
            matchesQuery(a.title, a.description, ...a.tags),
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
                Hi{' '}
                <span className="text-primary">
                    {user ? user.name : 'lieber Gast'}
                </span>
                ! Was suchst du heute?
            </h1>

            <div className="flex md:flex-row flex-col gap-3 md:min-w-3xl w-full mx-auto justify-center items-center">
                {' '}
                <NavLink to="/events" className="card events">
                    <AiOutlineCalendar size={36} />
                    <h2 className="font-bold text-3xl">Erleben</h2>
                    <p className="text-md">Events & Angebote</p>
                </NavLink>
                <NavLink to="/beratung" className="card beratung">
                    <AiOutlineNotification size={36} />
                    <h2 className=" font-bold text-3xl">Beratung & Hilfe</h2>
                    <p className="text-md">Kostenlos & vertraulich</p>
                </NavLink>
            </div>
            <div className="flex flex-col gap-6 items-center pt-6">
                <h3 className="text-3xl font-bold">
                    Du bist dir unsicher wonach du suchen sollst?
                </h3>{' '}
                <button
                    type="button"
                    className="btn-cta w-full cursor-pointer sm:w-auto  font-bold text-xl"
                    onClick={() => setChatOpen(true)}
                >
                    Frag mich!
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
                        <div className="flex md:flex-nowrap md:flex-row md:items-end flex-col gap-3">
                            <input
                                type="search"
                                className="field flex-1 min-w-0"
                                placeholder="Suche nach Schlagwort..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div className="flex flex-col gap-1 shrink-0">
                                {/* Sichtbares Label: ein leeres Datumsfeld sagt
                                    von sich aus nicht, wofür es da ist. */}
                                <label
                                    htmlFor="date-filter"
                                    className="text-sm text-ink-mute"
                                >
                                    Datum
                                </label>
                                <div className="relative">
                                    <input
                                        id="date-filter"
                                        type="date"
                                        className="field pr-14 w-full md:min-w-0"
                                        value={from}
                                        onChange={(e) => {
                                            setFrom(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                    {from && (
                                        // right-9: links neben dem nativen
                                        // Picker-Indikator, nicht darüber.
                                        <button
                                            type="button"
                                            className="text-error absolute right-9 top-1/2 -translate-y-1/2 cursor-pointer text-sm leading-none"
                                            aria-label="Datum zurücksetzen"
                                            onClick={() => {
                                                setFrom('');
                                                setPage(1);
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-3 md:flex-row">
                            <StatCard
                                title="Veranstaltungen"
                                count={data?.total ?? 0}
                                description={
                                    error
                                        ? 'Konnten nicht geladen werden'
                                        : category || from
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
            {/* Kategorie-Chips */}
            <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
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
            <div className="pb-8">
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={setPage}
                />
            </div>
        </div>
    );
};

export default LandingPage;
