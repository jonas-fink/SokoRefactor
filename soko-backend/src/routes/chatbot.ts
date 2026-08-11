import { Router } from 'express';
import {
    validateBody,
    chatRateLimiter,
    optionalAuth,
    protect,
} from '#middlewares';
import { postChat, getChatHistory, deleteChatHistory } from '#controllers';
import { chatBodySchema } from '#schemas';

const router = Router();

// `optionalAuth` statt `protect`: Need-Finding funktioniert für Gäste, nur der
// Verlauf braucht ein Konto. Favoriten/Sammlung bleiben geschützt.
router.post(
    '/',
    chatRateLimiter,
    optionalAuth,
    validateBody(chatBodySchema),
    postChat,
);

router
    .route('/history')
    .get(protect, getChatHistory)
    .delete(protect, deleteChatHistory);

export default router;
