import { z } from 'zod';
import { objectIdSchema } from './shared.ts';

export const favoriteSchema = z.object({
    userId: objectIdSchema.describe('The Id of the user who is favoriting'),
    activityId: objectIdSchema.describe(
        'The Id of the activity being favorited',
    ),
});

export const favoriteDocumentSchema = favoriteSchema.extend({
    _id: objectIdSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const populatedFavoriteSchema = favoriteDocumentSchema.extend({
    activityId: z.object({
        _id: objectIdSchema,
        title: z.string(),
        description: z.string(),
        date: z.date(),
        price: z.number().default(0),
        image: z.string().optional(),
        tags: z.array(z.string()).default([]),
        location: z.object({
            type: z.literal('Point'),
            coordinates: z.array(z.number()).length(2),
        }),
    }),
});

export type FavoriteInput = z.infer<typeof favoriteSchema>;
export type FavoriteOutput = z.infer<typeof favoriteDocumentSchema>;
export type PopulatedFavoriteOutput = z.infer<typeof populatedFavoriteSchema>;
