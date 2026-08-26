import { randomUUID } from 'node:crypto';
import { Activity, Beratung } from '#models';
import { publicUrl, putObject } from './storage/s3.ts';

/**
 * Zieht die bei Cloudinary liegenden Bilder in den S3-Bucket um, damit das
 * Konto danach weg kann.
 *
 * Angefasst wird nur, was wirklich von Cloudinary kommt: `placehold.net`,
 * `picsum.photos` und die `bild`-Spalten aus dem Partner-Import bleiben stehen,
 * die gehoeren uns nicht. Ein bereits gesetzter `imageKey` heisst „schon
 * migriert" — deshalb meldet ein zweiter Lauf `migriert: 0`.
 */
const CLOUDINARY_HOST = 'res.cloudinary.com';

export type MigrateImagesResult = {
    geprueft: number;
    migriert: number;
    uebersprungen: number;
    fehlgeschlagen: { id: string; grund: string }[];
};

/** Laedt das Bild und legt es unter einem neuen Key ab. Wirft mit Klartext. */
const moveToS3 = async (url: string) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Download fehlgeschlagen (${res.status})`);

    // Cloudinary liefert den Typ verlaesslich mit; ohne Header waere ein
    // falscher ContentType schlimmer als ein generischer, dann laedt der
    // Browser die Datei herunter statt sie anzuzeigen.
    const mimeType =
        res.headers.get('content-type') ?? 'application/octet-stream';
    const key = `images/${randomUUID()}`;
    await putObject(Buffer.from(await res.arrayBuffer()), key, mimeType);
    return key;
};

export const migrateImages = async (): Promise<MigrateImagesResult> => {
    const result: MigrateImagesResult = {
        geprueft: 0,
        migriert: 0,
        uebersprungen: 0,
        fehlgeschlagen: [],
    };

    // Beide Modelle einzeln aufgefuehrt statt `[Activity, Beratung]`: ueber die
    // Union laesst sich `find`/`updateOne` nicht aufrufen, ihre Overloads sind
    // nicht kompatibel. `.lean()` reicht, geschrieben wird gezielt per Key.
    const pools = [
        {
            docs: () => Activity.find({}, 'image imageKey').lean(),
            setImage: (id: unknown, set: Record<string, string>) =>
                Activity.updateOne({ _id: id }, { $set: set }),
        },
        {
            docs: () => Beratung.find({}, 'image imageKey').lean(),
            setImage: (id: unknown, set: Record<string, string>) =>
                Beratung.updateOne({ _id: id }, { $set: set }),
        },
    ];

    for (const pool of pools) {
        for (const doc of await pool.docs()) {
            result.geprueft++;

            if (doc.imageKey || !doc.image?.includes(CLOUDINARY_HOST)) {
                result.uebersprungen++;
                continue;
            }

            try {
                const key = await moveToS3(doc.image);
                await pool.setImage(doc._id, {
                    image: publicUrl(key),
                    imageKey: key,
                });
                result.migriert++;
            } catch (err) {
                // Ein totes Bild darf den Lauf nicht abbrechen — der Rest des
                // Bestands soll durchlaufen, der Eintrag zeigt weiter auf
                // Cloudinary und taucht im Bericht auf.
                result.fehlgeschlagen.push({
                    id: String(doc._id),
                    grund: err instanceof Error ? err.message : String(err),
                });
            }
        }
    }

    return result;
};
