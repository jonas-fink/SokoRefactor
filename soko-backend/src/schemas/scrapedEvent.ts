import { z } from 'zod';
import { objectIdSchema } from './shared.ts';

export const scrapedEventSchema = z.object({
    externalId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().default(''),
    startDate: z.date().nullable().optional(),
    category: z.string().default(''),

    // Leer = keine Angabe = matcht immer. Alt-Dokumente ohne die Felder laufen
    // deshalb ueber `default([])` durch, statt beim Lesen in einen 500 zu kippen.
    availableLanguages: z.array(z.string()).default([]),
    targetAudience: z.array(z.string()).default([]),
    locationName: z.string().default(''),
    municipality: z.string().default(''),
    sourceUrl: z.url(),
    source: z.string().default('kassel.de'),
});

export const scrapedEventOutputSchema = scrapedEventSchema.extend({
    _id: objectIdSchema,
    startDate: z.date().nullable(),
    // Optional: nur geokodierte Events haben Koordinaten.
    location: z
        .object({
            type: z.literal('Point'),
            coordinates: z.array(z.number()).length(2),
        })
        .nullish(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type ScrapedEventInput = z.infer<typeof scrapedEventSchema>;
export type ScrapedEventOutput = z.infer<typeof scrapedEventOutputSchema>;
