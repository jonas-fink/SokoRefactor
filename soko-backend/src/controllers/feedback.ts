import type { RequestHandler } from 'express';
import { Feedback } from '#models';
import type { FeedbackBody } from '#schemas';

export const postFeedback: RequestHandler = async (req, res, next) => {
    try {
        const { message, email, path } = req.body as FeedbackBody;
        // `req.userId` kommt aus `optionalAuth` und ist bei Gästen undefined.
        await Feedback.create({ message, email, path, userId: req.userId });
        res.status(201).json({ message: 'Danke für deine Rückmeldung' });
    } catch (error: unknown) {
        next(error);
    }
};
