import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Routes
import apiRoutes from './routes';

// Config
import { config } from './config';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler, correlationIdMiddleware, requestLogger } from './middleware/common';

// Load environment variables
dotenv.config();

// Create Express application
const app: Express = express();

app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Custom middleware
app.use(correlationIdMiddleware);
app.use(requestLogger);

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: 'REZ Demand Forecast',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  if (mongoStatus === 'connected') {
    res.json({ success: true, data: { status: 'ready', mongodb: mongoStatus } });
  } else {
    res.status(503).json({ success: false, error: { code: 'SERVICE_NOT_READY' } });
  }
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Database connection
async function connectToDatabase(): Promise<void> {
  try {
    logger.info('Connecting to MongoDB...', { uri: config.mongodbUri.replace(/\/\/.*@/, '//<credentials>@') });

    await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('Successfully connected to MongoDB');

    mongoose.connection.on('error', (err) => logger.error('MongoDB error', { error: err.message }));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    throw error;
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB', { error });
  }
  process.exit(0);
}

// Start server
async function startServer(): Promise<void> {
  try {
    await connectToDatabase();

    const { port, nodeEnv } = config;

    app.listen(port, '0.0.0.0', () => {
      logger.info(`REZ Demand Forecast Service started on port ${port}`);
      logger.info(`Environment: ${nodeEnv}`);
      logger.info(`Health: http://localhost:${port}/health`);
      logger.info(`API: http://localhost:${port}/api\n`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason: String(reason) });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

startServer();

export default app;
