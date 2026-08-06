import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB } from '#config';
import { Favorite } from '#models';

const migrate = async () => {
    const before = await Favorite.countDocuments();

    const { modifiedCount } = await Favorite.collection.updateMany(
        { activityId: { $exists: true } },
        { $rename: { activityId: 'itemId' }, $set: { itemType: 'Activity' } },
    );

    try {
        await Favorite.collection.dropIndex('userId_1_activityId_1');
    } catch {
        // ponytail: Index schon weg (zweiter Lauf) — kein Grund abzubrechen
    }
    await Favorite.syncIndexes();

    assert.equal(
        await Favorite.countDocuments({ activityId: { $exists: true } }),
        0,
    );
    assert.equal(await Favorite.countDocuments(), before);

    return { migrated: modifiedCount, total: before };
};

connectDB()
    .then(() => migrate())
    .then((result) => {
        console.log('Favorites migration complete:', result);
        return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Favorites migration failed:', err);
        process.exit(1);
    });
