import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Import configurations
import { config, connectMongoDB, disconnectMongoDB, connectRedis, disconnectRedis, logger } from './config/index.js';
import { errorMiddleware, notFoundHandler } from './middleware/error.middleware.js';

// Import routes
import agreementRoutes from './routes/agreement.routes.js';

// Create Express app
const app: Express = express();

// Ensure directories exist
const ensureDirectories = (): void => {
  const dirs = [
    './logs',
    './storage/pdfs',
    './storage/temp'
  ];

  dirs.forEach(dir => {
    const absolutePath = path.resolve(dir);
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true });
    }
  });
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const healthcheck = {
    status: 'healthy',
    service: 'risna-agreement-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  };

  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'unhealthy';
    res.status(503).json(healthcheck);
  }
});

// Readiness endpoint
app.get('/ready', async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ready',
    service: 'risna-agreement-service',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/v1/agreements', agreementRoutes);

// API info endpoint
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    service: 'RisnaEstate Agreement Service',
    version: '1.0.0',
    description: 'Contract generation and e-signature service for RisnaEstate',
    endpoints: {
      agreements: '/api/v1/agreements',
      health: '/health',
      ready: '/ready'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorMiddleware);

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await disconnectMongoDB();
    await disconnectRedis();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error });
  process.exit(1);
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Ensure directories exist
    ensureDirectories();

    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Start listening
    app.listen(config.port, () => {
      logger.info(`RisnaEstate Agreement Service started on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`API endpoint: http://localhost:${config.port}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;