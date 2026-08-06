import { z } from 'zod';

export const chatBodySchema = z.object({
    message: z.string().trim().min(1, 'Nachricht wird benötigt').max(500),
});

export type ChatBody = z.infer<typeof chatBodySchema>;
