import { Schema, model } from 'mongoose';
import type { FavoriteType } from '#types';

const favoriteSchema = new Schema<FavoriteType>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        itemType: {
            type: String,
            required: true,
            enum: ['Activity', 'ScrapedEvent', 'Beratung'],
        },
        itemId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'itemType',
        },
    },
    { timestamps: true },
);

favoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

export default model<FavoriteType>('Favorite', favoriteSchema);
