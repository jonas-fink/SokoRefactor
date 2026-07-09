import { Schema, model } from 'mongoose';

const scrapedEventSchema = new Schema(
    {
        externalId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        startDate: {
            type: Date,
        },
        category: {
            type: String,
            trim: true,
            default: '',
        },
        locationName: {
            type: String,
            trim: true,
            default: '',
        },
        municipality: {
            type: String,
            trim: true,
            default: '',
        },
        sourceUrl: {
            type: String,
            required: true,
        },
        source: {
            type: String,
            default: 'kassel.de',
        },
    },
    { timestamps: true },
);

export default model('ScrapedEvent', scrapedEventSchema);
