import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

import logger, { calendarLogger, platformLogger, scheduleLogger } from './utils/logger';
import { calendarService } from './services/calendar.service';
import { platformConnectorService } from './services/platform-connector.service';

// Routes
import calendarRoutes from './routes/calendar.routes';
import postRoutes from './routes/post.routes';
import scheduleRoutes from './routes/schedule.routes';
import conflictRoutes from './routes/conflict.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();

// Configuration
const PORT = process.env.PORT || 4800;
const HOST = process.env.HOST || '0.0.0.0';

// Ensure logs directory exists
const logsDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API service
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Platform', 'X-Service'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const platformHealth = await platformConnectorService.checkAllPlatformHealth();

  const healthData = {
    status: 'healthy',
    service: 'rez-unified-calendar',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    platforms: Object.fromEntries(platformHealth),
  };

  // Mark unhealthy if all platforms are down
  const allPlatformsDown = Array.from(platformHealth.values()).every(status => !status);
  if (allPlatformsDown) {
    healthData.status = 'degraded';
  }

  res.status(healthData.status === 'healthy' ? 200 : 503).json(healthData);
});

// Ready check endpoint
app.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check if service is initialized
    const analytics = await calendarService.getAnalytics();
    res.json({
      ready: true,
      service: 'rez-unified-calendar',
      timestamp: new Date().toISOString(),
      stats: {
        totalPosts: analytics.totalPosts,
        conflicts: analytics.conflictCount,
      },
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      service: 'rez-unified-calendar',
      error: 'Service not ready',
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/calendar', calendarRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/conflicts', conflictRoutes);

// API Documentation endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'ReZ Unified Calendar Service',
    version: '1.0.0',
    description: 'Unified content calendar for AdBazaar - aggregates scheduled posts from all platforms',
    endpoints: {
      health: {
        'GET /health': 'Service health check',
        'GET /ready': 'Service readiness check',
      },
      calendar: {
        'GET /api/calendar/view': 'Get calendar view with filters',
        'GET /api/calendar/events': 'Get events for date range',
        'GET /api/calendar/analytics': 'Get calendar analytics',
        'POST /api/calendar/sync': 'Force sync all platforms',
        'GET /api/calendar/settings/:userId': 'Get user settings',
        'PUT /api/calendar/settings/:userId': 'Update user settings',
        'POST /api/calendar/bulk': 'Bulk operations',
        'GET /api/calendar/platforms/status': 'Check platform connections',
      },
      posts: {
        'GET /api/posts': 'Get all posts (paginated)',
        'GET /api/posts/:id': 'Get single post',
        'POST /api/posts': 'Create new post',
        'PUT /api/posts/:id': 'Update post',
        'DELETE /api/posts/:id': 'Delete post',
        'POST /api/posts/:id/publish': 'Publish post immediately',
        'GET /api/posts/:id/preview': 'Get platform preview',
        'POST /api/posts/:id/duplicate': 'Duplicate post',
        'PATCH /api/posts/:id/status': 'Update post status',
      },
      schedule: {
        'POST /api/schedule/reschedule': 'Reschedule a post',
        'POST /api/schedule/bulk-reschedule': 'Bulk reschedule',
        'GET /api/schedule/suggestions/:postId': 'Get time suggestions',
        'POST /api/schedule/validate': 'Validate scheduled time',
        'GET /api/schedule/upcoming': 'Get upcoming posts',
      },
      conflicts: {
        'GET /api/conflicts': 'Get all conflicts',
        'GET /api/conflicts/:id': 'Get specific conflict',
        'POST /api/conflicts/detect': 'Trigger conflict detection',
        'POST /api/conflicts/:id/resolve': 'Resolve conflict',
        'POST /api/conflicts/:id/auto-resolve': 'Auto-resolve conflict',
        'GET /api/conflicts/check/:postId': 'Check post conflicts',
        'POST /api/conflicts/bulk-resolve': 'Bulk resolve conflicts',
      },
    },
    platforms: ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'whatsapp'],
    port: PORT,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date(),
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date(),
  });
});

// Scheduled tasks using node-cron

// Sync platforms every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  calendarLogger.info('Running scheduled platform sync');
  try {
    await calendarService.syncAllPlatforms();
  } catch (error) {
    calendarLogger.error('Scheduled sync failed', { error });
  }
});

// Detect conflicts every minute
cron.schedule('* * * * *', async () => {
  try {
    await calendarService.detectAllConflicts();
  } catch (error) {
    calendarLogger.error('Scheduled conflict detection failed', { error });
  }
});

// Clean up old published posts (older than 30 days) - daily at midnight
cron.schedule('0 0 * * *', () => {
  scheduleLogger.info('Running daily cleanup');
  // Implementation would delete old published posts
  // For now, just log
});

// Check platform health every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  try {
    const health = await platformConnectorService.checkAllPlatformHealth();
    platformLogger.debug('Platform health check', {
      results: Object.fromEntries(health),
    });
  } catch (error) {
    platformLogger.error('Platform health check failed', { error });
  }
});

// Start server
async function startServer(): Promise<void> {
  try {
    // Initialize calendar service
    calendarLogger.info('Initializing calendar service...');
    await calendarService.initialize();

    // Start Express server
    app.listen(PORT, HOST, () => {
      logger.info(`ReZ Unified Calendar Service started`, {
        host: HOST,
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
      });

      logger.info('Service ready to accept connections');
      logger.info('Available endpoints:', {
        health: `http://${HOST}:${PORT}/health`,
        api: `http://${HOST}:${PORT}/api`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  // Stop accepting new connections
  // (In production, would close HTTP server first)

  // Close database connections, etc.
  logger.info('Cleanup complete, exiting');

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled rejection', {
    reason,
  });
  process.exit(1);
});

// Start the server
startServer();

export default app;
