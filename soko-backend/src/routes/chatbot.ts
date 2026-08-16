import { Router } from 'express';
import {
    validateBody,
    chatRateLimiter,
    transcribeRateLimiter,
    audioUploadHandler,
    optionalAuth,
    protect,
} from '#middlewares';
import {
    postChat,
    postTranscribe,
    getChatHistory,
    deleteChatHistory,
} from '#controllers';
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

// Wer den Chat benutzen darf, darf ihn auch besprechen — also `optionalAuth`
// wie oben. Eigener, strengerer Limiter: Audio kostet mehr als Text.
router.post(
    '/transcribe',
    transcribeRateLimiter,
    optionalAuth,
    audioUploadHandler,
    postTranscribe,
);

router
    .route('/history')
    .get(protect, getChatHistory)
    .delete(protect, deleteChatHistory);

export default router;
