import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import config from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './utils/errors';
import { requestId, requestLogger } from './middleware/requestId';
import { authenticate } from './middleware/auth';
import routes from './routes';

const app: Express = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials
}));
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID and logging
app.use(requestId);
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Apply authentication middleware to protected routes
// Public routes (search, airports, airlines, flight status) - no auth required
// Protected routes are handled inside routes/index.ts

// Mount routes with auth middleware
app.use('/api/v1/flights', authenticate, routes);
app.use('/api/v1/search', authenticate, routes);
app.use('/api/v1/bookings', authenticate, routes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Airzy Flight Service',
    version: config.version,
    status: 'running',
    timestamp: Date.now(),
    endpoints: {
      search: '/api/v1/flights/search',
      book: '/api/v1/flights/book',
      bookings: '/api/v1/bookings',
      priceAlerts: '/api/v1/flights/price-alerts'
    }
  });
});

// Health checks
app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive', service: 'airzy-flight-service', timestamp: new Date() });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
    }
    res.json({ status: 'ready', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  } catch {
    res.status(503).json({ status: 'not_ready', mongodb: 'disconnected' });
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('MongoDB connected', { uri: config.mongodb.uri });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
  }
}

// Graceful shutdown
let server: ReturnType<typeof app.listen>;

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      } catch (err) {
        logger.error('Error closing MongoDB', { error: err });
      }
      process.exit(0);
    });
  }
  
  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Start server
async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    // Setup graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`Airzy Flight Service started`, {
        host: config.server.host,
        port: config.server.port,
        env: config.server.env,
        version: config.version
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

// Start the server
startServer();

export default app;
