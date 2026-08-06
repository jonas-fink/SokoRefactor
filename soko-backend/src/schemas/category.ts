import { z } from 'zod';
import { objectIdSchema } from './shared.ts';

export const categoryAppliesToSchema = z.enum(['activity', 'beratung']);

export const categoryOutputSchema = z.object({
    _id: objectIdSchema,
    key: z.string(),
    label: z.string(),
    appliesTo: z.array(categoryAppliesToSchema).default([]),
    colorToken: z.string().optional(),
});

export type CategoryAppliesTo = z.infer<typeof categoryAppliesToSchema>;
export type CategoryOutput = z.infer<typeof categoryOutputSchema>;
