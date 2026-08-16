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
