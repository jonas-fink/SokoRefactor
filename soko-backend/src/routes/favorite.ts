import { Router, type RequestHandler } from 'express';
import { protect } from '#middlewares';
import { getFavorites, addFavorite, removeFavorite } from '#controllers';
import { isValidObjectId } from 'mongoose';

const validateId: RequestHandler = (req, res, next) => {
    if (!isValidObjectId(req.params.activityId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    next();
};

const router = Router();

router.get('/', protect, getFavorites);
router.post('/:activityId', protect, validateId, addFavorite);
router.delete('/:activityId', protect, validateId, removeFavorite);

export default router;
