import { Router, type RequestHandler } from 'express';
import {
    protect,
    fileUploadHandler,
    adminOnly,
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
import { isValidObjectId } from 'mongoose';

const validateId: RequestHandler = (req, res, next) => {
    if (!isValidObjectId(req.params.id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
    }
    next();
};

// Beratungsangebote pflegt ausschliesslich `admin` — die Owner-Pruefung waere
// damit redundant.
const router = Router();

router.get('/', getBeratung);
router.get('/:id', validateId, getBeratungById);

router.post(
    '/',
    protect,
    adminOnly,
    fileUploadHandler,
    validateBody(beratungCreateBodySchema),
    createBeratung,
);

router.put(
    '/:id',
    protect,
    adminOnly,
    validateId,
    fileUploadHandler,
    validateBody(beratungCreateBodySchema),
    updateBeratung,
);
router.patch(
    '/:id',
    protect,
    adminOnly,
    validateId,
    fileUploadHandler,
    validateBody(beratungPatchBodySchema),
    patchBeratung,
);
router.delete('/:id', protect, adminOnly, validateId, deleteBeratung);

export default router;
