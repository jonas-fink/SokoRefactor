import { readFile } from 'node:fs/promises';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Credentials kommen über die Default-Provider-Chain aus AWS_ACCESS_KEY_ID /
// AWS_SECRET_ACCESS_KEY — kein explizites `credentials`-Objekt nötig.
const client = new S3Client({ region: process.env.S3_REGION });
const Bucket = process.env.S3_BUCKET ?? '';

// ponytail: Datei komplett in den Speicher lesen. formidable hat sie ohnehin
// schon auf Platte geschrieben und Anträge sind < 20 MB. Auf `createReadStream`
// umstellen, sobald grössere Dateien erlaubt werden.
export const uploadDocument = async (
    filepath: string,
    key: string,
    mimeType: string,
) => {
    await client.send(
        new PutObjectCommand({
            Bucket,
            Key: key,
            Body: await readFile(filepath),
            ContentType: mimeType,
        }),
    );
    return key;
};

// Räumt Dateien weg, sobald das Subdokument sie nicht mehr referenziert.
// DeleteObjects nimmt bis zu 1000 Keys pro Aufruf — eine Beratungsstelle kommt
// da nicht hin, also kein Batching.
export const deleteDocuments = async (keys: string[]) => {
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
