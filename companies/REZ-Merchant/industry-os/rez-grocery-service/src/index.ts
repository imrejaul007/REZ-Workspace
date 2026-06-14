/**
 * REZ Grocery Service
 *
 * Main entry point for the Grocery Store Management Service.
 * Handles product inventory, supplier orders, expiry tracking, and freshness management.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import routes
import productsRouter from './routes/products.routes';
import inventoryRouter from './routes/inventory.routes';
import supplierOrdersRouter from './routes/supplier-orders.routes';

// Import middleware
import { authenticateToken, authenticateInternalService } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter, authLimiter, bulkOperationsLimiter } from './middleware/rateLimit';

// Import services
import { expiryTracker } from './services/expiryTracker';
import { inventoryService } from './services/inventoryService';

// Load environment variables
dotenv.config();

const app: Express = express();
const isProduction = process.env.NODE_ENV === 'production';

// Configuration
const PORT = process.env.PORT || 4052;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-grocery';

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

if (isProduction && corsOrigins.length === 0) {
  logger.error('[FATAL] CORS_ORIGIN must be set in production');
  process.exit(1);
}

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: isProduction ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000', 'http://localhost:8080']),
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate limiting - general
app.use(generalLimiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log request
  logger.http(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';

    logger[logLevel](`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
});

// Health check endpoints (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-grocery-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoState = mongoose.connection.readyState;
    const mongoReady = mongoState === 1;

    if (!mongoReady) {
      res.status(503).json({
        status: 'not ready',
        service: 'rez-grocery-service',
        checks: {
          mongodb: mongoState === 1 ? 'connected' : 'disconnected'
        }
      });
      return;
    }

    res.json({
      status: 'ready',
      service: 'rez-grocery-service',
      timestamp: new Date().toISOString(),
      checks: {
        mongodb: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'rez-grocery-service',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Internal service routes (with internal token auth)
app.use('/internal', authenticateInternalService);

// Internal health check
app.get('/internal/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-grocery-service',
    timestamp: new Date().toISOString()
  });
});

// Internal inventory alerts
app.get('/internal/inventory/alerts', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: 'merchantId is required'
      });
      return;
    }

    const alerts = await inventoryService.getUnresolvedAlerts(merchantId);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Internal expiry scan
app.post('/internal/inventory/scan-expiry', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.body;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: 'merchantId is required'
      });
      return;
    }

    const result = await expiryTracker.scanAndAlert(merchantId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Public API routes (with JWT auth)
app.use('/api/products', authenticateToken, productsRouter);
app.use('/api/inventory', authenticateToken, inventoryRouter);
app.use('/api/supplier-orders', authenticateToken, supplierOrdersRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Expiry tracking configuration endpoint
app.put('/api/config/expiry', authenticateToken, (req: Request, res: Response) => {
  try {
    const { criticalDays, urgentDays, warningDays, noticeDays } = req.body;

    expiryTracker.setConfig({
      criticalDays: criticalDays || 3,
      urgentDays: urgentDays || 7,
      warningDays: warningDays || 14,
      noticeDays: noticeDays || 30
    });

    res.json({
      success: true,
      message: 'Expiry tracker configuration updated',
      config: expiryTracker.getConfig()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get expiry tracker configuration
app.get('/api/config/expiry', authenticateToken, (_req: Request, res: Response) => {
  res.json({
    success: true,
    config: expiryTracker.getConfig()
  });
});

// Database connection and server start
async function startServer(): Promise<void> {
  try {
    logger.info('Connecting to MongoDB...');

    // MongoDB connection options
    const mongoOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(MONGODB_URI, mongoOptions);
    logger.info('Connected to MongoDB successfully');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info('========================================');
      logger.info('  REZ Grocery Service');
      logger.info(`  Port: ${PORT}`);
      logger.info(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('========================================');
      logger.info('API Endpoints:');
      logger.info('  GET    /health                    - Health check');
      logger.info('  GET    /ready                     - Readiness check');
      logger.info('  GET    /api/products              - List products');
      logger.info('  POST   /api/products              - Create product');
      logger.info('  GET    /api/products/:id          - Get product');
      logger.info('  PUT    /api/products/:id          - Update product');
      logger.info('  DELETE /api/products/:id          - Delete product');
      logger.info('  GET    /api/products/barcode/:bc  - Scan barcode');
      logger.info('  POST   /api/products/bulk         - Bulk import');
      logger.info('  GET    /api/inventory/alerts     - Get alerts');
      logger.info('  GET    /api/inventory/low-stock  - Low stock items');
      logger.info('  GET    /api/inventory/expiring   - Expiring items');
      logger.info('  POST   /api/inventory/stock-adjust - Adjust stock');
      logger.info('  GET    /api/supplier-orders      - List orders');
      logger.info('  POST   /api/supplier-orders       - Create order');
      logger.info('  PUT    /api/supplier-orders/:id  - Update order');
      logger.info('  PUT    /api/supplier-orders/:id/status - Update status');
      logger.info('========================================');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
        } catch (error) {
          logger.error('Error closing MongoDB connection:', error);
        }

        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;