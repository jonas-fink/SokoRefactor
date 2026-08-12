import { Router, type RequestHandler } from 'express';
import {
    protect,
    isDocOwner,
    fileUploadHandler,
    canCreate,
    validateQuery,
    validateBody,
} from '#middlewares';
import {
    getActivities,
    getActivityById,
    createActivity,
    updateActivity,
    patchActivity,
    deleteActivity,
} from '#controllers';
import { Activity } from '#models';
import {
    filterQuerySchema,
    activityCreateBodySchema,
    activityPatchBodySchema,
} from '#schemas';
import { isValidObjectId } from 'mongoose';

const isActivityOwner = isDocOwner(Activity, 'Activity');

const validateId: RequestHandler = (req, res, next) => {
    if (!isValidObjectId(req.params.id)) {
        {
            res.status(400).json({ error: 'Invalid ID format' });
            return;
        }
    }
    next();
};

const router = Router();

router.get('/', validateQuery(filterQuerySchema), getActivities);
router.get('/:id', validateId, getActivityById);

// `validateBody` erst nach `fileUploadHandler` — vorher steht bei
// multipart-Requests noch gar kein Body da.
router.post(
    '/',
    protect,
    canCreate,
    fileUploadHandler,
    validateBody(activityCreateBodySchema),
    createActivity,
);

router.put(
    '/:id',
    protect,
    isActivityOwner,
    validateId,
    fileUploadHandler,
    validateBody(activityCreateBodySchema),
    updateActivity,
);
router.patch(
    '/:id',
    protect,
    isActivityOwner,
    validateId,
    fileUploadHandler,
    validateBody(activityPatchBodySchema),
    patchActivity,
);
router.delete('/:id', protect, isActivityOwner, validateId, deleteActivity);

export default router;
