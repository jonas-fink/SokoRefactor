import { z } from 'zod';
import { AUDIENCE_KEYS, LANGUAGE_KEYS } from '#utils';

/**
 * **Ein** Query-Schema fuer alle drei Listenrouten. `validateQuery` ersetzt
 * `req.query` durch das Ergebnis — was hier fehlt, kommt im Controller nicht an.
 * Deshalb steht auch die Umkreissuche der Activities mit drin.
 */

/** `"de,ar"` → `['de','ar']`, unbekannter Key → 400 statt stiller Leerliste. */
const csvOf = (allowed: ReadonlySet<string>, label: string) =>
    z
        .string()
        .transform((s) =>
            s
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean),
        )
        .refine((keys) => keys.every((k) => allowed.has(k)), {
            message: `Unbekannter Wert für ${label}`,
        })
        .optional();

export const filterQuerySchema = z.object({
    q: z.string().trim().max(100).optional(),
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'date muss YYYY-MM-DD sein')
        .optional(),
    tags: z.string().optional(),
    category: z.string().optional(),
    lang: csvOf(LANGUAGE_KEYS, 'lang'),
    for: csvOf(AUDIENCE_KEYS, 'for'),
    free: z.literal('1').optional(),
    page: z.coerce.number().int().min(1).optional(),

    // Umkreissuche — Activities und Beratungen, beide mit 2dsphere-Index.
    // ScrapedEvents haben nur optionale Koordinaten und bleiben aussen vor.
    lng: z.coerce.number().optional(),
    lat: z.coerce.number().optional(),
    distance: z.coerce.number().positive().optional(),
});

export type FilterQuery = z.infer<typeof filterQuerySchema>;
