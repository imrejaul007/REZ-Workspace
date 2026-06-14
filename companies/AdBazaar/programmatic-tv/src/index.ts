import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { connectMongoDB, connectRedis } from './services/database.js';
import routes from './routes/index.js';
import { requestId, requestLogger, errorHandler } from './middleware/rateLimit.js';
import { metricsMiddleware, getMetrics } from './utils/metrics.js';
import { logger } from './utils/logger.js';

// Create Express application
const app: Express = express();

// ============================================================================
// Security & Middleware
// ============================================================================

// Trust proxy (for X-Forwarded-For headers)
app.set('trust proxy', 1);

// Helmet for security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: config.cors.origin,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID
app.use(requestId);

// Request logging
app.use(requestLogger);

// Metrics middleware
app.use(metricsMiddleware);

// ============================================================================
// Routes
// ============================================================================

// API routes
app.use('/api', routes);

// Metrics endpoint (Prometheus format)
if (config.metrics.enabled) {
  app.get(config.metrics.path, async (req: Request, res: Response) => {
    try {
      res.set('Content-Type', 'text/plain');
      res.send(await getMetrics());
    } catch (error) {
      res.status(500).send('Error collecting metrics');
    }
  });
}

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler
app.use(errorHandler);

// ============================================================================
// Server Startup
// ============================================================================

async function startServer(): Promise<void> {
  try {
    // Connect to databases
    logger.info('Connecting to MongoDB...');
    await connectMongoDB();

    logger.info('Connecting to Redis...');
    await connectRedis();

    // Start HTTP server
    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'programmatic-tv',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(config.port, () => {
      logger.info(`Programmatic TV Service started`, {
        port: config.port,
        env: config.nodeEnv,
        openRtbVersion: config.openRtbVersion,
      });

      logger.info(`API available at http://localhost:${config.port}/api`);
      logger.info(`Health check at http://localhost:${config.port}/api/health`);
      logger.info(`Metrics at http://localhost:${config.port}${config.metrics.path}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

// Export for testing
export default app;