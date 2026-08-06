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
} from '#routes';

const app = express();

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

app.use('*splat', (req, res) => res.status(404).json({ message: 'Not Found' }));
app.use(errorHandler);

export default app;
