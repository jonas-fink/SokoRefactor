import { z } from 'zod';
import { objectIdSchema } from './shared.ts';

const ActivityTags = [
    'Sport',
    'Essen',
    'Kultur',
    'Musik',
    'Natur',
    'Gaming',
    'Soziales',
    'Workshop',
    'Familie',
] as const;

const activitySchema = z.object({
    title: z.string().min(5, 'Title is required'),
    image: z.preprocess(
        (v) => (Array.isArray(v) ? v[0] : v),
        z
            .url({ protocol: /^https?$/, hostname: z.regexes.domain })
            .default('https://placehold.net/600x600.png'),
    ),
    description: z.string().min(1, 'Description is required'),
    date: z.date(),
    price: z.number().default(0),
    location: z.object({
        type: z.literal('Point').default('Point'),
        coordinates: z
            .array(z.number())
            .length(2, 'Coordinates must be [longitude, latitude'),
    }),
    userId: objectIdSchema,
    tags: z.array(z.enum(ActivityTags)).default([]),
});

export const activityOutputSchema = activitySchema.extend({
    _id: objectIdSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const populatedActivitySchema = activityOutputSchema.extend({
    userId: z.object({
        _id: objectIdSchema,
        name: z.string().optional(),
        email: z.string(),
    }),
});

export const activityCreateBodySchema = activitySchema.omit({ userId: true });
export const activityPatchBodySchema = activitySchema
    .partial()
    .omit({ userId: true });

export type ActivityInput = z.infer<typeof activitySchema>;
export type ActivityOutput = z.infer<typeof activityOutputSchema>;
export type PopulatedActivityOutput = z.infer<typeof populatedActivitySchema>;
export type ActivityCreateBody = z.infer<typeof activityCreateBodySchema>;
export type ActivityPatchBody = z.infer<typeof activityPatchBodySchema>;
