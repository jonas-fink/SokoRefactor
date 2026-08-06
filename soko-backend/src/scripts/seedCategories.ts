import mongoose from 'mongoose';
import { connectDB } from '#config';
import { Category } from '#models';
import { CATEGORIES } from '#utils';

const seed = async () => {
    const { upsertedCount, modifiedCount } = await Category.bulkWrite(
        CATEGORIES.map((c) => ({
            updateOne: {
                filter: { key: c.key },
                update: { $set: { ...c, appliesTo: [...c.appliesTo] } },
                upsert: true,
            },
        })),
    );

    return {
        neu: upsertedCount,
        aktualisiert: modifiedCount,
        gesamt: await Category.countDocuments(),
    };
};

connectDB()
    .then(() => seed())
    .then((result) => {
        console.log('Kategorien geseedet:', result);
        return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Seed fehlgeschlagen:', err);
        process.exit(1);
    });
