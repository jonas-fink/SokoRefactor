import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';
// Mit Endung, damit `useFilters.test.ts` das Modul unter `node --test` laden
// kann — der Node-Resolver ergaenzt kein `.ts`.
import { useAuth } from '../context/auth-context.ts';
import type { Preferences } from '../types';

/**
 * Der Filterzustand **ist** die URL. Kein Context, kein Store: damit ist jede
 * Ansicht teilbar und bookmarkbar, der Zurück-Button funktioniert filterweise,
 * und das Zurücksetzen von `page` steht an genau einer Stelle statt in jedem
 * Handler.
 *
 * Die Feldnamen spiegeln das Query-Vokabular des Backends
 * (`soko-backend/src/schemas/filters.ts`) — ein Vokabular, nicht zwei.
 */
export type Filters = {
    q: string;
    date: string;
    category: string;
    lang: string[];
    for: string[];
    free: boolean;
    page: number;
    /** Umkreissuche der Kartenansicht. Nur zusammen sinnvoll: ohne `lng`/`lat`
     *  gibt es keinen Mittelpunkt und `distance` bleibt wirkungslos. */
    lng?: number;
    lat?: number;
    distance?: number;
};

const csv = (value: string | null) =>
    (value ?? '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

/** Zahl oder gar nichts — `''`, `'abc'` und ein fehlender Parameter landen
 *  gleichermassen bei `undefined` statt bei `NaN` in der URL. */
const num = (value: string | null) => {
    const n = Number(value);
    return value !== null && value !== '' && Number.isFinite(n)
        ? n
        : undefined;
};

/**
 * URL → Filter. Bewusst nachsichtig: eine kaputte `page` wird zu 1, statt die
 * Seite scheitern zu lassen. Die **Werte** von `lang`/`for` prüft das Backend
 * (400 mit Klartext) — eine zweite Whitelist im Client wäre ein zweites
 * Vokabular, das getrennt veraltet.
 */
export const parseFilters = (params: URLSearchParams): Filters => ({
    q: params.get('q')?.trim() ?? '',
    date: params.get('date')?.trim() ?? '',
    category: params.get('category')?.trim() ?? '',
    lang: csv(params.get('lang')),
    for: csv(params.get('for')),
    free: params.get('free') === '1',
    page: Math.max(1, Number(params.get('page')) || 1),
    lng: num(params.get('lng')),
    lat: num(params.get('lat')),
    distance: num(params.get('distance')),
});

/**
 * Filter → URL. Nur Gesetztes landet drin, sonst steht bei jedem Seitenaufruf
 * `?q=&date=&page=1` im Adressfeld und der Zurück-Button wird unbrauchbar.
 */
export const toQuery = (filters: Filters): URLSearchParams => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.date) params.set('date', filters.date);
    if (filters.category) params.set('category', filters.category);
    if (filters.lang.length) params.set('lang', filters.lang.join(','));
    if (filters.for.length) params.set('for', filters.for.join(','));
    if (filters.free) params.set('free', '1');
    if (filters.page > 1) params.set('page', String(filters.page));
    // Ein Radius ohne Mittelpunkt filtert nichts — dann steht er auch nicht
    // in der URL.
    if (filters.lng !== undefined && filters.lat !== undefined) {
        params.set('lng', String(filters.lng));
        params.set('lat', String(filters.lat));
        if (filters.distance !== undefined)
            params.set('distance', String(filters.distance));
    }
    return params;
};

/** Wie viele Auswahlen im Panel stecken — die Zahl im Badge. `q` zählt nicht
 *  mit, das Suchfeld steht sichtbar daneben. */
export const countActive = (filters: Filters) =>
    (filters.date ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.free ? 1 : 0) +
    // Ort und Radius sind ein Filter, nicht zwei — der Radius allein zaehlt gar nicht.
    (filters.lng !== undefined && filters.lat !== undefined ? 1 : 0) +
    filters.lang.length +
    filters.for.length;

/**
 * Praeferenzen → Filter. `category` ist einwertig, `preferences.categories`
 * nicht: ponytail: bei mehreren Themen bleibt die Kategorie offen, statt eines
 * davon willkuerlich zu waehlen. Mehrfachauswahl kaeme erst mit einer
 * mehrwertigen `category`-Achse im Backend.
 */
const fromPreferences = (prefs: Preferences): URLSearchParams =>
    toQuery({
        q: '',
        date: '',
        category: prefs.categories.length === 1 ? prefs.categories[0] : '',
        lang: prefs.languages,
        for: prefs.audiences,
        free: prefs.freeOnly,
        page: 1,
    });

export const useFilters = () => {
    const [params, setParams] = useSearchParams();
    const { user } = useAuth();
    const filters = useMemo(() => parseFilters(params), [params]);
    const query = useMemo(() => toQuery(filters).toString(), [filters]);

    // Praeferenzen sind Startwerte, kein Zustand: sie schreiben die **leere**
    // URL einmal voll, danach gewinnt immer die URL — sonst liesse sich ein
    // vorgefilterter Wert nie mehr abwaehlen und „Zuruecksetzen" waere wirkungslos.
    const seeded = useRef(false);
    useEffect(() => {
        if (seeded.current || !user) return;
        seeded.current = true;
        if ([...params.keys()].length > 0 || !user.preferences) return;
        const start = fromPreferences(user.preferences);
        if (start.toString()) setParams(start, { replace: true });
    }, [user, params, setParams]);

    const write = useCallback(
        (next: Filters) => {
            const asString = toQuery(next).toString();
            // Ohne den Vergleich schiebt jeder Render einen identischen
            // History-Eintrag nach und der Zurück-Button steht still.
            if (asString !== query) setParams(toQuery(next));
        },
        [query, setParams],
    );

    /** Jede Änderung außer `page` selbst springt zurück auf Seite 1 — sonst
     *  landet man auf Seite 4 einer Liste, die nur noch zwei Seiten hat. */
    const setFilter = useCallback(
        <K extends keyof Filters>(key: K, value: Filters[K]) =>
            write({
                ...filters,
                [key]: value,
                ...(key === 'page' ? {} : { page: 1 }),
            }),
        [filters, write],
    );

    /**
     * Mehrere Achsen in **einem** Schreibvorgang. Zwei `setFilter` hintereinander
     * lesen denselben `filters`-Stand — die URL aktualisiert sich erst beim
     * naechsten Render — und nur der letzte Aufruf ueberlebt. Ort und Umkreis
     * gehoeren aber zusammen.
     */
    const setFilters = useCallback(
        (patch: Partial<Filters>) =>
            write({
                ...filters,
                ...patch,
                ...('page' in patch ? {} : { page: 1 }),
            }),
        [filters, write],
    );

    /** Ein Wert einer Mehrfachauswahl an/aus (Sprach- und Zielgruppen-Chips). */
    const toggle = useCallback(
        (key: 'lang' | 'for', value: string) =>
            setFilter(
                key,
                filters[key].includes(value)
                    ? filters[key].filter((v) => v !== value)
                    : [...filters[key], value],
            ),
        [filters, setFilter],
    );

    const reset = useCallback(
        () => setParams(new URLSearchParams()),
        [setParams],
    );

    return {
        filters,
        setFilter,
        setFilters,
        toggle,
        reset,
        activeCount: countActive(filters),
        /** Serialisierte Filter für `api.get` — und als Effect-Dependency. */
        query,
    };
};
