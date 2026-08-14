import { z } from 'zod';

export const feedbackBodySchema = z.object({
    message: z.string().trim().min(1, 'Nachricht wird benötigt').max(2000),
    // Leerer String heißt „anonym": das Feld ist optional, ein Formular schickt
    // es aber trotzdem mit. Ohne das Umwandeln scheitert jede leere Eingabe an
    // der Mail-Validierung.
    email: z
        .union([
            z.email('Keine gültige E-Mail-Adresse').max(254),
            z.literal(''),
        ])
        .optional()
        .transform((v) => v || undefined),
    path: z.string().trim().max(200).optional(),
});

export type FeedbackBody = z.infer<typeof feedbackBodySchema>;
