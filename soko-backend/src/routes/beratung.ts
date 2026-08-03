import { Router, type RequestHandler } from 'express';
import {
    protect,
    isDocOwner,
    fileUploadHandler,
    canCreate,
    validateBody,
} from '#middlewares';
import {
    getBeratung,
    getBeratungById,
    createBeratung,
    updateBeratung,
    patchBeratung,
    deleteBeratung,
} from '#controllers';
import { beratungCreateBodySchema, beratungPatchBodySchema } from '#schemas';
import { Beratung } from '#models';
import { isValidObjectId } from 'mongoose';

const validateId: RequestHandler = (req, res, next) => {
    if (!isValidObjectId(req.params.id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
    }
    next();
};

const isBeratungOwner = isDocOwner(Beratung, 'Beratung');

const router = Router();

router.get('/', getBeratung);
router.get('/:id', validateId, getBeratungById);

router.post(
    '/',
    protect,
    canCreate,
    fileUploadHandler,
    validateBody(beratungCreateBodySchema),
    createBeratung,
);

router.put(
    '/:id',
    protect,
    isBeratungOwner,
    validateId,
    fileUploadHandler,
    validateBody(beratungCreateBodySchema),
    updateBeratung,
);
router.patch(
    '/:id',
    protect,
    isBeratungOwner,
    validateId,
    fileUploadHandler,
    validateBody(beratungPatchBodySchema),
    patchBeratung,
);
router.delete('/:id', protect, isBeratungOwner, validateId, deleteBeratung);

export default router;
