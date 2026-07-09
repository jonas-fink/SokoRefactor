import mongoose from 'mongoose';
import { connectDB } from '#config';
import { scrapeKasselEvents } from '#services';

connectDB()
    .then(() => scrapeKasselEvents())
    .then((result) => {
        console.log('Scrape complete:', result);
        return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Scrape failed:', err);
        process.exit(1);
    });
