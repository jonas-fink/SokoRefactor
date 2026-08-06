import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import mongoose from 'mongoose';
import { connectDB } from '#config';
import { User } from '#models';
import { importBeratungen } from '#services';

// npm run import:beratungen -- <datei.csv> [quelle]
const [file, source] = process.argv.slice(2);

const run = async () => {
    if (!file) throw new Error('Aufruf: npm run import:beratungen -- <datei.csv> [quelle]');

    // Importierte Beratungen gehören dem Import-Admin (Phase 6: nur Admins
    // pflegen Beratungen). Ohne Admin gibt es keinen gültigen Eigentümer.
    const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
    if (!admin) throw new Error('Kein Admin-Account in der Datenbank');

    return importBeratungen(
        await readFile(file, 'utf8'),
        String(admin._id),
        source ?? basename(file),
    );
};

connectDB()
    .then(() => run())
    .then((result) => {
        console.log('Import abgeschlossen:', {
            ...result,
            uebersprungen: result.uebersprungen.length,
        });
        for (const s of result.uebersprungen) {
            console.warn(`Zeile ${s.zeile} (${s.externalId}): ${s.grund}`);
        }
        return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Import fehlgeschlagen:', err.message);
        process.exit(1);
    });
