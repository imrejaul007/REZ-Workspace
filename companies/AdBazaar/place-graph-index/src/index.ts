import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import config, { validateConfig } from './config/index.js';
import { placesRouter } from './routes/index.js';
import {
  metricsMiddleware,
  getMetrics,
  errorHandler,
  notFoundHandler,
} from './middleware/index.js';
import { cacheService } from './services/index.js';

// Initialize Express app
const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.cors.origins,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Metrics middleware
if (config.metrics.enabled) {
  app.use(metricsMiddleware);
}

// Health check endpoint
app.get('/health', async (_req, res) => {
  const mongoStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = (await cacheService.healthCheck()) ? 'connected' : 'disconnected';

  const isHealthy = mongoStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
    version: '1.0.0',
  });
});

// Readiness check endpoint
app.get('/ready', async (_req, res) => {
  try {
    // Check MongoDB
    await mongoose.connection.db?.admin().ping();

    // Check Redis
    await cacheService.healthCheck();

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Metrics endpoint
if (config.metrics.enabled) {
  app.get('/metrics', getMetrics);
}

// API routes
app.use('/api/places', placesRouter);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('MongoDB connected successfully');

    // Create indexes
    mongoose.connection.on('index', () => {
      logger.info('MongoDB indexes created');
    });
  } catch (error) {
    logger.error('MongoDB connection error:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    // Close Redis connection
    await cacheService.close();
    logger.info('Redis connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    // Connect to database
    await connectDatabase();

    // Start listening
    const server = app.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║           PLACE GRAPH INDEX SERVICE STARTED                  ║
╠═══════════════════════════════════════════════════════════════╣
║  Port:        ${config.port.toString().padEnd(52)}║
║  Environment: ${config.nodeEnv.padEnd(52)}║
║  MongoDB:     ${config.mongodb.uri.replace(/\/\/.*@/, '//***@').padEnd(52)}║
║  Redis:       ${config.redis.url.replace(/\/\/.*@/, '//***@').padEnd(52)}║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                  ║
║    Health:  GET /health                                     ║
║    Ready:   GET  /ready                                      ║
║    Metrics: GET  /metrics                                    ║
║    Places:  GET  /api/places                                  ║
║    Search:  GET  /api/places/search ║
║    Nearby:  GET  /api/places/nearby                          ║
║    Audience:GET  /api/places/:id/audience                    ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });

    // Handle server errors
    server.on('error', (error: Error) => {
      logger.error('Server error:', { error: error instanceof Error ? error.message : String(error) });
      process.exit(1);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: error instanceof Error ? error.message : String(error) });
      gracefulShutdown('uncaughtException');
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Start if this is the main module
startServer();

export default app;
