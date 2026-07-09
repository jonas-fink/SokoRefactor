import type { RequestHandler } from 'express';
import { Activity, ScrapedEvent } from '#models';

// Live category list: union of the free-form labels actually in use across
// user activities and scraped events. No dedicated collection needed.
export const getCategories: RequestHandler = async (_req, res, next) => {
    try {
        const [tags, categories] = await Promise.all([
            Activity.distinct('tags'),
            ScrapedEvent.distinct('category'),
        ]);
        const merged = [...new Set([...tags, ...categories])]
            .filter(
                (c): c is string => typeof c === 'string' && c.trim() !== '',
            )
            .sort((a, b) => a.localeCompare(b, 'de'));
        res.json({ data: merged });
    } catch (error: unknown) {
        next(error);
    }
};
