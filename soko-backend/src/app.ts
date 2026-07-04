import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler, globalRateLimiter } from '#middlewares';
import { authRouter } from '#routes';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api', globalRateLimiter);

app.use('/api/v1/auth', authRouter);

app.use('*splat', (req, res) => res.status(404).json({ message: 'Not Found' }));
app.use(errorHandler);

export default app;
