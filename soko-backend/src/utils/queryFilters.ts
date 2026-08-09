import { AUDIENCE_KEYS, LANGUAGE_KEYS } from './filterVocabulary.ts';

/**
 * Ein Query-Vokabular fuer alle drei Listenrouten (`events`, `activities`,
 * `beratungen`). Drei Aufrufer — genau das N=3, ab dem der `ponytail:`-Hinweis
 * in `controllers/beratungen.ts` das Faktorisieren freigibt.
 */

/** Was `buildFilter` aus `req.query` liest — strukturell, damit `#utils` nicht
 *  auf `#schemas` zeigen muss (`schemas/filters.ts` importiert von hier). */
export type FilterQueryInput = {
    q?: string;
    lang?: string[];
    for?: string[];
    free?: string;
};

// Substring statt $text-Index: gesucht wird tippend, und ein Text-Index findet
// nur ganze Woerter ("kaff" faende "Kaffeetrinken" nicht). Regex-Sonderzeichen
// werden escaped, sonst wird die Eingabe zum Suchmuster.
// ponytail: Collection-Scan. Ab ~zehntausenden Datensaetzen auf Atlas Search
// bzw. einen $text-Index mit Prefix-Handling wechseln.
export const searchFilter = (q: string) => {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return { $or: [{ title: rx }, { description: rx }, { category: rx }] };
};

/**
 * Leer heisst „keine Angabe" und matcht **immer**. Ohne diese Regel liesse der
 * erste Sprachfilter den kompletten Altbestand verschwinden.
 *
 * Drei Faelle, nicht zwei: `$size: 0` matcht nur ein tatsaechlich vorhandenes
 * leeres Array. Dokumente von **vor** Phase 12 haben das Feld gar nicht —
 * Mongooses `default: []` greift beim Schreiben, nicht rueckwirkend. Genau die
 * faengt `$exists: false`, und genau die waeren sonst unsichtbar.
 */
const emptyOrIn = (field: string, keys: string[]) => ({
    $or: [
        { [field]: { $in: keys } },
        { [field]: { $size: 0 } },
        { [field]: { $exists: false } },
    ],
});

const known = (values: string[] | undefined, allowed: ReadonlySet<string>) =>
    (values ?? []).filter((v) => allowed.has(v));

/**
 * Query-Parameter → Mongo-Fragment. Leere Query → `{}`.
 *
 * Alle Bedingungen landen unter `$and`, weil `emptyOrIn` und `searchFilter`
 * jeweils ein eigenes `$or` mitbringen — nebeneinander im selben Objekt wuerde
 * sich das gegenseitig ueberschreiben. `$or` auf oberster Ebene bleibt damit
 * frei fuer die Datumslogik der Events.
 *
 * `hasPrice` nur fuer Activities: Beratungen sind kostenlos und kassel.de
 * liefert keine Preise.
 * ponytail: `free=1` ist damit ein Activity-Filter. Bekommen Events irgendwann
 * echte Preise, gehoert `price` in deren Modell — nicht vorher auf Verdacht.
 */
export const buildFilter = (
    query: FilterQueryInput,
    hasPrice = false,
): Record<string, unknown> => {
    const and: Record<string, unknown>[] = [];

    const q = query.q?.trim();
    if (q) and.push(searchFilter(q));

    const languages = known(query.lang, LANGUAGE_KEYS);
    if (languages.length) and.push(emptyOrIn('availableLanguages', languages));

    const audiences = known(query.for, AUDIENCE_KEYS);
    if (audiences.length) and.push(emptyOrIn('targetAudience', audiences));

    if (query.free === '1' && hasPrice) and.push({ price: 0 });

    return and.length ? { $and: and } : {};
};
