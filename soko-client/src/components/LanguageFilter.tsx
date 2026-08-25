import { useSearchParams } from 'react-router';
import { MdOutlineTranslate } from 'react-icons/md';
import ChipGroup from './ChipGroup';
import { useVocabulary } from '../hooks/useVocabulary';
import { parseFilters, toQuery } from '../hooks/useFilters';

const LanguageFilter = () => {
    const [params, setParams] = useSearchParams();
    const { languages } = useVocabulary();
    const filters = parseFilters(params);

    const toggle = (key: string) =>
        setParams(
            toQuery({
                ...filters,
                page: 1,
                lang: filters.lang.includes(key)
                    ? filters.lang.filter((v) => v !== key)
                    : [...filters.lang, key],
            }),
        );

    if (languages.length === 0) return null;

    return (
        <details className="relative [&[open]>summary>svg:last-child]:rotate-180">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-xl px-3 py-2.75 text-sm text-ink-soft hover:text-primary">
                <MdOutlineTranslate size={24} aria-hidden />
                <span>Sprache</span>
                {filters.lang.length > 0 && (
                    <span
                        className="chip-active px-2 py-0.5 text-xs"
                        aria-label={`${filters.lang.length} Sprachen gewählt`}
                    >
                        {filters.lang.length}
                    </span>
                )}
                <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="size-4 transition-transform"
                    fill="currentColor"
                >
                    <path d="M5 8l5 5 5-5z" />
                </svg>
            </summary>

            <div className="absolute right-0 z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-4 shadow-modal md:right-auto md:left-0">
                <ChipGroup
                    legend="Angebote in dieser Sprache"
                    options={languages}
                    selected={filters.lang}
                    onToggle={toggle}
                    hint="Angebote ohne Sprachangabe bleiben sichtbar."
                />
            </div>
        </details>
    );
};

export default LanguageFilter;
