/**
 * ReZ Creator Earnings Service
 * Service for Creator Dashboard and Earnings
 *
 * Features:
 * - Creator profiles
 * - Earnings tracking
 * - Picks management
 * - Tier system
 * - Payouts
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import mongoose from 'mongoose';

import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
});

import creatorRoutes from './routes/creatorRoutes';
import earningsRoutes from './routes/earningsRoutes';
import picksRoutes from './routes/picksRoutes';
import tierRoutes from './routes/tierRoutes';

const app = express();
const PORT = parseInt(process.env.PORT || '4060', 10);
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
process.env.SERVICE_NAME = 'rez-creator-earnings-service';

// Security: Fail fast on missing CORS in production
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
if (isProduction && allowedOrigins.length === 0) {
  throw new Error('[FATAL] ALLOWED_ORIGINS is required in production');
}

// CORS configuration
const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin) return callback(null, true);
  if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return callback(null, true);
  }
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  callback(new Error(`Origin ${origin} not allowed by CORS policy`));
};

// Middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize());
app.use(morgan('combined'));

// Routes
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'rez-creator-earnings-service', timestamp: new Date().toISOString() });
});

app.use('/creators', creatorRoutes);
app.use('/creators/earnings', earningsRoutes);
app.use('/creators/picks', picksRoutes);
app.use('/creators/tier', tierRoutes);

// Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  Sentry.captureException(err);
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Database & Start
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-creator';

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => logger.info(`Creator earnings service running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
