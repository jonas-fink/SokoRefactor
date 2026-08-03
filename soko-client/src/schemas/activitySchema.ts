import { z } from 'zod';

export const activityFormSchema = z.object({
    title: z.string().min(5, 'Mindestens 5 Zeichen'),
    description: z.string().min(1, 'required'),
    date: z.string().min(1, 'required'),
    price: z.number().min(0, 'Kein negativer Preis'),
    lng: z.number().min(-180).max(180),
    lat: z.number().min(-90).max(90),
    tags: z.string().optional(),
});

export type ActivityFormData = z.infer<typeof activityFormSchema>;
