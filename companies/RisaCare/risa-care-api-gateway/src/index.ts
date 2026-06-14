// RisaCare API Gateway - Main Entry Point

import express from 'express';
import {
  requestId,
  securityHeaders,
  corsMiddleware,
  compressionMiddleware,
  globalRateLimiter,
  errorHandler,
  requestLogger,
  healthCheck
} from './middleware';
import { createMainRouter, createWebSocketRouter } from './routes';
import { logger } from '@risa-care/shared/utils';

// ============================================
// APP SETUP
// ============================================

const app = express();

// Trust proxy (for rate limiting behind load balancer)
app.set('trust proxy', 1);

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

app.use(requestId);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(compressionMiddleware);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(globalRateLimiter);
app.use(requestLogger);

// ============================================
// ROUTES
// ============================================

// Main API router
const mainRouter = createMainRouter();
app.use('/health/v1', mainRouter);

// WebSocket router
const wsRouter = createWebSocketRouter();
app.use('/health/v1/ws', wsRouter);

// Legacy support (redirect v1 to main)
app.use('/api', mainRouter);

// ============================================
// ERROR HANDLING
// ============================================

app.use(errorHandler);

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId
    }
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = parseInt(process.env.PORT || '4700', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-api-gateway',
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
app.listen(PORT, HOST, () => {
  logger.info(`RisaCare API Gateway started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Service Version: ${process.env.SERVICE_VERSION || '1.0.0'}`);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after timeout
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', reason as Error, { promise });
});

export default app;
