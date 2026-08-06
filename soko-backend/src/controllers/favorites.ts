import type { RequestHandler } from 'express';
import type { Model } from 'mongoose';
import type { FavoriteType } from '#types';
import { populatedFavoriteSchema, favoriteDocumentSchema } from '#schemas';
import { Activity, Beratung, Favorite, ScrapedEvent } from '#models';

const FAVORITABLE: Record<string, Model<any>> = {
    Activity,
    ScrapedEvent,
    Beratung,
};

export const getFavorites: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        const favorites = await Favorite.find({ userId })
            .populate('itemId')
            .lean();
        res.json({ data: favorites.map((f) => populatedFavoriteSchema.parse(f)) });
    } catch (error: unknown) {
        next(error);
    }
};

export const addFavorite: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        const itemType = String(req.params.itemType) as FavoriteType['itemType'];
        const itemId = String(req.params.itemId);

        const ItemModel = FAVORITABLE[itemType];
        if (!ItemModel) {
            res.status(400).json({ error: 'Unknown item type' });
            return;
        }

        const item = await ItemModel.findById(itemId).lean();
        if (!item) {
            res.status(404).json({ error: `${itemType} not found` });
            return;
        }

        const favorite = await Favorite.create({ userId, itemType, itemId });
        res.status(201).json({ data: favoriteDocumentSchema.parse(favorite.toObject()) });
    } catch (error: any) {
        if (error?.code === 11000) {
            res.status(409).json({ error: 'Item already in favorites' });
            return;
        }
        next(error);
    }
};

export const removeFavorite: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.userId;
        const favorite = await Favorite.findOneAndDelete({
            userId,
            itemType: String(req.params.itemType) as FavoriteType['itemType'],
            itemId: String(req.params.itemId),
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
