import express, { Express, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import eventsRouter from './routes/events.routes';
import vendorsRouter from './routes/vendors.routes';
import guestsRouter from './routes/guests.routes';
import ticketsRouter from './routes/tickets.routes';
import { authenticateToken } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Express = express();
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

if (isProduction && corsOrigins.length === 0) {
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
  origin: isProduction ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000']),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(generalLimiter);

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-events-service',
    timestamp: new Date().toISOString()
  });
});

// Readiness check (checks database connection)
app.get('/ready', async (_req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState;
    if (dbState === 1) {
      res.json({
        status: 'ready',
        service: 'rez-events-service',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        service: 'rez-events-service',
        database: dbState === 0 ? 'disconnected' : 'connecting',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'rez-events-service',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes with authentication
app.use('/api/events', eventsRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/guests', guestsRouter);
app.use('/api/tickets', ticketsRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 4055;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-events';

async function startServer() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB successfully');

    app.listen(PORT, () => {
      logger.info(`Events Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API endpoints:`);
      logger.info(`  - POST /api/events - Create event`);
      logger.info(`  - GET /api/events - Search events`);
      logger.info(`  - GET /api/events/:id/timeline - Event timeline`);
      logger.info(`  - POST /api/vendors - Create vendor`);
      logger.info(`  - POST /api/vendors/:id/assign - Assign to event`);
      logger.info(`  - POST /api/guests - Create guest`);
      logger.info(`  - POST /api/guests/bulk - Bulk import`);
      logger.info(`  - POST /api/guests/:id/rsvp - RSVP`);
      logger.info(`  - POST /api/tickets - Create ticket`);
      logger.info(`  - POST /api/tickets/:id/sell - Sell tickets`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

startServer();

export default app;