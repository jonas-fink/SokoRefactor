import { Router, type RequestHandler } from 'express';
import { protect } from '#middlewares';
import { getFavorites, addFavorite, removeFavorite } from '#controllers';
import { isValidObjectId } from 'mongoose';

const validateId: RequestHandler = (req, res, next) => {
    if (!isValidObjectId(req.params.itemId)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
    }
    next();
};

const router = Router();

router.get('/', protect, getFavorites);
router.post('/:itemType/:itemId', protect, validateId, addFavorite);
router.delete('/:itemType/:itemId', protect, validateId, removeFavorite);

export default router;
