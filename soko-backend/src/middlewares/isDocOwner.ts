import type { RequestHandler } from 'express';
import type { Model } from 'mongoose';

// Generic owner-or-admin guard for documents with a `userId` field.
// ponytail: replaces per-model isActivityOwner/isBeratungOwner copies
const isDocOwner =
    (model: Model<{ userId: unknown }>, label = 'resource'): RequestHandler =>
    async (req, res, next) => {
        try {
            const doc = await model.findById(req.params.id);
            if (!doc) {
                res.status(404).json({ error: `${label} not found` });
                return;
            }

            const isOwner = doc.userId?.toString() === req.userId;
            const isAdmin = req.role === 'admin';
            if (isOwner || isAdmin) {
                return next();
            }

            res.status(403).json({
                error: `Unauthorized: You do not own this ${label}.`,
            });
        } catch (error) {
            next(error);
        }
    };

export default isDocOwner;
