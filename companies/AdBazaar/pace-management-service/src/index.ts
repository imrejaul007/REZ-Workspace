import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { register } from 'prom-client';

// Load environment variables
dotenv.config();

// Import utilities
import logger, { pacingLogger } from 'utils/logger.js';
import metrics, { recordApiMetrics } from './utils/metrics';

// Import services
import { redisClient } from './services/redisClient';

// Import routes
import { pacingRoutes } from './routes';

// Import middleware
import { errorHandler, requestLogger } from './middleware/auth';

// Import services for dashboard
import { pacingService, statusService, forecastService, alertService } from './services';

// Initialize Express app
const app: Express = express();

// Configuration
const PORT = process.env.PORT || 4983;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pace_management';

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Request timing middleware for metrics
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    recordApiMetrics(req.method, route, res.statusCode, duration);
  });

  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient.isReady() ? 'connected' : 'disconnected';

  const health = {
    status: 'healthy',
    service: 'pace-management-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: {
      mongodb: mongoStatus,
      redis: redisStatus
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  };

  const isHealthy = mongoStatus === 'connected' && redisStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json(health);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metricsData = await register.metrics();
    res.end(metricsData);
  } catch (error: any) {
    logger.error('Failed to get metrics', { error: error.message });
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Dashboard endpoint
app.get('/api/pace/dashboard', async (req: Request, res: Response) => {
  try {
    const [pacingStats, statusStats, alertStats] = await Promise.all([
      pacingService.getPacingStats(),
      statusService.getAggregateStats(),
      alertService.getAlertStats()
    ]);

    const dashboard = {
      summary: {
        totalCampaigns: pacingStats.totalCampaigns,
        activeCampaigns: pacingStats.activeCampaigns,
        totalBudget: pacingStats.totalBudget,
        totalSpent: statusStats.totalSpent,
        totalRemaining: statusStats.totalRemaining,
        averagePace: Math.round(statusStats.averagePace * 100) / 100
      },
      status: {
        onTrack: statusStats.onTrack,
        ahead: statusStats.ahead,
        behind: statusStats.behind,
        exhausted: statusStats.exhausted
      },
      strategies: pacingStats.byStrategy,
      alerts: {
        total: alertStats.totalAlerts,
        active: alertStats.activeAlerts,
        bySeverity: alertStats.bySeverity,
        byType: alertStats.byType
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    logger.error('Failed to get dashboard data', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Pacing routes
app.use('/api/pace', pacingRoutes);

// Auto-optimization endpoint (can be called by cron)
app.post('/api/pace/auto-optimize', async (req: Request, res: Response) => {
  try {
    const { OptimizationService } = require('./services/optimizationService');
    const result = await OptimizationService.prototype.autoOptimizeBehindCampaigns.call(
      OptimizationService.prototype
    );

    res.json({
      success: true,
      data: result,
      message: 'Auto-optimization completed'
    });
  } catch (error: any) {
    logger.error('Auto-optimization failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Campaign bulk operations
app.post('/api/pace/campaigns/bulk', async (req: Request, res: Response) => {
  try {
    const { campaigns } = req.body;

    if (!Array.isArray(campaigns)) {
      res.status(400).json({
        success: false,
        error: 'campaigns must be an array'
      });
      return;
    }

    const result = await pacingService.bulkCreatePacing(campaigns);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Bulk campaign creation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Database connection
async function connectToMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
  } catch (error: any) {
    logger.error('Failed to connect to MongoDB', { error: error.message });
    throw error;
  }
}

// Redis connection
async function connectToRedis(): Promise<void> {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis');
  } catch (error: any) {
    logger.error('Failed to connect to Redis', { error: error.message });
    // Continue without Redis - service can still work with MongoDB
    logger.warn('Service will operate without Redis caching');
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Close Redis connection
    await redisClient.disconnect();

    // Close MongoDB connection
    await mongoose.connection.close();

    logger.info('All connections closed');
    process.exit(0);
  } catch (error: any) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectToMongoDB();
    await connectToRedis();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Pace Management Service started`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      });
      pacingLogger.info('Service is ready to accept requests', { port: PORT });
    });
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Start the application
startServer();

// Export for testing
export default app;