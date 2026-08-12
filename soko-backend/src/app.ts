import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler, globalRateLimiter } from '#middlewares';
import {
    activityRouter,
    authRouter,
    userRouter,
    favoriteRouter,
    eventRouter,
    categoryRouter,
    beratungRouter,
    chatRouter,
    vocabularyRouter,
} from '#routes';

const app = express();

// Genau ein Proxy steht davor (nginx im Compose-Stack, spaeter der TLS-Proxy).
// Ohne das sieht `express-rate-limit` fuer jeden Nutzer die Proxy-IP und
// limitiert damit alle gemeinsam statt einzeln — ein Unbeteiligter kann so
// jeden aussperren, und `authRateLimiter` (10/15 min) waere wertlos.
// `1` statt `true`: `true` glaubt jedem selbstgesetzten `X-Forwarded-For` und
// macht den Limiter auf die andere Art kaputt.
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api', globalRateLimiter);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/activities', activityRouter);
app.use('/api/v1/favorites', favoriteRouter);
app.use('/api/v1/events', eventRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/beratungen', beratungRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/vocabulary', vocabularyRouter);

app.use('*splat', (req, res) => res.status(404).json({ message: 'Not Found' }));
app.use(errorHandler);

export default app;
