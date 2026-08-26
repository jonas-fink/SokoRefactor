import { z } from 'zod';
import { Types } from 'mongoose';

export const objectIdSchema = z
    .union([
        z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
        z.instanceof(Types.ObjectId),
    ])
    .transform(String);

/**
 * Kontaktfelder von Activity und Beratung. Beide Formulare schicken
 * multipart/form-data, und ein leeres Eingabefeld kommt dort als `''` an —
 * ohne das Umwandeln landet der leere String in der Datenbank, statt dass das
 * Feld geraeumt wird. Muster uebernommen aus `schemas/feedback.ts`.
 */
export const optionalEmail = z
    .union([z.email('Keine gültige E-Mail-Adresse').max(254), z.literal('')])
    .optional()
    .transform((v) => v || undefined);

/**
 * Bewusst ohne Format-Pruefung fuer Telefonnummern: Durchwahlen („0561 787-0"),
 * internationale Praefixe und Leerzeichen brechen an jedem Muster, das man
 * dafuer schreibt — und ein abgelehnter gueltiger Anschluss ist teurer als ein
 * krummer Eintrag. `type="tel"` im Formular reicht.
 */
export const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .optional()
        .transform((v) => v || undefined);

/**
 * Website des Anbieters. Dasselbe Muster wie beim `image` in `schemas/activity.ts`:
 * ohne `protocol` liesse zod auch `javascript:` und `mailto:` durch, und beides
 * landet ungefiltert in einem `href` auf der Detailseite.
 */
export const optionalUrl = z
    .union([
        z
            .url({ protocol: /^https?$/, hostname: z.regexes.domain })
            .max(500, 'Adresse ist zu lang'),
        z.literal(''),
    ])
    .optional()
    .transform((v) => v || undefined);

/**
 * Haeufige Fragen, optional. `default([])` statt `optional()`, damit
 * Bestandsdokumente ohne das Feld beim Lesen nicht in einen 500 kippen —
 * dieselbe Begruendung wie bei `availableLanguages`.
 */
export const faqSchema = z
    .array(
        z.object({
            question: z.string().trim().min(1, 'Frage fehlt').max(200),
            answer: z.string().trim().min(1, 'Antwort fehlt').max(2000),
        }),
    )
    .default([]);

/**
 * Body-Schema fuer PATCH: wie `.partial()`, aber ohne die `default()`s.
 *
 * `.partial()` allein macht die Felder nur optional — die Vorgabewerte bleiben
 * stehen und greifen, sobald der Schluessel im Body fehlt. Ein PATCH, der nur
 * den Titel aendert, bekaeme damit `tags: []`, `services: []` und `price: 0`
 * dazu und wuerde genau die Felder leeren, die er gar nicht anfasst. Fehlt hier
 * ein Schluessel, soll er das gespeicherte Dokument nicht beruehren — deshalb
 * wird die Default-Huelle vorher abgezogen.
 *
 * Gilt automatisch fuer jedes spaeter ergaenzte Feld mit `default()`; die Probe
 * dazu steht in `shared.test.ts`.
 */
type Undefault<T> = T extends z.ZodDefault<infer Inner> ? Inner : T;

export const patchBodySchema = <T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
) =>
    z
        .object(
            Object.fromEntries(
                Object.entries(schema.shape).map(([key, field]) => [
                    key,
                    field instanceof z.ZodDefault ? field.unwrap() : field,
                ]),
            ) as { [K in keyof T]: Undefault<T[K]> },
        )
        .partial();

export const preferredContactSchema = z
    .enum(['phone', 'email', 'address'])
    .optional();

export type PreferredContact = z.infer<typeof preferredContactSchema>;

/**
 * Der gewaehlte Kontaktweg braucht die zugehoerige Angabe — sonst zeigt die
 * Detailseite „am besten per E-Mail" ohne Mailadresse.
 *
 * Gilt nur fuer volle Bodies (Create/PUT). Auf einem `.partial()`-Patch-Schema
 * waere die Pruefung falsch: dort kann `preferredContact` allein im Body
 * stehen, waehrend das Feld, auf das es zeigt, im gespeicherten Dokument liegt.
 */
export const hasContactForPreferred = (
    v: { preferredContact?: PreferredContact } & Record<string, unknown>,
) => !v.preferredContact || Boolean(v[v.preferredContact]);

export const preferredContactError = {
    path: ['preferredContact'],
    message: 'Für den gewählten Kontaktweg fehlt die Angabe',
};
