import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler, globalRateLimiter } from '#middlewares';
import {
    acitivityRouter,
    authRouter,
    userRouter,
    favoriteRouter,
    eventRouter,
    categoryRouter,
} from '#routes';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api', globalRateLimiter);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/activities', acitivityRouter);
app.use('/api/v1/favorites', favoriteRouter);
app.use('/api/v1/events', eventRouter);
app.use('/api/v1/categories', categoryRouter);

app.use('*splat', (req, res) => res.status(404).json({ message: 'Not Found' }));
app.use(errorHandler);

export default app;
