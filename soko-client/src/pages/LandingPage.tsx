import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { ScrapedEvent } from '../types';

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
    const [query, setQuery] = useState('');
    const [data, setData] = useState<EventsPage | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [category, setCategory] = useState('');
    const [from, setFrom] = useState('');
    const [page, setPage] = useState(1);
    const [error, setError] = useState(false);

    useEffect(() => {
        api.get<string[]>('/categories')
            .then(setCategories)
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

    const filteredData = data?.events.filter(
        (d) =>
            d.title.toLowerCase().includes(query.toLowerCase()) ||
            d.description.toLowerCase().includes(query.toLowerCase()) ||
            d.category.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <div className="mx-auto w-full py-8">
            <div className="flex flex-col lg:flex-row justify-center items-start gap-3">
                <div className="flex flex-col gap-2 flex-1">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl">Entdecke deine Nachbarschaft</h1>
                    <h3 className="text-ink-soft">
                        {error
                            ? 'Angebote konnten nicht geladen werden'
                            : `${data?.total ?? '…'} Angebote & Beratungsstellen rund um Kassel`}
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
                        <select
                            className="field flex-1 min-w-0"
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">Alle Kategorien</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
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

            <div className="mt-8 grid snap-x snap-mandatory auto-cols-[minmax(280px,1fr)] grid-flow-col grid-rows-2 gap-4 overflow-x-auto pb-4 pt-2">
                {filteredData?.map((event) => (
                    <a
                        key={event._id}
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="card block cursor-pointer snap-start p-5 transition-transform hover:-translate-y-0.5"
                    >
                        {event.category && (
                            <span className="chip mb-3">{event.category}</span>
                        )}
                        <h4 className="text-lg">{event.title}</h4>
                        {event.description && (
                            <p className="mt-2 line-clamp-3 text-sm text-ink-soft">
                                {event.description}
                            </p>
                        )}
                        <p className="mt-3 text-sm text-ink-mute">
                            {formatDate(event.startDate)}
                            {event.locationName && ` · ${event.locationName}`}
                        </p>
                    </a>
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
