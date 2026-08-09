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
        // Leer = keine Angabe = matcht immer (siehe utils/queryFilters.ts).
        availableLanguages: { type: [String], default: [] },
        targetAudience: { type: [String], default: [] },
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
        // Die Quelle liefert nur `locationName` als Text — die Koordinaten
        // kommen nachtraeglich aus dem Geocoder. Anders als bei Beratung
        // deshalb optional: die meisten Events starten ohne.
        location: {
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: {
                type: [Number],
            },
        },
        // Auf jeden Versuch gesetzt, auch auf den erfolglosen. Sonst fragt
        // jeder Lauf dieselben unaufloesbaren Veranstaltungsorte erneut ab.
        geocodedAt: {
            type: Date,
        },
    },
    { timestamps: true },
);

scrapedEventSchema.index({ location: '2dsphere' });

export default model('ScrapedEvent', scrapedEventSchema);
