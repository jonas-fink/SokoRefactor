import type { RequestHandler } from 'express';
import {
    populatedActivitySchema,
    type ActivityCreateBody,
    type ActivityPatchBody,
} from '#schemas';
import { Activity } from '#models';

type IdParams = { id: string };

export const getActivities: RequestHandler = async (_req, res, next) => {
    try {
        const { lng, lat, distance = 10, tags } = _req.query;
        let query: Record<string, unknown> = {};

        if (lng && lat) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [Number(lng), Number(lat)],
                    },
                    $maxDistance: Number(distance) * 1000,
                },
            };
        }

        if (tags) {
            const tagList = (tags as string).split(',').map((t) => t.trim());
            query.tags = { $in: tagList };
        }

        const activites = await Activity.find(query)
            .populate('userId', 'name email')
            .lean();
        res.json(activites.map((a) => populatedActivitySchema.parse(a)));
    } catch (error: unknown) {
        next(error);
    }
};

export const createActivity: RequestHandler<
    unknown,
    unknown,
    ActivityCreateBody
> = async (req, res, next) => {
    try {
        const { title, description, date, price, location } = req.body;
        const image = req.body.image ?? 'https://placehold.net/600x600.png';
        if (!title || !description || !date || !price || !location) {
            res.status(400).json({
                error: 'title, description, date, price and location are required',
            });
            return;
        }
        const userId = (req as any).user;
        const activity = await Activity.create({
            ...(req.body satisfies ActivityCreateBody),
            image,
            userId,
        });
        const populatedActivity = await activity.populate(
            'userId',
            'name email',
        );
        res.json(populatedActivitySchema.parse(populatedActivity.toObject()));
    } catch (error: unknown) {
        next(error);
    }
};

export const getActivityById: RequestHandler = async (req, res, next) => {
    try {
        const {
            params: { id },
        } = req;
        const activity = await Activity.findById(id).populate(
            'userId',
            'userName email',
        );
        if (!activity) {
            res.status(404).json({ error: 'Activity not found' });
            return;
        }
        res.json(populatedActivitySchema.parse(activity.toObject()));
    } catch (error: unknown) {
        next(error);
    }
};

export const updateActivity: RequestHandler<
    IdParams,
    unknown,
    ActivityCreateBody
> = async (req, res, next) => {
    try {
        const {
            params: { id },
        } = req;
        const { title, description, date, price, location } = req.body;
        if (!title || !description || !date || !price || !location) {
            res.status(400).json({
                error: 'title, description, date and location are required',
            });
            return;
        }

        const activity = await Activity.findById(id);
        if (!activity) {
            res.status(404).json({ error: 'Activity not found' });
            return;
        }

        activity.set(req.body satisfies ActivityCreateBody);
        await activity.save();

        const populatedActivity = await activity.populate(
            'userId',
            'userName email',
        );
        res.json(populatedActivitySchema.parse(populatedActivity.toObject()));
    } catch (error: unknown) {
        next(error);
    }
};

export const patchActivity: RequestHandler<
    IdParams,
    unknown,
    ActivityPatchBody
> = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates: ActivityPatchBody = req.body;
        delete (updates as Record<string, unknown>)['_id'];

        const activity = await Activity.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true },
        ).populate('userId', 'userName email');

        if (!activity) {
            res.status(404).json({ error: 'Activity not found' });
            return;
        }
        res.json(populatedActivitySchema.parse(activity.toObject()));
    } catch (error: unknown) {
        next(error);
    }
};

export const deleteActivity: RequestHandler = async (req, res, next) => {
    try {
        const {
            params: { id },
        } = req;
        const activity = await Activity.findByIdAndDelete(id);
        if (!activity) {
            res.status(404).json({ error: 'Activity not found' });
            return;
        }
        res.json({ message: 'Activity deleted' });
    } catch (error: unknown) {
        next(error);
    }
};
