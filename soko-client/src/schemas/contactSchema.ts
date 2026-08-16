import { z } from 'zod';

/**
 * Kontaktangaben, gemeinsam für Activity und Beratung. Spiegelt
 * `soko-backend/src/schemas/shared.ts` — ändert sich dort etwas, ändert es sich
 * hier mit, sonst meldet erst das Backend den Fehler nach dem Absenden.
 *
 * Keine Telefon-Regex: Durchwahlen („0561 787-0") und internationale Präfixe
 * brechen an jedem Muster, das man dafür schreibt. `type="tel"` reicht.
 */
export const contactFields = {
    email: z.union([z.email('Ungültige E-Mail'), z.literal('')]).optional(),
    phone: z.string().trim().max(50).optional(),
    address: z.string().trim().max(200).optional(),
    preferredContact: z
        .union([z.enum(['phone', 'email', 'address']), z.literal('')])
        .optional(),
};

/** Der gewählte Weg braucht die zugehörige Angabe. */
export const hasContactForPreferred = (v: {
    preferredContact?: string;
    phone?: string;
    email?: string;
    address?: string;
}) =>
    !v.preferredContact ||
    Boolean(v[v.preferredContact as 'phone' | 'email' | 'address']);

export const preferredContactError = {
    path: ['preferredContact'],
    message: 'Für den gewählten Kontaktweg fehlt die Angabe',
};

export const CONTACT_OPTIONS = [
    { key: 'phone', label: 'Telefon' },
    { key: 'email', label: 'E-Mail' },
    { key: 'address', label: 'Vor Ort' },
] as const;
