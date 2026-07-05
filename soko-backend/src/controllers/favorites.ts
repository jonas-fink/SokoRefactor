import type { RequestHandler } from 'express';
import { populatedFavoriteSchema, favoriteDocumentSchema } from '#schemas';
import { Activity, Favorite } from '#models';

export const getFavorites: RequestHandler = async (req, res, next) => {
    try {
        const userId = (req as any).user;
        const favorites = await Favorite.find({ userId })
            .populate(
                'activityId',
                'title image description date location price tags',
            )
            .lean();
        res.json(favorites.map((f) => populatedFavoriteSchema.parse(f)));
    } catch (error: unknown) {
        next(error);
    }
};

export const addFavorite: RequestHandler = async (req, res, next) => {
    try {
        const userId = (req as any).user;
        const { activityId } = req.params;

        const activity = await Activity.findById(activityId).lean();
        if (!activity) {
            res.status(404).json({ error: 'Activity not found' });
            return;
        }

        const favorite = await Favorite.create({ userId, activityId: activity._id });
        res.status(201).json(favoriteDocumentSchema.parse(favorite.toObject()));
    } catch (error: any) {
        if (error?.code === 11000) {
            res.status(409).json({ error: 'Activity already in favorites' });
            return;
        }
        next(error);
    }
};

export const removeFavorite: RequestHandler = async (req, res, next) => {
    try {
        const userId = (req as any).user;
        const { activityId } = req.params;

        const favorite = await Favorite.findOneAndDelete({
            userId,
            activityId,
        });
        if (!favorite) {
            res.status(404).json({ error: 'Favorite not found' });
            return;
        }

        res.json({ message: 'Favorite removed' });
    } catch (error: unknown) {
        next(error);
    }
};
