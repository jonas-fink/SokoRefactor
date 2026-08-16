import { z } from 'zod';

export const chatBodySchema = z.object({
    message: z.string().trim().min(1, 'Nachricht wird benötigt').max(500),
    // Der Server ist zustandslos, den Verlauf schickt der Client mit. Deshalb
    // hart begrenzt: er ist nicht vertrauenswürdig (Prompt-Injection, Kosten).
    history: z
        .array(
            z.object({
                role: z.enum(['user', 'bot']),
                text: z.string().trim().min(1).max(1000),
            }),
        )
        .max(10)
        .default([]),
    // Von `POST /chat/transcribe` erkannt und durchgereicht, damit die Antwort
    // in der Sprache der Frage kommt. Optional: getippt wird ohne.
    lang: z.string().trim().max(10).optional(),
});

export type ChatBody = z.infer<typeof chatBodySchema>;
export type ChatTurn = ChatBody['history'][number];
