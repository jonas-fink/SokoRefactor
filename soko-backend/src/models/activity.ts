import { Schema, model } from 'mongoose';

// Haeufige Fragen. `_id: false`, weil es — anders als bei den Dokumenten einer
// Beratung — keine Route auf den einzelnen Eintrag gibt: die Liste wird beim
// Speichern immer komplett ersetzt.
const faqSchema = new Schema(
    {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true },
    },
    { _id: false },
);

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
        // Nur gesetzt, wenn wir die Datei selbst nach S3 geladen haben. Externe
        // Adressen (Partner-CSV, Platzhalter, Seeds) stehen weiter allein in
        // `image` und haben nichts, was aufgeraeumt werden muesste.
        imageKey: { type: String },
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
        url: { type: String, trim: true },
        faq: { type: [faqSchema], default: [] },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        address: { type: String, trim: true },
        preferredContact: {
            type: String,
            enum: ['phone', 'email', 'address'],
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
            default: [],
        },
        availableLanguages: { type: [String], default: [] },
        targetAudience: { type: [String], default: [] },
    },
    { timestamps: true },
);

activitySchema.index({ location: '2dsphere' });

export default model('Activity', activitySchema);
