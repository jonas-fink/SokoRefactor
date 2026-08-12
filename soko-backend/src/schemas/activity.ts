import { z } from 'zod';
import { objectIdSchema } from './shared.ts';

// Activities kommen als multipart/form-data rein (ActivityForm.tsx), d.h.
// `date` und `price` sind Strings — deshalb `coerce` statt `z.date()`/`z.number()`.
const activitySchema = z.object({
    title: z.string().trim().min(5, 'Title is required'),
    image: z.preprocess(
        (v) => (Array.isArray(v) ? v[0] : v),
        z
            .url({ protocol: /^https?$/, hostname: z.regexes.domain })
            .default('https://placehold.net/600x600.png'),
    ),
    description: z.string().trim().min(1, 'Description is required'),
    date: z.coerce.date(),
    price: z.coerce.number().min(0).default(0),
    location: z.object({
        type: z.literal('Point').default('Point'),
        coordinates: z
            .array(z.number())
            .length(2, 'Coordinates must be [longitude, latitude'),
    }),
    userId: objectIdSchema,
    tags: z.array(z.string().trim()).default([]),

    // Leer = keine Angabe = matcht immer. Alt-Dokumente ohne die Felder laufen
    // deshalb ueber `default([])` durch, statt beim Lesen in einen 500 zu kippen.
    availableLanguages: z.array(z.string().trim()).default([]),
    targetAudience: z.array(z.string().trim()).default([]),
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

// Laengenlimits nur auf dem Eingang: `activityOutputSchema` parst auch
// Bestandsdokumente, ein nachtraegliches `.max()` dort wuerde alte Eintraege
// beim Lesen in einen 500 kippen.
const bodyLimits = {
    title: z
        .string()
        .trim()
        .min(5, 'Title is required')
        .max(100, 'Titel kann nicht länger als 100 Zeichen lang sein.'),
    description: z
        .string()
        .trim()
        .min(1, 'Description is required')
        .max(5000, 'Beschreibung kann nicht länger als 5000 Zeichen sein.'),
};

export const activityCreateBodySchema = activitySchema
    .omit({ userId: true })
    .extend(bodyLimits);
export const activityPatchBodySchema = activitySchema
    .omit({ userId: true })
    .extend(bodyLimits)
    .partial();

export type ActivityInput = z.infer<typeof activitySchema>;
export type ActivityOutput = z.infer<typeof activityOutputSchema>;
export type PopulatedActivityOutput = z.infer<typeof populatedActivitySchema>;
export type ActivityCreateBody = z.infer<typeof activityCreateBodySchema>;
export type ActivityPatchBody = z.infer<typeof activityPatchBodySchema>;
