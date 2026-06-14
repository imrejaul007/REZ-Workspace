import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './config/database.js';
import { logger } from './config/logger.js';
import { complianceRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler, zodErrorHandler } from './middleware/error.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { complianceService } from './services/compliance.service.js';
import client from 'prom-client';

const app = express();
const PORT = process.env.PORT || 5113;

// Initialize Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const complianceChecksTotal = new client.Counter({
  name: 'compliance_checks_total',
  help: 'Total number of compliance checks',
  labelNames: ['status', 'platform'],
});

const complianceScore = new client.Gauge({
  name: 'compliance_score_average',
  help: 'Average compliance score',
});

register.registerMetric(httpRequestDuration);
register.registerMetric(complianceChecksTotal);
register.registerMetric(complianceScore);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.route?.path || req.path, res.statusCode.toString()).observe(duration);

    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(3)}s`,
    });
  });

  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'content-compliance-ai',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end('Error collecting metrics');
  }
});

// API routes
app.use('/api/compliance', complianceRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(zodErrorHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Connected to MongoDB');

    // Initialize default compliance rules
    await complianceService.initializeDefaultRules();
    logger.info('Default compliance rules initialized');

    // Start listening
    app.listen(PORT, () => {
      logger.info(`Content Compliance AI service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`API: http://localhost:${PORT}/api/compliance`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;