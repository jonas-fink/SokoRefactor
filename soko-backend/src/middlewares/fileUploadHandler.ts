import type { RequestHandler } from 'express';
import { unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import formidable from 'formidable';
import { deleteFiles, publicUrl, uploadFile } from '#services';

const fileUploadHandler: RequestHandler = (req, res, next) => {
    // `express.json()` hat den Body bei nicht-multipart-Requests bereits gelesen —
    // formidable wuerde auf einen Stream warten, der nie mehr kommt (Request haengt).
    if (!req.is('multipart/form-data')) {
        next();
        return;
    }

    const form = formidable({
        multiples: false,
        maxFileSize: 5 * 1024 * 1024,
        filter: ({ mimetype }) => {
            return mimetype ? mimetype.includes('image') : false;
        },
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            {
                res.status(400).json({ error: err.message });
                return;
            }
        }

        const flatFields = Object.fromEntries(
            Object.entries(fields).map(([k, v]) => [
                k,
                Array.isArray(v) ? v[0] : v,
            ]),
        );

        const parseJsonFields = (obj: Record<string, unknown>) =>
            Object.fromEntries(
                Object.entries(obj).map(([k, v]) => {
                    if (
                        typeof v === 'string' &&
                        (v.startsWith('{') || v.startsWith('['))
                    ) {
                        try {
                            return [k, JSON.parse(v)];
                        } catch {
                            /* noop */
                        }
                    }
                    return [k, v];
                }),
            );

        const body = parseJsonFields(flatFields);
        // `imageKey` gehoert dem Server. Wuerde ein Client ihn mitschicken
        // duerfen, koennte er einen fremden Key eintragen — und `deleteFiles`
        // in `replacedImageKey` raeumt anschliessend dessen Bild ab.
        delete body.imageKey;

        const file = files.image;
        const upFile = Array.isArray(file) ? file[0] : file;

        if (upFile) {
            // UUID statt des frueheren `activity_${id}`: der deterministische
            // Name liess einen Upload aus der Entwicklung das Produktionsbild
            // desselben Eintrags ueberschreiben (KONVENTIONEN.md). Ersetzt wird
            // jetzt ueber einen echten Delete, nicht ueber gleiche Namen.
            const key = `images/${randomUUID()}`;
            try {
                await uploadFile(
                    upFile.filepath,
                    key,
                    upFile.mimetype ?? 'application/octet-stream',
                );
                req.body = { ...body, image: publicUrl(key), imageKey: key };
                // Der Upload laeuft vor `validateBody`. Kippt der Request
                // danach noch (400 aus der Validierung, 404 oder 500 im
                // Controller), schreibt niemand den Key in die Datenbank und
                // das Objekt bliebe fuer immer liegen. Eine Stelle statt sechs
                // Controller.
                res.on('finish', () => {
                    if (res.statusCode >= 400) {
                        void deleteFiles([key]).catch((err: unknown) => {
                            console.error(
                                'Verwaistes Bild nicht geloescht:',
                                key,
                                err,
                            );
                        });
                    }
                });
                next();
            } catch (uploadError) {
                // Ohne Log ist ein 403 von S3 (fehlende IAM-Rechte, falscher
                // Bucket) vom Client aus nicht von einem echten Serverfehler
                // zu unterscheiden.
                console.error('S3 upload failed:', uploadError);
                res.status(500).json({ error: 'Bild-Upload fehlgeschlagen' });
            } finally {
                // formidable raeumt sein Tempdir nie selbst auf — ohne das
                // bleibt nach jedem Upload eine Datei liegen. Ein Fehler beim
                // Loeschen darf den Request nicht kippen.
                await unlink(upFile.filepath).catch(() => {});
            }
        } else {
            req.body = body;
            next();
        }
    });
};

export default fileUploadHandler;
