import type { RequestHandler } from 'express';
import { Category } from '#models';
import { categoryAppliesToSchema, categoryOutputSchema } from '#schemas';

// Kuratierte Taxonomie aus der Category-Collection — kein distinct()-Union
// ueber freie Tags mehr. `?appliesTo=beratung` filtert auf einen Bereich.
export const getCategories: RequestHandler = async (req, res, next) => {
    try {
        const { appliesTo } = req.query;
        const filter = categoryAppliesToSchema.safeParse(appliesTo);
        const categories = await Category.find(
            filter.success ? { appliesTo: filter.data } : {},
        )
            .sort('label')
            .lean();
        res.json({
            data: categories.map((c) => categoryOutputSchema.parse(c)),
        });
    } catch (error: unknown) {
        next(error);
    }
};
