import type { RequestHandler } from 'express';
import {
    populatedActivitySchema,
    type ActivityCreateBody,
    type ActivityPatchBody,
    type FilterQuery,
} from '#schemas';
import { Activity } from '#models';
import {
    assertCategories,
    assertAudiences,
    assertLanguages,
    buildFilter,
} from '#utils';

type IdParams = { id: string };

/** Sprachen und Zielgruppe sind Whitelists — 400 statt still speichern. */
const assertAxes = async (body: ActivityPatchBody) => {
    if (body.tags) await assertCategories(body.tags);
    if (body.availableLanguages) assertLanguages(body.availableLanguages);
    if (body.targetAudience) assertAudiences(body.targetAudience);
};

export const getActivities: RequestHandler<
    unknown,
    unknown,
    unknown,
    FilterQuery
> = async (_req, res, next) => {
    try {
        const { lng, lat, distance = 10, tags } = _req.query;
        // `true`: Activities sind die einzigen mit `price`, also die einzigen,
        // auf die `free=1` wirken kann.
        const query: Record<string, unknown> = {
            ...buildFilter(_req.query, true),
        };

        if (lng && lat) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat],
                    },
                    $maxDistance: distance * 1000,
                },
            };
        }

        if (tags) {
            const tagList = tags.split(',').map((t) => t.trim());
            query.tags = { $in: tagList };
        }

        // Naechster Termin zuerst — die Events-Aggregation sortiert seit jeher
        // so, die Activities kamen bis hierher in Upload-Reihenfolge.
        const activites = await Activity.find(query)
            .populate('userId', 'name email')
            .sort({ date: 1 })
            .lean();
        res.json({
            data: activites.map((a) => populatedActivitySchema.parse(a)),
        });
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
        // Pflichtfelder, Laengen und Typen pruefen `validateBody` in der Route.
        const image = req.body.image ?? 'https://placehold.net/600x600.png';
        await assertAxes(req.body);

        const userId = req.userId;
        const activity = await Activity.create({
            ...(req.body satisfies ActivityCreateBody),
            image,
            userId,
        });
        const populatedActivity = await activity.populate(
            'userId',
            'name email',
        );
        res.json({
            data: populatedActivitySchema.parse(populatedActivity.toObject()),
        });
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
            'name email',
        );
        if (!activity) {
            res.status(404).json({ error: 'Activity not found' });
            return;
        }
        res.json({ data: populatedActivitySchema.parse(activity.toObject()) });
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
        // Pflichtfelder, Laengen und Typen pruefen `validateBody` in der Route.
        await assertAxes(req.body);

        const activity = await Activity.findById(id);
        if (!activity) {
            res.status(404).json({ error: 'Activity not found' });
            return;
        }

        activity.set(req.body satisfies ActivityCreateBody);
        await activity.save();

        const populatedActivity = await activity.populate(
            'userId',
            'name email',
        );
        res.json({
            data: populatedActivitySchema.parse(populatedActivity.toObject()),
        });
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
        await assertAxes(updates);

        const activity = await Activity.findByIdAndUpdate(
            id,
            { $set: updates },
            { returnDocument: 'after', runValidators: true },
        ).populate('userId', 'name email');

        if (!activity) {
            res.status(404).json({ error: 'Activity not found' });
            return;
        }
        res.json({ data: populatedActivitySchema.parse(activity.toObject()) });
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
