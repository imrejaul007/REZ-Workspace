import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { connectMongoDB, connectRedis, closeConnections, checkDependencies, config } from './config';
import { logger } from './utils/logger';
import { register, metrics } from './utils/metrics';
import { internalServiceAuth, requestLogger, rateLimit } from './middleware/auth';
import deviceRoutes from './routes/devices';

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Service-Id', 'X-API-Key'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimit(1000, 60000));

// Health check endpoint (no auth required)
app.get('/health', async (req: Request, res: Response) => {
  try {
    const deps = await checkDependencies();

    const healthy = deps.mongodb && deps.redis;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'unhealthy',
      service: 'device-graph-service',
      version: '1.0.0',
      port: config.port,
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: deps.mongodb ? 'connected' : 'disconnected',
        redis: deps.redis ? 'connected' : 'disconnected',
      },
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'device-graph-service',
      error: error.message,
    });
  }
});

// Readiness check
app.get('/ready', async (req: Request, res: Response) => {
  try {
    const deps = await checkDependencies();

    if (deps.mongodb) {
      res.status(200).json({ ready: true });
    } else {
      res.status(503).json({ ready: false, reason: 'Dependencies not ready' });
    }
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API routes
app.use('/api/devices', deviceRoutes);

// Household routes
app.get('/api/households/:id', internalServiceAuth, async (req: Request, res: Response) => {
  const { householdService } = await import('./services');
  try {
    const household = await householdService.getHousehold(req.params.id);
    if (!household) {
      res.status(404).json({ success: false, error: 'Household not found' });
      return;
    }
    res.json({ success: true, data: household });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/households', internalServiceAuth, async (req: Request, res: Response) => {
  const { householdService } = await import('./services');
  try {
    const household = await householdService.createHousehold(req.body);
    res.status(201).json({ success: true, data: household });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// User graph routes
app.get('/api/users/:userId/graph', internalServiceAuth, async (req: Request, res: Response) => {
  const { graphService } = await import('./services');
  try {
    const graph = await graphService.buildUserGraph(req.params.userId);
    res.json({ success: true, data: graph });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Resolution history
app.get('/api/users/:userId/cross-device', internalServiceAuth, async (req: Request, res: Response) => {
  const { resolutionService } = await import('./services');
  try {
    const result = await resolutionService.getUserCrossDeviceGraph(req.params.userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', { error: err instanceof Error ? err.message : String(err) });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await closeConnections();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Connect to Redis (optional - service can work without it)
    try {
      await connectRedis();
    } catch (error) {
      logger.warn('Redis connection failed. Service will run without Redis caching.');
    }

    // Start HTTP server
    app.listen(config.port, () => {
      logger.info(`Device Graph Service started on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Export for testing
export { app };

// Start if running directly
if (require.main === module) {
  startServer();
}
