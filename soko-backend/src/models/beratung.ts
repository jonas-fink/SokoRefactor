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
    },
    { timestamps: true },
);

// ponytail: 2dsphere kept for a future near-me feature; drop if it never ships
beratungSchema.index({ location: '2dsphere' });

export default model('Beratung', beratungSchema);
