import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

import { connectDatabase, isDatabaseConnected } from './config/database.js';
import { connectRedis, isRedisConnected } from './config/redis.js';
import logger from './config/logger.js';
import attributionRoutes from './routes/attributionRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Prometheus registry
const register = new Registry();
collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new Counter({
  name: 'intent_attribution_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

const httpRequestDuration = new Histogram({
  name: 'intent_attribution_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const activeConnections = new Gauge({
  name: 'intent_attribution_active_connections',
  help: 'Number of active connections',
  registers: [register]
});

const conversionsTotal = new Counter({
  name: 'intent_attribution_conversions_total',
  help: 'Total number of conversions tracked',
  labelNames: ['type', 'model'],
  registers: [register]
});

const attributionCalculationsTotal = new Counter({
  name: 'intent_attribution_calculations_total',
  help: 'Total number of attribution calculations',
  labelNames: ['model'],
  registers: [register]
});

// Create Express app
const app: Express = express();

// Trust proxy (for rate limiting behind load balancer)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for API
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Service-Key']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging and metrics
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const path = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      path: path,
      status: res.statusCode.toString()
    });

    httpRequestDuration.observe({
      method: req.method,
      path: path,
      status: res.statusCode.toString()
    }, duration);

    activeConnections.dec();

    logger.info('Request completed', {
      method: req.method,
      path: path,
      status: res.statusCode,
      duration: `${duration.toFixed(3)}s`,
      ip: req.ip
    });
  });

  next();
});

// Health check endpoints
app.get('/health', async (req: Request, res: Response) => {
  const mongoConnected = isDatabaseConnected();
  const redisConnected = isRedisConnected();

  const status = mongoConnected && redisConnected ? 'healthy' : 'degraded';

  res.status(status === 'healthy' ? 200 : 503).json({
    status,
    service: 'intent-attribution',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    checks: {
      mongodb: mongoConnected ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'disconnected'
    }
  });
});

app.get('/health/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  const mongoConnected = isDatabaseConnected();
  const redisConnected = isRedisConnected();

  if (mongoConnected && redisConnected) {
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        mongodb: mongoConnected ? 'connected' : 'disconnected',
        redis: redisConnected ? 'connected' : 'disconnected'
      }
    });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// API routes
app.use('/api/attribution', attributionRoutes);

// API documentation
app.get('/api', (req: Request, res: Response) => {
  res.json({
    service: 'Intent Attribution Service',
    version: '1.0.0',
    description: 'Tracks conversion attribution from intent signals to purchase',
    endpoints: {
      POST: {
        '/api/attribution/convert': 'Report a conversion event',
        '/api/attribution/model': 'Set attribution model'
      },
      GET: {
        '/api/attribution/report': 'Generate attribution report',
        '/api/attribution/journey/:userId': 'Get user attribution journey',
        '/api/attribution/segments': 'Attribution by segment',
        '/api/attribution/sources': 'Attribution by source',
        '/api/attribution/timeline': 'Conversion timeline',
        '/api/attribution/roi': 'ROI metrics',
        '/api/attribution/efficiency': 'Attribution efficiency',
        '/api/attribution/compare-models': 'Compare attribution models',
        '/api/attribution/position': 'Attribution by position',
        '/api/attribution/stats': 'Conversion statistics'
      }
    },
    health: {
      '/health': 'Full health check',
      '/health/live': 'Liveness probe',
      '/health/ready': 'Readiness probe',
      '/metrics': 'Prometheus metrics'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new requests
  // Give time for in-flight requests to complete
  await new Promise(resolve => setTimeout(resolve, 5000));

  logger.info('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function startServer(): Promise<void> {
  const PORT = parseInt(process.env.PORT || '4803', 10);

  try {
    // Connect to databases
    logger.info('Connecting to databases...');
    await connectDatabase();
    await connectRedis();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Intent Attribution Service started`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        url: `http://localhost:${PORT}`
      });

      logger.info('Available endpoints:', {
        health: `http://localhost:${PORT}/health`,
        metrics: `http://localhost:${PORT}/metrics`,
        api: `http://localhost:${PORT}/api`
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to start server', { error: errorMessage });
    process.exit(1);
  }
}

startServer();

export { app, register };