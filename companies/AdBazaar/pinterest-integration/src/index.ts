import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import promClient from 'prom-client';
import config from './config';
import routes from './routes';
import logger from 'utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware';

// Initialize Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'pinterest_integration_' });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const pinterestApiCalls = new promClient.Counter({
  name: 'pinterest_api_calls_total',
  help: 'Total number of Pinterest API calls',
  labelNames: ['endpoint', 'status'],
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
    httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode });

    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}s`,
    });
  });

  next();
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'pinterest-integration',
    version: '1.0.0',
    description: 'Pinterest API integration service for AdBazaar',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      api: '/api',
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'pinterest-integration',
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
app.listen(config.server.port, () => {
      logger.info(`Pinterest Integration Service started on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.server.port}/api/health`);
      logger.info(`Metrics: http://localhost:${config.server.port}/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

startServer();

export default app;