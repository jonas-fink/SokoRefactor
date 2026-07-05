import type { RequestHandler } from 'express';
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

const fileUploadHandler: RequestHandler = (req, res, next) => {
    const form = formidable({
        multiples: false,
        maxFileSize: 5 * 1024 * 1024,
        filter: ({ mimetype }) => {
            return mimetype ? mimetype.includes('image') : false;
        },
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(400).json({ error: err.message });
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
                return res
                    .status(500)
                    .json({ error: 'Cloudinary Upload failed' });
            }
        } else {
            req.body = { ...parseJsonFields(flatFields) };
            next();
        }
    });
};

export default fileUploadHandler;
