import mongoose from 'mongoose';
import { connectDB } from '#config';
import { migrateImages } from '#services';

/**
 * Einmal-Migration: Cloudinary-Bilder nach S3. Idempotent, ein zweiter Lauf
 * muss `migriert: 0` melden. Details in `services/migrateImages.ts`.
 *
 *   npm run migrate:images
 */
connectDB()
    .then(() => migrateImages())
    .then((result) => {
        console.log('Bilder migriert:', {
            ...result,
            fehlgeschlagen: result.fehlgeschlagen.length,
        });
        for (const { id, grund } of result.fehlgeschlagen) {
            console.warn(`  ${id}: ${grund}`);
        }
        return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Bild-Migration fehlgeschlagen:', err);
        process.exit(1);
    });
