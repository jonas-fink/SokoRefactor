import { z } from 'zod';
import { objectIdSchema } from './shared.ts';

export const favoritableTypeSchema = z.enum([
    'Activity',
    'ScrapedEvent',
    'Beratung',
]);

export const favoriteSchema = z.object({
    userId: objectIdSchema.describe('The Id of the user who is favoriting'),
    itemType: favoritableTypeSchema.describe('The model of the favorited item'),
    itemId: objectIdSchema.describe('The Id of the favorited item'),
});

export const favoriteDocumentSchema = favoriteSchema.extend({
    _id: objectIdSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});

// ponytail: ein gemeinsames Minimal-Shape statt drei Varianten — typspezifische
// Felder sind optional. Unbekannte Keys strippt zod ohnehin.
export const populatedFavoriteSchema = favoriteDocumentSchema.extend({
    itemId: z.object({
        _id: objectIdSchema,
        title: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        tags: z.array(z.string()).optional(),
        date: z.date().optional(),
        price: z.number().optional(),
        startDate: z.date().optional(),
        openingHours: z.record(z.string(), z.unknown()).optional(),
        location: z
            .object({
                type: z.literal('Point'),
                coordinates: z.array(z.number()).length(2),
            })
            .optional(),
        locationName: z.string().optional(),
        sourceUrl: z.string().optional(),
    }),
});

export type FavoriteInput = z.infer<typeof favoriteSchema>;
export type FavoriteOutput = z.infer<typeof favoriteDocumentSchema>;
export type PopulatedFavoriteOutput = z.infer<typeof populatedFavoriteSchema>;
