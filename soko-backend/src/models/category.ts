import { Schema, model } from 'mongoose';

// Kuratierte Taxonomie. Die Collection ist die Whitelist fuer `Activity.tags`
// und `Beratung.tags` — dort stehen weiterhin `key`-Strings, keine ObjectIds.
const categorySchema = new Schema({
    key: {
        type: String,
        required: [true, 'Key wird benötigt'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    label: {
        type: String,
        required: [true, 'Label wird benötigt'],
        trim: true,
    },
    appliesTo: {
        type: [String],
        enum: ['activity', 'beratung'],
        default: [],
    },
    colorToken: { type: String },
});

export default model('Category', categorySchema);
