interface SearchFilterProps {
    query: string;
    onQuery: (value: string) => void;
    /** Ohne `onDate` bleibt das Datumsfeld weg — Beratungen haben keine Termine. */
    date?: string;
    onDate?: (value: string) => void;
}

const SearchFilter = ({ query, onQuery, date, onDate }: SearchFilterProps) => (
    <div className="flex md:flex-nowrap md:flex-row md:items-end flex-col gap-3">
        <input
            type="search"
            className="field flex-1 min-w-0"
            placeholder="Suche nach Schlagwort..."
            value={query}
            onChange={(e) => onQuery(e.target.value)}
        />
        {onDate && (
            <div className="flex flex-col gap-1 shrink-0">
                {/* Sichtbares Label: ein leeres Datumsfeld sagt von sich aus
                    nicht, wofür es da ist. */}
                <label htmlFor="date-filter" className="text-sm text-ink-mute">
                    Datum
                </label>
                <div className="relative">
                    <input
                        id="date-filter"
                        type="date"
                        className="field pr-14 w-full md:min-w-0"
                        value={date ?? ''}
                        onChange={(e) => onDate(e.target.value)}
                    />
                    {date && (
                        // right-9: links neben dem nativen Picker-Indikator,
                        // nicht darüber.
                        <button
                            type="button"
                            className="text-error absolute right-9 top-1/2 -translate-y-1/2 cursor-pointer text-sm leading-none"
                            aria-label="Datum zurücksetzen"
                            onClick={() => onDate('')}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        )}
    </div>
);

export default SearchFilter;
