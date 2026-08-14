import { z } from 'zod';

// Spiegelt `soko-backend/src/schemas/feedback.ts`. Die leere Mail muss erlaubt
// bleiben: das Feld ist freiwillig, das Formular schickt es trotzdem mit.
export const feedbackSchema = z.object({
    message: z.string().trim().min(1, 'Bitte schreib etwas').max(2000),
    email: z.union([z.email('Ungültige E-Mail'), z.literal('')]).optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;
