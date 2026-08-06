import type { Types } from 'mongoose';

export type UserType = {
    name?: string;
    email: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
    role: 'user' | 'admin' | 'creator';
};

export type FavoriteType = {
    _id?: string | Types.ObjectId;
    userId: string | Types.ObjectId;
    itemType: 'Activity' | 'ScrapedEvent' | 'Beratung';
    itemId: string | Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
};
