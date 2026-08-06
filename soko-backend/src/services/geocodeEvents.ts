import { ScrapedEvent } from '#models';
import { geocode, type GeocodeResult } from '#utils';

type PendingEvent = {
    _id: unknown;
    locationName: string;
    municipality?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** "Stadthalle" + "Kassel" -> die Suchanfrage an Nominatim. */
export function venueQuery(e: PendingEvent): string {
    return `${e.locationName}, ${e.municipality || 'Kassel'}`;
}

/**
 * Ein Veranstaltungsort taucht im Kalender dutzendfach auf. Ohne diese
 * Gruppierung fragt der Lauf denselben Ort dutzendfach ab — bei einer
 * Anfrage pro Sekunde ist das der Unterschied zwischen Minuten und Stunden.
 */
export function groupByVenue(events: PendingEvent[]): Map<string, unknown[]> {
    const groups = new Map<string, unknown[]>();
    for (const e of events) {
        const q = venueQuery(e);
        const ids = groups.get(q);
        if (ids) ids.push(e._id);
        else groups.set(q, [e._id]);
    }
    return groups;
}

/**
 * Holt Koordinaten fuer alle Events, die noch keine haben und noch nie
 * versucht wurden. `geocodedAt` wird auch bei Misserfolg gesetzt: manche
 * Veranstaltungsorte loest Nominatim schlicht nicht auf, und die sollen
 * nicht bei jedem Lauf erneut abgefragt werden.
 */
export async function geocodeMissingEvents({
    geocoder = geocode,
    // ponytail: 1 Anfrage/Sekunde ist die Nominatim-Nutzungsgrenze. Wer
    // schneller will, braucht einen eigenen Geocoder, nicht ein kleineres Delay.
    delayMs = 1000,
}: {
    geocoder?: (q: string) => Promise<GeocodeResult | null>;
    delayMs?: number;
} = {}) {
    const pending = (await ScrapedEvent.find({
        location: null,
        geocodedAt: null,
        locationName: { $ne: '' },
    })
        .select('_id locationName municipality')
        .lean()) as PendingEvent[];

    const groups = groupByVenue(pending);
    const now = new Date();
    const ops = [];
    let resolved = 0;
    let first = true;

    for (const [query, ids] of groups) {
        if (!first) await sleep(delayMs);
        first = false;

        let hit: GeocodeResult | null = null;
        try {
            hit = await geocoder(query);
        } catch (err) {
            // Ein Ausfall des Geocoders darf den Lauf nicht abbrechen —
            // ohne `geocodedAt` wird der Ort beim naechsten Mal erneut versucht.
            console.warn(`Geocoding fehlgeschlagen (${query}):`, err);
            continue;
        }

        const update: Record<string, unknown> = { geocodedAt: now };
        if (hit) {
            update.location = {
                type: 'Point',
                coordinates: [hit.lng, hit.lat],
            };
            resolved += ids.length;
        }
        ops.push({
            updateMany: { filter: { _id: { $in: ids } }, update: { $set: update } },
        });
    }

    if (ops.length > 0) await ScrapedEvent.bulkWrite(ops, { ordered: false });

    return { attempted: pending.length, lookups: groups.size, resolved };
}
