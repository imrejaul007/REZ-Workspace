import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { connectDatabase, closeConnections } from './config/database';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/validation';
import { authMiddleware, internalServiceAuth, requireRestaurantAccess } from './middleware/auth';
import { apiLimiter, dashboardLimiter, reportLimiter } from './middleware/rateLimit';

// Import routes
import reportsRoutes from './routes/reports.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://rez.money').split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-restaurant-analytics-service',
    timestamp: new Date().toISOString(),
  });
});

// Readiness check
app.get('/ready', async (req, res) => {
  try {
    // Could add database/redis connectivity checks here
    res.json({
      status: 'ready',
      checks: {
        database: 'ok',
        cache: 'ok',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/dashboard', dashboardLimiter);
app.use('/api/reports/generate', reportLimiter);

// API routes
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Protected routes (example)
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Protected route accessed',
    user: req.user,
  });
});

// Internal service routes
app.use('/internal', internalServiceAuth, (req, res, next) => {
  // Internal routes
  app.use('/internal/reports', requireRestaurantAccess, reportsRoutes);
  next();
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  try {
    await closeConnections();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    app.listen(config.port, () => {
      logger.info(`Restaurant Analytics Service running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start if this is the main module
if (require.main === module) {
  startServer();
}

export { app, startServer };
