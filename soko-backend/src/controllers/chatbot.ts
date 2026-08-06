import type { RequestHandler } from 'express';
import { answer } from '#services';
import type { ChatBody } from '#schemas';

export const postChat: RequestHandler<unknown, unknown, ChatBody> = async (
    req,
    res,
    next,
) => {
    try {
        res.json({ data: await answer(req.body.message) });
    } catch (error: unknown) {
        next(error);
    }
};
