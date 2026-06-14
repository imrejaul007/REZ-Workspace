/**
 * ReZ Gamification Service
 * Service for Achievements, Challenges, Badges, and Leaderboard
 *
 * Features:
 * - Achievements
 * - Challenges
 * - Badges
 * - Missions
 * - Leaderboard
 * - Points system
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

import achievementRoutes from './routes/achievementRoutes';
import challengeRoutes from './routes/challengeRoutes';
import badgeRoutes from './routes/badgeRoutes';
import missionRoutes from './routes/missionRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';

const app = express();
const PORT = parseInt(process.env.PORT || '4050', 10);
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
process.env.SERVICE_NAME = 'rez-gamification-service';

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
  res.json({ status: 'healthy', service: 'rez-gamification-service', timestamp: new Date().toISOString() });
});

app.use('/achievements', achievementRoutes);
app.use('/challenges', challengeRoutes);
app.use('/badges', badgeRoutes);
app.use('/missions', missionRoutes);
app.use('/leaderboard', leaderboardRoutes);

// Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  Sentry.captureException(err);
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Database & Start
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-gamification';

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => logger.info(`Gamification service running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
