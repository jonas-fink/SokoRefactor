import type { RequestHandler } from 'express';
import {
    populatedBeratungSchema,
    type BeratungCreateBody,
    type BeratungPatchBody,
} from '#schemas';
import { Beratung } from '#models';
import { assertCategories } from '#utils';

type IdParams = { id: string };

// ponytail: dup with activities.ts is fine at N=2 (fields diverge);
// factory only if a 3rd near-identical CRUD resource appears

// ponytail: no geo filter — Beratungen are browsed per-topic by tags, not by distance
export const getBeratung: RequestHandler = async (_req, res, next) => {
    try {
        const { tags } = _req.query;
        let query: Record<string, unknown> = {};

        if (tags) {
            const tagList = (tags as string).split(',').map((t) => t.trim());
            query.tags = { $in: tagList };
        }
        const beratung = await Beratung.find(query)
            .populate('userId', 'name')
            .lean();
        res.json({
            data: beratung.map((b) => populatedBeratungSchema.parse(b)),
        });
    } catch (error: unknown) {
        next(error);
    }
};

export const createBeratung: RequestHandler<
    unknown,
    unknown,
    BeratungCreateBody
> = async (req, res, next) => {
    try {
        if (req.body.tags) await assertCategories(req.body.tags);

        const image = req.body.image ?? 'https://placehold.net/600x600.png';
        const userId = req.userId;
        const beratung = await Beratung.create({
            ...(req.body satisfies BeratungCreateBody),
            image,
            userId,
        });

        const populatedBeratung = await beratung.populate('userId', 'name');
        res.json({
            data: populatedBeratungSchema.parse(populatedBeratung.toObject()),
        });
    } catch (error: unknown) {
        next(error);
    }
};

export const getBeratungById: RequestHandler = async (req, res, next) => {
    try {
        const {
            params: { id },
        } = req;
        const beratung = await Beratung.findById(id).populate('userId', 'name');

        if (!beratung) {
            res.status(404).json({ error: 'Beratung not found' });
            return;
        }
        res.json({
            data: populatedBeratungSchema.parse(beratung.toObject()),
        });
    } catch (error: unknown) {
        next(error);
    }
};

export const updateBeratung: RequestHandler<
    IdParams,
    unknown,
    BeratungCreateBody
> = async (req, res, next) => {
    try {
        const {
            params: { id },
        } = req;

        if (req.body.tags) await assertCategories(req.body.tags);

        const beratung = await Beratung.findById(id);
        if (!beratung) {
            res.status(404).json({ error: 'Beratung not found' });
            return;
        }

        beratung.set(req.body satisfies BeratungCreateBody);
        await beratung.save();

        const populatedBeratung = await beratung.populate('userId', 'name');
        res.json({
            data: populatedBeratungSchema.parse(populatedBeratung.toObject()),
        });
    } catch (error: unknown) {
        next(error);
    }
};

export const patchBeratung: RequestHandler<
    IdParams,
    unknown,
    BeratungPatchBody
> = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates: BeratungPatchBody = req.body;
        delete (updates as Record<string, unknown>)['_id'];
        if (updates.tags) await assertCategories(updates.tags);

        const beratung = await Beratung.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true },
        ).populate('userId', 'name');

        if (!beratung) {
            res.status(404).json({ error: 'Beratung not found' });
            return;
        }
        res.json({
            data: populatedBeratungSchema.parse(beratung.toObject()),
        });
    } catch (error: unknown) {
        next(error);
    }
};

export const deleteBeratung: RequestHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        const beratung = await Beratung.findByIdAndDelete(id);
        if (!beratung) {
            res.status(404).json({ error: 'Beratung not found' });
            return;
        }
        res.json({ message: 'Beratung deleted' });
    } catch (error: unknown) {
        next(error);
    }
};
