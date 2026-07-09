import type { RequestHandler } from 'express';
import { ScrapedEvent } from '#models';
import { scrapedEventOutputSchema } from '#schemas';

const PAGE_SIZE = 50;

export const getEvents: RequestHandler = async (req, res, next) => {
    try {
        const { category, from, page } = req.query;
        const currentPage = Math.max(1, Number(page) || 1);

        const match: Record<string, unknown> = {};
        if (category) match.category = category;
        if (from) match.startDate = { $gte: new Date(from as string) };

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
