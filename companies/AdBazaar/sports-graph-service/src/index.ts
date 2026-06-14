import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database.js';
import logger from './config/logger.js';
import metricsRegistry, { httpRequestDuration, httpRequestTotal } from './config/metrics.js';
import { authMiddleware } from './middleware/auth.js';

// Import routes
import sportsRoutes from './routes/sports.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4883;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging and metrics
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode.toString() },
      duration
    );
    httpRequestTotal.inc(
      { method: req.method, route, status_code: res.statusCode.toString() }
    );
    
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(3)}s`
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      status: 'healthy',
      service: 'sports-graph-service',
      port: PORT,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: 'Service error' });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// API routes
app.use('/api/sports', authMiddleware, sportsRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    app.listen(PORT, () => {
      logger.info(`Sports Graph Service started on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`API: http://localhost:${PORT}/api/sports`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;
