import { z } from 'zod';

export const updateUserSchema = z
    .object({
        name: z.string().trim().min(1).max(100).optional(),
        email: z.email('Invalid email').max(254).optional(),
        password: z.string().min(8, 'At least 8 characters').optional(),
        role: z.enum(['user', 'admin', 'creator']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field required',
    });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
