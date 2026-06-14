import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { config } from './config';
import { logger, logInfo, logError } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestIdMiddleware, timestampMiddleware } from './middleware/validation';
import { healthRateLimiter } from './middleware/rateLimit';

// Import routes
import consultRoutes from './routes/consult.routes';
import wellnessRoutes from './routes/wellness.routes';
import pricingRoutes from './routes/pricing.routes';
import insightsRoutes from './routes/insights.routes';

// Import models for database connection
import './models';

// Create Express app
const app: Express = express();

// Trust proxy (for rate limiting behind load balancer)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-Id'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (Morgan)
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
  skip: (req) => req.url === '/health' || req.url === '/health/live',
}));

// Request metadata middleware
app.use(requestIdMiddleware);
app.use(timestampMiddleware);

// Health check routes (before rate limiting for basic checks)
app.get('/health', healthRateLimiter, (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'rez-mind-spa-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', healthRateLimiter, async (_req: Request, res: Response) => {
  const checks = {
    mongodb: false,
  };

  // Check MongoDB connection
  checks.mongodb = mongoose.connection.readyState === 1;

  const allHealthy = Object.values(checks).every(Boolean);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/consult', consultRoutes);
app.use('/api/v1/wellness', wellnessRoutes);
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api/v1/insights', insightsRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'REZ Mind Spa Service',
    version: '1.0.0',
    description: 'AI-powered intelligence service for the spa industry',
    endpoints: {
      health: '/health',
      consult: '/api/v1/consult',
      wellness: '/api/v1/wellness',
      pricing: '/api/v1/pricing',
      insights: '/api/v1/insights',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    const mongoOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(config.mongodbUri, mongoOptions);
    logInfo('Connected to MongoDB', { uri: config.mongodbUri.replace(/\/\/.*@/, '//<credentials>@') });

    mongoose.connection.on('error', (error) => {
      logError('MongoDB connection error', error);
    });

    mongoose.connection.on('disconnected', () => {
      logWarn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logInfo('MongoDB reconnected');
    });
  } catch (error) {
    logError('Failed to connect to MongoDB', error);
    throw error;
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logInfo(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logInfo('HTTP server closed');

    // Close MongoDB connection
    try {
      await mongoose.connection.close();
      logInfo('MongoDB connection closed');
    } catch (error) {
      logError('Error closing MongoDB connection', error);
    }

    // Exit process
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logError('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Start server
let server: ReturnType<Express['listen']>;

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    server = app.listen(config.port, () => {
      logInfo(`REZ Mind Spa Service started`, {
        port: config.port,
        nodeEnv: config.nodeEnv,
        pid: process.pid,
      });

      logger.info(`
╔════════════════════════════════════════════════════════════╗
║           REZ Mind Spa Service v1.0.0                      ║
╠════════════════════════════════════════════════════════════╣
║  Status:     Running                                        ║
║  Port:       ${String(config.port).padEnd(46)}║
║  Environment: ${config.nodeEnv.padEnd(43)}║
║  MongoDB:    Connected                                       ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    Health:  http://localhost:${config.port}/health              ║
║    API:     http://localhost:${config.port}/api/v1               ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logError('Uncaught exception', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logError('Unhandled rejection', new Error(String(reason)));
    });

  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
}

// Start the application
startServer();

export default app;
