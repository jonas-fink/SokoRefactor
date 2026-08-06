import mongoose from 'mongoose';
import { connectDB } from '#config';
import { geocodeMissingEvents } from '#services';

connectDB()
    .then(() => geocodeMissingEvents())
    .then((result) => {
        console.log('Geocoding complete:', result);
        return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Geocoding failed:', err);
        process.exit(1);
    });
