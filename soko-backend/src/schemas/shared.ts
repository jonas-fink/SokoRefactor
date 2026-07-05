import { z } from 'zod';
import { Types } from 'mongoose';

export const objectIdSchema = z
    .union([
        z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
        z.instanceof(Types.ObjectId),
    ])
    .transform(String);
