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
    activityId: string | Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
};

export type ActivityTag =
    | 'Sport'
    | 'Essen'
    | 'Kultur'
    | 'Musik'
    | 'Natur'
    | 'Gaming'
    | 'Soziales'
    | 'Workshop'
    | 'Familie';

export type ActivityType = {
    _id?: string | Types.ObjectId;
    title: string;
    description: string;
    date: Date;
    userId: string | Types.ObjectId;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    tags?: ActivityTag[];
    createdAt?: Date;
    updatedAt?: Date;
};
