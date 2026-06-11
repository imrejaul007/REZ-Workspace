// Tracing must be imported before other modules
import './tracing.js';

import * as Sentry from '@sentry/node';
import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================================================
// Sentry Error Tracking
// ============================================================================

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express(),
    new Sentry.Integrations.Mongo(),
  ],
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACE_RATE || '0.1'),
});

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';

// Routes
import aiRoutes from './routes/ai';
import productRoutes from './routes/products';
import customerRoutes from './routes/customers';
import saleRoutes from './routes/sales';
import posRoutes from './routes/pos';
import analyticsRoutes from './routes/analytics';
import retailAiRoutes from './routes/retail-ai';

class Server {
  public app: Application;
  private server: any;
  private mongoConnection: typeof mongoose | null = null;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Security headers
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request processed', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
        });
      });
      next();
    });

    // Global rate limiter
    this.app.use('/api', apiLimiter);

    // Health check (no rate limiting)
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'SHOPFLOW Retail AI Operating System',
        version: '1.0.0',
      });
    });

    // Readiness check
    this.app.get('/ready', async (req: Request, res: Response) => {
      const checks = {
        mongodb: mongoose.connection.readyState === 1,
        memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024, // < 500MB
      };

      const allReady = Object.values(checks).every(Boolean);

      res.status(allReady ? 200 : 503).json({
        ready: allReady,
        checks,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private configureRoutes(): void {
    // API routes
    this.app.use('/ai', aiRoutes);
    this.app.use('/api/ai', aiRoutes);
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/customers', customerRoutes);
    this.app.use('/api/sales', saleRoutes);
    this.app.use('/api/pos', posRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api', retailAiRoutes);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'SHOPFLOW - Retail AI Operating System',
        version: '1.0.0',
        status: 'operational',
        documentation: '/api',
        health: '/health',
        readiness: '/ready',
        agents: [
          { name: 'Inventory Agent', endpoint: '/ai/inventory' },
          { name: 'Loyalty Agent', endpoint: '/ai/loyalty' },
          { name: 'Customer Agent', endpoint: '/ai/customer' },
          { name: 'Checkout Agent', endpoint: '/pos' },
          { name: 'Pricing Agent', endpoint: '/ai/pricing' },
          { name: 'Catalog Agent', endpoint: '/ai/catalog' },
          { name: 'Discovery Agent', endpoint: '/ai/discovery' },
          { name: 'Merchandising Agent', endpoint: '/ai/merchandising' },
          { name: 'Supplier Agent', endpoint: '/ai/supplier' },
          { name: 'Store Agent', endpoint: '/ai/store' },
          { name: 'Retail Media Agent', endpoint: '/ai/media' },
          { name: 'Marketplace Agent', endpoint: '/ai/marketplace' },
        ],
      });
    });
  }

  private configureErrorHandling(): void {
    // Sentry error handler (must be before other error handlers)
    this.app.use(Sentry.Handlers.errorHandler());

    // Sentry tracing middleware
    this.app.use(Sentry.Handlers.tracingMiddleware());

    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async connectMongoDB(): Promise<void> {
    try {
      const options: mongoose.ConnectionOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      await mongoose.connect(config.mongoUri, options);

      logger.info('Connected to MongoDB', { uri: config.mongoUri.replace(/\/\/.*@/, '//<credentials>@') });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { error: err });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { error });
      throw error;
    }
  }

  public start(): void {
    this.server = this.app.listen(config.port, () => {
      logger.info(`SHOPFLOW server started`, {
        port: config.port,
        environment: config.nodeEnv,
        pid: process.pid,
      });
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`API base: http://localhost:${config.port}/api`);
    });

    // Handle server errors
    this.server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        process.exit(1);
      }
      logger.error('Server error', { error });
    });
  }

  public async shutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    if (this.server) {
      this.server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      } catch (error) {
        logger.error('Error closing MongoDB connection', { error });
      }
    }

    // Flush logs
    logger.info('Graceful shutdown completed');
    process.exit(0);
  }
}

// Create server instance
const server = new Server();

// Handle shutdown signals
process.on('SIGTERM', () => server.shutdown('SIGTERM'));
process.on('SIGINT', () => server.shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error, stack: error.stack });
  server.shutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  server.shutdown('unhandledRejection');
});

// Start the server
async function bootstrap(): Promise<void> {
  try {
    await server.connectMongoDB();
    server.start();
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

bootstrap();

export default server;