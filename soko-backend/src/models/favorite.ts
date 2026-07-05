import { Schema, model } from 'mongoose';
import type { FavoriteType } from '#types';

const favoriteSchema = new Schema<FavoriteType>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        activityId: {
            type: Schema.Types.ObjectId,
            ref: 'Activity',
            required: true,
        },
    },
    { timestamps: true },
);

favoriteSchema.index({ userId: 1, activityId: 1 }, { unique: true });

export default model<FavoriteType>('Favorite', favoriteSchema);
