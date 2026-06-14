import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

import { config } from './config';
import { databaseService, redisService } from './services';
import routes from './routes';
import { metricsMiddleware, metricsHandler, healthHandler } from './middleware';
import { errorHandler, notFoundHandler } from './middleware';
import logger from 'utils/logger.js';

// Create Express app
const app: Express = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});
app.use('/api', limiter);

// Metrics middleware
app.use(metricsMiddleware);

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', healthHandler);

// Metrics endpoint
app.get('/metrics', metricsHandler);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close database connection
    await databaseService.disconnect();
    logger.info('Database disconnected');

    // Close Redis connection
    await redisService.disconnect();
    logger.info('Redis disconnected');

    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await databaseService.connect();

    // Connect to Redis
    await redisService.connect();

    // Start HTTP server
    app.listen(config.port, () => {
      logger.info(`AI Marketing Manager service started on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', { error: error instanceof Error ? error.message : String(error) });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Export app for testing
export { app };

// Start server if running directly
if (require.main === module) {
  startServer();
}