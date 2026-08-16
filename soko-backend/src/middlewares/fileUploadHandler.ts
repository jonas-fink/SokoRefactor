import type { RequestHandler } from 'express';
import { unlink } from 'node:fs/promises';
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

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

        const file = files.image;
        const upFile = Array.isArray(file) ? file[0] : file;

        if (upFile) {
            try {
                const result = await cloudinary.uploader.upload(
                    upFile.filepath,
                    {
                        folder: 'activity_img',
                        public_id: `activity_${req.params.id ?? Date.now()}`,
                    },
                );
                req.body = {
                    ...parseJsonFields(flatFields),
                    image: result.secure_url,
                };
                next();
            } catch (uploadError) {
                // Ohne Log ist ein 401 von Cloudinary (falsche/veraltete Keys)
                // vom Client aus nicht von einem echten Serverfehler zu unterscheiden.
                console.error('Cloudinary upload failed:', uploadError);
                res.status(500).json({ error: 'Cloudinary Upload failed' });
            } finally {
                // formidable raeumt sein Tempdir nie selbst auf — ohne das
                // bleibt nach jedem Upload eine Datei liegen. Ein Fehler beim
                // Loeschen darf den Request nicht kippen.
                await unlink(upFile.filepath).catch(() => {});
            }
        } else {
            req.body = { ...parseJsonFields(flatFields) };
            next();
        }
    });
};

export default fileUploadHandler;
