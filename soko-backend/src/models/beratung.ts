import { Schema, model } from 'mongoose';

const timeSlotSchema = new Schema(
    {
        open: { type: Number, required: true, min: 0, max: 1439 },
        close: { type: Number, required: true, min: 0, max: 1439 },
    },
    { _id: false },
);

const businessHoursSchema = new Schema(
    {
        monday: [timeSlotSchema],
        tuesday: [timeSlotSchema],
        wednesday: [timeSlotSchema],
        thursday: [timeSlotSchema],
        friday: [timeSlotSchema],
        saturday: [timeSlotSchema],
        sunday: [timeSlotSchema],
    },
    { _id: false },
);

// Anträge/PDFs pro Anwendungsfall. Embedded wie openingHours — eine eigene
// Document-Collection erst, wenn dieselbe Datei über mehrere Stellen hinweg
// wiederverwendet wird (bundesweite Formulare).
const documentSchema = new Schema({
    title: { type: String, required: true, trim: true },
    s3Key: { type: String, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
});

const serviceSchema = new Schema({
    name: { type: String, required: true, trim: true },
    documents: [documentSchema],
});

const beratungSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Titel wird benötigt'],
            trim: true,
            maxlength: [
                100,
                'Titel kann nicht länger als 100 Zeichen lang sein.',
            ],
        },
        image: {
            type: String,
            required: [true, 'Bild wird benötigt'],
        },
        description: {
            type: String,
            required: [true, 'Beschreibung wird benötigt'],
            trim: true,
        },
        openingHours: businessHoursSchema,
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        address: { type: String, trim: true },
        preferredContact: {
            type: String,
            enum: ['phone', 'email', 'address'],
        },
        services: [serviceSchema],
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
        // Herkunft aus einem Partner-Import. `sparse`, weil manuell angelegte
        // Beratungen keine externe ID haben — der Upsert-Schlüssel des Imports.
        externalId: { type: String, sparse: true, unique: true },
        source: { type: String },
    },
    { timestamps: true },
);

// 2dsphere kept for a future near-me feature; drop if it never ships
beratungSchema.index({ location: '2dsphere' });

export default model('Beratung', beratungSchema);
