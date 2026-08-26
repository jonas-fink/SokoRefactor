import { z } from 'zod';
import {
    contactFields,
    hasContactForPreferred,
    preferredContactError,
} from './contactSchema.ts';

export const activityFormSchema = z
    .object({
        title: z.string().min(5, 'Mindestens 5 Zeichen'),
        description: z.string().min(1, 'Beschreibung wird benötigt'),
        date: z.string().min(1, 'Datum wird benötigt'),
        price: z.number().min(0, 'Kein negativer Preis'),
        url: z
            .union([
                z.url('Bitte eine vollständige Adresse mit https://'),
                z.literal(''),
            ])
            .optional(),
        // Leere Zeilen filtert der Submit heraus — hier kein `min(1)`, sonst
        // blockiert eine versehentlich angelegte Leerzeile das Speichern.
        faq: z.array(z.object({ question: z.string(), answer: z.string() })),
        lng: z.number().min(-180).max(180),
        lat: z.number().min(-90).max(90),
        // Keys aus geschlossenen Listen (`GET /categories`, `GET /vocabulary`),
        // kein Freitext — das Backend prueft dieselben Whitelists.
        tags: z.array(z.string()),
        availableLanguages: z.array(z.string()),
        targetAudience: z.array(z.string()),
        ...contactFields,
    })
    .refine(hasContactForPreferred, preferredContactError);

export type ActivityFormData = z.infer<typeof activityFormSchema>;
