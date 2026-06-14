/**
 * Food Safety Service - FSSAI Compliance & HACCP
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import cron from 'node-cron';
import dotenv from 'dotenv';

import { logger } from './config/logger';
import { temperatureRoutes } from './routes/temperature.routes';
import { expiryRoutes } from './routes/expiry.routes';
import { haccpRoutes } from './routes/haccp.routes';
import { incidentRoutes } from './routes/incident.routes';
import { allergenRoutes } from './routes/allergen.routes';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4035;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];
if (IS_PRODUCTION && corsOrigins.length === 0) {
  logger.error('[FATAL] CORS_ORIGIN must be set in production');
  process.exit(1);
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors({
  origin: IS_PRODUCTION ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000']),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(limiter);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${Date.now() - start}ms`,
    });
  });
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-food-safety-service',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/temperature', authenticateToken, temperatureRoutes);
app.use('/api/expiry', authenticateToken, expiryRoutes);
app.use('/api/haccp', authenticateToken, haccpRoutes);
app.use('/api/incidents', authenticateToken, incidentRoutes);
app.use('/api/allergens', authenticateToken, allergenRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use(errorHandler);

// Cron jobs
function setupCronJobs() {
  // Check expiring items every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Checking expiring items');
    const { ExpiryTracking } = require('./models');
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    await ExpiryTracking.updateMany(
      {
        expiryDate: { $lte: threeDaysFromNow },
        status: 'fresh'
      },
      { status: 'expiring-soon' }
    );

    // Mark expired
    await ExpiryTracking.updateMany(
      {
        expiryDate: { $lt: new Date() },
        status: { $in: ['fresh', 'expiring-soon'] }
      },
      { status: 'expired' }
    );
  });

  // Temperature alerts check every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Checking temperature alerts');
  });

  logger.info('Cron jobs scheduled');
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/food-safety';

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    setupCronJobs();
    app.listen(PORT, () => {
      logger.info(`Food Safety service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (err) => {
  logger.error('[FATAL]', err);
  process.exit(1);
});

start();

export default app;
