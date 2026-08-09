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

// 3. Dokumente & Services
// `_id` ist optional, weil dasselbe Schema Ein- und Ausgabe beschreibt: beim
// Anlegen schickt der Client nur `{ name }`, Mongoose vergibt die IDs.
const documentUserSchema = z.object({
    _id: objectIdSchema.optional(),
    title: z.string().trim().min(1),
    s3Key: z.string().min(1),
    mimeType: z.string().min(1),
    // coerce, weil dasselbe Schema Mongoose-`Date`s *und* den ISO-String liest,
    // den der Client aus einem vorherigen GET zurueckschickt.
    uploadedAt: z.coerce.date().optional(),
});

const serviceUserSchema = z.object({
    _id: objectIdSchema.optional(),
    name: z.string().trim().min(1, 'Name des Angebots wird benötigt'),
    documents: z.array(documentUserSchema).default([]),
});

// 4. Haupt-Schema: Beratung
export const beratungZodSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, 'Titel wird benötigt')
        .max(100, 'Titel kann nicht länger als 100 Zeichen lang sein.'),

    image: z.string().min(1, 'Bild wird benötigt'),

    description: z.string().trim().min(1, 'Beschreibung wird benötigt'),

    // optional wie im Modell — eine Beratung ohne hinterlegte Zeiten ist gueltig
    // und darf beim Lesen nicht in einen 500 laufen (trifft spaeter den Import).
    openingHours: businessHoursUserSchema.optional(),

    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    services: z.array(serviceUserSchema).default([]),

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

    // Leer = keine Angabe = matcht immer. Alt-Dokumente ohne die Felder laufen
    // deshalb ueber `default([])` durch, statt beim Lesen in einen 500 zu kippen.
    availableLanguages: z.array(z.string()).default([]),
    targetAudience: z.array(z.string()).default([]),

    // Nur bei importierten Datensätzen gesetzt (siehe docs/PARTNER-IMPORT.md).
    externalId: z.string().trim().min(1).optional(),
    source: z.string().trim().min(1).optional(),
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

// Der Body traegt nur den Titel — `s3Key`/`mimeType` entstehen erst, wenn der
// Controller die Datei nach der Validierung hochlaedt.
export const beratungDocumentBodySchema = documentUserSchema.pick({
    title: true,
});

export type BeratungInput = z.infer<typeof beratungZodSchema>;
export type BeratungOutput = z.infer<typeof beratungOutputSchema>;
export type PopulatedBeratungOutput = z.infer<typeof populatedBeratungSchema>;
export type BeratungCreateBody = z.infer<typeof beratungCreateBodySchema>;
export type BeratungPatchBody = z.infer<typeof beratungPatchBodySchema>;
export type BeratungDocumentBody = z.infer<typeof beratungDocumentBodySchema>;
