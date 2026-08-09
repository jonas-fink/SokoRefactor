import { Router, type RequestHandler } from 'express';
import { getEvents, getEventById } from '#controllers';
import { validateQuery } from '#middlewares';
import { filterQuerySchema } from '#schemas';
import { isValidObjectId } from 'mongoose';

const validateId: RequestHandler = (req, res, next) => {
    if (!isValidObjectId(req.params.id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
    }
    next();
};

const router = Router();

router.get('/', validateQuery(filterQuerySchema), getEvents);
router.get('/:id', validateId, getEventById);

export default router;
