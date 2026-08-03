import { Router, type RequestHandler } from 'express';
import {
    protect,
    isDocOwner,
    fileUploadHandler,
    canCreate,
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

router.get('/', getActivities);
router.get('/:id', validateId, getActivityById);

router.post('/', protect, canCreate, fileUploadHandler, createActivity);

router.put(
    '/:id',
    protect,
    isActivityOwner,
    validateId,
    fileUploadHandler,
    updateActivity,
);
router.patch(
    '/:id',
    protect,
    isActivityOwner,
    validateId,
    fileUploadHandler,
    patchActivity,
);
router.delete('/:id', protect, isActivityOwner, validateId, deleteActivity);

export default router;
