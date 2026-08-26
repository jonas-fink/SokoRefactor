import { readFile } from 'node:fs/promises';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({ region: process.env.S3_REGION });
const Bucket = process.env.S3_BUCKET ?? '';

// Buffer-Variante: das Migrationsskript laedt von einer URL und hat nie eine
// Datei auf der Platte.
export const putObject = async (
    body: Buffer,
    key: string,
    mimeType: string,
) => {
    await client.send(
        new PutObjectCommand({
            Bucket,
            Key: key,
            Body: body,
            ContentType: mimeType,
        }),
    );
    return key;
};

//  Auf `createReadStream` umstellen, sobald grössere Dateien erlaubt werden.
export const uploadFile = async (
    filepath: string,
    key: string,
    mimeType: string,
) => putObject(await readFile(filepath), key, mimeType);

/**
 * Bilder liegen unter `images/` — dem einzigen oeffentlich lesbaren Prefix des
 * Buckets (Bucket-Policy `PublicReadImages`). Sie stehen in Listen mit 20
 * Karten; eine presigned URL pro Bild waere ein Backend-Request pro Kachel und
 * nicht cachebar. Dokumente unter `beratung/` bleiben privat und laufen
 * weiterhin ueber `getSignedDocumentUrl`.
 */
export const publicUrl = (key: string) =>
    `https://${Bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;

// Räumt Dateien weg, sobald das Dokument sie nicht mehr referenziert.
// DeleteObjects nimmt bis zu 1000 Keys pro Aufruf — eine Beratungsstelle kommt
// da nicht hin, also kein Batching.
export const deleteFiles = async (keys: string[]) => {
    if (keys.length === 0) return;
    await client.send(
        new DeleteObjectsCommand({
            Bucket,
            Delete: { Objects: keys.map((Key) => ({ Key })) },
        }),
    );
};

// Kurzlebige URL statt öffentlichem Bucket — der Redirect wird nicht geteilt.
export const getSignedDocumentUrl = (key: string) =>
    getSignedUrl(client, new GetObjectCommand({ Bucket, Key: key }), {
        expiresIn: 300,
    });
