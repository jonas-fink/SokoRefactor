import { Router } from 'express';
import { validateBody, feedbackRateLimiter, optionalAuth } from '#middlewares';
import { postFeedback } from '#controllers';
import { feedbackBodySchema } from '#schemas';

const router = Router();

// Nur POST. Gelesen wird in Metabase, nicht über die API.
router.post(
    '/',
    feedbackRateLimiter,
    optionalAuth,
    validateBody(feedbackBodySchema),
    postFeedback,
);

export default router;
