import { z } from 'zod';
import { AUDIENCE_KEYS, LANGUAGE_KEYS } from '#utils';

export const signupSchema = z.object({
    name: z.string().trim().max(100).optional(),
    email: z.email('Invalid E-Mail').max(254),
    password: z.string().min(8, 'At least 8 characters'),
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

export const changeEmailSchema = z.object({
    email: z.email('Ungültige E-Mail'),
    currentPassword: z.string().min(1, 'required'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'required'),
    newPassword: z.string().min(8, 'Mindestens 8 Zeichen'),
});

/** Unbekannter Key → 400, nicht stilles Speichern: eine Praeferenz, die das
 *  Filter-Vokabular nicht kennt, filtert spaeter still alles weg. */
const keysOf = (allowed: ReadonlySet<string>, label: string) =>
    z
        .array(z.string())
        .default([])
        .refine((keys) => keys.every((k) => allowed.has(k)), {
            message: `Unbekannter Wert für ${label}`,
        });

export const preferencesSchema = z.object({
    languages: keysOf(LANGUAGE_KEYS, 'languages'),
    audiences: keysOf(AUDIENCE_KEYS, 'audiences'),
    // Kategorien stehen in der Collection, nicht in einer Konstante —
    // `assertCategories` prueft sie im Controller.
    categories: z.array(z.string()).default([]),
    freeOnly: z.boolean().default(false),
});

export type RegisterInput = z.infer<typeof signupSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
