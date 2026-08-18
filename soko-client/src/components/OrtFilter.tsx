import { useState } from 'react';
import { MdOutlineMyLocation } from 'react-icons/md';
import { geocode } from '../utils/geocode';
import type { Filters } from '../hooks/useFilters';

interface OrtFilterProps {
    filters: Filters;
    setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
    /** Ort und Umkreis muessen zusammen geschrieben werden — zwei `setFilter`
     *  hintereinander wuerden sich gegenseitig ueberschreiben. */
    setFilters: (patch: Partial<Filters>) => void;
}

const DEFAULT_RADIUS = 5;

/**
 * Ort und Umkreis stehen offen auf der Seite statt im Filter-Dialog: auf der
 * Karte sind sie die Hauptachse, nicht eine Verfeinerung unter vielen.
 *
 * Ohne gesetzten Ort filtert nichts — die Karte zeigt dann alles rund um
 * Kassel. Ein Modal beim Seitenaufruf gibt es bewusst nicht.
 */
const OrtFilter = ({ filters, setFilter, setFilters }: OrtFilterProps) => {
    const [text, setText] = useState('');
    const [status, setStatus] = useState<
        'idle' | 'loading' | 'notfound' | 'error' | 'denied'
    >('idle');
    const [label, setLabel] = useState('');

    const hasOrt = filters.lng !== undefined && filters.lat !== undefined;
    const radius = filters.distance ?? DEFAULT_RADIUS;

    const setOrt = (lng: number, lat: number, name: string) => {
        // Ohne expliziten Radius stuende der Ort ohne Umkreis in der URL und
        // das Backend faende still seinen eigenen Default.
        setFilters({ lng, lat, distance: filters.distance ?? DEFAULT_RADIUS });
        setLabel(name);
        setStatus('idle');
    };

    const onSearch = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        const query = text.trim();
        if (!query) return;
        setStatus('loading');
        try {
            const hit = await geocode(query);
            if (!hit) return setStatus('notfound');
            setOrt(hit.lng, hit.lat, hit.label);
        } catch {
            setStatus('error');
        }
    };

    const onLocate = () => {
        if (!navigator.geolocation) return setStatus('denied');
        setStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (pos) =>
                setOrt(
                    pos.coords.longitude,
                    pos.coords.latitude,
                    'Dein Standort',
                ),
            // Ablehnung ist kein Fehlerfall, nur ein anderer Weg zum Ziel:
            // das Textfeld daneben bleibt bedienbar.
            () => setStatus('denied'),
        );
    };

    const clear = () => {
        setFilters({ lng: undefined, lat: undefined, distance: undefined });
        setLabel('');
        setText('');
    };

    return (
        <div className="border-line bg-surface flex flex-col gap-3 rounded-card border p-4">
            <form onSubmit={onSearch} className="flex flex-wrap gap-2">
                <input
                    type="search"
                    className="field min-w-0 flex-1"
                    placeholder="PLZ oder Ort"
                    aria-label="PLZ oder Ort"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <button type="submit" className="btn-secondary cursor-pointer">
                    Suchen
                </button>
                <button
                    type="button"
                    onClick={onLocate}
                    className="btn-secondary cursor-pointer"
                    aria-label="Meinen Standort verwenden"
                    title="Mein Standort"
                >
                    <MdOutlineMyLocation size={20} />
                </button>
            </form>

            {status === 'loading' && (
                <p className="text-ink-mute text-xs">Suche Ort…</p>
            )}
            {status === 'notfound' && (
                <p className="text-error text-xs">
                    Ort nicht gefunden – versuch es mit der Postleitzahl.
                </p>
            )}
            {status === 'error' && (
                <p className="text-error text-xs">
                    Ortssuche momentan nicht verfügbar.
                </p>
            )}
            {status === 'denied' && (
                <p className="text-ink-mute text-xs">
                    Standort nicht verfügbar – gib PLZ oder Ort ein.
                </p>
            )}

            {hasOrt ? (
                <>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-ink-soft min-w-0 truncate">
                            📍 {label || 'Gewählter Ort'}
                        </span>
                        <button
                            type="button"
                            onClick={clear}
                            className="text-ink-mute cursor-pointer underline"
                        >
                            Umkreis aufheben
                        </button>
                    </div>
                    <label className="flex flex-col gap-1 text-sm">
                        <span className="text-ink-mute">
                            Im Umkreis von {radius} km
                        </span>
                        <input
                            type="range"
                            min={1}
                            max={50}
                            step={1}
                            value={radius}
                            className="accent-primary"
                            onChange={(e) =>
                                setFilter('distance', Number(e.target.value))
                            }
                        />
                    </label>
                </>
            ) : (
                <p className="text-ink-mute text-sm">
                    Ohne Ort siehst du alle Angebote rund um Kassel.
                </p>
            )}
        </div>
    );
};

export default OrtFilter;
