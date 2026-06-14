/**
 * ReZ Cashback Service
 * Service for Cashback Management
 *
 * Features:
 * - Cashback rates and configuration
 * - Cashback history
 * - Cashback redemption
 * - Cashback campaigns
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

import cashbackRoutes from './routes/cashbackRoutes';
import campaignRoutes from './routes/campaignRoutes';
import historyRoutes from './routes/historyRoutes';

const app = express();
const PORT = parseInt(process.env.PORT || '4040', 10);
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// ============================================
// SECURITY: Fail fast on missing CORS in production
// ============================================
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
if (isProduction && allowedOrigins.length === 0) {
  throw new Error('[FATAL] ALLOWED_ORIGINS is required in production');
}

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
};

// Middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize());
app.use(morgan('combined'));

// Routes
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'rez-cashback-service', timestamp: new Date().toISOString() });
});

app.use('/cashback', cashbackRoutes);
app.use('/cashback/campaigns', campaignRoutes);
app.use('/cashback/history', historyRoutes);

// Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  Sentry.captureException(err);
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Database & Start
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-cashback';

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => logger.info(`Cashback service running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
