import { z } from 'zod';

export const activityFormSchema = z.object({
    title: z.string().min(5, 'Mindestens 5 Zeichen'),
    description: z.string().min(1, 'required'),
    date: z.string().min(1, 'required'),
    price: z.number().min(0, 'Kein negativer Preis'),
    lng: z.number().min(-180).max(180),
    lat: z.number().min(-90).max(90),
    // Keys aus geschlossenen Listen (`GET /categories`, `GET /vocabulary`),
    // kein Freitext — das Backend prueft dieselben Whitelists.
    tags: z.array(z.string()),
    availableLanguages: z.array(z.string()),
    targetAudience: z.array(z.string()),
});

export type ActivityFormData = z.infer<typeof activityFormSchema>;
