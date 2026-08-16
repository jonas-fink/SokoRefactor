import type { RequestHandler } from 'express';
import formidable from 'formidable';

// Was `MediaRecorder` in den Browsern tatsaechlich liefert: Chrome/Firefox
// `audio/webm`, Safari `audio/mp4`. Der Rest steht fuer Uploads aus anderen
// Quellen. Alles andere fliegt raus, bevor es an das Modell geht.
const AUDIO_MIME_TYPES = [
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
];

const audioUploadHandler: RequestHandler = (req, res, next) => {
    if (!req.is('multipart/form-data')) {
        res.status(400).json({ error: 'Multipart-Upload erwartet' });
        return;
    }

    const form = formidable({
        multiples: false,
        // Eine Chat-Nachricht ist ein paar Sekunden Sprache, keine Vorlesung.
        maxFileSize: 10 * 1024 * 1024,
        filter: ({ mimetype }) =>
            // Browser haengen Codec-Parameter an ("audio/webm;codecs=opus").
            AUDIO_MIME_TYPES.includes((mimetype ?? '').split(';')[0].trim()),
    });

    form.parse(req, (err, _fields, files) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        const raw = files.audio;
        const file = Array.isArray(raw) ? raw[0] : raw;
        // formidable verwirft gefilterte Dateien still — kein File heisst hier
        // "falscher Typ" oder "Feld fehlt", beides ist ein 400.
        if (!file?.mimetype) {
            res.status(400).json({
                error: 'Keine zulässige Audiodatei hochgeladen',
            });
            return;
        }

        // Wie beim Dokument-Upload: hier wird nur geparst. Der Controller
        // raeumt die Tempdatei in seinem `finally` weg — formidable tut es nie.
        req.uploadedAudio = {
            filepath: file.filepath,
            mimeType: file.mimetype.split(';')[0].trim(),
        };
        next();
    });
};

export default audioUploadHandler;
