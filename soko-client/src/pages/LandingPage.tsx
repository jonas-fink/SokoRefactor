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

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="md:flex-wrap flex flex-col justify-center items-start gap-3">
                <div>
                    {' '}
                    <h1 className="text-5xl">Entdecke deine Nachbarschaft</h1>
                    <h3 className="text-ink-soft">
                        {error
                            ? 'Angebote konnten nicht geladen werden'
                            : `${data?.total ?? '…'} Angebote & Beratungsstellen rund um Kassel`}
                    </h3>
                </div>

                <div className="flex md:flex-nowrap flex-wrap gap-3">
                    <select
                        className="field"
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
                        className="field"
                        value={from}
                        onChange={(e) => {
                            setFrom(e.target.value);
                            setPage(1);
                        }}
                    />
                    {from && (
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setFrom('');
                                setPage(1);
                            }}
                        >
                            Datum zurücksetzen
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-8 grid snap-x snap-mandatory auto-cols-[minmax(280px,1fr)] grid-flow-col grid-rows-2 gap-4 overflow-x-auto pb-4">
                {data?.events.map((event) => (
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
                        className="btn-secondary disabled:opacity-40"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Zurück
                    </button>
                    <span className="text-sm text-ink-mute">
                        Seite {page} von {totalPages}
                    </span>
                    <button
                        className="btn-secondary disabled:opacity-40"
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
