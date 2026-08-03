import { z } from 'zod';
import { objectIdSchema } from './shared.ts';

// 1. TimeSlot Schema
const timeSlotUserSchema = z.object({
    open: z.number().int().min(0).max(1439),
    close: z.number().int().min(0).max(1439),
});

// 2. BusinessHours Schema
const businessHoursUserSchema = z.object({
    monday: z.array(timeSlotUserSchema),
    tuesday: z.array(timeSlotUserSchema),
    wednesday: z.array(timeSlotUserSchema),
    thursday: z.array(timeSlotUserSchema),
    friday: z.array(timeSlotUserSchema),
    saturday: z.array(timeSlotUserSchema),
    sunday: z.array(timeSlotUserSchema),
});

// 3. Haupt-Schema: Beratung
export const beratungZodSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, 'Titel wird benötigt')
        .max(100, 'Titel kann nicht länger als 100 Zeichen lang sein.'),

    image: z.string().min(1, 'Bild wird benötigt'),

    description: z.string().trim().min(1, 'Beschreibung wird benötigt'),

    openingHours: businessHoursUserSchema,

    location: z.object({
        type: z.literal('Point').default('Point'),
        coordinates: z
            .array(z.number())
            .length(
                2,
                'Koordinaten müssen exakt [Längengrad, Breitengrad] enthalten',
            ),
    }),

    userId: objectIdSchema,

    tags: z.array(z.string()).default([]),
});

export const beratungOutputSchema = beratungZodSchema.extend({
    _id: objectIdSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const populatedBeratungSchema = beratungOutputSchema.extend({
    userId: z.object({
        _id: objectIdSchema,
        name: z.string().optional(),
    }),
});

// image is optional on input: fileUploadHandler / controller supply a fallback
export const beratungCreateBodySchema = beratungZodSchema
    .omit({ userId: true })
    .extend({ image: z.string().optional() });
export const beratungPatchBodySchema = beratungZodSchema
    .partial()
    .omit({ userId: true });

export type BeratungInput = z.infer<typeof beratungZodSchema>;
export type BeratungOutput = z.infer<typeof beratungOutputSchema>;
export type PopulatedBeratungOutput = z.infer<typeof populatedBeratungSchema>;
export type BeratungCreateBody = z.infer<typeof beratungCreateBodySchema>;
export type BeratungPatchBody = z.infer<typeof beratungPatchBodySchema>;
