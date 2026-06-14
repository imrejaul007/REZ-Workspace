import express, { Express, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dashboardRoutes from './routes/dashboard.routes';
import { aggregationWorker } from './workers/aggregationWorker';
import { aggregationService } from './services/aggregationService';

const app: Express = express();
const PORT = 4016;
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Security: Fail fast on missing CORS in production
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
if (isProduction && allowedOrigins.length === 0) {
  throw new Error('[FATAL] ALLOWED_ORIGINS is required in production');
}

// CORS configuration
const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin) return callback(null, true);
  if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return callback(null, true);
  }
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  callback(new Error(`Origin ${origin} not allowed by CORS policy`));
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-analytics-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/dashboard', dashboardRoutes);

// Worker status endpoint
app.get('/api/worker/status', (req: Request, res: Response) => {
  const stats = aggregationWorker.getStats();
  res.json({
    success: true,
    data: stats,
  });
});

// Manual aggregation trigger endpoint
app.post('/api/worker/trigger', async (req: Request, res: Response) => {
  const { type } = req.body;

  if (!['hourly', 'daily', 'weekly', 'full'].includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid aggregation type. Must be "hourly", "daily", "weekly", or "full"',
    });
  }

  const result = await aggregationWorker.triggerAggregation(type);
  res.json(result);
});

// Cache management endpoint
app.post('/api/worker/cache/clear', (req: Request, res: Response) => {
  aggregationService.clearCache();
  res.json({
    success: true,
    message: 'Aggregation cache cleared',
  });
});

// Last aggregation info
app.get('/api/worker/aggregation-info', (req: Request, res: Response) => {
  const lastAggregation = aggregationService.getLastAggregationTime();
  res.json({
    success: true,
    data: {
      lastAggregation: lastAggregation?.toISOString() || null,
      nextScheduledRun: 'See worker stats for details',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info('==========================================');
  logger.info('  ReZ Analytics Dashboard Service');
  logger.info('==========================================');
  logger.info(`  Status:      RUNNING`);
  logger.info(`  Port:        ${PORT}`);
  logger.info(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('==========================================');
  logger.info('');
  logger.info('Available endpoints:');
  logger.info('  GET  /health                      - Health check');
  logger.info('  GET  /api/dashboard/summary       - Dashboard summary');
  logger.info('  GET  /api/dashboard/kpis           - Real-time KPIs');
  logger.info('  GET  /api/dashboard/revenue        - Revenue data');
  logger.info('  GET  /api/dashboard/orders         - Order analytics');
  logger.info('  GET  /api/dashboard/customers      - Customer metrics');
  logger.info('  GET  /api/dashboard/merchants      - Merchant performance');
  logger.info('  GET  /api/dashboard/products       - Top products');
  logger.info('  GET  /api/dashboard/charts         - All chart data');
  logger.info('  GET  /api/dashboard/charts/:type   - Specific chart');
  logger.info('  POST /api/dashboard/export         - Export data (CSV/PDF)');
  logger.info('  GET  /api/worker/status            - Worker statistics');
  logger.info('  POST /api/worker/trigger           - Manual aggregation');
  logger.info('');
  logger.info(`Server listening on http://localhost:${PORT}`);
  logger.info('');
});

// Start aggregation worker
aggregationWorker.start();

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('\nReceived SIGINT, shutting down gracefully...');
  aggregationWorker.stop();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('\nReceived SIGTERM, shutting down gracefully...');
  aggregationWorker.stop();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  aggregationWorker.stop();
  server.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
