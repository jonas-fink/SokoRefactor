import { useEffect, useRef, useState } from 'react';
import { useDebounced } from '../hooks/useDebounced';
import { useVocabulary } from '../hooks/useVocabulary';
import ChipGroup from './ChipGroup';
import type { Filters } from '../hooks/useFilters';
import type { Category } from '../types';
import { AiOutlineFilter } from 'react-icons/ai';

interface SearchFilterProps {
    filters: Filters;
    setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
    toggle: (key: 'lang' | 'for', value: string) => void;
    reset: () => void;
    activeCount: number;
    /** Datum und Preis gibt es nur bei Events und Angeboten — Beratungsstellen
     *  haben weder Termine noch Preise. */
    showEventFilters?: boolean;
    /** Nur die Startseite filtert über alle Kategorien; die Kategorie-Seiten
     *  stehen bereits in einer. */
    categories?: Category[];
}

const SearchFilter = ({
    filters,
    setFilter,
    toggle,
    reset,
    activeCount,
    showEventFilters = false,
    categories,
}: SearchFilterProps) => {
    const dialog = useRef<HTMLDialogElement>(null);
    // Ohne Vokabular fehlen nur die Chips; Suche und Datum stehen weiter.
    const { languages, audiences } = useVocabulary();

    // Das Eingabefeld tippt lokal, die URL bekommt es verzögert — sonst läge
    // pro Tastendruck ein History-Eintrag und ein Request.
    const [text, setText] = useState(filters.q);
    const search = useDebounced(text);

    useEffect(() => {
        if (search !== filters.q) setFilter('q', search);
        // Nur am debounced Wert haengen: `filters.q` als Dependency wuerde die
        // eigene Schreibaktion sofort wieder auslösen.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // „Zurücksetzen" und der Zurück-Button leeren die URL — das Feld zieht nach.
    useEffect(() => {
        if (filters.q === '') setText('');
    }, [filters.q]);

    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
                type="search"
                className="field min-w-0 flex-1"
                placeholder="Suche nach Schlagwort..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />

            <button
                type="button"
                className="btn-secondary shrink-0 cursor-pointer hover:bg-primary transition-color duration-300 ease-in hover:text-primary-ink active:translate-y-1"
                onClick={() => dialog.current?.showModal()}
            >
                <AiOutlineFilter size={24} />

                {activeCount > 0 && (
                    <span
                        className="chip-active px-2 py-0.5 text-xs"
                        aria-label={`${activeCount} Filter aktiv`}
                    >
                        {activeCount}
                    </span>
                )}
            </button>

            <dialog
                ref={dialog}
                className="m-auto hidden w-[min(32rem,92vw)] max-h-[85dvh] flex-col overflow-hidden rounded-card border border-line bg-surface p-0 text-ink shadow-modal open:flex backdrop:bg-black/40"
            >
                <div className="flex shrink-0 items-center justify-between border-b border-line p-4">
                    <h2 className="text-xl">Filter</h2>
                    <button
                        type="button"
                        className="label"
                        aria-label="Schließen"
                        onClick={() => dialog.current?.close()}
                    >
                        ✕
                    </button>
                </div>

                <div className="flex flex-col gap-5 overflow-y-auto p-4">
                    {showEventFilters && (
                        <div className="flex flex-col gap-1">
                            <label
                                htmlFor="date-filter"
                                className="text-sm text-ink-mute"
                            >
                                Datum
                            </label>
                            <input
                                id="date-filter"
                                type="date"
                                className="field w-full"
                                value={filters.date}
                                onChange={(e) =>
                                    setFilter('date', e.target.value)
                                }
                            />
                        </div>
                    )}

                    {categories && (
                        <div className="flex flex-col gap-2">
                            <span className="text-sm text-ink-mute">Thema</span>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className={`cursor-pointer ${
                                        filters.category
                                            ? 'chip'
                                            : 'chip-active'
                                    }`}
                                    onClick={() => setFilter('category', '')}
                                >
                                    Alle
                                </button>
                                {categories.map((c) => (
                                    <button
                                        key={c.key}
                                        type="button"
                                        className={`cursor-pointer ${
                                            filters.category === c.key
                                                ? 'chip-active'
                                                : 'chip'
                                        }`}
                                        onClick={() =>
                                            setFilter('category', c.key)
                                        }
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {languages.length > 0 && (
                        <ChipGroup
                            legend="Sprache"
                            options={languages}
                            selected={filters.lang}
                            onToggle={(k) => toggle('lang', k)}
                            hint="Angebote ohne Sprachangabe bleiben sichtbar."
                        />
                    )}

                    {audiences.length > 0 && (
                        <ChipGroup
                            legend="Für wen"
                            options={audiences}
                            selected={filters.for}
                            onToggle={(k) => toggle('for', k)}
                        />
                    )}

                    {showEventFilters && (
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                className="size-5 accent-primary"
                                checked={filters.free}
                                onChange={(e) =>
                                    setFilter('free', e.target.checked)
                                }
                            />
                            Nur kostenlose Angebote
                        </label>
                    )}
                </div>

                <div className="flex shrink-0 justify-between gap-3 border-t border-line p-4">
                    <button
                        type="button"
                        className="btn-secondary cursor-pointer"
                        onClick={reset}
                    >
                        Zurücksetzen
                    </button>
                    <button
                        type="button"
                        className="btn-primary cursor-pointer"
                        onClick={() => dialog.current?.close()}
                    >
                        Anzeigen
                    </button>
                </div>
            </dialog>
        </div>
    );
};

export default SearchFilter;
