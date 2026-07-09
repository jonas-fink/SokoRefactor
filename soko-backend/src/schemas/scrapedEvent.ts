import { z } from 'zod';
import { objectIdSchema } from './shared.ts';

// Validates one record parsed from the Kassel calendar before upsert.
export const scrapedEventSchema = z.object({
    externalId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().default(''),
    startDate: z.date().nullable().optional(),
    category: z.string().default(''),
    locationName: z.string().default(''),
    municipality: z.string().default(''),
    sourceUrl: z.url(),
    source: z.string().default('kassel.de'),
});

export const scrapedEventOutputSchema = scrapedEventSchema.extend({
    _id: objectIdSchema,
    startDate: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type ScrapedEventInput = z.infer<typeof scrapedEventSchema>;
export type ScrapedEventOutput = z.infer<typeof scrapedEventOutputSchema>;
