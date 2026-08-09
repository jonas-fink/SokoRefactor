import type { RequestHandler } from 'express';
import { ScrapedEvent } from '#models';
import { scrapedEventOutputSchema } from '#schemas';

// 9 = 3 Reihen im 3-spaltigen Grid, damit die Seite kurz bleibt und
// eher gefiltert als gescrollt wird.
const PAGE_SIZE = 9;

const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

// `date` ist YYYY-MM-DD und meint genau diesen Tag. Ohne Zeitanteil läse Date()
// das als UTC — der Scraper schreibt aber Serverzeit. Nicht +24h rechnen: an den
// Zeitumstellungs-Sonntagen hat der Tag 23 bzw. 25 Stunden.
export const dayRange = (date: string) => {
    const day = new Date(`${date}T00:00`);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    return { $gte: day, $lt: nextDay };
};

// Substring statt $text-Index: gesucht wird tippend, und ein Text-Index findet
// nur ganze Woerter ("kaff" faende "Kaffeetrinken" nicht). Regex-Sonderzeichen
// werden escaped, sonst wird die Eingabe zum Suchmuster.
// ponytail: Collection-Scan. Ab ~zehntausenden Events auf Atlas Search
// bzw. einen $text-Index mit Prefix-Handling wechseln.
export const searchFilter = (q: string) => {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return { $or: [{ title: rx }, { description: rx }, { category: rx }] };
};

export const getEvents: RequestHandler = async (req, res, next) => {
    try {
        const { category, date, page, q } = req.query;
        const currentPage = Math.max(1, Number(page) || 1);

        const match: Record<string, unknown> = {};
        if (category) match.category = category;

        // Als $and, weil $or unten schon fuer die Datumslogik belegt ist.
        const search = typeof q === 'string' && q.trim();
        if (search) match.$and = [searchFilter(search)];

        if (date) {
            match.startDate = dayRange(date as string);
        } else {
            // Vergangene Veranstaltungen haben auf der Startseite nichts zu
            // suchen. Ab Mitternacht, damit ein Event von heute Mittag nicht
            // schon vormittags verschwindet. Events ohne Datum ("Termin offen")
            // sind nicht vergangen — sie bleiben drin und sortieren ans Ende.
            match.$or = [
                { startDate: { $gte: startOfToday() } },
                { startDate: null },
            ];
        }

        const [events, total] = await Promise.all([
            ScrapedEvent.aggregate([
                { $match: match },
                // startDate ascending, but events without a date go last
                {
                    $addFields: {
                        _noDate: {
                            $cond: [{ $ifNull: ['$startDate', false] }, 0, 1],
                        },
                    },
                },
                { $sort: { _noDate: 1, startDate: 1 } },
                { $skip: (currentPage - 1) * PAGE_SIZE },
                { $limit: PAGE_SIZE },
            ]),
            ScrapedEvent.countDocuments(match),
        ]);

        res.json({
            data: {
                events: events.map((e) => scrapedEventOutputSchema.parse(e)),
                total,
                page: currentPage,
                pageSize: PAGE_SIZE,
            },
        });
    } catch (error: unknown) {
        next(error);
    }
};

export const getEventById: RequestHandler = async (req, res, next) => {
    try {
        const event = await ScrapedEvent.findById(req.params.id).lean();
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        res.json({ data: scrapedEventOutputSchema.parse(event) });
    } catch (error: unknown) {
        next(error);
    }
};
