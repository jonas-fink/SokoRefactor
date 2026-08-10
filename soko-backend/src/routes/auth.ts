import { Router } from 'express';
import {
    register,
    login,
    refresh,
    logout,
    me,
    becomeCreator,
    changeEmail,
    changePassword,
    updatePreferences,
} from '#controllers';
import {
    validateBody,
    protect,
    authRateLimiter,
    refreshRateLimiter,
} from '#middlewares';
import {
    signupSchema,
    loginSchema,
    changeEmailSchema,
    changePasswordSchema,
    preferencesSchema,
} from '#schemas';

const router = Router();

router.post('/register', authRateLimiter, validateBody(signupSchema), register);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/refresh', refreshRateLimiter, refresh);
router.post('/logout', logout);
router.get('/me', protect, me);
router.patch('/become-creator', protect, becomeCreator);
router.patch('/email', protect, validateBody(changeEmailSchema), changeEmail);
router.patch(
    '/preferences',
    protect,
    validateBody(preferencesSchema),
    updatePreferences,
);
router.patch(
    '/password',
    protect,
    validateBody(changePasswordSchema),
    changePassword,
);

export default router;
