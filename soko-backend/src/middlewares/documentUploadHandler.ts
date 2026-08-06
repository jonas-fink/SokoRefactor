import type { RequestHandler } from 'express';
import formidable from 'formidable';

// Anträge sind PDF oder Office-Dateien. Alles andere fliegt raus, bevor
// irgendetwas nach S3 wandert.
const DOCUMENT_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const documentUploadHandler: RequestHandler = (req, res, next) => {
    if (!req.is('multipart/form-data')) {
        res.status(400).json({ error: 'Multipart-Upload erwartet' });
        return;
    }

    const form = formidable({
        multiples: false,
        maxFileSize: 20 * 1024 * 1024,
        filter: ({ mimetype }) => DOCUMENT_MIME_TYPES.includes(mimetype ?? ''),
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        const raw = files.document;
        const file = Array.isArray(raw) ? raw[0] : raw;
        // formidable verwirft gefilterte Dateien still — kein File heisst hier
        // "falscher Typ" oder "Feld fehlt", beides ist ein 400.
        if (!file?.mimetype) {
            res.status(400).json({
                error: 'Kein zulässiges Dokument (PDF oder Office-Datei) hochgeladen',
            });
            return;
        }

        const titleField = fields.title;
        const title = Array.isArray(titleField) ? titleField[0] : titleField;

        // Bewusst *kein* S3-Upload hier: die Datei bleibt im formidable-Tempdir,
        // bis der Controller Beratung und Service verifiziert hat. Sonst laesst
        // jeder 404 ein verwaistes Objekt im Bucket liegen.
        req.uploadedDocument = { filepath: file.filepath, mimeType: file.mimetype };
        req.body = { title: title || file.originalFilename || 'Dokument' };
        next();
    });
};

export default documentUploadHandler;
