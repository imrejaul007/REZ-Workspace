/**
 * Salon Service
 * Main entry point
 */

import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './config/logger';
import { salonRoutes } from './routes/salon.routes';
import { bookingRoutes } from './routes/booking.routes';
import { serviceRoutes } from './routes/service.routes';
import { stylistRoutes } from './routes/stylist.routes';
import { availabilityRoutes } from './routes/availability.routes';
import { healthRoutes } from './routes/health.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4200;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// CORS configuration - CRITICAL FIX: Never allow '*' in production
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

if (IS_PRODUCTION && corsOrigins.length === 0) {
  logger.error('[FATAL] CORS_ORIGIN must be set in production');
  process.exit(1);
}

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: { success: false, error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: IS_PRODUCTION ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000', 'http://localhost:8080']),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(generalLimiter);
app.use(logger.requestLogger);

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-salon-service',
    timestamp: new Date().toISOString()
  });
});

// Routes with auth rate limiting
app.use('/api/salons', salonRoutes);
app.use('/api/bookings', authLimiter, bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/stylists', stylistRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/health', healthRoutes);

// Error handling
app.use(errorHandler);

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon';

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`Salon service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`CORS origins: ${corsOrigins.length > 0 ? corsOrigins.join(', ') : 'development defaults'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

start();

export default app;
