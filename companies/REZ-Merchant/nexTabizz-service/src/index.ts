import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import winston from 'winston';

import config from './config/index.js';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/auth.js';
import { industryService } from './services/industry.service.js';

// Import routes
import businessRoutes from './routes/business.js';
import industryRoutes from './routes/industry.js';
import analyticsRoutes from './routes/analytics.js';

// Configure Winston logger
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: config.service.name },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Create Express app
const app: Application = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: config.service.name,
    version: config.service.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API version prefix
const API_PREFIX = '/api';

// Route registrations
app.use(`${API_PREFIX}/business`, businessRoutes);
app.use(`${API_PREFIX}/industries`, industryRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);

// Additional module routes (for /api/modules endpoints)
app.use(`${API_PREFIX}/modules`, industryRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// MongoDB connection
const connectDB = async (): Promise<void> => {
  try {
    const mongoOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    await mongoose.connect(config.mongodbUri, mongoOptions);
    logger.info('MongoDB connected successfully', {
      uri: config.mongodbUri.replace(/\/\/.*@/, '//<credentials>@')
    });

    // Initialize industry and module configs
    await industryService.initializeIndustries();
    await industryService.initializeModules();
    logger.info('Industry and module configurations initialized');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      logger.info(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   NexTaBizz Service                                      ║
║   Universal Business OS - Backend                        ║
║                                                          ║
║   Server running on port ${config.port}                      ║
║   Environment: ${config.nodeEnv}                            ║
║   Health check: http://localhost:${config.port}/health      ║
║                                                          ║
║   API Endpoints:                                         ║
║   - POST   /api/business         Create business          ║
║   - GET    /api/business         List businesses          ║
║   - GET    /api/business/:id     Get business             ║
║   - PUT    /api/business/:id     Update business          ║
║   - DELETE /api/business/:id     Delete business          ║
║   - GET    /api/business/:id/modules  Get modules          ║
║   - POST   /api/business/:id/modules  Enable module        ║
║   - DELETE /api/business/:id/modules/:moduleId  Disable    ║
║   - GET    /api/industries        List industries          ║
║   - GET    /api/industries/:type/modules  Get industry mods║
║   - GET    /api/analytics/business/:id  Business analytics ║
║   - GET    /api/analytics/platform  Platform analytics    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
