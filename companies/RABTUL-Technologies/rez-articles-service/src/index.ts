/**
 * ReZ Articles Service
 * Content Management Service for Articles, Guides, and Editorial Content
 *
 * Features:
 * - Article CRUD operations
 * - Categories and tags
 * - Search and filtering
 * - Bookmarks
 * - Recommendations
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

// Sentry initialization
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1,
});

// Routes
import articleRoutes from './routes/articleRoutes';
import categoryRoutes from './routes/categoryRoutes';
import searchRoutes from './routes/searchRoutes';

const app = express();
const PORT = parseInt(process.env.PORT || '4010', 10);
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Service name
process.env.SERVICE_NAME = 'rez-articles-service';

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

// ─── Middleware ───────────────────────────────────────────────────────────────

app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// MongoDB sanitization
app.use(mongoSanitize());

// Logging
app.use(morgan('combined'));

// ─── Routes ─────────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-articles-service',
    timestamp: new Date().toISOString(),
  });
});

app.use('/articles', articleRoutes);
app.use('/articles/categories', categoryRoutes);
app.use('/articles/search', searchRoutes);

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  Sentry.captureException(err);
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Database & Start ────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-articles';

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`Articles service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
