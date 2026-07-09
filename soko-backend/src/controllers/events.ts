import type { RequestHandler } from 'express';
import { ScrapedEvent } from '#models';
import { scrapedEventOutputSchema } from '#schemas';

export const getEvents: RequestHandler = async (req, res, next) => {
    try {
        const { category, from } = req.query;
        const query: Record<string, unknown> = {};

        if (category) query.category = category;
        if (from) query.startDate = { $gte: new Date(from as string) };

        const events = await ScrapedEvent.find(query)
            .sort({ startDate: 1 })
            .lean();
        res.json({ data: events.map((e) => scrapedEventOutputSchema.parse(e)) });
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
