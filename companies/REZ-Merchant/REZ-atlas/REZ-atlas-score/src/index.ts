/**
 * REZ Atlas Score - AI-Powered Lead Scoring Engine
 * The Merchant Intelligence Network for the Physical World
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Security and logging imports
import { securityMiddleware, writeRateLimitMiddleware } from './middleware/security.js';
import { logger, requestLogger } from './middleware/logger.js';
import healthRoutes from './routes/health.js';
import { scoreRoutes } from './routes/score.js';

const PORT = parseInt(process.env.PORT || '5154', 10);
const app = express();

// ================================================
// Trust proxy for accurate IP logging
// ================================================
app.set('trust proxy', 1);

// ================================================
// Security Middleware Stack
// ================================================
securityMiddleware.forEach(middleware => app.use(middleware));

// ================================================
// Request Logging
// ================================================
app.use(requestLogger);

// ================================================
// Body Parsing
// ================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ================================================
// Health Routes (no rate limiting)
// ================================================
app.use(healthRoutes);

// ================================================
// API Routes with rate limiting
// ================================================
app.use('/api', writeRateLimitMiddleware, scoreRoutes);

// ================================================
// Error Handler
// ================================================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId || 'unknown';

  logger.error('Unhandled error', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId,
    timestamp: new Date().toISOString(),
  });
});

// ================================================
// 404 Handler
// ================================================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// ================================================
// Database Connection (optional, service can run without)
// ================================================
const connectDatabase = async () => {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    logger.warn('MONGODB_URI not set, running without database');
    return;
  }

  try {
    await mongoose.connect(mongodbUri);
    logger.info('Connected to MongoDB', { uri: mongodbUri.replace(/\/\/.*@/, '//***@') });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
  }
};

// ================================================
// Graceful Shutdown
// ================================================
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);

  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  });
};

// ================================================
// Start Server
// ================================================
connectDatabase();

const server = app.listen(PORT, () => {
  logger.info(`REZ Atlas Score started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.SERVICE_VERSION || '1.0.0',
  });

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   📊 REZ ATLAS SCORE                                         ║
║   AI-Powered Lead Scoring Engine                              ║
║                                                               ║
║   Port: ${PORT}                                                 ║
║   Environment: ${process.env.NODE_ENV || 'development'}                               ║
║                                                               ║
║   Endpoints:                                                  ║
║   - GET  /health          Basic health check                 ║
║   - GET  /health/live     Liveness probe                     ║
║   - GET  /health/ready    Readiness probe                    ║
║   - GET  /health/detailed Detailed health with metrics       ║
║   - GET  /metrics         Prometheus metrics                 ║
║   - GET  /api/leads       List leads                         ║
║   - POST /api/leads       Create lead                        ║
║   - GET  /api/stats       Lead statistics                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;