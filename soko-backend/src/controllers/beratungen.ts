import type { RequestHandler } from 'express';
import { unlink } from 'node:fs/promises';
import {
    populatedBeratungSchema,
    type BeratungCreateBody,
    type BeratungPatchBody,
    type BeratungDocumentBody,
    type FilterQuery,
} from '#schemas';
import { Beratung } from '#models';
import {
    assertCategories,
    assertAudiences,
    assertLanguages,
    buildFilter,
    s3Keys,
    orphanedKeys,
} from '#utils';
import {
    getSignedDocumentUrl,
    uploadDocument,
    deleteDocuments,
} from '#services';
import { randomUUID } from 'node:crypto';

type IdParams = { id: string };

// dup with activities.ts is fine at N=2 (fields diverge);
// factory only if a 3rd near-identical CRUD resource appears

/** Sprachen und Zielgruppe sind Whitelists — 400 statt still speichern. */
const assertAxes = async (body: BeratungPatchBody) => {
    if (body.tags) await assertCategories(body.tags);
    if (body.availableLanguages) assertLanguages(body.availableLanguages);
    if (body.targetAudience) assertAudiences(body.targetAudience);
};

// no geo filter — Beratungen are browsed per-topic by tags, not by distance
export const getBeratung: RequestHandler<
    unknown,
    unknown,
    unknown,
    FilterQuery
> = async (_req, res, next) => {
    try {
        const { tags } = _req.query;
        const query: Record<string, unknown> = { ...buildFilter(_req.query) };

        if (tags) {
            const tagList = tags.split(',').map((t) => t.trim());
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
        await assertAxes(req.body);

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

        await assertAxes(req.body);

        const beratung = await Beratung.findById(id);
        if (!beratung) {
            res.status(404).json({ error: 'Beratung not found' });
            return;
        }

        // PUT ersetzt `services` komplett — was rausfaellt, muss aus S3 mit raus.
        const before = { services: beratung.toObject().services };
        beratung.set(req.body satisfies BeratungCreateBody);
        await beratung.save();
        await deleteDocuments(orphanedKeys(before, beratung.toObject()));

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
        await assertAxes(updates);

        // nur laden, wenn dieser PATCH `services` ueberhaupt anfasst
        const before = updates.services
            ? await Beratung.findById(id).lean()
            : null;

        const beratung = await Beratung.findByIdAndUpdate(
            id,
            { $set: updates },
            { returnDocument: 'after', runValidators: true },
        ).populate('userId', 'name');

        if (!beratung) {
            res.status(404).json({ error: 'Beratung not found' });
            return;
        }
        if (before) {
            await deleteDocuments(orphanedKeys(before, beratung.toObject()));
        }
        res.json({
            data: populatedBeratungSchema.parse(beratung.toObject()),
        });
    } catch (error: unknown) {
        next(error);
    }
};

// `documentUploadHandler` hat die Datei nur geparst — hochgeladen wird erst,
// wenn Beratung und Service wirklich existieren. Andernfalls wuerde jeder 404
// eine Datei im Bucket zuruecklassen, auf die nie wieder jemand zeigt.
export const addServiceDocument: RequestHandler<
    { id: string; serviceId: string },
    unknown,
    BeratungDocumentBody
> = async (req, res, next) => {
    try {
        const upload = req.uploadedDocument;
        if (!upload) {
            res.status(400).json({ error: 'Kein Dokument hochgeladen' });
            return;
        }

        const beratung = await Beratung.findById(req.params.id);
        if (!beratung) {
            res.status(404).json({ error: 'Beratung not found' });
            return;
        }

        const service = beratung.services.id(req.params.serviceId);
        if (!service) {
            res.status(404).json({ error: 'Service not found' });
            return;
        }

        const s3Key = `beratung/${req.params.id}/${randomUUID()}`;
        await uploadDocument(upload.filepath, s3Key, upload.mimeType);

        service.documents.push({
            title: req.body.title,
            s3Key,
            mimeType: upload.mimeType,
        });

        try {
            await beratung.save();
        } catch (saveError: unknown) {
            // Datei liegt schon in S3, das Subdokument nicht in der DB —
            // zuruecknehmen, sonst ist genau das ein verwaistes Objekt.
            await deleteDocuments([s3Key]);
            throw saveError;
        }

        const populatedBeratung = await beratung.populate('userId', 'name');
        res.json({
            data: populatedBeratungSchema.parse(populatedBeratung.toObject()),
        });
    } catch (error: unknown) {
        next(error);
    } finally {
        // formidable raeumt sein Tempdir nie selbst auf. Das `finally` deckt
        // alle Ausstiege ab: 404 Beratung, 404 Service, S3-Fehler, Erfolg.
        if (req.uploadedDocument) {
            await unlink(req.uploadedDocument.filepath).catch(() => {});
        }
    }
};

// Öffentlich: der Bucket bleibt privat, ausgeliefert wird eine 5 Minuten
// gültige presigned URL per Redirect.
export const getServiceDocument: RequestHandler<{
    id: string;
    docId: string;
}> = async (req, res, next) => {
    try {
        const beratung = await Beratung.findById(req.params.id).lean();
        if (!beratung) {
            res.status(404).json({ error: 'Beratung not found' });
            return;
        }

        const doc = beratung.services
            ?.flatMap((s) => s.documents)
            .find((d) => String(d._id) === req.params.docId);
        if (!doc) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        res.redirect(await getSignedDocumentUrl(doc.s3Key));
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
        await deleteDocuments(s3Keys(beratung.toObject()));
        res.json({ message: 'Beratung deleted' });
    } catch (error: unknown) {
        next(error);
    }
};
