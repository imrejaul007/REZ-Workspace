/**
 * Restaurant Reservation Service
 * Handles table reservations, waitlist, and walk-ins
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import cron from 'node-cron';
import dotenv from 'dotenv';

import { logger } from './config/logger';
import { reservationRoutes } from './routes/reservation.routes';
import { tableRoutes } from './routes/table.routes';
import { walkinRoutes } from './routes/walkin.routes';
import { reminderService } from './services/reminder.service';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4020;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

if (IS_PRODUCTION && corsOrigins.length === 0) {
  logger.error('[FATAL] CORS_ORIGIN must be set in production');
  process.exit(1);
}

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many authentication attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: IS_PRODUCTION ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000']),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(generalLimiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-restaurant-reservations',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/reservations', authLimiter, authenticateToken, reservationRoutes);
app.use('/api/tables', authLimiter, authenticateToken, tableRoutes);
app.use('/api/walkins', authLimiter, authenticateToken, walkinRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reservations';

// Cron jobs
function setupCronJobs() {
  // Send reminders 2 hours before reservation
  cron.schedule('0 * * * *', async () => {
    logger.info('Sending reservation reminders');
    await reminderService.sendUpcomingReminders();
  });

  // Auto-cancel no-shows after 30 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Checking for no-shows');
    await reminderService.cancelNoShows();
  });

  // Update table availability
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Updating table availability');
  });

  logger.info('Cron jobs scheduled');
}

// Start server
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    setupCronJobs();

    app.listen(PORT, () => {
      logger.info(`Reservation service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (err) => {
  logger.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

start();

export default app;
