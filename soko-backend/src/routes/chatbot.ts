import { Router } from 'express';
import { validateBody, chatRateLimiter } from '#middlewares';
import { postChat } from '#controllers';
import { chatBodySchema } from '#schemas';

const router = Router();

// Ohne `protect`: Need-Finding funktioniert für Gäste. Favoriten/Sammlung
// bleiben geschützt.
router.post('/', chatRateLimiter, validateBody(chatBodySchema), postChat);

export default router;
