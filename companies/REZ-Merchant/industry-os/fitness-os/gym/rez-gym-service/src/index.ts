/**
 * REZ Gym Service
 * Main entry point
 */

import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './config/logger';
import { membershipRoutes } from './routes/membership.routes';
import { classRoutes } from './routes/class.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4300;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later' },
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
app.use(logger.requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-gym-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/memberships', membershipRoutes);
app.use('/api/classes', classRoutes);

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-gym';

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`Gym service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

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
