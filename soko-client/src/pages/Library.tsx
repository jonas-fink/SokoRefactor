import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { api } from '../utils/api';
import OfferCard from '../components/OfferCard';
import {
    WEEKDAY_LABELS,
    daysInMonth,
    firstWeekdayOffset,
    monthLabel,
} from '../utils/calendar';
import type { Favorite } from '../types';
import { AiOutlineArrowLeft } from 'react-icons/ai';

/** Activity hat `date`, ScrapedEvent `startDate`, Beratung keins. */
const itemDate = (fav: Favorite) => fav.itemId.date ?? fav.itemId.startDate;

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

const Library = () => {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [tab, setTab] = useState<'liste' | 'monat'>('liste');
    const [cursor, setCursor] = useState(() => new Date());
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        api.get<Favorite[]>('/favorites')
            .then(setFavorites)
            .catch(() => setError(true));
    }, []);

    // In der Sammlung ist alles gemerkt — der Herz-Button entfernt nur.
    const remove = async (fav: Favorite) => {
        const before = favorites;
        setFavorites((prev) => prev.filter((f) => f._id !== fav._id));
        try {
            await api.delete(`/favorites/${fav.itemType}/${fav.itemId._id}`);
        } catch {
            setFavorites(before);
        }
    };

    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const shiftMonth = (delta: number) =>
        setCursor(new Date(year, month + delta, 1));

    const byDay = new Map<number, Favorite[]>();
    for (const fav of favorites) {
        const iso = itemDate(fav);
        if (!iso) continue;
        const d = new Date(iso);
        if (d.getFullYear() !== year || d.getMonth() !== month) continue;
        const day = d.getDate();
        byDay.set(day, [...(byDay.get(day) ?? []), fav]);
    }

    const cells = [
        ...Array<null>(firstWeekdayOffset(year, month)).fill(null),
        ...Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1),
    ];

    return (
        <div className="mx-auto md:max-w-6xl md:p-8 flex flex-col gap-6">
            <div className="flex gap-3 items-center">
                <button
                    className="card bg-surface p-2 cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <AiOutlineArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold">Deine Sammlung</h1>
            </div>

            <div className="flex gap-2">
                {(['liste', 'monat'] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        className={`cursor-pointer ${tab === t ? 'chip-active' : 'chip'}`}
                        onClick={() => setTab(t)}
                    >
                        {t === 'liste' ? 'Liste' : 'Monat'}
                    </button>
                ))}
            </div>

            {error && (
                <p className="text-error">
                    Sammlung konnte nicht geladen werden.
                </p>
            )}

            {!error && favorites.length === 0 && (
                <p className="text-ink-soft">
                    Noch nichts gemerkt — tippe auf das Herz bei einem Angebot.
                </p>
            )}

            {tab === 'liste' ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {favorites.map((fav) => {
                        const iso = itemDate(fav);
                        return (
                            <OfferCard
                                key={fav._id}
                                itemType={fav.itemType}
                                id={fav.itemId._id}
                                title={fav.itemId.title}
                                description={fav.itemId.description}
                                image={fav.itemId.image}
                                category={fav.itemId.tags?.[0]}
                                dateLabel={iso ? formatDate(iso) : undefined}
                                locationLabel={fav.itemId.locationName}
                                href={fav.itemId.sourceUrl}
                                isFavorite
                                onToggleFavorite={() => remove(fav)}
                            />
                        );
                    })}
                </div>
            ) : (
                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            className="btn-secondary cursor-pointer"
                            onClick={() => shiftMonth(-1)}
                        >
                            Zurück
                        </button>
                        <h2 className="text-xl">{monthLabel(year, month)}</h2>
                        <button
                            type="button"
                            className="btn-secondary cursor-pointer"
                            onClick={() => shiftMonth(1)}
                        >
                            Weiter
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-sm text-ink-mute">
                        {WEEKDAY_LABELS.map((d) => (
                            <span key={d}>{d}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((day, i) =>
                            day === null ? (
                                <div key={`leer-${i}`} />
                            ) : (
                                <div
                                    key={day}
                                    className="min-h-24 rounded-control bg-surface-2 p-1 text-left"
                                >
                                    <span className="text-xs text-ink-mute">
                                        {day}
                                    </span>
                                    {byDay.get(day)?.map((fav) => (
                                        <NavLink
                                            key={fav._id}
                                            to={`/angebot/${fav.itemType}/${fav.itemId._id}`}
                                            className="mt-1 block truncate rounded-chip bg-primary px-2 py-0.5 text-xs text-primary-ink"
                                            title={fav.itemId.title}
                                        >
                                            {fav.itemId.title}
                                        </NavLink>
                                    ))}
                                </div>
                            ),
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default Library;
