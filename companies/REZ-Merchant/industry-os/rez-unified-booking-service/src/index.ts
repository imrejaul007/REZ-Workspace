import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Configuration and utilities
import { loadConfig, getConfig } from './config';
import { VERTICAL_COUNT } from './config/verticals';
import { logger, createLogger } from './utils/logger';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/auth';

// Routes
import searchRoutes from './routes/search.routes';
import bookingsRoutes from './routes/bookings.routes';
import paymentRoutes from './routes/payment.routes';
import waitlistRoutes from './routes/waitlist.routes';
import calendarsRoutes from './routes/calendars.routes';
import verticalsRoutes from './routes/verticals.routes';

// Models (for index initialization)
import './models';

const configLogger = createLogger('server');

// ============================================
// Create Express Application
// ============================================

function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for API
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-Id'],
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request ID middleware
  app.use((req: Request, _res: Response, next) => {
    req.requestId = (req.headers['x-request-id'] as string) || `req-${uuidv4()}`;
    next();
  });

  // Request logging
  app.use(requestLogger);

  // Global rate limiting
  const limiter = rateLimit({
    windowMs: getConfig().RATE_LIMIT_WINDOW_MS,
    max: getConfig().RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Health check routes (no rate limiting)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'rez-unified-booking-service',
        version: '1.0.0',
        verticalsSupported: VERTICAL_COUNT,
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get('/health/live', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'alive',
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get('/health/ready', async (_req: Request, res: Response) => {
    const checks: Record<string, boolean> = {
      mongodb: mongoose.connection.readyState === 1,
    };

    const allReady = Object.values(checks).every(Boolean);

    res.status(allReady ? 200 : 503).json({
      success: allReady,
      data: {
        status: allReady ? 'ready' : 'not_ready',
        checks,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // API Routes
  const apiPrefix = '/api/v1';

  // Search routes
  app.use(`${apiPrefix}/search`, searchRoutes);

  // Bookings routes
  app.use(`${apiPrefix}/bookings`, bookingsRoutes);

  // Payment routes (nested under bookings)
  app.use(`${apiPrefix}/bookings`, paymentRoutes);

  // Waitlist routes
  app.use(`${apiPrefix}/waitlist`, waitlistRoutes);

  // Calendar routes
  app.use(`${apiPrefix}/calendars`, calendarsRoutes);

  // Verticals routes
  app.use(`${apiPrefix}/verticals`, verticalsRoutes);

  // Metrics endpoint (prometheus-style)
  app.get('/metrics', (_req: Request, res: Response) => {
    const metrics = [
      '# HELP unified_booking_service_up Service uptime',
      '# TYPE unified_booking_service_up gauge',
      `unified_booking_service_up 1`,
      `# HELP unified_booking_service_verticals_total Total verticals supported`,
      '# TYPE unified_booking_service_verticals_total gauge',
      `unified_booking_service_verticals_total ${VERTICAL_COUNT}`,
      `# HELP unified_booking_service_mongodb_connected MongoDB connection status`,
      '# TYPE unified_booking_service_mongodb_connected gauge',
      `unified_booking_service_mongodb_connected ${mongoose.connection.readyState === 1 ? 1 : 0}`,
    ].join('\n');

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}

// ============================================
// Database Connection
// ============================================

async function connectToDatabase(): Promise<void> {
  const config = getConfig();

  try {
    configLogger.info('Connecting to MongoDB...', { uri: config.MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });

    await mongoose.connect(config.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    configLogger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      configLogger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      configLogger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      configLogger.info('MongoDB reconnected');
    });
  } catch (error) {
    configLogger.error('Failed to connect to MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ============================================
// Graceful Shutdown
// ============================================

async function gracefulShutdown(signal: string): Promise<void> {
  configLogger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      configLogger.info('HTTP server closed');
    });
  }

  // Close database connection
  try {
    await mongoose.connection.close();
    configLogger.info('MongoDB connection closed');
  } catch (error) {
    configLogger.error('Error closing MongoDB connection', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }

  configLogger.info('Graceful shutdown completed');
  process.exit(0);
}

// ============================================
// Start Server
// ============================================

let server: ReturnType<Express['listen']> | null = null;

async function startServer(): Promise<void> {
  // Load configuration
  loadConfig();
  const config = getConfig();

  configLogger.info('Starting REZ Unified Booking Service', {
    nodeEnv: config.NODE_ENV,
    port: config.PORT,
    verticalsCount: VERTICAL_COUNT,
  });

  // Connect to database
  await connectToDatabase();

  // Create Express app
  const app = createApp();

  // Start HTTP server
  server = app.listen(config.PORT, () => {
    configLogger.info(`Server running on port ${config.PORT}`, {
      url: `http://localhost:${config.PORT}`,
      healthCheck: `http://localhost:${config.PORT}/health`,
      apiBase: `http://localhost:${config.PORT}/api/v1`,
    });

    configLogger.info('Available routes:', {
      routes: [
        'GET  /health',
        'GET  /health/live',
        'GET  /health/ready',
        'GET  /metrics',
        'GET  /api/v1/search/availability',
        'GET  /api/v1/search/availability/all',
        'GET  /api/v1/search/merchants',
        'POST /api/v1/bookings',
        'GET  /api/v1/bookings',
        'GET  /api/v1/bookings/:bookingId',
        'PUT  /api/v1/bookings/:bookingId',
        'POST /api/v1/bookings/:bookingId/cancel',
        'GET  /api/v1/bookings/:bookingId/reschedule',
        'POST /api/v1/bookings/:bookingId/pay',
        'POST /api/v1/bookings/:bookingId/refund',
        'POST /api/v1/waitlist',
        'GET  /api/v1/waitlist/user/:userId',
        'DELETE /api/v1/waitlist/:entryId',
        'POST /api/v1/waitlist/:entryId/notify',
        'GET  /api/v1/calendars/user/:userId',
        'GET  /api/v1/calendars/merchant/:merchantId',
        'GET  /api/v1/verticals',
        'GET  /api/v1/verticals/:vertical',
        'GET  /api/v1/verticals/:vertical/bookings/:bookingId',
        'PUT  /api/v1/verticals/:vertical/bookings/:bookingId',
        'DELETE /api/v1/verticals/:vertical/bookings/:bookingId',
      ],
    });
  });

  // Handle server errors
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      configLogger.error(`Port ${config.PORT} is already in use`);
      process.exit(1);
    }
    configLogger.error('Server error', { error: error.message });
  });

  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    configLogger.error('Uncaught exception', { error: error.message, stack: error.stack });
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    configLogger.error('Unhandled rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      promise: String(promise),
    });
  });
}

// Start the server
startServer().catch((error) => {
  configLogger.error('Failed to start server', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
});

export { createApp, connectToDatabase };