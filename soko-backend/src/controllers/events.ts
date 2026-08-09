import type { RequestHandler } from 'express';
import { ScrapedEvent } from '#models';
import { scrapedEventOutputSchema, type FilterQuery } from '#schemas';
import { buildFilter } from '#utils';

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

export const getEvents: RequestHandler<
    unknown,
    unknown,
    unknown,
    FilterQuery
> = async (req, res, next) => {
    try {
        const { category, date, page } = req.query;
        const currentPage = page ?? 1;

        // `q`/`lang`/`for` kommen als `$and` — `$or` unten ist fuer die
        // Datumslogik belegt.
        const match: Record<string, unknown> = { ...buildFilter(req.query) };
        if (category) match.category = category;

        if (date) {
            match.startDate = dayRange(date);
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
