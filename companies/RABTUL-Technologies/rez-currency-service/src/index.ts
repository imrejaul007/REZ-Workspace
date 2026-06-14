/**
 * ReZ Currency Service
 * Multi-currency service with real-time exchange rates and conversion
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import currencyRoutes from './routes/currency.routes';
import logger from './utils/logger';

const PORT = process.env.PORT || 4026;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Create and configure Express application
 */
function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });

    next();
  });

  // API routes
  app.use('/api', currencyRoutes);

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      service: 'ReZ Currency Service',
      version: '1.0.0',
      description: 'Multi-currency service with real-time exchange rates and conversion',
      endpoints: {
        health: 'GET /api/health',
        currencies: 'GET /api/currencies',
        currencyDetails: 'GET /api/currencies/:code',
        rates: 'GET /api/rates',
        rate: 'GET /api/rates/:from/:to',
        convert: 'POST /api/convert',
        convertBatch: 'POST /api/convert/batch',
        format: 'GET /api/format',
        refreshRates: 'POST /api/rates/refresh'
      }
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`
      }
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An internal error occurred'
          : err.message
      }
    });
  });

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    const app = createApp();

    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-currency-service',
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
app.listen(Number(PORT), HOST, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║           ReZ Currency Service Started                    ║
╠═══════════════════════════════════════════════════════════╣
║  Server:  http://${HOST}:${PORT}                            ║
║  Health:  http://${HOST}:${PORT}/api/health                ║
║  API:     http://${HOST}:${PORT}/api                        ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export { createApp };
