import { Schema, model } from 'mongoose';
import { maxLength } from 'zod';

const activitySchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Titel wird benötigt'],
            trim: true,
            maxlength: [
                100,
                'Titel kann nicht länger als 100 Zeichen lang sein',
            ],
        },
        image: {
            type: String,
            required: [true, 'Bild wird benötigt'],
        },
        description: {
            type: String,
            required: [true, 'Beschreibung benötigt'],
            trim: true,
        },
        date: {
            type: Date,
            required: [true, 'Datum wird benötigt'],
            default: Date.now,
        },
        price: {
            type: Number,
            required: [true, 'Preis wird benötigt'],
            default: 0,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                required: [true, 'Coordinates are required'],
            },
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID wird benötigt'],
            index: true,
        },
        tags: {
            type: [String],
            enum: [
                'Sport',
                'Essen',
                'Kultur',
                'Musik',
                'Natur',
                'Gaming',
                'Soziales',
                'Workshop',
                'Familien',
            ],
            default: [],
        },
    },
    { timestamps: true },
);

activitySchema.index({ location: '2dsphere' });

export default model('Activity', activitySchema);
