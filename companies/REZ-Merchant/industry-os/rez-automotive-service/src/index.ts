import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import config from './config';
import logger from './utils/logger';
import { authenticateInternal } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rabtul } from './integrations/rabtul';

// Import routes
import vehiclesRoutes from './routes/vehicles.routes';
import serviceRecordsRoutes from './routes/service-records.routes';
import appointmentsRoutes from './routes/appointments.routes';
import sparePartsRoutes from './routes/spare-parts.routes';

// Initialize Express app
const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.isProduction ? process.env.CORS_ORIGIN?.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-ID'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.debug('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });
  next();
});

// Rate limiting for read operations
const readLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRead,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many read requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// Rate limiting for write operations
const writeLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxWrite,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many write requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// Internal authentication
app.use(authenticateInternal);

// Health check endpoints (no rate limiting)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-automotive-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const rabtulHealth = await rabtul.healthCheck();

  const isReady = mongoStatus === 'connected';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    service: 'rez-automotive-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
      rabtul: rabtulHealth.connected ? 'connected' : rabtulHealth.error || 'not_configured',
    },
  });
});

// API routes
app.use('/api/v1/vehicles', readLimiter, vehiclesRoutes);
app.use('/api/v1/vehicles', writeLimiter, vehiclesRoutes);

app.use('/api/v1/service-records', readLimiter, serviceRecordsRoutes);
app.use('/api/v1/service-records', writeLimiter, serviceRecordsRoutes);

app.use('/api/v1/appointments', readLimiter, appointmentsRoutes);
app.use('/api/v1/appointments', writeLimiter, appointmentsRoutes);

app.use('/api/v1/spare-parts', readLimiter, sparePartsRoutes);
app.use('/api/v1/spare-parts', writeLimiter, sparePartsRoutes);

// API documentation endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'ReZ Automotive Service',
    version: '1.0.0',
    description: 'Industry vertical merchant service for automotive businesses',
    endpoints: {
      health: {
        'GET /health': 'Basic health check',
        'GET /health/ready': 'Readiness check with dependencies',
      },
      vehicles: {
        'GET /api/v1/vehicles': 'List vehicles (paginated)',
        'GET /api/v1/vehicles/search': 'Search vehicles',
        'GET /api/v1/vehicles/merchant/:merchantId': 'Get merchant vehicles',
        'GET /api/v1/vehicles/:vehicleId': 'Get vehicle by ID',
        'POST /api/v1/vehicles': 'Create vehicle',
        'PUT /api/v1/vehicles/:vehicleId': 'Update vehicle',
        'DELETE /api/v1/vehicles/:vehicleId': 'Delete vehicle',
      },
      serviceRecords: {
        'GET /api/v1/service-records': 'List service records',
        'GET /api/v1/service-records/:recordId': 'Get service record',
        'GET /api/v1/service-records/vehicle/:vehicleId': 'Vehicle history',
        'POST /api/v1/service-records': 'Create service record',
        'PUT /api/v1/service-records/:recordId': 'Update service record',
        'DELETE /api/v1/service-records/:recordId': 'Delete service record',
      },
      appointments: {
        'GET /api/v1/appointments': 'List appointments',
        'GET /api/v1/appointments/calendar': 'Calendar events',
        'GET /api/v1/appointments/:appointmentId': 'Get appointment',
        'GET /api/v1/appointments/today': 'Today\'s appointments',
        'POST /api/v1/appointments': 'Schedule appointment',
        'PUT /api/v1/appointments/:appointmentId': 'Update appointment',
        'DELETE /api/v1/appointments/:appointmentId': 'Cancel appointment',
      },
      spareParts: {
        'GET /api/v1/spare-parts': 'List spare parts',
        'GET /api/v1/spare-parts/low-stock': 'Low stock alerts',
        'GET /api/v1/spare-parts/:partId': 'Get spare part',
        'POST /api/v1/spare-parts': 'Add spare part',
        'PUT /api/v1/spare-parts/:partId': 'Update spare part',
        'DELETE /api/v1/spare-parts/:partId': 'Delete spare part',
      },
    },
    authentication: 'JWT Bearer token or X-Internal-Token header',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection', { error });
  }

  // Exit with appropriate code
  process.exit(0);
};

// Server instance for shutdown
let server: ReturnType<Application['listen']>;

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...', { uri: config.mongodb.uri.replace(/\/\/.*@/, '//<credentials>@') });

    await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully');

    // Start HTTP server
    server = app.listen(config.port, () => {
      logger.info(`ReZ Automotive Service started`, {
        port: config.port,
        environment: config.env,
        nodeVersion: process.version,
      });
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason });
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

startServer();

export default app;